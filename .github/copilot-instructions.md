# GlancePixel — Copilot Instructions

## Goal

Build **GlancePixel**, a custom information display service for pixel-based devices, implemented in **TypeScript / Node.js**.

The initial target device is **Divoom Pixoo 64**, but the architecture should remain as device-agnostic as reasonably possible.

The first functional goal is intentionally narrow:

- display current time
- display current weather
- run on PC first
- remain compatible with future Raspberry Pi execution

---

## Primary Technical Direction

- Implement in **TypeScript / Node.js**
- Develop and run on **PC first**; keep compatible with future **Raspberry Pi** execution
- Treat the display device as an **external output target** — application logic does not live on the device
- The GlancePixel service is responsible for:
  - obtaining data
  - transforming data into an internal display model
  - rendering a 64x64 output
  - sending the result to the target device

---

## Core Development Rules

- Treat the display device as an **external output target**
- Keep application logic outside the device
- Do not jump directly to a feature-rich dashboard
- Progress in small, verifiable milestones
- Prefer clear separation of responsibilities over quick coupling
- Keep the design extensible, but avoid premature over-abstraction

---

## Architectural Boundaries

Separate the code into clear responsibilities.

### Domain

Device-independent and service-independent concepts.

Examples:

- time model
- weather snapshot
- display frame / scene model

### Application

Use-case orchestration.

Examples:

- build current scene
- decide refresh timing
- coordinate rendering and publishing

### Infrastructure

External integrations.

Examples:

- Pixoo API client
- weather API client
- config loading
- logging
- preview file output

### Rendering / Presentation

64x64 visual composition.

Examples:

- layout calculation
- text placement
- icon placement
- frame rendering
- local preview image generation

### Monorepo Package Mapping

Each architectural layer maps to one npm workspace package. Do not merge layers into a single package.

| Layer          | Package                 |
| -------------- | ----------------------- |
| Domain         | `glance-pixel-core`     |
| Application    | `glance-pixel-app`      |
| Infrastructure | `glance-pixel-infra`    |
| Rendering      | `glance-pixel-renderer` |

Each package must be compilable and independently testable.

Do not mix:

- weather API parsing
- rendering logic
- device transport logic
- scheduling logic

inside one large module (and by extension, inside one package).

---

## Device Adapter Rule

Keep Pixoo-specific commands, payloads, and transport details isolated in adapter/client layers.

The rest of the system should work with concepts like:

- render a frame
- publish a frame
- update a scene

and should not depend on raw Pixoo command structures.

---

## Weather Provider Rule

Do not couple the application directly to one weather API schema.

Use an internal weather model and map external responses into it.

---

## Rendering Rule

Separate rendering from device transmission.

The system should support:

- local rendering preview
- device sending as a separate step

Do not require the physical device for every rendering validation.

---

## 64x64 Design Rule

Always treat **64x64 resolution** as a first-class constraint.

Guidelines:

- prioritize readability over information density
- do not overload the screen
- prefer simple, clear layouts
- use icons, numbers, and spacing carefully
- avoid assuming normal web UI patterns fit this display

---

## First Functional Scope

Implement only what is needed for the first goal:

- current time
- current weather condition
- current temperature

Optional only if naturally justified:

- high / low temperature
- simple weather icon
- brightness adjustment by time of day

Do not expand scope before this works reliably.

---

## Recommended Milestones

Implement only the current milestone unless explicitly asked to go further.

1. **Validate Pixoo API connectivity** — device reachability, simple API request, minimal command execution
2. **Build static local 64x64 rendering** — render a test frame, place text/icon, export preview image locally
3. **Send static rendered output to Pixoo** — confirm rendering output and device transmission are connected
4. **Implement dynamic clock-only update** — update every minute, verify stable refresh and layout readability
5. **Integrate weather provider** — fetch and map weather into internal model; validate independently from full scene
6. **Combine clock + weather in one readable scene** — first end-to-end scene in a clean 64x64 layout
7. **Improve reliability and error handling** — retries, stale data behavior, logging cleanup, config review
8. **Review Raspberry Pi readiness** — ensure structure suits headless long-running execution

---

## Reliability Expectations

Design for graceful degradation.

At minimum:

- if weather retrieval fails, time display must continue
- transient failure must not crash the whole service
- stale weather data may be reused temporarily if appropriate
- device send failures should be logged
- retries should be considered where reasonable
- the system should remain understandable when something goes wrong

---

## Configuration Rule

Do not hardcode environment-specific values.

Externalize values such as:

- device host / IP
- API keys
- location
- timezone
- refresh intervals
- brightness settings
- preview output path

Configuration must support moving from PC development to Raspberry Pi execution with minimal code changes.

---

## Testing and Validation

Do not over-engineer the first version, but keep the structure testable.

Prefer designs where the following can be validated independently:

- weather data mapping
- layout calculation
- frame model generation
- refresh scheduling decisions
- device adapter behavior behind an interface boundary

Pure or nearly pure logic should be easier to test than infrastructure-heavy modules.

---

## Logging and Observability

Include minimal but useful logging from early stages.

Useful events include:

- startup configuration summary
- device connectivity result
- weather fetch success/failure
- render success/failure
- send success/failure
- next scheduled refresh timing

This is especially important for later Raspberry Pi execution where no interactive debugging is available.

---

## Raspberry Pi Consideration

The initial development environment is a PC, but the architecture should be compatible with a future Raspberry Pi deployment.

Avoid unnecessary dependence on:

- GUI-only workflows
- OS-specific assumptions
- manual interactive steps required for normal execution

The service should gradually move toward a model suitable for headless, long-running execution.

---

## Code Quality Rule

Use maintainable TypeScript.

Guidelines:

- prefer explicit types
- avoid unnecessary `any`
- keep modules focused
- avoid god modules
- prefer clear naming over vague helpers
- keep experiments separate from stable code
- avoid hidden coupling across layers

---

## What to Avoid

Avoid the following patterns unless there is a strong reason:

- jumping straight into a fully featured dashboard
- tightly coupling weather API parsing with rendering
- tightly coupling rendering with device transport
- building the entire project around one large script
- introducing complex abstractions before the first milestones are validated
- treating 64x64 like a normal UI canvas
- requiring the physical device for every single rendering validation
- implementing too many features before time + weather works reliably

---

## Working Style

When proposing code:

1. focus on the current milestone
2. keep the implementation minimal but extensible
3. validate one step at a time
4. refactor only when justified by emerging structure, not by abstract perfectionism
5. avoid speculative complexity
