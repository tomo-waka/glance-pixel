### Phase 1: PoC Findings Consolidation

_Confirm completed Pixoo PoC outcomes and preserve implementation-critical findings in stable project documents so subsequent phases can rely on verified protocol behavior rather than assumptions._

#### Status

- [x] Planned
- [ ] In progress
- [ ] Completed

#### Design References

- [../instructions/development-workflow.instructions.md](../instructions/development-workflow.instructions.md) - Stage 1e and 1f planning-completion requirements
- [../roadmap.md](../roadmap.md) - Near-Term items that depend on PoC completion
- [../../docs/poc-checklist.md](../../docs/poc-checklist.md) - PoC verification records and V4 protocol notes

#### Design Decisions

- **Preferred documentation source of truth**: Keep detailed PoC verification outcomes in docs/poc-checklist.md; keep short derived constraints in roadmap item notes where release planning depends on them.
- **Owning layer**: Documentation-only phase (no package-layer code ownership).
- **Data to preserve**: Sequential multi-frame upload success pattern (reset + per-frame PicOffset) and legacy batched upload instability (ECONNRESET/reboot risk) must be explicitly preserved.
- **New runtime dependencies**: None.
- **Edge case behavior**: If PoC evidence is incomplete or contradictory, phase exits as blocked and must not convert uncertain behavior into design facts.

#### Non-Goals

- Implementing production Pixoo client abstractions.
- Refactoring or extending experiments/pixoo-poc scripts beyond clarification-level documentation alignment.
- Introducing weather, rendering, or app-loop features.

#### Target Files

| File                    | Action | Notes                                                                                                                                              |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/roadmap.md`    | Modify | Add release-target annotation and concise design-resolution notes to selected near-term items where PoC constraints affect implementation choices. |
| `docs/poc-checklist.md` | Modify | Ensure V4 result and protocol caveats are captured clearly enough for future implementation sessions.                                              |
| `.github/PLAN.md`       | Modify | Keep phase status and scope wording aligned with confirmed PoC findings if adjustments are needed.                                                 |

#### Documentation Touchpoints

| File                    | Section                                                    | Action |
| ----------------------- | ---------------------------------------------------------- | ------ |
| `docs/poc-checklist.md` | `Notes`, `V4 - Device-Side Frame Rotation (informational)` | Update |
| `.github/roadmap.md`    | `Near-Term` item notes                                     | Update |
| `.github/PLAN.md`       | `Scope Summary` (if PoC-driven constraints alter wording)  | Update |

#### Implementation Notes

- Treat this phase as a planning-safety gate: future implementation phases may assume only what is documented here.
- Prefer additive wording updates over structural rewrites so historical context of the PoC remains visible.
- Normal phase execution aims for autonomous LLM implementation based on detailed design.
- For this phase, however, the Human must make the value judgments about what PoC outcomes to evaluate and what to preserve as durable documentation, so execution proceeds interactively between Human and LLM.

#### Verification

**Automated:**

```bash
npm run build
npm test
npm run format:check
```

**Behavioral checks** (manual CLI invocations or observable output changes):

- Cross-check docs/poc-checklist.md statements against experiments/pixoo-poc/index.ts flow for V1-V4.
- Confirm roadmap near-term sequence remains logically consistent after adding PoC-derived notes.
- Confirm no package source files were changed in this phase.
