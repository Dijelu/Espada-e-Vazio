import { dispararLiberacao, precarregarMascaras } from "./EfeitoLiberacao";
import { useEffect, useState } from "react";
import { Passo } from "./FichaPecas";
import type { Rolagens } from "./Rolador";
import { CONDICAO_TEXTO, CONDICOES, treinoConcluido } from "../regras/catalogo";
import { Dica, Info } from "./Dica";
import { custoBankai, nivelLiberacao } from "../regras/liberacoes";
import { aplicarFaz } from "../regras/aplicar-faz";
import { classePorId, type Calculo, type Ficha, type Liberacao } from "../regras/ficha";
import { efeito as som } from "../lib/som";
import {
  HOGYOKU_DESEQ_MAX, HOGYOKU_NIVEL_MIN, NIVEL_ESTAGIO, NOME_ESTAGIO, USO_DESEJO_MAIOR, USO_DESEJO_MENOR, USO_FRONTEIRA,
  fimDaMascaraEsgota, ppExtraHogyoku, somarDesequilibrio, type EstagioHogyoku, type Hogyoku,
} from "../regras/hogyoku";
import { MASCARAS, efeitoMascara, mascaraAtiva, tempMascara, type TipoMascara } from "../regras/mascara";

const LIB_NUM: Record<string, number> = { shikai: 1, bankai: 2, bankai2: 3, resurreccion: 4, terror: 5, vollstandig: 6 };

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
  /** Máscara Hollow posta: independente da forma ativa (pode estar junto da Shikai/Bankai) */
  const masc = !!mascaraAtiva(f);

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
    for (const k of Object.keys(usos)) if (/^(esp:|lim-cena:|lim-curto:|req:)/.test(k)) delete usos[k];
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
      estado: { ...f.estado, pvTemp: 0, curtosUsados: 0, ultimoFolegoUsado: false, liberado: "", mascaraAtiva: false, usos: {}, condicoes: e.condicoes.filter((x) => x !== "Esgotado") },
    });
    setMsg("Descanso longo: PV e PR cheios, descansos curtos e habilidades renovados.");
  };

  const encerrar = () => {
    // fim do combate: habilidades por combate voltam e a liberação termina
    const usos = { ...f.estado.usos };
    delete usos["ultimo-folego"];
    const fim = encerrarForma();
    const todos = { ...fim.usos, ...usos };
    // a máscara também se desfaz no fim do combate (sem recarga nem Esgotado); os PR temporários dela saem
    if (masc) delete todos["mascara-turnos"];
    alterar({ ...(masc ? { prAtual: Math.min(c.pr, f.prAtual) } : {}), estado: { ...f.estado, ...fim, usos: todos, mascaraAtiva: false } });
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
    if (treinoConcluido(f, "bankai") || pronta("bankai") || f.estado.liberado === "bankai") libs.push({ id: "bankai", nome: f.treinos.caminhoBankai === "plena" ? "Bankai Plena" : "Bankai" });
    if (f.treinos.caminhoBankai === "verdadeira" && f.nivel >= 20) libs.push({ id: "bankai2", nome: "Bankai Verdadeira" });
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
    if (id === "bankai2") return Math.max(1, (f.formas?.bankai2?.custo ?? 0) - c.reducaoLib.bankai);
    if (id === "shikai") return Math.max(1, (f.formas?.shikai?.custo ?? 0) - c.reducaoLib.shikai);
    if (id === "terror") return 60;
    return 0;
  };

  /** Terror e Bankai Verdadeira deixam o personagem Esgotado quando terminam (Terror até o descanso longo, Bankai até o descanso curto). */
  const encerrarForma = (): Partial<Ficha["estado"]> => {
    const terror = e.liberado === "terror";
    const verdadeira = e.liberado === "bankai2";
    const fimFx = c.forma?.fim;
    const usos = { ...e.usos };
    delete usos["forma-turnos"];
    delete usos["forma-de"];
    for (const k of Object.keys(usos)) if (/^(fx:|esp:|lim-cena:|req:)/.test(k)) delete usos[k];
    if (!terror && !verdadeira && !fimFx) return { liberado: "", usos };
    if (verdadeira || fimFx === "curto") usos["esgotado-curto"] = 1;
    else delete usos["esgotado-curto"];
    return { liberado: "", usos, condicoes: e.condicoes.includes("Esgotado") ? e.condicoes : [...e.condicoes, "Esgotado"] };
  };
  const fx = c.forma;
  /** Há algo que muda a cada turno na forma ativa? */
  const temTurnoDeForma = e.liberado === "terror" || (!!fx && (fx.manutencao > 0 || !!fx.duracao || !!fx.frenesi || fx.gatilhos.some((g) => g.quando === "inicioTurno" || g.limite === "turno" || g.limite === "rodada")));
  /** Novo turno: renova os usos por turno, cobra a manutenção, aplica os efeitos de início de turno e conta a duração. */
  const proximoTurno = () => {
    if (!e.liberado || e.liberado === "mascara") return;
    const usos = { ...e.usos };
    if (usos["forma-de"] !== undefined && usos["forma-de"] !== LIB_NUM[e.liberado]) usos["forma-turnos"] = 0;
    usos["forma-de"] = LIB_NUM[e.liberado] ?? 0;
    for (const g of fx?.gatilhos ?? []) if (g.limite === "turno" || g.limite === "rodada") delete usos[`fx:${g.peca}:${g.rotulo}`];
    const partes: string[] = [];
    let pr = f.prAtual;
    const custo = (e.liberado === "terror" ? 2 : 0) + (fx?.manutencao ?? 0);
    if (custo > 0) {
      if (pr < custo) {
        alterar({ estado: { ...f.estado, ...encerrarForma() } });
        setMsg(`Sem ${custo} PR para manter a forma: ela terminou.`);
        return;
      }
      pr -= custo;
      partes.push(`−${custo} PR de manutenção`);
    }
    // frenesi: a forma pode tirar o controle de você neste turno
    if (fx?.frenesi === "total") {
      partes.push("FRENESI: o Mestre controla o seu personagem neste turno");
    } else if (fx?.frenesi) {
      const cd = (fx.frenesi === "grande" ? 12 : 10) + c.prof;
      const dado = 1 + Math.floor(Math.random() * 20);
      const total = dado + (c.saves.men?.total ?? c.atr.men);
      const passou = dado === 20 || (dado !== 1 && total >= cd);
      partes.push(`Frenesi: salvaguarda de Mente ${dado} + ${total - dado} = ${total} contra CD ${cd}. ${passou ? "Você mantém o controle" : fx.frenesi === "grande" ? "FALHOU: o Mestre joga o seu turno inteiro" : "FALHOU: o seu primeiro ataque vai contra a criatura mais próxima, amiga ou inimiga"}`);
    }
    let pv = f.pvAtual;
    let pvTemp = e.pvTemp;
    for (const g of fx?.gatilhos ?? []) {
      if (g.quando !== "inicioTurno") continue;
      const res = aplicarFaz({ ...f, pvAtual: pv, prAtual: pr, estado: { ...f.estado, pvTemp } }, c, g.faz);
      if (res.parte.pvAtual !== undefined) pv = res.parte.pvAtual;
      if (res.parte.prAtual !== undefined) pr = res.parte.prAtual;
      if (res.pvTemp !== undefined) pvTemp = res.pvTemp;
      if (res.rolar) r.expr(g.rotulo, res.rolar);
      partes.push(`${g.rotulo}: ${res.dito.join(", ") || "feito"}`);
    }
    usos["forma-turnos"] = (usos["forma-turnos"] ?? 0) + 1;
    if (fx?.duracao && usos["forma-turnos"] >= fx.duracao) {
      const fim = encerrarForma();
      alterar({ pvAtual: pv, prAtual: pr, estado: { ...f.estado, pvTemp, ...fim } });
      setMsg(`${[...partes, `a duração de ${fx.duracao} turnos acabou: a forma terminou`].join(". ")}.`);
      return;
    }
    alterar({ pvAtual: pv, prAtual: pr, estado: { ...f.estado, pvTemp, usos } });
    setMsg(`Novo turno${fx?.duracao ? ` (${usos["forma-turnos"]} de ${fx.duracao})` : ""}: ${partes.join("; ") || "nada a cobrar"}.`);
  };

  const tr = f.treinos;
  const hg = c.hogyoku;
  /** duração da máscara: a sorteada/treinada, +2 turnos com o Hōgyoku estabilizando o Hollow */
  const mascMax = (tr.mascaraMax ?? 1) + (hg.estabiliza ? 2 : 0);
  const mascaraGasta = e.usos["mascara-turnos"] ?? 0;
  const mascaraRecarga = e.usos["mascara-recarga"] ?? 0;
  const setTreinos = (p: Partial<Ficha["treinos"]>) => alterar({ treinos: { ...f.treinos, ...p } });
  /** Tira a máscara: no fim do tempo fica Esgotado; antes dele, só entra em recarga (dobro do tempo usado). */
  const tirarMascara = (porTempo: boolean) => {
    const usos = { ...e.usos };
    delete usos["mascara-turnos"];
    const temp = tempMascara(mascaraAtiva(f));
    const prAtual = temp.pr ? Math.min(c.pr, f.prAtual) : f.prAtual;
    // tirar a máscara não encerra a forma (só limpa o formato antigo, em que a máscara ocupava a liberação)
    const semLegado: Partial<Ficha["estado"]> = e.liberado === "mascara" ? { liberado: "" } : {};
    if (porTempo && fimDaMascaraEsgota(f)) {
      alterar({ prAtual, estado: { ...f.estado, ...semLegado, mascaraAtiva: false, usos, condicoes: e.condicoes.includes("Esgotado") ? e.condicoes : [...e.condicoes, "Esgotado"] } });
      setMsg("O tempo da máscara acabou: ela se desfez e você ficou Esgotado.");
    } else {
      usos["mascara-recarga"] = Math.max(1, 2 * mascaraGasta);
      alterar({ prAtual, estado: { ...f.estado, ...semLegado, mascaraAtiva: false, usos } });
      setMsg(`${porTempo ? "O tempo da máscara acabou, mas o Hōgyoku estabilizou o Hollow" : "Máscara retirada"}: em recarga por ${usos["mascara-recarga"]} turno(s). Você não ficou Esgotado.`);
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
      estado: { ...f.estado, mascaraAtiva: true, usos, pvTemp: Math.max(e.pvTemp, Math.floor(c.pv * t.pv)) },
    });
    som.corte();
    dispararLiberacao("mascara", MASCARAS.find((m) => m.id === tr.mascara)?.nome);
    setMsg(`Máscara ativada (${custo} PR). Ela dura ${max + (hg.estabiliza ? 2 : 0)} turno(s), contando este.`);
  };
  const novoTurnoMascara = () => {
    if (masc) {
      const gasta = mascaraGasta + 1;
      if (gasta > mascMax) return tirarMascara(true);
      setE({ usos: { ...e.usos, "mascara-turnos": gasta } });
      setMsg(`Turno ${gasta} de ${mascMax} com a máscara.`);
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

  /* ---- Hōgyoku (artefato opcional do Mestre) ---- */
  const h = f.hogyoku;
  const [desejo, setDesejo] = useState(false);
  const setH = (p: Partial<Hogyoku>) => alterar({ hogyoku: { ...h, ...p } });
  const mudarDeseq = (v: number) => {
    setH({ desequilibrio: v });
    if (v >= HOGYOKU_DESEQ_MAX && h.desequilibrio < HOGYOKU_DESEQ_MAX) setMsg("Desequilíbrio 10: Rejeição. O Mestre decide o que acontece com o portador.");
  };
  const avisoRejeicao = (novo: Hogyoku) => (novo.desequilibrio >= HOGYOKU_DESEQ_MAX && h.desequilibrio < HOGYOKU_DESEQ_MAX ? " Desequilíbrio 10: Rejeição, o Mestre decide." : "");
  const gastouH = (k: string) => !!e.usos[k];
  const marcarUso = (k: string) => ({ ...e.usos, [k]: 1 });
  const novoTurnoHogyoku = () => {
    if (f.pvAtual < 1) return setMsg("Com 0 PV a Regeneração do Hōgyoku não age.");
    const ganho = Math.max(0, Math.min(hg.regen, c.pv - f.pvAtual));
    alterar({ pvAtual: f.pvAtual + ganho });
    setMsg(`Regeneração do Hōgyoku: +${ganho} PV${ganho < hg.regen ? " (PV cheios)" : ""}.`);
  };
  const desejoMenor = () => {
    const novo = somarDesequilibrio(h, 1);
    alterar({ hogyoku: novo, estado: { ...f.estado, usos: marcarUso(USO_DESEJO_MENOR) } });
    setMsg(`Desejo Menor (reação): o teste passa, o ataque acerta ou você fica com 1 PV. +1 Desequilíbrio.${avisoRejeicao(novo)}`);
  };
  const desejoMaior = (pts: number, nome: string) => {
    const novo = somarDesequilibrio(h, pts);
    alterar({ hogyoku: novo, estado: { ...f.estado, usos: marcarUso(USO_DESEJO_MAIOR) } });
    setDesejo(false);
    setMsg(`Desejo Maior (${nome}): +${pts} Desequilíbrio. O Mestre decide como o desejo se cumpre.${avisoRejeicao(novo)}`);
  };
  const crisalida = () => {
    if (h.crisalidaUsada) return;
    const novo = { ...somarDesequilibrio(h, 2), crisalidas: Math.min(3, h.crisalidas + 1), crisalidaUsada: true };
    const antes = ppExtraHogyoku(3, h.crisalidas), depois = ppExtraHogyoku(3, novo.crisalidas);
    alterar({ hogyoku: novo, pvAtual: Math.floor(c.pv / 2), estado: { ...f.estado, condicoes: [] } });
    setMsg(`Crisálida: você volta com ${Math.floor(c.pv / 2)} PV (metade), sem condições. +2 Desequilíbrio. Forma: +${depois - antes} PP (total do Hōgyoku ${depois}).${avisoRejeicao(novo)}`);
  };
  const fronteira = () => {
    setE({ usos: marcarUso(USO_FRONTEIRA) });
    setMsg(`Fronteira Borrada usada (ação completa). Se a criatura não quiser, ela resiste com Espírito contra CD ${hg.cd}.`);
  };
  const alertas: { de: number; texto: string }[] = [
    { de: 3, texto: "Reiatsu detectável a 1 km · sem Suprimir Reiatsu" },
    { de: 5, texto: "Mestre age sozinho 1×/sessão" },
    { de: 7, texto: `Determinação CD ${hg.cd} no início do combate (Distorcido)` },
    { de: 10, texto: "REJEIÇÃO" },
  ];
  const estagioSalvo = h.estagio;
  const nivelAbaixo = f.nivel < HOGYOKU_NIVEL_MIN;

  const liberar = (id: Liberacao) => {
    if (id === "mascara") return masc ? tirarMascara(false) : ativarMascara();
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
    if (id === "bankai2") dispararLiberacao("bankai", f.formas?.bankai2?.nome);
    if (id === "terror") dispararLiberacao("resurreccion", id === "terror" ? f.formas?.segunda?.nome || f.formas?.resurreccion?.nome : f.formas?.resurreccion?.nome);
    setMsg(custo ? `${id === "mascara" ? "Máscara" : id === "vollstandig" ? "Vollständig" : id === "bankai2" ? "Bankai Verdadeira" : id === "bankai" ? "Bankai" : id === "shikai" ? "Shikai" : id === "terror" ? "Segunda Etapa" : "Resurrección"} ativada: ${custo} PR gastos.` : "Liberação marcada. O custo está na descrição da sua Zanpakutou.");
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
      </div>
      {msg && <p className="ajuda" role="status">{msg}</p>}

      {libs.length > 0 && (
        <div className="acoes-linha">
          <b>Liberação:</b>
          {libs.map((l) => (
            <button key={l.id} type="button" className={`chip chip-btn ${(l.id === "mascara" ? masc : e.liberado === l.id) ? "on" : ""}`} aria-pressed={l.id === "mascara" ? masc : e.liberado === l.id} title={l.id === "mascara" ? "Pode pôr ou tirar a qualquer momento; soma aos efeitos da forma ativa." : undefined} onClick={() => liberar(l.id)}>
              {l.nome}{custoLib(l.id) ? ` (${custoLib(l.id)} PR)` : ""}
            </button>
          ))}
          {temTurnoDeForma && <button type="button" className="chip chip-btn" onClick={proximoTurno}>Novo turno{e.liberado === "terror" ? " (−2 PR)" : ""}</button>}
          {(e.liberado || masc) && <span className="ajuda">CR atual {c.cr}.</span>}
        </div>
      )}

      {f.origem === "visored" && f.treinos.feitos.includes("visored-2") && (
        <div className="painel-mascara">
          <b>Máscara Hollow</b>
          {tr.mascara ? (
            <>
              <span className="chip">{MASCARAS.find((m) => m.id === tr.mascara)?.nome.replace("Máscara do ", "")}</span>
              <Info rotulo="Efeitos da máscara">{MASCARAS.find((m) => m.id === tr.mascara)?.texto}</Info>
            </>
          ) : (
            <select value="" onChange={(ev) => setTreinos({ mascara: ev.target.value as TipoMascara })} aria-label="Escolher a Máscara Hollow (permanente)">
              <option value="">Escolher máscara (permanente)</option>
              {MASCARAS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          )}
          {masc && <span className="chip on">turno {mascaraGasta} de {mascMax}</span>}
          {hg.estabiliza && <span className="chip" title="Hōgyoku: +2 turnos e sem Esgotado ao acabar o tempo">Hōgyoku +2</span>}
          {masc && (() => {
            const ef = efeitoMascara(f, c.prof, f.nivel), t = tempMascara(tr.mascara as TipoMascara);
            const b = [
              ef.rd ? `RD ${ef.rd} (menos psíquico e temporal)` : "",
              ef.dadosGolpe ? `+${ef.dadosGolpe} dado${ef.dadosGolpe > 1 ? "s" : ""} nos golpes` : "",
              ef.dadosTecnica ? `+${ef.dadosTecnica} dado${ef.dadosTecnica > 1 ? "s" : ""} nas técnicas` : "",
              ef.cd ? `CD das técnicas +${ef.cd}` : "",
              t.pv ? `dá ${Math.floor(c.pv * t.pv)} PV temp.` : "",
              t.pr ? `dá ${Math.floor(c.pr * t.pr)} PR temp.` : "",
            ].filter(Boolean);
            return b.map((x) => <span className="chip" key={x}>{x}</span>);
          })()}
          {!masc && mascaraRecarga > 0 && <span className="chip">recarga {mascaraRecarga}</span>}
          {!masc && !mascaraRecarga && tr.mascaraMax ? <small className="ajuda">dura {mascMax} turno(s)</small> : null}
          {(masc || mascaraRecarga > 0) && <button type="button" className="chip chip-btn" onClick={novoTurnoMascara}>Novo turno</button>}
          {tr.mascaraMax ? <button type="button" className="chip chip-btn" onClick={treinarMascara} title="Use quando o Mestre pedir o teste de Determinação e você passar">Passei na Determinação (+tempo)</button> : null}
        </div>
      )}

      {estagioSalvo === 0 && h.desequilibrio === 0 ? (
        <details className="painel-hogyoku discreto">
          <summary>Artefato do Mestre: Hōgyoku</summary>
          <div className="acoes-linha">
            <select value={0} onChange={(ev) => setH({ estagio: Number(ev.target.value) as EstagioHogyoku })} aria-label="Ligar o Hōgyoku (estágio)">
              <option value={0}>Sem Hōgyoku</option>
              {([1, 2, 3] as const).map((n) => <option key={n} value={n}>Estágio {n} · {NOME_ESTAGIO[n]} (nível {NIVEL_ESTAGIO[n]})</option>)}
            </select>
            <Info rotulo="Sobre o Hōgyoku">Artefato opcional do Mestre. Só ligue com a autorização dele; o Mestre decide o estágio.</Info>
          </div>
        </details>
      ) : (
        <div className="painel-hogyoku">
          <b>Hōgyoku</b>
          {nivelAbaixo && estagioSalvo > 0 && <span className="chip">Pedra muda (nível 10+)</span>}
          {hg.ativo && <span className="chip">CD {hg.cd}</span>}
          {estagioSalvo > hg.estagio && !nivelAbaixo && <span className="chip" title="O nível do personagem ainda não chega ao estágio marcado">estágio {estagioSalvo} pede nível {NIVEL_ESTAGIO[estagioSalvo as 1 | 2 | 3]}</span>}
          <select value={estagioSalvo} onChange={(ev) => setH({ estagio: Number(ev.target.value) as EstagioHogyoku })} aria-label="Estágio do Hōgyoku">
            <option value={0}>Sem Hōgyoku</option>
            {([1, 2, 3] as const).map((n) => <option key={n} value={n}>Estágio {n} · {NOME_ESTAGIO[n]}</option>)}
          </select>
          <Info rotulo="Sobre o Hōgyoku">Artefato do Mestre (opcional). O estágio só muda com a autorização dele. Cada estágio tem nível mínimo (10, 13 e 17). Os poderes de um estágio continuam nos seguintes. Ao perder o Hōgyoku, escolha “Sem Hōgyoku”: o Desequilíbrio fica.</Info>
          <span className="mini">Desequilíbrio <Passo valor={h.desequilibrio} min={0} max={HOGYOKU_DESEQ_MAX} rotulo="Desequilíbrio (0 a 10)" onChange={mudarDeseq} /></span>
          <Info rotulo="Sobre o Desequilíbrio">Cai −1 por semana sem usar nenhum poder do Hōgyoku (use o −) ou quando o Mestre decidir que a história pagou. O descanso longo não zera.</Info>
          {alertas.filter((a) => h.desequilibrio >= a.de).map((a) => <span className={`chip ${a.de >= 10 ? "on" : ""}`} key={a.de}>{a.de}{a.de >= 10 ? "" : "+"} {a.texto}</span>)}
          {h.desequilibrio >= HOGYOKU_DESEQ_MAX && <span className="ajuda" role="alert">Rejeição: o Mestre decide o que acontece.</span>}
          {hg.ativo && (
            <div className="acoes-linha hogyoku-botoes">
              {hg.estagio >= 1 && <button type="button" className="chip chip-btn" disabled={gastouH(USO_FRONTEIRA)} onClick={fronteira} title="Uma vez por descanso longo, ação completa">Fronteira Borrada{gastouH(USO_FRONTEIRA) ? " (usada)" : ""}</button>}
              {hg.estagio >= 2 && <button type="button" className="chip chip-btn" disabled={gastouH(USO_DESEJO_MENOR)} onClick={desejoMenor} title="Reação, uma vez por descanso longo: +1 Desequilíbrio">Desejo Menor{gastouH(USO_DESEJO_MENOR) ? " (usado)" : ""}</button>}
              {hg.estagio >= 2 && <button type="button" className="chip chip-btn" onClick={novoTurnoHogyoku} title="Regeneração no início do turno">Novo turno (+{hg.regen} PV)</button>}
              {hg.estagio >= 3 && <button type="button" className={`chip chip-btn ${desejo ? "on" : ""}`} aria-expanded={desejo} disabled={gastouH(USO_DESEJO_MAIOR)} onClick={() => setDesejo(!desejo)} title="Fora de combate, 1 hora, uma vez por descanso longo">Desejo Maior{gastouH(USO_DESEJO_MAIOR) ? " (usado)" : ""}</button>}
              {hg.estagio >= 3 && <button type="button" className="chip chip-btn" disabled={h.crisalidaUsada} onClick={crisalida} title="Uma vez por arco de campanha, ao cair a 0 PV">Crisálida{h.crisalidaUsada ? " (usada no arco)" : ""}</button>}
              {hg.estagio >= 3 && h.crisalidaUsada && <button type="button" className="chip chip-btn" onClick={() => setH({ crisalidaUsada: false })} title="Libera a Crisálida para o próximo arco de campanha">novo arco</button>}
              {hg.estagio >= 3 && <span className="chip" title="Poder da Forma: 6 PP + 3 por Crisálida, no máximo 12">Crisálidas {h.crisalidas}/3 · +{hg.ppExtra} PP</span>}
              {hg.estagio >= 3 && <Info rotulo="Sobre o estágio 3">Poder da Forma: a forma mais forte ganha 6 PP extras e mais 3 por Crisálida (máximo 12 PP extras, junto com os pontos do Mestre). Os PP já entram no orçamento do construtor de formas. A Crisálida é uma por arco de campanha; use “novo arco” para liberá-la.</Info>}
            </div>
          )}
          {hg.estagio >= 3 && desejo && !gastouH(USO_DESEJO_MAIOR) && (
            <div className="acoes-linha hogyoku-botoes" role="group" aria-label="Tipo de desejo">
              <button type="button" className="chip chip-btn" onClick={() => desejoMaior(1, "pequeno")}>Pequeno +1</button>
              <button type="button" className="chip chip-btn" onClick={() => desejoMaior(1, "poder, até o descanso longo")}>Poder +1</button>
              <button type="button" className="chip chip-btn" onClick={() => desejoMaior(3, "poder permanente")}>Poder permanente +3</button>
              <button type="button" className="chip chip-btn" onClick={() => desejoMaior(2, "além do portador, não se cumpre")}>Além do portador +2</button>
              <Info rotulo="Sobre o Desejo Maior">Pequeno: achar alguém, abrir caminho, curar os aliados presentes (+1). Poder: uma Essência até o próximo descanso longo (+1) ou para sempre (+3). Além do portador: não se cumpre e dá +2.</Info>
            </div>
          )}
        </div>
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
