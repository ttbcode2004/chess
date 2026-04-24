import { useEffect, useState } from 'react';
import { useSocket } from '../contexts/socketContext';
import { friendsApi } from '../api/client';

interface Props {
  onOpen: () => void;
}

export default function NotificationBell({ onOpen }: Props) {
  const [count, setCount] = useState(0);
  const { on } = useSocket();

  useEffect(() => {
    friendsApi.requests()
      .then(r => setCount(r.data.requests.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Listen for new friend requests arriving via WS (server sends friend_request_received)
    const unsub = on('friend_request_received', () => setCount(c => c + 1));
    return unsub;
  }, [on]);

  return (
    <button
      onClick={onOpen}
      className="relative p-2 rounded-lg hover:bg-chess-card transition-colors text-chess-light hover:text-chess-text"
      title="Notifications"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-chess-red text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}