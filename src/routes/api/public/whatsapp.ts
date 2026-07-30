import { createFileRoute } from "@tanstack/react-router";
import { generateText, type ModelMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { AUTOIA_SYSTEM_PROMPT } from "@/lib/system-prompt";
import {
  downloadWhatsAppMedia,
  markAsRead,
  sendWhatsAppText,
  verifySignatureAsync,
} from "@/lib/whatsapp.server";

type WhatsAppMediaRef = { id?: string; caption?: string; filename?: string };

type WhatsAppMessage = {
  id: string;
  from: string;
  type: string;
  text?: { body?: string };
  image?: WhatsAppMediaRef;
  audio?: WhatsAppMediaRef;
  video?: WhatsAppMediaRef;
  document?: WhatsAppMediaRef;
};

type WhatsAppWebhookBody = {
  entry?: {
    changes?: {
      value?: {
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: WhatsAppMessage[];
      };
    }[];
  }[];
};

const HISTORY_LIMIT = 20;

export const Route = createFileRoute("/api/public/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

        if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const rawBody = await request.text();
        const valid = await verifySignatureAsync(rawBody, request.headers.get("x-hub-signature-256"));
        if (!valid) return new Response("Invalid signature", { status: 401 });

        let payload: WhatsAppWebhookBody;
        try {
          payload = JSON.parse(rawBody) as WhatsAppWebhookBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        try {
          await handlePayload(payload);
        } catch (error) {
          console.error("Erro ao processar webhook do WhatsApp", error);
        }

        // A Meta reenvia o evento se não receber 200 rapidamente.
        return new Response("EVENT_RECEIVED", { status: 200 });
      },
    },
  },
});

async function handlePayload(payload: WhatsAppWebhookBody) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const messages = value?.messages ?? [];
      const profileName = value?.contacts?.[0]?.profile?.name ?? null;

      for (const message of messages) {
        // Idempotência: a Meta pode reenviar o mesmo evento.
        const { data: existing } = await supabaseAdmin
          .from("whatsapp_messages")
          .select("id")
          .eq("wa_message_id", message.id)
          .maybeSingle();
        if (existing) continue;

        const thread = await upsertThread(supabaseAdmin, message.from, profileName);
        if (!thread) continue;

        const mediaRef =
          message.image ?? message.audio ?? message.video ?? message.document ?? undefined;
        const caption = mediaRef?.caption ?? message.text?.body ?? "";

        await supabaseAdmin.from("whatsapp_messages").insert({
          thread_id: thread.id,
          wa_message_id: message.id,
          role: "user",
          content: caption || `[${message.type}]`,
          media_type: mediaRef ? message.type : null,
        });

        void markAsRead(message.id);

        const media = mediaRef?.id ? await downloadWhatsAppMedia(mediaRef.id) : null;
        const history = await loadHistory(supabaseAdmin, thread.id);

        const reply = await askAutoIa(history, caption, media, message.type);
        await sendWhatsAppText(message.from, reply);

        await supabaseAdmin.from("whatsapp_messages").insert({
          thread_id: thread.id,
          role: "assistant",
          content: reply,
        });
        await supabaseAdmin
          .from("whatsapp_threads")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", thread.id);
      }
    }
  }
}

type AdminClient = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

async function upsertThread(supabaseAdmin: AdminClient, waId: string, profileName: string | null) {
  const { data, error } = await supabaseAdmin
    .from("whatsapp_threads")
    .upsert(
      { wa_id: waId, profile_name: profileName, last_message_at: new Date().toISOString() },
      { onConflict: "wa_id" },
    )
    .select("id")
    .single();
  if (error) {
    console.error("Erro ao criar conversa do WhatsApp", error);
    return null;
  }
  return data;
}

async function loadHistory(supabaseAdmin: AdminClient, threadId: string) {
  const { data } = await supabaseAdmin
    .from("whatsapp_messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  return (data ?? [])
    .reverse()
    .slice(0, -1)
    .map((row) => ({
      role: row.role as "user" | "assistant",
      content: row.content,
    })) satisfies ModelMessage[];
}

async function askAutoIa(
  history: ModelMessage[],
  text: string,
  media: { base64: string; mediaType: string } | null,
  messageType: string,
): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    return "Estou temporariamente indisponível. Tente novamente em alguns minutos.";
  }

  const gateway = createLovableAiGatewayProvider(apiKey);

  const parts: Exclude<ModelMessage & { role: "user" }, never>["content"] = [];
  if (text) parts.push({ type: "text", text });
  if (media) {
    if (media.mediaType.startsWith("image/")) {
      parts.push({ type: "image", image: media.base64, mediaType: media.mediaType });
    } else {
      parts.push({
        type: "file",
        data: media.base64,
        mediaType: media.mediaType,
        filename: `anexo-${messageType}`,
      });
    }
  }
  if (parts.length === 0) {
    parts.push({ type: "text", text: `[mensagem do tipo ${messageType} sem conteúdo legível]` });
  }

  try {
    const result = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      system: `${AUTOIA_SYSTEM_PROMPT}\n\n## Canal WhatsApp\nVocê está respondendo pelo WhatsApp. Seja objetivo, use no máximo ~1200 caracteres por mensagem, evite tabelas largas e prefira listas curtas. Use *negrito* no padrão do WhatsApp em vez de markdown com **.`,
      messages: [...history, { role: "user", content: parts }],
    });
    return result.text.trim() || "Não consegui gerar uma resposta agora. Pode repetir?";
  } catch (error) {
    console.error("Erro na IA (WhatsApp)", error);
    return "Tive um problema para analisar sua mensagem agora. Pode reenviar em instantes?";
  }
}
