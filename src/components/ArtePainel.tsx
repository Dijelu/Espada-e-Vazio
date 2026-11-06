import type { CSSProperties } from "react";
import type { TipoForma } from "../regras/ficha";
import { origemDaForma } from "../lib/origem";

const ICONE: Record<string, string> = {
  shikai: "lamina-lua", bankai: "eclipse-espinhos", bankai2: "eclipse",
  resurreccion: "cranio-chifres", segunda: "asa-morcego", terror: "asa-morcego", mascara: "mascara-rachada",
  vollstandig: "cruz-gotica",
};
const KANJI: Record<string, string> = { shikai: "始", bankai: "解", bankai2: "真" };

/** Arte do cabeçalho de cada painel de forma. Só desenho em CSS, ícones locais e a foto recolorida da Hollow. */
export function ArtePainel({ tipo }: { tipo: TipoForma | string }) {
  const origem = origemDaForma(tipo);
  const icone = ICONE[tipo] ?? "estrela4";
  const estilo = { ["--i" as string]: `url(/arte/icones/${icone}.svg)` } as CSSProperties;
  return (
    <div className="fp-arte" aria-hidden="true" data-arte={origem}>
      {origem === "shinigami" && (
        <>
          <i className="fp-sol" />
          <i className="fp-ico" style={estilo} />
          <i className="fp-onda" />
          <b className="fp-selo">{KANJI[tipo] ?? "解"}</b>
        </>
      )}
      {origem === "hollow" && (
        <>
          <i className={`fp-tinta ${tipo === "mascara" ? "tinta-m" : "tinta-r"}`} />
          <i className="fp-ico" style={estilo} />
          <i className="fp-onda" />
        </>
      )}
      {origem === "quincy" && (
        <>
          <i className="fp-veias" />
          <i className="fp-ico fp-cruz" style={estilo} />
          <i className="fp-onda" />
        </>
      )}
    </div>
  );
}
