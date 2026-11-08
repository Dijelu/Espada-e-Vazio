/* Passo "Forma da arma": o jogador escolhe a arma do catálogo (ou monta uma arma própria, que o Mestre precisa aprovar)
   e marca as características da arma, até o limite da forma (cartoes.ts). A arma define o golpe básico; as características decidem
   quais cartões a forma pode montar. Sem arma, tudo fica liberado. */
import { useMemo, useState } from "react";
import type { Ficha, FormaLib } from "../regras/ficha";
import { limiteCaracsArma } from "../regras/cartoes";
import {
  ARMAS_LIVRES, ATRS_ARMA, CARACS_ARMA, DANOS_ARMA, FORMA_DA_ARMA_MANTIDA, GRUPOS_ARMA, PROPS_ARMA, TIPOS_DANO_ARMA,
  armaDoCatalogo, armaEfetiva, armaPendente, armaPropriaVazia, caracsValidas, catalogoDaForma, listarRequisitos, nomeCaracArma, resumoArma,
  type ArmaForma,
} from "../regras/arma-forma";
import { TIPO_FORMA_NOME } from "../regras/liberacoes";
import { classeDe } from "./EfeitosForma";
import { Info } from "./Dica";

interface Props {
  f: Ficha;
  tipo: FormaLib["tipo"];
  r: FormaLib;
  mud: (p: Partial<FormaLib>) => void;
}

/** O texto de abertura de cada forma: a variedade da arma cresce com a forma. */
export function ajudaDaArma(tipo: FormaLib["tipo"]): string {
  const n = limiteCaracsArma(tipo);
  switch (tipo) {
    case "shikai": return `Escolha uma arma do catálogo e marque até ${n} características dela. A arma define o seu golpe básico; as características decidem que cartões você poderá montar depois (um porrete, por exemplo, não monta enxame).`;
    case "bankai": return `A Bankai tem mais variedade que a Shikai: até ${n} características. A Potencializadora fica perto da arma da Shikai e pode mantê-la; a Transformadora pode ter uma arma de outro tipo, muito diferente (como a Bankai do Ikkaku).`;
    case "bankai2": return `A Bankai verdadeira é a mais livre: até ${n} características. Pode ser uma arma, um conjunto de armas livres ou até o próprio espírito (arma própria, com o aval do Mestre).`;
    case "resurreccion": return `A arma do Hollow é o corpo: garra, cauda, lâmina no braço. Use o mesmo catálogo mais as armas naturais e marque até ${n} características.`;
    case "segunda": return `Na segunda etapa o corpo vira arma de verdade: garras, caudas e lâminas maiores. Até ${n} características, com o mesmo catálogo mais as armas naturais.`;
    default: return `Opcional. Escolha só se a sua Vollständig usa uma Arma Espiritual ou o canalizador como arma (até ${n} características). Sem arma definida, todos os cartões ficam liberados.`;
  }
}

const CRITICOS = [20, 19, 18, 17];
const POR_PAGINA = 8;

function CartaArma({ a, classe, escolhida, onEscolher }: { a: ArmaForma; classe: string; escolhida: boolean; onEscolher: () => void }) {
  const props = a.props.split(",").map((x) => x.trim()).filter(Boolean);
  return (
    <article className={`carta-hab carta-peca carta-neutra carta-padrao carta-arma${escolhida ? " escolhida" : ""}`} data-classe={classe}>
      <div className="carta-topo">
        <small className="ajuda">{a.grupo ?? "Arma"}</small>
        <span className="selo-pp" title="Dado de dano">{a.dano}</span>
      </div>
      <h3>{a.nome}</h3>
      <p className="texto-carta">{a.tipo}</p>
      <dl className="dados-arma">
        <div><dt>Crítico</dt><dd>{a.crit >= 20 ? "20" : `${a.crit}–20`} ×{a.mult}</dd></div>
        <div><dt>Atributo</dt><dd>{a.atr}</dd></div>
        <div><dt>Peso</dt><dd>{a.peso}</dd></div>
        <div><dt>Alcance</dt><dd>{a.alcance || "corpo a corpo"}</dd></div>
      </dl>
      {props.length > 0 && <div className="marcas-carac" aria-label="Propriedades da arma">{props.map((p) => <span key={p} className="chip marca-carac">{p}</span>)}</div>}
      <div className="rodape-carta">
        <button type="button" className="btn-mini" aria-pressed={escolhida} onClick={onEscolher}>{escolhida ? "✓ Escolhida" : "Escolher"}</button>
      </div>
    </article>
  );
}

