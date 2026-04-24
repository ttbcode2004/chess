interface AvatarProps {
  username: string;
  avatar?:  string | null;
  size?:    'sm' | 'md' | 'lg' | 'xl';
  online?:  boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: 'w-7 h-7',   text: 'text-xs',  dot: 'w-2.5 h-2.5' },
  md: { box: 'w-9 h-9',   text: 'text-sm',  dot: 'w-3 h-3'     },
  lg: { box: 'w-12 h-12', text: 'text-lg',  dot: 'w-3.5 h-3.5' },
  xl: { box: 'w-20 h-20', text: 'text-3xl', dot: 'w-4 h-4'     },
};

// Consistent color per username
const COLORS = [
  'bg-emerald-700', 'bg-sky-700', 'bg-violet-700',
  'bg-rose-700',    'bg-amber-700','bg-teal-700',
];
function colorFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return COLORS[h % COLORS.length];
}

export default function Avatar({ username, avatar, size = 'md', online, className = '' }: AvatarProps) {
  const { box, text, dot } = sizeMap[size];
  const bg = colorFor(username);

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className={`${box} rounded-full flex items-center justify-center font-semibold text-white uppercase overflow-hidden ${avatar ? '' : bg}`}>
        {avatar
          ? <img src={avatar} alt={username} className="w-full h-full object-cover" />
          : <span className={text}>{username[0]}</span>
        }
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${dot} rounded-full border-2 border-chess-panel ${online ? 'bg-chess-green' : 'bg-chess-hover'}`} />
      )}
    </div>
  );
}

