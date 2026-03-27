import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../api';
import SectionHeader from '../components/SectionHeader';
import TransactionForm from '../components/TransactionForm';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function TransactionsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [txs, cats] = await Promise.all([api.getTransactions(month), api.getCategories()]);
      setTransactions(txs);
      setCategories(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const createTransaction = async (payload) => {
    try {
      setSaving(true);
      await api.createTransaction(payload);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeTransaction = async (id) => {
    try {
      await api.deleteTransaction(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-stack">
      <SectionHeader
        title="Movimientos"
        subtitle="Registra ingresos y gastos en tiempo real para mantener un historial confiable."
        action={<MonthPicker month={month} onChange={setMonth} />}
      />
      {error ? <div className="error-panel glass-card">{error}</div> : null}
      <TransactionForm categories={categories} onSubmit={createTransaction} busy={saving} />
      <section className="glass-card list-card">
        <h3>Historial del mes</h3>
        {loading ? (
          <div className="loading-panel">Cargando movimientos...</div>
        ) : transactions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td>
                      <strong>{tx.description}</strong>
                      <div className="muted small-text">{tx.notes || 'Sin notas'}</div>
                    </td>
                    <td>{tx.category_name}</td>
                    <td>
                      <span className={`badge ${tx.type}`}>{tx.type === 'income' ? 'Ingreso' : 'Gasto'}</span>
                    </td>
                    <td className={tx.type === 'income' ? 'positive' : 'negative'}>{money.format(tx.amount)}</td>
                    <td>
                      <button className="icon-button" onClick={() => removeTransaction(tx.id)} aria-label="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No hay movimientos" description="Registra tu primer ingreso o gasto para este mes." />
        )}
      </section>
    </div>
  );
}
