import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClaudeService } from './claude.service';
import { CuratorService } from './curator.service';
import { MetadataService } from './metadata.service';
import { ScriptwriterKoService } from './scriptwriter-ko.service';

@Module({
  imports: [PrismaModule],
  providers: [
    ClaudeService,
    CuratorService,
    ScriptwriterKoService,
    MetadataService,
  ],
  exports: [
    ClaudeService,
    CuratorService,
    ScriptwriterKoService,
    MetadataService,
  ],
})
export class ClaudeModule {}
