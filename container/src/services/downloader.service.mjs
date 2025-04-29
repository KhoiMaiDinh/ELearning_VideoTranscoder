import { GetObjectCommand } from '@aws-sdk/client-s3';
import fsPromises from 'node:fs/promises';
import fs from 'node:fs';
import { client } from './s3.service.mjs';
import { DOWNLOAD_BUCKET } from '../constants/app.constant.mjs';
import path from 'node:path';

export async function downloadOriginalFile(key) {
  const command = new GetObjectCommand({
    Bucket: DOWNLOAD_BUCKET,
    Key: key,
  });

  const result = await client.send(command);
  const originalDir = `./${path.dirname(key)}`;
  if (!fs.existsSync(originalDir)) {
    fs.mkdirSync(originalDir, { recursive: true });
  }
  const originalFilePath = `./${key}`;
  await fsPromises.writeFile(originalFilePath, result.Body);
  return originalFilePath;
}