/** Formulário da arma própria (mesmas propriedades do catálogo; o Mestre precisa aprovar). */
function ArmaPropria({ tipo, atual, onUsar }: { tipo: FormaLib["tipo"]; atual?: ArmaForma; onUsar: (a: ArmaForma) => void }) {
  const [a, setA] = useState<ArmaForma>(() => (atual?.fonte === "propria" ? atual : armaPropriaVazia()));
  const p = (x: Partial<ArmaForma>) => setA((v) => ({ ...v, ...x }));
  const props = a.props.split(",").map((x) => x.trim()).filter(Boolean);
  const alterna = (nome: string) => p({ props: (props.includes(nome) ? props.filter((x) => x !== nome) : [...props, nome]).join(", ") });
  return (
    <details className="arma-propria" open={atual?.fonte === "propria" ? true : undefined}>
      <summary><b>Montar uma arma própria</b> <span className="marca-aval">precisa do aval do Mestre</span></summary>
      <p className="ajuda">Use as mesmas propriedades do catálogo. Até o Mestre aprovar, a arma fica como “pendente”: vale como texto e o golpe básico segue o da sua classe.</p>
      {tipo === "bankai2" && (
        <div className="filtros-pecas" role="group" aria-label="Pontos de partida">
          {ARMAS_LIVRES.map((x) => <button key={x.nome} type="button" className="chip chip-btn" onClick={() => p({ nome: x.nome, nota: x.nota })}>{x.nome}</button>)}
        </div>
      )}
      <label className="campo">Nome<input value={a.nome} maxLength={60} onChange={(e) => p({ nome: e.target.value })} placeholder="Ex.: Foice de sombra" /></label>
      <label className="campo">Como ela é (opcional)<input value={a.nota ?? ""} maxLength={200} onChange={(e) => p({ nota: e.target.value })} placeholder="Ex.: quatro lâminas que giram em volta de mim" /></label>
      <div className="grade-arma">
        <label className="campo">Dado de dano<select value={a.dano} onChange={(e) => p({ dano: e.target.value })}>{DANOS_ARMA.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="campo">Tipo de dano<select value={a.tipo} onChange={(e) => p({ tipo: e.target.value })}>{TIPOS_DANO_ARMA.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="campo">Crítico a partir de<select value={a.crit} onChange={(e) => p({ crit: Number(e.target.value) })}>{CRITICOS.map((x) => <option key={x} value={x}>{x === 20 ? "20" : `${x}–20`}</option>)}</select></label>
        <label className="campo">Multiplicador<select value={a.mult} onChange={(e) => p({ mult: Number(e.target.value) })}>{[2, 3, 4].map((x) => <option key={x} value={x}>×{x}</option>)}</select></label>
        <label className="campo">Atributo<select value={a.atr} onChange={(e) => p({ atr: e.target.value })}>{ATRS_ARMA.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="campo">Peso<select value={a.peso} onChange={(e) => p({ peso: Number(e.target.value) })}>{[1, 2, 3, 4].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="campo">Alcance (se tiver)<input value={a.alcance} maxLength={40} onChange={(e) => p({ alcance: e.target.value })} placeholder="Ex.: 18m" /></label>
      </div>
      <div className="filtros-pecas" role="group" aria-label="Propriedades da arma">
        {PROPS_ARMA.map((x) => <button key={x} type="button" className={`chip chip-btn ${props.includes(x) ? "on" : ""}`} aria-pressed={props.includes(x)} onClick={() => alterna(x)}>{x}</button>)}
      </div>
      <button type="button" className="btn btn-paper" disabled={!a.nome.trim()} onClick={() => onUsar({ ...a, nome: a.nome.trim(), fonte: "propria", aval: "pendente" })}>{a.nome.trim() ? "Usar esta arma (aval pendente)" : "Dê um nome à arma"}</button>
    </details>
  );
}

export function EscolhaArmaForma({ f, tipo, r, mud }: Props) {
  const classe = classeDe(tipo);
  const limite = limiteCaracsArma(tipo);
  const nomeForma = TIPO_FORMA_NOME[tipo];
  const deQuem = FORMA_DA_ARMA_MANTIDA[tipo];
  const formaBase = deQuem ? f.formas[deQuem] : undefined;
  const armaBase = formaBase ? armaEfetiva(f, formaBase) : undefined;
  const mantem = !!r.armaMantem && !!deQuem;
  const arma = armaEfetiva(f, { ...r, armaMantem: mantem });
  const marcadas: string[] = caracsValidas(r.armaCaracs);
  const cheio = marcadas.length >= limite;
  const [aba, setAba] = useState<"arma" | "caracs">("arma");
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState("");
  const [mostrar, setMostrar] = useState(POR_PAGINA);
  const [msg, setMsg] = useState("");
  const q = busca.trim().toLowerCase();
  const itens = useMemo(() => catalogoDaForma(tipo).filter((a) => (!grupo || a.grupo === grupo) && (!q || a.nome.toLowerCase().includes(q))), [tipo, grupo, q]);
  const grupos = useMemo(() => GRUPOS_ARMA.filter((g) => catalogoDaForma(tipo).some((a) => a.grupo === g)), [tipo]);
  const libera = useMemo(() => listarRequisitos(), []);

  const escolher = (a: ArmaForma) => { mud({ arma: armaDoCatalogo(a), armaMantem: undefined }); setMsg(`${a.nome} é a arma da ${nomeForma}.`); };
  const tirar = () => { mud({ arma: undefined, armaMantem: undefined }); setMsg("Sem arma definida: todos os cartões ficam liberados."); };
  const manter = (sim: boolean) => {
    if (sim) mud({ armaMantem: true, ...(marcadas.length === 0 && formaBase?.armaCaracs?.length ? { armaCaracs: caracsValidas(formaBase.armaCaracs).slice(0, limite) } : {}) });
    else mud({ armaMantem: undefined });
  };
  const alternar = (id: string) => {
    if (marcadas.includes(id)) { mud({ armaCaracs: marcadas.filter((x) => x !== id) }); setMsg(""); return; }
    if (cheio) { setMsg(`A ${nomeForma} aceita só ${limite} características da arma. Desmarque uma para trocar.`); return; }
    mud({ armaCaracs: [...marcadas, id] });
    setMsg("");
  };

  const fora = tipo === "bankai" && r.estilo === "potencializadora" && !mantem && !!armaBase?.grupo && !!r.arma?.grupo && r.arma.grupo !== armaBase.grupo;
  const sombra = !arma;

  return (
    <div className="escolha-arma" data-classe={classe}>
      <p className="ajuda">{ajudaDaArma(tipo)}</p>

      {deQuem && armaBase && (
        <div className="opcoes-grandes" role="group" aria-label={`Manter a arma da ${TIPO_FORMA_NOME[deQuem]}?`}>
          <button type="button" className={`opcao ${mantem ? "on" : ""}`} aria-pressed={mantem} onClick={() => manter(true)}>
            <b>{mantem ? "✓ " : ""}Mantém a arma da {TIPO_FORMA_NOME[deQuem]}</b>
            <small>{armaBase.nome} · {resumoArma(armaBase)}</small>
          </button>
          <button type="button" className={`opcao ${!mantem ? "on" : ""}`} aria-pressed={!mantem} onClick={() => manter(false)}>
            <b>{!mantem ? "✓ " : ""}Outra arma</b>
            <small>{tipo === "bankai" ? (r.estilo === "transformadora" ? "A Transformadora pode ter uma arma muito diferente da Shikai." : "A Potencializadora costuma ficar perto da arma da Shikai.") : "Escolha outra arma, um conjunto de armas ou o próprio espírito."}</small>
          </button>
        </div>
      )}

      <div className="arma-atual" role="status" aria-live="polite">
        {arma ? (
          <>
            <div>
              <small className="ajuda">Arma da {nomeForma}{mantem ? ` (a mesma da ${TIPO_FORMA_NOME[deQuem!]})` : ""}</small>
              <b>{arma.nome}</b>
              {arma.informativa && <span className="marca-aval ok" title="Vem do modelo oficial">dado do modelo</span>}
              {armaPendente(arma) && <span className="marca-aval">aval do Mestre pendente</span>}
              <p className="ajuda">{resumoArma(arma)}{arma.nota ? ` · ${arma.nota}` : ""}</p>
            </div>
            {arma.fonte === "propria" && !mantem && (
              <label className="check"><input type="checkbox" checked={!armaPendente(arma)} onChange={(e) => mud({ arma: { ...arma, aval: e.target.checked ? "ok" : "pendente" } })} /> Aprovada pelo Mestre</label>
            )}
            {!mantem && <button type="button" className="link-perigo" onClick={tirar}>Tirar a arma</button>}
          </>
        ) : mantem ? (
          <p className="ajuda">A {TIPO_FORMA_NOME[deQuem!]} ainda não tem arma definida. Defina lá, ou escolha outra arma aqui.</p>
        ) : (
          <p className="ajuda"><b>Sem arma definida.</b> Todos os cartões ficam liberados e o golpe básico segue o da sua classe.</p>
        )}
      </div>
      {fora && <p className="aviso-mini">Perto da Shikai? A arma da Shikai é do grupo “{armaBase!.grupo}” e esta é de “{r.arma!.grupo}”. A Potencializadora costuma ficar no mesmo grupo; se a sua é muito diferente, escolha a Transformadora (o Mestre decide).</p>}

      <div className="abas-arma" role="tablist" aria-label="Arma e características">
        <button type="button" role="tab" id="aba-arma-arma" aria-selected={aba === "arma"} className={aba === "arma" ? "on" : ""} onClick={() => setAba("arma")}><span>Arma</span></button>
        <button type="button" role="tab" id="aba-arma-caracs" aria-selected={aba === "caracs"} className={`${aba === "caracs" ? "on" : ""}${cheio ? " cheia" : ""}`} onClick={() => setAba("caracs")}><span>Características da arma</span> <i>{marcadas.length}/{limite}</i></button>
      </div>

      {aba === "arma" && !mantem && (
        <div role="tabpanel" aria-labelledby="aba-arma-arma" className="painel-arma">
          <input className="seletor-busca" value={busca} onChange={(e) => { setBusca(e.target.value); setMostrar(POR_PAGINA); }} placeholder="Buscar arma" aria-label="Buscar arma" />
          <div className="filtros-pecas" role="group" aria-label="Grupo de armas">
            <button type="button" className={`chip chip-btn ${grupo === "" ? "on" : ""}`} aria-pressed={grupo === ""} onClick={() => { setGrupo(""); setMostrar(POR_PAGINA); }}>Todas</button>
            {grupos.map((g) => <button key={g} type="button" className={`chip chip-btn ${grupo === g ? "on" : ""}`} aria-pressed={grupo === g} onClick={() => { setGrupo(grupo === g ? "" : g); setMostrar(POR_PAGINA); }}>{g}</button>)}
          </div>
          <div className="cartas-hab galeria-cartoes galeria-armas galeria-padrao">
            {itens.slice(0, mostrar).map((a) => <CartaArma key={`${a.grupo}-${a.nome}`} a={a} classe={classe} escolhida={!!r.arma && r.arma.fonte !== "propria" && r.arma.nome === a.nome && r.arma.grupo === a.grupo && !r.arma.informativa} onEscolher={() => escolher(a)} />)}
          </div>
          {itens.length === 0 && <p className="aviso-mini">Nenhuma arma com esse nome. Tente outra palavra ou monte uma arma própria.</p>}
          {itens.length > mostrar && <button type="button" className="btn btn-paper" onClick={() => setMostrar(mostrar + POR_PAGINA)}>Mostrar mais ({itens.length - mostrar} restantes)</button>}
          <ArmaPropria tipo={tipo} atual={r.arma} onUsar={(a) => { mud({ arma: a, armaMantem: undefined }); setMsg(`${a.nome} entrou como arma própria, esperando o aval do Mestre.`); }} />
        </div>
      )}
      {aba === "arma" && mantem && (
        <div role="tabpanel" aria-labelledby="aba-arma-arma" className="painel-arma"><p className="ajuda">Você mantém a arma da {TIPO_FORMA_NOME[deQuem!]}. Escolha “Outra arma” acima para trocar.</p></div>
      )}

      {aba === "caracs" && (
        <div role="tabpanel" aria-labelledby="aba-arma-caracs" className="painel-arma">
          <p className="ajuda">
            Marque o que a sua arma é. Cartões que pedem uma característica ficam apagados, com o motivo, até você marcar uma delas.
            {" "}<Info>Basta UMA das características pedidas por cada cartão. Mudou de ideia? Desmarque e marque outra: o que já está montado não some.</Info>
          </p>
          <p className={`limite-arma${cheio ? " cheio" : ""}`} role="status">
            {marcadas.length} de {limite} características marcadas.{cheio ? ` Limite da ${nomeForma} atingido: desmarque uma para trocar.` : ""}
          </p>
          {sombra && <p className="aviso-mini">Sem arma definida todos os cartões já estão liberados. Escolha uma arma na aba Arma para as características valerem.</p>}
          <div className="chips-carac" role="group" aria-label="Características da arma">
            {CARACS_ARMA.map((c) => {
              const on = marcadas.includes(c.id);
              const pede = libera.filter((x) => x.req.includes(c.id));
              const nomes = pede.slice(0, 6).map((x) => x.nome).join(", ");
              return (
                <span key={c.id} className="chip-carac">
                  <button type="button" className={`chip chip-btn ${on ? "on" : ""}`} aria-pressed={on} disabled={(!on && cheio) || sombra} onClick={() => alternar(c.id)}>{on ? "✓ " : ""}{c.nome}</button>
                  <Info>{`${c.texto} Ajuda a montar: ${nomes || "nenhum cartão ainda"}${pede.length > 6 ? ` e mais ${pede.length - 6}` : ""}.`}</Info>
                </span>
              );
            })}
          </div>
          {marcadas.length > 0 && <p className="ajuda">Marcadas: {marcadas.map(nomeCaracArma).join(", ")}.</p>}
        </div>
      )}
      {msg && <p className="ajuda" role="status">{msg}</p>}
    </div>
  );
}
