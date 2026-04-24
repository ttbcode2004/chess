import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  email: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  avatar: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

const storedToken = localStorage.getItem('token');
const storedUser  = localStorage.getItem('user');

export const useAuthStore = create<AuthState>((set) => ({
  user:  storedUser  ? JSON.parse(storedUser)  : null,
  token: storedToken ?? null,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user',  JSON.stringify(user));
    set({ user, token });
  },

  updateUser: (partial) =>
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...partial };
      localStorage.setItem('user', JSON.stringify(updated));
      return { user: updated };
    }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));