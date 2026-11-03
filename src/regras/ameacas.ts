import { formaNpc, TIPOS_MODELO_NPC, type RefModeloNpc } from "./forma-npc";
/* Criação de ameaças e NPCs, seguindo o capítulo 14 do livro. */
import { FATOR_K, escalarDados, fatorSuporte } from "./simulador";

export type Categoria = "hollow" | "shinigami" | "quincy";
export type Formato = "solo" | "raid";
export type Dificuldade = "facil" | "medio" | "dificil";
/** comum: ameaça do livro; pareado: rival de um jogador (fator k); suporte: par do Curandeiro; boss: chefe de grupo */
export type Modo = "comum" | "pareado" | "suporte" | "boss";
export type ChaveAtr = "for" | "des" | "con" | "men" | "esp";

export const ATRS: { id: ChaveAtr; nome: string }[] = [
  { id: "for", nome: "Força" },
  { id: "des", nome: "Destreza" },
  { id: "con", nome: "Constituição" },
  { id: "men", nome: "Mente" },
  { id: "esp", nome: "Espírito" },
];

export const CATEGORIAS: { id: Categoria; nome: string }[] = [
  { id: "hollow", nome: "Hollow" },
  { id: "shinigami", nome: "Shinigami" },
  { id: "quincy", nome: "Quincy" },
];

/** PV base, PR base e pontos de atributo por ND (índice = ND − 1). */
const TABELA: Record<Categoria, { pv: (n: number) => number; pr: (n: number) => number; atr: (n: number) => number }> = {
  hollow: { pv: (n) => 30 * n, pr: (n) => 10 * n, atr: (n) => 9 + n },
  shinigami: { pv: (n) => 25 * n, pr: (n) => 20 * n, atr: (n) => 11 + n },
  quincy: { pv: (n) => 20 * n, pr: (n) => 25 * n, atr: (n) => 10 + n },
};

export const GRAUS: Record<Categoria, { nome: string; cr: number; atr: number }[]> = {
  hollow: [
    { nome: "Hollow Comum", cr: 0, atr: 0 },
    { nome: "Gillian", cr: 2, atr: 3 },
    { nome: "Adjuchas", cr: 3, atr: 5 },
    { nome: "Vasto Lorde", cr: 4, atr: 7 },
    { nome: "Arrancar", cr: 5, atr: 9 },
  ],
  shinigami: [
    { nome: "Shinigami", cr: 0, atr: 0 },
    { nome: "Tenente", cr: 1, atr: 3 },
    { nome: "Capitão", cr: 2, atr: 5 },
    { nome: "Capitão Comandante", cr: 3, atr: 7 },
  ],
  quincy: [
    { nome: "Soldat", cr: 0, atr: 0 },
    { nome: "Oficial", cr: 1, atr: 3 },
    { nome: "Sternritter", cr: 2, atr: 5 },
    { nome: "Schutzstaffel", cr: 4, atr: 7 },
  ],
};

const CR_BASE: Record<Categoria, Record<Dificuldade, number>> = {
  hollow: { facil: 8, medio: 10, dificil: 12 },
  shinigami: { facil: 10, medio: 12, dificil: 14 },
  quincy: { facil: 9, medio: 11, dificil: 13 },
};

export const proficienciaDoND = (nd: number) => (nd <= 4 ? 2 : nd <= 8 ? 3 : nd <= 12 ? 4 : nd <= 16 ? 5 : 6);
const atrRaid = (nd: number) => (nd <= 5 ? 5 : nd <= 10 ? 7 : nd <= 15 ? 9 : 11);

export interface AtaqueAmeaca { nome: string; atr: ChaveAtr; dados: string; tipo: string; custo?: number; crit?: number }
/** Forma liberada: Bankai (Shinigami), Resurrección (Hollow), Vollständig (Quincy). */
export interface LiberacaoAmeaca {
  /** a ameaça tem uma forma liberada */
  existe: boolean;
  nome: string;
  bonusCr: number;
  bonusAtr: Record<ChaveAtr, number>;
  /** % dos PV máximos recuperados ao liberar */
  cura: number;
  /** dano em área ao liberar: mult × atributo (0 = não tem) */
  explosao: { mult: number; atr: ChaveAtr; tipo: string };
  /** ataques e técnicas daqui substituem os normais (em vez de somar) */
  trocar: boolean;
  ataques: AtaqueAmeaca[];
  tecnicas: TecnicaAmeaca[];
  texto: string;
  /** modelo pronto de forma (Bankai, Resurrección…) que dá as peças e as habilidades; sem ele, só valem os campos acima */
  modelo?: RefModeloNpc;
}

