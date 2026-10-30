import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listarFichas, type FichaSalva } from "../lib/fichas";
import { ataqueBonus, ataquesPorAcao, danoAtributo, calcular, type Ficha } from "../regras/ficha";
import { ataqueMelhorado } from "../regras/melhorias";
import { acertoClasse, danosDaClasse } from "../regras/danos-classe";
import { duelo, mediaDano, pareado, veredito, FATOR_K, type Acao, type Combatente, type Resultado } from "../regras/simulador";

let seq = 0;
const nid = () => `a${++seq}`;
const acaoVazia = (o: Partial<Acao> = {}): Acao => ({ id: nid(), nome: "Ataque", acerto: 5, dano: "1d8+3", golpes: 1, custo: 0, esoterico: false, crit: 20, mult: 2, ...o });
const base = (nome: string, o: Partial<Combatente> = {}): Combatente => ({ nome, pv: 60, pr: 30, cr: 15, iniciativa: 2, rdFis: 0, rdEso: 0, hierro: false, acoes: [acaoVazia()], ...o });

/** Converte uma ficha salva em combatente: ataques da ficha, com o dano extra que ela já soma. */
function deFicha(nome: string, f: Ficha): Combatente {
  const c = calcular(f);
  const acoes: Acao[] = f.ataques.filter((a) => a.dano.trim()).map((a) => {
    const m = ataqueMelhorado(f, a);
    const geral = c.danoGeral > 0 ? `+${c.danoGeral}` : "";
    const corpo = a.distancia ? "" : (c.danoCorpo > 0 ? `+${c.danoCorpo}` : "") + c.danoDados.map((x) => `+${x}`).join("");
    return acaoVazia({ nome: a.nome, acerto: ataqueBonus(f, c, a), golpes: ataquesPorAcao(f), dano: m.dano + danoAtributo(c, a) + geral + corpo, crit: m.crit ?? 20, mult: m.mult ?? 2 });
  });
  // ataques da classe (Cero, técnicas de Reishi): uma ação por uso, dano de Energia
  for (const d of danosDaClasse(f, c)) {
    if (!d.acerto) continue;
    const custo = Number(d.custo?.match(/\d+/)?.[0] ?? 0);
    acoes.push(acaoVazia({ nome: d.nome, acerto: acertoClasse(f, c), dano: d.dano, custo, esoterico: true, golpes: 1 }));
  }
  return { nome, pv: c.pv, pr: c.pr, cr: c.cr, iniciativa: c.iniciativa, rdFis: c.rdFis, rdEso: c.rdEso, hierro: false, acoes: acoes.length ? acoes : [acaoVazia()] };
}

const num = (v: string) => (v === "" ? 0 : Number(v) || 0);

