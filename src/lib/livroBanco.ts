import { supabase } from "./supabase";

/** Texto do livro guardado no banco, por capítulo. Carrega tudo de uma vez e guarda na memória. */
let cache: Promise<Map<string, string>> | null = null;

export function textosDoBanco(): Promise<Map<string, string>> {
  if (!cache) {
    cache = (async () => {
      const mapa = new Map<string, string>();
      if (!supabase) return mapa;
      const { data, error } = await supabase.from("book_pages").select("slug,content_md").eq("published", true);
      if (error || !data) {
        cache = null; // tenta de novo na próxima vez
        return mapa;
      }
      for (const l of data as { slug: string; content_md: string }[]) mapa.set(l.slug, l.content_md);
      return mapa;
    })();
  }
  return cache;
}
