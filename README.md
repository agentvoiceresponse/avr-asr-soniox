# Agent Voice Response - Soniox Speech-to-Text Integration

[![Discord](https://img.shields.io/discord/1347239846632226998?label=Discord&logo=discord)](https://discord.gg/DFTU69Hg74)
[![GitHub Repo stars](https://img.shields.io/github/stars/agentvoiceresponse/avr-asr-soniox?style=social)](https://github.com/agentvoiceresponse/avr-asr-soniox)
[![Docker Pulls](https://img.shields.io/docker/pulls/agentvoiceresponse/avr-asr-soniox?label=Docker%20Pulls&logo=docker)](https://hub.docker.com/r/agentvoiceresponse/avr-asr-soniox)
[![Ko-fi](https://img.shields.io/badge/Support%20us%20on-Ko--fi-ff5e5b.svg)](https://ko-fi.com/agentvoiceresponse)

This repository provides a real-time speech-to-text transcription service using **Soniox Speech-to-Text WebSocket API** integrated with the **Agent Voice Response** system. The service sets up an Express.js server that accepts audio streams via HTTP POST, connects to Soniox via WebSocket for real-time transcription, and streams the transcribed text back to clients using Server-Sent Events (SSE).

## Prerequisites

Before setting up the project, ensure you have the following:

1. **Node.js** and **npm** installed.
2. A **Soniox account** with the **Speech-to-Text API** enabled.
3. A **Soniox API Key** with the necessary permissions to access the Speech-to-Text API.

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/agentvoiceresponse/avr-asr-soniox.git
cd avr-asr-soniox
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Soniox Credentials

Create a `.env` file in the root directory and add your Soniox API key:

```bash
SONIOX_API_KEY=your_soniox_api_key
```

You can obtain your API key from the [Soniox Console](https://console.soniox.com/).

### 4. Configuration

Configure the following environment variables in your `.env` file:

```env
# Required: Soniox API Key
SONIOX_API_KEY=your_soniox_api_key

# Optional: Soniox WebSocket URL (defaults to production endpoint)
SONIOX_WEBSOCKET_URL=wss://stt-rt.soniox.com/transcribe-websocket

# Optional: Speech recognition model (default: stt-rt-preview)
SONIOX_SPEECH_RECOGNITION_MODEL=stt-rt-preview

# Optional: Language hints (default: en)
# Can be a single language code or comma-separated list
SONIOX_SPEECH_RECOGNITION_LANGUAGE=en

# Optional: Server port (default: 6018)
PORT=6018
```

**Available Models:**
- `stt-rt-preview` - Real-time preview model (default)
- See [Soniox Models](https://docs.soniox.com/stt/models) for the full list

**Supported Languages:**
- English (`en`), Spanish (`es`), Italian (`it`), French (`fr`), German (`de`), and more
- See [Soniox Language Support](https://docs.soniox.com/stt/concepts/language-hints) for the complete list

## How It Works

This application sets up an Express.js server that accepts audio streams via HTTP POST and uses the **Soniox WebSocket API** for real-time transcription. The architecture follows this flow:

### 1. **Express.js Server**

The server listens for audio streams on the `/speech-to-text-stream` POST endpoint. When a client sends audio data, the server:
- Sets up Server-Sent Events (SSE) headers for streaming responses
- Creates a WebSocket connection to Soniox
- Forwards audio chunks to Soniox in real-time

### 2. **Soniox WebSocket Connection**

The service establishes a persistent WebSocket connection to `wss://stt-rt.soniox.com/transcribe-websocket`:
- Sends a configuration message with API key, model, audio format, and language hints
- Streams audio data as binary WebSocket frames
- Receives JSON responses containing transcription tokens

### 3. **Audio Format**

The service expects audio in the following format:
- **Format**: `s16le` (signed 16-bit little-endian PCM)
- **Sample Rate**: 8000 Hz
- **Channels**: Mono (1 channel)

### 4. **Transcription Response**

Soniox returns JSON responses with token arrays. The service:
- Filters tokens marked as `is_final: true`
- Sorts tokens by timestamp to maintain chronological order
- Builds complete transcripts from final tokens
- Streams transcripts back to the client via SSE

### 5. **Route `/speech-to-text-stream`**

This POST endpoint:
- Accepts raw audio stream in the request body
- Returns transcription results via Server-Sent Events (SSE)
- Automatically closes the Soniox connection when the audio stream ends

## Architecture Overview

The service implements a bridge pattern between HTTP and WebSocket protocols:

```
Client (HTTP POST) → Express Server → Soniox WebSocket API
                    ↓
              SSE Response ← Transcription Tokens
```

**Key Components:**

- **`handleAudioStream`**: Main handler function that:
  - Creates a WebSocket connection to Soniox
  - Sends configuration message with API credentials and settings
  - Forwards incoming audio chunks to Soniox as binary frames
  - Processes Soniox responses to extract final transcription tokens
  - Streams transcripts back to the client via Server-Sent Events
  - Handles connection lifecycle (open, message, close, error)

- **WebSocket Event Handlers**:
  - `open`: Sends configuration and enables audio streaming
  - `message`: Parses JSON responses, extracts final tokens, builds transcripts
  - `close`: Gracefully closes client connection
  - `error`: Handles and reports connection errors

- **HTTP Request Handlers**:
  - `data`: Forwards audio chunks to Soniox WebSocket
  - `end`: Sends empty frame to gracefully close Soniox connection
  - `error`: Handles client-side stream errors

## Running the Application

To start the application:

```bash
npm run start
```

or

```bash
npm run start:dev
```

The server will start and listen on the port specified in the `.env` file or default to `PORT=6010`.

### Audio Format Issues

- Ensure audio is in `s16le` format (signed 16-bit little-endian PCM)
- Verify sample rate is exactly 8000 Hz
- Confirm audio is mono (single channel)

### Error Responses

The service handles Soniox error responses and forwards them with appropriate HTTP status codes:
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (invalid API key)
- `402`: Payment required (account balance exhausted)
- `429`: Too many requests (rate limit exceeded)
- `500`: Internal server error
- `503`: Service unavailable

Check the server logs for detailed error messages.

## Support & Community

*   **GitHub:** [https://github.com/agentvoiceresponse](https://github.com/agentvoiceresponse) - Report issues, contribute code.
*   **Discord:** [https://discord.gg/DFTU69Hg74](https://discord.gg/DFTU69Hg74) - Join the community discussion.
*   **Docker Hub:** [https://hub.docker.com/u/agentvoiceresponse](https://hub.docker.com/u/agentvoiceresponse) - Find Docker images.
*   **NPM:** [https://www.npmjs.com/~agentvoiceresponse](https://www.npmjs.com/~agentvoiceresponse) - Browse our packages.
*   **Wiki:** [https://wiki.agentvoiceresponse.com/en/home](https://wiki.agentvoiceresponse.com/en/home) - Project documentation and guides.

## Support AVR

AVR is free and open-source. If you find it valuable, consider supporting its development:

<a href="https://ko-fi.com/agentvoiceresponse" target="_blank"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support us on Ko-fi"></a>

## License

MIT License - see the [LICENSE](LICENSE.md) file for details.