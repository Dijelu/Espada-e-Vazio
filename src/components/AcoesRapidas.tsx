import { dispararLiberacao, precarregarMascaras } from "./EfeitoLiberacao";
import { useEffect, useState } from "react";
import { Passo } from "./FichaPecas";
import type { Rolagens } from "./Rolador";
import { CONDICAO_TEXTO, CONDICOES, treinoConcluido } from "../regras/catalogo";
import { Dica } from "./Dica";
import { custoBankai, nivelLiberacao } from "../regras/liberacoes";
import { classePorId, type Calculo, type Ficha, type Liberacao } from "../regras/ficha";
import { efeito as som } from "../lib/som";
import { prepararFotoMascara } from "../lib/mascara-foto";
import { MASCARAS, mascaraAtiva, tempMascara, type TipoMascara } from "../regras/mascara";

export function AcoesRapidas({ f, c, alterar, r }: { f: Ficha; c: Calculo; alterar: (p: Partial<Ficha>) => void; r: Rolagens }) {
  const classe = classePorId(f.classe);
  const tipo = classe?.tipo;
  const [dano, setDano] = useState("");
  const [tipoDano, setTipoDano] = useState<"fis" | "eso" | "direto">("fis");
  const [msg, setMsg] = useState("");
  const [metade, setMetade] = useState(false);
  const e = f.estado;
  const temMascara = f.origem === "visored" && f.treinos.feitos.includes("visored-2");
  useEffect(() => { if (temMascara) precarregarMascaras(); }, [temMascara]);
  const setE = (p: Partial<Ficha["estado"]>) => alterar({ estado: { ...f.estado, ...p } });

  const aplicarDano = () => {
    const n = Math.floor(Number(dano));
    if (!Number.isFinite(n) || n <= 0) return;
    const rd = tipoDano === "fis" ? c.rdFis : tipoDano === "eso" ? c.rdEso : 0;
    const real = Math.max(0, Math.floor(metade ? n / 2 : n) - rd);
    const noTemp = Math.min(e.pvTemp, real);
    const noPv = real - noTemp;
    alterar({ pvAtual: Math.max(0, f.pvAtual - noPv), estado: { ...f.estado, pvTemp: e.pvTemp - noTemp } });
    setMsg(`${n} de dano${rd ? ` − RD ${rd}` : ""} = ${real}${noTemp ? ` (${noTemp} nos PV temporários)` : ""}. ${f.pvAtual - noPv <= 0 ? "Você caiu a 0 PV." : ""}`);
    setDano("");
    setMetade(false);
    som.corte();
  };

  const curto = () => {
    if (e.curtosUsados >= 2) return;
    const usos = { ...e.usos };
    const limpa = !!usos["esgotado-curto"];
    delete usos["esgotado-curto"];
    alterar({
      pvAtual: Math.min(c.pv, f.pvAtual + Math.floor(c.pv / 2)),
      prAtual: Math.min(c.pr, f.prAtual + Math.floor(c.pr / 2)),
      estado: { ...f.estado, curtosUsados: e.curtosUsados + 1, usos, condicoes: limpa ? e.condicoes.filter((x) => x !== "Esgotado") : e.condicoes },
    });
    setMsg("Descanso curto: recuperou metade do PV e do PR totais.");
  };
  const longo = () => {
    alterar({
      pvAtual: c.pv,
      prAtual: c.pr,
      estado: { ...f.estado, pvTemp: 0, curtosUsados: 0, ultimoFolegoUsado: false, liberado: "", usos: {}, condicoes: e.condicoes.filter((x) => x !== "Esgotado") },
    });
    setMsg("Descanso longo: PV e PR cheios, descansos curtos e habilidades renovados.");
  };

  const encerrar = () => {
    // fim do combate: habilidades por combate voltam e a liberação termina
    const usos = { ...f.estado.usos };
    delete usos["ultimo-folego"];
    alterar({ estado: { ...f.estado, ...encerrarForma(), usos: { ...encerrarForma().usos, ...usos } } });
    setMsg("Combate encerrado: habilidades de uso por combate renovadas.");
  };

  // liberações disponíveis: forma montada na ficha (no nível certo) ou treinamento concluído
  const pronta = (t: "shikai" | "bankai" | "resurreccion" | "vollstandig") => {
    const n = nivelLiberacao(f.classe, tipo, t);
    return !!n && f.nivel >= n && !!f.formas?.[t]?.nome?.trim();
  };
  const libs: { id: Liberacao; nome: string }[] = [];
  if (tipo === "shinigami") {
    if (treinoConcluido(f, "shikai") || pronta("shikai") || f.estado.liberado === "shikai") libs.push({ id: "shikai", nome: "Shikai" });
    if (treinoConcluido(f, "bankai") || pronta("bankai") || f.estado.liberado === "bankai") libs.push({ id: "bankai", nome: "Bankai" });
  }
  if (tipo === "hollow" && (treinoConcluido(f, "resurreccion") || pronta("resurreccion") || f.estado.liberado === "resurreccion")) libs.push({ id: "resurreccion", nome: "Resurrección" });
  if (tipo === "quincy" && (pronta("vollstandig") || f.nivel >= nivelLiberacao(f.classe, tipo, "vollstandig") || f.estado.liberado === "vollstandig")) libs.push({ id: "vollstandig", nome: "Vollständig" });
  if (tipo === "hollow" && treinoConcluido(f, "terror")) libs.push({ id: "terror", nome: "Segunda Etapa" });
  if (f.origem === "visored" && f.treinos.feitos.includes("visored-2")) libs.push({ id: "mascara", nome: "Máscara Hollow" });

  const custoLib = (id: Liberacao) => {
    if (id === "resurreccion") {
      const base = classe?.id === "vazio" ? 40 : 45;
      return f.nivel >= 20 ? Math.ceil(base / 2) : base;
    }
    if (id === "mascara") return 5 * c.prof;
    if (id === "vollstandig") return Math.max(1, 60 - c.reducaoLib.vollstandig);
    if (id === "bankai") return Math.max(1, custoBankai(f) - c.reducaoLib.bankai);
    if (id === "shikai") return Math.max(1, (f.formas?.shikai?.custo ?? 0) - c.reducaoLib.shikai);
    if (id === "terror") return 60;
    return 0;
  };

  /** Terror e Bankai Verdadeira deixam o personagem Esgotado quando terminam (Terror até o descanso longo, Bankai até o descanso curto). */
  const encerrarForma = (): Partial<Ficha["estado"]> => {
    const terror = e.liberado === "terror";
    const verdadeira = e.liberado === "bankai" && f.treinos.caminhoBankai === "verdadeira";
    if (!terror && !verdadeira) return { liberado: "" };
    const usos = { ...e.usos };
    if (verdadeira) usos["esgotado-curto"] = 1;
    else delete usos["esgotado-curto"];
    return { liberado: "", usos, condicoes: e.condicoes.includes("Esgotado") ? e.condicoes : [...e.condicoes, "Esgotado"] };
  };
  const proximoTurno = () => {
    if (e.liberado !== "terror") return;
    alterar({ prAtual: Math.max(0, f.prAtual - 2) });
    setMsg("Novo turno com a Segunda Etapa ativa: −2 PR.");
  };

  const tr = f.treinos;
  const mascaraGasta = e.usos["mascara-turnos"] ?? 0;
  const mascaraRecarga = e.usos["mascara-recarga"] ?? 0;
  const setTreinos = (p: Partial<Ficha["treinos"]>) => alterar({ treinos: { ...f.treinos, ...p } });
  /** Tira a máscara: no fim do tempo fica Esgotado; antes dele, só entra em recarga (dobro do tempo usado). */
  const tirarMascara = (porTempo: boolean) => {
    const usos = { ...e.usos };
    delete usos["mascara-turnos"];
    const temp = tempMascara(mascaraAtiva(f));
    const prAtual = temp.pr ? Math.min(c.pr, f.prAtual) : f.prAtual;
    if (porTempo) {
      alterar({ prAtual, estado: { ...f.estado, liberado: "", usos, condicoes: e.condicoes.includes("Esgotado") ? e.condicoes : [...e.condicoes, "Esgotado"] } });
      setMsg("O tempo da máscara acabou: ela se desfez e você ficou Esgotado.");
    } else {
      usos["mascara-recarga"] = Math.max(1, 2 * mascaraGasta);
      alterar({ prAtual, estado: { ...f.estado, liberado: "", usos } });
      setMsg(`Máscara retirada: em recarga por ${usos["mascara-recarga"]} turno(s). Você não ficou Esgotado.`);
    }
  };
  const ativarMascara = () => {
    if (!tr.mascara) return setMsg("Escolha a sua Máscara Hollow antes de ativá-la.");
    if (mascaraRecarga > 0) return setMsg(`A máscara está em recarga por mais ${mascaraRecarga} turno(s).`);
    let max = tr.mascaraMax ?? 0;
    if (!max) { max = 1 + Math.floor(Math.random() * 4); setTreinos({ mascaraMax: max }); }
    const custo = custoLib("mascara");
    const t = tempMascara(tr.mascara as TipoMascara);
    const usos = { ...e.usos, "mascara-turnos": 1 };
    alterar({
      prAtual: Math.max(0, f.prAtual - custo) + Math.floor(c.pr * t.pr),
      treinos: { ...f.treinos, mascaraMax: max },
      estado: { ...f.estado, liberado: "mascara", usos, pvTemp: Math.max(e.pvTemp, Math.floor(c.pv * t.pv)) },
    });
    som.corte();
    dispararLiberacao("mascara", MASCARAS.find((m) => m.id === tr.mascara)?.nome, tr.mascaraAparencia?.trim() || undefined, tr.mascaraFoto || undefined);
    setMsg(`Máscara ativada (${custo} PR). Ela dura ${max} turno(s), contando este.`);
  };
  const novoTurnoMascara = () => {
    if (e.liberado === "mascara") {
      const gasta = mascaraGasta + 1;
      if (gasta > (tr.mascaraMax ?? 1)) return tirarMascara(true);
      setE({ usos: { ...e.usos, "mascara-turnos": gasta } });
      setMsg(`Turno ${gasta} de ${tr.mascaraMax ?? 1} com a máscara.`);
    } else if (mascaraRecarga > 0) {
      setE({ usos: { ...e.usos, "mascara-recarga": mascaraRecarga - 1 } });
      setMsg(`Recarga da máscara: faltam ${mascaraRecarga - 1} turno(s).`);
    }
  };
  const treinarMascara = () => {
    const ganho = Math.max(1, Math.floor((1 + Math.floor(Math.random() * 6)) / 2));
    setTreinos({ mascaraMax: (tr.mascaraMax ?? 1) + ganho });
    setMsg(`Teste de Determinação bem-sucedido: a máscara agora dura +${ganho} turno(s).`);
  };

  const liberar = (id: Liberacao) => {
    if (id === "mascara") return e.liberado === "mascara" ? tirarMascara(false) : ativarMascara();
    if (e.liberado === id) {
      const fim = encerrarForma();
      setE(fim);
      if (fim.condicoes) setMsg(id === "terror" ? "Segunda Etapa encerrada: você ficou Esgotado até o descanso longo." : "Bankai Verdadeira encerrada: você ficou Esgotado até o descanso curto.");
      return;
    }
    const custo = custoLib(id);
    const ganhoTemp = (id === "resurreccion" || id === "terror") && classe?.id === "vazio" ? (f.nivel >= 16 ? 5 : 3) * f.nivel : 0;
    alterar({ prAtual: Math.max(0, f.prAtual - custo), estado: { ...f.estado, liberado: id, pvTemp: Math.max(e.pvTemp, ganhoTemp) } });
    if (id === "bankai" || id === "resurreccion" || id === "vollstandig") dispararLiberacao(id, f.formas?.[id]?.nome);
    if (id === "terror") dispararLiberacao("resurreccion", id === "terror" ? f.formas?.segunda?.nome || f.formas?.resurreccion?.nome : f.formas?.resurreccion?.nome);
    setMsg(custo ? `${id === "mascara" ? "Máscara" : id === "vollstandig" ? "Vollständig" : id === "bankai" ? "Bankai" : id === "shikai" ? "Shikai" : id === "terror" ? "Segunda Etapa" : "Resurrección"} ativada: ${custo} PR gastos.` : "Liberação marcada. O custo está na descrição da sua Zanpakutou.");
  };

  return (
    <section className="caixa acoes" aria-label="Ações rápidas">
      <div className="acoes-linha">
        <button type="button" className="btn btn-paper" onClick={curto} disabled={e.curtosUsados >= 2}>Descanso curto ({2 - e.curtosUsados} restante{e.curtosUsados === 1 ? "" : "s"})</button>
        <button type="button" className="btn btn-paper" onClick={longo}>Descanso longo</button>
        <button type="button" className="btn btn-paper" onClick={encerrar}>Encerrar combate</button>
        <button type="button" className="btn btn-paper" onClick={() => window.print()}>Imprimir</button>
      </div>

      <div className="bloco-dano">
        <b>Receber dano</b>
        <div className="acoes-linha">
          <input type="number" inputMode="numeric" min={0} placeholder="Dano" value={dano} onChange={(ev) => setDano(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && aplicarDano()} aria-label="Dano recebido" />
          <select value={tipoDano} onChange={(ev) => setTipoDano(ev.target.value as typeof tipoDano)} aria-label="Tipo de dano">
            <option value="fis">Físico (−{c.rdFis})</option>
            <option value="eso">Esotérico (−{c.rdEso})</option>
            <option value="direto">Ignora RD</option>
          </select>
          {f.origem === "lobisomem" && (
            <label className="mini"><input type="checkbox" checked={metade} onChange={(ev) => setMetade(ev.target.checked)} /> metade (Corpo Animalesco)</label>
          )}
          <button type="button" className="btn btn-red" onClick={aplicarDano}>Aplicar</button>
        </div>
        <div className="mini">PV temporários <Passo valor={e.pvTemp} min={0} max={999} rotulo="PV temporários" onChange={(v) => setE({ pvTemp: v })} /></div>
      </div>
      {msg && <p className="ajuda" role="status">{msg}</p>}

      {libs.length > 0 && (
        <div className="acoes-linha">
          <b>Liberação:</b>
          {libs.map((l) => (
            <button key={l.id} type="button" className={`chip chip-btn ${e.liberado === l.id ? "on" : ""}`} aria-pressed={e.liberado === l.id} onClick={() => liberar(l.id)}>
              {l.nome}{custoLib(l.id) ? ` (${custoLib(l.id)} PR)` : ""}
            </button>
          ))}
          {e.liberado === "terror" && <button type="button" className="chip chip-btn" onClick={proximoTurno}>Novo turno (−2 PR)</button>}
          {e.liberado && <span className="ajuda">CR atual {c.cr}.</span>}
        </div>
      )}

      {f.origem === "visored" && f.treinos.feitos.includes("visored-2") && (
        <details className="painel-mascara" open>
          <summary>
            <b>Máscara Hollow</b>
            {e.liberado === "mascara" && <span className="chip on">ativa · turno {mascaraGasta} de {tr.mascaraMax ?? 1}</span>}
            {mascaraRecarga > 0 && <span className="chip">recarga {mascaraRecarga}</span>}
            {tr.mascara && e.liberado !== "mascara" && mascaraRecarga === 0 && <small className="ajuda">{MASCARAS.find((m) => m.id === tr.mascara)?.nome}</small>}
          </summary>
          <div className="acoes-linha">
            <select value={tr.mascara ?? ""} disabled={!!tr.mascara} onChange={(ev) => setTreinos({ mascara: ev.target.value as TipoMascara })} aria-label="Máscara Hollow">
              <option value="">Escolher máscara (permanente)</option>
              {MASCARAS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <span className="ajuda">{tr.mascaraMax ? `Dura ${tr.mascaraMax} turno(s)` : "Tempo ainda não definido (1d4 na primeira vez)"}</span>
            {e.liberado === "mascara" && <span className="chip on">Turno {mascaraGasta} de {tr.mascaraMax ?? 1}</span>}
            {mascaraRecarga > 0 && <span className="chip">Recarga: {mascaraRecarga} turno(s)</span>}
          </div>
          {tr.mascara && <p className="ajuda">{MASCARAS.find((m) => m.id === tr.mascara)?.texto}</p>}
          <div className="acoes-linha foto-mascara">
            {tr.mascaraFoto && <img src={tr.mascaraFoto} alt="Foto da sua máscara" />}
            <label className="btn btn-paper">
              {tr.mascaraFoto ? "Trocar foto da máscara" : "Anexar foto da máscara"}
              <input type="file" accept="image/*" hidden onChange={async (ev) => {
                const arq = ev.target.files?.[0];
                ev.target.value = "";
                if (!arq) return;
                try { setTreinos({ mascaraFoto: await prepararFotoMascara(arq) }); setMsg("Foto anexada: ela aparece na animação quando você ativar a máscara."); }
                catch (er) { setMsg(er instanceof Error ? er.message : "Não foi possível usar essa imagem."); }
              }} />
            </label>
            {tr.mascaraFoto && <button type="button" className="chip chip-btn" onClick={() => setTreinos({ mascaraFoto: "" })}>Remover foto</button>}
          </div>
          <label className="campo">Aparência da máscara (você descreve; aparece na animação)
            <textarea rows={2} maxLength={220} value={tr.mascaraAparencia ?? ""} onChange={(ev) => setTreinos({ mascaraAparencia: ev.target.value })} placeholder="Ex.: osso branco rachado ao meio, uma faixa vermelha cortando o olho esquerdo e dentes à mostra." />
          </label>
          <div className="acoes-linha">
            {(e.liberado === "mascara" || mascaraRecarga > 0) && <button type="button" className="chip chip-btn" onClick={novoTurnoMascara}>Novo turno</button>}
            {tr.mascaraMax ? <button type="button" className="chip chip-btn" onClick={treinarMascara}>Ampliar tempo (teste de Determinação passou)</button> : null}
          </div>
        </details>
      )}

      <details className="condicoes">
        <summary>Condições {e.condicoes.length > 0 && <span className="chip">{e.condicoes.length}</span>}</summary>
        <div className="chips">
          {CONDICOES.map((n) => (
            <Dica key={n} className="dica-inline" balao={<><b>{n}</b><ul>{(CONDICAO_TEXTO[n] ?? []).map((t, i) => <li key={i}>{t}</li>)}</ul></>}>
              <button type="button" className={`chip chip-btn ${e.condicoes.includes(n) ? "on" : ""}`} aria-pressed={e.condicoes.includes(n)} onClick={() => setE({ condicoes: e.condicoes.includes(n) ? e.condicoes.filter((x) => x !== n) : [...e.condicoes, n] })}>
                {n}
              </button>
            </Dica>
          ))}
        </div>
      </details>
    </section>
  );
}
