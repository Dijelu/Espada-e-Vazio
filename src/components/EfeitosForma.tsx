import { useEffect, useMemo, useState } from "react";
import { calcular, type Atr, type Ficha, type FormaLib } from "../regras/ficha";
import {
  ALVOS, ARMADOS, ATR_NOME, QUANDO_NOME, avisosDeTeto, custoEfeito, custoPeca, orcamentoDaForma, somarForma,
  type Alvo, type CtxForma, type Efeito, type InstEfeito, type Num, valor,
} from "../regras/efeitos-forma";
import { SeletorDano, SeletorValor } from "./SeletorFormula";
import { SCHRIFTS } from "../regras/schrifts";
import { CATEGORIAS, presetsDaFamilia, type Categoria, type ParamPreset, type Preset } from "../regras/efeitos-presets";

const novoId = () => `fx-${Math.random().toString(36).slice(2, 9)}`;
const ATRS: Atr[] = ["for", "des", "con", "men", "esp"];

type Grupo = "armados" | Alvo;
const GRUPOS: { id: Grupo; nome: string; em: Alvo[] }[] = [
  { id: "armados", nome: "Ataques armados e Hadō", em: ARMADOS },
  ...ALVOS.map((a) => ({ id: a.id as Grupo, nome: a.nome, em: [a.id] })),
];

interface Props {
  f: Ficha;
  tipo: FormaLib["tipo"];
  r: FormaLib;
  mud: (p: Partial<FormaLib>) => void;
  /** grava a forma sem fechar (usado ao confirmar as escolhas) */
  onGravar?: (forma: FormaLib) => void;
  /** "poder": só peças de poder; "fracos": só pontos fracos; sem valor: tudo junto */
  modo?: "tudo" | "poder" | "fracos";
}

