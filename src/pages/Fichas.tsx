import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apagarFicha, listarFichas, type FichaSalva } from "../lib/fichas";
import { calcular, classePorId, origemPorId } from "../regras/ficha";
import { configurado } from "../lib/supabase";

export default function Fichas() {
  const [lista, setLista] = useState<FichaSalva[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarFichas()
      .then(setLista)
      .catch(() => setErro("Não foi possível carregar suas fichas. Tente de novo em instantes."));
  }, []);

  const apagar = async (f: FichaSalva) => {
    if (!window.confirm(`Apagar a ficha de ${f.nome}? Isso não pode ser desfeito.`)) return;
    try {
      await apagarFicha(f.id);
      setLista((l) => (l ?? []).filter((x) => x.id !== f.id));
    } catch {
      setErro("Não foi possível apagar a ficha.");
    }
  };

  return (
    <main className="page">
      <div className="fichas-topo">
        <h1 className="title-font">Minhas fichas</h1>
        <Link className="btn btn-red" to="/fichas/nova">Nova ficha</Link>
      </div>
      {!configurado && <p className="aviso">O site está sem conexão com o banco de dados, então as fichas não podem ser salvas agora.</p>}
      {erro && <p className="aviso" role="alert">{erro}</p>}
      {lista === null && !erro && <p>Carregando…</p>}
      {lista && lista.length === 0 && (
        <div className="vazio">
          <p>Você ainda não criou nenhuma ficha.</p>
          <Link className="btn btn-paper" to="/fichas/nova">Criar a primeira</Link>
        </div>
      )}
      <div className="cartas">
        {lista?.map((f) => {
          const d = f.data;
          const c = calcular(d);
          const classe = classePorId(d.classe);
          const origem = origemPorId(d.origem);
          return (
            <article className="carta" key={f.id}>
              <Link to={`/fichas/${f.id}`} className="carta-corpo">
                <small>{origem?.nome ?? "Sem origem"}{classe ? ` · ${classe.nome}` : ""}</small>
                <b className="title-font">{f.nome}</b>
                <span>Nível {d.nivel}</span>
                <div className="carta-nums">
                  <i>PV <strong>{c.pv}</strong></i>
                  <i>PR <strong>{c.pr}</strong></i>
                  <i>CR <strong>{c.cr}</strong></i>
                </div>
              </Link>
              <button type="button" className="link-perigo" onClick={() => apagar(f)}>Apagar</button>
            </article>
          );
        })}
      </div>
    </main>
  );
}
