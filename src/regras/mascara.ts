/* Máscara Hollow do Visored: três máscaras, tempo limitado, recarga e efeitos do livro. */
import type { Ficha } from "./ficha";

export type TipoMascara = "conquistador" | "predador" | "equilibrio";

export const MASCARAS: { id: TipoMascara; nome: string; texto: string }[] = [
  { id: "conquistador", nome: "Máscara do Conquistador", texto: "Imposição Hollow (+proficiência na CD dos testes de suas técnicas e Kidōs), Poder Aumentado (+2 × proficiência dados nas técnicas de Zanpakutou, Hadō e Bakudō) e Reiatsu Amplificada (PR temporários iguais à metade do total)." },
  { id: "predador", nome: "Máscara do Predador", texto: "Corpo Hollow (RD igual à metade do nível contra tudo, menos psíquico e temporal), Golpes Amplificados (+proficiência dados nos golpes de Zanpakutou e Hakuda) e Vitalidade Hollow (PV temporários iguais à metade do total)." },
  { id: "equilibrio", nome: "Máscara do Equilíbrio", texto: "Poder Amplificado (+metade da proficiência em dados nas técnicas e +1 dado nos golpes), Reiatsu Amplificada e Vitalidade Hollow (um quarto do total em PR e PV temporários)." },
];

export const mascaraAtiva = (f: Ficha): TipoMascara | "" => (f.estado.liberado === "mascara" ? ((f.treinos.mascara as TipoMascara) || "") : "");

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
