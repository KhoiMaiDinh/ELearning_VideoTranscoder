import { Injectable, Logger } from '@nestjs/common';
import { ITranscodeJob } from './job.interface';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);
@Injectable()
export class TranscoderQueueService {
  private readonly logger = new Logger(TranscoderQueueService.name);

  async transcodeVideo(data: ITranscodeJob): Promise<void> {
    this.logger.debug(`Transcoding video ${data.key}`);
    const containerName = `transcoder-job-${Date.now()}`;
    const command = `docker run --rm --network=local_default -e KEY=${data.key} -e S3_ENDPOINT=http://host.docker.internal:9000 --name ${containerName} khoimd/transcoder-job:latest`;

    try {
      const { stdout, stderr } = await execPromise(command);
      if (stderr) throw new Error(stderr);
      this.logger.log(`Transcoding job executed: ${stdout}`);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
