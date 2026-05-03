import { Hono } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, transactions } from '../../db/schema';
import { randomUUID } from 'crypto';

export const transactionsRouter = new Hono();

async function ensureUser(userId: string, email: string) {
  await db.insert(users).values({ id: userId, email }).onConflictDoNothing();
}

// GET all transactions (most recent first)
transactionsRouter.get('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  await ensureUser(auth.userId, auth.sessionClaims?.email as string ?? '');

  const rows = await db.select().from(transactions)
    .where(eq(transactions.userId, auth.userId))
    .orderBy(desc(transactions.createdAt));

  return c.json(rows.map(t => ({ ...t, amount: parseFloat(t.amount) })));
});

// POST create transaction (single)
transactionsRouter.post('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  await ensureUser(auth.userId, auth.sessionClaims?.email as string ?? '');

  const body = await c.req.json<{
    name: string;
    amount: number;
    type: string;
    date: string;
    category?: string;
    source?: string;
  }>();

  const id = randomUUID();
  await db.insert(transactions).values({
    id,
    userId: auth.userId,
    name: body.name,
    amount: String(body.amount),
    type: body.type,
    date: body.date,
    category: body.category ?? null,
    source: body.source ?? 'manual',
  });

  return c.json({ id }, 201);
});

// POST bulk import (CSV)
transactionsRouter.post('/import', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  await ensureUser(auth.userId, auth.sessionClaims?.email as string ?? '');

  const body = await c.req.json<Array<{
    name: string;
    amount: number;
    type: string;
    date: string;
    category?: string;
    source?: string;
  }>>();

  if (!Array.isArray(body) || body.length === 0) {
    return c.json({ error: 'Empty payload' }, 400);
  }

  await db.insert(transactions).values(
    body.map(t => ({
      id: randomUUID(),
      userId: auth.userId!,
      name: t.name,
      amount: String(t.amount),
      type: t.type,
      date: t.date,
      category: t.category ?? null,
      source: t.source ?? 'manual',
    }))
  );

  return c.json({ imported: body.length }, 201);
});

// DELETE transaction
transactionsRouter.delete('/:id', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await db.delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, auth.userId)));

  return c.json({ ok: true });
});
