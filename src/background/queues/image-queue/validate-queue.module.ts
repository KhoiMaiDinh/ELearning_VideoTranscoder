import { QueueName, QueuePrefix } from '../../../constants/job.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ValidateQueueEvents } from './validate-queue.events';
import { ValidateQueueService } from './validate-queue.service';
import { ValidateProcessor } from './image.processor';
import { MinioClientModule } from 'src/libs/minio';

@Module({
  imports: [
    MinioClientModule,
    BullModule.registerQueue({
      name: QueueName.VALIDATE,
      prefix: QueuePrefix.IMAGE,
      streams: {
        events: {
          maxLen: 1000,
        },
      },
    }),
  ],
  providers: [ValidateQueueService, ValidateProcessor, ValidateQueueEvents],
})
export class ValidateQueueModule {}