function Painel({ titulo, c, onChange, fichas, ajuda }: { titulo: string; c: Combatente; onChange: (c: Combatente) => void; fichas: FichaSalva[]; ajuda?: string }) {
  const set = <K extends keyof Combatente>(k: K, v: Combatente[K]) => onChange({ ...c, [k]: v });
  const acao = (id: string, o: Partial<Acao>) => set("acoes", c.acoes.map((a) => (a.id === id ? { ...a, ...o } : a)));
  return (
    <section className="caixa sim-painel">
      <h3>{titulo}</h3>
      {ajuda && <p className="ajuda">{ajuda}</p>}
      {fichas.length > 0 && (
        <label className="campo">Importar de uma ficha
          <select value="" onChange={(e) => { const f = fichas.find((x) => x.id === e.target.value); if (f) onChange(deFicha(f.nome, f.data)); }}>
            <option value="">Escolher ficha…</option>
            {fichas.map((f) => <option key={f.id} value={f.id}>{f.nome} (nível {f.data.nivel})</option>)}
          </select>
        </label>
      )}
      <label className="campo">Nome<input value={c.nome} onChange={(e) => set("nome", e.target.value)} /></label>
      <div className="sim-grade">
        <label className="campo">PV<input type="number" min={1} value={c.pv} onChange={(e) => set("pv", Math.max(1, num(e.target.value)))} /></label>
        <label className="campo">PR<input type="number" min={0} value={c.pr} onChange={(e) => set("pr", num(e.target.value))} /></label>
        <label className="campo">CR<input type="number" value={c.cr} onChange={(e) => set("cr", num(e.target.value))} /></label>
        <label className="campo">Iniciativa<input type="number" value={c.iniciativa} onChange={(e) => set("iniciativa", num(e.target.value))} /></label>
        <label className="campo">RD física<input type="number" min={0} value={c.rdFis} onChange={(e) => set("rdFis", num(e.target.value))} /></label>
        <label className="campo">RD esotérica<input type="number" min={0} value={c.rdEso} onChange={(e) => set("rdEso", num(e.target.value))} /></label>
      </div>
      <label className="sim-check"><input type="checkbox" checked={c.hierro} onChange={(e) => set("hierro", e.target.checked)} /> Hierro (dano físico pela metade)</label>
      <h4>Ações</h4>
      {c.acoes.map((a) => (
        <div className="sim-acao" key={a.id}>
          <input value={a.nome} onChange={(e) => acao(a.id, { nome: e.target.value })} aria-label="Nome da ação" />
          <label>Acerto<input type="number" value={a.acerto} onChange={(e) => acao(a.id, { acerto: num(e.target.value) })} /></label>
          <label>Dano<input value={a.dano} onChange={(e) => acao(a.id, { dano: e.target.value })} /></label>
          <label>Golpes<input type="number" min={1} value={a.golpes} onChange={(e) => acao(a.id, { golpes: Math.max(1, num(e.target.value)) })} /></label>
          <label>PR<input type="number" min={0} value={a.custo} onChange={(e) => acao(a.id, { custo: num(e.target.value) })} /></label>
          <label>Crít.<input type="number" min={2} max={20} value={a.crit} onChange={(e) => acao(a.id, { crit: Math.min(20, Math.max(2, num(e.target.value))) })} /></label>
          <label>×<input type="number" min={2} max={4} value={a.mult} onChange={(e) => acao(a.id, { mult: Math.min(4, Math.max(2, num(e.target.value))) })} /></label>
          <label className="sim-check"><input type="checkbox" checked={a.esoterico} onChange={(e) => acao(a.id, { esoterico: e.target.checked })} /> Esotérico</label>
          <span className="ajuda">média {mediaDano(a.dano).toFixed(1)}</span>
          {c.acoes.length > 1 && <button type="button" className="link-perigo" onClick={() => set("acoes", c.acoes.filter((x) => x.id !== a.id))}>Remover</button>}
        </div>
      ))}
      <button type="button" className="btn btn-paper" onClick={() => set("acoes", [...c.acoes, acaoVazia({ nome: "Técnica", custo: 5 })])}>Adicionar ação</button>
    </section>
  );
}

const pct = (n: number, t: number) => `${((100 * n) / t).toFixed(1)}%`;

