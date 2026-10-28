import { useEffect, useState } from "react";
import { classePorId, type Ficha, type FormaLib, type HabForma, type TipoForma } from "../regras/ficha";
import {
  BANKAIS,
  HAB_UNICAS,
  RESURRECCIONES,
  TIPO_FORMA_NOME,
  VOLL_PASSIVAS,
  VOLL_PRONTAS,
  picksVoll,
  totalPicks,
} from "../regras/liberacoes";
import { novoId } from "./FichaPecas";
import { acoesDaForma, resolverDano } from "../regras/liberacoes";
import type { Calculo } from "../regras/ficha";
import type { Rolagens } from "./Rolador";

const vazia = (tipo: TipoForma): FormaLib => ({
  tipo,
  modelo: "",
  nome: "",
  comando: "",
  aparencia: "",
  estilo: "",
  custo: tipo === "bankai" ? 40 : tipo === "vollstandig" ? 60 : 0,
  duracao: tipo === "bankai" ? "1 minuto" : tipo === "resurreccion" ? "até o fim da cena" : "até você encerrar",
  habilidades: [],
  traco: "",
  pontoFraco: "",
  canalizador: "",
  schrift: "",
  picks: {},
  texto: "",
});

interface Props {
  f: Ficha;
  tipo: TipoForma;
  onSalvar: (forma: FormaLib) => void;
  onFechar: () => void;
}

const DICAS: Record<TipoForma, string> = {
  bankai:
    "Escolha uma Bankai pronta do livro ou monte a sua. A Bankai Potencializadora intensifica os poderes da Shikai; a Transformadora cria um poder novo. O custo de liberação vai de 40 a 80 PR e dura 1 minuto. Toda Bankai tem um ponto fraco.",
  resurreccion:
    "Custo, duração, bônus de CR e a técnica de assinatura já vêm da sua classe e do seu Caminho. Aqui você define a forma: nome, aparência, um traço pequeno e um ponto fraco.",
  vollstandig:
    "As habilidades passivas são iguais para todos os Quincy. Você escolhe as habilidades únicas (uma vez definidas, não mudam), o canalizador e, se tiver, a Schrift.",
};

