import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { Campo, LinhaAtributos, Passo, SeletorVariacoes, novoId } from "../components/FichaPecas";
import { criarFicha } from "../lib/fichas";
import { efeito as som } from "../lib/som";
import {
  ATRIBUTOS,
  CLASSES,
  ORIGENS,
  PERICIAS,
  TABELA_D12,
  calcular,
  classePorId,
  efeitoOrigem,
  fichaNova,
  mod,
  nomeAtr,
  origemPorId,
  type Atr,
  type Ficha,
} from "../regras/ficha";

const PASSOS = ["Origem", "Classe", "Atributos", "Perícias", "Essências", "Personagem"];

export default function NovaFicha() {
  const { sessao } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState<Ficha>(fichaNova);
  const [passo, setPasso] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const mudar = (p: Partial<Ficha>) => setF((x) => ({ ...x, ...p }));
  const c = useMemo(() => calcular(f), [f]);
  const origem = origemPorId(f.origem);
  const classe = classePorId(f.classe);
  const ef = efeitoOrigem(f);

  const classesDisponiveis = CLASSES.filter((k) => origem?.tipos.includes(k.tipo));
  const precisaVariacao = origem ? origem.variacoes.length > 0 && !f.variacao : false;

  const pronto = (n: number): string => {
    if (n === 0) {
      if (!origem) return "Escolha uma Origem.";
      if (precisaVariacao) return "Escolha uma Variação.";
      if (f.origem === "hollow-comum" && f.nivel >= 5 && !f.variacaoGillian) return "Escolha a variação de Gillian.";
      return "";
    }
    if (n === 1) {
      if (!classe) return "Escolha uma Classe.";
      if (classe.saveEscolha && f.saveExtra.length < classe.saveEscolha) return "Escolha a salvaguarda extra da classe.";
      return "";
    }
    if (n === 2) {
      if (c.pontosAtrib.usados > c.pontosAtrib.inicial) return "Pontos demais nos atributos.";
      if (c.pontosAtrib.usados < c.pontosAtrib.inicial) return `Ainda sobram ${c.pontosAtrib.inicial - c.pontosAtrib.usados} pontos para distribuir.`;
      if (ATRIBUTOS.some((a) => f.base[a.id] > f.maxInicial)) return "Algum atributo passa do máximo.";
      return "";
    }
    return "";
  };

  const bloqueio = pronto(passo);
  const proximo = () => {
    if (bloqueio) return;
    som.clique();
    setPasso((p) => Math.min(PASSOS.length - 1, p + 1));
    window.scrollTo({ top: 0 });
  };

  const escolherOrigem = (id: string) => {
    const o = origemPorId(id)!;
    const k = classePorId(f.classe);
    mudar({
      origem: id,
      variacao: o.variacoes.length === 1 ? o.variacoes[0].id : "",
      variacaoGillian: "",
      variacaoAdjuchas: "",
      livre: { for: 0, des: 0, con: 0, men: 0, esp: 0 },
      classe: k && o.tipos.includes(k.tipo) ? f.classe : "",
    });
  };

  const escolherClasse = (id: string) => {
    mudar({ classe: id, subclasse: "", saveExtra: [], pericias: [] });
  };

  const mudarNivel = (n: number) => {
    const nivelAtr = { for: 0, des: 0, con: 0, men: 0, esp: 0 };
    mudar({ nivel: n, xp: n > 1 ? [0, 10, 25, 45, 70, 100, 135, 175, 220, 270, 325, 385, 450, 520, 595, 675, 760, 850, 945, 1045][n - 1] : 0, nivelAtr, subclasse: n < 3 ? "" : f.subclasse });
  };

  const mudarAtr = (a: Atr, v: number) => mudar({ base: { ...f.base, [a]: v } });
  const mudarNivelAtr = (a: Atr, v: number) => mudar({ nivelAtr: { ...f.nivelAtr, [a]: v } });
  const mudarLivre = (a: Atr, v: number) => mudar({ livre: { ...f.livre, [a]: v } });

  const aplicarD12 = (v: number | null) => {
    if (v === null) mudar({ d12: null, pontosIniciais: 12, maxInicial: 4, base: { for: 0, des: 0, con: 0, men: 0, esp: 0 } });
    else mudar({ d12: v, pontosIniciais: TABELA_D12[v - 1].pontos, maxInicial: TABELA_D12[v - 1].max, base: { for: 0, des: 0, con: 0, men: 0, esp: 0 } });
  };

  const criar = async () => {
    if (!sessao) return;
    if (!f.nome.trim()) {
      setErro("Dê um nome ao personagem.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const pronta: Ficha = { ...f, nome: f.nome.trim(), pvAtual: c.pv, prAtual: c.pr };
      const id = await criarFicha(pronta, sessao.user.id);
      som.pagina();
      nav(`/fichas/${id}`);
    } catch {
      setErro("Não foi possível salvar a ficha. Tente de novo.");
      setSalvando(false);
    }
  };

  const escolhidas = f.pericias.filter((p) => !c.periciasFixas.includes(p));
  const alternarPericia = (id: string) => {
    if (c.periciasFixas.includes(id)) return;
    if (f.pericias.includes(id)) mudar({ pericias: f.pericias.filter((p) => p !== id) });
    else if (escolhidas.length < c.quantasPericias) mudar({ pericias: [...f.pericias, id] });
  };

  const [novaEss, setNovaEss] = useState("");

  return (
    <main className="page assistente">
      <Link className="voltar-fixo" to="/fichas">← Minhas fichas</Link>
      <h1 className="title-font">Nova ficha</h1>

      <ol className="passos" aria-label="Etapas">
        {PASSOS.map((p, i) => (
          <li key={p} className={i === passo ? "atual" : i < passo ? "feito" : ""}>
            <button type="button" onClick={() => i <= passo && setPasso(i)} disabled={i > passo} aria-current={i === passo ? "step" : undefined}>
              <i>{i + 1}</i>
              {p}
            </button>
          </li>
        ))}
      </ol>

      {passo === 0 && (
        <section>
          <h2 className="title-font">1. Escolha uma Origem</h2>
          <p className="ajuda">A Origem define o que seu personagem é e a quais classes ele tem acesso. Hollows evoluem sozinhos com os níveis.</p>
          <div className="cartas-op">
            {ORIGENS.filter((o) => !o.soEvolucao).map((o) => (
              <button key={o.id} type="button" className={`op ${f.origem === o.id ? "on" : ""}`} onClick={() => escolherOrigem(o.id)}>
                <b className="title-font">{o.nome}</b>
                <small>{o.tipos.map((t) => (t === "shinigami" ? "Shinigami" : t === "quincy" ? "Quincy" : "Hollow")).join(" ou ")}</small>
                <span>{o.texto}</span>
              </button>
            ))}
          </div>
          {origem && (
            <div className="detalhe">
              <h3>Traços de {origem.nome}</h3>
              <ul>{origem.tracos.map((t) => <li key={t}>{t}</li>)}</ul>
              <SeletorVariacoes ficha={f} onChange={mudar} />
            </div>
          )}
        </section>
      )}

      {passo === 1 && (
        <section>
          <h2 className="title-font">2. Escolha uma Classe</h2>
          <div className="cartas-op">
            {classesDisponiveis.map((k) => (
              <button key={k.id} type="button" className={`op ${f.classe === k.id ? "on" : ""}`} onClick={() => escolherClasse(k.id)}>
                <b className="title-font">{k.nome}</b>
                <small>{k.chave}</small>
                <span>{k.texto}</span>
                <em>PV {k.pvIni} (+{k.pvNivel}) · PR {k.prIni} (+{k.prNivel}) · CR {k.cr === "plena" ? "plena" : "leve"}</em>
              </button>
            ))}
          </div>
          {classe && (
            <div className="detalhe">
              {classe.provisorio && <p className="aviso">{classe.provisorio}</p>}
              <div className="grade2">
                <Campo rotulo="Nível inicial">
                  <Passo valor={f.nivel} min={1} max={20} onChange={mudarNivel} rotulo="nível" />
                </Campo>
                {f.nivel >= 3 && (
                  <Campo rotulo={classe.subclasseNome}>
                    {classe.subclasses.length ? (
                      <select value={f.subclasse} onChange={(e) => mudar({ subclasse: e.target.value })}>
                        <option value="">Escolher depois</option>
                        {classe.subclasses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input value={f.subclasse} onChange={(e) => mudar({ subclasse: e.target.value })} placeholder="Subclasse de outra classe" />
                    )}
                  </Campo>
                )}
              </div>
              {f.nivel > 1 && <p className="ajuda">Começar em nível alto: você terá {c.pontosNivel} ponto(s) de atributo extra e {c.pontosEssencia.total} ponto(s) de essência. Confirme com o Mestre.</p>}
              {classe.saveEscolha ? (
                <Campo rotulo={`Salvaguarda extra (além de ${classe.saves.map(nomeAtr).join(", ")})`}>
                  <select value={f.saveExtra[0] ?? ""} onChange={(e) => mudar({ saveExtra: e.target.value ? [e.target.value as Atr] : [] })}>
                    <option value="">Escolher</option>
                    {ATRIBUTOS.filter((a) => !classe.saves.includes(a.id)).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </Campo>
              ) : (
                <p className="ajuda">Salvaguardas com proficiência: {classe.saves.map(nomeAtr).join(" e ")}.</p>
              )}
              <p className="ajuda">
                Classe de Resistência {classe.cr === "plena" ? "plena: 10 + proficiência + Constituição + Destreza" : "leve: 10 + proficiência + Destreza + metade da Constituição"}.
              </p>
            </div>
          )}
        </section>
      )}

      {passo === 2 && (
        <section>
          <h2 className="title-font">3. Atributos</h2>
          <p className="ajuda">
            Todos começam em 0. Distribua {f.pontosIniciais} pontos, no máximo {f.maxInicial} em cada. Bônus da Origem são somados depois.
          </p>
          <details className="regra-op">
            <summary>Regra opcional: Por favor um doze (com autorização do Mestre)</summary>
            <p>Role um d12 e escolha o resultado. {f.d12 ? `Resultado ${f.d12}: ${f.pontosIniciais} pontos, máximo ${f.maxInicial}.` : ""}</p>
            <select value={f.d12 ?? ""} onChange={(e) => aplicarD12(e.target.value ? Number(e.target.value) : null)} aria-label="Resultado do d12">
              <option value="">Não usar (12 pontos)</option>
              {TABELA_D12.map((t, i) => <option key={i} value={i + 1}>{i + 1}: {t.pontos} pontos, máx. {t.max}</option>)}
            </select>
          </details>
          <div className={`reserva ${c.pontosAtrib.usados > c.pontosAtrib.inicial ? "erro" : ""}`}>
            Pontos restantes: <b>{c.pontosAtrib.inicial - c.pontosAtrib.usados}</b>
          </div>
          <table className="tab-atr">
            <thead>
              <tr><th>Atributo</th><th>Pontos</th><th>Origem</th>{ef.livre > 0 && <th>Livre</th>}{c.pontosNivel > 0 && <th>Nível</th>}<th>Total</th></tr>
            </thead>
            <tbody>
              {ATRIBUTOS.map((a) => (
                <tr key={a.id}>
                  <th scope="row">{a.nome}</th>
                  <td><Passo valor={f.base[a.id]} max={f.maxInicial} onChange={(v) => mudarAtr(a.id, v)} rotulo={a.nome} /></td>
                  <td>{ef.atr[a.id] ? mod(ef.atr[a.id]) : "—"}</td>
                  {ef.livre > 0 && <td><Passo valor={f.livre[a.id]} onChange={(v) => mudarLivre(a.id, v)} rotulo={`${a.nome} livre`} max={ef.livre} /></td>}
                  {c.pontosNivel > 0 && <td><Passo valor={f.nivelAtr[a.id]} onChange={(v) => mudarNivelAtr(a.id, v)} rotulo={`${a.nome} de nível`} max={c.pontosNivel} /></td>}
                  <td><b>{c.atr[a.id]}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
          {ef.livre > 0 && <p className="ajuda">Pontos livres da variação: {c.pontosAtrib.livre - c.pontosAtrib.livreUsados} restantes.</p>}
          {c.pontosNivel > 0 && <p className="ajuda">Pontos de atributo de nível: {c.pontosAtrib.nivel - c.pontosAtrib.nivelUsados} restantes (podem ser gastos depois, na aba Evolução).</p>}
          {c.avisos.length > 0 && <ul className="avisos">{c.avisos.map((a) => <li key={a}>{a}</li>)}</ul>}
          <div className="previa">
            <span>PV <b>{c.pv}</b></span><span>PR <b>{c.pr}</b></span><span>CR <b>{c.cr}</b></span><span>Proficiência <b>{mod(c.prof)}</b></span>
          </div>
        </section>
      )}

      {passo === 3 && (
        <section>
          <h2 className="title-font">4. Perícias</h2>
          <p className="ajuda">
            Escolha {c.quantasPericias} perícia(s) ({classe?.pericias} da classe + metade da Mente). Você escolheu {escolhidas.length}.
            {c.periciasFixas.length > 0 && " As marcadas com cadeado já vêm da classe ou da Origem."}
          </p>
          <div className="pericias-grade">
            {ATRIBUTOS.map((a) => (
              <div key={a.id}>
                <h3>{a.nome}</h3>
                {PERICIAS.filter((p) => p.atr === a.id).map((p) => {
                  const fixa = c.periciasFixas.includes(p.id);
                  const marcada = fixa || f.pericias.includes(p.id);
                  return (
                    <label key={p.id} className={`pericia ${marcada ? "on" : ""}`}>
                      <input type="checkbox" checked={marcada} disabled={fixa || (!marcada && escolhidas.length >= c.quantasPericias)} onChange={() => alternarPericia(p.id)} />
                      <span>{p.nome}{fixa && " 🔒"}</span>
                      <em>{mod(c.pericias[p.id].total)}</em>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {passo === 4 && (
        <section>
          <h2 className="title-font">5. Essências Espirituais e equipamento</h2>
          <p className="ajuda">
            Você tem {c.pontosEssencia.total} ponto(s) de essência: cada ponto compra uma essência nova ou sobe uma etapa. Usados: {c.pontosEssencia.usados}.
            Escolha os nomes no Capítulo 4 do livro. Essências que a Origem dá de graça (Restrição de Kido, Velocista) marcam-se como grátis.
          </p>
          <Link className="ajuda" to="/livro/essencias-espirituais" target="_blank">Abrir o Capítulo 4 em outra aba</Link>
          <ul className="lista-ess">
            {f.essencias.map((e) => (
              <li key={e.id}>
                <span>{e.nome}</span>
                <Passo valor={e.etapa} min={1} max={5} rotulo={`etapa de ${e.nome}`} onChange={(v) => mudar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, etapa: v } : x)) })} />
                <label className="mini"><input type="checkbox" checked={!!e.gratis} onChange={(ev) => mudar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, gratis: ev.target.checked } : x)) })} /> grátis</label>
                <button type="button" className="link-perigo" onClick={() => mudar({ essencias: f.essencias.filter((x) => x.id !== e.id) })}>Remover</button>
              </li>
            ))}
          </ul>
          <form
            className="add-linha"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!novaEss.trim()) return;
              mudar({ essencias: [...f.essencias, { id: novoId(), nome: novaEss.trim(), etapa: 1 }] });
              setNovaEss("");
            }}
          >
            <input value={novaEss} onChange={(e) => setNovaEss(e.target.value)} placeholder="Nome da essência" aria-label="Nome da essência" />
            <button className="btn btn-paper" type="submit">Adicionar</button>
          </form>
          <Campo rotulo="Equipamento (Zanpakutou, arma Quincy, itens)">
            <textarea rows={4} value={f.equipamento} onChange={(e) => mudar({ equipamento: e.target.value })} />
          </Campo>
        </section>
      )}

      {passo === 5 && (
        <section>
          <h2 className="title-font">6. Seu personagem</h2>
          <div className="grade2">
            <Campo rotulo="Nome"><input value={f.nome} onChange={(e) => mudar({ nome: e.target.value })} autoFocus /></Campo>
            <Campo rotulo="Tendência Espiritual">
              <select value={f.tendencia} onChange={(e) => mudar({ tendencia: e.target.value })}>
                <option value="">Escolher</option><option>Bom</option><option>Neutro</option><option>Mal</option>
              </select>
            </Campo>
          </div>
          <Campo rotulo="Aparência"><textarea rows={3} value={f.aparencia} onChange={(e) => mudar({ aparencia: e.target.value })} /></Campo>
          <Campo rotulo="História"><textarea rows={5} value={f.historia} onChange={(e) => mudar({ historia: e.target.value })} /></Campo>
          <div className="resumo-final">
            <h3>{origem?.nome} · {classe?.nome} · nível {f.nivel}</h3>
            <LinhaAtributos atr={c.atr} />
            <div className="previa">
              <span>PV <b>{c.pv}</b></span><span>PR <b>{c.pr}</b></span><span>CR <b>{c.cr}</b></span><span>Proficiência <b>{mod(c.prof)}</b></span><span>Deslocamento <b>{c.desloc} m</b></span>
            </div>
            {c.avisos.length > 0 && <ul className="avisos">{c.avisos.map((a) => <li key={a}>{a}</li>)}</ul>}
          </div>
          {erro && <p className="aviso" role="alert">{erro}</p>}
        </section>
      )}

      <div className="nav-passos">
        <button type="button" className="btn btn-paper" onClick={() => setPasso((p) => Math.max(0, p - 1))} disabled={passo === 0}>Voltar</button>
        {bloqueio && <span className="bloqueio" role="status">{bloqueio}</span>}
        {passo < PASSOS.length - 1 ? (
          <button type="button" className="btn btn-red" onClick={proximo} disabled={!!bloqueio}>Continuar</button>
        ) : (
          <button type="button" className="btn btn-red" onClick={criar} disabled={salvando}>{salvando ? "Salvando…" : "Criar ficha"}</button>
        )}
      </div>
    </main>
  );
}
