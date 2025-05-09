import { JobName, KafkaTopic, QueueName } from '@/constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { ITranscodeJob } from 'src/background/queues/transcoder-queue/job.interface';
import { MinioEvent } from 'src/redis/interfaces/minio-event.interface';

@Controller()
export class VideoUploadConsumer {
  constructor(
    @InjectQueue(QueueName.TRANSCODER)
    private readonly transcoderQueue: Queue<ITranscodeJob, any, string>,
    @InjectQueue(QueueName.VALIDATE)
    private readonly validateQueue: Queue<ITranscodeJob, any, string>,
  ) {}

  @EventPattern(KafkaTopic.VIDEO_UPLOAD)
  handleVideoUploadMessage(@Payload() message: any) {
    const event: MinioEvent = message;
    if (event.Records[0].eventName !== 's3:ObjectCreated:Post') {
      return;
    }

    const { s3 } = event.Records[0];
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
  }
}
