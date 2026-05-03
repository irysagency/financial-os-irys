import { Hono } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, prestations, coutsPrestation } from '../../db/schema';
import { randomUUID } from 'crypto';

export const prestationsRouter = new Hono();

async function ensureUser(userId: string, email: string) {
  await db.insert(users).values({ id: userId, email }).onConflictDoNothing();
}

// Map DB row → frontend Prestation shape
function toFrontend(p: typeof prestations.$inferSelect, couts: (typeof coutsPrestation.$inferSelect)[]) {
  const ht = parseFloat(p.montantHT);
  return {
    id: p.id,
    client: p.client,
    prestation: p.description,
    montantHT: ht,
    tva: Math.round(ht * 0.2 * 100) / 100,
    montantTTC: Math.round(ht * 1.2 * 100) / 100,
    dateDebut: p.dateEmission,
    statut: p.statut as 'Signé' | 'En attente' | 'Payé',
    source: 'manual' as const,
    couts: couts.map(c => ({
      id: c.id,
      description: c.libelle,
      montantHT: parseFloat(c.montantHT),
    })),
  };
}

// GET all prestations
prestationsRouter.get('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  await ensureUser(auth.userId, auth.sessionClaims?.email as string ?? '');

  const rows = await db.select().from(prestations)
    .where(eq(prestations.userId, auth.userId));

  const allCouts = rows.length > 0
    ? await db.select().from(coutsPrestation)
        .where(eq(coutsPrestation.userId, auth.userId))
    : [];

  return c.json(rows.map(p => toFrontend(p, allCouts.filter(ct => ct.prestationId === p.id))));
});

// POST create prestation
prestationsRouter.post('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  await ensureUser(auth.userId, auth.sessionClaims?.email as string ?? '');

  const body = await c.req.json<{
    client: string;
    prestation: string;
    montantHT: number;
    statut: string;
    dateDebut: string;
    couts?: Array<{ description: string; montantHT: number }>;
  }>();

  const id = randomUUID();
  await db.insert(prestations).values({
    id,
    userId: auth.userId,
    client: body.client,
    description: body.prestation,
    montantHT: String(body.montantHT),
    statut: body.statut ?? 'Signé',
    dateEmission: body.dateDebut,
    dateEcheance: body.dateDebut,
  });

  if (body.couts?.length) {
    await db.insert(coutsPrestation).values(
      body.couts.map(ct => ({
        id: randomUUID(),
        prestationId: id,
        userId: auth.userId!,
        libelle: ct.description,
        montantHT: String(ct.montantHT),
      }))
    );
  }

  return c.json({ id }, 201);
});

// PATCH update prestation
prestationsRouter.patch('/:id', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const body = await c.req.json<Partial<{
    client: string;
    prestation: string;
    montantHT: number;
    statut: string;
    dateDebut: string;
    couts: Array<{ description: string; montantHT: number }>;
  }>>();

  const updateData: Record<string, unknown> = {};
  if (body.client !== undefined) updateData.client = body.client;
  if (body.prestation !== undefined) updateData.description = body.prestation;
  if (body.montantHT !== undefined) updateData.montantHT = String(body.montantHT);
  if (body.statut !== undefined) updateData.statut = body.statut;
  if (body.dateDebut !== undefined) {
    updateData.dateEmission = body.dateDebut;
    updateData.dateEcheance = body.dateDebut;
  }

  await db.update(prestations)
    .set(updateData)
    .where(and(eq(prestations.id, id), eq(prestations.userId, auth.userId)));

  // Replace costs if provided
  if (body.couts !== undefined) {
    await db.delete(coutsPrestation).where(
      and(eq(coutsPrestation.prestationId, id), eq(coutsPrestation.userId, auth.userId))
    );
    if (body.couts.length > 0) {
      await db.insert(coutsPrestation).values(
        body.couts.map(ct => ({
          id: randomUUID(),
          prestationId: id,
          userId: auth.userId!,
          libelle: ct.description,
          montantHT: String(ct.montantHT),
        }))
      );
    }
  }

  return c.json({ ok: true });
});

// DELETE prestation
prestationsRouter.delete('/:id', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await db.delete(prestations)
    .where(and(eq(prestations.id, id), eq(prestations.userId, auth.userId)));

  return c.json({ ok: true });
});
