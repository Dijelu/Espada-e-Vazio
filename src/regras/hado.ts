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
  /** dados extras que a forma ativa dá (ex.: 2d8) */
  dadosForma: string[];
  /** a margem de crítico passa de 20 para 19 (Alinhamento) */
  critico19: boolean;
  /** ignora esta quantidade de RD */
  ignoraRd: number;
  /** o dano soma o total de reiatsu do usuário (Ittoukasou) */
  somaReiatsu: boolean;
}

const RE_DANO = /(\d+)d(\d+)(?=\s+(?:pontos\s+)?de\s+dano)/i;
const RE_REFORCO = /[Pp]ara cada (\d+) (?:pontos? de )?Reiatsu adicionais?[^.]*?(?:adicion[ae]|aumente[^.]*? em) (\d+)d(\d+)/;
/** Kidōs cujo texto no livro está misturado com outros: não dá para calcular. */
const QUEBRADOS = new Set(["bakudou/11", "bakudou/99"]);
const RE_CUSTO = /Custo: (\d+) PR/;

/** Lê o dano de um Hadō no texto do livro e soma o que a ficha acrescenta. Devolve null se o Hadō não causa dano em dados. */
export function danoDoHado(f: Ficha, c: Calculo, k: { tipo?: string; n: number; texto: string; meta?: string }): DanoHado | null {
  const bakudou = k.tipo === "bakudou";
  if (QUEBRADOS.has(`${k.tipo}/${k.n}`)) return null;
  const base = RE_DANO.exec(k.texto) ?? (k.tipo === "hadou" && k.n === 96 ? /(\d+)d(\d+)/.exec(k.texto) : null);
  if (!base) return null;
  const rf = RE_REFORCO.exec(k.texto);
  const custo = Number(RE_CUSTO.exec(k.meta ?? "")?.[1] ?? 0);
  const origens: string[] = [];
  let fixo = 0;
  const soma = (v: number, nome: string) => { if (v > 0) { fixo += v; origens.push(`${nome} +${v}`); } };
  if (!bakudou) {
    soma(c.danoHado, "Maestria de Hadō");
    if (f.talentos.includes("hadou-poderoso")) soma(c.atr.men, "Hadō Poderoso (Mente)");
    if (f.estado.liberado === "shikai") soma(c.prof, "Shikai");
    if (f.estado.liberado === "bankai" || f.estado.liberado === "bankai2") soma(2 * c.prof, "Bankai");
  }
  const bf = c.forma;
  const alvo = bakudou ? "bakudo" : "hado";
  soma(bf?.dano[alvo] ?? 0, "Forma");
  const acerto = !bakudou && /Jogada: Acerto/.test(k.meta ?? "");
  return {
    n: Number(base[1]),
    lados: Number(base[2]),
    custo,
    reforco: rf ? { cada: Number(rf[1]), n: Number(rf[2]), lados: Number(rf[3]) } : undefined,
    fixo,
    origens,
    dadosMascara: c.dadosTecnicaMascara,
    dadosForma: bf?.dados[alvo] ?? [],
    critico19: acerto && f.classe === "kidoshu" && f.talentos.includes("alinhamento"),
    ignoraRd: Math.max(bf?.ignoraRd[alvo] ?? 0, f.classe === "kidoshu" ? (f.talentos.includes("perfuracao-arcana") || (!bakudou && f.talentos.includes("perfuracao-elemental")) ? 5 : 0) : 0),
    somaReiatsu: k.n === 96,
  };
}

/** Expressão de dados pronta para rolar, com `passos` reforços de PR. */
export function expressaoHado(d: DanoHado, passos: number, prMax: number): string {
  const partes = [`${d.n + d.dadosMascara}d${d.lados}`];
  if (d.reforco && passos > 0) partes.push(`${d.reforco.n * passos}d${d.reforco.lados}`);
  partes.push(...d.dadosForma);
  const fixo = d.fixo + (d.somaReiatsu ? prMax : 0);
  if (fixo > 0) partes.push(String(fixo));
  return partes.join("+");
}

const media = (n: number, l: number) => (n * (l + 1)) / 2;

export function mediaHado(d: DanoHado, passos: number, prMax: number): number {
  const forma = d.dadosForma.reduce((s, x) => { const m = /^(\d+)d(\d+)$/.exec(x); return m ? s + media(Number(m[1]), Number(m[2])) : s; }, 0);
  return forma + media(d.n + d.dadosMascara, d.lados) + (d.reforco ? media(d.reforco.n * passos, d.reforco.lados) : 0) + d.fixo + (d.somaReiatsu ? prMax : 0);
}

/** Quantos reforços cabem no PR da ficha (no máximo 8). */
export function passosMaximos(d: DanoHado, pr: number): number {
  if (!d.reforco) return 0;
  return Math.max(0, Math.min(8, Math.floor((pr - d.custo) / d.reforco.cada)));
}
