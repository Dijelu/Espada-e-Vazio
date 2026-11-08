import { useEffect } from "react";
import type { Rolagens } from "./Rolador";
import { treinoConcluido } from "../regras/catalogo";
import { dispararLiberacao, precarregarMascaras } from "./EfeitoLiberacao";
import { custoBankai, nivelLiberacao } from "../regras/liberacoes";
import { aplicarFaz } from "../regras/aplicar-faz";
import { classePorId, type Calculo, type Ficha, type Liberacao } from "../regras/ficha";
import { efeito as som } from "../lib/som";
import { fimDaMascaraEsgota } from "../regras/hogyoku";
import { MASCARAS, MASCARA_TETO, ganhoDeterminacao, mascaraAtiva, tempMascara, type TipoMascara } from "../regras/mascara";

export const LIB_NUM: Record<string, number> = { shikai: 1, bankai: 2, bankai2: 3, resurreccion: 4, terror: 5, vollstandig: 6 };

/** Liberações (Shikai, Bankai, Resurrección, Vollständig, Segunda Etapa) e Máscara Hollow: custos, ligar e desligar, novo turno.
 *  Vive num lugar só para a faixa de Ações rápidas (Agir) e os painéis das formas (Poderes) fazerem exatamente a mesma coisa. */
export function useLiberacao(f: Ficha, c: Calculo, alterar: (p: Partial<Ficha>) => void, r: Rolagens, setMsg: (m: string) => void) {
  const classe = classePorId(f.classe);
  const tipo = classe?.tipo;
  const e = f.estado;
  const temMascara = f.origem === "visored" && f.treinos.feitos.includes("visored-2");
  useEffect(() => { if (temMascara) precarregarMascaras(); }, [temMascara]);
  const setE = (p: Partial<Ficha["estado"]>) => alterar({ estado: { ...f.estado, ...p } });
  /** Máscara Hollow posta: independente da forma ativa (pode estar junto da Shikai/Bankai) */
  const masc = !!mascaraAtiva(f);

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
  const mascMax = Math.min(tr.mascaraMax ?? 1, MASCARA_TETO) + (hg.estabiliza ? 2 : 0) + (e.usos["mascara-extra"] ?? 0);
  /** passou dos turnos base: dá para tentar manter a máscara com um teste de Determinação (CD 12, +2 a cada tentativa seguida) */
  const mascaraTentativas = e.usos["mascara-tentativas"] ?? 0;
  const cdManter = 12 + 2 * mascaraTentativas;
  const mascaraGasta = e.usos["mascara-turnos"] ?? 0;
  const mascaraRecarga = e.usos["mascara-recarga"] ?? 0;
  const setTreinos = (p: Partial<Ficha["treinos"]>) => alterar({ treinos: { ...f.treinos, ...p } });
  /** Tira a máscara: no fim do tempo fica Esgotado; antes dele, só entra em recarga (dobro do tempo usado). */
  const tirarMascara = (porTempo: boolean) => {
    const usos = { ...e.usos };
    delete usos["mascara-turnos"];
    delete usos["mascara-treino"];
    delete usos["mascara-extra"];
    delete usos["mascara-tentativas"];
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
    const usos: Record<string, number> = { ...e.usos, "mascara-turnos": 1 };
    delete usos["mascara-treino"];
    delete usos["mascara-extra"];
    delete usos["mascara-tentativas"];
    alterar({
      prAtual: Math.max(0, f.prAtual - custo) + Math.floor(c.pr * t.pr),
      treinos: { ...f.treinos, mascaraMax: max },
      estado: { ...f.estado, mascaraAtiva: true, usos, pvTemp: Math.max(e.pvTemp, Math.floor(c.pv * t.pv)) },
    });
    som.corte();
    dispararLiberacao("mascara", MASCARAS.find((m) => m.id === tr.mascara)?.nome);
    setMsg(`Máscara ativada (${custo} PR). Ela dura ${max + (hg.estabiliza ? 2 : 0)} turno(s), contando este.`);
  };
  /** Fim dos turnos da máscara: teste de Determinação (d20 + salvaguarda de Mente) contra a CD; passando, +1d6 turnos nesta vez; falhando, a máscara cai. */
  const manterMascara = () => {
    if (!masc) return setMsg("Só dá para manter a máscara com ela posta.");
    if (mascaraGasta < mascMax) return setMsg("A máscara ainda tem turnos: o teste vale quando o tempo acabar.");
    const dado = 1 + Math.floor(Math.random() * 20);
    const total = dado + (c.saves.men?.total ?? c.atr.men);
    if (total < cdManter) {
      setMsg(`Determinação ${total} contra CD ${cdManter}: falhou. A máscara cai.`);
      return tirarMascara(true);
    }
    const ganho = 1 + Math.floor(Math.random() * 6);
    setE({ usos: { ...e.usos, "mascara-extra": (e.usos["mascara-extra"] ?? 0) + ganho, "mascara-tentativas": mascaraTentativas + 1 } });
    setMsg(`Determinação ${total} contra CD ${cdManter}: passou! A máscara dura mais ${ganho} turno(s). Próxima tentativa: CD ${cdManter + 2}.`);
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
  // contagem de uma ficha antiga que passou da duração: a máscara acaba na hora e o contador volta a zero
  const passouDoTempo = masc && mascaraGasta > mascMax;
  useEffect(() => { if (passouDoTempo) tirarMascara(true); }, [passouDoTempo]); // eslint-disable-line react-hooks/exhaustive-deps
  /** um ganho por vez que a máscara é posta, só com ela ligada, e sem passar do teto */
  const baseMasc = Math.min(tr.mascaraMax ?? 1, MASCARA_TETO);
  const mascaraTreinada = !!e.usos["mascara-treino"];
  const podeTreinarMascara = masc && !mascaraTreinada && baseMasc < MASCARA_TETO;
  const treinarMascara = () => {
    if (!masc) return setMsg("O ganho de tempo vale com a máscara posta.");
    if (mascaraTreinada) return setMsg("Você já ganhou tempo nesta vez com a máscara. Ponha a máscara de novo para outro teste.");
    if (baseMasc >= MASCARA_TETO) return setMsg(`A máscara já está no máximo: ${MASCARA_TETO} turnos.`);
    const ganho = Math.min(ganhoDeterminacao(1 + Math.floor(Math.random() * 6)), MASCARA_TETO - baseMasc);
    alterar({ treinos: { ...f.treinos, mascaraMax: baseMasc + ganho }, estado: { ...f.estado, usos: { ...e.usos, "mascara-treino": 1 } } });
    setMsg(`Teste de Determinação bem-sucedido: a máscara agora dura +${ganho} turno(s).`);
  };


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

  return { libs, custoLib, encerrarForma, fx, temTurnoDeForma, proximoTurno, tr, hg, mascMax, cdManter, manterMascara, podeTreinarMascara, mascaraTreinada, mascaraGasta, mascaraRecarga, setTreinos, tirarMascara, ativarMascara, novoTurnoMascara, treinarMascara, liberar, masc, temMascara, setE };
}
