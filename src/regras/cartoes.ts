/* Cartões de ação: o dano de um cartão automático é calculado na hora da leitura, a partir do nível, do atributo e da ação.
   Assim a ficha nunca guarda um dano velho quando o nível ou o atributo mudam. */
import { calcular, type Atr, type Ficha, type FormaLib, type HabForma } from "./ficha";
import type { CtxForma } from "./efeitos-forma";
import { analisarDano, danoNoTeto, tipoDeAcao } from "./teto-dano";
import { habilidadesDaForma } from "./liberacoes";

/* ---------------- Tipos ---------------- */

/** Os quatro cartões de ação. */
export type SubAcao = "ataque" | "area" | "cura" | "movimento";
/** Quando a ação é usada. */
export type Ritmo = "acao" | "bonus" | "reacao";
/** Força de um cartão de efeito. */
export type Forca = "leve" | "medio" | "forte";
/** Peça de poder (de sempre), cartão de característica ou cartão de efeito. Sem o campo, é peça de poder. */
export type FamiliaCartao = "peca" | "carac" | "efeito";

/** Marca de uma habilidade que nasceu de um cartão de ação. Sem a marca, a habilidade é do jeito antigo e continua igual. */
export interface CartaoAcao {
  sub: SubAcao;
  ritmo: Ritmo;
  /** técnica final da forma (vaga extra, 1 por forma) */
  final?: boolean;
  /** atributo do bônus do dano (ESP, FOR, DES ou MEN) */
  atr: string;
  /** cartão antigo só marcado: o dano e o custo continuam exatamente como eram */
  migrado?: boolean;
  /** id da característica que criou esta ação (para as que geram botão) */
  geradoPor?: string;
}

/** O que um cartão de característica sabe (o custo continua sendo os PP da forma, como nas peças de hoje). */
export interface DadosCarac {
  id: string;
  /** em que tipos de ação vale */
  vale: SubAcao[];
  /** em qual ação entra: só na técnica final, em uma ação escolhida ou em todas */
  liga: "final" | "uma" | "todas";
  /** id da ação, quando liga é "uma" */
  acao?: string;
  escolha?: { condicao?: string; tipo?: string; n?: number };
  /** ids de outras características que precisam estar na forma */
  requer?: string[];
}

/** Cartão de efeito leve, médio ou forte. */
export interface DadosEfeitoNeutro {
  forca: Forca;
  /** pronta: usa uma condição do sistema; livre: o jogador escreve e o Mestre aprova */
  modo: "livre" | "pronta";
  texto?: string;
  condicao?: { nome: string; salva?: Atr; duracao?: string };
  onde?: string;
  aval?: "pendente" | "ok";
}

/* ---------------- Catálogo ---------------- */

export interface InfoSub {
  id: SubAcao;
  nome: string;
  texto: string;
  /** quanto do dano de um ataque a ação causa (por alvo, na área) */
  fator: number;
  /** a ação causa dano em dados */
  dano: boolean;
  /** ritmo com que o cartão começa */
  ritmo: Ritmo;
}
export const SUBS: InfoSub[] = [
  { id: "ataque", nome: "Ataque", texto: "Um golpe contra um único alvo.", fator: 1, dano: true, ritmo: "acao" },
  { id: "area", nome: "Área", texto: "Atinge todas as criaturas numa área (salvaguarda de Destreza: metade do dano no sucesso).", fator: 0.85, dano: true, ritmo: "acao" },
  { id: "cura", nome: "Cura ou proteção", texto: "Cura, dá PV temporários ou reduz o dano sofrido por você ou por um aliado.", fator: 1, dano: false, ritmo: "acao" },
  { id: "movimento", nome: "Movimento e ataque", texto: "Você se move em linha reta e ataca no fim do deslocamento.", fator: 0.8, dano: true, ritmo: "acao" },
];
export const infoSub = (s: SubAcao) => SUBS.find((x) => x.id === s) ?? SUBS[0];

export interface InfoRitmo { id: Ritmo; nome: string; acao: string; pr: number }
/** PR da ação: fixo por ritmo (como nos modelos do livro). */
export const RITMOS: InfoRitmo[] = [
  { id: "acao", nome: "Ação", acao: "Ação", pr: 20 },
  { id: "bonus", nome: "Ação bônus", acao: "Ação bônus", pr: 8 },
  { id: "reacao", nome: "Reação", acao: "Reação", pr: 10 },
];
export const infoRitmo = (r: Ritmo) => RITMOS.find((x) => x.id === r) ?? RITMOS[0];
export const ritmoDeAcao = (acao: string): Ritmo => tipoDeAcao(acao);

