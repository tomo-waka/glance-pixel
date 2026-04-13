---
applyTo: "packages/glance-pixel-core/**,packages/glance-pixel-renderer/**"
---

# Domain Model

This file defines the canonical types for `glance-pixel-core` and explains the design decisions behind them.
When adding or modifying types in core, follow these definitions and respect the rationale.

## Display Hierarchy

```
Scene
  └── FrameEntry[]          (frame + how long to display it)
        └── Frame
              └── WidgetPlacement[]   (widget + where to place it)
                    └── Widget        (produces its own pixel buffer)
```

- **Scene** knows the sequence of frames and display durations.
- **Frame** knows the spatial layout of widgets (x, y, z-order).
- **Widget** knows how to produce its own image — rendering strategy is entirely the widget's responsibility.

## Core Types

```typescript
import { Observable } from "rxjs";

// ---- Pixel buffer ----

/**
 * Raw RGBA pixel data.
 * Uses Uint8ClampedArray to match the node-canvas ImageData format directly,
 * enabling zero-copy handoff between widget rendering and frame composition.
 */
interface PixelBuffer {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray; // RGBA, length = width * height * 4
}

// ---- Widget state ----

/**
 * Lifecycle: whether the widget should be producing updates.
 * inactive widgets stop their internal timers and data fetching.
 */
type WidgetLifecycle = "active" | "inactive";

/**
 * Data quality: whether the widget's current snapshot reflects fresh data.
 * A widget may be active but stale (e.g. weather API timed out).
 * These two axes are independent — do not conflate them.
 */
type WidgetDataQuality = "fresh" | "stale";

// ---- Snapshot ----

/**
 * The value emitted by Widget.updates$.
 * Always renderable — a widget must never emit a snapshot it cannot display.
 * When data is stale, the widget provides a fallback rendering (e.g. last known value,
 * placeholder icon) and sets dataQuality accordingly.
 */
interface WidgetSnapshot {
  readonly dataQuality: WidgetDataQuality;
  readonly pixels: PixelBuffer;
}

// ---- Widget ----

interface Widget {
  readonly id: string;
  readonly lifecycle: WidgetLifecycle;

  /**
   * Called by Frame when this widget becomes visible.
   * The widget should start (or resume) its internal refresh cycle.
   */
  activate(): void;

  /**
   * Called by Frame when this widget is no longer visible.
   * The widget should pause updates to conserve resources.
   */
  deactivate(): void;

  /**
   * Hot observable: emits a new WidgetSnapshot whenever the widget's content changes.
   * Use shareReplay(1) internally so late subscribers receive the last known value immediately.
   *
   * Multiple widgets in a Frame may emit at different intervals.
   * The Frame is responsible for throttling the combined stream — widgets must not
   * attempt to coordinate their own emission timing with each other.
   */
  readonly updates$: Observable<WidgetSnapshot>;
}

// ---- Frame ----

interface WidgetPlacement {
  readonly widget: Widget;
  readonly x: number; // top-left x offset in the 64×64 canvas
  readonly y: number; // top-left y offset in the 64×64 canvas
  // z-order is implicit: later entries in Frame.placements render on top
}

interface FrameSnapshot {
  /**
   * The fully composited 64×64 pixel buffer, ready to send to the device.
   * Always exactly 64×64 — this invariant must be enforced by the renderer.
   */
  readonly pixels: PixelBuffer;
}

interface Frame {
  readonly placements: WidgetPlacement[];

  /**
   * Emits a composited FrameSnapshot whenever any contained widget updates.
   * Internally merges all widget update streams and applies throttling to prevent
   * excessive recomposition when multiple widgets update in quick succession.
   *
   * Recommended implementation:
   *   merge(...placements.map(p => p.widget.updates$)).pipe(
   *     throttleTime(FRAME_THROTTLE_MS),
   *     map(() => compose(placements))
   *   )
   */
  readonly updates$: Observable<FrameSnapshot>;
}

// ---- Scene ----

interface FrameEntry {
  readonly frame: Frame;
  readonly duration: number; // milliseconds — how long Scene displays this frame
}

interface Scene {
  readonly entries: FrameEntry[];
}
```

## Weather Domain Types

```typescript
/**
 * Internal weather condition vocabulary.
 * Defined at a granularity suitable for distinct pixel icons on a 64×64 display.
 * Maps from OpenWeatherMap condition code groups as follows:
 *
 *   clear         → 800
 *   few-clouds    → 801
 *   cloudy        → 802–804
 *   drizzle       → 3xx
 *   shower-rain   → 520–531
 *   rain          → 500–504
 *   freezing-rain → 511
 *   thunderstorm  → 2xx
 *   snow          → 600–602, 620–622
 *   sleet         → 611–616
 *   fog           → 7xx (mist, smoke, haze, dust, fog, sand, ash, squall, tornado)
 *   unknown       → fallback for unrecognised codes
 *
 * This mapping is performed in glance-pixel-infra — core never sees raw API codes.
 */
type WeatherCondition =
  | "clear"
  | "few-clouds"
  | "cloudy"
  | "drizzle"
  | "shower-rain"
  | "rain"
  | "freezing-rain"
  | "thunderstorm"
  | "snow"
  | "sleet"
  | "fog"
  | "unknown";

/**
 * Internal weather data model.
 * No external API types appear here — infra maps API responses into this shape.
 * Temperature is always stored in Celsius; display formatting is the widget's concern.
 */
interface WeatherSnapshot {
  readonly condition: WeatherCondition;
  readonly temperatureCelsius: number;
  readonly feelsLikeCelsius?: number;
  readonly fetchedAt: Date;
}
```

## Widget Config Types

```typescript
interface ClockWidgetConfig {
  readonly format: "12h" | "24h";
  readonly showSeconds: boolean;
  readonly timezone: string; // IANA format, e.g. 'Asia/Tokyo'
}

interface WeatherWidgetConfig {
  readonly location: string; // city name or lat,lon string
  readonly refreshInterval: number; // milliseconds; recommend >= 600_000 (10 min)
}
```

## Key Design Decisions

**Why `Uint8ClampedArray` (RGBA) instead of `Uint8Array` (RGB)?**  
node-canvas `ImageData.data` is RGBA. Using the same format avoids conversion overhead at the frame composition step and enables alpha-channel blending when widgets overlap.

**Why does Widget own its own rendering?**  
Each widget knows its own content and layout constraints. Centralising rendering in the renderer would require the renderer to know about every widget type, making it a change magnet whenever a new widget is added. Widget-owned rendering allows new widgets to be added without touching the renderer.

**Why `shareReplay(1)` on `updates$`?**  
A new subscriber (e.g. when a Frame activates a widget) needs the current value immediately, without waiting for the next natural emission. `shareReplay(1)` provides this without adding a separate `snapshot()` method.

**Why is `stale` on `WidgetSnapshot` rather than on `Widget`?**  
Data quality is a property of a specific snapshot in time, not a fixed attribute of the widget itself. A widget transitions between fresh and stale over time; encoding this on the snapshot makes the causal relationship explicit.
