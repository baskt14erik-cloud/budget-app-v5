import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import { db, initDb } from './db.js';
import { currentMonth, getMonthRange } from './utils.js';
import { answerFinancialQuestion, generateFinancialInsights } from './aiService.js';
import { analyzeMaintenanceRequest } from './maintenanceService.js';
import { mergeIdentitySignals } from './identityParser.js';
import { buildIdentityReview } from './identityReview.js';

dotenv.config();
initDb();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MOBILE_URL = process.env.MOBILE_URL || 'exp://127.0.0.1:8081';

app.use(cors({ origin: [FRONTEND_URL, MOBILE_URL].filter(Boolean) }));
app.use(express.json({ limit: '1mb' }));

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  categoryId: z.number().int().positive(),
  amount: z.number().nonnegative(),
  description: z.string().min(2),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recurring: z.enum(['none', 'weekly', 'biweekly', 'monthly']).default('none'),
  notes: z.string().optional().default(''),
});

const categorySchema = z.object({
  name: z.string().min(2),
  type: z.enum(['income', 'expense']),
  color: z.string().min(4),
  icon: z.string().min(2),
});

const budgetSchema = z.object({
  categoryId: z.number().int().positive(),
  limitAmount: z.number().nonnegative(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

const savingsGoalSchema = z.object({
  name: z.string().min(2),
  targetAmount: z.number().nonnegative(),
  currentAmount: z.number().nonnegative(),
  targetDate: z.string().optional().nullable(),
});

const aiQuestionSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  question: z.string().min(3),
});

const maintenanceSchema = z.object({
  errorLog: z.string().min(8),
  goal: z.string().min(3).optional().default('corregir error'),
  changedFiles: z.array(z.string()).optional().default([]),
});


const identityAssistSchema = z.object({
  qrRaw: z.string().optional().default(''),
  ocrText: z.string().optional().default(''),
  manual: z.record(z.string()).optional().default({}),
});

const identitySchema = z.object({
  fullName: z.string().min(5),
  firstName: z.string().optional().default(''),
  paternalLastName: z.string().optional().default(''),
  maternalLastName: z.string().optional().default(''),
  curp: z.string().min(10),
  claveElector: z.string().min(10),
  cic: z.string().optional().default(''),
  ocr: z.string().optional().default(''),
  address: z.string().optional().default(''),
  section: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
});

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    curp: row.curp,
    claveElector: row.clave_elector,
    cic: row.cic,
    ocr: row.ocr,
    section: row.section,
    address: row.address,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
  };
}

function readBearerToken(header = '') {
  if (!header.startsWith('Bearer ')) return '';
  return header.slice('Bearer '.length).trim();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), version: '2.0.0' });
});

app.post('/api/auth/register-or-login', (req, res) => {
  const parsed = identitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Datos de identificación incompletos.' });

  const payload = parsed.data;
  const token = crypto.randomBytes(24).toString('hex');
  const existing = db.prepare('SELECT * FROM users WHERE curp = ?').get(payload.curp.toUpperCase());

  if (existing) {
    db.prepare(`
      UPDATE users
      SET full_name = ?, clave_elector = ?, cic = ?, ocr = ?, section = ?, address = ?, phone = ?, email = ?, session_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      payload.fullName,
      payload.claveElector.toUpperCase(),
      payload.cic || null,
      payload.ocr || null,
      payload.section || null,
      payload.address || null,
      payload.phone || null,
      payload.email || null,
      token,
      existing.id,
    );
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
    return res.json({ token, user: sanitizeUser(user), mode: 'login' });
  }

  const result = db.prepare(`
    INSERT INTO users (full_name, curp, clave_elector, cic, ocr, section, address, phone, email, session_token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    payload.fullName,
    payload.curp.toUpperCase(),
    payload.claveElector.toUpperCase(),
    payload.cic || null,
    payload.ocr || null,
    payload.section || null,
    payload.address || null,
    payload.phone || null,
    payload.email || null,
    token,
  );
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token, user: sanitizeUser(user), mode: 'register' });
});


app.post('/api/identity/assist', (req, res) => {
  const parsed = identityAssistSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: 'No se pudo analizar la identificación.' });
  const result = mergeIdentitySignals(parsed.data);
  res.json(result);
});



app.post('/api/identity/review', (req, res) => {
  const review = buildIdentityReview(req.body || {});
  res.json(review);
});

app.get('/api/auth/me', (req, res) => {
  const token = readBearerToken(req.headers.authorization || '');
  if (!token) return res.status(401).json({ error: 'Sesión no válida.' });
  const user = db.prepare('SELECT * FROM users WHERE session_token = ?').get(token);
  if (!user) return res.status(401).json({ error: 'Sesión expirada.' });
  res.json({ user: sanitizeUser(user) });
});

