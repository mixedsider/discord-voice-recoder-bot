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

// Check if whisper is available at startup
async function checkDependencies() {
  try {
    await execPromise('whisper --version');
    console.log('Dependency check: whisper is available.');
  } catch (error) {
    console.warn('Warning: whisper command not found. Transcription will be mocked.');
  }

  try {
    // Check if Ollama is reachable (using a simple ping to the API)
    await axios.get('http://192.168.1.6:11434/api/tags', { timeout: 2000 });
    console.log('Dependency check: Ollama is reachable.');
  } catch (error) {
    console.warn('Warning: Ollama is not reachable at 192.168.1.6:11434');
  }
}

// Run dependency check
checkDependencies();

// Endpoint for audio file uploads
app.post('/upload', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No audio file uploaded.');
  }

  const wavPath = req.file.path;
  const sessionId = req.body.sessionId || `unknown_${Date.now()}`;

  console.log(`[${sessionId}] Received: ${req.file.filename}`);

  try {
    // 1. Whisper Transcription (with fallback)
    let transcription = "Fallback transcription: Whisper not found.";

    try {
      console.log(`[${sessionId}] Attempting transcription with whisper...`);
      // Note: We use the actual file path from multer
      const { stdout: transcriptionText } = await execPromise(
        `whisper "${wavPath}" --language ko --model base --output_format txt`
      );

      // Whisper creates a .txt file with the same name as input (but without extension)
      // We need to read that generated file.
      const txtPath = wavPath.replace(/\.[^/.]+$/, '.txt');
      if (fs.existsSync(txtPath)) {
        transcription = fs.readFileSync(txtPath, 'utf-8');
        console.log(`[${sessionId}] Transcription success.`);
      }
    } catch (err) {
      console.error(`[${sessionId}] Whisper execution error: ${err.message}`);
      // If whisper fails, we fall back to the placeholder text so the flow continues
      transcription = "Transcription failed due to missing tool, but proceeding with mock data.";
    }

    console.log(`[${sessionId}] Transcription content: ${transcription.trim().substring(0, 50)}...`);

    // 2. Ollama Processing
    console.log(`[${sessionId}] Sending text to Ollama...`);
    let analysis = "No analysis available (Ollama unreachable).";

    try {
      const ollamaResponse = await axios.post('http://192.168.1.6:11434/api/generate', {
        model: 'llama3',
        prompt: `Analyze this transcription and summarize it briefly in Korean: ${transcription}`,
        stream: false,
      }, { timeout: 5000 });

      analysis = ollamaResponse.data.response;
      console.log(`[${sessionId}] Analysis result: ${analysis.trim()}`);
    } catch (ollamaErr) {
      console.error(`[${sessionId}] Ollama error: ${ollamaErr.message}`);
      analysis = "Ollama processing failed.";
    }

    // 3. Response to Client
    res.status(200).send({
      message: 'File uploaded and processed successfully',
      transcription: transcription.trim(),
      analysis: analysis.trim()
    });

  } catch (error) {
    console.error(`[${sessionId}] Server error during processing:`, error.message);
    res.status(500).send({ error: 'Internal server error', details: error.message });
  } finally {
    // Clean up uploaded file
    if (fs.existsSync(wavPath)) {
      try {
        fs.unlinkSync(wavPath);
        console.log(`[${sessionId}] Cleaned up ${wavPath}`);
      } catch (e) {
        console.error(`Failed to cleanup ${wavPath}:`, e.message);
      }
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
