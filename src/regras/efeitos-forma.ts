/* Efeitos das transformações: o jogador monta a forma com peças que viram bônus automáticos enquanto ela está ativa. */
import { contaSimples } from "./liberacoes";
import { ppExtraDaForma } from "./hogyoku";
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

import type { DadosCarac, DadosEfeitoNeutro, DadosEspecial, FamiliaCartao, Ritmo } from "./cartoes";
import { especialFunciona } from "./especiais";

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
  /** dano que o próprio usuário sofre (sem resistência) */
  autoDano?: Num;
  /** condição que o alvo sofre, com salvaguarda opcional (CD = 8 + proficiência + Espírito) */
  condicao?: { nome: string; salva?: Atr; duracao?: string };
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
  | { k: "texto"; t: string }
  | { k: "frenesi"; nivel: "leve" | "grande" | "total" }
  /** ponto fraco forte: devolve `pp` pontos (fora do teto de um terço) e pode ferir quem usa a cada turno */
  | { k: "preco"; pp: number; texto: string; autoDano?: Num }
  /** a forma dura mais alguns turnos (10 turnos = 1 minuto) */
  | { k: "duracaoMais"; turnos: Num }
  /** a característica cria um botão de ação em jogo (invocar, trocar de lugar…); o motor ainda não o desenha */
  | { k: "gera"; botao: { rotulo: string; ritmo: Ritmo; faz: "invocar" | "trocar" | "absorver" | "texto"; ref?: string } }
  /** sinergia entre características (ex.: clones com a técnica final); o motor ainda não a usa */
  | { k: "liga"; com: string; faz: string }
  | { k: "invoca"; nome: string; tipo: "clone" | "invocacao"; max: Num; pv: Num; cr: Num; acerto: Num; dano: string; custoPr: Num; texto?: string };

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
  /** peça de poder (sem o campo), cartão de característica ou cartão de efeito */
  familia?: FamiliaCartao;
  carac?: DadosCarac;
  efeitoNeutro?: DadosEfeitoNeutro;
  /** técnica especial ou interação especial (familia "tecnica" ou "interacao") */
  espec?: DadosEspecial;
}

export interface CtxForma {
  n: number;
  prof: number;
  atr: Record<Atr, number>;
  /** tipo da forma que está sendo montada (muda o teto de dano das habilidades) */
  tipo?: string;
}

/** A que ações um cartão de característica está ligado. `vale` são os tipos de ação em que ele pode entrar. */
export interface LigAcao { modo: "final" | "uma" | "todas"; acao?: string; vale: string[] }
/** A ação que está sendo lida (para saber se um cartão ligado entra nela). */
export interface AcaoRef { id?: string; final?: boolean; sub?: string }

/** O cartão ligado entra nesta ação? */
export function ligaCom(l: LigAcao, a?: AcaoRef): boolean {
  if (!a) return false;
  if (a.sub && l.vale.length > 0 && !l.vale.includes(a.sub)) return false;
  if (l.modo === "final") return !!a.final;
  if (l.modo === "uma") return !!l.acao && a.id === l.acao;
  return true;
}

/** Ligação de uma peça que é cartão de característica de ação (sem `vale`, a característica vale para a forma toda). */
export function ligacaoDa(inst: InstEfeito): LigAcao | undefined {
  const c = inst.carac;
  if (!c || c.vale.length === 0) return undefined;
  return { modo: c.liga, ...(c.acao ? { acao: c.acao } : {}), vale: c.vale };
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
  if (lib === "vollstandig") return [...picksComoPecas(fm.vollstandig).map((inst) => ({ inst, fonte: "forma" as Fonte })), ...de(fm.vollstandig, "forma")];
  return [];
}

