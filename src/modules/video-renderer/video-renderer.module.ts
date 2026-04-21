import { Module } from '@nestjs/common';
import { VideoRendererService } from './video-renderer.service';

@Module({
  providers: [VideoRendererService],
  exports: [VideoRendererService],
})
export class VideoRendererModule {}
