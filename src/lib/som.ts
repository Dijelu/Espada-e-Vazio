import { useSyncExternalStore } from "react";

/* ---------- configuração (guardada no navegador) ---------- */

export interface ConfigSom {
  musica: boolean;
  efeitos: boolean;
  volume: number; // 0 a 100, volume da música
}

const CHAVE = "som";
const padrao: ConfigSom = { musica: true, efeitos: true, volume: 40 };

function ler(): ConfigSom {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const o = JSON.parse(bruto);
      return {
        musica: o.musica !== false,
        efeitos: o.efeitos !== false,
        volume: typeof o.volume === "number" ? Math.min(100, Math.max(0, o.volume)) : padrao.volume,
      };
    }
  } catch {
    /* sem armazenamento */
  }
  return { ...padrao };
}

let cfg: ConfigSom = ler();
const ouvintes = new Set<() => void>();

function salvar(novo: Partial<ConfigSom>) {
  cfg = { ...cfg, ...novo };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(cfg));
  } catch {
    /* ignora */
  }
  ouvintes.forEach((f) => f());
}

export function useSom(): ConfigSom {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => cfg,
    () => cfg
  );
}

/* ---------- música de fundo ---------- */

let faixa: HTMLAudioElement | null = null;
let desbloqueado = false;
let fade: number | undefined;

function alvoVolume() {
  return (cfg.volume / 100) * 0.9;
}

function irPara(v: number, ao_fim?: () => void) {
  if (!faixa) return;
  window.clearInterval(fade);
  const f = faixa;
  const passo = (v - f.volume) / 12;
  let n = 0;
  fade = window.setInterval(() => {
    n++;
    f.volume = Math.min(1, Math.max(0, n >= 12 ? v : f.volume + passo));
    if (n >= 12) {
      window.clearInterval(fade);
      ao_fim?.();
    }
  }, 35);
}

function tocarMusica() {
  if (!cfg.musica) return;
  if (!faixa) {
    faixa = new Audio("/audio/musica.m4a");
    faixa.loop = true;
    faixa.volume = 0;
  }
  const f = faixa;
  if (!f.paused) {
    irPara(alvoVolume());
    return;
  }
  f.play()
    .then(() => irPara(alvoVolume()))
    .catch(() => {
      /* o navegador ainda não deixou tocar; tenta no próximo toque */
    });
}

function pararMusica() {
  if (!faixa || faixa.paused) return;
  const f = faixa;
  irPara(0, () => f.pause());
}

export function ligarMusica(on: boolean) {
  salvar({ musica: on });
  if (on) tocarMusica();
  else pararMusica();
}

export function ligarEfeitos(on: boolean) {
  salvar({ efeitos: on });
  if (on) efeito.clique();
}

export function mudarVolume(v: number) {
  salvar({ volume: v });
  if (faixa && !faixa.paused && cfg.musica) {
    window.clearInterval(fade);
    faixa.volume = alvoVolume();
  }
}

/* ---------- efeitos sonoros (gerados no navegador) ---------- */

