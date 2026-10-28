import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { capitulos, carregarCapitulo, secoes, slugify } from "../content/livro";
import { Item, Paragrafo, comDicas, textoDe } from "../components/Texto";
import Transicao from "../components/Transicao";
import EmBreve from "./EmBreve";

interface Grupo {
  id: string;
  titulo: string;
  filhos: { id: string; titulo: string }[];
}

export default function Capitulo() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const idx = capitulos.findIndex((c) => c.slug === slug);
  const cap = capitulos[idx];
  const [md, setMd] = useState<string | null>(null);
  const [ativo, setAtivo] = useState<string>("");

  useEffect(() => {
    setMd(null);
    setAtivo("");
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

  const lista = useMemo(() => (md ? secoes(md) : []), [md]);

  // sumário em seções: cada ## é um grupo, e os ### aparecem dentro do grupo ativo
  const grupos = useMemo(() => {
    const g: Grupo[] = [];
    for (const s of lista) {
      if (s.nivel === 2 || g.length === 0) g.push({ id: s.id, titulo: s.titulo, filhos: [] });
      else g[g.length - 1].filhos.push({ id: s.id, titulo: s.titulo });
    }
    return g;
  }, [lista]);

  const grupoAtivo = useMemo(() => {
    const g = grupos.find((x) => x.id === ativo || x.filhos.some((f) => f.id === ativo));
    return g?.id ?? "";
  }, [grupos, ativo]);

  // destaca no sumário a seção que está na tela
  useEffect(() => {
    if (!lista.length) return;
    const els = lista.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      () => {
        let atual = "";
        for (const el of els) {
          if (el.getBoundingClientRect().top <= 140) atual = el.id;
          else break;
        }
        setAtivo(atual);
      },
      { rootMargin: "0px 0px -60% 0px", threshold: [0, 1] }
    );
    els.forEach((e) => obs.observe(e));
    const f = () => {
      let atual = "";
      for (const el of els) {
        if (el.getBoundingClientRect().top <= 140) atual = el.id;
        else break;
      }
      setAtivo(atual);
    };
    window.addEventListener("scroll", f, { passive: true });
    f();
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", f);
    };
  }, [lista]);

  if (!cap) return <EmBreve titulo="Capítulo não encontrado" texto="Volte ao índice do livro." />;

  const ant = capitulos[idx - 1];
  const prox = capitulos[idx + 1];
  let n = 0;
  const idDe = (children: ReactNode) => lista[n++]?.id ?? slugify(textoDe(children));
  const kicker = cap.no === 0 ? "INTRODUÇÃO" : cap.slug === "homenagens-e-fontes" ? "CRÉDITOS" : `CAPÍTULO ${cap.no}`;

  return (
    <div className="reader" key={cap.slug}>
      <Transicao cap={cap} />
      <aside className="painel-voltar">
        <Link to="/livro" className="painel-card" aria-label="Voltar para todos os capítulos">
          <img src={`/art/${cap.art}.jpg`} alt="" />
          <span className="painel-txt">
            <small>← TODOS OS CAPÍTULOS</small>
            <b>{cap.no === 0 ? "Introdução" : `${cap.no}. ${cap.title}`}</b>
          </span>
        </Link>
      </aside>
      <article className="article">
        <Link to="/livro" className="voltar">← Todos os capítulos</Link>
        <div className="kicker">{kicker}</div>
        <h1>{cap.title}</h1>
        {md === null ? (
          <p>Carregando…</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: () => null,
              h2: ({ children }) => <h2 id={idDe(children)}>{children}</h2>,
              h3: ({ children }) => {
                const id = idDe(children);
                return (
                  <h3 id={id} className={/regra opcional/i.test(textoDe(children)) ? "h-regra" : undefined}>
                    {children}
                  </h3>
                );
              },
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
        {grupos.map((g) => (
          <div key={g.id} className={`toc-grupo ${g.id === grupoAtivo ? "aberto" : ""}`}>
            <a href={`#${g.id}`} className={ativo === g.id ? "ativo" : ""}>
              {g.titulo}
            </a>
            {g.id === grupoAtivo && g.filhos.length > 0 && (
              <div className="toc-filhos">
                {g.filhos.map((f) => (
                  <a key={f.id} href={`#${f.id}`} className={ativo === f.id ? "ativo" : ""}>
                    {f.titulo}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>
    </div>
  );
}
