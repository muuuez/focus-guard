"use client";

import { useEffect, useRef } from "react";

// ── D60-hero parameters (from spec) ──

const PARAMS = {
  renderMode: "contour",
  bgMode: "blur",
  bgBlur: 12,
  bgOpacity: 46,
  cellSize: 34,
  coverage: 64,
  invert: true,
  brightness: 12,
  contrast: 115,
  edgeEmphasis: 0,
  density: 0,
  tint: "#3ca6ff",
  tintOpacity: 0,
  saturation: 100,
  grayscale: 0,
  blurType: "off",
  blurAmount: 35,
  pfx: {
    vignette: { enabled: true, intensity: 38 },
    bloom: { enabled: true, intensity: 25 },
    scanLines: { enabled: false, intensity: 40 },
    chromatic: { enabled: false, intensity: 15 },
    filmGrain: { enabled: false, intensity: 30 },
    glitch: { enabled: false, intensity: 20 },
    pixelate: { enabled: false, intensity: 15 },
    halftone: { enabled: false, intensity: 20 },
    filmDust: { enabled: false, intensity: 20 },
  },
  animated: true,
  animStyle: "wave",
  animSpeed: { enabled: true, intensity: 100 },
  animIntensity: { enabled: true, intensity: 60 },
  lights: { enabled: false, points: [] },
  mask: { enabled: false, dataUrl: null, invert: false },
};

const IMAGE_PATH = "/images/hero-photo.jpeg";
const CONTOUR_LEVELS = 16;
const CELL_SIZE = PARAMS.cellSize;

