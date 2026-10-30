/* Efeitos passivos de talentos e essências, aplicados sozinhos nos números da ficha.
   Este arquivo só importa tipos de ficha.ts (para não criar ciclo); os dados vêm dos JSON do livro. */
import type { Atr, Ficha } from "./ficha";
import talentosJson from "./talentos.json";
import essenciasJson from "./essencias.json";
import { FIXAS, CARTAS } from "./talentos-efeitos";

type Talento = { id: string; nome: string; texto: string };
type EssenciaJson = { nome: string; texto: string; etapas: string[] };

const TALENTOS = talentosJson as unknown as Record<string, Talento[]>;
const ESSENCIAS = essenciasJson as unknown as EssenciaJson[];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const ESS_POR_NOME = new Map(ESSENCIAS.map((e) => [norm(e.nome), e]));

export interface PassivaAtiva {
  nome: string;
  fonte: string;
  texto: string;
  /** true quando o efeito já está somado nos números da ficha */
  auto: boolean;
  /** resumo curto do que foi somado, ex.: "CR +2" */
  efeito?: string;
  /** true quando o talento virou carta no Resumo (depende de uso ou situação) */
  carta?: boolean;
}

export interface EfeitoSoma {
  cr: number;
  pv: number;
  pr: number;
  /** RD de várias fontes não se acumula: vale a maior (soma depois com a da Origem) */
  rdFis: number;
  rdEso: number;
  desloc: number;
  iniciativa: number;
  danoCorpo: number;
  percPassiva: number;
  cdKido: number;
  /** perícias que podem usar outro atributo (vale o melhor dos dois) */
  periciaAtr: Record<string, Atr>;
  reducaoLib: { shikai: number; bankai: number; vollstandig: number };
}

export interface PassivasAtributos {
  atr: Partial<Record<Atr, number>>;
  saves: Atr[];
  /** limite de cada atributo (15, ou mais com as essências de atributo) */
  limite: Partial<Record<Atr, number>>;
}

interface Ctx {
  atr: Record<Atr, number>;
  prof: number;
  n: number;
}

const vazio = (): EfeitoSoma => ({
  cr: 0, pv: 0, pr: 0, rdFis: 0, rdEso: 0, desloc: 0, iniciativa: 0, danoCorpo: 0, percPassiva: 0, cdKido: 0,
  periciaAtr: {}, reducaoLib: { shikai: 0, bankai: 0, vollstandig: 0 },
});

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ","));
const sinal = (v: number) => (v >= 0 ? `+${fmt(v)}` : fmt(v));

/** Essências que mexem nos atributos (e dão proficiência na resistência do atributo). */
const ESS_ATRIBUTO: Record<string, Atr> = {
  "forca do gigante": "for",
  genio: "men",
  resoluto: "con",
  sabio: "men",
  veloz: "des",
  virtuoso: "esp",
};

/** Limite do atributo em cada etapa das essências de atributo: 16, 17, 18, 20 e 20. */
const LIMITE_ETAPA = [16, 17, 18, 20, 20];
/** Totais acumulados das essências com valores que não crescem em linha reta. */
const ROBUSTO_PV = [15, 30, 50, 70, 95];
const VITALIDADE_PR = [10, 25, 45, 70, 100];
const REFLEXOS_EXTRA = [0, 1, 2, 4, 6];

const etapaDe = (nome: string, etapa: number) => {
  const e = ESS_POR_NOME.get(norm(nome));
  const max = e ? e.etapas.length + 1 : 5;
  return Math.max(1, Math.min(etapa || 1, max));
};

export function atributosPassivos(f: Ficha): PassivasAtributos {
  const out: PassivasAtributos = { atr: {}, saves: [], limite: {} };
  for (const x of f.essencias) {
    const a = ESS_ATRIBUTO[norm(x.nome)];
    if (!a) continue;
    const e = etapaDe(x.nome, x.etapa);
    out.atr[a] = (out.atr[a] ?? 0) + e;
    out.limite[a] = Math.max(out.limite[a] ?? 15, LIMITE_ETAPA[e - 1] ?? 20);
    if (!out.saves.includes(a)) out.saves.push(a);
  }
  return out;
}

type FnEssencia = (e: number, c: Ctx, r: EfeitoSoma) => string | void;

