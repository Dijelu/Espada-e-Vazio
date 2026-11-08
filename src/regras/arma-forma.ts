/* Forma da arma: a arma da Shikai, da Bankai, da Resurrección e das outras formas.
   A arma define o golpe básico (dado, crítico, multiplicador, tipo de dano, alcance, propriedades, atributo e peso) e uma lista de
   CARACTERÍSTICAS DA ARMA que o jogador marca (segmentável, de arremesso, múltiplas lâminas…). Os cartões do catálogo (ação, característica,
   técnica especial, interação especial e efeito) declaram `armaReq`: as características de que precisam (basta UMA delas).
   Regra de ouro da retrocompatibilidade: forma SEM arma, ficha antiga e modelo oficial (arma `informativa`) = tudo liberado.
   Os limites de características por forma (2/4/6…) ficam em cartoes.ts (LIMITE_CARACS_ARMA). */
import { ARMAS } from "./catalogo";
import { SUBS, limiteCaracsArma } from "./cartoes";
import { CARACS } from "./caracteristicas";
import { INTERACOES, TECNICAS } from "./especiais";
import { EFEITOS_REACAO, EFEITOS_SEM_DANO } from "./acoes-efeito";
import type { Ataque, Calculo, Ficha, FormaLib } from "./ficha";

/* ---------------- Características da arma ---------------- */

export type CaracArmaId =
  | "segmentavel" | "arremesso" | "longo-alcance" | "contato" | "projetil" | "multiplas-laminas" | "enxame" | "invocada"
  | "elemental" | "pesada" | "escudo" | "corrente" | "dupla" | "natural" | "foco" | "agil";

export interface DefCaracArma {
  id: CaracArmaId;
  nome: string;
  /** a explicação do ⓘ, em uma ou duas frases */
  texto: string;
}

/** As 16 características da arma. Para mudar a lista, mude só aqui. */
export const CARACS_ARMA: DefCaracArma[] = [
  { id: "segmentavel", nome: "Segmentável ou flexível", texto: "A lâmina se divide em partes ligadas ou dobra como chicote. Serve para laçar, cortar em linha e alcançar longe. Ex.: Zabimaru." },
  { id: "arremesso", nome: "De arremesso", texto: "A arma é lançada contra o alvo e volta para a mão (ou se refaz). Ex.: chakram, lança jogada." },
  { id: "longo-alcance", nome: "De longo alcance", texto: "Ataca de longe sem lançar nada: a lâmina estica, a lança é longa, o corte alcança o outro lado do campo." },
  { id: "contato", nome: "De contato", texto: "Golpeia colada no alvo, no corpo a corpo. Quase toda espada, punho ou garra serve." },
  { id: "projetil", nome: "De projétil", texto: "Dispara algo que sai da arma: flechas, tiros, ondas de reiatsu, cortes que voam." },
  { id: "multiplas-laminas", nome: "Múltiplas lâminas", texto: "São várias lâminas ao mesmo tempo, que você comanda juntas ou separadas. Ex.: Senbonzakura." },
  { id: "enxame", nome: "Enxame de partes", texto: "A arma vira muitas partes minúsculas (pétalas, cinzas, insetos) que se movem como uma nuvem. Ex.: Haineko." },
  { id: "invocada", nome: "Invocada ou espiritual", texto: "A arma é (ou traz) uma criatura ou o próprio espírito, que age por conta própria. Ex.: o dragão do Hyōrinmaru." },
  { id: "elemental", nome: "Elemental", texto: "A arma carrega um elemento: fogo, gelo, vento, raio, água, sombra… O elemento define o tema dos golpes." },
  { id: "pesada", nome: "Corpo a corpo pesada", texto: "Arma grande e lenta, de golpes que esmagam. Ex.: cutelo enorme, martelo, machado grande." },
  { id: "escudo", nome: "Escudo ou defensiva", texto: "A arma também protege: bloqueia, cria barreiras ou desvia golpes." },
  { id: "corrente", nome: "Corrente ou fio", texto: "A arma está presa por corrente, fio ou cabo, e puxa, prende e enrola." },
  { id: "dupla", nome: "Par de armas", texto: "São duas armas ao mesmo tempo, uma em cada mão ou ligadas entre si." },
  { id: "natural", nome: "Parte do corpo", texto: "A arma é parte do corpo: garra, cauda, lâmina no braço, mordida, chifre." },
  { id: "foco", nome: "Foco de energia", texto: "A arma serve para juntar e soltar energia: canhão, cero, arco de reishi, kidō." },
  { id: "agil", nome: "Leve e precisa", texto: "Arma rápida, de golpes certeiros e técnicos. Boa para acertar pontos fracos e para golpes seguidos." },
];

