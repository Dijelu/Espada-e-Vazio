import { useEffect } from "react";
import { analisarDano, ATR_AUTO, danoNoTeto, MULT_DURACAO, PCT_CONDICAO, pctEspecial, resumoAnalise } from "../regras/teto-dano";
import type { CtxForma } from "../regras/efeitos-forma";
import type { FormaLib, HabForma } from "../regras/ficha";
import { classeDe } from "./EfeitosForma";
import { resolverDano } from "../regras/liberacoes";
import { SeletorDano } from "./SeletorFormula";

const ACOES = ["Ação", "Ação bônus", "Reação"];

/** O texto que a ficha mostra: a descrição do jogador e, depois, a regra do cartão. */
export const comporTexto = (desc: string, regra: string, especial?: HabForma["especial"]) =>
  [desc.trim(), regra.trim(), especial ? `Técnica especial: 1 uso por cena. Depois de usar, você fica ${especial.condicao} ${especial.duracao}.` : ""].filter(Boolean).join("\n");

/** Condições que a técnica especial pode cobrar de quem a usa. */
export const CONDICOES_ESPECIAL = ["Esgotado", "Amedrontado", "Atordoado", "Caído", "Cego", "Surdo", "Distorcido", "Queimado", "Sangramento", "Congelado", "Preso", "Agarrado"];
export const DURACOES_ESPECIAL = ["até o fim do próximo turno", "até o fim da cena", "até um descanso curto", "até um descanso longo"];

interface GaleriaProps {
  modelos: HabForma[];
  tipo: FormaLib["tipo"];
  ctx: CtxForma;
  cheio: boolean;
  jaTem: (nome: string) => boolean;
  onUsar: (h: HabForma) => void;
}

/** Cartões neutros: o jogador escolhe um e monta a habilidade a partir dele. */
export function GaleriaCartoes({ modelos, tipo, ctx, cheio, jaTem, onUsar }: GaleriaProps) {
  const classe = classeDe(tipo);
  return (
    <div className="cartas-hab galeria-cartoes">
      {modelos.map((h) => {
        const a = analisarDano(h.dano, h.acao, ctx);
        const usado = jaTem(h.nome);
        return (
          <article key={h.nome} className={`carta-hab carta-peca carta-neutra ${usado ? "travada" : ""}`} data-classe={classe}>
            <div className="carta-topo">
              <small className="ajuda">{h.acao}</small>
              <span className="selo-pp">{a ? a.custoPr : (h.pr ?? 0)}<i>PR</i></span>
            </div>
            <h3>{h.nome}</h3>
            <p>{h.texto}</p>
            {a ? <p className="ajuda">Dano médio ~{Math.round(a.media)}</p> : <p className="ajuda">Sem dano em dados</p>}
            <button type="button" className="btn-mini" disabled={cheio || usado} onClick={() => onUsar(h)}>{usado ? "Já está nos seus cartões" : cheio ? "Limite atingido" : "Montar a partir deste cartão"}</button>
          </article>
        );
      })}
      <article className="carta-hab carta-peca carta-neutra carta-branca" data-classe={classe}>
        <div className="carta-topo"><small className="ajuda">Ação</small><span className="selo-pp">?<i>PR</i></span></div>
        <h3>Cartão em branco</h3>
        <p>Comece do zero: escolha a ação, defina o dano se houver e escreva a descrição.</p>
        <button type="button" className="btn-mini" disabled={cheio} onClick={() => onUsar({ id: "", nome: "", texto: "", custo: "", acao: "Ação" })}>{cheio ? "Limite atingido" : "Montar em branco"}</button>
      </article>
    </div>
  );
}

interface CartaoProps {
  h: HabForma;
  tipo: FormaLib["tipo"];
  ctx: CtxForma;
  ppExtra: boolean;
  /** nome da forma, para a dica da descrição */
  nomeForma: string;
  onChange: (p: Partial<HabForma>) => void;
  onRemover: () => void;
}

