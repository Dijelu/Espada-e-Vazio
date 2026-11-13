/* Técnicas especiais dos modelos oficiais cujo poder de assinatura não é um golpe genérico (ilusão, gelo que prende, veneno, energia lançada,
   velocidade, barreira, enxame de pétalas). Cada uma entra como um bloco a mais no fim da lista do modelo: técnica + interações, sem custo em PP,
   dentro das vagas da forma (Shikai 1 técnica e 2 interações; Bankai 2 e 4; Resurrección 3 e 6).
   Fonte dos poderes: Bleach Wiki. Os números são adaptação do sistema. */
import type { CartoesDoModelo, ItemModelo } from "./modelos-cartoes";

const T = (id: string): ItemModelo => ({ k: "T", id });
const I = (id: string, tec: string): ItemModelo => ({ k: "I", id, tec });
const bloco = (tec: string, ...ints: string[]): ItemModelo[] => [T(tec), ...ints.map((i) => I(i, tec))];

export const TECNICAS_EXTRA_SHIKAI: Record<string, ItemModelo[][]> = {
  "zangetsu": [bloco("energia", "energia-dupla")],
  "senbonzakura": [bloco("invocacao-enxame", "lancar-enxame", "dispersar-enxame")],
  "haineko": [bloco("invocacao-enxame", "lancar-enxame", "dispersar-enxame")],
  "hyorinmaru": [bloco("selo", "estilhacar-selo", "selo-em-area")],
  "sode-no-shirayuki": [bloco("selo", "estilhacar-selo", "selo-em-area")],
  "kazeshini": [bloco("selo", "selo-que-cala")],
  "ashisogi-jizo": [bloco("veneno", "veneno-que-corroi")],
  "benihime": [bloco("barreira", "barreira-devolve")],
  "kyoka-suigetsu": [bloco("ilusao", "ilusao-perfeita", "golpe-no-vazio")],
};

export const TECNICAS_EXTRA_BANKAI: Record<string, ItemModelo[][]> = {
  "tensa-zangetsu": [bloco("aceleracao", "imagem-residual", "ritmo-crescente"), bloco("energia", "energia-dupla")],
  "senbonzakura-kageyoshi": [bloco("invocacao-enxame", "lancar-enxame", "dispersar-enxame", "escudo-vivo")],
  "daiguren-hyorinmaru": [bloco("selo", "estilhacar-selo", "selo-em-area")],
  "hakka-no-togame": [bloco("selo", "estilhacar-selo", "selo-em-area")],
  "jakuho-raikoben": [bloco("energia", "energia-dupla")],
  "kamishini-no-yari": [bloco("veneno", "segunda-picada", "veneno-que-corroi")],
  "konjiki-ashisogi-jizo": [bloco("veneno", "veneno-que-corroi")],
  "shatatsu-karagara": [bloco("selo", "selo-que-cala")],
};

export const TECNICAS_EXTRA_RES: Record<string, ItemModelo[][]> = {
  "murcielago": [bloco("energia", "gran-rey-cero", "energia-dupla"), bloco("aceleracao", "imagem-residual")],
  "pantera": [bloco("aceleracao", "golpe-em-passagem", "ritmo-crescente")],
  "gamuza": [bloco("aceleracao", "golpe-em-passagem")],
  "golondrina": [bloco("aceleracao", "golpe-em-passagem", "imagem-residual")],
  "arrogante": [bloco("veneno", "veneno-que-corroi")],
};

/** Acrescenta os blocos extras ao fim da lista de cada modelo (os blocos que já existiam continuam na frente). */
export function juntarTecnicasExtra(mapa: Record<string, CartoesDoModelo>, extras: Record<string, ItemModelo[][]>): void {
  for (const [id, blocos] of Object.entries(extras)) if (mapa[id]) mapa[id] = { ...mapa[id], blocos: [...mapa[id].blocos, ...blocos] };
}
