import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const SESSION_KEY = "bibelbot-session-id";
const LOCAL_CHAT_HISTORY_KEY = "bibelbot-anon-chat-history-v1";
const MAX_LOCAL_MESSAGES = 50;
const COMPACT_KEEP_RECENT = 20;

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          });
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "fallback-" + Date.now().toString(36);
  }
}

export type Conversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

type StoredConversation = Conversation & {
  messages: ChatMessage[];
};

function loadLocalConversationState(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalConversationState(conversations: StoredConversation[]) {
  try {
    localStorage.setItem(LOCAL_CHAT_HISTORY_KEY, JSON.stringify(conversations));
  } catch {}
}

function stripMessages(conversations: StoredConversation[]): Conversation[] {
  return conversations.map(({ messages: _messages, ...conversation }) => conversation);
}

function compactMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_LOCAL_MESSAGES) return messages;
  const toSummarize = messages.slice(0, messages.length - COMPACT_KEEP_RECENT);
  const recent = messages.slice(messages.length - COMPACT_KEEP_RECENT);
  const topics = toSummarize
    .filter(m => m.role === "user")
    .slice(0, 6)
    .map(m => m.content.slice(0, 80).replace(/\n/g, " "))
    .join(" · ");
  const summary: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: `📋 *Frühere Themen (${toSummarize.length} Nachrichten komprimiert):* ${topics}`,
    created_at: new Date().toISOString(),
  };
  return [summary, ...recent];
}

export function useChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const sessionId = getSessionId();
  const { user } = useAuth();

  // Claim anonymous session conversations when user logs in
  useEffect(() => {
    if (!user) return;
    const claimConversations = async () => {
      await supabase
        .from("chat_conversations")
        .update({ user_id: user.id })
        .eq("session_id", sessionId)
        .is("user_id", null);
    };
    claimConversations();
  }, [user, sessionId]);

  // Load conversation list - by user_id if logged in, else by session_id
  const loadConversations = useCallback(async () => {
    if (!user) {
      const localConversations = loadLocalConversationState()
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 50);
      setConversations(stripMessages(localConversations));
      return;
    }

    let query = supabase
      .from("chat_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);

    query = query.eq("user_id", user.id);

    const { data } = await query;
    if (data) setConversations(data);
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingHistory(true);

    if (!user) {
      const localConversation = loadLocalConversationState().find((conversation) => conversation.id === conversationId);
      setMessages(localConversation?.messages ?? []);
      setActiveConversationId(conversationId);
      setIsLoadingHistory(false);
      return;
    }

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content, created_at: m.created_at })));
    }
    setActiveConversationId(conversationId);
    setIsLoadingHistory(false);
  }, [user]);

  // Create new conversation
  const createConversation = useCallback(async (firstMessage: string): Promise<string> => {
    const title = firstMessage.length > 60 ? firstMessage.slice(0, 57) + "…" : firstMessage;

    if (!user) {
      const now = new Date().toISOString();
      const localConversation: StoredConversation = {
        id: crypto.randomUUID(),
        title,
        created_at: now,
        updated_at: now,
        messages: [],
      };

      const nextConversations = [localConversation, ...loadLocalConversationState()];
      saveLocalConversationState(nextConversations);
      setConversations(stripMessages(nextConversations));
      setActiveConversationId(localConversation.id);
      return localConversation.id;
    }

    const insertData: any = { session_id: sessionId, title };
    if (user) insertData.user_id = user.id;

    const { data } = await supabase
      .from("chat_conversations")
      .insert(insertData)
      .select("id")
      .single();
    const id = data!.id;
    setActiveConversationId(id);
    await loadConversations();
    return id;
  }, [sessionId, user, loadConversations]);

  // Add message to DB
  const addMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    if (!user) {
      const nextConversations = loadLocalConversationState().map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        const updatedMessages = compactMessages([
          ...conversation.messages,
          { id: crypto.randomUUID(), role, content, created_at: new Date().toISOString() },
        ]);
        return { ...conversation, updated_at: new Date().toISOString(), messages: updatedMessages };
      });
      saveLocalConversationState(nextConversations);
      setConversations(stripMessages(nextConversations));
      return;
    }

    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }, [user]);

  // Update last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user) {
      const nextConversations = loadLocalConversationState().map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        const nextMessages = [...conversation.messages];
        for (let i = nextMessages.length - 1; i >= 0; i -= 1) {
          if (nextMessages[i].role === "assistant") {
            nextMessages[i] = { ...nextMessages[i], content };
            break;
          }
        }

        return {
          ...conversation,
          updated_at: new Date().toISOString(),
          messages: nextMessages,
        };
      });

      saveLocalConversationState(nextConversations);
      setConversations(stripMessages(nextConversations));
      return;
    }

    const { data } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      await supabase
        .from("chat_messages")
        .update({ content })
        .eq("id", data.id);
    }
  }, [user]);

  // Update conversation title
  const updateTitle = useCallback(async (conversationId: string, title: string) => {
    if (!user) {
      const nextConversations = loadLocalConversationState().map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, title, updated_at: new Date().toISOString() }
          : conversation
      );
      saveLocalConversationState(nextConversations);
      setConversations(stripMessages(nextConversations));
      return;
    }

    await supabase
      .from("chat_conversations")
      .update({ title })
      .eq("id", conversationId);
    await loadConversations();
  }, [loadConversations, user]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) {
      const nextConversations = loadLocalConversationState().filter((conversation) => conversation.id !== conversationId);
      saveLocalConversationState(nextConversations);
      setConversations(stripMessages(nextConversations));
    } else {
      await supabase.from("chat_conversations").delete().eq("id", conversationId);
      await loadConversations();
    }

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [activeConversationId, loadConversations, user]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  // Search conversations
  const searchConversations = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadConversations();
      return;
    }

    if (!user) {
      const normalizedQuery = query.trim().toLowerCase();
      const filteredConversations = loadLocalConversationState()
        .filter((conversation) => (conversation.title ?? "").toLowerCase().includes(normalizedQuery))
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 50);
      setConversations(stripMessages(filteredConversations));
      return;
    }

    let q = supabase
      .from("chat_conversations")
      .select("*")
      .ilike("title", `%${query}%`)
      .order("updated_at", { ascending: false })
      .limit(50);

    q = q.eq("user_id", user.id);

    const { data } = await q;
    if (data) setConversations(data);
  }, [user, loadConversations]);

  // Initial load + reload when user changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    activeConversationId,
    messages,
    setMessages,
    isLoadingHistory,
    loadConversations,
    loadMessages,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    updateTitle,
    deleteConversation,
    startNewChat,
    searchConversations,
  };
}
