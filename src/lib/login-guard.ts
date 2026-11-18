import { and, count, desc, eq, gte, lt } from 'drizzle-orm';
import type { Db } from '../db/client';
import { loginAttempts } from '../db/schema';
import { newId } from './util';

/**
 * Proteksi brute force login admin, di atas rate limiter Workers (5 percobaan/menit per IP):
 * - per IP: 5 kali gagal dalam 15 menit, IP dikunci sampai 15 menit sejak kegagalan pertama di jendela itu
 * - per akun: 20 kali gagal dari IP mana pun dalam 15 menit, login dikunci untuk semua IP
 * - login berhasil menghapus catatan gagal dari IP tersebut
 */
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILS_PER_IP = 5;
export const MAX_FAILS_TOTAL = 20;
const RETENTION_MS = 24 * 60 * 60 * 1000;

export interface LockStatus {
  locked: boolean;
  /** Menit sampai kunci terbuka (dibulatkan ke atas). */
  minutes: number;
}

function minutesUntil(oldestIso: string | undefined, now: number): number {
  if (!oldestIso) return Math.ceil(LOGIN_WINDOW_MS / 60000);
  const unlockAt = new Date(oldestIso).getTime() + LOGIN_WINDOW_MS;
  return Math.max(1, Math.ceil((unlockAt - now) / 60000));
}

export async function loginLock(db: Db, ip: string): Promise<LockStatus> {
  const now = Date.now();
  const since = new Date(now - LOGIN_WINDOW_MS).toISOString();
  const failed = and(eq(loginAttempts.success, false), gte(loginAttempts.createdAt, since));

  const [byIp, total] = await Promise.all([
    db.select({ n: count() }).from(loginAttempts).where(and(failed, eq(loginAttempts.ip, ip))).get(),
    db.select({ n: count() }).from(loginAttempts).where(failed).get(),
  ]);

  if ((byIp?.n ?? 0) >= MAX_FAILS_PER_IP) {
    // Kunci terbuka saat kegagalan ke-(n - MAX + 1) terlama keluar dari jendela.
    const rows = await db
      .select({ at: loginAttempts.createdAt })
      .from(loginAttempts)
      .where(and(failed, eq(loginAttempts.ip, ip)))
      .orderBy(desc(loginAttempts.createdAt))
      .limit(MAX_FAILS_PER_IP);
    return { locked: true, minutes: minutesUntil(rows.at(-1)?.at, now) };
  }
  if ((total?.n ?? 0) >= MAX_FAILS_TOTAL) {
    const rows = await db
      .select({ at: loginAttempts.createdAt })
      .from(loginAttempts)
      .where(failed)
      .orderBy(desc(loginAttempts.createdAt))
      .limit(MAX_FAILS_TOTAL);
    return { locked: true, minutes: minutesUntil(rows.at(-1)?.at, now) };
  }
  return { locked: false, minutes: 0 };
}

export async function recordLogin(db: Db, ip: string, success: boolean): Promise<void> {
  const now = Date.now();
  const writes = [
    db.insert(loginAttempts).values({ id: newId(), ip, success, createdAt: new Date(now).toISOString() }),
    db.delete(loginAttempts).where(lt(loginAttempts.createdAt, new Date(now - RETENTION_MS).toISOString())),
  ] as const;
  if (success) {
    await db.batch([
      db.delete(loginAttempts).where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.success, false))),
      ...writes,
    ]);
  } else {
    await db.batch(writes);
  }
}

/** Jumlah login gagal dalam 24 jam terakhir, untuk dashboard. */
export async function failedLogins24h(db: Db): Promise<number> {
  const since = new Date(Date.now() - RETENTION_MS).toISOString();
  const row = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.success, false), gte(loginAttempts.createdAt, since)))
    .get()
    .catch(() => null);
  return row?.n ?? 0;
}