export const caracArmaPorId = (id: string) => CARACS_ARMA.find((c) => c.id === id);
export const ehCaracArma = (id: unknown): id is CaracArmaId => typeof id === "string" && CARACS_ARMA.some((c) => c.id === id);
export const nomeCaracArma = (id: string) => caracArmaPorId(id)?.nome ?? id;
/** Só as características que existem, sem repetir. */
export const caracsValidas = (l: unknown): CaracArmaId[] => (Array.isArray(l) ? [...new Set(l.filter(ehCaracArma))] : []);

/* ---------------- A arma da forma ---------------- */

export type FonteArma = "catalogo" | "natural" | "propria";

export interface ArmaForma {
  nome: string;
  fonte: FonteArma;
  /** grupo do catálogo ("Corpo a corpo leves"…) */
  grupo?: string;
  dano: string;
  tipo: string;
  crit: number;
  mult: number;
  props: string;
  alcance: string;
  atr: string;
  peso: number;
  /** como a arma é (um conjunto de armas, o próprio espírito…) */
  nota?: string;
  /** arma própria: precisa do aval do Mestre; pendente, o golpe básico segue o da classe */
  aval?: "pendente" | "ok";
  /** dado só informativo (modelos oficiais): não trava nem libera nenhum cartão e não muda número */
  informativa?: boolean;
}

/** Grupos do catálogo, na ordem da tela. */
export const GRUPOS_ARMA = ["Corpo a corpo leves", "Corpo a corpo pesadas", "À distância medievais", "À distância modernas", "Armas naturais"] as const;

/** Armas do corpo (Resurrección e segunda etapa). Números no mesmo padrão das armas leves e pesadas do livro. */
const NATURAIS: Omit<ArmaForma, "fonte" | "grupo">[] = [
  { nome: "Garras de osso", dano: "1d8", tipo: "cortante", crit: 19, mult: 2, props: "", alcance: "", atr: "Força", peso: 1 },
  { nome: "Cauda", dano: "1d8", tipo: "concussão", crit: 20, mult: 2, props: "Alcance", alcance: "", atr: "Força", peso: 2 },
  { nome: "Lâmina no braço", dano: "1d10", tipo: "cortante", crit: 19, mult: 2, props: "", alcance: "", atr: "Destreza ou Força", peso: 2 },
  { nome: "Mordida", dano: "1d10", tipo: "perfurante", crit: 20, mult: 2, props: "", alcance: "", atr: "Força", peso: 2 },
  { nome: "Chifres", dano: "1d8", tipo: "perfurante", crit: 20, mult: 3, props: "Impacto", alcance: "", atr: "Força", peso: 2 },
  { nome: "Punho de osso", dano: "1d8", tipo: "concussão", crit: 20, mult: 2, props: "Marcial", alcance: "", atr: "Força", peso: 1 },
  { nome: "Tentáculos", dano: "1d6", tipo: "concussão", crit: 20, mult: 2, props: "Alcance", alcance: "", atr: "Destreza", peso: 1 },
  { nome: "Asa-lâmina", dano: "1d6", tipo: "cortante", crit: 19, mult: 2, props: "Dupla", alcance: "", atr: "Destreza", peso: 1 },
];

/** Todo o catálogo de armas: as do livro (armas.json) e as naturais. */
export const CATALOGO_ARMAS: (ArmaForma & { grupo: string })[] = [
  ...[...ARMAS.corpo, ...ARMAS.distancia].map((a) => ({ nome: a.nome, fonte: "catalogo" as const, grupo: a.grupo, dano: a.dano, tipo: a.tipo, crit: a.crit, mult: a.mult, props: a.props, alcance: a.alcance, atr: a.atr, peso: a.peso })),
  ...NATURAIS.map((a) => ({ ...a, fonte: "natural" as const, grupo: "Armas naturais" })),
];

/** O que cada forma mostra no catálogo: as naturais só na Resurrección e na segunda etapa; os outros grupos, em todas. */
export function catalogoDaForma(tipo: string) {
  const natural = tipo === "resurreccion" || tipo === "segunda";
  return CATALOGO_ARMAS.filter((a) => natural || a.grupo !== "Armas naturais");
}

