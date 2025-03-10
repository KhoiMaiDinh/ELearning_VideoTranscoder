import path from 'node:path';
import { OUTPUT_DIR, UPLOAD_BUCKET } from '../constants/app.constant.mjs';
import fs from 'node:fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { client } from './s3.service.mjs';
import { removeExtension } from '../utils/remove-extension.util.mjs';

async function uploadFile(filePath, key) {
  const fileStream = fs.createReadStream(filePath);
  const command = new PutObjectCommand({
    Bucket: UPLOAD_BUCKET,
    Key: key,
    Body: fileStream,
    ContentType: getContentType(filePath),
  });

  await client.send(command);
  console.log(`✅ Uploaded: ${key}`);
}

function getContentType(filePath) {
  if (filePath.endsWith('.m3u8')) return 'application/x-mpegURL';
  if (filePath.endsWith('.ts')) return 'video/MP2T';
  return 'application/octet-stream';
}

async function uploadDirectory(localPath, remotePrefix) {
  const files = fs.readdirSync(localPath);
  console.log(`📁 files: ${files}`);
  for (const file of files) {
    const fullPath = path.join(localPath, file);
    const remoteKey = `${remotePrefix}/${file}`;

    if (fs.statSync(fullPath).isDirectory()) {
      await uploadDirectory(fullPath, remoteKey);
    } else {
      await uploadFile(fullPath, remoteKey);
    }
  }
}

export async function uploadAllFiles(key) {
  const processedKey = removeExtension(key);
  console.log(
    `🚀 Uploading transcoded files to storage..., Directory: ${processedKey}`,
  );
  await uploadDirectory(OUTPUT_DIR, processedKey); // Upload all files under 'output' to 'transcoded/' in storage
  console.log('✅ All files uploaded successfully!');
}
