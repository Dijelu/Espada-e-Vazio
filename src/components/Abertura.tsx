import { useEffect, useRef, useState } from "react";

/* Abertura do site: páginas de mangá passando rápido; depois o título e os três
   símbolos entram, as páginas desaceleram e a tela escurece para dar foco.
   As páginas são desenhadas aqui mesmo (originais). Se existir
   /art/manga/paginas.json (lista de imagens), elas são usadas no lugar. */

const CHAVE = "eev-abertura-vista";
const DURACAO = 9200; // ms até a abertura terminar sozinha

function semente(n: number) {
  let s = n * 2654435761 >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Caixa = { x: number; y: number; w: number; h: number };

function dividir(c: Caixa, r: () => number, nivel: number): Caixa[] {
  if (nivel === 0 || (nivel < 3 && r() < 0.22)) return [c];
  const g = 7;
  const horiz = c.w > c.h ? r() < 0.25 : r() < 0.75;
  const t = 0.35 + r() * 0.3;
  if (horiz) {
    const h1 = (c.h - g) * t;
    return [
      ...dividir({ x: c.x, y: c.y, w: c.w, h: h1 }, r, nivel - 1),
      ...dividir({ x: c.x, y: c.y + h1 + g, w: c.w, h: c.h - h1 - g }, r, nivel - 1),
    ];
  }
  const w1 = (c.w - g) * t;
  return [
    ...dividir({ x: c.x, y: c.y, w: w1, h: c.h }, r, nivel - 1),
    ...dividir({ x: c.x + w1 + g, y: c.y, w: c.w - w1 - g, h: c.h }, r, nivel - 1),
  ];
}

function painel(p: Caixa, r: () => number, id: string): string {
  const tipo = Math.floor(r() * 6);
  const cx = p.x + p.w * (0.2 + r() * 0.6);
  const cy = p.y + p.h * (0.2 + r() * 0.6);
  const clip = `<clipPath id="${id}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/></clipPath>`;
  let dentro = "";
  const diag = Math.hypot(p.w, p.h);
  if (tipo === 0 || tipo === 1) {
    // linhas de velocidade a partir de um ponto
    const n = 46 + Math.floor(r() * 30);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.1;
      const r0 = diag * (0.08 + r() * 0.22);
      const larg = 0.015 + r() * 0.03;
      const x1 = cx + Math.cos(a) * r0, y1 = cy + Math.sin(a) * r0;
      const x2 = cx + Math.cos(a - larg) * diag, y2 = cy + Math.sin(a - larg) * diag;
      const x3 = cx + Math.cos(a + larg) * diag, y3 = cy + Math.sin(a + larg) * diag;
      dentro += `<path d="M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z" fill="#111"/>`;
    }
  } else if (tipo === 2) {
    // retícula (pontos) com mancha de tinta
    dentro += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="url(#ret)"/>`;
    dentro += `<ellipse cx="${cx}" cy="${cy}" rx="${p.w * 0.3}" ry="${p.h * 0.34}" fill="#111"/>`;
  } else if (tipo === 3) {
    // fundo preto com rasgos claros
    dentro += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#111"/>`;
    for (let i = 0; i < 7; i++) {
      const x = p.x + r() * p.w, y = p.y + r() * p.h;
      const l = 18 + r() * 60, a = -0.9 + r() * 0.5;
      dentro += `<path d="M${x} ${y}l${Math.cos(a) * l} ${Math.sin(a) * l}l${-3} ${5}Z" fill="#f2eee4"/>`;
    }
  } else if (tipo === 4) {
    // hachura diagonal
    const passo = 4 + r() * 3;
    for (let k = -p.h; k < p.w + p.h; k += passo) {
      dentro += `<line x1="${p.x + k}" y1="${p.y}" x2="${p.x + k - p.h}" y2="${p.y + p.h}" stroke="#111" stroke-width="${0.6 + r() * 0.8}"/>`;
    }
    dentro += `<path d="M${p.x} ${p.y + p.h}Q${cx} ${cy} ${p.x + p.w} ${p.y + p.h * 0.5}L${p.x + p.w} ${p.y + p.h}Z" fill="#f2eee4" stroke="#111" stroke-width="2"/>`;
  } else {
    // silhueta de lâmina atravessando o quadro
    dentro += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="url(#ret)"/>`;
    const a = -0.5 - r() * 0.5;
    const l = diag * 1.2;
    const x1 = cx - Math.cos(a) * l / 2, y1 = cy - Math.sin(a) * l / 2;
    const x2 = cx + Math.cos(a) * l / 2, y2 = cy + Math.sin(a) * l / 2;
    dentro += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="${6 + r() * 6}" stroke-linecap="butt"/>`;
    dentro += `<line x1="${x1}" y1="${y1 - 8}" x2="${x2}" y2="${y2 - 8}" stroke="#111" stroke-width="1.4"/>`;
  }
  return `${clip}<g clip-path="url(#${id})"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#f2eee4"/>${dentro}</g><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="none" stroke="#111" stroke-width="2.4"/>`;
}

