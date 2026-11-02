import { analisarDano } from "../regras/teto-dano";
import type { CtxForma } from "../regras/efeitos-forma";
import type { FormaLib, HabForma } from "../regras/ficha";
import { classeDe } from "./EfeitosForma";
import { SeletorDano } from "./SeletorFormula";

const ACOES = ["Ação", "Ação bônus", "Reação"];

/** O texto que a ficha mostra: a descrição do jogador e, depois, a regra do cartão. */
export const comporTexto = (desc: string, regra: string) => [desc.trim(), regra.trim()].filter(Boolean).join("\n");

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
  const a = h.fixa ? null : analisarDano(h.dano, h.acao, ctx, ppExtra);
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
      <SeletorDano rotulo="Dano" valor={h.dano ?? ""} ctx={ctx} analise={a} onChange={(x) => onChange({ dano: x })} />
      {temDano && <p className="ajuda">O custo em PR é calculado pelo dano: quanto mais forte o golpe, mais PR.</p>}
      {regra && <p className="regra-cartao"><b>Regra do cartão:</b> {regra}</p>}
      <label className="campo">Descrição do ataque
        <textarea
          rows={4}
          value={desc}
          placeholder={`Escreva como a característica e o tema d${tipo === "shikai" ? "a sua Shikai" : "a sua forma"}${nomeForma ? ` (${nomeForma})` : ""} aparecem neste ataque: o que se vê, o que se sente, como atinge o alvo.`}
          onChange={(e) => onChange(novo ? { desc: e.target.value, texto: comporTexto(e.target.value, regra) } : { texto: e.target.value })}
        />
      </label>
      <button type="button" className="link-perigo" onClick={onRemover}>Remover este cartão</button>
    </article>
  );
}
