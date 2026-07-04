"use client";

import { useRef, useState, useEffect } from "react";

/** Possible states of the webcam lifecycle */
type WebcamStatus = "loading" | "ready" | "error" | "stopped";

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: WebcamStatus;
  errorMessage: string | null;
  stopCamera: () => void;
}

/**
 * Custom hook that requests camera access and attaches the stream
 * to a <video> element once both the stream and the DOM ref are available.
 */
export function useWebcam(): UseWebcamReturn {
  // Ref to attach to the <video> element in the component
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Tracks the current lifecycle status
  const [status, setStatus] = useState<WebcamStatus>("loading");

  // Stores a human-readable error message if the request fails
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The MediaStream is kept in state so we can hand it off to a
  // separate effect that waits for the ref to be attached to the DOM.
  const [stream, setStream] = useState<MediaStream | null>(null);

  // --- Effect 1: request camera access on mount ---
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        // If the component unmounted before the promise resolved, clean up
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(mediaStream);
        setStatus("ready");
      } catch (err: unknown) {
        if (cancelled) return;

        // Derive a readable message from the DOMException
        const message =
          err instanceof DOMException
            ? err.name === "NotAllowedError"
              ? "Camera permission denied. Please allow camera access."
              : err.name === "NotFoundError"
                ? "No camera found on this device."
                : err.message
            : "An unknown error occurred while accessing the camera.";

        setErrorMessage(message);
        setStatus("error");
      }
    }

    startCamera();

    // Cleanup: cancel the async work and flag any in-flight promise
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Effect 2: attach stream to video element once both are ready ---
  useEffect(() => {
    // Bail out if we don't have a stream yet, or if the <video> ref hasn't
    // been attached to a real DOM node (null ref or no current).
    if (!stream || !videoRef.current) return;

    videoRef.current.srcObject = stream;

    // When this effect re-runs or the component unmounts, detach the stream
    // from the element so the old stream doesn't linger.
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  // --- Effect 3: stop all tracks on unmount to release the camera ---
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  // --- Manual stop: stops the camera and transitions to "stopped" state ---
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStatus("stopped");
  };

  return { videoRef, status, errorMessage, stopCamera };
}
