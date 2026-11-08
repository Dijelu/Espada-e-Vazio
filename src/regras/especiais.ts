/* Técnicas especiais e interações especiais.
   Uma técnica especial cria uma coisa em jogo (clones, invocações, uma marca, uma carga de energia). Ela SÓ funciona se tiver ao menos
   uma interação especial ligada, que diz o que fazer com ela (passo entre clones, Gran Rey Cero junto da energia…).
   Uma técnica pode ter várias interações; cada interação serve a uma técnica. Ação e característica comum se ligam de forma opcional;
   técnica e interação especial, de forma obrigatória. Só tipos (import type) vêm de efeitos-forma, para não fazer ciclo. */
import type { Efeito, InstEfeito } from "./efeitos-forma";
import type { Ficha } from "./ficha";
import { vagasEspeciais, type DadosCarac, type SubAcao } from "./cartoes";

/* ---------------- Catálogo ---------------- */

export interface DefTecnica {
  id: string;
  nome: string;
  texto: string;
  /** preço em PP da forma */
  pp: number;
  compilar: () => Efeito[];
}

export interface DefInteracao {
  id: string;
  nome: string;
  texto: string;
  pp: number;
  /** ids das técnicas a que serve; vazio: serve a qualquer técnica */
  com: string[];
  /** tipos de ação a que também pode ser ligada (vazio: não se liga a ação) */
  vale: SubAcao[];
  /** só para Visored e Hollow */
  soHollow?: boolean;
  compilar: () => Efeito[];
}

export const TECNICAS: DefTecnica[] = [
  {
    id: "clones", nome: "Clones", pp: 3,
    texto: "Cria clones de reiatsu (até metade da proficiência). Têm 1 PV, somem ao ser atingidos e o golpe real chega mesmo se o alvo esquivar do clone. Cria o botão “Criar clones”, que os coloca na aba de invocações.",
    compilar: () => [
      { k: "invoca", nome: "Clone de reiatsu", tipo: "clone", max: "[PROF]/2", pv: 1, cr: "10+[PROF]+[DES]", acerto: "[PROF]+[DES]", dano: "1d8+[PROF]", custoPr: 2, texto: "Some ao ser atingido. O ataque do clone chega atrasado, mesmo que o alvo esquive." },
      { k: "gera", botao: { rotulo: "Criar clones", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "invocacao", nome: "Invocação", pp: 4,
    texto: "Chama até 2 criaturas do tema da forma, que atacam por você e somem ao chegar a 0 PV. Cria o botão “Invocar”.",
    compilar: () => [
      { k: "invoca", nome: "Invocação", tipo: "invocacao", max: 2, pv: "[PROF]*2", cr: "10+[PROF]", acerto: "[PROF]+[FOR]", dano: "[PROF]d6", custoPr: 4, texto: "Criatura do tema da forma." },
      { k: "gera", botao: { rotulo: "Invocar", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "invocacao-grande", nome: "Invocação grande", pp: 6,
    texto: "Chama uma criatura grande e resistente (só uma por vez). Cria o botão “Invocar criatura grande”.",
    compilar: () => [
      { k: "invoca", nome: "Criatura grande", tipo: "invocacao", max: 1, pv: "[PROF]*6", cr: "12+[PROF]", acerto: "[PROF]+[FOR]", dano: "[PROF]d8+[PROF]", custoPr: 8, texto: "Criatura grande do tema da forma." },
      { k: "gera", botao: { rotulo: "Invocar criatura grande", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "marcar-alvo", nome: "Marcar alvo", pp: 2,
    texto: "Ação bônus: marca uma criatura a até 18 metros. O primeiro ataque de cada aliado contra ela no turno causa 1d6 de dano a mais. Cria o botão “Marcar alvo”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Marcar alvo", ritmo: "bonus", faz: "texto", ref: "1d6" } }],
  },
  {
    id: "energia", nome: "Ataque com energia", pp: 3,
    texto: "Ação bônus: você junta energia (Cero, flecha de reishi, onda de reiatsu) e a sua próxima ação de ataque à distância sai carregada, com +6 metros de alcance. Cria o botão “Juntar energia”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Juntar energia", ritmo: "bonus", faz: "texto" } }],
  },
];

export const INTERACOES: DefInteracao[] = [
  {
    id: "passo-clones", nome: "Passo entre clones", pp: 3, com: ["clones"], vale: [],
    texto: "Ação bônus: você troca de lugar com um dos seus clones a até 18 metros, como um teleporte. O clone some e o seu próximo ataque no turno ganha vantagem. Serve à técnica Clones.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Passo entre clones", ritmo: "bonus", faz: "trocar", ref: "clone" } }],
  },
  {
    id: "absorver-clones", nome: "Juntar clones à lâmina", pp: 3, com: ["clones"], vale: ["ataque", "area"],
    texto: "Ação bônus: até 2 clones se juntam à sua arma. O próximo golpe da ação ligada (a técnica final, por exemplo) causa +1d10 por clone juntado. Serve à técnica Clones.",
    compilar: () => [
      { k: "gera", botao: { rotulo: "Juntar clones à lâmina", ritmo: "bonus", faz: "absorver", ref: "clone" } },
      { k: "liga", com: "clone", faz: "absorver" },
    ],
  },
  {
    id: "reforco", nome: "Reforço", pp: 2, com: [], vale: [],
    texto: "Ação bônus: a coisa criada pela técnica se fortalece e o seu próximo ataque no turno causa 2d10 de dano a mais. Serve a qualquer técnica. Cria o botão “Reforço”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Reforço", ritmo: "bonus", faz: "texto", ref: "2d10" } }],
  },
  {
    id: "provocar", nome: "Provocar", pp: 2, com: [], vale: [],
    texto: "Ação bônus: uma criatura a até 18 metros faz salvaguarda de Mente (CD 8 + proficiência + atributo); se falhar, só pode atacar você até o fim do próximo turno dela. Serve a qualquer técnica. Cria o botão “Provocar”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Provocar", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "gran-rey-cero", nome: "Gran Rey Cero junto da energia", pp: 5, com: ["energia"], vale: [], soHollow: true,
    texto: "Para Visored e Hollow. Ação bônus: ao lançar a energia, você solta junto um Gran Rey Cero, com proficiência d8 de dano de Energia a mais, no mesmo alvo ou em linha. Serve à técnica Ataque com energia. Cria o botão “Gran Rey Cero”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Gran Rey Cero", ritmo: "bonus", faz: "texto", ref: "[PROF]d8" } }],
  },
];

