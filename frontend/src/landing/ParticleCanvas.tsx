import { useEffect, useRef } from 'react';

interface Pollen {
  x: number;
  y: number;
  r: number;
  baseOpacity: number;
  speedY: number;
  phase: number;
  drift: number;
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 60;
    const spawnY = (h: number) => h * 0.55 + Math.random() * h * 0.13;

    const particles: Pollen[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: spawnY(window.innerHeight),
      r: Math.random() * 0.7 + 0.1,
      baseOpacity: Math.random() * 0.45 + 0.08,
      speedY: -(Math.random() * 0.22 + 0.05),
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.2,
    }));

    let raf: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.phase += 0.018;
        p.y += p.speedY;
        p.x += p.drift;

        const heightRatio = p.y / canvas.height;
        let heightFactor = 1;
        if (heightRatio < 0.60 && heightRatio > 0.44) {
          heightFactor = (heightRatio - 0.44) / 0.16;
        } else if (heightRatio <= 0.44) {
          heightFactor = 0;
        }

        if (p.y < canvas.height * 0.44) {
          p.y = spawnY(canvas.height);
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        const op = p.baseOpacity * (0.6 + 0.4 * Math.sin(p.phase)) * heightFactor;
        const bloom = p.r * 2.2;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, bloom);
        grad.addColorStop(0, `rgba(255,240,180,${op})`);
        grad.addColorStop(1, `rgba(255,240,180,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, bloom, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}
