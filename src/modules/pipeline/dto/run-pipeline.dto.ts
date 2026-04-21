import { IsEnum } from 'class-validator';
import { Channel } from '../../../common/enums/channel.enum';

export class RunPipelineDto {
  @IsEnum(Channel)
  channel!: Channel;
}
