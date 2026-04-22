/**
 * Pixoo 64 PoC — Milestone 1: API Connectivity
 *
 * Covers verification items V1–V4 from docs/poc-checklist.md.
 *
 * Run from project root:
 *   npx tsx --env-file experiments/pixoo-poc/.env experiments/pixoo-poc/index.ts
 */

const PIXOO_SIZE = 64;
const DIVOOM_DISCOVERY_URL = "https://app.divoom-gz.com/Device/ReturnSameLANDevice";
// The Pixoo API expects RGB (no alpha channel): 3 bytes per pixel.
const BYTES_PER_PIXEL = 3;

type PixooResponse = {
  error_code: number;
  [key: string]: unknown;
};

type V4UploadMode = "sequential" | "batched";

type DivoomDevice = {
  DeviceName?: string;
  DevicePrivateIP?: string;
  [key: string]: unknown;
};

type DivoomDiscoveryResponse = {
  ReturnCode: number;
  DeviceList?: DivoomDevice[];
  [key: string]: unknown;
};

async function discoverDevices(): Promise<DivoomDevice[]> {
  const res = await fetch(DIVOOM_DISCOVERY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as DivoomDiscoveryResponse;
  if (data["ReturnCode"] !== 0) {
    throw new Error(`ReturnSameLANDevice returned error: ${JSON.stringify(data)}`);
  }

  return Array.isArray(data["DeviceList"]) ? data["DeviceList"] : [];
}

function getDeviceLabel(device: DivoomDevice): string {
  const name = typeof device["DeviceName"] === "string" ? device["DeviceName"] : "<unknown-name>";
  const ip =
    typeof device["DevicePrivateIP"] === "string" ? device["DevicePrivateIP"] : "<unknown-ip>";
  return `${name} (${ip})`;
}

async function resolvePixooHost(): Promise<string> {
  const configuredHost = process.env["PIXOO_HOST"];
  if (configuredHost) {
    console.log(`[setup] Using PIXOO_HOST from environment: ${configuredHost}`);
    return configuredHost;
  }

  console.log("[setup] PIXOO_HOST is not set. Discovering devices via Divoom same-LAN API...");

  const devices = await discoverDevices();
  if (devices.length === 0) {
    throw new Error(
      "No Divoom devices were returned by ReturnSameLANDevice. Make sure the Pixoo is powered on, connected to the same LAN, and allowed to reach Divoom's cloud service.",
    );
  }

  const configuredName = process.env["PIXOO_DEVICE_NAME"];
  if (configuredName) {
    const matchedDevice = devices.find((device) => device["DeviceName"] === configuredName);

    if (!matchedDevice || typeof matchedDevice["DevicePrivateIP"] !== "string") {
      const availableDevices = devices.map(getDeviceLabel).join(", ");
      throw new Error(
        `PIXOO_DEVICE_NAME=${configuredName} was not found. Available devices: ${availableDevices}`,
      );
    }

    console.log(`[setup] Discovered target by PIXOO_DEVICE_NAME: ${getDeviceLabel(matchedDevice)}`);
    return matchedDevice["DevicePrivateIP"];
  }

  if (devices.length > 1) {
    const deviceList = devices.map(getDeviceLabel).join("\n  - ");
    throw new Error(
      `Multiple Divoom devices were discovered. Set PIXOO_DEVICE_NAME or PIXOO_HOST.\n  - ${deviceList}`,
    );
  }

  const [device] = devices;
  if (typeof device?.["DevicePrivateIP"] !== "string") {
    throw new Error(
      `Discovery returned a device without DevicePrivateIP: ${JSON.stringify(device)}`,
    );
  }

  console.log(`[setup] Discovered device: ${getDeviceLabel(device)}`);
  return device["DevicePrivateIP"];
}

async function post(host: string, body: unknown): Promise<PixooResponse> {
  const url = `http://${host}/post`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<PixooResponse>;
}

function buildSolidFrame(r: number, g: number, b: number): Uint8Array {
  const buf = new Uint8Array(PIXOO_SIZE * PIXOO_SIZE * BYTES_PER_PIXEL);
  for (let i = 0; i < PIXOO_SIZE * PIXOO_SIZE; i++) {
    buf[i * 3 + 0] = r;
    buf[i * 3 + 1] = g;
    buf[i * 3 + 2] = b;
  }
  return buf;
}

/**
 * Concatenates one or more RGB frames into a single base64 string.
 * When PicNum > 1, the device expects all frames packed end-to-end in PicData.
 */
function encodeFrames(frames: Uint8Array[]): string {
  const totalBytes = frames.reduce((sum, f) => sum + f.length, 0);
  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const frame of frames) {
    combined.set(frame, offset);
    offset += frame.length;
  }
  return Buffer.from(combined).toString("base64");
}

function encodeFrame(frame: Uint8Array): string {
  return Buffer.from(frame).toString("base64");
}

/**
 * Returns the next safe PicID to use.
 * The device caches GIF frames by ID; incrementing avoids serving stale frames.
 */
async function getNextPicId(host: string): Promise<number> {
  const data = await post(host, { Command: "Draw/GetHttpGifId" });
  if (data["error_code"] !== 0) {
    throw new Error(`Draw/GetHttpGifId returned error: ${JSON.stringify(data)}`);
  }
  return (data["PicId"] as number) + 1;
}

