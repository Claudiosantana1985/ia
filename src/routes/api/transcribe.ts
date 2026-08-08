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
                error: "O áudio deve ser enviado como multipart/form-data.",
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

          if (audio.size === 0) {
            return new Response(
              JSON.stringify({
                error: "O arquivo de áudio está vazio.",
              }),
              {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }

          const apiKey = process.env.GOOGLE_API_KEY;

          if (!apiKey) {
            console.error("GOOGLE_API_KEY não configurada.");

            return new Response(
              JSON.stringify({
                error: "IA não configurada no servidor.",
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

          const audioBase64 = Buffer.from(audioBuffer).toString("base64");

          console.log("Áudio convertido para Base64.");
          console.log("Iniciando transcrição com Gemini...");

          const result = await generateText({
            model: google("gemini-flash-latest"),
            system: `
Você é um TRANSCRITOR DE ÁUDIO.

Sua única tarefa é identificar e transcrever PALAVRAS QUE REALMENTE ESTÃO PRESENTES NO ÁUDIO.

REGRAS ABSOLUTAS:

1. NÃO invente nenhuma palavra ou frase.
2. NÃO complete frases que não foram faladas.
3. NÃO faça perguntas por conta própria.
4. NÃO responda ao usuário.
5. NÃO interprete o problema automotivo.
6. NÃO transforme ruídos ou silêncio em uma pergunta.
7. Se não houver fala claramente audível, retorne exatamente:
[Áudio sem fala]
8. Se houver apenas uma pequena parte falada, transcreva somente essa parte.
9. Preserve nomes de veículos, motores, peças, códigos de falha e termos técnicos.
10. Não acrescente contexto que não esteja presente no áudio.
11. Não corrija o conteúdo falado.
12. Não invente palavras para tornar a frase mais completa.

IMPORTANTE:
Se houver qualquer dúvida entre silêncio/ruído e fala humana, prefira:
[Áudio sem fala]

RETORNE SOMENTE A TRANSCRIÇÃO.
`,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Transcreva o áudio enviado.",
                  },
                  {
                    type: "file",
                    data: audioBase64,
                    mediaType: audio.type || "audio/webm",
                  },
                ],
              },
            ],
          });

          const transcription = result.text.trim();

          console.log("========== TRANSCRIÇÃO ==========");
          console.log(transcription);
          console.log("=================================");

          if (!transcription) {
            return new Response(
              JSON.stringify({
                error: "Não foi possível identificar fala no áudio.",
              }),
              {
                status: 422,
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
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        } catch (error) {
          console.error("========== ERRO NA TRANSCRIÇÃO ==========");
          console.error(error);
          console.error("=========================================");

          return new Response(
            JSON.stringify({
              error: "Falha ao transcrever o áudio.",
              details:
                error instanceof Error ? error.message : String(error),
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