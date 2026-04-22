import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface PexelsVideoFile {
  link: string;
  quality: string;
  width: number;
  height: number;
}

export interface PexelsVideo {
  id: number;
  url: string;
  width: number;
  height: number;
  duration: number;
  videoFiles: PexelsVideoFile[];
}

interface PexelsSearchResponse {
  videos: Array<{
    id: number;
    url: string;
    width: number;
    height: number;
    duration: number;
    video_files: Array<{
      link: string;
      quality: string;
      width: number;
      height: number;
    }>;
  }>;
}

@Injectable()
export class PexelsService implements OnModuleInit {
  private readonly logger = new Logger(PexelsService.name);

  private http!: AxiosInstance;
  private perPage!: number;
  private apiKey?: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.apiKey = this.config.get<string>('PEXELS_API_KEY');
    this.perPage = this.config.get<number>('PEXELS_PER_PAGE', 15);
    const timeout = this.config.get<number>('PEXELS_TIMEOUT_MS', 10000);

    this.http = axios.create({
      baseURL: 'https://api.pexels.com',
      timeout,
      headers: this.apiKey ? { Authorization: this.apiKey } : {},
    });
  }

  /**
   * Search portrait (9:16) videos matching the query. Returns the top candidates
   * with their available download URLs — caller picks the best quality match.
   */
  async searchPortrait(query: string): Promise<PexelsVideo[]> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'PEXELS_API_KEY is not configured. Set it in .env before using Pexels.',
      );
    }

    this.logger.log(`Pexels search: "${query}"`);

    const { data } = await this.http.get<PexelsSearchResponse>('/videos/search', {
      params: {
        query,
        orientation: 'portrait',
        size: 'medium',
        per_page: this.perPage,
      },
    });

    return data.videos.map((v) => ({
      id: v.id,
      url: v.url,
      width: v.width,
      height: v.height,
      duration: v.duration,
      videoFiles: v.video_files.map((f) => ({
        link: f.link,
        quality: f.quality,
        width: f.width,
        height: f.height,
      })),
    }));
  }

  /**
   * Pick the clip that best covers `minDurationSec` at vertical resolution.
   * Falls back to longest clip if nothing matches.
   */
  pickBest(videos: PexelsVideo[], minDurationSec: number): PexelsVideo | null {
    if (videos.length === 0) return null;
    const portrait = videos.filter((v) => v.height >= v.width);
    const pool = portrait.length > 0 ? portrait : videos;
    const longEnough = pool.filter((v) => v.duration >= minDurationSec);
    if (longEnough.length > 0) {
      return longEnough.sort((a, b) => a.duration - b.duration)[0]; // closest-fit
    }
    return pool.sort((a, b) => b.duration - a.duration)[0];
  }

  /**
   * Pick the highest-quality vertical file under a given download size budget.
   */
  pickVideoFile(video: PexelsVideo): PexelsVideoFile | null {
    if (video.videoFiles.length === 0) return null;
    const hd = video.videoFiles.filter((f) => f.quality === 'hd' && f.height >= f.width);
    if (hd.length > 0) return hd[0];
    const sd = video.videoFiles.filter((f) => f.quality === 'sd' && f.height >= f.width);
    if (sd.length > 0) return sd[0];
    return video.videoFiles[0];
  }

  /** Download a clip into memory. Caller uploads to S3. */
  async download(url: string): Promise<Buffer> {
    const response = await this.http.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      baseURL: undefined, // use absolute URL
    });
    return Buffer.from(response.data);
  }
}
