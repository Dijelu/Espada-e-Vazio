/* Efeitos das transformações: o jogador monta a forma com peças que viram bônus automáticos enquanto ela está ativa. */
import { contaSimples } from "./liberacoes";
import type { Atr, Ficha, FormaLib } from "./ficha";

export type Alvo = "golpe" | "disparo" | "hado" | "bakudo" | "tecnica" | "reishi" | "cero" | "inato" | "schrift";

export const ALVOS: { id: Alvo; nome: string }[] = [
  { id: "golpe", nome: "Golpes corpo a corpo" },
  { id: "disparo", nome: "Ataques à distância" },
  { id: "hado", nome: "Hadō" },
  { id: "bakudo", nome: "Bakudō" },
  { id: "tecnica", nome: "Técnicas da forma" },
  { id: "reishi", nome: "Técnicas de Reishi" },
  { id: "cero", nome: "Cero" },
  { id: "inato", nome: "Poder Inato" },
  { id: "schrift", nome: "Schrift" },
];
/** "Ataques armados, podendo ser kidōs": golpes, disparos e Hadō. */
export const ARMADOS: Alvo[] = ["golpe", "disparo", "hado"];

export type Num = number | string;
export type Quando = "liberar" | "inicioTurno" | "acerto" | "critico" | "abate" | "atingido" | "errou";

export const QUANDO_NOME: Record<Quando, string> = {
  liberar: "Ao liberar",
  inicioTurno: "No início do seu turno",
  acerto: "Quando você acerta um ataque",
  critico: "Quando você acerta um crítico",
  abate: "Quando você derruba um inimigo",
  atingido: "Quando você é atingido",
  errou: "Quando um ataque contra você erra",
};

export interface Faz {
  curaPv?: Num;
  pvTemp?: Num;
  prTemp?: Num;
  /** recupera PR */
  pr?: Num;
  /** dano rolado (em área ou no atacante) */
  dano?: { expr: string; tipo: string; area?: string };
  /** texto livre do que acontece (o Mestre resolve) */
  texto?: string;
}

export type Efeito =
  | { k: "atr"; atr: Atr; v: Num }
  | { k: "cr"; v: Num }
  | { k: "acerto"; em: Alvo[]; v: Num }
  | { k: "dano"; em: Alvo[]; v: Num }
  | { k: "dados"; em: Alvo[]; n: Num; d: number; tipo?: string }
  | { k: "cd"; v: Num }
  | { k: "ignoraRd"; em: Alvo[]; v: Num }
  | { k: "alcance"; em: Alvo[]; m: Num }
  | { k: "rd"; tipo: "fis" | "eso" | "ambos"; v: Num }
  | { k: "resist"; dano: string; grau: "resist" | "imune" | "vulner" }
  | { k: "desloc"; modo: "chao" | "voo"; v: Num }
  | { k: "acoes"; tipo: "ataque" | "bonus" | "reacao" }
  | { k: "vant"; em: string }
  | { k: "gatilho"; quando: Quando; limite?: "turno" | "rodada" | "cena"; faz: Faz; rotulo?: string }
  | { k: "custo"; pr: Num }
  | { k: "fim"; esgotado: "curto" | "longo" }
  | { k: "duracao"; turnos: Num }
  | { k: "texto"; t: string };

/** Uma peça escolhida no construtor: um preset (com parâmetros) ou algo criado à mão. */
export interface InstEfeito {
  id: string;
  preset?: string;
  nome: string;
  texto?: string;
  efeitos: Efeito[];
  /** custo fixo em pontos (presets que não seguem a conta) */
  pp?: number;
  /** confirmado: não pode mais ser mudado nem tirado */
  confirmado?: boolean;
}

export interface CtxForma {
  n: number;
  prof: number;
  atr: Record<Atr, number>;
}

export const ATR_NOME: Record<Atr, string> = { for: "Força", des: "Destreza", con: "Constituição", men: "Mente", esp: "Espírito" };

const FICHAS = /^[0-9+\-*/(). ]+$/;
const ATRIBUTOS: Atr[] = ["for", "des", "con", "men", "esp"];

