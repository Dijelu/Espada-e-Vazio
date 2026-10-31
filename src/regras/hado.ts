/* Dano calculado dos Hadōs, lido do texto do livro. */
import type { Calculo, Ficha } from "./ficha";

export interface ReforcoHado {
  /** PR adicionais por passo */
  cada: number;
  n: number;
  lados: number;
}

export interface DanoHado {
  /** dados do dano básico */
  n: number;
  lados: number;
  /** PR do custo básico */
  custo: number;
  reforco?: ReforcoHado;
  /** soma fixa que todo Hadō recebe da ficha */
  fixo: number;
  /** de onde vem cada parte do fixo */
  origens: string[];
  /** dados extras da Máscara Hollow (no mesmo tamanho do dado básico) */
  dadosMascara: number;
  /** a margem de crítico passa de 20 para 19 (Alinhamento) */
  critico19: boolean;
  /** ignora esta quantidade de RD */
  ignoraRd: number;
  /** o dano soma o total de reiatsu do usuário (Ittoukasou) */
  somaReiatsu: boolean;
}

const RE_DANO = /(\d+)d(\d+)(?=\s+(?:pontos\s+)?de\s+dano)/;
const RE_REFORCO = /[Pp]ara cada (\d+) pontos? de Reiatsu adicionais?[^.]*?adicion[ae] (\d+)d(\d+)/;
const RE_CUSTO = /Custo: (\d+) PR/;

/** Lê o dano de um Hadō no texto do livro e soma o que a ficha acrescenta. Devolve null se o Hadō não causa dano em dados. */
export function danoDoHado(f: Ficha, c: Calculo, k: { n: number; texto: string; meta?: string }): DanoHado | null {
  const base = RE_DANO.exec(k.texto) ?? /(\d+)d(\d+)/.exec(k.texto);
  if (!base) return null;
  const rf = RE_REFORCO.exec(k.texto);
  const custo = Number(RE_CUSTO.exec(k.meta ?? "")?.[1] ?? 0);
  const origens: string[] = [];
  let fixo = 0;
  const soma = (v: number, nome: string) => { if (v > 0) { fixo += v; origens.push(`${nome} +${v}`); } };
  soma(c.danoHado, "Maestria de Hadō");
  if (f.talentos.includes("hadou-poderoso")) soma(c.atr.men, "Hadō Poderoso (Mente)");
  if (f.estado.liberado === "shikai") soma(c.prof, "Shikai");
  if (f.estado.liberado === "bankai") soma(2 * c.prof, "Bankai");
  const acerto = /Jogada: Acerto/.test(k.meta ?? "");
  return {
    n: Number(base[1]),
    lados: Number(base[2]),
    custo,
    reforco: rf ? { cada: Number(rf[1]), n: Number(rf[2]), lados: Number(rf[3]) } : undefined,
    fixo,
    origens,
    dadosMascara: c.dadosTecnicaMascara,
    critico19: acerto && f.classe === "kidoshu" && f.talentos.includes("alinhamento"),
    ignoraRd: f.classe === "kidoshu" ? (f.talentos.includes("perfuracao-arcana") ? 5 : f.talentos.includes("perfuracao-elemental") ? 5 : 0) : 0,
    somaReiatsu: k.n === 96,
  };
}

/** Expressão de dados pronta para rolar, com `passos` reforços de PR. */
export function expressaoHado(d: DanoHado, passos: number, prMax: number): string {
  const partes = [`${d.n + d.dadosMascara}d${d.lados}`];
  if (d.reforco && passos > 0) partes.push(`${d.reforco.n * passos}d${d.reforco.lados}`);
  const fixo = d.fixo + (d.somaReiatsu ? prMax : 0);
  if (fixo > 0) partes.push(String(fixo));
  return partes.join("+");
}

const media = (n: number, l: number) => (n * (l + 1)) / 2;

export function mediaHado(d: DanoHado, passos: number, prMax: number): number {
  return media(d.n + d.dadosMascara, d.lados) + (d.reforco ? media(d.reforco.n * passos, d.reforco.lados) : 0) + d.fixo + (d.somaReiatsu ? prMax : 0);
}

/** Quantos reforços cabem no PR da ficha (no máximo 8). */
export function passosMaximos(d: DanoHado, pr: number): number {
  if (!d.reforco) return 0;
  return Math.max(0, Math.min(8, Math.floor((pr - d.custo) / d.reforco.cada)));
}
