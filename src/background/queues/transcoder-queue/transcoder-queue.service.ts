import { Injectable, Logger } from '@nestjs/common';
import { ITranscodeJob } from './job.interface';
import { promisify } from 'util';
import { exec } from 'child_process';
import { KafkaTopic, UploadStatus } from '@/constants';
import { KafkaProducerService } from '@/kafka';

const execPromise = promisify(exec);

@Injectable()
export class TranscoderQueueService {
  private readonly logger = new Logger(TranscoderQueueService.name);

  constructor(private readonly producerService: KafkaProducerService) {}

  async transcodeVideo(data: ITranscodeJob): Promise<void> {
    this.logger.debug(`Transcoding video ${data.key}`);
    const decoded_key = decodeURIComponent(data.key);
    await this.onProgress(decoded_key);

    const command = this.buildCommand(decoded_key);
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      await this.onError(decoded_key, stderr);
      throw new Error(stderr);
    }

    this.logger.log(`Transcoding job executed: ${stdout}`);
    await this.onCompleted(decoded_key);
  }

  private buildCommand(key: string): string {
    const containerName = `transcoder-job-${Date.now()}`;
    return `docker run --rm --network=local_default -e KEY=${key} -e S3_ENDPOINT=http://host.docker.internal:9000 --name ${containerName} khoimd/transcoder-job:latest`;
  }

  private async onProgress(key: string): Promise<void> {
    await this.producerService.send(
      KafkaTopic.VIDEO_PROCESS,
      JSON.stringify({
        key,
        status: UploadStatus.UPLOADED,
      }),
    );
  }

  private async onError(key: string, reason: string): Promise<void> {
    await this.producerService.send(KafkaTopic.VIDEO_PROCESS, {
      value: JSON.stringify({
        key,
        status: UploadStatus.REJECTED,
        rejection_reason: reason,
      }),
    });
  }

  private async onCompleted(key: string): Promise<void> {
    await this.producerService.send(KafkaTopic.VIDEO_PROCESS, {
      value: JSON.stringify({
        key,
        status: UploadStatus.VALIDATED,
      }),
    });
  }
}