/** Troca [NIV] [PROF] [FOR]… pelos números e calcula. Qualquer coisa fora disso vira 0 (sem eval). */
export function valor(x: Num | undefined, ctx: CtxForma): number {
  if (typeof x === "number") return Number.isFinite(x) ? x : 0;
  if (typeof x !== "string") return 0;
  const v: Record<string, number> = { NIV: ctx.n, PROF: ctx.prof, FOR: ctx.atr.for, DES: ctx.atr.des, CON: ctx.atr.con, MEN: ctx.atr.men, ESP: ctx.atr.esp };
  const t = x.replace(/\[([A-Z]{3,4})\]/g, (_, k: string) => String(v[k] ?? 0)).trim();
  if (!t || !FICHAS.test(t)) return 0;
  try {
    const r = contaSimples(t);
    return Number.isFinite(r) ? Math.floor(r) : 0;
  } catch {
    return 0;
  }
}

/* ---------- quais formas estão ativas ---------- */

type Fonte = "forma" | "shikai" | "resurreccion";

/** As peças que valem agora: as da forma ativa e as que ela herda. */
export function pecasAtivas(f: Ficha): { inst: InstEfeito; fonte: Fonte }[] {
  const lib = f.estado.liberado;
  const de = (forma: FormaLib | undefined, fonte: Fonte) => (forma?.efeitos ?? []).map((inst) => ({ inst, fonte }));
  const fm = f.formas ?? {};
  if (lib === "shikai") return de(fm.shikai, "forma");
  if (lib === "bankai") return [...de(fm.bankai, "forma"), ...(fm.bankai?.herdaShikai ? de(fm.shikai, "shikai") : [])];
  if (lib === "bankai2") return de(fm.bankai2, "forma");
  if (lib === "resurreccion") return de(fm.resurreccion, "forma");
  if (lib === "terror") return [...de(fm.resurreccion, "resurreccion"), ...de(fm.segunda, "forma")];
  if (lib === "vollstandig") return de(fm.vollstandig, "forma");
  return [];
}

/* ---------- soma dos efeitos ---------- */

export interface SomaForma {
  atr: Record<Atr, number>;
  cr: number;
  rdFis: number;
  rdEso: number;
  desloc: number;
  voo: number;
  ataques: number;
  reacoes: number;
  bonus: number;
  cd: number;
  acerto: Record<Alvo, number>;
  dano: Record<Alvo, number>;
  dados: Record<Alvo, string[]>;
  ignoraRd: Record<Alvo, number>;
  alcance: Record<Alvo, number>;
  vant: string[];
  resist: { dano: string; grau: string }[];
  gatilhos: { rotulo: string; quando: Quando; limite?: string; faz: Faz; peca: string }[];
  manutencao: number;
  fim?: "curto" | "longo";
  duracao?: number;
  textos: { nome: string; t: string }[];
  /** linhas do resumo: o que mudou e de onde veio */
  linhas: { rotulo: string; valor: string; fonte: string }[];
}

const porAlvo = <T,>(v: T): Record<Alvo, T> => Object.fromEntries(ALVOS.map((a) => [a.id, Array.isArray(v) ? [...v] : v])) as Record<Alvo, T>;
const sinal = (v: number) => (v >= 0 ? `+${v}` : String(v));
const nomeAlvos = (em: Alvo[]) => {
  const k = new Set(em);
  if (ARMADOS.every((a) => k.has(a)) && k.size === ARMADOS.length) return "ataques armados e Hadō";
  return em.map((a) => ALVOS.find((x) => x.id === a)?.nome ?? a).join(", ");
};

