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
    this.logger.log('MinioClient initialized');
    await this.createBucket(this.image_bucket);
  }

  private async createBucket(name: string): Promise<void> {
    const is_bucket_existed = await this.client.bucketExists(this.image_bucket);
    if (!is_bucket_existed) {
      await this.client.makeBucket(this.image_bucket);
      const policy = `
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": "s3:GetObject",
              "Resource": "arn:aws:s3:::${name}/*"
            }
          ]
        }
      `;
      await this.client.setBucketPolicy(this.image_bucket, policy);
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