let ctx: AudioContext | null = null;
let mestre: GainNode | null = null;
let ruidoBuf: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (!desbloqueado || !cfg.efeitos) return null;
  if (!ctx) {
    const C: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    mestre = ctx.createGain();
    mestre.gain.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    mestre.connect(comp);
    comp.connect(ctx.destination);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Um tom que desliza de f0 para f1. */
function tom(c: AudioContext, f0: number, f1: number, dur: number, tipo: OscillatorType, vol: number, atraso = 0) {
  const t = c.currentTime + atraso;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.015, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(mestre!);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Um sopro de ruído filtrado, com a frequência deslizando de f0 para f1. */
function ruido(c: AudioContext, dur: number, f0: number, f1: number, q: number, vol: number, atraso = 0, tipo: BiquadFilterType = "bandpass") {
  const t = c.currentTime + atraso;
  const s = c.createBufferSource();
  s.buffer = ruidoBuf;
  s.loop = true;
  const fl = c.createBiquadFilter();
  fl.type = tipo;
  fl.Q.value = q;
  fl.frequency.setValueAtTime(f0, t);
  fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.04, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl);
  fl.connect(g);
  g.connect(mestre!);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
}

const r = (a: number, b: number) => a + Math.random() * (b - a);

export const efeito = {
  /** toque em botão ou link */
  clique() {
    const c = audio();
    if (!c) return;
    tom(c, 820, 470, 0.07, "triangle", 0.14);
    ruido(c, 0.03, 4000, 3000, 1, 0.05);
  },
  /** abrir e fechar a busca */
  abrir() {
    const c = audio();
    if (!c) return;
    tom(c, 520, 900, 0.1, "triangle", 0.13);
    tom(c, 780, 1350, 0.1, "sine", 0.06, 0.03);
  },
  fechar() {
    const c = audio();
    if (!c) return;
    tom(c, 900, 480, 0.1, "triangle", 0.12);
  },
  /** virar de capítulo: folha passando */
  pagina() {
    const c = audio();
    if (!c) return;
    ruido(c, 0.42, 1100, 4200, 0.7, 0.3);
    ruido(c, 0.25, 3000, 800, 1.2, 0.12, 0.12);
    tom(c, 170, 80, 0.14, "sine", 0.16, 0.02);
  },
  /** troca de tema */
  tema(escuro: boolean) {
    const c = audio();
    if (!c) return;
    if (escuro) {
      ruido(c, 1.0, 3000, 160, 0.9, 0.34);
      tom(c, 120, 38, 1.0, "sine", 0.34);
      tom(c, 90, 45, 0.9, "sawtooth", 0.05, 0.05);
    } else {
      ruido(c, 0.9, 400, 5000, 0.8, 0.22);
      tom(c, 330, 1320, 0.7, "sine", 0.16);
      [1320, 1760, 2093].forEach((f, i) => tom(c, f, f * 0.995, 0.5, "sine", 0.06, 0.55 + i * 0.07));
    }
  },
  /** rolar dados: vários estalos que vão diminuindo */
  dado() {
    const c = audio();
    if (!c) return;
    const tempos = [0, 0.07, 0.15, 0.25, 0.37, 0.52, 0.7];
    tempos.forEach((t, i) => {
      const v = 0.38 * Math.pow(0.78, i);
      ruido(c, 0.045, r(1500, 3200), r(900, 1600), 3.5, v, t);
      tom(c, r(260, 480), 140, 0.06, "square", v * 0.22, t);
    });
    tom(c, 130, 55, 0.16, "sine", 0.22, 0.72);
  },
  /** golpe de zanpakutō */
  corte() {
    const c = audio();
    if (!c) return;
    ruido(c, 0.22, 7000, 1400, 1.1, 0.4);
    tom(c, 2400, 2340, 0.7, "sine", 0.07, 0.08);
    tom(c, 3610, 3560, 0.55, "sine", 0.045, 0.08);
    tom(c, 150, 70, 0.12, "sine", 0.2, 0.09);
  },
  /** kidō e reiatsu: energia subindo e soltando */
  energia() {
    const c = audio();
    if (!c) return;
    tom(c, 200, 1000, 0.5, "sawtooth", 0.07);
    tom(c, 400, 2000, 0.5, "sine", 0.1);
    ruido(c, 0.5, 300, 3200, 2, 0.16);
    ruido(c, 0.35, 2200, 260, 0.9, 0.34, 0.5);
    tom(c, 220, 60, 0.35, "sine", 0.26, 0.5);
  },
  /** cero: carga grave e estouro */
  cero() {
    const c = audio();
    if (!c) return;
    tom(c, 50, 180, 0.9, "sawtooth", 0.1);
    tom(c, 100, 360, 0.9, "sine", 0.14);
    ruido(c, 0.9, 200, 1800, 1.6, 0.14);
    ruido(c, 0.8, 1800, 90, 0.6, 0.5, 0.9);
    tom(c, 70, 28, 0.8, "sine", 0.45, 0.9);
  },
  erro() {
    const c = audio();
    if (!c) return;
    tom(c, 220, 150, 0.22, "square", 0.07);
  },
};

/* ---------- ligação com a página ---------- */

let iniciado = false;

/** Chame uma vez ao abrir o site. A música só começa no primeiro toque, porque os navegadores bloqueiam som automático. */
export function iniciarSom() {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;

  const primeiroToque = () => {
    if (desbloqueado) return;
    desbloqueado = true;
    tocarMusica();
  };
  window.addEventListener("pointerdown", primeiroToque, { capture: true });
  window.addEventListener("keydown", primeiroToque, { capture: true });

  // clique em botões e links
  window.addEventListener(
    "pointerdown",
    (e) => {
      const alvo = e.target as Element | null;
      const el = alvo?.closest?.("a, button, [role=button], summary, .bar, label.som-linha");
      if (!el) return;
      if (el.closest("[data-som=none]")) return;
      efeito.clique();
    },
    { capture: true }
  );

  // pausa quando a aba fica escondida
  document.addEventListener("visibilitychange", () => {
    if (!faixa) return;
    if (document.hidden) faixa.pause();
    else if (cfg.musica && desbloqueado) tocarMusica();
  });
}
