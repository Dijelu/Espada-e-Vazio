import { useState } from "react";
import type { FormaLib } from "../regras/ficha";
import { orcamentoBase, type CtxForma } from "../regras/efeitos-forma";
import { SHIKAIS_MONTADAS, formaDaShikai } from "../regras/modelos-shikai";

/** Tira do texto antigo as frases que falam de níveis e deixa só o que diz respeito à Bankai. */
const semNiveis = (t?: string) => (t ?? "").split(/(?<=\.)\s+/).filter((x) => !/^N[íi]veis? \d/.test(x)).join(" ").trim();

interface Props { ctx: CtxForma; onUsar: (forma: Partial<FormaLib>) => void }

/** Shikais prontas, montadas com cartões; as que têm Bankai pronta indicam qual é. */
export function ModelosShikai({ ctx, onUsar }: Props) {
  const [aberto, setAberto] = useState("");
  return (
    <section className="modelos-montados">
      <h3>Shikais prontas, montadas com cartões</h3>
      <p className="ajuda">Cada modelo já vem com os cartões de característica, as habilidades, o ponto fraco e o custo de liberação calculado. Você pode mudar tudo depois. As que têm Bankai pronta combinam com ela.</p>
      <p className="regra-cartao">A Shikai começa no nível 5 com 4 PP e cresce até 8 PP no nível 13. O modelo já vem com os cartões de característica que cabem no seu nível ({orcamentoBase("shikai", ctx.n)} PP); as que sobram ficam anotadas no texto da forma para você acrescentar ao evoluir.</p>
      <div className="cartas-hab modelos-montados-lista">
        {SHIKAIS_MONTADAS.map((m) => {
          const aberta = aberto === m.id;
          return (
            <article key={m.id} className="carta-hab carta-peca carta-montagem" data-classe="shinigami">
              <div className="carta-topo">
                <h3>{m.nome}</h3>
                <span className="selo-pp">{m.ppGasto}<i>PP</i></span>
              </div>
              <p className="ajuda">{m.dono} · {m.categoria}{m.bankaiRelacionada ? " · tem Bankai pronta" : ""}</p>
              <p>{m.resumo}</p>
              {aberta && (
                <>
                  <p className="regra-cartao"><b>Comando:</b> {m.comando}</p>
                  <p className="ajuda">{m.aparencia}</p>
                  {semNiveis(m.crescimento) && <p className="ajuda"><b>Na Bankai:</b> {semNiveis(m.crescimento)}</p>}
                  <ul className="lista-hab-resumo">
                    {m.habilidades.map((h) => <li key={h.nome}><b>{h.nome}</b> ({h.acao}): {h.regra}</li>)}
                  </ul>
                </>
              )}
              <div className="duas">
                <button type="button" className="link" onClick={() => setAberto(aberta ? "" : m.id)}>{aberta ? "Esconder detalhes" : "Ver detalhes"}</button>
                <button type="button" className="btn-mini" onClick={() => onUsar(formaDaShikai(m, ctx))}>Usar este modelo</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
