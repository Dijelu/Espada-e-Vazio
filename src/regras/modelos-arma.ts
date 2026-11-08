/**
 * Arma e características dos 47 modelos oficiais (14 Shikai, 16 Bankai com 7 verdadeiras, 12 Resurrección e 5 segundas etapas).
 * É só DADO INFORMATIVO: a arma sai marcada como `informativa`, então não trava nenhum cartão e não muda nenhum número do modelo.
 * Ela só mostra, na ficha e no painel, de que arma a Zanpakutō/Resurrección é feita. Se o jogador trocar a arma, vale a regra normal.
 * Limites das características: Shikai 2, Bankai 4, Bankai verdadeira 6, Resurrección 4, segunda etapa 6 (cartoes.ts).
 */
import type { FormaLib } from "./ficha";
import { CATALOGO_ARMAS, armaDoCatalogo, type CaracArmaId } from "./arma-forma";

type Linha = [arma: string, caracs: CaracArmaId[]];

const SHIKAI: Record<string, Linha> = {
  "zangetsu": ["Odachi", ["pesada", "projetil"]],
  "senbonzakura": ["Katana", ["enxame", "multiplas-laminas"]],
  "hyorinmaru": ["Katana", ["elemental", "corrente"]],
  "zabimaru": ["Espada", ["segmentavel", "longo-alcance"]],
  "ryujin-jakka": ["Odachi", ["elemental", "pesada"]],
  "katen-kyokotsu": ["Espada", ["dupla", "contato"]],
  "tenken": ["Espada Grande", ["invocada", "pesada"]],
  "ashisogi-jizo": ["Tridente", ["contato", "multiplas-laminas"]],
  "suzumebachi": ["Adaga", ["contato", "agil"]],
  "benihime": ["Katana", ["projetil", "foco"]],
  "suzumushi": ["Katana", ["multiplas-laminas", "contato"]],
  "sode-no-shirayuki": ["Katana", ["elemental", "contato"]],
  "haineko": ["Katana", ["enxame", "longo-alcance"]],
  "kyoka-suigetsu": ["Katana", ["contato", "agil"]],
  "hozukimaru": ["Lança", ["segmentavel", "longo-alcance"]],
  "wabisuke": ["Katana", ["contato", "pesada"]],
  "minazuki": ["Katana", ["invocada", "contato"]],
  "tachikaze": ["Faca", ["contato", "agil"]],
  "fuji-kujaku": ["Falx", ["multiplas-laminas", "contato"]],
  "kazeshini": ["Foice", ["dupla", "corrente"]],
  "sogyo-no-kotowari": ["Katana", ["dupla", "corrente"]],
  "nozarashi": ["Machado Grande", ["pesada", "contato"]],
};

/** Bankai (até 4 características) e, quando o modelo tem, a Bankai verdadeira (até 6). */
const BANKAI: Record<string, { bankai: Linha; verdadeira?: Linha }> = {
  "tensa-zangetsu": { bankai: ["Katana", ["agil", "contato", "projetil"]], verdadeira: ["Katana", ["agil", "contato", "projetil", "corrente", "longo-alcance"]] },
  "senbonzakura-kageyoshi": { bankai: ["Katana", ["enxame", "multiplas-laminas", "longo-alcance"]], verdadeira: ["Katana", ["contato", "longo-alcance", "multiplas-laminas", "enxame", "foco"]] },
  "daiguren-hyorinmaru": { bankai: ["Katana", ["elemental", "contato", "longo-alcance", "corrente"]], verdadeira: ["Katana", ["elemental", "contato", "longo-alcance", "corrente", "pesada", "projetil"]] },
  "hihio-zabimaru": { bankai: ["Espada Grande", ["segmentavel", "longo-alcance", "invocada", "pesada"]], verdadeira: ["Espada Grande", ["segmentavel", "longo-alcance", "invocada", "pesada", "projetil", "natural"]] },
  "zanka-no-tachi": { bankai: ["Odachi", ["elemental", "pesada", "contato", "projetil"]] },
  "karamatsu-shinju": { bankai: ["Espada", ["dupla", "contato", "invocada", "projetil"]] },
  "kokujo-tengen-myoo": { bankai: ["Espada Grande", ["invocada", "pesada", "contato"]], verdadeira: ["Espada Grande", ["invocada", "pesada", "contato", "escudo", "longo-alcance"]] },
  "konjiki-ashisogi-jizo": { bankai: ["Tridente", ["invocada", "contato", "multiplas-laminas", "longo-alcance"]], verdadeira: ["Tridente", ["invocada", "contato", "multiplas-laminas", "longo-alcance", "natural", "enxame"]] },
  "jakuho-raikoben": { bankai: ["Espingarda", ["projetil", "foco", "longo-alcance", "pesada"]] },
  "benihime-aratame": { bankai: ["Espada Grande", ["invocada", "contato", "foco", "longo-alcance"]] },
  "enma-korogi": { bankai: ["Katana", ["foco", "longo-alcance", "contato"]], verdadeira: ["Katana", ["foco", "longo-alcance", "contato", "invocada", "enxame", "multiplas-laminas"]] },
  "hakka-no-togame": { bankai: ["Katana", ["elemental", "contato", "foco"]] },
  "kyoka-reflexos": { bankai: ["Katana", ["contato", "agil", "invocada"]] },
  "kamishini-no-yari": { bankai: ["Lança", ["longo-alcance", "contato", "segmentavel"]] },
  "shatatsu-karagara": { bankai: ["Alabarda", ["invocada", "longo-alcance", "corrente", "foco"]] },
  "shirafude-ichimonji": { bankai: ["Estoque", ["longo-alcance", "projetil", "foco", "agil"]] },
  "ryumon-hozukimaru": { bankai: ["Machado Duplo", ["dupla", "corrente", "pesada", "contato"]] },
  "minazuki-bankai": { bankai: ["Katana", ["elemental", "longo-alcance", "escudo", "invocada"]] },
  "tekken-tachikaze": { bankai: ["Soqueiras", ["contato", "dupla", "elemental", "pesada"]] },
  "fushi-no-kojo": { bankai: ["Kusarigama", ["dupla", "corrente", "contato", "foco"]] },
  "kenpachi-bankai": { bankai: ["Machado Grande", ["pesada", "natural", "contato"]] },
};

