import { Clock, Target, AlertTriangle, Award } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  sessionSeconds: number;
  focusScore: number;
  eventsCount: number;
  rating: 'good' | 'okay' | 'bad';
  scoreHistory: Array<{ second: number; score: number }>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ratingConfig = {
  good: {
    icon: Award,
    label: 'GOOD',
    subtitle: 'FOCUS.MAINTAINED',
    color: 'text-good',
    borderColor: 'border-good/30',
    sparkColor: '#12B76A',
  },
  okay: {
    icon: Award,
    label: 'OKAY',
    subtitle: 'DISTRACTIONS.DETECTED',
    color: 'text-okay',
    borderColor: 'border-okay/30',
    sparkColor: '#F79009',
  },
  bad: {
    icon: AlertTriangle,
    label: 'NEEDS.IMPROVEMENT',
    subtitle: 'EXCESS.DISTRACTIONS',
    color: 'text-bad',
    borderColor: 'border-bad/30',
    sparkColor: '#F04438',
  },
};

const durationLabel = (s: number): string => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const secs = s % 60;
  return secs > 0 ? `${m}m ${secs}s` : `${m}m`;
};

export default function StatCard({ sessionSeconds, focusScore, eventsCount, rating, scoreHistory }: StatCardProps) {
  const r = ratingConfig[rating];
  const Icon = r.icon;

  return (
    <div className="border border-white/10 bg-black/60">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <div className={`flex items-center justify-center size-10 border ${r.borderColor} ${r.color}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className={`text-sm font-mono tracking-wider ${r.color}`}>{r.label}</div>
          <div className="text-[10px] font-mono text-white/40 tracking-wider">{r.subtitle}</div>
        </div>
      </div>

      {/* Hero Score */}
      <div className="px-4 pt-5 pb-2">
        <div className={`text-6xl font-bold font-mono tabular-nums leading-none ${r.color}`}>
          {focusScore}
          <span className="text-2xl font-normal text-white/30">%</span>
        </div>
        <div className="text-[10px] font-mono text-white/40 tracking-[0.15em] mt-1">
          FOCUS SCORE
        </div>
      </div>

      {/* Sparkline */}
      {scoreHistory.length > 1 && (
        <div className="px-4 py-1 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scoreHistory} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
              <Line
                type="monotone"
                dataKey="score"
                stroke={r.sparkColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Line */}
      <div className="px-4 pt-2 pb-4">
        <p className="text-sm font-mono text-white/60 leading-relaxed">
          {focusScore}% focused across {durationLabel(sessionSeconds)},{' '}
          {eventsCount} distraction{eventsCount !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Secondary Stats Row */}
      <div className="border-t border-white/10 grid grid-cols-2 divide-x divide-white/10">
        <div className="flex flex-col items-center justify-center py-3">
          <Clock className={`size-3.5 mb-0.5 ${r.color}`} />
          <div className="text-sm font-mono tabular-nums text-white/70 leading-none">{formatTime(sessionSeconds)}</div>
          <div className="text-[8px] font-mono text-white/40 tracking-[0.15em] mt-1">DURATION</div>
        </div>
        <div className="flex flex-col items-center justify-center py-3">
          <Target className={`size-3.5 mb-0.5 ${r.color}`} />
          <div className="text-sm font-mono tabular-nums text-white/70 leading-none">{eventsCount}</div>
          <div className="text-[8px] font-mono text-white/40 tracking-[0.15em] mt-1">EVENTS</div>
        </div>
      </div>
    </div>
  );
}