const POR_ESSENCIA: Record<string, FnEssencia> = {
  "ajuste vital": (_e, c, r) => { const v = Math.floor(c.atr.con / 2) * c.n; r.pr += v; return `PR ${sinal(v)}`; },
  "classe de resistencia aprimorada": (e, _c, r) => { const v = Math.min(e, 2); r.cr += v; return `CR ${sinal(v)}`; },
  "constituicao energetica": (e, c, r) => { const v = c.atr.con + 5 * (e - 1); r.pr += v; return `PR ${sinal(v)}`; },
  "pele de aco": (e, _c, r) => { const v = 2 * e; r.rdFis = Math.max(r.rdFis, v); return `RD física ${v}`; },
  "revestimento de reiatsu": (e, _c, r) => { const v = 4 * e; r.rdEso = Math.max(r.rdEso, v); return `RD esotérica ${v}`; },
  "hierro reforcado": (e, _c, r) => { const v = 2 * e; r.rdFis = Math.max(r.rdFis, v); return `RD física ${v}`; },
  "pele imortal": (e, _c, r) => { const v = 5 + 5 * e; r.rdFis = Math.max(r.rdFis, v); r.rdEso = Math.max(r.rdEso, v); return `RD ${v} contra todos os tipos`; },
  robusto: (e, _c, r) => { const v = ROBUSTO_PV[e - 1] ?? 95; r.pv += v; return `PV ${sinal(v)} (os +2 por nível ficam no ajuste manual)`; },
  "vitalidade espiritual": (e, _c, r) => { const v = VITALIDADE_PR[e - 1] ?? 100; r.pr += v; return `PR ${sinal(v)} (os +2 por nível ficam no ajuste manual)`; },
  velocista: (e, _c, r) => { const v = 3 + 1.5 * (e - 1); r.desloc += v; return `deslocamento ${sinal(v)} m`; },
  "sonido bestial": (e, _c, r) => { const v = 1.5 * e; r.desloc += v; return `deslocamento ${sinal(v)} m`; },
  "reflexos aprimorados": (e, c, r) => { const v = c.prof + (REFLEXOS_EXTRA[e - 1] ?? 6); r.iniciativa += v; return `iniciativa ${sinal(v)}`; },
  feroz: (e, _c, r) => { const v = 2 * e; r.danoCorpo += v; return `dano corpo a corpo ${sinal(v)}`; },
  "garras afiadas": (e, _c, r) => { const v = 2 * e; r.danoCorpo += v; return `dano da arma natural ${sinal(v)}`; },
  "diminuicao de custo shikai": (e, _c, r) => { r.reducaoLib.shikai += e; return `custo da Shikai −${e}`; },
  "diminuicao de custo bankai": (e, _c, r) => { r.reducaoLib.bankai += 5 * e; return `custo da Bankai −${5 * e}`; },
  "vollstandig refinada": (e, _c, r) => { r.reducaoLib.vollstandig += 5 * e; return `custo da Vollständig −${5 * e}`; },
  "vigor inabalavel": (_e, c, r) => { const v = (c.atr.for - c.atr.con) * c.n; r.pv += v; return `PV ${sinal(v)} (Força no lugar de Constituição)`; },
};

