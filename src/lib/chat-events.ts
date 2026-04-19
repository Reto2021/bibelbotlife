// Global event for opening chat with a pre-filled message (used by DailyImpulse etc.)
export const CHAT_OPEN_EVENT = "bibelbot-open-chat";
export const CHAT_RESET_EVENT = "bibelbot-reset-chat";

export type ChatMode = "normal" | "seven-whys" | "gratitude" | "lectio" | "forgiveness" | "values" | "examen";

export function openBibleBotChat(message: string, mode: ChatMode = "normal") {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: { message, mode } }));
}

export function resetBibleBotChat() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.dispatchEvent(new CustomEvent(CHAT_RESET_EVENT));
}
