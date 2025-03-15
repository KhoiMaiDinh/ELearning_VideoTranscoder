import { Injectable, Logger } from '@nestjs/common';
import { IValidateImageJob } from './job.interface';
// import { promisify } from 'util';
// import { exec } from 'child_process';
import { KafkaTopic, UploadStatus } from '@/constants';
import { KafkaProducerService } from '@/kafka';
import { checkNudity } from '@/utils/nudity-detector';
import { MinioClientService } from 'src/libs/minio';

// const execPromise = promisify(exec);

@Injectable()
export class ValidateQueueService {
  private readonly logger = new Logger(ValidateQueueService.name);

  constructor(
    private readonly producerService: KafkaProducerService,
    private readonly storageService: MinioClientService,
  ) {}

  async validateImage(data: IValidateImageJob): Promise<void> {
    this.logger.debug(`Validating image ${data.key}`);
    await this.onProgress(data.key);
    const image_path = await this.storageService.getReadPresignedUrl(data.key);
    const is_nude = await checkNudity(image_path);
    if (is_nude) {
      this.onError(data.key, 'Nude image detected');
    }
    await this.onCompleted(data.key);
  }

  private async onProgress(key: string): Promise<void> {
    await this.producerService.send(KafkaTopic.IMAGE_PROCESS, {
      value: JSON.stringify({
        key,
        status: UploadStatus.UPLOADED,
      }),
    });
  }

  private async onError(key: string, reason: string): Promise<void> {
    await this.producerService.send(KafkaTopic.IMAGE_PROCESS, {
      value: JSON.stringify({
        key,
        status: UploadStatus.REJECTED,
        rejection_reason: reason,
      }),
    });
  }

  private async onCompleted(key: string): Promise<void> {
    await this.producerService.send(KafkaTopic.IMAGE_PROCESS, {
      value: JSON.stringify({
        key,
        status: UploadStatus.VALIDATED,
      }),
    });
  }
}
