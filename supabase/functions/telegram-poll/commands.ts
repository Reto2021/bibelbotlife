export type TelegramCommand =
  | { kind: 'start' }
  | { kind: 'daily'; firstName: string | null }
  | { kind: 'stopdaily' }
  | { kind: 'companion'; companion: 'lea' | 'jonas' | 'auto' }
  | { kind: 'chat' };

/** Parses "/cmd", "/cmd@BotName" and "/cmd args" (e.g. deep links "/start xyz"). */
export function parseTelegramCommand(text: string): TelegramCommand {
  const match = text.trim().match(/^\/([a-z]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
  if (!match) return { kind: 'chat' };
  const cmd = (match[1] ?? '').toLowerCase();
  const args = (match[2] ?? '').trim();
  if (cmd === 'start') return { kind: 'start' };
  if (cmd === 'stopdaily') return { kind: 'stopdaily' };
  if (cmd === 'daily') return { kind: 'daily', firstName: args ? args.slice(0, 50) : null };
  if (cmd === 'lea' || cmd === 'jonas' || cmd === 'auto') return { kind: 'companion', companion: cmd };
  return { kind: 'chat' };
}
