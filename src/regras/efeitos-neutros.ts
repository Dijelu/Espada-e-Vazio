/* Cartões de efeito neutros (leve, médio e forte): uma condição pronta ou um texto livre que o Mestre precisa aprovar. */
import { ppDaForca, type DadosEfeitoNeutro, type Forca } from "./cartoes";
import type { Efeito, InstEfeito } from "./efeitos-forma";
import { DURACAO_FORCA, LIMITE_FORCA, LIMITE_TEXTO, condicoesDaFaixa, faixaDaCondicao } from "./faixas-condicao";

export const NOME_FORCA: Record<Forca, string> = { leve: "Efeito leve", medio: "Efeito médio", forte: "Efeito forte" };
export { ppDaForca };

/** Efeito livre ainda sem o aval do Mestre: só vale como texto. */
export const efeitoPendente = (inst: Pick<InstEfeito, "efeitoNeutro">) => inst.efeitoNeutro?.modo === "livre" && inst.efeitoNeutro.aval !== "ok";

/** Condições que cada cartão aceita na aba "Condição pronta": só as da faixa dele. */
export const condicoesDoCartao = (f: Forca) => condicoesDaFaixa(f);

/** Nome do cartão como aparece na lista. */
export function nomeDoEfeito(d: DadosEfeitoNeutro, nome?: string): string {
  if (d.modo === "pronta" && d.condicao) return `${NOME_FORCA[d.forca]}: ${d.condicao.nome}`;
  return nome?.trim() ? nome.trim().slice(0, 60) : `${NOME_FORCA[d.forca]} (escrito)`;
}

/** O que o cartão faz no jogo. Pronta: gatilho no acerto com a condição. Livre: só texto, com aviso enquanto o Mestre não aprovar. */
export function compilarEfeito(d: DadosEfeitoNeutro, nome?: string): Efeito[] {
  if (d.modo === "pronta" && d.condicao) {
    return [{ k: "gatilho", quando: "acerto", limite: LIMITE_FORCA[d.forca], faz: { condicao: { nome: d.condicao.nome, salva: d.condicao.salva ?? "con", duracao: d.condicao.duracao ?? DURACAO_FORCA[d.forca] } }, rotulo: nomeDoEfeito(d) }];
  }
  const corpo = (d.texto ?? "").trim() || "(sem texto)";
  const onde = d.onde?.trim() ? ` (${d.onde.trim()})` : "";
  const aviso = d.aval === "ok" ? "" : " [aguardando o aval do Mestre: vale só como texto]";
  return [{ k: "texto", t: `${nomeDoEfeito(d, nome)}: ${corpo}${onde} ${LIMITE_TEXTO[d.forca]}.${aviso}`.slice(0, 400) }];
}

/** Cria o cartão de efeito (peça com o preço fixo da força; na Shikai o preço é menor). O preço fica guardado na peça: mudar a tabela não mexe nas fichas já salvas. */
export function instanciarEfeito(d: DadosEfeitoNeutro, id: string, nome?: string, tipo?: string): InstEfeito {
  const dados: DadosEfeitoNeutro = d.modo === "pronta" && d.condicao ? { ...d, forca: faixaDaCondicao(d.condicao.nome) } : { ...d, aval: d.aval ?? "pendente" };
  return {
    id, nome: nomeDoEfeito(dados, nome), texto: dados.modo === "pronta" ? `${dados.condicao?.nome} ao acertar (${LIMITE_TEXTO[dados.forca]})` : dados.texto,
    efeitos: compilarEfeito(dados, nome), pp: ppDaForca(dados.forca, tipo), familia: "efeito", efeitoNeutro: dados,
  };
}

/** Muda o aval do Mestre num efeito livre e refaz o texto. */
export function comAval(inst: InstEfeito, ok: boolean): InstEfeito {
  const d = inst.efeitoNeutro;
  if (!d || d.modo !== "livre") return inst;
  const novo: DadosEfeitoNeutro = { ...d, aval: ok ? "ok" : "pendente" };
  return { ...inst, efeitoNeutro: novo, efeitos: compilarEfeito(novo, inst.nome) };
}
