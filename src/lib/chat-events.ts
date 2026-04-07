// Global event for opening chat with a pre-filled message (used by DailyImpulse etc.)
export const CHAT_OPEN_EVENT = "bibelbot-open-chat";

export function openBibelBotChat(message: string) {
  window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: message }));
}
