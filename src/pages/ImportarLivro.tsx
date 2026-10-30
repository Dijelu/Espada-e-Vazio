import { useEffect, useState } from "react";
import { capitulos, arquivosDoLivro } from "../content/livro";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/Auth";

/** Envia os capítulos do livro para o banco. Só a conta administradora consegue gravar. */
export default function ImportarLivro() {
  const { sessao } = useAuth();
  const [papel, setPapel] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);
  const [rodando, setRodando] = useState(false);

  useEffect(() => {
    if (!supabase || !sessao) return;
    supabase.from("profiles").select("role").eq("id", sessao.user.id).maybeSingle().then(({ data }) => setPapel((data as { role?: string } | null)?.role ?? ""));
  }, [sessao]);

  const enviar = async () => {
    if (!supabase) return;
    setRodando(true);
    setLog([]);
    for (const [i, c] of capitulos.entries()) {
      const carregar = arquivosDoLivro["./livro/" + c.file];
      if (!carregar) { setLog((l) => [...l, `${c.title}: arquivo não encontrado`]); continue; }
      const texto = await carregar();
      const { error } = await supabase.from("book_pages").upsert(
        { slug: c.slug, chapter_no: c.no, title: c.title, summary: c.desc, content_md: texto, position: i, published: true, updated_at: new Date().toISOString() },
        { onConflict: "slug" }
      );
      setLog((l) => [...l, `${c.title}: ${error ? "erro (" + error.message + ")" : "enviado (" + texto.length + " caracteres)"}`]);
    }
    setRodando(false);
  };

  return (
    <main className="page">
      <h1 className="title-font">Enviar o livro ao banco</h1>
      {!sessao && <p className="aviso">Entre na sua conta primeiro.</p>}
      {sessao && papel !== "admin" && <p className="aviso">Esta conta não é administradora ({papel || "sem perfil"}). Só a administradora pode enviar o livro.</p>}
      {papel === "admin" && (
        <>
          <p>Envia os {capitulos.length} capítulos para o banco, substituindo os que já estiverem lá.</p>
          <div className="row"><button type="button" className="btn btn-red" onClick={enviar} disabled={rodando}>{rodando ? "Enviando…" : "Enviar capítulos"}</button></div>
        </>
      )}
      <ul>{log.map((t) => <li key={t}>{t}</li>)}</ul>
    </main>
  );
}
