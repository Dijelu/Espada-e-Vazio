/* Cartões de ação: o dano de um cartão automático é calculado na hora da leitura, a partir do nível, do atributo e da ação.
   Assim a ficha nunca guarda um dano velho quando o nível ou o atributo mudam. */
import { calcular, type Atr, type Ficha, type FormaLib, type HabForma } from "./ficha";
import type { CtxForma } from "./efeitos-forma";
import { analisarDano, danoNoTeto, tipoDeAcao } from "./teto-dano";
import { habilidadesDaForma, resolverDano } from "./liberacoes";
import { EFEITOS_REACAO, EFEITOS_SEM_DANO, efeitoDaAcao, temEfeitoEscolhido } from "./acoes-efeito";
import type { CaracArmaId } from "./arma-forma";

/* ---------------- Tipos ---------------- */

/** Os cartões de ação: ataque, área, cura ou proteção e investida (com dano ou valor) e os dois sem dano, reação com efeito escolhido e ação sem dano. */
export type SubAcao = "ataque" | "area" | "cura" | "movimento" | "reacao" | "utilidade";
/** Quando a ação é usada. */
export type Ritmo = "acao" | "bonus" | "reacao";
/** Força de um cartão de efeito. */
export type Forca = "leve" | "medio" | "forte";
/**
 * Peça de poder (de sempre), cartão de característica (genérico), cartão de efeito, técnica especial ou interação especial.
 * Sem o campo, é peça de poder. Ação e característica se ligam de forma opcional; técnica e interação especial, de forma obrigatória.
 */
export type FamiliaCartao = "peca" | "carac" | "efeito" | "tecnica" | "interacao" | "fraco";

/** Dados de uma técnica especial ou de uma interação especial (ver especiais.ts). */
export interface DadosEspecial {
  /** id no catálogo de técnicas ou de interações */
  id: string;
  /** só na interação: id da peça (técnica especial da mesma forma) a que ela serve */
  tec?: string;
  /** interação posta sozinha ao abrir uma ficha antiga, para a técnica continuar funcionando (não ocupa vaga e não custa PP) */
  auto?: boolean;
  /** peça que veio de uma ficha antiga (os cartões de característica de antes): não ocupa vaga e não trava o salvamento */
  antiga?: boolean;
  /** ficha salva quando técnica e interação ainda custavam PP: o preço guardado continua valendo só nesta peça. Peças novas custam 0 PP. */
  legado?: boolean;
}

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
  /** cartão de cura ou proteção: o que ele faz */
  cura?: CuraTipo;
  /** cartão de cura ou proteção: atinge também os aliados em volta */
  emArea?: boolean;
  /** cartão de reação com efeito escolhido ou de ação sem dano: o id do efeito escolhido na lista (ver acoes-efeito.ts) */
  efeito?: string;
}

/** O que o cartão de cura ou proteção faz. */
export type CuraTipo = "pv" | "temp" | "reduz" | "barreira";

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

/** Cartão de ponto fraco leve, médio ou forte: um prejuízo pronto da faixa ou um texto livre que o Mestre aprova. Devolve pontos para a forma (leve 2, médio 4, forte 6; na Shikai 1, 2 e 4). */
export interface DadosFracoNeutro {
  forca: Forca;
  modo: "livre" | "pronta";
  /** id do prejuízo pronto (fracos-neutros.ts) */
  prejuizo?: string;
  /** o valor que o jogador digitou no prejuízo pronto que pede um tipo (ex.: o tipo de dano a que fica vulnerável) */
  param?: string;
  texto?: string;
  onde?: string;
  aval?: "pendente" | "ok";
  /** quanto o cartão devolve, guardado na criação (mudar a tabela não mexe nas fichas salvas) */
  devolve: number;
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
  /** características da arma de que o cartão precisa (basta uma). Sem o campo, qualquer arma serve. */
  armaReq?: CaracArmaId[];
}
export const SUBS: InfoSub[] = [
  { id: "ataque", nome: "Ataque", texto: "Um golpe contra um único alvo.", fator: 1, dano: true, ritmo: "acao" },
  { id: "area", nome: "Área", texto: "Atinge todas as criaturas numa área (salvaguarda de Destreza: metade do dano no sucesso).", fator: 0.85, dano: true, ritmo: "acao" },
  { id: "cura", nome: "Cura ou proteção", texto: "Cura, dá PV temporários ou reduz o dano sofrido por você ou por um aliado.", fator: 1, dano: false, ritmo: "acao" },
  { id: "movimento", nome: "Movimento e ataque", texto: "Você se move em linha reta e ataca no fim do deslocamento.", fator: 0.8, dano: true, ritmo: "acao", armaReq: ["contato", "corrente"] },
  { id: "reacao", nome: "Reação com efeito", texto: "Uma reação sem dano em que você escolhe o efeito: anular uma técnica, trocar de lugar, redirecionar um ataque…", fator: 0, dano: false, ritmo: "reacao" },
  { id: "utilidade", nome: "Ação sem dano", texto: "Controle, marca ou utilidade: prende, assusta, marca um alvo ou ajuda os aliados.", fator: 0, dano: false, ritmo: "acao" },
];
export const infoSub = (s: SubAcao) => SUBS.find((x) => x.id === s) ?? SUBS[0];

