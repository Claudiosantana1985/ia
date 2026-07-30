const GRAPH = "https://graph.facebook.com/v21.0";

export type WhatsAppMedia = {
  base64: string;
  mediaType: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não configurado`);
  return value;
}

export async function sendWhatsAppText(to: string, body: string) {
  const token = requireEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");

  const response = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: body.slice(0, 4000) },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`WhatsApp send failed [${response.status}]: ${errorBody}`);
    throw new Error(`WhatsApp send failed [${response.status}]: ${errorBody}`);
  }
}

export async function markAsRead(messageId: string) {
  const token = requireEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
  await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
  }).catch((error) => console.error("Erro ao marcar como lida", error));
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<WhatsAppMedia | null> {
  const token = requireEnv("WHATSAPP_ACCESS_TOKEN");

  const metaResponse = await fetch(`${GRAPH}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaResponse.ok) {
    console.error(`WhatsApp media meta failed [${metaResponse.status}]: ${await metaResponse.text()}`);
    return null;
  }
  const meta = (await metaResponse.json()) as { url?: string; mime_type?: string };
  if (!meta.url) return null;

  const fileResponse = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!fileResponse.ok) {
    console.error(`WhatsApp media download failed [${fileResponse.status}]`);
    return null;
  }

  const buffer = new Uint8Array(await fileResponse.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]);

  return {
    base64: btoa(binary),
    mediaType: (meta.mime_type ?? "application/octet-stream").split(";")[0],
  };
}


export async function verifySignatureAsync(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const received = signatureHeader.slice("sha256=".length);

  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  return diff === 0;
}
