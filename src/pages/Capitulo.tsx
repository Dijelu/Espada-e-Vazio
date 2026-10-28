import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { capitulos, carregarCapitulo, secoes, slugify } from "../content/livro";
import { Item, Paragrafo, comDicas, textoDe } from "../components/Texto";
import Transicao from "../components/Transicao";
import EmBreve from "./EmBreve";

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

  // ids únicos para títulos repetidos (ex.: "Traços de Classe" em cada classe)
  const { toc, ids } = useMemo(() => {
    const vistos = new Map<string, number>();
    const lista: { id: string; titulo: string }[] = [];
    const todos: string[] = [];
    const unicos = new Set<string>();
    if (md) {
      for (const s of secoes(md)) {
        const n = (vistos.get(s.id) ?? 0) + 1;
        vistos.set(s.id, n);
        const id = n === 1 ? s.id : `${s.id}-${n}`;
        todos.push(id);
        if (!unicos.has(s.id)) {
          unicos.add(s.id);
          lista.push({ id, titulo: s.titulo });
        }
      }
    }
    return { toc: lista, ids: todos };
  }, [md]);

  if (!cap) return <EmBreve titulo="Capítulo não encontrado" texto="Volte ao índice do livro." />;

  const ant = capitulos[idx - 1];
  const prox = capitulos[idx + 1];
  let h2 = 0;

  return (
    <div className="reader" key={cap.slug}>
      <Transicao cap={cap} />
      <article className="article">
        <Link to="/livro" className="voltar">← Todos os capítulos</Link>
        <div className="kicker">{cap.no === 0 ? "INTRODUÇÃO" : `CAPÍTULO ${cap.no}`}</div>
        <h1>{cap.title}</h1>
        {md === null ? (
          <p>Carregando…</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: () => null,
              h2: ({ children }) => <h2 id={ids[h2++] ?? slugify(textoDe(children))}>{children}</h2>,
              h3: ({ children }) => (
                <h3 className={/regra/i.test(textoDe(children)) ? "h-regra" : undefined}>{children}</h3>
              ),
              p: Paragrafo,
              li: Item,
              td: ({ children }: { children?: ReactNode }) => <td>{comDicas(children)}</td>,
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
