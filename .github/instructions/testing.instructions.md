---
applyTo: "packages/**/*.test.ts,packages/**/*.spec.ts"
---

# Testing Strategy

## What to Test Independently

The architecture is designed so that the following can be validated without a physical device or live network:

| Concern                                      | How to test                                                  |
| -------------------------------------------- | ------------------------------------------------------------ |
| Weather API response mapping                 | Unit test: raw API fixture → `WeatherSnapshot`               |
| `WeatherCondition` classification            | Unit test: condition code → union type member                |
| Widget snapshot output                       | Unit test: given config + mock data → `PixelBuffer` content  |
| Frame composition (z-order, x/y placement)   | Unit test: known widget buffers → expected composited buffer |
| Widget lifecycle (`activate` / `deactivate`) | Unit test with RxJS `TestScheduler`                          |
| Refresh scheduling and throttling            | Unit test with RxJS `TestScheduler`                          |
| Config loading and validation                | Unit test: env vars → typed config object or thrown error    |
| Device adapter interface                     | Unit test against a mock transport, not a real device        |

## What Not to Unit Test

- Pixel-perfect visual output (test correctness of composition logic, not aesthetics)
- Live Pixoo device communication (use integration/manual tests for this)
- Live weather API responses (use recorded fixtures instead)

## Testing Tools

- **Jest** with `ts-jest` for all packages
- **RxJS `TestScheduler`** for time-dependent observable behaviour
- **Recorded API fixtures** (JSON files in `__fixtures__/`) for weather API tests — never call live APIs in unit tests

## Test File Location

Co-locate tests with source:

```
packages/glance-pixel-infra/src/
  weather/
    openweathermap-client.ts
    openweathermap-client.test.ts   ← here
    __fixtures__/
      current-weather-clear.json
      current-weather-rain.json
```

## Observable Testing Pattern

Use `TestScheduler` for any test involving `throttleTime`, `debounceTime`, `delay`, or multi-widget merge behaviour:

```typescript
import { TestScheduler } from "rxjs/testing";

const scheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

scheduler.run(({ cold, expectObservable }) => {
  // define marble diagrams here
});
```

## Reliability Rules for Tests

- Tests must pass without a Pixoo device connected.
- Tests must pass without network access.
- Tests must be deterministic — no `setTimeout`, use `TestScheduler` instead.
- A widget test that requires a canvas context is acceptable; one that requires a device is not.
