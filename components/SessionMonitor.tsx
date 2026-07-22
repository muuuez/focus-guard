"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWebcam } from "@/hooks/useWebcam";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useObjectDetection } from "@/hooks/useObjectDetection";
import { useFocusScore } from "@/hooks/useFocusScore";
import { Badge } from "@/components/ui/FocusBadge";
import { FocusGauge } from "@/components/ui/FocusGauge";
import EventLog from "@/components/ui/EventLog";
import StatCard from "@/components/ui/StatCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/FocusLineChart";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getAllSessions, clearAllSessions, type SessionRecord } from "@/lib/sessionStorage";
import * as RechartsPrimitive from 'recharts';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SessionMonitor() {
  const { videoRef, status, errorMessage, stopCamera } = useWebcam();
  const { faceDetected, expression, isLoadingModels } =
    useFaceDetection(videoRef);
  const { phoneDetected, isLoadingModel: isLoadingObjectModel } =
    useObjectDetection(videoRef);

  const { focusScore, rating, sessionSeconds, events, recentFocusScore, recentTrend, scoreHistory } = useFocusScore(
    faceDetected,
    phoneDetected,
    status
  );

  const trendIcon = recentTrend === "up"
    ? <TrendingUp className="h-4 w-4 text-good" />
    : recentTrend === "down"
      ? <TrendingDown className="h-4 w-4 text-bad" />
      : <Minus className="h-4 w-4 text-text-tertiary" />;

  const [pastSessions, setPastSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    if (status === "stopped") {
      setPastSessions(getAllSessions());
    }
  }, [status]);

  function handleClearHistory() {
    clearAllSessions();
    setPastSessions([]);
  }

  const heroBtn =
    "relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent text-white font-mono text-xs lg:text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 inline-flex items-center justify-center";

  const ratingDot = (r: SessionRecord["rating"]) => {
    const colors = { good: "bg-good", okay: "bg-okay", bad: "bg-bad" };
    return <span className={`shrink-0 w-2 h-2 rounded-full ${colors[r]}`} />;
  };

  return (
    <>
      {status === "loading" && (
        <main className="flex min-h-screen items-center justify-center p-4 bg-black">
          <div className="flex items-center gap-2 opacity-60">
            <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse" />
            <p className="text-white/50 text-xs font-mono tracking-wider">CAMERA.LOADING</p>
          </div>
        </main>
      )}

      {status === "error" && (
        <main className="flex min-h-screen items-center justify-center p-4 bg-black">
          <div className="border border-bad/40 bg-bad/10 p-4 font-mono text-xs text-bad tracking-wider">
            {errorMessage}
          </div>
        </main>
      )}

      {status === "ready" && (
        <main className="min-h-screen lg:h-screen lg:overflow-hidden bg-black">
          {/* ── Back link ── */}
          <div className="absolute top-3 left-3 z-30">
            <Link
              href="/"
              className="font-mono text-[10px] text-white/50 hover:text-white tracking-wider transition-colors"
            >
              ← STATORA
            </Link>
          </div>

          <div className="lg:h-full pt-14 pb-4 px-4 lg:px-6">
            <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 lg:gap-6 lg:h-full">
              {/* ── Left column: video + timer + stop ── */}
              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="relative border border-white/20 overflow-hidden flex-none bg-black/80">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 z-10" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 z-10" />
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ transform: "scaleX(-1)" }}
                    className="w-full h-full object-cover aspect-video max-h-[55vh]"
                  />

                  <div className="absolute left-2 top-2 transition-opacity duration-200" style={{ opacity: isLoadingModels ? 0 : 1 }}>
                    {!isLoadingModels && (
                      <Badge
                        variant={faceDetected ? "success" : "destructive"}
                        size="sm"
                      >
                        {faceDetected ? "FACE.OK" : "FACE.LOST"}
                      </Badge>
                    )}
                  </div>

                  <div className="absolute right-2 top-2 transition-opacity duration-200" style={{ opacity: phoneDetected ? 1 : 0, pointerEvents: phoneDetected ? 'auto' : 'none' }}>
                    {phoneDetected && (
                      <Badge variant="destructive" size="sm">
                        PHONE.DETECTED
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-white/50 tracking-wider">
                  {isLoadingObjectModel && (
                    <span>LOADING.OBJECT.MODEL...</span>
                  )}
                  {!isLoadingObjectModel && (
                    isLoadingModels ? (
                      <span>LOADING.AI.MODELS...</span>
                    ) : expression ? (
                      <span>EXPR: <strong className="text-white/80">{expression.toUpperCase()}</strong></span>
                    ) : (
                      <span className="text-white/30">FACE.NOT.VISIBLE</span>
                    )
                  )}
                </div>

                  <div className="text-[8px] font-mono text-white/30 tracking-wider">
                  ALL PROCESSING IS LOCAL — NO DATA LEAVES YOUR DEVICE
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-mono tabular-nums tracking-wider text-white/90">
                    {formatTime(sessionSeconds)}
                  </span>

                  <button
                    onClick={stopCamera}
                    className={`${heroBtn} text-xs`}
                  >
                    END SESSION
                  </button>
                </div>
              </div>

              {/* ── Right column: gauges + chart + event log ── */}
              <div className="flex flex-col gap-4 lg:gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center border border-white/10 p-3">
                    <div className="text-white/50 text-[9px] font-mono tracking-[0.15em] mb-2">OVERALL</div>
                    <div className="w-full max-w-32 h-28 lg:h-32 text-white mx-auto">
                      <FocusGauge value={focusScore} showValue strokeWidth={6} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center border border-white/10 p-3">
                    <div className="text-white/50 text-[9px] font-mono tracking-[0.15em] mb-2">LAST MIN</div>
                    <div className="w-full max-w-32 h-28 lg:h-32 text-white mx-auto">
                      <FocusGauge value={recentFocusScore} showValue strokeWidth={6} />
                    </div>
                    <div className="mt-1">{trendIcon}</div>
                  </div>
                </div>

                {/* ── Focus score chart ── */}
                <div
                  className="border border-white/10 bg-black/60"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(79,124,255,0.2))' }}
                >
                  <div className="border-b border-white/10 px-4 py-2 text-[10px] font-mono text-white/50 tracking-wider">
                    FOCUS SCORE OVER TIME
                  </div>
                  <div className="p-3">
                    <ChartContainer
                      config={
                        {
                          score: {
                            label: "Focus Score",
                            color: "#4F7CFF",
                          },
                        } satisfies ChartConfig
                      }
                      className="aspect-auto h-40"
                    >
                      <RechartsPrimitive.AreaChart
                        data={scoreHistory}
                        margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="focusGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#4F7CFF"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="100%"
                              stopColor="#4F7CFF"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <RechartsPrimitive.CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                        />

                        <RechartsPrimitive.ReferenceLine
                          y={50}
                          stroke="rgba(255,255,255,0.12)"
                          strokeDasharray="2 2"
                        />

                        <RechartsPrimitive.XAxis
                          dataKey="second"
                          tick={false}
                          axisLine={false}
                        />

                        <RechartsPrimitive.YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{
                            fill: "rgba(255,255,255,0.25)",
                            fontSize: 9,
                            fontFamily: "var(--font-mono, monospace)",
                          }}
                          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                          tickLine={false}
                          width={26}
                        />

                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value: unknown) => `${value}%`}
                              className="bg-black/90 border border-white/10 text-white/80 backdrop-blur-sm rounded-md text-xs font-mono"
                            />
                          }
                        />

                        <RechartsPrimitive.Area
                          dataKey="score"
                          fill="url(#focusGradient)"
                          stroke="none"
                          isAnimationActive={false}
                        />

                        <RechartsPrimitive.Line
                          dataKey="score"
                          stroke="var(--color-score)"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </RechartsPrimitive.AreaChart>
                    </ChartContainer>
                  </div>
                </div>

                <EventLog events={events} />
              </div>
            </div>
          </div>
        </main>
      )}

      {status === "stopped" && (
        <main className="min-h-screen bg-black">
          {/* ── Back link ── */}
          <div className="absolute top-3 left-3 z-30">
            <Link
              href="/"
              className="font-mono text-[10px] text-white/50 hover:text-white tracking-wider transition-colors"
            >
              ← STATORA
            </Link>
          </div>

          <div className="pt-14 pb-8 px-4 lg:px-6">
            <div className="mx-auto max-w-lg space-y-6">
              <StatCard
                sessionSeconds={sessionSeconds}
                focusScore={focusScore}
                eventsCount={events.length}
                rating={rating}
              />

              {pastSessions.length > 0 && (
                <div className="border border-white/10 bg-black/60">
                  <div className="border-b border-white/10 px-4 py-2 text-[10px] font-mono text-white/50 tracking-wider">
                    PAST SESSIONS
                  </div>
                  <div className="p-4 space-y-2">
                    {pastSessions.slice(0, 5).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {ratingDot(s.rating)}
                          <span className="text-white/60 text-xs font-mono truncate">
                            {new Date(s.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono tabular-nums text-[11px] text-white/50">
                            {formatTime(s.sessionSeconds)}
                          </span>
                          <span className="font-mono tabular-nums w-9 text-right text-xs text-white/80">
                            {s.focusScore}%
                          </span>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleClearHistory}
                      className="text-[10px] font-mono text-white/30 hover:text-white/60 tracking-wider transition-colors"
                    >
                      CLEAR.HISTORY
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => window.location.reload()}
                className={`${heroBtn} w-full`}
              >
                START AGAIN
              </button>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
