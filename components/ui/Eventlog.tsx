"use client";

import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

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
    color: 'text-bad',
    label: 'PHONE',
    message: 'PHONE DETECTED',
  },
  looking_away: {
    icon: AlertTriangle,
    color: 'text-okay',
    label: 'AWAY',
    message: 'LOOKED AWAY',
  },
  focus_streak: {
    icon: CheckCircle,
    color: 'text-good',
    label: 'STREAK',
    message: 'FOCUS STREAK',
  },
};

function EventLog({ events }: EventLogProps) {
  return (
    <div className="border border-white/10 bg-black/60">
      <div className="border-b border-white/10 px-4 py-2 text-[10px] font-mono text-white/50 tracking-wider">
        EVENT LOG
      </div>
      <div className="max-h-48 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1">
        {events.length === 0 ? (
          <div className="flex items-center gap-2 text-white/30 py-2">
            <Info className="h-3 w-3" />
            <span className="tracking-wider">NO DISTRACTIONS YET</span>
          </div>
        ) : (
          [...events].reverse().map((event, i) => {
            const config = eventConfig[event.type];
            const time = new Date(event.timestamp).toLocaleTimeString();
            const Icon = config.icon;
            return (
              <div
                key={event.timestamp + '-' + i}
                className="flex items-start gap-2"
              >
                <span className="text-white/30 shrink-0 w-16 tabular-nums">{time}</span>
                <div className={`flex items-center gap-1.5 shrink-0 ${config.color}`}>
                  <Icon className="h-3 w-3" />
                  <span className="tracking-wider">[{config.label}]</span>
                </div>
                <span className="text-white/50 tracking-wider">{config.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default EventLog;
