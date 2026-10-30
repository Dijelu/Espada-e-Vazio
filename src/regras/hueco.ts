/* Arma natural e bônus de dano do Hueco, conforme o livro (classe Hueco, Caminho Glotonería e Resurrección). */
import type { Ficha } from "./ficha";

export const PASSOS_NATURAL = ["1d10", "1d12", "2d6", "2d8", "2d10", "2d12", "3d8"];

const emResurreccion = (f: Ficha) => f.estado.liberado === "resurreccion" || f.estado.liberado === "terror";

/** Dados da arma natural: sobe um passo nos níveis 3, 5 e 7; a Resurrección soma +1 passo (+2 no Vasto Lorde, +1 no Adjuchas). */
export function dadosArmaNatural(f: Ficha): string {
  let i = f.nivel >= 7 ? 3 : f.nivel >= 5 ? 2 : f.nivel >= 3 ? 1 : 0;
  if (emResurreccion(f)) i += 1 + (f.origem === "vasto-lorde" ? 2 : f.origem === "adjuchas" ? 1 : 0);
  return PASSOS_NATURAL[Math.min(PASSOS_NATURAL.length - 1, i)];
}

/** Dano fixo extra da arma natural: Glotonería (+3 × prof, +4 × prof desde o 15º) e +prof na Resurrección. */
export function danoFixoHueco(f: Ficha, prof: number): number {
  if (f.classe !== "hueco") return 0;
  let v = 0;
  if (f.subclasse === "Glotonería" && f.nivel >= 3) v += (f.nivel >= 15 ? 4 : 3) * prof;
  if (emResurreccion(f)) v += prof;
  return v;
}

/** Ataques por ação do Hueco: 2º no 5º nível, 3º no 11º, 4º no 15º e +1 no 18º (e no 20º, no Sonido). */
export function ataquesHueco(f: Ficha): number {
  const n = f.nivel;
  return 1 + (n >= 5 ? 1 : 0) + (n >= 11 ? 1 : 0) + (n >= 15 ? 1 : 0) + (n >= 18 ? 1 : 0) + (f.subclasse === "Sonido" && n >= 20 ? 1 : 0);
}