export const tecnicaPorId = (id: string) => TECNICAS.find((t) => t.id === id);
export const interacaoPorId = (id: string) => INTERACOES.find((t) => t.id === id);

/** Só Visored e Hollow usam o Gran Rey Cero junto da energia. */
export const podeUsarInteracao = (def: DefInteracao, f: Pick<Ficha, "origem" | "classe">) => !def.soHollow || f.origem === "visored" || f.classe === "hueco" || f.classe === "vazio";

/* ---------------- Montar a peça de efeitos ---------------- */

export const ehTecnica = (e: InstEfeito) => e.familia === "tecnica" && !!e.espec;
export const ehInteracao = (e: InstEfeito) => e.familia === "interacao" && !!e.espec;

export function instanciarTecnica(def: DefTecnica, id: string): InstEfeito {
  return { id, nome: def.nome, texto: def.texto, efeitos: def.compilar(), pp: def.pp, familia: "tecnica", espec: { id: def.id } };
}

/** Interação ligada à técnica `tec` (id da peça). Se ela também se liga a uma ação (`vale`), `lig` diz a qual. */
export function instanciarInteracao(def: DefInteracao, tec: string, lig: { liga: DadosCarac["liga"]; acao?: string }, id: string): InstEfeito {
  return {
    id, nome: def.nome, texto: def.texto, efeitos: def.compilar(), pp: def.pp, familia: "interacao", espec: { id: def.id, tec },
    ...(def.vale.length > 0 ? { carac: { id: def.id, vale: def.vale, liga: lig.liga, ...(lig.acao && lig.liga === "uma" ? { acao: lig.acao } : {}), requer: def.com } } : {}),
  };
}

/* ---------------- Ligações e conferência ---------------- */

/** A interação serve a esta técnica? */
export const interacaoServe = (def: Pick<DefInteracao, "com">, tec: InstEfeito) => def.com.length === 0 || def.com.includes(tec.espec?.id ?? "");

export const tecnicasDe = (efeitos: InstEfeito[]) => efeitos.filter(ehTecnica);
export const interacoesDe = (efeitos: InstEfeito[], tecId: string) => efeitos.filter((e) => ehInteracao(e) && e.espec?.tec === tecId);
/** A técnica a que a interação está ligada (se ela existir e a interação servir a ela). */
export function tecnicaDe(efeitos: InstEfeito[], inter: InstEfeito): InstEfeito | undefined {
  const t = efeitos.find((x) => ehTecnica(x) && x.id === inter.espec?.tec);
  const def = interacaoPorId(inter.espec?.id ?? "");
  return t && (!def || interacaoServe(def, t)) ? t : undefined;
}

