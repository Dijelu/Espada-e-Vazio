export interface Capitulo {
  slug: string;
  no: number;
  title: string;
  desc: string;
  art: string;
  file: string;
}

import lista from "./chapters.json";
import { textosDoBanco } from "../lib/livroBanco";

export const capitulos: Capitulo[] = lista as Capitulo[];

const arquivos = import.meta.glob("./livro/*.md", { query: "?raw", import: "default" }) as Record<
  string,
  () => Promise<string>
>;
/** Texto do capítulo: vem do banco; na falta dele, usa o arquivo guardado junto do site. */
export async function carregarCapitulo(c: Capitulo): Promise<string> {
  const doBanco = (await textosDoBanco()).get(c.slug);
  if (doBanco) return doBanco;
  const f = arquivos["./livro/" + c.file];
  return f ? f() : "";
}

/** Arquivos de capítulo guardados junto do site (usados só para enviar ao banco). */
export const arquivosDoLivro = arquivos;

export function slugify(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface Secao {
  id: string;
  titulo: string;
  nivel: 2 | 3;
  texto: string;
}

/** Divide o capítulo em seções (## e ###) com ids únicos, na ordem do documento. */
export function secoes(md: string): Secao[] {
  const re = /^(#{2,3}) +(.+)$/gm;
  const marcas: { nivel: 2 | 3; titulo: string; ini: number; fim: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    marcas.push({ nivel: m[1].length as 2 | 3, titulo: m[2].trim(), ini: m.index, fim: m.index + m[0].length });
  }
  const vistos = new Map<string, number>();
  return marcas.map((h, i) => {
    const base = slugify(h.titulo) || "secao";
    const n = (vistos.get(base) ?? 0) + 1;
    vistos.set(base, n);
    const corpo = md.slice(h.fim, i + 1 < marcas.length ? marcas[i + 1].ini : md.length).trim();
    return { id: n === 1 ? base : `${base}-${n}`, titulo: h.titulo, nivel: h.nivel, texto: corpo };
  });
}
