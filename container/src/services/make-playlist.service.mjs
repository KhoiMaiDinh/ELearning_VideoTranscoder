import fs from 'node:fs';
import {
  RESOLUTION,
  MASTER_PLAYLIST_PATH,
} from '../constants/app.constant.mjs';

export function generateMasterPlaylist() {
  const content = ['#EXTM3U', '#EXT-X-VERSION:3'];

  RESOLUTION.forEach(({ name, bitrate }) => {
    content.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bitrate.replace('k', '000')}`);
    content.push(`${name}/index.m3u8`);
  });

  // Add separate audio track
  content.push(
    `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",DEFAULT=YES,URI="audio/index.m3u8"`,
  );

  fs.writeFileSync(MASTER_PLAYLIST_PATH, content.join('\n'));
  console.log('✅ Master playlist (master.m3u8) created!');
}
