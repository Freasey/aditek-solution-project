import type { Db } from '../db/client';
import { auditLog } from '../db/schema';
import { newId, nowIso } from './util';

export async function audit(db: Db, actor: string, action: string, target?: string | null) {
  await db.insert(auditLog).values({ id: newId(), actor, action, target: target ?? null, createdAt: nowIso() });
}
