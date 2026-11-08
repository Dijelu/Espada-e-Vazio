/* Aviso de ficha desatualizada (dono e Mestre), painel "Antes e depois", lista "a revisar" e "Desfazer atualização".
   A ficha antiga abre funcionando como antes: nada aqui muda a ficha sozinho. */
import { useMemo, useState } from "react";
import "../estilos/versao.css";
import type { Ficha, TipoForma } from "../regras/ficha";
import { VERSAO_SISTEMA_ATUAL, fichaDesatualizada, mudancasDesde, podeDesfazer, versaoDaFicha, DIAS_PARA_DESFAZER } from "../regras/versao";
import { atualizarFicha, desfazerAtualizacao, itensARevisar, planejarAtualizacao } from "../regras/atualizar";
import { Info } from "./Dica";

const MOSTRAR = 4;

const dia = (iso: string) => {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "";
};

interface Props {
  f: Ficha;
  /** dono: tem o botão de atualizar. Mestre: só vê o aviso. */
  modo: "dono" | "mestre";
  /** troca a ficha inteira pela nova (só o dono) */
  onSubstituir?: (nova: Ficha) => void;
  /** abre a montagem de uma forma (para resolver um item "a revisar") */
  onAbrirForma?: (t: TipoForma) => void;
}

export function AvisoVersao({ f, modo, onSubstituir, onAbrirForma }: Props) {
  const [painel, setPainel] = useState(false);
  const [erro, setErro] = useState("");
  const desatualizada = fichaDesatualizada(f);
  const v = versaoDaFicha(f);
  const mudancas = useMemo(() => mudancasDesde(v), [v]);
  // o plano só é montado quando a pessoa abre o painel (é uma conta pesada) e nunca altera a ficha
  const plano = useMemo(() => (painel && desatualizada ? planejarAtualizacao(f) : null), [painel, desatualizada, f]);
  const revisar = useMemo(() => (!desatualizada && f.atualizacao && !f.atualizacao.dispensada ? itensARevisar(f) : []), [desatualizada, f]);
  const desfazer = !desatualizada && podeDesfazer(f);

  const aplicar = () => {
    setErro("");
    const r = atualizarFicha(f);
    if (!r.ok) { setErro(r.erro); return; }
    onSubstituir?.(r.ficha);
    setPainel(false);
  };
  const voltar = () => {
    if (!window.confirm("Desfazer a atualização? As formas e a versão voltam a ser como eram antes. O resto da ficha (PV, PR, anotações) fica como está.")) return;
    const volta = desfazerAtualizacao(f);
    if (volta) onSubstituir?.(volta);
  };
  const dispensar = () => f.atualizacao && onSubstituir?.({ ...f, atualizacao: { ...f.atualizacao, dispensada: true } });

  /* ---------- ficha desatualizada ---------- */
  if (desatualizada) {
    return (
      <>
        <section className="aviso-versao" role="status" aria-label="Ficha de versão antiga" data-modo={modo}>
          <div className="av-topo">
            <span className="av-selo">v{v} <i aria-hidden="true">→</i> v{VERSAO_SISTEMA_ATUAL}</span>
            <b className="av-titulo">{modo === "dono" ? "Sua ficha é de uma versão antiga do sistema" : "Esta ficha é de uma versão antiga do sistema"}</b>
            <Info>{modo === "dono" ? "Ela continua funcionando como antes e nada muda sozinho. Ao atualizar, você vê antes exatamente o que vai mudar, os seus números não mudam e dá para desfazer." : "A ficha continua funcionando como antes. Só o dono dela pode atualizar."}</Info>
          </div>
          <p className="av-texto">O que mudou no sistema desde a versão {v}:</p>
          <ul className="av-lista">{mudancas.slice(0, MOSTRAR).map((t) => <li key={t}>{t}</li>)}</ul>
          {mudancas.length > MOSTRAR && (
            <details className="av-mais">
              <summary>Ver as outras {mudancas.length - MOSTRAR} mudanças</summary>
              <ul className="av-lista">{mudancas.slice(MOSTRAR).map((t) => <li key={t}>{t}</li>)}</ul>
            </details>
          )}
          {modo === "dono" ? (
            <div className="av-acoes"><button type="button" className="btn btn-red" onClick={() => { setErro(""); setPainel(true); }}>Atualizar ficha</button></div>
          ) : (
            <p className="av-nota">Só o dono da ficha pode atualizar.</p>
          )}
        </section>
        {painel && modo === "dono" && (
          <div className="seletor-fundo" role="dialog" aria-modal="true" aria-label="Antes e depois da atualização" onClick={(e) => e.target === e.currentTarget && setPainel(false)}>
            <div className="seletor painel-ad">
              <div className="seletor-topo">
                <h3 className="title-font">Antes e depois</h3>
                <button type="button" className="btn btn-paper" onClick={() => setPainel(false)}>Fechar</button>
              </div>
              {plano && (
                <div className="ad-corpo">
                  <p className="av-texto">Veja o que a atualização faz na ficha <b>{f.nome || "sem nome"}</b>, da versão {plano.de} para a {plano.para}. Nada muda até você confirmar.</p>
                  <p className={`ad-numeros${plano.numerosIguais ? " ok" : " erro"}`} role="status">
                    {plano.numerosIguais
                      ? "✓ Seus números ficam iguais: PV, PR, CR, custos, PP e o dano e o PR de cada ação."
                      : "Atenção: algum número mudaria. A atualização não será feita."}
                  </p>
                  <ul className="ad-itens">
                    {plano.itens.map((it) => (
                      <li key={it.id} className="ad-item">
                        <h4>{it.titulo}</h4>
                        {it.formas.length > 0 && <p className="ad-formas">{it.formas.join(" · ")}</p>}
                        <div className="ad-par">
                          <div className="ad-antes"><small>Antes</small><p>{it.antes}</p></div>
                          <div className="ad-depois"><small>Depois</small><p>{it.depois}</p></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {plano.revisar.length > 0 && (
                    <div className="ad-revisar">
                      <h4>Fica para você revisar depois</h4>
                      <ul>{plano.revisar.map((r) => <li key={r.id}>{r.texto}</li>)}</ul>
                    </div>
                  )}
                  <p className="ajuda">Depois de atualizar, dá para desfazer por {DIAS_PARA_DESFAZER} dias ou até você editar as formas.</p>
                  {erro && <p className="aviso-mini" role="alert">{erro}</p>}
                  <div className="av-acoes">
                    <button type="button" className="btn btn-red" disabled={!plano.numerosIguais} onClick={aplicar}>Atualizar agora</button>
                    <button type="button" className="btn btn-paper" onClick={() => setPainel(false)}>Agora não</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  /* ---------- ficha atualizada: confirmação, “a revisar” e desfazer ---------- */
  const at = f.atualizacao;
  if (!at || modo !== "dono") return null;
  if (revisar.length === 0 && !desfazer) return null;
  return (
    <section className="aviso-versao ok" role="status" aria-label="Ficha atualizada" data-modo={modo}>
      <div className="av-topo">
        <span className="av-selo">v{at.de} <i aria-hidden="true">→</i> v{versaoDaFicha(f)}</span>
        <b className="av-titulo">Ficha atualizada</b>
        <Info>Os seus números não mudaram. O que ficou para você decidir aparece na lista abaixo e some sozinho quando você resolve.</Info>
      </div>
      {revisar.length > 0 && (
        <div className="ad-revisar" aria-label="A revisar">
          <h4>A revisar <small>{revisar.length}</small></h4>
          <ul>
            {revisar.map((r) => (
              <li key={r.id}>
                <span>{r.texto}</span>
                {onAbrirForma && <button type="button" className="btn btn-paper" onClick={() => onAbrirForma(r.forma)}>Abrir a forma</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="av-acoes">
        {desfazer && <button type="button" className="btn btn-paper" onClick={voltar}>Desfazer atualização</button>}
        {revisar.length > 0 && <button type="button" className="link-perigo" onClick={dispensar}>Dispensar a lista</button>}
        {revisar.length === 0 && <button type="button" className="link-perigo" onClick={dispensar}>Entendi</button>}
      </div>
      {desfazer && <p className="av-nota">Dá para desfazer até {dia(new Date(Date.parse(at.em) + DIAS_PARA_DESFAZER * 86400000).toISOString())} ou até você editar as formas.</p>}
    </section>
  );
}
