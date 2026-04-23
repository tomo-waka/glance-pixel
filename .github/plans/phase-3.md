### Phase 3: Renderer Local Preview Pipeline

_Define the renderer-side design for composing a deterministic 64x64 frame and exporting a local PNG preview so rendering can be validated without a physical device._

#### Status

- [x] Planned
- [ ] In progress
- [ ] Completed

#### Design References

- [../instructions/architecture.instructions.md](../instructions/architecture.instructions.md) - package dependency graph and renderer ownership constraints
- [../instructions/domain-model.instructions.md](../instructions/domain-model.instructions.md) - canonical `PixelBuffer` contract and 64x64 frame invariants
- [../instructions/testing.instructions.md](../instructions/testing.instructions.md) - device/network-independent test strategy expectations
- [../../docs/architecture.md](../../docs/architecture.md) - rationale for renderer/transmission separation and local preview requirement
- [../../docs/poc-checklist.md](../../docs/poc-checklist.md) - device validation context; confirms local preview can be verified independently
- [../plans/phase-2.md](../plans/phase-2.md) - package scaffolding and import-boundary lint enforcement inherited by this phase

#### Design Decisions

- **Renderer composition API shape**: Implement renderer-owned APIs in `glance-pixel-renderer` as pure functions over core data contracts:
	- `composeFrame(input: ComposeFrameInput): PixelBuffer`
	- `exportFramePreviewPng(frame: PixelBuffer, options?: PreviewExportOptions): Promise<PreviewExportResult>`
	- `composeAndExportPreview(input: ComposeFrameInput, options?: PreviewExportOptions): Promise<PreviewExportResult>`
- **Composition input contract**: `ComposeFrameInput` is renderer-local and uses core `PixelBuffer`, not infra/app types. Each layer entry contains `{ pixels, x, y }` and z-order is array order (later entries render on top), matching core placement semantics.
- **Ownership boundary (core vs renderer)**: `glance-pixel-core` remains type/interface-only and does not gain renderer behavior. All composition/export implementations and helper types are owned by `glance-pixel-renderer`. No `glance-pixel-renderer` import from `glance-pixel-infra`.
- **Frame invariants**: `composeFrame` always returns a `PixelBuffer` of exactly 64x64 RGBA (`Uint8ClampedArray` length 16_384). Out-of-bounds source pixels are clipped (never wrapped, never resized).
- **Alpha and overlap behavior**: Per-pixel alpha blending is deterministic and performed in stable placement order. Given the same ordered input buffers, output bytes are identical across runs.
- **Output path/config ownership at this stage**: Path selection is caller-provided via `PreviewExportOptions.outputPath`. Renderer does not read environment variables and does not depend on infra config loading in this phase.
- **Default output location**: If `outputPath` is omitted, write to `out/previews/phase-3/preview-64x64.png` (workspace-relative from process cwd).
- **Deterministic naming strategy**: Default filename is fixed (`preview-64x64.png`) to provide predictable artifact location for manual inspection and CI scripts.
- **Overwrite vs timestamp policy**: Default behavior is overwrite-in-place. Timestamped or incremented filenames are explicitly out of scope for this phase to preserve deterministic artifact paths.
- **node-canvas dependency placement**: Add `canvas` (`node-canvas`) only to `glance-pixel-renderer` runtime dependencies. Do not add `canvas` to `glance-pixel-core`, `glance-pixel-infra`, or `glance-pixel-app`.
- **PixelBuffer -> PNG conversion path**: Convert composited `PixelBuffer` to `ImageData` and write with `canvas`:
	- `createCanvas(64, 64)`
	- `ctx.putImageData(new ImageData(frame.data, frame.width, frame.height), 0, 0)`
	- `canvas.toBuffer("image/png")` then write to disk.
- **Directory handling**: Preview export creates parent directories when missing. Export failure surfaces as rejected promise with contextual error including target path.
- **Phase-2 boundary enforcement integration**: New imports in renderer must satisfy Phase 2 lint rules (`eslint/no-restricted-imports`). Any attempt to source preview configuration from infra is treated as a design violation.
- **Validation split (unit vs manual)**:
	- Unit tests validate composition correctness, clipping, z-order, alpha blend determinism, and export-path behavior.
	- Manual behavioral validation confirms PNG artifact existence and visual correctness without connecting a Pixoo device.

