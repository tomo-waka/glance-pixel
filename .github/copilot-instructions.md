# GlancePixel — Copilot Instructions

## What This Project Is

GlancePixel is a custom information display service for pixel-based devices, implemented in TypeScript / Node.js.

The initial target device is the **Divoom Pixoo 64** (64×64 LED matrix). The architecture must remain device-agnostic so that adapting to a different device requires only changes in the infrastructure layer.

The first functional goal is intentionally narrow:

- Display current time
- Display current weather condition and temperature
- Run on PC first; remain compatible with future Raspberry Pi (headless) execution

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Language | TypeScript (strict) | Type safety across package boundaries |
| Runtime | Node.js >= 22 | LTS, native fetch, good ARM support |
| Monorepo | npm workspaces | Simple, no additional tooling required |
| Reactivity | RxJS | Observable-based push/pull model for widget updates |
| Image composition | node-canvas | Canvas API for widget rendering; familiar drawing model |
| Package manager | npm | Consistent with Node.js ecosystem |

## Monorepo Package Structure

Each architectural layer maps to exactly one npm workspace package.

| Package | Layer | One-line responsibility |
|---|---|---|
| `glance-pixel-core` | Domain | Device-independent models and interfaces only |
| `glance-pixel-renderer` | Rendering | Compose widget pixel buffers into a 64×64 frame |
| `glance-pixel-infra` | Infrastructure | All I/O: device client, weather API, config, logging |
| `glance-pixel-app` | Application | Orchestrate the above; own the main loop |

**See `.github/instructions/architecture.instructions.md` for dependency rules.**  
**See `.github/instructions/domain-model.instructions.md` for type definitions and design rationale.**

## Current Milestone

> **Milestone 1 — PoC: Pixoo API connectivity**  
> Validate that the device can be reached and that a 64×64 image can be sent and updated.  
> Implementation lives in `experiments/pixoo-poc/` and is intentionally outside the main package structure.  
> **See `docs/poc-checklist.md` for verification criteria.**

Do not implement beyond the current milestone unless explicitly instructed.

## Non-Negotiable Rules

- `glance-pixel-core` must not depend on any package other than RxJS.
- `glance-pixel-renderer` must not depend on `glance-pixel-infra` (and vice versa).
- No Pixoo-specific command structures outside `glance-pixel-infra`.
- No weather API response schemas outside `glance-pixel-infra`.
- All environment-specific values (device IP, API keys, timezone, etc.) must come from configuration, never be hardcoded.
- The physical device must not be required to validate rendering — local preview must always be possible.

## Code Style

- Prefer explicit types; avoid `any`.
- Prefer `const` and immutable data structures where practical.
- Keep modules focused; avoid god modules.
- Use clear, intention-revealing names over generic helpers.
- Use `async/await`; avoid raw Promise chains.
- Include the reasoning behind non-obvious decisions as inline comments.