app.get('/api/categories', (_req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY type, name').all();
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const stmt = db.prepare('INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)');
    const result = stmt.run(parsed.data.name, parsed.data.type, parsed.data.color, parsed.data.icon);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (error) {
    res.status(409).json({ error: 'No se pudo crear la categoría. Verifica que no exista ya.' });
  }
});

app.get('/api/transactions', (req, res) => {
  const month = req.query.month || currentMonth();
  const { start, end } = getMonthRange(month);
  const transactions = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC, t.id DESC
  `).all(start, end);
  res.json(transactions);
});

app.post('/api/transactions', (req, res) => {
  const parsed = transactionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { type, categoryId, amount, description, date, recurring, notes } = parsed.data;
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
  if (!category) return res.status(404).json({ error: 'La categoría no existe.' });

  const stmt = db.prepare(`
    INSERT INTO transactions (type, category_id, amount, description, date, recurring, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(type, categoryId, amount, description, date, recurring, notes);
  const transaction = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(transaction);
});

app.delete('/api/transactions/:id', (req, res) => {
  const id = Number(req.params.id);
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
  const result = stmt.run(id);
  if (!result.changes) return res.status(404).json({ error: 'Movimiento no encontrado.' });
  res.status(204).send();
});

app.get('/api/budgets', (req, res) => {
  const month = req.query.month || currentMonth();
  const budgets = db.prepare(`
    SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    WHERE b.month = ?
    ORDER BY c.name
  `).all(month);
  res.json(budgets);
});

app.post('/api/budgets', (req, res) => {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { categoryId, limitAmount, month } = parsed.data;
  const stmt = db.prepare(`
    INSERT INTO budgets (category_id, limit_amount, month, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(category_id) DO UPDATE SET
      limit_amount = excluded.limit_amount,
      month = excluded.month,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(categoryId, limitAmount, month);
  const budget = db.prepare(`
    SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    WHERE b.category_id = ?
  `).get(categoryId);
  res.status(201).json(budget);
});

app.get('/api/savings-goals', (_req, res) => {
  const goals = db.prepare('SELECT * FROM savings_goals ORDER BY created_at DESC').all();
  res.json(goals);
});

app.post('/api/savings-goals', (req, res) => {
  const parsed = savingsGoalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, targetAmount, currentAmount, targetDate } = parsed.data;
  const stmt = db.prepare(`
    INSERT INTO savings_goals (name, target_amount, current_amount, target_date)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(name, targetAmount, currentAmount, targetDate || null);
  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(goal);
});

app.get('/api/dashboard', (req, res) => {
  const month = req.query.month || currentMonth();
  const { start, end } = getMonthRange(month);

  const incomeTotal = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE type = 'income' AND date BETWEEN ? AND ?
  `).get(start, end).total;

  const expenseTotal = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE type = 'expense' AND date BETWEEN ? AND ?
  `).get(start, end).total;

  const byCategory = db.prepare(`
    SELECT c.name, c.color, c.icon, t.type, ROUND(SUM(t.amount), 2) as total
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.date BETWEEN ? AND ?
    GROUP BY c.name, c.color, c.icon, t.type
    ORDER BY total DESC
  `).all(start, end);

  const budgetPerformance = db.prepare(`
    SELECT
      b.id,
      b.category_id,
      b.limit_amount,
      c.name,
      c.color,
      c.icon,
      ROUND(COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0), 2) AS spent,
      ROUND(b.limit_amount - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0), 2) AS remaining
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN transactions t ON t.category_id = b.category_id AND t.date BETWEEN ? AND ?
    WHERE b.month = ?
    GROUP BY b.id, b.category_id, b.limit_amount, c.name, c.color, c.icon
    ORDER BY spent DESC
  `).all(start, end, month);

  const recentTransactions = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.date BETWEEN ? AND ?
    ORDER BY date DESC, t.id DESC
    LIMIT 6
  `).all(start, end);

  res.json({
    month,
    incomeTotal,
    expenseTotal,
    balance: Number((incomeTotal - expenseTotal).toFixed(2)),
    savingsRate: incomeTotal > 0 ? Number((((incomeTotal - expenseTotal) / incomeTotal) * 100).toFixed(2)) : 0,
    byCategory,
    budgetPerformance,
    recentTransactions,
  });
});

app.get('/api/ai/insights', async (req, res, next) => {
  try {
    const month = req.query.month || currentMonth();
    const result = await generateFinancialInsights(month);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/coach', async (req, res, next) => {
  try {
    const parsed = aiQuestionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const result = await answerFinancialQuestion(parsed.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/maintenance/analyze', async (req, res, next) => {
  try {
    const parsed = maintenanceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const result = await analyzeMaintenanceRequest(parsed.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`API de presupuesto corriendo en http://localhost:${PORT}`);
});
