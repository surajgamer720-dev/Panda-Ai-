import { Chat } from "@/lib/chatStore";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export function ChatSidebar({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat, open, onClose }: ChatSidebarProps) {
  const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-md z-40 md:hidden animate-fade-in" onClick={onClose} />
      )}

      <aside className={`
        fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-[min(18rem,86vw)]
        bg-[hsl(var(--sidebar-background))]/80 backdrop-blur-xl border-r border-sidebar-border/50
        flex flex-col transition-all duration-300 ease-out
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        md:translate-x-0
      `}>
        <div className="min-h-14 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐼</span>
            <span className="font-display font-semibold text-sm text-sidebar-foreground">PANDA AI</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3">
          <Button onClick={() => { onNewChat(); onClose(); }} className="w-full justify-start gap-2" variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {sortedChats.map(chat => (
              <div
                key={chat.id}
                className={`
                  group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors
                  ${chat.id === activeChatId
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }
                `}
                onClick={() => { onSelectChat(chat.id); onClose(); }}
              >
                <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                <span className="truncate flex-1">{chat.title}</span>
                <button
                  onClick={e => { e.stopPropagation(); onDeleteChat(chat.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
            {sortedChats.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No chats yet</p>
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
