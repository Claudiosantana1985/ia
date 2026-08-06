import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Wrench, Mic } from "lucide-react";
import { UpgradeButton } from "../UpgradeButton";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputButton,
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
      body: { conversationId: threadId },
      fetch: async (url, options) => {
        const { data } = await supabase.auth.getSession();
        const headers = new Headers(options?.headers);
        if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
        return fetch(url, { ...options, headers });
      },
    }),
    onError: (err) => {
      toast.error("Não foi possível responder agora", { description: err.message });
    },
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  const isBusy = status === "submitted" || status === "streaming";

  function submit(message: PromptInputMessage) {
    const text = message.text?.trim();
    if ((!text && message.files.length === 0) || isBusy) return;
    void sendMessage({ text: text ?? "", files: message.files });
    if (messages.length === 0) onFirstMessage?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
              <img src={logo} alt="AutoIA Pro" width={64} height={64} className="h-16 w-16" />
              <div>
                <h2 className="text-2xl font-semibold">Qual é o defeito de hoje?</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Descreva o sintoma, envie fotos do painel, da peça ou da tela do scanner. Eu conduzo o
                  diagnóstico passo a passo com você.
                </p>
              </div>
              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submit({ text: suggestion, files: [] })}
                    className="rounded-xl border border-border bg-card p-3 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-accent"
                  >
                    <Wrench className="mb-2 h-4 w-4 text-primary" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <MessageResponse key={`${message.id}-${index}`}>{part.text}</MessageResponse>
                      );
                    }
                    if (part.type === "file" && part.mediaType?.startsWith("image/")) {
                      return (
                        <img
                          key={`${message.id}-${index}`}
                          src={part.url}
                          alt={part.filename ?? "Anexo enviado"}
                          className="max-h-72 rounded-lg border border-border object-contain"
                        />
                      );
                    }
                    if (part.type === "file") {
                      return (
                        <p key={`${message.id}-${index}`} className="text-sm text-muted-foreground">
                          Arquivo enviado: {part.filename ?? part.mediaType}
                        </p>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          
          {/* Botão de Upgrade no rodapé */}
<div className="w-full flex justify-center p-3 border-t bg-background">
  <UpgradeButton />
</div>

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Analisando o caso...</Shimmer>
              </MessageContent>
            </Message>
          )}

          {error && (
            <p className="text-sm text-destructive">
              Ocorreu um erro na consulta. Tente novamente em instantes.
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
            maxFileSize={20 * 1024 * 1024}
            onError={(err) => toast.error(err.message)}
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
                    <PromptInputActionAddAttachments label="Enviar foto, áudio ou PDF" />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                 <PromptInputButton
    onClick={() => console.log("Microfone clicado")}
  >
    <Mic className="size-4" />
  </PromptInputButton>
</PromptInputTools>
              <PromptInputSubmit status={status} disabled={isBusy} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            O AutoIA Pro pode errar. Confirme torques e especificações no manual da montadora.
          </p>
        </div>
      </div>
    </div>
  );
}