async function sendFrames(
  host: string,
  picId: number,
  frames: Uint8Array[],
  speedMs: number = 1000,
): Promise<void> {
  const data = await post(host, {
    Command: "Draw/SendHttpGif",
    PicNum: frames.length,
    PicWidth: PIXOO_SIZE,
    PicOffset: 0,
    PicID: picId,
    PicSpeed: speedMs,
    PicData: encodeFrames(frames),
  });
  if (data["error_code"] !== 0) {
    throw new Error(`Draw/SendHttpGif returned error: ${JSON.stringify(data)}`);
  }
}

async function sendFramesSequential(
  host: string,
  picId: number,
  frames: Uint8Array[],
  speedMs: number = 1000,
): Promise<void> {
  for (let offset = 0; offset < frames.length; offset++) {
    const frame = frames[offset];
    const encodedFrame = encodeFrame(frame);
    const data = await post(host, {
      Command: "Draw/SendHttpGif",
      PicNum: frames.length,
      PicWidth: PIXOO_SIZE,
      PicOffset: offset,
      PicID: picId,
      PicSpeed: speedMs,
      PicData: encodedFrame,
    });

    if (data["error_code"] !== 0) {
      throw new Error(
        `Draw/SendHttpGif (offset=${offset}) returned error: ${JSON.stringify(data)}`,
      );
    }

    console.log(
      `[V4][sequential] Uploaded frame ${offset + 1}/${frames.length} (rawBytes=${frame.length}, base64Bytes=${encodedFrame.length}).`,
    );
  }
}

async function resetGifId(host: string): Promise<void> {
  const data = await post(host, { Command: "Draw/ResetHttpGifId" });
  if (data["error_code"] !== 0) {
    throw new Error(`Draw/ResetHttpGifId returned error: ${JSON.stringify(data)}`);
  }
}

function resolveV4UploadMode(): V4UploadMode {
  const configuredMode = process.env["V4_UPLOAD_MODE"];

  if (configuredMode === "sequential" || configuredMode === "batched") {
    return configuredMode;
  }

  if (configuredMode) {
    console.warn(`[setup] Unknown V4_UPLOAD_MODE=${configuredMode}. Falling back to sequential.`);
  }

  return "sequential";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }

  return String(err);
}

async function main(): Promise<void> {
  const host = await resolvePixooHost();
  const v4UploadMode = resolveV4UploadMode();

  console.log(`Target: http://${host}/post\n`);

  // ── V1: Reachability ──────────────────────────────────────────────────────
  console.log("[V1] Checking reachability via Channel/GetAllConf...");
  try {
    const conf = await post(host, { Command: "Channel/GetAllConf" });
    if (conf["error_code"] !== 0) {
      console.error("[V1] FAIL — Device responded with error:", conf);
      process.exit(1);
    }
    console.log("[V1] PASS — Device is reachable.\n");
  } catch (err) {
    console.error("[V1] FAIL — Could not reach device:", err);
    process.exit(1);
  }

  // ── V2: Send solid red ────────────────────────────────────────────────────
  console.log("[V2] Sending solid red frame...");
  const redFrame = buildSolidFrame(255, 0, 0);
  let picId = await getNextPicId(host);
  await sendFrames(host, picId, [redFrame]);
  console.log(`[V2] Sent (PicID=${picId}).`);
  console.log("[V2] → Verify: device should now show solid red.\n");

  // ── V3: Update to solid blue ──────────────────────────────────────────────
  console.log("[V3] Waiting 3 seconds...");
  await sleep(3000);
  console.log("[V3] Sending solid blue frame...");
  picId = await getNextPicId(host);
  const blueFrame = buildSolidFrame(0, 0, 255);
  await sendFrames(host, picId, [blueFrame]);
  console.log(`[V3] Sent (PicID=${picId}).`);
  console.log("[V3] → Verify: display should have changed from red to blue.\n");

  // ── V4: Device-side frame rotation (informational) ────────────────────────
  try {
    console.log("[V4] Waiting 2 seconds before multi-frame test...");
    await sleep(2000);
    console.log("[V4] Sending 2-frame animation (red → blue, 1 s per frame)...");
    console.log(`[V4] Upload mode: ${v4UploadMode}`);
    console.log("[V4] Resetting GIF upload state...");
    await resetGifId(host);
    picId = await getNextPicId(host);
    if (v4UploadMode === "sequential") {
      await sendFramesSequential(host, picId, [redFrame, blueFrame], 1000);
    } else {
      await sendFrames(host, picId, [redFrame, blueFrame], 1000);
    }
    console.log(`[V4] Sent 2-frame animation (PicID=${picId}).`);
    console.log("[V4] Observing for 6 seconds — watch the device...");
    await sleep(6000);
    console.log(
      "[V4] → Did the device cycle red → blue autonomously (without another HTTP request)?",
    );
    console.log("[V4] Record the result in docs/poc-checklist.md.\n");
  } catch (err) {
    console.error(`[V4] FAIL — Multi-frame send caused an error: ${getErrorMessage(err)}`);
    console.error(
      "[V4] Treat this as an informational failure. Record that host-side rotation is required unless a different Pixoo API path is found.",
    );
    console.error(
      "[V4] If the device rebooted, wait for it to reconnect before any further requests.\n",
    );
  }

  console.log(
    "PoC run complete. V1–V3 determine pass/fail; V4 is informational and should be recorded separately in docs/poc-checklist.md.",
  );
}

main().catch((err: unknown) => {
  console.error("Fatal:", err);
  process.exit(1);
});
