import { useState } from "react";
import { Passo } from "./FichaPecas";
import type { Rolagens } from "./Rolador";
import { CONDICOES, treinoConcluido } from "../regras/catalogo";
import { nivelLiberacao } from "../regras/liberacoes";
import { classePorId, type Calculo, type Ficha, type Liberacao } from "../regras/ficha";
import { efeito as som } from "../lib/som";

export function AcoesRapidas({ f, c, alterar, r }: { f: Ficha; c: Calculo; alterar: (p: Partial<Ficha>) => void; r: Rolagens }) {
  const classe = classePorId(f.classe);
  const tipo = classe?.tipo;
  const [dano, setDano] = useState("");
  const [tipoDano, setTipoDano] = useState<"fis" | "eso" | "direto">("fis");
  const [msg, setMsg] = useState("");
  const [metade, setMetade] = useState(false);
  const e = f.estado;
  const setE = (p: Partial<Ficha["estado"]>) => alterar({ estado: { ...f.estado, ...p } });

  const aplicarDano = () => {
    const n = Math.floor(Number(dano));
    if (!Number.isFinite(n) || n <= 0) return;
    const rd = tipoDano === "fis" ? c.rdFis : tipoDano === "eso" ? c.rdEso : 0;
    const real = Math.max(0, Math.floor(metade ? n / 2 : n) - rd);
    const noTemp = Math.min(e.pvTemp, real);
    const noPv = real - noTemp;
    alterar({ pvAtual: Math.max(0, f.pvAtual - noPv), estado: { ...f.estado, pvTemp: e.pvTemp - noTemp } });
    setMsg(`${n} de dano${rd ? ` − RD ${rd}` : ""} = ${real}${noTemp ? ` (${noTemp} nos PV temporários)` : ""}. ${f.pvAtual - noPv <= 0 ? "Você caiu a 0 PV." : ""}`);
    setDano("");
    setMetade(false);
    som.corte();
  };

  const curto = () => {
    if (e.curtosUsados >= 2) return;
    alterar({
      pvAtual: Math.min(c.pv, f.pvAtual + Math.floor(c.pv / 2)),
      prAtual: Math.min(c.pr, f.prAtual + Math.floor(c.pr / 2)),
      estado: { ...f.estado, curtosUsados: e.curtosUsados + 1 },
    });
    setMsg("Descanso curto: recuperou metade do PV e do PR totais.");
  };
  const longo = () => {
    alterar({
      pvAtual: c.pv,
      prAtual: c.pr,
      estado: { ...f.estado, pvTemp: 0, curtosUsados: 0, ultimoFolegoUsado: false, liberado: "", usos: {} },
    });
    setMsg("Descanso longo: PV e PR cheios, descansos curtos e habilidades renovados.");
  };

  const encerrar = () => {
    // fim do combate: habilidades por combate voltam e a liberação termina
    const usos = { ...f.estado.usos };
    delete usos["ultimo-folego"];
    alterar({ estado: { ...f.estado, usos, liberado: "" } });
    setMsg("Combate encerrado: habilidades de uso por combate renovadas.");
  };

  // liberações disponíveis conforme o treinamento concluído
  const libs: { id: Liberacao; nome: string }[] = [];
  if (tipo === "shinigami") {
    if (treinoConcluido(f, "shikai") || f.estado.liberado === "shikai") libs.push({ id: "shikai", nome: "Shikai" });
    if (treinoConcluido(f, "bankai") || f.estado.liberado === "bankai") libs.push({ id: "bankai", nome: "Bankai" });
  }
  if (tipo === "hollow" && (treinoConcluido(f, "resurreccion") || f.estado.liberado === "resurreccion")) libs.push({ id: "resurreccion", nome: "Resurrección" });
  if (tipo === "quincy" && (f.nivel >= nivelLiberacao(f.classe, tipo, "vollstandig") || f.estado.liberado === "vollstandig")) libs.push({ id: "vollstandig", nome: "Vollständig" });
  if (f.origem === "visored" && f.treinos.feitos.includes("visored-2")) libs.push({ id: "mascara", nome: "Máscara Hollow" });

  const custoLib = (id: Liberacao) => {
    if (id === "resurreccion") {
      const base = classe?.id === "vazio" ? 40 : 45;
      return f.nivel >= 20 ? Math.ceil(base / 2) : base;
    }
    if (id === "mascara") return 5 * c.prof;
    if (id === "vollstandig") return 60;
    if (id === "bankai") return f.formas?.bankai?.custo ?? 0;
    return 0;
  };

  const liberar = (id: Liberacao) => {
    if (e.liberado === id) {
      setE({ liberado: "" });
      return;
    }
    const custo = custoLib(id);
    const ganhoTemp = id === "resurreccion" && classe?.id === "vazio" ? (f.nivel >= 16 ? 5 : 3) * f.nivel : 0;
    alterar({ prAtual: Math.max(0, f.prAtual - custo), estado: { ...f.estado, liberado: id, pvTemp: Math.max(e.pvTemp, ganhoTemp) } });
    setMsg(custo ? `${id === "mascara" ? "Máscara" : id === "vollstandig" ? "Vollständig" : id === "bankai" ? "Bankai" : "Resurrección"} ativada: ${custo} PR gastos.` : "Liberação marcada. O custo está na descrição da sua Zanpakutou.");
  };

  return (
    <section className="caixa acoes" aria-label="Ações rápidas">
      <div className="acoes-linha">
        <button type="button" className="btn btn-paper" onClick={() => r.d20("Iniciativa", c.iniciativa)}>🎲 Iniciativa</button>
        <button type="button" className="btn btn-paper" onClick={curto} disabled={e.curtosUsados >= 2}>Descanso curto ({2 - e.curtosUsados} restante{e.curtosUsados === 1 ? "" : "s"})</button>
        <button type="button" className="btn btn-paper" onClick={longo}>Descanso longo</button>
        <button type="button" className="btn btn-paper" onClick={encerrar}>Encerrar combate</button>
        <button type="button" className="btn btn-paper" onClick={() => window.print()}>Imprimir</button>
      </div>

      <div className="acoes-linha">
        <label className="mini">Dano recebido
          <input type="number" inputMode="numeric" min={0} value={dano} onChange={(ev) => setDano(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && aplicarDano()} aria-label="Dano recebido" />
        </label>
        <select value={tipoDano} onChange={(ev) => setTipoDano(ev.target.value as typeof tipoDano)} aria-label="Tipo de dano">
          <option value="fis">Físico (RD {c.rdFis})</option>
          <option value="eso">Esotérico (RD {c.rdEso})</option>
          <option value="direto">Ignora RD</option>
        </select>
        {f.origem === "lobisomem" && (
          <label className="mini"><input type="checkbox" checked={metade} onChange={(ev) => setMetade(ev.target.checked)} /> metade (Corpo Animalesco)</label>
        )}
        <button type="button" className="btn btn-paper" onClick={aplicarDano}>Aplicar dano</button>
        <div className="mini">PV temporários <Passo valor={e.pvTemp} min={0} max={999} rotulo="PV temporários" onChange={(v) => setE({ pvTemp: v })} /></div>
      </div>
      {msg && <p className="ajuda" role="status">{msg}</p>}

      {libs.length > 0 && (
        <div className="acoes-linha">
          <b>Liberação:</b>
          {libs.map((l) => (
            <button key={l.id} type="button" className={`chip chip-btn ${e.liberado === l.id ? "on" : ""}`} aria-pressed={e.liberado === l.id} onClick={() => liberar(l.id)}>
              {l.nome}{custoLib(l.id) ? ` (${custoLib(l.id)} PR)` : ""}
            </button>
          ))}
          {e.liberado && <span className="ajuda">CR atual {c.cr}.</span>}
        </div>
      )}

      <details className="condicoes">
        <summary>Condições {e.condicoes.length > 0 && <span className="chip">{e.condicoes.length}</span>}</summary>
        <div className="chips">
          {CONDICOES.map((n) => (
            <button key={n} type="button" className={`chip chip-btn ${e.condicoes.includes(n) ? "on" : ""}`} aria-pressed={e.condicoes.includes(n)} onClick={() => setE({ condicoes: e.condicoes.includes(n) ? e.condicoes.filter((x) => x !== n) : [...e.condicoes, n] })}>
              {n}
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}