/** Habilidades únicas da Vollständig que entram sozinhas na ficha. CR, PV, PR, redução e deslocamento já são somados em `calcular`. */
export function picksComoPecas(forma: FormaLib | undefined): InstEfeito[] {
  const pk = forma?.picks ?? {};
  const out: InstEfeito[] = [];
  const nome = (id: string) => HAB_NOMES[id] ?? id;
  const arma: Alvo[] = ["golpe", "disparo"];
  const peca = (id: string, efeitos: Efeito[]) => out.push({ id: `pk-${id}`, nome: nome(id), efeitos, confirmado: true });
  const n = (id: string) => Math.max(0, Math.min(8, Math.floor(pk[id] ?? 0)));
  const atrs = forma?.atrPicks ?? [];
  for (let i = 0; i < n("atributo"); i++) {
    const a = atrs[i];
    if (a && ATRIBUTOS.includes(a)) out.push({ id: `pk-atributo-${i}`, nome: `${nome("atributo")} (${ATR_NOME[a]})`, efeitos: [{ k: "atr", atr: a, v: 2 }], confirmado: true });
  }
  if (n("forca")) peca("forca", [{ k: "dano", em: arma, v: 5 }]);
  if (n("precisao")) peca("precisao", [{ k: "acerto", em: arma, v: 3 }]);
  if (n("potencia")) peca("potencia", [{ k: "dano", em: ["reishi"], v: 5 * n("potencia") }]);
  if (n("olhos")) peca("olhos", [{ k: "alcance", em: ["disparo", "reishi"], m: 6 * n("olhos") }]);
  if (n("vigor")) peca("vigor", [{ k: "gatilho", quando: "inicioTurno", rotulo: "Vigor do Reishi", faz: { curaPv: 5 * n("vigor") } }]);
  if (n("tokubetsu")) peca("tokubetsu", [{ k: "texto", t: `+${3 * n("tokubetsu")} em testes de perícia` }]);
  if (n("sentido")) peca("sentido", [{ k: "texto", t: `+${12 * n("sentido")} m no alcance da Consciência Espiritual Expandida` }]);
  if (n("reuniao")) peca("reuniao", [{ k: "texto", t: `+${5 * n("reuniao")} PR ao recuperar com Sklaverei` }]);
  return out;
}

const HAB_NOMES: Record<string, string> = {
  atributo: "Aumento de Atributo", forca: "Força Espiritual", precisao: "Precisão Espiritual", potencia: "Potência Espiritual", olhos: "Olhos do Céu",
  vigor: "Vigor do Reishi", tokubetsu: "Tokubetsu", sentido: "Sentido Divino", reuniao: "Reunião Eficiente",
};

/* ---------- soma dos efeitos ---------- */

export interface ModeloInvocacao {
  chave: string;
  peca: string;
  nome: string;
  tipo: "clone" | "invocacao";
  max: number;
  pv: number;
  cr: number;
  acerto: number;
  dano: string;
  custoPr: number;
  texto?: string;
}

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
  /** cada cartão de dano (dados ou dano fixo) com os alvos a que vale, para somar uma vez só por habilidade */
  cartoesDano: { em: Alvo[]; dado?: string; fixo: number; lig?: LigAcao }[];
  ignoraRd: Record<Alvo, number>;
  alcance: Record<Alvo, number>;
  vant: string[];
  resist: { dano: string; grau: string }[];
  gatilhos: { rotulo: string; quando: Quando; limite?: string; faz: Faz; peca: string; /** cartão de característica ligado a uma ação: o botão aparece na ação */ lig?: LigAcao }[];
  /** a forma tira o controle de você: a cada turno, salvaguarda (leve e grande) ou o Mestre sempre joga (total) */
  frenesi?: "leve" | "grande" | "total";
  /** clones e invocações que a forma permite criar, com os números já calculados */
  invocacoes: ModeloInvocacao[];
  manutencao: number;
  /** turnos somados à duração por peças de duração extra */
  duracaoMais: number;
  fim?: "curto" | "longo";
  duracao?: number;
  textos: { nome: string; t: string }[];
  /** linhas do resumo: o que mudou e de onde veio */
  linhas: { rotulo: string; valor: string; fonte: string }[];
  /** botões de ação que os cartões de característica criam (só existe quando há algum) */
  botoes?: BotaoGerado[];
  /** sinergias entre cartões de característica (só existe quando há alguma) */
  sinergias?: { com: string; faz: string; peca: string; lig?: LigAcao }[];
}

/** Botão que um cartão de característica cria em jogo. */
export interface BotaoGerado {
  rotulo: string;
  ritmo: Ritmo;
  faz: "invocar" | "trocar" | "absorver" | "texto";
  /** invocar: chave do modelo de invocação; trocar e absorver: "clone"; texto: dado a rolar (ex.: 2d10), se houver */
  ref?: string;
  /** o que o botão faz, em palavras */
  texto?: string;
  peca: string;
  lig?: LigAcao;
}

const porAlvo = <T,>(v: T): Record<Alvo, T> => Object.fromEntries(ALVOS.map((a) => [a.id, Array.isArray(v) ? [...v] : v])) as Record<Alvo, T>;
const sinal = (v: number) => (v >= 0 ? `+${v}` : String(v));
const nomeAlvos = (em: Alvo[]) => {
  const k = new Set(em);
  if (ARMADOS.every((a) => k.has(a)) && k.size === ARMADOS.length) return "ataques armados e Hadō";
  return em.map((a) => ALVOS.find((x) => x.id === a)?.nome ?? a).join(", ");
};

