import { JobName, QueueName } from '../../../constants/job.constant';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ValidateQueueService } from './validate-queue.service';
import { IValidateImageJob } from './job.interface';

@Processor(QueueName.VALIDATE, {
  concurrency: 5,
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
export class ValidateProcessor extends WorkerHost {
  private readonly logger = new Logger(ValidateProcessor.name);
  constructor(private readonly validateQueueService: ValidateQueueService) {
    super();
  }
  async process(job: Job<unknown>): Promise<any> {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`,
    );

    switch (job.name) {
      case JobName.VALIDATE:
        return await this.validateQueueService.validateImage(
          job.data as unknown as IValidateImageJob,
        );
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}
