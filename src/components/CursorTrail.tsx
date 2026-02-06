// ---------------------------------------------------------------------------
// CursorTrail — draws fading lines that follow the mouse cursor
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  time: number;
}

const FADE_MS = 600;

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    pointsRef.current.push({ x: e.clientX, y: e.clientY, time: Date.now() });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    function draw() {
      if (!ctx || !canvas) return;
      const now = Date.now();

      // Remove expired points
      pointsRef.current = pointsRef.current.filter(
        (p) => now - p.time < FADE_MS,
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pts = pointsRef.current;
      if (pts.length < 3) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Draw a single smooth continuous path
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";

      for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1]!;
        const curr = pts[i]!;
        const next = pts[i + 1]!;
        const age = now - curr.time;
        const t = Math.max(0, 1 - age / FADE_MS);
        // Ease-out for smoother fade
        const alpha = t * t;

        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;

        ctx.beginPath();
        ctx.moveTo((prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 4.5;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
