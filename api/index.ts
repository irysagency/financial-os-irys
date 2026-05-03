import { Hono } from 'hono';
import { clerkMiddleware } from '@hono/clerk-auth';
import { cors } from 'hono/cors';
import { usersRouter } from './routes/users';
import { prestationsRouter } from './routes/prestations';
import { abonnementsRouter } from './routes/abonnements';
import { transactionsRouter } from './routes/transactions';
import { dashboardRouter } from './routes/dashboard';

const app = new Hono().basePath('/api');

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use('*', clerkMiddleware());

app.route('/users', usersRouter);
app.route('/prestations', prestationsRouter);
app.route('/abonnements', abonnementsRouter);
app.route('/transactions', transactionsRouter);
app.route('/dashboard', dashboardRouter);

app.get('/health', (c) => c.json({ ok: true }));

export default app;
