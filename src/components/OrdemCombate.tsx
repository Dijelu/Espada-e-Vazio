import { useEffect, useState } from "react";
import { lerCombate, type CombatePublico } from "../lib/campanhas";

/** Ordem de iniciativa vista pelos jogadores; atualiza sozinha enquanto a página está aberta. */
export function OrdemCombate({ campanhaId }: { campanhaId: string }) {
  const [c, setC] = useState<CombatePublico | null>(null);

  useEffect(() => {
    let vivo = true;
    const buscar = () => {
      if (document.visibilityState === "hidden") return;
      lerCombate(campanhaId).then((x) => { if (vivo) setC(x); }).catch(() => { /* tenta de novo no próximo ciclo */ });
    };
    buscar();
    const t = window.setInterval(buscar, 5000);
    return () => { vivo = false; window.clearInterval(t); };
  }, [campanhaId]);

  if (!c || c.ordem.length === 0) return null;
  return (
    <section className="caixa">
      <h3>Combate <small>· rodada {c.rodada}</small></h3>
      <ol className="ordem-publica">
        {c.ordem.map((o, i) => (
          <li key={i} className={`${o.vez ? "vez" : ""}${o.fora ? " fora" : ""}${o.jogador ? " jog" : ""}`}>
            <b>{o.ini ?? "—"}</b>
            <span>{o.nome}</span>
            {o.vez && !o.fora && <em>No turno</em>}
            {o.fora && <em>Fora de combate</em>}
          </li>
        ))}
      </ol>
    </section>
  );
}
