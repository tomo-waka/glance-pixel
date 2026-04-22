# GlancePixel Roadmap

This file tracks the long-horizon backlog for GlancePixel.
Items are grouped by time horizon (near-term, medium-term, long-term), not by release version.
Entries can be rough ideas or detailed proposals, and are refined during release planning.

## Metadata Convention

When an item is selected for a release during planning, annotate it with:

- Release target: vX.Y.Z

## Near-Term

#### Static Local Rendering

Render a test frame to a PNG file on disk without a Pixoo device connected.
Validates that the `glance-pixel-renderer` package can compose a 64×64 `PixelBuffer` and export it as a PNG for visual inspection during development.

- Depends on: PoC completed (done)

#### Send Rendered Output to Pixoo

Wire the renderer's composited frame output into `PixooClient` to push a real image to the device.
Validates the end-to-end path from `PixelBuffer` → HTTP payload → device display.

- Depends on: Static Local Rendering

#### Dynamic Clock-Only Update

Implement `ClockWidget` producing a live time display that updates every minute and remains stable over long-running sessions.
First exercise of the full reactive update loop: widget `updates$` → Frame recomposition → device send.

- Depends on: Send Rendered Output to Pixoo

## Medium-Term

#### Weather Provider Integration

Implement `WeatherApiClient` in `glance-pixel-infra`, mapping external API responses to `WeatherSnapshot`.
Validated independently (unit-tested against recorded fixtures) before being wired into a widget.

- Depends on: Dynamic Clock-Only Update

#### Clock + Weather Combined Scene

Compose the first complete end-to-end scene showing both live time and current weather condition/temperature.
Exercises `ClockWidget` and `WeatherWidget` running in the same `Frame` with independent refresh intervals.

- Depends on: Dynamic Clock-Only Update, Weather Provider Integration

#### Reliability and Error Handling

Add retry logic with backoff for device sends and weather fetches, stale-data fallback rendering, structured logging, and a config review.
Ensures transient failures do not crash the main loop and that the app degrades gracefully.

- Depends on: Clock + Weather Combined Scene

## Long-Term

#### Raspberry Pi Readiness

Make the application run reliably in a headless environment on a Raspberry Pi.
Covers startup scripts (e.g. systemd service), ARM compatibility checks (`node-canvas` / `libcairo`), and a final configuration review for production use.

- Depends on: Reliability and Error Handling
