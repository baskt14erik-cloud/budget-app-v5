import { useEffect, useState } from 'react';
import { api } from '../api';
import SectionHeader from '../components/SectionHeader';
import MonthPicker from '../components/MonthPicker';
import BudgetForm from '../components/BudgetForm';
import EmptyState from '../components/EmptyState';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function BudgetsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [budgetRows, cats] = await Promise.all([api.getBudgets(month), api.getCategories()]);
      setBudgets(budgetRows);
      setCategories(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const createBudget = async (payload) => {
    try {
      setSaving(true);
      await api.upsertBudget(payload);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <SectionHeader
        title="Presupuestos mensuales"
        subtitle="Define límites por categoría para detectar desviaciones a tiempo."
        action={<MonthPicker month={month} onChange={setMonth} />}
      />
      {error ? <div className="error-panel glass-card">{error}</div> : null}
      <BudgetForm categories={categories} month={month} onSubmit={createBudget} busy={saving} />
      <section className="glass-card list-card">
        <h3>Límites configurados</h3>
        {loading ? (
          <div className="loading-panel">Cargando presupuestos...</div>
        ) : budgets.length ? (
          <div className="budget-list">
            {budgets.map((budget) => (
              <div key={budget.id} className="budget-row simple">
                <div>
                  <strong>{budget.category_name}</strong>
                  <p className="muted">Mes {budget.month}</p>
                </div>
                <div>
                  <strong>{money.format(budget.limit_amount)}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Aún no tienes presupuestos" description="Crea tu primer límite mensual por categoría." />
        )}
      </section>
    </div>
  );
}
