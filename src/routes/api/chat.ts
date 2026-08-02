import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { AUTOIA_SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { Database } from "@/integrations/supabase/types";
import { google } from "@ai-sdk/google";

type ChatRequestBody = {
  messages?: UIMessage[];
  conversationId?: string;
};

function userClient(token: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("SUPABASE_PUBLISHABLE_KEY:", process.env.SUPABASE_PUBLISHABLE_KEY?.substring(0, 25));
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token) return new Response("Não autenticado", { status: 401 });

        const supabase = userClient(token);
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsError || !userId) return new Response("Não autenticado", { status: 401 });

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const conversationId = body.conversationId;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Mensagens obrigatórias", { status: 400 });
        }
        if (!conversationId) return new Response("Conversa obrigatória", { status: 400 });

        const { data: conversation, error: convError } = await supabase
          .from("conversations")
          .select("id, title")
          .eq("id", conversationId)
          .maybeSingle();
        if (convError || !conversation) return new Response("Conversa não encontrada", { status: 404 });

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) return new Response("IA não configurada", { status: 500 });

        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === "user") {
          const { error: insertError } = await supabase.from("messages").insert({
            conversation_id: conversationId,
            user_id: userId,
            role: "user",
            parts: lastMessage.parts as never,
          });
          if (insertError) console.error("Erro ao salvar mensagem do usuário", insertError);

          const firstText = lastMessage.parts.find((p) => p.type === "text");
          const title =
            firstText && "text" in firstText ? firstText.text.slice(0, 60) : conversation.title;
          const isFirst = messages.filter((m) => m.role === "user").length === 1;
          const { error: updateError } = await supabase
            .from("conversations")
            .update({
              updated_at: new Date().toISOString(),
              ...(isFirst && title ? { title } : {}),
            })
            .eq("id", conversationId);
          if (updateError) console.error("Erro ao atualizar conversa", updateError);
        }


        try {
          const result = streamText({
            model: google("gemini-flash-latest"),
            system: AUTOIA_SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages,
            onFinish: async ({ responseMessage }) => {
              const { error } = await supabase.from("messages").insert({
                conversation_id: conversationId,
                user_id: userId,
                role: "assistant",
                parts: responseMessage.parts as never,
              });
              if (error) console.error("Erro ao salvar resposta da IA", error);
            },
          });
        } catch (error) {
          console.error("Erro na IA", error);
          return new Response("Falha ao consultar a IA", { status: 500 });
        }
      },
    },
  },
});
