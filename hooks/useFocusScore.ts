"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { saveSession } from "@/lib/sessionStorage";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FocusEvent {
  type: "phone" | "looking_away" | "focus_streak";
  timestamp: number;
}

interface UseFocusScoreReturn {
  focusScore: number;
  rating: "good" | "okay" | "bad";
  sessionSeconds: number;
  events: FocusEvent[];
  recentFocusScore: number;
  recentTrend: "up" | "down" | "steady";
  scoreHistory: Array<{ second: number; score: number }>;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Custom hook that combines face-detection and phone-detection signals into a
 * live focus score.  It runs a 1-second internal tick, classifies each second,
 * and logs distraction / streak events.
 */
export function useFocusScore(
  faceDetected: boolean,
  phoneDetected: boolean,
  status: "loading" | "ready" | "error" | "stopped"
): UseFocusScoreReturn {
  // ---- 1. State we expose to the caller ----
  const [focusScore, setFocusScore] = useState(100);
  const [rating, setRating] = useState<"good" | "okay" | "bad">("good");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [events, setEvents] = useState<FocusEvent[]>([]);
  const [recentFocusScore, setRecentFocusScore] = useState(100);
  const [recentTrend, setRecentTrend] = useState<"up" | "down" | "steady">("steady");
  const [scoreHistory, setScoreHistory] = useState<Array<{ second: number; score: number }>>([]);

  // ---- 2. Mutable refs for counters that change every second ----
  // We keep these in refs (not state) so the interval callback always reads
  // the latest value without stale closures.  State is only used for the final
  // values returned to the component (which trigger re-renders).
  const totalTicksRef = useRef(0);
  const focusedTicksRef = useRef(0);
  const awayTicksRef = useRef(0);
  const phoneTicksRef = useRef(0);

  // Track the previous classification so we only log the *start* of a distraction
  // rather than every second it continues.
  const lastClassificationRef = useRef<"focused" | "looking_away" | "distracted">(
    "focused"
  );

  // Remember the last milestone (multiple of 300 focused ticks) we already fired,
  // so we don't push duplicate streak events.
  const lastMilestoneRef = useRef(0);

  // ---- Rolling window for recent focus (last 60 seconds) ----
  // We keep a buffer of the most recent 120 classifications so we can
  // compare the current 60-second window against the previous one.
  const ROLLING_WINDOW = 60;
  // Buffer 1: the most recent 60 ticks (used for recentFocusScore)
  const rollingWindowRef = useRef<Array<"focused" | "looking_away" | "distracted">>([]);
  // Buffer 2: the 60 ticks before that (used as the "previous window" baseline)
  const previousWindowRef = useRef<Array<"focused" | "looking_away" | "distracted">>([]);

  // ---- 3. Helper to sync ref counters → React state once per tick ----
  // Extracted so we keep the interval callback focused on the scoring logic.
  const syncState = useCallback(() => {
    const total = totalTicksRef.current;
    const focused = focusedTicksRef.current;

    setSessionSeconds(total);
    setFocusScore(total === 0 ? 100 : Math.round((focused / total) * 100));

    // Derive rating from the current focus score
    const score = total === 0 ? 100 : Math.round((focused / total) * 100);
    if (score >= 75) setRating("good");
    else if (score >= 50) setRating("okay");
    else setRating("bad");
  }, []);

  // ---- 4. Main tick every 1 second ----
  useEffect(() => {
    if (status !== "ready") return;

    const interval = setInterval(() => {
      // a. Classify this second – phone detection takes priority
      let classification: "focused" | "looking_away" | "distracted";
      if (phoneDetected) {
        classification = "distracted";
      } else if (!faceDetected) {
        classification = "looking_away";
      } else {
        classification = "focused";
      }

      // b. Update the running counters via refs
      totalTicksRef.current += 1;
      if (classification === "focused") {
        focusedTicksRef.current += 1;
      } else if (classification === "looking_away") {
        awayTicksRef.current += 1;
      } else {
        phoneTicksRef.current += 1;
      }

      // c. Log distraction events when we transition *away* from focused
      const prev = lastClassificationRef.current;
      if (
        prev === "focused" &&
        (classification === "looking_away" || classification === "distracted")
      ) {
        setEvents((prevEvents) => [
          ...prevEvents,
          {
            type: classification === "distracted" ? "phone" : "looking_away",
            timestamp: Date.now(),
          },
        ]);
      }
      lastClassificationRef.current = classification;

      // d. Fire focus_streak event every 300 focused ticks (5 minutes cumulative)
      const milestone = Math.floor(focusedTicksRef.current / 300);
      if (milestone > lastMilestoneRef.current) {
        lastMilestoneRef.current = milestone;
        setEvents((prevEvents) => [
          ...prevEvents,
          { type: "focus_streak", timestamp: Date.now() },
        ]);
      }

      // e. Rolling window: maintain the last 60 + previous 60 classifications.
      //    Push the current classification into the active rolling window.
      //    When it exceeds 60, shift the oldest tick into the "previous window"
      //    buffer.  The previous buffer caps at 60 as well.
      rollingWindowRef.current.push(classification);
      if (rollingWindowRef.current.length > ROLLING_WINDOW) {
        const shifted = rollingWindowRef.current.shift()!;
        previousWindowRef.current.push(shifted);
        if (previousWindowRef.current.length > ROLLING_WINDOW) {
          previousWindowRef.current.shift();
        }
      }

      // f. Compute recentFocusScore from the rolling window.
      //    focusedCount / windowSize gives the percentage over the last ~60 sec.
      const windowSize = rollingWindowRef.current.length;
      const focusedInWindow = rollingWindowRef.current.filter(
        (c) => c === "focused"
      ).length;
      const newRecentFocusScore =
        windowSize === 0
          ? 100
          : Math.round((focusedInWindow / windowSize) * 100);
      setRecentFocusScore(newRecentFocusScore);

      // i. Accumulate a point for the line chart every 5 seconds so the chart
      //    doesn't re-render every tick.  The ref ensures we don't lose data
      //    between snapshots.
      if (totalTicksRef.current % 5 === 0) {
        setScoreHistory((prev) => [
          ...prev,
          { second: totalTicksRef.current, score: newRecentFocusScore },
        ]);
      }

      // g. Compute recentTrend by comparing the current window's score against
      //    the previous window's score.  Only compute once we have a full
      //    previous window (60 ticks of history before the current 60).
      if (previousWindowRef.current.length === ROLLING_WINDOW) {
        const prevFocused = previousWindowRef.current.filter(
          (c) => c === "focused"
        ).length;
        const prevScore = Math.round((prevFocused / ROLLING_WINDOW) * 100);
        const diff = newRecentFocusScore - prevScore;
        if (diff >= 5) setRecentTrend("up");
        else if (diff <= -5) setRecentTrend("down");
        else setRecentTrend("steady");
      } else {
        // Not enough history yet — default to steady
        setRecentTrend("steady");
      }

      // h. Push latest counter values into state so the component re-renders
      syncState();
    }, 1000);

    // Cleanup the interval when the component unmounts or deps change
    return () => clearInterval(interval);
  }, [faceDetected, phoneDetected, syncState, status]);

  // ---- 5. Persist the session as soon as the user stops ----
  // We track a ref for the previous status so this effect only fires on the
  // transition to "stopped", not on every re-render while stopped.
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== "stopped" && status === "stopped") {
      saveSession({
        // crypto.randomUUID() is available in modern browsers; fall back to
        // a timestamp-based ID in environments where it isn't.
        id: crypto.randomUUID?.() ?? Date.now().toString(),
        date: new Date().toISOString(),
        sessionSeconds,
        focusScore,
        rating,
        eventsCount: events.length,
      });
    }
    prevStatusRef.current = status;
  }, [status, sessionSeconds, focusScore, rating, events]);

  return { focusScore, rating, sessionSeconds, events, recentFocusScore, recentTrend, scoreHistory };
}
