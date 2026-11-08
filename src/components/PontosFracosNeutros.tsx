import { useMemo, useState } from "react";
import { calcular, type Ficha, type FormaLib } from "../regras/ficha";
import type { CtxForma } from "../regras/efeitos-forma";
import { forcasDoTipo, ppDaForca, type Forca } from "../regras/cartoes";
import { NOME_FRACO, comAvalFraco, fracoPendente, instanciarFraco, prejuizoPorId, prejuizosDaFaixa } from "../regras/fracos-neutros";
import { classeDe } from "./EfeitosForma";
import { Info } from "./Dica";

const novoId = () => `pf-${Math.random().toString(36).slice(2, 9)}`;

interface Props {
  f: Ficha;
  tipo: FormaLib["tipo"];
  r: FormaLib;
  mud: (p: Partial<FormaLib>) => void;
}

const SOBRE: Record<Forca, string> = {
  leve: "Um preço pequeno: incomoda, mas a forma continua inteira.",
  medio: "Um preço de verdade: você sente a perda durante a luta.",
  forte: "Um preço pesado: pode custar o fim da forma. Fica fora do limite de um terço.",
};

/** Os três cartões de ponto fraco (leve, médio, forte): um prejuízo pronto da faixa ou um escrito que o Mestre aprova. Devolvem pontos para a forma. */
export function PontosFracosNeutros({ f, tipo, r, mud }: Props) {
  const c = useMemo(() => calcular({ ...f, estado: { ...f.estado, liberado: "" } }), [f]);
  const ctx: CtxForma = { n: f.nivel, prof: c.prof, atr: c.atr };
  const forcas = forcasDoTipo(tipo);
  const efeitos = r.efeitos ?? [];
  const meus = efeitos.filter((e) => e.familia === "fraco");
  const [msg, setMsg] = useState("");
  const [tirando, setTirando] = useState("");
  const remover = (id: string) => mud({ efeitos: efeitos.filter((e) => e.id !== id) });
  const botaoTirar = (e: (typeof efeitos)[number]) => tirando === e.id ? (
    <span className="tirar-confirma">
      <button type="button" className="link-perigo" onClick={() => { remover(e.id); setTirando(""); }}>Tirar mesmo</button>
      <button type="button" className="btn-mini" onClick={() => setTirando("")}>Manter</button>
    </span>
  ) : (
    <button type="button" className="link-perigo" onClick={() => (e.confirmado ? setTirando(e.id) : remover(e.id))}>Tirar</button>
  );

  return (
    <div className="caixa efeitos-forma efeitos-neutros pontos-fracos-neutros">
      <h3>Cartões de ponto fraco (leve, médio e forte)</h3>
      <p className="ajuda">
        Um preço que a forma cobra de você. Três tamanhos, e quanto mais pesado, mais pontos ele devolve: leve ({forcas[0].pp} PP), médio ({forcas[1].pp} PP) e forte ({forcas[2].pp} PP){tipo === "shikai" ? " (na Shikai devolvem menos; de Bankai em diante devolvem 2, 4 e 6 PP)" : ""}.
        {" "}<Info>Leve e médio contam no limite de um terço do total de PP da forma. O forte fica fora desse limite, até 9 pontos no total. Ponto fraco escrito só devolve pontos depois do aval do Mestre.</Info>
      </p>

      {meus.length > 0 && (
        <ul className="efeitos-lista caracs-lista" aria-label="Pontos fracos da forma">
          {meus.map((e) => (
            <li key={e.id} className={`${e.confirmado ? "travado" : ""} ${fracoPendente(e) ? "solto" : ""}`}>
              <div>
                <b>{e.nome}</b> <small>{fracoPendente(e) ? "0 PP devolvidos (falta o aval)" : `devolve ${e.fracoNeutro?.devolve ?? 0} PP`}{e.confirmado ? " · confirmado" : ""}</small>
                <p className="ajuda">{e.fracoNeutro?.modo === "pronta" ? prejuizoPorId(e.fracoNeutro.prejuizo)?.texto : e.fracoNeutro?.texto}{e.fracoNeutro?.param ? ` (${e.fracoNeutro.param})` : ""}</p>
                {e.fracoNeutro?.modo === "livre" && (
                  <label className="check">
                    <input type="checkbox" checked={!fracoPendente(e)} onChange={(ev) => mud({ efeitos: efeitos.map((x) => (x.id === e.id ? comAvalFraco(x, ev.target.checked) : x)) })} />
                    Aprovado pelo Mestre
                  </label>
                )}
                {fracoPendente(e) && <p className="aviso-mini">Aguardando o aval do Mestre: por enquanto vale só como texto e não devolve pontos.</p>}
              </div>
              {botaoTirar(e)}
            </li>
          ))}
        </ul>
      )}

      <div className="cartas-hab galeria-cartoes galeria-efeitos galeria-padrao">
        {forcas.map((fz) => (
          <CartaoFraco key={fz.id} forca={fz.id} tipo={tipo} classe={classeDe(tipo)} onAdicionar={(inst) => { mud({ efeitos: [...efeitos, inst], ...(!r.pontoFraco.trim() && inst.texto ? { pontoFraco: `${inst.nome}: ${inst.texto}` } : {}) }); setMsg(`${inst.nome} entrou na forma.`); }} />
        ))}
      </div>
      {msg && <p className="ajuda" role="status">{msg}</p>}
    </div>
  );
}

