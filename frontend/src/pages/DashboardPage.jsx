import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function DashboardPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        setData(await api.getDashboard(month));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  if (loading) return <div className="loading-panel glass-card">Cargando dashboard...</div>;
  if (error) return <div className="error-panel glass-card">{error}</div>;

  const expenseCategories = data.byCategory.filter((item) => item.type === 'expense');

  return (
    <div className="page-stack">
      <SectionHeader
        title="Visión general"
        subtitle="Analiza tu flujo de efectivo, tus gastos por categoría y el avance contra presupuestos."
        action={<MonthPicker month={month} onChange={setMonth} />}
      />

      <section className="stats-grid">
        <StatCard title="Ingresos" value={money.format(data.incomeTotal)} helper="Entradas del mes" />
        <StatCard title="Gastos" value={money.format(data.expenseTotal)} helper="Salidas registradas" />
        <StatCard title="Balance" value={money.format(data.balance)} helper="Ingreso - gasto" />
        <StatCard title="Tasa de ahorro" value={`${data.savingsRate}%`} helper="Porcentaje del ingreso que conservas" />
      </section>

      <section className="content-grid">
        <div className="glass-card chart-card">
          <h3>Gastos por categoría</h3>
          {expenseCategories.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={expenseCategories} dataKey="total" nameKey="name" innerRadius={80} outerRadius={115} paddingAngle={2}>
                  {expenseCategories.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => money.format(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Sin gastos cargados" description="Registra movimientos para ver la distribución por categoría." />
          )}
        </div>

        <div className="glass-card chart-card">
          <h3>Rendimiento del presupuesto</h3>
          {data.budgetPerformance.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.budgetPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => money.format(Number(value))} />
                <Bar dataKey="spent" radius={[8, 8, 0, 0]}>
                  {data.budgetPerformance.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No hay presupuestos" description="Crea límites mensuales para comparar tu gasto real." />
          )}
        </div>
      </section>

      <section className="glass-card list-card">
        <h3>Detalle de presupuestos</h3>
        {data.budgetPerformance.length ? (
          <div className="budget-list">
            {data.budgetPerformance.map((item) => {
              const percent = item.limit_amount > 0 ? Math.min((item.spent / item.limit_amount) * 100, 100) : 0;
              return (
                <div key={item.id} className="budget-row">
                  <div>
                    <strong>{item.name}</strong>
                    <p className="muted">Gastado {money.format(item.spent)} de {money.format(item.limit_amount)}</p>
                  </div>
                  <div className="budget-progress-wrap">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${percent}%`, background: item.color }} />
                    </div>
                    <span className="muted">Restante {money.format(item.remaining)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Presupuestos pendientes" description="Configura al menos un presupuesto mensual para comenzar." />
        )}
      </section>
    </div>
  );
}
