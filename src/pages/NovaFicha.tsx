import { Icone } from "../components/Icone";
import { useEffect, useMemo, useState } from "react";
import { SeletorEssencia } from "../components/SeletorEssencia";
import { NomeEssencia, TrocarEssencia } from "../components/EssenciaPecas";
import { ESSENCIAS, essenciaPorNome } from "../regras/essencias";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { AvisosFicha, Campo, LinhaAtributos, Passo, SeletorVariacoes, novoId } from "../components/FichaPecas";
import { EscolhaPoderes, pendencias, totalPendencias } from "../components/EscolhaPoderes";
import { criarFicha } from "../lib/fichas";
import { guardar, ler as lerLocal, limpar } from "../lib/rascunho";
import { normalizar } from "../regras/ficha";
import {
  ARMAS,
  ARTEFATOS,
  ASAUCHI,
  ESSENCIA_SUGERIDA,
  FORCAS,
  ataquesIniciais,
  equipamentoPadrao,
  essenciasDaOrigem,
  itensDaOrigem,
  resumoEquip,
} from "../regras/catalogo";
import { efeito as som } from "../lib/som";
import { KonAjuda } from "../components/KonAjuda";
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

const PASSOS = ["Origem", "Classe", "Atributos", "Perícias", "Poderes", "Essências e equipamento", "Personagem"];

