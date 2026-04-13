# GlancePixel — Architecture Reference

Human-readable companion to the Copilot instruction files.
This document explains *why* decisions were made, not just *what* they are.

## Design Principles

### 1. Device as External Output Target

The Pixoo 64 is treated as a dumb display endpoint. All logic — data fetching, composition, scheduling — runs on the host machine (PC or Raspberry Pi). The device receives only a completed 64×64 pixel buffer.

This means the system can be developed, tested, and extended without the physical device present. Local PNG preview replaces device output during development.

### 2. No Coupling to Specific Data Sources

Weather data, time, and any future information source are abstracted behind internal models defined in `glance-pixel-core`. The specific API provider (OpenWeatherMap, etc.) is an implementation detail of `glance-pixel-infra` and can be swapped without touching any other layer.

### 3. Rendering Is Independent of Transmission

Compositing a 64×64 frame and sending it to the device are separate steps. This enables:
- Local preview without a device
- Testing the renderer in isolation
- Future support for multiple output targets (different devices, file export, etc.)

---

## Package Dependency Graph

```
┌──────────────────────────────────────────┐
│           glance-pixel-app               │
│  (main loop, scheduling, orchestration)  │
└──────┬──────────────┬────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌────────────┐ ┌──────────────┐ ┌────────────────────┐
│    core    │ │   renderer   │ │       infra        │
│            │ │              │ │                    │
│ interfaces │ │ widget impls │ │ PixooClient        │
│ types only │ │ frame compose│ │ WeatherApiClient   │
│            │ │ PNG preview  │ │ ConfigLoader       │
│  rxjs only │ │ node-canvas  │ │ Logger             │
└────────────┘ └──────┬───────┘ └──────────┬─────────┘
      ▲               │                    │
      └───────────────┴────────────────────┘
              both depend on core only
```

**Prohibited:** `renderer ↔ infra` (either direction).  
**Prohibited:** `core → renderer`, `core → infra`, `core → app`.

---

## Display Model

```
Scene
  entries: FrameEntry[]
    ├── frame: Frame
    │     placements: WidgetPlacement[]
    │       ├── widget: Widget   ← produces PixelBuffer
    │       ├── x: number
    │       └── y: number        (z-order = array order)
    └── duration: number (ms)    ← Scene controls when to advance
```

**Scene** is responsible for frame rotation timing.  
**Frame** is responsible for compositing widget pixel buffers.  
**Widget** is responsible for producing its own image.

---

## Refresh Model

Two independent refresh mechanisms coexist:

| Mechanism | Owner | Driven by |
|---|---|---|
| Frame rotation | Scene | `duration` in `FrameEntry` (time-based, pull) |
| Widget content update | Widget | `updates$` Observable (data-driven, push) |

A widget emits on `updates$` whenever its data changes (e.g. the minute ticks over for ClockWidget, or a weather API response arrives for WeatherWidget). The Frame merges all widget streams and throttles them to avoid unnecessary recomposition.

### Widget Lifecycle

Widgets have two independent state axes:

- **Lifecycle** (`active` / `inactive`): controlled by Frame — inactive when the frame is not currently displayed.
- **Data quality** (`fresh` / `stale`): set by the widget itself — stale when the last data fetch failed or timed out.

A widget must always emit a renderable snapshot regardless of data quality. Stale snapshots display the last known value (or a placeholder) and set `dataQuality: 'stale'` so the app layer can log or react accordingly.

---

## Error and Degradation Strategy

- If weather fetch fails: emit stale snapshot with last known data → time display continues unaffected.
- If device send fails: log the error, retry with backoff → do not crash the main loop.
- If a widget throws internally: catch at the widget boundary, emit stale snapshot.
- Transient failures must not propagate to the Scene or crash the application.

---

## Milestone Plan

| # | Milestone | Deliverable |
|---|---|---|
| 1 | PoC: Pixoo API connectivity | `experiments/pixoo-poc/`: verify HTTP reach, image send, update |
| 2 | Static local rendering | Render a test frame to PNG without a device |
| 3 | Send rendered output to Pixoo | Connect renderer output to PixooClient |
| 4 | Dynamic clock-only update | ClockWidget updates every minute, stable over time |
| 5 | Weather provider integration | WeatherApiClient + WeatherSnapshot, validated independently |
| 6 | Clock + weather combined scene | First complete end-to-end scene |
| 7 | Reliability and error handling | Retries, stale data, logging, config review |
| 8 | Raspberry Pi readiness | Headless execution, startup scripts, config review |

**Current milestone: 1**. Do not implement beyond the current milestone.

---

## Raspberry Pi Compatibility Notes

- No GUI dependencies — all output is either device-bound or file-based (PNG preview).
- Configuration via environment variables — compatible with systemd service files.
- `node-canvas` requires `libcairo` — must be installed on the Pi via `apt`.
- `sharp` (if used) has prebuilt ARM binaries for Node.js >= 18.
- Avoid any assumption of interactive terminal during normal operation.
