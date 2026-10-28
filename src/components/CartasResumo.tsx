import { useState } from "react";
import type { Rolagens } from "./Rolador";
import { CONDICAO_TEXTO } from "../regras/catalogo";
import { efeitosContinuos, habilidadesDaFicha, usosRestantes } from "../regras/habilidades";
import { mod, type Calculo, type Ficha } from "../regras/ficha";
import { efeito as som } from "../lib/som";

/** Habilidades da Origem que se usam em jogo, em forma de carta. */
export function CartasHabilidades({ f, c, alterar, r }: { f: Ficha; c: Calculo; alterar: (p: Partial<Ficha>) => void; r: Rolagens }) {
  const lista = habilidadesDaFicha(f);
  const [msg, setMsg] = useState("");
  if (lista.length === 0) return null;

  const usar = (id: string) => {
    const h = lista.find((x) => x.id === id);
    if (!h) return;
    const res = h.usar(f, c);
    alterar({ ...res.patch, estado: { ...f.estado, usos: h.limite ? { ...f.estado.usos, [h.id]: (f.estado.usos[h.id] ?? 0) + 1 } : f.estado.usos } });
    setMsg(res.msg);
    som.energia();
  };

  return (
    <div className="caixa">
      <h3>Habilidades para usar</h3>
      <div className="cartas-hab">
        {lista.map((h) => {
          const restam = usosRestantes(f, h);
          const motivo = restam === 0 ? "Já usada." : h.bloqueio?.(f, c) ?? "";
          return (
            <article className="carta-hab" key={h.id}>
              <header>
                <b>{h.nome}</b>
                <small>{h.fonte}</small>
              </header>
              <p className="acao-hab">{h.acao}{h.limite ? ` · ${restam === Infinity ? "" : `${restam}/${h.limite.max} por ${h.limite.por === "dia" ? "descanso longo" : "combate"}`}` : ""}</p>
              <p>{h.texto}</p>
              <button type="button" className="btn btn-paper" disabled={!!motivo} onClick={() => usar(h.id)}>Usar</button>
              {motivo && <small className="aviso-mini">{motivo}</small>}
            </article>
          );
        })}
      </div>
      {msg && <p className="ajuda" role="status">{msg}</p>}
    </div>
  );
}

/** Efeitos que valem o tempo todo, já somados nos números da ficha. */
export function EfeitosAtivos({ f, c }: { f: Ficha; c: Calculo }) {
  const nomesCartas = new Set(habilidadesDaFicha(f).map((h) => h.nome));
  const lista = efeitosContinuos(f).filter((e) => !nomesCartas.has(e.nome));
  const chips: string[] = [];
  if (c.rdFis > 0) chips.push(`RD física ${c.rdFis}`);
  if (c.rdEso > 0) chips.push(`RD esotérica ${c.rdEso}`);
  if (c.danoCorpo > 0) chips.push(`+${c.danoCorpo} de dano corpo a corpo`);
  if (c.crEvasao) chips.push(`CR pela Evasão Aprimorada (${c.cr})`);
  if (c.iniciativa !== c.atr.des) chips.push(`Iniciativa com Mente (${mod(c.iniciativa)})`);
  if (c.desloc !== 9) chips.push(`Deslocamento ${c.desloc} m`);
  if (f.estado.liberado) chips.push(`Liberação: ${{ shikai: "Shikai", bankai: "Bankai", resurreccion: "Resurrección", mascara: "Máscara Hollow", "": "" }[f.estado.liberado]}`);

  return (
    <div className="caixa">
      <h3>Efeitos ativos</h3>
      {chips.length > 0 && <div className="chips">{chips.map((x) => <span className="chip" key={x}>{x}</span>)}</div>}
      {lista.length === 0 && chips.length === 0 && <p className="ajuda">Nenhum efeito contínuo.</p>}
      {lista.map((e, i) => (
        <details className="poder-livro" key={e.nome + i}>
          <summary><b>{e.nome}</b> <small>{e.fonte}</small></summary>
          <p>{e.texto}</p>
        </details>
      ))}
    </div>
  );
}

/** Condições que estão afetando o personagem agora, com o texto do livro. */
export function CondicoesAtivas({ f, alterar }: { f: Ficha; alterar: (p: Partial<Ficha>) => void }) {
  const lista = f.estado.condicoes;
  return (
    <div className="caixa">
      <h3>Condições</h3>
      {lista.length === 0 && <p className="ajuda">Nenhuma condição. Marque em Ações rápidas quando algo te afetar.</p>}
      {lista.map((n) => (
        <details className="poder-livro" key={n} open>
          <summary>
            <b>{n}</b>{" "}
            <button type="button" className="link-perigo" onClick={(ev) => { ev.preventDefault(); alterar({ estado: { ...f.estado, condicoes: lista.filter((x) => x !== n) } }); }}>Remover</button>
          </summary>
          <ul>{(CONDICAO_TEXTO[n] ?? []).map((t, i) => <li key={i}>{t}</li>)}</ul>
        </details>
      ))}
    </div>
  );
}