export interface InfoRitmo { id: Ritmo; nome: string; acao: string; pr: number }
/**
 * PR da ação: fixo por ritmo, valores pensados para ficar perto dos modelos do livro (ação 12, ação bônus 5, reação 6).
 * Vale para os cartões de ação novos e para os botões que as técnicas e interações especiais criam. O dano máximo do cartão continua escondido e não depende destes números.
 * Os cartões antigos (e os 47 modelos oficiais) guardam o PR deles e o teto de custo da conta de dano (20/8/10, em teto-dano.ts) não muda.
 */
export const RITMOS: InfoRitmo[] = [
  { id: "acao", nome: "Ação", acao: "Ação", pr: 12 },
  { id: "bonus", nome: "Ação bônus", acao: "Ação bônus", pr: 5 },
  { id: "reacao", nome: "Reação", acao: "Reação", pr: 6 },
];
export const infoRitmo = (r: Ritmo) => RITMOS.find((x) => x.id === r) ?? RITMOS[0];
export const ritmoDeAcao = (acao: string): Ritmo => tipoDeAcao(acao);

export interface InfoForca { id: Forca; nome: string; pp: number }
/** Preço dos cartões de efeito, em PP, de Bankai em diante (Bankai verdadeira, Resurrección, segunda etapa, Vollständig). */
export const FORCAS: InfoForca[] = [
  { id: "leve", nome: "Leve", pp: 2 },
  { id: "medio", nome: "Médio", pp: 4 },
  { id: "forte", nome: "Forte", pp: 6 },
];
/** A Shikai tem poucos PP, então os efeitos custam menos enquanto a forma for Shikai: leve 1, médio 2, forte 4. */
export const PP_FORCA_SHIKAI: Record<Forca, number> = { leve: 1, medio: 2, forte: 4 };
/** Preço em PP de um efeito (ou de uma condição de faixa) leve, médio ou forte na forma `tipo`. Sem o tipo, vale o preço cheio. */
export const ppDaForca = (f: Forca, tipo?: string): number => (tipo === "shikai" ? PP_FORCA_SHIKAI[f] : FORCAS.find((x) => x.id === f)!.pp);
/** As três forças com o preço certo para o tipo de forma (para a tela). */
export const forcasDoTipo = (tipo?: string): InfoForca[] => FORCAS.map((x) => ({ ...x, pp: ppDaForca(x.id, tipo) }));

/** Vagas especiais de cada forma: quantas técnicas especiais e quantas interações especiais ela aceita. Para mudar o número de uma forma, mude só esta tabela. */
export interface VagasEspeciais { tec: number; inter: number }
export const VAGAS_ESPECIAIS: Record<string, VagasEspeciais> = {
  shikai: { tec: 1, inter: 1 },
  bankai: { tec: 2, inter: 2 },
  /** Bankai verdadeira */
  bankai2: { tec: 3, inter: 3 },
  resurreccion: { tec: 3, inter: 3 },
  /** segunda etapa */
  segunda: { tec: 3, inter: 3 },
  vollstandig: { tec: 2, inter: 2 },
  /** Máscara Hollow do Visored (ainda não tem montagem própria; a conta já fica pronta) */
  mascara: { tec: 2, inter: 2 },
};
export const vagasEspeciais = (tipo: string): VagasEspeciais => VAGAS_ESPECIAIS[tipo] ?? { tec: 1, inter: 1 };

