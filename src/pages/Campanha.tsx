import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { calcular, classePorId } from "../regras/ficha";
import { CATEGORIAS, ameacaDoModelo, ameacaPadrao, type Categoria, type ModeloAmeaca } from "../regras/ameacas";
import prontas from "../regras/ameacas-prontas.json";

const MODELOS = prontas as unknown as ModeloAmeaca[];
import { CartaNpc } from "../components/CartaNpc";
import { FichaLeitura } from "../components/FichaLeitura";
import { CombateMesa } from "../components/CombateMesa";
import { OrdemCombate } from "../components/OrdemCombate";
import {
  apagarCampanha, apagarNpc, criarNpc, fichasDaMesa, lerCampanha, ligarFicha, listarNpcs, minhasFichasSemMesa, salvarNpc, sairDaCampanha, listarModelosSalvos, salvarModelo, apagarModelo, type ModeloSalvo,
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
  const [pastaNova, setPastaNova] = useState("");
  const [salvos, setSalvos] = useState<ModeloSalvo[]>([]);
  const [okMsg, setOkMsg] = useState("");
  const [modelo, setModelo] = useState("");
  const [ndNovo, setNdNovo] = useState(1);
  const [categoriaNova, setCategoriaNova] = useState<Categoria>("shinigami");
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [lendo, setLendo] = useState<string[]>([]);

  const meuId = sessao?.user.id ?? "";
  const mestre = camp ? camp.dono === meuId : false;

  const carregar = useCallback(async () => {
    try {
      const c = await lerCampanha(id);
      setCamp(c);
      if (!c) return;
      const [fs, ns, ls] = await Promise.all([fichasDaMesa(id), listarNpcs(id), minhasFichasSemMesa()]);
      listarModelosSalvos().then(setSalvos).catch(() => undefined);
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

  // atualização quase em tempo real: fichas da mesa (e NPCs revelados, para os jogadores) a cada 5 s
  useEffect(() => {
    if (!camp) return;
    const t = window.setInterval(() => {
      if (document.hidden) return;
      void fichasDaMesa(id).then(setFichas).catch(() => undefined);
      if (camp.dono !== meuId) void listarNpcs(id).then(setNpcs).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(t);
  }, [camp, id, meuId]);

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

  const pastas = Array.from(new Set(["", ...npcs.map((n) => n.dados.pasta)])).sort((a, b) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b, "pt-BR")));
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
              <article className={`carta${mestre && lendo.includes(m.id) ? " ficha-leitura-aberta" : ""}`} key={m.id}>
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
                {mestre && (
                  <details
                    className="npc-edicao ficha-leitura-painel"
                    open={lendo.includes(m.id)}
                    onToggle={(e) => {
                      const aberto = (e.currentTarget as HTMLDetailsElement).open;
                      setLendo((l) => (aberto ? (l.includes(m.id) ? l : [...l, m.id]) : l.filter((x) => x !== m.id)));
                    }}
                  >
                    <summary>{lendo.includes(m.id) ? "Recolher ficha" : "Ver ficha completa"}</summary>
                    {lendo.includes(m.id) && <FichaLeitura f={m.ficha} nome={m.nome} />}
                  </details>
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
        {mestre ? (
          <>
            <datalist id="pastas-npc">{pastas.filter(Boolean).map((p) => <option key={p} value={p} />)}</datalist>
            {pastas.map((pasta) => {
              const lista = npcs.filter((n) => n.dados.pasta === pasta);
              const cartas = (
                <div className="npcs">
                  {lista.map((n) => (
                    <CartaNpc
                      key={n.id}
                      npc={n}
                      onMudar={(novo, salvar) => { setNpcs((l) => l.map((x) => (x.id === novo.id ? novo : x))); if (salvar) void guardar(novo); }}
                      onSalvar={(novo) => void guardar(novo)}
                      onModelo={(x) => void tentar(async () => { const m = await salvarModelo(meuId, x.nome, x.dados.ameaca); setSalvos((l) => [...l, m]); setOkMsg(`"${x.nome}" salvo nos seus modelos.`); }, "Não foi possível salvar o modelo.")}
                      onDuplicar={(x) => void tentar(async () => { const n = await criarNpc(id, `${x.nome} (cópia)`, x.dados.ameaca); n.dados.pasta = x.dados.pasta; if (n.dados.pasta) await salvarNpc(n); setNpcs((l) => [...l, n]); }, "Não foi possível duplicar o NPC.")}
                      onApagar={(x) => { if (window.confirm(`Apagar o NPC ${x.nome}?`)) void tentar(async () => { await apagarNpc(x.id); setNpcs((l) => l.filter((y) => y.id !== x.id)); }, "Não foi possível apagar o NPC."); }}
                    />
                  ))}
                </div>
              );
              return pasta === "" ? (
                lista.length > 0 && <div key="sem" className="pasta-sem">{pastas.length > 1 && <h4 className="sub-passivas">Sem pasta</h4>}{cartas}</div>
              ) : (
                <details className="pasta" key={pasta}>
                  <summary><b>{pasta}</b> <small>{lista.length} {lista.length === 1 ? "NPC" : "NPCs"}</small></summary>
                  {cartas}
                </details>
              );
            })}
          </>
        ) : (
          <div className="npcs">
            {npcs.map((n) => (
              <article className="npc" key={n.id}>
                <b className="title-font">{n.nome}</b>
                <small>{CATEGORIAS.find((x) => x.id === n.dados.ameaca.categoria)?.nome} · ND {n.dados.ameaca.nd}</small>
                {n.dados.notas && <p className="quebra">{n.dados.notas}</p>}
              </article>
            ))}
          </div>
        )}
        {mestre && (
          <form className="criar-npc" onSubmit={(e) => {
            e.preventDefault();
            const ms = salvos.find((x) => `s:${x.id}` === modelo);
            const m = MODELOS.find((x) => x.id === modelo);
            const ameaca = ms ? { ...ms.ameaca, nd: ndNovo } : m ? ameacaDoModelo(m, ndNovo) : ameacaPadrao(categoriaNova, ndNovo);
            void tentar(async () => { const n = await criarNpc(id, novoNpc.trim() || ms?.nome || m?.nome || "", ameaca); n.dados.pasta = pastaNova.trim(); if (n.dados.pasta) await salvarNpc(n); setNpcs((l) => [...l, n]); setNovoNpc(""); }, "Não foi possível criar o NPC.");
          }}>
            <h4 className="sub-passivas">Novo NPC</h4>
            <div className="npc-form">
              <label className="campo">Modelo do livro
                <select value={modelo} onChange={(e) => { setModelo(e.target.value); const m = MODELOS.find((x) => x.id === e.target.value); if (m) setNdNovo(m.nd); const ms = salvos.find((x) => `s:${x.id}` === e.target.value); if (ms) setNdNovo(ms.ameaca.nd); }}>
                  <option value="">Em branco (monto do zero)</option>
                  {salvos.length > 0 && <optgroup label="Meus modelos">{salvos.map((m) => <option key={m.id} value={`s:${m.id}`}>{m.nome}</option>)}</optgroup>}
                  <optgroup label="Do livro">{MODELOS.map((m) => <option key={m.id} value={m.id}>{m.nome} ({m.formato === "raid" ? "Raid" : "Solo"})</option>)}</optgroup>
                </select>
              </label>
              {!modelo && (
                <label className="campo">Categoria
                  <select value={categoriaNova} onChange={(e) => setCategoriaNova(e.target.value as Categoria)}>
                    {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </label>
              )}
              <label className="campo">Nível de Desafio
                <input type="number" min={1} max={20} value={ndNovo} onChange={(e) => setNdNovo(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} />
              </label>
              <label className="campo">Pasta (encontro)
                <input list="pastas-npc" value={pastaNova} maxLength={60} placeholder="Opcional" onChange={(e) => setPastaNova(e.target.value)} />
              </label>
              <label className="campo">Nome
                <input value={novoNpc} maxLength={80} placeholder="Nome do NPC" onChange={(e) => setNovoNpc(e.target.value)} />
              </label>
            </div>
            <button type="submit" className="btn btn-red">Adicionar NPC</button>
            {okMsg && <p className="ajuda" role="status">{okMsg}</p>}
            {modelo.startsWith("s:") && <button type="button" className="link-perigo" onClick={() => { const ms = salvos.find((x) => `s:${x.id}` === modelo); if (ms && window.confirm(`Apagar o modelo ${ms.nome}?`)) void tentar(async () => { await apagarModelo(ms.id); setSalvos((l) => l.filter((x) => x.id !== ms.id)); setModelo(""); }, "Não foi possível apagar o modelo."); }}>Apagar este modelo salvo</button>}
          </form>
        )}
      </section>

      {mestre ? <CombateMesa campanhaId={id} fichas={fichas} npcs={npcs} pastas={pastas.filter(Boolean)} /> : <OrdemCombate campanhaId={id} />}

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
