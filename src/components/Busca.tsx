import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MiniSearch from "minisearch";
import { capitulos, carregarCapitulo, secoes } from "../content/livro";

export interface Doc {
  id: string;
  slug: string;
  secao: string;
  capitulo: string;
  texto: string;
  anchor: string;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

let indice: Promise<{ ms: MiniSearch<Doc>; docs: Map<string, Doc> }> | null = null;

export function montar() {
  if (!indice) {
    indice = (async () => {
      const docs: Doc[] = [];
      for (const c of capitulos) {
        const md = await carregarCapitulo(c);
        const lista = secoes(md);
        if (lista.length === 0) {
          docs.push({ id: c.slug, slug: c.slug, secao: c.title, capitulo: c.title, texto: md, anchor: "" });
        }
        lista.forEach((s, i) =>
          docs.push({
            id: `${c.slug}#${i}`,
            slug: c.slug,
            secao: s.titulo,
            capitulo: c.title,
            texto: s.texto,
            anchor: s.id,
          })
        );
      }
      const ms = new MiniSearch<Doc>({
        fields: ["secao", "capitulo", "texto"],
        storeFields: [],
        processTerm: (t) => norm(t),
        searchOptions: { prefix: true, fuzzy: 0.15, boost: { secao: 3, capitulo: 1.5 } },
      });
      ms.addAll(docs);
      return { ms, docs: new Map(docs.map((d) => [d.id, d])) };
    })();
  }
  return indice;
}

export function trecho(texto: string, q: string): string {
  const t = texto.replace(/\s+/g, " ");
  const n = norm(t);
  const termos = norm(q).split(/\s+/).filter(Boolean);
  let pos = -1;
  for (const termo of termos) {
    pos = n.indexOf(termo);
    if (pos >= 0) break;
  }
  const ini = Math.max(0, (pos < 0 ? 0 : pos) - 50);
  return (ini > 0 ? "…" : "") + t.slice(ini, ini + 160) + (t.length > ini + 160 ? "…" : "");
}

export default function Busca({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [pronto, setPronto] = useState<Awaited<ReturnType<typeof montar>> | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!aberto) return;
    setQ("");
    setSel(0);
    montar().then(setPronto);
    setTimeout(() => ref.current?.focus(), 30);
  }, [aberto]);

  const resultados = useMemo(() => {
    if (!pronto || q.trim().length < 2) return [];
    return pronto.ms
      .search(q)
      .slice(0, 12)
      .map((r) => pronto.docs.get(r.id as string))
      .filter((d): d is Doc => !!d);
  }, [pronto, q]);

  if (!aberto) return null;

  const ir = (d: Doc) => {
    onFechar();
    nav(`/livro/${d.slug}${d.anchor ? "#" + d.anchor : ""}`);
  };

  return (
    <div className="dialog-bg" onMouseDown={onFechar} role="presentation">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar no livro"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onFechar();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSel((s) => Math.min(s + 1, resultados.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSel((s) => Math.max(s - 1, 0));
          }
          if (e.key === "Enter" && resultados[sel]) ir(resultados[sel]);
        }}
      >
        <input
          ref={ref}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          placeholder="Buscar no livro: zanpakutō, condição, Hollow…"
          aria-label="Termo de busca"
        />
        <div className="results">
          {!pronto && <div className="hint">Preparando a busca…</div>}
          {pronto && q.trim().length < 2 && <div className="hint">Digite ao menos 2 letras. Setas para navegar, Enter para abrir, Esc para fechar.</div>}
          {pronto && q.trim().length >= 2 && resultados.length === 0 && <div className="hint">Nada encontrado.</div>}
          {resultados.map((d, i) => (
            <a
              key={d.id}
              href={`/livro/${d.slug}${d.anchor ? "#" + d.anchor : ""}`}
              className={`result ${i === sel ? "sel" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                ir(d);
              }}
              onMouseEnter={() => setSel(i)}
            >
              <small>{d.capitulo}</small>
              <b>{d.secao}</b>
              <span>{trecho(d.texto, q)}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
