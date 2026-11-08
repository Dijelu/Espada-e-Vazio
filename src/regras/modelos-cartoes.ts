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
import { presetPorId } from "./efeitos-presets";

/** "todas" = todas as ações que o cartão aceita; "final" = técnica final; qualquer outro texto = o nome da habilidade do modelo. */
export type LigaModelo = "todas" | "final" | string;
export type ItemModelo =
  | { k: "C"; id: string; p?: ParamsCarac; liga?: LigaModelo }
  | { k: "T"; id: string }
  | { k: "I"; id: string; tec: string; liga?: LigaModelo }
  | { k: "E"; forca: "leve" | "medio" | "forte"; cond?: string; nome?: string; texto?: string }
  /** peça exclusiva da galeria (Bankai verdadeira, Segunda Etapa e peças de personagem), que continua valendo como está */
  | { k: "P"; id: string; param?: ParamPeca };

export type ParamPeca = { atr?: string; tipo?: string; n?: number };
const ATR_NOME: Record<string, string> = { for: "Força", des: "Destreza", con: "Constituição", men: "Mente", esp: "Espírito" };
function nomeDaPeca(nome: string, param?: ParamPeca): string {
  if (param?.atr) return `${nome} (${ATR_NOME[param.atr] ?? param.atr})`;
  if (param?.tipo) return `${nome} (${param.tipo})`;
  if (param?.n) return `${nome} (+${param.n})`;
  return nome;
}
function instanciarPeca(id: string, param: ParamPeca | undefined, novoId: () => string): InstEfeito | null {
  const p = presetPorId(id);
  return p ? { id: novoId(), preset: p.id, nome: nomeDaPeca(p.nome, param), texto: p.texto, efeitos: p.monta((param ?? {}) as never), pp: p.pp } : null;
}

export interface FracoModelo extends Omit<DadosFracoNeutro, "devolve" | "aval"> { nome?: string }
/** ponto fraco que continua sendo a peça nomeada da galeria (por exemplo, os pontos fracos de personagem) */
export type FracoPreset = { preset: string; param?: ParamPeca };

export interface CartoesDoModelo {
  /** como cada habilidade do modelo é lida pelos cartões (o dano e o PR continuam os do livro) */
  acoes: Record<string, Omit<CartaoAcao, "migrado">>;
  /** blocos em ordem de importância: um bloco entra inteiro ou não entra (técnica e interação vão juntas) */
  blocos: ItemModelo[][];
  fraco: FracoModelo | FracoPreset;
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
  const df = def.fraco;
  const fraco = "preset" in df ? instanciarPeca(df.preset, df.param, novoId)! : instanciarFraco(df.modo === "pronta" ? { forca: df.forca, modo: "pronta", prejuizo: df.prejuizo, ...(df.param ? { param: df.param } : {}) } : { forca: df.forca, modo: "livre", texto: df.texto ?? "", aval: "ok" }, novoId(), df.nome, tipo);
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
      } else if (it.k === "P") {
        const x = instanciarPeca(it.id, it.param, novoId);
        if (!x) { valido = false; break; }
        feitos.push(x);
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
