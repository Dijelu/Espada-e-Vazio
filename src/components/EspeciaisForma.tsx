import { useMemo, useState } from "react";
import { calcular, type Ficha, type FormaLib, type HabForma } from "../regras/ficha";
import { orcamentoDaForma, type CtxForma, type InstEfeito } from "../regras/efeitos-forma";
import { infoSub, vagasEspeciais, type SubAcao } from "../regras/cartoes";
import {
  INTERACOES_GALERIA, TECNICAS, contarForaDeVaga, contarVagas, ehInteracao, ehTecnica, instanciarInteracao, instanciarTecnica, interacaoPorId, interacaoServe, interacoesDe, podeUsarInteracao, tecnicaDe,
  type DefInteracao, type DefTecnica,
} from "../regras/especiais";
import { subDaHab } from "../regras/caracteristicas";
import { classeDe } from "./EfeitosForma";
import { Info } from "./Dica";

const novoId = () => `fx-${Math.random().toString(36).slice(2, 9)}`;
const nomesVale = (vale: SubAcao[]) => vale.map((s) => infoSub(s).nome.toLowerCase()).join(" ou ");

interface Props {
  f: Ficha;
  tipo: FormaLib["tipo"];
  r: FormaLib;
  mud: (p: Partial<FormaLib>) => void;
}

function useCtxForma(f: Ficha): CtxForma {
  const c = useMemo(() => calcular({ ...f, estado: { ...f.estado, liberado: "" } }), [f]);
  return { n: f.nivel, prof: c.prof, atr: c.atr };
}

/** Pede o aviso de "Tirar" com confirmação para as peças já confirmadas. */
function Tirar({ e, onTirar, tirando, setTirando }: { e: InstEfeito; onTirar: () => void; tirando: string; setTirando: (s: string) => void }) {
  return tirando === e.id ? (
    <span className="tirar-confirma">
      <button type="button" className="link-perigo" onClick={() => { onTirar(); setTirando(""); }}>Tirar mesmo</button>
      <button type="button" className="btn-mini" onClick={() => setTirando("")}>Manter</button>
    </span>
  ) : (
    <button type="button" className="link-perigo" onClick={() => (e.confirmado ? setTirando(e.id) : onTirar())}>Tirar</button>
  );
}

/* ---------------- Técnicas especiais ---------------- */

