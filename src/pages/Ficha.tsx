import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SeletorEssencia } from "../components/SeletorEssencia";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CartasHabilidades, CondicoesAtivas, EfeitosAtivos } from "../components/CartasResumo";
import { AcoesRapidas } from "../components/AcoesRapidas";
import { EscolhaPoderes, pendencias, subclassePendente, totalPendencias } from "../components/EscolhaPoderes";
import { EscolhaSubclasse } from "../components/EscolhaSubclasse";
import { CartasFormas, ConstrutorForma, PainelFormaAtiva } from "../components/ConstrutorForma";
import { TIPO_FORMA_NOME, formaPendente, nivelLiberacao } from "../regras/liberacoes";
import { Campo, LinhaAtributos, Passo, SeletorVariacoes, novoId } from "../components/FichaPecas";
import { BotaoRolar, PainelRolagens, useRolagens, type Rolagens } from "../components/Rolador";
import { AbaTreinamento } from "../components/Treinamento";
import { ARMAS, KIDOS, talentosDe } from "../regras/catalogo";
import { lerFicha, salvarFicha } from "../lib/fichas";
import { efeito as som } from "../lib/som";
import {
  ATRIBUTOS,
  NIVEIS_ESSENCIA,
  NIVEIS_PONTO_ATRIBUTO,
  NIVEIS_SUBCLASSE,
  PERICIAS,
  XP_NIVEL,
  ataqueBonus,
  calcular,
  classePorId,
  mod,
  nivelPorXp,
  origemPorId,
  partesOrigem,
  proficiencia,
  type Atr,
  type Ficha as TFicha,
  type TipoForma,
} from "../regras/ficha";

const ABAS = ["Resumo", "Combate", "Perícias", "Poderes", "Treinamento", "Evolução", "Notas"] as const;
type Aba = (typeof ABAS)[number];

