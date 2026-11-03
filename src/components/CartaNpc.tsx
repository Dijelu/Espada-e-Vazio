import { formaNpc, modelosParaNpc } from "../regras/forma-npc";
import { MASCARAS, type TipoMascara } from "../regras/mascara";
import { useState } from "react";
import {
  ATRS, CATEGORIAS, ESTILOS, GRAUS, calcularAmeaca, distribuir, efeitosDaLiberacao, etapaDoNpc, liberacaoPadrao, normalizarAmeaca, pontosDeAtributo, resumoEtapaAnterior,
  type EtapaAnterior, type EtapaNpc, type LiberacaoAmeaca,
  type Ameaca, type ChaveAtr, type Categoria, type Modo,
} from "../regras/ameacas";
import type { Npc } from "../lib/campanhas";

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
  const am = npc.dados.ameaca;
  const lib = am.liberacao;
  const etapa = etapaDoNpc(am, npc.dados.liberado, npc.dados.antes);
  const liberado = etapa === "liberado";
  const c = calcularAmeaca(am, etapa);
  const resAntes = lib.existe && lib.antes ? resumoEtapaAnterior(am) : null;
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
  const fmAtiva = liberado ? fm : etapa === "antes" ? resAntes?.forma ?? null : null;
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
  /** NPC com etapa anterior: troca de etapa mantendo o PV/PR atual (limitado ao novo máximo; aumento de máximo soma a diferença). */
  const irParaEtapa = (alvo: EtapaNpc) => {
    const antes = calcularAmeaca(am, etapa), depois = calcularAmeaca(am, alvo);
    const ef = alvo === "liberado" ? efeitosDaLiberacao(am) : { dano: 0, tipo: "", curaPv: 0 };
    const pvN = Math.max(0, Math.min(depois.pv, pv + Math.max(0, depois.pv - antes.pv) + ef.curaPv));
    const prN = Math.max(0, Math.min(depois.pr, pr + Math.max(0, depois.pr - antes.pr)));
    mudarDados({ liberado: alvo === "liberado", antes: alvo === "antes", pvAtual: pvN, prAtual: prN });
    if (alvo === "base") { setAvisoLib(""); return; }
    const nome = alvo === "liberado" ? lib.nome : lib.antes?.nome ?? "";
    const extra = alvo === "liberado"
      ? `${ef.dano > 0 ? ` Todos os inimigos que o vejam sofrem ${ef.dano} de dano ${ef.tipo}.` : ""}${ef.curaPv > 0 ? ` Recupera ${ef.curaPv} PV.` : ""}`
      : (resAntes?.notas ?? []).filter((n) => n.nome === "Corpo Hollow").map((n) => ` ${n.nome}: ${n.texto}`).join("");
    setAvisoLib(`${nome}!${extra}`);
  };
  const mudarAntes = (antes: EtapaAnterior | undefined) => mudarAmeaca({ liberacao: { ...lib, antes } }, true);
  const shikais = am.categoria === "shinigami" ? modelosParaNpc("shinigami").filter((x) => x.ref.tipo === "shikai") : [];
  const shikaiPadrao = () => shikais.find((x) => lib.modelo && lib.modelo.id.startsWith(x.ref.id)) ?? shikais[0];
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
        <span className="npc-toggle-info">{liberado ? `${lib.nome} liberado · ` : etapa === "antes" && lib.antes ? `${lib.antes.nome} ativa · ` : ""}{am.titulo ? `${am.titulo} · ` : ""}ND {c.nd} · {c.grauNome} · PV {pv}/{c.pv} · PR {pr}/{c.pr}</span>
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
          {!lib.antes && <button type="button" className={`btn ${liberado ? "btn-paper" : "btn-red"}`} onClick={alternarLiberacao}>{liberado ? `Encerrar ${lib.nome}` : `Liberar ${lib.nome}`}</button>}
          {lib.antes && etapa === "base" && <button type="button" className="btn btn-red" onClick={() => irParaEtapa("antes")}>Liberar {lib.antes.nome}</button>}
          {lib.antes && etapa !== "liberado" && <button type="button" className="btn btn-red" onClick={() => irParaEtapa("liberado")}>Liberar {lib.nome}</button>}
          {lib.antes && etapa !== "base" && <button type="button" className="btn btn-paper" onClick={() => irParaEtapa("base")}>Encerrar {liberado ? lib.nome : lib.antes.nome}</button>}
          {liberado && <small>CR +{lib.bonusCr} e atributos mudados enquanto liberado.</small>}
          {etapa === "antes" && resAntes && <small>CR {resAntes.cr >= 0 ? "+" : ""}{resAntes.cr}{resAntes.pvTemp > 0 ? `, +${resAntes.pvTemp} PV` : ""}{resAntes.prTemp > 0 ? `, +${resAntes.prTemp} PR` : ""} enquanto {lib.antes?.nome} está ativa.</small>}
          {avisoLib && <p className="aviso" role="status">{avisoLib}</p>}
        </div>
      )}
      <div className="npc-barra">
        <div className="npc-linha"><b>PV {pv}/{c.pv}</b>
          <span className="npc-botoes">{[-10, -5, -1, 1, 5, 10].map((d) => <button type="button" key={d} className="btn btn-paper" onClick={() => ajustar("pvAtual", pv, c.pv, d)}>{d > 0 ? `+${d}` : d}</button>)}</span>
        </div>
        <div className="npc-linha"><b>PR {pr}/{c.pr}</b>
          <span className="npc-botoes">{[-10, -5, -1, 1, 5, 10].map((d) => <button type="button" key={d} className="btn btn-paper" onClick={() => ajustar("prAtual", pr, c.pr, d)}>{d > 0 ? `+${d}` : d}</button>)}</span>
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
      {c.hierro && <p className="ajuda"><b>Hierro:</b> dano físico sofrido pela metade (não reduz energia nem dano esotérico).</p>}
      {c.ataques.map((a) => <p key={a.nome} className="npc-acao"><b>{a.nome}:</b> +{a.acerto} para acertar · {a.dano} {a.tipo} <small>(média {a.media.toFixed(1).replace(/\.0$/, "")})</small></p>)}
      {c.tecnicas.map((t) => <p key={t.nome} className="npc-acao"><b>{t.nome}</b> ({t.custo} PR): {t.dados} · CD {t.cd}{t.texto ? ` — ${t.texto}` : ""}</p>)}
      {fmAtiva && (
        <div className="npc-forma-lista">
          <b>{etapa === "antes" && lib.antes ? `${lib.antes.nome} · ${fmAtiva.nome}` : fmAtiva.nome}</b>
          {fmAtiva.acoes.map((a) => <p key={a.nome} className="npc-acao"><b>{a.nome}</b>{a.custo ? ` (${a.custo} PR)` : ""}: {a.tipo === "ataque" ? `+${a.acerto} para acertar` : `CD ${a.cd}`} · {a.dano}</p>)}
          {fmAtiva.invocacoes.map((v) => <p key={v.chave} className="npc-acao"><b>Invocar {v.nome}</b>{v.custoPr ? ` (${v.custoPr} PR)` : ""}: até {v.max} · {v.pv} PV · CR {v.cr}</p>)}
          {fmAtiva.notas.map((n) => <p key={n.nome} className="npc-acao"><b>{n.nome}:</b> {n.texto}</p>)}
        </div>
      )}
      {etapa === "antes" && lib.antes?.tipo === "mascara" && resAntes && (
        <div className="npc-forma-lista">
          <b>{lib.antes.nome}</b>
          <p className="ajuda">Os dados e a CD acima já contam a máscara.</p>
          {resAntes.notas.map((n) => <p key={n.nome} className="npc-acao"><b>{n.nome}:</b> {n.texto}</p>)}
        </div>
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
            <label className="campo npc-larga">Modelo pronto de forma
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
              <div className="npc-larga">
                <p className="ajuda">As peças do modelo já entram no CR e nos atributos da forma liberada e as habilidades viram botões no combate. Bônus de CR {fm.soma.cr >= 0 ? "+" : ""}{fm.soma.cr}; atributos {Object.entries(fm.soma.atr).filter(([, v]) => v).map(([k, v]) => `${k.toUpperCase()} ${v > 0 ? "+" : ""}${v}`).join(", ") || "sem mudança"}.</p>
                <ul className="lista-hab-resumo">
                  {fm.acoes.map((a) => <li key={a.nome}><b>{a.nome}</b> · {a.tipo === "ataque" ? `acerto +${a.acerto}` : `CD ${a.cd}`} · dano {a.dano}{a.custo ? ` · ${a.custo} PR` : ""}</li>)}
                  {fm.invocacoes.map((v) => <li key={v.chave}><b>Invocar {v.nome}</b> · até {v.max} · {v.pv} PV · CR {v.cr}{v.custoPr ? ` · ${v.custoPr} PR` : ""}</li>)}
                  {fm.notas.map((n) => <li key={n.nome}><b>{n.nome}</b> (texto): {n.texto}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {lib.existe && am.categoria === "shinigami" && (
          <div className="npc-item modelo-forma-npc">
            <h4 className="sub-passivas npc-larga">Etapa anterior (opcional)</h4>
            <label className="campo">Antes de {lib.nome}
              <select
                value={lib.antes ? lib.antes.tipo : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "modelo") { const op = shikaiPadrao(); if (op) mudarAntes({ tipo: "modelo", nome: `Shikai ${op.rotulo.split(" · ").slice(1).join(" · ")}`.trim(), modelo: op.ref, bonusCr: 0 }); return; }
                  if (v === "mascara") { mudarAntes({ tipo: "mascara", nome: MASCARAS[0].nome, mascara: MASCARAS[0].id, bonusCr: 0 }); return; }
                  mudarAntes(undefined);
                }}
              >
                <option value="">Nenhuma (libera direto)</option>
                {shikais.length > 0 && <option value="modelo">Shikai pronta</option>}
                <option value="mascara">Máscara de Visored</option>
              </select>
            </label>
            {lib.antes?.tipo === "modelo" && (
              <label className="campo">Shikai
                <select
                  value={lib.antes.modelo ? `${lib.antes.modelo.tipo}:${lib.antes.modelo.id}` : ""}
                  onChange={(e) => { const op = shikais.find((x) => `${x.ref.tipo}:${x.ref.id}` === e.target.value); if (op && lib.antes) mudarAntes({ ...lib.antes, modelo: op.ref, nome: `Shikai ${op.rotulo.split(" · ").slice(1).join(" · ")}`.trim() }); }}
                >
                  {shikais.map((x) => <option key={x.ref.id} value={`${x.ref.tipo}:${x.ref.id}`}>{x.rotulo}</option>)}
                </select>
              </label>
            )}
            {lib.antes?.tipo === "mascara" && (
              <label className="campo">Máscara
                <select value={lib.antes.mascara ?? ""} onChange={(e) => { const m = MASCARAS.find((x) => x.id === e.target.value); if (m && lib.antes) mudarAntes({ ...lib.antes, mascara: m.id as TipoMascara, nome: m.nome }); }}>
                  {MASCARAS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </label>
            )}
            {lib.antes && (
              <>
                <label className="campo">Nome da etapa<input value={lib.antes.nome} maxLength={60} onChange={(e) => mudarLib({ antes: { ...lib.antes!, nome: e.target.value } })} onBlur={() => onSalvar(npc)} /></label>
                <label className="campo">CR extra da etapa<input type="number" value={lib.antes.bonusCr} onChange={(e) => mudarLib({ antes: { ...lib.antes!, bonusCr: Number(e.target.value) || 0 } })} onBlur={() => onSalvar(npc)} /></label>
              </>
            )}
            {resAntes && (
              <div className="npc-larga">
                <p className="ajuda">
                  Enquanto {lib.antes?.nome} estiver ativa: CR {resAntes.cr >= 0 ? "+" : ""}{resAntes.cr}
                  {resAntes.forma ? `; atributos ${Object.entries(resAntes.forma.soma.atr).filter(([, v]) => v).map(([k, v]) => `${k.toUpperCase()} ${v > 0 ? "+" : ""}${v}`).join(", ") || "sem mudança"}` : ""}
                  {resAntes.pvTemp > 0 ? `; +${resAntes.pvTemp} PV temporários` : ""}{resAntes.prTemp > 0 ? `; +${resAntes.prTemp} PR temporários` : ""}.
                  {lib.antes?.tipo === "mascara" ? " Para NPC, a máscara dura até o Mestre encerrar." : ""} Depois dela, {lib.nome} substitui a etapa (não soma).
                </p>
                <ul className="lista-hab-resumo">
                  {resAntes.forma?.acoes.map((a) => <li key={a.nome}><b>{a.nome}</b> · {a.tipo === "ataque" ? `acerto +${a.acerto}` : `CD ${a.cd}`} · dano {a.dano}{a.custo ? ` · ${a.custo} PR` : ""}</li>)}
                  {resAntes.forma?.invocacoes.map((v) => <li key={v.chave}><b>Invocar {v.nome}</b> · até {v.max} · {v.pv} PV · CR {v.cr}{v.custoPr ? ` · ${v.custoPr} PR` : ""}</li>)}
                  {resAntes.forma?.notas.map((n) => <li key={n.nome}><b>{n.nome}</b> (texto): {n.texto}</li>)}
                  {resAntes.notas.map((n) => <li key={n.nome}><b>{n.nome}</b>: {n.texto}</li>)}
                  {lib.antes?.tipo === "mascara" && calcularAmeaca(am, "antes").ataques.map((a) => <li key={`a-${a.nome}`}><b>{a.nome}</b> com a máscara · dano {a.dano}</li>)}
                  {lib.antes?.tipo === "mascara" && calcularAmeaca(am, "antes").tecnicas.map((t) => <li key={`t-${t.nome}`}><b>{t.nome}</b> com a máscara · {t.dados} · CD {t.cd}</li>)}
                </ul>
              </div>
            )}
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
        <input list="pastas-npc" value={npc.dados.pasta} maxLength={60} placeholder="Ex.: Emboscada na ponte" onChange={(e) => mudarDados({ pasta: e.target.value }, false)} onBlur={() => onSalvar(npc)} />
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
