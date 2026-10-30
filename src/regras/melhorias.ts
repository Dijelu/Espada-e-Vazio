/* Melhorias de equipamento Quincy (Ritter e Schütze): níveis 5, 10, 15 e 20. */
import type { Ataque, Ficha } from "./ficha";
import { dadosArmaNatural, PASSOS_NATURAL } from "./hueco";

export type TipoMelhoria = "dano" | "critico" | "mult" | "escudo";

export interface Melhoria {
  id: string;
  /** id do ataque melhorado, ou "escudo" */
  alvo: string;
  tipo: TipoMelhoria;
}

export const TIPOS_MELHORIA: { id: TipoMelhoria; nome: string; texto: string }[] = [
  { id: "dano", nome: "Dano", texto: "Sobe um passo de dano por vez (limite 5d10)." },
  { id: "critico", nome: "Margem de crítico", texto: "+1 na margem por melhoria (limite 15)." },
  { id: "mult", nome: "Multiplicador de crítico", texto: "+1 no multiplicador por melhoria (limite x4)." },
  { id: "escudo", nome: "Escudo", texto: "+1 na CR por melhoria (limite 5)." },
];

const PASSOS = ["1d4", "1d6", "1d8", "1d10", "1d12", "2d6", "2d8", "2d10", "2d12", "3d8", "3d10", "3d12", "4d10", "4d12", "5d10"];

/** Quantas melhorias a classe já deu até o nível (5, 10, 15 e 20). */
export function melhoriasDoNivel(classe: string, nivel: number): number {
  if (classe !== "ritter" && classe !== "schutze") return 0;
  return [5, 10, 15, 20].filter((n) => nivel >= n).length;
}

export const melhoriasPendentes = (f: Ficha) => Math.max(0, melhoriasDoNivel(f.classe, f.nivel) - f.melhorias.length);

const conta = (f: Ficha, alvo: string, tipo: TipoMelhoria) => f.melhorias.filter((m) => m.alvo === alvo && m.tipo === tipo).length;

export const LIMITES: Record<TipoMelhoria, (qtd: number, base: Ataque | null) => boolean> = {
  dano: (q, a) => {
    const i = a ? PASSOS.indexOf((a.dano.match(/^\s*(\d+d\d+)/)?.[1]) ?? "") : -1;
    return i < 0 ? true : i + q + 1 <= PASSOS.length - 1;
  },
  critico: (q, a) => (a?.crit ?? 20) - q - 1 >= 15,
  mult: (q, a) => (a?.mult ?? 2) + q + 1 <= 4,
  escudo: (q) => q + 1 <= 5,
};

export function podeMelhorar(f: Ficha, alvo: string, tipo: TipoMelhoria): boolean {
  const a = f.ataques.find((x) => x.id === alvo) ?? null;
  return LIMITES[tipo](conta(f, alvo, tipo), a);
}

/** Aplica os passos de dano na primeira parte dos dados, ex.: "1d8+2" com 1 passo vira "1d10+2". */
export function subirDano(dano: string, passos: number): string {
  if (passos <= 0) return dano;
  const m = dano.match(/^(\s*)(\d+d\d+)(.*)$/s);
  if (!m) return dano;
  const i = PASSOS.indexOf(m[2]);
  if (i < 0) return dano;
  return m[1] + PASSOS[Math.min(PASSOS.length - 1, i + passos)] + m[3];
}

export interface AtaqueMelhorado {
  dano: string;
  crit?: number;
  mult?: number;
  melhorias: number;
}

export function ataqueMelhorado(f: Ficha, a: Ataque): AtaqueMelhorado {
  const d = conta(f, a.id, "dano");
  const c = conta(f, a.id, "critico");
  const m = conta(f, a.id, "mult");
  return {
    dano: subirDano(f.classe === "hueco" && a.nome === "Arma natural" && PASSOS_NATURAL.includes(a.dano.trim()) ? dadosArmaNatural(f) : a.dano, d),
    crit: a.crit ? Math.max(15, a.crit - c) : undefined,
    mult: a.mult ? Math.min(4, a.mult + m) : undefined,
    melhorias: d + c + m,
  };
}

export const bonusEscudo = (f: Ficha) => Math.min(5, f.melhorias.filter((m) => m.tipo === "escudo").length);
