# Statora

Browser-based, webcam-driven focus tracking for study sessions.

<!-- Add a screenshot or GIF of the dashboard here -->

---

## Overview

Statora uses your webcam and client-side machine learning to monitor attention during study sessions. It detects whether you are looking at the screen, tracks phone distractions via object detection, and computes a live focus score. Everything runs in the browser — no video or image data is uploaded to any server.

Session results persist in localStorage so you can review past performance. The landing page displays a history toggle showing your last session's score, and the session dashboard provides a real-time gauge, a trailing 60-second trend view, a line chart of score history, and an event log of distractions.

---

## Features

- **Face detection + expression recognition** — detects presence and dominant expression using `@vladmandic/face-api` (tiny face detector + expression net)
- **Phone/object detection** — identifies cell phones via COCO-SSD loaded in TensorFlow.js with a WebGL backend
- **Live focus scoring** — per-second state machine classifies each tick as focused, looking away, or distracted; overall score and a separate 60-second rolling window score
- **Session dashboard** — two gauges (overall + trailing), recharts line chart, event log, and session timer
- **Persistent session history** — results saved to localStorage, viewable on the landing page across visits
- **Responsive layout** — two-column desktop layout stacks to single-column on mobile

---

## Tech Stack

| Layer | Library / Framework | Version |
|---|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) | 16.2.10 |
| UI Library | [React](https://react.dev/) | 19.2.4 |
| Language | [TypeScript](https://www.typescriptlang.org/) | ^5 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 | ^4 |
| Face detection | [@vladmandic/face-api](https://github.com/vladmandic/face-api) | ^1.7.15 |
| Object detection | [@tensorflow-models/coco-ssd](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) | ^2.2.3 |
| ML runtime | [TensorFlow.js](https://www.tensorflow.org/js) + WebGL backend | ^4.22.0 |
| Charts | [Recharts](https://recharts.org/) | ^3.9.2 |
| Icons | [Lucide React](https://lucide.dev/) | ^1.25.0 |
| Persistence | [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) (via `lib/sessionStorage.ts`) | — |

---

## Architecture

### Hook composition

```
useWebcam()              — requests getUserMedia, exposes video ref + status
  ├── useFaceDetection() — loads face-api models, returns faceDetected + expression
  └── useObjectDetection() — loads COCO-SSD, returns phoneDetected
        └── useFocusScore(faceDetected, phoneDetected, status)
                          — runs 1s tick loop, classifies, computes scores
              └── SessionMonitor — orchestrates layout, renders dashboard
```

The session page (`app/session/page.tsx`) imports `SessionMonitor` via `next/dynamic` with `ssr: false` because all hooks depend on browser-only APIs (`getUserMedia`, WebGL canvas, DOM video elements).

### Model files

Face-api model weights are checked into `public/models/`:

- `tiny_face_detector_model-weights_manifest.json` + `-shard1`
- `face_expression_model-weights_manifest.json` + `-shard1`

COCO-SSD downloads its weights from TensorFlow Hub at runtime (no bundled model files).

---

## Getting Started

```bash
git clone <repo-url>
cd focus-guard
npm install
npm run dev    # uses --webpack (Next.js 16 with webpack instead of Turbopack)
```

Open [http://localhost:3000](http://localhost:3000).

No API keys, environment variables, or backend services are required. The face-api model files are already included in `public/models/` — no additional download needed.

---

## How It Works

### Per-second classification

Every second, the scoring hook runs a state machine:

1. If `phoneDetected === true` → `"distracted"`
2. Else if `faceDetected === false` → `"looking_away"`
3. Otherwise → `"focused"`

Classification priority is intentional: phone detection overrides face absence because using a phone is a deliberate distraction even if your face is visible.

### Two-tier scoring

- **Overall score** — percentage of all ticks classified as `"focused"` since the session started.
- **Recent score** — percentage of `"focused"` ticks in the last 60 seconds only, computed from a rolling window ref. A separate previous-window ref (ticks 60–120 seconds ago) is used to derive a trend direction (up / down / steady) when the difference between windows exceeds ±5%.

### Debouncing / smoothing

Phone detection uses a 2-second cooldown: once detected, `phoneDetected` stays `true` for 2 seconds even if the model stops seeing the phone, preventing rapid on/off flicker. The model itself runs at 500ms intervals. Face detection runs at 300ms intervals.

### Event logging

Distraction events fire only on *transitions* away from `"focused"`, so sustained distraction does not flood the event log. A focus-streak event fires every 300 focused ticks (~5 minutes of cumulative focus time).

---

## Known Limitations

- **COCO-SSD phone detection** is not perfect at close range or awkward angles. A phone face-down on a desk may not be detected. The model's confidence threshold is set at 0.35 to balance false positives and missed detections.
- **Session history is per-browser / per-device only** — stored in localStorage with no account system or cloud sync. Clearing browser data deletes all history.
- **Face detection requires reasonable lighting** and a front-facing webcam pointed at the user. Backlit scenes, extreme angles, or partially occluded faces reduce reliability.
- **Performance** depends on the device's GPU. TensorFlow.js with the WebGL backend runs well on most modern laptops and phones, but older hardware may struggle with real-time detection.
- **No audio or screen-share monitoring** — the app only uses video input to infer attention.

---

## License

MIT

## Author

Built by Mueez