export interface InfoForca { id: Forca; nome: string; pp: number }
/** Preço dos cartões de efeito, em PP. */
export const FORCAS: InfoForca[] = [
  { id: "leve", nome: "Leve", pp: 2 },
  { id: "medio", nome: "Médio", pp: 4 },
  { id: "forte", nome: "Forte", pp: 6 },
];

/** Quantas técnicas finais cabem numa forma (vaga extra, fora do limite das ações normais). */
export const LIMITE_FINAL = 1;

/**
 * Os 20 cartões neutros de antes viram um dos quatro cartões de ação. `carac` diz qual característica o antigo cartão será
 * (as características chegam depois; por enquanto serve só de rótulo).
 */
export const MODELO_PARA_SUB: Record<string, { sub: SubAcao; final?: boolean; carac?: string }> = {
  "Ataque básico": { sub: "ataque" },
  "Técnica final": { sub: "ataque", final: true },
  "Golpe em área": { sub: "area" },
  "Explosão final": { sub: "area", carac: "sem-reacao" },
  "Investida": { sub: "movimento" },
  "Passo veloz": { sub: "movimento" },
  "Corte distante": { sub: "ataque", carac: "alcance" },
  "Contra-ataque": { sub: "ataque" },
  "Controle": { sub: "ataque", carac: "condicao-acerto" },
  "Rajada": { sub: "ataque", carac: "golpe-duplo" },
  "Golpe atravessante": { sub: "ataque", carac: "atravessa" },
  "Onda de choque": { sub: "ataque", carac: "empurrao" },
  "Reforço": { sub: "ataque", carac: "reforco" },
  "Marca": { sub: "ataque", carac: "marcar-alvo" },
  "Provocação": { sub: "ataque", carac: "provocar" },
  "Defesa": { sub: "cura" },
  "Barreira": { sub: "cura" },
  "Proteção": { sub: "cura" },
  "Regeneração": { sub: "cura" },
  "Cura em área": { sub: "cura" },
};

/** A marca que um cartão antigo (automático, saído de um dos 20 cartões neutros) recebe. Só marca: não muda dano nem custo. */
export function marcaDoCartaoAntigo(h: HabForma): CartaoAcao | undefined {
  if (h.cartao || !h.auto || h.fixa || !h.modelo) return undefined;
  const m = MODELO_PARA_SUB[h.modelo];
  if (!m) return undefined;
  return { sub: m.sub, ritmo: ritmoDeAcao(h.acao), ...(m.final ? { final: true } : {}), atr: h.auto, migrado: true };
}

/** A marca é de um cartão que existe? (usado para limpar lixo vindo de arquivo) */
export function cartaoValido(c: unknown): c is CartaoAcao {
  if (!c || typeof c !== "object") return false;
  const o = c as Record<string, unknown>;
  return SUBS.some((s) => s.id === o.sub) && RITMOS.some((r) => r.id === o.ritmo) && typeof o.atr === "string";
}

/** Números do personagem sem a forma ligada (é com eles que o dano do cartão é conferido). */
export function ctxDaForma(f: Ficha, tipo: string): CtxForma {
  const k = calcular({ ...f, estado: { ...f.estado, liberado: "" } });
  return { n: f.nivel, prof: k.prof, atr: k.atr, tipo };
}

/** Dano do cartão: se for automático, vem sempre pronto para a ação; senão, é o que está guardado. */
export function danoDoCartao(h: HabForma, ctx: CtxForma, ppExtra = false): string | undefined {
  if (!h.auto || h.fixa) return h.dano;
  return danoNoTeto(h.acao, ctx, h.auto, ppExtra, h.especial ?? false) ?? h.dano;
}

/** O cartão como deve ser lido: com o dano calculado agora e o custo em PR que sai desse dano. */
export function cartaoLido(h: HabForma, ctx: CtxForma, ppExtra = false): HabForma {
  if (!h.auto || h.fixa) return h;
  const dano = danoDoCartao(h, ctx, ppExtra);
  if (!dano) return h;
  const a = analisarDano(dano, h.acao, ctx, ppExtra, h.especial ?? false);
  return { ...h, dano, ...(a ? { pr: a.custoPr, custo: `${a.custoPr} PR` } : {}) };
}

/** Habilidades da forma como devem ser lidas na ficha, na mesa e no painel (cartões automáticos com o dano em dia). */
export function habilidadesLidas(forma: FormaLib, f: Ficha): HabForma[] {
  const lista = habilidadesDaForma(forma);
  if (!lista.some((h) => h.auto && !h.fixa)) return lista;
  const ctx = ctxDaForma(f, forma.tipo);
  const aval = (forma.ppExtra ?? 0) > 0;
  return lista.map((h) => cartaoLido(h, ctx, aval));
}
