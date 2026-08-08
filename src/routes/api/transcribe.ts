import { createFileRoute } from "@tanstack/react-router";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          console.log("========== TRANSCRIÇÃO DE ÁUDIO ==========");

          const contentType = request.headers.get("content-type");

          if (!contentType?.includes("multipart/form-data")) {
            return new Response(
              JSON.stringify({
                error:
                  "O áudio deve ser enviado como multipart/form-data.",
              }),
              {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }

          const formData = await request.formData();
          const audio = formData.get("audio");

          if (!(audio instanceof File)) {
            return new Response(
              JSON.stringify({
                error: "Nenhum arquivo de áudio foi recebido.",
              }),
              {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }

          console.log("Nome:", audio.name);
          console.log("Tipo:", audio.type);
          console.log("Tamanho:", audio.size);

          if (audio.size < 1000) {
            console.log(
              "Áudio muito pequeno para transcrição.",
            );

            return new Response(
              JSON.stringify({
                success: true,
                text: "",
                silent: true,
                message:
                  "Áudio muito curto ou sem dados suficientes.",
              }),
              {
                status: 200,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }

          const apiKey = process.env.GOOGLE_API_KEY;

          if (!apiKey) {
            console.error(
              "GOOGLE_API_KEY não configurada.",
            );

            return new Response(
              JSON.stringify({
                error:
                  "IA não configurada no servidor.",
              }),
              {
                status: 500,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }

          const audioBuffer = await audio.arrayBuffer();

          const audioBase64 =
            Buffer.from(audioBuffer).toString("base64");

          console.log("Áudio convertido para Base64.");
          console.log(
            "Iniciando análise de voz com Gemini...",
          );

          const result = await generateText({
            model: google("gemini-flash-latest"),

            system: `
Você é um sistema de TRANSCRIÇÃO DE VOZ.

Analise cuidadosamente o áudio fornecido.

Sua tarefa é exclusivamente identificar o que foi realmente falado por uma pessoa e transcrever essa fala.

REGRAS:

- Se houver fala humana claramente audível, transcreva exatamente o conteúdo falado.
- Preserve nomes de veículos.
- Preserve nomes de motores.
- Preserve códigos como P0300, P0301, P0420 etc.
- Preserve nomes de peças e termos automotivos.
- Não responda perguntas.
- Não dê diagnóstico.
- Não explique o conteúdo.
- Não transforme o conteúdo em uma pergunta diferente.
- Não invente frases.
- Não complete frases que não foram faladas.
- Não crie conteúdo baseado no contexto automotivo.
- Se o áudio estiver realmente sem fala humana, responda somente:
[Áudio sem fala]

IMPORTANTE:

Não presuma que o áudio está sem fala apenas porque a gravação é curta.

Se houver uma voz humana audível, transcreva-a.

Retorne SOMENTE a transcrição.
`,

            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Transcreva exatamente a fala humana presente neste áudio.",
                  },
                  {
                    type: "file",
                    data: audioBase64,
                    mediaType:
                      audio.type || "audio/webm",
                  },
                ],
              },
            ],
          });

          const transcription = result.text.trim();

          console.log(
            "========== TRANSCRIÇÃO ==========",
          );
          console.log(transcription);
          console.log("=================================");

          if (
            !transcription ||
            transcription === "[Áudio sem fala]"
          ) {
            return new Response(
              JSON.stringify({
                success: true,
                text: "",
                silent: true,
              }),
              {
                status: 200,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              text: transcription,
              silent: false,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        } catch (error) {
          console.error(
            "========== ERRO NA TRANSCRIÇÃO ==========",
          );
          console.error(error);
          console.error(
            "=========================================",
          );

          const errorMessage =
            error instanceof Error
              ? error.message
              : String(error);

          const isQuotaError =
            errorMessage.includes("Quota exceeded") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("rate limit") ||
            errorMessage.includes(
              "generate_content_free_tier_requests",
            );

          if (isQuotaError) {
            return new Response(
              JSON.stringify({
                success: false,
                error:
                  "A cota gratuita do Gemini foi atingida. Aguarde a liberação da cota ou configure faturamento no projeto Google.",
                quota: true,
              }),
              {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }

          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Falha ao transcrever o áudio.",
              details: errorMessage,
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        }
      },
    },
  },
});