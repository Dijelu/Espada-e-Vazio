import { useEffect, useState } from "react";
import { analisarDano, ATR_AUTO, danoNoTeto } from "../regras/teto-dano";
import { danoDoCartao, danoResolvido, ehCartaoNovo, infoRitmo, infoSub, novaHabilidade, RITMOS, SUBS, temFinal, vagasUsadas, type CuraTipo, type Ritmo, type SubAcao, CURAS } from "../regras/cartoes";
import type { CtxForma } from "../regras/efeitos-forma";
import type { FormaLib, HabForma } from "../regras/ficha";
import { classeDe } from "./EfeitosForma";
import { resolverDano } from "../regras/liberacoes";
import { SeletorDano } from "./SeletorFormula";
import { Info } from "./Dica";

const ACOES = ["Ação", "Ação bônus", "Reação"];

/** O texto que a ficha mostra: a descrição do jogador e, depois, a regra do cartão. */
export const comporTexto = (desc: string, regra: string, especial?: HabForma["especial"]) =>
  [desc.trim(), regra.trim(), especial ? `Técnica especial: 1 uso por cena. Depois de usar, você fica ${especial.condicao} ${especial.duracao}.` : ""].filter(Boolean).join("\n");

/** Condições que a técnica especial pode cobrar de quem a usa. */
export const CONDICOES_ESPECIAL = ["Esgotado", "Amedrontado", "Atordoado", "Caído", "Cego", "Surdo", "Distorcido", "Queimado", "Sangramento", "Congelado", "Preso", "Agarrado"];
export const DURACOES_ESPECIAL = ["até o fim do próximo turno", "até o fim da cena", "até um descanso curto", "até um descanso longo"];

interface GaleriaProps {
  tipo: FormaLib["tipo"];
  ctx: CtxForma;
  ppExtra: boolean;
  /** habilidades que a forma já tem */
  habs: HabForma[];
  /** limite de vagas normais da forma */
  limite: number;
  /** atributo do bônus do dano */
  atr: string;
  onUsar: (h: HabForma) => void;
}

const TEXTO_ACAO: Record<SubAcao, { titulo: string; sobre: string }> = {
  ataque: { titulo: "Ataque em alvo único", sobre: "Um golpe, um tiro, um corte. Atinge um alvo só e causa o dano cheio." },
  area: { titulo: "Área", sobre: "Atinge todos numa área de 6 metros. Cada alvo sofre um pouco menos que num ataque único." },
  cura: { titulo: "Cura ou proteção", sobre: "Cura você ou um aliado, dá PV temporários, reduz um dano ou cria uma barreira." },
  movimento: { titulo: "Movimento e ataque (investida)", sobre: "Você avança em linha reta e ataca no fim. O dano é um pouco menor que o do ataque único." },
};

/** Os quatro cartões de ação. O dano e o custo já vêm prontos: o jogador escolhe o ritmo e escreve a descrição visual. */
export function GaleriaAcoes({ tipo, ctx, ppExtra, habs, limite, atr, onUsar }: GaleriaProps) {
  const classe = classeDe(tipo);
  const cheio = vagasUsadas(habs) >= limite;
  return (
    <>
      <div className="cartas-hab galeria-cartoes">
        {SUBS.map((s) => <CartaoDeAcao key={s.id} sub={s.id} classe={classe} ctx={ctx} ppExtra={ppExtra} habs={habs} cheio={cheio} atr={atr} onUsar={onUsar} />)}
      </div>
      <table className="tabela-pr">
        <caption>Quanto cada ação custa em PR</caption>
        <tbody>{RITMOS.map((r) => <tr key={r.id}><th scope="row">{r.nome}</th><td>{r.pr} PR</td></tr>)}</tbody>
      </table>
    </>
  );
}

