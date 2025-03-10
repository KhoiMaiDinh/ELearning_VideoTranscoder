import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { AllConfigType } from 'src/config';
import { ConfigService } from '@nestjs/config';
import { MinioEvent } from './interfaces/minio-event.interface';
import { JobName, QueueName } from 'src/constants/job.constant';
import { ITranscodeJob } from 'src/background/queues/transcoder-queue/job.interface';

@Injectable()
export class RedisListenerService implements OnModuleInit {
  private redis: Redis;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    @InjectQueue(QueueName.TRANSCODER)
    private readonly transcoderQueue: Queue<ITranscodeJob, any, string>,
  ) {
    this.redis = new Redis({
      host: configService.get('redis.host', { infer: true }),
      port: configService.get('redis.port', { infer: true }),
      password: configService.get('redis.password', { infer: true }),
    });
  }

  async onModuleInit() {
    console.log('Starting Redis Listener...');
    this.pollRedis(); // Start polling for MinIO events
  }

  async pollRedis() {
    setInterval(async () => {
      try {
        const keys = await this.redis.hkeys('tempvideobucketevent');
        if (keys.length == 0) {
          return;
        }
        for (const redis_key of keys) {
          const event = await this.redis.hget(
            'tempvideobucketevent',
            redis_key,
          );
          const event_json: MinioEvent = JSON.parse(event);
          console.log(event_json);

          // Ignore non-s3:ObjectCreated:Put events
          if (event_json.Records[0].eventName !== 's3:ObjectCreated:Put') {
            return;
          }

          const { s3 } = event_json.Records[0];
          const {
            bucket: { name },
            object: { key },
          } = s3;

          if (name != 'temp-video') {
            return;
          }

          this.transcoderQueue.add(JobName.TRANSCODE, {
            key,
          });
          await this.redis.hdel('tempvideobucketevent', redis_key);
        }
      } catch (error) {
        console.error('Error fetching events from Redis:', error);
      }
    }, 5000); // Poll every 5 seconds
  }
}
