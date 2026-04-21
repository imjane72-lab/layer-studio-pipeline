import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { Channel } from '../../common/enums/channel.enum';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  async run(channel: Channel): Promise<string> {
    this.logger.log(`Pipeline triggered for channel ${channel}`);
    throw new NotImplementedException('Pipeline orchestration is not implemented yet (Phase 3).');
  }
}
