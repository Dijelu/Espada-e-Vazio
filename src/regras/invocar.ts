/* Invocar e dispensar clones e invocações da forma. Usado pela aba Invocações e pelos botões que os cartões de característica criam. */
import type { Ficha, Invocacao } from "./ficha";
import type { ModeloInvocacao } from "./efeitos-forma";

/** Quantas criaturas deste modelo já estão em campo. */
export const emCampo = (f: Ficha, chave: string) => (f.estado.invocacoes ?? []).filter((x) => x.chave === chave).length;

export interface ResultadoInvocar {
  /** o que muda na ficha (PR gasto e lista de invocações); vazio se nada foi criado */
  parte: Partial<Ficha>;
  criadas: number;
  /** por que não criou, quando não criou nada */
  motivo?: "maximo" | "pr";
}

/**
 * Coloca até `quantas` criaturas do modelo em campo, na aba de invocações. Cada uma custa `custoPr`; para quando chega ao máximo ou quando o PR acaba.
 * `novoId` gera o id de cada criatura (fica fora desta função para ela continuar sem efeito colateral).
 */
export function invocarModelo(f: Ficha, m: ModeloInvocacao, novoId: () => string, quantas = 1): ResultadoInvocar {
  const lista = [...(f.estado.invocacoes ?? [])];
  let pr = f.prAtual;
  let criadas = 0;
  let motivo: ResultadoInvocar["motivo"];
  let n = emCampo(f, m.chave);
  while (criadas < quantas) {
    if (n >= m.max) { motivo = "maximo"; break; }
    if (pr < m.custoPr) { motivo = "pr"; break; }
    n++; criadas++; pr -= m.custoPr;
    const nova: Invocacao = { id: novoId(), chave: m.chave, nome: `${m.nome} ${n}`, tipo: m.tipo, pv: m.pv, pvMax: m.pv, cr: m.cr, acerto: m.acerto, dano: m.dano, texto: m.texto };
    lista.push(nova);
  }
  if (criadas === 0) return { parte: {}, criadas: 0, motivo };
  return { parte: { ...(pr !== f.prAtual ? { prAtual: Math.max(0, pr) } : {}), estado: { ...f.estado, invocacoes: lista } }, criadas };
}

/** Tira do campo até `n` clones (os mais antigos primeiro). Devolve a lista nova e quantos saíram. */
export function retirarClones(f: Ficha, n: number): { lista: Invocacao[]; saiu: number } {
  const lista = [...(f.estado.invocacoes ?? [])];
  let saiu = 0;
  for (let i = 0; i < lista.length && saiu < n;) {
    if (lista[i].tipo === "clone") { lista.splice(i, 1); saiu++; } else i++;
  }
  return { lista, saiu };
}

export const clonesEmCampo = (f: Ficha) => (f.estado.invocacoes ?? []).filter((x) => x.tipo === "clone").length;
