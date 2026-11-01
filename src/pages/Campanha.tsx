import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { calcular, classePorId } from "../regras/ficha";
import { CATEGORIAS } from "../regras/ameacas";
import { CartaNpc } from "../components/CartaNpc";
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

  const guardar = (n: Npc) => tentar(() => salvarNpc(n), "Não foi possível salvar o NPC.");

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
                  <div className="carta-acoes">
                    <Link className="link-perigo" to={`/fichas/${m.id}`}>Abrir</Link>
                    <button type="button" className="link-perigo" onClick={() => tentar(async () => { await ligarFicha(m.id, null); await carregar(); }, "Não foi possível desligar a ficha.")}>Tirar da mesa</button>
                  </div>
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
              <CartaNpc
                key={n.id}
                npc={n}
                onMudar={(novo, salvar) => { setNpcs((l) => l.map((x) => (x.id === novo.id ? novo : x))); if (salvar) void guardar(novo); }}
                onSalvar={(novo) => void guardar(novo)}
                onApagar={(x) => { if (window.confirm(`Apagar o NPC ${x.nome}?`)) void tentar(async () => { await apagarNpc(x.id); setNpcs((l) => l.filter((y) => y.id !== x.id)); }, "Não foi possível apagar o NPC."); }}
              />
            ) : (
              <article className="npc" key={n.id}>
                <b className="title-font">{n.nome}</b>
                <small>{CATEGORIAS.find((x) => x.id === n.dados.ameaca.categoria)?.nome} · ND {n.dados.ameaca.nd}</small>
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
