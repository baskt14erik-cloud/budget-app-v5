import { NavLink, Route, Routes } from 'react-router-dom';
import { LayoutDashboard, WalletCards, Goal, PiggyBank, Sparkles } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import AiPage from './pages/AiPage';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/movimientos', label: 'Movimientos', icon: WalletCards },
  { to: '/presupuestos', label: 'Presupuestos', icon: PiggyBank },
  { to: '/metas', label: 'Metas', icon: Goal },
  { to: '/ia', label: 'IA', icon: Sparkles },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-card">
            <img src="/brand-mark.svg" alt="Marca de la app" className="brand-mark" />
            <div>
              <p className="eyebrow">Suite financiera</p>
              <h1>Presupuesto Personal Pro AI</h1>
              <p className="muted">Controla ingresos, gastos, metas y hábitos con soporte inteligente.</p>
            </div>
          </div>

          <nav className="nav-stack">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer glass-card">
          <img src="/hero-budget.png" alt="Ilustración de finanzas" className="sidebar-art" />
          <strong>Planifica con visión</strong>
          <p className="muted">Ahora con recomendaciones financieras, coach IA y analizador técnico para depuración.</p>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/movimientos" element={<TransactionsPage />} />
          <Route path="/presupuestos" element={<BudgetsPage />} />
          <Route path="/metas" element={<GoalsPage />} />
          <Route path="/ia" element={<AiPage />} />
        </Routes>
      </main>
    </div>
  );
}
