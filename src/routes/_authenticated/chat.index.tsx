import { createFileRoute, redirect } from "@tanstack/react-router";
import { createConversation } from "@/lib/conversations.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  loader: async () => {
    const conversation = await createConversation();
    throw redirect({ to: "/chat/$threadId", params: { threadId: conversation.id }, replace: true });
  },
  component: () => null,
});
