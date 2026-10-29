import { useState } from "react";
import type { Rolagens } from "./Rolador";
import { CONDICAO_TEXTO } from "../regras/catalogo";
import { efeitosContinuos, habilidadesDaFicha, usosRestantes } from "../regras/habilidades";
import { mod, type Calculo, type Ficha } from "../regras/ficha";
import { idSituacao, situacoesDaFicha } from "../regras/situacionais";
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
  if (c.crEvasao) chips.push(`Evasão Aprimorada: CR +${Math.floor(c.prof / 2)}`);
  if (c.iniciativa !== c.atr.des) chips.push(`Iniciativa com Mente (${mod(c.iniciativa)})`);
  if (c.desloc !== 9) chips.push(`Deslocamento ${c.desloc} m`);
  if (c.cdKido !== c.cd) chips.push(`CD dos Kidōs ${c.cdKido}`);
  if (f.estado.liberado) chips.push(`Liberação: ${{ shikai: "Shikai", bankai: "Bankai", resurreccion: "Resurrección", terror: "Terror do Vazio", vollstandig: "Vollständig", mascara: "Máscara Hollow", "": "" }[f.estado.liberado]}`);

  return (
    <div className="caixa">
      <h3>Efeitos ativos</h3>
      {chips.length > 0 && <div className="chips">{chips.map((x) => <span className="chip" key={x}>{x}</span>)}</div>}
      {lista.length === 0 && chips.length === 0 && c.passivas.length === 0 && <p className="ajuda">Nenhum efeito contínuo.</p>}
      {lista.map((e, i) => (
        <details className="poder-livro" key={e.nome + i}>
          <summary><b>{e.nome}</b> <small>{e.fonte}</small></summary>
          <p>{e.texto}</p>
        </details>
      ))}
      {c.passivas.length > 0 && (
        <>
          <h4 className="sub-passivas">Talentos e essências</h4>
          {c.passivas.map((p, i) => (
            <details className="poder-livro" key={p.nome + i}>
              <summary>
                <b>{p.nome}</b> <small>{p.fonte}</small>
                {p.auto ? <span className="chip chip-auto">{p.efeito ? `aplicado: ${p.efeito}` : "aplicado"}</span> : <span className="chip chip-manual">{p.carta ? "carta no Resumo" : "usar na mesa"}</span>}
              </summary>
              <p>{p.texto}</p>
            </details>
          ))}
        </>
      )}
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

/** Habilidades de situação: o jogador liga quando a situação está valendo. */
export function CartasSituacoes({ f, alterar }: { f: Ficha; alterar: (p: Partial<Ficha>) => void }) {
  const lista = situacoesDaFicha(f);
  if (lista.length === 0) return null;
  const ligar = (id: string) => {
    const k = idSituacao(id);
    const ativas = f.estado.ativas.includes(k) ? f.estado.ativas.filter((x) => x !== k) : [...f.estado.ativas, k];
    alterar({ estado: { ...f.estado, ativas } });
    som.energia();
  };
  return (
    <div className="caixa">
      <h3>Habilidades de situação</h3>
      <p className="ajuda">Ligue o botão quando a situação estiver valendo. Os números que dá para somar entram na ficha na hora.</p>
      {[...new Set(lista.map((x) => x.fonte))].map((fonte) => (
        <div key={fonte}>
          <h4 className="sub-passivas">{fonte}</h4>
          <div className="cartas-hab">
            {lista.filter((s) => s.fonte === fonte).map((s) => {
              const on = f.estado.ativas.includes(idSituacao(s.id));
              return (
                <article className={`carta-hab ${on ? "ligada" : ""}`} key={s.id}>
                  <header><b>{s.nome}</b></header>
                  <p className="acao-hab">Vale quando: {s.quando}</p>
                  <p>{s.texto}</p>
                  <button type="button" className={`btn ${on ? "btn-red" : "btn-paper"}`} aria-pressed={on} onClick={() => ligar(s.id)}>{on ? "Ligada · desligar" : "Ligar"}</button>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
