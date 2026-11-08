/* Cartões de característica da forma (genéricos): poderes que se ligam, de forma opcional, a uma ação (a técnica final, uma ação escolhida ou todas as compatíveis).
   Cada um vira uma peça de efeitos (`compilar`) e custa Pontos de Poder da forma, como as peças de poder de sempre.
   Os cartões que criam botões, invocações e sinergias (clones, invocação, marcar…) são técnicas e interações especiais: ver especiais.ts. */
import { custoEfeito, type CtxForma, type Efeito, type InstEfeito } from "./efeitos-forma";
import type { DadosCarac, SubAcao } from "./cartoes";
import { DURACAO_FORCA, LIMITE_FORCA, faixaDaCondicao } from "./faixas-condicao";
import { ppDaForca } from "./cartoes";
import type { HabForma } from "./ficha";

export type Liga = DadosCarac["liga"];
export type GrupoCarac = "Ofensiva" | "Controle" | "Apoio" | "Forma";
export const GRUPOS_CARAC: GrupoCarac[] = ["Ofensiva", "Controle", "Apoio", "Forma"];

/** O que o jogador escolhe ao adicionar. */
export interface ParamsCarac {
  /** quantidade (dados, dano fixo…) */
  n?: number;
  /** dado (4 a 12) */
  d?: number;
  /** elemento ou tipo de dano */
  tipo?: string;
  /** condição escolhida */
  condicao?: string;
}

export interface DefCarac {
  id: string;
  nome: string;
  grupo: GrupoCarac;
  texto: string;
  /** tipos de ação em que o cartão pode ser ligado. Vazio: vale para a forma toda e não se liga a ação. */
  vale: SubAcao[];
  /** o que o jogador escolhe ao adicionar */
  param?: "dados" | "dano" | "tipo" | "condicao";
  rotuloParam?: string;
  /** ids de outros cartões de característica que precisam estar na forma */
  requer?: string[];
  /** só pode entrar uma vez */
  unica?: boolean;
  /** preço em PP */
  pp: (p: ParamsCarac, ctx: CtxForma) => number;
  /** efeitos que a característica dá à forma */
  compilar: (p: ParamsCarac, ctx: CtxForma) => Efeito[];
}

const clamp = (v: number | undefined, min: number, max: number, pad: number) => Math.max(min, Math.min(max, Math.floor(Number.isFinite(v as number) ? (v as number) : pad)));
const TEC = ["tecnica"] as const;
const dadosDe = (p: ParamsCarac) => ({ n: clamp(p.n, 1, 4, 1), d: [4, 6, 8, 10, 12].includes(p.d ?? 0) ? (p.d as number) : 8 });
const texto = (t: string): Efeito => ({ k: "texto", t });

