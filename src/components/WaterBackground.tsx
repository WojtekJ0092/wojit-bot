// ---------------------------------------------------------------------------
// WaterBackground — mouse-interactive animated background
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

const PARTICLE_COUNT = 80;

function createParticle(w: number, h: number): Particle {
  const x = Math.random() * w;
  const y = Math.random() * h;
  const colors = ["#60a5fa", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e0e7ff"];
  return {
    x,
    y,
    baseX: x,
    baseY: y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: 2 + Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)]!,
  };
}

export function WaterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, isMoving: false });
  const ripplesRef = useRef<Ripple[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvas.width, canvas.height),
      );
    }
    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking
    let lastMouseX = 0;
    let lastMouseY = 0;
    let mouseTimeout: number | null = null;

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.isMoving = true;

      // Create ripple if mouse moved significantly
      const dx = mouseRef.current.x - lastMouseX;
      const dy = mouseRef.current.y - lastMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 15) {
        ripplesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          radius: 0,
          maxRadius: 100 + Math.random() * 50,
          alpha: 0.6,
        });
        lastMouseX = mouseRef.current.x;
        lastMouseY = mouseRef.current.y;
      }

      if (mouseTimeout) clearTimeout(mouseTimeout);
      mouseTimeout = window.setTimeout(() => {
        mouseRef.current.isMoving = false;
      }, 100);
    }

    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    function draw() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;
      time += 1;

      ctx.clearRect(0, 0, W, H);

      const mouse = mouseRef.current;

      // Update and draw particles
      for (const p of particles) {
        // Gentle drift
        p.baseX += p.vx;
        p.baseY += p.vy;

        // Wrap around
        if (p.baseX < 0) p.baseX = W;
        if (p.baseX > W) p.baseX = 0;
        if (p.baseY < 0) p.baseY = H;
        if (p.baseY > H) p.baseY = 0;

        // Mouse attraction/repulsion
        const dx = mouse.x - p.baseX;
        const dy = mouse.y - p.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let offsetX = 0;
        let offsetY = 0;

        if (mouse.isMoving && dist < 150) {
          const force = (150 - dist) / 150;
          offsetX = (dx / dist) * force * 40;
          offsetY = (dy / dist) * force * 40;
        }

        p.x = p.baseX + offsetX;
        p.y = p.baseY + offsetY;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();

        // Draw connection lines to nearby particles
        for (const other of particles) {
          if (other === p) continue;
          const dx2 = p.x - other.x;
          const dy2 = p.y - other.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist2 < 80) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist2 / 80) * 0.15;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;

      // Draw mouse glow
      if (mouse.isMoving) {
        const glowGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          200,
        );
        glowGrad.addColorStop(0, "rgba(139, 92, 246, 0.3)");
        glowGrad.addColorStop(0.5, "rgba(96, 165, 250, 0.15)");
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(mouse.x - 200, mouse.y - 200, 400, 400);
      }

      // Update and draw ripples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.radius += 3;
        ripple.alpha -= 0.015;

        if (ripple.alpha > 0 && ripple.radius < ripple.maxRadius) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(139, 92, 246, ${ripple.alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(96, 165, 250, ${ripple.alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          return true;
        }
        return false;
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (mouseTimeout) clearTimeout(mouseTimeout);
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