/** Cartão de habilidade já montado: nome, ação, dano, custo calculado e a descrição do jogador. */
export function CartaoHabilidade({ h, tipo, ctx, ppExtra, nomeForma, onChange, onRemover }: CartaoProps) {
  const a = h.fixa ? null : analisarDano(h.dano, h.acao, ctx, ppExtra, h.especial ?? false);
  // ataque automático: o dano acompanha o teto (nível, tipo de ação, técnica especial e dados extras das peças)
  const chaveAtr = JSON.stringify(ctx.atr);
  useEffect(() => {
    if (!h.auto || h.fixa) return;
    const d = danoNoTeto(h.acao, ctx, h.auto, ppExtra, h.especial ?? false);
    if (d && d !== h.dano) onChange({ dano: d });
  }, [h.auto, h.fixa, h.acao, h.dano, h.especial?.condicao, h.especial?.duracao, ctx.n, ctx.prof, ctx.extra, ctx.tipo, chaveAtr, ppExtra]); // eslint-disable-line react-hooks/exhaustive-deps
  const pct = pctEspecial(h.especial);
  const novo = h.regra !== undefined || h.desc !== undefined;
  const regra = h.regra ?? "";
  const desc = novo ? (h.desc ?? "") : h.texto;
  const temDano = !!h.dano;
  return (
    <article className={`carta-hab carta-peca carta-montagem ${a?.erros.length ? "carta-estourou" : ""}`} data-classe={classeDe(tipo)}>
      <div className="carta-topo">
        <input className="carta-nome" value={h.nome} onChange={(e) => onChange({ nome: e.target.value })} placeholder="Nome do ataque ou técnica" aria-label="Nome" />
        {temDano ? (
          <span className="selo-pp" title="Calculado pelo dano">{h.pr ?? 0}<i>PR</i></span>
        ) : (
          <label className="selo-pp selo-edit">
            <input type="number" min={0} max={30} value={h.pr ?? 0} aria-label="Custo em PR" onChange={(e) => { const v = Math.max(0, Math.min(30, Number(e.target.value) || 0)); onChange({ pr: v || undefined, custo: v ? `${v} PR` : "" }); }} />
            <i>PR</i>
          </label>
        )}
      </div>
      <div className="filtros-pecas" role="group" aria-label="Tipo de ação">
        {ACOES.map((x) => <button key={x} type="button" className={`chip chip-btn ${h.acao === x ? "on" : ""}`} aria-pressed={h.acao === x} onClick={() => onChange({ acao: x })}>{x}</button>)}
      </div>
      {h.auto && !h.fixa ? (
        <div className="auto-dano">
          <span className="rotulo-sel">Dano</span>
          <label className="campo">Atributo do bônus
            <select value={h.auto} onChange={(e) => onChange({ auto: e.target.value })}>
              {ATR_AUTO.map((x) => <option key={x.id} value={x.id}>{x.nome} ({ctx.atr[x.chave] >= 0 ? "+" : ""}{ctx.atr[x.chave]})</option>)}
            </select>
          </label>
          <p className="ajuda">Rola: <b>{h.dano ? resolver(h.dano, ctx) : "—"}</b></p>
          {a && <p className="ajuda teto-dano">{resumoAnalise(a)}</p>}
          <p className="ajuda">O dano já vem no teto da ação. Mudou o nível, o tipo de ação ou a técnica especial? Ele se ajusta sozinho.</p>
          <button type="button" className="link" onClick={() => onChange({ auto: undefined })}>Ajustar o dano à mão (para um golpe mais barato, por exemplo)</button>
        </div>
      ) : (
        <>
          {!temDano && !h.fixa ? (
            <div className="seletor-formula">
              <span className="rotulo-sel">Dano</span>
              <button type="button" className="btn-mini" onClick={() => { const d = danoNoTeto(h.acao, ctx, "ESP", ppExtra, h.especial ?? false); onChange({ auto: "ESP", ...(d ? { dano: d } : {}) }); }}>Adicionar ataque (dano no teto)</button>
            </div>
          ) : (
            <SeletorDano rotulo="Dano" valor={h.dano ?? ""} ctx={ctx} analise={a} onChange={(x) => onChange({ dano: x })} />
          )}
          {temDano && !h.fixa && <button type="button" className="link" onClick={() => onChange({ auto: "ESP" })}>Voltar ao dano automático (no teto)</button>}
        </>
      )}
      {temDano && <p className="ajuda">O custo em PR é calculado pelo dano: quanto mais forte o golpe, mais PR.</p>}
      {temDano && !h.fixa && (
        <div className="especial-cartao">
          <label className="check">
            <input
              type="checkbox"
              checked={!!h.especial}
              onChange={(e) => {
                const esp = e.target.checked ? { condicao: "Esgotado", duracao: "até o fim da cena" } : undefined;
                onChange({ especial: esp, ...(novo ? { texto: comporTexto(h.desc ?? "", regra, esp) } : {}) });
              }}
            />
            Técnica especial: só 1 vez por cena e, depois, você recebe uma condição. Em troca, o dano máximo sobe{h.especial ? ` ${pct}%` : " (quanto mais pesada a condição, mais sobe)"}.
          </label>
          {h.especial && (
            <div className="duas">
              <label className="campo">Condição que você recebe
                <select value={h.especial.condicao} onChange={(e) => { const esp = { ...h.especial!, condicao: e.target.value }; onChange({ especial: esp, ...(novo ? { texto: comporTexto(h.desc ?? "", regra, esp) } : {}) }); }}>
                  {CONDICOES_ESPECIAL.map((c) => <option key={c} value={c}>{c} (+{PCT_CONDICAO[c] ?? 40}%)</option>)}
                </select>
              </label>
              <label className="campo">Por quanto tempo
                <select value={h.especial.duracao} onChange={(e) => { const esp = { ...h.especial!, duracao: e.target.value }; onChange({ especial: esp, ...(novo ? { texto: comporTexto(h.desc ?? "", regra, esp) } : {}) }); }}>
                  {DURACOES_ESPECIAL.map((c) => <option key={c} value={c}>{c} (×{String(MULT_DURACAO[c] ?? 1).replace(".", ",")})</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
      )}
      {!h.fixa && !h.especial && (
        <div className="especial-cartao">
          <p className="ajuda">Limite de uso e requisito são pontos fracos: cada um devolve pontos para a forma (até 4 no total).</p>
          <div className="duas">
            <label className="campo">Limite de uso
              <select value={h.limite ?? ""} onChange={(e) => { const v = (e.target.value || undefined) as HabForma["limite"]; onChange({ limite: v }); }}>
                <option value="">Sem limite</option>
                <option value="cena">1 vez por cena (+1 PP)</option>
                <option value="curto">1 vez por descanso curto (+2 PP)</option>
                <option value="longo">1 vez por descanso longo (+3 PP)</option>
              </select>
            </label>
            <label className="campo">Requisito (opcional, +1 PP)
              <input value={h.requisito ?? ""} onChange={(e) => onChange({ requisito: e.target.value || undefined })} placeholder="Ex.: o alvo foi marcado pela tinta" />
            </label>
          </div>
        </div>
      )}
      {regra && <p className="regra-cartao"><b>Regra do cartão:</b> {regra}</p>}
      <label className="campo">Descrição do ataque
        <textarea
          rows={4}
          value={desc}
          placeholder={`Escreva como a característica e o tema d${tipo === "shikai" ? "a sua Shikai" : "a sua forma"}${nomeForma ? ` (${nomeForma})` : ""} aparecem neste ataque: o que se vê, o que se sente, como atinge o alvo.`}
          onChange={(e) => onChange(novo ? { desc: e.target.value, texto: comporTexto(e.target.value, regra, h.especial) } : { texto: e.target.value })}
        />
      </label>
      <button type="button" className="link-perigo" onClick={onRemover}>Remover este cartão</button>
    </article>
  );
}

/** Mostra a fórmula já com os números do personagem (10d12+5). */
const resolver = (expr: string, ctx: CtxForma) => resolverDano(expr, { nivel: ctx.n } as never, { prof: ctx.prof, atr: ctx.atr } as never);
