/**
 * index.js
 * This file is the main entry point for the application using Soniox Speech-to-Text.
 * @author Agent Voice Response <info@agentvoiceresponse.com>
 * @see https://www.agentvoiceresponse.com
 */
const express = require('express');
const WebSocket = require('ws');

require('dotenv').config();

const app = express();

/**
 * Handles an audio stream from the client and uses Soniox WebSocket API
 * to recognize the speech and stream the transcript back to the client.
 *
 * @param {Object} req - The Express request object
 * @param {Object} res - The Express response object
 */
const handleAudioStream = async (req, res) => {
  let sonioxWs = null;
  let configSent = false;
  let isFinished = false;

  try {
    // Create WebSocket connection to Soniox
    sonioxWs = new WebSocket(process.env.SONIOX_WEBSOCKET_URL || 'wss://stt-rt.soniox.com/transcribe-websocket');

    sonioxWs.on('open', () => {
      console.log('Soniox WebSocket Connection Opened');

      // Send configuration message
      const config = {
        api_key: process.env.SONIOX_API_KEY,
        model: process.env.SONIOX_SPEECH_RECOGNITION_MODEL || 'stt-rt-preview',
        audio_format: 's16le', // linear16 PCM format (signed 16-bit little-endian)
        sample_rate: 8000,
        num_channels: 1,
        language_hints: process.env.SONIOX_SPEECH_RECOGNITION_LANGUAGE 
          ? [process.env.SONIOX_SPEECH_RECOGNITION_LANGUAGE] 
          : ['en']
      };

      sonioxWs.send(JSON.stringify(config));
      configSent = true;
      console.log('Soniox configuration sent');
    });

    sonioxWs.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());

        // Handle error response
        if (response.error_code) {
          console.error(`Soniox API Error (${response.error_code}):`, response.error_message);
          if (!res.headersSent) {
            res.status(response.error_code).json({ message: response.error_message });
          } else {
            res.end();
          }
          return;
        }

        // Handle finished response
        if (response.finished) {
          console.log('Soniox transcription finished');
          isFinished = true;
          res.end();
          return;
        }

        // Process tokens
        if (response.tokens && Array.isArray(response.tokens)) {
          // Filter and process final tokens
          const finalTokens = response.tokens.filter(token => token.is_final);
          
          if (finalTokens.length > 0) {
            // Sort tokens by start time to maintain order
            const sortedTokens = finalTokens.sort((a, b) => 
              (a.start_ms || 0) - (b.start_ms || 0)
            );

            // Build transcript from final tokens
            const transcript = sortedTokens
              .map(token => token.text)
              .join(' ')
              .trim();

            res.write(transcript);
          }
        }
      } catch (err) {
        console.error('Error parsing Soniox response:', err);
      }
    });

    sonioxWs.on('close', () => {
      console.log('Soniox WebSocket Connection Closed');
      if (!isFinished && !res.headersSent) {
        res.end();
      }
    });

    sonioxWs.on('error', (error) => {
      console.error('Soniox WebSocket Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Soniox WebSocket error' });
      } else {
        res.end();
      }
    });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream audio data to Soniox
    req.on('data', (chunk) => {
      if (sonioxWs && sonioxWs.readyState === WebSocket.OPEN && configSent) {
        sonioxWs.send(chunk);
      }
    });

    req.on('end', () => {
      console.log('Audio stream ended, closing Soniox connection');
      if (sonioxWs && sonioxWs.readyState === WebSocket.OPEN) {
        // Send empty frame to gracefully close
        sonioxWs.send(Buffer.alloc(0));
      }
    });

    req.on('error', (err) => {
      console.error('Error receiving audio stream:', err);
      if (sonioxWs && sonioxWs.readyState === WebSocket.OPEN) {
        sonioxWs.close();
      }
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error receiving audio stream' });
      } else {
        res.end();
      }
    });
  } catch (err) {
    console.error('Error handling audio stream:', err);
    if (sonioxWs) {
      sonioxWs.close();
    }
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    }
  }
};

app.post('/speech-to-text-stream', handleAudioStream);

const port = process.env.PORT || 6018;
app.listen(port, () => {
  console.log(`Soniox Audio endpoint listening on port ${port}`);
});