const POR_TALENTO: Record<string, (c: Ctx, r: EfeitoSoma) => string | void> = {
  "zanjutsu/defesa-agil": (c) => `CR passa a ser 10 + proficiência + Destreza (${10 + c.prof + c.atr.des}); vale a maior entre as fórmulas`,
  "kidoshu/defesa-inteligente": (c) => `CR passa a ser 10 + proficiência + metade da Mente (${10 + c.prof + Math.floor(c.atr.men / 2)}); vale a maior entre as fórmulas`,
  "zanjutsu/armadura-natural": (_c, r) => { r.cr += 2; return "CR +2"; },
  "hueco/couraca-ossea": (_c, r) => { r.cr += 1; r.rdFis = Math.max(r.rdFis, 2); return "CR +1 e RD física 2"; },
  "hueco/emboscador": (c, r) => { r.iniciativa += c.prof; return `iniciativa ${sinal(c.prof)}`; },
  "hueco/corpo-macico": (c, r) => { const v = 2 * c.n; r.pv += v; return `PV ${sinal(v)}`; },
  "hueco/pele-de-ferro": (c, r) => { r.cr += 1; r.rdFis = Math.max(r.rdFis, 5); return "CR +1 e RD física 5"; },
  "hueco/sonido-selvagem": (c, r) => { r.desloc += 3; return "deslocamento +3 m"; },
  "vazio/reserva-vazia": (c, r) => { const v = 2 * c.n; r.pr += v; return `PR ${sinal(v)}`; },
  "vazio/pocos-profundos": (c, r) => { r.pr += c.n; return `PR ${sinal(c.n)}`; },
  "vazio/vigilia-do-vazio": (c, r) => { r.iniciativa += c.prof; return `iniciativa ${sinal(c.prof)}`; },
  "schutze/calculo-rapido": (c, r) => { const v = Math.floor(c.atr.men / 2); r.iniciativa += v; return `iniciativa ${sinal(v)}`; },
  "ritter/calculo-de-duelo": (c, r) => { const v = Math.floor(c.atr.esp / 2); r.iniciativa += v; return `iniciativa ${sinal(v)}`; },
  "schutze/percepcao-espiritual-apurada": (_c, r) => { r.percPassiva += 5; return "percepção passiva +5"; },
  "ritter/percepcao-espiritual-apurada": (_c, r) => { r.percPassiva += 5; return "percepção passiva +5"; },
  "tokubetsu/imposicao-espiritual": (_c, r) => { r.cdKido += 3; return "CD dos Kidōs +3"; },
  "zanjutsu/velocidade-sutil": (_c, r) => { r.periciaAtr["velocidade"] = "des"; return "Velocidade pode usar Destreza"; },
  "tokubetsu/ajuste-agil": (_c, r) => { r.periciaAtr["velocidade"] = "des"; r.periciaAtr["preparo-fisico"] = "des"; return "Velocidade e Preparo Físico podem usar Destreza"; },
  "hakuda/fluxo-veloz": (_c, r) => { r.periciaAtr["velocidade"] = "des"; r.periciaAtr["preparo-fisico"] = "des"; return "Velocidade e Preparo Físico podem usar Destreza"; },
};

/** Soma os efeitos passivos das essências e talentos escolhidos e devolve também a lista para mostrar na ficha. */
export function passivasDaFicha(f: Ficha, c: Ctx): { soma: EfeitoSoma; lista: PassivaAtiva[] } {
  const soma = vazio();
  const lista: PassivaAtiva[] = [];

  for (const x of f.essencias) {
    const chave = norm(x.nome);
    const livro = ESS_POR_NOME.get(chave);
    if (!livro) continue;
    const e = etapaDe(x.nome, x.etapa);
    const texto = e <= 1 ? livro.texto : livro.etapas[e - 2] || livro.texto;
    const fn = POR_ESSENCIA[chave];
    const atr = ESS_ATRIBUTO[chave];
    if (fn) {
      const efeito = fn(e, c, soma) || undefined;
      lista.push({ nome: livro.nome, fonte: `Essência · etapa ${e}`, texto, auto: true, efeito });
    } else if (atr) {
      lista.push({ nome: livro.nome, fonte: `Essência · etapa ${e}`, texto, auto: true, efeito: `atributo ${sinal(e)} e proficiência na resistência` });
    } else {
      lista.push({ nome: livro.nome, fonte: `Essência · etapa ${e}`, texto, auto: false });
    }
  }

  const doLivro = TALENTOS[f.classe] ?? [];
  for (const id of f.talentos) {
    const t = doLivro.find((y) => y.id === id);
    if (!t) continue;
    const fn = POR_TALENTO[`${f.classe}/${id}`];
    if (fn) lista.push({ nome: t.nome, fonte: "Talento", texto: t.texto, auto: true, efeito: fn(c, soma) || undefined });
    else if (FIXAS[`${f.classe}/${id}`]) {
      const x = FIXAS[`${f.classe}/${id}`];
      lista.push({ nome: t.nome, fonte: "Talento", texto: t.texto, auto: true, efeito: typeof x === "function" ? x(c) : x });
    } else if (CARTAS[`${f.classe}/${id}`]) lista.push({ nome: t.nome, fonte: "Talento", texto: t.texto, auto: false, carta: true });
    else lista.push({ nome: t.nome, fonte: "Talento", texto: t.texto, auto: false });
  }

  return { soma, lista };
}
