"use client";

import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventEntry {
  type: "phone" | "looking_away" | "focus_streak";
  timestamp: number;
}

interface EventLogProps {
  events: EventEntry[];
}

const eventConfig = {
  phone: {
    icon: AlertTriangle,
    color: 'text-red-400',
    label: 'PHONE',
    message: 'Phone detected',
  },
  looking_away: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    label: 'AWAY',
    message: 'Looked away from screen',
  },
  focus_streak: {
    icon: CheckCircle,
    color: 'text-green-400',
    label: 'STREAK',
    message: 'Focus streak milestone reached',
  },
};

function EventLog({ events }: EventLogProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-black/40">
      <div className="border-b border-slate-800 px-4 py-2 text-xs font-mono text-slate-500">
        Event Log
      </div>
      <div className="max-h-48 overflow-y-auto p-3 font-mono text-xs space-y-1.5">
        {events.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-500 py-2">
            <Info className="h-3.5 w-3.5" />
            <span>No distractions yet</span>
          </div>
        ) : (
          [...events].reverse().map((event, i) => {
            const config = eventConfig[event.type];
            const time = new Date(event.timestamp).toLocaleTimeString();
            const Icon = config.icon;
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-600 shrink-0 w-16">{time}</span>
                <div className={cn("flex items-center gap-1.5 font-bold shrink-0", config.color)}>
                  <Icon className="h-3.5 w-3.5" />
                  <span>[{config.label}]</span>
                </div>
                <span className="text-slate-300">{config.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default EventLog;