/** Catálogo de características neutras. */
export const CARACS: DefCarac[] = [
  {
    id: "dados-extras", nome: "Dados extras", grupo: "Ofensiva", vale: ["ataque", "area", "movimento"], param: "dados", rotuloParam: "Dados de dano a mais",
    texto: "A ação ligada causa dados de dano a mais. Pode passar do teto de dano da ação.",
    pp: (p, ctx) => { const { n, d } = dadosDe(p); return custoEfeito({ k: "dados", em: [...TEC], n, d }, ctx); },
    compilar: (p) => { const { n, d } = dadosDe(p); return [{ k: "dados", em: [...TEC], n, d }]; },
  },
  {
    id: "dano-fixo", nome: "Dano fixo", grupo: "Ofensiva", vale: ["ataque", "area", "movimento"], param: "dano", rotuloParam: "Dano fixo a mais",
    texto: "A ação ligada causa uma quantidade fixa de dano a mais.",
    pp: (p, ctx) => custoEfeito({ k: "dano", em: [...TEC], v: clamp(p.n, 1, 30, 4) }, ctx),
    compilar: (p) => [{ k: "dano", em: [...TEC], v: clamp(p.n, 1, 30, 4) }],
  },
  {
    id: "atravessa", nome: "Atravessa", grupo: "Ofensiva", vale: ["ataque", "movimento"],
    texto: "O golpe ignora parte da armadura: ignora 5 de redução de dano do alvo.",
    pp: () => 2, compilar: () => [texto("Atravessa: o golpe da ação ligada ignora 5 de redução de dano do alvo.")],
  },
  {
    id: "alcance", nome: "Alcance", grupo: "Ofensiva", vale: ["ataque", "area", "cura"],
    texto: "A ação ligada alcança mais longe: +6 metros.",
    pp: () => 1, compilar: () => [texto("Alcance: a ação ligada alcança 6 metros a mais.")],
  },
  {
    id: "golpe-duplo", nome: "Golpe duplo", grupo: "Ofensiva", vale: ["ataque", "movimento"],
    texto: "Dois golpes seguidos: contra o mesmo alvo ou contra dois alvos a 3 metros um do outro. O dano é dividido entre os alvos.",
    pp: () => 2, compilar: () => [texto("Golpe duplo: a ação ligada atinge dois alvos a 3 metros um do outro (ou o mesmo alvo duas vezes) e divide o dano entre eles.")],
  },
  {
    id: "empurrao", nome: "Empurrão", grupo: "Controle", vale: ["ataque", "movimento"],
    texto: "Empurra o alvo 6 metros. Se ele bater em algo sólido, sofre 1d6 de dano.",
    pp: () => 1, compilar: () => [texto("Empurrão: o alvo atingido pela ação ligada é empurrado 6 metros; se bater em algo sólido, sofre 1d6 de dano.")],
  },
  {
    id: "explosao", nome: "Explosão em volta", grupo: "Ofensiva", vale: ["area"],
    texto: "A área vira um raio de 9 metros em volta de você. Em troca, você fica sem reação até o início do seu próximo turno.",
    pp: () => 1, compilar: () => [texto("Explosão em volta: a área da ação ligada tem 9 metros de raio e sai de você; você fica sem reação até o início do seu próximo turno.")],
  },
  {
    id: "area-ampliada", nome: "Área ampliada", grupo: "Ofensiva", vale: ["area"],
    texto: "A área da ação fica maior: o raio vai de 6 para 12 metros.",
    pp: () => 2, compilar: () => [texto("Área ampliada: a área da ação ligada tem 12 metros de raio, em vez de 6.")],
  },
  {
    id: "linha", nome: "Linha", grupo: "Ofensiva", vale: ["ataque"],
    texto: "O golpe vira um corte em linha de 12 metros: atinge todos no caminho (salvaguarda de Destreza: metade do dano no sucesso).",
    pp: () => 2, compilar: () => [texto("Linha: a ação ligada atinge todas as criaturas numa linha de 12 metros (salvaguarda de Destreza: metade do dano no sucesso).")],
  },
  {
    id: "critico-ampliado", nome: "Crítico ampliado", grupo: "Ofensiva", vale: ["ataque", "movimento"],
    texto: "A ação ligada acerta crítico com 19 ou 20.",
    pp: () => 2, compilar: () => [texto("Crítico ampliado: a ação ligada acerta crítico com 19 ou 20.")],
  },
  {
    id: "condicao-acerto", nome: "Condição no acerto", grupo: "Controle", vale: ["ataque", "area", "movimento"], param: "condicao", rotuloParam: "Condição que o alvo recebe",
    texto: "Ao acertar com a ação ligada, o alvo recebe uma condição pronta (salvaguarda de Constituição). O preço e o limite de uso vêm da faixa da condição.",
    pp: (p, ctx) => ppDaForca(faixaDaCondicao(p.condicao ?? "Preso"), ctx.tipo),
    compilar: (p) => {
      const cond = p.condicao ?? "Preso";
      const fx = faixaDaCondicao(cond);
      return [{ k: "gatilho", quando: "acerto", limite: LIMITE_FORCA[fx], faz: { condicao: { nome: cond, salva: "con", duracao: DURACAO_FORCA[fx] } }, rotulo: `Aplicar ${cond}` }];
    },
  },
  {
    id: "cura-no-acerto", nome: "Cura no acerto", grupo: "Apoio", vale: ["ataque", "movimento"],
    texto: "Uma vez por turno, ao acertar com a ação ligada, você recupera PV iguais à proficiência.",
    pp: () => 2, compilar: () => [{ k: "gatilho", quando: "acerto", limite: "turno", faz: { curaPv: "[PROF]" }, rotulo: "Cura no acerto" }],
  },
  {
    id: "pr-no-acerto", nome: "Reiatsu no acerto", grupo: "Apoio", vale: ["ataque", "movimento"],
    texto: "Uma vez por turno, ao acertar com a ação ligada, você recupera PR iguais à proficiência.",
    pp: () => 2, compilar: () => [{ k: "gatilho", quando: "acerto", limite: "turno", faz: { pr: "[PROF]" }, rotulo: "Reiatsu no acerto" }],
  },
  {
    id: "aura", nome: "Aura", grupo: "Forma", vale: [], param: "tipo", rotuloParam: "Elemento da aura",
    texto: "No início do seu turno, criaturas a 3 metros sofrem dano da aura (proficiência d6 do elemento escolhido).",
    pp: () => 3, compilar: (p) => [{ k: "gatilho", quando: "inicioTurno", faz: { dano: { expr: "[PROF]d6", tipo: p.tipo?.trim() || "Energia", area: "criaturas a 3 m de você" } }, rotulo: `Aura${p.tipo?.trim() ? ` de ${p.tipo.trim()}` : ""}` }],
  },

];

