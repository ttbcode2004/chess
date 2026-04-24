import React, {
  createContext, useContext, useEffect, useRef, useCallback
} from 'react';
import { useAuthStore } from '../store/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

type Listener = (msg: any) => void;

interface SocketCtx {
  send:   (data: object) => void;
  on:     (type: string, fn: Listener) => () => void;
  isOpen: () => boolean;
}

const SocketContext = createContext<SocketCtx>(null!);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const wsRef        = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<Listener>>>(new Map());
  const reconnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (reconnTimer.current) {
        clearTimeout(reconnTimer.current);
      }
      dispatch({ type: '_connected' });
    };

    ws.onmessage = (e) => {
      try { dispatch(JSON.parse(e.data)); } catch { /* ignore */ }
    };

    ws.onclose = () => {
      dispatch({ type: '_disconnected' });
      if (token) reconnTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnTimer.current) {
        clearTimeout(reconnTimer.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  function dispatch(msg: any) {
    listenersRef.current.get(msg.type)?.forEach((fn) => fn(msg));
    listenersRef.current.get('*')?.forEach((fn) => fn(msg));
  }

  const send = useCallback((data: object) => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) {
      console.warn('WS not ready');
      return;
    }
    ws.send(JSON.stringify(data));
      }, []);

  const on = useCallback((type: string, fn: Listener) => {
    if (!listenersRef.current.has(type)) listenersRef.current.set(type, new Set());
    listenersRef.current.get(type)!.add(fn);
    return () => listenersRef.current.get(type)?.delete(fn);
  }, []);

  const isOpen = useCallback(() => wsRef.current?.readyState === WebSocket.OPEN, []);

  return (
    <SocketContext.Provider value={{ send, on, isOpen }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);