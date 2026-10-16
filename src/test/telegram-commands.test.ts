import { describe, expect, it } from 'vitest';
import { parseTelegramCommand } from '../../supabase/functions/telegram-poll/commands';

describe('Telegram commands', () => {
  it('recognises /start, including bot mention and deep-link payload', () => {
    expect(parseTelegramCommand('/start')).toEqual({ kind: 'start' });
    expect(parseTelegramCommand('/start@BibleBotLife_bot')).toEqual({ kind: 'start' });
    expect(parseTelegramCommand('/start website')).toEqual({ kind: 'start' });
  });

  it('recognises /daily with and without a name', () => {
    expect(parseTelegramCommand('/daily')).toEqual({ kind: 'daily', firstName: null });
    expect(parseTelegramCommand('/daily Thomas')).toEqual({ kind: 'daily', firstName: 'Thomas' });
    expect(parseTelegramCommand('/DAILY@BibleBotLife_bot Anna')).toEqual({ kind: 'daily', firstName: 'Anna' });
  });

  it('keeps /stopdaily separate from /daily', () => {
    expect(parseTelegramCommand('/stopdaily')).toEqual({ kind: 'stopdaily' });
  });

  it('treats normal text as a chat message', () => {
    expect(parseTelegramCommand('Ich fühle mich leer')).toEqual({ kind: 'chat' });
    expect(parseTelegramCommand('/dailyx')).toEqual({ kind: 'chat' });
  });
});