export function somarForma(f: Ficha, ctx: CtxForma): SomaForma | null {
  const pecas = pecasAtivas(f);
  if (pecas.length === 0) return null;
  const s: SomaForma = {
    atr: { for: 0, des: 0, con: 0, men: 0, esp: 0 }, cr: 0, rdFis: 0, rdEso: 0, desloc: 0, voo: 0, ataques: 0, reacoes: 0, bonus: 0, cd: 0,
    acerto: porAlvo(0), dano: porAlvo(0), dados: porAlvo<string[]>([]), ignoraRd: porAlvo(0), alcance: porAlvo(0),
    vant: [], resist: [], gatilhos: [], manutencao: 0, textos: [], linhas: [],
  };
  const linha = (rotulo: string, v: string, fonte: string) => s.linhas.push({ rotulo, valor: v, fonte });
  for (const { inst, fonte } of pecas) {
    const nome = fonte === "forma" ? inst.nome : `${inst.nome} (herdada)`;
    for (const e of inst.efeitos) {
      switch (e.k) {
        case "atr": { const v = valor(e.v, ctx); s.atr[e.atr] += v; linha(ATR_NOME[e.atr], sinal(v), nome); break; }
        case "cr": { const v = valor(e.v, ctx); s.cr += v; linha("CR", sinal(v), nome); break; }
        case "acerto": { const v = valor(e.v, ctx); e.em.forEach((a) => (s.acerto[a] += v)); linha(`Acerto: ${nomeAlvos(e.em)}`, sinal(v), nome); break; }
        case "dano": { const v = valor(e.v, ctx); e.em.forEach((a) => (s.dano[a] += v)); linha(`Dano: ${nomeAlvos(e.em)}`, sinal(v), nome); break; }
        case "dados": {
          const n = valor(e.n, ctx);
          if (n > 0) { e.em.forEach((a) => s.dados[a].push(`${n}d${e.d}`)); linha(`Dano: ${nomeAlvos(e.em)}`, `+${n}d${e.d}${e.tipo ? ` ${e.tipo}` : ""}`, nome); }
          break;
        }
        case "cd": { const v = valor(e.v, ctx); s.cd += v; linha("CD dos Kidōs e técnicas", sinal(v), nome); break; }
        case "ignoraRd": { const v = valor(e.v, ctx); e.em.forEach((a) => (s.ignoraRd[a] = Math.max(s.ignoraRd[a], v))); linha(`Ignora RD: ${nomeAlvos(e.em)}`, String(v), nome); break; }
        case "alcance": { const v = valor(e.m, ctx); e.em.forEach((a) => (s.alcance[a] += v)); linha(`Alcance: ${nomeAlvos(e.em)}`, `+${v} m`, nome); break; }
        case "rd": { const v = valor(e.v, ctx); if (e.tipo !== "eso") s.rdFis += v; if (e.tipo !== "fis") s.rdEso += v; linha(`Redução de dano ${e.tipo === "fis" ? "física" : e.tipo === "eso" ? "esotérica" : ""}`.trim(), String(v), nome); break; }
        case "resist": { s.resist.push({ dano: e.dano, grau: e.grau }); linha(`${e.grau === "imune" ? "Imune a" : e.grau === "vulner" ? "Vulnerável a" : "Resistente a"} ${e.dano}`, "", nome); break; }
        case "desloc": { const v = valor(e.v, ctx); if (e.modo === "voo") s.voo += v; else s.desloc += v; linha(e.modo === "voo" ? "Voo" : "Deslocamento", `${sinal(v)} m`, nome); break; }
        case "acoes": { if (e.tipo === "ataque") s.ataques += 1; else if (e.tipo === "reacao") s.reacoes += 1; else s.bonus += 1; linha(e.tipo === "ataque" ? "Ataques por ação" : e.tipo === "reacao" ? "Reações" : "Ações bônus", "+1", nome); break; }
        case "vant": { s.vant.push(e.em); linha("Vantagem", e.em, nome); break; }
        case "gatilho": { s.gatilhos.push({ rotulo: e.rotulo || nome, quando: e.quando, limite: e.limite, faz: e.faz, peca: nome }); break; }
        case "custo": { const v = valor(e.pr, ctx); s.manutencao += v; linha("Manutenção", `${v} PR por turno`, nome); break; }
        case "fim": { s.fim = e.esgotado; linha("Ao terminar", `Esgotado até o descanso ${e.esgotado === "curto" ? "curto" : "longo"}`, nome); break; }
        case "duracao": { s.duracao = valor(e.turnos, ctx); linha("Duração", `${s.duracao} turnos`, nome); break; }
        case "texto": { s.textos.push({ nome, t: e.t }); break; }
      }
    }
  }
  return s;
}

/** Bônus de uma modalidade de ataque somados com o que a forma dá (para botões de dano). */
export function bonusDoAlvo(forma: SomaForma | null | undefined, a: Alvo) {
  return {
    acerto: forma?.acerto[a] ?? 0,
    fixo: forma?.dano[a] ?? 0,
    dados: forma?.dados[a] ?? [],
    ignoraRd: forma?.ignoraRd[a] ?? 0,
  };
}

