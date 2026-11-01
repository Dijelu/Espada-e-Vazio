import { useState } from "react";
import {
  ATRS, CATEGORIAS, ESTILOS, GRAUS, calcularAmeaca, distribuir, normalizarAmeaca, pontosDeAtributo,
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
export function CartaNpc({ npc, onMudar, onSalvar, onApagar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [aberta, setAberta] = useState(false);
  const am = npc.dados.ameaca;
  const c = calcularAmeaca(am);
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
        <span className="npc-toggle-info">ND {c.nd} · {c.grauNome} · PV {pv}/{c.pv} · PR {pr}/{c.pr}</span>
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

      {c.hierro && <p className="ajuda"><b>Hierro:</b> dano físico sofrido pela metade (não reduz energia nem dano esotérico).</p>}
      {c.ataques.map((a) => <p key={a.nome} className="npc-acao"><b>{a.nome}:</b> +{a.acerto} para acertar · {a.dano} {a.tipo} <small>(média {a.media.toFixed(1).replace(/\.0$/, "")})</small></p>)}
      {c.tecnicas.map((t) => <p key={t.nome} className="npc-acao"><b>{t.nome}</b> ({t.custo} PR): {t.dados} · CD {t.cd}{t.texto ? ` — ${t.texto}` : ""}</p>)}
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
            <label className="campo">Tipo de dano<input value={a.tipo} placeholder="Cortante" onChange={(e) => mudarAmeaca({ ataques: am.ataques.map((x, j) => (j === i ? { ...x, tipo: e.target.value } : x)) })} onBlur={() => onSalvar(npc)} /></label>
            <button type="button" className="link-perigo" onClick={() => mudarAmeaca({ ataques: am.ataques.filter((_, j) => j !== i) }, true)}>Remover ataque</button>
          </div>
        ))}
        {am.ataques.length < 8 && <button type="button" className="btn btn-paper" onClick={() => mudarAmeaca({ ataques: [...am.ataques, { nome: "Novo ataque", atr: "for", dados: "1d8", tipo: "" }] }, true)}>Adicionar ataque</button>}

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
      <button type="button" className="link-perigo" onClick={() => onApagar(npc)}>Apagar NPC</button>
      </div>}
    </article>
  );
}