/**
 * Quantas características da arma cada forma pode marcar (a variedade da arma cresce com a forma).
 * A Vollständig tem arma só se o jogador quiser (Arma Espiritual ou canalizador). Para mudar um limite, mude só esta tabela.
 */
export const LIMITE_CARACS_ARMA: Record<string, number> = {
  shikai: 2,
  bankai: 4,
  /** Bankai verdadeira */
  bankai2: 6,
  resurreccion: 4,
  /** segunda etapa */
  segunda: 6,
  vollstandig: 4,
};
export const limiteCaracsArma = (tipo: string): number => LIMITE_CARACS_ARMA[tipo] ?? 0;

/** Quantas técnicas finais cabem numa forma (vaga extra, fora do limite das ações normais). */
export const LIMITE_FINAL = 1;
/** Técnicas finais por forma: 2 na Bankai Verdadeira e na Segunda Etapa, 1 nas demais. */
export const limiteFinal = (tipo: string): number => (tipo === "bankai2" || tipo === "segunda" ? 2 : LIMITE_FINAL);
export const qtdFinais = (habs: HabForma[]) => habs.filter((h) => h.cartao?.final).length;

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
  return SUBS.some((s) => s.id === o.sub) && RITMOS.some((r) => r.id === o.ritmo) && typeof o.atr === "string" && (o.efeito === undefined || typeof o.efeito === "string");
}

/** Números do personagem sem a forma ligada (é com eles que o dano do cartão é conferido). */
export function ctxDaForma(f: Ficha, tipo: string): CtxForma {
  const k = calcular({ ...f, estado: { ...f.estado, liberado: "" } });
  return { n: f.nivel, prof: k.prof, atr: k.atr, tipo };
}

/** Cartão feito pelos cartões de ação (não o antigo só marcado): dano por tipo de ação e custo fixo por ritmo. */
export const ehCartaoNovo = (h: Pick<HabForma, "cartao">) => !!h.cartao && !h.cartao.migrado;

/** Dano do cartão: se for automático, vem sempre pronto para a ação; senão, é o que está guardado. */
export function danoDoCartao(h: HabForma, ctx: CtxForma, ppExtra = false): string | undefined {
  if (!h.auto || h.fixa) return h.dano;
  const fator = ehCartaoNovo(h) ? infoSub(h.cartao!.sub).fator : 1;
  return danoNoTeto(h.acao, ctx, h.auto, ppExtra, h.especial ?? false, fator) ?? h.dano;
}

/** O cartão como deve ser lido: com o dano calculado agora e o custo em PR (fixo pelo ritmo nos cartões novos; pelo dano nos antigos). */
export function cartaoLido(h: HabForma, ctx: CtxForma, ppExtra = false): HabForma {
  if (h.fixa) return h;
  const dano = danoDoCartao(h, ctx, ppExtra);
  if (ehCartaoNovo(h)) {
    const pr = infoRitmo(ritmoDeAcao(h.acao)).pr;
    return { ...h, ...(dano ? { dano } : {}), pr, custo: `${pr} PR` };
  }
  if (!h.auto || !dano) return h;
  const a = analisarDano(dano, h.acao, ctx, ppExtra, h.especial ?? false);
  return { ...h, dano, ...(a ? { pr: a.custoPr, custo: `${a.custoPr} PR` } : {}) };
}

/** Aplica uma mudança feita na tela a uma habilidade e refaz o custo em PR do jeito certo para o tipo de cartão. */
export function aplicarMudanca(h: HabForma, p: Partial<HabForma>, ctx: CtxForma, ppExtra = false): HabForma {
  const n = { ...h, ...p };
  if (ehCartaoNovo(n)) {
    // a reação com efeito escolhido é sempre uma reação
    if (n.cartao!.sub === "reacao") n.acao = infoRitmo("reacao").acao;
    const ritmo = ritmoDeAcao(n.acao);
    const pr = infoRitmo(ritmo).pr;
    return { ...n, cartao: { ...n.cartao!, ritmo }, pr, custo: `${pr} PR` };
  }
  // com dano em dados, o custo em PR sai do dano
  if ("dano" in p || "acao" in p || "especial" in p) {
    const a = analisarDano(n.dano, n.acao, ctx, ppExtra, n.especial ?? false);
    if (a) { n.pr = a.custoPr; n.custo = `${a.custoPr} PR`; }
  }
  return n;
}