function CartaoFraco({ forca, tipo, classe, onAdicionar }: { forca: Forca; tipo: string; classe: string; onAdicionar: (i: ReturnType<typeof instanciarFraco>) => void }) {
  const pp = ppDaForca(forca, tipo);
  const lista = prejuizosDaFaixa(forca);
  const [aba, setAba] = useState<"pronta" | "livre">("pronta");
  const [escolha, setEscolha] = useState(lista[0].id);
  const [param, setParam] = useState("");
  const [nome, setNome] = useState("");
  const [texto, setTexto] = useState("");
  const [onde, setOnde] = useState("");
  const atual = prejuizoPorId(escolha) ?? lista[0];
  const vazio = aba === "livre" && texto.trim().length < 5;
  return (
    <article className="carta-hab carta-peca carta-neutra carta-efeito carta-fraco carta-padrao" data-classe={classe} data-forca={forca}>
      <div className="carta-topo">
        <small className="ajuda">{forca === "forte" ? "fora do teto de 1/3" : "dentro do teto de 1/3"}</small>
        <span className="selo-pp">+{pp}<i>PP</i></span>
      </div>
      <h3>{NOME_FRACO[forca]}</h3>
      <p className="texto-carta">{SOBRE[forca]}</p>
      <div className="filtros-pecas" role="group" aria-label={`Como montar o ${NOME_FRACO[forca].toLowerCase()}`}>
        <button type="button" className={`chip chip-btn ${aba === "pronta" ? "on" : ""}`} aria-pressed={aba === "pronta"} onClick={() => setAba("pronta")}>Prejuízo pronto</button>
        <button type="button" className={`chip chip-btn ${aba === "livre" ? "on" : ""}`} aria-pressed={aba === "livre"} onClick={() => setAba("livre")}>Escrever o ponto fraco</button>
      </div>
      <div className="opcoes-carta">
        {aba === "pronta" ? (
          <>
            <label className="campo">Prejuízo ({lista.length} da faixa)
              <select value={escolha} onChange={(e) => setEscolha(e.target.value)}>{lista.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
              <small className="ajuda">{atual.texto} Não precisa de aval.</small>
            </label>
            {atual.param && <label className="campo">{atual.param.rotulo}<input value={param} maxLength={30} onChange={(e) => setParam(e.target.value)} placeholder={atual.param.padrao} /></label>}
          </>
        ) : (
          <>
            <label className="campo">Nome do ponto fraco<input value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Lâmina que sangra" /></label>
            <label className="campo">O que acontece<textarea rows={3} maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva o preço com as suas palavras." /></label>
            <label className="campo">Quando ou onde (opcional)<input value={onde} maxLength={60} onChange={(e) => setOnde(e.target.value)} placeholder="Ex.: ao usar a técnica final" /></label>
            <p className="ajuda">Precisa do aval do Mestre. Pendente, vale só como texto e não devolve pontos.</p>
          </>
        )}
      </div>
      <div className="rodape-carta">
        <button type="button" className="btn-mini" disabled={vazio} onClick={() => {
          onAdicionar(aba === "pronta"
            ? instanciarFraco({ forca, modo: "pronta", prejuizo: atual.id, ...(atual.param ? { param: param.trim() || atual.param.padrao } : {}) }, novoId(), undefined, tipo)
            : instanciarFraco({ forca, modo: "livre", texto: texto.trim(), ...(onde.trim() ? { onde: onde.trim() } : {}), aval: "pendente" }, novoId(), nome, tipo));
          if (aba === "livre") { setNome(""); setTexto(""); setOnde(""); }
        }}>{vazio ? "Escreva o ponto fraco" : "Adicionar"}</button>
      </div>
    </article>
  );
}
