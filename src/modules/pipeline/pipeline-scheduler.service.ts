import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Channel } from '../../common/enums/channel.enum';
import { PipelineService } from './pipeline.service';

/**
 * Cron trigger for unattended pipeline runs. Per WORKFLOW.md timeline:
 *   KST 19:00 every other day (odd dates) -> generate next day's videos
 *   for both channels concurrently.
 *
 * Disabled by default (PIPELINE_CRON_ENABLED=true to enable in prod/staging);
 * this stops dev boots from racking up API bills on unattended runs.
 */
@Injectable()
export class PipelineSchedulerService {
  private readonly logger = new Logger(PipelineSchedulerService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly pipeline: PipelineService,
  ) {}

  // UTC 10:00 = KST 19:00. Odd day-of-month = every other day.
  @Cron('0 10 1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31 * *', {
    name: 'layer-studio-daily',
    timeZone: 'UTC',
  })
  async triggerDailyRun(): Promise<void> {
    const enabled = this.config.get<string>('PIPELINE_CRON_ENABLED', 'false') === 'true';
    if (!enabled) {
      this.logger.debug('Cron fired but PIPELINE_CRON_ENABLED is false; skipping.');
      return;
    }

    this.logger.log('Cron trigger: running pipeline for AI + SKIN concurrently');

    // Run both channels in parallel; allSettled so one failure doesn't cancel
    // the other.
    const results = await Promise.allSettled([
      this.pipeline.run(Channel.AI),
      this.pipeline.run(Channel.SKIN),
    ]);

    results.forEach((result, idx) => {
      const channel = idx === 0 ? 'AI' : 'SKIN';
      if (result.status === 'fulfilled') {
        this.logger.log(`[${channel}] cron run completed: runId=${result.value}`);
      } else {
        this.logger.error(
          `[${channel}] cron run failed: ${(result.reason as Error)?.message ?? result.reason}`,
        );
      }
    });
  }
}
