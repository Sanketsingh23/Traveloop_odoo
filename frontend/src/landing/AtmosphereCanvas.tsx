import { useEffect, useRef } from 'react';

interface Mote {
  x: number;
  y: number;
  r: number;
  opacity: number;
  speedX: number;
  speedY: number;
  twinkleSpeed: number;
  phase: number;
}

export default function AtmosphereCanvas() {
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

    const COUNT = 200;
    const motes: Mote[] = Array.from({ length: COUNT }, (_, i) => {
      const inUpper = i < COUNT * 0.55;
      return {
        x: Math.random() * window.innerWidth,
        y: inUpper
          ? Math.random() * window.innerHeight * 0.6
          : Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.4,
        opacity: Math.random() * 0.45 + 0.18,
        speedX: (Math.random() - 0.5) * 0.14,
        speedY: -(Math.random() * 0.18 + 0.04),
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2,
      };
    });

    let raf: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const m of motes) {
        m.phase += m.twinkleSpeed;
        m.x += m.speedX;
        m.y += m.speedY;
        if (m.y < -4) m.y = canvas.height + 4;
        if (m.x < -4) m.x = canvas.width + 4;
        if (m.x > canvas.width + 4) m.x = -4;

        const op = m.opacity * (0.65 + 0.35 * Math.sin(m.phase));
        const bloom = m.r * 2.4;
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, bloom);
        grad.addColorStop(0, `rgba(255,255,255,${op})`);
        grad.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.beginPath();
        ctx.arc(m.x, m.y, bloom, 0, Math.PI * 2);
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
