import { Clock, Target, AlertTriangle, Award } from 'lucide-react';

interface StatCardProps {
  sessionSeconds: number;
  focusScore: number;
  eventsCount: number;
  rating: 'good' | 'okay' | 'bad';
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
    gaugeColor: 'text-good',
  },
  okay: {
    icon: Award,
    label: 'OKAY',
    subtitle: 'DISTRACTIONS.DETECTED',
    color: 'text-okay',
    borderColor: 'border-okay/30',
    gaugeColor: 'text-okay',
  },
  bad: {
    icon: AlertTriangle,
    label: 'NEEDS.IMPROVEMENT',
    subtitle: 'EXCESS.DISTRACTIONS',
    color: 'text-bad',
    borderColor: 'border-bad/30',
    gaugeColor: 'text-bad',
  },
};

export default function StatCard({ sessionSeconds, focusScore, eventsCount, rating }: StatCardProps) {
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

      {/* Stats grid */}
      <div className="grid grid-cols-3 divide-x divide-white/10">
        <div className="flex flex-col items-center justify-center py-4 px-2">
          <Clock className={`size-4 mb-1 ${r.color}`} />
          <div className="text-lg font-mono tabular-nums text-white/90 leading-none">{formatTime(sessionSeconds)}</div>
          <div className="text-[9px] font-mono text-white/40 tracking-[0.15em] mt-1">DURATION</div>
        </div>

        <div className="flex flex-col items-center justify-center py-4 px-2">
          <Target className={`size-4 mb-1 ${r.color}`} />
          <div className="text-lg font-mono tabular-nums text-white/90 leading-none">{focusScore}%</div>
          <div className="text-[9px] font-mono text-white/40 tracking-[0.15em] mt-1">FOCUS</div>
        </div>

        <div className="flex flex-col items-center justify-center py-4 px-2">
          <AlertTriangle className={`size-4 mb-1 ${r.color}`} />
          <div className="text-lg font-mono tabular-nums text-white/90 leading-none">{eventsCount}</div>
          <div className="text-[9px] font-mono text-white/40 tracking-[0.15em] mt-1">EVENTS</div>
        </div>
      </div>
    </div>
  );
}