/** Quantas vagas normais as habilidades ocupam (a técnica final fica numa vaga extra). */
export const vagasUsadas = (habs: HabForma[]) => habs.filter((h) => !h.cartao?.final).length;
/** A forma já tem a sua técnica final? */
export const temFinal = (habs: HabForma[]) => habs.some((h) => h.cartao?.final);

/** Dano já com os números do personagem (10d12+5). */
export const danoResolvido = (expr: string, ctx: CtxForma) => resolverDano(expr, { nivel: ctx.n } as never, { prof: ctx.prof, atr: ctx.atr } as never);

/* ---------------- Montar a habilidade a partir de um cartão de ação ---------------- */

export interface OpcoesAcao {
  ritmo: Ritmo;
  final?: boolean;
  /** atributo do bônus do dano (ESP, FOR, DES ou MEN) */
  atr: string;
  cura?: CuraTipo;
  emArea?: boolean;
  /** reação com efeito escolhido e ação sem dano: id do efeito na lista (sem ele, vale o primeiro) */
  efeito?: string;
}

export { EFEITOS_REACAO, EFEITOS_SEM_DANO };

export const CURAS: { id: CuraTipo; nome: string }[] = [
  { id: "pv", nome: "Cura (recupera PV)" },
  { id: "temp", nome: "PV temporários" },
  { id: "reduz", nome: "Reduz o dano sofrido" },
  { id: "barreira", nome: "Barreira (anula 1 ataque)" },
];

/** O que um cartão de cura ou proteção faz, lido do cartão novo ou do nome do cartão antigo. */
const CURA_DO_MODELO: Record<string, { cura: CuraTipo; emArea?: boolean }> = {
  Defesa: { cura: "reduz" }, Barreira: { cura: "barreira" }, "Proteção": { cura: "temp" }, "Regeneração": { cura: "pv" }, "Cura em área": { cura: "pv", emArea: true },
};
const AREA_DO_MODELO = new Set(["Golpe em área", "Explosão final"]);

/**
 * O valor da ação com o rótulo certo para o tipo do cartão: ataque e investida "Dano", área "Dano por alvo",
 * cura "Cura", PV temporário "PV temporário", redução "Reduz", barreira "Barreira". `valor` é a fórmula já com os números (ou vazio).
 * Vale também para os cartões antigos, pelo nome do cartão de onde saíram.
 */
export function rotuloDoValor(h: Pick<HabForma, "cartao" | "modelo">, valor?: string): { rotulo: string; valor: string } {
  const antigo = h.modelo ? CURA_DO_MODELO[h.modelo] : undefined;
  const cura = h.cartao?.sub === "cura" ? h.cartao.cura ?? antigo?.cura ?? "pv" : h.cartao ? undefined : antigo?.cura;
  const emArea = h.cartao?.sub === "cura" ? !!h.cartao.emArea : !!antigo?.emArea;
  if (h.cartao && temEfeitoEscolhido(h.cartao.sub)) return { rotulo: "Efeito:", valor: efeitoDaAcao(h.cartao.sub, h.cartao.efeito).nome };
  const v = valor ?? "";
  const por = emArea ? " por alvo" : "";
  if (cura === "barreira") return { rotulo: "Barreira", valor: "1 (anula 1 ataque)" };
  if (cura === "reduz") return { rotulo: "Reduz", valor: v };
  if (cura === "temp") return { rotulo: `PV temporário${por}:`, valor: v };
  if (cura === "pv") return { rotulo: `Cura${por}:`, valor: v };
  const area = h.cartao ? h.cartao.sub === "area" : !!h.modelo && AREA_DO_MODELO.has(h.modelo);
  return { rotulo: area ? "Dano por alvo:" : "Dano:", valor: v };
}

