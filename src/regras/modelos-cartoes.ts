/* Modelos oficiais montados só com os cartões neutros.
   Cada modelo guarda a lista de cartões (característica, técnica especial, interação especial, efeito) em blocos, na ordem de importância,
   e o ponto fraco como cartão neutro. Os números das ações continuam os do livro (dano e PR); o que não virou cartão fica como texto de sabor. */
import type { HabForma } from "./ficha";
import { instanciarEfeito } from "./efeitos-neutros";
import { instanciarFraco } from "./fracos-neutros";
import { caracPorId, instanciarCarac, type ParamsCarac } from "./caracteristicas";
import { instanciarInteracao, instanciarTecnica, interacaoPorId, tecnicaPorId } from "./especiais";
import { liquidoPecas, type CtxForma, type InstEfeito } from "./efeitos-forma";
import type { CartaoAcao, DadosFracoNeutro } from "./cartoes";

/** "todas" = todas as ações que o cartão aceita; "final" = técnica final; qualquer outro texto = o nome da habilidade do modelo. */
export type LigaModelo = "todas" | "final" | string;
export type ItemModelo =
  | { k: "C"; id: string; p?: ParamsCarac; liga?: LigaModelo }
  | { k: "T"; id: string }
  | { k: "I"; id: string; tec: string; liga?: LigaModelo }
  | { k: "E"; forca: "leve" | "medio" | "forte"; cond?: string; nome?: string; texto?: string };

export interface FracoModelo extends Omit<DadosFracoNeutro, "devolve" | "aval"> { nome?: string }

export interface CartoesDoModelo {
  /** como cada habilidade do modelo é lida pelos cartões (o dano e o PR continuam os do livro) */
  acoes: Record<string, Omit<CartaoAcao, "migrado">>;
  /** blocos em ordem de importância: um bloco entra inteiro ou não entra (técnica e interação vão juntas) */
  blocos: ItemModelo[][];
  fraco: FracoModelo;
  /** o que o modelo tinha e não virou cartão: só texto de sabor, sem número */
  sabor: string;
}

/** Marca as habilidades do modelo com o tipo de cartão (sem mudar dano, PR nem texto) para as características poderem ligar nelas. */
export function marcarAcoes(habs: HabForma[], acoes: CartoesDoModelo["acoes"]): HabForma[] {
  return habs.map((h) => (acoes[h.nome] ? { ...h, cartao: { ...acoes[h.nome], migrado: true } } : h));
}

function ligar(liga: LigaModelo | undefined, habs: HabForma[]): { liga: "todas" | "final" | "uma"; acao?: string } | null {
  if (!liga || liga === "todas") return { liga: "todas" };
  if (liga === "final") return { liga: "final" };
  const h = habs.find((x) => x.nome === liga);
  return h ? { liga: "uma", acao: h.id } : null;
}

/** Monta os cartões do modelo enquanto couberem no orçamento da forma (como o modelo sempre fez com as peças). Devolve também o que ficou de fora. */
export function montarCartoesModelo(def: CartoesDoModelo, habs: HabForma[], ctx: CtxForma, tipo: string, total: number, novoId: () => string): { efeitos: InstEfeito[]; fora: string[]; pontoFraco: string } {
  const efeitos: InstEfeito[] = [];
  const fora: string[] = [];
  const fraco = instanciarFraco(def.fraco.modo === "pronta" ? { forca: def.fraco.forca, modo: "pronta", prejuizo: def.fraco.prejuizo, ...(def.fraco.param ? { param: def.fraco.param } : {}) } : { forca: def.fraco.forca, modo: "livre", texto: def.fraco.texto ?? "", aval: "ok" }, novoId(), def.fraco.nome, tipo);
  efeitos.push(fraco);
  for (const bloco of def.blocos) {
    const feitos: InstEfeito[] = [];
    const tecs = new Map<string, string>();
    let valido = true;
    for (const it of bloco) {
      const id = novoId();
      if (it.k === "C") {
        const d = caracPorId(it.id); const l = ligar(it.liga, habs);
        if (!d || !l) { valido = false; break; }
        feitos.push(instanciarCarac(d, it.p ?? {}, l, ctx, id));
      } else if (it.k === "T") {
        const d = tecnicaPorId(it.id);
        if (!d) { valido = false; break; }
        tecs.set(it.id, id); feitos.push(instanciarTecnica(d, id));
      } else if (it.k === "I") {
        const d = interacaoPorId(it.id); const l = ligar(it.liga, habs); const tec = tecs.get(it.tec);
        if (!d || !l || !tec) { valido = false; break; }
        feitos.push(instanciarInteracao(d, tec, l, id));
      } else {
        feitos.push(instanciarEfeito(it.cond ? { forca: "leve", modo: "pronta", condicao: { nome: it.cond } } : { forca: it.forca, modo: "livre", texto: it.texto ?? "", aval: "ok" }, id, it.nome, tipo));
      }
    }
    if (!valido || feitos.length === 0) continue;
    if (liquidoPecas([...efeitos, ...feitos], total, ctx) <= total) efeitos.push(...feitos);
    else fora.push(feitos.map((x) => x.nome).join(" + "));
  }
  return { efeitos, fora, pontoFraco: fraco.nome };
}
