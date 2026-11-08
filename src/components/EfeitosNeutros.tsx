import { useMemo, useState } from "react";
import { calcular, type Ficha, type FormaLib } from "../regras/ficha";
import { custoPeca, orcamentoDaForma, type CtxForma } from "../regras/efeitos-forma";
import { forcasDoTipo, ppDaForca, type Forca } from "../regras/cartoes";
import { LIMITE_TEXTO, DURACAO_FORCA } from "../regras/faixas-condicao";
import { NOME_FORCA, comAval, condicoesDoCartao, efeitoPendente, instanciarEfeito } from "../regras/efeitos-neutros";
import { classeDe } from "./EfeitosForma";
import { Info } from "./Dica";

const novoId = () => `fx-${Math.random().toString(36).slice(2, 9)}`;

interface Props {
  f: Ficha;
  tipo: FormaLib["tipo"];
  r: FormaLib;
  mud: (p: Partial<FormaLib>) => void;
}

const SOBRE: Record<Forca, string> = {
  leve: "Um incômodo: o alvo perde um pouco de vantagem. Dura até o fim do próximo turno.",
  medio: "Um peso de verdade: o alvo fica em desvantagem na luta. Dura até o fim do próximo turno dele.",
  forte: "Um golpe de mestre: o alvo perde o turno ou quase. Dura 1 turno, com salvaguarda.",
};

