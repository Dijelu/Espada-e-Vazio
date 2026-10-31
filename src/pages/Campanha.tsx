import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { calcular, classePorId } from "../regras/ficha";
import {
  apagarCampanha, apagarNpc, criarNpc, fichasDaMesa, lerCampanha, ligarFicha, listarNpcs, minhasFichasSemMesa, salvarNpc, sairDaCampanha,
  type Campanha, type FichaDaMesa, type Npc,
} from "../lib/campanhas";

export default function CampanhaPagina() {
  const { id = "" } = useParams();
  const { sessao } = useAuth();
  const nav = useNavigate();
  const [camp, setCamp] = useState<Campanha | null | undefined>(undefined);
  const [fichas, setFichas] = useState<FichaDaMesa[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [livres, setLivres] = useState<{ id: string; nome: string }[]>([]);
  const [escolha, setEscolha] = useState("");
  const [novoNpc, setNovoNpc] = useState("");
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  const meuId = sessao?.user.id ?? "";
  const mestre = camp ? camp.dono === meuId : false;

  const carregar = useCallback(async () => {
    try {
      const c = await lerCampanha(id);
      setCamp(c);
      if (!c) return;
      const [fs, ns, ls] = await Promise.all([fichasDaMesa(id), listarNpcs(id), minhasFichasSemMesa()]);
      setFichas(fs);
      setNpcs(ns);
      setLivres(ls);
      setEscolha((e) => e || ls[0]?.id || "");
    } catch {
      setErro("Não foi possível carregar a campanha.");
      setCamp(null);
    }
  }, [id]);

  useEffect(() => { void carregar(); }, [carregar]);

  const tentar = async (acao: () => Promise<void>, msg: string) => {
    setErro("");
    try { await acao(); } catch { setErro(msg); }
  };

  if (camp === undefined) return <main className="page"><p>Carregando…</p></main>;
  if (!camp) {
    return (
      <main className="page">
        <h1 className="title-font">Campanha não encontrada</h1>
        {erro && <p className="aviso" role="alert">{erro}</p>}
        <Link className="btn btn-paper" to="/campanhas">Voltar</Link>
      </main>
    );
  }

  const copiar = async () => {
    try { await navigator.clipboard.writeText(camp.codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* sem área de transferência */ }
  };

  const mudarNpc = (n: Npc, parte: Partial<Npc["dados"]>, nome?: string) =>
    setNpcs((l) => l.map((x) => (x.id === n.id ? { ...x, nome: nome ?? x.nome, dados: { ...x.dados, ...parte } } : x)));
  const guardar = (n: Npc) => tentar(() => salvarNpc(n), "Não foi possível salvar o NPC.");
  const num = (v: string) => (v === "" ? 0 : Number(v) || 0);

  return (
    <main className="page">
      <div className="fichas-topo">
        <h1 className="title-font">{camp.nome}</h1>
        <Link className="btn btn-paper" to="/campanhas">Todas as mesas</Link>
      </div>
      {erro && <p className="aviso" role="alert">{erro}</p>}

      {mestre && (
        <section className="caixa">
          <h3>Código de convite</h3>
          <p>Passe este código aos jogadores: <b className="codigo-mesa">{camp.codigo}</b> <button type="button" className="btn btn-paper" onClick={copiar}>{copiado ? "Copiado" : "Copiar"}</button></p>
        </section>
      )}

      <section className="caixa">
        <h3>{mestre ? "Fichas dos jogadores" : "Suas fichas nesta mesa"}</h3>
        {fichas.length === 0 && <p>{mestre ? "Nenhum jogador ligou uma ficha ainda." : "Você ainda não ligou nenhuma ficha."}</p>}
        <div className="cartas">
          {fichas.map((m) => {
            const c = calcular(m.ficha);
            const classe = classePorId(m.ficha.classe);
            return (
              <article className="carta" key={m.id}>
                <div className="carta-corpo">
                  <small>{classe?.nome ?? "Sem classe"} · nível {m.ficha.nivel}</small>
                  <b className="title-font">{m.nome}</b>
                  <div className="carta-nums">
                    <i>PV <strong>{m.ficha.pvAtual}/{c.pv}</strong></i>
                    <i>PR <strong>{m.ficha.prAtual}/{c.pr}</strong></i>
                    <i>CR <strong>{c.cr}</strong></i>
                  </div>
                </div>
                {m.dono === meuId && (
                  <>
                    <Link className="link-perigo" to={`/fichas/${m.id}`}>Abrir</Link>
                    <button type="button" className="link-perigo" onClick={() => tentar(async () => { await ligarFicha(m.id, null); await carregar(); }, "Não foi possível desligar a ficha.")}>Tirar da mesa</button>
                  </>
                )}
              </article>
            );
          })}
        </div>
        {livres.length > 0 && (
          <div className="linha-rolar">
            <select value={escolha} onChange={(e) => setEscolha(e.target.value)} aria-label="Ficha para ligar à mesa">
              {livres.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
            <button type="button" className="btn btn-red" onClick={() => tentar(async () => { await ligarFicha(escolha, id); setEscolha(""); await carregar(); }, "Não foi possível ligar a ficha.")}>Levar para a mesa</button>
          </div>
        )}
      </section>

      <section className="caixa">
        <h3>{mestre ? "NPCs" : "NPCs revelados"}</h3>
        {npcs.length === 0 && <p>{mestre ? "Nenhum NPC ainda." : "O Mestre ainda não revelou nenhum NPC."}</p>}
        <div className="npcs">
          {npcs.map((n) => (
            mestre ? (
              <article className="npc" key={n.id}>
                <label className="campo">Nome<input value={n.nome} onChange={(e) => mudarNpc(n, {}, e.target.value)} onBlur={() => guardar(n)} /></label>
                <div className="npc-nums">
                  <label className="campo">Nível<input type="number" min={1} value={n.dados.nivel} onChange={(e) => mudarNpc(n, { nivel: Math.max(1, num(e.target.value)) })} onBlur={() => guardar(n)} /></label>
                  <label className="campo">CR<input type="number" min={0} value={n.dados.cr} onChange={(e) => mudarNpc(n, { cr: num(e.target.value) })} onBlur={() => guardar(n)} /></label>
                  <label className="campo">PV máx.<input type="number" min={1} value={n.dados.pvMax} onChange={(e) => mudarNpc(n, { pvMax: Math.max(1, num(e.target.value)) })} onBlur={() => guardar(n)} /></label>
                </div>
                <div className="npc-pv">
                  <b>PV {n.dados.pv}/{n.dados.pvMax}</b>
                  {[-10, -5, -1, 1, 5, 10].map((d) => (
                    <button type="button" key={d} className="btn btn-paper" onClick={() => { const novo = { ...n, dados: { ...n.dados, pv: Math.max(0, Math.min(n.dados.pvMax, n.dados.pv + d)) } }; setNpcs((l) => l.map((x) => (x.id === n.id ? novo : x))); void guardar(novo); }}>{d > 0 ? `+${d}` : d}</button>
                  ))}
                </div>
                <label className="campo">Ataque<input value={n.dados.ataque} onChange={(e) => mudarNpc(n, { ataque: e.target.value })} onBlur={() => guardar(n)} placeholder="Ex.: garras, +6 para acertar" /></label>
                <label className="campo">Dano<input value={n.dados.dano} onChange={(e) => mudarNpc(n, { dano: e.target.value })} onBlur={() => guardar(n)} placeholder="Ex.: 2d8+4" /></label>
                <label className="campo">Anotações<textarea rows={3} value={n.dados.notas} onChange={(e) => mudarNpc(n, { notas: e.target.value })} onBlur={() => guardar(n)} /></label>
                <label className="marcar"><input type="checkbox" checked={n.dados.revelado} onChange={(e) => { const novo = { ...n, dados: { ...n.dados, revelado: e.target.checked } }; setNpcs((l) => l.map((x) => (x.id === n.id ? novo : x))); void guardar(novo); }} /> Mostrar aos jogadores</label>
                <button type="button" className="link-perigo" onClick={() => { if (window.confirm(`Apagar o NPC ${n.nome}?`)) void tentar(async () => { await apagarNpc(n.id); setNpcs((l) => l.filter((x) => x.id !== n.id)); }, "Não foi possível apagar o NPC."); }}>Apagar NPC</button>
              </article>
            ) : (
              <article className="npc" key={n.id}>
                <b className="title-font">{n.nome}</b>
                <small>Nível {n.dados.nivel}</small>
                {n.dados.notas && <p className="quebra">{n.dados.notas}</p>}
              </article>
            )
          ))}
        </div>
        {mestre && (
          <form className="linha-rolar" onSubmit={(e) => { e.preventDefault(); void tentar(async () => { const n = await criarNpc(id, novoNpc.trim()); setNpcs((l) => [...l, n]); setNovoNpc(""); }, "Não foi possível criar o NPC."); }}>
            <input value={novoNpc} maxLength={80} placeholder="Nome do novo NPC" aria-label="Nome do novo NPC" onChange={(e) => setNovoNpc(e.target.value)} />
            <button type="submit" className="btn btn-red">Adicionar NPC</button>
          </form>
        )}
      </section>

      <div className="row">
        {mestre ? (
          <button type="button" className="link-perigo" onClick={() => { if (window.confirm(`Apagar a campanha ${camp.nome}? Os NPCs somem e as fichas voltam a ficar sem mesa.`)) void tentar(async () => { await apagarCampanha(id); nav("/campanhas"); }, "Não foi possível apagar a campanha."); }}>Apagar campanha</button>
        ) : (
          <button type="button" className="link-perigo" onClick={() => { if (window.confirm("Sair desta campanha?")) void tentar(async () => { await sairDaCampanha(id); nav("/campanhas"); }, "Não foi possível sair."); }}>Sair da campanha</button>
        )}
      </div>
    </main>
  );
}
