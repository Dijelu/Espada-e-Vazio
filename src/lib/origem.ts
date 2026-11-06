import { classePorId, type Ficha, type TipoForma } from "../regras/ficha";

/** De onde vem o poder: define a pele da carta (hanafuda, osso ou reishi). */
export type OrigemPoder = "shinigami" | "hollow" | "quincy";

export const ROTULO_ORIGEM: Record<OrigemPoder, string> = { shinigami: "Shinigami", hollow: "Hollow", quincy: "Quincy" };

/** Forma de liberação para origem: Shikai e Bankai são Shinigami, Resurrección e Segunda Etapa são Hollow, Vollständig é Quincy. */
export function origemDaForma(tipo: TipoForma | string): OrigemPoder {
  if (tipo === "vollstandig") return "quincy";
  if (tipo === "resurreccion" || tipo === "segunda" || tipo === "terror" || tipo === "mascara") return "hollow";
  return "shinigami";
}

/** Origem de uma habilidade pelo nome da fonte (Hollow, Gillian, Schrift, Zanjutsu…). */
export function origemDaFonte(fonte: string, f: Ficha): OrigemPoder {
  if (/hollow|gillian|adjuchas|vasto|arrancar|visored|máscara|mascara|resurrec|cero/i.test(fonte)) return "hollow";
  if (/quincy|schrift|reishi|vollst|gemischt/i.test(fonte)) return "quincy";
  return classePorId(f.classe)?.tipo === "quincy" ? "quincy" : "shinigami";
}
