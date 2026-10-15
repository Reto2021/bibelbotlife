import { describe, expect, it } from 'vitest';
import { withPollLock } from '../../supabase/functions/telegram-poll/poll-lock';

function lockClient() {
  let owner: string | null = null;
  return {
    rpc: async (name: string, params: { p_token: string }) => {
      if (name === 'acquire_telegram_poll_lock') {
        if (owner) return { data: false, error: null };
        owner = params.p_token;
        return { data: true, error: null };
      }
      if (owner === params.p_token) owner = null;
      return { data: null, error: null };
    },
  };
}

describe('Telegram single poller', () => {
  it('skips an overlapping invocation without calling Telegram', async () => {
    const client = lockClient();
    let unblock: (() => void) | undefined;
    const wait = new Promise<void>((resolve) => { unblock = resolve; });
    let calls = 0;
    const first = withPollLock(client, async () => { calls++; await wait; });
    const second = await withPollLock(client, async () => { calls++; });
    expect(second.skipped).toBe(true);
    expect(calls).toBe(1);
    unblock?.();
    await first;
  });

  it('releases the lock after a Telegram failure so the next run can answer', async () => {
    const client = lockClient();
    await expect(withPollLock(client, async () => { throw new Error('409'); })).rejects.toThrow('409');
    const next = await withPollLock(client, async () => 'reply');
    expect(next).toEqual({ skipped: false, value: 'reply' });
  });

  it('does not poll when acquiring the lock fails', async () => {
    let calls = 0;
    const client = { rpc: async () => ({ data: null, error: { message: 'unavailable' } }) };
    await expect(withPollLock(client, async () => { calls++; })).rejects.toThrow('unavailable');
    expect(calls).toBe(0);
  });
});