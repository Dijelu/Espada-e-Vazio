import { useState, type ReactNode } from "react";
import type { Ficha, FormaLib } from "../regras/ficha";
import { vagasEspeciais } from "../regras/cartoes";
import { caracPorId } from "../regras/caracteristicas";
import { INTERACOES_GALERIA, contarForaDeVaga, contarVagas, faltasEspeciais } from "../regras/especiais";
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
  // progresso da montagem: o que já está pronto e o que ainda falta, num relance
  const tecs = efeitos.filter((e) => e.familia === "tecnica");
  const temFraco = (r.pontoFraco ?? "").trim().length > 0 || efeitos.some((e) => e.familia === "fraco");
  const passos: { nome: string; ok: boolean; det: string; aba?: Aba }[] = [
    { nome: "Nome", ok: r.nome.trim().length > 0, det: r.nome.trim() ? "definido" : "falta" },
    { nome: "Ações", ok: nAcoes > 0, det: nAcoes > 0 ? `${nAcoes} cart${nAcoes === 1 ? "ão" : "ões"}` : "nenhuma", aba: "acoes" },
    { nome: "Técnicas", ok: nTec > 0, det: `${nTec} de ${v.tec} vaga${v.tec === 1 ? "" : "s"}`, aba: "tecnicas" },
    { nome: "Interações", ok: nTec > 0 && nInt > 0 && faltas.length === 0, det: nTec === 0 ? "depois da técnica" : `${nInt} de ${v.inter} vagas`, aba: "interacoes" },
    { nome: "Ponto fraco", ok: temFraco, det: temFraco ? "definido" : "falta" },
  ];
  const feitos = passos.filter((x) => x.ok).length;
  const pct = Math.round((feitos / passos.length) * 100);
  const grau = pct >= 100 ? "Forma completa" : pct >= 80 ? "Quase pronta" : pct >= 40 ? "Tomando forma" : "Esboço";
  // sugestões de combo: interações que servem às técnicas da forma e ainda não entraram (só enquanto houver vaga)
  const jaTem = new Set(efeitos.filter((e) => e.familia === "interacao").map((e) => e.espec?.id));
  const sugestoes = nInt < v.inter ? tecs.flatMap((t) => INTERACOES_GALERIA.filter((i) => i.com.includes(t.espec?.id ?? "") && !jaTem.has(i.id)).slice(0, 2).map((i) => ({ tec: t.nome, nome: i.nome }))).slice(0, 4) : [];
  return (
    <div className="montagem-cartoes">
      <div className="forja" role="group" aria-label={`Progresso da forma: ${pct}% (${grau})`}>
        <div className="forja-topo"><b>{grau}</b><span>{feitos} de {passos.length} etapas</span><i aria-hidden="true">{pct}%</i></div>
        <div className="forja-barra" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
        <ol className="forja-passos">
          {passos.map((x) => (
            <li key={x.nome} className={x.ok ? "ok" : ""}>
              {x.aba ? <button type="button" onClick={() => setAba(x.aba!)}><span className="marca" aria-hidden="true">{x.ok ? "✓" : "•"}</span><b>{x.nome}</b><small>{x.det}</small></button> : <span className="so"><span className="marca" aria-hidden="true">{x.ok ? "✓" : "•"}</span><b>{x.nome}</b><small>{x.det}</small></span>}
            </li>
          ))}
        </ol>
        {sugestoes.length > 0 && (
          <p className="forja-combo"><b>Combos possíveis:</b> {sugestoes.map((x, k) => <button key={k} type="button" className="chip chip-btn" onClick={() => setAba("interacoes")} title={`Interação que serve à técnica ${x.tec}`}>{x.nome} <small>+ {x.tec}</small></button>)}</p>
        )}
      </div>
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
