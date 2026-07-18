"use client";

import { useWebcam } from "@/hooks/useWebcam";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useObjectDetection } from "@/hooks/useObjectDetection";
import { useFocusScore } from "@/hooks/useFocusScore";
import { Badge } from "@/components/ui/FocusBadge";
import { FocusGauge } from "@/components/ui/FocusGauge";
import EventLog from "@/components/ui/EventLog";
import StatCard from "@/components/ui/StatCard";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

  const { focusScore, rating, sessionSeconds, events, recentFocusScore, recentTrend } = useFocusScore(
    faceDetected,
    phoneDetected,
    status
  );

  const trendIcon = recentTrend === "up"
    ? <TrendingUp className="h-4 w-4 text-green-400" />
    : recentTrend === "down"
      ? <TrendingDown className="h-4 w-4 text-red-400" />
      : <Minus className="h-4 w-4 text-slate-400" />;

  return (
    <>
      {status === "loading" && (
        <main className="flex min-h-screen items-center justify-center p-4">
          <p className="text-center text-gray-500">Camera loading...</p>
        </main>
      )}

      {status === "error" && (
        <main className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-red-400 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        </main>
      )}

      {status === "ready" && (
        <main className="h-screen overflow-hidden bg-black/5 dark:bg-black/20 p-6">
          <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 h-full">
            {/* ── Left column: video + timer + stop ── */}
            <div className="flex flex-col gap-4">
              <div className="relative rounded-xl overflow-hidden bg-black flex-none aspect-video max-h-[55vh]">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ transform: "scaleX(-1)" }}
                  className="w-full h-full object-cover"
                />

                {!isLoadingModels && (
                  <div className="absolute left-3 top-3">
                    <Badge
                      variant={faceDetected ? "success" : "destructive"}
                      size="sm"
                    >
                      {faceDetected ? "Face detected" : "No face detected"}
                    </Badge>
                  </div>
                )}

                {phoneDetected && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="destructive" size="sm">
                      Phone detected
                    </Badge>
                  </div>
                )}

              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                {isLoadingObjectModel && (
                  <span>Loading object detection model...</span>
                )}
                {!isLoadingObjectModel && (
                  isLoadingModels ? (
                    <span>Loading AI models...</span>
                  ) : expression ? (
                    <span>Expression: <strong>{expression}</strong></span>
                  ) : (
                    <span className="text-gray-400">No face visible</span>
                  )
                )}
              </div>

              <div className="text-center">
                <span className="text-2xl font-mono font-bold tabular-nums tracking-wider text-gray-800 dark:text-gray-200">
                  {formatTime(sessionSeconds)}
                </span>
              </div>

              <button
                onClick={stopCamera}
                className="w-full rounded-lg bg-red-600 px-4 py-3 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Stop camera
              </button>
            </div>

            {/* ── Right column: two gauges + event log ── */}
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32">
                    <FocusGauge value={focusScore} showValue strokeWidth={8} />
                  </div>
                  <span className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Overall
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32">
                    <FocusGauge value={recentFocusScore} showValue strokeWidth={8} />
                  </div>
                  <span className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    Last minute
                    {trendIcon}
                  </span>
                </div>
              </div>

              <EventLog events={events} />
            </div>
          </div>
        </main>
      )}

      {status === "stopped" && (
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <StatCard
              sessionSeconds={sessionSeconds}
              focusScore={focusScore}
              eventsCount={events.length}
              rating={rating}
            />
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Start again
            </button>
          </div>
        </main>
      )}
    </>
  );
}
