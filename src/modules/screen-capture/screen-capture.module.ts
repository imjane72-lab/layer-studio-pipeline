import { Module } from '@nestjs/common';
import { ScreenCaptureService } from './screen-capture.service';

@Module({
  providers: [ScreenCaptureService],
  exports: [ScreenCaptureService],
})
export class ScreenCaptureModule {}
