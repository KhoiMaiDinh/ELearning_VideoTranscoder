import Ffmpeg from 'fluent-ffmpeg';
import fs from 'node:fs';
import path from 'node:path';
import {
  RESOLUTION,
  OUTPUT_DIR,
  AUDIO_OUTPUT_DIR,
} from '../constants/app.constant.mjs';

export async function transcodeVideos(filePath) {
  const promises = RESOLUTION.map(({ name, height }) => {
    const outputDir = path.join(OUTPUT_DIR, name);
    const outputFile = path.join(outputDir, 'index.m3u8');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve) => {
      Ffmpeg(filePath)
        .outputOptions([
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename',
          `${outputDir}/segment_%03d.ts`,
        ])
        .output(outputFile)
        .withSize(`?x${height}`)
        .withVideoCodec('libx264')
        .noAudio()
        .on('end', () => {
          console.log(`✅ ${name} video created!`);
          resolve(true);
        })
        .on('error', (err) => console.error('Error:', err))
        .run();
    });
  });

  await Promise.all(promises);
}

export async function generateAudio(filePath) {
  if (!fs.existsSync(AUDIO_OUTPUT_DIR)) {
    fs.mkdirSync(AUDIO_OUTPUT_DIR, { recursive: true });
  }

  return new Promise((resolve) => {
    Ffmpeg(filePath)
      .outputOptions([
        '-hls_time 10',
        '-hls_list_size 0',
        '-hls_segment_filename',
        `${AUDIO_OUTPUT_DIR}/segment_%03d.ts`,
      ])
      .output(`${AUDIO_OUTPUT_DIR}/index.m3u8`)
      .noVideo()
      .withAudioCodec('aac')
      .on('end', () => {
        console.log(`✅ Audio created!`);
        resolve(true);
      })
      .on('error', (err) => console.error('Error:', err))
      .run();
  });
}
