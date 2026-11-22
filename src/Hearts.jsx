import { useEffect, useRef } from 'react';

const particles = [];
let size = { w: 0, h: 0 };
const COLORS = ['#e0475b', '#f08a8a', '#f7b5b0', '#ff7f6e', '#ffd9d3'];

function makeHeart(x, y, burst = false) {
  return {
    x: x ?? Math.random() * size.w,
    y: y ?? size.h + 20,
    s: Math.random() * 10 + 6,
    o: burst ? 1 : Math.random() * 0.35 + 0.1,
    vy: burst ? (Math.random() - 0.5) * 12 : Math.random() * 0.6 + 0.25,
    vx: burst ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 0.4,
    burst,
    decay: burst ? Math.random() * 0.015 + 0.01 : 0,
    r: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.04,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export function burst(x, y, count = 40) {
  for (let i = 0; i < count; i++) particles.push(makeHeart(x, y, true));
}

export default function Hearts() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;

    const resize = () => {
      size = { w: window.innerWidth, h: window.innerHeight };
      canvas.width = size.w * dpr;
      canvas.height = size.h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    if (!particles.some((p) => !p.burst)) {
      for (let i = 0; i < 12; i++) particles.push(makeHeart(Math.random() * size.w, Math.random() * size.h));
    }

    const draw = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, p.o);
      ctx.fillStyle = p.c;
      const t = p.s * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, t);
      ctx.bezierCurveTo(-p.s / 2, -t, -p.s, t / 3, 0, p.s);
      ctx.bezierCurveTo(p.s, t / 3, p.s / 2, -t, 0, t);
      ctx.fill();
      ctx.restore();
    };

    const loop = () => {
      ctx.clearRect(0, 0, size.w, size.h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y -= p.vy;
        p.x += p.vx;
        p.r += p.vr;
        if (p.burst) {
          p.vy -= 0.2;
          p.o -= p.decay;
          if (p.o <= 0) { particles.splice(i, 1); continue; }
        } else if (p.y < -30) {
          p.y = size.h + 20;
          p.x = Math.random() * size.w;
        }
        draw(p);
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="hearts-canvas" aria-hidden="true" />;
}