export const NOME_LIBERACAO: Record<Categoria, string> = { shinigami: "Bankai", hollow: "Resurrección", quincy: "Vollständig" };

export function liberacaoVazia(categoria: Categoria = "shinigami"): LiberacaoAmeaca {
  return { existe: false, nome: NOME_LIBERACAO[categoria], bonusCr: 0, bonusAtr: { for: 0, des: 0, con: 0, men: 0, esp: 0 }, cura: 0, explosao: { mult: 0, atr: "esp", tipo: "Psíquico" }, trocar: false, ataques: [], tecnicas: [], texto: "" };
}

/** Ponto de partida de mesa: CR +1, +2 no atributo mais alto; Shinigami com explosão de 5× Espírito, Hollow que cura metade dos PV. */
export function liberacaoPadrao(a: Pick<Ameaca, "categoria" | "formato" | "atr">): LiberacaoAmeaca {
  const l = liberacaoVazia(a.categoria);
  const maior = ATRS.map((x) => x.id).sort((x, y) => a.atr[y] - a.atr[x])[0];
  l.existe = true;
  l.bonusCr = 1;
  l.bonusAtr[maior] = 2;
  if (a.categoria === "shinigami") l.explosao = { mult: a.formato === "raid" ? 10 : 5, atr: "esp", tipo: "Psíquico" };
  if (a.categoria === "hollow") l.cura = 50;
  return l;
}

export interface ZanpakutouAmeaca { nome: string; shikai: string; bankai: string }
export interface TecnicaAmeaca { nome: string; dados: string; custo: number; atr: ChaveAtr; texto: string }

export interface HabilidadeAmeaca { titulo: string; texto: string }

export interface Ameaca {
  categoria: Categoria;
  formato: Formato;
  nd: number;
  grau: number;
  dificuldade: Dificuldade;
  atr: Record<ChaveAtr, number>;
  modo: Modo;
  /** só no modo boss */
  jogadores: number;
  /** PV extra em %, para o 5v5 e ajustes de mesa */
  pvExtra: number;
  ataques: AtaqueAmeaca[];
  tecnicas: TecnicaAmeaca[];
  caracteristicas: string;
  /** subtítulo: cargo, divisão, apelido */
  titulo: string;
  zanpakutou: ZanpakutouAmeaca;
  liberacao: LiberacaoAmeaca;
  /** Reação, Ação Suprema, Zanpakutō, Bankai, Kidō… (texto livre) */
  habilidades: HabilidadeAmeaca[];
}

/** Modelo de ameaça pronta do livro (capítulo 14). */
export interface ModeloAmeaca {
  id: string;
  nome: string;
  categoria: Categoria;
  grau: number;
  formato: Formato;
  nd: number;
  estilo: string;
  caracteristicas: string;
  ataques: AtaqueAmeaca[];
  tecnicas: TecnicaAmeaca[];
  habilidades?: HabilidadeAmeaca[];
}

export function ameacaDoModelo(m: ModeloAmeaca, nd = m.nd): Ameaca {
  const base: Ameaca = { ...ameacaPadrao(m.categoria, nd), formato: m.formato, grau: m.grau };
  const pontos = pontosDeAtributo({ categoria: m.categoria, formato: m.formato, nd, grau: m.grau });
  const atr = distribuir(pontos, m.estilo);
  const COM_FORMA = /^(capitao|arrancar|rukia|ichigo|quincy-(oficial|sternritter|schutzstaffel))/;
  const liberacao = COM_FORMA.test(m.id) ? liberacaoPadrao({ categoria: m.categoria, formato: m.formato, atr }) : liberacaoVazia(m.categoria);
  return normalizarAmeaca({ ...base, atr, liberacao, ataques: m.ataques, tecnicas: m.tecnicas, caracteristicas: m.caracteristicas, habilidades: m.habilidades ?? [] });
}

