import { useState, type ReactNode } from "react";
import type { Ficha, FormaLib } from "../regras/ficha";
import { vagasEspeciais } from "../regras/cartoes";
import { caracPorId } from "../regras/caracteristicas";
import { contarForaDeVaga, contarVagas, faltasEspeciais } from "../regras/especiais";
import { CaracteristicasForma } from "./CaracteristicasForma";
import { InteracoesEspeciais, TecnicasEspeciais } from "./EspeciaisForma";
import { armaCtxDaForma, armaPendente, armaTrava, cartoesSemRequisito, nomeCaracArma, resumoArma, textoPrecisa } from "../regras/arma-forma";
import { Info } from "./Dica";

type Aba = "acoes" | "caracs" | "tecnicas" | "interacoes";

interface Props {
  f: Ficha;
  tipo: FormaLib["tipo"];
  r: FormaLib;
  mud: (p: Partial<FormaLib>) => void;
  /** conteúdo da aba Ações (os cartões de ação e as ações montadas) */
  acoes: ReactNode;
  onGravar?: (forma: FormaLib) => void;
}

/**
 * Os quatro tipos de cartão da montagem de uma forma, cada um na sua aba:
 * Ações e Características (genéricas, ligadas de forma opcional) e Técnicas especiais e Interações especiais (ligadas de forma obrigatória).
 */
export function MontagemCartoes({ f, tipo, r, mud, acoes, onGravar }: Props) {
  const [aba, setAba] = useState<Aba>("acoes");
  const efeitos = r.efeitos ?? [];
  const v = vagasEspeciais(tipo);
  const nTec = contarVagas(efeitos, "tecnica");
  const nInt = contarVagas(efeitos, "interacao");
  const nCar = efeitos.filter((e) => e.familia === "carac" && !!e.carac && !!caracPorId(e.carac.id)).length;
  const nAcoes = (r.habilidades ?? []).length;
  const faltas = faltasEspeciais(efeitos, tipo);
  const arma = armaCtxDaForma(f, r);
  const semReq = cartoesSemRequisito(r, arma);
  const abas: { id: Aba; nome: string; n: string; alerta?: boolean }[] = [
    { id: "acoes", nome: "Ações", n: String(nAcoes) },
    { id: "caracs", nome: "Características", n: String(nCar) },
    { id: "tecnicas", nome: "Técnicas especiais", n: `${nTec}/${v.tec}${contarForaDeVaga(efeitos, "tecnica") ? ` +${contarForaDeVaga(efeitos, "tecnica")}` : ""}`, alerta: faltas.length > 0 && nTec > 0 },
    { id: "interacoes", nome: "Interações especiais", n: `${nInt}/${v.inter}${contarForaDeVaga(efeitos, "interacao") ? ` +${contarForaDeVaga(efeitos, "interacao")}` : ""}`, alerta: faltas.length > 0 && nInt > 0 },
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
      {armaTrava(arma) && (
        <p className="ajuda arma-na-montagem">
          <b>Arma:</b> {arma.arma!.nome}{arma.caracs.length > 0 ? ` · ${arma.caracs.map(nomeCaracArma).join(", ")}` : " · nenhuma característica marcada"}
          {" "}<Info>{`${resumoArma(arma.arma!)}. Cartões que pedem uma característica que a arma não tem aparecem apagados, com o motivo. Para mudar, volte ao passo “Forma da arma”.${armaPendente(arma.arma) ? " A arma própria ainda espera o aval do Mestre." : ""}`}</Info>
        </p>
      )}
      {semReq.length > 0 && (
        <div className="faltas-especiais aviso-arma-forma" role="status">
          <b>Cartões que a arma atual não sustenta (eles continuam na forma, mas o Mestre confere)</b>
          <ul>{semReq.map((x) => <li key={x.id}>{x.nome}: {textoPrecisa(x.falta)}</li>)}</ul>
        </div>
      )}
      {faltas.length > 0 && (
        <div className="faltas-especiais" role="alert">
          <b>O que falta nas técnicas e interações especiais (a forma só salva quando estiver tudo certo)</b>
          <ul>{faltas.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      <div role="tabpanel" id="painel-acoes" aria-labelledby="aba-acoes" hidden={aba !== "acoes"}>{acoes}</div>
      <div role="tabpanel" id="painel-caracs" aria-labelledby="aba-caracs" hidden={aba !== "caracs"}><CaracteristicasForma f={f} tipo={tipo} r={r} mud={mud} arma={arma} onGravar={onGravar} /></div>
      <div role="tabpanel" id="painel-tecnicas" aria-labelledby="aba-tecnicas" hidden={aba !== "tecnicas"}><TecnicasEspeciais f={f} tipo={tipo} r={r} mud={mud} arma={arma} irParaInteracoes={() => setAba("interacoes")} /></div>
      <div role="tabpanel" id="painel-interacoes" aria-labelledby="aba-interacoes" hidden={aba !== "interacoes"}><InteracoesEspeciais f={f} tipo={tipo} r={r} mud={mud} arma={arma} irParaTecnicas={() => setAba("tecnicas")} /></div>
    </div>
  );
}
