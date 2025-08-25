import { JobName, QueueName } from '../../../constants/job.constant';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TranscoderQueueService } from './transcoder-queue.service';
import { ITranscodeJob } from './job.interface';

@Processor(QueueName.TRANSCODER, {
  concurrency: 3,
  drainDelay: 300,
  stalledInterval: 300000,
  removeOnComplete: {
    age: 86400,
    count: 100,
  },
  limiter: {
    max: 1,
    duration: 150,
  },
})
export class TranscoderProcessor extends WorkerHost {
  private readonly logger = new Logger(TranscoderProcessor.name);
  constructor(private readonly transcoderQueueService: TranscoderQueueService) {
    super();
  }
  async process(job: Job<unknown>): Promise<any> {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`,
    );

    // const lock = await redlock.acquire([lockKey], 30000); // Initial 30s lock

    // const extendInterval = setInterval(async () => {
    //   try {
    //     await lock.extend(30000); // Extend another 30s
    //     console.log('Lock extended');
    //   } catch (err) {
    //     console.warn('Failed to extend lock:', err);
    //   }
    // }, 25000); // Extend every 25s

    switch (job.name) {
      case JobName.TRANSCODE:
        return await this.transcoderQueueService.transcodeVideo(
          job.data as unknown as ITranscodeJob,
        );
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}
