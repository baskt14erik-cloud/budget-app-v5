import { useEffect, useState } from 'react';
import { api } from '../api';
import SectionHeader from '../components/SectionHeader';
import GoalForm from '../components/GoalForm';
import EmptyState from '../components/EmptyState';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setGoals(await api.getGoals());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createGoal = async (payload) => {
    try {
      setSaving(true);
      await api.createGoal(payload);
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
        title="Metas de ahorro"
        subtitle="Mantén visibles tus objetivos financieros y mide su progreso en porcentaje."
      />
      {error ? <div className="error-panel glass-card">{error}</div> : null}
      <GoalForm onSubmit={createGoal} busy={saving} />
      <section className="glass-card list-card">
        <h3>Objetivos</h3>
        {loading ? (
          <div className="loading-panel">Cargando metas...</div>
        ) : goals.length ? (
          <div className="goal-grid">
            {goals.map((goal) => {
              const progress = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
              return (
                <article key={goal.id} className="goal-card">
                  <div className="goal-card-top">
                    <div>
                      <strong>{goal.name}</strong>
                      <p className="muted">Meta {money.format(goal.target_amount)}</p>
                    </div>
                    <span className="goal-percent">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="muted">Ahorrado {money.format(goal.current_amount)}</p>
                  <p className="muted">Fecha objetivo: {goal.target_date || 'Sin definir'}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Sin metas configuradas" description="Define objetivos como fondo de emergencia, viaje o pago de deudas." />
        )}
      </section>
    </div>
  );
}
