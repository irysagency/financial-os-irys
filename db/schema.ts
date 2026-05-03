import { pgTable, text, numeric, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk userId
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const prestations = pgTable('prestations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  client: text('client').notNull(),
  description: text('description').notNull(),
  montantHT: numeric('montant_ht', { precision: 12, scale: 2 }).notNull(),
  statut: text('statut').notNull().default('En cours'), // 'En cours' | 'Payée' | 'En retard'
  dateEmission: text('date_emission').notNull(),
  dateEcheance: text('date_echeance').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const coutsPrestation = pgTable('couts_prestation', {
  id: text('id').primaryKey(),
  prestationId: text('prestation_id').notNull().references(() => prestations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  libelle: text('libelle').notNull(),
  montantHT: numeric('montant_ht', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const abonnements = pgTable('abonnements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  montantHT: numeric('montant_ht', { precision: 12, scale: 2 }).notNull(),
  frequence: text('frequence').notNull().default('Mensuel'), // 'Mensuel' | 'Annuel'
  prochaineDate: text('prochaine_date').notNull(),
  actif: boolean('actif').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const abonnementLogs = pgTable('abonnement_logs', {
  id: text('id').primaryKey(),
  abonnementId: text('abonnement_id').notNull().references(() => abonnements.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mois: text('mois').notNull(), // 'YYYY-MM'
  pris: boolean('pris').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: text('type').notNull(), // 'Virement reçu' | 'Prélèvement' | etc.
  date: text('date').notNull(),
  category: text('category'),
  source: text('source').notNull().default('manual'), // 'manual' | 'qonto'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
