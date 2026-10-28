import { useState } from "react";
import type { Capitulo } from "../content/livro";

/** Cortina que cruza a tela quando o leitor troca de capítulo. */
export default function Transicao({ cap }: { cap: Capitulo }) {
  const [fim, setFim] = useState(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  if (fim) return null;
  return (
    <div className="cap-cortina" aria-hidden="true" onAnimationEnd={() => setFim(true)}>
      <img src={`/art/${cap.art}.jpg`} alt="" />
      <div className="cap-cortina-txt">
        <span>{cap.no === 0 ? "INTRODUÇÃO" : `CAPÍTULO ${cap.no}`}</span>
        <b>{cap.title}</b>
      </div>
    </div>
  );
}
