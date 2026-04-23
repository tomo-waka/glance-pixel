### Phase 4: Pixoo Send Path Integration

_Define the design for sending renderer output to Pixoo through infrastructure-layer transport while preserving renderer/transmission separation and hardware-optional validation workflow._

#### Status

- [x] Planned
- [ ] In progress
- [ ] Completed

#### Design References

- [../instructions/architecture.instructions.md](../instructions/architecture.instructions.md) - strict renderer/infra separation and package dependency constraints
- [../instructions/domain-model.instructions.md](../instructions/domain-model.instructions.md) - `PixelBuffer` and `FrameSnapshot` canonical contracts that Phase 4 consumes from Phase 3 output
- [../instructions/testing.instructions.md](../instructions/testing.instructions.md) - hardware/network-independent testing expectations
- [../plans/phase-3.md](../plans/phase-3.md) - upstream output contract: deterministic composited 64x64 RGBA `PixelBuffer`
- [../../docs/architecture.md](../../docs/architecture.md) - rendering vs transmission separation principle and degradation expectations
- [../../docs/poc-checklist.md](../../docs/poc-checklist.md) - validated Pixoo command path and known multi-frame behavior constraints
- [../../experiments/pixoo-poc/index.ts](../../experiments/pixoo-poc/index.ts) - concrete protocol usage patterns (`Draw/GetHttpGifId`, `Draw/SendHttpGif`, `Draw/ResetHttpGifId`) and upload-mode behavior
- [../roadmap.md](../roadmap.md) - near-term item: Send Rendered Output to Pixoo

#### Design Decisions

- **Transport API shape (infra public surface)**: Expose a narrow infra-side client API for this release:
  - `createPixooClient(config: PixooTransportConfig): PixooClient`
  - `PixooClient.sendFrame(frame: PixelBuffer): Promise<PixooSendResult>`
  - `PixooClient.ping(): Promise<PixooPingResult>`
  - `PixooSendResult` is a discriminated union (`{ ok: true; picId: number; requestId: string }` or `{ ok: false; error: PixooSendError }`) so app logic can branch without parsing thrown exceptions.
- **Input contract for send path**: `sendFrame` accepts Phase 3 output directly as `PixelBuffer` (`64x64`, RGBA `Uint8ClampedArray`), not a pre-encoded protocol payload. Payload encoding is not a caller responsibility.
- **Result and error model**: Infra maps transport and device failures into typed errors:
  - `kind: "validation" | "network" | "device" | "protocol"`
  - `retryable: boolean` set by infra classification
  - `message` and optional `statusCode`/`deviceErrorCode` for diagnostics
  - No automatic retry is executed in this phase; the result only communicates retryability.
- **Data transformation boundary**: `PixelBuffer` -> Pixoo `PicData` conversion is owned by `glance-pixel-infra` in protocol-focused modules (`pixoo-payload-encoder.ts`, `pixoo-command-builder.ts`). Renderer never emits Pixoo protocol fields.
- **Protocol field ownership**: `PicID`, `PicOffset`, `PicNum`, `PicWidth`, and `PicSpeed` are fully infra-owned. App and renderer must not construct or set these fields.
- **Channel conversion contract**: Infra strips alpha and converts RGBA to RGB flat bytes (`64 * 64 * 3`), then base64-encodes for `PicData`. Pixel alpha blending decisions remain renderer-owned and already finalized before send.
- **Send mode for this release**: Implement **single-frame baseline only** (`PicNum = 1`, `PicOffset = 0`) for Phase 4 acceptance. Sequential multi-frame upload support is explicitly deferred.
- **Multi-frame policy and risk guardrails**: Because PoC observed reboot risk with legacy batched multi-frame uploads, Phase 4 forbids batched animation payload construction. Any future animation work must use sequential upload only and live in a later dedicated phase.
- **PicID lifecycle policy**: For each `sendFrame` call, infra fetches next ID via `Draw/GetHttpGifId` and sends the frame using incremented `PicID`. `Draw/ResetHttpGifId` is not called in normal single-frame sends in this phase.
- **Reliability policy in this phase**: Perform one send attempt per call with no retry/backoff loop. Timeout handling and typed error mapping are included; retry strategies are deferred to the roadmap reliability phase.
- **Configuration ownership**: Environment parsing is owned by infra config loader (`PIXOO_HOST` required, `PIXOO_REQUEST_TIMEOUT_MS` optional). App consumes typed infra config/factory output and never reads Pixoo env vars directly.
- **Boundary enforcement**: `glance-pixel-renderer` remains free of Pixoo imports and transport concerns. `glance-pixel-infra` remains free of renderer imports and composes only against `glance-pixel-core` contracts.
- **Phase 3 integration contract**: App passes the composited frame (`FrameSnapshot.pixels` / Phase 3 `PixelBuffer`) to infra client unchanged except by type-safe handoff. No additional rendering or resizing occurs in infra.

#### Non-Goals

