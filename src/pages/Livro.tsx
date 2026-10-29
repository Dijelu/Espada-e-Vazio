import { alternarQuincy } from "../lib/quincy";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { capitulos } from "../content/livro";
import { montar, trecho, type Doc } from "../components/Busca";

export default function Livro() {
  const [q, setQ] = useState("");
  const [pronto, setPronto] = useState<Awaited<ReturnType<typeof montar>> | null>(null);

  useEffect(() => {
    montar().then(setPronto);
  }, []);

  const achados = useMemo(() => {
    if (!pronto || q.trim().length < 2) return [];
    return pronto.ms
      .search(q)
      .slice(0, 20)
      .map((r) => pronto.docs.get(r.id as string))
      .filter((d): d is Doc => !!d);
  }, [pronto, q]);

  const buscando = q.trim().length >= 2;

  return (
    <main className="page">
      <h1 className="title-font" style={{ fontSize: "clamp(48px,9vw,88px)", margin: 0, lineHeight: 0.9 }}>O Livro</h1>
      <p style={{ color: "var(--muted)", fontSize: 17, margin: "6px 0 18px" }}>
        Escolha um capítulo ou procure direto pelo termo.
      </p>
      <input
        className="filtro"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Procurar por termo: zanpakutō, vantagem, Hollow…"
        aria-label="Procurar no livro"
      />
      {buscando ? (
        <div className="achados">
          {!pronto && <div className="hint">Preparando a busca…</div>}
          {pronto && achados.length === 0 && <div className="hint">Nada encontrado.</div>}
          {achados.map((d) => (
            <Link key={d.id} to={`/livro/${d.slug}${d.anchor ? "#" + d.anchor : ""}`} className="result">
              <small>{d.capitulo}</small>
              <b>{d.secao}</b>
              <span>{trecho(d.texto, q)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bars">
          {capitulos.map((c, i) => (
            <Link key={c.slug} to={`/livro/${c.slug}`} className={`bar ${i < 2 ? "big" : ""}`}>
              <div className={`bar-num ${c.no === 0 || c.slug === "homenagens-e-fontes" ? "intro" : ""}`}>
                {c.no === 0 ? <img className="bar-emblema" src="/art/sym-intro.png" alt="Introdução" onClick={(e) => { e.preventDefault(); e.stopPropagation(); alternarQuincy(); }} /> : c.slug === "homenagens-e-fontes" ? "Fim" : c.no}
              </div>
              <div className="bar-text">
                <b>{c.title}</b>
                <span>{c.desc}</span>
              </div>
              <div className="bar-go">Abrir →</div>
              <div className="bar-art">
                <img src={`/art/${c.art}.jpg`} alt="" loading="lazy" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
