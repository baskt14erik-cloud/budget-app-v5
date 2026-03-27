import { useState } from 'react';

export default function BudgetForm({ categories, month, onSubmit, busy }) {
  const [form, setForm] = useState({
    categoryId: categories?.[0]?.id ?? '',
    limitAmount: '',
  });

  const expenseCategories = categories.filter((category) => category.type === 'expense');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({
      categoryId: Number(form.categoryId),
      limitAmount: Number(form.limitAmount),
      month,
    });
    setForm((prev) => ({ ...prev, limitAmount: '' }));
  };

  return (
    <form className="form-card glass-card" onSubmit={handleSubmit}>
      <h3>Asignar presupuesto mensual</h3>
      <div className="form-grid compact">
        <label>
          Categoría
          <select value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          Límite
          <input type="number" min="0" step="0.01" value={form.limitAmount} onChange={(e) => setForm((prev) => ({ ...prev, limitAmount: e.target.value }))} required />
        </label>
      </div>
      <button className="primary-button" disabled={busy}>{busy ? 'Guardando...' : 'Guardar presupuesto'}</button>
    </form>
  );
}
