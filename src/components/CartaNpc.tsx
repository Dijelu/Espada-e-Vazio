import { formaNpc, modelosParaNpc } from "../regras/forma-npc";
import { MASCARAS, type TipoMascara } from "../regras/mascara";
import { useState } from "react";
import {
  ATRS, CATEGORIAS, ESTILOS, GRAUS, acoesDoEstado, bonusDaMascara, calcularAmeaca, distribuir, efeitosDaLiberacao, estadoDoNpc, estadoValido, liberacaoPadrao, marcasDoEstado, nomeDoEstado, normalizarAmeaca, pontosDeAtributo, resumoEtapaAnterior, resumoMascara,
  type EstadoNpc, type EtapaAnterior, type LiberacaoAmeaca, type MascaraNpc,
  type Ameaca, type ChaveAtr, type Categoria, type Modo,
} from "../regras/ameacas";
import type { Npc } from "../lib/campanhas";
import { Info } from "./Dica";

const MODOS: { id: Modo; nome: string; ajuda: string }[] = [
  { id: "comum", nome: "Ameaça comum", ajuda: "Os valores da tabela do livro, sem ajuste." },
  { id: "pareado", nome: "NPC pareado", ajuda: "Rival de um jogador: PV e dados de dano multiplicados pelo fator k do nível." },
  { id: "suporte", nome: "NPC de suporte", ajuda: "Par do Curandeiro: pareado com o fator de suporte." },
  { id: "boss", nome: "Boss de grupo", ajuda: "Pareado × número de jogadores × 1,8 (2,3 do 11º nível em diante)." },
];

interface Props {
  npc: Npc;
  onMudar: (n: Npc, salvar?: boolean) => void;
  onSalvar: (n: Npc) => void;
  onApagar: (n: Npc) => void;
  onModelo: (n: Npc) => void;
  onDuplicar: (n: Npc) => void;
}

/** Texto corrido do livro em parágrafos separados, com o título (antes dos dois-pontos) em negrito. */
function Paragrafos({ texto }: { texto: string }) {
  return (
    <div className="npc-texto">
      {texto.split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => {
        const m = /^([^:.]{2,40}):\s*(.*)$/.exec(l);
        return m ? <p key={i}><b>{m[1]}:</b> {m[2]}</p> : <p key={i}>{l}</p>;
      })}
    </div>
  );
}

