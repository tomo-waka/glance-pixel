# PoC Checklist — Pixoo API Connectivity

This document defines what must be verified before proceeding to actual development

## Setup

1. Pixoo 64 is powered on and connected to the local network.
2. Resolve the device IP in one of these ways:
   - Set `PIXOO_HOST` in `experiments/pixoo-poc/.env`.
   - Or let the PoC discover the device through Divoom's same-LAN API.
   - If discovery returns multiple devices, set `PIXOO_DEVICE_NAME` as well.

   ```
   # Optional explicit IP
   PIXOO_HOST=192.168.x.x

   # Optional disambiguation when multiple Divoom devices exist
   PIXOO_DEVICE_NAME=Pixoo-64
   ```

   Copy `.env.example` to `.env` and fill in only the values you need.

3. Run the PoC script from the project root:
   ```
   npx tsx --env-file experiments/pixoo-poc/.env experiments/pixoo-poc/index.ts
   ```
4. Optional: list Divoom devices discovered on the same LAN before running the PoC:
   ```
   npx tsx experiments/pixoo-poc/discover.ts
   ```
5. Optional: choose V4 upload mode in `.env` for protocol comparison:

   ```
   # default if omitted
   V4_UPLOAD_MODE=sequential

   # legacy hypothesis test
   # V4_UPLOAD_MODE=batched
   ```

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

This item does not block actual development, but the answer determines the Scene rotation architecture:

| Result                                | Design implication                                                  |
| ------------------------------------- | ------------------------------------------------------------------- |
| ✅ Device rotates frames autonomously | Scene rotation can be offloaded to device; host uploads frame sets  |
| ❌ No native rotation support         | Host must implement the rotation loop (timer-based frame switching) |

Record the result here before proceeding.

---

## Pass Criteria

All of **V1**, **V2**, and **V3** must pass.  
V4 must be attempted and its result recorded, but does not block progression.

---

## Notes

Record any relevant findings here during the PoC run:

- Pixoo API base URL: `http://<PIXOO_HOST>/post`
- Discovery endpoint: `https://app.divoom-gz.com/Device/ReturnSameLANDevice`
- Image format: RGB flat array (no alpha), 3 bytes/pixel, 64×64 = 12 288 bytes per frame, base64-encoded as `PicData`
- Command for sending: `Draw/SendHttpGif`. Counter fetched first via `Draw/GetHttpGifId`.
- V4 result: Success with `V4_UPLOAD_MODE=sequential` (one request per frame, incrementing `PicOffset` and resetting GIF upload state first). The device rotated red and blue frames autonomously.
- Unexpected behaviour: The legacy batched multi-frame approach (`V4_UPLOAD_MODE=batched`) previously triggered `ECONNRESET` and device reboot on the tested Pixoo64.
