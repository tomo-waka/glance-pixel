# GlancePixel — Copilot Instructions

## What This Project Is

GlancePixel is a custom information display service for pixel-based devices, implemented in TypeScript / Node.js.

The initial target device is the **Divoom Pixoo 64** (64×64 LED matrix). The architecture must remain device-agnostic so that adapting to a different device requires only changes in the infrastructure layer.

The first functional goal is intentionally narrow:

- Display current time
- Display current weather condition and temperature
- Run on PC first; remain compatible with future Raspberry Pi (headless) execution

## Tech Stack

| Concern           | Choice              | Reason                                                  |
| ----------------- | ------------------- | ------------------------------------------------------- |
| Language          | TypeScript (strict) | Type safety across package boundaries                   |
| Runtime           | Node.js >= 22       | LTS, native fetch, good ARM support                     |
| Monorepo          | npm workspaces      | Simple, no additional tooling required                  |
| Reactivity        | RxJS                | Observable-based push/pull model for widget updates     |
| Image composition | node-canvas         | Canvas API for widget rendering; familiar drawing model |
| Package manager   | npm                 | Consistent with Node.js ecosystem                       |

## Monorepo Package Structure

Each architectural layer maps to exactly one npm workspace package.

| Package                 | Layer          | One-line responsibility                              |
| ----------------------- | -------------- | ---------------------------------------------------- |
| `glance-pixel-core`     | Domain         | Device-independent models and interfaces only        |
| `glance-pixel-renderer` | Rendering      | Compose widget pixel buffers into a 64×64 frame      |
| `glance-pixel-infra`    | Infrastructure | All I/O: device client, weather API, config, logging |
| `glance-pixel-app`      | Application    | Orchestrate the above; own the main loop             |

**See `.github/instructions/architecture.instructions.md` for dependency rules.**  
**See `.github/instructions/domain-model.instructions.md` for type definitions and design rationale.**

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

## Workflow Priority

When the development lifecycle is being executed under the Development Workflow,
the gate rules and step-transition rules in
`development-workflow.instructions.md` override the general autonomy policy in
this file.

In particular:

- Do not infer authorization for the next workflow step from generic replies
  such as "continue", "proceed", or "yes"
- Stop at every workflow gate and wait for a valid human response
- Treat waiting at a workflow gate as correct completion behavior

## Autonomy

This is an early-stage greenfield project with no existing users or production dependencies.

Favor autonomous execution for local work inside an already authorized step.

Always follow workflow-specific gate rules when a referenced workflow document
requires explicit human authorization before the next step.

**Proceed without asking for confirmation** for all local, reversible actions:

- Creating, editing, or moving files
- Installing or updating dependencies
- Running builds, tests, linters, or formatters
- Creating commits

**Always ask before:**

- Deleting any file or directory
- Running `git push`, `git reset --hard`, or any history-altering command