/** Ficha de um NPC do Mestre: resumo para jogar e, recolhido, o formulário de criação do livro. */
export function CartaNpc({ npc, onMudar, onSalvar, onApagar, onModelo, onDuplicar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [aberta, setAberta] = useState(false);
  const [avisoLib, setAvisoLib] = useState("");
  /** texto da pasta enquanto o Mestre digita; só vale (e muda o NPC de grupo) ao sair do campo */
  const [pastaEd, setPastaEd] = useState<string | null>(null);
  /** máscara ligada nesta tela (null = a do NPC salvo); só fica salva quando está sozinha e o NPC não tem Shikai */
  const [mascaraLocal, setMascaraLocal] = useState<boolean | null>(null);
  const am = npc.dados.ameaca;
  const lib = am.liberacao;
  const salvo = estadoDoNpc(am, npc.dados.liberado, npc.dados.antes, npc.dados.mascara);
  /** forma principal (base, Shikai ou Bankai) + máscara por cima */
  const estado = estadoValido(am, { forma: salvo.forma, mascara: mascaraLocal ?? salvo.mascara });
  const liberado = estado.forma === "bankai";
  const temEtapas = !!(lib.antes || lib.mascara);
  const c = calcularAmeaca(am, estado);
  const resAntes = lib.existe && lib.antes ? resumoEtapaAnterior(am) : null;
  const resMasc = lib.existe && lib.mascara ? resumoMascara(am, estado.forma) : null;
  const pv = Math.min(npc.dados.pvAtual ?? c.pv, c.pv);
  const pr = Math.min(npc.dados.prAtual ?? c.pr, c.pr);
  const raid = am.formato === "raid";

  const mudarAmeaca = (parte: Partial<Ameaca>, salvar = false) => {
    const nova = normalizarAmeaca({ ...am, ...parte });
    onMudar({ ...npc, dados: { ...npc.dados, ameaca: nova } }, salvar);
  };
  const mudarDados = (parte: Partial<Npc["dados"]>, salvar = true) => onMudar({ ...npc, dados: { ...npc.dados, ...parte } }, salvar);
  const ajustar = (campo: "pvAtual" | "prAtual", atual: number, max: number, d: number) =>
    mudarDados({ [campo]: Math.max(0, Math.min(max, atual + d)) } as Partial<Npc["dados"]>);
  const fm = formaNpc(am);
  /** forma cujas habilidades aparecem no resumo: a da etapa ativa */
  const fmAtiva = liberado ? fm : estado.forma === "shikai" ? resAntes?.forma ?? null : null;
  const mudarLib = (parte: Partial<LiberacaoAmeaca>, salvar = false) => mudarAmeaca({ liberacao: { ...lib, ...parte } }, salvar);
  const alternarLiberacao = () => {
    if (!liberado) {
      const ef = efeitosDaLiberacao(am);
      const novoMax = calcularAmeaca(am, true).pv;
      mudarDados({ liberado: true, pvAtual: Math.min(novoMax, pv + ef.curaPv) });
      setAvisoLib(ef.dano > 0 ? `${lib.nome}! Todos os inimigos que o vejam sofrem ${ef.dano} de dano ${ef.tipo}.${ef.curaPv > 0 ? ` Recupera ${ef.curaPv} PV.` : ""}` : `${lib.nome}!${ef.curaPv > 0 ? ` Recupera ${ef.curaPv} PV.` : ""}`);
    } else {
      mudarDados({ liberado: false, pvAtual: Math.min(pv, calcularAmeaca(am, false).pv) });
      setAvisoLib("");
    }
  };
  /** NPC com Shikai e/ou máscara: troca a forma principal (a Bankai substitui a Shikai) e/ou a máscara (soma por cima),
   *  mantendo o PV/PR atual (limitado ao novo máximo; aumento de máximo soma a diferença). */
  const trocarEstado = (alvo: EstadoNpc) => {
    const para = estadoValido(am, alvo);
    const depois = calcularAmeaca(am, para);
    const entraBankai = para.forma === "bankai" && estado.forma !== "bankai";
    const ef = entraBankai ? efeitosDaLiberacao(am) : { dano: 0, tipo: "", curaPv: 0 };
    const pvN = Math.max(0, Math.min(depois.pv, pv + Math.max(0, depois.pv - c.pv) + ef.curaPv));
    const prN = Math.max(0, Math.min(depois.pr, pr + Math.max(0, depois.pr - c.pr)));
    setMascaraLocal(para.mascara);
    mudarDados({ ...marcasDoEstado(am, para), pvAtual: pvN, prAtual: prN });
    if (para.forma === "base" && !para.mascara) { setAvisoLib(""); return; }
    const corpo = para.mascara && !estado.mascara ? bonusDaMascara(am, para.forma).filter((n) => /Corpo Hollow$/.test(n.nome)).map((n) => ` ${n.nome}: ${n.texto}`).join("") : "";
    const extra = entraBankai ? `${ef.dano > 0 ? ` Todos os inimigos que o vejam sofrem ${ef.dano} de dano ${ef.tipo}.` : ""}${ef.curaPv > 0 ? ` Recupera ${ef.curaPv} PV.` : ""}` : "";
    setAvisoLib(`${nomeDoEstado(am, para)}!${extra}${corpo}`);
  };
  const mudarAntes = (antes: EtapaAnterior | undefined) => mudarAmeaca({ liberacao: { ...lib, antes } }, true);
  const mudarMascara = (mascara: MascaraNpc | undefined) => mudarAmeaca({ liberacao: { ...lib, mascara } }, true);
  const shikais = am.categoria === "shinigami" ? modelosParaNpc("shinigami").filter((x) => x.ref.tipo === "shikai") : [];
  const rotuloShikai = (r: string) => `Shikai ${r.split(" · ").slice(1).join(" · ")}`.trim();
  const num = (v: string) => (v === "" ? 0 : Number(v) || 0);
  const trocarCategoria = (categoria: Categoria) => {
    const pontos = pontosDeAtributo({ categoria, formato: am.formato, nd: am.nd, grau: 0 });
    mudarAmeaca({ categoria, grau: 0, atr: distribuir(pontos, "equilibrado") }, true);
  };
  const reDistribuir = (estilo: string) => mudarAmeaca({ atr: distribuir(c.pontos, estilo) }, true);
  const excesso = c.usados - c.pontos;

  return (
    <article className={`npc${aberta ? " aberta" : ""}`}>
      <button type="button" className="npc-toggle" aria-expanded={aberta} onClick={() => setAberta((v) => !v)}>
        <span className="npc-toggle-nome">{npc.nome}</span>
        <span className="npc-toggle-info">{!temEtapas ? (liberado ? `${lib.nome} liberado · ` : "") : nomeDoEstado(am, estado) ? `Ativo: ${nomeDoEstado(am, estado)} · ` : ""}{am.titulo ? `${am.titulo} · ` : ""}ND {c.nd} · {c.grauNome} · PV {pv}/{c.pv} · PR {pr}/{c.pr}</span>
        <span className="npc-toggle-seta" aria-hidden="true">{aberta ? "Recolher" : "Abrir"}</span>
      </button>
      {aberta && <div className="npc-corpo">
      <div className="npc-cabeca">
        <label className="campo npc-nome">Nome
          <input value={npc.nome} maxLength={80} onChange={(e) => onMudar({ ...npc, nome: e.target.value })} onBlur={() => onSalvar(npc)} />
        </label>
        <p className="npc-resumo">
          {CATEGORIAS.find((x) => x.id === am.categoria)?.nome} · {c.grauNome} · ND {c.nd} · {raid ? "Raid" : "Solo"}
          {am.modo !== "comum" && !raid ? ` · ${MODOS.find((m) => m.id === am.modo)?.nome}` : ""}
        </p>
      </div>

      <div className="npc-numeros">
        <div><small>CR</small><b>{c.cr}</b></div>
        <div><small>Prof.</small><b>+{c.prof}</b></div>
        <div><small>Percepção</small><b>{c.percepcao}</b></div>
        <div><small>Perc. Esp.</small><b>{c.percepcaoEsp}</b></div>
      </div>

      {lib.existe && (
        <div className="npc-liberar">
          {!temEtapas && <button type="button" className={`btn ${liberado ? "btn-paper" : "btn-red"}`} onClick={alternarLiberacao}>{liberado ? `Encerrar ${lib.nome}` : `Liberar ${lib.nome}`}</button>}
          {lib.antes && estado.forma === "base" && <button type="button" className="btn btn-red" onClick={() => trocarEstado({ forma: "shikai", mascara: estado.mascara })}>Liberar {lib.antes.nome}</button>}
          {temEtapas && !liberado && <button type="button" className="btn btn-red" onClick={() => trocarEstado({ forma: "bankai", mascara: estado.mascara })}>Liberar {lib.nome}</button>}
          {lib.mascara && <button type="button" className={`btn ${estado.mascara ? "btn-paper" : "btn-red"}`} onClick={() => trocarEstado({ forma: estado.forma, mascara: !estado.mascara })}>{estado.mascara ? `Tirar ${lib.mascara.nome}` : `Pôr ${lib.mascara.nome}`}</button>}
          {temEtapas && (estado.forma !== "base" || estado.mascara) && <button type="button" className="btn btn-paper" onClick={() => trocarEstado({ forma: "base", mascara: false })}>Encerrar formas</button>}
          {liberado && <small>CR +{lib.bonusCr} e atributos mudados enquanto liberado.</small>}
          {estado.forma === "shikai" && resAntes && <small>CR {resAntes.cr >= 0 ? "+" : ""}{resAntes.cr} enquanto {lib.antes?.nome} está ativa.</small>}
          {estado.mascara && resMasc && <small>{resMasc.nome}: {[resMasc.cr ? `CR ${resMasc.cr > 0 ? "+" : ""}${resMasc.cr}` : "", resMasc.pvTemp > 0 ? `+${resMasc.pvTemp} PV` : "", resMasc.prTemp > 0 ? `+${resMasc.prTemp} PR` : ""].filter(Boolean).join(", ")}{resMasc.pvTemp > 0 || resMasc.prTemp > 0 ? " temporários" : ""}{estado.forma !== "base" ? `, por cima de ${estado.forma === "bankai" ? lib.nome : lib.antes?.nome}` : ""}.</small>}
          {avisoLib && <p className="aviso" role="status">{avisoLib}</p>}
        </div>
      )}
      <div className="npc-barra">
        <div className="npc-linha"><b>PV {pv}/{c.pv}</b>
          <span className="npc-botoes">{[-10, -5, -1, 1, 5, 10].map((d) => <button type="button" key={d} className="btn btn-paper" aria-label={`${d > 0 ? "Somar" : "Tirar"} ${Math.abs(d)} PV de ${npc.nome}`} onClick={() => ajustar("pvAtual", pv, c.pv, d)}>{d > 0 ? `+${d}` : d}</button>)}</span>
        </div>
        <div className="npc-linha"><b>PR {pr}/{c.pr}</b>
          <span className="npc-botoes">{[-10, -5, -1, 1, 5, 10].map((d) => <button type="button" key={d} className="btn btn-paper" aria-label={`${d > 0 ? "Somar" : "Tirar"} ${Math.abs(d)} PR de ${npc.nome}`} onClick={() => ajustar("prAtual", pr, c.pr, d)}>{d > 0 ? `+${d}` : d}</button>)}</span>
        </div>
      </div>

      <ul className="npc-atr">
        {ATRS.map((a) => <li key={a.id}><small>{a.nome.slice(0, 3).toUpperCase()}</small><b>{am.atr[a.id]}</b></li>)}
      </ul>

      {(am.zanpakutou.nome || am.zanpakutou.shikai || am.zanpakutou.bankai) && (
        <details className="npc-hab">
          <summary>Zanpakutō{am.zanpakutou.nome ? `: ${am.zanpakutou.nome}` : ""}</summary>
          {am.zanpakutou.shikai && <><b>Shikai</b><Paragrafos texto={am.zanpakutou.shikai} /></>}
          {am.zanpakutou.bankai && <><b>Bankai</b><Paragrafos texto={am.zanpakutou.bankai} /></>}
        </details>
      )}
      {(c.rdFis > 0 || c.rdEso > 0) && <p className="ajuda"><b>RD:</b> física {c.rdFis} · esotérica {c.rdEso}{c.rdMascara > 0 ? ` (inclui ${c.rdMascara} da Máscara do Predador)` : ""}. Reduz cada golpe sofrido.</p>}
      {c.hierro && <p className="ajuda"><b>Hierro:</b> dano físico sofrido pela metade (não reduz energia nem dano esotérico).</p>}
      {c.ataques.map((a, i) => <p key={`${i}-${a.nome}`} className="npc-acao"><b>{a.nome}:</b> +{a.acerto} para acertar · {a.dano} {a.tipo} <small>(média {a.media.toFixed(1).replace(/\.0$/, "")}{a.mascara ? ` · máscara ${a.mascara}` : ""})</small></p>)}
      {c.tecnicas.map((t, i) => <p key={`${i}-${t.nome}`} className="npc-acao"><b>{t.nome}</b> ({t.custo} PR): {t.dados} · CD {t.cd}{t.mascara ? <small> (máscara {t.mascara})</small> : null}{t.texto ? ` — ${t.texto}` : ""}</p>)}
      {fmAtiva && (
        <details className="npc-forma-lista recolhe">
          <summary><b>{estado.forma === "shikai" && lib.antes ? `${lib.antes.nome} · ${fmAtiva.nome}` : fmAtiva.nome}</b> <small>{acoesDoEstado(am, estado).length + fmAtiva.invocacoes.length + fmAtiva.notas.length} habilidades</small></summary>
          {acoesDoEstado(am, estado).map((a, i) => <p key={`${i}-${a.nome}`} className="npc-acao"><b>{a.nome}</b>{a.custo ? ` (${a.custo} PR)` : ""}: {a.tipo === "ataque" ? `+${a.acerto} para acertar` : `CD ${a.cd}`} · {a.dano}{a.mascara ? <small> (máscara {a.mascara})</small> : null}</p>)}
          {fmAtiva.invocacoes.map((v) => <p key={v.chave} className="npc-acao"><b>Invocar {v.nome}</b>{v.custoPr ? ` (${v.custoPr} PR)` : ""}: até {v.max} · {v.pv} PV · CR {v.cr}</p>)}
          {fmAtiva.notas.map((n, i) => <p key={`${i}-${n.nome}`} className="npc-acao"><b>{n.nome}:</b> {n.texto}</p>)}
        </details>
      )}
      {estado.mascara && lib.mascara && resMasc && (
        <details className="npc-forma-lista recolhe">
          <summary><b>{lib.mascara.nome}{estado.forma !== "base" ? ` (por cima de ${estado.forma === "bankai" ? lib.nome : lib.antes?.nome})` : ""}</b> <small>{resMasc.notas.length} efeitos</small> <Info>Os dados e a CD acima já contam a máscara (marcados "máscara").</Info></summary>
          {resMasc.notas.map((n, i) => <p key={`${i}-${n.nome}`} className="npc-acao"><b>{n.nome}:</b> {n.texto}</p>)}
        </details>
      )}
      {am.caracteristicas && <Paragrafos texto={am.caracteristicas} />}
      {am.habilidades.map((h, i) => (
        <details className="npc-hab" key={i}>
          <summary>{h.titulo}</summary>
          <Paragrafos texto={h.texto} />
        </details>
      ))}

      <details className="npc-edicao" open={aberto} onToggle={(e) => setAberto((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>Montar ameaça (regras do livro)</summary>
        <div className="npc-form">
          <label className="campo npc-larga">Título (cargo, divisão, apelido)
            <input value={am.titulo} maxLength={80} placeholder="Ex.: Capitão da 11ª Divisão" onChange={(e) => mudarAmeaca({ titulo: e.target.value })} onBlur={() => onSalvar(npc)} />
          </label>
          <label className="campo">Categoria
            <select value={am.categoria} onChange={(e) => trocarCategoria(e.target.value as Categoria)}>
              {CATEGORIAS.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
            </select>
          </label>
          <label className="campo">Formato
            <select value={am.formato} onChange={(e) => mudarAmeaca({ formato: e.target.value as Ameaca["formato"], ...(e.target.value === "raid" ? { modo: "comum" as Modo } : {}) }, true)}>
              <option value="solo">Solo (1 personagem)</option>
              <option value="raid">Raid (grupo de 4 a 5)</option>
            </select>
          </label>
          <label className="campo">Nível de Desafio
            <input type="number" min={1} max={20} value={am.nd} onChange={(e) => mudarAmeaca({ nd: num(e.target.value) || 1 })} onBlur={() => onSalvar(npc)} />
          </label>
          <label className="campo">Grau
            <select value={am.grau} onChange={(e) => mudarAmeaca({ grau: Number(e.target.value) }, true)}>
              {GRAUS[am.categoria].map((g, i) => <option key={g.nome} value={i}>{g.nome}{g.cr || g.atr ? ` (CR +${g.cr}, atributos +${g.atr})` : ""}</option>)}
            </select>
          </label>
          <label className="campo">Resistência (CR)
            <select value={am.dificuldade} onChange={(e) => mudarAmeaca({ dificuldade: e.target.value as Ameaca["dificuldade"] }, true)}>
              <option value="facil">Fácil</option>
              <option value="medio">Médio (padrão do livro)</option>
              <option value="dificil">Difícil</option>
            </select>
          </label>
          <label className="campo">Papel no combate
            <select value={raid ? "comum" : am.modo} disabled={raid} onChange={(e) => mudarAmeaca({ modo: e.target.value as Modo }, true)}>
              {MODOS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </label>
          {!raid && <p className="ajuda npc-larga">{MODOS.find((m) => m.id === am.modo)?.ajuda}{am.modo !== "comum" ? ` Fator k deste nível: ${c.k}.` : ""}</p>}
          {raid && <p className="ajuda npc-larga">Ameaças Raid usam PV × 4 e PR × 2; os papéis de duelo valem só para Solo.</p>}
          {am.modo === "boss" && !raid && (
            <label className="campo">Jogadores na mesa
              <input type="number" min={1} max={8} value={am.jogadores} onChange={(e) => mudarAmeaca({ jogadores: num(e.target.value) || 1 })} onBlur={() => onSalvar(npc)} />
            </label>
          )}
          <label className="campo">PV extra (%) <small>5v5 e ajuste de mesa</small>
            <input type="number" min={-50} max={100} value={am.pvExtra} onChange={(e) => mudarAmeaca({ pvExtra: num(e.target.value) })} onBlur={() => onSalvar(npc)} />
          </label>
        </div>

        <h4 className="sub-passivas">Atributos <small className={excesso === 0 ? "" : "npc-erro"}>{c.usados} de {c.pontos} pontos{excesso > 0 ? ` (${excesso} a mais)` : excesso < 0 ? ` (${-excesso} sobrando)` : ""}</small></h4>
        <div className="npc-estilos">
          {ESTILOS.map((e) => <button type="button" key={e.id} className="btn btn-paper" onClick={() => reDistribuir(e.id)}>{e.nome}</button>)}
        </div>
        <div className="npc-nums">
          {ATRS.map((a) => (
            <label className="campo" key={a.id}>{a.nome}
              <input type="number" min={0} max={40} value={am.atr[a.id]} onChange={(e) => mudarAmeaca({ atr: { ...am.atr, [a.id]: num(e.target.value) } })} onBlur={() => onSalvar(npc)} />
            </label>
          ))}
        </div>

        <h4 className="sub-passivas">Ataques</h4>
        {am.ataques.map((a, i) => (
          <div className="npc-item" key={i}>
            <label className="campo">Nome<input value={a.nome} onChange={(e) => mudarAmeaca({ ataques: am.ataques.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">Atributo
              <select value={a.atr} onChange={(e) => mudarAmeaca({ ataques: am.ataques.map((x, j) => (j === i ? { ...x, atr: e.target.value as ChaveAtr } : x)) }, true)}>
                {ATRS.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
              </select>
            </label>
            <label className="campo">Dados<input value={a.dados} placeholder="1d8" onChange={(e) => mudarAmeaca({ ataques: am.ataques.map((x, j) => (j === i ? { ...x, dados: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">Custo (PR)<input type="number" min={0} value={a.custo ?? 0} onChange={(e) => mudarAmeaca({ ataques: am.ataques.map((x, j) => (j === i ? { ...x, custo: num(e.target.value) } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">Crítico a partir de<input type="number" min={15} max={20} value={a.crit ?? 20} onChange={(e) => mudarAmeaca({ ataques: am.ataques.map((x, j) => (j === i ? { ...x, crit: num(e.target.value) || 20 } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">Tipo de dano<input value={a.tipo} placeholder="Cortante" onChange={(e) => mudarAmeaca({ ataques: am.ataques.map((x, j) => (j === i ? { ...x, tipo: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <button type="button" className="link-perigo" onClick={() => mudarAmeaca({ ataques: am.ataques.filter((_, j) => j !== i) }, true)}>Remover ataque</button>
          </div>
        ))}
        {am.ataques.length < 8 && <button type="button" className="btn btn-paper" onClick={() => mudarAmeaca({ ataques: [...am.ataques, { nome: "Novo ataque", atr: "for", dados: "1d8", tipo: "" }] }, true)}>Adicionar ataque</button>}

        <h4 className="sub-passivas">Forma liberada ({lib.nome})</h4>
        <label className="marcar"><input type="checkbox" checked={lib.existe} onChange={(e) => mudarLib(e.target.checked && lib.bonusCr === 0 && Object.values(lib.bonusAtr).every((v) => v === 0) ? { ...liberacaoPadrao(am), nome: lib.nome } : { existe: e.target.checked }, true)} /> Esta ameaça tem {lib.nome}</label>
        {modelosParaNpc(am.categoria).length > 0 && (
          <div className="npc-item modelo-forma-npc">
            <label className="campo npc-larga"><span>Modelo pronto de forma <Info>Os cartões de característica do modelo já entram no CR e nos atributos da forma liberada e as habilidades viram botões no combate.</Info></span>
              <select
                value={lib.modelo ? `${lib.modelo.tipo}:${lib.modelo.id}` : ""}
                onChange={(e) => {
                  const op = modelosParaNpc(am.categoria).find((x) => `${x.ref.tipo}:${x.ref.id}` === e.target.value);
                  if (!op) { mudarLib({ modelo: undefined }, true); return; }
                  mudarLib({ existe: true, modelo: op.ref, nome: op.rotulo.split(" · ").slice(1).join(" · ") || lib.nome }, true);
                }}
              >
                <option value="">Sem modelo (preencher à mão)</option>
                {modelosParaNpc(am.categoria).map((x) => <option key={`${x.ref.tipo}:${x.ref.id}`} value={`${x.ref.tipo}:${x.ref.id}`}>{x.rotulo}</option>)}
              </select>
            </label>
            {fm && (
              <details className="npc-larga recolhe">
                <summary>Resumo <small>CR {fm.soma.cr >= 0 ? "+" : ""}{fm.soma.cr} · {Object.entries(fm.soma.atr).filter(([, v]) => v).map(([k, v]) => `${k.toUpperCase()} ${v > 0 ? "+" : ""}${v}`).join(", ") || "sem mudança"} · {fm.acoes.length + fm.invocacoes.length + fm.notas.length} habilidades</small></summary>
                <ul className="lista-hab-resumo">
                  {fm.acoes.map((a, i) => <li key={`${i}-${a.nome}`}><b>{a.nome}</b> · {a.tipo === "ataque" ? `acerto +${a.acerto}` : `CD ${a.cd}`} · dano {a.dano}{a.custo ? ` · ${a.custo} PR` : ""}</li>)}
                  {fm.invocacoes.map((v) => <li key={v.chave}><b>Invocar {v.nome}</b> · até {v.max} · {v.pv} PV · CR {v.cr}{v.custoPr ? ` · ${v.custoPr} PR` : ""}</li>)}
                  {fm.notas.map((n, i) => <li key={`${i}-${n.nome}`}><b>{n.nome}</b> (texto): {n.texto}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
        {lib.existe && am.categoria === "shinigami" && (
          <div className="npc-item modelo-forma-npc">
            <h4 className="sub-passivas npc-larga">Etapa anterior e máscara (opcionais)</h4>
            <label className="campo">Shikai antes de {lib.nome}
              <select
                value={lib.antes?.modelo ? `${lib.antes.modelo.tipo}:${lib.antes.modelo.id}` : ""}
                onChange={(e) => {
                  const op = shikais.find((x) => `${x.ref.tipo}:${x.ref.id}` === e.target.value);
                  if (!op) { mudarAntes(undefined); return; }
                  mudarAntes({ tipo: "modelo", nome: rotuloShikai(op.rotulo), modelo: op.ref, bonusCr: lib.antes?.bonusCr ?? 0 });
                }}
              >
                <option value="">Nenhuma (libera direto)</option>
                {shikais.map((x) => <option key={x.ref.id} value={`${x.ref.tipo}:${x.ref.id}`}>{x.rotulo}</option>)}
              </select>
            </label>
            <label className="campo">Máscara de Visored
              <select
                value={lib.mascara?.mascara ?? ""}
                onChange={(e) => {
                  const m = MASCARAS.find((x) => x.id === e.target.value);
                  if (!m) setMascaraLocal(false);
                  mudarMascara(m ? { mascara: m.id as TipoMascara, nome: m.nome, bonusCr: lib.mascara?.bonusCr ?? 0 } : undefined);
                }}
              >
                <option value="">Nenhuma</option>
                {MASCARAS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </label>
            {lib.antes && (
              <>
                <label className="campo">Nome da Shikai<input value={lib.antes.nome} maxLength={60} onChange={(e) => mudarLib({ antes: { ...lib.antes!, nome: e.target.value } })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo">CR extra da Shikai<input type="number" value={lib.antes.bonusCr} onChange={(e) => mudarLib({ antes: { ...lib.antes!, bonusCr: Number(e.target.value) || 0 } })} onBlur={() => onSalvar(npc)} /></label>
              </>
            )}
            {lib.mascara && (
              <>
                <label className="campo">Nome da máscara<input value={lib.mascara.nome} maxLength={60} onChange={(e) => mudarLib({ mascara: { ...lib.mascara!, nome: e.target.value } })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo">CR extra da máscara<input type="number" value={lib.mascara.bonusCr} onChange={(e) => mudarLib({ mascara: { ...lib.mascara!, bonusCr: Number(e.target.value) || 0 } })} onBlur={() => onSalvar(npc)} /></label>
              </>
            )}
            {resAntes && (
              <details className="npc-larga recolhe">
                <summary>{lib.antes?.nome} <small>CR {resAntes.cr >= 0 ? "+" : ""}{resAntes.cr}{resAntes.forma ? ` · ${Object.entries(resAntes.forma.soma.atr).filter(([, v]) => v).map(([k, v]) => `${k.toUpperCase()} ${v > 0 ? "+" : ""}${v}`).join(", ") || "sem mudança"} · ${resAntes.forma.acoes.length + resAntes.forma.invocacoes.length + resAntes.forma.notas.length} habilidades` : ""}</small> <Info>{`Enquanto ${lib.antes?.nome} estiver ativa valem estes números. Depois dela, ${lib.nome} substitui a Shikai (não soma).`}</Info></summary>
                <ul className="lista-hab-resumo">
                  {resAntes.forma?.acoes.map((a, i) => <li key={`${i}-${a.nome}`}><b>{a.nome}</b> · {a.tipo === "ataque" ? `acerto +${a.acerto}` : `CD ${a.cd}`} · dano {a.dano}{a.custo ? ` · ${a.custo} PR` : ""}</li>)}
                  {resAntes.forma?.invocacoes.map((v) => <li key={v.chave}><b>Invocar {v.nome}</b> · até {v.max} · {v.pv} PV · CR {v.cr}{v.custoPr ? ` · ${v.custoPr} PR` : ""}</li>)}
                  {resAntes.forma?.notas.map((n, i) => <li key={`${i}-${n.nome}`}><b>{n.nome}</b> (texto): {n.texto}</li>)}
                </ul>
              </details>
            )}
            {lib.mascara && (() => {
              const sem = resumoMascara(am, "base");
              const com = calcularAmeaca(am, { forma: "base", mascara: true });
              return (
                <details className="npc-larga recolhe">
                  <summary>{lib.mascara.nome} na base <small>CR {sem && sem.cr >= 0 ? "+" : ""}{sem?.cr ?? 0}{sem && sem.pvTemp > 0 ? ` · +${sem.pvTemp} PV temp.` : ""}{sem && sem.prTemp > 0 ? ` · +${sem.prTemp} PR temp.` : ""}</small> <Info>{`${lib.mascara.nome} soma por cima da forma ativa (base${lib.antes ? `, ${lib.antes.nome}` : ""} ou ${lib.nome}) e liga/desliga à parte. Para NPC, dura até o Mestre tirar a máscara.`}</Info></summary>
                  <ul className="lista-hab-resumo">
                    {bonusDaMascara(am, "base").map((n, i) => <li key={`${i}-${n.nome}`}><b>{n.nome}</b>: {n.texto}</li>)}
                    {com.ataques.filter((a) => a.mascara).map((a, i) => <li key={`a-${i}-${a.nome}`}><b>{a.nome}</b> com a máscara · dano {a.dano} (máscara {a.mascara})</li>)}
                    {com.tecnicas.filter((t) => t.mascara).map((t, i) => <li key={`t-${i}-${t.nome}`}><b>{t.nome}</b> com a máscara · {t.dados} · CD {t.cd} (máscara {t.mascara})</li>)}
                  </ul>
                </details>
              );
            })()}
          </div>
        )}
        {lib.existe && (
          <div className="npc-item">
            <label className="campo">Nome da forma<input value={lib.nome} onChange={(e) => mudarLib({ nome: e.target.value })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">CR extra<input type="number" value={lib.bonusCr} onChange={(e) => mudarLib({ bonusCr: Number(e.target.value) || 0 })} onBlur={() => onSalvar(npc)} /></label>
            {ATRS.map((a) => (
              <label className="campo" key={a.id}>{a.nome} +<input type="number" value={lib.bonusAtr[a.id]} onChange={(e) => mudarLib({ bonusAtr: { ...lib.bonusAtr, [a.id]: Number(e.target.value) || 0 } })} onBlur={() => onSalvar(npc)} /></label>
            ))}
            <label className="campo">Cura ao liberar (% dos PV)<input type="number" min={0} max={100} value={lib.cura} onChange={(e) => mudarLib({ cura: Number(e.target.value) || 0 })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">Explosão: vezes o atributo<input type="number" min={0} value={lib.explosao.mult} onChange={(e) => mudarLib({ explosao: { ...lib.explosao, mult: Number(e.target.value) || 0 } })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">Atributo da explosão
              <select value={lib.explosao.atr} onChange={(e) => mudarLib({ explosao: { ...lib.explosao, atr: e.target.value as ChaveAtr } }, true)}>{ATRS.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
            </label>
            <label className="campo">Tipo da explosão<input value={lib.explosao.tipo} onChange={(e) => mudarLib({ explosao: { ...lib.explosao, tipo: e.target.value } })} onBlur={() => onSalvar(npc)} /></label>
            <label className="marcar npc-larga"><input type="checkbox" checked={lib.trocar} onChange={(e) => mudarLib({ trocar: e.target.checked }, true)} /> Os ataques e técnicas abaixo substituem os normais (desmarcado: somam)</label>
            <label className="campo npc-larga">Descrição<textarea rows={3} value={lib.texto} onChange={(e) => mudarLib({ texto: e.target.value })} onBlur={() => onSalvar(npc)} /></label>
            <h4 className="sub-passivas npc-larga">Ataques da forma liberada</h4>
            {lib.ataques.map((a, i) => (
              <div className="npc-item npc-larga" key={i}>
                <label className="campo">Nome<input value={a.nome} onChange={(e) => mudarLib({ ataques: lib.ataques.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo">Atributo<select value={a.atr} onChange={(e) => mudarLib({ ataques: lib.ataques.map((x, j) => (j === i ? { ...x, atr: e.target.value as ChaveAtr } : x)) }, true)}>{ATRS.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></label>
                <label className="campo">Dados<input value={a.dados} onChange={(e) => mudarLib({ ataques: lib.ataques.map((x, j) => (j === i ? { ...x, dados: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo">Custo (PR)<input type="number" min={0} value={a.custo ?? 0} onChange={(e) => mudarLib({ ataques: lib.ataques.map((x, j) => (j === i ? { ...x, custo: num(e.target.value) } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo">Tipo de dano<input value={a.tipo} onChange={(e) => mudarLib({ ataques: lib.ataques.map((x, j) => (j === i ? { ...x, tipo: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <button type="button" className="link-perigo" onClick={() => mudarLib({ ataques: lib.ataques.filter((_, j) => j !== i) }, true)}>Remover</button>
              </div>
            ))}
            <button type="button" className="btn btn-paper npc-larga" onClick={() => mudarLib({ ataques: [...lib.ataques, { nome: "Golpe liberado", atr: "for", dados: "2d8", tipo: "", custo: 0, crit: 20 }] }, true)}>Adicionar ataque da forma</button>
            <h4 className="sub-passivas npc-larga">Técnicas da forma liberada</h4>
            {lib.tecnicas.map((t, i) => (
              <div className="npc-item npc-larga" key={i}>
                <label className="campo">Nome<input value={t.nome} onChange={(e) => mudarLib({ tecnicas: lib.tecnicas.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo">Dados<input value={t.dados} onChange={(e) => mudarLib({ tecnicas: lib.tecnicas.map((x, j) => (j === i ? { ...x, dados: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo">Custo (PR)<input type="number" min={0} value={t.custo} onChange={(e) => mudarLib({ tecnicas: lib.tecnicas.map((x, j) => (j === i ? { ...x, custo: num(e.target.value) } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo">Atributo da CD<select value={t.atr} onChange={(e) => mudarLib({ tecnicas: lib.tecnicas.map((x, j) => (j === i ? { ...x, atr: e.target.value as ChaveAtr } : x)) }, true)}>{ATRS.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></label>
                <label className="campo npc-larga">Descrição<textarea rows={2} value={t.texto} onChange={(e) => mudarLib({ tecnicas: lib.tecnicas.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <button type="button" className="link-perigo" onClick={() => mudarLib({ tecnicas: lib.tecnicas.filter((_, j) => j !== i) }, true)}>Remover</button>
              </div>
            ))}
            <button type="button" className="btn btn-paper npc-larga" onClick={() => mudarLib({ tecnicas: [...lib.tecnicas, { nome: "Técnica liberada", dados: "3d8", custo: 6, atr: "esp", texto: "" }] }, true)}>Adicionar técnica da forma</button>
          </div>
        )}

        <h4 className="sub-passivas">Zanpakutō</h4>
        <div className="npc-item">
          <label className="campo">Nome<input value={am.zanpakutou.nome} onChange={(e) => mudarAmeaca({ zanpakutou: { ...am.zanpakutou, nome: e.target.value } })} onBlur={() => onSalvar(npc)} /></label>
          <label className="campo npc-larga">Shikai (comando e habilidades)<textarea rows={3} value={am.zanpakutou.shikai} onChange={(e) => mudarAmeaca({ zanpakutou: { ...am.zanpakutou, shikai: e.target.value } })} onBlur={() => onSalvar(npc)} /></label>
          <label className="campo npc-larga">Bankai (nome e habilidades)<textarea rows={3} value={am.zanpakutou.bankai} onChange={(e) => mudarAmeaca({ zanpakutou: { ...am.zanpakutou, bankai: e.target.value } })} onBlur={() => onSalvar(npc)} /></label>
        </div>

        <h4 className="sub-passivas">Técnicas e Kidō</h4>
        {am.tecnicas.map((t, i) => (
          <div className="npc-item" key={i}>
            <label className="campo">Nome<input value={t.nome} onChange={(e) => mudarAmeaca({ tecnicas: am.tecnicas.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">Dados<input value={t.dados} placeholder="2d6" onChange={(e) => mudarAmeaca({ tecnicas: am.tecnicas.map((x, j) => (j === i ? { ...x, dados: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">Custo (PR)<input type="number" min={0} value={t.custo} onChange={(e) => mudarAmeaca({ tecnicas: am.tecnicas.map((x, j) => (j === i ? { ...x, custo: num(e.target.value) } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <label className="campo">Atributo da CD
              <select value={t.atr} onChange={(e) => mudarAmeaca({ tecnicas: am.tecnicas.map((x, j) => (j === i ? { ...x, atr: e.target.value as ChaveAtr } : x)) }, true)}>
                {ATRS.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
              </select>
            </label>
            <label className="campo npc-larga">Descrição<textarea rows={2} value={t.texto} onChange={(e) => mudarAmeaca({ tecnicas: am.tecnicas.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <button type="button" className="link-perigo" onClick={() => mudarAmeaca({ tecnicas: am.tecnicas.filter((_, j) => j !== i) }, true)}>Remover técnica</button>
          </div>
        ))}
        {am.tecnicas.length < 10 && <button type="button" className="btn btn-paper" onClick={() => mudarAmeaca({ tecnicas: [...am.tecnicas, { nome: "Nova técnica", dados: "2d6", custo: 4, atr: "esp", texto: "" }] }, true)}>Adicionar técnica</button>}

        {am.habilidades.length > 0 && (
          <>
            <h4 className="sub-passivas">Habilidades do modelo</h4>
            {am.habilidades.map((h, i) => (
              <div className="npc-item" key={i}>
                <label className="campo">Título<input value={h.titulo} onChange={(e) => mudarAmeaca({ habilidades: am.habilidades.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo npc-larga">Texto<textarea rows={3} value={h.texto} onChange={(e) => mudarAmeaca({ habilidades: am.habilidades.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
                <button type="button" className="link-perigo" onClick={() => mudarAmeaca({ habilidades: am.habilidades.filter((_, j) => j !== i) }, true)}>Remover habilidade</button>
              </div>
            ))}
          </>
        )}
        <button type="button" className="btn btn-paper" onClick={() => mudarAmeaca({ habilidades: [...am.habilidades, { titulo: "Nova habilidade", texto: "" }] }, true)}>Adicionar habilidade</button>

        <label className="campo">Características e habilidades
          <textarea rows={4} value={am.caracteristicas} placeholder="Resistências, Redução de Dano, Shikai, Kidō… (use as ameaças prontas do livro como referência)" onChange={(e) => mudarAmeaca({ caracteristicas: e.target.value })} onBlur={() => onSalvar(npc)} />
        </label>
      </details>

      <label className="campo">Anotações do Mestre
        <textarea rows={3} value={npc.dados.notas} onChange={(e) => mudarDados({ notas: e.target.value }, false)} onBlur={() => onSalvar(npc)} />
      </label>
      <label className="campo">Pasta (encontro)
        <input
          list="pastas-npc" value={pastaEd ?? npc.dados.pasta} maxLength={60} placeholder="Ex.: Emboscada na ponte"
          onFocus={() => setPastaEd(npc.dados.pasta)}
          onChange={(e) => setPastaEd(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
          onBlur={(e) => { const v = e.currentTarget.value.trim(); setPastaEd(null); if (v !== npc.dados.pasta) mudarDados({ pasta: v }); }}
        />
      </label>
      <label className="marcar"><input type="checkbox" checked={npc.dados.revelado} onChange={(e) => mudarDados({ revelado: e.target.checked })} /> Mostrar aos jogadores</label>
      <div className="npc-rodape">
        <button type="button" className="btn btn-paper" onClick={() => onModelo(npc)}>Salvar como meu modelo</button>
        <button type="button" className="btn btn-paper" onClick={() => onDuplicar(npc)}>Duplicar</button>
        <button type="button" className="link-perigo" onClick={() => onApagar(npc)}>Apagar NPC</button>
      </div>
      </div>}
    </article>
  );
}
