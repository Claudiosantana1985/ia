import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { UpgradeButton } from "../UpgradeButton";
import { AudioRecorder } from "@/components/chat/audio-recorder";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

import { Shimmer } from "@/components/ai-elements/shimmer";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/autoia-logo.png";

const SUGGESTIONS = [
  "Gol G6 1.6 falhando em marcha lenta, por onde começo?",
  "O que significa o código P0420 e como confirmar?",
  "Amarok V6 com perda de potência e fumaça preta",
  "Como testar a pressão da bomba de combustível corretamente?",
];

export function ChatWindow({
  threadId,
  initialMessages,
  onFirstMessage,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onFirstMessage?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,

    transport: new DefaultChatTransport({
      api: "/api/chat",

      body: {
        conversationId: threadId,
      },

      fetch: async (url, options) => {
        const { data } = await supabase.auth.getSession();

        const headers = new Headers(options?.headers);

        if (data.session) {
          headers.set(
            "Authorization",
            `Bearer ${data.session.access_token}`,
          );
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    }),

    onError: (err) => {
      toast.error("Não foi possível responder agora", {
        description: err.message,
      });
    },
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  const isBusy =
    status === "submitted" ||
    status === "streaming";

  function submit(message: PromptInputMessage) {
    const text = message.text?.trim();

    if (
      (!text && message.files.length === 0) ||
      isBusy
    ) {
      return;
    }

    void sendMessage({
      text: text ?? "",
      files: message.files,
    });

    if (messages.length === 0) {
      onFirstMessage?.();
    }
  }

  async function handleAudioRecorded(file: File) {
    try {
      console.log("Áudio gravado:", file);

      const formData = new FormData();

      formData.append("audio", file);

      console.log(
        "Enviando áudio para /api/transcribe...",
      );

      const response = await fetch(
        "/api/transcribe",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      console.log(
        "Resposta da API de áudio:",
        data,
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Erro ao transcrever o áudio.",
        );
      }

      if (
        data.silent ||
        !data.text?.trim()
      ) {
        toast.info(
          "Não identifiquei fala no áudio.",
        );

        return;
      }

      const transcription =
        data.text.trim();

      console.log(
        "Texto transcrito:",
        transcription,
      );

      /*
       * Coloca a transcrição diretamente
       * no campo de mensagem.
       *
       * O usuário poderá revisar antes
       * de enviar para a IA.
       */
      if (textareaRef.current) {
        const textarea =
          textareaRef.current;

        const nativeSetter =
          Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            "value",
          )?.set;

        nativeSetter?.call(
          textarea,
          transcription,
        );

        textarea.dispatchEvent(
          new Event("input", {
            bubbles: true,
          }),
        );

        textarea.focus();
      }

      toast.success(
        "Áudio transcrito com sucesso.",
      );
    } catch (error) {
      console.error(
        "Erro ao enviar/transcrever áudio:",
        error,
      );

      toast.error(
        "Não foi possível transcrever o áudio.",
        {
          description:
            error instanceof Error
              ? error.message
              : "Erro desconhecido.",
        },
      );
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-12">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <img
                  src={logo}
                  alt="AutoIA Pro"
                  className="size-12 object-contain"
                />
              </div>

              <h1 className="text-center text-2xl font-semibold tracking-tight">
                Qual é o defeito de hoje?
              </h1>

              <p className="mt-2 max-w-xl text-center text-sm leading-6 text-muted-foreground">
                Descreva o sintoma, envie fotos do
                painel, da peça ou da tela do
                scanner. Eu conduzo o diagnóstico
                passo a passo com você.
              </p>

              <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() =>
                        submit({
                          text: suggestion,
                          files: [],
                        })
                      }
                      className="rounded-xl border border-border bg-card p-3 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-accent"
                    >
                      {suggestion}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message
                key={message.id}
                from={message.role}
              >
                <MessageContent>
                  {message.parts.map(
                    (part, index) => {
                      if (
                        part.type === "text"
                      ) {
                        return (
                          <MessageResponse
                            key={`${message.id}-${index}`}
                          >
                            {part.text}
                          </MessageResponse>
                        );
                      }

                      if (
                        part.type === "file" &&
                        part.mediaType?.startsWith(
                          "image/",
                        )
                      ) {
                        return (
                          <img
                            key={`${message.id}-${index}`}
                            src={part.url}
                            alt={
                              part.filename ??
                              "Anexo enviado"
                            }
                            className="max-h-72 rounded-lg border border-border object-contain"
                          />
                        );
                      }

                      if (
                        part.type === "file"
                      ) {
                        return (
                          <p
                            key={`${message.id}-${index}`}
                            className="text-sm text-muted-foreground"
                          >
                            Arquivo enviado:{" "}
                            {part.filename ??
                              part.mediaType}
                          </p>
                        );
                      }

                      return null;
                    },
                  )}
                </MessageContent>
              </Message>
            ))
          )}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>
                  Analisando o caso...
                </Shimmer>
              </MessageContent>
            </Message>
          )}

          {error && (
            <p className="text-sm text-destructive">
              Ocorreu um erro na consulta. Tente
              novamente em instantes.
            </p>
          )}
        </ConversationContent>

        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background px-4 py-4">
        <div className="mx-auto w-full max-w-3xl">
          <PromptInput
            onSubmit={submit}
            accept="image/*,application/pdf,audio/*,video/*"
            multiple
            maxFiles={5}
            maxFileSize={
              20 * 1024 * 1024
            }
            onError={(err) =>
              toast.error(err.message)
            }
          >
            <PromptInputTextarea
              ref={textareaRef}
              autoFocus
              placeholder="Descreva o veículo, o sintoma e o que já foi testado..."
            />

            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />

                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments
                      label="Enviar foto, áudio ou PDF"
                    />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>

                <AudioRecorder
                  onRecorded={
                    handleAudioRecorded
                  }
                />
              </PromptInputTools>

              <PromptInputSubmit
                status={status}
                disabled={isBusy}
              />
            </PromptInputFooter>
          </PromptInput>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            O AutoIA Pro pode errar. Confirme
            torques e especificações no manual
            da montadora.
          </p>
        </div>
      </div>
    </div>
  );
}