- Implementing animation upload APIs (`sendFrames`, sequential frame streaming, or device-side frame-rotation orchestration).
- Implementing batched multi-frame upload mode from legacy PoC path.
- Implementing retry/backoff policies, circuit breakers, or long-running resilience behavior (belongs to Reliability and Error Handling phase).
- Implementing weather integration or widget scheduling logic beyond the minimum send-path invocation needed to validate this phase.
- Moving protocol fields or encoding logic into renderer/core/app packages.

#### Target Files

| File                                                                  | Action | Notes                                                                                           |
| --------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `packages/glance-pixel-infra/src/pixoo/pixoo-client.ts`               | Create | Public `PixooClient` implementation exposing `sendFrame` and `ping`.                            |
| `packages/glance-pixel-infra/src/pixoo/pixoo-types.ts`                | Create | `PixooTransportConfig`, `PixooSendResult`, `PixooSendError`, and protocol-local response types. |
| `packages/glance-pixel-infra/src/pixoo/pixoo-http.ts`                 | Create | HTTP POST adapter to `http://<host>/post` with timeout handling and response parsing.           |
| `packages/glance-pixel-infra/src/pixoo/pixoo-payload-encoder.ts`      | Create | `PixelBuffer` RGBA -> RGB base64 conversion utility (single-frame only).                        |
| `packages/glance-pixel-infra/src/pixoo/pixoo-command-builder.ts`      | Create | Builders for `Draw/GetHttpGifId` and `Draw/SendHttpGif` request payloads.                       |
| `packages/glance-pixel-infra/src/config/load-config.ts`               | Modify | Add/confirm typed Pixoo transport settings (`PIXOO_HOST`, timeout).                             |
| `packages/glance-pixel-infra/src/index.ts`                            | Modify | Export public Pixoo transport API and config types/factories.                                   |
| `packages/glance-pixel-infra/src/pixoo/pixoo-client.spec.ts`          | Create | Unit tests for success path, `PicID` acquisition flow, and error classification.                |
| `packages/glance-pixel-infra/src/pixoo/pixoo-payload-encoder.spec.ts` | Create | Unit tests for RGBA->RGB conversion and payload length invariants.                              |
| `packages/glance-pixel-infra/src/pixoo/pixoo-command-builder.spec.ts` | Create | Unit tests to assert single-frame command fields (`PicNum=1`, `PicOffset=0`).                   |
| `packages/glance-pixel-app/src/index.ts`                              | Modify | Wire Phase 3 composited frame handoff into infra `sendFrame` call for end-to-end path.          |
| `README.md`                                                           | Modify | Document single-frame Pixoo send capability and required env configuration.                     |

#### Documentation Touchpoints

| File                   | Section                                        | Action |
| ---------------------- | ---------------------------------------------- | ------ |
| `README.md`            | `Run (development)` / environment setup        | Update |
| `README.md`            | `Architecture & Packages`                      | Update |
| `docs/architecture.md` | `Error and Degradation Strategy`               | Update |
| `docs/architecture.md` | `Rendering Is Independent of Transmission`     | Update |
| `.github/roadmap.md`   | `Near-Term` -> `Send Rendered Output to Pixoo` | Update |

`docs/poc-checklist.md` and `experiments/pixoo-poc/index.ts` remain reference artifacts for protocol behavior in this phase; no content edits are required unless implementation findings differ from recorded PoC behavior.

#### Implementation Notes

- Keep protocol primitives private to infra (`PixooApiRequest`, `PixooApiResponse`) and expose only stable transport-facing types from package index.
- Validation order inside `sendFrame`: `PixelBuffer` invariant check -> payload encode -> get `PicID` -> send command -> classify response.
- For deterministic tests, mock the HTTP adapter rather than real `fetch`; assert exact command body fields used for both `GetHttpGifId` and `SendHttpGif`.
- Explicitly fail fast when input is not 64x64 or byte length is inconsistent with RGBA expectations; return `kind: "validation"`.
- Do not call the PoC legacy batched helper path or carry `V4_UPLOAD_MODE` behavior into production code.

#### Verification

**Automated:**

```bash
npm run build
npm test
npm run lint
npm run format:check
```

**Behavioral checks** (manual CLI invocations or observable output changes):

- Hardware-independent: run infra unit tests and confirm `PixelBuffer` RGBA input is converted to RGB base64 with expected byte count (`12_288` raw bytes before base64).
- Hardware-independent: run a mocked send-path integration test in app/infra boundary and confirm renderer output buffer is handed to infra without protocol fields leaking into app or renderer.
- Hardware-required (narrow): with `PIXOO_HOST` set and device reachable, run the Phase 4 send command once and confirm the Pixoo display updates to the expected frame.
- Hardware-required (narrow): trigger one known failure scenario (wrong host or powered-off device) and confirm the process returns typed `network` failure information without crashing unrelated rendering code.
- Regression guard: confirm no code path constructs `PicNum > 1` payloads in this phase implementation.