export function ameacaPadrao(categoria: Categoria = "shinigami", nd = 1): Ameaca {
  const pontos = pontosDeAtributo({ categoria, formato: "solo", nd, grau: 0 });
  const atr = distribuir(pontos, "equilibrado");
  return {
    categoria, formato: "solo", nd, grau: 0, dificuldade: "medio", atr, modo: "comum", jogadores: 4, pvExtra: 0,
    ataques: [{ nome: categoria === "hollow" ? "Garras" : categoria === "quincy" ? "Lâmina de Reishi" : "Katana", atr: categoria === "shinigami" ? "des" : "for", dados: "1d8", tipo: "Cortante" }],
    tecnicas: [], caracteristicas: "", titulo: "", zanpakutou: { nome: "", shikai: "", bankai: "" }, liberacao: liberacaoVazia(categoria), habilidades: [],
  };
}

export const ESTILOS: { id: string; nome: string }[] = [
  { id: "equilibrado", nome: "Equilibrado" },
  { id: "fisico", nome: "Lutador físico" },
  { id: "kido", nome: "Especialista em Kidō" },
  { id: "veloz", nome: "Veloz" },
];

/** Distribui os pontos entre os cinco atributos conforme o estilo. */
export function distribuir(pontos: number, estilo: string): Record<ChaveAtr, number> {
  const peso: Record<string, Record<ChaveAtr, number>> = {
    equilibrado: { for: 1, des: 1, con: 1, men: 1, esp: 1 },
    fisico: { for: 3, des: 2, con: 3, men: 0.5, esp: 1 },
    kido: { for: 0.5, des: 1, con: 1, men: 3, esp: 3 },
    veloz: { for: 1.5, des: 3, con: 1.5, men: 1, esp: 1.5 },
  };
  const p = peso[estilo] ?? peso.equilibrado;
  const soma = ATRS.reduce((s, a) => s + p[a.id], 0);
  const r = { for: 0, des: 0, con: 0, men: 0, esp: 0 } as Record<ChaveAtr, number>;
  let usados = 0;
  ATRS.forEach((a) => { r[a.id] = Math.floor((pontos * p[a.id]) / soma); usados += r[a.id]; });
  const ordem = [...ATRS].sort((a, b) => p[b.id] - p[a.id]);
  for (let i = 0; usados < pontos; i++, usados++) r[ordem[i % ordem.length].id]++;
  return r;
}

export function pontosDeAtributo(a: Pick<Ameaca, "categoria" | "formato" | "nd" | "grau">): number {
  const nd = Math.min(20, Math.max(1, a.nd));
  return TABELA[a.categoria].atr(nd) + (GRAUS[a.categoria][a.grau]?.atr ?? 0) + (a.formato === "raid" ? atrRaid(nd) : 0);
}

export interface AmeacaCalculada {
  nd: number;
  prof: number;
  pontos: number;
  usados: number;
  pv: number;
  pr: number;
  cr: number;
  k: number;
  hierro: boolean;
  grauNome: string;
  ataques: { nome: string; acerto: number; dano: string; media: number; tipo: string; custo: number; crit: number }[];
  tecnicas: { nome: string; dados: string; cd: number; custo: number; texto: string }[];
  percepcao: number;
  percepcaoEsp: number;
}

const mediaExpr = (e: string) => {
  let t = 0;
  for (const m of e.matchAll(/(\d+)d(\d+)/gi)) t += (Number(m[1]) * (Number(m[2]) + 1)) / 2;
  for (const m of e.matchAll(/\+\s*(\d+)(?!d|\d)/g)) t += Number(m[1]);
  return t;
};

/** Aplica a forma liberada: atributos, ataques e técnicas. O bônus de CR entra em calcularAmeaca. */
export function comLiberacao(a: Ameaca): Ameaca {
  const l = a.liberacao;
  const atr = { ...a.atr };
  const mod = formaNpc(a);
  ATRS.forEach((x) => { atr[x.id] = a.atr[x.id] + l.bonusAtr[x.id] + (mod?.soma.atr[x.id] ?? 0); });
  return { ...a, atr, ataques: l.trocar ? l.ataques : [...a.ataques, ...l.ataques], tecnicas: l.trocar ? l.tecnicas : [...a.tecnicas, ...l.tecnicas] };
}

