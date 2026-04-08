import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Plus, Search, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Conversation } from "@/hooks/use-chat-history";
import { cn } from "@/lib/utils";

type Props = {
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onSearch: (query: string) => void;
};

export function ChatSidebar({
  conversations,
  activeConversationId,
  isOpen,
  onClose,
  onSelectConversation,
  onNewChat,
  onDelete,
  onSearch,
}: Props) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    onSearch(val);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return t("chat.today", "Heute");
    if (diffDays === 1) return t("chat.yesterday", "Gestern");
    if (diffDays < 7) return t("chat.daysAgo", { count: diffDays, defaultValue: `Vor ${diffDays} Tagen` });
    return date.toLocaleDateString();
  };

  // Group conversations by date
  const grouped = conversations.reduce<Record<string, Conversation[]>>((acc, conv) => {
    const label = formatDate(conv.updated_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(conv);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] md:w-[300px] bg-card border-r border-border flex flex-col shadow-2xl md:shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">{t("chat.history", "Gespräche")}</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={onNewChat}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={t("chat.newChat", "Neues Gespräch")}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t("chat.searchHistory", "Gespräche durchsuchen…")}
                  className="w-full bg-muted/50 border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{t("chat.noHistory", "Noch keine Gespräche")}</p>
                </div>
              ) : (
                Object.entries(grouped).map(([dateLabel, convs]) => (
                  <div key={dateLabel} className="mb-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">{dateLabel}</p>
                    {convs.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs group flex items-center gap-2 transition-colors mb-0.5",
                          activeConversationId === conv.id
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                        <span className="truncate flex-1">{conv.title || t("chat.untitled", "Ohne Titel")}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                          className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-all"
                          title={t("chat.deleteConversation", "Löschen")}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