/** O que o cartão faz no jogo (a "regra do cartão"). */
export function regraDaAcao(sub: SubAcao, o: Pick<OpcoesAcao, "cura" | "emArea"> & { efeito?: string }): string {
  if (temEfeitoEscolhido(sub)) return efeitoDaAcao(sub, o.efeito).texto;
  if (sub === "ataque") return "Um ataque contra um único alvo. Causa o dano indicado.";
  if (sub === "area") return "Atinge criaturas numa área de 6 metros de raio. Salvaguarda de Destreza (CD 8 + proficiência + atributo): dano na falha, metade no sucesso.";
  if (sub === "movimento") return "Você se move em linha reta até 12 metros e ataca no fim do deslocamento. Quem estiver no caminho faz salvaguarda de Destreza ou cai no chão.";
  const raio = o.emArea ? "6 metros" : "3 metros";
  switch (o.cura ?? "pv") {
    case "temp": return o.emArea ? "Você e os aliados a até 6 metros ganham PV temporários na quantidade indicada." : "Você ou um aliado a até 3 metros ganha PV temporários na quantidade indicada.";
    case "reduz": return "Reduz o dano sofrido por você ou por um aliado a 3 metros na quantidade indicada.";
    case "barreira": return "Cria uma barreira que reduz a zero o dano de um único ataque contra você ou contra um aliado a 3 metros. A barreira some depois.";
    default: return o.emArea ? `Você e os aliados a até ${raio} recuperam os PV indicados.` : `Você ou um aliado a até ${raio} recupera os PV indicados.`;
  }
}

const NOME_PADRAO: Record<SubAcao, string> = { ataque: "Ataque", area: "Golpe em área", cura: "Cura", movimento: "Investida", reacao: "Reação com efeito", utilidade: "Ação sem dano" };
/** Nome sugerido da habilidade nova: no cartão de cura ou proteção, o nome segue o que ele faz. */
const nomeSugerido = (sub: SubAcao, o: Pick<OpcoesAcao, "cura" | "emArea"> & { efeito?: string }) => (temEfeitoEscolhido(sub) ? efeitoDaAcao(sub, o.efeito).nome : sub !== "cura" ? NOME_PADRAO[sub] : o.cura === "reduz" ? "Defesa" : o.cura === "barreira" ? "Barreira" : o.cura === "temp" ? "Proteção" : o.emArea ? "Cura em área" : "Cura");
/** Nome interno do cartão (o que as regras de dano e de cura reconhecem). */
const MODELO_DA_ACAO = (sub: SubAcao, o: Pick<OpcoesAcao, "cura">) => (sub === "cura" ? (o.cura === "reduz" ? "Defesa" : o.cura === "barreira" ? "Barreira" : o.cura === "temp" ? "Proteção" : "Regeneração") : NOME_PADRAO[sub]);

/** Monta a habilidade nova a partir de um cartão de ação: o dano já vem pronto e o jogador só escreve a descrição. */
export function novaHabilidade(sub: SubAcao, o: OpcoesAcao, ctx: CtxForma, ppExtra = false): HabForma {
  const ritmo: Ritmo = o.final ? "acao" : sub === "reacao" ? "reacao" : o.ritmo;
  const r = infoRitmo(ritmo);
  const regra = regraDaAcao(sub, o);
  const cartao: CartaoAcao = { sub, ritmo, atr: o.atr, ...(o.final ? { final: true } : {}), ...(sub === "cura" ? { cura: o.cura ?? "pv", ...(o.emArea ? { emArea: true } : {}) } : {}), ...(temEfeitoEscolhido(sub) ? { efeito: efeitoDaAcao(sub, o.efeito).id } : {}) };
  const base: HabForma = { id: "", nome: o.final ? "Técnica final" : nomeSugerido(sub, o), texto: regra, custo: `${r.pr} PR`, acao: r.acao, pr: r.pr, modelo: MODELO_DA_ACAO(sub, o), regra, desc: "", cartao };
  // reação com efeito escolhido e ação sem dano: sem número, o efeito está na regra do cartão
  if (temEfeitoEscolhido(sub)) return { ...base, modelo: NOME_PADRAO[sub] };
  if (infoSub(sub).dano) {
    const h = { ...base, auto: o.atr };
    const dano = danoDoCartao(h, ctx, ppExtra);
    return { ...h, ...(dano ? { dano } : {}) };
  }
  const cura = o.cura ?? "pv";
  return { ...base, ...(cura === "barreira" ? {} : { dano: cura === "reduz" ? "2d10+[PROF]" : "[NIV]" }) };
}

/** Habilidades da forma como devem ser lidas na ficha, na mesa e no painel (cartões automáticos com o dano em dia). */
export function habilidadesLidas(forma: FormaLib, f: Ficha): HabForma[] {
  const lista = habilidadesDaForma(forma);
  if (!lista.some((h) => (h.auto || ehCartaoNovo(h)) && !h.fixa)) return lista;
  const ctx = ctxDaForma(f, forma.tipo);
  const aval = (forma.ppExtra ?? 0) > 0;
  return lista.map((h) => cartaoLido(h, ctx, aval));
}
