import { Body, Controller, Post } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { RunPipelineDto } from './dto/run-pipeline.dto';

@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipeline: PipelineService) {}

  @Post('run')
  async run(@Body() dto: RunPipelineDto): Promise<{ runId: string }> {
    const runId = await this.pipeline.run(dto.channel);
    return { runId };
  }
}
