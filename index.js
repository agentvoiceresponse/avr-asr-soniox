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
  const audioPacketQueue = []; // Coda per i pacchetti audio ricevuti durante la configurazione

  try {
    // Create WebSocket connection to Soniox
    sonioxWs = new WebSocket(process.env.SONIOX_WEBSOCKET_URL || 'wss://stt-rt.soniox.com/transcribe-websocket');

    sonioxWs.on('open', () => {
      console.log('Soniox WebSocket Connection Opened');

      // Send configuration message
      const config = {
        api_key: process.env.SONIOX_API_KEY,
        model: process.env.SONIOX_SPEECH_RECOGNITION_MODEL || 'stt-rt-v3',
        audio_format: 'pcm_s16le', // linear16 PCM format (signed 16-bit little-endian)
        sample_rate: 8000,
        num_channels: 1,
        language_hints: process.env.SONIOX_SPEECH_RECOGNITION_LANGUAGE
          ? [process.env.SONIOX_SPEECH_RECOGNITION_LANGUAGE]
          : ['en'],
        enable_endpoint_detection: true,
      };

      sonioxWs.send(JSON.stringify(config));
      const { api_key, ...configWithoutApiKey } = config;
      console.log('Soniox configuration sent', configWithoutApiKey);
      configSent = true;

      const queuedPacketsCount = audioPacketQueue.length;
      while (audioPacketQueue.length > 0 && sonioxWs.readyState === WebSocket.OPEN) {
        const packet = audioPacketQueue.shift();
        sonioxWs.send(packet);
      }

      if (queuedPacketsCount > 0) {
        console.log(`Sent ${queuedPacketsCount} buffered audio packets`);
      }
    });

    sonioxWs.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        console.log(response);

        // Handle error response
        // if (response.error_code) {
        //   console.error(`Soniox API Error (${response.error_code}):`, response.error_message);
        //   if (!res.headersSent) {
        //     res.status(response.error_code).json({ message: response.error_message });
        //   } else {
        //     res.end();
        //   }
        //   return;
        // }

        // // Handle finished response
        // if (response.finished) {
        //   console.log('Soniox transcription finished');
        //   isFinished = true;
        //   res.end();
        //   return;
        // }

        // // Process tokens
        if (response.tokens && response.tokens.length > 0) {
          const finalText = response.tokens
            .filter(t => t.is_final)
            .map(t => t.text)
            .join('');

          if (finalText) {
            console.log('Soniox transcription final text', finalText);
            res.write(finalText);
          }
        }

      } catch (err) {
        console.error('Error parsing Soniox response:', err);
      }
    });

    sonioxWs.on('close', () => {
      console.log('Soniox WebSocket Connection Closed');
      res.end();
    });

    sonioxWs.on('error', (error) => {
      console.error('Soniox WebSocket Error:', error);
      res.status(500).json({ message: 'Soniox WebSocket error' });
      res.end();
    });

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream audio data to Soniox
    req.on('data', (chunk) => {
      if (sonioxWs && sonioxWs.readyState === WebSocket.OPEN && configSent) {
        sonioxWs.send(chunk);
      } else if (sonioxWs && sonioxWs.readyState === WebSocket.OPEN && !configSent) {
        audioPacketQueue.push(chunk);
      }
    });

    req.on('end', () => {
      console.log('Audio stream ended, closing Soniox connection');
      if (sonioxWs && sonioxWs.readyState === WebSocket.OPEN) {
        // Send empty frame to gracefully close
        sonioxWs.send(Buffer.alloc(0));
        console.log('Sent empty frame to Soniox');
        sonioxWs.close();
        console.log('Closed Soniox connection');
        res.end();
      }
    });

    req.on('error', (err) => {
      console.error('Error receiving audio stream:', err);
      if (sonioxWs && sonioxWs.readyState === WebSocket.OPEN) {
        sonioxWs.close();
      }
    });
  } catch (err) {
    console.error('Error handling audio stream:', err);
    if (sonioxWs) {
      sonioxWs.close();
    }
    res.status(500).json({ message: err.message });
  }
};

app.post('/speech-to-text-stream', handleAudioStream);

const port = process.env.PORT || 6018;
app.listen(port, () => {
  console.log(`Soniox Audio endpoint listening on port ${port}`);
});
