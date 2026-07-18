import { Card, CardContent } from '@/components/ui/card';
import { Clock, Target, AlertTriangle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    headline: 'Good',
    message: 'You stayed mostly focused',
    color: 'text-green-500',
    borderColor: 'border-green-200 dark:border-green-800',
    gaugeColor: 'text-green-600 dark:text-green-400',
  },
  okay: {
    icon: Award,
    headline: 'Okay',
    message: 'Some distractions detected',
    color: 'text-amber-500',
    borderColor: 'border-amber-200 dark:border-amber-800',
    gaugeColor: 'text-amber-600 dark:text-amber-400',
  },
  bad: {
    icon: AlertTriangle,
    headline: 'Needs Improvement',
    message: 'Too many distractions',
    color: 'text-red-500',
    borderColor: 'border-red-200 dark:border-red-800',
    gaugeColor: 'text-red-600 dark:text-red-400',
  },
};

export default function StatCard({ sessionSeconds, focusScore, eventsCount, rating }: StatCardProps) {
  const r = ratingConfig[rating];
  const Icon = r.icon;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('rounded-xl flex items-center justify-center size-12 border', r.borderColor, r.color)}>
          <Icon className="size-6" />
        </div>
        <div>
          <div className={cn('text-xl font-bold leading-none', r.color)}>{r.headline}</div>
          <div className="text-sm text-muted-foreground">{r.message}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <div className={cn('rounded-xl flex items-center justify-center size-10 border', r.borderColor, r.gaugeColor)}>
              <Clock className="size-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold text-foreground leading-none">{formatTime(sessionSeconds)}</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <div className={cn('rounded-xl flex items-center justify-center size-10 border', r.borderColor, r.gaugeColor)}>
              <Target className="size-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold text-foreground leading-none">{focusScore}%</div>
              <div className="text-sm text-muted-foreground">Focus Score</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <div className={cn('rounded-xl flex items-center justify-center size-10 border', r.borderColor, r.gaugeColor)}>
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold text-foreground leading-none">{eventsCount}</div>
              <div className="text-sm text-muted-foreground">Distractions</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
