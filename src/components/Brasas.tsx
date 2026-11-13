import { useEffect, useRef } from "react";

/* Brasas que sobem devagar no topo da capa. Canvas pequeno, pausa fora da tela e com a aba escondida,
   e nem aparece com "reduzir movimento". É só enfeite: não recebe clique nem muda o layout. */
export function Brasas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const cor = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#e5173f";
    let w = 0, h = 0, raf = 0, visivel = true;
    const n = window.innerWidth < 700 ? 14 : 28;
    type P = { x: number; y: number; r: number; v: number; d: number; a: number; f: number };
    const novo = (cheio: boolean): P => ({ x: Math.random() * w, y: cheio ? Math.random() * h : h + 10, r: 0.8 + Math.random() * 2.2, v: 0.15 + Math.random() * 0.45, d: (Math.random() - 0.5) * 0.25, a: 0.25 + Math.random() * 0.5, f: Math.random() * Math.PI * 2 });
    let ps: P[] = [];
    const medir = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w; cv.height = h; ps = Array.from({ length: n }, () => novo(true)); };
    medir();
    const quadro = () => {
      raf = 0;
      if (!visivel || document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = cor;
      for (const p of ps) {
        p.y -= p.v; p.f += 0.02; p.x += p.d + Math.sin(p.f) * 0.15;
        if (p.y < -10) Object.assign(p, novo(false));
        const fade = Math.min(1, p.y / (h * 0.5));
        ctx.globalAlpha = Math.max(0, p.a * fade);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      raf = requestAnimationFrame(quadro);
    };
    const liga = () => { if (!raf && visivel && !document.hidden) raf = requestAnimationFrame(quadro); };
    const io = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; liga(); });
    io.observe(cv);
    document.addEventListener("visibilitychange", liga);
    window.addEventListener("resize", medir);
    liga();
    return () => { if (raf) cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", liga); window.removeEventListener("resize", medir); };
  }, []);
  return <canvas ref={ref} className="brasas" aria-hidden="true" />;
}
