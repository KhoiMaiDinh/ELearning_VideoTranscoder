import { JobName, KafkaTopic, QueueName } from '@/constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { ITranscodeJob } from 'src/background/queues/transcoder-queue/job.interface';
import { MinioEvent } from 'src/redis/interfaces/minio-event.interface';

@Controller()
export class ImageUploadConsumer {
  constructor(
    @InjectQueue(QueueName.VALIDATE)
    private readonly validateQueue: Queue<ITranscodeJob, any, string>,
  ) {}

  @EventPattern(KafkaTopic.IMAGE_UPLOAD)
  async handleImageUploadMessage(@Payload() message: any) {
    console.log(message);
    const event: MinioEvent = message;
    // Ignore non-s3:ObjectCreated:Put events
    if (event.Records[0].eventName !== 's3:ObjectCreated:Post') {
      return;
    }

    const { s3 } = event.Records[0];
    const {
      bucket: { name },
      object: { key },
    } = s3;

    if (name != 'image') {
      return;
    }

    await this.validateQueue.add(JobName.VALIDATE, {
      key,
    });
  }
}
