import { useEffect, useRef } from "react";

/** Brasas de reiatsu em volta de um cartão de técnica ativa. A cor vem da pele (--tec-cor). Parado se o usuário pediu menos movimento. */
export function BrasasReiatsu() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const calmo = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cor = getComputedStyle(cv).getPropertyValue("--tec-cor").trim() || "229, 23, 63";
    let W = 0, H = 0, quadro = 0, vivo = true;
    const mede = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = Math.max(1, Math.round(W * d)); cv.height = Math.max(1, Math.round(H * d)); ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const nova = (alto: boolean) => ({ x: Math.random() * W, y: alto ? Math.random() * H : H + 4, v: 0.25 + Math.random() * 0.7, r: 1 + Math.random() * 2.2, o: Math.random() * 6.28, a: 0.45 + Math.random() * 0.45 });
    mede();
    const obs = typeof ResizeObserver === "function" ? new ResizeObserver(mede) : null;
    obs?.observe(cv);
    const ps = Array.from({ length: Math.min(70, Math.max(28, Math.round((W * H) / 6000))) }, () => nova(true));
    const passo = () => {
      if (!vivo) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        if (!calmo) { p.y -= p.v; p.o += 0.03; if (p.y < -6) Object.assign(p, nova(false)); }
        const x = p.x + Math.sin(p.o) * 6, g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(255, 214, 180, ${p.a})`); g.addColorStop(0.4, `rgba(${cor}, ${p.a * 0.6})`); g.addColorStop(1, `rgba(${cor}, 0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, p.y, p.r * 4, 0, 6.2832); ctx.fill();
      }
      if (!calmo) quadro = requestAnimationFrame(passo);
    };
    passo();
    return () => { vivo = false; cancelAnimationFrame(quadro); obs?.disconnect(); };
  }, []);
  return <canvas ref={ref} className="tec-brasas" aria-hidden="true" />;
}
