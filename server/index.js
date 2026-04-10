const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
const app = express();
const port = 3000;

// Middleware to serve static files if needed
app.use(express.json());

// Endpoint for audio file uploads
app.post('/upload', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No audio file uploaded.');
  }

  console.log(`File uploaded: ${req.file.filename}`);

  // TODO: Trigger Whisper/Ollama processing here

  res.status(200).send({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: req.file.path
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
