const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.detail || 'Ocurrió un error en la solicitud');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getDashboard: (month) => request(`/dashboard?month=${month}`),
  getCategories: () => request('/categories'),
  createCategory: (payload) => request('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  getTransactions: (month) => request(`/transactions?month=${month}`),
  createTransaction: (payload) => request('/transactions', { method: 'POST', body: JSON.stringify(payload) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
  getBudgets: (month) => request(`/budgets?month=${month}`),
  upsertBudget: (payload) => request('/budgets', { method: 'POST', body: JSON.stringify(payload) }),
  getGoals: () => request('/savings-goals'),
  createGoal: (payload) => request('/savings-goals', { method: 'POST', body: JSON.stringify(payload) }),
  getAiInsights: (month) => request(`/ai/insights?month=${month}`),
  askAiCoach: (payload) => request('/ai/coach', { method: 'POST', body: JSON.stringify(payload) }),
  analyzeMaintenance: (payload) => request('/ai/maintenance/analyze', { method: 'POST', body: JSON.stringify(payload) }),
};
