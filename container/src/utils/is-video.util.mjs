import ffmpeg from 'fluent-ffmpeg';

export function isVideo(file) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, metadata) => {
      if (err) {
        console.error('Error:', err.message);
        return reject(err);
      }

      // Check for video streams
      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === 'video',
      );

      if (!videoStream) {
        console.log(`${file} has no video stream.`);
        resolve(false);
        return;
      }

      // Check if it’s a single-frame image or a true video
      const isImageFormat = metadata.format.format_name.includes('image');
      const duration = parseFloat(metadata.format.duration) || 0;
      const frameCount = parseInt(videoStream.nb_frames, 10) || 1;

      if (isImageFormat || (duration <= 0.1 && frameCount <= 1)) {
        console.error(
          `${file} is an image, not a video (single frame detected).`,
        );
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
