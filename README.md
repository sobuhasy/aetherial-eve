# Aetherial-Eve — Multimodal Desktop AI Assistant

TypeScript/Node.js system integrating LLM interaction, speech-to-text, text-to-speech, OBS WebSocket screen capture, VTube Studio expression control, serial-device communication and a browser-based interface. The project focuses on modular integration, multimodal interaction and deployment-oriented prototyping.

## Overview

Aetherial-Eve explores how independent AI, media, desktop, and hardware services can be coordinated through a single application. The current prototype supports terminal and browser interaction, voice input and output, screen capture, avatar expression control, local memory, and policy-controlled desktop tooling.

The repository is intended as an integration prototype. Components that can affect the host system are designed for local deployment and should be configured with the minimum permissions required for the intended use case.

## Architecture

| Component | Responsibility |
| --- | --- |
| `source/index` | Application composition and command-line entry point |
| `source/llms` and `source/module/LlmOpenAI.ts` | LLM abstraction and OpenAI integration |
| `source/stt` | Microphone capture and speech-to-text |
| `source/tts` | TypeCast and Coqui text-to-speech adapters |
| `source/module/ObsVision.ts` | OBS WebSocket screen capture |
| `source/module/VTubeBridge.ts` | VTube Studio expression control |
| `source/ltm` | JSON-backed long-term memory |
| `source/openclaw` | Audited, policy-controlled gateway integration |
| `source/web` | Browser-based interface and server |
| `gaze` | Experimental computer-vision and device-integration work |

## Prerequisites

- Node.js and npm
- TypeScript toolchain (installed through the project dependencies)
- OBS Studio with the WebSocket server enabled for screen capture
- VTube Studio with its plugin API enabled for avatar control
- SoX available on `PATH` for microphone recording
- VB-Audio Virtual Cable when using Windows audio routing for lip sync
- WSL2 when using the optional local gateway configuration

Individual integrations are optional unless they are used by the selected runtime path.

## Configuration

Create a `.env` file in the repository root. The file is excluded from version control.

```env
OPENAI_API_KEY="your_openai_api_key"
TYPECAST_API_KEY="your_typecast_api_key"
OBS_PASSWORD="your_obs_websocket_password"
```

Do not commit credentials. Use restricted API keys and rotate any credential that may have been exposed.

### VTube Studio

1. Open **Network Settings**.
2. Enable the plugin API on port `8001`.
3. Approve the Aetherial-Eve plugin when prompted on first use.
4. Map the mouth-open parameter to `VoiceVolume` if audio-driven lip sync is required.

### OBS Studio

1. Open **Tools → WebSocket Server Settings**.
2. Enable the WebSocket server on port `4455`.
3. Set a password and provide the same value through `OBS_PASSWORD`.

### Windows audio routing

1. Set **CABLE Input** as the playback device used for synthesized speech.
2. In **CABLE Output** properties, enable **Listen to this device** and select the physical output device.
3. Select **CABLE Output** as the VTube Studio microphone input if lip sync is enabled.

## Build and Run

Install dependencies and compile the TypeScript sources:

```bash
npm install
npm run build
```

Start the command-line application:

```bash
npm start
```

The command-line interface accepts:

- `T` for keyboard input
- `S` for microphone input
- `exit` for a graceful shutdown

### Browser interface

After building the project, start the web server:

```bash
npm run start:web
```

Open `http://localhost:3000` in a modern browser.

## Development

Run the TypeScript entry point directly during development:

```bash
npm run dev
```

Before deploying the prototype, review enabled integrations, network listeners, credential scopes, audit logs, and host-system permissions for the target environment.
