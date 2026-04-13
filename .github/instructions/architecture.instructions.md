---
applyTo: "packages/**"
---

# Architecture: Package Dependency Rules

## Dependency Graph

```
glance-pixel-app
  ├── glance-pixel-core
  ├── glance-pixel-renderer
  └── glance-pixel-infra

glance-pixel-renderer
  └── glance-pixel-core

glance-pixel-infra
  └── glance-pixel-core

glance-pixel-core
  └── rxjs  (only external dependency allowed)
```

Arrows mean "depends on". There are no other allowed dependencies between packages.

## Prohibited Dependencies

| From | To | Why |
|---|---|---|
| `glance-pixel-renderer` | `glance-pixel-infra` | Rendering must work without a device or network |
| `glance-pixel-infra` | `glance-pixel-renderer` | Infrastructure must not know about visual composition |
| `glance-pixel-core` | `glance-pixel-renderer` | Core is device- and render-agnostic |
| `glance-pixel-core` | `glance-pixel-infra` | Core must not know about external systems |

If you find yourself wanting to import across a prohibited boundary, stop and reconsider the design. The correct solution is almost always to define an interface in `core` and implement it in the appropriate package.

## Package Responsibilities

### `glance-pixel-core`

Contains only:
- TypeScript interfaces and types (no implementation classes)
- Pure value-object logic with no side effects
- The `Widget`, `Frame`, `Scene`, and snapshot interfaces
- The `WeatherCondition` union type and `WeatherSnapshot` interface
- RxJS `Observable` types used in interfaces

Does NOT contain:
- Any I/O, logging, or side effects
- Any rendering or canvas operations
- Any device-specific knowledge

### `glance-pixel-renderer`

Contains:
- Frame composition logic (merging widget `PixelBuffer`s by x/y/z placement)
- Widget rendering implementations (ClockWidget, WeatherWidget, etc.)
- Local preview image export (write a PNG for development validation)

Depends on `node-canvas` for pixel-level drawing operations.

The renderer must be fully usable without a Pixoo device connected.

### `glance-pixel-infra`

Contains:
- `PixooClient`: HTTP transport to the Divoom Pixoo 64
- `WeatherApiClient`: fetches external weather data and maps it to `WeatherSnapshot`
- `ConfigLoader`: reads `.env` / environment variables into a typed config object
- `Logger`: structured logging

All external API response schemas are private to this package.
Only `core` types are exported across the package boundary.

### `glance-pixel-app`

Contains:
- Main entry point
- Scene construction and widget lifecycle management (`activate` / `deactivate`)
- RxJS pipeline: subscribes to `Frame.updates$`, calls renderer, sends to device
- Refresh scheduling and error handling
- Graceful degradation logic (time continues if weather fails)

This is where RxJS operators (`merge`, `throttleTime`, `retry`, etc.) are used most heavily.

## experiments/ Directory

The `experiments/` directory is outside the monorepo package structure.  
Code here is throwaway validation code (PoC scripts) and must not be imported by any package.  
It may have its own minimal `package.json` with direct dependencies.
