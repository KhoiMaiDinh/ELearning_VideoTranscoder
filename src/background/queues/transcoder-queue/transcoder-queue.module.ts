import { QueueName, QueuePrefix } from '../../../constants/job.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TranscoderQueueEvents } from './transcoder-queue.events';
import { TranscoderQueueService } from './transcoder-queue.service';
import { TranscoderProcessor } from './transcoder.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.TRANSCODER,
      prefix: QueuePrefix.VIDEO,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
    }),
  ],
  providers: [
    TranscoderQueueService,
    TranscoderProcessor,
    TranscoderQueueEvents,
  ],
})
export class TranscoderQueueModule {}
