/**
 * Login admin dengan ADMIN_EMAIL dan ADMIN_PASSWORD dari env.
 * Sesi disimpan di cookie yang ditandatangani HMAC-SHA256. Kunci diturunkan dari email dan password,
 * jadi mengganti password otomatis membatalkan semua sesi lama.
 */
type AuthEnv = { ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string; SITE_URL: string };

export const SESSION_COOKIE = 'ws_admin';
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const enc = new TextEncoder();

function credentials(env: AuthEnv): { email: string; password: string } | null {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD ?? '';
  return email && password ? { email, password } : null;
}

export function authConfigured(env: AuthEnv): boolean {
  return credentials(env) !== null;
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function signingKey(c: { email: string; password: string }): Promise<CryptoKey> {
  const material = await crypto.subtle.digest('SHA-256', enc.encode(`worksell-admin\n${c.email}\n${c.password}`));
  return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sameText(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  // timingSafeEqual adalah ekstensi Workers pada SubtleCrypto.
  const subtle = crypto.subtle as SubtleCrypto & { timingSafeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean };
  return subtle.timingSafeEqual(da, db);
}

export async function checkLogin(env: AuthEnv, email: string, password: string): Promise<boolean> {
  const c = credentials(env);
  if (!c) return false;
  const [okEmail, okPassword] = await Promise.all([
    sameText(email.trim().toLowerCase(), c.email),
    sameText(password, c.password),
  ]);
  return okEmail && okPassword;
}

export async function createSession(env: AuthEnv): Promise<string> {
  const c = credentials(env);
  if (!c) throw new Error('ADMIN_EMAIL dan ADMIN_PASSWORD belum diisi.');
  const payload = b64url(enc.encode(JSON.stringify({ e: c.email, x: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })));
  const sig = await crypto.subtle.sign('HMAC', await signingKey(c), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

/** Email admin bila cookie sesi valid, selain itu null. */
export async function verifySession(env: AuthEnv, token: string | undefined): Promise<string | null> {
  const c = credentials(env);
  if (!c || !token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', await signingKey(c), fromB64url(sig), enc.encode(payload));
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { e?: string; x?: number };
    if (data.e !== c.email || typeof data.x !== 'number' || data.x < Date.now() / 1000) return null;
    return data.e;
  } catch {
    return null;
  }
}

export function sessionCookie(env: AuthEnv, value: string, maxAge = SESSION_TTL_SECONDS): string {
  const secure = env.SITE_URL.startsWith('https://') ? '; Secure' : '';
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return undefined;
}