/** Troca [PROF], [NIV]… do dado de um botão pelos números (sem conta: "[PROF]d8" vira "3d8"). */
function dadosDoRef(ref: string | undefined, ctx: CtxForma): string | undefined {
  if (!ref || !ref.includes("[")) return ref;
  const v: Record<string, number> = { NIV: ctx.n, PROF: ctx.prof, FOR: ctx.atr.for, DES: ctx.atr.des, CON: ctx.atr.con, MEN: ctx.atr.men, ESP: ctx.atr.esp };
  return ref.replace(/\[([A-Z]{3,4})\]/g, (_, k: string) => String(v[k] ?? 0));
}

export function somarForma(f: Ficha, ctx: CtxForma): SomaForma | null {
  const pecas = pecasAtivas(f);
  if (pecas.length === 0) return null;
  const s: SomaForma = {
    atr: { for: 0, des: 0, con: 0, men: 0, esp: 0 }, cr: 0, rdFis: 0, rdEso: 0, desloc: 0, voo: 0, ataques: 0, reacoes: 0, bonus: 0, cd: 0,
    acerto: porAlvo(0), dano: porAlvo(0), dados: porAlvo<string[]>([]), cartoesDano: [], ignoraRd: porAlvo(0), alcance: porAlvo(0),
    vant: [], resist: [], gatilhos: [], invocacoes: [], manutencao: 0, duracaoMais: 0, textos: [], linhas: [],
  };
  const linha = (rotulo: string, v: string, fonte: string) => s.linhas.push({ rotulo, valor: v, fonte });
  const todas = pecas.map((p) => p.inst);
  for (const { inst, fonte } of pecas) {
    const nome = fonte === "forma" ? inst.nome : `${inst.nome} (herdada)`;
    // técnica especial sem interação (ou interação sem técnica) não funciona: nenhum dos efeitos dela entra
    if (!especialFunciona(inst, todas)) { linha(inst.familia === "tecnica" ? "Técnica especial sem interação" : "Interação especial sem técnica", "não funciona", nome); continue; }
    const lig = ligacaoDa(inst);
    let ultimaChave = "";
    for (const e of inst.efeitos) {
      switch (e.k) {
        case "atr": { const v = valor(e.v, ctx); s.atr[e.atr] += v; linha(ATR_NOME[e.atr], sinal(v), nome); break; }
        case "cr": { const v = valor(e.v, ctx); s.cr += v; linha("CR", sinal(v), nome); break; }
        case "acerto": { const v = valor(e.v, ctx); e.em.forEach((a) => (s.acerto[a] += v)); linha(`Acerto: ${nomeAlvos(e.em)}`, sinal(v), nome); break; }
        case "dano": {
          const v = valor(e.v, ctx);
          if (lig) { if (v !== 0) s.cartoesDano.push({ em: e.em, fixo: v, lig }); linha("Dano: ação ligada", sinal(v), nome); break; }
          e.em.forEach((a) => (s.dano[a] += v)); if (v !== 0) s.cartoesDano.push({ em: e.em, fixo: v }); linha(`Dano: ${nomeAlvos(e.em)}`, sinal(v), nome); break;
        }
        case "dados": {
          const n = valor(e.n, ctx);
          if (n > 0 && lig) { s.cartoesDano.push({ em: e.em, dado: `${n}d${e.d}`, fixo: 0, lig }); linha("Dano: ação ligada", `+${n}d${e.d}${e.tipo ? ` ${e.tipo}` : ""}`, nome); break; }
          if (n > 0) { e.em.forEach((a) => s.dados[a].push(`${n}d${e.d}`)); s.cartoesDano.push({ em: e.em, dado: `${n}d${e.d}`, fixo: 0 }); linha(`Dano: ${nomeAlvos(e.em)}`, `+${n}d${e.d}${e.tipo ? ` ${e.tipo}` : ""}`, nome); }
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
        case "gatilho": { s.gatilhos.push({ rotulo: e.rotulo || nome, quando: e.quando, limite: e.limite, faz: e.faz, peca: nome, ...(lig ? { lig } : {}) }); break; }
        case "custo": { const v = valor(e.pr, ctx); s.manutencao += v; linha("Manutenção", `${v} PR por turno`, nome); break; }
        case "fim": { s.fim = e.esgotado; linha("Ao terminar", `Esgotado até o descanso ${e.esgotado === "curto" ? "curto" : "longo"}`, nome); break; }
        case "duracao": { s.duracao = valor(e.turnos, ctx); linha("Duração", `${s.duracao} turnos`, nome); break; }
        case "texto": { s.textos.push({ nome, t: e.t }); break; }
        case "frenesi": {
          s.frenesi = e.nivel;
          linha("Frenesi", e.nivel === "leve" ? "salvaguarda de Mente a cada turno; falhou: ataca o mais próximo" : e.nivel === "grande" ? "salvaguarda de Mente a cada turno; falhou: o Mestre joga o seu turno" : "o Mestre controla você enquanto a forma durar", nome);
          break;
        }
        case "preco": {
          s.textos.push({ nome, t: e.texto });
          linha("Preço", e.texto, nome);
          if (e.autoDano !== undefined) s.gatilhos.push({ rotulo: `Preço: ${inst.nome}`, quando: "inicioTurno", faz: { autoDano: e.autoDano, texto: "dano que você sofre" }, peca: nome });
          break;
        }
        case "duracaoMais": { const v = Math.max(0, valor(e.turnos, ctx)); s.duracaoMais += v; linha("Duração", `+${v} turnos`, nome); break; }
        case "gera": {
          const b = e.botao;
          const refB = b.faz === "invocar" ? b.ref || ultimaChave : dadosDoRef(b.ref, ctx);
          (s.botoes ??= []).push({ rotulo: b.rotulo || inst.nome, ritmo: b.ritmo, faz: b.faz, ...(refB ? { ref: refB } : {}), ...(inst.texto ? { texto: inst.texto } : {}), peca: nome, ...(lig ? { lig } : {}) });
          break;
        }
        case "liga": { (s.sinergias ??= []).push({ com: e.com, faz: e.faz, peca: nome, ...(lig ? { lig } : {}) }); break; }
        case "invoca": {
          const max = Math.max(1, Math.min(10, Math.floor(valor(e.max, ctx))));
          ultimaChave = `${inst.id}:${s.invocacoes.length}`;
          s.invocacoes.push({ chave: ultimaChave, peca: nome, nome: e.nome || nome, tipo: e.tipo, max, pv: Math.max(1, Math.floor(valor(e.pv, ctx))), cr: Math.floor(valor(e.cr, ctx)), acerto: Math.floor(valor(e.acerto, ctx)), dano: e.dano, custoPr: Math.max(0, Math.floor(valor(e.custoPr, ctx))), texto: e.texto });
          linha(e.tipo === "clone" ? "Clones" : "Invocações", `até ${max}`, nome);
          break;
        }
      }
    }
  }
  // quem paga dano por turno não se cura no início do turno com a mesma forma: a cura anularia o preço
  if (pecas.some(({ inst }) => inst.efeitos.some((e) => e.k === "preco" && e.autoDano !== undefined))) {
    const antes = s.gatilhos.length;
    s.gatilhos = s.gatilhos.filter((g) => !(g.quando === "inicioTurno" && g.faz.curaPv !== undefined));
    if (s.gatilhos.length < antes) s.textos.push({ nome: "Preço", t: "A cura de início de turno desta forma não funciona enquanto você paga o dano por turno." });
  }
  // a Bankai dura 1 minuto (10 turnos); peças de duração curta ou extra mudam isso
  const lib = f.estado.liberado;
  if (lib === "bankai" || lib === "bankai2") {
    const base = 10;
    const limite = s.duracao !== undefined && s.duracao > 0 ? Math.min(base, s.duracao) : base;
    s.duracao = limite + s.duracaoMais;
  } else if (s.duracao !== undefined && s.duracaoMais > 0) {
    s.duracao += s.duracaoMais;
  }
  return s;
}

/** Dano que os cartões da forma somam a uma habilidade: cada cartão entra uma vez, se vale para algum dos alvos dela. */
export function danoExtraDaAcao(forma: SomaForma | null | undefined, alvos: Alvo[], acao?: AcaoRef): { dados: string[]; fixo: number } {
  const out = { dados: [] as string[], fixo: 0 };
  for (const c of forma?.cartoesDano ?? []) {
    // cartão de característica ligado a uma ação: entra só nas ações a que está ligado
    if (c.lig) { if (!ligaCom(c.lig, acao)) continue; }
    else if (!c.em.some((a) => alvos.includes(a))) continue;
    if (c.dado) out.dados.push(c.dado);
    out.fixo += c.fixo;
  }
  return out;
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
    // o Shikai começa no nível 5 com 4 PP e chega ao máximo de 8 PP no nível 13
    case "shikai": return n < 5 ? 3 : Math.min(8, 4 + piso((n - 5) / 2));
    // Bankai e Resurrección: 18 PP no 10º nível (os modelos prontos custam de 11 a 18) e +1 a cada 2 níveis (23 no 20º).
    // Antes: 10 + (n − 10), que deixava os modelos fora do orçamento até o 11º–18º nível.
    case "bankai": return 18 + piso((n - 10) / 2) + (extra.plena ? 3 : 0);
    case "bankai2": return 17 + piso(n - 10);
    case "resurreccion": return 18 + piso((n - 10) / 2) + (extra.origem === "adjuchas" ? 2 : extra.origem === "vasto-lorde" ? 3 : 0);
    // Segunda Etapa: 13 PP no 15º nível (os modelos custam de 11 a 13) e +1 a cada 2 níveis (15 no 20º). Antes: 8 + (n − 15).
    case "segunda": return 13 + piso((n - 15) / 2);
    case "vollstandig": return 6 + 2 * piso((n - 13) / 5);
  }
}

