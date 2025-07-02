import { JobName, KafkaTopic, QueueName } from '@/constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { ITranscodeJob } from 'src/background/queues/transcoder-queue/job.interface';
import { TranscoderQueueService } from 'src/background/queues/transcoder-queue/transcoder-queue.service';
import { MinioEvent } from 'src/redis/interfaces/minio-event.interface';

@Controller()
export class VideoUploadConsumer {
  private readonly logger = new Logger(VideoUploadConsumer.name);
  constructor(
    @InjectQueue(QueueName.TRANSCODER)
    private readonly transcoderQueue: Queue<ITranscodeJob, any, string>,
    @InjectQueue(QueueName.VALIDATE)
    private readonly validateQueue: Queue<ITranscodeJob, any, string>,
    private readonly transcoderService: TranscoderQueueService,
  ) {}

  @EventPattern(KafkaTopic.VIDEO_UPLOAD)
  async handleVideoUploadMessage(@Payload() message: any) {
    const event: MinioEvent = message;

    if (event.Records[0].eventName !== 's3:ObjectCreated:Post') {
      return;
    }

    const { s3 } = event.Records[0];
    const {
      bucket: { name },
      object: { key },
    } = s3;

    if (name != 'novalearn-temp-videos') {
      return;
    }

    const decoded_key = decodeURIComponent(key);
    this.transcoderService.onProgress(decoded_key);

    this.transcoderQueue.add(JobName.TRANSCODE, {
      key,
    });
  }
}
