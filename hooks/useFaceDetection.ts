"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

interface UseFaceDetectionReturn {
  faceDetected: boolean;
  expression: string | null;
  isLoadingModels: boolean;
}

/**
 * Custom hook that loads face-api.js models and runs face detection
 * with expression recognition on every frame of a <video> element.
 *
 * Model files (tinyFaceDetector + faceExpressionNet) must be placed in
 * public/models/ so they can be served as static assets.
 */
export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>
): UseFaceDetectionReturn {
  const [faceDetected, setFaceDetected] = useState(false);
  const [expression, setExpression] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Load face-api models on mount ---
  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        // Load the lightweight tiny face detector and expression recognition
        // models from the public/models/ directory. The files are served as
        // static assets so we just pass "/models" as the URI base.
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        ]);

        if (!cancelled) setIsLoadingModels(false);
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        if (!cancelled) setIsLoadingModels(false);
      }
    }

    loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  // --- Start detection interval once models are loaded and video is playing ---
  useEffect(() => {
    if (isLoadingModels) return;

    // Bail if detection is already running (safety check)
    if (intervalRef.current) return;

    const startDetection = (video: HTMLVideoElement) => {
      intervalRef.current = setInterval(async () => {
        try {
          // Run detection + expression recognition on the current video frame
          const detections = await faceapi
            .detectAllFaces(
              video,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 512,
                scoreThreshold: 0.3,
              })
            )
            .withFaceExpressions();

          if (detections.length > 0) {
            setFaceDetected(true);
            // asSortedArray returns [{ expression, probability }] sorted descending
            const sorted = detections[0].expressions.asSortedArray();
            setExpression(sorted[0].expression);
          } else {
            // No face in frame – treat as "looking away"
            setFaceDetected(false);
            setExpression(null);
          }

          console.log(
            "Face detection:",
            detections.length > 0 ? "detected" : "not detected"
          );
        } catch (err) {
          console.error("Face detection error:", err);
        }
      }, 300);
    };

    // Poll every 100ms until videoRef.current exists and has data.
    // This handles the race where isLoadingModels becomes false before
    // the <video> element is mounted (refs don't trigger re-renders).
    const readyInterval = setInterval(() => {
      const video = videoRef.current;
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        clearInterval(readyInterval);
        startDetection(video);
      }
    }, 100);

    // Also listen for the "playing" event as a faster signal once the ref is available
    const video = videoRef.current;
    if (video) {
      video.addEventListener("playing", () => startDetection(video), {
        once: true,
      });
    }

    return () => {
      clearInterval(readyInterval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoadingModels, videoRef]);

  return { faceDetected, expression, isLoadingModels };
}
