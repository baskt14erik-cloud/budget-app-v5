import { useEffect, useState } from 'react';
import { WandSparkles, Bot, Wrench } from 'lucide-react';
import { api } from '../api';
import MonthPicker from '../components/MonthPicker';
import SectionHeader from '../components/SectionHeader';

export default function AiPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [insights, setInsights] = useState(null);
  const [question, setQuestion] = useState('¿Qué ajuste me conviene hacer para ahorrar más este mes?');
  const [answer, setAnswer] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [errorLog, setErrorLog] = useState('Error: Failed to fetch en /api/dashboard cuando el frontend corre en otro puerto');
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        setInsights(await api.getAiInsights(month));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  const handleAskCoach = async (e) => {
    e.preventDefault();
    try {
      setCoachLoading(true);
      const result = await api.askAiCoach({ month, question });
      setAnswer(result.answer);
    } catch (err) {
      setAnswer(err.message);
    } finally {
      setCoachLoading(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    try {
      const result = await api.analyzeMaintenance({
        goal: 'Corregir error y proponer mejora segura',
        changedFiles: ['frontend/src/api.js', 'backend/src/server.js'],
        errorLog,
      });
      setMaintenance(result);
    } catch (err) {
      setMaintenance({ summary: err.message, findings: [], patches: [], caution: '' });
    }
  };

  return (
    <div className="page-stack">
      <SectionHeader
        title="Centro de IA"
        subtitle="Obtén recomendaciones financieras, respuestas sobre tu presupuesto y análisis técnico para depurar la app."
        action={<MonthPicker month={month} onChange={setMonth} />}
      />

      {loading ? <div className="loading-panel glass-card">Analizando tu mes...</div> : null}
      {error ? <div className="error-panel glass-card">{error}</div> : null}

      {insights ? (
        <section className="content-grid ai-grid-top">
          <article className="glass-card ai-card">
            <div className="ai-card-head">
              <WandSparkles size={20} />
              <div>
                <h3>Lectura inteligente del mes</h3>
                <p className="muted">Motor: {insights.provider}</p>
              </div>
            </div>
            <p className="ai-summary">{insights.summary}</p>

            <div className="pill-section">
              <strong>Aciertos</strong>
              <div className="pill-wrap">
                {(insights.wins || []).map((item) => <span key={item} className="pill success">{item}</span>)}
              </div>
            </div>

            <div className="pill-section">
              <strong>Alertas</strong>
              <div className="pill-wrap">
                {(insights.warnings || []).map((item) => <span key={item} className="pill danger">{item}</span>)}
              </div>
            </div>

            <div className="pill-section">
              <strong>Siguientes pasos</strong>
              <ol className="ai-list">
                {(insights.actions || []).map((item) => <li key={item}>{item}</li>)}
              </ol>
            </div>
          </article>

          <article className="glass-card ai-card">
            <div className="ai-card-head">
              <Bot size={20} />
              <div>
                <h3>Coach financiero</h3>
                <p className="muted">Haz preguntas libres usando tu contexto del mes.</p>
              </div>
            </div>
            <form className="page-stack" onSubmit={handleAskCoach}>
              <textarea className="app-textarea" value={question} onChange={(e) => setQuestion(e.target.value)} rows={5} />
              <button className="primary-button" disabled={coachLoading}>
                {coachLoading ? 'Pensando...' : 'Preguntar a la IA'}
              </button>
            </form>
            {answer ? (
              <div className="ai-answer-box">
                <strong>Respuesta</strong>
                <p>{answer}</p>
              </div>
            ) : null}
          </article>
        </section>
      ) : null}

      <section className="glass-card ai-card">
        <div className="ai-card-head">
          <Wrench size={20} />
          <div>
            <h3>Analizador de errores de programación</h3>
            <p className="muted">Evalúa logs y propone correcciones. Está preparado para ayudarte a depurar, pero no modifica el código solo.</p>
          </div>
        </div>

        <form className="page-stack" onSubmit={handleAnalyze}>
          <textarea className="app-textarea" value={errorLog} onChange={(e) => setErrorLog(e.target.value)} rows={8} />
          <button className="primary-button">Analizar error</button>
        </form>

        {maintenance ? (
          <div className="maintenance-box">
            <p className="ai-summary">{maintenance.summary}</p>
            <div className="content-grid slim-grid">
              <div>
                <strong>Hallazgos</strong>
                <ul className="ai-list">
                  {(maintenance.findings || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <strong>Correcciones sugeridas</strong>
                <ul className="ai-list">
                  {(maintenance.patches || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
            {maintenance.caution ? <p className="muted small-text">{maintenance.caution}</p> : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
