const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Secret uji resmi Cloudflare yang selalu lolos. Hanya dihormati di luar production. */
const TEST_SECRET_PASS = '1x0000000000000000000000000000000AA';

export async function verifyTurnstile(
  secret: string | undefined,
  token: string,
  ip: string | null,
  opts: { production: boolean },
): Promise<boolean> {
  if (secret === TEST_SECRET_PASS) return !opts.production;
  if (!secret || !token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body });
    if (!res.ok) {
      console.warn('turnstile siteverify HTTP', res.status);
      return false;
    }
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (data.success !== true) console.warn('turnstile rejected', data['error-codes']);
    return data.success === true;
  } catch (err) {
    console.warn('turnstile siteverify failed', err instanceof Error ? err.message : err);
    return false;
  }
}