const RESURRECCION: Record<string, Linha> = {
  "tiburon": ["Cimitarra", ["elemental", "contato", "natural", "agil"]],
  "arrogante": ["Machado", ["elemental", "projetil", "contato"]],
  "brujeria": ["Espada", ["contato", "elemental", "longo-alcance"]],
  "gloton": ["Tentáculos", ["natural", "pesada", "longo-alcance", "contato"]],
  "gamuza": ["Chifres", ["natural", "contato", "agil"]],
  "ira": ["Punho de osso", ["natural", "pesada", "contato", "projetil"]],
  "extinguir": ["Lâmina no braço", ["natural", "contato", "agil"]],
  "giralda": ["Garras de osso", ["natural", "contato", "projetil"]],
  "dragra": ["Cauda", ["natural", "pesada", "contato", "escudo"]],
  "arbol": ["Tentáculos", ["natural", "longo-alcance", "invocada", "enxame"]],
  "murcielago": ["Lança", ["projetil", "foco", "agil", "longo-alcance"]],
  "pantera": ["Garras de osso", ["natural", "agil", "contato"]],
  "golondrina": ["Asas de lâmina", ["natural", "agil", "contato", "longo-alcance"]],
  "lobos": ["Pistola", ["projetil", "invocada", "foco", "enxame"]],
  "santa-teresa": ["Foice", ["natural", "dupla", "longo-alcance", "contato"]],
  "fornicaras": ["Tentáculos", ["natural", "contato", "foco"]],
  "trepadora": ["Tentáculos", ["natural", "longo-alcance", "contato", "enxame"]],
};

const SEGUNDA: Record<string, Linha> = {
  "murcielago-segunda": ["Lança", ["projetil", "foco", "agil", "longo-alcance", "natural", "contato"]],
  "arrogante-trono": ["Machado Grande", ["elemental", "projetil", "contato", "foco", "invocada", "pesada"]],
  "ira-furia": ["Punho de osso", ["natural", "pesada", "contato", "projetil"]],
  "tiburon-abismo": ["Cimitarra", ["natural", "elemental", "contato", "agil", "longo-alcance", "projetil"]],
  "pantera-rei": ["Garras de osso", ["natural", "agil", "contato", "projetil", "elemental", "foco"]],
  "lobos-segunda": ["Pistola", ["projetil", "foco", "invocada", "agil"]],
  "santa-teresa-segunda": ["Foice", ["natural", "dupla", "longo-alcance", "contato", "pesada"]],
  "fornicaras-segunda": ["Tentáculos", ["natural", "contato", "foco", "longo-alcance"]],
  "trepadora-segunda": ["Tentáculos", ["natural", "longo-alcance", "contato", "enxame"]],
};

export const TABELA_ARMA_MODELOS = { SHIKAI, BANKAI, RESURRECCION, SEGUNDA };

type ArmaDoModelo = Pick<FormaLib, "arma" | "armaCaracs">;

const montar = (l: Linha | undefined): ArmaDoModelo => {
  const a = l && CATALOGO_ARMAS.find((x) => x.nome === l[0]);
  return a && l ? { arma: { ...armaDoCatalogo(a), informativa: true }, armaCaracs: [...l[1]] } : {};
};

/** Arma e características (só informativas) de um modelo oficial; `{}` para modelo desconhecido. */
export function armaDoModelo(tipo: "shikai" | "bankai" | "bankai2" | "resurreccion" | "segunda", id: string): ArmaDoModelo {
  if (tipo === "shikai") return montar(SHIKAI[id]);
  if (tipo === "bankai") return montar(BANKAI[id]?.bankai);
  if (tipo === "bankai2") return montar(BANKAI[id]?.verdadeira);
  if (tipo === "resurreccion") return montar(RESURRECCION[id]);
  return montar(SEGUNDA[id]);
}
