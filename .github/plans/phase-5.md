### Phase 5: Dynamic Clock Update Loop

_Define the app-layer design for a clock-only reactive runtime loop that updates time content on schedule, recomposes frames, and sends them through the Phase 4 Pixoo transport path without introducing weather or reliability-scope expansion._

#### Status

- [x] Planned
- [ ] In progress
- [ ] Completed

#### Design References

- [../instructions/architecture.instructions.md](../instructions/architecture.instructions.md) - app/renderer/infra ownership boundaries and dependency graph
- [../instructions/domain-model.instructions.md](../instructions/domain-model.instructions.md) - widget lifecycle and `updates$` semantics
- [../instructions/testing.instructions.md](../instructions/testing.instructions.md) - deterministic observable testing requirements
- [../plans/phase-2.md](../plans/phase-2.md) - package scaffolding and lint import-boundary enforcement
- [../plans/phase-3.md](../plans/phase-3.md) - renderer composition and local preview output contract
- [../plans/phase-4.md](../plans/phase-4.md) - single-frame Pixoo send API and typed send result contract
- [../roadmap.md](../roadmap.md) - near-term item: Dynamic Clock-Only Update
- [../../docs/architecture.md](../../docs/architecture.md) - refresh model and app-layer orchestration responsibilities

#### Design Decisions

- **Runtime orchestration ownership**: `glance-pixel-app` owns activation/deactivation, stream wiring, scheduling, and error-handling policy for the clock-only runtime. `glance-pixel-renderer` remains rendering-only, and `glance-pixel-infra` remains transport/config-only.
- **Clock widget contract**: Implement a clock widget in `glance-pixel-renderer` that conforms to core `Widget` interface, emits renderable `WidgetSnapshot`, and uses `shareReplay(1)` so late subscribers receive the latest frame immediately.
- **Clock update cadence (release scope)**: Default update cadence is once per minute (`showSeconds=false`) to align with roadmap scope and reduce unnecessary send frequency. Second-level updates are explicitly deferred.
- **Timezone policy**: Clock rendering uses timezone from typed config (`TIMEZONE`) consumed through app/infra config handoff; no hardcoded timezone fallback in widget logic.
- **Scene/frame structure for this phase**: Use a single-frame scene containing only the clock widget placement. Scene rotation and multi-frame orchestration are out of scope in this release.
- **Reactive pipeline shape**: App subscribes to clock widget `updates$`, composes via Phase 3 renderer API, and calls Phase 4 `PixooClient.sendFrame` for each emitted snapshot.
- **Send policy with typed result**: App handles `PixooSendResult` without retries in this phase; on `ok:false`, log classified error and continue runtime loop (no process crash).
- **Startup behavior**: On app start, activate widget and emit/send initial frame immediately from replayed latest snapshot; do not wait for the next minute boundary before first render.
- **Lifecycle behavior**: For this single-scene phase, widget is activated once at start and deactivated only on graceful shutdown path.
- **Graceful shutdown baseline**: Handle process termination signals by unsubscribing stream(s), deactivating widget, and allowing process exit without pending timer leaks.
- **Dependency boundaries**: App imports public APIs only (`core`, `renderer`, `infra` package entry points). App must not import infra protocol internals or renderer private modules.
- **Observability scope**: Add minimal structured logs for startup, successful sends, and classified send failures. Metrics/retry telemetry are deferred to reliability phase.

#### Non-Goals

- Adding weather widget integration, weather fetch orchestration, or stale weather fallback behavior.
- Introducing retry/backoff/circuit-breaker logic for send failures.
- Implementing scene rotation or multi-frame animation/device-side frame cycling.
- Supporting second-level clock rendering (`showSeconds=true`) as default runtime behavior.
- Expanding into Raspberry Pi service/deployment concerns.

#### Target Files

| File                                                                | Action | Notes                                                                                                 |
| ------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `packages/glance-pixel-renderer/src/widgets/clock-widget.ts`        | Create | Renderer-owned `ClockWidget` implementing core `Widget` contract and minute-based updates.            |
| `packages/glance-pixel-renderer/src/widgets/clock-widget.spec.ts`   | Create | Unit tests for lifecycle, cadence behavior, and replayed initial snapshot emission.                   |
| `packages/glance-pixel-renderer/src/index.ts`                       | Modify | Export `ClockWidget` and related config/types used by app.                                            |
| `packages/glance-pixel-app/src/runtime/start-clock-runtime.ts`      | Create | App runtime composition: activate widget, subscribe to updates, compose frame, send via infra client. |
| `packages/glance-pixel-app/src/runtime/start-clock-runtime.spec.ts` | Create | Tests for stream orchestration, send call frequency, and error-continuation behavior.                 |
| `packages/glance-pixel-app/src/index.ts`                            | Modify | Main entrypoint wiring config + renderer + infra + runtime start/stop.                                |
| `packages/glance-pixel-infra/src/config/load-config.ts`             | Modify | Ensure typed runtime config includes `TIMEZONE` and clock format flags consumed by app/widget.        |
| `packages/glance-pixel-infra/src/index.ts`                          | Modify | Export runtime config types/helpers needed by app entrypoint.                                         |
| `README.md`                                                         | Modify | Document clock-only runtime behavior and run command expectations.                                    |

#### Documentation Touchpoints

| File                   | Section                                             | Action |
| ---------------------- | --------------------------------------------------- | ------ |
| `README.md`            | `Features (planned)` / runtime behavior description | Update |
| `README.md`            | `Run (development)`                                 | Update |
| `docs/architecture.md` | `Refresh Model`                                     | Update |
| `docs/architecture.md` | `Widget Lifecycle`                                  | Update |
| `.github/roadmap.md`   | `Near-Term` -> `Dynamic Clock-Only Update`          | Update |

#### Implementation Notes

- Use RxJS scheduler-friendly design so cadence logic can be tested with `TestScheduler` instead of real timers.
- Keep formatting/rendering of clock text localized to renderer widget logic; app should treat widget output as opaque `PixelBuffer` snapshots.
- Ensure app runtime uses cancellation-safe subscription management to avoid duplicate send loops on restart.
- Preserve one-way data flow: widget snapshot -> renderer composition -> infra send; do not feed transport status back into renderer state in this phase.

#### Verification

**Automated:**

```bash
npm run build
npm test
npm run lint
npm run format:check
```

**Behavioral checks** (manual CLI invocations or observable output changes):

- Run app in clock-only mode and confirm first frame is sent shortly after startup without waiting for a full minute rollover.
- Keep app running across at least two minute boundaries and confirm one visible clock update per minute is sent to device path.
- Simulate one send failure (invalid host or disconnected device) and confirm app loop continues running with logged classified error.
- Confirm no weather API calls are made in this phase runtime path.