/** Pontos de partida da arma própria da Bankai verdadeira (arma ou conjunto de armas livres, até o próprio espírito). */
export const ARMAS_LIVRES: { nome: string; nota: string }[] = [
  { nome: "Conjunto de armas", nota: "Várias armas ao mesmo tempo: descreva quantas são e como são." },
  { nome: "O próprio espírito", nota: "O espírito da Zanpakutō luta ao seu lado e é a própria arma." },
];

export const DANOS_ARMA = ["1d4", "1d6", "1d8", "1d10", "1d12", "2d6", "2d8"];
export const TIPOS_DANO_ARMA = ["cortante", "perfurante", "concussão", "cortante ou perfurante", "energia"];
export const ATRS_ARMA = ["Força", "Destreza", "Destreza ou Força"];
export const PROPS_ARMA = ["Alcance", "Arremesso", "Dupla", "Duas Mãos", "Poderosa", "Impacto", "Marcial"];

/** Arma própria em branco (precisa do aval do Mestre). */
export const armaPropriaVazia = (): ArmaForma => ({ nome: "", fonte: "propria", dano: "1d8", tipo: "cortante", crit: 20, mult: 2, props: "", alcance: "", atr: "Força", peso: 1, aval: "pendente" });

/** Copia um item do catálogo para a forma (sem o aval: o catálogo não precisa). */
export function armaDoCatalogo(a: ArmaForma & { grupo?: string }): ArmaForma {
  const { informativa: _i, aval: _a, ...resto } = a;
  return { ...resto };
}

const nUnico = (v: unknown, min: number, max: number, pad: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : pad);
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Limpa a arma que veio de arquivo ou de edição (campo estranho some; sem nome, não é arma). */
export function normalizarArma(x: unknown): ArmaForma | undefined {
  if (!x || typeof x !== "object") return undefined;
  const o = x as Record<string, unknown>;
  const nome = txt(o.nome, 60);
  if (!nome) return undefined;
  const fonte: FonteArma = o.fonte === "natural" || o.fonte === "propria" ? o.fonte : "catalogo";
  const a: ArmaForma = {
    nome, fonte,
    dano: /^\d{1,2}d\d{1,2}$/.test(txt(o.dano, 8)) ? txt(o.dano, 8) : "1d8",
    tipo: txt(o.tipo, 40) || "cortante",
    crit: nUnico(o.crit, 15, 20, 20), mult: nUnico(o.mult, 2, 4, 2),
    props: txt(o.props, 80), alcance: txt(o.alcance, 40), atr: /^(For|Dest)/.test(txt(o.atr, 30)) ? txt(o.atr, 30) : "Força",
    peso: nUnico(o.peso, 0, 6, 1),
  };
  if (typeof o.grupo === "string" && o.grupo) a.grupo = txt(o.grupo, 40);
  if (typeof o.nota === "string" && o.nota.trim()) a.nota = txt(o.nota, 200);
  if (fonte === "propria") a.aval = o.aval === "ok" ? "ok" : "pendente";
  if (o.informativa === true) a.informativa = true;
  return a;
}

/** A arma própria ainda espera o aval do Mestre? */
export const armaPendente = (a: Pick<ArmaForma, "fonte" | "aval"> | undefined) => !!a && a.fonte === "propria" && a.aval !== "ok";

/* ---------------- A arma de uma forma, com as heranças ---------------- */

type FormaArma = Pick<FormaLib, "tipo"> & Partial<Pick<FormaLib, "arma" | "armaCaracs" | "armaMantem">>;

/** De que forma a arma pode ser mantida: a Bankai mantém a da Shikai; a Verdadeira, a da Bankai. */
export const FORMA_DA_ARMA_MANTIDA: Record<string, "shikai" | "bankai" | undefined> = { bankai: "shikai", bankai2: "bankai" };

/** A arma que a forma usa: a própria ou, se ela mantém a da forma anterior, a dessa. */
export function armaEfetiva(f: Pick<Ficha, "formas">, forma: FormaArma | undefined, fundo = 0): ArmaForma | undefined {
  if (!forma) return undefined;
  const de = FORMA_DA_ARMA_MANTIDA[forma.tipo];
  if (forma.armaMantem && de && fundo < 3) {
    const base = f.formas?.[de];
    return base ? armaEfetiva(f, base, fundo + 1) : undefined;
  }
  return forma.arma;
}