/** Os três cartões de efeito (leve, médio, forte): uma condição pronta da faixa certa ou um efeito escrito que o Mestre aprova. */
export function EfeitosNeutros({ f, tipo, r, mud }: Props) {
  const c = useMemo(() => calcular({ ...f, estado: { ...f.estado, liberado: "" } }), [f]);
  const ctx: CtxForma = { n: f.nivel, prof: c.prof, atr: c.atr };
  const forcas = forcasDoTipo(tipo);
  const efeitos = r.efeitos ?? [];
  const orc = orcamentoDaForma(f, tipo, r, ctx);
  const meus = efeitos.filter((e) => e.familia === "efeito");
  const [msg, setMsg] = useState("");
  const [tirando, setTirando] = useState("");
  const remover = (id: string) => mud({ efeitos: efeitos.filter((e) => e.id !== id) });

  return (
    <div className="caixa efeitos-forma efeitos-neutros">
      <h3>Cartões de efeito</h3>
      <p className="ajuda">
        Um efeito que a forma causa no alvo. Três tamanhos: leve ({forcas[0].pp} PP), médio ({forcas[1].pp} PP) e forte ({forcas[2].pp} PP){tipo === "shikai" ? " (na Shikai eles custam menos; de Bankai em diante custam 2, 4 e 6 PP)" : ""}. Escolha uma condição pronta da faixa do cartão ou escreva o efeito com as suas palavras.
        {" "}<Info>Efeito escrito precisa do aval do Mestre. Enquanto estiver pendente, ele vale só como texto na ficha. Os pontos são gastos do mesmo jeito.</Info>
      </p>
      <small className="ajuda">PP livres na forma: <b>{orc.livre}</b> de {orc.total}</small>

      {meus.length > 0 && (
        <ul className="efeitos-lista caracs-lista" aria-label="Efeitos da forma">
          {meus.map((e) => (
            <li key={e.id} className={`${e.confirmado ? "travado" : ""} ${efeitoPendente(e) ? "solto" : ""}`}>
              <div>
                <b>{e.nome}</b> <small>{custoPeca(e, ctx)} PP · {LIMITE_TEXTO[e.efeitoNeutro?.forca ?? "leve"]}{e.confirmado ? " · confirmado" : ""}</small>
                {e.efeitoNeutro?.modo === "livre" && e.efeitoNeutro.texto && <p className="ajuda">{e.efeitoNeutro.texto}</p>}
                {e.efeitoNeutro?.modo === "pronta" && <p className="ajuda">Ao acertar, o alvo fica {e.efeitoNeutro.condicao?.nome} ({e.efeitoNeutro.condicao?.salva ? "salvaguarda de Constituição, " : ""}{e.efeitoNeutro.condicao?.duracao}).</p>}
                {e.efeitoNeutro?.modo === "livre" && (
                  <label className="check">
                    <input type="checkbox" checked={!efeitoPendente(e)} onChange={(ev) => mud({ efeitos: efeitos.map((x) => (x.id === e.id ? comAval(x, ev.target.checked) : x)) })} />
                    Aprovado pelo Mestre
                  </label>
                )}
                {efeitoPendente(e) && <p className="aviso-mini">Aguardando o aval do Mestre: por enquanto vale só como texto.</p>}
              </div>
              {tirando === e.id ? (
                <span className="tirar-confirma">
                  <button type="button" className="link-perigo" onClick={() => { remover(e.id); setTirando(""); }}>Tirar mesmo</button>
                  <button type="button" className="btn-mini" onClick={() => setTirando("")}>Manter</button>
                </span>
              ) : (
                <button type="button" className="link-perigo" onClick={() => (e.confirmado ? setTirando(e.id) : remover(e.id))}>Tirar</button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="cartas-hab galeria-cartoes galeria-efeitos galeria-padrao">
        {forcas.map((fz) => (
          <CartaoEfeito key={fz.id} forca={fz.id} tipo={tipo} classe={classeDe(tipo)} livre={orc.livre} onAdicionar={(inst) => { mud({ efeitos: [...efeitos, inst] }); setMsg(`${inst.nome} entrou na forma (${fz.pp} PP).`); }} />
        ))}
      </div>
      {msg && <p className="ajuda" role="status">{msg}</p>}
    </div>
  );
}

function CartaoEfeito({ forca, tipo, classe, livre, onAdicionar }: { forca: Forca; tipo: string; classe: string; livre: number; onAdicionar: (i: ReturnType<typeof instanciarEfeito>) => void }) {
  const pp = ppDaForca(forca, tipo);
  const lista = condicoesDoCartao(forca);
  const [aba, setAba] = useState<"pronta" | "livre">("pronta");
  const [cond, setCond] = useState(lista[0]);
  const [nome, setNome] = useState("");
  const [texto, setTexto] = useState("");
  const [onde, setOnde] = useState("");
  const sem = pp > livre;
  const vazio = aba === "livre" && texto.trim().length < 5;
  return (
    <article className="carta-hab carta-peca carta-neutra carta-efeito carta-padrao" data-classe={classe} data-forca={forca}>
      <div className="carta-topo">
        <small className="ajuda">{LIMITE_TEXTO[forca]}</small>
        <span className="selo-pp">{pp}<i>PP</i></span>
      </div>
      <h3>{NOME_FORCA[forca]}</h3>
      <p className="texto-carta">{SOBRE[forca]}</p>
      <div className="filtros-pecas" role="group" aria-label={`Como montar o ${NOME_FORCA[forca].toLowerCase()}`}>
        <button type="button" className={`chip chip-btn ${aba === "pronta" ? "on" : ""}`} aria-pressed={aba === "pronta"} onClick={() => setAba("pronta")}>Condição pronta</button>
        <button type="button" className={`chip chip-btn ${aba === "livre" ? "on" : ""}`} aria-pressed={aba === "livre"} onClick={() => setAba("livre")}>Escrever o efeito</button>
      </div>
      <div className="opcoes-carta">
      {aba === "pronta" ? (
        <label className="campo">Condição ({lista.length} da faixa {forca === "medio" ? "média" : forca === "leve" ? "leve" : "forte"})
          <select value={cond} onChange={(e) => setCond(e.target.value)}>{lista.map((n) => <option key={n} value={n}>{n}</option>)}</select>
          <small className="ajuda">Ao acertar, o alvo faz salvaguarda de Constituição. Dura {DURACAO_FORCA[forca]}. Não precisa de aval.</small>
        </label>
      ) : (
        <>
          <label className="campo">Nome do efeito<input value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Marca da Vespa" /></label>
          <label className="campo">O que acontece<textarea rows={3} maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva o efeito com as suas palavras." /></label>
          <label className="campo">Quando ou onde (opcional)<input value={onde} maxLength={60} onChange={(e) => setOnde(e.target.value)} placeholder="Ex.: ao acertar um alvo marcado" /></label>
          <p className="ajuda">Precisa do aval do Mestre. Pendente, vale só como texto.</p>
        </>
      )}
      </div>
      <div className="rodape-carta">
      <button type="button" className="btn-mini" disabled={sem || vazio} onClick={() => {
        onAdicionar(aba === "pronta"
          ? instanciarEfeito({ forca, modo: "pronta", condicao: { nome: cond, salva: "con", duracao: DURACAO_FORCA[forca] } }, novoId(), undefined, tipo)
          : instanciarEfeito({ forca, modo: "livre", texto: texto.trim(), ...(onde.trim() ? { onde: onde.trim() } : {}), aval: "pendente" }, novoId(), nome, tipo));
        if (aba === "livre") { setNome(""); setTexto(""); setOnde(""); }
      }}>{sem ? "Pontos insuficientes" : vazio ? "Escreva o efeito" : "Adicionar"}</button>
      </div>
    </article>
  );
}