/** A peça especial funciona? Técnica só com interação ligada; interação só com técnica. As outras peças sempre valem. */
export function especialFunciona(inst: InstEfeito, todas: InstEfeito[]): boolean {
  if (ehTecnica(inst)) return todas.some((x) => ehInteracao(x) && x.espec?.tec === inst.id && tecnicaDe(todas, x)?.id === inst.id);
  if (ehInteracao(inst)) return !!tecnicaDe(todas, inst);
  return true;
}

/** O que falta para a forma poder ser salva (vazio: está tudo certo). Cada item é uma frase pronta para a tela. */
export function faltasEspeciais(efeitos: InstEfeito[], tipo: string): string[] {
  const out: string[] = [];
  const v = vagasEspeciais(tipo);
  const tecs = tecnicasDe(efeitos);
  const ints = efeitos.filter(ehInteracao);
  if (tecs.length > v.tec) out.push(`Técnicas especiais demais: ${tecs.length} para ${v.tec} vaga${v.tec === 1 ? "" : "s"}. Tire ${tecs.length - v.tec}.`);
  if (ints.length > v.inter) out.push(`Interações especiais demais: ${ints.length} para ${v.inter} vaga${v.inter === 1 ? "" : "s"}. Tire ${ints.length - v.inter}.`);
  for (const t of tecs) {
    if (!interacoesDe(efeitos, t.id).some((x) => tecnicaDe(efeitos, x)?.id === t.id)) {
      const serve = INTERACOES.filter((i) => interacaoServe(i, t)).map((i) => i.nome);
      out.push(`A técnica especial “${t.nome}” precisa de pelo menos uma interação especial. Monte uma na aba Interações especiais${serve.length ? ` (serve: ${serve.slice(0, 3).join(", ")}${serve.length > 3 ? "…" : ""})` : ""}.`);
    }
  }
  for (const i of ints) {
    if (!tecnicaDe(efeitos, i)) {
      const def = interacaoPorId(i.espec?.id ?? "");
      const nomes = def && def.com.length ? def.com.map((c) => tecnicaPorId(c)?.nome ?? c).join(" ou ") : "qualquer técnica";
      out.push(`A interação especial “${i.nome}” não está ligada a uma técnica especial (serve a: ${nomes}).`);
    }
  }
  return out;
}

/* ---------------- Migração dos 8 cartões que eram características ---------------- */

const ANTIGA_TECNICA: Record<string, string> = { clone: "clones", invocacao: "invocacao", "invocacao-grande": "invocacao-grande", "marcar-alvo": "marcar-alvo" };
const ANTIGA_INTERACAO: Record<string, string> = { "passo-clones": "passo-clones", "absorver-clones": "absorver-clones", reforco: "reforco", provocar: "provocar" };

/**
 * Os 8 cartões de característica que criavam botões, invocações e sinergias viram técnica ou interação especial.
 * Só muda a etiqueta e a ligação: os efeitos e o preço (pp) ficam exatamente como estavam. Cada interação antiga se liga à primeira técnica
 * em que ela serve. Idempotente: o que já migrou não é tocado.
 */
export function migrarEspeciais(lista: InstEfeito[]): { lista: InstEfeito[]; mudou: number } {
  let mudou = 0;
  const marcadas = lista.map((e): InstEfeito => {
    const c = e.carac;
    if (e.familia !== "carac" || !c) return e;
    if (ANTIGA_TECNICA[c.id]) { mudou++; const { carac: _c, ...resto } = e; return { ...resto, familia: "tecnica", espec: { id: ANTIGA_TECNICA[c.id] } }; }
    if (ANTIGA_INTERACAO[c.id]) { mudou++; const { carac: _c, ...resto } = e; return { ...resto, familia: "interacao", espec: { id: ANTIGA_INTERACAO[c.id] }, ...(c.vale.length > 0 ? { carac: c } : {}) }; }
    return e;
  });
  if (mudou === 0) return { lista, mudou: 0 };
  const tecs = marcadas.filter(ehTecnica);
  const ligadas = marcadas.map((e) => {
    if (!ehInteracao(e) || e.espec?.tec) return e;
    const def = interacaoPorId(e.espec!.id);
    const t = def && tecs.find((x) => interacaoServe(def, x));
    return t ? { ...e, espec: { ...e.espec!, tec: t.id } } : e;
  });
  return { lista: ligadas, mudou };
}
