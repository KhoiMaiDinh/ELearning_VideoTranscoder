import { KEY } from './constants/app.constant.mjs';
import { deleteFileFromTempBucket } from './services/delete-file.service.mjs';
import { downloadOriginalFile } from './services/downloader.service.mjs';
import { generateMasterPlaylist } from './services/make-playlist.service.mjs';
import {
  generateAudio,
  transcodeVideos,
} from './services/transcoder.service.mjs';
import { uploadAllFiles } from './services/uploader.service.mjs';
import { isVideo } from './utils/is-video.util.mjs';

async function main() {
  const filePath = await downloadOriginalFile(KEY);
  const isVideoFile = await isVideo(filePath);

  if (!isVideoFile) {
    await deleteFileFromTempBucket(KEY);
    throw new Error('Not a video file.');
  }

  await Promise.all([transcodeVideos(filePath), generateAudio(filePath)]);
  generateMasterPlaylist();

  await uploadAllFiles(KEY);
  await deleteFileFromTempBucket(KEY);
}

main().catch(console.error);
