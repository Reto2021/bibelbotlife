import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  // Load conversation list
  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("session_id", sessionId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [sessionId]);

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
    const { data } = await supabase
      .from("chat_conversations")
      .insert({ session_id: sessionId, title })
      .select("id")
      .single();
    const id = data!.id;
    setActiveConversationId(id);
    await loadConversations();
    return id;
  }, [sessionId, loadConversations]);

  // Add message to DB
  const addMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });
    // Update conversation timestamp
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }, []);

  // Update last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback(async (conversationId: string, content: string) => {
    // Get the last assistant message
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
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("session_id", sessionId)
      .ilike("title", `%${query}%`)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [sessionId, loadConversations]);

  // Initial load
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
