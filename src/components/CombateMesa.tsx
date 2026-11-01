import { useEffect, useMemo, useRef, useState } from "react";
import { calcular } from "../regras/ficha";
import { calcularAmeaca, comLiberacao, efeitosDaLiberacao, type Ameaca } from "../regras/ameacas";
import { publicarCombate, type FichaDaMesa, type Npc } from "../lib/campanhas";
import { rolarExpressao } from "../lib/dados";

interface AcaoNpc {
  nome: string;
  tipo: "ataque" | "tecnica";
  acerto: number;
  /** expressão de dano, ex.: "2d8 + 6" */
  dano: string;
  custo: number;
  cd: number;
  /** menor valor do d20 que é crítico */
  crit: number;
  mult: number;
}

interface Resultado {
  texto: string;
  dano: number;
  alvoId: string;
  tecnica: boolean;
  acertou: boolean;
}

interface Participante {
  id: string;
  nome: string;
  tipo: "jogador" | "npc";
  /** iniciativa já rolada (null = ainda não rolou) */
  ini: number | null;
  /** bônus somado ao d20: metade da Destreza e extras */
  bonus: number;
  pv: number;
  pvMax: number;
  pr: number;
  prMax: number;
  cr: number;
  fora: boolean;
  nota: string;
  /** NPCs adicionados juntos rolam uma iniciativa só */
  grupo: string;
  /** os jogadores veem "Criatura desconhecida" no lugar do nome */
  oculto: boolean;
  acoes: AcaoNpc[];
  /** ficha de origem (jogadores) */
  fichaId?: string;
  /** forma liberada (Bankai, Resurrección, Vollständig) */
  lib?: { nome: string; ativo: boolean; base: Forma; liberada: Forma; efeito: { dano: number; tipo: string; curaPv: number } };
}

interface Forma { acoes: AcaoNpc[]; cr: number; pvMax: number; prMax: number }

interface Estado {
  ativo: boolean;
  rodada: number;
  vez: string | null;
  lista: Participante[];
}

function formaDe(am: Ameaca, liberado: boolean): Forma {
  const c = calcularAmeaca(am, liberado);
  const atr = liberado ? comLiberacao(am).atr : am.atr;
  const fonte = liberado ? comLiberacao(am) : am;
  const acoes: AcaoNpc[] = [
    ...c.ataques.map((a) => ({
      nome: a.nome, tipo: "ataque" as const, acerto: a.acerto, dano: a.dano, custo: a.custo || Number(/\((\d+) PR\)/.exec(a.nome)?.[1] ?? 0),
      cd: 0, crit: a.crit !== 20 ? a.crit : Number(/Crítico (\d+)/.exec(a.nome)?.[1] ?? 20), mult: Number(/x(\d)/.exec(a.nome)?.[1] ?? 2),
    })),
    ...c.tecnicas.map((t, i) => ({
      nome: t.nome, tipo: "tecnica" as const, acerto: 0, dano: `${t.dados} + ${atr[fonte.tecnicas[i]?.atr ?? "esp"]}`, custo: t.custo, cd: t.cd, crit: 21, mult: 1,
    })),
  ];
  return { acoes, cr: c.cr, pvMax: c.pv, prMax: c.pr };
}

const vazio: Estado = { ativo: false, rodada: 1, vez: null, lista: [] };
const chave = (id: string) => `esv:combate:${id}`;
const d20 = () => 1 + Math.floor(Math.random() * 20);
const novoId = () => Math.random().toString(36).slice(2, 10);

function ler(id: string): Estado {
  try {
    const t = localStorage.getItem(chave(id));
    if (!t) return vazio;
    const o = JSON.parse(t) as Partial<Estado>;
    if (!o || !Array.isArray(o.lista)) return vazio;
    return { ativo: o.ativo === true, rodada: Math.max(1, Number(o.rodada) || 1), vez: typeof o.vez === "string" ? o.vez : null, lista: (o.lista.slice(0, 60) as Participante[]).map((p) => ({ ...p, oculto: p.oculto === true, acoes: Array.isArray(p.acoes) ? p.acoes : [] })) };
  } catch {
    return vazio;
  }
}

