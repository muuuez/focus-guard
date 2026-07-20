// ── Types ──────────────────────────────────────────────────────────────────────

export interface SessionRecord {
  id: string;
  date: string;
  sessionSeconds: number;
  focusScore: number;
  rating: "good" | "okay" | "bad";
  eventsCount: number;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "focus-guard-sessions";

// ── Helpers ────────────────────────────────────────────────────────────────────

function readAll(): SessionRecord[] {
  // Wrap in try-catch in case localStorage is unavailable (private browsing,
  // storage full, or server-side rendering where localStorage isn't defined).
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch (err) {
    console.warn("[sessionStorage] Failed to read from localStorage", err);
    return [];
  }
}

function writeAll(sessions: SessionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn("[sessionStorage] Failed to write to localStorage", err);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Save a completed session to localStorage.
 * Appends the new session to the existing list and persists as JSON.
 */
export function saveSession(session: SessionRecord): void {
  const sessions = readAll();
  sessions.push(session);
  writeAll(sessions);
}

/**
 * Retrieve all saved sessions, sorted newest first.
 * Returns an empty array if there's no data yet or if localStorage is unavailable.
 */
export function getAllSessions(): SessionRecord[] {
  const sessions = readAll();
  // Sort by date descending (newest first)
  return sessions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Delete every saved session from localStorage.
 */
export function clearAllSessions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[sessionStorage] Failed to clear localStorage", err);
  }
}