export default function Ficha() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState<TFicha | null>(null);
  const [erro, setErro] = useState("");
  const [estado, setEstado] = useState<"salvo" | "salvando" | "erro">("salvo");
  const [aba, setAba] = useState<Aba>("Resumo");
  const carregada = useRef(false);
  const [construir, setConstruir] = useState<TipoForma | null>(null);
  const nivelVisto = useRef<number | null>(null);
  const [subAberta, setSubAberta] = useState(false);
  const rol = useRolagens();

  useEffect(() => {
    if (!id) return;
    carregada.current = false;
    nivelVisto.current = null;
    lerFicha(id)
      .then((r) => {
        if (!r) setErro("Ficha não encontrada.");
        else {
          setF(r.data);
          carregada.current = true;
        }
      })
      .catch(() => setErro("Não foi possível abrir a ficha."));
  }, [id]);

  const alterar = useCallback((p: Partial<TFicha> | ((x: TFicha) => Partial<TFicha>)) => {
    setF((x) => (x ? { ...x, ...(typeof p === "function" ? p(x) : p) } : x));
    setEstado("salvando");
  }, []);

  // salva sozinho, um instante depois da última mudança
  useEffect(() => {
    if (!f || !id || !carregada.current || estado !== "salvando") return;
    const t = window.setTimeout(() => {
      salvarFicha(id, f)
        .then(() => setEstado("salvo"))
        .catch(() => setEstado("erro"));
    }, 800);
    return () => window.clearTimeout(t);
  }, [f, id, estado]);

  const c = useMemo(() => (f ? calcular(f) : null), [f]);

  // abre a próxima janela pendente: primeiro a subclasse, depois a forma de liberação (Shikai, Bankai...)
  const proxima = useCallback((x: TFicha) => {
    if (subclassePendente(x)) {
      setSubAberta(true);
      return;
    }
    const t = formaPendente(x, classePorId(x.classe)?.tipo);
    if (t) setConstruir(t);
  }, []);

  // ao abrir a ficha e ao subir de nível, mostra as escolhas que faltam
  useEffect(() => {
    if (!f) return;
    const antes = nivelVisto.current;
    nivelVisto.current = f.nivel;
    if (antes === null || f.nivel > antes) proxima(f);
  }, [f, proxima]);

  const subirNivel = useCallback(() => {
    alterar((x) => ({ nivel: Math.min(20, x.nivel + 1) }));
    setAba("Evolução");
    window.scrollTo({ top: 0, behavior: "smooth" });
    som.energia();
  }, [alterar]);

  if (erro)
    return (
      <main className="page">
        <p className="aviso" role="alert">{erro}</p>
        <Link className="btn btn-paper" to="/fichas">Minhas fichas</Link>
      </main>
    );
  if (!f || !c) return <main className="page"><p>Carregando…</p></main>;

  const classe = classePorId(f.classe);
  const partes = partesOrigem(f);
  const estagio = partes[0]?.origem;
  const variacao = partes[0]?.variacao;

  const pend = pendencias(f);
  const nPend = totalPendencias(pend);
  const nivelXp = nivelPorXp(f.xp);
  const podeSubir = nivelXp > f.nivel && f.nivel < 20;

  const pvPct = c.pv > 0 ? Math.max(0, Math.min(100, (f.pvAtual / c.pv) * 100)) : 0;
  const prPct = c.pr > 0 ? Math.max(0, Math.min(100, (f.prAtual / c.pr) * 100)) : 0;

  return (
    <main className="page ficha">
      <header className="ficha-topo">
        <div className="ficha-id">
          <Link className="voltar-fixo" to="/fichas">← Minhas fichas</Link>
          <input className="nome-ficha title-font" value={f.nome} onChange={(e) => alterar({ nome: e.target.value })} aria-label="Nome do personagem" />
          <p>
            {estagio?.nome}{variacao ? ` (${variacao.nome})` : ""} · {classe?.nome}
            {f.subclasse ? ` · ${f.subclasse}` : ""} · nível {f.nivel}
          </p>
        </div>
        <span className={`estado-salvo ${estado}`} role="status">
          {estado === "salvo" ? "Salvo" : estado === "salvando" ? "Salvando…" : "Não foi possível salvar"}
        </span>
      </header>

      <section className="barras" aria-label="Vida e reiatsu">
        <Barra tipo="pv" rotulo="PV" atual={f.pvAtual} max={c.pv} pct={pvPct} onChange={(v) => alterar({ pvAtual: v })} />
        <Barra tipo="pr" rotulo="PR" atual={f.prAtual} max={c.pr} pct={prPct} onChange={(v) => alterar({ prAtual: v })} />
        <div className="selos">
          <div><small>CR</small><b>{c.cr}</b></div>
          <div><small>Proficiência</small><b>{mod(c.prof)}</b></div>
          <div><small>Iniciativa</small><b>{mod(c.iniciativa)}</b><BotaoRolar r={rol} rotulo="Iniciativa" bonus={c.iniciativa} /></div>
          <div><small>Desloc.</small><b>{c.desloc} m</b></div>
          <div><small>Perc. passiva</small><b>{c.percPassiva}</b></div>
          <div><small>CD</small><b>{c.cd}</b></div>
        </div>
      </section>

      <LinhaAtributos atr={c.atr} />

      <AcoesRapidas f={f} c={c} alterar={alterar} r={rol} />

      <PainelFormaAtiva f={f} c={c} r={rol} alterar={alterar} />

      {(podeSubir || nPend > 0) && (
        <div className="banner-evolucao" role="status">
          {podeSubir ? <span>Você tem XP para o <b>nível {f.nivel + 1}</b>.</span> : <span>Você tem <b>{nPend}</b> escolha(s) de poderes pendente(s).</span>}
          {podeSubir ? (
            <button type="button" className="btn btn-red" onClick={subirNivel}>Subir de nível</button>
          ) : (
            <button type="button" className="btn btn-red" onClick={() => setAba("Evolução")}>Escolher agora</button>
          )}
        </div>
      )}

      {c.avisos.length > 0 && <ul className="avisos">{c.avisos.map((a) => <li key={a}>{a}</li>)}</ul>}

      <nav className="abas" role="tablist" aria-label="Seções da ficha">
        {ABAS.map((a) => (
          <button key={a} role="tab" aria-selected={aba === a} className={aba === a ? "on" : ""} onClick={() => setAba(a)}>{a}{a === "Evolução" && nPend > 0 ? <i className="pontinho" aria-label={`${nPend} pendente(s)`}>{nPend}</i> : null}</button>
        ))}
      </nav>

      {aba === "Resumo" && (
        <section className="aba">
          <div className="grade3">
            <div className="caixa">
              <h3>Ataques</h3>
              {f.ataques.length === 0 && <p className="ajuda">Nenhum ataque ainda. Cadastre na aba Combate.</p>}
              {f.ataques.map((a) => (
                <div className="carta-mini" key={a.id}>
                  <b>{a.nome}</b>
                  <span>Acerto {mod(ataqueBonus(f, c, a))} · Dano {danoFinal(a.dano, a, c) || "—"}</span>
                  <LinhaAtaque r={rol} nome={a.nome} bonus={ataqueBonus(f, c, a)} dano={danoFinal(a.dano, a, c)} />
                </div>
              ))}
            </div>
            <div className="caixa">
              <h3>Poderes</h3>
              {f.poderes.length === 0 && <p className="ajuda">Nenhum poder ainda. Cadastre na aba Poderes.</p>}
              {f.poderes.map((p) => (
                <div className="carta-mini" key={p.id}>
                  <b>{p.nome}</b>
                  <span>{p.tipo}{p.custo ? ` · ${p.custo}` : ""}</span>
                </div>
              ))}
            </div>
            <div className="caixa">
              <h3>Salvaguardas</h3>
              {ATRIBUTOS.map((a) => (
                <div className={`linha-sv ${c.saves[a.id].prof ? "prof" : ""}`} key={a.id}>
                  <span>{c.saves[a.id].prof ? "●" : "○"} {a.nome}</span>
                  <b>{mod(c.saves[a.id].total)}</b>
                  <BotaoRolar r={rol} rotulo={`Salvaguarda de ${a.nome}`} bonus={c.saves[a.id].total} />
                </div>
              ))}
              {(c.rdFis > 0 || c.rdEso > 0) && (
                <p className="ajuda">RD: {c.rdFis > 0 ? `${c.rdFis} físico` : ""}{c.rdFis > 0 && c.rdEso > 0 ? " · " : ""}{c.rdEso > 0 ? `${c.rdEso} esotérico` : ""}</p>
              )}
            </div>
          </div>
          <CartasHabilidades f={f} c={c} alterar={alterar} r={rol} />
          <CartasFormas f={f} c={c} r={rol} alterar={alterar} onEditar={setConstruir} />
          <div className="grade2">
            <EfeitosAtivos f={f} c={c} />
            <CondicoesAtivas f={f} alterar={alterar} />
          </div>
          {f.essencias.length > 0 && (
            <div className="caixa">
              <h3>Essências Espirituais</h3>
              <div className="chips">{f.essencias.map((e) => <span key={e.id} className="chip">{e.nome} · etapa {e.etapa}</span>)}</div>
            </div>
          )}
        </section>
      )}

      {aba === "Combate" && (
        <section className="aba">
          <div className="grade2">
            <div className="caixa">
              <h3>Classe de Resistência</h3>
              <p>
                {classe?.cr === "plena" ? "Plena" : "Leve"}: 10 + proficiência ({c.prof}) + {classe?.cr === "plena" ? `Constituição (${c.atr.con})` : `metade da Constituição (${Math.floor(c.atr.con / 2)})`} + Destreza ({c.atr.des})
                {c.cr - (10 + c.prof + c.atr.des + (classe?.cr === "plena" ? c.atr.con : Math.floor(c.atr.con / 2))) !== 0 && ` + bônus (${c.cr - (10 + c.prof + c.atr.des + (classe?.cr === "plena" ? c.atr.con : Math.floor(c.atr.con / 2)))})`}
                {" "}= <b>{c.cr}</b>.
              </p>
              <p className="ajuda">Ao liberar o Shikai, some a proficiência à sua CR enquanto ele durar ({c.cr + c.prof}).</p>
            </div>
            <div className="caixa">
              <h3>Ajustes manuais</h3>
              <p className="ajuda">Para bônus de essências, talentos e subclasses que a ficha não calcula sozinha.</p>
              <div className="grade3 pequeno">
                <Campo rotulo="PV"><Passo valor={f.ajuste.pv} min={-200} max={999} onChange={(v) => alterar({ ajuste: { ...f.ajuste, pv: v } })} rotulo="ajuste de PV" /></Campo>
                <Campo rotulo="PR"><Passo valor={f.ajuste.pr} min={-200} max={999} onChange={(v) => alterar({ ajuste: { ...f.ajuste, pr: v } })} rotulo="ajuste de PR" /></Campo>
                <Campo rotulo="CR"><Passo valor={f.ajuste.cr} min={-20} max={40} onChange={(v) => alterar({ ajuste: { ...f.ajuste, cr: v } })} rotulo="ajuste de CR" /></Campo>
              </div>
            </div>
          </div>
          <div className="caixa">
            <h3>Ataques</h3>
            {f.ataques.map((a) => (
              <div className="linha-edit" key={a.id}>
                <input value={a.nome} onChange={(e) => alterar({ ataques: f.ataques.map((x) => (x.id === a.id ? { ...x, nome: e.target.value } : x)) })} aria-label="Nome do ataque" />
                <select value={a.atr} onChange={(e) => alterar({ ataques: f.ataques.map((x) => (x.id === a.id ? { ...x, atr: e.target.value as Atr } : x)) })} aria-label="Atributo do ataque">
                  {ATRIBUTOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
                <input value={a.dano} placeholder="Dano (ex.: 2d8+3)" onChange={(e) => alterar({ ataques: f.ataques.map((x) => (x.id === a.id ? { ...x, dano: e.target.value } : x)) })} aria-label="Dano" />
                <span className="acerto">{mod(ataqueBonus(f, c, a))}</span>
                <LinhaAtaque r={rol} nome={a.nome} bonus={ataqueBonus(f, c, a)} dano={danoFinal(a.dano, a, c)} />
                <button className="link-perigo" onClick={() => alterar({ ataques: f.ataques.filter((x) => x.id !== a.id) })}>Remover</button>
              </div>
            ))}
            <select className="arma-add" value="" aria-label="Adicionar arma do livro" onChange={(e) => {
              const a = [...ARMAS.corpo, ...ARMAS.distancia].find((x) => x.nome === e.target.value);
              if (a) alterar({ ataques: [...f.ataques, { id: novoId(), nome: a.nome, atr: a.atr.startsWith("Destreza") ? "des" : "for", dano: a.dano, distancia: ARMAS.distancia.some((x) => x.nome === a.nome) }] });
            }}>
              <option value="">Adicionar arma do livro…</option>
              {[...ARMAS.corpo, ...ARMAS.distancia].map((a) => <option key={a.nome} value={a.nome}>{a.nome} ({a.dano})</option>)}
            </select>
            <button className="btn btn-paper" onClick={() => alterar({ ataques: [...f.ataques, { id: novoId(), nome: "Zanpakutou", atr: classe?.chave.startsWith("Destreza") ? "des" : "for", dano: "" }] })}>Adicionar ataque</button>
          </div>
        </section>
      )}

      {aba === "Perícias" && (
        <section className="aba">
          <p className="ajuda">Proficiente em {PERICIAS.filter((p) => c.pericias[p.id].prof).length} perícia(s). Você pode escolher {c.quantasPericias} além das fixas.</p>
          <div className="caixa">
            <h3>Salvaguardas</h3>
            <div className="saves-grade">
              {ATRIBUTOS.map((a) => (
                <div className={`linha-sv ${c.saves[a.id].prof ? "prof" : ""}`} key={a.id}>
                  <span>{c.saves[a.id].prof ? "●" : "○"} {a.nome}</span>
                  <b>{mod(c.saves[a.id].total)}</b>
                  <BotaoRolar r={rol} rotulo={`Salvaguarda de ${a.nome}`} bonus={c.saves[a.id].total} />
                </div>
              ))}
            </div>
          </div>
          <div className="pericias-grade">
            {ATRIBUTOS.map((a) => (
              <div key={a.id}>
                <h3>{a.nome}</h3>
                {PERICIAS.filter((p) => p.atr === a.id).map((p) => {
                  const r = c.pericias[p.id];
                  return (
                    <label key={p.id} className={`pericia ${r.prof ? "on" : ""}`}>
                      <input
                        type="checkbox"
                        checked={r.prof}
                        disabled={r.fixa}
                        onChange={() => alterar({ pericias: f.pericias.includes(p.id) ? f.pericias.filter((x) => x !== p.id) : [...f.pericias, p.id] })}
                      />
                      <span>{p.nome}{r.fixa && " 🔒"}</span>
                      <em>{mod(r.total)}</em>
                      <BotaoRolar r={rol} rotulo={p.nome} bonus={r.total} />
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {aba === "Poderes" && (
        <section className="aba">
          <div className="caixa">
            <h3>Essências Espirituais</h3>
            <p className="ajuda">Pontos: {c.pontosEssencia.usados} de {c.pontosEssencia.total} usados. Os nomes e efeitos estão no <Link to="/livro/essencias-espirituais" target="_blank">Capítulo 4</Link>.</p>
            {f.essencias.map((e) => (
              <div className="linha-edit" key={e.id}>
                <input value={e.nome} onChange={(ev) => alterar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, nome: ev.target.value } : x)) })} aria-label="Nome da essência" />
                <Passo valor={e.etapa} min={1} max={5} rotulo={`etapa de ${e.nome}`} onChange={(v) => alterar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, etapa: v } : x)) })} />
                <label className="mini"><input type="checkbox" checked={!!e.gratis} onChange={(ev) => alterar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, gratis: ev.target.checked } : x)) })} /> grátis</label>
                <button className="link-perigo" onClick={() => alterar({ essencias: f.essencias.filter((x) => x.id !== e.id) })}>Remover</button>
              </div>
            ))}
            <SeletorEssencia
              tipo={classe?.tipo}
              existentes={f.essencias.map((e) => e.nome)}
              onEscolher={(nome) => alterar({ essencias: [...f.essencias, { id: novoId(), nome, etapa: 1 }] })}
            />
          </div>
          <PoderesEscolhidos f={f} />
          <div className="caixa">
            <h3>Poderes, técnicas e talentos</h3>
            <p className="ajuda">Anote aqui Shikai, Bankai, Kidō, técnicas, talentos e o que mais usar na mesa.</p>
            {f.poderes.map((p) => (
              <div className="poder" key={p.id}>
                <div className="linha-edit">
                  <input value={p.nome} onChange={(e) => alterar({ poderes: f.poderes.map((x) => (x.id === p.id ? { ...x, nome: e.target.value } : x)) })} aria-label="Nome do poder" placeholder="Nome" />
                  <input value={p.tipo} onChange={(e) => alterar({ poderes: f.poderes.map((x) => (x.id === p.id ? { ...x, tipo: e.target.value } : x)) })} aria-label="Tipo" placeholder="Tipo (Kidō, Talento…)" />
                  <input value={p.custo} onChange={(e) => alterar({ poderes: f.poderes.map((x) => (x.id === p.id ? { ...x, custo: e.target.value } : x)) })} aria-label="Custo" placeholder="Custo (5 PR)" />
                  <button className="link-perigo" onClick={() => alterar({ poderes: f.poderes.filter((x) => x.id !== p.id) })}>Remover</button>
                </div>
                <textarea rows={3} value={p.texto} onChange={(e) => alterar({ poderes: f.poderes.map((x) => (x.id === p.id ? { ...x, texto: e.target.value } : x)) })} aria-label="Descrição" placeholder="Descrição e regras" />
              </div>
            ))}
            <button className="btn btn-paper" onClick={() => alterar({ poderes: [...f.poderes, { id: novoId(), nome: "", tipo: "", custo: "", texto: "" }] })}>Adicionar poder</button>
          </div>
        </section>
      )}

      {aba === "Treinamento" && <AbaTreinamento f={f} c={c} alterar={alterar} />}

      {aba === "Evolução" && <Evolucao f={f} c={c} alterar={alterar} subir={subirNivel} onForma={setConstruir} onSub={() => setSubAberta(true)} />}

      <PainelRolagens r={rol} />
      {subAberta && (
        <EscolhaSubclasse
          f={f}
          onFechar={() => setSubAberta(false)}
          onEscolher={(nome) => {
            alterar({ subclasse: nome });
            setSubAberta(false);
            const t = formaPendente({ ...f, subclasse: nome }, classePorId(f.classe)?.tipo);
            if (t) setConstruir(t);
          }}
        />
      )}
      {construir && !subAberta && (
        <ConstrutorForma
          f={f}
          tipo={construir}
          onFechar={() => setConstruir(null)}
          onSalvar={(forma) => {
            alterar({ formas: { ...f.formas, [construir]: forma }, ...(construir === "shikai" ? { zanpakutou: { nome: forma.nome, frase: forma.comando } } : {}) });
            setConstruir(null);
          }}
        />
      )}

      {aba === "Notas" && (
        <section className="aba">
          <div className="grade2">
            <Campo rotulo="Tendência Espiritual">
              <select value={f.tendencia} onChange={(e) => alterar({ tendencia: e.target.value })}>
                <option value="">—</option><option>Bom</option><option>Neutro</option><option>Mal</option>
              </select>
            </Campo>
          </div>
          <Campo rotulo="Equipamento"><textarea rows={4} value={f.equipamento} onChange={(e) => alterar({ equipamento: e.target.value })} /></Campo>
          <Campo rotulo="Aparência"><textarea rows={4} value={f.aparencia} onChange={(e) => alterar({ aparencia: e.target.value })} /></Campo>
          <Campo rotulo="História"><textarea rows={8} value={f.historia} onChange={(e) => alterar({ historia: e.target.value })} /></Campo>
          <Campo rotulo="Anotações da campanha"><textarea rows={8} value={f.notas} onChange={(e) => alterar({ notas: e.target.value })} /></Campo>
          <button className="btn btn-paper" onClick={() => nav("/fichas")}>Voltar para a lista</button>
        </section>
      )}
    </main>
  );
}

