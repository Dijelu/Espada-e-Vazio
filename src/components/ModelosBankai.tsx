import { useState } from "react";
import type { Ficha, FormaLib } from "../regras/ficha";
import type { CtxForma } from "../regras/efeitos-forma";
import { MODELOS_BANKAI, formaDoModelo, type ModeloMontado } from "../regras/modelos-bankai";

interface Props {
  f: Ficha;
  tipo: "bankai" | "bankai2";
  ctx: CtxForma;
  onUsar: (forma: Partial<FormaLib>) => void;
}

const ESTILO = { potencializadora: "Potencializadora", transformadora: "Transformadora" } as const;

/** Bankais prontas montadas com o sistema de cartões, com a Bankai Verdadeira quando existe. */
export function ModelosBankai({ f, tipo, ctx, onUsar }: Props) {
  const [aberto, setAberto] = useState("");
  const base = f.formas.bankai?.modelo ?? "";
  const lista = tipo === "bankai2" ? MODELOS_BANKAI.filter((m) => m.verdadeira) : MODELOS_BANKAI;
  return (
    <section className="modelos-montados">
      <h3>{tipo === "bankai2" ? "Bankais Verdadeiras prontas" : "Bankais prontas, montadas com cartões"}</h3>
      <p className="ajuda">
        {tipo === "bankai2"
          ? "A Verdadeira se apoia na Bankai de mesmo nome e segue o tipo dela. Para usar uma, escolha antes a Bankai correspondente."
          : "Cada modelo já vem com as peças, as habilidades, o ponto fraco, o custo e a duração calculados. Você pode mudar tudo depois."}
      </p>
      <div className="cartas-hab modelos-montados-lista">
        {lista.map((m: ModeloMontado) => {
          const forma = tipo === "bankai2" ? m.verdadeira! : m.bankai;
          const liberada = tipo === "bankai" || base === m.id;
          const aberta = aberto === m.id;
          return (
            <article key={m.id} className={`carta-hab carta-peca carta-montagem ${liberada ? "" : "travada"}`} data-classe="shinigami">
              <div className="carta-topo">
                <h3>{forma.nome}</h3>
                <span className="selo-pp">{forma.ppGasto}<i>PP</i></span>
              </div>
              <p className="ajuda">{m.dono} · {ESTILO[m.bankai.estilo]}{tipo === "bankai" && m.verdadeira ? " · tem Verdadeira" : ""}</p>
              <p>{m.resumo}</p>
              {forma.preRequisito && <p className="regra-cartao"><b>Pré-requisito:</b> {forma.preRequisito}</p>}
              {aberta && (
                <>
                  <p className="ajuda">{forma.aparencia}</p>
                  <ul className="lista-hab-resumo">
                    {forma.habilidades.map((h) => <li key={h.nome}><b>{h.nome}</b> ({h.acao}): {h.regra}</li>)}
                  </ul>
                </>
              )}
              <div className="duas">
                <button type="button" className="link" onClick={() => setAberto(aberta ? "" : m.id)}>{aberta ? "Esconder detalhes" : "Ver detalhes"}</button>
                <button
                  type="button"
                  className="btn-mini"
                  disabled={!liberada}
                  onClick={() => { const x = formaDoModelo(m, tipo, ctx); if (x) onUsar(x); }}
                >
                  {liberada ? "Usar este modelo" : `Exige a Bankai ${m.bankai.nome}`}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
