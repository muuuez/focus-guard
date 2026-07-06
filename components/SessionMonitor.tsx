"use client";

import { useWebcam } from "@/hooks/useWebcam";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useObjectDetection } from "@/hooks/useObjectDetection";

export default function SessionMonitor() {
  const { videoRef, status, errorMessage, stopCamera } = useWebcam();
  const { faceDetected, expression, isLoadingModels } =
    useFaceDetection(videoRef);
  const { phoneDetected, isLoadingModel: isLoadingObjectModel } =
    useObjectDetection(videoRef);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Focus Guard - Session
        </h1>

        {status === "loading" && (
          <p className="py-12 text-center text-gray-500">Camera loading...</p>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-red-400 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ transform: "scaleX(-1)" }}
                className="w-full rounded-xl"
              />

              {!isLoadingModels && (
                <div
                  className={`absolute left-2 top-2 rounded-full px-3 py-1 text-sm font-semibold text-white ${
                    faceDetected ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {faceDetected ? "Face detected" : "No face detected"}
                </div>
              )}

              {phoneDetected && (
                <div className="absolute right-2 top-2 rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                  Phone detected
                </div>
              )}
            </div>

            <div className="mt-3 text-center text-sm text-gray-600">
              {isLoadingObjectModel && (
                <div className="mb-1">Loading object detection model...</div>
              )}
              {isLoadingModels ? (
                <span>Loading AI models...</span>
              ) : expression ? (
                <span>Expression: <strong>{expression}</strong></span>
              ) : (
                <span className="text-gray-400">No face visible</span>
              )}
            </div>

            <button
              onClick={stopCamera}
              className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Stop camera
            </button>
          </>
        )}

        {status === "stopped" && (
          <div className="py-12 text-center">
            <p className="mb-4 text-gray-600">Camera stopped</p>
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
