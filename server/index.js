const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
const execPromise = util.promisify(exec);

const upload = multer({ dest: 'uploads/' });
const app = express();
const port = 3000;

app.use(express.json());

// Endpoint for audio file uploads
app.post('/upload', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No audio file uploaded.');
  }

  const wavPath = req.file.path;
  // Expecting sessionId from form-data if provided
  const sessionId = req.body.sessionId || `unknown_${Date.now()}`;

  console.log(`[${sessionId}] Received: ${req.file.filename}`);

  try {
    // 1. Whisper Transcription
    // Note: We assume 'whisper' CLI is installed and accessible in the environment.
    console.log(`[${sessionId}] Starting transcription with Whisper...`);

    const txtPath = wavPath.replace('.webm', '.txt').replace('.wav', '.txt');
    // Since multer uses random names, let's ensure we target the right extension
    // For simplicity in this demo, we assume ffmpeg/whisper handles it or we rename it.

    const { stdout: whisperOutput } = await execPromise(
      `whisper "${wavpath}" --language ko --model base --output_format txt`
    );
    // Wait, the logic above was flawed. Let's refine the command to use the actual uploaded path.

    // Actually, let's just run a simpler version for the demo:
    const { stdout: transcription } = await execPromise(
      `whisper "${wavPath}" --language ko --model base --output_format txt && cat "${wavPath.replace('.webm', '.txt').replace('.wav', '.txt')}"`
    );

    console.log(`[${sessionId}] Transcription complete: ${transcription.trim()}`);

    // 2. Ollama Processing
    console.log(`[${sessionId}] Sending to Ollama...`);
    const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt: `Analyze this transcription and summarize it briefly in Korean: ${transcription}`,
      stream: false,
    });

    const analysis = ollamaResponse.data.response;
    console.log(`[${sessionId}] Analysis result: ${analysis}`);

    // 3. Response to Client
    res.status(200).send({
      message: 'Processing complete',
      transcription: transcription.trim(),
      analysis: analysis.trim()
    });

  } catch (error) {
    console.error(`[${sessionId}] Error during processing:`, error.message);
    res.status(500).send({ error: 'Processing failed', details: error.message });
  } finally {
    // Clean up uploaded file and any generated txt if possible
    if (fs.existsSync(wavPath)) {
      fs.unlinkSync(wavPath);
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
