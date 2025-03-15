import { KafkaModule } from '@/kafka';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName, QueuePrefix } from '@/constants';
import { VideoUploadConsumer } from './video-upload.consumer';
import { ImageUploadConsumer } from './image-upload.consumer';

@Module({
  imports: [
    KafkaModule,
    BullModule.registerQueue(
      {
        name: QueueName.TRANSCODER,
        prefix: QueuePrefix.VIDEO,
        streams: {
          events: {
            maxLen: 1000,
          },
        },
      },
      {
        name: QueueName.VALIDATE,
        prefix: QueuePrefix.IMAGE,
        streams: {
          events: {
            maxLen: 1000,
          },
        },
      },
    ),
  ],
  controllers: [VideoUploadConsumer, ImageUploadConsumer],
})
export class ConsumerModule {}