/** Construtor de efeitos da transformação: peças prontas ou criadas à mão, com orçamento em Pontos de Poder. */
export function EfeitosForma({ f, tipo, r, mud, onGravar, modo = "tudo" }: Props) {
  const c = useMemo(() => calcular({ ...f, estado: { ...f.estado, liberado: "" } }), [f]);
  const ctx: CtxForma = { n: f.nivel, prof: c.prof, atr: c.atr };
  const efeitos = r.efeitos ?? [];
  const orc = orcamentoDaForma(f, tipo, r, ctx);
  const potencializadora = r.estilo === "potencializadora";
  const transformadora = r.estilo === "transformadora";
  const lista = presetsDaFamilia(tipo, { potencializadora, transformadora, schrift: f.schrift });
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState<Categoria | "">("");
  const [params, setParams] = useState<Record<string, ParamPreset>>({});
  const [novo, setNovo] = useState(false);
  const [msg, setMsg] = useState("");
  const pendentes = efeitos.filter((e) => !e.confirmado);

  const custoDo = (p: Preset) => custoPreset(p, params[p.id] ?? {}, ctx);
  const categorias = CATEGORIAS.filter((x) => (x !== "Schrift" || tipo === "vollstandig") && (modo === "fracos" ? x === "Pontos fracos" : modo === "poder" ? x !== "Pontos fracos" : true));
  const [tirando, setTirando] = useState("");
  const daSchrift = useMemo(() => (tipo === "vollstandig" && f.schrift ? lista.filter((p) => p.schrift === f.schrift) : []), [tipo, f.schrift, lista]);
  const infoSchrift = f.schrift ? SCHRIFTS.find((x) => x.id === f.schrift) : undefined;
  // a Schrift do personagem já entra montada na Vollständig (uma vez; se o jogador tirar, não volta)
  useEffect(() => {
    if (tipo !== "vollstandig" || !f.schrift || r.schriftAuto === f.schrift || daSchrift.length === 0) return;
    const jaTem = new Set(efeitos.map((e) => e.preset));
    const novas: InstEfeito[] = daSchrift.filter((p) => !jaTem.has(p.id)).map((p) => ({ id: novoId(), preset: p.id, nome: p.nome, texto: p.texto, efeitos: p.monta({}), pp: p.pp }));
    mud({ efeitos: [...efeitos, ...novas], schriftAuto: f.schrift });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, f.schrift, r.schriftAuto]);
  const visiveis = efeitos.filter((e) => (modo === "tudo" ? true : modo === "fracos" ? custoPeca(e, ctx) < 0 : custoPeca(e, ctx) >= 0));
  const [soExcl, setSoExcl] = useState(false);
  const temExcl = lista.some((p) => exclusiva(p));
  const filtrados = lista.filter((p) => (!soExcl || exclusiva(p)) && (modo !== "fracos" || p.categoria === "Pontos fracos") && (modo !== "poder" || p.categoria !== "Pontos fracos") && (!cat || p.categoria === cat) && (!busca.trim() || `${p.nome} ${p.texto} ${p.caminho ?? ""}`.toLowerCase().includes(busca.trim().toLowerCase())));

  const adicionar = (p: Preset) => {
    const par = { ...(p.nPadrao ? { n: p.nPadrao } : {}), ...(params[p.id] ?? {}) };
    if (p.param === "atr" && !par.atr) par.atr = "for";
    const inst: InstEfeito = { id: novoId(), preset: p.id, nome: nomeComParam(p, par), texto: p.texto, efeitos: p.monta(par), pp: p.pp !== undefined ? p.pp : undefined };
    if (p.pp === undefined) inst.pp = undefined;
    const custo = custoPeca(inst, ctx);
    if (custo > orc.livre && custo > 0) { setMsg(`Faltam ${custo - orc.livre} PP para ${p.nome}.`); return; }
    if (p.monta({}).some((x) => x.k === "frenesi") && efeitos.some((e) => e.efeitos.some((x) => x.k === "frenesi"))) { setMsg("Só pode haver um frenesi na forma."); return; }
    if (p.unico && efeitos.some((e) => e.preset === p.id)) { setMsg(`${p.nome} só pode entrar uma vez.`); return; }
    setMsg("");
    mud({ efeitos: [...efeitos, inst], ...(p.categoria === "Pontos fracos" && !r.pontoFraco.trim() ? { pontoFraco: `${p.nome}: ${p.texto}` } : {}) });
  };
  const remover = (id: string) => mud({ efeitos: efeitos.filter((e) => e.id !== id) });
  const confirmar = () => {
    if (orc.livre < 0) { setMsg("Tire alguma peça: o total passou dos pontos da forma."); return; }
    const novas = efeitos.map((e) => ({ ...e, confirmado: true }));
    mud({ efeitos: novas });
    onGravar?.({ ...r, efeitos: novas });
    setMsg(`Escolhas confirmadas. Sobraram ${orc.livre} PP para usar depois.`);
  };

  return (
    <div className="caixa efeitos-forma">
      <h3>{modo === "fracos" ? "Pontos fracos da forma" : "Cartões de característica da forma"}</h3>
      {modo === "fracos" ? <p className="ajuda">Cada ponto fraco vale de verdade na ficha enquanto a forma estiver ativa. Os leves devolvem poucos pontos; os pesados, bastante, mas ficam fora do teto de um terço (até 9 pontos no total, junto com o frenesi).</p> : <p className="ajuda">Monte o que a forma dá enquanto estiver ativa. Cada cartão de característica custa Pontos de Poder (PP); os efeitos entram sozinhos na ficha ao liberar. Depois de <b>confirmar</b>, a peça fica travada; os pontos que sobrarem podem ser gastos depois.</p>}

      <div className={`medidor-pp ${orc.livre < 0 ? "estourou" : ""}`} role="status" aria-live="polite">
        <b>Pontos de Poder: {orc.gasto} de {orc.total}</b>
        <span className="barra"><i style={{ width: `${Math.min(100, Math.max(0, (orc.gasto / Math.max(1, orc.total)) * 100))}%` }} /></span>
        <small>{orc.livre >= 0 ? `${orc.livre} livres` : `${-orc.livre} acima do limite`}{orc.devolvido > 0 ? ` · ${orc.devolvido} devolvidos por pontos fracos` : ""}</small>
      </div>
      {orc.avisos.map((a) => <p key={a} className="aviso-mini">{a}</p>)}
      {modo !== "fracos" && <label className="campo">Pontos extras dados pelo Mestre (forma lendária, 0 a 12)
        <input type="number" min={0} max={12} value={r.ppExtra ?? 0} onChange={(e) => mud({ ppExtra: Math.max(0, Math.min(12, Math.floor(Number(e.target.value) || 0))) })} />
      </label>}

      {tipo === "bankai" && potencializadora && (f.formas.shikai?.efeitos?.length ?? 0) > 0 && (
        <label className="marcar"><input type="checkbox" checked={!!r.herdaShikai} onChange={(e) => mud({ herdaShikai: e.target.checked })} /> Herdar os efeitos da Shikai (custam metade dos pontos)</label>
      )}

      {infoSchrift && modo !== "fracos" && (
        <div className="schrift-sua">
          <small>Sua Schrift</small>
          <b>{infoSchrift.nome}</b>
          <p>{infoSchrift.voll}</p>
          <p className="ajuda">{daSchrift.length > 0 ? "As peças dela já entram montadas abaixo. Você pode tirar, se quiser." : "Ela age pelas ações da ficha; não há peça pronta para ela aqui."}</p>
        </div>
      )}
      {visiveis.length === 0 && <p className="ajuda">{modo === "fracos" ? "Nenhum ponto fraco escolhido ainda. Quanto mais pesado, mais pontos ele devolve." : "Nenhuma peça ainda. Escolha abaixo."}</p>}
      <ul className="efeitos-lista">
        {visiveis.map((e) => {
          const c = custoPeca(e, ctx);
          return (
            <li key={e.id} className={e.confirmado ? "travado" : ""}>
              <div>
                <b>{e.nome}</b> <small>{c < 0 ? `devolve ${-c} PP` : `${c} PP`}{e.confirmado ? " · confirmado" : ""}</small>
                {e.texto && <p className="ajuda">{e.texto}</p>}
                <p className="ajuda efeitos-resumo">{resumoDe(e, ctx)}</p>
                {avisosDeTeto(e, ctx).map((a) => <p key={a} className="aviso-mini">{a} Precisa do aval do Mestre.</p>)}
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
      {modo !== "fracos" && pendentes.length > 0 && (
        <div className="acoes-linha">
          <button type="button" className="btn" disabled={orc.livre < 0} onClick={confirmar}>Confirmar escolhas ({pendentes.length})</button>
          <small className="ajuda">Confirmadas, não dá mais para mudar nem tirar.</small>
        </div>
      )}
      {msg && <p className="ajuda" role="status">{msg}</p>}

      <h4 className="sub-passivas">Catálogo de peças</h4>
      <input className="seletor-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar peça (ex.: voo, dano, cura)" aria-label="Buscar peça" />
      <div className="filtros-pecas">
        <button type="button" className={`chip chip-btn ${cat === "" ? "on" : ""}`} onClick={() => setCat("")}>Todas</button>
        {modo !== "fracos" && temExcl && <button type="button" className={`chip chip-btn chip-exclusiva ${soExcl ? "on" : ""}`} onClick={() => setSoExcl(!soExcl)}>★ Só exclusivas</button>}
        {categorias.map((x) => <button type="button" key={x} className={`chip chip-btn ${cat === x ? "on" : ""}`} onClick={() => setCat(cat === x ? "" : x)}>{x}</button>)}
      </div>
      <div className="cartas-hab efeitos-catalogo">
        {filtrados.map((p) => {
          const custo = custoDo(p);
          const sem = custo > orc.livre && custo > 0;
          return (
            <article key={p.id} className={`carta-hab carta-peca ${exclusiva(p) ? "carta-exclusiva" : ""} ${sem ? "travada" : ""} ${custo < 0 ? "carta-fraca" : ""}`} data-classe={classeDe(tipo)} data-cat={p.categoria.toLowerCase()}>
              <div className="carta-topo">
                <small className="ajuda">{p.categoria}{p.caminho ? ` · ${p.caminho}` : ""}</small>
                <span className={`selo-pp ${custo < 0 ? "devolve" : ""}`}>{custo < 0 ? `+${-custo}` : custo}<i>PP</i></span>
              </div>
              <h3>{p.nome}</h3>
              {exclusiva(p) && <span className="selo-exclusiva">★ Exclusiva da {tipo === "segunda" ? "Segunda Etapa" : `Bankai Verdadeira${p.soPotencializadora ? " Potencializadora" : p.soTransformadora ? " Transformadora" : ""}`}</span>}
              {custo < 0 && <span className={`nivel-fraco nf-${custo <= -7 ? "extremo" : custo <= -5 ? "grande" : custo <= -3 ? "medio" : "leve"}`}>{custo <= -7 ? "Extremo" : custo <= -5 ? "Grande" : custo <= -3 ? "Médio" : "Leve"}</span>}
              <p>{p.texto}</p>
              {(() => {
                const inv = p.monta({ n: p.nPadrao, atr: "for" }).find((x) => x.k === "invoca");
                if (!inv || inv.k !== "invoca") return null;
                const v = (x: Num) => valor(x, ctx);
                return (
                  <dl className="ficha-invoc">
                    <div><dt>Quantas</dt><dd>até {Math.max(1, Math.min(10, Math.floor(v(inv.max))))}</dd></div>
                    <div><dt>PV de cada</dt><dd>{Math.max(1, v(inv.pv))}</dd></div>
                    <div><dt>CR</dt><dd>{v(inv.cr)}</dd></div>
                    <div><dt>Acerto</dt><dd>+{v(inv.acerto)}</dd></div>
                    <div><dt>Dano</dt><dd>{inv.dano.replace(/\[PROF\]/g, String(ctx.prof)).replace(/\[NIV\]/g, String(ctx.n)).replace(/\[(FOR|DES|CON|MEN|ESP)\]/g, (_m, k: string) => String(ctx.atr[k.toLowerCase() as Atr]))}</dd></div>
                    <div><dt>Custo</dt><dd>{v(inv.custoPr)} PR cada</dd></div>
                    {inv.texto && <p className="ajuda">{inv.texto}</p>}
                  </dl>
                );
              })()}
              {p.param === "atr" && (
                <label className="campo">{p.rotuloParam}
                  <select value={params[p.id]?.atr ?? "for"} onChange={(e) => setParams((m) => ({ ...m, [p.id]: { ...m[p.id], atr: e.target.value as Atr } }))}>
                    {ATRS.map((a) => <option key={a} value={a}>{ATR_NOME[a]}</option>)}
                  </select>
                </label>
              )}
              {p.param === "tipo" && (
                <label className="campo">{p.rotuloParam}
                  <input value={params[p.id]?.tipo ?? ""} placeholder="Ex.: Fogo" maxLength={30} onChange={(e) => setParams((m) => ({ ...m, [p.id]: { ...m[p.id], tipo: e.target.value } }))} />
                </label>
              )}
              {(p.param === "n" || (p.param === "atr" && p.nPadrao)) && (
                <label className="campo">{p.param === "n" ? p.rotuloParam : "Valor (+)"}
                  <input type="number" min={1} max={p.param === "n" ? 6 : 4} value={params[p.id]?.n ?? p.nPadrao ?? 1} onChange={(e) => setParams((m) => ({ ...m, [p.id]: { ...m[p.id], n: Math.max(1, Math.floor(Number(e.target.value) || 1)) } }))} />
                </label>
              )}
              {p.aprovacao && <p className="ajuda">Precisa do aval do Mestre.</p>}
              <button type="button" className="btn-mini" disabled={sem} onClick={() => adicionar(p)}>{sem ? "Pontos insuficientes" : custo < 0 ? "Assumir este ponto fraco" : "Adicionar"}</button>
            </article>
          );
        })}
        {filtrados.length === 0 && <p className="ajuda">Nenhuma peça encontrada.</p>}
      </div>

      <h4 className="sub-passivas">Criar uma peça</h4>
      {!novo ? (
        <button type="button" className="btn btn-paper" onClick={() => setNovo(true)}>Criar peça própria</button>
      ) : (
        <PecaPropria ctx={ctx} livre={orc.livre} onCriar={(p) => { mud({ efeitos: [...efeitos, p] }); setNovo(false); setMsg(""); }} onFechar={() => setNovo(false)} />
      )}
    </div>
  );
}

/** Em que "família" de classe a forma cai, para dar o visual certo ao cartão. */
const exclusiva = (p: Preset) => p.familias.length === 1 && (p.familias[0] === "bankai2" || p.familias[0] === "segunda");

export function classeDe(tipo: FormaLib["tipo"]): "shinigami" | "hollow" | "quincy" {
  return tipo === "resurreccion" || tipo === "segunda" ? "hollow" : tipo === "vollstandig" ? "quincy" : "shinigami";
}

function nomeComParam(p: Preset, par: ParamPreset): string {
  if (p.param === "atr" && par.atr) return `${p.nome} (${ATR_NOME[par.atr]}${par.n ? ` +${par.n}` : ""})`;
  if (p.param === "tipo" && par.tipo) return `${p.nome} (${par.tipo})`;
  if (p.param === "n" && par.n) {
    const d = /\(d(\d+)\)/.exec(p.rotuloParam ?? "");
    return `${p.nome} (${d ? `+${par.n}d${d[1]}` : par.n})`;
  }
  return p.nome;
}

function custoPreset(p: Preset, par: ParamPreset, ctx: CtxForma): number {
  if (p.pp !== undefined) return p.pp;
  const efs = p.monta({ ...(p.nPadrao ? { n: p.nPadrao } : {}), ...par, atr: par.atr ?? "for" });
  return efs.reduce((s, e) => s + custoEfeito(e, ctx), 0);
}

const resumoDe = (e: InstEfeito, ctx: CtxForma) => {
  const s = somarFormaDe(e, ctx);
  return s || "Efeito de texto: o Mestre resolve.";
};

/** Resumo em palavras do que a peça faz no nível atual. */
function somarFormaDe(e: InstEfeito, ctx: CtxForma): string {
  const fake = { formas: { shikai: { tipo: "shikai", efeitos: [e] } }, estado: { liberado: "shikai" } } as unknown as Ficha;
  const s = somarForma(fake, ctx);
  if (!s) return "";
  const linhas = s.linhas.map((l) => `${l.rotulo} ${l.valor}`.trim());
  for (const g of s.gatilhos) linhas.push(`${QUANDO_NOME[g.quando]}: ${descreveFaz(g.faz, ctx)}${g.limite ? ` (1 por ${g.limite})` : ""}`);
  for (const t of s.textos) linhas.push(t.t);
  return linhas.join(" · ");
}

function descreveFaz(z: import("../regras/efeitos-forma").Faz, ctx: CtxForma): string {
  const partes: string[] = [];
  const v = (x: import("../regras/efeitos-forma").Num | undefined) => {
    const f = { formas: {}, estado: {} } as unknown as Ficha;
    void f;
    return typeof x === "number" ? x : String(x ?? "").replace(/\[PROF\]/g, String(ctx.prof)).replace(/\[NIV\]/g, String(ctx.n));
  };
  if (z.curaPv !== undefined) partes.push(`cura ${v(z.curaPv)} PV`);
  if (z.pvTemp !== undefined) partes.push(`${v(z.pvTemp)} PV temporários`);
  if (z.prTemp !== undefined) partes.push(`${v(z.prTemp)} PR temporários`);
  if (z.pr !== undefined) partes.push(`recupera ${v(z.pr)} PR`);
  if (z.dano) partes.push(`${v(z.dano.expr)} de ${z.dano.tipo}${z.dano.area ? ` (${z.dano.area})` : ""}`);
  if (z.condicao) partes.push(`alvo fica ${z.condicao.nome}${z.condicao.salva ? ` (salva de ${ATR_NOME[z.condicao.salva]})` : ""}`);
  if (z.texto) partes.push(z.texto);
  return partes.join(", ");
}

/** Editor de peça própria: escolhe o tipo de efeito e preenche só o que ele precisa. */
function PecaPropria({ ctx, livre, onCriar, onFechar }: { ctx: CtxForma; livre: number; onCriar: (p: InstEfeito) => void; onFechar: () => void }) {
  const [tipo, setTipo] = useState<"atr" | "cr" | "acerto" | "dano" | "dados" | "cd" | "rd" | "desloc" | "pvTemp" | "texto" | "fraco" | "invoca" | "fatr" | "fcr" | "facerto" | "fdano" | "fcd" | "fdesloc" | "fvulner" | "fcusto" | "ffim" | "fdur">("atr");
  const [nome, setNome] = useState("");
  const [atr, setAtr] = useState<Atr>("for");
  const [grupo, setGrupo] = useState<Grupo>("armados");
  const [v, setV] = useState("2");
  const [d, setD] = useState(8);
  const [rd, setRd] = useState<"fis" | "eso" | "ambos">("ambos");
  const [modo, setModo] = useState<"chao" | "voo">("chao");
  const [texto, setTexto] = useState("");
  const [inv, setInv] = useState({ tipo: "clone" as "clone" | "invocacao", max: "2", pv: "[PROF]*2", cr: "10+[PROF]", acerto: "[PROF]", dano: "1d8+[PROF]", custoPr: "2" });
  const em = GRUPOS.find((x) => x.id === grupo)?.em ?? ARMADOS;
  const num = v.trim() === "" ? 0 : v.trim();
  // pontos fracos: o jogador digita o tamanho da perda e a peça aplica com sinal negativo
  const neg = (x: string): Num => { const t = x.trim(); if (t === "") return 0; return /^\d+(\.\d+)?$/.test(t) ? -Number(t) : `0-(${t})`; };
  const [vuln, setVuln] = useState("fogo");
  const [fim, setFim] = useState<"curto" | "longo">("curto");
  const efeito: Efeito | null =
    tipo === "atr" ? { k: "atr", atr, v: num }
    : tipo === "cr" ? { k: "cr", v: num }
    : tipo === "acerto" ? { k: "acerto", em, v: num }
    : tipo === "dano" ? { k: "dano", em, v: num }
    : tipo === "dados" ? { k: "dados", em, n: num, d }
    : tipo === "cd" ? { k: "cd", v: num }
    : tipo === "rd" ? { k: "rd", tipo: rd, v: num }
    : tipo === "desloc" ? { k: "desloc", modo, v: num }
    : tipo === "fatr" ? { k: "atr", atr, v: neg(v) }
    : tipo === "fcr" ? { k: "cr", v: neg(v) }
    : tipo === "facerto" ? { k: "acerto", em, v: neg(v) }
    : tipo === "fdano" ? { k: "dano", em, v: neg(v) }
    : tipo === "fcd" ? { k: "cd", v: neg(v) }
    : tipo === "fdesloc" ? { k: "desloc", modo, v: neg(v) }
    : tipo === "fvulner" ? { k: "resist", dano: vuln.trim() || "fogo", grau: "vulner" }
    : tipo === "fcusto" ? { k: "custo", pr: num }
    : tipo === "ffim" ? { k: "fim", esgotado: fim }
    : tipo === "fdur" ? { k: "duracao", turnos: num }
    : tipo === "fraco" ? { k: "texto", t: texto }
    : tipo === "pvTemp" ? { k: "gatilho", quando: "liberar", faz: { pvTemp: num }, rotulo: nome || "PV temporários" }
    : { k: "texto", t: texto };
  const ehFraqueza = tipo === "fatr" || tipo === "fcr" || tipo === "facerto" || tipo === "fdano" || tipo === "fcd" || tipo === "fdesloc" || tipo === "fvulner" || tipo === "fcusto" || tipo === "ffim" || tipo === "fdur" || tipo === "fraco";
  const custo = efeito ? custoEfeito(efeito, ctx) : 0;
  const ok = !!efeito && ((tipo !== "texto" && tipo !== "fraco") || texto.trim().length > 0) && (ehFraqueza || custo <= livre);
  return (
    <div className="npc-item peca-propria">
      <label className="campo">O que a peça faz
        <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
          <option value="atr">Aumentar um atributo</option>
          <option value="cr">Aumentar a CR</option>
          <option value="acerto">Bônus de acerto</option>
          <option value="dano">Dano fixo extra</option>
          <option value="dados">Dados de dano extra</option>
          <option value="cd">CD dos Kidōs e técnicas</option>
          <option value="rd">Redução de dano</option>
          <option value="desloc">Deslocamento ou voo</option>
          <option value="pvTemp">PV temporários ao liberar</option>
          <option value="texto">Efeito em texto (o Mestre aprova)</option>
          <option value="invoca">Clone ou invocação</option>
          <optgroup label="Pontos fracos (devolvem pontos)">
            <option value="fatr">Perder um atributo</option>
            <option value="fcr">Perder CR</option>
            <option value="facerto">Perder acerto</option>
            <option value="fdano">Perder dano fixo</option>
            <option value="fcd">Perder CD dos Kidōs e técnicas</option>
            <option value="fdesloc">Perder deslocamento ou voo</option>
            <option value="fvulner">Ficar vulnerável a um tipo de dano</option>
            <option value="fcusto">Pagar PR a cada turno</option>
            <option value="ffim">Ficar Esgotado quando acabar</option>
            <option value="fdur">Duração curta (poucos turnos)</option>
          </optgroup>
        </select>
      </label>
      <label className="campo">Nome<input value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} placeholder="Nome da peça" /></label>
      {(tipo === "atr" || tipo === "fatr") && <label className="campo">Atributo<select value={atr} onChange={(e) => setAtr(e.target.value as Atr)}>{ATRS.map((a) => <option key={a} value={a}>{ATR_NOME[a]}</option>)}</select></label>}
      {(tipo === "acerto" || tipo === "dano" || tipo === "dados" || tipo === "facerto" || tipo === "fdano") && <label className="campo">Vale para<select value={grupo} onChange={(e) => setGrupo(e.target.value as Grupo)}>{GRUPOS.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}</select></label>}
      {tipo === "dados" && <label className="campo">Dado<select value={d} onChange={(e) => setD(Number(e.target.value))}>{[4, 6, 8, 10, 12].map((x) => <option key={x} value={x}>d{x}</option>)}</select></label>}
      {tipo === "rd" && <label className="campo">Contra<select value={rd} onChange={(e) => setRd(e.target.value as typeof rd)}><option value="ambos">Tudo</option><option value="fis">Físico</option><option value="eso">Esotérico</option></select></label>}
      {(tipo === "desloc" || tipo === "fdesloc") && <label className="campo">Tipo<select value={modo} onChange={(e) => setModo(e.target.value as typeof modo)}><option value="chao">No chão</option><option value="voo">Voo</option></select></label>}
      {tipo === "invoca" && (
        <>
          <label className="campo">Tipo<select value={inv.tipo} onChange={(e) => setInv({ ...inv, tipo: e.target.value as "clone" | "invocacao" })}><option value="clone">Clone</option><option value="invocacao">Invocação</option></select></label>
          <SeletorValor rotulo="Quantidade máxima" valor={inv.max} ctx={ctx} onChange={(x) => setInv({ ...inv, max: x })} />
          <SeletorValor rotulo="PV de cada" valor={inv.pv} ctx={ctx} onChange={(x) => setInv({ ...inv, pv: x })} />
          <SeletorValor rotulo="CR" valor={inv.cr} ctx={ctx} onChange={(x) => setInv({ ...inv, cr: x })} />
          <SeletorValor rotulo="Acerto" valor={inv.acerto} ctx={ctx} onChange={(x) => setInv({ ...inv, acerto: x })} />
          <SeletorDano rotulo="Dano de cada" valor={inv.dano} ctx={ctx} onChange={(x) => setInv({ ...inv, dano: x })} />
          <SeletorValor rotulo="Custo de cada em PR" valor={inv.custoPr} ctx={ctx} onChange={(x) => setInv({ ...inv, custoPr: x })} />
          <label className="campo npc-larga">Anotação (opcional)<textarea rows={2} maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} /></label>
        </>
      )}
      {tipo === "fvulner" && <label className="campo">Tipo de dano<input value={vuln} maxLength={30} onChange={(e) => setVuln(e.target.value)} placeholder="ex.: fogo, gelo, espiritual" /></label>}
      {tipo === "ffim" && <label className="campo">Descanso para se recuperar<select value={fim} onChange={(e) => setFim(e.target.value as typeof fim)}><option value="curto">Descanso curto (-2 PP)</option><option value="longo">Descanso longo (-3 PP)</option></select></label>}
      {tipo !== "texto" && tipo !== "fraco" && tipo !== "invoca" && tipo !== "fvulner" && tipo !== "ffim" && <SeletorValor rotulo={tipo === "pvTemp" ? "PV temporários" : tipo === "fcusto" ? "PR por turno" : tipo === "fdur" ? "Turnos de duração" : ehFraqueza ? "Quanto perde" : "Valor"} valor={v} ctx={ctx} onChange={setV} />}
      {(tipo === "texto" || tipo === "fraco") && <label className="campo npc-larga">{tipo === "fraco" ? "Qual é o preço ou fraqueza" : "Descrição"}<textarea rows={2} maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} /></label>}
      <p className="ajuda npc-larga">{custo < 0 ? "Devolve" : "Custo"}: <b>{Math.abs(custo)} PP</b>{custo > livre ? ` (faltam ${custo - livre})` : ""}</p>
      <div className="acoes-linha npc-larga">
        <button type="button" className="btn-mini" disabled={!ok} onClick={() => efeito && onCriar({ id: novoId(), nome: nome.trim() || "Peça própria", efeitos: [efeito], pp: tipo === "texto" ? 1 : tipo === "fraco" ? -1 : undefined })}>Adicionar peça</button>
        <button type="button" className="link-perigo" onClick={onFechar}>Cancelar</button>
      </div>
    </div>
  );
}

/** Um seletor de atributo para cada "Aumento de Atributo" escolhido na Vollständig. */
export function EscolhaAtributos({ n, valor, onChange }: { n: number; valor: Atr[] | undefined; onChange: (v: Atr[]) => void }) {
  if (n <= 0) return null;
  const atual = valor ?? [];
  return (
    <div className="escolha-atr">
      {Array.from({ length: n }, (_, i) => (
        <label key={i} className="campo">Aumento {i + 1}: +2 em
          <select value={atual[i] ?? ""} onChange={(e) => { const novo = [...atual]; novo[i] = e.target.value as Atr; onChange(novo.slice(0, n)); }}>
            <option value="">Escolha</option>
            {ATRS.map((a) => <option key={a} value={a}>{ATR_NOME[a]}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
