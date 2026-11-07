import { memo, type ReactNode } from "react";
import { DEFS_CARTAS, FA, VA } from "../lib/arte/geradores";
import type { OrigemPoder } from "../lib/origem";
import "../estilos/cartas.css";
import "../estilos/ficha-fiel.css";

/** Tipo do poder: define a cor e o desenho do selo da carta. */
export type TipoCarta = "bankai" | "shikai" | "kido" | "hollow" | "comum" | "quincy" | "voll" | "schrift";
type Pele = "shi" | "hol" | "qui";

const PELE_DO_TIPO: Record<TipoCarta, Pele> = { bankai: "shi", shikai: "shi", kido: "shi", comum: "shi", hollow: "hol", quincy: "qui", voll: "qui", schrift: "qui" };
const NOME_TIPO: Record<TipoCarta, string> = { bankai: "Bankai", shikai: "Shikai", kido: "Kidō", hollow: "Visored", comum: "Zanjutsu", quincy: "Reishi", voll: "Vollständig", schrift: "Schrift" };
const ARTE_DO_TIPO: Record<TipoCarta, string> = { bankai: "shi", shikai: "shi", kido: "shi", comum: "shi", hollow: "hol", quincy: "qui", voll: "voll", schrift: "schrift" };

export const peleDaOrigem = (o: OrigemPoder): Pele => (o === "hollow" ? "hol" : o === "quincy" ? "qui" : "shi");
export const tipoPadraoDaOrigem = (o: OrigemPoder): TipoCarta => (o === "hollow" ? "hollow" : o === "quincy" ? "quincy" : "comum");

/** Símbolos SVG usados pelas cartas e pelos painéis das formas (uma cópia só na página). */
export const SpriteArte = memo(function SpriteArte() {
  const html = DEFS_CARTAS + FA.simbolos() + VA.simbolos + VA.defsGema + `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${[11, 23].map(VA.bannerArte).join("")}</defs></svg>`;
  return <div aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} dangerouslySetInnerHTML={{ __html: html }} />;
});

export interface TagCarta { t: string; pr?: boolean; sobe?: boolean }

interface Props {
  tipo: TipoCarta;
  /** texto do selo da faixa de arte (padrão: nome do tipo) */
  selo?: string;
  nome: ReactNode;
  tags?: TagCarta[];
  /** etiqueta sobre a arte, ex.: "Ativa" */
  estado?: string;
  /** contorno grosso na cor do tipo (forma ativa) */
  ativa?: boolean;
  off?: boolean;
  /** botões de baixo (ficam na linha de ação) */
  acao?: ReactNode;
  /** texto e controles do corpo da carta */
  children?: ReactNode;
  /** "Ler completo" embaixo, na pele da mesma origem */
  completo?: ReactNode;
  className?: string;
}

/** Carta de poder no acabamento do protótipo aprovado: faixa de arte, selo do tipo, nome (tanzaku, osso ou reishi), etiquetas, texto e ação. */
export function CartaPoder({ tipo, selo, nome, tags = [], estado, ativa, off, acao, children, completo, className = "" }: Props) {
  const og = PELE_DO_TIPO[tipo];
  return (
    <div className={`cwx ${className}`} data-orig={og}>
      <div className={`cw o-${tipo}${ativa ? " pf-ativa" : ""}${off ? " inativa" : ""}`} data-orig={og}>
        <article className="pf-carta">
          <div className="pf-fx">
            <svg className="arte" viewBox="0 0 400 60" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><use href={`#art-${ARTE_DO_TIPO[tipo]}`} /></svg>
            <span className="fx-n"><i className="sh" />{selo ?? NOME_TIPO[tipo]}</span>
          </div>
          {estado && <span className="estado-c">{estado}</span>}
          {og !== "shi" && <svg className="deco" aria-hidden="true"><use href={`#deco-${og}`} /></svg>}
          <h3>{nome}</h3>
          <div className="tags">{tags.map((x, i) => <span key={i} className={`tag${x.pr ? " pf-pr" : ""}${x.sobe ? " sobe" : ""}`}>{x.t}</span>)}</div>
          <div className="corpo">{children}</div>
          <div className="acao-c">{acao}</div>
        </article>
      </div>
      {completo}
    </div>
  );
}
