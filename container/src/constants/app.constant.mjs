export const DOWNLOAD_BUCKET = 'novalearn-temp-videos';
export const UPLOAD_BUCKET = 'novalearn-videos';
export const OUTPUT_DIR = './output';
export const KEY =
  process.env.KEY || 'z6326289825906_21f38f361c26cbb6b51486f9b1f9e5b3.jpg';
export const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const REGION = process.env.S3_REGION || 'ap-southeast-1';

export const RESOLUTION = [
  { name: '480p', height: 480, bitrate: '1000k' },
  { name: '720p', height: 720, bitrate: '2500k' },
  { name: '1080p', height: 1080, bitrate: '5000k' },
];

export const AUDIO_OUTPUT_DIR = `${OUTPUT_DIR}/audio/`;
export const MASTER_PLAYLIST_PATH = `${OUTPUT_DIR}/master.m3u8`;

console.log('S3_ENDPOINT', S3_ENDPOINT);
console.log('S3_REGION', REGION);
console.log('KEY', process.env.S3_ACCESS_KEY_ID);
console.log('SECRET', process.env.S3_SECRET_ACCESS_KEY);

export const S3_CONFIG = {
  region: REGION,
  endpoint: S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'admin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'admin@2024',
  },
};
