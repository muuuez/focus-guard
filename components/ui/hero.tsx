"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ContourBackground from "@/components/ui/ContourBackground";
import { getAllSessions } from "@/lib/sessionStorage";
import type { SessionRecord } from "@/lib/sessionStorage";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function Hero() {
  const [sessionCount, setSessionCount] = useState(0);
  const [lastSession, setLastSession] = useState<SessionRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLElement>(null);

  // ── Load session data on mount ──
  useEffect(() => {
    const sessions = getAllSessions();
    setSessionCount(sessions.length);
    if (sessions.length > 0) {
      setLastSession(sessions[0]);
    }
  }, []);

  function handleViewHistory() {
    setShowHistory(true);
    setTimeout(() => {
      historyRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }

  return (
    <>
      <main className="relative h-screen overflow-hidden bg-black">
        {/* ── Contour Background (desktop) ── */}
        <div className="absolute inset-0 w-full h-full hidden lg:block">
          <ContourBackground />
        </div>

        {/* ── Mobile stars background ── */}
        <div className="absolute inset-0 w-full h-full lg:hidden stars-bg" />

        {/* ── Top Header ── */}
        <div className="absolute top-0 left-0 right-0 z-20 border-b border-white/20">
          <div className="container mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="font-mono text-white text-xl lg:text-2xl font-bold tracking-widest italic transform -skew-x-12">
                STATORA
              </div>
              <div className="h-3 lg:h-4 w-px bg-white/40" />
              <span className="text-white/60 text-[8px] lg:text-[10px] font-mono">
                EST. 2026
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-white/60">
              <span>LAT: 37.7749°</span>
              <div className="w-1 h-1 bg-white/40 rounded-full" />
              <span>LONG: 122.4194°</span>
            </div>
          </div>
        </div>

        {/* ── Corner Frame Accents ── */}
        <div className="absolute top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 border-white/30 z-20" />
        <div className="absolute top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 border-white/30 z-20" />
        <div
          className="absolute left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 border-white/30 z-20"
          style={{ bottom: "5vh" }}
        />
        <div
          className="absolute right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 border-white/30 z-20"
          style={{ bottom: "5vh" }}
        />

        {/* ── CTA Content ── */}
        <div
          className="relative z-10 flex min-h-screen items-center justify-end pt-16 lg:pt-0"
          style={{ marginTop: "5vh" }}
        >
          <div className="w-full lg:w-1/2 px-6 lg:px-16 lg:pr-[10%]">
            <div className="max-w-lg relative lg:ml-auto">
              {/* Top decorative line */}
              <div className="flex items-center gap-2 mb-3 opacity-60">
                <div className="w-8 h-px bg-white" />
                <span className="text-white text-[10px] font-mono tracking-wider">
                  ∞
                </span>
                <div className="flex-1 h-px bg-white" />
              </div>

              {/* Title */}
              <div className="relative">
                <div className="hidden lg:block absolute -right-3 top-0 bottom-0 w-1 dither-pattern opacity-40" />
                <h1
                  className="text-2xl lg:text-5xl font-bold text-white mb-3 lg:mb-4 leading-tight font-mono tracking-wider whitespace-nowrap lg:-ml-[5%]"
                  style={{ letterSpacing: "0.1em" }}
                >
                  FOCUS LOCKED
                </h1>
              </div>

              {/* Decorative dots pattern */}
              <div className="hidden lg:flex gap-1 mb-3 opacity-40">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 h-0.5 bg-white rounded-full"
                  />
                ))}
              </div>

              {/* Description */}
              <div className="relative">
                <p className="text-xs lg:text-base text-gray-300 mb-5 lg:mb-6 leading-relaxed font-mono opacity-80">
                  Your webcam monitors your attention in real time. The system
                  scores your focus — no excuses, no distractions. Just data.
                </p>

                <div className="hidden lg:block absolute -left-4 top-1/2 w-3 h-3 border border-white opacity-30">
                  <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                <Link
                  href="/session"
                  className="relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent text-white font-mono text-xs lg:text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 group inline-flex items-center justify-center"
                >
                  <span className="hidden lg:block absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="hidden lg:block absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  START SESSION
                </Link>

                {sessionCount > 0 && (
                  <button
                    onClick={handleViewHistory}
                    className="relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent border border-white text-white font-mono text-xs lg:text-sm hover:bg-white hover:text-black transition-all duration-200"
                    style={{ borderWidth: "1px" }}
                  >
                    VIEW HISTORY
                  </button>
                )}
              </div>

              {/* Bottom technical notation */}
              <div className="hidden lg:flex items-center gap-2 mt-6 opacity-40">
                <span className="text-white text-[9px] font-mono">∞</span>
                <div className="flex-1 h-px bg-white" />
                <span className="text-white text-[9px] font-mono">
                  FOCUS.SESSION
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Footer ── */}
        <div
          className="absolute left-0 right-0 z-20 border-t border-white/20 bg-black/40 backdrop-blur-sm"
          style={{ bottom: "5vh" }}
        >
          <div className="container mx-auto px-4 lg:px-8 py-2 lg:py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-6 text-[8px] lg:text-[9px] font-mono text-white/50">
              <span className="hidden lg:inline">SYSTEM.ACTIVE</span>
              <span className="lg:hidden">SYS.ACT</span>
              <div className="hidden lg:flex gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/30"
                    style={{ height: `${((i * 7 + 3) % 13) + 4}px` }}
                  />
                ))}
              </div>
              <span>V1.0.0</span>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 text-[8px] lg:text-[9px] font-mono text-white/50">
              <span className="hidden lg:inline">◐ RENDERING</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse" />
                <div
                  className="w-1 h-1 bg-white/40 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-1 h-1 bg-white/20 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
              <span className="hidden lg:inline">FRAME: ∞</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          .dither-pattern {
            background-image: repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 1px,
                white 1px,
                white 2px
              ),
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 1px,
                white 1px,
                white 2px
              );
            background-size: 3px 3px;
          }

          .stars-bg {
            background-image: radial-gradient(
                1px 1px at 20% 30%,
                white,
                transparent
              ),
              radial-gradient(1px 1px at 60% 70%, white, transparent),
              radial-gradient(1px 1px at 50% 50%, white, transparent),
              radial-gradient(1px 1px at 80% 10%, white, transparent),
              radial-gradient(1px 1px at 90% 60%, white, transparent),
              radial-gradient(1px 1px at 33% 80%, white, transparent),
              radial-gradient(1px 1px at 15% 60%, white, transparent),
              radial-gradient(1px 1px at 70% 40%, white, transparent);
            background-size: 200% 200%, 180% 180%, 250% 250%, 220% 220%,
              190% 190%, 240% 240%, 210% 210%, 230% 230%;
            background-position: 0% 0%, 40% 40%, 60% 60%, 20% 20%, 80% 80%,
              30% 30%, 70% 70%, 50% 50%;
            opacity: 0.3;
          }
        `}</style>
      </main>

      {/* ── Session History Section ── */}
      {showHistory && sessionCount > 0 && lastSession && (
        <section
          ref={historyRef}
          className="bg-black border-t border-white/10 py-12 px-6"
        >
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-2 mb-6 opacity-60">
              <div className="w-8 h-px bg-white" />
              <span className="text-white text-[10px] font-mono tracking-wider">
                HISTORY
              </span>
              <div className="flex-1 h-px bg-white" />
            </div>

            <div className="font-mono text-sm text-white/80 space-y-2">
              <p className="tracking-wider">
                {sessionCount} SESSION
                {sessionCount !== 1 ? "S" : ""} COMPLETED
              </p>
              <p className="text-white/50 text-[11px]">
                LAST: {formatDate(lastSession.date)} &mdash;{" "}
                {lastSession.focusScore}%
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