/* ---------- preço e orçamento (Pontos de Poder) ---------- */

/** Pontos de Poder da forma no nível atual. Os números são de mesa e podem ser calibrados no simulador. */
export function orcamentoBase(tipo: FormaLib["tipo"], n: number, extra: { plena?: boolean; origem?: string } = {}): number {
  const piso = (v: number) => Math.max(0, Math.floor(v));
  switch (tipo) {
    case "shikai": return Math.min(5, 2 + piso((n - 3) / 4));
    case "bankai": return 6 + piso((n - 10) / 2) + (extra.plena ? 2 : 0);
    case "bankai2": return 6 + piso((n - 10) / 2) + 4;
    case "resurreccion": return 5 + piso((n - 10) / 2) + (extra.origem === "adjuchas" ? 1 : extra.origem === "vasto-lorde" ? 2 : 0);
    case "segunda": return 4;
    case "vollstandig": return 0;
  }
}

const teto = (v: number, max: number) => Math.min(v, max);

/** Preço em PP de um único efeito, no nível atual. Cada alvo a mais soma +50%. */
export function custoEfeito(e: Efeito, ctx: CtxForma): number {
  // golpes, disparos e Hadō contam como um grupo só ("ataques armados, podendo ser kidōs"); cada outro alvo soma +50%
  const mais = (em: Alvo[], base: number) => Math.ceil(base * (1 + 0.5 * Math.max(0, new Set(em.map((x) => (ARMADOS.includes(x) ? "armado" : x))).size - 1)));
  switch (e.k) {
    case "atr": return Math.max(0, valor(e.v, ctx));
    case "cr": return Math.ceil((2 * Math.max(0, valor(e.v, ctx))) / 3);
    case "acerto": return mais(e.em, Math.ceil((2 * Math.max(0, valor(e.v, ctx))) / 3));
    case "dano": return mais(e.em, Math.ceil(Math.max(0, valor(e.v, ctx)) / 2.5));
    case "dados": { const n = valor(e.n, ctx); return mais(e.em, Math.ceil((2 * n * e.d) / 8)); }
    case "cd": return Math.max(0, valor(e.v, ctx));
    case "ignoraRd": return mais(e.em, Math.ceil(valor(e.v, ctx) / 5));
    case "alcance": return mais(e.em, Math.ceil(valor(e.m, ctx) / 6));
    case "rd": { const b = Math.ceil(valor(e.v, ctx) / 2.5); return e.tipo === "fis" ? Math.ceil(b * 0.6) : b; }
    case "resist": return e.grau === "imune" ? 5 : e.grau === "vulner" ? -2 : 2;
    case "desloc": return Math.ceil(valor(e.v, ctx) / 3);
    case "acoes": return e.tipo === "ataque" ? 4 : e.tipo === "bonus" ? 3 : 2;
    case "vant": return 1;
    case "gatilho": {
      const f = e.faz;
      const x = Math.max(valor(f.curaPv, ctx), valor(f.pvTemp, ctx), valor(f.prTemp, ctx), valor(f.pr, ctx));
      let base = 1 + Math.floor(x / Math.max(1, ctx.prof * 4));
      if (f.dano) { try { base += 1 + Math.floor(mediaRapida(f.dano.expr, ctx) / (ctx.prof * 5)); } catch { base += 1; } }
      if (e.quando === "inicioTurno") base += 1;
      return e.limite ? Math.max(1, Math.ceil(base * 0.7)) : base;
    }
    case "custo": return -Math.min(3, Math.ceil(valor(e.pr, ctx) / 2));
    case "fim": return e.esgotado === "longo" ? -3 : -2;
    case "duracao": return valor(e.turnos, ctx) <= ctx.prof ? -2 : 0;
    case "texto": return 1;
  }
}

function mediaRapida(expr: string, ctx: CtxForma): number {
  const t = expr.replace(/\[([A-Z]{3,4})\]/g, (_, k: string) => String(valor(`[${k}]`, ctx)));
  let tot = 0;
  for (const m of t.matchAll(/(\d+)d(\d+)/g)) tot += (Number(m[1]) * (Number(m[2]) + 1)) / 2;
  const resto = t.replace(/\d+d\d+/g, "0");
  if (/^[0-9+\-*/(). ]+$/.test(resto)) tot += contaSimples(resto);
  return tot;
}

