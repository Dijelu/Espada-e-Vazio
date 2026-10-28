export interface Capitulo {
  slug: string;
  no: number;
  title: string;
  desc: string;
  art: string;
  file: string;
}

import lista from "./chapters.json";

export const capitulos: Capitulo[] = lista as Capitulo[];

const arquivos = import.meta.glob("./livro/*.md", { query: "?raw", import: "default" }) as Record<
  string,
  () => Promise<string>
>;
export function carregarCapitulo(c: Capitulo): Promise<string> {
  const f = arquivos["./livro/" + c.file];
  return f ? f() : Promise.resolve("");
}

export function slugify(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function secoes(md: string): { id: string; titulo: string; texto: string }[] {
  const partes = md.split(/^## /m);
  const out: { id: string; titulo: string; texto: string }[] = [];
  partes.forEach((p, i) => {
    if (i === 0) return;
    const nl = p.indexOf("\n");
    const titulo = (nl === -1 ? p : p.slice(0, nl)).trim();
    out.push({ id: slugify(titulo), titulo, texto: nl === -1 ? "" : p.slice(nl + 1) });
  });
  return out;
}
