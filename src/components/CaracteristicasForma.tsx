import { useMemo, useState } from "react";
import { calcular, type Ficha, type FormaLib, type HabForma } from "../regras/ficha";
import { custoPeca, orcamentoDaForma, type CtxForma, type InstEfeito } from "../regras/efeitos-forma";
import { FORCAS, infoSub, type SubAcao } from "../regras/cartoes";
import {
  CARACS, GRUPOS_CARAC, acaoAceita, instanciarCarac, ondeLiga, requisitosFaltando, subDaHab,
  type DefCarac, type GrupoCarac, type Liga, type ParamsCarac,
} from "../regras/caracteristicas";
import { FAIXA_CONDICAO, LIMITE_TEXTO, condicoesDaFaixa } from "../regras/faixas-condicao";
import { classeDe } from "./EfeitosForma";
import { Info } from "./Dica";

const novoId = () => `fx-${Math.random().toString(36).slice(2, 9)}`;
const nomesVale = (vale: SubAcao[]) => vale.map((s) => infoSub(s).nome).join(", ");

interface Props {
  f: Ficha;
  tipo: FormaLib["tipo"];
  r: FormaLib;
  mud: (p: Partial<FormaLib>) => void;
}

/** Valor do seletor "Ligar a": "final", "todas" ou "uma:<id da ação>". */
const lerLiga = (v: string): { liga: Liga; acao?: string } => (v === "final" ? { liga: "final" } : v.startsWith("uma:") ? { liga: "uma", acao: v.slice(4) } : { liga: "todas" });
const valorLiga = (c: NonNullable<InstEfeito["carac"]>) => (c.liga === "final" ? "final" : c.liga === "uma" ? `uma:${c.acao ?? ""}` : "todas");

