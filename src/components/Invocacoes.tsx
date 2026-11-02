import type { Calculo, Ficha, Invocacao } from "../regras/ficha";
import type { Rolagens } from "./Rolador";
import { resolverDano } from "../regras/liberacoes";
import { novoId } from "./FichaPecas";

interface Props {
  f: Ficha;
  c: Calculo;
  r: Rolagens;
  alterar: (p: Partial<Ficha>) => void;
}

/** Clones e invocações que as peças da forma permitem: invocar, acompanhar PV, atacar e dispensar. */
export function AbaInvocacoes({ f, c, r, alterar }: Props) {
  const modelos = c.forma?.invocacoes ?? [];
  const lista = f.estado.invocacoes ?? [];
  const salvar = (invocacoes: Invocacao[], extra: Partial<Ficha> = {}) => alterar({ ...extra, estado: { ...f.estado, invocacoes } });
  const emCampo = (chave: string) => lista.filter((x) => x.chave === chave).length;

  const invocar = (m: (typeof modelos)[number]) => {
    if (emCampo(m.chave) >= m.max || f.prAtual < m.custoPr) return;
    const nova: Invocacao = { id: novoId(), chave: m.chave, nome: `${m.nome} ${emCampo(m.chave) + 1}`, tipo: m.tipo, pv: m.pv, pvMax: m.pv, cr: m.cr, acerto: m.acerto, dano: m.dano, texto: m.texto };
    salvar([...lista, nova], m.custoPr > 0 ? { prAtual: Math.max(0, f.prAtual - m.custoPr) } : {});
  };
  const mudarPv = (id: string, delta: number) => {
    const atualizada = lista.map((x) => (x.id === id ? { ...x, pv: Math.max(0, Math.min(x.pvMax, x.pv + delta)) } : x));
    // chegou a 0 PV: some (clone ou invocação)
    salvar(atualizada.filter((x) => x.pv > 0));
  };
  const dispensar = (id: string) => salvar(lista.filter((x) => x.id !== id));

  return (
    <section className="aba">
      {modelos.length === 0 && lista.length === 0 && <p className="ajuda">Nenhuma invocação. Monte uma peça de invocação ou clone na aba Efeitos da sua forma e libere a forma.</p>}
      {modelos.length === 0 && lista.length > 0 && <p className="aviso-mini">A forma que criou estas invocações não está ativa. Dispense-as ou ative a forma de novo.</p>}

      {modelos.map((m) => {
        const n = emCampo(m.chave);
        const semPr = f.prAtual < m.custoPr;
        return (
          <div className="caixa" key={m.chave}>
            <h3>{m.nome} ({n} de {m.max})</h3>
            <p className="ajuda">{m.tipo === "clone" ? "Clone" : "Invocação"} · {m.pv} PV · CR {m.cr} · acerto +{m.acerto}{m.dano ? ` · dano ${resolverDano(m.dano, f, c)}` : ""}{m.custoPr > 0 ? ` · ${m.custoPr} PR cada` : ""}</p>
            {m.texto && <p className="ajuda">{m.texto}</p>}
            <button type="button" className="btn-mini" disabled={n >= m.max || semPr} onClick={() => invocar(m)}>
              {n >= m.max ? "Máximo em campo" : semPr ? "PR insuficiente" : `Invocar${m.custoPr > 0 ? ` (${m.custoPr} PR)` : ""}`}
            </button>
          </div>
        );
      })}

      {lista.length > 0 && (
        <div className="caixa">
          <h3>Em campo ({lista.length})</h3>
          <ul className="efeitos-lista">
            {lista.map((x) => (
              <li key={x.id}>
                <div>
                  <b>{x.nome}</b> <small>{x.tipo === "clone" ? "clone" : "invocação"} · CR {x.cr}</small>
                  <p className="ajuda">PV {x.pv} de {x.pvMax}</p>
                  <div className="acao-botoes">
                    <button type="button" className="btn-mini" onClick={() => mudarPv(x.id, -1)} aria-label={`Tirar 1 PV de ${x.nome}`}>−1 PV</button>
                    <button type="button" className="btn-mini" onClick={() => mudarPv(x.id, 1)} aria-label={`Dar 1 PV a ${x.nome}`}>+1 PV</button>
                    <button type="button" className="btn-mini" onClick={() => r.d20(`${x.nome}: ataque`, x.acerto)}>Ataque +{x.acerto}</button>
                    {x.dano && <button type="button" className="btn-mini" onClick={() => r.expr(`${x.nome}: dano`, resolverDano(x.dano, f, c))}>Dano {resolverDano(x.dano, f, c)}</button>}
                  </div>
                  {x.texto && <p className="ajuda">{x.texto}</p>}
                </div>
                <button type="button" className="link-perigo" onClick={() => dispensar(x.id)}>Dispensar</button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-paper" onClick={() => salvar([])}>Dispensar todos</button>
        </div>
      )}
    </section>
  );
}
