import { alternarQuincy } from "../lib/quincy";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { capitulos } from "../content/livro";
import { montar, trecho, type Doc } from "../components/Busca";

export default function Livro() {
  const [q, setQ] = useState("");
  const [pronto, setPronto] = useState<Awaited<ReturnType<typeof montar>> | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  // segredo do emblema: só com toque longo (o toque normal abre a Introdução)
  const segurar = useRef<number | null>(null);
  const disparou = useRef(false);
  const soltar = () => { if (segurar.current !== null) { window.clearTimeout(segurar.current); segurar.current = null; } };

  useEffect(() => {
    let vivo = true;
    setFalhou(false);
    montar().then((r) => { if (vivo) setPronto(r); }, () => { if (vivo) setFalhou(true); });
    return () => { vivo = false; };
  }, [tentativa]);
  useEffect(() => soltar, []);

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
          {!pronto && !falhou && <div className="hint">Preparando a busca…</div>}
          {!pronto && falhou && (
            <div className="hint" role="alert">
              Não foi possível preparar a busca. <button type="button" className="btn btn-red" onClick={() => setTentativa((n) => n + 1)}>Tentar de novo</button>
            </div>
          )}
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
                {c.no === 0 ? <img
                    className="bar-emblema" src="/art/sym-intro.png" alt="Introdução" draggable={false}
                    onPointerDown={() => { disparou.current = false; soltar(); segurar.current = window.setTimeout(() => { segurar.current = null; disparou.current = true; alternarQuincy(); }, 700); }}
                    onPointerUp={soltar} onPointerLeave={soltar} onPointerCancel={soltar}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={(e) => { if (disparou.current) { e.preventDefault(); e.stopPropagation(); disparou.current = false; } }}
                  /> : c.slug === "homenagens-e-fontes" ? "Fim" : c.no}
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
