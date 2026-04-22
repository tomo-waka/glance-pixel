### Phase 2: Package Foundations and Core Contracts

_Create the monorepo package skeleton and establish canonical domain contracts in glance-pixel-core so later phases can build renderer, infra, and app behavior without reopening package-boundary decisions._

#### Status

- [x] Planned
- [ ] In progress
- [ ] Completed

#### Design References

- [../instructions/architecture.instructions.md](../instructions/architecture.instructions.md) - package dependency graph and prohibited dependencies
- [../instructions/domain-model.instructions.md](../instructions/domain-model.instructions.md) - canonical core type definitions
- [../instructions/development-workflow.instructions.md](../instructions/development-workflow.instructions.md) - Stage 1e design completion requirements
- [../../docs/architecture.md](../../docs/architecture.md) - architecture intent and package responsibilities

#### Design Decisions

- **Workspace package set**: Create four workspace packages exactly as defined by architecture: glance-pixel-core, glance-pixel-renderer, glance-pixel-infra, glance-pixel-app.
- **Preferred TypeScript layout**: Use package-local `src/` with explicit `index.ts` exports and package-local `tsconfig.json` extending root `tsconfig.json`.
- **Owning layer**: Domain contracts are owned only by glance-pixel-core; renderer, infra, and app expose only minimal placeholders in this phase.
- **Dependency boundaries**: Enforce architecture graph in package.json dependencies: renderer and infra depend only on core; app depends on core, renderer, infra; core depends only on rxjs externally.
- **Lint-enforced boundary policy**: Add package-boundary checks in oxlint using `eslint/no-restricted-imports` so prohibited cross-layer imports fail lint.
- **Boundary rule scope**: Configure `.oxlintrc.json` with path/pattern restrictions covering at least renderer -> infra, infra -> renderer, and core -> (renderer|infra|app) forbidden directions.
- **Core API shape**: Implement domain-model interfaces and types from domain-model.instructions.md in core as the canonical exported contract (PixelBuffer, Widget, Frame, Scene, Weather types, widget config types).
- **Runtime implementation scope**: This phase defines type contracts and package wiring only; no Pixoo HTTP logic, weather API mapping, frame composition algorithm, or app runtime loop.
- **Verification pipeline baseline**: Add root test script delegation (`npm run test --workspaces --if-present`) so release-level verification commands are consistently runnable even before substantive tests exist.
- **New runtime dependencies**: Add rxjs to glance-pixel-core only; do not add node-canvas in this phase.
- **Edge case behavior**: If any required cross-package import would violate dependency rules, replace the import with a core interface or type export rather than relaxing package boundaries.

#### Non-Goals

- Implementing actual renderer composition, PNG export, or widget drawing logic.
- Implementing Pixoo client, weather provider client, config loader, or logger runtime behavior.
- Implementing application orchestration loop or scheduling logic.
- Adding weather-specific behavior beyond core type contracts.

#### Target Files

| File                                           | Action | Notes                                                                                                        |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| `package.json`                                 | Modify | Ensure workspace scripts include test delegation and remain compatible with package-level scripts.           |
| `tsconfig.json`                                | Modify | Keep strict shared compiler options and align with workspace package compilation strategy.                   |
| `.oxlintrc.json`                               | Modify | Add `eslint/no-restricted-imports` configuration to enforce architecture direction constraints at lint time. |
| `packages/glance-pixel-core/package.json`      | Create | Define core package metadata and dependencies (`rxjs` only external runtime dependency).                     |
| `packages/glance-pixel-core/tsconfig.json`     | Create | Package TypeScript config extending root settings.                                                           |
| `packages/glance-pixel-core/src/index.ts`      | Create | Export canonical domain contracts and type aliases defined in this phase.                                    |
| `packages/glance-pixel-renderer/package.json`  | Create | Define renderer package metadata with dependency on core only.                                               |
| `packages/glance-pixel-renderer/tsconfig.json` | Create | Package TypeScript config extending root settings.                                                           |
| `packages/glance-pixel-renderer/src/index.ts`  | Create | Minimal renderer placeholder exports without rendering logic.                                                |
| `packages/glance-pixel-infra/package.json`     | Create | Define infra package metadata with dependency on core only.                                                  |
| `packages/glance-pixel-infra/tsconfig.json`    | Create | Package TypeScript config extending root settings.                                                           |
| `packages/glance-pixel-infra/src/index.ts`     | Create | Minimal infra placeholder exports without I/O logic.                                                         |
| `packages/glance-pixel-app/package.json`       | Create | Define app package metadata with dependencies on core, renderer, infra.                                      |
| `packages/glance-pixel-app/tsconfig.json`      | Create | Package TypeScript config extending root settings.                                                           |
| `packages/glance-pixel-app/src/index.ts`       | Create | Minimal app entry placeholder export without runtime loop implementation.                                    |
| `README.md`                                    | Modify | Update package status wording to reflect scaffolded packages and clarify remaining implementation phases.    |

#### Documentation Touchpoints

| File                   | Section                                                                     | Action |
| ---------------------- | --------------------------------------------------------------------------- | ------ |
| `README.md`            | `Architecture & Packages`                                                   | Update |
| `docs/architecture.md` | `Package Dependency Graph` (only if wording is now stale after scaffolding) | Update |

#### Implementation Notes

- Prefer stable, explicit named exports from core to avoid churn in downstream package imports.
- Keep placeholder modules intentionally small to minimize overlap with later phases that add concrete behavior.
- Do not introduce temporary cross-package shortcuts that violate architecture boundaries, even for bootstrap convenience.

#### Verification

**Automated:**

```bash
npm install
npm run build
npm test
npm run lint
npm run format:check
```

**Behavioral checks** (manual CLI invocations or observable output changes):

- Confirm `npm run build` succeeds with all four workspace packages present.
- Confirm package dependency directions match architecture rules (no renderer-infra coupling).
- Confirm boundary-violation imports are rejected by oxlint via `eslint/no-restricted-imports`.
- Confirm core exports include the canonical domain contracts required by later phases.