function CartaoDeAcao({ sub, classe, ctx, ppExtra, habs, cheio, atr, onUsar }: { sub: SubAcao; classe: string; ctx: CtxForma; ppExtra: boolean; habs: HabForma[]; cheio: boolean; atr: string; onUsar: (h: HabForma) => void }) {
  const info = infoSub(sub);
  const [ritmo, setRitmo] = useState<Ritmo>("acao");
  const [final, setFinal] = useState(false);
  const [cura, setCura] = useState<CuraTipo>("pv");
  const [emArea, setEmArea] = useState(false);
  const podeFinal = info.dano && sub !== "cura";
  const jaFinal = temFinal(habs);
  const comFinal = final && podeFinal && !jaFinal;
  const ritmoReal: Ritmo = comFinal ? "acao" : ritmo;
  const h = novaHabilidade(sub, { ritmo: ritmoReal, final: comFinal, atr, cura, emArea }, ctx, ppExtra);
  const bloqueado = comFinal ? false : cheio;
  const nomeLivre = (base: string) => { let n = base, k = 2; while (habs.some((x) => x.nome === n)) n = `${base} ${k++}`; return n; };
  const nomeId = `${sub}-ritmo`;
  return (
    <article className="carta-hab carta-peca carta-neutra carta-acao" data-classe={classe}>
      <div className="carta-topo">
        <small className="ajuda">{infoRitmo(ritmoReal).nome}</small>
        <span className="selo-pp">{h.pr}<i>PR</i></span>
      </div>
      <h3>{TEXTO_ACAO[sub].titulo}</h3>
      <p>{TEXTO_ACAO[sub].sobre}</p>
      <div className="filtros-pecas" role="group" aria-label={`Ritmo de ${TEXTO_ACAO[sub].titulo}`} id={nomeId}>
        {RITMOS.map((r) => <button key={r.id} type="button" disabled={comFinal} className={`chip chip-btn ${ritmoReal === r.id ? "on" : ""}`} aria-pressed={ritmoReal === r.id} onClick={() => setRitmo(r.id)}>{r.nome}</button>)}
      </div>
      {sub === "cura" && (
        <>
          <label className="campo">O que faz
            <select value={cura} onChange={(e) => setCura(e.target.value as CuraTipo)}>
              {CURAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          {(cura === "pv" || cura === "temp") && <label className="check"><input type="checkbox" checked={emArea} onChange={(e) => setEmArea(e.target.checked)} /> Também os aliados em volta (área)</label>}
        </>
      )}
      {podeFinal && (
        <div className="check"><label className="check">
          <input type="checkbox" checked={comFinal} disabled={jaFinal} onChange={(e) => setFinal(e.target.checked)} />
          Técnica final da forma{jaFinal ? " (já tem)" : ""}
        </label><Info>A técnica final fica numa vaga extra: não gasta uma das vagas normais da forma. Só pode haver uma por forma e ela é sempre uma ação.</Info></div>
      )}
      {h.dano ? <p className="ajuda">Dano: <b>{danoResolvido(h.dano, ctx)}</b></p> : <p className="ajuda">Sem dano em dados</p>}
      <button type="button" className="btn-mini" disabled={bloqueado} onClick={() => onUsar({ ...h, nome: nomeLivre(h.nome) })}>
        {bloqueado ? "Sem vagas" : comFinal ? "Montar a técnica final" : "Montar este cartão"}
      </button>
    </article>
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
  // ataque automático: o dano é calculado na leitura (nível, tipo de ação, técnica especial; os dados extras dos cartões não entram)
  const danoLido = danoDoCartao(h, ctx, ppExtra);
  const a = h.fixa ? null : analisarDano(danoLido, h.acao, ctx, ppExtra, h.especial ?? false);
  // a ficha também guarda o valor, para quem a lê fora desta tela
  const chaveAtr = JSON.stringify(ctx.atr);
  useEffect(() => {
    if (!h.auto || h.fixa) return;
    const d = danoDoCartao(h, ctx, ppExtra);
    if (d && d !== h.dano) onChange({ dano: d });
  }, [h.auto, h.fixa, h.acao, h.dano, h.cartao?.sub, h.especial?.condicao, h.especial?.duracao, ctx.n, ctx.prof, ctx.tipo, chaveAtr, ppExtra]); // eslint-disable-line react-hooks/exhaustive-deps
  const novo = h.regra !== undefined || h.desc !== undefined;
  const regra = h.regra ?? "";
  const desc = novo ? (h.desc ?? "") : h.texto;
  const temDano = !!h.dano;
  /** cartão feito pelos cartões de ação: dano e custo já vêm prontos */
  const doCartao = ehCartaoNovo(h);
  const nomeSub = h.cartao ? infoSub(h.cartao.sub).nome : "";
  return (
    <article className={`carta-hab carta-peca carta-montagem ${a?.erros.length ? "carta-estourou" : ""}`} data-classe={classeDe(tipo)}>
      <div className="carta-topo">
        <input className="carta-nome" value={h.nome} onChange={(e) => onChange({ nome: e.target.value })} placeholder="Nome do ataque ou técnica" aria-label="Nome" />
        {doCartao ? (
          <span className="selo-pp" title="O custo vem do ritmo da ação">{h.pr ?? 0}<i>PR</i></span>
        ) : temDano ? (
          <span className="selo-pp" title="Calculado pelo dano: quanto mais forte o golpe, mais PR">{h.pr ?? 0}<i>PR</i></span>
        ) : (
          <label className="selo-pp selo-edit">
            <input type="number" min={0} max={30} value={h.pr ?? 0} aria-label="Custo em PR" onChange={(e) => { const v = Math.max(0, Math.min(30, Number(e.target.value) || 0)); onChange({ pr: v || undefined, custo: v ? `${v} PR` : "" }); }} />
            <i>PR</i>
          </label>
        )}
      </div>
      {doCartao && <p className="ajuda tipo-cartao">{nomeSub}{h.cartao?.final ? " · técnica final (vaga extra)" : ""}</p>}
      <div className="filtros-pecas" role="group" aria-label="Tipo de ação">
        {ACOES.map((x) => <button key={x} type="button" disabled={!!h.cartao?.final} className={`chip chip-btn ${h.acao === x ? "on" : ""}`} aria-pressed={h.acao === x} onClick={() => onChange({ acao: x })}>{x}</button>)}
      </div>
      {doCartao && !h.auto ? (
        <div className="auto-dano">
          <span className="rotulo-sel">{h.dano ? "Valor" : "Efeito"}</span>
          <p className="ajuda">{h.dano ? <>Rola: <b>{resolver(h.dano, ctx)}</b></> : "Sem número: o efeito está na regra do cartão."}</p>
        </div>
      ) : h.auto && !h.fixa ? (
        <div className="auto-dano">
          <span className="rotulo-sel">Dano</span>
          <label className="campo">Atributo do bônus
            <select value={h.auto} onChange={(e) => onChange({ auto: e.target.value, ...(h.cartao ? { cartao: { ...h.cartao, atr: e.target.value } } : {}) })}>
              {ATR_AUTO.map((x) => <option key={x.id} value={x.id}>{x.nome} ({ctx.atr[x.chave] >= 0 ? "+" : ""}{ctx.atr[x.chave]})</option>)}
            </select>
          </label>
          <p className="ajuda">Rola: <b>{danoLido ? resolver(danoLido, ctx) : "—"}</b> <Info>O dano já vem pronto para a ação. Mudou o nível, o tipo de ação ou a técnica especial? Ele se ajusta sozinho. Você só escreve a descrição do ataque. {doCartao ? "O custo em PR vem do ritmo da ação." : "O custo em PR acompanha o dano."}</Info></p>
        </div>
      ) : (
        <>
          {!temDano && !h.fixa ? (
            <div className="seletor-formula">
              <span className="rotulo-sel">Dano</span>
              <button type="button" className="btn-mini" onClick={() => { const d = danoNoTeto(h.acao, ctx, "ESP", ppExtra, h.especial ?? false); onChange({ auto: "ESP", ...(d ? { dano: d } : {}) }); }}>Adicionar ataque</button>
            </div>
          ) : (
            <SeletorDano rotulo="Dano" valor={h.dano ?? ""} ctx={ctx} analise={a} onChange={(x) => onChange({ dano: x })} />
          )}
          {temDano && !h.fixa && <button type="button" className="link" onClick={() => onChange({ auto: "ESP" })}>Voltar ao dano automático</button>}
        </>
      )}
      {temDano && !h.fixa && (!doCartao || !!h.auto) && (
        <div className="especial-cartao">
          <div className="check"><label className="check">
            <input
              type="checkbox"
              checked={!!h.especial}
              onChange={(e) => {
                const esp = e.target.checked ? { condicao: "Esgotado", duracao: "até o fim da cena" } : undefined;
                onChange({ especial: esp, ...(novo ? { texto: comporTexto(h.desc ?? "", regra, esp) } : {}) });
              }}
            />
            Técnica especial{h.especial ? " (dano maior)" : ""}
          </label><Info>Só 1 vez por cena e, depois, você recebe uma condição. Em troca, o dano da técnica fica maior (quanto mais pesada a condição, maior).</Info></div>
          {h.especial && (
            <div className="duas">
              <label className="campo">Condição que você recebe
                <select value={h.especial.condicao} onChange={(e) => { const esp = { ...h.especial!, condicao: e.target.value }; onChange({ especial: esp, ...(novo ? { texto: comporTexto(h.desc ?? "", regra, esp) } : {}) }); }}>
                  {CONDICOES_ESPECIAL.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="campo">Por quanto tempo
                <select value={h.especial.duracao} onChange={(e) => { const esp = { ...h.especial!, duracao: e.target.value }; onChange({ especial: esp, ...(novo ? { texto: comporTexto(h.desc ?? "", regra, esp) } : {}) }); }}>
                  {DURACOES_ESPECIAL.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
      )}
      {!h.fixa && !h.especial && (
        <div className="especial-cartao">
          <div className="duas">
            <label className="campo"><span>Limite de uso <Info>Limite de uso e requisito são pontos fracos: cada um devolve pontos para a forma (até 4 no total).</Info></span>
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
