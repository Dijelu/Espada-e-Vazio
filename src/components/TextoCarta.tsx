import { useLayoutEffect, useRef, useState } from "react";

/** Texto de carta enxuto: um resumo curto e o resto atrás de "Ler completo". */
export function resumir(texto: string, max = 130): { resumo: string; resto: boolean } {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return { resumo: limpo, resto: false };
  const corte = limpo.slice(0, max);
  const ponto = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("; "));
  const fim = ponto > 50 ? ponto + 1 : Math.max(corte.lastIndexOf(" "), 40);
  return { resumo: limpo.slice(0, fim).trim() + (ponto > 50 ? "" : "…"), resto: true };
}

/**
 * Corpo de carta com altura fixa para o resumo. "Ler completo" aparece sempre que o resumo foi encurtado
 * ou que o CSS cortou linhas (mede o texto na tela), e abre o texto inteiro no lugar. `quando` é a linha "Vale quando".
 */
export function TextoCarta({ texto, quando }: { texto: string; quando?: string }) {
  const { resumo, resto } = resumir(texto);
  const [aberto, setAberto] = useState(false);
  const [cortado, setCortado] = useState(false);
  const a = useRef<HTMLParagraphElement>(null);
  const q = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    if (aberto) return;
    const medir = () => {
      const corta = (e: HTMLElement | null) => !!e && e.scrollHeight > e.clientHeight + 1;
      setCortado(corta(a.current) || corta(q.current));
    };
    medir();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(medir);
    if (a.current) ro.observe(a.current);
    return () => ro.disconnect();
  }, [texto, quando, aberto]);
  if (!texto.trim()) return null;
  const limpo = texto.replace(/\s+/g, " ").trim();
  const mostrar = resto || cortado || aberto;
  return (
    <>
      {quando ? <p ref={q} className={`vale-quando${aberto ? " aberto" : ""}`}>Vale quando: {quando}</p> : null}
      <p ref={a} className={`carta-resumo${aberto ? " aberto" : ""}`}>{aberto ? limpo : resumo}</p>
      <div className="ler-slot">
        {mostrar && <button type="button" className="ler-btn" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>{aberto ? "Fechar" : "Ler completo"}</button>}
      </div>
    </>
  );
}
