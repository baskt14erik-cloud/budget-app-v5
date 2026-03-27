const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:4000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    let message = 'Error de red';
    try {
      const data = await response.json();
      message = data.error || data.message || message;
    } catch {
      message = `${response.status} ${response.statusText}`;
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const mobileApi = {
  getDashboard: (month) => request(`/api/dashboard?month=${month}`),
  getTransactions: (month) => request(`/api/transactions?month=${month}`),
  getCategories: () => request('/api/categories'),
  getAiInsights: (month) => request(`/api/ai/insights?month=${month}`),
  askAiCoach: (payload) => request('/api/ai/coach', { method: 'POST', body: JSON.stringify(payload) }),
  createTransaction: (payload) => request('/api/transactions', { method: 'POST', body: JSON.stringify(payload) }),
  assistIdentity: (payload) => request('/api/identity/assist', { method: 'POST', body: JSON.stringify(payload) }),
  reviewIdentity: (payload) => request('/api/identity/review', { method: 'POST', body: JSON.stringify(payload) }),
  registerOrLogin: (payload) => request('/api/auth/register-or-login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: (token) => request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
};
