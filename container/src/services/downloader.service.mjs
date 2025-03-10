import { GetObjectCommand } from '@aws-sdk/client-s3';
import fsPromises from 'node:fs/promises';
import { client } from './s3.service.mjs';
import { DOWNLOAD_BUCKET } from '../constants/app.constant.mjs';

export async function downloadOriginalFile(key) {
  const command = new GetObjectCommand({
    Bucket: DOWNLOAD_BUCKET,
    Key: key,
  });

  const result = await client.send(command);
  const originalFilePath = `./${key}`;
  await fsPromises.writeFile(originalFilePath, result.Body);
  return originalFilePath;
}
