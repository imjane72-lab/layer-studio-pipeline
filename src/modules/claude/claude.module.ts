import { Module } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { CuratorService } from './curator.service';
import { ScriptwriterService } from './scriptwriter.service';

@Module({
  providers: [ClaudeService, CuratorService, ScriptwriterService],
  exports: [ClaudeService, CuratorService, ScriptwriterService],
})
export class ClaudeModule {}
