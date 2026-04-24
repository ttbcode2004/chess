import axios from 'axios';

const api = axios.create({
  baseURL: 'https://chessbackend-utdx.onrender.com/api/v1',
  timeout: 10000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  search: (q: string) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getById: (id: string) => api.get(`/users/getUser/${id}`),
  getOnlineUsers: () => api.get(`/users/getOnlineUsers`)
};

// ── Games ──────────────────────────────────────────────────────────────────
export const gamesApi = {
  list:    ()            => api.get('/games'),
  leaderboard:    ()            => api.get('/games/leaderBoard'),
  getById: (id: string)  => api.get(`/games/${id}`),
};
