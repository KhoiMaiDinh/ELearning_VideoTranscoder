import { DOWNLOAD_BUCKET } from '../constants/app.constant.mjs';
import { client } from './s3.service.mjs';

export async function deleteFileFromTempBucket(key) {
  return client
    .deleteObject({
      Bucket: DOWNLOAD_BUCKET,
      Key: key,
    })
    .promise();
}