function Barra({ tipo, rotulo, atual, max, pct, onChange }: { tipo: "pv" | "pr"; rotulo: string; atual: number; max: number; pct: number; onChange: (v: number) => void }) {
  const [delta, setDelta] = useState("");
  const aplicar = (sinal: 1 | -1) => {
    const n = Number(delta);
    if (!Number.isFinite(n) || n === 0) return;
    onChange(Math.max(0, Math.min(max, atual + sinal * Math.abs(n))));
    setDelta("");
    if (sinal < 0) som.corte();
  };
  return (
    <div className={`barra ${tipo}`}>
      <div className="barra-topo">
        <b>{rotulo}</b>
        <span><input type="number" className="atual" value={atual} min={0} max={max} onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))} aria-label={`${rotulo} atual`} /> / {max}</span>
      </div>
      <div className="trilho" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
      <div className="barra-acoes">
        <input type="number" inputMode="numeric" placeholder="valor" value={delta} onChange={(e) => setDelta(e.target.value)} aria-label={`Valor para ${rotulo}`} />
        <button onClick={() => aplicar(-1)}>Perder</button>
        <button onClick={() => aplicar(1)}>Recuperar</button>
        <button onClick={() => onChange(max)} aria-label={`Restaurar ${rotulo} ao máximo`}>Máx.</button>
      </div>
    </div>
  );
}

