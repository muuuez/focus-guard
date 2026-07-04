"use client";

import { useWebcam } from "@/hooks/useWebcam";
import { useFaceDetection } from "@/hooks/useFaceDetection";

export default function SessionPage() {
  // Get the video ref, current status, and any error message from the hook
  const { videoRef, status, errorMessage, stopCamera } = useWebcam();
  // Face detection runs on the same video ref once the camera is ready
  const { faceDetected, expression, isLoadingModels } =
    useFaceDetection(videoRef);

  return (
    // Full-page wrapper that centres everything horizontally & vertically
    <main className="flex min-h-screen items-center justify-center p-4">
      {/* Card container — max 640 px, rounded corners, subtle border */}
      <div className="w-full max-w-xl rounded-2xl border p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Focus Guard - Session
        </h1>

        {/* ---- loading state ---- */}
        {status === "loading" && (
          <p className="py-12 text-center text-gray-500">Camera loading...</p>
        )}

        {/* ---- error state ---- */}
        {status === "error" && (
          <div className="rounded-lg border border-red-400 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* ---- ready state ---- */}
        {status === "ready" && (
          <>
            {/* Video wrapper for relative positioning of overlay badge */}
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                // Mirror the video horizontally so it looks like a selfie preview
                style={{ transform: "scaleX(-1)" }}
                className="w-full rounded-xl"
              />

              {/* Face-detection status badge overlaid at the top-left */}
              {!isLoadingModels && (
                <div
                  className={`absolute left-2 top-2 rounded-full px-3 py-1 text-sm font-semibold text-white ${
                    faceDetected ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {faceDetected ? "Face detected" : "No face detected"}
                </div>
              )}
            </div>

            {/* Detected expression shown below the video */}
            <div className="mt-3 text-center text-sm text-gray-600">
              {isLoadingModels ? (
                <span>Loading AI models...</span>
              ) : expression ? (
                <span>Expression: <strong>{expression}</strong></span>
              ) : (
                <span className="text-gray-400">No face visible</span>
              )}
            </div>

            {/* Manual stop button to release the camera */}
            <button
              onClick={stopCamera}
              className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Stop camera
            </button>
          </>
        )}

        {/* ---- stopped state ---- */}
        {status === "stopped" && (
          <div className="py-12 text-center">
            <p className="mb-4 text-gray-600">Camera stopped</p>
            {/* Reload the page to re-initialise the camera */}
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Start again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
