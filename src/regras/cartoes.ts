/* Cartões de ação: o dano de um cartão automático é calculado na hora da leitura, a partir do nível, do atributo e da ação.
   Assim a ficha nunca guarda um dano velho quando o nível ou o atributo mudam. */
import { calcular, type Ficha, type FormaLib, type HabForma } from "./ficha";
import type { CtxForma } from "./efeitos-forma";
import { analisarDano, danoNoTeto } from "./teto-dano";
import { habilidadesDaForma } from "./liberacoes";

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
