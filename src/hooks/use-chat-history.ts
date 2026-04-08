import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const SESSION_KEY = "bibelbot-session-id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
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
    let query = supabase
      .from("chat_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.eq("session_id", sessionId);
    }

    const { data } = await query;
    if (data) setConversations(data);
  }, [sessionId, user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingHistory(true);
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
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (firstMessage: string): Promise<string> => {
    const title = firstMessage.length > 60 ? firstMessage.slice(0, 57) + "…" : firstMessage;
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
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }, []);

  // Update last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback(async (conversationId: string, content: string) => {
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
  }, []);

  // Update conversation title
  const updateTitle = useCallback(async (conversationId: string, title: string) => {
    await supabase
      .from("chat_conversations")
      .update({ title })
      .eq("id", conversationId);
    await loadConversations();
  }, [loadConversations]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    await supabase.from("chat_conversations").delete().eq("id", conversationId);
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    await loadConversations();
  }, [activeConversationId, loadConversations]);

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
    let q = supabase
      .from("chat_conversations")
      .select("*")
      .ilike("title", `%${query}%`)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (user) {
      q = q.eq("user_id", user.id);
    } else {
      q = q.eq("session_id", sessionId);
    }

    const { data } = await q;
    if (data) setConversations(data);
  }, [sessionId, user, loadConversations]);

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
