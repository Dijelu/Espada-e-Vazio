/* Faixas das condições do sistema: quanto cada condição "vale" quando é posta num cartão (de característica ou de efeito). */
import type { Forca } from "./cartoes";

/** As 20 condições, cada uma na sua faixa. A faixa decide o preço (2/4/6 PP) e o limite de uso do cartão. */
export const FAIXA_CONDICAO: Record<string, Forca> = {
  // leves: atrapalham, mas o alvo ainda joga o turno
  Surdo: "leve", Caído: "leve", Agarrado: "leve", Amedrontado: "leve", Distorcido: "leve", Invisível: "leve",
  // médias: ferem ou travam o alvo por um tempo
  Queimado: "medio", Sangramento: "medio", Cego: "medio", Preso: "medio", Envenenado: "medio", Eletrificado: "medio", Enfeitiçado: "medio",
  // fortes: tiram o turno do alvo ou quase isso
  Congelado: "forte", Esgotado: "forte", Atordoado: "forte", Paralisado: "forte", Petrificado: "forte", Incapacitado: "forte", Inconsciente: "forte",
};

/** Faixa de uma condição (o que não está na lista conta como média). */
export const faixaDaCondicao = (nome: string): Forca => FAIXA_CONDICAO[nome] ?? "medio";

/** Quantas vezes o cartão pode agir: leve 1 por turno, médio 1 por rodada, forte 1 por cena. */
export const LIMITE_FORCA: Record<Forca, "turno" | "rodada" | "cena"> = { leve: "turno", medio: "rodada", forte: "cena" };
/** Quanto tempo a condição dura. */
export const DURACAO_FORCA: Record<Forca, string> = { leve: "até o fim do próximo turno", medio: "até o fim do próximo turno do alvo", forte: "1 turno" };
export const LIMITE_TEXTO: Record<Forca, string> = { leve: "1 por turno", medio: "1 por rodada", forte: "1 por cena" };

/** As condições de uma faixa, em ordem alfabética. */
export const condicoesDaFaixa = (f: Forca): string[] => Object.keys(FAIXA_CONDICAO).filter((n) => FAIXA_CONDICAO[n] === f).sort((a, b) => a.localeCompare(b, "pt-BR"));
