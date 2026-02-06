// ---------------------------------------------------------------------------
// WaterBackground — animated floating lines that bounce off UI elements
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";

interface Line {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  angle: number;
  speed: number;
  drift: number;
  freq: number;
  phase: number;
  opacity: number;
  width: number;
  color: string;
}

const LINE_COUNT = 40;

const COLORS = [
  "255, 255, 255", // white
  "180, 180, 180", // light grey
  "120, 120, 120", // mid grey
  "80, 80, 80",    // dark grey
  "0, 0, 0",       // black
];

const BOUNCE_PADDING = 20; // how far from text elements to start bouncing

function createLine(w: number, h: number): Line {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.6;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    len: 80 + Math.random() * 200,
    angle,
    speed,
    drift: 0.3 + Math.random() * 0.6,
    freq: 0.002 + Math.random() * 0.004,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.15 + Math.random() * 0.35,
    width: 2 + Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
  };
}

/** Collect bounding rects for all UI text/interactive elements. */
function getExclusionZones(): DOMRect[] {
  const selectors = [
    ".layout__header",
    ".filter-bar",
    ".chat-input",
    ".answer-view",
    ".sources-drawer",
    ".error-banner",
  ];
  const rects: DOMRect[] = [];
  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      // Expand the rect by padding
      rects.push(
        new DOMRect(
          r.x - BOUNCE_PADDING,
          r.y - BOUNCE_PADDING,
          r.width + BOUNCE_PADDING * 2,
          r.height + BOUNCE_PADDING * 2,
        ),
      );
    });
  }
  return rects;
}

/** Check if a point is inside any exclusion zone, return the zone if so. */
function hitTest(
  px: number,
  py: number,
  zones: DOMRect[],
): DOMRect | null {
  for (const z of zones) {
    if (px >= z.x && px <= z.x + z.width && py >= z.y && py <= z.y + z.height) {
      return z;
    }
  }
  return null;
}

/** Bounce a line smoothly off the nearest edge of an exclusion zone. */
function bounce(line: Line, zone: DOMRect): void {
  // Find distances to each edge
  const dLeft = Math.abs(line.x - zone.x);
  const dRight = Math.abs(line.x - (zone.x + zone.width));
  const dTop = Math.abs(line.y - zone.y);
  const dBottom = Math.abs(line.y - (zone.y + zone.height));

  const minDist = Math.min(dLeft, dRight, dTop, dBottom);

  if (minDist === dLeft) {
    // Came from the left — push left, reflect vx
    line.x = zone.x - 1;
    if (line.vx > 0) line.vx = -line.vx;
  } else if (minDist === dRight) {
    // Came from the right — push right, reflect vx
    line.x = zone.x + zone.width + 1;
    if (line.vx < 0) line.vx = -line.vx;
  } else if (minDist === dTop) {
    // Came from the top — push up, reflect vy
    line.y = zone.y - 1;
    if (line.vy > 0) line.vy = -line.vy;
  } else {
    // Came from the bottom — push down, reflect vy
    line.y = zone.y + zone.height + 1;
    if (line.vy < 0) line.vy = -line.vy;
  }

  // Update angle to match new velocity
  line.angle = Math.atan2(line.vy, line.vx);
}

export function WaterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linesRef = useRef<Line[]>([]);
  const rafRef = useRef<number>(0);
  const zonesRef = useRef<DOMRect[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      linesRef.current = Array.from({ length: LINE_COUNT }, () =>
        createLine(canvas.width, canvas.height),
      );
    }
    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    let zoneFrame = 0;

    function draw() {
      if (!ctx || !canvas) return;
      time += 1;

      // Update exclusion zones every 10 frames for perf
      if (zoneFrame % 10 === 0) {
        zonesRef.current = getExclusionZones();
      }
      zoneFrame++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const zones = zonesRef.current;

      for (const line of linesRef.current) {
        // Gentle sinusoidal drift added to velocity
        const wave = Math.sin(time * line.freq + line.phase) * line.drift * 0.15;
        const wobble = Math.cos(time * line.freq * 0.7 + line.phase * 1.3) * line.drift * 0.1;

        line.x += line.vx + wave;
        line.y += line.vy + wobble;

        // Gently rotate
        line.angle += Math.sin(time * line.freq * 0.5 + line.phase) * 0.002;

        // Bounce off exclusion zones (check head and tail of line)
        const headX = line.x + Math.cos(line.angle) * line.len;
        const headY = line.y + Math.sin(line.angle) * line.len;

        const hitBody = hitTest(line.x, line.y, zones);
        if (hitBody) bounce(line, hitBody);

        const hitHead = hitTest(headX, headY, zones);
        if (hitHead) bounce(line, hitHead);

        // Also check midpoint
        const midX = (line.x + headX) / 2;
        const midY = (line.y + headY) / 2;
        const hitMid = hitTest(midX, midY, zones);
        if (hitMid) bounce(line, hitMid);

        // Wrap around screen edges
        if (line.x < -line.len) line.x = canvas.width + line.len;
        if (line.x > canvas.width + line.len) line.x = -line.len;
        if (line.y < -line.len) line.y = canvas.height + line.len;
        if (line.y > canvas.height + line.len) line.y = -line.len;

        // Dampen speed slightly to keep things smooth
        const currentSpeed = Math.sqrt(line.vx * line.vx + line.vy * line.vy);
        if (currentSpeed > line.speed * 2) {
          line.vx *= 0.98;
          line.vy *= 0.98;
        }

        // Draw the line with wavy distortion
        const segments = 12;
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const baseX = line.x + Math.cos(line.angle) * line.len * t;
          const baseY = line.y + Math.sin(line.angle) * line.len * t;
          const perpAngle = line.angle + Math.PI / 2;
          const waveOffset =
            Math.sin(t * Math.PI * 2 + time * line.freq * 3 + line.phase) *
            8 *
            line.drift;
          const px = baseX + Math.cos(perpAngle) * waveOffset;
          const py = baseY + Math.sin(perpAngle) * waveOffset;

          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }

        // Pulsing opacity
        const pulse = 0.7 + 0.3 * Math.sin(time * line.freq * 2 + line.phase);
        ctx.strokeStyle = `rgba(${line.color}, ${line.opacity * pulse})`;
        ctx.lineWidth = line.width;
        ctx.lineCap = "butt";
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
