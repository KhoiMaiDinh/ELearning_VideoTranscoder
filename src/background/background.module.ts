import { Module } from '@nestjs/common';
import { TranscoderQueueModule } from './queues/transcoder-queue/transcoder-queue.module';
@Module({
  imports: [TranscoderQueueModule],
})
export class BackgroundModule {}
