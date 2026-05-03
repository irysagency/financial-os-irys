import { Hono } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, abonnements, abonnementLogs } from '../../db/schema';

export const abonnementsRouter = new Hono();

async function ensureUser(userId: string, email: string) {
  await db.insert(users).values({ id: userId, email }).onConflictDoNothing();
}

// GET all abonnements
abonnementsRouter.get('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  await ensureUser(auth.userId, auth.sessionClaims?.email as string ?? '');

  const rows = await db.select().from(abonnements)
    .where(eq(abonnements.userId, auth.userId));

  return c.json(rows.map(a => ({
    ...a,
    montantHT: parseFloat(a.montantHT),
    categorie: '',
    statut: a.actif ? 'Actif' : 'Annulé',
  })));
});

// POST create abonnement
abonnementsRouter.post('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  await ensureUser(auth.userId, auth.sessionClaims?.email as string ?? '');

  const body = await c.req.json<{
    nom: string;
    montantHT: number;
    frequence: string;
    prochaineDate: string;
  }>();

  const id = crypto.randomUUID();
  await db.insert(abonnements).values({
    id,
    userId: auth.userId,
    nom: body.nom,
    montantHT: String(body.montantHT),
    frequence: body.frequence ?? 'Mensuel',
    prochaineDate: body.prochaineDate,
  });

  return c.json({ id }, 201);
});

// PATCH update abonnement
abonnementsRouter.patch('/:id', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const body = await c.req.json<Partial<{
    nom: string;
    montantHT: number;
    frequence: string;
    prochaineDate: string;
    actif: boolean;
  }>>();

  const updateData: Record<string, unknown> = {};
  if (body.nom !== undefined) updateData.nom = body.nom;
  if (body.montantHT !== undefined) updateData.montantHT = String(body.montantHT);
  if (body.frequence !== undefined) updateData.frequence = body.frequence;
  if (body.prochaineDate !== undefined) updateData.prochaineDate = body.prochaineDate;
  if (body.actif !== undefined) updateData.actif = body.actif;

  await db.update(abonnements)
    .set(updateData)
    .where(and(eq(abonnements.id, id), eq(abonnements.userId, auth.userId)));

  return c.json({ ok: true });
});

// DELETE abonnement
abonnementsRouter.delete('/:id', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await db.delete(abonnements)
    .where(and(eq(abonnements.id, id), eq(abonnements.userId, auth.userId)));

  return c.json({ ok: true });
});

// GET logs for a given month
abonnementsRouter.get('/logs/:mois', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

  const mois = c.req.param('mois'); // 'YYYY-MM'
  const rows = await db.select().from(abonnementLogs)
    .where(and(eq(abonnementLogs.userId, auth.userId), eq(abonnementLogs.mois, mois)));

  const map: Record<string, boolean> = {};
  rows.forEach(r => { map[r.abonnementId] = r.pris; });
  return c.json(map);
});

// PUT toggle log
abonnementsRouter.put('/logs/:mois/:abonnementId', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);

  const mois = c.req.param('mois');
  const abonnementId = c.req.param('abonnementId');
  const body = await c.req.json<{ pris: boolean }>();

  const existing = await db.select().from(abonnementLogs)
    .where(and(
      eq(abonnementLogs.userId, auth.userId),
      eq(abonnementLogs.mois, mois),
      eq(abonnementLogs.abonnementId, abonnementId)
    ));

  if (existing.length > 0) {
    await db.update(abonnementLogs)
      .set({ pris: body.pris })
      .where(eq(abonnementLogs.id, existing[0].id));
  } else {
    await db.insert(abonnementLogs).values({
      id: crypto.randomUUID(),
      abonnementId,
      userId: auth.userId,
      mois,
      pris: body.pris,
    });
  }

  return c.json({ ok: true });
});
