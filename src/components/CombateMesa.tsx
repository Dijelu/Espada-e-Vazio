import { useEffect, useMemo, useState } from "react";
import { calcular } from "../regras/ficha";
import { calcularAmeaca } from "../regras/ameacas";
import type { FichaDaMesa, Npc } from "../lib/campanhas";

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
}

interface Estado {
  ativo: boolean;
  rodada: number;
  vez: string | null;
  lista: Participante[];
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
    return { ativo: o.ativo === true, rodada: Math.max(1, Number(o.rodada) || 1), vez: typeof o.vez === "string" ? o.vez : null, lista: o.lista.slice(0, 60) as Participante[] };
  } catch {
    return vazio;
  }
}

/** Rastreador de combate do Mestre: iniciativa, turnos, PV e PR dos jogadores e NPCs da mesa. */
export function CombateMesa({ campanhaId, fichas, npcs }: { campanhaId: string; fichas: FichaDaMesa[]; npcs: Npc[] }) {
  const [est, setEst] = useState<Estado>(() => ler(campanhaId));
  const [origem, setOrigem] = useState("");
  const [qtd, setQtd] = useState(1);

  useEffect(() => {
    try { localStorage.setItem(chave(campanhaId), JSON.stringify(est)); } catch { /* sem armazenamento */ }
  }, [campanhaId, est]);

  const opcoes = useMemo(
    () => [
      ...fichas.map((f) => ({ id: `f:${f.id}`, nome: f.nome, rotulo: `${f.nome} (jogador)` })),
      ...npcs.map((n) => ({ id: `n:${n.id}`, nome: n.nome, rotulo: `${n.nome} (NPC)` })),
    ],
    [fichas, npcs]
  );
  const escolhida = origem || opcoes[0]?.id || "";

  const ordenada = useMemo(
    () => [...est.lista].sort((a, b) => (b.ini ?? -99) - (a.ini ?? -99)),
    [est.lista]
  );
  const ativos = ordenada.filter((p) => !p.fora && p.ini !== null);

  const mudar = (id: string, parte: Partial<Participante>) =>
    setEst((e) => ({ ...e, lista: e.lista.map((p) => (p.id === id ? { ...p, ...parte } : p)) }));

  const adicionar = () => {
    const [tipo, id] = escolhida.split(":");
    const grupo = novoId();
    const novos: Participante[] = [];
    if (tipo === "f") {
      const f = fichas.find((x) => x.id === id);
      if (!f) return;
      const c = calcular(f.ficha);
      novos.push({
        id: novoId(), nome: f.nome, tipo: "jogador", ini: null, bonus: Math.floor(c.atr.des / 2) + (c.iniciativa - c.atr.des),
        pv: Math.min(f.ficha.pvAtual, c.pv), pvMax: c.pv, pr: Math.min(f.ficha.prAtual, c.pr), prMax: c.pr, cr: c.cr, fora: false, nota: "", grupo,
      });
    } else {
      const n = npcs.find((x) => x.id === id);
      if (!n) return;
      const c = calcularAmeaca(n.dados.ameaca);
      const total = Math.max(1, Math.min(20, qtd));
      for (let i = 0; i < total; i++) {
        novos.push({
          id: novoId(), nome: total > 1 ? `${n.nome} ${i + 1}` : n.nome, tipo: "npc", ini: null, bonus: Math.floor(n.dados.ameaca.atr.des / 2),
          pv: Math.min(n.dados.pvAtual ?? c.pv, c.pv), pvMax: c.pv, pr: Math.min(n.dados.prAtual ?? c.pr, c.pr), prMax: c.pr, cr: c.cr, fora: false, nota: "", grupo,
        });
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
            {opcoes.map((o) => <option key={o.id} value={o.id}>{o.rotulo}</option>)}
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
            <label className="campo">Condições e notas
              <input value={p.nota} maxLength={120} placeholder="Sangramento, Preso…" onChange={(e) => mudar(p.id, { nota: e.target.value })} />
            </label>
            <div className="combate-acoes">
              <label className="marcar"><input type="checkbox" checked={p.fora} onChange={(e) => mudar(p.id, { fora: e.target.checked })} /> Fora de combate</label>
              <button type="button" className="link-perigo" onClick={() => setEst((e) => ({ ...e, vez: e.vez === p.id ? null : e.vez, lista: e.lista.filter((x) => x.id !== p.id) }))}>Tirar da lista</button>
            </div>
          </li>
        ))}
      </ol>
      {est.lista.length > 0 && <p className="ajuda">Iniciativa = d20 + metade da Destreza (mais bônus da ficha). NPCs adicionados juntos rolam uma vez só. Os PV dos jogadores aqui são só um controle do Mestre: a ficha deles não muda.</p>}
    </section>
  );
}