export function ConstrutorForma({ f, tipo, onSalvar, onFechar }: Props) {
  const classe = classePorId(f.classe);
  const [aba, setAba] = useState<"modelos" | "meu">(f.formas[tipo]?.nome ? "meu" : "modelos");
  const [r, setR] = useState<FormaLib>(f.formas[tipo] ? { ...vazia(tipo), ...f.formas[tipo]! } : vazia(tipo));
  const [aberto, setAberto] = useState("");
  const [busca, setBusca] = useState("");
  const mud = (p: Partial<FormaLib>) => setR((x) => ({ ...x, ...p }));

  useEffect(() => {
    const t = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", t);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", t);
      document.body.style.overflow = "";
    };
  }, [onFechar]);

  const limite = picksVoll(f.classe, f.nivel);
  const usados = totalPicks(r.picks);
  const nomeTipo = TIPO_FORMA_NOME[tipo];

  const usarBankai = (id: string) => {
    const m = BANKAIS.find((b) => b.id === id)!;
    setR({
      ...vazia("bankai"),
      modelo: m.id,
      nome: m.nome,
      comando: `Bankai, ${m.nome}`,
      custo: m.custo || 40,
      texto: m.texto,
      aparencia: m.resumo,
    });
    setAba("meu");
  };
  const usarRes = (id: string) => {
    const m = RESURRECCIONES.find((x) => x.id === id)!;
    setR({
      ...vazia("resurreccion"),
      modelo: m.id,
      nome: m.nome,
      comando: m.comando,
      aparencia: m.aparencia,
      traco: m.traco,
      pontoFraco: m.pontoFraco,
      habilidades: [{ id: novoId(), nome: "Técnica de assinatura", texto: m.tecnica, custo: "12 PR", acao: "Ação" }],
      custo: classe?.id === "vazio" ? 40 : 45,
    });
    setAba("meu");
  };
  const usarVoll = (id: string) => {
    const m = VOLL_PRONTAS.find((x) => x.id === id)!;
    setR((x) => ({ ...x, modelo: m.id, nome: x.nome || `Vollständig ${m.nome}`, picks: { ...m.picks }, texto: m.resumo }));
    setAba("meu");
  };

  const habil = (id: string, p: Partial<HabForma>) => mud({ habilidades: r.habilidades.map((h) => (h.id === id ? { ...h, ...p } : h)) });

  const mudarPick = (id: string, delta: number, unica?: boolean) => {
    const atual = r.picks[id] ?? 0;
    const novo = Math.max(0, atual + delta);
    if (delta > 0 && (usados >= limite || (unica && atual >= 1))) return;
    const picks = { ...r.picks };
    if (novo === 0) delete picks[id];
    else picks[id] = novo;
    mud({ picks });
  };

  const modelosRes = [...RESURRECCIONES].sort((a, b) => Number(b.classe === classe?.id) - Number(a.classe === classe?.id));
  const q = busca.trim().toLowerCase();
  const bankais = BANKAIS.filter((b) => !q || b.nome.toLowerCase().includes(q));

  const podeSalvar = r.nome.trim().length > 0;

  return (
    <div className="construtor" role="dialog" aria-modal="true" aria-label={`Montar ${nomeTipo}`}>
      <div className="construtor-topo">
        <div>
          <small className="ajuda">Nível {f.nivel}</small>
          <h2 className="title-font">Sua {nomeTipo}</h2>
        </div>
        <button type="button" className="fechar" onClick={onFechar} aria-label="Fechar">×</button>
      </div>
      <p className="ajuda construtor-dica">{DICAS[tipo]}</p>
      <div className="modos" role="tablist" aria-label="Como montar">
        <button type="button" role="tab" aria-selected={aba === "modelos"} className={aba === "modelos" ? "on" : ""} onClick={() => setAba("modelos")}>Modelos prontos</button>
        <button type="button" role="tab" aria-selected={aba === "meu"} className={aba === "meu" ? "on" : ""} onClick={() => setAba("meu")}>Montar a minha</button>
      </div>

      <div className="construtor-corpo">
        {aba === "modelos" && tipo === "bankai" && (
          <>
            <input className="seletor-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar Bankai" aria-label="Buscar Bankai" />
            <ul className="seletor-lista">
              {bankais.map((b) => (
                <li key={b.id} className={aberto === b.id ? "aberta" : ""}>
                  <button type="button" className="seletor-item" aria-expanded={aberto === b.id} onClick={() => setAberto(aberto === b.id ? "" : b.id)}>
                    <b>{b.nome}</b>
                    <small>{b.custo ? `${b.custo} PR para liberar` : "Veja o custo no texto"}</small>
                  </button>
                  {aberto === b.id && (
                    <div className="seletor-detalhe">
                      {b.texto.split("\n\n").slice(0, 6).map((p, i) => <p key={i}>{p}</p>)}
                      <p className="ajuda">O texto completo está no Capítulo 5.</p>
                      <button type="button" className="btn" onClick={() => usarBankai(b.id)}>Usar a Bankai {b.nome}</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {aba === "modelos" && tipo === "resurreccion" && (
          <ul className="seletor-lista">
            {modelosRes.map((m) => (
              <li key={m.id} className={aberto === m.id ? "aberta" : ""}>
                <button type="button" className="seletor-item" aria-expanded={aberto === m.id} onClick={() => setAberto(aberto === m.id ? "" : m.id)}>
                  <b>{m.nome}</b>
                  <small>{m.classe === "hueco" ? "Hueco" : "Vazio"} · Caminho {m.caminho}{m.classe === classe?.id ? " · da sua classe" : ""}</small>
                </button>
                {aberto === m.id && (
                  <div className="seletor-detalhe">
                    <p><b>Comando:</b> {m.comando}</p>
                    <p><b>Aparência:</b> {m.aparencia}</p>
                    <p><b>Técnica:</b> {m.tecnica}</p>
                    <p><b>Traço:</b> {m.traco}</p>
                    <p><b>Ponto fraco:</b> {m.pontoFraco}</p>
                    <button type="button" className="btn" onClick={() => usarRes(m.id)}>Usar {m.nome}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {aba === "modelos" && tipo === "vollstandig" && (
          <ul className="seletor-lista">
            {VOLL_PRONTAS.map((m) => (
              <li key={m.id} className={aberto === m.id ? "aberta" : ""}>
                <button type="button" className="seletor-item" aria-expanded={aberto === m.id} onClick={() => setAberto(aberto === m.id ? "" : m.id)}>
                  <b>{m.nome}</b>
                  <small>{m.fonte === "manga" ? "Inspirada no mangá" : "Arquétipo do livro"} · {m.resumo}</small>
                </button>
                {aberto === m.id && (
                  <div className="seletor-detalhe">
                    <ul>
                      {Object.entries(m.picks).map(([id, n]) => {
                        const h = HAB_UNICAS.find((x) => x.id === id);
                        return <li key={id}>{h?.nome} ({n}x): {h?.texto}</li>;
                      })}
                    </ul>
                    <button type="button" className="btn" onClick={() => usarVoll(m.id)}>Usar {m.nome}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {aba === "meu" && (
          <div className="construtor-form">
            {r.modelo && <p className="ajuda">Base: modelo pronto do livro. Você pode ajustar tudo abaixo.</p>}
            <label className="campo">Nome<input value={r.nome} onChange={(e) => mud({ nome: e.target.value })} placeholder={tipo === "vollstandig" ? "Ex.: Vollständig do Atirador" : "Nome da forma"} /></label>
            <label className="campo">{tipo === "vollstandig" ? "Frase de liberação" : "Comando / frase de liberação"}<input value={r.comando} onChange={(e) => mud({ comando: e.target.value })} placeholder={tipo === "vollstandig" ? "Ex.: Quincy Vollständig" : "Frase dita ao liberar"} /></label>
            <label className="campo">Aparência<textarea rows={3} value={r.aparencia} onChange={(e) => mud({ aparencia: e.target.value })} placeholder="Como o corpo, a arma, as asas ou o cenário mudam" /></label>

            {tipo === "bankai" && (
              <>
                <label className="campo">Tipo
                  <select value={r.estilo} onChange={(e) => mud({ estilo: e.target.value as FormaLib["estilo"] })}>
                    <option value="">Escolha</option>
                    <option value="potencializadora">Potencializadora (intensifica a Shikai)</option>
                    <option value="transformadora">Transformadora (poder novo)</option>
                  </select>
                </label>
                <div className="duas">
                  <label className="campo">Custo de liberação (40 a 80 PR)<input type="number" min={40} max={80} value={r.custo} onChange={(e) => mud({ custo: Number(e.target.value) })} /></label>
                  <label className="campo">Duração<input value={r.duracao} onChange={(e) => mud({ duracao: e.target.value })} /></label>
                </div>
              </>
            )}

            {tipo === "resurreccion" && (
              <>
                <p className="ajuda">Técnica de assinatura do seu Caminho: custo 12 PR, só durante a Resurrección (veja o Capítulo 3). Descreva abaixo como ela aparece.</p>
                <label className="campo">Traço da forma (pequeno e claro)<textarea rows={2} value={r.traco} onChange={(e) => mud({ traco: e.target.value })} placeholder="Ex.: +3 m de alcance, voo, PV temporários por rodada" /></label>
              </>
            )}

            {tipo !== "vollstandig" && (
              <div className="caixa">
                <h3>{tipo === "bankai" ? "Habilidades e técnicas" : "Técnica e extras"}</h3>
                {r.habilidades.map((h) => (
                  <div className="hab-edit" key={h.id}>
                    <div className="linha-edit">
                      <input value={h.nome} onChange={(e) => habil(h.id, { nome: e.target.value })} placeholder="Nome" aria-label="Nome da habilidade" />
                      <input value={h.acao} onChange={(e) => habil(h.id, { acao: e.target.value })} placeholder="Ação, bônus, reação" aria-label="Ação" />
                      <input value={h.custo} onChange={(e) => habil(h.id, { custo: e.target.value })} placeholder="Custo (ex.: 20 PR)" aria-label="Custo" />
                      <input type="number" min={0} value={h.pr ?? ""} onChange={(e) => habil(h.id, { pr: e.target.value === "" ? undefined : Number(e.target.value) })} placeholder="PR do botão" aria-label="PR gastos ao usar" />
                      <input value={h.dano ?? ""} onChange={(e) => habil(h.id, { dano: e.target.value })} placeholder="Dano (ex.: 8d10+5)" aria-label="Dano rolável" />
                    </div>
                    <textarea rows={3} value={h.texto} onChange={(e) => habil(h.id, { texto: e.target.value })} placeholder="O que faz, dano e alcance" aria-label="Texto da habilidade" />
                    <button type="button" className="link-perigo" onClick={() => mud({ habilidades: r.habilidades.filter((x) => x.id !== h.id) })}>Remover</button>
                  </div>
                ))}
                <button type="button" className="btn btn-paper" onClick={() => mud({ habilidades: [...r.habilidades, { id: novoId(), nome: "", texto: "", custo: "", acao: "Ação" }] })}>Adicionar habilidade</button>
              </div>
            )}

            {tipo === "vollstandig" && (
              <>
                <label className="campo">Canalizador (objeto que ativa a Vollständig)<input value={r.canalizador} onChange={(e) => mud({ canalizador: e.target.value })} placeholder="Colar, luva, máscara, símbolo de sangue..." /></label>
                <label className="campo">Schrift (opcional)<input value={r.schrift} onChange={(e) => mud({ schrift: e.target.value })} placeholder="Ex.: O Poder, se o Mestre aprovou" /></label>
                <div className="caixa">
                  <h3>Passivas (todo Quincy)</h3>
                  <ul>{VOLL_PASSIVAS.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
                <div className="caixa">
                  <h3>Habilidades únicas: {usados} de {limite}</h3>
                  <p className="ajuda">Depois de definidas, não mudam. Força Espiritual e Precisão Espiritual só podem ser escolhidas uma vez cada.</p>
                  {HAB_UNICAS.map((h) => {
                    const n = r.picks[h.id] ?? 0;
                    return (
                      <div className="pick" key={h.id}>
                        <div>
                          <b>{h.nome}</b>
                          <small>{h.texto}</small>
                        </div>
                        <div className="pick-passo">
                          <button type="button" className="btn-mini" onClick={() => mudarPick(h.id, -1)} disabled={n === 0} aria-label={`Tirar ${h.nome}`}>−</button>
                          <span aria-live="polite">{n}</span>
                          <button type="button" className="btn-mini" onClick={() => mudarPick(h.id, 1, h.unica)} disabled={usados >= limite || (h.unica && n >= 1)} aria-label={`Escolher ${h.nome}`}>+</button>
                        </div>
                      </div>
                    );
                  })}
                  <p className="ajuda">Custo para liberar: 60 PR, com uma ação. Os bônus de CR, PV, PR, redução de dano e deslocamento entram sozinhos na ficha enquanto a Vollständig estiver ativa.</p>
                </div>
              </>
            )}

            {tipo !== "vollstandig" && (
              <label className="campo">Ponto fraco<textarea rows={2} value={r.pontoFraco} onChange={(e) => mud({ pontoFraco: e.target.value })} placeholder="Um preço ou vulnerabilidade da forma" /></label>
            )}
          </div>
        )}
      </div>

      <div className="construtor-rodape">
        <button type="button" className="btn btn-paper" onClick={onFechar}>Decidir depois</button>
        <button type="button" className="btn" disabled={!podeSalvar} onClick={() => onSalvar(r)}>
          Salvar {nomeTipo}
        </button>
      </div>
    </div>
  );
}

/** Formas já definidas, em cartas para o Resumo, com as ações usáveis. */
export function CartasFormas({ f, c, r, alterar, onEditar }: { f: Ficha; c: Calculo; r: Rolagens; alterar: (p: Partial<Ficha>) => void; onEditar: (t: TipoForma) => void }) {
  const [msg, setMsg] = useState("");
  const lista = (["bankai", "resurreccion", "vollstandig"] as TipoForma[]).map((t) => f.formas[t]).filter((x): x is FormaLib => !!x && !!x.nome);
  if (lista.length === 0) return null;

  const usar = (nome: string, pr: number) => {
    alterar({ prAtual: Math.max(0, f.prAtual - pr) });
    setMsg(`${nome}: ${pr} PR gastos.`);
  };

  return (
    <div className="caixa">
      <h3>Formas de liberação</h3>
      {msg && <p className="ajuda" role="status">{msg}</p>}
      <div className="cartas-hab">
        {lista.map((x) => {
          const ativa = f.estado.liberado === x.tipo;
          const prontas = acoesDaForma(x, f.classe);
          return (
            <article className="carta-hab forma-card" key={x.tipo}>
              <small className="ajuda">{TIPO_FORMA_NOME[x.tipo]}{x.estilo ? ` · ${x.estilo}` : ""}{ativa ? " · ATIVA" : ""}</small>
              <h3>{x.nome}</h3>
              {x.comando && <p><i>“{x.comando}”</i></p>}
              {x.aparencia && <p>{x.aparencia}</p>}
              {x.tipo === "bankai" && <p><b>Custo:</b> {x.custo} PR · <b>Duração:</b> {x.duracao}</p>}
              {x.traco && <p><b>Traço:</b> {x.traco}</p>}
              {!ativa && <p className="ajuda">Ative a {TIPO_FORMA_NOME[x.tipo]} nas Ações rápidas para usar as ações abaixo.</p>}
              {[...prontas.map((a) => ({ id: "p-" + a.nome, nome: a.nome, texto: a.texto, custo: `${a.pr} PR`, acao: a.acao, pr: a.pr, dano: a.dano })), ...x.habilidades].map((h) => {
                const dano = h.dano ? resolverDano(h.dano, f, c) : "";
                return (
                  <div className="acao-forma" key={h.id}>
                    <p><b>{h.nome || "Habilidade"}</b>{h.acao || h.custo ? ` (${[h.acao, h.custo].filter(Boolean).join(", ")})` : ""}: {h.texto}</p>
                    {(h.pr !== undefined || dano) && (
                      <div className="acao-botoes">
                        {h.pr !== undefined && h.pr > 0 && (
                          <button type="button" className="btn-mini" disabled={!ativa || f.prAtual < h.pr} onClick={() => usar(h.nome, h.pr!)}>
                            Usar ({h.pr} PR)
                          </button>
                        )}
                        {dano && /\d/.test(dano) && (
                          <button type="button" className="btn-mini" disabled={!ativa} onClick={() => r.expr(h.nome, dano)}>
                            🎲 {dano}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {x.tipo === "vollstandig" && Object.keys(x.picks).length > 0 && (
                <ul>
                  {Object.entries(x.picks).map(([id, n]) => {
                    const h = HAB_UNICAS.find((u) => u.id === id);
                    return <li key={id}>{h?.nome} ({n}x): {h?.texto}</li>;
                  })}
                </ul>
              )}
              {x.canalizador && <p><b>Canalizador:</b> {x.canalizador}</p>}
              {x.schrift && <p><b>Schrift:</b> {x.schrift}</p>}
              {x.pontoFraco && <p><b>Ponto fraco:</b> {x.pontoFraco}</p>}
              <button type="button" className="link-perigo" onClick={() => onEditar(x.tipo)}>Editar</button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