/** O que os cartões precisam saber da arma da forma. `arma` vazio = sem arma definida = tudo liberado. */
export interface ArmaCtx { arma?: ArmaForma; caracs: string[] }

export function armaCtxDaForma(f: Pick<Ficha, "formas">, forma: FormaArma | undefined): ArmaCtx {
  return { arma: armaEfetiva(f, forma), caracs: caracsValidas(forma?.armaCaracs) };
}

/** A arma trava cartões? Só quando existe, não é informativa (modelo oficial) e a forma não é antiga. */
export const armaTrava = (ctx: ArmaCtx | undefined): boolean => !!ctx?.arma && !ctx.arma.informativa;

export interface Liberacao { ok: boolean; falta: string[] }

/** O cartão que pede `req` (basta uma das características) está liberado pela arma? */
export function liberadoPelaArma(ctx: ArmaCtx | undefined, req?: readonly string[]): Liberacao {
  if (!req || req.length === 0 || !armaTrava(ctx)) return { ok: true, falta: [] };
  const tem = req.some((r) => ctx!.caracs.includes(r));
  return { ok: tem, falta: tem ? [] : req.map(nomeCaracArma) };
}

/** "precisa de: múltiplas lâminas ou enxame de partes" (minúsculas, para o aviso do cartão). */
export const textoPrecisa = (falta: string[]) => `precisa de: ${falta.map((n) => n.toLowerCase()).join(" ou ")}`;

/** Todos os cartões do catálogo que declaram requisito de arma (para conferir e para a tela de ajuda). */
export function listarRequisitos(): { familia: "acao" | "carac" | "tecnica" | "interacao" | "efeito"; id: string; nome: string; req: CaracArmaId[] }[] {
  const l: { familia: "acao" | "carac" | "tecnica" | "interacao" | "efeito"; id: string; nome: string; req: CaracArmaId[] }[] = [];
  for (const x of SUBS) if (x.armaReq) l.push({ familia: "acao", id: x.id, nome: x.nome, req: x.armaReq });
  for (const x of CARACS) if (x.armaReq) l.push({ familia: "carac", id: x.id, nome: x.nome, req: x.armaReq });
  for (const x of TECNICAS) if (x.armaReq) l.push({ familia: "tecnica", id: x.id, nome: x.nome, req: x.armaReq });
  for (const x of INTERACOES) if (x.armaReq) l.push({ familia: "interacao", id: x.id, nome: x.nome, req: x.armaReq });
  for (const x of [...EFEITOS_REACAO, ...EFEITOS_SEM_DANO]) if (x.armaReq) l.push({ familia: "efeito", id: x.id, nome: x.nome, req: x.armaReq });
  return l;
}

/* ---------------- Limites ---------------- */

/** Quantas características a forma ainda pode marcar. */
export const caracsRestantes = (tipo: string, marcadas: number) => Math.max(0, limiteCaracsArma(tipo) - marcadas);

/* ---------------- Leitura ---------------- */

/** "1d8 cortante · crítico 19–20 ×2 · Dupla · Destreza · peso 1" */
export function resumoArma(a: ArmaForma): string {
  return [
    `${a.dano} ${a.tipo}`,
    `crítico ${a.crit >= 20 ? "20" : `${a.crit}–20`} ×${a.mult}`,
    a.props || "",
    a.alcance ? `alcance ${a.alcance}` : "",
    a.atr,
    `peso ${a.peso}`,
  ].filter(Boolean).join(" · ");
}

const ehDistancia = (a: ArmaForma) => (a.grupo ?? "").startsWith("À distância");

/** O golpe básico da arma como um ataque da ficha (acerto e dano saem das mesmas contas dos ataques cadastrados). Em "Destreza ou Força", vale o atributo mais alto. */
export function ataqueDaArma(a: ArmaForma, c?: Pick<Calculo, "atr">): Ataque {
  const dois = / ou |,/.test(a.atr);
  const atr: "des" | "for" = dois ? (c && c.atr.des > c.atr.for ? "des" : "for") : a.atr.startsWith("Destreza") ? "des" : "for";
  return {
    id: "arma-da-forma", nome: `Golpe básico (${a.nome})`, atr, dano: a.dano,
    crit: a.crit, mult: a.mult, ...(ehDistancia(a) ? { distancia: true } : {}), nota: a.props || undefined,
  };
}
