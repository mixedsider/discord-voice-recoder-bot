const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

/**
 * Starts recording audio from a stream and converts it to WAV format.
 *
 * @param {Object} audioStream - The incoming audio stream (e.g., from Discord voice connection).
 * @param {string} sessionId - A unique identifier for the session to name the output files.
 * @returns {Promise<{wavPath: string, outputPath: string}>} - Paths to the generated files.
 */
async function startRecording(audioStream, sessionId) {
  const rootDir = path.join(__dirname, '../');
  const outputPath = path.join(rootDir, `temp_${sessionId}.webm`);
  const wavPath = path.join(rootDir, `${sessionId}.wav`);

  return new Promise((resolve, reject) => {
    // Create a write stream for the temporary webm file
    const inputStream = fs.createWriteStream(outputPath);
    audioStream.pipe(inputStream);

    inputStream.on('finish', () => {
      // Once the webm is fully written, convert it to wav using ffmpeg
      ffmpeg(outputPath)
        .toFormat('wav')
        .on('error', (err) => {
          console.error(`FFmpeg error: ${err.message}`);
          reject(err);
        })
                .on('end', () => {
          console.log(`Conversion completed: ${wavPath}`);
          // Clean up the temporary webm file after conversion
          fs.unlinkSync(outputPath);
          resolve({ wavPath, outputPath });
        })
        .save(wavPath);
    });

    inputStream.on('error', (err) => {
      console.error(`WriteStream error: ${err.message}`);
      reject(err);
    });
  });
}

module.exports = { startRecording };
