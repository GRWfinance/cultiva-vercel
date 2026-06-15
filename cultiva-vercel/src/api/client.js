// Cliente HTTP central - conecta ao backend (funções serverless em /api)
// Por padrão usa caminho relativo, já que no Vercel frontend e backend
// ficam no mesmo domínio. Defina VITE_API_URL apenas se o backend estiver
// em outro domínio.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('cultiva_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('cultiva_token', token);
  else localStorage.removeItem('cultiva_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Erro ${res.status}`);
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export { API_BASE, getToken };