/** Cartões de técnica especial: criam uma coisa em jogo (clones, invocações, uma marca, uma carga de energia). Só funcionam com ao menos uma interação especial. */
export function TecnicasEspeciais({ f, tipo, r, mud, irParaInteracoes }: Props & { irParaInteracoes: () => void }) {
  const ctx = useCtxForma(f);
  const efeitos = r.efeitos ?? [];
  const orc = orcamentoDaForma(f, tipo, r, ctx);
  const v = vagasEspeciais(tipo);
  const minhas = efeitos.filter(ehTecnica);
  const [msg, setMsg] = useState("");
  const [tirando, setTirando] = useState("");
  const cheio = contarVagas(efeitos, "tecnica") >= v.tec;

  const adicionar = (d: DefTecnica) => {
    if (cheio) { setMsg(`Esta forma só tem ${v.tec} vaga${v.tec === 1 ? "" : "s"} de técnica especial.`); return; }
    if (d.pp > orc.livre) { setMsg(`Faltam ${d.pp - orc.livre} PP para ${d.nome}.`); return; }
    mud({ efeitos: [...efeitos, instanciarTecnica(d, novoId())] });
    setMsg(`${d.nome} entrou na forma (${d.pp} PP). Agora monte uma interação especial para ela: sem isso a técnica não funciona e a forma não salva.`);
  };
  const remover = (id: string) => mud({ efeitos: efeitos.filter((e) => e.id !== id) });

  return (
    <div className="caixa efeitos-forma tecnicas-especiais">
      <h3>Técnicas especiais</h3>
      <p className="ajuda">
        Uma técnica especial cria algo em jogo (clones, criaturas, uma marca, energia guardada). Ela só funciona com pelo menos uma interação especial, que diz o que fazer com ela. Uma técnica pode ter várias interações.
        {" "}<Info>Cada técnica custa PP da forma. Se você tirar a técnica, as interações dela ficam soltas e não valem até serem ligadas a outra.</Info>
      </p>
      <div className="vagas-especiais" aria-label="Vagas de técnicas especiais">
        <span className="selo-vagas"><b>{contarVagas(efeitos, "tecnica")}/{v.tec}</b> vaga{v.tec === 1 ? "" : "s"} de técnica{contarForaDeVaga(efeitos, "tecnica") > 0 ? ` (+${contarForaDeVaga(efeitos, "tecnica")} de ficha antiga, fora das vagas)` : ""}</span>
        <small className="ajuda">PP livres na forma: <b>{orc.livre}</b> de {orc.total}</small>
      </div>

      {minhas.length > 0 && (
        <ul className="efeitos-lista caracs-lista" aria-label="Técnicas especiais da forma">
          {minhas.map((e) => {
            const ligadas = interacoesDe(efeitos, e.id);
            return (
              <li key={e.id} className={`${e.confirmado ? "travado" : ""} ${ligadas.length === 0 ? "solto" : ""}`}>
                <div>
                  <b>{e.nome}</b> <small>{e.pp ?? 0} PP{e.confirmado ? " · confirmado" : ""}{e.espec?.auto ? " · automática" : e.espec?.antiga ? " · de ficha antiga" : ""}</small>
                  <p className="ajuda">{e.texto}</p>
                  {ligadas.length > 0 ? (
                    <div className="marcas-carac" aria-label={`Interações de ${e.nome}`}>
                      <small className="ajuda">Interações:</small>
                      {ligadas.map((x) => <span key={x.id} className="chip marca-carac">{x.nome}</span>)}
                    </div>
                  ) : (
                    <p className="aviso-mini">Sem interação: não funciona. <button type="button" className="link" onClick={irParaInteracoes}>Montar uma interação</button></p>
                  )}
                </div>
                <Tirar e={e} onTirar={() => remover(e.id)} tirando={tirando} setTirando={setTirando} />
              </li>
            );
          })}
        </ul>
      )}

      <div className="cartas-hab galeria-cartoes galeria-especiais galeria-padrao">
        {TECNICAS.map((d) => {
          const repetida = minhas.some((e) => e.espec?.id === d.id);
          const sem = d.pp > orc.livre;
          const travada = repetida || cheio;
          const serve = INTERACOES_GALERIA.filter((i) => i.com.length === 0 || i.com.includes(d.id));
          return (
            <article key={d.id} className={`carta-hab carta-peca carta-neutra carta-especial carta-padrao ${travada || sem ? "travada" : ""}`} data-classe={classeDe(tipo)}>
              <div className="carta-topo">
                <small className="ajuda">Técnica especial</small>
                <span className="selo-pp">{d.pp}<i>PP</i></span>
              </div>
              <h3>{d.nome}</h3>
              <p className="texto-carta">{d.texto}</p>
              <p className="ajuda serve-com"><b>Interações que servem:</b> {serve.map((i) => i.nome).join(", ")}</p>
              <div className="rodape-carta">
                <button type="button" className="btn-mini" disabled={travada || sem} onClick={() => adicionar(d)}>
                  {repetida ? "Já está na forma" : cheio ? "Sem vagas" : sem ? "Pontos insuficientes" : "Adicionar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {msg && <p className="ajuda" role="status">{msg}</p>}
    </div>
  );
}

/* ---------------- Interações especiais ---------------- */

/** Valor do seletor "Ligar a" (ação): "final", "todas" ou "uma:<id da ação>". */
const lerLiga = (v: string): { liga: "final" | "uma" | "todas"; acao?: string } => (v === "final" ? { liga: "final" } : v.startsWith("uma:") ? { liga: "uma", acao: v.slice(4) } : { liga: "todas" });

/** Cartões de interação especial: dizem o que fazer com uma técnica especial. Cada interação precisa de uma técnica a que servir. */
export function InteracoesEspeciais({ f, tipo, r, mud, irParaTecnicas }: Props & { irParaTecnicas: () => void }) {
  const ctx = useCtxForma(f);
  const efeitos = r.efeitos ?? [];
  const habs = r.habilidades ?? [];
  const orc = orcamentoDaForma(f, tipo, r, ctx);
  const v = vagasEspeciais(tipo);
  const tecs = efeitos.filter(ehTecnica);
  const minhas = efeitos.filter(ehInteracao);
  const [msg, setMsg] = useState("");
  const [tirando, setTirando] = useState("");
  const [escolha, setEscolha] = useState<Record<string, string>>({});
  const [ligas, setLigas] = useState<Record<string, string>>({});
  const cheio = contarVagas(efeitos, "interacao") >= v.inter;

  const acoesDe = (d: Pick<DefInteracao, "vale">) => habs.filter((h: HabForma) => { const s = subDaHab(h); return !!s && d.vale.includes(s); });
  const servem = (d: DefInteracao) => tecs.filter((t) => interacaoServe(d, t));
  const padraoLiga = (d: DefInteracao) => { const ok = acoesDe(d); const fin = ok.find((h) => h.cartao?.final); return fin ? "final" : ok[0] ? `uma:${ok[0].id}` : "todas"; };

  const adicionar = (d: DefInteracao) => {
    const ts = servem(d);
    const alvo = ts.find((t) => t.id === escolha[d.id]) ?? ts[0];
    if (!alvo) return;
    if (cheio) { setMsg(`Esta forma só tem ${v.inter} vaga${v.inter === 1 ? "" : "s"} de interação especial.`); return; }
    if (d.pp > orc.livre) { setMsg(`Faltam ${d.pp - orc.livre} PP para ${d.nome}.`); return; }
    mud({ efeitos: [...efeitos, instanciarInteracao(d, alvo.id, lerLiga(ligas[d.id] ?? padraoLiga(d)), novoId())] });
    setMsg(`${d.nome} entrou na forma, ligada a ${alvo.nome} (${d.pp} PP).`);
  };
  const remover = (id: string) => mud({ efeitos: efeitos.filter((e) => e.id !== id) });
  const religarTec = (id: string, tec: string) => mud({ efeitos: efeitos.map((e) => (e.id === id && e.espec ? { ...e, espec: { ...e.espec, tec } } : e)) });
  const religarAcao = (id: string, val: string) => mud({ efeitos: efeitos.map((e) => (e.id === id && e.carac ? { ...e, carac: { ...e.carac, liga: lerLiga(val).liga, acao: lerLiga(val).acao } } : e)) });

  return (
    <div className="caixa efeitos-forma interacoes-especiais">
      <h3>Interações especiais</h3>
      <p className="ajuda">
        Uma interação especial diz o que fazer com uma técnica especial: trocar de lugar com um clone, lançar um Gran Rey Cero junto da energia, reforçar a técnica. Toda interação precisa estar ligada a uma técnica; uma técnica pode receber várias.
        {" "}<Info>Cada interação custa PP da forma. A técnica sozinha não funciona: as interações é que dão o que fazer com ela.</Info>
      </p>
      <div className="vagas-especiais" aria-label="Vagas de interações especiais">
        <span className="selo-vagas"><b>{contarVagas(efeitos, "interacao")}/{v.inter}</b> vaga{v.inter === 1 ? "" : "s"} de interação{contarForaDeVaga(efeitos, "interacao") > 0 ? ` (+${contarForaDeVaga(efeitos, "interacao")} automática${contarForaDeVaga(efeitos, "interacao") === 1 ? "" : "s"} ou de ficha antiga, fora das vagas)` : ""}</span>
        <small className="ajuda">PP livres na forma: <b>{orc.livre}</b> de {orc.total}</small>
      </div>
      {tecs.length === 0 && <p className="aviso-mini">Nenhuma técnica especial na forma ainda. <button type="button" className="link" onClick={irParaTecnicas}>Monte uma técnica primeiro</button>.</p>}

      {minhas.length > 0 && (
        <ul className="efeitos-lista caracs-lista" aria-label="Interações especiais da forma">
          {minhas.map((e) => {
            const def = interacaoPorId(e.espec?.id ?? "");
            const atual = tecnicaDe(efeitos, e);
            const possiveis = def ? tecs.filter((t) => interacaoServe(def, t)) : tecs;
            const ok = def ? acoesDe(def) : [];
            return (
              <li key={e.id} className={`${e.confirmado ? "travado" : ""} ${atual ? "" : "solto"}`}>
                <div>
                  <b>{e.nome}</b> <small>{e.pp ?? 0} PP{e.confirmado ? " · confirmado" : ""}{e.espec?.auto ? " · automática" : e.espec?.antiga ? " · de ficha antiga" : ""}</small>
                  <p className="ajuda">{e.texto}</p>
                  <label className="campo campo-liga">Serve à técnica
                    <select value={atual?.id ?? ""} onChange={(ev) => religarTec(e.id, ev.target.value)}>
                      {!atual && <option value="">Nenhuma (solta)</option>}
                      {possiveis.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  </label>
                  {!atual && <p className="aviso-mini">Solta: não funciona. {possiveis.length === 0 ? `Monte a técnica ${def?.com.map((c) => TECNICAS.find((t) => t.id === c)?.nome).join(" ou ") ?? ""} para ela servir.` : "Escolha uma técnica acima."}</p>}
                  {e.carac && e.carac.vale.length > 0 && (
                    <label className="campo campo-liga">Vale na ação
                      <select value={e.carac.liga === "final" ? "final" : e.carac.liga === "uma" ? `uma:${e.carac.acao ?? ""}` : "todas"} onChange={(ev) => religarAcao(e.id, ev.target.value)}>
                        {ok.some((h) => h.cartao?.final) && <option value="final">Técnica final</option>}
                        {ok.map((h) => <option key={h.id} value={`uma:${h.id}`}>{h.nome || "Ação sem nome"} ({infoSub(subDaHab(h)!).nome})</option>)}
                        <option value="todas">Todas as ações compatíveis</option>
                      </select>
                    </label>
                  )}
                </div>
                <Tirar e={e} onTirar={() => remover(e.id)} tirando={tirando} setTirando={setTirando} />
              </li>
            );
          })}
        </ul>
      )}

      <div className="cartas-hab galeria-cartoes galeria-especiais galeria-padrao">
        {INTERACOES_GALERIA.map((d) => {
          const ts = servem(d);
          const repetida = minhas.some((e) => e.espec?.id === d.id);
          const sem = d.pp > orc.livre;
          const proibida = !podeUsarInteracao(d, f);
          const semTecnica = ts.length === 0;
          const travada = repetida || cheio || proibida || semTecnica;
          const ok = acoesDe(d);
          const nomesTec = d.com.length ? d.com.map((c) => TECNICAS.find((t) => t.id === c)?.nome ?? c).join(" ou ") : "qualquer técnica";
          return (
            <article key={d.id} className={`carta-hab carta-peca carta-neutra carta-especial carta-padrao ${travada || sem ? "travada" : ""}`} data-classe={classeDe(tipo)}>
              <div className="carta-topo">
                <small className="ajuda">Interação especial{d.soHollow ? " · Visored e Hollow" : ""}</small>
                <span className="selo-pp">{d.pp}<i>PP</i></span>
              </div>
              <h3>{d.nome}</h3>
              <p className="texto-carta">{d.texto}</p>
              <p className="ajuda serve-com"><b>Serve a:</b> {nomesTec}</p>
              <div className="opcoes-carta">
              {ts.length > 1 && (
                <label className="campo">Ligar à técnica
                  <select value={escolha[d.id] ?? ts[0].id} onChange={(e) => setEscolha((m) => ({ ...m, [d.id]: e.target.value }))}>
                    {ts.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </label>
              )}
              {d.vale.length > 0 && ok.length > 0 && (
                <label className="campo">Vale na ação
                  <select value={ligas[d.id] ?? padraoLiga(d)} onChange={(e) => setLigas((m) => ({ ...m, [d.id]: e.target.value }))}>
                    {ok.some((h) => h.cartao?.final) && <option value="final">Técnica final</option>}
                    {ok.map((h) => <option key={h.id} value={`uma:${h.id}`}>{h.nome || "Ação sem nome"} ({infoSub(subDaHab(h)!).nome})</option>)}
                    <option value="todas">Todas as ações compatíveis</option>
                  </select>
                </label>
              )}
              {d.vale.length > 0 && ok.length === 0 && <p className="aviso-mini">Vale em ações de {nomesVale(d.vale)}: ligue depois.</p>}
              {semTecnica && !proibida && <p className="aviso-mini">Monte antes a técnica: {nomesTec}.</p>}
              {proibida && <p className="aviso-mini">Só para Visored e Hollow.</p>}
              </div>
              <div className="rodape-carta">
                <button type="button" className="btn-mini" disabled={travada || sem} onClick={() => adicionar(d)}>
                  {repetida ? "Já está na forma" : proibida ? "Indisponível" : semTecnica ? "Falta a técnica" : cheio ? "Sem vagas" : sem ? "Pontos insuficientes" : "Adicionar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {msg && <p className="ajuda" role="status">{msg}</p>}
    </div>
  );
}