export function custoPeca(p: InstEfeito, ctx: CtxForma): number {
  if (typeof p.pp === "number") return p.pp;
  return p.efeitos.reduce((s, e) => s + custoEfeito(e, ctx), 0);
}

export interface Orcamento {
  total: number;
  gasto: number;
  /** pontos devolvidos por pontos fracos (no máximo um terço do total) */
  devolvido: number;
  livre: number;
  avisos: string[];
}

/** Soma do que a forma gastou contra o orçamento. Peças herdadas da Shikai custam metade. */
export function orcamentoDaForma(f: Ficha, tipo: FormaLib["tipo"], forma: FormaLib | undefined, ctx: CtxForma): Orcamento {
  const total = orcamentoBase(tipo, ctx.n, { plena: tipo === "bankai" && f.treinos.caminhoBankai === "plena", origem: f.origem });
  let gasto = 0;
  let devolucao = 0;
  const avisos: string[] = [];
  const somar = (p: InstEfeito, fator: number) => {
    const c = custoPeca(p, ctx) * fator;
    if (c >= 0) gasto += c; else devolucao += -c;
  };
  for (const p of forma?.efeitos ?? []) somar(p, 1);
  if (tipo === "bankai" && forma?.herdaShikai) for (const p of f.formas.shikai?.efeitos ?? []) somar(p, 0.5);
  const devolvido = Math.min(devolucao, Math.floor(total / 3));
  if (devolucao > devolvido) avisos.push(`Os pontos fracos devolvem no máximo ${devolvido} PP (um terço do total).`);
  const liquido = Math.ceil(gasto - devolvido);
  if (liquido > total) avisos.push(`Passou ${liquido - total} PP do que a forma permite no nível ${ctx.n}.`);
  return { total, gasto: liquido, devolvido, livre: total - liquido, avisos };
}

/** Tetos por efeito (não bloqueiam; viram aviso para o Mestre aprovar). */
export function avisosDeTeto(p: InstEfeito, ctx: CtxForma): string[] {
  const out: string[] = [];
  for (const e of p.efeitos) {
    if (e.k === "atr" && valor(e.v, ctx) > 4) out.push(`${ATR_NOME[e.atr]} +${valor(e.v, ctx)}: passa do máximo de +4 por atributo.`);
    if (e.k === "cr" && valor(e.v, ctx) > 3) out.push("CR acima de +3.");
    if (e.k === "acerto" && valor(e.v, ctx) > 3) out.push("Acerto acima de +3.");
    if (e.k === "dano" && valor(e.v, ctx) > 2 * ctx.prof) out.push(`Dano fixo acima de ${2 * ctx.prof}.`);
    if (e.k === "dados" && valor(e.n, ctx) > Math.max(1, Math.floor(ctx.prof / 2))) out.push(`Mais de ${Math.max(1, Math.floor(ctx.prof / 2))} dado(s) extra(s) por alvo para este nível.`);
    if (e.k === "rd" && valor(e.v, ctx) > 10) out.push("Redução de dano acima de 10.");
    if (e.k === "desloc" && valor(e.v, ctx) > 9) out.push("Deslocamento acima de +9 m.");
  }
  return out;
}

export const totalAtr = (s: SomaForma | null | undefined) => (s ? ATRIBUTOS.reduce((t, a) => t + s.atr[a], 0) : 0);

