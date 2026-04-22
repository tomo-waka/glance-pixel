# GlancePixel - v0.1.0 Release Plan

## Overview

Initial baseline release for GlancePixel.
This release establishes a documented and executable foundation from validated Pixoo PoC knowledge through to clock-driven live updates, while deliberately deferring weather and reliability hardening to the next release.
No breaking-change guarantees are introduced in this release.

## Release Goals

- Preserve and formalize verified Pixoo PoC findings as project documentation and design constraints.
- Establish package-layer foundations aligned with architecture rules.
- Validate local rendering flow with device-independent PNG preview.
- Validate host-to-device frame send path against Pixoo 64.
- Deliver dynamic clock-only reactive update flow end-to-end.

## Scope Summary

### Included in v0.1.0

- PoC findings confirmation and documentation consolidation for future implementation safety.
- Core package contracts and renderer baseline required for 64x64 frame generation.
- Local PNG preview path for rendering validation without physical device dependency.
- Pixoo transport integration path for sending rendered output to device.
- Dynamic clock-only widget update pipeline in the application loop.

### Explicitly excluded from v0.1.0

- Weather provider integration and weather widget rendering.
- Reliability hardening (retry/backoff policy, stale-data UX, structured logging standardization).
- Raspberry Pi operationalization (systemd, ARM runtime validation, deployment profile).

## Development Phases

### Phase 1: PoC Findings Consolidation

- **File**: [plans/phase-1.md](plans/phase-1.md)
- **Status**: Planned

### Phase 2: Package Foundations and Core Contracts

- **File**: [plans/phase-2.md](plans/phase-2.md)
- **Status**: Planned

### Phase 3: Renderer Local Preview Pipeline

- **File**: [plans/phase-3.md](plans/phase-3.md)
- **Status**: Planned

### Phase 4: Pixoo Send Path Integration

- **File**: [plans/phase-4.md](plans/phase-4.md)
- **Status**: Planned

### Phase 5: Dynamic Clock Update Loop

- **File**: [plans/phase-5.md](plans/phase-5.md)
- **Status**: Planned

## Release Tasks

### Documentation Update

- **Status**: Planned
- Update CHANGELOG.md with v0.1.0 release entries and rationale.
- Review README.md for scope accuracy and runnable command consistency.
- Update docs/ and .github/instructions/ sections that changed due to implemented phases.
- Remove roadmap entries annotated with Release target: v0.1.0 after release completion.

### Verification

- npm run build
- npm test
- npm run format:check
- Perform release-level smoke checks defined in each completed phase file.

## Final Verification Checklist

- [ ] All planned phases are marked Completed in this PLAN.md.
- [ ] Phase verification results are reviewed and accepted.
- [ ] Documentation updates are completed (CHANGELOG, README, docs).
- [ ] roadmap.md cleanup for v0.1.0 targeted items is completed.
- [ ] Final build/test/format checks pass on trunk state.
