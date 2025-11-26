# Agent Voice Response - Soniox Speech-to-Text Integration

[![Discord](https://img.shields.io/discord/1347239846632226998?label=Discord&logo=discord)](https://discord.gg/DFTU69Hg74)
[![GitHub Repo stars](https://img.shields.io/github/stars/agentvoiceresponse/avr-asr-soniox?style=social)](https://github.com/agentvoiceresponse/avr-asr-soniox)
[![Docker Pulls](https://img.shields.io/docker/pulls/agentvoiceresponse/avr-asr-soniox?label=Docker%20Pulls&logo=docker)](https://hub.docker.com/r/agentvoiceresponse/avr-asr-soniox)
[![Ko-fi](https://img.shields.io/badge/Support%20us%20on-Ko--fi-ff5e5b.svg)](https://ko-fi.com/agentvoiceresponse)

This repository provides a real-time speech-to-text transcription service using **Soniox Speech-to-Text API** integrated with the **Agent Voice Response** system. The code sets up an Express.js server that accepts audio streams from Agent Voice Response Core, transcribes the audio using the Soniox API, and streams the transcription back to the Agent Voice Response Core in real-time.

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

Set the environment variable to use your Sonoix API key in your Node.js application:

```bash
export SONIOX_API_KEY="your_soniox_api_key"
```

Alternatively, you can set this variable in your `.env` file (you can use the `dotenv` package for loading environment variables).

### 4. Configuration

Ensure that you have the following environment variables set in your `.env` file:

```
SONIOX_API_KEY=your_deepgram_api_key
PORT=6018
```

You can adjust the port number as needed.

## How It Works

This application sets up an Express.js server that accepts audio streams from clients and uses Soniox Speech-to-Text API to transcribe the audio in real-time. The transcribed text is then streamed back to the Agent Voice Response Core. Below is an overview of the core components:

### 1. **Express.js Server**

The server listens for audio streams on a specific route (`/audio-stream`) and passes the incoming audio to the Soniox API for real-time transcription.

### 2. **AudioWritableStream Class**

A custom class that extends Node.js’s `Writable` stream is used to write the incoming audio data to the Soniox API.

### 3. **Soniox Speech-to-Text API**

The API processes the audio data received from the client and converts it into text using speech recognition models. The results are then streamed back to the client in real-time.

### 4. **Route /audio-stream**

This route accepts audio streams from the client and transmits the audio for transcription. The transcription is sent back to the client as soon as it’s available.

## Example Code Overview

Here’s a high-level breakdown of the key parts of the code:

- **Server Setup**: Configures the Express.js server and the Soniox Speech-to-Text API.
- **Audio Stream Handling**: A function, `handleAudioStream`, processes the incoming audio from clients. It:
  - Initializes a `Soniox API recognize stream`.
  - Sets up event listeners to handle `error`, `data`, and `end` events.
  - Creates an `AudioWritableStream` instance that pipes the incoming audio to the Speech API.
  - Sends the transcriptions back to the client through the HTTP response stream.
  
- **Express.js Route**: The route `/audio-stream` calls the `handleAudioStream` function when a client connects.

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

### Sample Request

You can send audio streams to the `/audio-stream` endpoint using a client that streams audio data (e.g., a browser, mobile app, or another Node.js service). Ensure that the audio stream is compatible with the Soniox Speech-to-Text API format.

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