import { useLiberacao } from "./useLiberacao";
import { dispararLiberacao, precarregarMascaras } from "./EfeitoLiberacao";
import { useEffect, useState } from "react";
import { Passo } from "./FichaPecas";
import type { Rolagens } from "./Rolador";
import { treinoConcluido } from "../regras/catalogo";
import { Info } from "./Dica";
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
    // descansar tira a máscara e zera a contagem de turnos e a recarga dela
    delete usos["mascara-turnos"];
    delete usos["mascara-treino"];
    delete usos["mascara-extra"];
    delete usos["mascara-tentativas"];
    delete usos["mascara-recarga"];
    alterar({
      pvAtual: Math.min(c.pv, f.pvAtual + Math.floor(c.pv / 2)),
      prAtual: Math.min(c.pr, f.prAtual + Math.floor(c.pr / 2)),
      estado: { ...f.estado, curtosUsados: e.curtosUsados + 1, mascaraAtiva: false, usos, condicoes: limpa ? e.condicoes.filter((x) => x !== "Esgotado") : e.condicoes },
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
    // acabou o combate: a contagem de turnos da forma e da máscara volta a zero
    delete todos["forma-turnos"];
    delete todos["forma-de"];
    // a máscara também se desfaz no fim do combate (sem recarga nem Esgotado); os PR temporários dela saem
    delete todos["mascara-turnos"];
    delete todos["mascara-treino"];
    delete todos["mascara-extra"];
    delete todos["mascara-tentativas"];
    alterar({ ...(masc ? { prAtual: Math.min(c.pr, f.prAtual) } : {}), estado: { ...f.estado, ...fim, usos: todos, mascaraAtiva: false } });
    setMsg("Combate encerrado: habilidades de uso por combate renovadas.");
  };

  const { libs, custoLib, encerrarForma, fx, temTurnoDeForma, proximoTurno, tr, hg, mascMax, cdManter, manterMascara, podeTreinarMascara, mascaraTreinada, mascaraGasta, mascaraRecarga, setTreinos, tirarMascara, novoTurnoMascara, treinarMascara, liberar } = useLiberacao(f, c, alterar, r, setMsg);

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

  return (
    <section className="caixa acoes" aria-label="Ações rápidas">
      <div className="sessao-grupo" role="group" aria-label="Sessão de jogo">
        <button type="button" onClick={curto} disabled={e.curtosUsados >= 2}>Descanso curto <small>({2 - e.curtosUsados} restante{e.curtosUsados === 1 ? "" : "s"})</small></button>
        <button type="button" onClick={longo}>Descanso longo</button>
        <button type="button" onClick={encerrar}>Encerrar combate</button>
        <button type="button" onClick={() => window.print()}>Imprimir</button>
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
          <button type="button" className="btn btn-red btn-aplicar" onClick={aplicarDano}>Aplicar</button>
        </div>
      </div>
      {msg && <p className="ajuda" role="status">{msg}</p>}

      {libs.length > 0 && (
        <div className="acoes-linha painel-lib">
          <b>Liberação</b>
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
          {masc && mascaraGasta >= mascMax && <button type="button" className="chip chip-btn" onClick={manterMascara} title="Teste de Determinação (d20 + Mente) para a máscara durar mais 1d6 turnos. Falhou: ela cai e você fica Esgotado.">Manter a máscara (CD {cdManter})</button>}
          {tr.mascaraMax ? <button type="button" className="chip chip-btn" onClick={treinarMascara} disabled={!podeTreinarMascara} title={!masc ? "Vale com a máscara posta" : mascaraTreinada ? "Já usado nesta vez com a máscara" : !podeTreinarMascara ? "A máscara já está no tempo máximo" : "Use quando o Mestre pedir o teste de Determinação e você passar (uma vez por vez com a máscara)"}>Passei na Determinação (+tempo)</button> : null}
        </div>
      )}

      {estagioSalvo === 0 && h.desequilibrio === 0 ? (
        <details className="painel-hogyoku discreto">
          <summary>Hōgyoku{" "}<small>(artefato do Mestre)</small></summary>
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
    </section>
  );
}
