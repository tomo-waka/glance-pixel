# GlancePixel

A custom information display service for pixel-based devices, built with TypeScript / Node.js.

The initial target device is the **Divoom Pixoo 64** (64×64 LED matrix), but the architecture is designed to remain device-agnostic.

## Status

> Early development — Milestone 1: Pixoo API connectivity validation.

## Features (planned)

- Current time display
- Current weather condition and temperature
- Clean 64×64 layout with readability as the primary constraint
- Graceful degradation (time continues if weather fails)

## Architecture & Packages

This is an npm workspaces monorepo where each architectural layer maps to one workspace package.

| Package                                           | Layer          | Responsibility                                            |
| ------------------------------------------------- | -------------- | --------------------------------------------------------- |
| [`glance-pixel-core`](packages/glance-pixel-core) | Domain         | Device-independent models (time, weather snapshot, scene) |
| `glance-pixel-app` _(planned)_                    | Application    | Use-case orchestration, refresh scheduling                |
| `glance-pixel-infra` _(planned)_                  | Infrastructure | Pixoo API client, weather API client, config, logging     |
| `glance-pixel-renderer` _(planned)_               | Rendering      | 64×64 visual composition, layout, text/icon placement     |

## Getting Started

### Prerequisites

- Node.js >= 22
- npm >= 10

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Run (development)

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

## Configuration

All environment-specific values are externalized. See `.env.example` for the full list.

| Variable          | Description                               |
| ----------------- | ----------------------------------------- |
| `PIXOO_HOST`      | IP address of the Pixoo 64 device         |
| `WEATHER_API_KEY` | API key for the weather provider          |
| `LOCATION`        | Location for weather lookup               |
| `TIMEZONE`        | Timezone (IANA format, e.g. `Asia/Tokyo`) |

## License

[MIT](LICENSE)
