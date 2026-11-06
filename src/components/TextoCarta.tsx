/** Texto de carta enxuto: um resumo curto e o resto atrás de "Ler completo". */
export function resumir(texto: string, max = 130): { resumo: string; resto: boolean } {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return { resumo: limpo, resto: false };
  const corte = limpo.slice(0, max);
  const ponto = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("; "));
  const fim = ponto > 50 ? ponto + 1 : Math.max(corte.lastIndexOf(" "), 40);
  return { resumo: limpo.slice(0, fim).trim() + (ponto > 50 ? "" : "…"), resto: true };
}

export function TextoCarta({ texto }: { texto: string }) {
  const { resumo, resto } = resumir(texto);
  if (!texto.trim()) return null;
  if (!resto) return <p className="carta-resumo">{resumo}</p>;
  return (
    <>
      <p className="carta-resumo">{resumo}</p>
      <details className="ler-completo">
        <summary>Ler completo</summary>
        <p className="quebra">{texto}</p>
      </details>
    </>
  );
}
