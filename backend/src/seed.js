import { db, initDb } from './db.js';

initDb();

const categories = [
  ['Salario', 'income', '#16a34a', 'briefcase'],
  ['Renta', 'expense', '#ef4444', 'home'],
  ['Comida', 'expense', '#f59e0b', 'utensils'],
  ['Transporte', 'expense', '#3b82f6', 'car'],
  ['Servicios', 'expense', '#8b5cf6', 'bolt'],
  ['Ahorro', 'expense', '#10b981', 'piggy-bank'],
  ['Freelance', 'income', '#06b6d4', 'laptop'],
  ['Salud', 'expense', '#ec4899', 'heart-pulse']
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, type, color, icon)
  VALUES (?, ?, ?, ?)
`);

const insertTransaction = db.prepare(`
  INSERT INTO transactions (type, category_id, amount, description, date, recurring, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertBudget = db.prepare(`
  INSERT OR REPLACE INTO budgets (id, category_id, limit_amount, month, created_at, updated_at)
  VALUES (
    COALESCE((SELECT id FROM budgets WHERE category_id = ?), NULL),
    ?, ?, ?, COALESCE((SELECT created_at FROM budgets WHERE category_id = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP
  )
`);

const insertGoal = db.prepare(`
  INSERT INTO savings_goals (name, target_amount, current_amount, target_date)
  VALUES (?, ?, ?, ?)
`);

const clearTables = db.prepare(`
  DELETE FROM transactions;
  DELETE FROM budgets;
  DELETE FROM savings_goals;
  DELETE FROM categories;
  DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'budgets', 'savings_goals', 'categories');
`);

clearTables.run();
categories.forEach((category) => insertCategory.run(...category));

const categoryMap = Object.fromEntries(
  db.prepare('SELECT id, name FROM categories').all().map((row) => [row.name, row.id])
);

const today = new Date();
const month = today.toISOString().slice(0, 7);
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, '0');

[
  ['income', categoryMap['Salario'], 9800, 'Pago quincenal', `${y}-${m}-01`, 'biweekly', 'Ingreso principal'],
  ['income', categoryMap['Freelance'], 3200, 'Asesoría financiera', `${y}-${m}-05`, 'none', 'Cliente cooperativa'],
  ['expense', categoryMap['Renta'], 4500, 'Pago de renta', `${y}-${m}-03`, 'monthly', 'Casa'],
  ['expense', categoryMap['Comida'], 2400, 'Supermercado y comidas', `${y}-${m}-08`, 'weekly', 'Promedio mensual'],
  ['expense', categoryMap['Transporte'], 900, 'Gasolina y traslados', `${y}-${m}-10`, 'weekly', 'Movilidad'],
  ['expense', categoryMap['Servicios'], 525, 'Internet y luz', `${y}-${m}-12`, 'monthly', 'Servicios básicos'],
  ['expense', categoryMap['Ahorro'], 1500, 'Apartado para ahorro', `${y}-${m}-15`, 'monthly', 'Meta fondo emergencia'],
  ['expense', categoryMap['Salud'], 650, 'Medicinas', `${y}-${m}-16`, 'none', 'Consulta general']
].forEach((tx) => insertTransaction.run(...tx));

[
  ['Comida', 3000],
  ['Transporte', 1200],
  ['Servicios', 700],
  ['Salud', 1000],
  ['Ahorro', 2000]
].forEach(([name, amount]) => {
  const id = categoryMap[name];
  insertBudget.run(id, id, amount, month, id);
});

[
  ['Fondo de emergencia', 30000, 4500, `${y + 1}-${m}-30`],
  ['Vacaciones', 12000, 1800, `${y}-${m}-28`]
].forEach((goal) => insertGoal.run(...goal));

console.log('Base de datos inicializada con datos de ejemplo.');
