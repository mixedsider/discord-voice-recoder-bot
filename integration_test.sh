#!/bin/bash

# Integration Test for Discord Voice Recorder Server
# This script simulates a client uploading an audio file to the server.

SERVER_URL="http://localhost:3000/upload"
DUMMY_FILE="dummy_audio.wav"

echo "--- Starting Integration Test ---"

# 1. Create a dummy wav file (minimal valid WAV header)
# Using a simple text-based mock if actual ffmpeg/whisper is not available to prevent crash,
# but for the purpose of this test script, we just need a file that looks like audio.
echo "RIFFxxxxWAVEfmt 		WAVEformat
data$(openssl rand -hex 20)" > "$DUMMY_FILE"

if [ ! -f "$DUMMY_FILE" ]; then
  echo "Error: Failed to create dummy audio file."
  exit 1
fi

echo "Created dummy file: $DUMMY_FILE"

# 2. Attempt to upload the file using curl
echo "Sending request to $SERVER_URL..."
# Note: We use -s to keep output clean, but we want to see the response body.
RESPONSE=$(curl -s -F "audio=@$DUMMY_FILE" -F "sessionId=test_session_123" "$SERVER_URL" 2>/dev/null || echo "Connection Failed")

if [[ "$RESPONSE" == "Connection Failed" ]]; then
  echo "FAILURE: Could not connect to the server. Is it running?"
  exit 1
fi

# 3. Check the response
if [[ $RESPONSE == *"File uploaded successfully"* ]] || [[ $RESPONSE == *"Processing complete"* ]] || [[ $RESPONSE == *"transcription"* ]]; then
  echo "SUCCESS: Server responded correctly!"
  echo "Response Body: $RESPONSE"
  exit 0
else
  echo "FAILURE: Server response was unexpected."
  echo "Response Body: $RESPONSE"
  exit 1
fi

# Cleanup
rm "$DUMMY_FILE"
