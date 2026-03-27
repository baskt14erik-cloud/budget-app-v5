import OpenAI from 'openai';
import { db } from './db.js';
import { currentMonth, getMonthRange } from './utils.js';

const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
const client = hasOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function loadFinanceContext(month = currentMonth()) {
  const { start, end } = getMonthRange(month);

  const incomeTotal = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE type = 'income' AND date BETWEEN ? AND ?
  `).get(start, end).total;

  const expenseTotal = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE type = 'expense' AND date BETWEEN ? AND ?
  `).get(start, end).total;

  const topExpenses = db.prepare(`
    SELECT c.name, ROUND(SUM(t.amount), 2) as total
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.type = 'expense' AND t.date BETWEEN ? AND ?
    GROUP BY c.name
    ORDER BY total DESC
    LIMIT 5
  `).all(start, end);

  const budgets = db.prepare(`
    SELECT
      c.name,
      ROUND(b.limit_amount, 2) AS budget,
      ROUND(COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END),0), 2) AS spent
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN transactions t ON t.category_id = b.category_id AND t.date BETWEEN ? AND ?
    WHERE b.month = ?
    GROUP BY c.name, b.limit_amount
    ORDER BY spent DESC
  `).all(start, end, month);

  return {
    month,
    incomeTotal,
    expenseTotal,
    balance: Number((incomeTotal - expenseTotal).toFixed(2)),
    savingsRate: incomeTotal > 0 ? Number((((incomeTotal - expenseTotal) / incomeTotal) * 100).toFixed(2)) : 0,
    topExpenses,
    budgets,
  };
}

function buildFallbackInsights(context) {
  const warnings = [];
  const wins = [];
  const actions = [];

  if (context.balance < 0) {
    warnings.push('Tus gastos del mes ya superan tus ingresos.');
    actions.push('Congela durante 7 días cualquier gasto no esencial.');
  } else {
    wins.push('Tu balance del mes sigue en positivo.');
  }

  if (context.savingsRate < 10) {
    warnings.push('La tasa de ahorro está por debajo de 10%.');
    actions.push('Asigna primero un porcentaje fijo al ahorro antes de repartir gastos variables.');
  } else {
    wins.push('Tu tasa de ahorro está por arriba del umbral mínimo de 10%.');
  }

  const overspent = context.budgets.filter((item) => item.spent > item.budget);
  if (overspent.length) {
    warnings.push(`Tienes ${overspent.length} categoría(s) por encima del presupuesto.`);
    actions.push(`Revisa primero ${overspent[0].name}, porque ya excedió su tope.`);
  }

  if (context.topExpenses[0]) {
    actions.push(`Tu gasto más fuerte es ${context.topExpenses[0].name}; define un sublímite semanal para controlarlo.`);
  }

  return {
    provider: 'rules',
    summary: `En ${context.month} llevas ${context.balance >= 0 ? 'superávit' : 'déficit'} de MXN ${context.balance}.`,
    wins,
    warnings,
    actions,
  };
}

export async function generateFinancialInsights(month) {
  const context = loadFinanceContext(month);

  if (!client) {
    return { ...buildFallbackInsights(context), context };
  }

  const prompt = `Eres un coach financiero sobrio y práctico. Analiza este resumen financiero mensual y responde SOLO JSON con las claves summary, wins, warnings, actions.\n\n${JSON.stringify(context, null, 2)}`;

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: prompt,
    });

    const raw = response.output_text || '{}';
    const parsed = JSON.parse(raw);
    return { provider: 'openai', ...parsed, context };
  } catch (error) {
    return {
      ...buildFallbackInsights(context),
      context,
      provider: 'rules',
      note: `Se usó modo local por un problema con IA remota: ${error.message}`,
    };
  }
}

export async function answerFinancialQuestion({ month, question }) {
  const context = loadFinanceContext(month);

  if (!client) {
    return {
      provider: 'rules',
      answer: `No tengo OPENAI_API_KEY configurada. Respuesta local: con base en ${context.month}, tus ingresos son MXN ${context.incomeTotal}, tus gastos MXN ${context.expenseTotal} y tu balance MXN ${context.balance}. Pregunta recibida: ${question}`,
      context,
    };
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: `Actúa como analista financiero personal. Responde en español, claro y accionable.\nContexto: ${JSON.stringify(context)}\nPregunta del usuario: ${question}`,
    });

    return {
      provider: 'openai',
      answer: response.output_text,
      context,
    };
  } catch (error) {
    return {
      provider: 'rules',
      answer: `No pude consultar el motor de IA. Error: ${error.message}`,
      context,
    };
  }
}
