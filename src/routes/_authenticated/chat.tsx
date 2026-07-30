import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createConversation,
  deleteConversation,
  listConversations,
} from "@/lib/conversations.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/autoia-logo.png";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };

  const fetchConversations = useServerFn(listConversations);
  const createFn = useServerFn(createConversation);
  const deleteFn = useServerFn(deleteConversation);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchConversations(),
  });

  const createMutation = useMutation({
    mutationFn: () => createFn(),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/chat/$threadId", params: { threadId: conversation.id } });
    },
    onError: () => toast.error("Não foi possível criar a conversa"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (params.threadId === id) navigate({ to: "/chat" });
    },
    onError: () => toast.error("Não foi possível apagar a conversa"),
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <img src={logo} alt="AutoIA Pro" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-base font-semibold">AutoIA Pro</span>
        </div>

        <div className="px-3">
          <Button
            className="w-full justify-start gap-2"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            <MessageSquarePlus className="h-4 w-4" />
            Novo diagnóstico
          </Button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Histórico
          </p>
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-1 transition-colors",
                params.threadId === conversation.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60",
              )}
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: conversation.id }}
                className="flex-1 truncate px-2 py-2 text-sm"
              >
                {conversation.title}
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Apagar conversa"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => deleteMutation.mutate(conversation.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="px-2 text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AutoIA Pro" width={28} height={28} className="h-7 w-7" />
            <span className="font-display text-sm font-semibold">AutoIA Pro</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => createMutation.mutate()}>
            Novo
          </Button>
        </header>
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
