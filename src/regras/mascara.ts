/* Máscara Hollow do Visored: três máscaras, tempo limitado, recarga e efeitos do livro. */
import type { Ficha } from "./ficha";

export type TipoMascara = "conquistador" | "predador" | "equilibrio";

export const MASCARAS: { id: TipoMascara; nome: string; texto: string }[] = [
  { id: "conquistador", nome: "Máscara do Conquistador", texto: "Imposição Hollow (+proficiência na CD dos testes de suas técnicas e Kidōs), Poder Aumentado (+2 × proficiência dados nas técnicas de Zanpakutou, Hadō e Bakudō) e Reiatsu Amplificada (PR temporários iguais à metade do total)." },
  { id: "predador", nome: "Máscara do Predador", texto: "Corpo Hollow (RD igual à metade do nível contra tudo, menos psíquico e temporal), Golpes Amplificados (+proficiência dados nos golpes de Zanpakutou e Hakuda) e Vitalidade Hollow (PV temporários iguais à metade do total)." },
  { id: "equilibrio", nome: "Máscara do Equilíbrio", texto: "Poder Amplificado (+metade da proficiência em dados nas técnicas e +1 dado nos golpes), Reiatsu Amplificada e Vitalidade Hollow (um quarto do total em PR e PV temporários)." },
];

/** O livro não põe teto no treino da máscara; o site limita a duração base a 10 turnos (sem o Hōgyoku) para o contador não crescer sem fim. */
export const MASCARA_TETO = 10;

/** Ganho de um Teste de Determinação passado (livro: 1d6 turnos, dividido pela metade, arredondando para baixo, mínimo 1). Recebe o resultado do d6. */
export const ganhoDeterminacao = (d6: number) => Math.max(1, Math.floor(d6 / 2));

/** O Visored pode pôr a máscara? (origem Visored com o treino da Máscara Hollow) */
export const podeMascara = (f: Ficha) => f.origem === "visored" && (f.treinos?.feitos ?? []).includes("visored-2");

/** A máscara usada agora, ou "" sem máscara. Ela é independente da forma: vale com ou sem Shikai/Bankai.
 *  Fichas antigas guardavam a máscara como `liberado: "mascara"`; isso ainda conta até a ficha ser normalizada. */
export const mascaraAtiva = (f: Ficha): TipoMascara | "" => {
  const ligada = f.estado?.mascaraAtiva === true || f.estado?.liberado === "mascara";
  const m = f.treinos?.mascara;
  return ligada && f.origem === "visored" && (m === "conquistador" || m === "predador" || m === "equilibrio") ? m : "";
};

export function efeitoMascara(f: Ficha, prof: number, n: number) {
  const m = mascaraAtiva(f);
  return {
    rd: m === "predador" ? Math.floor(n / 2) : 0,
    cd: m === "conquistador" ? prof : 0,
    dadosGolpe: m === "predador" ? prof : m === "equilibrio" ? 1 : 0,
    dadosTecnica: m === "conquistador" ? 2 * prof : m === "equilibrio" ? Math.floor(prof / 2) : 0,
  };
}

/** Fração do total de PV e de PR que vira temporária ao colocar a máscara. */
export const tempMascara = (m: TipoMascara | "") => ({ pv: m === "predador" ? 0.5 : m === "equilibrio" ? 0.25 : 0, pr: m === "conquistador" ? 0.5 : m === "equilibrio" ? 0.25 : 0 });

/** Soma `n` dados ao primeiro dado do golpe, mantendo o tipo do dado da arma (1d8 com +1 dado vira 2d8). */
export const somarDadosGolpe = (dano: string, n: number) =>
  n > 0 ? dano.replace(/(\d+)d(\d+)/i, (_, q: string, l: string) => `${Number(q) + n}d${l}`) : dano;