export default function Simulador() {
  const [fichas, setFichas] = useState<FichaSalva[]>([]);
  const [jog, setJog] = useState<Combatente>(() => base("Jogador", { pv: 60, acoes: [acaoVazia({ nome: "Zanpakutou", acerto: 7, dano: "2d8+4" })] }));
  const [npcBase, setNpc] = useState<Combatente>(() => base("NPC", { pv: 125, acoes: [acaoVazia({ nome: "Espada", acerto: 6, dano: "2d8+3" }), acaoVazia({ nome: "Técnica", acerto: 6, dano: "4d6", custo: 5, esoterico: true })] }));
  const [nivel, setNivel] = useState(5);
  const [usarPareado, setUsarPareado] = useState(true);
  const [suporte, setSuporte] = useState(false);
  const [hollow, setHollow] = useState(false);
  const [pvExtra, setPvExtra] = useState(0);
  const [lutas, setLutas] = useState(3000);
  const [res, setRes] = useState<Resultado | null>(null);

  useEffect(() => { listarFichas().then(setFichas).catch(() => setFichas([])); }, []);

  const k = FATOR_K[Math.min(20, Math.max(1, nivel)) - 1];
  const veredicto = useMemo(() => (res ? veredito(res.vitoriasA / res.lutas) : null), [res]);

  // o NPC do duelo sempre sai da ficha de ameaça comum: mudar nível ou opções recalcula do zero, sem acumular
  const npc = useMemo(() => (usarPareado ? pareado(npcBase, { nivel, suporte, hollow, pvExtra }) : npcBase), [npcBase, usarPareado, nivel, suporte, hollow, pvExtra]);
  const rodar = () => { setRes(duelo(jog, npc, lutas)); };

  return (
    <main className="page">
      <p className="ajuda"><Link to="/ferramentas">← Ferramentas do Mestre</Link></p>
      <h1 className="title-font">Simulador de combate</h1>
      <p>Faz o duelo entre um jogador e um NPC milhares de vezes e mostra quem vence, em quantas rodadas e quanto dano cada lado causa. A meta do livro é o jogador vencer de 55% a 65% das vezes.</p>
      <div className="sim-colunas">
        <Painel titulo="Jogador" c={jog} onChange={setJog} fichas={fichas} ajuda="Importe uma das suas fichas ou preencha à mão." />
        <Painel titulo={usarPareado ? "NPC (ficha de ameaça comum)" : "NPC"} c={npcBase} onChange={setNpc} fichas={fichas} ajuda={usarPareado ? "Digite a ficha de ameaça comum. O NPC pareado é calculado a partir dela, logo abaixo, e a ficha não é alterada." : "Digite o NPC como ele vai lutar."} />
      </div>

      <section className="caixa">
        <h3>NPC pareado</h3>
        <label className="sim-check"><input type="checkbox" checked={usarPareado} onChange={(e) => setUsarPareado(e.target.checked)} /> Transformar a ficha em NPC pareado</label>
        <p className="ajuda">Aplica as regras do capítulo Ameaças: PV e dados de dano multiplicados pelo fator k do nível (dados arredondados para baixo). O cálculo é refeito da ficha de ameaça a cada mudança, então trocar de nível ou de opção nunca soma por cima.</p>
        <div className="sim-grade">
          <label className="campo">Nível (k = {k})<input type="number" min={1} max={20} value={nivel} onChange={(e) => setNivel(Math.min(20, Math.max(1, num(e.target.value))))} /></label>
          <label className="campo">PV extra do 5v5
            <select value={pvExtra} onChange={(e) => setPvExtra(Number(e.target.value))}>
              <option value={0}>Nenhum</option><option value={10}>+10%</option><option value={20}>+20%</option>
            </select>
          </label>
        </div>
        <label className="sim-check"><input type="checkbox" checked={suporte} onChange={(e) => setSuporte(e.target.checked)} /> NPC de suporte (par do Curandeiro)</label>
        <label className="sim-check"><input type="checkbox" checked={hollow} onChange={(e) => setHollow(e.target.checked)} /> Hollow espelhado (Hierro)</label>
        {usarPareado && (
          <div className="sim-resumo-npc">
            <b>NPC que vai lutar:</b> {npc.pv} PV · CR {npc.cr}{npc.hierro ? " · Hierro" : ""}
            <ul>{npc.acoes.map((a) => <li key={a.id}>{a.nome}: {a.dano}{a.custo ? ` (${a.custo} PR)` : ""}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="caixa">
        <h3>Rodar</h3>
        <label className="campo">Quantidade de duelos
          <select value={lutas} onChange={(e) => setLutas(Number(e.target.value))}>
            {[500, 1000, 3000, 10000].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div className="row"><button type="button" className="btn btn-red" onClick={rodar}>Simular</button></div>
        {res && veredicto && (
          <div className="sim-res">
            <p className={`aviso sim-${veredicto.nivel}`}><b>{pct(res.vitoriasA, res.lutas)} de vitórias do jogador</b>{veredicto.texto}</p>
            <div className="carta-nums">
              <i>{jog.nome} vence <strong>{pct(res.vitoriasA, res.lutas)}</strong></i>
              <i>{npc.nome} vence <strong>{pct(res.vitoriasB, res.lutas)}</strong></i>
              <i>Sem vencedor <strong>{pct(res.empates, res.lutas)}</strong></i>
              <i>Rodadas <strong>{res.rodadas.toFixed(1)}</strong></i>
              <i>Dano/rodada do jogador <strong>{res.danoRodadaA.toFixed(1)}</strong></i>
              <i>Dano/rodada do NPC <strong>{res.danoRodadaB.toFixed(1)}</strong></i>
              <i>PV que sobram ao jogador (quando vence) <strong>{res.pvRestanteA.toFixed(0)}%</strong></i>
              <i>PV que sobram ao NPC (quando vence) <strong>{res.pvRestanteB.toFixed(0)}%</strong></i>
            </div>
            <p className="ajuda">Cada lado usa a ação de maior dano esperado que ainda cabe nos PR. Cura, condições, reações e liberações não entram na conta; para esses casos, ajuste PV e dano à mão.</p>
          </div>
        )}
      </section>
    </main>
  );
}
