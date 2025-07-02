import { ErrorCode } from '@/constants';
import { NotFoundException } from '@/exceptions';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioClient, MinioService } from 'nestjs-minio-client';
import { AllConfigType } from '@/config';

@Injectable()
export class MinioClientService implements OnModuleInit {
  private readonly logger = new Logger(MinioClientService.name);
  private readonly image_bucket: string;
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly minio: MinioService,
  ) {
    this.image_bucket = this.configService.get('storage.bucket', {
      infer: true,
    });
  }

  public get client(): MinioClient {
    return this.minio.client;
  }

  public async onModuleInit(): Promise<void> {
    this.logger.log('Initializing MinioClient...');
    await this.checkClientAvailable();
  }

  private async checkClientAvailable(): Promise<void> {
    try {
      const result = await this.client.listBuckets();
      this.logger.log('MinioClient connection successful');
      this.logger.debug('Available buckets:', result);
    } catch (error) {
      this.logger.error('Failed to connect to MinioClient:', error);
      throw error;
    }
  }

  public async isValidFile(file_name: string): Promise<boolean> {
    try {
      await this.client.statObject(this.image_bucket, file_name);
      return true;
    } catch (error) {
      this.logger.error(error);
      throw new NotFoundException(
        ErrorCode.E061,
        `File not found ${file_name}`,
      );
    }
  }

  public async getReadPresignedUrl(
    object_name: string,
    expiry_ms: number = 60 * 60 * 24, // Expiry time for the pre-signed URL
    bucket: string = this.image_bucket,
  ): Promise<string> {
    const presigned_url = await this.client.presignedGetObject(
      bucket,
      object_name,
      expiry_ms,
    );

    return presigned_url;
  }
}
