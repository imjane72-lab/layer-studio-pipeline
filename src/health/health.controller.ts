import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSec: number;
}

interface DependencyResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  dependencies: Record<string, 'up' | 'down' | 'unknown'>;
}

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
    };
  }

  @Get('dependencies')
  async dependencies(): Promise<DependencyResponse> {
    const deps: Record<string, 'up' | 'down' | 'unknown'> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      deps.postgres = 'up';
    } catch {
      deps.postgres = 'down';
    }

    deps.claude = 'unknown';
    deps.elevenlabs = 'unknown';
    deps.pexels = 'unknown';
    deps.youtube = 'unknown';
    deps.notion = 'unknown';
    deps.slack = 'unknown';
    deps.s3 = 'unknown';

    const allUp = Object.values(deps).every((v) => v === 'up' || v === 'unknown');
    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: deps,
    };
  }
}