export default function NovaFicha() {
  const { sessao } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState<Ficha>(fichaNova);
  const [passo, setPasso] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const chaveRascunho = sessao ? `nova-${sessao.user.id}` : "";
  const [rascunho, setRascunho] = useState<{ f: Ficha; passo: number } | null>(null);
  const [livre, setLivre] = useState(false);

  // se a pessoa já tinha começado uma ficha, oferece continuar de onde parou
  useEffect(() => {
    if (!chaveRascunho) return;
    const g = lerLocal<{ f: Ficha; passo: number }>(chaveRascunho);
    if (g?.dados?.f && (g.dados.f.origem || g.dados.f.nome)) setRascunho(g.dados);
    setLivre(true);
  }, [chaveRascunho]);

  useEffect(() => {
    if (!livre || rascunho || !chaveRascunho) return;
    guardar(chaveRascunho, { f, passo }, true);
  }, [f, passo, livre, rascunho, chaveRascunho]);

  const mudar = (p: Partial<Ficha>) => setF((x) => ({ ...x, ...p }));
  const irDestino = (d: string) => {
    const passos: Record<string, number> = { salvaguarda: 1, atributos: 2, pericias: 3, essencias: 5 };
    if (passos[d] !== undefined) {
      setPasso(passos[d]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
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

  // essências que a Origem entrega de graça: entram e saem sozinhas quando a Origem muda
  useEffect(() => {
    setF((x) => {
      const dela = essenciasDaOrigem(x);
      const atuais = x.essencias.filter((e) => e.id.startsWith("origem-"));
      const iguais = atuais.length === dela.length && dela.every((d) => atuais.some((e) => e.id === "origem-" + d.nome));
      if (iguais) return x;
      return {
        ...x,
        essencias: [
          ...dela.map((d) => ({ id: "origem-" + d.nome, nome: d.nome, etapa: 1, gratis: true })),
          ...x.essencias.filter((e) => !e.id.startsWith("origem-")),
        ],
      };
    });
  }, [f.origem, f.variacao]);

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
      equip: equipamentoPadrao(),
    });
  };

  const escolherClasse = (id: string) => {
    mudar({ classe: id, subclasse: "", saveExtra: [], pericias: [], talentos: [], kidos: [], tecnicasReishi: [], equip: equipamentoPadrao() });
  };

  const mudarNivel = (n: number) => {
    const nivelAtr = { for: 0, des: 0, con: 0, men: 0, esp: 0 };
    mudar({ nivel: n, xp: n > 1 ? [0, 10, 25, 45, 70, 100, 135, 175, 220, 270, 325, 385, 450, 520, 595, 675, 760, 850, 945, 1045][n - 1] : 0, nivelAtr, subclasse: n < 3 ? "" : f.subclasse, talentos: [], kidos: [], tecnicasReishi: [] });
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
      const tipo = classe?.tipo;
      const pronta: Ficha = {
        ...f,
        nome: f.nome.trim(),
        pvAtual: c.pv,
        prAtual: c.pr,
        equipamento: f.equipamento.trim() || resumoEquip(f, tipo),
        ataques: f.ataques.length ? f.ataques : ataquesIniciais(f, tipo),
      };
      const id = await criarFicha(pronta, sessao.user.id);
      limpar(chaveRascunho);
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


  if (rascunho) {
    return (
      <main className="page assistente">
        <div className="aviso" role="status">
          <b>Você já tinha começado uma ficha</b>
          <span>{rascunho.f.nome ? `“${rascunho.f.nome}”` : "Uma ficha sem nome"}, no passo {rascunho.passo + 1} de {PASSOS.length}. Quer continuar de onde parou?</span>
          <div className="row">
            <button type="button" className="btn btn-red" onClick={() => { setF(normalizar(rascunho.f)); setPasso(Math.min(PASSOS.length - 1, rascunho.passo)); setRascunho(null); }}>Continuar</button>
            <button type="button" className="btn btn-paper" onClick={() => { limpar(chaveRascunho); setRascunho(null); }}>Começar do zero</button>
          </div>
        </div>
      </main>
    );
  }

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

      <KonAjuda passo={passo} />

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
                      <input value={f.subclasse} onChange={(e) => mudar({ subclasse: e.target.value })} placeholder="Subclasse de uma classe de Shinigami" />
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
          <AvisosFicha avisos={c.avisos} onIr={irDestino} />
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
                      <span>{p.nome}{fixa && <> <Icone nome="cadeado" tamanho={14} titulo="fixa" /></>}</span>
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
          <h2 className="title-font">5. Poderes, talentos e técnicas</h2>
          <p className="ajuda">
            Escolha agora o que o seu nível {f.nivel} já permite, direto do livro. O que sobrar fica pendente e abre sozinho na aba Evolução da ficha.
          </p>
          <EscolhaPoderes f={f} mudar={mudar} />
          {totalPendencias(pendencias(f)) > 0 && <p className="ajuda">Ainda há escolhas pendentes. Você pode seguir e terminar depois.</p>}
        </section>
      )}

      {passo === 5 && (
        <section>
          <h2 className="title-font">6. Essências Espirituais e equipamento</h2>
          <details className="guia-ess" open>
            <summary>O que são as Essências?</summary>
            <ul>
              <li><b>São marcas da sua alma.</b> Cada essência é uma característica que a vida e as batalhas gravaram no personagem: resistir a um tipo de dano, bater mais forte, enxergar melhor, aguentar mais.</li>
              <li><b>Cada ponto vale uma escolha.</b> Você pode comprar uma essência nova ou subir uma etapa de uma que já tem. Etapas deixam a mesma essência mais forte (Pele de Aço, por exemplo, reduz 2 de dano físico e passa a reduzir 4).</li>
              <li><b>Você ganha pontos aos poucos.</b> 1 na criação e 2 a cada Aprimoramento da Essência (níveis 4, 8, 12, 16 e 19).</li>
              <li><b>A classe limita a lista.</b> Cada essência é de Shinigami, de Quincy, de Hollow ou de todos. Toque em uma essência na lista para ler o que ela faz antes de escolher.</li>
              <li><b>Não precisa acertar de primeira.</b> A sugerida pelo livro é um bom começo, e o Mestre pode ajudar a trocar depois.</li>
            </ul>
          </details>
          <p className="ajuda">
            Você tem {c.pontosEssencia.total} ponto(s) de essência: cada ponto compra uma essência nova ou sobe uma etapa. Usados: {c.pontosEssencia.usados}.
            Os nomes e efeitos estão no <Link to="/livro/essencias-espirituais" target="_blank">Capítulo 4</Link>.
          </p>

          {f.essencias.some((e) => e.id.startsWith("origem-")) && (
            <div className="caixa">
              <h3>Da sua Origem (grátis)</h3>
              <ul className="lista-ess">
                {f.essencias.filter((e) => e.id.startsWith("origem-")).map((e) => (
                  <li key={e.id}>
                    {f.origem === "visored" ? (
                      <div className="ess-origem">
                        <select value={essenciaPorNome(e.nome) ? e.nome : ""} onChange={(ev) => mudar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, nome: ev.target.value || "Essência proibida (escolha)" } : x)) })} aria-label="Essência proibida do Visored">
                          <option value="">Escolher a essência proibida…</option>
                          {ESSENCIAS.filter((x) => x.grupo === "proibida").map((x) => <option key={x.nome} value={x.nome}>{x.nome}</option>)}
                        </select>
                        {essenciaPorNome(e.nome) && <NomeEssencia nome={e.nome} etapa={1} completo />}
                      </div>
                    ) : (
                      <input className="ess-origem-nome" value={e.nome} onChange={(ev) => mudar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, nome: ev.target.value } : x)) })} aria-label="Essência da Origem" />
                    )}
                    <span className="chip">não gasta pontos</span>
                  </li>
                ))}
              </ul>
              {f.origem === "visored" && <p className="ajuda">Visored: escolha na lista a essência proibida que combinar com o Mestre. Ela não evolui com os níveis.</p>}
            </div>
          )}

          <div className="caixa">
            <h3>Suas essências</h3>
            {classe && ESSENCIA_SUGERIDA[classe.id] && !f.essencias.some((e) => e.nome === ESSENCIA_SUGERIDA[classe.id]) && (
              <button type="button" className="btn btn-paper" onClick={() => mudar({ essencias: [...f.essencias, { id: novoId(), nome: ESSENCIA_SUGERIDA[classe.id], etapa: 1 }] })}>
                Usar a sugerida pelo livro: {ESSENCIA_SUGERIDA[classe.id]}
              </button>
            )}
            <ul className="lista-ess">
              {f.essencias.filter((e) => !e.id.startsWith("origem-")).map((e) => (
                <li key={e.id}>
                  <NomeEssencia nome={e.nome} etapa={e.etapa} completo />
                  <TrocarEssencia tipo={classe?.tipo} existentes={f.essencias.map((x) => x.nome)} onTrocar={(nome) => mudar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, nome, etapa: 1 } : x)) })} />
                  <Passo valor={e.etapa} min={1} max={5} rotulo={`etapa de ${e.nome}`} onChange={(v) => mudar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, etapa: v } : x)) })} />
                  <label className="mini"><input type="checkbox" checked={!!e.gratis} onChange={(ev) => mudar({ essencias: f.essencias.map((x) => (x.id === e.id ? { ...x, gratis: ev.target.checked } : x)) })} /> grátis</label>
                  <button type="button" className="link-perigo" onClick={() => mudar({ essencias: f.essencias.filter((x) => x.id !== e.id) })}>Remover</button>
                </li>
              ))}
            </ul>
            <SeletorEssencia
              tipo={classe?.tipo}
              existentes={f.essencias.map((e) => e.nome)}
              onEscolher={(nome) => mudar({ essencias: [...f.essencias, { id: novoId(), nome, etapa: 1 }] })}
            />
          </div>

          <div className="caixa">
            <h3>Equipamento inicial</h3>
            {classe?.tipo === "shinigami" && (
              <>
                <div className="grade2">
                  <Campo rotulo="Força militar">
                    <select value={f.equip.forca} onChange={(e) => mudar({ equip: { ...f.equip, forca: e.target.value } })}>
                      <option value="">Escolher</option>
                      {FORCAS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </Campo>
                  {f.equip.forca === "Gotei 13" && (
                    <Campo rotulo="Divisão">
                      <Passo valor={f.equip.divisao} min={0} max={13} rotulo="divisão" onChange={(v) => mudar({ equip: { ...f.equip, divisao: v } })} />
                    </Campo>
                  )}
                </div>
                <Campo rotulo="Forma da Asauchi">
                  <select value={f.equip.asauchi} onChange={(e) => mudar({ equip: { ...f.equip, asauchi: e.target.value } })}>
                    <option value="">Escolher</option>
                    {ASAUCHI.map((a) => <option key={a.nome} value={a.nome}>{a.nome} · {a.dano} · crítico {a.crit}+ · {a.atr}</option>)}
                  </select>
                </Campo>
              </>
            )}
            {classe?.tipo === "quincy" && (
              <>
                <p className="ajuda">Escolha 2 armas com as quais você tenha proficiência ({f.equip.armas.length} de 2) e 1 artefato (com aprovação do Mestre).</p>
                <div className="armas-escolha">
                  {[...ARMAS.corpo, ...ARMAS.distancia].map((a) => {
                    const on = f.equip.armas.includes(a.nome);
                    return (
                      <button key={a.nome} type="button" className={`kido ${on ? "on" : ""}`} aria-pressed={on} disabled={!on && f.equip.armas.length >= 2}
                        onClick={() => mudar({ equip: { ...f.equip, armas: on ? f.equip.armas.filter((x) => x !== a.nome) : [...f.equip.armas, a.nome] } })}>
                        <span>{a.nome}</span>
                        <em>{a.dano}</em>
                      </button>
                    );
                  })}
                </div>
                <Campo rotulo="Artefato Quincy">
                  <select value={f.equip.artefato} onChange={(e) => mudar({ equip: { ...f.equip, artefato: e.target.value } })}>
                    <option value="">Escolher</option>
                    {ARTEFATOS.map((a) => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                  </select>
                </Campo>
                {ARTEFATOS.find((a) => a.nome === f.equip.artefato) && <p className="ajuda">{ARTEFATOS.find((a) => a.nome === f.equip.artefato)!.texto}</p>}
              </>
            )}
            {classe?.tipo === "hollow" && (
              <Campo rotulo="Forma da arma natural (garras, chifre, cauda…)">
                <input value={f.equip.naturalForma} onChange={(e) => mudar({ equip: { ...f.equip, naturalForma: e.target.value } })} placeholder="Ex.: garras longas" />
              </Campo>
            )}

            {itensDaOrigem(f, classe?.tipo).length > 0 && (
              <div className="ja-vem">
                <h4>Já vem com você</h4>
                <ul>{itensDaOrigem(f, classe?.tipo).map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            )}
            {classe?.tipo === "shinigami" && itensDaOrigem(f, "shinigami").length === 0 && f.equip.forca && (
              <p className="ajuda">Exilados e Shinigamis Substitutos não recebem os itens de divisão.</p>
            )}
            <Campo rotulo="Outros itens (opcional)">
              <textarea rows={3} value={f.equip.extras} onChange={(e) => mudar({ equip: { ...f.equip, extras: e.target.value } })} />
            </Campo>
            <p className="ajuda">Seus ataques já saem prontos na ficha com as armas escolhidas.</p>
          </div>
        </section>
      )}

      {passo === 6 && (
        <section>
          <h2 className="title-font">7. Seu personagem</h2>
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
            <AvisosFicha avisos={c.avisos} onIr={irDestino} />
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
