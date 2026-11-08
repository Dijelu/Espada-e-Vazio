import { useState } from "react";
import type { Ficha, FormaLib } from "../regras/ficha";
import type { CtxForma } from "../regras/efeitos-forma";
import { RESURRECCIONES_MONTADAS, SEGUNDAS_MONTADAS, formaDaResurreccion, formaDaSegunda, type HabHollow } from "../regras/modelos-hollow";

interface Props {
  f: Ficha;
  tipo: "resurreccion" | "segunda";
  ctx: CtxForma;
  onUsar: (forma: Partial<FormaLib>) => void;
}

const CLASSE_NOME = { hueco: "Hueco", vazio: "Vazio" } as const;

interface Item {
  id: string; nome: string; dono: string; resumo: string; aparencia: string; ppGasto: number; canonica: boolean;
  habilidades: HabHollow[]; etiqueta: string; preRequisito?: string; trava: string; usar: () => void;
}

/** Resurrecciones e Segundas Etapas prontas, montadas com o sistema de cartões. */
export function ModelosHollow({ f, tipo, ctx, onUsar }: Props) {
  const [aberto, setAberto] = useState("");
  const itens: Item[] = tipo === "resurreccion"
    ? RESURRECCIONES_MONTADAS.map((m) => ({
        id: m.id, nome: m.nome, dono: m.dono, resumo: m.resumo, aparencia: m.aparencia, ppGasto: m.ppGasto, canonica: m.canonica, habilidades: m.habilidades,
        etiqueta: `${CLASSE_NOME[m.classe]} · Caminho ${m.caminho}`,
        trava: f.classe !== m.classe ? `Exige a classe ${CLASSE_NOME[m.classe]}` : f.subclasse && f.subclasse !== m.caminho ? `Exige o Caminho ${m.caminho}` : "",
        usar: () => onUsar(formaDaResurreccion(m, ctx)),
      }))
    : SEGUNDAS_MONTADAS.map((m) => {
        const base = RESURRECCIONES_MONTADAS.find((x) => x.id === m.baseResurreccion)?.nome ?? m.baseResurreccion;
        return {
          id: m.id, nome: m.nome, dono: m.dono, resumo: m.resumo, aparencia: m.aparencia, ppGasto: m.ppGasto, canonica: m.canonica, habilidades: m.habilidades,
          etiqueta: `Sobre a Resurrección ${base}`, preRequisito: m.preRequisito,
          trava: f.formas.resurreccion?.modelo === m.baseResurreccion ? "" : `Exige a Resurrección ${base}`,
          usar: () => onUsar(formaDaSegunda(m, ctx)),
        };
      });
  return (
    <section className="modelos-montados">
      <h3>{tipo === "resurreccion" ? "Resurrecciones prontas, montadas com cartões" : "Segundas Etapas prontas"}</h3>
      <p className="ajuda">
        {tipo === "resurreccion"
          ? "Cada modelo já vem com os cartões de característica, as habilidades, o ponto fraco e o custo. Só aparecem liberados os que combinam com a sua classe e o seu Caminho."
          : "A Segunda Etapa se apoia na sua Resurrección. Só a do Murciélago é canônica; as outras são criações inspiradas em Hollows e dependem da aprovação do Mestre."}
      </p>
      <div className="cartas-hab modelos-montados-lista">
        {itens.map((m) => {
          const aberta = aberto === m.id;
          return (
            <article key={m.id} className={`carta-hab carta-peca carta-montagem ${m.trava ? "travada" : ""}`} data-classe="hollow">
              <div className="carta-topo">
                <h3>{m.nome}</h3>
                <span className="selo-pp">{m.ppGasto}<i>PP</i></span>
              </div>
              <p className="ajuda">{m.dono} · {m.etiqueta}{m.canonica ? "" : " · inspirada (aprovação do Mestre)"}</p>
              <p>{m.resumo}</p>
              {m.preRequisito && <p className="regra-cartao"><b>Pré-requisito:</b> {m.preRequisito}</p>}
              {aberta && (
                <>
                  <p className="ajuda">{m.aparencia}</p>
                  <ul className="lista-hab-resumo">
                    {m.habilidades.map((h) => <li key={h.nome}><b>{h.nome}</b> ({h.acao}): {h.regra}</li>)}
                  </ul>
                </>
              )}
              <div className="duas">
                <button type="button" className="link" onClick={() => setAberto(aberta ? "" : m.id)}>{aberta ? "Esconder detalhes" : "Ver detalhes"}</button>
                <button type="button" className="btn-mini" disabled={!!m.trava} onClick={m.usar}>{m.trava || "Usar este modelo"}</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
