// import fsPromises from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { client } from './s3.service.mjs';
import { DOWNLOAD_BUCKET } from '../constants/app.constant.mjs';

export async function downloadOriginalFile(key) {
  const originalDir = `./${path.dirname(key)}`;
  if (!fs.existsSync(originalDir)) {
    fs.mkdirSync(originalDir, { recursive: true });
  }

  const originalFilePath = `./${key}`;

  const params = {
    Bucket: DOWNLOAD_BUCKET,
    Key: key,
  };

  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(originalFilePath);
    client
      .getObject(params)
      .createReadStream()
      .on('error', reject)
      .pipe(fileStream)
      .on('finish', () => resolve(originalFilePath))
      .on('error', reject);
  });
}
