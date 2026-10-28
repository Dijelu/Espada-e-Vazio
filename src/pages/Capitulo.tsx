import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { capitulos, carregarCapitulo, secoes, slugify } from "../content/livro";
import EmBreve from "./EmBreve";

function textoDe(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(textoDe).join("");
  return "";
}

export default function Capitulo() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const idx = capitulos.findIndex((c) => c.slug === slug);
  const cap = capitulos[idx];
  const [md, setMd] = useState<string | null>(null);

  useEffect(() => {
    setMd(null);
    if (cap) carregarCapitulo(cap).then(setMd);
  }, [cap]);

  useEffect(() => {
    if (md === null) return;
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [md, hash]);

  const toc = useMemo(() => (md ? secoes(md) : []), [md]);

  if (!cap) return <EmBreve titulo="Capítulo não encontrado" texto="Volte ao índice do livro." />;

  const ant = capitulos[idx - 1];
  const prox = capitulos[idx + 1];

  return (
    <div className="reader">
      <aside className="side" aria-label="Capítulos">
        <small>CAPÍTULOS</small>
        {capitulos.map((c) => (
          <Link key={c.slug} to={`/livro/${c.slug}`} className={c.slug === slug ? "ativo" : ""}>
            <b>{c.no === 0 ? "★" : c.no}</b>
            {c.title}
          </Link>
        ))}
      </aside>
      <article className="article">
        <div className="kicker">{cap.no === 0 ? "INTRODUÇÃO" : `CAPÍTULO ${cap.no}`}</div>
        <h1>{cap.title}</h1>
        {md === null ? (
          <p>Carregando…</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: () => null,
              h2: ({ children }) => <h2 id={slugify(textoDe(children))}>{children}</h2>,
            }}
          >
            {md}
          </ReactMarkdown>
        )}
        <nav className="pager" aria-label="Capítulos vizinhos">
          {ant ? <Link to={`/livro/${ant.slug}`}>← {ant.title}</Link> : <span />}
          {prox ? <Link to={`/livro/${prox.slug}`}>{prox.title} →</Link> : <span />}
        </nav>
      </article>
      <aside className="toc" aria-label="Nesta página">
        <small>NESTA PÁGINA</small>
        {toc.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.titulo}
          </a>
        ))}
      </aside>
    </div>
  );
}
