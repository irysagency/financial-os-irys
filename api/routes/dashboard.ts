import { Hono } from 'hono';
import { getAuth } from '@clerk/hono';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, prestations, abonnements, transactions } from '../../db/schema';

export const dashboardRouter = new Hono();

async function ensureUser(userId: string, email: string) {
  await db.insert(users).values({ id: userId, email }).onConflictDoNothing();
}

dashboardRouter.get('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  await ensureUser(auth.userId, auth.sessionClaims?.email as string ?? '');

  const uid = auth.userId;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const [allPrestations, allAbonnements, allTransactions] = await Promise.all([
    db.select().from(prestations).where(eq(prestations.userId, uid)),
    db.select().from(abonnements).where(eq(abonnements.userId, uid)),
    db.select().from(transactions).where(eq(transactions.userId, uid)),
  ]);

  // KPIs
  const currentMonthTx = allTransactions.filter(t => t.date.startsWith(monthStr));
  const revenues = currentMonthTx
    .filter(t => parseFloat(t.amount) > 0)
    .reduce((s, t) => s + parseFloat(t.amount), 0);
  const expenses = currentMonthTx
    .filter(t => parseFloat(t.amount) < 0)
    .reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0);
  const netProfit = revenues - expenses;
  const pendingCA = allPrestations
    .filter(p => p.statut === 'En cours')
    .reduce((s, p) => s + parseFloat(p.montantHT), 0);

  // Cash flow — last 12 months
  const cashFlow = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mTx = allTransactions.filter(t => t.date.startsWith(mStr));
    const ca = mTx.filter(t => parseFloat(t.amount) > 0).reduce((s, t) => s + parseFloat(t.amount), 0);
    const charges = mTx.filter(t => parseFloat(t.amount) < 0).reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0);
    cashFlow.push({ label, ca, charges });
  }

  // Recent transactions (last 10)
  const recentTransactions = allTransactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .map(t => ({ ...t, amount: parseFloat(t.amount) }));

  // Subscriptions
  const subs = allAbonnements
    .filter(a => a.actif)
    .map(a => ({ ...a, montantHT: parseFloat(a.montantHT) }));

  return c.json({
    kpis: [
      { title: 'CA (Mois)', amount: revenues, trend: 0 },
      { title: 'Dépenses (Mois)', amount: expenses, trend: 0 },
      { title: 'Bénéfice Net', amount: netProfit, trend: 0 },
      { title: 'CA en attente', amount: pendingCA, trend: 0 },
    ],
    cashFlow,
    recentTransactions,
    subscriptions: subs,
    expenseDistribution: [],
  });
});