/** Dano em área e cura de quando a forma é liberada (valores do NPC já liberado). */
export function efeitosDaLiberacao(a: Ameaca): { dano: number; tipo: string; curaPv: number } {
  const l = a.liberacao;
  const lib = comLiberacao(a);
  const pvMax = calcularAmeaca(a, true).pv;
  return { dano: l.explosao.mult * lib.atr[l.explosao.atr], tipo: l.explosao.tipo, curaPv: Math.floor((pvMax * l.cura) / 100) };
}

export function calcularAmeaca(original: Ameaca, liberado = false): AmeacaCalculada {
  const a = liberado && original.liberacao.existe ? comLiberacao(original) : original;
  const r = calcularBase(a);
  return liberado && original.liberacao.existe ? { ...r, cr: r.cr + original.liberacao.bonusCr + (formaNpc(original)?.soma.cr ?? 0) } : r;
}

function calcularBase(a: Ameaca): AmeacaCalculada {
  const nd = Math.min(20, Math.max(1, Math.round(a.nd)));
  const t = TABELA[a.categoria];
  const prof = proficienciaDoND(nd);
  const grau = GRAUS[a.categoria][a.grau] ?? GRAUS[a.categoria][0];
  const raid = a.formato === "raid";
  let pv = raid ? t.pv(nd) * 4 + a.atr.con * nd : t.pv(nd) + a.atr.con * nd;
  const pr = raid ? t.pr(nd) * 2 + a.atr.esp * nd : t.pr(nd) + a.atr.esp * nd;
  const cr = CR_BASE[a.categoria][a.dificuldade] + nd + Math.floor(Math.max(a.atr.con, a.atr.des) / 2) + grau.cr;
  // modos de duelo só valem para ameaças Solo
  let k = 1;
  let fs = 1;
  const modo = raid ? "comum" : a.modo;
  if (modo !== "comum") {
    k = FATOR_K[nd - 1];
    pv = Math.floor(pv * k);
    if (modo === "suporte") {
      fs = fatorSuporte(nd);
      pv = Math.floor(pv * (nd === 2 ? 1.1 : fs));
      if (nd === 2) fs = 1;
    }
    if (modo === "boss") pv = Math.floor(pv * Math.max(1, a.jogadores) * (nd >= 11 ? 2.3 : 1.8));
  }
  if (a.pvExtra) pv = Math.floor(pv * (1 + a.pvExtra / 100));
  // "NDd8" e "2NDd10" valem ND (ou 2 × ND) dados
  const comND = (e: string) => e.replace(/(\d*)ND(?=d\d)/gi, (_, m: string) => String((m ? Number(m) : 1) * nd));
  const esc = (e: string) => escalarDados(escalarDados(comND(e), k), fs === 1 ? 1 : fs);
  const ataques = a.ataques.map((x) => {
    const dano = `${esc(x.dados)} + ${a.atr[x.atr]}`;
    return { nome: x.nome, acerto: prof + a.atr[x.atr], dano, media: mediaExpr(dano), tipo: x.tipo, custo: x.custo ?? 0, crit: x.crit ?? 20 };
  });
  const tecnicas = a.tecnicas.map((x) => ({ nome: x.nome, dados: esc(x.dados), cd: 8 + prof + a.atr[x.atr], custo: x.custo, texto: x.texto }));
  return {
    nd, prof, pontos: pontosDeAtributo({ ...a, nd }), usados: ATRS.reduce((s, x) => s + a.atr[x.id], 0), pv, pr, cr, k,
    hierro: a.categoria === "hollow" && modo !== "comum",
    grauNome: grau.nome, ataques, tecnicas,
    percepcao: 10 + a.atr.men + prof, percepcaoEsp: 10 + a.atr.esp + prof,
  };
}

const num = (v: unknown, p: number, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : p);
const txt = (v: unknown, p = "") => (typeof v === "string" ? v : p);
const em = <T extends string>(v: unknown, l: readonly T[], p: T): T => (l.includes(v as T) ? (v as T) : p);