/** Cartões de característica neutros: poderes que se ligam à técnica final, a uma ação ou a todas as ações compatíveis. */
export function CaracteristicasForma({ f, tipo, r, mud }: Props) {
  const c = useMemo(() => calcular({ ...f, estado: { ...f.estado, liberado: "" } }), [f]);
  const ctx: CtxForma = { n: f.nivel, prof: c.prof, atr: c.atr };
  const efeitos = r.efeitos ?? [];
  const habs = r.habilidades ?? [];
  const orc = orcamentoDaForma(f, tipo, r, ctx);
  const [grupo, setGrupo] = useState<GrupoCarac | "">("");
  const [params, setParams] = useState<Record<string, ParamsCarac>>({});
  const [ligas, setLigas] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [tirando, setTirando] = useState("");
  const minhas = efeitos.filter((e) => e.familia === "carac");
  const lista = CARACS.filter((d) => !grupo || d.grupo === grupo);

  const opcoesLiga = (d: DefCarac) => {
    const ok = habs.filter((h) => acaoAceita(d, h));
    const final = ok.find((h) => h.cartao?.final);
    return { ok, final, padrao: final ? "final" : ok[0] ? `uma:${ok[0].id}` : "" };
  };

  const adicionar = (d: DefCarac) => {
    const p = params[d.id] ?? {};
    const { padrao } = opcoesLiga(d);
    const alvo = d.vale.length === 0 ? { liga: "todas" as Liga } : lerLiga(ligas[d.id] ?? padrao);
    const inst = instanciarCarac(d, p, alvo, ctx, novoId());
    const custo = custoPeca(inst, ctx);
    if (custo > orc.livre) { setMsg(`Faltam ${custo - orc.livre} PP para ${d.nome}.`); return; }
    if (d.unica && efeitos.some((e) => e.carac?.id === d.id)) { setMsg(`${d.nome} só pode entrar uma vez.`); return; }
    setMsg(`${inst.nome} entrou na forma (${custo} PP).`);
    mud({ efeitos: [...efeitos, inst] });
  };
  const religar = (id: string, v: string) => mud({ efeitos: efeitos.map((e) => (e.id === id && e.carac ? { ...e, carac: { ...e.carac, liga: lerLiga(v).liga, acao: lerLiga(v).acao } } : e)) });
  const remover = (id: string) => mud({ efeitos: efeitos.filter((e) => e.id !== id) });

  return (
    <div className="caixa efeitos-forma caracs-acao">
      <h3>Características das ações</h3>
      <p className="ajuda">
        Cada cartão de característica custa Pontos de Poder (PP) da forma e muda uma ação: mais dano, condição no acerto, alcance, área maior. Escolha a ação a que ele vale (a técnica final, uma ação sua ou todas as compatíveis). Passar do teto de dano com esses cartões é permitido.
        {" "}<Info>Eles não ocupam vaga de ação. Se você tirar a ação ligada, o cartão fica “solto” e não vale em nada até você ligá-lo a outra.</Info>
      </p>
      <small className="ajuda">PP livres na forma: <b>{orc.livre}</b> de {orc.total}</small>

      {minhas.length > 0 && (
        <ul className="efeitos-lista caracs-lista" aria-label="Características ligadas">
          {minhas.map((e) => {
            const def = CARACS.find((d) => d.id === e.carac?.id);
            const onde = ondeLiga(e, habs);
            const custo = custoPeca(e, ctx);
            const ok = def ? habs.filter((h) => acaoAceita(def, h)) : [];
            return (
              <li key={e.id} className={`${e.confirmado ? "travado" : ""} ${onde.solto ? "solto" : ""}`}>
                <div>
                  <b>{e.nome}</b> <small>{custo} PP{e.confirmado ? " · confirmado" : ""}</small>
                  {e.texto && <p className="ajuda">{e.texto}</p>}
                  {e.carac && e.carac.vale.length > 0 ? (
                    <label className="campo campo-liga">Ligado a
                      <select value={valorLiga(e.carac)} onChange={(ev) => religar(e.id, ev.target.value)}>
                        {ok.some((h) => h.cartao?.final) && <option value="final">Técnica final</option>}
                        {ok.map((h) => <option key={h.id} value={`uma:${h.id}`}>{h.nome || "Ação sem nome"} ({infoSub(subDaHab(h)!).nome})</option>)}
                        {ok.length > 0 && <option value="todas">Todas as ações compatíveis</option>}
                        {onde.solto && <option value={valorLiga(e.carac)}>{onde.texto}</option>}
                      </select>
                    </label>
                  ) : <p className="ajuda">Vale para a forma toda.</p>}
                  {onde.solto && e.carac && e.carac.vale.length > 0 && <p className="aviso-mini">Solto: {onde.texto}. Ligue a outra ação para ele valer.</p>}
                </div>
                {tirando === e.id ? (
                  <span className="tirar-confirma">
                    <button type="button" className="link-perigo" onClick={() => { remover(e.id); setTirando(""); }}>Tirar mesmo</button>
                    <button type="button" className="btn-mini" onClick={() => setTirando("")}>Manter</button>
                  </span>
                ) : (
                  <button type="button" className="link-perigo" onClick={() => (e.confirmado ? setTirando(e.id) : remover(e.id))}>Tirar</button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="filtros-pecas" role="group" aria-label="Grupo de características">
        <button type="button" className={`chip chip-btn ${grupo === "" ? "on" : ""}`} aria-pressed={grupo === ""} onClick={() => setGrupo("")}>Todas</button>
        {GRUPOS_CARAC.filter((g) => CARACS.some((d) => d.grupo === g)).map((g) => <button type="button" key={g} className={`chip chip-btn ${grupo === g ? "on" : ""}`} aria-pressed={grupo === g} onClick={() => setGrupo(grupo === g ? "" : g)}>{g}</button>)}
      </div>

      <div className="cartas-hab galeria-cartoes galeria-caracs galeria-padrao">
        {lista.map((d) => {
          const p = params[d.id] ?? {};
          const { ok, final, padrao } = opcoesLiga(d);
          const ligaAtual = ligas[d.id] ?? padrao;
          const faltam = requisitosFaltando(d, efeitos);
          const semAcao = d.vale.length > 0 && ok.length === 0;
          const inst = instanciarCarac(d, d.param === "condicao" && !p.condicao ? { ...p, condicao: "Preso" } : p, { liga: "todas" }, ctx, "x");
          const custo = custoPeca(inst, ctx);
          const sem = custo > orc.livre;
          const repetida = !!d.unica && efeitos.some((e) => e.carac?.id === d.id);
          const travada = semAcao || faltam.length > 0 || repetida;
          return (
            <article key={d.id} className={`carta-hab carta-peca carta-neutra carta-carac carta-padrao ${travada || sem ? "travada" : ""}`} data-classe={classeDe(tipo)} data-cat={d.grupo.toLowerCase()}>
              <div className="carta-topo">
                <small className="ajuda">{d.grupo}{d.vale.length > 0 ? ` · ${nomesVale(d.vale)}` : " · forma toda"}</small>
                <span className="selo-pp">{custo}<i>PP</i></span>
              </div>
              <h3>{d.nome}</h3>
              <p className="texto-carta">{d.texto}</p>
              <div className="opcoes-carta">
              {(d.param === "dados") && (
                <div className="duas">
                  <label className="campo">Dados
                    <input type="number" min={1} max={4} value={p.n ?? 1} onChange={(e) => setParams((m) => ({ ...m, [d.id]: { ...m[d.id], n: Math.max(1, Math.min(4, Math.floor(Number(e.target.value) || 1))) } }))} />
                  </label>
                  <label className="campo">Dado
                    <select value={p.d ?? 8} onChange={(e) => setParams((m) => ({ ...m, [d.id]: { ...m[d.id], d: Number(e.target.value) } }))}>
                      {[4, 6, 8, 10, 12].map((x) => <option key={x} value={x}>d{x}</option>)}
                    </select>
                  </label>
                </div>
              )}
              {d.param === "dano" && (
                <label className="campo">{d.rotuloParam}
                  <input type="number" min={1} max={30} value={p.n ?? 4} onChange={(e) => setParams((m) => ({ ...m, [d.id]: { ...m[d.id], n: Math.max(1, Math.min(30, Math.floor(Number(e.target.value) || 1))) } }))} />
                </label>
              )}
              {d.param === "tipo" && (
                <label className="campo">{d.rotuloParam}
                  <input value={p.tipo ?? ""} maxLength={30} placeholder="Ex.: Fogo" onChange={(e) => setParams((m) => ({ ...m, [d.id]: { ...m[d.id], tipo: e.target.value } }))} />
                </label>
              )}
              {d.param === "condicao" && (
                <label className="campo">{d.rotuloParam}
                  <select value={p.condicao ?? "Preso"} onChange={(e) => setParams((m) => ({ ...m, [d.id]: { ...m[d.id], condicao: e.target.value } }))}>
                    {FORCAS.map((fz) => (
                      <optgroup key={fz.id} label={`${fz.nome} · ${fz.pp} PP · ${LIMITE_TEXTO[fz.id]}`}>
                        {condicoesDaFaixa(fz.id).map((n) => <option key={n} value={n}>{n}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <small className="ajuda">{(p.condicao ?? "Preso")} é de faixa {FORCAS.find((x) => x.id === FAIXA_CONDICAO[p.condicao ?? "Preso"])?.nome.toLowerCase()}.</small>
                </label>
              )}
              {d.vale.length > 0 && ok.length > 0 && (
                <label className="campo">Ligar a
                  <select value={ligaAtual} onChange={(e) => setLigas((m) => ({ ...m, [d.id]: e.target.value }))}>
                    {final && <option value="final">Técnica final</option>}
                    {ok.map((h: HabForma) => <option key={h.id} value={`uma:${h.id}`}>{h.nome || "Ação sem nome"} ({infoSub(subDaHab(h)!).nome})</option>)}
                    <option value="todas">Todas as ações compatíveis</option>
                  </select>
                </label>
              )}
              {semAcao && <p className="aviso-mini">Monte antes uma ação de {nomesVale(d.vale).toLowerCase()}.</p>}
              {faltam.length > 0 && <p className="aviso-mini">Precisa antes de: {faltam.map((x) => x.nome).join(", ")}.</p>}
              </div>
              <div className="rodape-carta">
                <button type="button" className="btn-mini" disabled={travada || sem} onClick={() => adicionar(d)}>
                  {repetida ? "Já está na forma" : travada ? "Indisponível" : sem ? "Pontos insuficientes" : "Adicionar"}
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
