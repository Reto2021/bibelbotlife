// Global event for opening chat with a pre-filled message (used by DailyImpulse etc.)
export const CHAT_OPEN_EVENT = "bibelbot-open-chat";

export type ChatMode = "normal" | "seven-whys";

export function openBibelBotChat(message: string, mode: ChatMode = "normal") {
  window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: { message, mode } }));
}