/** Aceita qualquer coisa vinda do banco e devolve uma ameaça válida. */
function normalizarLiberacao(raw: unknown, categoria: Categoria): LiberacaoAmeaca {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<LiberacaoAmeaca>;
  const v = liberacaoVazia(categoria);
  const bonusAtr = { ...v.bonusAtr };
  ATRS.forEach((x) => { bonusAtr[x.id] = num(o.bonusAtr?.[x.id], 0, -10, 20); });
  return {
    existe: o.existe === true,
    nome: txt(o.nome, v.nome).slice(0, 60) || v.nome,
    bonusCr: num(o.bonusCr, 0, -5, 10),
    bonusAtr,
    cura: num(o.cura, 0, 0, 100),
    explosao: { mult: num(o.explosao?.mult, 0, 0, 30), atr: em(o.explosao?.atr, ["for", "des", "con", "men", "esp"] as const, "esp"), tipo: txt(o.explosao?.tipo, "Psíquico").slice(0, 30) },
    trocar: o.trocar === true,
    ataques: Array.isArray(o.ataques) ? o.ataques.slice(0, 8).map((x) => ({ nome: txt(x?.nome, "Ataque"), atr: em(x?.atr, ["for", "des", "con", "men", "esp"] as const, "for"), dados: txt(x?.dados, "1d8"), tipo: txt(x?.tipo), custo: num(x?.custo, 0, 0, 999), crit: num(x?.crit, 20, 15, 20) })) : [],
    tecnicas: Array.isArray(o.tecnicas) ? o.tecnicas.slice(0, 10).map((x) => ({ nome: txt(x?.nome, "Técnica"), dados: txt(x?.dados, "2d6"), custo: num(x?.custo, 0, 0, 999), atr: em(x?.atr, ["for", "des", "con", "men", "esp"] as const, "esp"), texto: txt(x?.texto) })) : [],
    texto: txt(o.texto),
    ...(o.modelo && TIPOS_MODELO_NPC.includes(o.modelo.tipo) && typeof o.modelo.id === "string" && o.modelo.id.length <= 60 ? { modelo: { tipo: o.modelo.tipo, id: o.modelo.id } } : {}),
  };
}

export function normalizarAmeaca(raw: unknown): Ameaca {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<Ameaca>;
  const categoria = em(o.categoria, ["hollow", "shinigami", "quincy"] as const, "shinigami");
  const base = ameacaPadrao(categoria, num(o.nd, 1, 1, 20));
  const atr = { ...base.atr };
  ATRS.forEach((x) => { atr[x.id] = num(o.atr?.[x.id], base.atr[x.id], 0, 40); });
  return {
    categoria,
    formato: em(o.formato, ["solo", "raid"] as const, "solo"),
    nd: base.nd,
    grau: num(o.grau, 0, 0, GRAUS[categoria].length - 1),
    dificuldade: em(o.dificuldade, ["facil", "medio", "dificil"] as const, "medio"),
    atr,
    modo: em(o.modo, ["comum", "pareado", "suporte", "boss"] as const, "comum"),
    jogadores: num(o.jogadores, 4, 1, 8),
    pvExtra: num(o.pvExtra, 0, -50, 100),
    ataques: Array.isArray(o.ataques) ? o.ataques.slice(0, 8).map((x) => ({ nome: txt(x?.nome, "Ataque"), atr: em(x?.atr, ["for", "des", "con", "men", "esp"] as const, "for"), dados: txt(x?.dados, "1d8"), tipo: txt(x?.tipo), custo: num(x?.custo, 0, 0, 999), crit: num(x?.crit, 20, 15, 20) })) : base.ataques,
    tecnicas: Array.isArray(o.tecnicas) ? o.tecnicas.slice(0, 10).map((x) => ({ nome: txt(x?.nome, "Técnica"), dados: txt(x?.dados, "2d6"), custo: num(x?.custo, 0, 0, 999), atr: em(x?.atr, ["for", "des", "con", "men", "esp"] as const, "esp"), texto: txt(x?.texto) })) : [],
    caracteristicas: txt(o.caracteristicas),
    titulo: txt(o.titulo).slice(0, 80),
    zanpakutou: { nome: txt(o.zanpakutou?.nome).slice(0, 60), shikai: txt(o.zanpakutou?.shikai), bankai: txt(o.zanpakutou?.bankai) },
    liberacao: normalizarLiberacao(o.liberacao, categoria),
    habilidades: Array.isArray(o.habilidades) ? o.habilidades.slice(0, 16).map((x) => ({ titulo: txt(x?.titulo, "Habilidade"), texto: txt(x?.texto) })) : [],
  };
}
