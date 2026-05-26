import { useEffect, useRef } from 'react';

const SPRING = 0.055;
const FRICTION = 0.80;
const REPEL_RADIUS = 110;
const REPEL_STRENGTH = 10;

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  phase: number;
}

export default function ParticleTitle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    let particles: Particle[] = [];
    let mounted = true;

    const buildParticles = () => {
      const W = canvas.offsetWidth;
      const H = 230;
      canvas.width = W;
      canvas.height = H;

      const fontSize = Math.min(W * 0.086, 90);
      const leading = fontSize * 1.08;

      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      const octx = off.getContext('2d')!;
      octx.fillStyle = 'white';
      octx.font = `italic ${fontSize}px 'Instrument Serif'`;
      octx.textAlign = 'center';
      const line1 = 'Somewhere, something incredible';
      const line2 = 'is waiting to be known.';
      octx.fillText(line1, W / 2, H / 2 - leading * 0.5 + fontSize * 0.35);
      octx.fillText(line2, W / 2, H / 2 + leading * 0.5 + fontSize * 0.35);

      const imageData = octx.getImageData(0, 0, W, H);
      const data = imageData.data;
      const pts: { x: number; y: number }[] = [];
      for (let y = 0; y < H; y += 3) {
        for (let x = 0; x < W; x += 3) {
          if (data[(y * W + x) * 4 + 3] > 100) {
            pts.push({ x, y });
          }
        }
      }

      particles = pts.map((pt) => {
        const startY = Math.random() < 0.5 ? -30 : H + 30;
        return {
          x: Math.random() * W,
          y: startY,
          tx: pt.x,
          ty: pt.y,
          vx: 0,
          vy: 0,
          r: Math.random() * 0.85 + 0.45,
          opacity: 0,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    document.fonts.load("italic 80px 'Instrument Serif'").then(() => {
      if (!mounted) return;
      buildParticles();

      const render = () => {
        if (!mounted) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;

        for (const p of particles) {
          p.phase += 0.015;

          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < REPEL_RADIUS) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            p.vx -= (dx / dist) * force;
            p.vy -= (dy / dist) * force;
          }

          const settled =
            Math.abs(p.x - p.tx) < 2 && Math.abs(p.y - p.ty) < 2;
          if (settled) {
            p.x += Math.sin(p.phase * 0.7) * 0.3;
            p.y += Math.cos(p.phase * 0.5) * 0.3;
          } else {
            p.vx += (p.tx - p.x) * SPRING;
            p.vy += (p.ty - p.y) * SPRING;
          }

          p.vx *= FRICTION;
          p.vy *= FRICTION;
          p.x += p.vx;
          p.y += p.vy;

          if (p.opacity < 1) p.opacity = Math.min(1, p.opacity + 0.022);

          const nearFactor =
            dist < REPEL_RADIUS ? 1 - dist / REPEL_RADIUS : 0;
          if (nearFactor > 0) {
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
            glow.addColorStop(0, `rgba(255,255,255,${nearFactor * 0.6})`);
            glow.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
          ctx.fill();
        }

        raf = requestAnimationFrame(render);
      };
      render();
    });

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '230px',
        cursor: 'none',
        background: 'transparent',
        display: 'block',
      }}
    />
  );
}