/** Limpa o que veio de um arquivo ou de uma ficha antiga: tipos desconhecidos saem e valores soltos viram 0. */
export function normalizarEfeitos(raw: unknown): InstEfeito[] {
  if (!Array.isArray(raw)) return [];
  const ok = new Set(["atr", "cr", "acerto", "dano", "dados", "cd", "ignoraRd", "alcance", "rd", "resist", "desloc", "acoes", "vant", "gatilho", "custo", "fim", "duracao", "texto"]);
  const alvos = new Set(ALVOS.map((a) => a.id));
  const num = (v: unknown): Num => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && /^[\[\]A-Z0-9+\-*/(). ]{1,40}$/.test(v) ? v : 0);
  const lista = (v: unknown): Alvo[] => (Array.isArray(v) ? (v.filter((x) => typeof x === "string" && alvos.has(x as Alvo)) as Alvo[]) : []);
  return raw.slice(0, 24).flatMap((p): InstEfeito[] => {
    if (!p || typeof p !== "object") return [];
    const o = p as Partial<InstEfeito>;
    const efeitos = (Array.isArray(o.efeitos) ? o.efeitos : []).slice(0, 8).flatMap((e): Efeito[] => {
      if (!e || typeof e !== "object" || !ok.has((e as { k: string }).k)) return [];
      const x = e as Record<string, unknown>;
      const k = x.k as Efeito["k"];
      const atr = ATRIBUTOS.includes(x.atr as Atr) ? (x.atr as Atr) : "for";
      switch (k) {
        case "atr": return [{ k, atr, v: num(x.v) }];
        case "cr": case "cd": return [{ k, v: num(x.v) } as Efeito];
        case "acerto": case "dano": case "ignoraRd": return [{ k, em: lista(x.em), v: num(x.v) } as Efeito];
        case "alcance": return [{ k, em: lista(x.em), m: num(x.m) }];
        case "dados": return [{ k, em: lista(x.em), n: num(x.n), d: [4, 6, 8, 10, 12].includes(Number(x.d)) ? Number(x.d) : 8, tipo: typeof x.tipo === "string" ? x.tipo.slice(0, 30) : undefined }];
        case "rd": return [{ k, tipo: x.tipo === "fis" || x.tipo === "eso" ? x.tipo : "ambos", v: num(x.v) }];
        case "resist": return [{ k, dano: String(x.dano ?? "").slice(0, 30), grau: x.grau === "imune" || x.grau === "vulner" ? x.grau : "resist" }];
        case "desloc": return [{ k, modo: x.modo === "voo" ? "voo" : "chao", v: num(x.v) }];
        case "acoes": return [{ k, tipo: x.tipo === "bonus" || x.tipo === "reacao" ? x.tipo : "ataque" }];
        case "vant": return [{ k, em: String(x.em ?? "").slice(0, 60) }];
        case "custo": return [{ k, pr: num(x.pr) }];
        case "fim": return [{ k, esgotado: x.esgotado === "longo" ? "longo" : "curto" }];
        case "duracao": return [{ k, turnos: num(x.turnos) }];
        case "texto": return [{ k, t: String(x.t ?? "").slice(0, 400) }];
        case "gatilho": {
          const q = x.quando as Quando;
          if (!(q in QUANDO_NOME)) return [];
          const z = (x.faz && typeof x.faz === "object" ? x.faz : {}) as Record<string, unknown>;
          const faz: Faz = {};
          if (z.curaPv !== undefined) faz.curaPv = num(z.curaPv);
          if (z.pvTemp !== undefined) faz.pvTemp = num(z.pvTemp);
          if (z.prTemp !== undefined) faz.prTemp = num(z.prTemp);
          if (z.pr !== undefined) faz.pr = num(z.pr);
          if (typeof z.texto === "string") faz.texto = z.texto.slice(0, 300);
          const d = z.dano as { expr?: unknown; tipo?: unknown; area?: unknown } | undefined;
          if (d && typeof d.expr === "string" && /^[\[\]A-Z0-9d+\-*/(). ]{1,40}$/.test(d.expr)) faz.dano = { expr: d.expr, tipo: String(d.tipo ?? "").slice(0, 30), area: typeof d.area === "string" ? d.area.slice(0, 40) : undefined };
          return [{ k, quando: q, limite: x.limite === "turno" || x.limite === "rodada" || x.limite === "cena" ? x.limite : undefined, faz, rotulo: typeof x.rotulo === "string" ? x.rotulo.slice(0, 80) : undefined }];
        }
      }
      return [];
    });
    return [{ id: String(o.id ?? Math.random().toString(36).slice(2, 9)).slice(0, 40), preset: typeof o.preset === "string" ? o.preset : undefined, nome: String(o.nome ?? "Efeito").slice(0, 80), texto: typeof o.texto === "string" ? o.texto.slice(0, 300) : undefined, efeitos, pp: typeof o.pp === "number" ? o.pp : undefined, confirmado: o.confirmado === true }];
  });
}