/** Pontos extras que o Mestre concede a uma forma lendária (no máximo 12). */
export const PP_EXTRA_MAX = 12;

const teto = (v: number, max: number) => Math.min(v, max);

/** Preço em PP de um único efeito, no nível atual. Cada alvo a mais soma +50%. */
const devol = (x: number) => -Math.max(1, Math.ceil(x * 0.75));

export function custoEfeito(e: Efeito, ctx: CtxForma): number {
  // golpes, disparos e Hadō contam como um grupo só ("ataques armados, podendo ser kidōs"); cada outro alvo soma +50%
  const mais = (em: Alvo[], base: number) => Math.ceil(base * (1 + 0.5 * Math.max(0, new Set(em.map((x) => (ARMADOS.includes(x) ? "armado" : x))).size - 1)));
  switch (e.k) {
    // valores negativos são pontos fracos: devolvem 3/4 do que o mesmo bônus custaria
    case "atr": { const v = valor(e.v, ctx); return v < 0 ? devol(-v) : v; }
    case "cr": { const v = valor(e.v, ctx); return v < 0 ? devol(Math.ceil((2 * -v) / 3)) : Math.ceil((2 * v) / 3); }
    case "acerto": { const v = valor(e.v, ctx); return v < 0 ? devol(Math.ceil((2 * -v) / 3)) : mais(e.em, Math.ceil((2 * v) / 3)); }
    case "dano": { const v = valor(e.v, ctx); return v < 0 ? devol(Math.ceil(-v / 2.5)) : mais(e.em, Math.ceil(v / 2.5)); }
    case "dados": { const n = valor(e.n, ctx); return mais(e.em, Math.ceil((2 * n * e.d) / 8)); }
    case "cd": { const v = valor(e.v, ctx); return v < 0 ? devol(-v) : v; }
    case "ignoraRd": return mais(e.em, Math.ceil(valor(e.v, ctx) / 5));
    case "alcance": return mais(e.em, Math.ceil(valor(e.m, ctx) / 6));
    case "rd": { const b = Math.ceil(valor(e.v, ctx) / 2.5); return e.tipo === "fis" ? Math.ceil(b * 0.6) : b; }
    case "resist": return e.grau === "imune" ? 5 : e.grau === "vulner" ? -2 : 2;
    case "desloc": { const v = valor(e.v, ctx); return v < 0 ? devol(Math.ceil(-v / 3)) : Math.ceil(v / 3); }
    case "acoes": return e.tipo === "ataque" ? 4 : e.tipo === "bonus" ? 3 : 2;
    case "vant": return 1;
    case "gatilho": {
      const f = e.faz;
      const x = Math.max(valor(f.curaPv, ctx), valor(f.pvTemp, ctx), valor(f.prTemp, ctx), valor(f.pr, ctx));
      let base = 1 + Math.floor(x / Math.max(1, ctx.prof * 4));
      if (f.dano) { try { base += 1 + Math.floor(mediaRapida(f.dano.expr, ctx) / (ctx.prof * 5)); } catch { base += 1; } }
      if (f.condicao) base += 1;
      if (e.quando === "inicioTurno") base += 1;
      return e.limite ? Math.max(1, Math.ceil(base * 0.7)) : base;
    }
    case "custo": return -Math.min(3, Math.ceil(valor(e.pr, ctx) / 2));
    case "fim": return e.esgotado === "longo" ? -3 : -2;
    case "duracao": return valor(e.turnos, ctx) <= ctx.prof ? -2 : 0;
    case "texto": return 1;
    case "frenesi": return e.nivel === "leve" ? -2 : e.nivel === "grande" ? -6 : -9;
    case "preco": return -Math.max(1, Math.min(9, Math.floor(e.pp)));
    case "duracaoMais": return Math.max(1, Math.ceil(valor(e.turnos, ctx) / 3));
    case "gera": case "liga": return 0;
    case "invoca": {
      const max = Math.max(1, Math.min(10, Math.floor(valor(e.max, ctx))));
      const pv = Math.max(1, valor(e.pv, ctx));
      return 1 + Math.ceil(max / 2) + (e.dano ? 1 + Math.floor(mediaRapida(e.dano, ctx) / (ctx.prof * 4)) : 0) + Math.floor(pv / Math.max(1, ctx.prof * 5));
    }
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
  // técnica e interação especial não custam PP (só vaga); o preço de ficha antiga fica guardado em `pp`
  if (p.familia === "tecnica" || p.familia === "interacao") return 0;
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
/** Custo líquido (gasto menos o que os pontos fracos devolvem) de um conjunto de peças, na mesma conta do orçamento da forma. */
export function liquidoPecas(pecas: InstEfeito[], total: number, ctx: CtxForma): number {
  let gasto = 0, devolucao = 0, frenesiDev = 0;
  for (const p of pecas) {
    const c = custoPeca(p, ctx);
    if (p.efeitos.some((e) => e.k === "frenesi" || e.k === "preco")) { if (c < 0) frenesiDev = Math.min(Math.min(9, total), frenesiDev + -c); else gasto += c; continue; }
    if (c >= 0) gasto += c; else devolucao += -c;
  }
  return Math.ceil(gasto - Math.min(devolucao, Math.floor(total / 3)) - frenesiDev);
}

/** Limite de uso e requisito viram ponto fraco: 1 por cena +1, por descanso curto +2, por descanso longo +3, requisito +1 (no máximo 4 no total). O golpe reforçado já tem a sua troca. */
export function devolucaoLimites(habs: { limite?: string; requisito?: string; especial?: unknown }[]): number {
  let t = 0;
  for (const h of habs) {
    if (h.especial) continue;
    t += h.limite === "longo" ? 3 : h.limite === "curto" ? 2 : h.limite === "cena" ? 1 : 0;
    if (h.requisito) t += 1;
  }
  return Math.min(4, t);
}

export function orcamentoDaForma(f: Ficha, tipo: FormaLib["tipo"], forma: FormaLib | undefined, ctx: CtxForma): Orcamento {
  const extraMestre = Math.max(0, Math.min(PP_EXTRA_MAX, Math.floor(Number(forma?.ppExtra) || 0)));
  // Poder da Forma do Hōgyoku (estágio 3): só a forma mais forte; junto com os pontos do Mestre, o limite é o mesmo (12)
  const extraHogyoku = ppExtraDaForma(f, tipo);
  const total = orcamentoBase(tipo, ctx.n, { plena: tipo === "bankai" && f.treinos.caminhoBankai === "plena", origem: f.origem }) + Math.min(PP_EXTRA_MAX, extraMestre + extraHogyoku);
  let gasto = 0;
  let devolucao = 0;
  const avisos: string[] = [];
  if (extraHogyoku > 0) avisos.push(`Poder da Forma do Hōgyoku: +${extraHogyoku} PP (limite de ${PP_EXTRA_MAX} extras junto com os do Mestre).`);
  let frenesiDev = 0;
  const somar = (p: InstEfeito, fator: number) => {
    const c = custoPeca(p, ctx) * fator;
    if (p.efeitos.some((e) => e.k === "frenesi" || e.k === "preco")) { if (c < 0) frenesiDev = Math.min(Math.min(9, total), frenesiDev + -c); else gasto += c; return; }
    if (c >= 0) gasto += c; else devolucao += -c;
  };
  for (const p of forma?.efeitos ?? []) somar(p, 1);
  if (tipo === "bankai" && forma?.herdaShikai) for (const p of f.formas.shikai?.efeitos ?? []) somar(p, 0.5);
  const todas = [...(forma?.efeitos ?? [])];
  if (todas.some((p) => p.efeitos.some((e) => e.k === "duracao")) && todas.some((p) => p.efeitos.some((e) => e.k === "duracaoMais"))) avisos.push("Duração curta e duração extra na mesma forma se anulam: escolha só uma.");
  const dLim = devolucaoLimites(forma?.habilidades ?? []);
  if (dLim) { devolucao += dLim; avisos.push(`Habilidades com limite de uso devolvem ${dLim} PP como ponto fraco.`); }
  const devolvido = Math.min(devolucao, Math.floor(total / 3));
  if (devolucao > devolvido) avisos.push(`Os pontos fracos devolvem no máximo ${devolvido} PP (um terço do total).`);
  const liquido = Math.ceil(gasto - devolvido - frenesiDev);
  if (liquido > total) avisos.push(`Passou ${liquido - total} PP do que a forma permite no nível ${ctx.n}.`);
  return { total, gasto: liquido, devolvido: devolvido + frenesiDev, livre: total - liquido, avisos };
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

/** Quantas peças e cartões uma forma aceita ao ler uma ficha (antes eram 24). */
export const LIMITE_PECAS = 60;

/** Limpa o que veio de um arquivo ou de uma ficha antiga: tipos desconhecidos saem e valores soltos viram 0. */
export function normalizarEfeitos(raw: unknown): InstEfeito[] {
  if (!Array.isArray(raw)) return [];
  const ok = new Set(["atr", "cr", "acerto", "dano", "dados", "cd", "ignoraRd", "alcance", "rd", "resist", "desloc", "acoes", "vant", "gatilho", "custo", "fim", "duracao", "texto", "invoca", "frenesi", "preco", "duracaoMais", "gera", "liga"]);
  const alvos = new Set(ALVOS.map((a) => a.id));
  const num = (v: unknown): Num => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && /^[\[\]A-Z0-9+\-*/(). ]{1,40}$/.test(v) ? v : 0);
  const lista = (v: unknown): Alvo[] => (Array.isArray(v) ? (v.filter((x) => typeof x === "string" && alvos.has(x as Alvo)) as Alvo[]) : []);
  return raw.slice(0, LIMITE_PECAS).flatMap((p): InstEfeito[] => {
    if (!p || typeof p !== "object") return [];
    const o = p as Partial<InstEfeito>;
    // peças dos cartões novos guardam a duração inteira ("até o fim do próximo turno do alvo"); as peças de poder antigas e dos modelos oficiais seguem cortando em 30, como sempre
    const duracaoMax = o.familia === "carac" || o.familia === "efeito" || o.familia === "tecnica" || o.familia === "interacao" ? 60 : 30;
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
        case "preco": return [{ k, pp: Math.max(1, Math.min(9, Math.floor(Number(x.pp) || 1))), texto: String(x.texto ?? "").slice(0, 300), autoDano: x.autoDano === undefined ? undefined : num(x.autoDano) }];
        case "duracaoMais": return [{ k, turnos: num(x.turnos) }];
        case "gera": {
          const bt = (x.botao && typeof x.botao === "object" ? x.botao : {}) as Record<string, unknown>;
          const faz = bt.faz === "trocar" || bt.faz === "absorver" || bt.faz === "texto" ? bt.faz : "invocar";
          return [{ k, botao: { rotulo: String(bt.rotulo ?? "").slice(0, 60), ritmo: bt.ritmo === "bonus" || bt.ritmo === "reacao" ? bt.ritmo : "acao", faz, ref: typeof bt.ref === "string" ? bt.ref.slice(0, 40) : undefined } }];
        }
        case "liga": return [{ k, com: String(x.com ?? "").slice(0, 40), faz: String(x.faz ?? "").slice(0, 120) }];
        case "frenesi": return [{ k, nivel: x.nivel === "total" ? "total" : x.nivel === "grande" ? "grande" : "leve" }];
        case "invoca": return [{ k, nome: String(x.nome ?? "Invocação").slice(0, 40), tipo: x.tipo === "clone" ? "clone" : "invocacao", max: num(x.max), pv: num(x.pv), cr: num(x.cr), acerto: num(x.acerto), dano: typeof x.dano === "string" && /^[\[\]A-Z0-9d+\-*/(). ]{0,40}$/.test(x.dano) ? x.dano : "", custoPr: num(x.custoPr), texto: typeof x.texto === "string" ? x.texto.slice(0, 300) : undefined }];
        case "gatilho": {
          const q = x.quando as Quando;
          if (!(q in QUANDO_NOME)) return [];
          const z = (x.faz && typeof x.faz === "object" ? x.faz : {}) as Record<string, unknown>;
          const faz: Faz = {};
          if (z.curaPv !== undefined) faz.curaPv = num(z.curaPv);
          if (z.pvTemp !== undefined) faz.pvTemp = num(z.pvTemp);
          if (z.prTemp !== undefined) faz.prTemp = num(z.prTemp);
          if (z.pr !== undefined) faz.pr = num(z.pr);
          if (z.autoDano !== undefined) faz.autoDano = num(z.autoDano);
          if (typeof z.texto === "string") faz.texto = z.texto.slice(0, 300);
          const cd = z.condicao as { nome?: unknown; salva?: unknown; duracao?: unknown } | undefined;
          if (cd && typeof cd.nome === "string" && cd.nome.trim()) faz.condicao = { nome: cd.nome.slice(0, 30), salva: ATRIBUTOS.includes(cd.salva as Atr) ? (cd.salva as Atr) : undefined, duracao: typeof cd.duracao === "string" ? cd.duracao.slice(0, duracaoMax) : undefined };
          const d = z.dano as { expr?: unknown; tipo?: unknown; area?: unknown } | undefined;
          if (d && typeof d.expr === "string" && /^[\[\]A-Z0-9d+\-*/(). ]{1,40}$/.test(d.expr)) faz.dano = { expr: d.expr, tipo: String(d.tipo ?? "").slice(0, 30), area: typeof d.area === "string" ? d.area.slice(0, 40) : undefined };
          return [{ k, quando: q, limite: x.limite === "turno" || x.limite === "rodada" || x.limite === "cena" ? x.limite : undefined, faz, rotulo: typeof x.rotulo === "string" ? x.rotulo.slice(0, 80) : undefined }];
        }
      }
      return [];
    });
    return [{ id: String(o.id ?? Math.random().toString(36).slice(2, 9)).slice(0, 40), preset: typeof o.preset === "string" ? o.preset : undefined, nome: String(o.nome ?? "Efeito").slice(0, 80), texto: typeof o.texto === "string" ? o.texto.slice(0, 300) : undefined, efeitos, pp: typeof o.pp === "number" && Number.isFinite(o.pp) ? Math.max(-3, Math.min(20, Math.round(o.pp))) : undefined, confirmado: o.confirmado === true, ...extrasDoCartao(o) }];
  });
}

