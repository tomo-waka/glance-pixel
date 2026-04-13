# PoC Checklist — Milestone 1: Pixoo API Connectivity

This document defines what must be verified before proceeding to Milestone 2.

## Setup

1. Pixoo 64 is powered on and connected to the local network.
2. The device IP address is known and set in `experiments/pixoo-poc/.env`:
   ```
   PIXOO_HOST=192.168.x.x
   ```
3. Run the PoC script: `npx ts-node experiments/pixoo-poc/index.ts`

---

## Verification Items

### V1 — HTTP Reachability

**Question:** Can the host machine send an HTTP request to the device and receive a response?

| Result                          | Action                                                 |
| ------------------------------- | ------------------------------------------------------ |
| ✅ Response received            | Proceed to V2                                          |
| ❌ Connection refused / timeout | Check device IP, firewall, and network; do not proceed |

---

### V2 — Image Send and Display

**Question:** Can a 64×64 RGB image be sent to the device and appear on the screen?

The PoC script sends a solid red 64×64 frame.

| Result                                      | Action                            |
| ------------------------------------------- | --------------------------------- |
| ✅ Red frame appears on device              | Proceed to V3                     |
| ❌ Request succeeds but no change on device | Investigate API payload format    |
| ❌ Request fails                            | Log response body and investigate |

---

### V3 — Image Update

**Question:** Can the displayed image be updated at an arbitrary time after the first send?

The PoC script waits 3 seconds, then sends a solid blue frame.

| Result                              | Action                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| ✅ Display changes from red to blue | Proceed to V4                                                                   |
| ❌ Display does not change          | Investigate whether a different API endpoint or parameter is needed for updates |

---

### V4 — Device-Side Frame Rotation (informational)

**Question:** Does the Pixoo API support sending multiple frames and having the device rotate through them autonomously?

This item does not block Milestone 2, but the answer determines the Scene rotation architecture:

| Result                                | Design implication                                                  |
| ------------------------------------- | ------------------------------------------------------------------- |
| ✅ Device rotates frames autonomously | Scene rotation can be offloaded to device; host sends a batch       |
| ❌ No native rotation support         | Host must implement the rotation loop (timer-based frame switching) |

Record the result here before proceeding.

---

## Pass Criteria for Milestone 1

All of **V1**, **V2**, and **V3** must pass.  
V4 must be attempted and its result recorded, but does not block progression.

Once Milestone 1 passes, update `copilot-instructions.md` to reflect **Current Milestone: 2**.

---

## Notes

Record any relevant findings here during the PoC run:

- Pixoo API base URL: `http://<PIXOO_HOST>/post`
- Image format observed: _(fill in after PoC)_
- V4 result: _(fill in after PoC)_
- Unexpected behaviour: _(fill in if any)_
