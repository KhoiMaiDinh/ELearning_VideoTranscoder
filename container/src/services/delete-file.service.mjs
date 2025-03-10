import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DOWNLOAD_BUCKET } from '../constants/app.constant.mjs';
import { client } from './s3.service.mjs';

export async function deleteFileFromTempBucket(key) {
  const command = new DeleteObjectCommand({
    Bucket: DOWNLOAD_BUCKET,
    Key: key,
  });

  await client.send(command);
}
