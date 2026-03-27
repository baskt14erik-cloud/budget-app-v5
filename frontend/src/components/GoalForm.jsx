import { useState } from 'react';

export default function GoalForm({ onSubmit, busy }) {
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({
      name: form.name,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount),
      targetDate: form.targetDate || null,
    });
    setForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
  };

  return (
    <form className="form-card glass-card" onSubmit={handleSubmit}>
      <h3>Nueva meta de ahorro</h3>
      <div className="form-grid compact">
        <label>
          Nombre
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </label>
        <label>
          Meta total
          <input type="number" min="0" step="0.01" value={form.targetAmount} onChange={(e) => update('targetAmount', e.target.value)} required />
        </label>
        <label>
          Ahorrado
          <input type="number" min="0" step="0.01" value={form.currentAmount} onChange={(e) => update('currentAmount', e.target.value)} required />
        </label>
        <label>
          Fecha objetivo
          <input type="date" value={form.targetDate} onChange={(e) => update('targetDate', e.target.value)} />
        </label>
      </div>
      <button className="primary-button" disabled={busy}>{busy ? 'Guardando...' : 'Crear meta'}</button>
    </form>
  );
}
