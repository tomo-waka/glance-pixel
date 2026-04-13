---
mode: "agent"
description: "Scaffold a new Widget implementation"
---

# New Widget: ${input:widgetName}

Implement a new widget called **${input:widgetName}Widget** following the GlancePixel widget contract.

## Steps

1. **Define the config interface** in `glance-pixel-core/src/widgets/${input:widgetName:lowercase}.ts`:
   - What configuration does this widget need?
   - Follow the pattern of `ClockWidgetConfig` and `WeatherWidgetConfig` in `domain-model.instructions.md`.

2. **Implement the widget** in `glance-pixel-renderer/src/widgets/${input:widgetName:lowercase}-widget.ts`:
   - Implement the `Widget` interface from `glance-pixel-core`.
   - `updates$` must use `shareReplay(1)`.
   - `activate()` starts the internal refresh cycle; `deactivate()` pauses it.
   - `WidgetSnapshot.pixels` must always be renderable — provide a fallback when data is unavailable.
   - Set `dataQuality: 'stale'` when the last data fetch failed or timed out.
   - Use `node-canvas` for pixel drawing.

3. **Write unit tests** in `glance-pixel-renderer/src/widgets/${input:widgetName:lowercase}-widget.test.ts`:
   - Test `activate` / `deactivate` lifecycle using RxJS `TestScheduler`.
   - Test that a stale snapshot is emitted (not an error) when data is unavailable.
   - Test that `pixels` dimensions match the configured widget size.

4. **Export the new types** from `glance-pixel-core/src/index.ts`.

## Constraints to Verify

- [ ] Widget does not import from `glance-pixel-infra`.
- [ ] Widget does not import from `glance-pixel-app`.
- [ ] `updates$` never throws — errors are caught and result in a stale snapshot.
- [ ] Widget has no knowledge of the Pixoo device or any specific weather API.
