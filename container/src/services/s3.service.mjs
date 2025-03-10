import { S3Client } from '@aws-sdk/client-s3';
import { S3_CONFIG } from '../constants/app.constant.mjs';

export const client = new S3Client(S3_CONFIG);
