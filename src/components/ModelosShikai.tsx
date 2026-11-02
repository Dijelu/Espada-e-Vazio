import { useState } from "react";
import type { FormaLib } from "../regras/ficha";
import type { CtxForma } from "../regras/efeitos-forma";
import { SHIKAIS_MONTADAS, formaDaShikai } from "../regras/modelos-shikai";

interface Props { ctx: CtxForma; onUsar: (forma: Partial<FormaLib>) => void }

/** Shikais prontas, montadas com cartões; as que têm Bankai pronta indicam qual é. */
export function ModelosShikai({ ctx, onUsar }: Props) {
  const [aberto, setAberto] = useState("");
  return (
    <section className="modelos-montados">
      <h3>Shikais prontas, montadas com cartões</h3>
      <p className="ajuda">Cada modelo já vem com as peças, as habilidades, o ponto fraco e o custo de liberação calculado. Você pode mudar tudo depois. As que têm Bankai pronta combinam com ela.</p>
      {ctx.n < 13 && <p className="regra-cartao">Estes modelos foram pensados para o nível 15. No seu nível o orçamento é menor: depois de usar um, tire algumas peças até a conta fechar.</p>}
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
                  {m.crescimento && <p className="ajuda"><b>Como cresce:</b> {m.crescimento}</p>}
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
