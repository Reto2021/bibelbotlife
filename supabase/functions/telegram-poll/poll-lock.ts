type LockClient = {
  rpc: (name: string, params: { p_token: string }) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export async function withPollLock<T>(client: LockClient, run: (token: string) => Promise<T>) {
  const token = crypto.randomUUID();
  const { data, error } = await client.rpc('acquire_telegram_poll_lock', { p_token: token });
  if (error) throw new Error(`Telegram lock acquisition failed: ${error.message}`);
  if (data !== true) return { skipped: true as const };
  try {
    return { skipped: false as const, value: await run(token) };
  } finally {
    const { error: releaseError } = await client.rpc('release_telegram_poll_lock', { p_token: token });
    if (releaseError) console.error('Telegram lock release failed:', releaseError.message);
  }
}