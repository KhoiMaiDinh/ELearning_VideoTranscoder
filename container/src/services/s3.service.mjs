import AWS from 'aws-sdk';
import { S3_CONFIG } from '../constants/app.constant.mjs';

export const client = new AWS.S3({
  accessKeyId: S3_CONFIG.credentials.accessKeyId,
  secretAccessKey: S3_CONFIG.credentials.secretAccessKey,
  endpoint: S3_CONFIG.endpoint,
  region: S3_CONFIG.region,
  s3ForcePathStyle: true,
  signatureVersion: S3_CONFIG.region == 'auto' ? 'v2' : undefined,
});
