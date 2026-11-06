import { CUSTO_SCHRIFT, danoSchrift, estagioSchrift, schriftDaFicha } from "../regras/schrifts";
import { idSituacao, situacoesDaFicha } from "../regras/situacionais";
import type { Calculo, Ficha } from "../regras/ficha";
import { TextoCarta } from "./TextoCarta";
import { efeito as som } from "../lib/som";

/**
 * Schrift do Quincy. Fora da Vollständig é um painel pequeno e próprio.
 * Com a Vollständig ligada, o mesmo bloco vai para dentro do painel dela, com o selo "mais forte" e a comparação Base × Vollständig.
 */
export function PainelSchrift({ f, c, alterar, dentro }: { f: Ficha; c: Calculo; alterar: (p: Partial<Ficha>) => void; dentro?: boolean }) {
  const sch = schriftDaFicha(f);
  if (!sch) return null;
  const voll = f.estado.liberado === "vollstandig";
  if (voll !== !!dentro) return null;
  const est = estagioSchrift(f.nivel, voll);
  const base = estagioSchrift(f.nivel, false);
  const gastos = f.estado.usos["schrift"] ?? 0;
  const restam = Math.max(0, est.usos - gastos);
  const carta = situacoesDaFicha(f).find((s) => s.id === "schrift");
  const chave = idSituacao("schrift");
  const ligada = f.estado.ativas.includes(chave);
  const ligar = () => {
    alterar({ estado: { ...f.estado, ativas: ligada ? f.estado.ativas.filter((x) => x !== chave) : [...f.estado.ativas, chave] } });
    som.energia();
  };
  const usar = () => {
    alterar({ prAtual: Math.max(0, f.prAtual - CUSTO_SCHRIFT), estado: { ...f.estado, usos: { ...f.estado.usos, schrift: gastos + 1 } } });
    som.energia();
  };
  const dBase = sch.dano ? danoSchrift(c.prof, false, f.nivel) : "";
  const dVoll = sch.dano ? danoSchrift(c.prof, true, f.nivel) : "";
  return (
    <section className={`painel-schrift${dentro ? " dentro" : ""}`} data-origem="quincy" aria-label={`Schrift ${sch.nome}`}>
      <header>
        <div>
          <small>Schrift · {est.nome}</small>
          <h3>{sch.nome}</h3>
        </div>
        {voll && <span className="selo-forte">▲ mais forte</span>}
      </header>
      {voll && (
        <table className="schrift-compara">
          <thead><tr><th></th><th>Base</th><th>Vollständig</th></tr></thead>
          <tbody>
            <tr><th scope="row">Alcance</th><td>{base.alcance} m</td><td><b>{est.alcance} m</b></td></tr>
            <tr><th scope="row">Usos por cena</th><td>{base.usos}</td><td><b>{est.usos}</b></td></tr>
            {sch.dano && <tr><th scope="row">Dano ({sch.dano})</th><td>{dBase}</td><td><b>{dVoll}</b></td></tr>}
          </tbody>
        </table>
      )}
      {!voll && <p className="schrift-nums"><span>Alcance <b>{est.alcance} m</b></span><span>Usos <b>{restam}/{est.usos}</b></span>{sch.dano && <span>Dano <b>{dBase}</b></span>}</p>}
      {voll && <p className="schrift-nums"><span>Restam <b>{restam}/{est.usos}</b></span></p>}
      <div className="schrift-botoes">
        <button type="button" className="btn-mini" disabled={restam === 0 || f.prAtual < CUSTO_SCHRIFT} onClick={usar}>Usar ({CUSTO_SCHRIFT} PR)</button>
        {carta && <button type="button" className="btn-mini" aria-pressed={ligada} onClick={ligar}>{ligada ? "Ligada · desligar" : "Ligar"}</button>}
      </div>
      {carta && <TextoCarta texto={carta.texto} />}
    </section>
  );
}