/** Rastreador de combate do Mestre: iniciativa, turnos, PV e PR dos jogadores e NPCs da mesa. */
export function CombateMesa({ campanhaId, fichas, npcs, pastas }: { campanhaId: string; fichas: FichaDaMesa[]; npcs: Npc[]; pastas: string[] }) {
  const [est, setEst] = useState<Estado>(() => ler(campanhaId));
  const [origem, setOrigem] = useState("");
  const [qtd, setQtd] = useState(1);
  const [res, setRes] = useState<Resultado | null>(null);
  const [alvos, setAlvos] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    try { localStorage.setItem(chave(campanhaId), JSON.stringify(est)); } catch { /* sem armazenamento */ }
  }, [campanhaId, est]);

  // a ficha do jogador mudou (dano, cura, PR gasto)? o painel acompanha; ajustes do Mestre valem até a ficha mudar de novo
  const vistas = useRef<Record<string, string>>({});
  useEffect(() => {
    const mudancas: Record<string, { pv: number; pvMax: number; pr: number; prMax: number; cr: number }> = {};
    for (const f of fichas) {
      const c = calcular(f.ficha);
      const marca = `${f.ficha.pvAtual}|${f.ficha.prAtual}|${c.pv}|${c.pr}|${c.cr}`;
      if (vistas.current[f.id] === undefined) { vistas.current[f.id] = marca; continue; }
      if (vistas.current[f.id] !== marca) {
        vistas.current[f.id] = marca;
        mudancas[f.id] = { pv: Math.min(f.ficha.pvAtual, c.pv), pvMax: c.pv, pr: Math.min(f.ficha.prAtual, c.pr), prMax: c.pr, cr: c.cr };
      }
    }
    if (Object.keys(mudancas).length === 0) return;
    setEst((e) => ({ ...e, lista: e.lista.map((p) => (p.fichaId && mudancas[p.fichaId] ? { ...p, ...mudancas[p.fichaId] } : p)) }));
  }, [fichas]);

  // os jogadores só veem a ordem; PV dos NPCs ficam com o Mestre
  useEffect(() => {
    const t = window.setTimeout(() => {
      const ord = [...est.lista].sort((a, b) => (b.ini ?? -99) - (a.ini ?? -99)).filter((p) => p.ini !== null);
      const publico = ord.length === 0 ? null : {
        rodada: est.rodada,
        ordem: ord.map((p) => ({ nome: p.oculto ? "Criatura desconhecida" : p.nome, jogador: p.tipo === "jogador", ini: p.ini, fora: p.fora, vez: p.id === est.vez })),
      };
      publicarCombate(campanhaId, publico).catch(() => setAviso("Não consegui mostrar a ordem aos jogadores agora."));
    }, 900);
    return () => window.clearTimeout(t);
  }, [campanhaId, est.lista, est.rodada, est.vez]);

  const opcoes = useMemo(
    () => [
      ...fichas.map((f) => ({ id: `f:${f.id}`, nome: f.nome, rotulo: `${f.nome} (jogador)` })),
      ...npcs.map((n) => ({ id: `n:${n.id}`, nome: n.nome, rotulo: `${n.nome} (NPC)` })),
    ],
    [fichas, npcs]
  );
  const primeira = fichas[0] ? `f:${fichas[0].id}` : pastas[0] ? `p:${pastas[0]}` : npcs[0] ? `n:${npcs[0].id}` : "";
  const escolhida = origem || primeira;

  const ordenada = useMemo(
    () => [...est.lista].sort((a, b) => (b.ini ?? -99) - (a.ini ?? -99)),
    [est.lista]
  );
  const ativos = ordenada.filter((p) => !p.fora && p.ini !== null);

  const mudar = (id: string, parte: Partial<Participante>) =>
    setEst((e) => ({ ...e, lista: e.lista.map((p) => (p.id === id ? { ...p, ...parte } : p)) }));

  const doNpc = (n: Npc, qtdN: number): Participante[] => {
    const am = n.dados.ameaca;
    const base = formaDe(am, false);
    const liberada = am.liberacao.existe ? formaDe(am, true) : null;
    const ativo = n.dados.liberado && liberada !== null;
    const c = ativo && liberada ? liberada : base;
    const total = Math.max(1, Math.min(20, qtdN));
    const grupo = novoId();
    return Array.from({ length: total }, (_, i) => ({
      id: novoId(), nome: total > 1 ? `${n.nome} ${i + 1}` : n.nome, tipo: "npc" as const, ini: null, bonus: Math.floor(am.atr.des / 2),
      pv: Math.min(n.dados.pvAtual ?? c.pvMax, c.pvMax), pvMax: c.pvMax, pr: Math.min(n.dados.prAtual ?? c.prMax, c.prMax), prMax: c.prMax, cr: c.cr, fora: false, nota: "", grupo, oculto: false, acoes: c.acoes,
      lib: liberada ? { nome: am.liberacao.nome, ativo, base, liberada, efeito: efeitosDaLiberacao(am) } : undefined,
    }));
  };

  const adicionar = () => {
    try { adicionarSeguro(); } catch { setAviso("Não consegui colocar este NPC no combate."); }
  };

  const adicionarSeguro = () => {
    const corte = escolhida.indexOf(":");
    const tipo = escolhida.slice(0, corte);
    const id = escolhida.slice(corte + 1);
    const grupo = novoId();
    setAviso("");
    const novos: Participante[] = [];
    if (tipo === "f") {
      const f = fichas.find((x) => x.id === id);
      if (!f) return;
      const c = calcular(f.ficha);
      novos.push({
        id: novoId(), nome: f.nome, tipo: "jogador", ini: null, bonus: Math.floor(c.atr.des / 2) + (c.iniciativa - c.atr.des),
        pv: Math.min(f.ficha.pvAtual, c.pv), pvMax: c.pv, pr: Math.min(f.ficha.prAtual, c.pr), prMax: c.pr, cr: c.cr, fora: false, nota: "", grupo, oculto: false, acoes: [], fichaId: f.id,
      });
    } else {
      const ids = tipo === "p" ? npcs.filter((x) => x.dados.pasta === id).map((x) => x.id) : [id];
      for (const nid of ids) {
        const n = npcs.find((x) => x.id === nid);
        if (n) novos.push(...doNpc(n, tipo === "p" ? 1 : qtd));
      }
    }
    setEst((e) => {
      // entrou depois do começo: rola na hora e age a partir da rodada seguinte
      const jaRolou = e.ativo ? d20() : null;
      return { ...e, lista: [...e.lista, ...novos.map((p) => (jaRolou === null ? p : { ...p, ini: jaRolou + p.bonus }))] };
    });
  };

  const rolarTodos = () =>
    setEst((e) => {
      const porGrupo = new Map<string, number>();
      const lista = e.lista.map((p) => {
        if (p.ini !== null) return p;
        // jogadores rolam cada um; NPCs do mesmo grupo dividem o mesmo d20
        const r = p.tipo === "npc" ? porGrupo.get(p.grupo) ?? d20() : d20();
        if (p.tipo === "npc") porGrupo.set(p.grupo, r);
        return { ...p, ini: r + p.bonus };
      });
      const ord = [...lista].sort((a, b) => (b.ini ?? -99) - (a.ini ?? -99)).filter((p) => !p.fora);
      return { ...e, ativo: true, lista, vez: e.vez ?? ord[0]?.id ?? null };
    });

  const proximo = () =>
    setEst((e) => {
      const ord = [...e.lista].filter((p) => !p.fora && p.ini !== null).sort((a, b) => (b.ini ?? 0) - (a.ini ?? 0));
      if (ord.length === 0) return e;
      const i = ord.findIndex((p) => p.id === e.vez);
      const prox = i + 1 >= ord.length ? 0 : i + 1;
      return { ...e, vez: ord[prox].id, rodada: i >= 0 && prox === 0 ? e.rodada + 1 : e.rodada };
    });

  const encerrar = () => {
    if (est.lista.length > 0 && !window.confirm("Encerrar o combate e limpar a ordem de iniciativa?")) return;
    setEst(vazio);
  };

  const usar = (p: Participante, a: AcaoNpc) => {
    const alvo = est.lista.find((x) => x.id === (alvos[p.id] ?? "")) ?? est.lista.find((x) => x.id !== p.id && !x.fora && x.tipo !== p.tipo) ?? est.lista.find((x) => x.id !== p.id && !x.fora);
    if (!alvo) { setAviso("Escolha um alvo."); return; }
    if (a.custo > p.pr) { setAviso(`${p.nome} não tem PR para ${a.nome} (${a.custo} PR).`); return; }
    setAviso("");
    if (a.custo > 0) mudar(p.id, { pr: p.pr - a.custo });
    if (a.tipo === "ataque") {
      const nat = d20();
      const total = nat + a.acerto;
      const crit = nat >= a.crit;
      const acertou = nat !== 1 && (crit || nat === 20 || total >= alvo.cr);
      if (!acertou) { setRes({ texto: `${p.nome} usa ${a.nome} em ${alvo.nome}: d20 (${nat}) + ${a.acerto} = ${total} contra CR ${alvo.cr}. Errou.`, dano: 0, alvoId: alvo.id, tecnica: false, acertou: false }); return; }
      const r = rolarExpressao(a.nome, a.dano, crit);
      const dano = r?.total ?? 0;
      setRes({ texto: `${p.nome} usa ${a.nome} em ${alvo.nome}: d20 (${nat}) + ${a.acerto} = ${total} contra CR ${alvo.cr}. ${crit ? "CRÍTICO! " : "Acertou. "}Dano ${r?.detalhe ?? ""} = ${dano}.`, dano, alvoId: alvo.id, tecnica: false, acertou: true });
    } else {
      const r = rolarExpressao(a.nome, a.dano, false);
      const dano = r?.total ?? 0;
      setRes({ texto: `${p.nome} usa ${a.nome} em ${alvo.nome} (CD ${a.cd}). Dano ${r?.detalhe ?? ""} = ${dano}. Se ${alvo.nome} falhar no teste, sofre tudo; se passar, metade.`, dano, alvoId: alvo.id, tecnica: true, acertou: true });
    }
  };

  const alternarForma = (p: Participante) => {
    if (!p.lib) return;
    if (!p.lib.ativo) {
      const f = p.lib.liberada;
      const ef = p.lib.efeito;
      mudar(p.id, { lib: { ...p.lib, ativo: true }, acoes: f.acoes, cr: f.cr, pvMax: f.pvMax, prMax: f.prMax, pv: Math.min(f.pvMax, p.pv + ef.curaPv) });
      setRes({ texto: `${p.nome} libera ${p.lib.nome}! CR ${f.cr}.${ef.dano > 0 ? ` Todos os inimigos que o vejam sofrem ${ef.dano} de dano ${ef.tipo}.` : ""}${ef.curaPv > 0 ? ` Recupera ${ef.curaPv} PV.` : ""}`, dano: 0, alvoId: "", tecnica: false, acertou: false });
    } else {
      const f = p.lib.base;
      mudar(p.id, { lib: { ...p.lib, ativo: false }, acoes: f.acoes, cr: f.cr, pvMax: f.pvMax, prMax: f.prMax, pv: Math.min(f.pvMax, p.pv), pr: Math.min(f.prMax, p.pr) });
      setRes({ texto: `${p.nome} encerra ${p.lib.nome}.`, dano: 0, alvoId: "", tecnica: false, acertou: false });
    }
  };

  const aplicar = (valor: number) => {
    if (!res) return;
    const alvo = est.lista.find((x) => x.id === res.alvoId);
    if (alvo) ajustar(alvo, "pv", -Math.max(0, Math.floor(valor)));
    setRes(null);
  };

  const ajustar = (p: Participante, campo: "pv" | "pr", d: number) => {
    const max = campo === "pv" ? p.pvMax : p.prMax;
    const novo = Math.max(0, Math.min(max, p[campo] + d));
    mudar(p.id, campo === "pv" ? { pv: novo, fora: novo === 0 && p.tipo === "npc" ? true : p.pv === 0 && novo > 0 ? false : p.fora } : { pr: novo });
  };

  return (
    <section className="caixa combate">
      <h3>Combate {est.ativo && <small>· rodada {est.rodada}</small>}</h3>
      {opcoes.length === 0 ? (
        <p>Ligue fichas de jogadores à mesa ou crie NPCs para montar o combate.</p>
      ) : (
        <div className="linha-rolar">
          <select value={escolhida} onChange={(e) => setOrigem(e.target.value)} aria-label="Quem entra no combate">
            {fichas.length > 0 && <optgroup label="Jogadores">{opcoes.filter((o) => o.id.startsWith("f:")).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</optgroup>}
            {pastas.length > 0 && <optgroup label="Pastas de NPCs (todos de uma vez)">{pastas.map((p) => <option key={p} value={`p:${p}`}>Pasta: {p}</option>)}</optgroup>}
            {npcs.length > 0 && <optgroup label="NPCs">{opcoes.filter((o) => o.id.startsWith("n:")).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</optgroup>}
          </select>
          {escolhida.startsWith("n:") && (
            <label className="combate-qtd">Quantos
              <input type="number" min={1} max={20} value={qtd} onChange={(e) => setQtd(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} />
            </label>
          )}
          <button type="button" className="btn btn-paper" onClick={adicionar}>Entrar no combate</button>
        </div>
      )}

      {est.lista.length > 0 && (
        <div className="combate-controles">
          <button type="button" className="btn btn-red" onClick={rolarTodos} disabled={est.lista.every((p) => p.ini !== null)}>Rolar iniciativa</button>
          <button type="button" className="btn btn-paper" onClick={proximo} disabled={ativos.length === 0}>Próximo turno</button>
          <button type="button" className="link-perigo" onClick={encerrar}>Encerrar combate</button>
        </div>
      )}

      {aviso && <p className="aviso" role="alert">{aviso}</p>}
      {res && (
        <div className="combate-resultado" role="status">
          <p>{res.texto}</p>
          <div className="linha-rolar">
            {res.acertou && <button type="button" className="btn btn-red" onClick={() => aplicar(res.dano)}>Aplicar {res.dano} de dano</button>}
            {res.tecnica && <button type="button" className="btn btn-paper" onClick={() => aplicar(res.dano / 2)}>Aplicar metade ({Math.floor(res.dano / 2)})</button>}
            <button type="button" className="link-perigo" onClick={() => setRes(null)}>Fechar</button>
          </div>
        </div>
      )}

      <ol className="combate-lista">
        {ordenada.map((p) => (
          <li key={p.id} className={`combate-item${p.id === est.vez && !p.fora ? " vez" : ""}${p.fora ? " fora" : ""}${p.tipo === "jogador" ? " jog" : ""}`}>
            <div className="combate-topo">
              <label className="combate-ini">Inic.
                <input type="number" value={p.ini ?? ""} placeholder="—" onChange={(e) => mudar(p.id, { ini: e.target.value === "" ? null : Number(e.target.value) })} />
              </label>
              <div className="combate-nome">
                <b>{p.nome}</b>
                <small>{p.tipo === "jogador" ? "Jogador" : "NPC"} · CR {p.cr}</small>
              </div>
              {p.id === est.vez && !p.fora && <span className="combate-selo">No turno</span>}
            </div>
            <div className="npc-linha"><b>PV {p.pv}/{p.pvMax}</b>
              <span className="npc-botoes">{[-10, -5, -1, 1, 5, 10].map((d) => <button type="button" key={d} className="btn btn-paper" onClick={() => ajustar(p, "pv", d)}>{d > 0 ? `+${d}` : d}</button>)}</span>
            </div>
            <div className="npc-linha"><b>PR {p.pr}/{p.prMax}</b>
              <span className="npc-botoes">{[-5, -1, 1, 5].map((d) => <button type="button" key={d} className="btn btn-paper" onClick={() => ajustar(p, "pr", d)}>{d > 0 ? `+${d}` : d}</button>)}</span>
            </div>
            {p.lib && <button type="button" className={`btn ${p.lib.ativo ? "btn-paper" : "btn-red"}`} onClick={() => alternarForma(p)}>{p.lib.ativo ? `Encerrar ${p.lib.nome}` : `Liberar ${p.lib.nome}`}</button>}
            {p.acoes.length > 0 && (
              <div className="combate-acoes-box">
                <label className="campo">Alvo
                  <select value={alvos[p.id] ?? ""} onChange={(e) => setAlvos((m) => ({ ...m, [p.id]: e.target.value }))}>
                    <option value="">Automático (um dos jogadores)</option>
                    {est.lista.filter((x) => x.id !== p.id).map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
                  </select>
                </label>
                <div className="combate-acoes-npc">
                  {p.acoes.map((a) => (
                    <button type="button" key={a.nome} className="btn btn-paper" onClick={() => usar(p, a)}>
                      {a.nome}{a.tipo === "ataque" ? ` · +${a.acerto}` : ` · CD ${a.cd}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="campo">Condições e notas
              <input value={p.nota} maxLength={120} placeholder="Sangramento, Preso…" onChange={(e) => mudar(p.id, { nota: e.target.value })} />
            </label>
            <div className="combate-acoes">
              {p.tipo === "npc" && <label className="marcar"><input type="checkbox" checked={p.oculto} onChange={(e) => mudar(p.id, { oculto: e.target.checked })} /> Esconder nome</label>}
              <label className="marcar"><input type="checkbox" checked={p.fora} onChange={(e) => mudar(p.id, { fora: e.target.checked })} /> Fora de combate</label>
              <button type="button" className="link-perigo" onClick={() => setEst((e) => ({ ...e, vez: e.vez === p.id ? null : e.vez, lista: e.lista.filter((x) => x.id !== p.id) }))}>Tirar da lista</button>
            </div>
          </li>
        ))}
      </ol>
      {est.lista.length > 0 && <p className="ajuda">Iniciativa = d20 + metade da Destreza (mais bônus da ficha). NPCs adicionados juntos rolam uma vez só. Os jogadores veem a ordem de iniciativa (sem PV dos NPCs). O PV/PR dos jogadores acompanha a ficha deles (atualiza sozinho); seus ajustes aqui não mudam a ficha.</p>}
    </section>
  );
}
