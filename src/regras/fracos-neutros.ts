/* Cartões de ponto fraco neutros (leve, médio e forte).
   Cada cartão devolve pontos para a forma: leve 2, médio 4, forte 6 (na Shikai 1, 2 e 4). Leve e médio contam no limite de um terço do total;
   o forte fica fora desse limite (como os pontos fracos grandes de antes), até 9 pontos no total.
   O jogador escolhe um prejuízo pronto da faixa ou escreve o seu; o escrito só devolve os pontos depois do aval do Mestre. */
import { ppDaForca, type DadosFracoNeutro, type Forca } from "./cartoes";
import type { Alvo, Efeito, InstEfeito } from "./efeitos-forma";

export const NOME_FRACO: Record<Forca, string> = { leve: "Ponto fraco leve", medio: "Ponto fraco médio", forte: "Ponto fraco forte" };

const ATAQUES: Alvo[] = ["golpe", "disparo", "hado"];
const atr = (v: number, a: "for" | "des" | "con" | "men" | "esp"): Efeito => ({ k: "atr", atr: a, v });

export interface PrejuizoPronto { id: string; forca: Forca; nome: string; texto: string; param?: { rotulo: string; padrao: string }; monta: (param?: string) => Efeito[] }

export const PREJUIZOS: PrejuizoPronto[] = [
  { id: "l-guarda", forca: "leve", nome: "Guarda aberta", texto: "CR -2 enquanto a forma durar.", monta: () => [{ k: "cr", v: -2 }] },
  { id: "l-visao", forca: "leve", nome: "Visão turva", texto: "-2 de acerto nos golpes, disparos e Hadō.", monta: () => [{ k: "acerto", em: ATAQUES, v: -2 }] },
  { id: "l-corte", forca: "leve", nome: "Corte cego", texto: "-3 de dano fixo nos golpes, disparos e Hadō.", monta: () => [{ k: "dano", em: ATAQUES, v: -3 }] },
  { id: "l-passos", forca: "leve", nome: "Passos pesados", texto: "-3 m de deslocamento.", monta: () => [{ k: "desloc", modo: "chao", v: -3 }] },
  { id: "l-brasa", forca: "leve", nome: "Brasa curta", texto: "A forma dura só a proficiência em turnos.", monta: () => [{ k: "duracao", turnos: "[PROF]" }] },
  { id: "l-corpo", forca: "leve", nome: "Corpo em brasa", texto: "O poder queima o corpo: Constituição -2 enquanto durar.", monta: () => [atr(-2, "con")] },
  { id: "m-casca", forca: "medio", nome: "Casca de vidro", texto: "CR -3 e Constituição -1 enquanto durar.", monta: () => [{ k: "cr", v: -3 }, atr(-1, "con")] },
  { id: "m-peso", forca: "medio", nome: "Peso do poder", texto: "Força -1 e Destreza -1.", monta: () => [atr(-1, "for"), atr(-1, "des")] },
  { id: "m-reiatsu", forca: "medio", nome: "Reiatsu instável", texto: "-2 na CD dos Kidōs e técnicas.", monta: () => [{ k: "cd", v: -2 }] },
  { id: "m-sede", forca: "medio", nome: "Sede de reiatsu", texto: "Manter a forma custa 3 PR por turno.", monta: () => [{ k: "custo", pr: 3 }] },
  { id: "m-fim", forca: "medio", nome: "Corpo no limite", texto: "Ao terminar, você fica Esgotado até um descanso curto.", monta: () => [{ k: "fim", esgotado: "curto" }] },
  { id: "f-colapso", forca: "forte", nome: "Colapso final", texto: "Ao terminar, você fica Esgotado até um descanso longo.", monta: () => [{ k: "fim", esgotado: "longo" }] },
  { id: "f-pacto", forca: "forte", nome: "Pacto de sangue", texto: "Manter a forma custa 2 PR por turno e, ao terminar, você fica Esgotado até um descanso curto.", monta: () => [{ k: "custo", pr: 2 }, { k: "fim", esgotado: "curto" }] },
  { id: "f-aberto", forca: "forte", nome: "Corpo aberto", texto: "CR -5 enquanto a forma durar.", monta: () => [{ k: "cr", v: -5 }] },
  { id: "f-ferida", forca: "forte", nome: "Ferida aberta", texto: "Você fica vulnerável a um tipo de dano enquanto a forma durar.", param: { rotulo: "Tipo de dano", padrao: "Fogo" }, monta: (p) => [{ k: "resist", dano: (p ?? "").trim() || "Fogo", grau: "vulner" }] },
];
export const prejuizosDaFaixa = (f: Forca) => PREJUIZOS.filter((x) => x.forca === f);
export const prejuizoPorId = (id?: string) => PREJUIZOS.find((x) => x.id === id);