function Evolucao({ f, c, alterar, subir, onForma, onSub }: { f: TFicha; c: ReturnType<typeof calcular>; alterar: (p: Partial<TFicha>) => void; subir: () => void; onForma: (t: TipoForma) => void; onSub: () => void }) {
  const classe = classePorId(f.classe);
  const origem = origemPorId(f.origem);
  const nivelXp = nivelPorXp(f.xp);
  const podeSubir = nivelXp > f.nivel && f.nivel < 20;

  const ganhos = (n: number) => {
    const g: string[] = [];
    if (!classe) return g;
    g.push(`Proficiência ${mod(proficiencia(n))}`);
    g.push(`+${classe.pvNivel} PV e +${classe.prNivel} PR da classe, mais Constituição e Espírito`);
    if (NIVEIS_PONTO_ATRIBUTO.includes(n)) g.push("+1 ponto de atributo");
    if (NIVEIS_ESSENCIA.includes(n)) g.push("Aprimoramento da Essência: +2 pontos de essência");
    if (NIVEIS_SUBCLASSE.includes(n)) g.push(`Característica de ${classe.subclasseNome.toLowerCase()}`);
    if (n === 5) g.push("Hollow Comum evolui para Gillian");
    if (n === 10) g.push("Bankai (Shinigami) ou Resurrección (Hollow); Hollow Mente Clara evolui para Adjuchas");
    return g;
  };

  const mudarNivelAtr = (a: Atr, v: number) => alterar({ nivelAtr: { ...f.nivelAtr, [a]: v } });
  const mudarLivre = (a: Atr, v: number) => alterar({ livre: { ...f.livre, [a]: v } });

  return (
    <section className="aba">
      <div className="grade2">
        <div className="caixa">
          <h3>Experiência</h3>
          <p>Nível <b>{f.nivel}</b> · {f.xp} XP{c.proximoXp !== null ? ` · próximo nível com ${c.proximoXp} XP` : " · nível máximo"}</p>
          <div className="linha-edit">
            <Campo rotulo="XP total"><input type="number" min={0} value={f.xp} onChange={(e) => alterar({ xp: Math.max(0, Number(e.target.value) || 0) })} /></Campo>
          </div>
          {podeSubir ? (
            <button className="btn btn-red" onClick={subir}>Subir para o nível {f.nivel + 1}</button>
          ) : (
            <p className="ajuda">Ganhe XP para liberar o próximo nível. Seu mestre pode também definir o nível direto.</p>
          )}
          <div className="linha-edit">
            <Campo rotulo="Definir nível direto">
              <Passo valor={f.nivel} min={1} max={20} rotulo="nível" onChange={(v) => alterar({ nivel: v, xp: Math.max(f.xp, XP_NIVEL[v - 1]) })} />
            </Campo>
          </div>
        </div>
        <div className="caixa">
          <h3>Ao subir de nível</h3>
          {f.nivel < 20 ? (
            <>
              <p className="ajuda">Nível {f.nivel + 1}:</p>
              <ul>{ganhos(f.nivel + 1).map((g) => <li key={g}>{g}</li>)}</ul>
            </>
          ) : (
            <p>Nível máximo.</p>
          )}
          <p className="ajuda">As características da classe estão no <Link to="/livro/classes" target="_blank">Capítulo 3</Link>; anote-as na aba Poderes.</p>
        </div>
      </div>

      <h2 className="title-font sub">Poderes do nível {f.nivel}</h2>
      <EscolhaPoderes f={f} mudar={alterar} />

      {(["shikai", "bankai", "resurreccion", "vollstandig"] as TipoForma[])
        .filter((t) => nivelLiberacao(f.classe, classe?.tipo, t) > 0)
        .map((t) => {
          const nv = nivelLiberacao(f.classe, classe?.tipo, t);
          const forma = f.formas[t];
          return (
            <div className="caixa" key={t}>
              <h3>{TIPO_FORMA_NOME[t]}</h3>
              {f.nivel < nv ? (
                <p className="ajuda">Disponível a partir do nível {nv}.</p>
              ) : forma?.nome ? (
                <p>Definida: <b>{forma.nome}</b></p>
              ) : (
                <p>Você já pode ter a sua {TIPO_FORMA_NOME[t]}. Escolha um modelo do livro ou monte a sua.</p>
              )}
              {f.nivel >= nv && (
                <button type="button" className="btn btn-red" onClick={() => onForma(t)}>
                  {forma?.nome ? "Editar" : "Montar"} {TIPO_FORMA_NOME[t]}
                </button>
              )}
            </div>
          );
        })}

      {classe && f.nivel >= 3 && (
        <div className="caixa">
          <h3>{classe.subclasseNome}</h3>
          {!f.subclasse && <button type="button" className="btn btn-red" onClick={onSub}>Escolher {classe.subclasseNome} em uma janela</button>}
          {classe.subclasses.length ? (
            <select value={f.subclasse} onChange={(e) => alterar({ subclasse: e.target.value })} aria-label={classe.subclasseNome}>
              <option value="">Escolher</option>
              {classe.subclasses.map((s) => <option key={s}>{s}</option>)}
            </select>
          ) : (
            <input value={f.subclasse} onChange={(e) => alterar({ subclasse: e.target.value })} placeholder="Subclasse de outra classe" aria-label="Subclasse" />
          )}
        </div>
      )}

      {origem && (origem.id === "hollow-comum" || origem.id === "gillian") && (
        <div className="caixa">
          <h3>Evolução Hollow</h3>
          <p className="ajuda">Seu Hollow evolui sozinho. Escolha a variação de cada estágio quando chegar nele.</p>
          <SeletorVariacoes ficha={f} onChange={alterar} />
        </div>
      )}

      <div className="caixa">
        <h3>Pontos de atributo</h3>
        <p>
          De nível: <b>{c.pontosAtrib.nivel - c.pontosAtrib.nivelUsados}</b> disponível(is) de {c.pontosAtrib.nivel}. Limite de cada atributo: 15.
        </p>
        <table className="tab-atr">
          <thead><tr><th>Atributo</th><th>Total</th><th>Ponto de nível</th>{c.pontosAtrib.livre > 0 && <th>Livre (variação)</th>}</tr></thead>
          <tbody>
            {ATRIBUTOS.map((a) => (
              <tr key={a.id}>
                <th scope="row">{a.nome}</th>
                <td><b>{c.atr[a.id]}</b></td>
                <td><Passo valor={f.nivelAtr[a.id]} max={f.nivelAtr[a.id] + Math.max(0, c.pontosAtrib.nivel - c.pontosAtrib.nivelUsados)} onChange={(v) => mudarNivelAtr(a.id, v)} rotulo={`${a.nome} de nível`} /></td>
                {c.pontosAtrib.livre > 0 && <td><Passo valor={f.livre[a.id]} max={f.livre[a.id] + Math.max(0, c.pontosAtrib.livre - c.pontosAtrib.livreUsados)} onChange={(v) => mudarLivre(a.id, v)} rotulo={`${a.nome} livre`} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ajuda">Mudar Constituição ou Espírito ajusta PV e PR de todos os níveis, como diz o livro.</p>
      </div>

      <div className="caixa">
        <h3>Pontos de essência</h3>
        <p>{c.pontosEssencia.total - c.pontosEssencia.usados} disponível(is) de {c.pontosEssencia.total}. Gaste na aba Poderes.</p>
      </div>
    </section>
  );
}

/** Botões de acerto, dano e dano crítico de um ataque. */
function LinhaAtaque({ r, nome, bonus, dano }: { r: Rolagens; nome: string; bonus: number; dano: string }) {
  return (
    <span className="rolar-grupo">
      <button type="button" className="rolar" onClick={() => r.d20(`Acerto: ${nome}`, bonus)} title="Rolar acerto">🎲 Acerto</button>
      <button type="button" className="rolar" disabled={!dano} onClick={() => r.expr(`Dano: ${nome}`, dano)} title="Rolar dano">Dano</button>
      <button type="button" className="rolar" disabled={!dano} onClick={() => r.expr(`Dano crítico: ${nome}`, dano, true)} title="Rolar dano crítico (dados dobrados)">Crítico</button>
    </span>
  );
}

/** Talentos, Kidō e técnicas escolhidos, com a descrição do livro. */
function PoderesEscolhidos({ f }: { f: TFicha }) {
  const tals = talentosDe(f.classe).filter((t) => f.talentos.includes(t.id));
  const nada = tals.length + f.kidos.length + f.tecnicasReishi.length === 0;
  if (nada) return null;
  return (
    <div className="caixa">
      <h3>Escolhidos do livro</h3>
      {tals.map((t) => (
        <details className="poder-livro" key={t.id}>
          <summary><b>{t.nome}</b> <small>Talento</small></summary>
          <p>{t.texto}</p>
        </details>
      ))}
      {f.kidos.map((k) => (
        <p className="poder-livro" key={k.tipo + k.n}>
          <b>{k.tipo === "hadou" ? "Hadō" : "Bakudō"} {k.n}: {k.nome}</b> <small>Kidō · rank {KIDOS.find((x) => x.tipo === k.tipo && x.n === k.n)?.rank}</small>
        </p>
      ))}
      {f.tecnicasReishi.map((t) => (
        <p className="poder-livro" key={t}><b>{t}</b> <small>Técnica de Reishi</small></p>
      ))}
      <p className="ajuda">Descrições completas de Kidō e das técnicas no <Link to="/livro/feiticos-e-tecnicas" target="_blank">capítulo de Feitiços e Técnicas</Link>.</p>
    </div>
  );
}

/** Soma o dano extra de corpo a corpo da Origem (Predador, Infectado, Caçador…) nos ataques que não são à distância. */
function danoFinal(dano: string, a: { distancia?: boolean }, c: ReturnType<typeof calcular>) {
  if (!dano.trim() || a.distancia || c.danoCorpo <= 0) return dano;
  return `${dano}+${c.danoCorpo}`;
}
