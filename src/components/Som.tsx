import { useEffect, useRef, useState } from "react";
import { efeito, ligarEfeitos, ligarMusica, mudarVolume, useSom } from "../lib/som";

/** Botão de som da barra: abre os controles de música e de efeitos. */
export default function Som() {
  const s = useSom();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  const mudo = !s.musica && !s.efeitos;

  return (
    <div className="som-wrap" ref={caixa}>
      <button
        className="som-btn"
        data-som="none"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label={mudo ? "Som desligado. Abrir controles de som" : "Abrir controles de som"}
        title="Som"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
          {mudo ? (
            <path d="M16 9l5 6M21 9l-5 6" />
          ) : (
            <>
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </>
          )}
        </svg>
      </button>
      {aberto && (
        <div className="som-pop" role="dialog" aria-label="Controles de som">
          <label className="som-linha" data-som="none">
            <span>Música de fundo</span>
            <input type="checkbox" role="switch" checked={s.musica} onChange={(e) => ligarMusica(e.target.checked)} />
          </label>
          <label className="som-linha" data-som="none">
            <span>Efeitos sonoros</span>
            <input type="checkbox" role="switch" checked={s.efeitos} onChange={(e) => ligarEfeitos(e.target.checked)} />
          </label>
          <label className="som-vol" data-som="none">
            <span>Volume da música</span>
            <input
              type="range"
              min={0}
              max={100}
              value={s.volume}
              onChange={(e) => mudarVolume(Number(e.target.value))}
              aria-label="Volume da música"
            />
          </label>
          <div className="som-teste">
            <small>Ouvir os efeitos</small>
            <div>
              <button onClick={efeito.dado} data-som="none">Dado</button>
              <button onClick={efeito.corte} data-som="none">Corte</button>
              <button onClick={efeito.energia} data-som="none">Kidō</button>
              <button onClick={efeito.cero} data-som="none">Cero</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