#### Non-Goals

- Implementing Pixoo transmission logic (`Draw/SendHttpGif`) or any device-facing HTTP behavior.
- Introducing app-level runtime configuration plumbing (env-based preview path wiring belongs to a later phase that introduces app/infra config flow).
- Implementing live widget scheduling/reactive update orchestration (`updates$` loop).
- Adding timestamped preview history management, artifact retention policies, or multi-file export rotation.
- Pixel-aesthetic tuning (fonts/icons/layout polish); this phase validates deterministic composition and export pipeline only.

#### Target Files

| File                                                            | Action | Notes                                                                                                  |
| --------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| `packages/glance-pixel-renderer/package.json`                   | Modify | Add `canvas` dependency and `preview` script entry if absent.                                          |
| `packages/glance-pixel-renderer/src/index.ts`                   | Modify | Export composition and preview APIs.                                                                   |
| `packages/glance-pixel-renderer/src/composition/compose-frame.ts` | Create | Deterministic 64x64 compositor using ordered layer placement and alpha blending.                       |
| `packages/glance-pixel-renderer/src/preview/export-preview-png.ts` | Create | PNG export function, default path policy, directory creation, and overwrite behavior.                  |
| `packages/glance-pixel-renderer/src/preview/compose-and-export.ts` | Create | Convenience orchestration API combining composition and export in one call.                            |
| `packages/glance-pixel-renderer/src/types.ts`                   | Create | Renderer-local input/output types (`ComposeFrameInput`, `PreviewExportOptions`, `PreviewExportResult`). |
| `packages/glance-pixel-renderer/src/composition/compose-frame.spec.ts` | Create | Unit tests for deterministic composition, clipping, z-order, and alpha overlap handling.               |
| `packages/glance-pixel-renderer/src/preview/export-preview-png.spec.ts` | Create | Unit tests for default path, overwrite behavior, and invalid path error handling.                      |
| `packages/glance-pixel-renderer/src/fixtures/*.ts`              | Create | Test fixture pixel buffers with explicit expected composited outputs.                                  |
| `packages/glance-pixel-renderer/scripts/generate-preview.ts`    | Create | Manual verification entrypoint that writes deterministic preview PNG without requiring hardware.        |
| `README.md`                                                     | Modify | Update package status and add local preview execution command once implemented.                         |

#### Documentation Touchpoints

| File                     | Section                                  | Action |
| ------------------------ | ---------------------------------------- | ------ |
| `README.md`              | `Architecture & Packages`                | Update |
| `README.md`              | `Run (development)` / preview usage area | Update |
| `docs/architecture.md`   | `Design Principles` (local preview text) | Update |
| `docs/architecture.md`   | `Rendering Is Independent of Transmission` | Update |
| `.github/roadmap.md`     | `Near-Term` -> `Static Local Rendering`  | Update |

No instructions-file content changes are required for this phase design because architecture, domain model, and testing guidance already match the resolved approach.

#### Implementation Notes

- Keep composition logic independent from `canvas`; only preview export should require `canvas`. This keeps core rendering tests fast and deterministic.
- Use small explicit fixture buffers (e.g., 2x2, 4x4) for composition correctness tests, then add one 64x64 integration-like test for frame-size invariant coverage.
- For overwrite verification, assert a single deterministic output path is reused across repeated exports rather than asserting file timestamp values.
- Ensure all public renderer exports are named exports to avoid accidental API drift during later app integration phases.

#### Verification

**Automated:**

```bash
npm run build
npm test
npm run lint
npm run format:check
```

**Behavioral checks** (manual CLI invocations or observable output changes):

- Run the renderer preview entrypoint (for example, `npm run -w glance-pixel-renderer preview`) and confirm `out/previews/phase-3/preview-64x64.png` is created without a Pixoo device.
- Re-run the same preview command and confirm the same file path is updated (overwrite behavior), with no additional timestamped files created.
- Open the generated PNG and confirm expected layer ordering (top layer visually overrides lower layer where overlapping).
- Temporarily pass an invalid output path and confirm command failure reports the target path in the error message.
