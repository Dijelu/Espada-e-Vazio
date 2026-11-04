import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { configurado } from "../lib/supabase";
import { criarCampanha, entrarNaCampanha, listarCampanhas, type Campanha } from "../lib/campanhas";

export default function Campanhas() {
  const { sessao } = useAuth();
  const nav = useNavigate();
  const [lista, setLista] = useState<Campanha[] | null>(null);
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!sessao) return;
    setErro("");
    listarCampanhas().then(setLista).catch(() => setErro("Não foi possível carregar suas campanhas."));
  }, [sessao, tentativa]);

  if (!sessao) {
    return (
      <main className="page">
        <h1 className="title-font">Campanhas</h1>
        <p>Entre na sua conta para criar uma mesa ou participar de uma com o código do Mestre.</p>
        <Link className="btn btn-red" to="/conta" state={{ voltar: "/campanhas" }}>Entrar</Link>
      </main>
    );
  }

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setOcupado(true);
    setErro("");
    try {
      nav(`/campanhas/${await criarCampanha(nome.trim(), sessao.user.id)}`);
    } catch {
      setErro("Não foi possível criar a campanha.");
      setOcupado(false);
    }
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setOcupado(true);
    setErro("");
    try {
      nav(`/campanhas/${await entrarNaCampanha(codigo)}`);
    } catch {
      setErro("Código inválido. Confira com o Mestre.");
      setOcupado(false);
    }
  };

  return (
    <main className="page">
      <h1 className="title-font">Campanhas</h1>
      {!configurado && <p className="aviso">O site está sem conexão com o banco de dados.</p>}
      {erro && <p className="aviso" role="alert">{erro}</p>}
      <div className="grade2">
        <form className="caixa" onSubmit={criar}>
          <h3>Criar uma mesa</h3>
          <label className="campo">Nome da campanha<input value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} /></label>
          <button type="submit" className="btn btn-red" disabled={ocupado || !nome.trim()}>Criar</button>
        </form>
        <form className="caixa" onSubmit={entrar}>
          <h3>Entrar com um código</h3>
          <label className="campo">Código do Mestre<input value={codigo} maxLength={20} autoCapitalize="none" onChange={(e) => setCodigo(e.target.value)} /></label>
          <button type="submit" className="btn btn-paper" disabled={ocupado || !codigo.trim()}>Entrar</button>
        </form>
      </div>
      <h2 className="title-font">Suas mesas</h2>
      {lista === null && !erro && <p>Carregando…</p>}
      {lista === null && erro && <button type="button" className="btn btn-red" onClick={() => setTentativa((n) => n + 1)}>Tentar de novo</button>}
      {lista && lista.length === 0 && <p>Você ainda não está em nenhuma campanha.</p>}
      <div className="cartas">
        {lista?.map((c) => (
          <article className="carta" key={c.id}>
            <Link to={`/campanhas/${c.id}`} className="carta-corpo">
              <small>{c.dono === sessao.user.id ? "Você é o Mestre" : "Jogador"}</small>
              <b className="title-font">{c.nome}</b>
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