function paginaSvg(n: number): string {
  const r = semente(n + 11);
  const ps = dividir({ x: 14, y: 14, w: 272, h: 402 }, r, 4);
  const corpo = ps.map((p, i) => painel(p, r, `c${n}-${i}`)).join("");
  return `<svg viewBox="0 0 300 430" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="ret" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.5" cy="2.5" r="1.25" fill="#111"/></pattern></defs><rect width="300" height="430" fill="#f2eee4"/>${corpo}</svg>`;
}

export function aberturaJaVista(): boolean {
  try {
    return sessionStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

export default function Abertura({ onFim }: { onFim: () => void }) {
  const palco = useRef<HTMLDivElement>(null);
  const [fase, setFase] = useState<"correndo" | "titulo" | "saindo">("correndo");

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE, "1");
    } catch { /* sem armazenamento */ }
    const paleta = palco.current;
    if (!paleta) return;
    let parado = false;
    const t0 = performance.now();
    let proximo = 0;
    let cont = 0;
    let imagens: string[] = [];

    fetch("/art/manga/paginas.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((l) => {
        if (Array.isArray(l)) imagens = l.filter((x) => typeof x === "string").slice(0, 40);
      })
      .catch(() => {});

    const criar = (t: number) => {
      const prog = Math.min(1, t / (DURACAO * 0.85));
      const el = document.createElement("div");
      el.className = "ab-pag";
      const k = cont++;
      if (imagens.length) {
        const im = document.createElement("img");
        im.src = imagens[k % imagens.length];
        im.alt = "";
        el.appendChild(im);
      } else {
        el.innerHTML = paginaSvg(k % 14);
      }
      const larg = window.innerWidth;
      const x = (Math.random() * 0.9 - 0.05) * larg;
      const rot = (Math.random() - 0.5) * 26;
      const dur = 900 + prog * prog * 3600; // desacelera
      const tam = 0.8 + Math.random() * 0.5;
      el.style.left = `${x - 110}px`;
      el.style.width = `${Math.round(220 * tam)}px`;
      paleta.appendChild(el);
      const alto = window.innerHeight;
      const anim = el.animate(
        [
          { transform: `translateY(${alto + 120}px) rotate(${rot}deg)`, opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { transform: `translateY(${-alto * 0.55}px) rotate(${rot + (Math.random() - 0.5) * 10}deg)`, opacity: 1, offset: 0.8 },
          { transform: `translateY(${-alto * 0.75}px) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: dur * 1.7, easing: "linear", fill: "forwards" },
      );
      anim.onfinish = () => el.remove();
    };

    const laco = (agora: number) => {
      if (parado) return;
      const t = agora - t0;
      if (t >= proximo) {
        criar(t);
        const prog = Math.min(1, t / (DURACAO * 0.85));
        proximo = t + 70 + prog * prog * 520; // intervalo cresce
      }
      raf = requestAnimationFrame(laco);
    };
    let raf = requestAnimationFrame(laco);

    const a = window.setTimeout(() => setFase("titulo"), 2400);
    const b = window.setTimeout(() => setFase("saindo"), DURACAO);
    const c = window.setTimeout(onFim, DURACAO + 900);
    return () => {
      parado = true;
      cancelAnimationFrame(raf);
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [onFim]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") onFim();
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onFim]);

  return (
    <div className={`abertura fase-${fase}`} role="dialog" aria-label="Abertura">
      <div className="ab-palco" ref={palco} />
      <div className="ab-escuro" />
      <div className="ab-titulo">
        <div className="ab-simbolos">
          <img src="/art/sym-flame.png" alt="" className="ab-s1" />
          <img src="/art/sym-mask-claro.png" alt="" className="ab-s2" />
          <img src="/art/sym-intro.png" alt="" className="ab-s3" />
        </div>
        <h1 className="title-font">
          Espada <span>&amp;</span> vazio
        </h1>
      </div>
      <button type="button" className="ab-pular" onClick={onFim}>
        Pular
      </button>
    </div>
  );
}
