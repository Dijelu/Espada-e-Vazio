import { Icone } from "./Icone";
import { useCallback, useState } from "react";
import { efeito as som } from "../lib/som";
import { rolarD20, rolarExpressao, type Modo, type Rolagem } from "../lib/dados";

/** Estado das rolagens da ficha: modo (vantagem/desvantagem), histórico e funções de rolar. */
export function useRolagens() {
  const [modo, setModo] = useState<Modo>("normal");
  const [historico, setHistorico] = useState<Rolagem[]>([]);
  const [aberto, setAberto] = useState(false);

  const registrar = useCallback((r: Rolagem) => {
    setHistorico((h) => [r, ...h].slice(0, 30));
    setAberto(true);
    som.dado();
  }, []);

  const d20 = useCallback((rotulo: string, bonus: number, forcar?: Modo) => registrar(rolarD20(rotulo, bonus, forcar ?? modo)), [modo, registrar]);
  const expr = useCallback(
    (rotulo: string, e: string, critico = false) => {
      const r = rolarExpressao(rotulo, e, critico);
      if (r) registrar(r);
      return Boolean(r);
    },
    [registrar]
  );

  return { modo, setModo, historico, limpar: () => setHistorico([]), aberto, setAberto, d20, expr };
}

export type Rolagens = ReturnType<typeof useRolagens>;

export function BotaoRolar({ r, rotulo, bonus, texto }: { r: Rolagens; rotulo: string; bonus: number; texto?: string }) {
  return (
    <button type="button" className="rolar" onClick={() => r.d20(rotulo, bonus)} aria-label={`Rolar ${rotulo}`} title={`Rolar ${rotulo}`}>
      {texto ?? <Icone nome="dado" />}
    </button>
  );
}

export function PainelRolagens({ r }: { r: Rolagens }) {
  const [livre, setLivre] = useState("");
  const [erro, setErro] = useState(false);
  const ultima = r.historico[0];

  const rolarLivre = () => {
    const ok = r.expr("Rolagem livre", livre);
    setErro(!ok);
    if (ok) setLivre("");
  };

  return (
    <aside className={`rolador ${r.aberto ? "aberto" : ""}`} aria-label="Rolagens de dados">
      {!r.aberto && (
        <button type="button" className="rolador-botao" onClick={() => r.setAberto(true)} aria-label="Abrir rolagens de dados">
          <Icone nome="dado" /> {ultima ? <b>{ultima.total}</b> : "Dados"}
        </button>
      )}
      {r.aberto && (
        <div className="rolador-painel">
          <div className="rolador-topo">
            <b className="title-font">Rolagens</b>
            <button type="button" className="fechar" onClick={() => r.setAberto(false)} aria-label="Fechar rolagens">×</button>
          </div>
          <div className="modos" role="group" aria-label="Modo do d20">
            {(["desvantagem", "normal", "vantagem"] as Modo[]).map((m) => (
              <button key={m} type="button" className={r.modo === m ? "on" : ""} aria-pressed={r.modo === m} onClick={() => r.setModo(m)}>
                {m === "normal" ? "Normal" : m === "vantagem" ? "Vantagem" : "Desvantagem"}
              </button>
            ))}
          </div>
          {ultima && (
            <div className={`resultado ${ultima.critico ? "crit" : ""} ${ultima.falhaCritica ? "falha" : ""}`} role="status" aria-live="polite">
              <small>{ultima.rotulo}</small>
              <strong>{ultima.total}</strong>
              <span>{ultima.detalhe}</span>
              {ultima.critico && <em>{ultima.tipo === "d20" ? "Crítico!" : "Dados dobrados"}</em>}
              {ultima.falhaCritica && <em>1 natural</em>}
            </div>
          )}
          <form
            className="livre"
            onSubmit={(e) => {
              e.preventDefault();
              rolarLivre();
            }}
          >
            <input value={livre} onChange={(e) => setLivre(e.target.value)} placeholder="Ex.: 2d8+3" aria-label="Expressão de dados" aria-invalid={erro} />
            <button type="submit" className="btn-mini">Rolar</button>
          </form>
          {erro && <p className="erro-mini">Use algo como 1d20+5 ou 2d8+3.</p>}
          <ol className="hist">
            {r.historico.slice(1, 12).map((h) => (
              <li key={h.id}>
                <span>{h.rotulo}</span>
                <b>{h.total}</b>
              </li>
            ))}
          </ol>
          {r.historico.length > 0 && (
            <button type="button" className="link-perigo" onClick={r.limpar}>Limpar histórico</button>
          )}
        </div>
      )}
    </aside>
  );
}
