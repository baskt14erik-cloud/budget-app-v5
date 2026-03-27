import { useMemo, useState } from 'react';

const defaultState = (categories) => ({
  type: 'expense',
  categoryId: categories?.[0]?.id ?? '',
  amount: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  recurring: 'none',
  notes: '',
});

export default function TransactionForm({ categories, onSubmit, busy }) {
  const [form, setForm] = useState(defaultState(categories));
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type]
  );

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleTypeChange = (value) => {
    const category = categories.find((item) => item.type === value);
    setForm((prev) => ({ ...prev, type: value, categoryId: category?.id ?? '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      categoryId: Number(form.categoryId),
      amount: Number(form.amount),
    });
    setForm(defaultState(categories));
  };

  return (
    <form className="form-card glass-card" onSubmit={handleSubmit}>
      <h3>Registrar movimiento</h3>
      <div className="form-grid">
        <label>
          Tipo
          <select value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
        </label>
        <label>
          Categoría
          <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} required>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          Monto
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => update('amount', e.target.value)} required />
        </label>
        <label>
          Fecha
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
        </label>
        <label className="span-2">
          Descripción
          <input value={form.description} onChange={(e) => update('description', e.target.value)} required />
        </label>
        <label>
          Repetición
          <select value={form.recurring} onChange={(e) => update('recurring', e.target.value)}>
            <option value="none">No recurrente</option>
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quincenal</option>
            <option value="monthly">Mensual</option>
          </select>
        </label>
        <label>
          Notas
          <input value={form.notes} onChange={(e) => update('notes', e.target.value)} />
        </label>
      </div>
      <button className="primary-button" disabled={busy}>{busy ? 'Guardando...' : 'Guardar movimiento'}</button>
    </form>
  );
}
