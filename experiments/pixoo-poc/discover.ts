const DIVOOM_DISCOVERY_URL = "https://app.divoom-gz.com/Device/ReturnSameLANDevice";

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

async function main(): Promise<void> {
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

  const devices = Array.isArray(data["DeviceList"]) ? data["DeviceList"] : [];
  if (devices.length === 0) {
    console.log("No Divoom devices found on the same LAN.");
    return;
  }

  console.log("Discovered Divoom devices:");
  for (const device of devices) {
    const name = typeof device["DeviceName"] === "string" ? device["DeviceName"] : "<unknown-name>";
    const ip =
      typeof device["DevicePrivateIP"] === "string" ? device["DevicePrivateIP"] : "<unknown-ip>";
    console.log(`- ${name}: ${ip}`);
  }
}

main().catch((err: unknown) => {
  console.error("Discovery failed:", err);
  process.exit(1);
});
