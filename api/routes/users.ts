import { Hono } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users } from '../../db/schema';

export const usersRouter = new Hono();

// Upsert user on first call (called by frontend after sign-in)
usersRouter.post('/me', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

  const email = auth.sessionClaims?.email as string ?? '';
  await db.insert(users)
    .values({ id: auth.userId, email })
    .onConflictDoNothing();

  const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
  return c.json(user);
});
