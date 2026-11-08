import { useState, type ReactNode } from "react";
import type { Ficha, FormaLib } from "../regras/ficha";
import { vagasEspeciais } from "../regras/cartoes";
import { caracPorId } from "../regras/caracteristicas";
import { contarVagas, faltasEspeciais } from "../regras/especiais";
import { CaracteristicasForma } from "./CaracteristicasForma";
import { InteracoesEspeciais, TecnicasEspeciais } from "./EspeciaisForma";

type Aba = "acoes" | "caracs" | "tecnicas" | "interacoes";

interface Props {
  f: Ficha;
  tipo: FormaLib["tipo"];
  r: FormaLib;
  mud: (p: Partial<FormaLib>) => void;
  /** conteúdo da aba Ações (os cartões de ação e as ações montadas) */
  acoes: ReactNode;
}

/**
 * Os quatro tipos de cartão da montagem de uma forma, cada um na sua aba:
 * Ações e Características (genéricas, ligadas de forma opcional) e Técnicas especiais e Interações especiais (ligadas de forma obrigatória).
 */
export function MontagemCartoes({ f, tipo, r, mud, acoes }: Props) {
  const [aba, setAba] = useState<Aba>("acoes");
  const efeitos = r.efeitos ?? [];
  const v = vagasEspeciais(tipo);
  const nTec = contarVagas(efeitos, "tecnica");
  const nInt = contarVagas(efeitos, "interacao");
  const nCar = efeitos.filter((e) => e.familia === "carac" && !!e.carac && !!caracPorId(e.carac.id)).length;
  const nAcoes = (r.habilidades ?? []).length;
  const faltas = faltasEspeciais(efeitos, tipo);
  const abas: { id: Aba; nome: string; n: string; alerta?: boolean }[] = [
    { id: "acoes", nome: "Ações", n: String(nAcoes) },
    { id: "caracs", nome: "Características", n: String(nCar) },
    { id: "tecnicas", nome: "Técnicas especiais", n: `${nTec}/${v.tec}`, alerta: faltas.length > 0 && nTec > 0 },
    { id: "interacoes", nome: "Interações especiais", n: `${nInt}/${v.inter}`, alerta: faltas.length > 0 && nInt > 0 },
  ];
  return (
    <div className="montagem-cartoes">
      <div className="abas-cartoes" role="tablist" aria-label="Tipos de cartão da forma">
        {abas.map((a) => (
          <button key={a.id} type="button" role="tab" id={`aba-${a.id}`} aria-selected={aba === a.id} aria-controls={`painel-${a.id}`} className={`${aba === a.id ? "on" : ""} ${a.alerta ? "alerta" : ""}`} onClick={() => setAba(a.id)}>
            <span>{a.nome}</span> <i>{a.n}</i>{a.alerta && <b aria-label="falta algo"> !</b>}
          </button>
        ))}
      </div>
      {faltas.length > 0 && (
        <div className="faltas-especiais" role="alert">
          <b>O que falta nas técnicas e interações especiais (a forma só salva quando estiver tudo certo)</b>
          <ul>{faltas.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      <div role="tabpanel" id="painel-acoes" aria-labelledby="aba-acoes" hidden={aba !== "acoes"}>{acoes}</div>
      <div role="tabpanel" id="painel-caracs" aria-labelledby="aba-caracs" hidden={aba !== "caracs"}><CaracteristicasForma f={f} tipo={tipo} r={r} mud={mud} /></div>
      <div role="tabpanel" id="painel-tecnicas" aria-labelledby="aba-tecnicas" hidden={aba !== "tecnicas"}><TecnicasEspeciais f={f} tipo={tipo} r={r} mud={mud} irParaInteracoes={() => setAba("interacoes")} /></div>
      <div role="tabpanel" id="painel-interacoes" aria-labelledby="aba-interacoes" hidden={aba !== "interacoes"}><InteracoesEspeciais f={f} tipo={tipo} r={r} mud={mud} irParaTecnicas={() => setAba("tecnicas")} /></div>
    </div>
  );
}
