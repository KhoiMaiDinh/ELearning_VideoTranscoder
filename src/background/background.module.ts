import { Module } from '@nestjs/common';
import { TranscoderQueueModule } from './queues/transcoder-queue/transcoder-queue.module';
import { ValidateQueueModule } from './queues/image-queue/validate-queue.module';
@Module({
  imports: [TranscoderQueueModule, ValidateQueueModule],
})
export class BackgroundModule {}
