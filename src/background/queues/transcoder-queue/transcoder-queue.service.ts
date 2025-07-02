import { Injectable, Logger } from '@nestjs/common';
import { ITranscodeJob } from './job.interface';
import { promisify } from 'util';
import { exec } from 'child_process';
import { KafkaTopic, UploadStatus } from '@/constants';
import { KafkaProducerService } from '@/kafka';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config';
import * as fs from 'fs/promises';

const execPromise = promisify(exec);

@Injectable()
export class TranscoderQueueService {
  private readonly logger = new Logger(TranscoderQueueService.name);
  private isProduction: boolean;

  constructor(
    private readonly producerService: KafkaProducerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.isProduction =
      this.configService.getOrThrow('app.nodeEnv', {
        infer: true,
      }) === 'production';
  }

  async transcodeVideo(data: ITranscodeJob): Promise<void> {
    this.logger.debug(`Transcoding video ${data.key}`);
    const decoded_key = decodeURIComponent(data.key);

    try {
      await this.runDockerCommand(decoded_key);
      // if (this.isProduction) {
      //   await this.runK8sJob(decoded_key);
      // } else {
      // }
      await this.onCompleted(decoded_key);
    } catch (err) {
      await this.onError(decoded_key, err.message || 'Unknown error');
      throw err;
    }
  }

  private async runK8sJob(key: string): Promise<void> {
    const jobName = `transcoder-job-${Date.now()}`;
    const namespace = 'transcode';
    const jobYamlPath = `/tmp/${jobName}.yaml`;

    const jobYaml = `
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: ${jobName}
    namespace: ${namespace}
  spec:
    ttlSecondsAfterFinished: 60
    template:
      spec:
        containers:
          - name: transcoder
            image: khoimd/transcoder-job:latest
            env:
              - name: KEY
                value: "${key}"
              - name: S3_ENDPOINT
                value: "http://minio.default.svc.cluster.local:9000"
        restartPolicy: Never
  `;

    const { spawnSync, execSync } = await import('child_process');

    try {
      await fs.writeFile(jobYamlPath, jobYaml);
      spawnSync('kubectl', ['apply', '-f', jobYamlPath]);

      // Check job status every minute until complete
      while (true) {
        const output = execSync(
          `kubectl get job ${jobName} -n ${namespace} -o json`,
        ).toString();
        const job = JSON.parse(output);
        const conditions = job.status?.conditions || [];
        const completedCondition = conditions.find((c) => c.status === 'True');

        if (completedCondition?.type === 'Complete') {
          this.logger.log(`✅ Job ${jobName} completed`);
          return;
        } else if (completedCondition?.type === 'Failed') {
          throw new Error(`❌ Job ${jobName} failed`);
        }

        // Wait 1 minute before next check
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }

      throw new Error(`❌ Job ${jobName} timeout`);
    } finally {
      try {
        await fs.unlink(jobYamlPath);
        this.logger.debug(`🧹 Deleted temp file: ${jobYamlPath}`);
      } catch (err) {
        this.logger.warn(`⚠️ Failed to delete temp file: ${jobYamlPath}`, err);
      }
    }
  }

  private async runDockerCommand(key: string): Promise<void> {
    const command = this.buildDockerCommand(key);
    try {
      const { stdout, stderr } = await execPromise(command);

      if (stderr) {
        this.logger.warn(`Transcoder job stderr: ${stderr}`); // Don't throw
      }

      this.logger.log(
        `✅ Transcoding job executed successfully: ${this.isProduction ? stdout : ''}`,
      );
    } catch (error) {
      this.logger.error(`❌ Transcoding job failed: ${error.message}`);
      throw error;
    }
  }

  private buildDockerCommand(key: string): string {
    const containerName = `transcoder-job-${Date.now()}`;
    const s3Endpoint = this.configService.getOrThrow('storage.s3_endpoint', {
      infer: true,
    });
    const transcodeJobImage = this.configService.getOrThrow(
      'storage.transcode_job_image',
      {
        infer: true,
      },
    );
    const s3Region = this.configService.getOrThrow('storage.s3_region', {
      infer: true,
    });
    const access_key = this.configService.getOrThrow('storage.access_key', {
      infer: true,
    });
    const secret_key = this.configService.getOrThrow('storage.secret_key', {
      infer: true,
    });
    return `sudo docker run --rm ${!this.isProduction ? '--network=local_default' : ''} -e KEY=${key} -e S3_ENDPOINT=${s3Endpoint} -e S3_REGION=${s3Region} -e S3_ACCESS_KEY_ID=${access_key} -e S3_SECRET_ACCESS_KEY=${secret_key} --name ${containerName} ${transcodeJobImage}`;
  }

  async onProgress(key: string): Promise<void> {
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
