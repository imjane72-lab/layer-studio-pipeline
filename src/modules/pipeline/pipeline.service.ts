import { addDays, setHours, setMinutes, setSeconds } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { format as formatDate } from 'date-fns';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Channel } from '../../common/enums/channel.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsService } from '../news/news.service';
import { CuratorService } from '../claude/curator.service';
import { ScriptwriterKoService } from '../claude/scriptwriter-ko.service';
import { TranslatorService } from '../claude/translator.service';
import { MetadataService } from '../claude/metadata.service';
import { PexelsService } from '../pexels/pexels.service';
import { TtsService, SentenceSegment } from '../tts/tts.service';
import { SubtitleService } from '../subtitle/subtitle.service';
import { VideoRendererService } from '../video-renderer/video-renderer.service';
import { S3Service } from '../s3/s3.service';
import { NotionService } from '../notion/notion.service';
import { SlackService } from '../slack/slack.service';

type PipelineStep =
  | 'NEWS_FETCH'
  | 'NEWS_CURATE'
  | 'SCRIPT_GENERATE_KO'
  | 'SCRIPT_TRANSLATE_EN'
  | 'BROLL_FETCH'
  | 'TTS_GENERATE_KO'
  | 'SUBTITLE_GENERATE_EN'
  | 'VIDEO_RENDER'
  | 'NOTION_CREATE'
  | 'SLACK_NOTIFY';

