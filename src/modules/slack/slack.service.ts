import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(private readonly config: ConfigService) {}

  async notify(_message: string): Promise<void> {
    this.logger.log(`Slack notify: ${_message.slice(0, 80)}`);
    throw new NotImplementedException('Slack client is not implemented yet (Phase 2).');
  }
}
