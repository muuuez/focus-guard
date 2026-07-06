"use client";

import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as cocossd from "@tensorflow-models/coco-ssd";

interface UseObjectDetectionReturn {
  phoneDetected: boolean;
  isLoadingModel: boolean;
}

/**
 * Custom hook that loads the COCO-SSD pre-trained model and runs object
 * detection on every frame of a <video> element. It specifically looks for
 * "cell phone" detections above a confidence threshold.
 *
 * Uses a "recent detection window" approach: phoneDetected turns true
 * immediately on any single detection above threshold, and stays true
 * until 2 full seconds pass without any detection (avoiding flicker).
 */
export function useObjectDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>
): UseObjectDetectionReturn {
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modelRef = useRef<cocossd.ObjectDetection | null>(null);
  const lastDetectedAtRef = useRef(0);

  const CONFIDENCE_THRESHOLD = 0.35;
  const COOLDOWN_MS = 2000;

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        await tf.setBackend("webgl");
        await tf.ready();
        modelRef.current = await cocossd.load();
        if (!cancelled) setIsLoadingModel(false);
      } catch (err) {
        console.error("Failed to load COCO-SSD model:", err);
        if (!cancelled) setIsLoadingModel(false);
      }
    }

    loadModel();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoadingModel) return;
    if (intervalRef.current) return;

    const startDetection = (video: HTMLVideoElement) => {
      intervalRef.current = setInterval(async () => {
        try {
          const model = modelRef.current;
          if (!model) return;
          const predictions = await model.detect(video);

          const phoneFound = predictions.some(
            (pred) =>
              pred.class === "cell phone" &&
              pred.score >= CONFIDENCE_THRESHOLD
          );

          if (phoneFound) {
            lastDetectedAtRef.current = Date.now();
            if (!phoneDetected) {
              setPhoneDetected(true);
              console.log("Phone detection: detected");
            }
          } else if (phoneDetected) {
            const elapsed = Date.now() - lastDetectedAtRef.current;
            if (elapsed >= COOLDOWN_MS) {
              setPhoneDetected(false);
              console.log("Phone detection: not detected");
            }
          }
        } catch (err) {
          console.error("Object detection error:", err);
        }
      }, 500);
    };

    const readyInterval = setInterval(() => {
      const video = videoRef.current;
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        clearInterval(readyInterval);
        startDetection(video);
      }
    }, 100);

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
  }, [isLoadingModel, videoRef, phoneDetected]);

  return { phoneDetected, isLoadingModel };
}