const UPLOAD_TIME_KST_HOUR = 7;
const UPLOAD_TIME_KST_MINUTE = 0;
const KST_TIMEZONE = 'Asia/Seoul';
const CREDIT_BUDGET_PER_MONTH = 100_000;

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly news: NewsService,
    private readonly curator: CuratorService,
    private readonly scriptwriter: ScriptwriterKoService,
    private readonly translator: TranslatorService,
    private readonly metadata: MetadataService,
    private readonly pexels: PexelsService,
    private readonly tts: TtsService,
    private readonly subtitle: SubtitleService,
    private readonly renderer: VideoRendererService,
    private readonly s3: S3Service,
    private readonly notion: NotionService,
    private readonly slack: SlackService,
  ) {}

  /**
   * End-to-end pipeline: RSS -> curation -> Korean script -> English subs ->
   * Pexels B-roll -> Supertone TTS -> SRT -> Remotion render -> S3 ->
   * Notion card -> Slack notification.
   *
   * YouTube upload is NOT part of this flow — it fires from the Notion approval
   * webhook (`/webhooks/notion/approval`) after a human signs off.
   */
  async run(channel: Channel): Promise<string> {
    this.logger.log(`Pipeline triggered for channel ${channel}`);

    const run = await this.prisma.pipelineRun.create({
      data: { channel, status: 'STARTED' },
    });

    try {
      // 1. News fetch
      const items = await this.step(run.id, 'NEWS_FETCH', () =>
        this.news.fetchForChannel(channel),
      );
      if (items.length === 0) {
        this.logger.warn(`No fresh news for ${channel}. Ending pipeline.`);
        await this.finishRun(run.id, 'NO_NEWS');
        return run.id;
      }

      // 2. Curate
      const recentTopics = await this.news.recentTitles(channel);
      const curation = await this.step(run.id, 'NEWS_CURATE', () =>
        this.curator.selectTopic(channel, items, recentTopics),
      );
      await this.news.markSelected(curation.selectedItem.url);

      // 3. Korean script
      const script = await this.step(run.id, 'SCRIPT_GENERATE_KO', () =>
        this.scriptwriter.write(channel, curation.selectedItem),
      );

      // 4. English translation (sentence-level)
      const translation = await this.step(run.id, 'SCRIPT_TRANSLATE_EN', () =>
        this.translator.translate(channel, script.sentencesKo),
      );

      // Create Video row so downstream steps can attribute costs and assets
      const newsItem = await this.prisma.newsItem.findUnique({
        where: { url: curation.selectedItem.url },
        select: { id: true },
      });

      const video = await this.prisma.video.create({
        data: {
          channel,
          status: 'PENDING',
          titleKo: script.titleKo,
          scriptKo: script.scriptKo,
          titleEn: '',
          descriptionEn: '',
          scriptEn: translation.sentencesEn.join(' '),
          tags: [],
          newsItemId: newsItem?.id,
        },
      });
      await this.prisma.pipelineRun.update({
        where: { id: run.id },
        data: { videoId: video.id },
      });

      // 5. Pexels B-roll (per broll_plan entry)
      const bRollClips = await this.step(run.id, 'BROLL_FETCH', async () => {
        const clips = [];
        for (const plan of script.brollPlan) {
          const query = plan.keywordsEn.join(' ');
          const videos = await this.pexels.searchPortrait(query);
          const best = this.pexels.pickBest(videos, plan.durationSeconds);
          const file = best ? this.pexels.pickVideoFile(best) : null;
          if (!file) {
            this.logger.warn(`No Pexels match for "${query}". Using placeholder.`);
            continue;
          }
          clips.push({ videoUrl: file.link, durationSeconds: plan.durationSeconds });
        }
        return clips;
      });

      // 6. Supertone TTS (sentence-by-sentence, rate-limited inside provider)
      const tts = await this.step(run.id, 'TTS_GENERATE_KO', () =>
        this.tts.synthesizeScript({
          sentencesKo: script.sentencesKo,
          sentencesEn: translation.sentencesEn,
        }),
      );

      // 7. Subtitle segments + SRT (timing already resolved by sentence-split TTS)
      const subtitle = await this.step(run.id, 'SUBTITLE_GENERATE_EN', () =>
        Promise.resolve(this.subtitle.buildFromTtsSegments(tts.segments)),
      );

      // Upload merged audio + SRT to S3 before rendering
      const { audioUrl, subtitleUrl } = await this.uploadTtsAssets({
        videoId: video.id,
        channel,
        segments: tts.segments,
        srt: subtitle.srt,
      });

      // 8. Remotion render
      const renderedPath = await this.step(run.id, 'VIDEO_RENDER', () =>
        this.renderer.render({
          channel,
          videoId: video.id,
          audioUrl,
          subtitleSegments: subtitle.segments,
          bRollClips,
        }),
      );

      // Upload rendered video to S3
      const today = formatDate(new Date(), 'yyyy-MM-dd');
      const videoKey = `videos/${today}/${channel.toLowerCase()}_${video.id}.mp4`;
      const videoS3 = await this.s3.putFile({
        key: videoKey,
        filePath: renderedPath,
        contentType: 'video/mp4',
      });

      // 9. Generate YouTube metadata (title/description/tags)
      const meta = await this.metadata.generate(channel, {
        titleKo: script.titleKo,
        scriptKo: script.scriptKo,
        sentencesEn: translation.sentencesEn,
      });

      // Persist video with final metadata + assets + timing
      const scheduledAt = this.nextKstUploadDateUtc();
      const updatedVideo = await this.prisma.video.update({
        where: { id: video.id },
        data: {
          status: 'READY',
          titleEn: meta.titleEn,
          descriptionEn: meta.descriptionEn,
          tags: meta.tags,
          videoUrl: videoS3,
          audioUrl,
          subtitleUrl,
          ttsCredits: tts.totalCredits,
          ttsDurationSec: tts.totalDurationSec,
          subtitleSegments: subtitle.segments as unknown as Prisma.InputJsonValue,
          scheduledAt,
        },
      });

      // 10. Notion card
      const videoPreviewUrl = await this.s3.presignGet(videoKey).catch(() => videoS3);
      const audioPreviewUrl = await this.safePresign(audioUrl);
      const subtitlePreviewUrl = await this.safePresign(subtitleUrl);

      const notionResult = await this.step(run.id, 'NOTION_CREATE', () =>
        this.notion.createApprovalCard({
          channel,
          titleKo: script.titleKo,
          scriptKo: script.scriptKo,
          titleEn: meta.titleEn,
          descriptionEn: meta.descriptionEn,
          scriptEn: updatedVideo.scriptEn,
          tags: meta.tags,
          videoPreviewUrl,
          audioPreviewUrl,
          subtitlePreviewUrl,
          ttsCredits: tts.totalCredits,
          ttsDurationSec: tts.totalDurationSec,
          scheduledAt,
        }),
      );

      await this.prisma.video.update({
        where: { id: video.id },
        data: { notionPageId: notionResult.pageId },
      });

      // 11. Slack notification
      await this.step(run.id, 'SLACK_NOTIFY', () => {
        const message = this.slack.formatApprovalMessage({
          channel,
          titleKo: script.titleKo,
          titleEn: meta.titleEn,
          ttsDurationSec: tts.totalDurationSec,
          ttsCredits: tts.totalCredits,
          creditBudgetPerMonth: CREDIT_BUDGET_PER_MONTH,
          notionUrl: notionResult.url,
        });
        return this.slack.notify(message);
      });

      await this.finishRun(run.id, 'SUCCESS');
      return run.id;
    } catch (err) {
      this.logger.error(`Pipeline failed for ${channel}: ${(err as Error).message}`);
      await this.finishRun(run.id, 'FAILED');
      throw err;
    }
  }

  /**
   * Run a step, logging STARTED / SUCCESS / FAILED transitions to PipelineLog.
   * Re-throws on failure so `run()` can short-circuit cleanly.
   */
  private async step<T>(
    runId: string,
    step: PipelineStep,
    fn: () => Promise<T>,
  ): Promise<T> {
    const started = Date.now();
    await this.prisma.pipelineLog.create({
      data: { runId, step, status: 'STARTED' },
    });
    try {
      const result = await fn();
      await this.prisma.pipelineLog.create({
        data: {
          runId,
          step,
          status: 'SUCCESS',
          durationMs: Date.now() - started,
        },
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.pipelineLog.create({
        data: {
          runId,
          step,
          status: 'FAILED',
          message: message.slice(0, 2000),
          durationMs: Date.now() - started,
        },
      });
      throw err;
    }
  }

  private async finishRun(runId: string, status: string): Promise<void> {
    await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: { endedAt: new Date(), status },
    });
  }

  /**
   * Concatenate per-sentence MP3 buffers and upload merged audio + SRT.
   * We concat buffers directly rather than using FFmpeg — MP3 can be safely
   * concatenated this way for contiguous same-format clips from one provider.
   */
  private async uploadTtsAssets(input: {
    videoId: string;
    channel: Channel;
    segments: SentenceSegment[];
    srt: string;
  }): Promise<{ audioUrl: string; subtitleUrl: string }> {
    const today = formatDate(new Date(), 'yyyy-MM-dd');
    const audioKey = `audio/${today}/${input.channel.toLowerCase()}_${input.videoId}_ko.mp3`;
    const srtKey = `subtitles/${today}/${input.channel.toLowerCase()}_${input.videoId}_en.srt`;

    const merged = Buffer.concat(input.segments.map((s) => s.audioBuffer));
    const mimeType = input.segments[0]?.mimeType ?? 'audio/mpeg';

    const audioUrl = await this.s3.putObject({
      key: audioKey,
      body: merged,
      contentType: mimeType,
    });
    const subtitleUrl = await this.s3.putObject({
      key: srtKey,
      body: input.srt,
      contentType: 'application/x-subrip',
    });
    return { audioUrl, subtitleUrl };
  }

  private async safePresign(s3Uri: string): Promise<string> {
    const match = s3Uri.match(/^s3:\/\/[^/]+\/(.+)$/);
    if (!match) return s3Uri;
    try {
      return await this.s3.presignGet(match[1]);
    } catch {
      return s3Uri;
    }
  }

  /** Next 07:00 KST, returned as UTC Date for Prisma DateTime column. */
  private nextKstUploadDateUtc(): Date {
    const nowKst = new Date();
    const tomorrow = addDays(nowKst, 1);
    const kstLocal = setSeconds(
      setMinutes(setHours(tomorrow, UPLOAD_TIME_KST_HOUR), UPLOAD_TIME_KST_MINUTE),
      0,
    );
    return fromZonedTime(kstLocal, KST_TIMEZONE);
  }
}
