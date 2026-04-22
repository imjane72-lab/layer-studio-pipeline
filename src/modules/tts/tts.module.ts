import { Module } from '@nestjs/common';
import { SupertoneProvider } from './providers/supertone.provider';
import { TTS_PROVIDER } from './tts-provider.interface';
import { TtsService } from './tts.service';

@Module({
  providers: [
    SupertoneProvider,
    {
      provide: TTS_PROVIDER,
      useExisting: SupertoneProvider,
    },
    TtsService,
  ],
  exports: [TtsService],
})
export class TtsModule {}
