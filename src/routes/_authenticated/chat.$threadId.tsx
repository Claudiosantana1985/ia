import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { UIMessage } from "ai";

import { ChatWindow } from "@/components/chat/chat-window";
import { getConversationMessages } from "@/lib/conversations.functions";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchMessages = useServerFn(getConversationMessages);

  const { data, isLoading } = useQuery({
    queryKey: ["conversation", threadId],
    queryFn: () => fetchMessages({ data: { id: threadId } }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Carregando conversa...
      </div>
    );
  }

  const initialMessages = data.messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: message.parts,
  })) as UIMessage[];

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      initialMessages={initialMessages}
      onFirstMessage={() => {
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }}
    />
  );
}