export default function ContourBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = IMAGE_PATH;

    let animId = 0;
    let startTime = performance.now();

    img.onload = () => {
      const rctx = ctx!;
      const dpr = window.devicePixelRatio || 1;
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ── Off-screen canvas for the source image ──
      const src = document.createElement("canvas");
      src.width = W;
      src.height = H;
      const srcCtx = src.getContext("2d")!;

      // Draw photo to fill the canvas
      srcCtx.drawImage(img, 0, 0, W, H);

      // ── Step 1a: bgMode = "blur" ── blurred copy behind the effect ──
      const bg = document.createElement("canvas");
      bg.width = W;
      bg.height = H;
      const bgCtx = bg.getContext("2d")!;
      bgCtx.drawImage(src, 0, 0);
      // Apply gaussian blur via canvas filter
      bgCtx.filter = `blur(${PARAMS.bgBlur}px)`;
      bgCtx.drawImage(src, 0, 0);
      bgCtx.filter = "none";

      // ── Step 1b: get reference ImageData for sampling ──
      const srcImageData = srcCtx.getImageData(0, 0, W, H);
      const srcPixels = srcImageData.data;

      // ── Step 2: sample grid of luminance values ──
      const cols = Math.ceil(W / CELL_SIZE);
      const rows = Math.ceil(H / CELL_SIZE);
      const grid: number[][] = [];

      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          let sumL = 0;
          let count = 0;
          const cx = c * CELL_SIZE;
          const cy = r * CELL_SIZE;
          for (let py = cy; py < cy + CELL_SIZE && py < H; py++) {
            for (let px = cx; px < cx + CELL_SIZE && px < W; px++) {
              const idx = (py * W + px) * 4;
              const R = srcPixels[idx];
              const G = srcPixels[idx + 1];
              const B = srcPixels[idx + 2];
              // Perceived luminance
              sumL += 0.299 * R + 0.587 * G + 0.114 * B;
              count++;
            }
          }
          grid[r][c] = count > 0 ? sumL / count : 128;
        }
      }

      // Find min/max for normalisation
      let gMin = Infinity;
      let gMax = -Infinity;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] < gMin) gMin = grid[r][c];
          if (grid[r][c] > gMax) gMax = grid[r][c];
        }
      }
      const gRange = gMax - gMin || 1;

      // ── Draw / animate loop ──

      function draw(time: number) {
        const elapsed = (time - startTime) / 1000;

        // ── Step 1c: draw background at bgOpacity ──
        rctx.clearRect(0, 0, W, H);
        rctx.globalAlpha = PARAMS.bgOpacity / 100;
        rctx.drawImage(bg, 0, 0);
        rctx.globalAlpha = 1;

        // ── Step 3: contour rendering with wave animation ──
        const animSpeed = PARAMS.animSpeed.enabled ? PARAMS.animSpeed.intensity / 100 : 0;
        const animInten = PARAMS.animIntensity.enabled ? PARAMS.animIntensity.intensity / 100 : 0;
        const waveFreq = 0.008;
        const waveAmp = animInten * 60;

        // Build animated luminance grid
        const animGrid: number[][] = [];
        for (let r = 0; r < rows; r++) {
          animGrid[r] = [];
          for (let c = 0; c < cols; c++) {
            let val = (grid[r][c] - gMin) / gRange; // 0..1

            if (PARAMS.animated && PARAMS.animStyle === "wave") {
              const offset =
                Math.sin(
                  c * waveFreq * 2 +
                    r * waveFreq +
                    elapsed * animSpeed * 1.5
                ) *
                Math.cos(
                  c * waveFreq +
                    r * waveFreq * 2 +
                    elapsed * animSpeed * 1.2
                ) *
                (waveAmp / 255);
              val = Math.max(0, Math.min(1, val + offset));
            }

            if (PARAMS.invert) val = 1 - val;
            animGrid[r][c] = val;
          }
        }

        // Coverage: skip some cells
        const coverageRatio = PARAMS.coverage / 100;

        // Apply brightness/contrast to the grid
        const brightAdj = (PARAMS.brightness - 50) / 50;
        const contAdj = PARAMS.contrast / 100;

        // Draw contour lines (marching-squares edge crossing)
        const levels = CONTOUR_LEVELS;
        const cellW = CELL_SIZE;
        const cellH = CELL_SIZE;

        rctx.strokeStyle = PARAMS.invert ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.35)";
        rctx.lineWidth = 1.2;

        for (let l = 0; l <= levels; l++) {
          const threshold = l / levels;

          // Coverage: skip some contour levels proportionally
          if (Math.random() > coverageRatio) continue;

          rctx.beginPath();

          for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
              // Get four corners of this cell
              const v00 = animGrid[r][c];
              const v10 = animGrid[r][c + 1];
              const v01 = animGrid[r + 1][c];
              const v11 = animGrid[r + 1][c + 1];

              // Marching squares: for each edge, check if threshold straddles
              // Edge a: top (v00→v10)
              // Edge b: right (v10→v11)
              // Edge c: bottom (v01→v11)
              // Edge d: left (v00→v01)

              const top = v00 >= threshold !== v10 >= threshold;
              const right = v10 >= threshold !== v11 >= threshold;
              const bottom = v01 >= threshold !== v11 >= threshold;
              const left = v00 >= threshold !== v01 >= threshold;

              const cx = c * cellW;
              const cy = r * cellH;
              const hw = cellW;
              const hh = cellH;

              const interpolate = (a: number, b: number) => {
                if (Math.abs(b - a) < 0.001) return 0.5;
                return (threshold - a) / (b - a);
              };

              // Each edge midpoint
              const midTopX = cx + hw * interpolate(v00, v10);
              const midTopY = cy;
              const midRightX = cx + hw;
              const midRightY = cy + hh * interpolate(v10, v11);
              const midBottomX = cx + hw * interpolate(v01, v11);
              const midBottomY = cy + hh;
              const midLeftX = cx;
              const midLeftY = cy + hh * interpolate(v00, v01);

              // Determine line segment based on which edges cross
              const count = [top, right, bottom, left].filter(Boolean).length;

              if (count === 2) {
                if (top && bottom) {
                  rctx.moveTo(midTopX, midTopY);
                  rctx.lineTo(midBottomX, midBottomY);
                } else if (left && right) {
                  rctx.moveTo(midLeftX, midLeftY);
                  rctx.lineTo(midRightX, midRightY);
                } else if (top && right) {
                  rctx.moveTo(midTopX, midTopY);
                  rctx.lineTo(midRightX, midRightY);
                } else if (right && bottom) {
                  rctx.moveTo(midRightX, midRightY);
                  rctx.lineTo(midBottomX, midBottomY);
                } else if (bottom && left) {
                  rctx.moveTo(midBottomX, midBottomY);
                  rctx.lineTo(midLeftX, midLeftY);
                } else if (left && top) {
                  rctx.moveTo(midLeftX, midLeftY);
                  rctx.lineTo(midTopX, midTopY);
                }
              } else if (count === 4) {
                // Saddle case — draw both diagonals
                rctx.moveTo(midTopX, midTopY);
                rctx.lineTo(midBottomX, midBottomY);
                rctx.moveTo(midLeftX, midLeftY);
                rctx.lineTo(midRightX, midRightY);
              }
            }
          }

          rctx.stroke();
        }

        // ── Step 4: Color adjustments ──
        // Brightness/contrast overlay
        if (brightAdj !== 0 || contAdj !== 1) {
          rctx.globalCompositeOperation = "overlay";
          rctx.fillStyle = `rgba(0,0,0,${Math.abs(brightAdj) * 0.3})`;
          rctx.fillRect(0, 0, W, H);
          rctx.globalCompositeOperation = "source-over";
        }

        // ── Step 5: Post-effects ──

        // Vignette
        if (PARAMS.pfx.vignette.enabled) {
          const vigInt = PARAMS.pfx.vignette.intensity / 100;
          const grad = rctx.createRadialGradient(
            W / 2,
            H / 2,
            W * 0.3,
            W / 2,
            H / 2,
            W * 0.7
          );
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(1, `rgba(0,0,0,${vigInt * 0.7})`);
          rctx.fillStyle = grad;
          rctx.fillRect(0, 0, W, H);
        }

        // Bloom (simplified: bright glow overlay)
        if (PARAMS.pfx.bloom.enabled) {
          const bloomInt = PARAMS.pfx.bloom.intensity / 100;
          rctx.globalCompositeOperation = "screen";
          rctx.fillStyle = `rgba(255,255,255,${bloomInt * 0.08})`;
          rctx.fillRect(0, 0, W, H);
          rctx.globalCompositeOperation = "source-over";
        }

        animId = requestAnimationFrame(draw);
      }

      startTime = performance.now();
      animId = requestAnimationFrame(draw);
    };

    // Handle image load failure
    img.onerror = () => {
      console.warn("[ContourBackground] Failed to load", IMAGE_PATH);
    };

    const handleResize = () => {
      // On resize, reload component logic by triggering a re-render
      // For simplicity, the current frame just continues with stale dimensions
      // A production version would re-initialize
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}