const SUBS_OK = ["ataque", "area", "cura", "movimento"];
const curto = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);

/** Campos dos cartões de característica e de efeito (opcionais; peça de poder antiga não tem nenhum). */
function extrasDoCartao(o: Partial<InstEfeito>): Partial<InstEfeito> {
  const out: Partial<InstEfeito> = {};
  if (o.familia === "carac" || o.familia === "efeito" || o.familia === "tecnica" || o.familia === "interacao") out.familia = o.familia;
  const sp = o.espec as unknown as Record<string, unknown> | undefined;
  if ((o.familia === "tecnica" || o.familia === "interacao") && sp && typeof sp === "object" && typeof sp.id === "string" && sp.id) {
    out.espec = { id: sp.id.slice(0, 40), ...(typeof sp.tec === "string" && sp.tec ? { tec: sp.tec.slice(0, 40) } : {}), ...(sp.auto === true ? { auto: true } : {}), ...(sp.antiga === true ? { antiga: true } : {}), ...(sp.legado === true || (sp.antiga !== true && sp.auto !== true && typeof o.pp === "number" && o.pp > 0) ? { legado: true } : {}) };
  } else if (o.familia === "tecnica" || o.familia === "interacao") delete out.familia;
  const c = o.carac as unknown as Record<string, unknown> | undefined;
  if (c && typeof c === "object" && typeof c.id === "string" && c.id) {
    const esc = c.escolha as Record<string, unknown> | undefined;
    out.carac = {
      id: c.id.slice(0, 40),
      vale: Array.isArray(c.vale) ? (c.vale.filter((x) => SUBS_OK.includes(x as string)) as DadosCarac["vale"]) : [],
      liga: c.liga === "final" || c.liga === "uma" ? c.liga : "todas",
      ...(typeof c.acao === "string" ? { acao: c.acao.slice(0, 40) } : {}),
      ...(esc && typeof esc === "object" ? { escolha: { condicao: curto(esc.condicao, 30), tipo: curto(esc.tipo, 30), n: typeof esc.n === "number" && Number.isFinite(esc.n) ? esc.n : undefined } } : {}),
      ...(Array.isArray(c.requer) ? { requer: c.requer.filter((x): x is string => typeof x === "string").slice(0, 6).map((x) => x.slice(0, 40)) } : {}),
    };
  }
  const n = o.efeitoNeutro as unknown as Record<string, unknown> | undefined;
  if (n && typeof n === "object") {
    const cd = n.condicao as { nome?: unknown; salva?: unknown; duracao?: unknown } | undefined;
    out.efeitoNeutro = {
      forca: n.forca === "medio" || n.forca === "forte" ? n.forca : "leve",
      modo: n.modo === "pronta" ? "pronta" : "livre",
      texto: curto(n.texto, 400),
      ...(cd && typeof cd.nome === "string" && cd.nome.trim() ? { condicao: { nome: cd.nome.slice(0, 30), salva: ATRIBUTOS.includes(cd.salva as Atr) ? (cd.salva as Atr) : undefined, duracao: curto(cd.duracao, 60) } } : {}),
      onde: curto(n.onde, 60),
      ...(n.modo === "pronta" ? {} : { aval: n.aval === "ok" ? ("ok" as const) : ("pendente" as const) }),
    };
  }
  return out;
}
