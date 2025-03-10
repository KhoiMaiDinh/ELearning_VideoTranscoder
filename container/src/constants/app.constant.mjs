export const DOWNLOAD_BUCKET = 'temp-video';
export const UPLOAD_BUCKET = 'video';
export const OUTPUT_DIR = './output';
export const KEY =
  process.env.KEY || 'z6326289825906_21f38f361c26cbb6b51486f9b1f9e5b3.jpg';
export const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';

export const RESOLUTION = [
  { name: '480p', height: 480, bitrate: '1000k' },
  { name: '1080p', height: 1080, bitrate: '5000k' },
];

export const AUDIO_OUTPUT_DIR = `${OUTPUT_DIR}/audio/`;
export const MASTER_PLAYLIST_PATH = `${OUTPUT_DIR}/master.m3u8`;

export const S3_CONFIG = {
  region: 'ap-southeast-1',
  endpoint: S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'admin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'admin@2024',
  },
};