/** Cartão ainda sem o aval do Mestre: vale só como texto e não devolve ponto nenhum. */
export const fracoPendente = (inst: Pick<InstEfeito, "fracoNeutro">) => inst.fracoNeutro?.modo === "livre" && inst.fracoNeutro.aval !== "ok";

export function nomeDoFraco(d: DadosFracoNeutro, nome?: string): string {
  if (d.modo === "pronta") { const p = prejuizoPorId(d.prejuizo); if (p) return `${NOME_FRACO[d.forca]}: ${p.nome}`; }
  return nome?.trim() ? nome.trim().slice(0, 60) : `${NOME_FRACO[d.forca]} (escrito)`;
}

/** O que o cartão faz no jogo. Pronto: os números do prejuízo. Livre: só texto, com aviso enquanto o Mestre não aprovar. O forte leva a marca de preço (fora do teto de um terço). */
export function compilarFraco(d: DadosFracoNeutro, nome?: string): Efeito[] {
  let efeitos: Efeito[];
  let resumo: string;
  const p = d.modo === "pronta" ? prejuizoPorId(d.prejuizo) : undefined;
  if (p) { efeitos = p.monta(d.param); resumo = p.texto; }
  else {
    const corpo = (d.texto ?? "").trim() || "(sem texto)";
    const onde = d.onde?.trim() ? ` (${d.onde.trim()})` : "";
    const aviso = d.aval === "ok" ? "" : " [aguardando o aval do Mestre: vale só como texto e não devolve pontos]";
    resumo = `${nomeDoFraco(d, nome)}: ${corpo}${onde}.${aviso}`.slice(0, 300);
    efeitos = d.forca === "forte" ? [] : [{ k: "texto", t: resumo.slice(0, 400) }];
  }
  if (d.forca === "forte") efeitos = [...efeitos, { k: "preco", pp: d.devolve, texto: resumo.slice(0, 300) }];
  return efeitos;
}

/** Quanto o cartão devolve agora: o escrito só devolve com o aval. O número fica negativo (devolução). */
const ppAgora = (d: DadosFracoNeutro) => (d.modo === "livre" && d.aval !== "ok" ? 0 : -d.devolve);

/** Cria o cartão de ponto fraco (peça com a devolução fixa da força; na Shikai é menor). */
export function instanciarFraco(d: Omit<DadosFracoNeutro, "devolve">, id: string, nome?: string, tipo?: string): InstEfeito {
  const dados: DadosFracoNeutro = { ...d, devolve: ppDaForca(d.forca, tipo), ...(d.modo === "livre" ? { aval: d.aval ?? "pendente" } : {}) };
  const p = dados.modo === "pronta" ? prejuizoPorId(dados.prejuizo) : undefined;
  return { id, nome: nomeDoFraco(dados, nome), texto: p ? p.texto : dados.texto, efeitos: compilarFraco(dados, nome), pp: ppAgora(dados), familia: "fraco", fracoNeutro: dados };
}

/** Muda o aval do Mestre num ponto fraco escrito: refaz o texto e a devolução. */
export function comAvalFraco(inst: InstEfeito, ok: boolean): InstEfeito {
  const d = inst.fracoNeutro;
  if (!d || d.modo !== "livre") return inst;
  const novo: DadosFracoNeutro = { ...d, aval: ok ? "ok" : "pendente" };
  return { ...inst, fracoNeutro: novo, efeitos: compilarFraco(novo, inst.nome), pp: ppAgora(novo) };
}
