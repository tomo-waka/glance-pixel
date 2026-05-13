# GlancePixel Roadmap

This file tracks the long-horizon backlog for GlancePixel.
Items are grouped by time horizon (near-term, medium-term, long-term), not by release version.
Entries can be rough ideas or detailed proposals, and are refined during release planning.

## Metadata Convention

Roadmap entries use the following standardized metadata labels, placed immediately below the entry title:

- **Release target**: `vX.Y.Z` — added when an item is selected for a release during planning
- **Depends on**: Entry title(s) — indicates dependencies on other roadmap items

## Near-Term

#### Static Local Rendering

Render a test frame to a PNG file on disk without a Pixoo device connected.
Validates that the `glance-pixel-renderer` package can compose a 64×64 `PixelBuffer` and export it as a PNG for visual inspection during development.

#### Send Rendered Output to Pixoo

- Depends on: Static Local Rendering

Wire the renderer's composited frame output into `PixooClient` to push a real image to the device.
Validates the end-to-end path from `PixelBuffer` → HTTP payload → device display.

#### Dynamic Clock-Only Update

- Depends on: Send Rendered Output to Pixoo

Implement `ClockWidget` producing a live time display that updates every minute and remains stable over long-running sessions.
First exercise of the full reactive update loop: widget `updates$` → Frame recomposition → device send.

## Medium-Term

#### Weather Provider Integration

- Depends on: Dynamic Clock-Only Update

Implement `WeatherApiClient` in `glance-pixel-infra`, mapping external API responses to `WeatherSnapshot`.
Validated independently (unit-tested against recorded fixtures) before being wired into a widget.

#### Clock + Weather Combined Scene

- Depends on: Dynamic Clock-Only Update, Weather Provider Integration

Compose the first complete end-to-end scene showing both live time and current weather condition/temperature.
Exercises `ClockWidget` and `WeatherWidget` running in the same `Frame` with independent refresh intervals.

#### Reliability and Error Handling

- Depends on: Clock + Weather Combined Scene

Add retry logic with backoff for device sends and weather fetches, stale-data fallback rendering, structured logging, and a config review.
Ensures transient failures do not crash the main loop and that the app degrades gracefully.

## Long-Term

#### Raspberry Pi Readiness

- Depends on: Reliability and Error Handling

Make the application run reliably in a headless environment on a Raspberry Pi.
Covers startup scripts (e.g. systemd service), ARM compatibility checks (`node-canvas` / `libcairo`), and a final configuration review for production use.
