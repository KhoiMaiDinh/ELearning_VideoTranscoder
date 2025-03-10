import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueName, QueuePrefix } from 'src/constants/job.constant';
import { RedisListenerService } from './redis-listener.service';

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
  providers: [RedisListenerService],
  exports: [RedisListenerService],
})
export class RedisListenerModule {}