export const caracPorId = (id: string) => CARACS.find((c) => c.id === id);

/** Nome do cartão como aparece na lista (com a escolha do jogador). */
export function nomeDaCarac(def: DefCarac, p: ParamsCarac): string {
  if (def.param === "dados") { const { n, d } = dadosDe(p); return `${def.nome} (+${n}d${d})`; }
  if (def.param === "dano") return `${def.nome} (+${clamp(p.n, 1, 30, 4)})`;
  if (def.param === "condicao") return `${def.nome} (${p.condicao ?? "Preso"})`;
  if (def.param === "tipo" && p.tipo?.trim()) return `${def.nome} (${p.tipo.trim()})`;
  return def.nome;
}

/** Cria a peça de efeitos a partir do cartão de característica. */
export function instanciarCarac(def: DefCarac, p: ParamsCarac, lig: { liga: Liga; acao?: string }, ctx: CtxForma, id: string): InstEfeito {
  const d = dadosDe(p);
  const escolha: NonNullable<DadosCarac["escolha"]> = {
    ...(def.param === "condicao" ? { condicao: p.condicao ?? "Preso" } : {}),
    ...(def.param === "dados" ? { tipo: `d${d.d}`, n: d.n } : {}),
    ...(def.param === "dano" ? { n: clamp(p.n, 1, 30, 4) } : {}),
    ...(def.param === "tipo" && p.tipo ? { tipo: p.tipo.trim().slice(0, 30) } : {}),
  };
  return {
    id, nome: nomeDaCarac(def, p), texto: def.texto, efeitos: def.compilar(p, ctx), pp: def.pp(p, ctx), familia: "carac",
    carac: { id: def.id, vale: def.vale, liga: def.vale.length === 0 ? "todas" : lig.liga, ...(lig.acao && lig.liga === "uma" ? { acao: lig.acao } : {}), ...(Object.keys(escolha).length ? { escolha } : {}), ...(def.requer ? { requer: def.requer } : {}) },
  };
}

/** Os cartões que faltam na forma para este poder valer (vazio: está tudo certo). */
export function requisitosFaltando(def: DefCarac, efeitos: InstEfeito[]): DefCarac[] {
  // "clone" também vale quando a forma já tem uma peça antiga de clone (modelos oficiais)
  const tem = (r: string) => efeitos.some((e) => e.carac?.id === r || (r === "clone" && e.efeitos.some((x) => x.k === "invoca" && x.tipo === "clone")));
  return (def.requer ?? []).filter((r) => !tem(r)).flatMap((r) => caracPorId(r) ?? []);
}

/** Tipo de ação de uma habilidade (a antiga, sem cartão, conta como ataque se tiver dano). */
export const subDaHab = (h: HabForma): SubAcao | undefined => h.cartao?.sub ?? (h.dano ? "ataque" : undefined);

/** A ação aceita este cartão de característica? */
export const acaoAceita = (def: Pick<DefCarac, "vale">, h: HabForma) => { const s = subDaHab(h); return !!s && def.vale.includes(s); };

/** Onde o cartão ligado entra hoje: o nome da ação, "técnica final", "todas as ações compatíveis" ou "solto" (a ação sumiu). */
export function ondeLiga(inst: InstEfeito, habs: HabForma[]): { texto: string; solto: boolean } {
  const c = inst.carac;
  if (!c || c.vale.length === 0) return { texto: "vale para a forma toda", solto: false };
  if (c.liga === "todas") return { texto: "todas as ações compatíveis", solto: !habs.some((h) => !!subDaHab(h) && c.vale.includes(subDaHab(h)!)) };
  if (c.liga === "final") { const h = habs.find((x) => x.cartao?.final); return h ? { texto: `técnica final (${h.nome || "sem nome"})`, solto: false } : { texto: "técnica final (você ainda não montou)", solto: true }; }
  const h = habs.find((x) => x.id === c.acao);
  return h ? { texto: h.nome || "ação sem nome", solto: false } : { texto: "uma ação que não existe mais", solto: true };
}

/** Os cartões de característica ligados a esta ação (para mostrar como marcas no cartão da ação). */
export function caracsDaAcao(efeitos: InstEfeito[] | undefined, h: HabForma): InstEfeito[] {
  const sub = subDaHab(h);
  return (efeitos ?? []).filter((e) => {
    const c = e.carac;
    if (!c || c.vale.length === 0 || !sub || !c.vale.includes(sub)) return false;
    return c.liga === "todas" || (c.liga === "final" && !!h.cartao?.final) || (c.liga === "uma" && c.acao === h.id);
  });
}
