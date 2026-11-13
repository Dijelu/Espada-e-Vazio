import { acionarPoder, aplicarUsos, estadoDoBotao, medidorDoBotao, resumoDoProximoGolpe, type Medidor, ataqueDeCorte, ataqueDoCopiado, capacidadeDeCopias, REGRA_DOMINIO, ataqueDeEnergia, bonusDeAtaque, efeitoDasCaracs, type BotaoCarac, eco, gastarAcerto, gastarBonus, limparPoder, marcarCortada, marcarLancada, poderesAtivos } from "../regras/poderes";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { calcular, classePorId, ataquesPorAcao, ataqueBonus, type Calculo, type Ficha, type FormaLib, type HabForma, type TipoForma } from "../regras/ficha";
import { TIPO_FORMA_NOME, formaDaLiberacao, liberacaoDaForma, modeloResurreccionPadrao, habilidadesDaForma, resolverDano, danoDaAcao } from "../regras/liberacoes";
import { classificarHab } from "../regras/classificar-hab";
import { habilidadesLidas } from "../regras/cartoes";
import { acertoClasse } from "../regras/danos-classe";
import { ATR_NOME, QUANDO_NOME, ligaCom, type BotaoGerado, type Faz } from "../regras/efeitos-forma";
import { clonesEmCampo, emCampo, invocarModelo, retirarClones } from "../regras/invocar";
import { infoRitmo } from "../regras/cartoes";
import { novoId } from "./FichaPecas";
import { caracsDaAcao } from "../regras/caracteristicas";
import { aplicarFaz } from "../regras/aplicar-faz";
import { MASCARAS, efeitoMascara, mascaraAtiva, tempMascara, type TipoMascara } from "../regras/mascara";
import { fimDaMascaraEsgota } from "../regras/hogyoku";
import { origemDaForma, type OrigemPoder } from "../lib/origem";
import { FA, VA, TK as TKTipado } from "../lib/arte/geradores";

// o gerador é JavaScript portado do protótipo: os parâmetros opcionais dele não têm tipo
const TK = TKTipado as unknown as { mascara: (p: string) => string; resurreccion: (p: string, v: unknown, seed: number, t: string) => string; VAR: { resurreccion: unknown; segunda: unknown } };
import { resumir } from "./TextoCarta";
import { PainelSchrift } from "./PainelSchrift";
import { ArmaDaForma } from "./EscolhaArmaForma";
import { armaEfetiva, ataqueDaArma, caracsEfetivas, danoDoAtaque, golpeBasicoLiberado } from "../regras/arma-forma";
import { AbaInvocacoes } from "./Invocacoes";
import { Icone } from "./Icone";
import { vazia } from "./ConstrutorForma";
import { CartaPoder, type TagCarta } from "./CartaPoder";
import { useLiberacao } from "./useLiberacao";
import type { Rolagens } from "./Rolador";
import "../estilos/formas.css";
import "../estilos/voll.css";

const mod = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
type ItemAcao = { id: string; nome: string; texto: string; custo: string; acao: string; pr?: number; prExpr?: string; dano?: string; limite?: "cena" | "curto" | "longo"; requisito?: string };
type Pele = "shi" | "hol";
export type TipoPainel = TipoForma | "mascara";
const PH = /^(ligar|cadeado|brilho|relogio|gota-pr|coracao|livro-aberto)$/;

/** Ícone do sprite local (sem depender de biblioteca). */
function Ic({ n, cls = "" }: { n: string; cls?: string }) {
  const lado = PH.test(n) ? 256 : 512;
  return <svg className={`ic ${cls}`} viewBox={`0 0 ${lado} ${lado}`} aria-hidden="true" focusable="false"><use href={`/arte/sprite.svg#ic-${n}`} /></svg>;
}
const Html = ({ html, tag = "span", cls }: { html: string; tag?: "span" | "div"; cls?: string }) => (tag === "div" ? <div className={cls} dangerouslySetInnerHTML={{ __html: html }} /> : <span className={cls} style={cls ? undefined : { display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />);

/** Os quatro cantos ornamentais (shi, hol ou holc = carta de osso). */
function Cantos({ v }: { v: "shi" | "hol" | "holc" }) {
  return <>{(["tl", "tr", "bl", "br"] as const).map((c) => <i key={c} className={`cn cn-${c}`} aria-hidden="true"><svg viewBox="0 0 40 40"><use href={`#fo-c-${v}`} /></svg></i>)}</>;
}

const KANJI: Record<string, string> = { shikai: "始", bankai: "解", bankai2: "真" };
const ICONES_PASSIVA: Record<Pele, string[]> = { shi: ["forja-espada", "onda-golpe", "espada-ponta", "fita", "lamina-lua", "brilho"], hol: ["cranio-escudo", "garras", "costelas", "osso-quebrado", "mandibula", "cranio-presas"] };

/** Fissuras do Hollow que invadem o cabeçalho (sobre a arte da forma, ao redor da máscara). Só desenho; a animação é no CSS. */
function FissurasCabeca() {
  const L = ["M488 176 L452 160 L436 128 L398 118 L384 82 L346 70 L330 36", "M488 176 L520 140 L514 104 L548 74 L544 30", "M488 176 L458 214 L470 246 L438 268 L446 306 L414 330", "M488 176 L526 206 L560 200 L586 232 L580 276", "M452 160 L412 168 L386 148 L352 160 L320 140", "M470 246 L508 262 L520 296 L552 306", "M436 128 L452 96 L430 68"];
  return (
    <svg className="fp-fiss fp-fiss-cab" viewBox="0 0 600 340" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
      {L.map((d, i) => <path key={i} className={i % 3 === 2 ? "fl-o" : "fl-v"} d={d} pathLength={100} style={{ ["--k" as string]: i }} />)}
    </svg>
  );
}

/** Fissuras e o fio vermelho pelas bordas do painel todo. */
function FissurasBorda() {
  return (
    <svg className="fp-fiss fp-fiss-borda" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="fl-fio" d="M88 0 L84 6 L90 12 L83 19 L89 27 L85 36 L91 45 L84 55 L90 64 L86 74 L91 84 L87 93 L90 100" pathLength={100} vectorEffect="non-scaling-stroke" />
      <path className="fl-o" d="M84 12 L70 14 L64 18 L50 19" pathLength={100} vectorEffect="non-scaling-stroke" style={{ ["--k" as string]: 1 }} />
      <path className="fl-v" d="M90 45 L74 48 L68 54 L52 56 L46 61" pathLength={100} vectorEffect="non-scaling-stroke" style={{ ["--k" as string]: 2 }} />
      <path className="fl-o" d="M91 84 L76 86 L70 91 L56 92" pathLength={100} vectorEffect="non-scaling-stroke" style={{ ["--k" as string]: 3 }} />
    </svg>
  );
}

function iconeAcao(h: ItemAcao, pele: Pele): string {
  const cl = classificarHab(h as never);
  if (cl.cura || cl.curaPctDano) return "coracao";
  if (/rea[cç][aã]o/i.test(h.acao)) return pele === "shi" ? "choque-laminas" : "cranio-escudo";
  if (cl.teste === "salva") return pele === "shi" ? "onda-golpe" : "sopro-energia";
  if (/b[oô]nus/i.test(h.acao)) return pele === "shi" ? "fitas" : "perna-alada";
  return pele === "shi" ? "lamina-lua" : "garras";
}

/** "Ler completo": o texto inteiro, na pele da mesma origem (igual ao protótipo). */
function Completo({ meta, textos, aberto }: { meta?: [string, string][]; textos: string[]; aberto?: boolean }) {
  return (
    <details className="pf-completo" open={aberto}>
      <summary><span className="ab">Ler completo</span><span className="fe">Fechar</span></summary>
      <div className="cp">
        {meta && meta.length > 0 && <dl className="cp-meta">{meta.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
        {textos.map((t, i) => <p key={i} className="quebra">{t}</p>)}
      </div>
    </details>
  );
}

/** Habilidade da forma como carta (acabamento do protótipo), com os botões de usar e rolar de sempre. */
function CartaAcao({ f, c, r, alterar, forma, h, ativa, onMsg, pele, i }: { f: Ficha; c: Calculo; r: Rolagens; alterar: (p: Partial<Ficha>) => void; forma: FormaLib; h: ItemAcao; ativa: boolean; onMsg: (m: string) => void; pele: Pele | "qui"; i: number }) {
  const B = pele === "qui" ? "b" : "fc-b";
  const FR = pele === "qui" ? "pf-fraco" : "fraco";
  const dano = h.dano ? danoDaAcao(h.dano, f, c, forma, h) : "";
  const gasta = h.prExpr ? Number(resolverDano(h.prExpr, f, c)) || (h.pr ?? 0) : h.pr ?? 0;
  const esp = (h as { especial?: { condicao: string; duracao: string } }).especial;
  const chaveEsp = `esp:${h.id}`;
  const usos = f.estado.usos ?? {};
  const espUsada = !!esp && !!usos[chaveEsp];
  const lim = esp ? undefined : h.limite;
  const chaveLim = `lim-${lim}:${h.id}`;
  const limUsada = !!lim && !!usos[chaveLim];
  const chaveReq = `req:${h.id}`;
  const reqOk = !h.requisito || !!usos[chaveReq];
  const bloqueada = espUsada || limUsada || !reqOk;
  const cl = classificarHab(h as never);
  const cdTec = c.cd + (c.forma?.cd ?? 0);
  const acerto = acertoClasse(f, c) + (cl.distancia ? c.acertoDist : c.acertoCorpo) + (c.forma?.acerto.tecnica ?? 0);
  const ultimo = useRef(0);
  const curar = () => {
    let total = 0;
    if (cl.cura) { const t = r.rolar(`Cura: ${h.nome}`, resolverDano(cl.cura, f, c)); total = t?.total ?? 0; }
    else if (cl.curaPctDano) total = Math.floor((ultimo.current * cl.curaPctDano) / 100);
    if (total <= 0) { onMsg(cl.curaPctDano ? "Role o dano primeiro: a cura é uma parte dele." : "Não consegui rolar a cura."); return; }
    ultimo.current = total;
    alterar({ pvAtual: Math.min(c.pv, f.pvAtual + total) });
    onMsg(`${h.nome}: você recupera ${total} PV.${eco(f, c, total)}`);
  };
  const usar = () => {
    const gasto = { prAtual: Math.max(0, f.prAtual - gasta) };
    if (esp) {
      const condicoes = f.estado.condicoes.includes(esp.condicao) ? f.estado.condicoes : [...f.estado.condicoes, esp.condicao];
      alterar({ ...gasto, estado: { ...f.estado, condicoes, usos: { ...usos, [chaveEsp]: 1 } } });
      onMsg(`${h.nome}: golpe reforçado usado${gasta ? ` (${gasta} PR)` : ""}. Você ficou ${esp.condicao} ${esp.duracao}.`);
    } else if (lim) {
      alterar({ ...gasto, estado: { ...f.estado, usos: { ...usos, [chaveLim]: 1 } } });
      onMsg(`${h.nome}: usada${gasta ? ` (${gasta} PR)` : ""}. Só pode usar de novo ${lim === "cena" ? "na próxima cena" : lim === "curto" ? "depois de um descanso curto" : "depois de um descanso longo"}.`);
    } else {
      alterar(gasto);
      onMsg(`${h.nome}: ${gasta} PR gastos.`);
    }
  };
  // cartões de característica ligados a esta ação: marcas no cartão e botões dos gatilhos (ex.: condição no acerto)
  const ref = { id: h.id, final: (h as { cartao?: { final?: boolean } }).cartao?.final, sub: (h as { cartao?: { sub?: string } }).cartao?.sub };
  const marcas = caracsDaAcao(forma.efeitos, h as unknown as HabForma);
  const ligados = ativa ? (c.forma?.gatilhos ?? []).filter((g) => g.lig && ligaCom(g.lig, ref)) : [];
  const aplicarLigado = (g: (typeof ligados)[number]) => {
    const chave = `fx:${g.peca}:${g.rotulo}`;
    if (g.limite && usos[chave]) { onMsg(`${g.rotulo}: já usado (${g.limite}).`); return; }
    const res = aplicarFaz(f, c, g.faz);
    const est = { ...f.estado };
    if (res.pvTemp !== undefined) est.pvTemp = res.pvTemp;
    if (res.rolar) r.expr(g.rotulo, res.rolar);
    if (g.limite) est.usos = { ...usos, [chave]: 1 };
    alterar({ ...res.parte, estado: est });
    onMsg(`${h.nome}: ${res.dito.join(", ") || "feito"}.`);
  };
  // sinergia: clones juntados à lâmina fortalecem o próximo golpe da ação ligada
  const sinAbs = ativa ? (c.forma?.sinergias ?? []).find((s) => s.faz === "absorver" && s.lig && ligaCom(s.lig, ref)) : undefined;
  const carga = Math.min(2, usos[CARGA_CLONES] ?? 0);
  const extraAbs = sinAbs && carga > 0 ? `+${carga}d10` : "";
  // poderes ligados (cargas, energia, sobrecarga, corte no espaço…): somam no dano e no acerto dos ataques
  const pod = ativa && /\d/.test(dano) && h.acao !== "Reação" && !(cl.cura && cl.cura === h.dano) ? bonusDeAtaque(f, c, !!cl.distancia) : undefined;
  // cartões de característica ligados a esta ação: dado extra, crítico, botões (empurrar, puxar, enfraquecer…)
  const car = ativa ? efeitoDasCaracs(marcas, f, c, { reduzido: ultimo.current, efeito: (h as { cartao?: { efeito?: string } }).cartao?.efeito }) : undefined;
  const danoJogo = `${dano}${extraAbs}${pod ? pod.dados.map((d) => `+${d}`).join("") : ""}${car ? car.dados.map((d) => `+${d}`).join("") : ""}`;
  const acertoJogo = acerto + (pod?.acerto ?? 0);
  const gastarCarga = () => {
    const p = pod ? gastarBonus(f, c, pod) : {};
    const q = Object.fromEntries((car?.gasta ?? []).map((k) => [`pw:${k}`, 1])) as Record<string, number | undefined>;
    if (!extraAbs && Object.keys(p).length === 0 && Object.keys(q).length === 0) return;
    alterar({ estado: { ...f.estado, usos: aplicarUsos(f, extraAbs ? { [CARGA_CLONES]: 0 } : {}, p, q) } });
  };
  const gastarAcertoPoder = () => { if (pod && pod.acerto > 0) alterar({ estado: { ...f.estado, usos: aplicarUsos(f, gastarAcerto(f, c, pod)) } }); };
  const rotulo = espUsada ? "Já usada nesta cena" : limUsada ? "Já usada" : esp ? `Usar golpe reforçado (${gasta} PR)` : lim ? `Usar (${gasta ? `${gasta} PR, ` : ""}${lim === "cena" ? "1 por cena" : lim === "curto" ? "1 por descanso curto" : "1 por descanso longo"})` : `Usar (${gasta} PR)`;
  const { resumo, resto } = resumir(h.texto, 190);
  const [abertoC, setAbertoC] = useState(false);
  // reação "Absorver reiatsu": o texto promete PR extras, então o botão aplica de verdade (1 vez por turno)
  const ehAbsorver = /ganha PR extras iguais à sua proficiência/i.test(h.texto ?? "");
  const chaveAbs = `fx:abs:${h.id}`;
  const absUsado = !!usos[chaveAbs];
  const absorver = () => {
    if (absUsado) { onMsg(`${h.nome}: já usado neste turno.`); return; }
    const antes = f.prAtual - gasta;
    const ganho = Math.max(0, Math.min(c.pr + c.prof, Math.max(0, antes) + c.prof) - Math.max(0, antes));
    alterar({ prAtual: Math.max(0, antes) + ganho, estado: { ...f.estado, usos: { ...usos, [chaveAbs]: 1 } } });
    onMsg(`${h.nome}: ${gasta} PR gastos e ${ganho} PR absorvidos.`);
  };
  const usarCarac = (b: BotaoCarac) => {
    if (b.d20) r.d20(`${b.rotulo}: ${h.nome}`, acertoJogo, undefined, car?.critMin);
    if (b.expr) r.rolar(`${b.rotulo}: ${h.nome}`, b.expr);
    if (b.usos) alterar({ estado: { ...f.estado, usos: aplicarUsos(f, b.usos) } });
    if (b.dito) onMsg(`${h.nome}: ${b.dito}`);
  };
  const botoes: ReactNode[] = [];
  if (ativa) {
    if (ehAbsorver) botoes.push(<button key="ab" type="button" className={B} disabled={f.prAtual < gasta || absUsado || !reqOk} onClick={absorver}>{absUsado ? "Já absorveu neste turno" : `Absorver (+${c.prof} PR)`}</button>);
    else if (gasta > 0 || esp || lim) botoes.push(<button key="u" type="button" className={B} disabled={f.prAtual < gasta || bloqueada} onClick={usar}>{!reqOk ? "Falta o requisito" : rotulo}</button>);
    if (!cl.usaInvocacao && (cl.teste === "ataque" || cl.teste === "ataque+salva")) botoes.push(<button key="a" type="button" className={B} disabled={!reqOk} onClick={() => { r.d20(`Acerto: ${h.nome}`, acertoJogo, undefined, car?.critMin); gastarAcertoPoder(); }}><Icone nome="dado" /> Acerto {mod(acertoJogo)}</button>);
    if (/\d/.test(dano) && !(cl.cura && cl.cura === h.dano)) botoes.push(<button key="d" type="button" className={B} disabled={!reqOk} onClick={() => { ultimo.current = r.rolar(h.nome, danoJogo)?.total ?? 0; gastarCarga(); }}><Icone nome="dado" /> Dano {danoJogo}</button>);
    if (/\d/.test(dano) && (cl.teste === "ataque" || cl.teste === "ataque+salva")) botoes.push(<button key="c" type="button" className={`${B} ${FR}`} disabled={!reqOk} onClick={() => { r.expr(`Crítico: ${h.nome}`, danoJogo, true); gastarCarga(); }}>Crítico</button>);
    if (cl.cura || cl.curaPctDano) botoes.push(<button key="h" type="button" className={B} disabled={!reqOk} onClick={curar}>{cl.cura ? `Curar ${resolverDano(cl.cura, f, c)}` : `Curar ${cl.curaPctDano}% do último dano`}</button>);
    ligados.forEach((g, k) => { const usado = !!g.limite && !!usos[`fx:${g.peca}:${g.rotulo}`]; botoes.push(<button key={`g${k}`} type="button" className={B} disabled={!reqOk || usado} title={`${g.peca}${g.limite ? `, 1 por ${g.limite}` : ""}`} onClick={() => aplicarLigado(g)}>{usado ? `${g.rotulo}: já usado` : g.rotulo}</button>); });
    car?.botoes.forEach((b) => botoes.push(<button key={`cb${b.id}`} type="button" className={`${B}${b.aceso ? " aceso" : ""}`} disabled={!reqOk || !!b.travado} title={b.travado ?? b.dica} onClick={() => usarCarac(b)}>{b.d20 || b.expr ? <Icone nome="dado" /> : null} {b.rotulo}</button>));
  } else {
    botoes.push(<button key="x" type="button" className={`${B} ${FR}`} disabled>Ligue a forma</button>);
  }
  const tags: ReactNode[] = [];
  if (ativa && !cl.usaInvocacao && (cl.teste === "ataque" || cl.teste === "ataque+salva")) tags.push(<span className="fc-t" key="ac">acerto {mod(acertoJogo)}</span>);
  if (ativa && (cl.teste === "salva" || cl.teste === "ataque+salva")) tags.push(<span className="fc-t" key="cd">CD {cdTec}{cl.salvaAtr ? ` ${ATR_NOME[cl.salvaAtr]}` : ""}{cl.metade ? " · metade" : ""}</span>);
  if (h.custo && !/\d\s*PR/.test(h.custo) && h.custo !== "—") tags.push(<span className="fc-t" key="cu">{h.custo}</span>);
  marcas.forEach((e) => tags.push(<span className="fc-t" key={`m${e.id}`}>{e.nome}</span>));
  if (extraAbs) tags.push(<span className="fc-t" key="ab">clones na lâmina {extraAbs}</span>);
  pod?.tags.forEach((t, k) => tags.push(<span className="fc-t fc-poder" key={`pw${k}`}>{t}</span>));
  car?.tags.forEach((t, k) => tags.push(<span className="fc-t fc-poder" key={`cr${k}`}>{t}</span>));
  if (lim) tags.push(<span className="fc-t" key="li">1 por {lim === "cena" ? "cena" : lim === "curto" ? "descanso curto" : "descanso longo"}</span>);
  if (pele === "qui") {
    const tq: TagCarta[] = [];
    if (gasta > 0) tq.push({ t: `${gasta} PR`, pr: true });
    if (ativa && !cl.usaInvocacao && (cl.teste === "ataque" || cl.teste === "ataque+salva")) tq.push({ t: `acerto ${mod(acertoJogo)}` });
    if (ativa && (cl.teste === "salva" || cl.teste === "ataque+salva")) tq.push({ t: `CD ${cdTec}` });
    if (lim) tq.push({ t: `1 por ${lim === "cena" ? "cena" : lim === "curto" ? "descanso curto" : "descanso longo"}` });
    marcas.forEach((e) => tq.push({ t: e.nome }));
    if (extraAbs) tq.push({ t: `clones na lâmina ${extraAbs}` });
    pod?.tags.forEach((t) => tq.push({ t }));
    car?.tags.forEach((t) => tq.push({ t }));
    return (
      <CartaPoder tipo="voll" selo={h.acao} nome={h.nome || "Habilidade"} tags={tq} ativa={ativa} off={!ativa}
        acao={<>{botoes}{resto && <button type="button" className="info" aria-label={`Ler o texto completo de ${h.nome}`} onClick={() => setAbertoC((v) => !v)}>i</button>}</>}
        completo={resto ? <Completo aberto={abertoC} meta={[["Ação", h.acao], ...(gasta ? [["Custo", `${gasta} PR`] as [string, string]] : []), ...(dano ? [["Dano", dano] as [string, string]] : [])]} textos={[h.texto]} /> : undefined}>
        <p>{resumo}</p>
        {h.requisito && (
          <label className="check fc-req">
            <input type="checkbox" checked={!!usos[chaveReq]} onChange={(e) => { const u = { ...usos }; if (e.target.checked) u[chaveReq] = 1; else delete u[chaveReq]; alterar({ estado: { ...f.estado, usos: u } }); }} />
            Requisito cumprido: {h.requisito}
          </label>
        )}
      </CartaPoder>
    );
  }
  return (
    <div className="cwx fc-wrap" data-orig={pele}>
      <article className={`fc fc-acao${ativa ? "" : " off"}`} style={{ ["--i" as string]: i }} aria-label={h.nome}>
        <div className="fc-top">
          <svg className="fc-art" aria-hidden="true"><use href={`#fa-${pele}-${i % 3}`} /></svg>
          <span className="fc-tipo">{h.acao}</span>
          <Html html={FA.medalhao(pele as Pele, iconeAcao(h, pele as Pele))} />
          {!ativa && <span className="fc-trava"><Ic n="cadeado" /><span className="vh">travada</span></span>}
        </div>
        <h4>{h.nome || "Habilidade"}</h4>
        <div className="fc-tags">{gasta > 0 && <span className="fc-pr"><b>{gasta}</b> PR</span>}{tags}</div>
        <p>{resumo}</p>
        {h.requisito && (
          <label className="check fc-req">
            <input type="checkbox" checked={!!usos[chaveReq]} onChange={(e) => { const u = { ...usos }; if (e.target.checked) u[chaveReq] = 1; else delete u[chaveReq]; alterar({ estado: { ...f.estado, usos: u } }); }} />
            Requisito cumprido: {h.requisito}
          </label>
        )}
        <div className="fc-act">{botoes}{resto && <button type="button" className="fc-i" aria-label={`Ler o texto completo de ${h.nome}`} onClick={() => setAbertoC((v) => !v)}>i</button>}</div>
        <Cantos v={pele === "shi" ? "shi" : "holc"} />
      </article>
      {resto && <Completo aberto={abertoC} meta={[["Ação", h.acao], ...(gasta ? [["Custo", `${gasta} PR`] as [string, string]] : []), ...(dano ? [["Dano", dano] as [string, string]] : [])]} textos={[h.texto]} />}
    </div>
  );
}

/** Quantos clones estão juntados à lâmina (somam 1d10 cada no próximo golpe da ação ligada; no máximo 2). */
const CARGA_CLONES = "fx:absorvidos";

/** O que cada botão criado por um cartão de característica faz em jogo. */
/** O que a pessoa digitou ou escolheu para o botão: dano sofrido, regra do domínio, poder copiado. */
interface ExtraBotao { dano?: number; opcao?: number; copia?: { nome: string; dano: string; pr: number }; indiceCopia?: number }

function executarBotao(f: Ficha, c: Calculo, r: Rolagens, alterar: (p: Partial<Ficha>) => void, b: BotaoGerado, dizer: (m: string) => void, ex: ExtraBotao = {}) {
  if (b.faz === "invocar") {
    const m = c.forma?.invocacoes.find((x) => x.chave === b.ref);
    if (!m) { dizer(`${b.rotulo}: ligue a forma primeiro.`); return; }
    const res = invocarModelo(f, m, novoId, m.max);
    if (res.criadas === 0) { dizer(res.motivo === "pr" ? `${b.rotulo}: faltam PR (${m.custoPr} PR cada).` : `${b.rotulo}: já está no máximo (${m.max}).`); return; }
    alterar(res.parte);
    dizer(`${b.rotulo}: ${res.criadas} ${res.criadas === 1 ? "criatura entrou" : "criaturas entraram"} na aba Invocações (${m.custoPr * res.criadas} PR).`);
    return;
  }
  const pr = infoRitmo(b.ritmo).pr;
  if (f.prAtual < pr) { dizer(`${b.rotulo}: precisa de ${pr} PR.`); return; }
  const gasto = { prAtual: Math.max(0, f.prAtual - pr) };
  const usos = f.estado.usos ?? {};
  // usar o poder copiado: o custo é o do poder original e o sistema rola o ataque e o dano anotados
  if (b.rotulo === "Usar o poder copiado") {
    const lista = f.estado.copiados ?? [];
    const x = lista[Math.min(ex.indiceCopia ?? lista.length - 1, lista.length - 1)];
    if (Number(usos["pw:copia"]) < 1 || !Number(usos["pw:copia"])) { dizer(`${b.rotulo}: não há cópia (copie um poder primeiro).`); return; }
    if (!x) { dizer(`${b.rotulo}: anote o nome e o dano ao copiar o poder; sem isso não há o que rolar.`); return; }
    const at = ataqueDoCopiado(c, x);
    const custo = at.pr > 0 ? at.pr : pr;
    if (f.prAtual < custo) { dizer(`${b.rotulo}: ${at.nome} custa ${custo} PR.`); return; }
    alterar({ prAtual: Math.max(0, f.prAtual - custo) });
    r.d20(`Acerto: ${at.nome} (copiado)`, at.acerto);
    if (/\d/.test(at.dano)) r.rolar(`${at.nome} (copiado)`, at.dano);
    dizer(`${at.nome} (poder copiado): ${custo} PR gastos; acerto ${at.acerto >= 0 ? "+" : ""}${at.acerto}${/\d/.test(at.dano) ? `, dano ${at.dano}` : ""}.`);
    return;
  }
  // poderes das técnicas e interações especiais: guardam estado na ficha e dão bônus aos cartões de ação
  const pw = acionarPoder(b.rotulo, f, c, (rot, expr) => r.rolar(rot, expr)?.total ?? 0, ex.dano ?? 0, ex.opcao ?? 0);
  if (pw) {
    if (pw.erro) { dizer(pw.erro); return; }
    const est = { ...f.estado, usos: aplicarUsos(f, pw.usos ?? {}) };
    if (pw.pvTemp !== undefined) est.pvTemp = pw.pvTemp;
    // defesas que reduzem o dano: o que sobra é descontado (PV temporários primeiro)
    let pvAtual = f.pvAtual;
    if (pw.perdePv && pw.perdePv > 0) {
      const t = Math.min(est.pvTemp ?? 0, pw.perdePv);
      est.pvTemp = (est.pvTemp ?? 0) - t;
      pvAtual = Math.max(0, f.pvAtual - (pw.perdePv - t));
    }
    // dispersar o enxame: metade das criaturas do enxame some
    if (pw.perdePv !== undefined && /enxame/i.test(b.rotulo)) {
      const chaves = new Set((c.forma?.invocacoes ?? []).filter((m) => /enxame/i.test(m.peca)).map((m) => m.chave));
      const lista = [...(est.invocacoes ?? [])];
      const alvo = lista.filter((x) => chaves.has(x.chave));
      const tira = Math.floor(alvo.length / 2);
      for (let k = 0; k < tira; k++) lista.splice(lista.findIndex((x) => chaves.has(x.chave)), 1);
      est.invocacoes = lista;
    }
    if (pw.curaPv && pw.curaPv > 0) pvAtual = Math.min(c.pv, pvAtual + pw.curaPv);
    if (pw.some) est.invocacoes = (est.invocacoes ?? []).filter((x) => x.id !== pw.some);
    if (pw.renasce) { est.invocacoes = [...(est.invocacoes ?? []), pw.renasce]; est.caida = undefined; }
    if (b.rotulo === "Copiar poder" && ex.copia) est.copiados = [...(f.estado.copiados ?? []), ex.copia].slice(-capacidadeDeCopias(c));
    alterar({ ...gasto, pvAtual, ...(pw.ganhaPr ? { prAtual: Math.min(c.pr, (gasto.prAtual ?? f.prAtual) + pw.ganhaPr) } : {}), estado: est });
    dizer(`${b.rotulo}: ${pw.dito ?? "feito"} (${pr} PR)`);
    return;
  }
  if (b.faz === "trocar") {
    if (clonesEmCampo(f) === 0) { dizer(`${b.rotulo}: você precisa de um clone em campo.`); return; }
    const { lista } = retirarClones(f, 1);
    alterar({ ...gasto, estado: { ...f.estado, invocacoes: lista, usos: aplicarUsos(f, { "pw:vantagem": 1 }) } });
    dizer(`${b.rotulo}: você troca de lugar com um clone (ele some) e o seu próximo ataque no turno ganha vantagem (${pr} PR).`);
    return;
  }
  if (b.faz === "absorver") {
    const ja = Math.min(2, usos[CARGA_CLONES] ?? 0);
    const quer = Math.min(2 - ja, clonesEmCampo(f));
    if (2 - ja <= 0) { dizer(`${b.rotulo}: já há 2 clones na lâmina.`); return; }
    if (quer <= 0) { dizer(`${b.rotulo}: você precisa de um clone em campo.`); return; }
    const { lista, saiu } = retirarClones(f, quer);
    alterar({ ...gasto, estado: { ...f.estado, invocacoes: lista, usos: { ...usos, [CARGA_CLONES]: ja + saiu } } });
    dizer(`${b.rotulo}: ${saiu} ${saiu === 1 ? "clone se juntou" : "clones se juntaram"} à lâmina. O seu próximo golpe da ação ligada causa +${ja + saiu}d10 (${pr} PR).`);
    return;
  }
  alterar(gasto);
  if (b.ref && /\d+d\d+/.test(b.ref)) r.rolar(`${b.rotulo}`, b.ref);
  dizer(`${b.rotulo}: ${pr} PR gastos.${b.ref && /\d+d\d+/.test(b.ref) ? ` Dado rolado: ${b.ref}.` : ""}`);
}

const DEFESAS = ["Dispersar o enxame", "Passar o dano", "Absorver o golpe", "Gastar cargas para se proteger", "Barreira recebe o golpe"];
/** Campo "dano que você ia sofrer": os botões de defesa descontam o resultado dos PV. */
function CampoDano({ botoes, valor, onChange }: { botoes: { rotulo: string }[]; valor: string; onChange: (v: string) => void }) {
  if (!botoes.some((b) => DEFESAS.includes(b.rotulo))) return null;
  return (
    <label className="campo-dano">
      <span>Dano que você ia sofrer</span>
      <input type="number" inputMode="numeric" min={0} value={valor} placeholder="0" onChange={(e) => onChange(e.target.value)} />
      <small>Os botões de defesa (Absorver, Passar o dano, Dispersar, Cargas, Barreira) descontam o resultado dos seus PV. Deixe vazio para ver só a regra.</small>
    </label>
  );
}

/** Ao copiar um poder, a pessoa anota o nome, o dano e o custo em PR; assim o botão "Usar o poder copiado" rola o ataque de verdade. */
function CampoCopia({ botoes, nome, dano, pr, set }: { botoes: { rotulo: string }[]; nome: string; dano: string; pr: string; set: { nome: (v: string) => void; dano: (v: string) => void; pr: (v: string) => void } }) {
  if (!botoes.some((b) => b.rotulo === "Copiar poder")) return null;
  return (
    <div className="campo-dano campo-copia">
      <span>Poder a copiar</span>
      <input type="text" className="in-nome" value={nome} placeholder="Nome do poder" onChange={(e) => set.nome(e.target.value)} />
      <input type="text" value={dano} placeholder="Dano (ex.: 4d8)" onChange={(e) => set.dano(e.target.value)} />
      <input type="number" inputMode="numeric" min={0} value={pr} placeholder="PR" onChange={(e) => set.pr(e.target.value)} />
      <small>Escreva antes de apertar Copiar poder. Depois, "Usar o poder copiado" rola o ataque com o seu melhor atributo e cobra o PR do poder original.</small>
    </div>
  );
}

/** Botão de um poder. Os que precisam de uma escolha viram vários botões: a regra do domínio, quem ataca ao Comandar, qual poder copiado usar. */
function botaoDoPoder(f: Ficha, c: Calculo, r: Rolagens, alterar: (p: Partial<Ficha>) => void, dizer: (m: string) => void, b: BotaoGerado, base: ExtraBotao, cls: string): ReactNode {
  const est = estadoDoBotao(b.rotulo, f, c);
  const semPr = b.faz === "texto" && b.rotulo !== "Usar o poder copiado" && f.prAtual < infoRitmo(b.ritmo).pr;
  const motivo = !est.pronto ? est.motivo : semPr ? `faltam PR (${infoRitmo(b.ritmo).pr})` : undefined;
  const normal = (rot: string, ex: ExtraBotao = {}, key?: string) => (
    <button key={key ?? rot} type="button" className={`${cls}${est.aceso && !semPr ? " aceso" : ""}${motivo ? " travado" : ""}`} aria-disabled={motivo ? true : undefined} title={motivo ? `Agora não: ${motivo}` : undefined} onClick={() => executarBotao(f, c, r, alterar, b, dizer, { ...base, ...ex })}>{rot}</button>
  );
  if (b.rotulo === "Impor a regra do domínio") return <>{[1, 2, 3].map((o) => normal(({ 1: "Terreno difícil", 2: "Inimigos −2 CR", 3: "Vantagem nas salvaguardas" } as Record<number, string>)[o], { opcao: o }))}</>;
  if (b.rotulo === "Comandar invocação") {
    const lista = f.estado.invocacoes ?? [];
    if (lista.length === 0) return <button type="button" className={cls} disabled>Nenhuma criatura em campo</button>;
    const pr = infoRitmo(b.ritmo).pr;
    return <>{lista.map((x) => (
      <button key={x.id} type="button" className={cls} disabled={f.prAtual < pr} onClick={() => {
        alterar({ prAtual: Math.max(0, f.prAtual - pr) });
        r.d20(`Acerto: ${x.nome}`, x.acerto);
        const d = x.dano ? resolverDano(x.dano, f, c) : "";
        if (/\d/.test(d)) r.rolar(`${x.nome}: dano`, d);
        dizer(`Comandar invocação: ${x.nome} ataca (acerto ${x.acerto >= 0 ? "+" : ""}${x.acerto}${/\d/.test(d) ? `, dano ${d}` : ""}). ${pr} PR gastos.`);
      }}><Icone nome="dado" /> {x.nome} ataca (+{x.acerto})</button>
    ))}</>;
  }
  if (b.rotulo === "Usar o poder copiado") {
    const lista = f.estado.copiados ?? [];
    if (lista.length === 0) return normal("Usar o poder copiado");
    return <>{lista.map((x, k) => normal(`${x.nome}${x.pr ? ` (${x.pr} PR)` : ""}`, { indiceCopia: k }, `cp${k}`))}</>;
  }
  return normal(b.faz === "invocar" ? `${b.rotulo} (${emCampo(f, b.ref ?? "")} em campo)` : b.rotulo, {}, b.rotulo);
}

/** Medidor de uma técnica: bolinhas (cargas, marcas, doses) ou barra (PV da barreira, dano guardado). */
function MedidorPoder({ m }: { m: Medidor }) {
  const cheio = m.atual >= m.max && m.max > 0;
  if (m.tipo === "barra") {
    return (
      <span className={`med med-barra${cheio ? " cheio" : ""}${m.atual > 0 ? " on" : ""}`} role="img" aria-label={`${m.nome}: ${m.atual} de ${m.max}`}>
        <i>{m.nome}</i><span className="med-trilho"><span style={{ width: `${Math.min(100, (m.atual / Math.max(1, m.max)) * 100)}%` }} /></span><b>{m.atual}<small>/{m.max}</small></b>
      </span>
    );
  }
  return (
    <span className={`med med-pips${cheio ? " cheio" : ""}${m.atual > 0 ? " on" : ""}`} role="img" aria-label={`${m.nome}: ${m.atual} de ${m.max}`}>
      <i>{m.nome}</i><span className="med-pp">{Array.from({ length: m.max }, (_, k) => <span key={k} className={k < m.atual ? "on" : ""} />)}</span>{m.max > 1 && <b>{m.atual}<small>/{m.max}</small></b>}
    </span>
  );
}

interface LinhaInteracao { nome: string; texto: string; botoes: ReactNode[]; custo?: string }
interface GrupoTecnica { id: string; nome: string; texto: string; rot: string; medidor?: Medidor; botoes: { no: ReactNode; custo: string }[]; ataque?: { nome: string; texto: string; no: ReactNode }; ints: LinhaInteracao[] }

/** Uma técnica especial no painel: o que ela é, o medidor dela, os botões que ela cria e, embaixo, as interações que a completam. */
function CartaTecnica({ g, pele, ligada }: { g: GrupoTecnica; pele: Pele; ligada: boolean }) {
  return (
    <div className="cwx fc-wrap fc-tec-wrap" data-orig={pele}>
      <article className={`fc fc-unica fc-tec${g.medidor && g.medidor.atual > 0 ? " viva" : ""}`} aria-label={g.nome}>
        <Html html={FA.medalhao(pele, "eclipse")} />
        <div className="fc-un-c">
          <div className="tec-topo"><span className="fc-rot">{g.rot}</span>{g.medidor && <MedidorPoder m={g.medidor} />}</div>
          <h4>{g.nome}</h4>
          <p>{trecho(g.texto, 190)}</p>
          {ligada && g.botoes.length > 0 && <div className="tec-botoes">{g.botoes.map((b, k) => <span key={k} className="tec-b">{b.no}<small>{b.custo}</small></span>)}</div>}
          {g.ataque && (
            <div className="tec-ataque">
              <span className="tec-sub">Ação criada pela técnica</span>
              <b>{g.ataque.nome}</b>
              <p>{g.ataque.texto}</p>
              {ligada && <div className="tec-botoes">{g.ataque.no}</div>}
            </div>
          )}
          {g.ints.length > 0 && (
            <ul className="tec-ints" aria-label={`Interações de ${g.nome}`}>
              {g.ints.map((x) => (
                <li key={x.nome} className={x.botoes.length ? "" : "passiva"}>
                  <div><b>{x.nome}</b>{x.botoes.length === 0 && <em>sempre ligada</em>}{x.custo && <em>{x.custo}</em>}<p>{trecho(x.texto, 150)}</p></div>
                  {ligada && x.botoes.length > 0 && <div className="tec-botoes">{x.botoes}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Cantos v={pele} />
      </article>
      <Completo textos={[g.texto, ...g.ints.map((x) => `${x.nome}: ${x.texto}`)]} />
    </div>
  );
}

/** O resultado do último botão, num aviso que salta na tela e some sozinho (o texto também fica no topo do painel). */
function AvisoAcao({ msg }: { msg: string }) {
  const [visto, setVisto] = useState("");
  useEffect(() => {
    if (!msg) return;
    setVisto(msg);
    const t = window.setTimeout(() => setVisto(""), 6500);
    return () => window.clearTimeout(t);
  }, [msg]);
  if (!visto) return null;
  const erro = /precisa|primeiro|não há|não tem|já |sem |faltam|escreva|escolha|máximo/i.test(visto.split(":").slice(1).join(":").slice(0, 60)) && !/gastos|recupera|sofre|dano/i.test(visto);
  return <div key={visto} className={`aviso-acao${erro ? " erro" : ""}`} role="status" aria-live="polite"><span>{visto}</span><button type="button" aria-label="Fechar aviso" onClick={() => setVisto("")}>✕</button></div>;
}

/** Os poderes que as técnicas deixaram ligados (cargas, energia, marcas, domínio…), com o ✕ para apagar um. */
function PoderesAtivos({ f, c, alterar, pele }: { f: Ficha; c?: Calculo; alterar: (p: Partial<Ficha>) => void; pele?: "qui" }) {
  const lista = poderesAtivos(f);
  if (lista.length === 0) return null;
  const prox = c ? resumoDoProximoGolpe(f, c) : undefined;
  return (
    <div className={`poderes-ativos${pele === "qui" ? " pq" : ""}`} role="status" aria-label="Poderes ligados">
      <em>Ligado agora:</em>
      {lista.map((p) => (
        <span key={p.id} className="chip-poder">{p.nome} <b>{p.valor}</b>
          <button type="button" aria-label={`Apagar ${p.nome}`} title="Apagar" onClick={() => alterar({ estado: { ...f.estado, usos: aplicarUsos(f, limparPoder(p.id)) } })}>✕</button>
        </span>
      ))}
      {prox && (prox.corpo || prox.dist) && (
        <span className="prox-golpe" title="O que os poderes ligados somam ao seu próximo golpe">
          <i>Próximo golpe</i>
          {prox.corpo === prox.dist ? <b>{prox.corpo}</b> : <>{prox.corpo && <b>corpo a corpo {prox.corpo}</b>}{prox.dist && <b>à distância {prox.dist}</b>}</>}
        </span>
      )}
    </div>
  );
}

/** Linha de custo e do que o botão faz, para o cartão do botão. */
const custoDoBotao = (b: BotaoGerado, c: Calculo) => {
  if (b.faz === "invocar") { const m = c.forma?.invocacoes.find((x) => x.chave === b.ref); return m ? `${m.custoPr} PR cada · até ${m.max}` : "invocar"; }
  return `${infoRitmo(b.ritmo).nome} · ${infoRitmo(b.ritmo).pr} PR`;
};

/** A arma da forma: nome, propriedades e características (com ⓘ). Com a arma aprovada, o golpe básico usa os dados dela. */
function SecaoArma({ f, c, r, alterar, forma, ligada, onMsg, vollst }: { f: Ficha; c: Calculo; r: Rolagens; alterar: (p: Partial<Ficha>) => void; forma: FormaLib | undefined; ligada: boolean; onMsg: (m: string) => void; vollst?: boolean }) {
  const arma = forma ? armaEfetiva(f, forma) : undefined;
  if (!forma || !arma) return null;
  const caracs = caracsEfetivas(f, forma);
  const golpe = golpeBasicoLiberado(arma) ? ataqueDaArma(arma, c) : undefined;
  const danoBase = golpe ? danoDoAtaque(f, golpe, c) : "";
  // poderes ligados (energia, cargas, sobrecarga, corte no espaço…) também valem para o golpe básico da arma
  const pod = golpe && ligada && /\d/.test(danoBase) ? bonusDeAtaque(f, c, !!golpe.distancia) : undefined;
  const dano = `${danoBase}${pod ? pod.dados.map((d) => `+${d}`).join("") : ""}`;
  const acerto = (golpe ? ataqueBonus(f, c, golpe) : 0) + (pod?.acerto ?? 0);
  const gastarPoderes = () => { if (!pod) return; const p = gastarBonus(f, c, pod); if (Object.keys(p).length) alterar({ estado: { ...f.estado, usos: aplicarUsos(f, p) } }); };
  const B = vollst ? "b" : "fc-b";
  const extra = golpe && (
    <div className="ac-golpe">
      {ligada ? (
        <>
          <button type="button" className={B} onClick={() => { r.d20(`Acerto: ${golpe.nome}`, acerto); if (pod && pod.acerto > 0) alterar({ estado: { ...f.estado, usos: aplicarUsos(f, gastarAcerto(f, c, pod)) } }); }}><Icone nome="dado" /> Acerto {mod(acerto)}</button>
          {/\d/.test(dano) && <button type="button" className={B} onClick={() => { r.rolar(golpe.nome, dano); gastarPoderes(); }}><Icone nome="dado" /> Dano {dano}</button>}
          {/\d/.test(dano) && <button type="button" className={`${B} ${vollst ? "pf-fraco" : "fraco"}`} onClick={() => { r.expr(`Crítico: ${golpe.nome}`, dano, true); gastarPoderes(); onMsg(`${golpe.nome}: crítico em ${arma.crit >= 20 ? "20" : `${arma.crit}–20`}, dano ×${arma.mult}.`); }}>Crítico</button>}
        </>
      ) : <button type="button" className={`${B} ${vollst ? "pf-fraco" : "fraco"}`} disabled>Ligue a forma</button>}
    </div>
  );
  return (
    <section className={vollst ? "pf-sec" : "fp-sec"} aria-label="Arma da forma">
      <h3>{vollst ? <Html html={(VA.ic as unknown as (n: string) => string)("estrela4")} /> : <Ic n="fatia-espada" cls="h-ic" />}Arma da forma <small>{golpe ? "golpe básico e características" : "características da arma"}</small></h3>
      <ArmaDaForma arma={arma} caracs={caracs} extra={extra} />
    </section>
  );
}

interface Unica { rot: string; n: string; p: string; cada: string; icone: string; botao?: ReactNode; completo?: string }
interface Passiva { n: string; p: string; icone?: string }

function CartaUnica({ x, pele }: { x: Unica; pele: Pele }) {
  return (
    <div className="cwx fc-wrap" data-orig={pele}>
      <article className="fc fc-unica" aria-label={x.n}>
        <Html html={FA.medalhao(pele, x.icone)} />
        <div className="fc-un-c"><span className="fc-rot">{x.rot}</span><h4>{x.n}</h4><p>{x.p}</p><span className="fc-cada"><Ic n="relogio" />{x.cada}</span>{x.botao}</div>
        <Cantos v={pele} />
      </article>
      {x.completo && <Completo textos={[x.completo]} />}
    </div>
  );
}

const trecho = (t: string, n = 120) => resumir(t, n).resumo;

/** Os números que a forma muda: compara a ficha com e sem a liberação (só leitura, usa o mesmo cálculo da ficha). */
function diferencas(f: Ficha, c: Calculo, antes: Calculo, depois: Calculo): [string, string, string][] {
  const out: [string, string, string][] = [];
  const add = (k: string, a: unknown, b: unknown) => { if (String(a) !== String(b)) out.push([k, String(a), String(b)]); };
  add("CR", antes.cr, depois.cr);
  for (const [k, nome] of [["for", "Força"], ["des", "Destreza"], ["con", "Constituição"], ["men", "Mente"], ["esp", "Espírito"]] as const) add(nome, antes.atr[k], depois.atr[k]);
  add("Iniciativa", mod(antes.iniciativa), mod(depois.iniciativa));
  add("Deslocamento", `${antes.desloc} m`.replace(".", ","), `${depois.desloc} m`.replace(".", ","));
  add("RD", `${antes.rdFis}/${antes.rdEso}`, `${depois.rdFis}/${depois.rdEso}`);
  add("Ataques por ação", ataquesPorAcao(f, antes.forma?.ataques ?? 0), ataquesPorAcao(f, depois.forma?.ataques ?? 0));
  add("Dano dos golpes", `+${antes.danoCorpo + antes.danoGeral}${antes.danoDados.map((d) => `+${d}`).join("")}`, `+${depois.danoCorpo + depois.danoGeral}${depois.danoDados.map((d) => `+${d}`).join("")}`);
  void c;
  return out;
}

interface PainelProps {
  f: Ficha; c: Calculo; r: Rolagens; alterar: (p: Partial<Ficha>) => void;
  tipo: TipoPainel;
  onEditar?: (t: TipoForma) => void;
  /** leva para a seção Evoluir (treino e montagem da forma) */
  onIrEvoluir?: () => void;
  /** só mostra o painel quando a forma está ligada (no Agir) */
  soAtiva?: boolean;
}

/** Painel de uma forma (ligada ou em repouso) no acabamento do protótipo aprovado: arte do cabeçalho, custos, estado, o que muda e as cartas. */
export function PainelForma({ f, c, r, alterar, tipo, onEditar, onIrEvoluir, soAtiva }: PainelProps) {
  const [msg, setMsg] = useState("");
  const [danoSofrido, setDanoSofrido] = useState("");
  const [copiaNome, setCopiaNome] = useState("");
  const [copiaDano, setCopiaDano] = useState("");
  const [copiaPr, setCopiaPr] = useState("");
  const L = useLiberacao(f, c, alterar, r, setMsg);
  const ehMascara = tipo === "mascara";
  const tipoForma = ehMascara ? undefined : (tipo as TipoForma);
  const lib = ehMascara ? "mascara" : liberacaoDaForma(tipoForma as TipoForma);
  const mascOn = !!mascaraAtiva(f);
  const ligada = ehMascara ? mascOn : f.estado.liberado === lib;
  /** Visored com a Máscara posta junto da Shikai ou da Bankai: um painel só, a forma "hollowficada" pela máscara */
  const fundida = !ehMascara && f.origem === "visored" && mascOn && ligada && origemDaForma(tipo) === "shinigami";
  const definida = tipoForma ? f.formas[tipoForma] : undefined;
  const provisoria: FormaLib | undefined = tipoForma && !(definida && definida.nome)
    ? { ...vazia(tipoForma), custo: 0, nome: TIPO_FORMA_NOME[tipoForma], modelo: tipoForma === "resurreccion" ? modeloResurreccionPadrao(f.subclasse) : "", habilidades: tipoForma === "segunda" && f.formas.resurreccion ? habilidadesDaForma(f.formas.resurreccion) : [] }
    : undefined;
  const forma = ehMascara ? undefined : (provisoria ?? definida);
  // animação de ativação: toca quando a forma liga (não ao só abrir a ficha)
  const [acende, setAcende] = useState(false);
  const antes = useRef(ligada);
  useEffect(() => {
    if (!antes.current && ligada) { setAcende(true); const id = window.setTimeout(() => setAcende(false), 2800); antes.current = ligada; return () => window.clearTimeout(id); }
    antes.current = ligada;
  }, [ligada]);

  // animação de infecção: toca quando a fusão começa (não ao só abrir a ficha)
  const [infecta, setInfecta] = useState(false);
  const antesF = useRef(fundida);
  useEffect(() => {
    if (!antesF.current && fundida) { setInfecta(true); const t = window.setTimeout(() => setInfecta(false), 3400); antesF.current = fundida; return () => window.clearTimeout(t); }
    antesF.current = fundida;
  }, [fundida]);

  const origem: OrigemPoder = ehMascara ? "hollow" : origemDaForma(tipo);
  const pele: Pele = origem === "hollow" ? "hol" : "shi";
  const tr = f.treinos;
  const masc = MASCARAS.find((m) => m.id === tr.mascara);
  // números com a forma desligada e ligada (a mesma conta da ficha, só para mostrar)
  const { base, com } = useMemo(() => {
    const semLib = ehMascara ? { ...f, estado: { ...f.estado, mascaraAtiva: false, liberado: f.estado.liberado === "mascara" ? "" : f.estado.liberado } } : { ...f, estado: { ...f.estado, liberado: "" as const } };
    const comLib = ehMascara ? { ...f, estado: { ...f.estado, mascaraAtiva: true } } : { ...f, estado: { ...f.estado, liberado: lib as Ficha["estado"]["liberado"] } };
    return { base: calcular(semLib as Ficha), com: calcular(comLib as Ficha) };
  }, [f, ehMascara, lib]);
  const fx = ligada ? c.forma : com.forma;
  if (soAtiva && !ligada) return null;
  if (!ehMascara && !forma) return null;

  const lista: HabForma[] = forma ? habilidadesLidas(forma, f) : [];
  const passivasHab = lista.filter((h) => classificarHab(h).passiva);
  const acoes = lista.filter((h) => !classificarHab(h).passiva);
  const nomeForma = ehMascara ? (masc?.nome ?? "Máscara Hollow") : (forma as FormaLib).nome;
  const rotulo = ehMascara ? "Máscara Hollow" : TIPO_FORMA_NOME[tipo as TipoForma];
  const construida = ehMascara ? !!tr.mascara : !!definida?.nome;
  const custoLib = ehMascara ? L.custoLib("mascara") : L.custoLib(lib as never);
  const diffMasc: [string, string, string][] = (ehMascara || fundida)
    ? (() => {
        const ef = efeitoMascara(f, c.prof, f.nivel);
        const e2 = tr.mascara ? { rd: tr.mascara === "predador" ? Math.floor(f.nivel / 2) : 0, dadosGolpe: tr.mascara === "predador" ? c.prof : tr.mascara === "equilibrio" ? 1 : 0, dadosTecnica: tr.mascara === "conquistador" ? 2 * c.prof : tr.mascara === "equilibrio" ? Math.floor(c.prof / 2) : 0, cd: tr.mascara === "conquistador" ? c.prof : 0 } : ef;
        const t = tempMascara((tr.mascara ?? "") as TipoMascara | "");
        const d: [string, string, string][] = [];
        if (e2.rd) d.push(["RD", "0/0", `${e2.rd}/${e2.rd}`]);
        if (e2.dadosGolpe) d.push(["Dados dos golpes", "", `+${e2.dadosGolpe}`]);
        if (e2.dadosTecnica) d.push(["Dados das técnicas", "", `+${e2.dadosTecnica}`]);
        if (e2.cd) d.push(["CD das técnicas", "", `+${e2.cd}`]);
        if (t.pv) d.push(["PV temporários", "0", String(Math.floor(c.pv * t.pv))]);
        if (t.pr) d.push(["PR temporários", "0", String(Math.floor(c.pr * t.pr))]);
        return d;
      })()
    : [];
  const diff = ehMascara ? diffMasc : diferencas(f, c, base, com);

  // custos e turnos
  const duracaoTxt = ehMascara ? `${L.mascMax} turno${L.mascMax === 1 ? "" : "s"}` : (forma as FormaLib).duracao;
  const manter = !ehMascara && (tipo === "bankai" || tipo === "bankai2") && (forma as FormaLib).custo > 0 ? `${(forma as FormaLib).custo} PR${/^1 minuto/.test(duracaoTxt) ? " por minuto" : ""}` : "";
  const usosForma = f.estado.usos ?? {};
  const turno: [number, number] | null = ehMascara
    ? (L.mascMax > 0 ? [ligada ? L.mascaraGasta : 0, L.mascMax] : null)
    : fx?.duracao ? [ligada ? (usosForma["forma-turnos"] ?? 0) + 1 : 0, fx.duracao] : null;
  const liberarTxt = ehMascara ? `Pôr a Máscara${custoLib ? ` · ${custoLib} PR` : ""}` : `Liberar ${rotulo}${custoLib ? ` · ${custoLib} PR` : ""}`;
  const encerrarTxt = ehMascara ? "Tirar a Máscara" : `Selar ${/^(a|e|i|o|u)/i.test(rotulo) ? "a" : "a"} ${rotulo}`;

  // arte do cabeçalho
  const tipoArt = ehMascara ? "mascara" : tipo === "bankai2" ? "verdadeira" : tipo;
  const tk = tipoArt === "mascara" ? "tk-m" : tipoArt === "resurreccion" || tipoArt === "segunda" ? "tk-r" : "";
  const id = String(tipo);
  const arte = useMemo(() => {
    const tkArte = () => (tipoArt === "mascara" ? TK.mascara("t" + id) : tipoArt === "segunda" ? TK.resurreccion("t" + id, TK.VAR.segunda, 31, "s") : TK.resurreccion("t" + id, TK.VAR.resurreccion, 31, "r"));
    if (tk) return { d: tkArte(), m: "" };
    if (pele === "shi") return { d: FA.arteShi("fd" + id, 1200, 280, 940, 140, 1, 11, tipoArt), m: FA.arteShi("fm" + id, 400, 190, 270, 96, 0.5, 13, tipoArt) };
    return { d: FA.arteHol("fd" + id, 1200, 280, 940, 148, 1, 21, tipoArt), m: FA.arteHol("fm" + id, 400, 190, 270, 100, 0.5, 23, tipoArt) };
  }, [id, tipoArt, tk, pele]);

  const arteMasc = useMemo(() => (fundida ? TK.mascara("t" + id + "f") : ""), [fundida, id]);

  // sub, "Ler completo"
  const sub = ehMascara
    ? "Visored. O Hollow interior aparece no rosto: corpo mais duro e golpes mais pesados, por poucos turnos."
    : (forma as FormaLib).aparencia ? trecho((forma as FormaLib).aparencia, 150) : provisoria ? `Você ainda não montou a sua ${rotulo}.` : "";
  const completoTextos: string[] = [];
  const completoMeta: [string, string][] = [];
  if (ehMascara) {
    completoMeta.push(["Forma", masc?.nome ?? "Máscara Hollow"], ["Custo", `${custoLib} PR (5 × proficiência)`], ["Duração", duracaoTxt]);
    if (masc) completoTextos.push(masc.texto);
    completoTextos.push("Quando o tempo acaba você fica Esgotado. Tirar antes, com uma ação, evita o Esgotado, mas a máscara entra em recarga pelo dobro do tempo usado.");
  } else {
    const fl = forma as FormaLib;
    if (fl.comando) completoTextos.push(`“${fl.comando}”`);
    if (fl.aparencia) completoTextos.push(fl.aparencia);
    if (fl.traco) completoTextos.push(`${fl.traco.includes("\n") ? "Traços" : "Traço"}: ${fl.traco}`);
    if (fl.pontoFraco) completoTextos.push(`Ponto fraco: ${fl.pontoFraco}`);
    completoMeta.push(["Forma", rotulo], ["Custo para liberar", custoLib ? `${custoLib} PR` : "sem custo"], ["Duração", fl.duracao || "até você encerrar"]);
  }
  const completoMascMeta: [string, string][] = [["Forma", masc?.nome ?? "Máscara Hollow"], ["Custo", `${custoLib || L.custoLib("mascara")} PR (5 × proficiência)`], ["Duração", `${L.mascMax} turno${L.mascMax === 1 ? "" : "s"}`]];
  const completoMascTextos: string[] = [...(masc ? [masc.texto] : []), "Quando o tempo acaba você fica Esgotado. Tirar antes, com uma ação, evita o Esgotado, mas a máscara entra em recarga pelo dobro do tempo usado."];
  const temCompleto = completoTextos.join("").length > (sub?.length ?? 0) || ehMascara;

  // gatilhos (únicos) e preço da forma
  const usos = f.estado.usos ?? {};
  const aplicar = (g: { rotulo: string; faz: Faz; limite?: string; peca: string }) => {
    const chave = `fx:${g.peca}:${g.rotulo}`;
    if (g.limite && usos[chave]) { setMsg(`${g.rotulo}: já usado (${g.limite}).`); return; }
    const res = aplicarFaz(f, c, g.faz);
    const est = { ...f.estado };
    if (res.pvTemp !== undefined) est.pvTemp = res.pvTemp;
    if (res.rolar) r.expr(g.rotulo, res.rolar);
    if (g.limite) est.usos = { ...usos, [chave]: 1 };
    alterar({ ...res.parte, estado: est });
    setMsg(`${g.rotulo}: ${res.dito.join(", ") || "feito"}.`);
  };
  const unicas: Unica[] = [];
  const fraco = !ehMascara ? (forma as FormaLib).pontoFraco : "";
  const textosFx = fx?.textos ?? [];
  if (fraco) {
    const tf = textosFx.find((t) => t.nome === fraco);
    unicas.push({ rot: "Preço da forma", n: fraco, icone: "cranio-rachado", cada: "todo turno", p: tf ? trecho(tf.t, 170) : "É o ponto fraco desta forma: o preço que ela cobra de quem a usa.", completo: tf && tf.t.length > 170 ? tf.t : undefined });
  }
  const precoMasc: Unica = { rot: "Preço da forma", n: "Esgotado ao fim", icone: "cranio-rachado", cada: "ao acabar o tempo", p: fimDaMascaraEsgota(f) ? `Quando os ${L.mascMax} turnos acabam, você fica Esgotado. Para evitar, tire a máscara antes, com uma ação.` : "O Hōgyoku estabiliza o Hollow: ao acabar o tempo você não fica Esgotado, mas a máscara entra em recarga." };
  if (ehMascara) unicas.push(precoMasc);
  for (const g of fx?.gatilhos ?? []) {
    if (g.lig) continue;
    const usado = !!g.limite && !!usos[`fx:${g.peca}:${g.rotulo}`];
    unicas.push({ rot: g.limite ? "Única" : "Gatilho", n: g.rotulo, icone: "eclipse", cada: g.limite ? `1 por ${g.limite}` : QUANDO_NOME[g.quando], p: trecho((g.faz as { texto?: string }).texto ?? `${g.peca}: ${QUANDO_NOME[g.quando]}.`, 150),
      botao: ligada ? <button type="button" className="fc-b" disabled={usado} title={`${QUANDO_NOME[g.quando]}${g.limite ? `, 1 por ${g.limite}` : ""}`} onClick={() => aplicar(g)}>{usado ? "Já usado" : "Usar"}</button> : undefined });
  }
  // botões que os cartões de característica criam
  const exDe = (): ExtraBotao => ({
    dano: Math.max(0, Math.floor(Number(danoSofrido) || 0)),
    copia: { nome: copiaNome.trim() || "Poder copiado", dano: copiaDano.trim(), pr: Math.max(0, Math.floor(Number(copiaPr) || 0)) },
  });
  const ataquesDaTecnica: Record<string, { nome: string; texto: string; no: ReactNode }> = {};
  // as técnicas que mandam usar "a próxima ação de ataque" criam o seu próprio cartão de ataque (não dependem de a forma ter outro)
  const prL = infoRitmo("acao").pr;
  const ataqueGerado = (cfg: { dono: string; nome: string; chaveLancada: string; marca: () => Record<string, number | undefined>; a: { dano: string; acerto: number; tags: string[]; pronto: boolean; lancada: boolean; gasta: string[]; bonus: ReturnType<typeof bonusDeAtaque> }; vazio: string; cheio: string }) => {
    const { a } = cfg;
    const lancar = () => {
      if (!a.pronto) { setMsg(`${cfg.nome}: ${cfg.vazio}`); return; }
      if (a.lancada) { setMsg(`${cfg.nome}: já lançado. Role o dano.`); return; }
      if (f.prAtual < prL) { setMsg(`${cfg.nome}: precisa de ${prL} PR.`); return; }
      r.d20(`Acerto: ${cfg.nome}`, a.acerto);
      alterar({ prAtual: Math.max(0, f.prAtual - prL), estado: { ...f.estado, usos: aplicarUsos(f, cfg.marca()) } });
      setMsg(`${cfg.nome}: ${prL} PR gastos. Role o dano para soltar o golpe.`);
    };
    const soltar = (critico: boolean) => {
      if (!a.lancada) { setMsg(`${cfg.nome}: lance primeiro.`); return; }
      if (critico) r.expr(`Crítico: ${cfg.nome}`, a.dano, true); else r.rolar(cfg.nome, a.dano);
      alterar({ estado: { ...f.estado, usos: aplicarUsos(f, gastarBonus(f, c, a.bonus), Object.fromEntries(a.gasta.map((k) => [`pw:${k}`, undefined]))) } });
    };
    const texto = a.pronto ? `${cfg.cheio}${a.tags.length ? ` (${a.tags.join("; ")})` : ""}.` : cfg.vazio;
    const no = (
      <>
        <button type="button" className={`fc-b${a.pronto && !a.lancada ? " aceso" : ""}`} disabled={!a.pronto || a.lancada || f.prAtual < prL} onClick={lancar}><Icone nome="dado" /> Lançar ({prL} PR) · Acerto {mod(a.acerto)}</button>
        <button type="button" className={`fc-b${a.lancada ? " aceso" : ""}`} disabled={!a.lancada} onClick={() => soltar(false)}><Icone nome="dado" /> Dano {a.dano}</button>
        <button type="button" className="fc-b fraco" disabled={!a.lancada} onClick={() => soltar(true)}>Crítico</button>
      </>
    );
    ataquesDaTecnica[cfg.dono] = { nome: cfg.nome, texto, no };
  };
  if (fx) {
    const en = ataqueDeEnergia(f, c);
    if (en) ataqueGerado({ dono: "Juntar energia", nome: "Lançar a energia", chaveLancada: "lancada", marca: marcarLancada, a: en, vazio: "Junte energia primeiro: esta ação solta a energia carregada em um ataque à distância.", cheio: `Solta a energia carregada: ataque à distância de ${c.prof}d6 de Energia, mais os poderes ligados` });
    const co = ataqueDeCorte(f, c);
    if (co) ataqueGerado({ dono: "Cortar o espaço", nome: "Golpe pelo espaço", chaveLancada: "cortada", marca: marcarCortada, a: co, vazio: "Use Cortar o espaço primeiro: esta ação é o golpe corpo a corpo que atravessa o corte.", cheio: `Ataque corpo a corpo a até 12 m, sem ser barrado por cobertura: ${c.prof}d8 de dano cortante${co.linha ? ", em linha de 12 por 1,5 m (salvaguarda de Destreza, metade no sucesso)" : ""}` });
  }
  // cada técnica especial vira um cartão só: os botões dela, a ação que ela cria e as interações que a completam
  const efsForma = forma?.efeitos ?? [];
  const botoesFx = fx?.botoes ?? [];
  const usados = new Set<string>();
  const noBotao = (b: BotaoGerado) => { usados.add(b.rotulo); return botaoDoPoder(f, c, r, alterar, setMsg, b, exDe(), "fc-b"); };
  const gruposTec: GrupoTecnica[] = efsForma.filter((e) => e.familia === "tecnica").map((t) => {
    const meus = botoesFx.filter((b) => b.peca === t.nome);
    const principal = meus[0]?.rotulo ?? "";
    const ints: LinhaInteracao[] = efsForma.filter((e) => e.familia === "interacao" && e.espec?.tec === t.id).map((i) => {
      const bs = botoesFx.filter((b) => b.peca === i.nome);
      return { nome: i.nome, texto: i.texto ?? "", botoes: bs.map((b) => <span key={b.rotulo} className="tec-b">{noBotao(b)}<small>{custoDoBotao(b, c)}</small></span>) };
    });
    return {
      id: t.id, nome: t.nome, texto: t.texto ?? "", rot: "Técnica especial",
      medidor: ligada && principal ? medidorDoBotao(principal, f, c) : undefined,
      botoes: meus.map((b) => ({ no: noBotao(b), custo: custoDoBotao(b, c) })),
      ataque: ataquesDaTecnica[principal],
      ints,
    };
  }).filter((g) => g.botoes.length > 0 || g.ints.length > 0);
  // o que sobra (botões de cartões de característica, ou de fichas antigas sem a técnica guardada) continua em cartões soltos
  const botoesGerados: Unica[] = botoesFx.filter((b) => !usados.has(b.rotulo)).map((b) => ({
    rot: b.faz === "invocar" ? "Invocar" : infoRitmo(b.ritmo).nome, n: b.rotulo, icone: "eclipse", cada: custoDoBotao(b, c), p: trecho(b.texto ?? b.rotulo, 170),
    botao: ligada ? botaoDoPoder(f, c, r, alterar, setMsg, b, exDe(), "fc-b") : undefined,
  }));
  for (const [dono, at] of Object.entries(ataquesDaTecnica)) if (!gruposTec.some((g) => g.ataque === at)) botoesGerados.push({ rot: "Ataque", n: at.nome, icone: "eclipse", cada: `Ação · ${prL} PR · de ${dono}`, p: at.texto, botao: ligada ? at.no : undefined });
  // passivas
  const passivas: Passiva[] = [];
  const passivasMasc: Passiva[] = [];
  if ((ehMascara || fundida) && masc) {
    let nivel = 0, cur = "";
    const itens: string[] = [];
    for (const ch of masc.texto.replace(/\.$/, "")) { if (ch === "(") nivel++; if (ch === ")") nivel--; if (nivel === 0 && ch === ",") { itens.push(cur.trim()); cur = ""; } else cur += ch; }
    if (cur.trim()) itens.push(cur.trim());
    // separa "A (...) e B (...)" só fora dos parênteses
    const dividirE = (t: string) => { const out: string[] = []; let d = 0, ini = 0; for (let i = 0; i < t.length; i++) { if (t[i] === "(") d++; else if (t[i] === ")") d--; else if (d === 0 && t.startsWith(" e ", i) && /[A-ZÁÉÍÓÚ]/.test(t[i + 3] ?? "")) { out.push(t.slice(ini, i)); ini = i + 3; } } out.push(t.slice(ini)); return out; };
    itens.flatMap(dividirE).forEach((s, k) => { const m = s.match(/^([^(]+)\((.*)\)\s*$/); passivasMasc.push(m ? { n: m[1].trim(), p: m[2].trim().replace(/^./, (x) => x.toUpperCase()) + (m[2].endsWith(".") ? "" : "."), icone: ICONES_PASSIVA.hol[k % 6] } : { n: s, p: "" }); });
  }
  if (ehMascara) passivas.push(...passivasMasc);
  else {
    for (const t of textosFx) if (t.nome !== fraco) passivas.push({ n: t.nome, p: trecho(t.t, 150) });
    for (const h of passivasHab) passivas.push({ n: h.nome, p: trecho(h.regra || h.texto, 150) });
    for (const l of (fx?.linhas ?? []).filter((x) => x.valor.length <= 40)) passivas.push({ n: `${l.rotulo} ${l.valor}`, p: `Vem de ${l.fonte}.` });
  }
  const iconePassiva = (k: number) => ICONES_PASSIVA[pele][k % ICONES_PASSIVA[pele].length];

  // ações extras da Máscara
  const cartasMascara: ReactNode = (ehMascara || fundida) ? (
    <>
      {[
        { n: "Novo turno", ic: "relogio", tipo: "Ação livre", p: "Conta mais um turno com a máscara. Passou do tempo, ela se desfaz.", b: "Novo turno", fn: L.novoTurnoMascara, on: mascOn || L.mascaraRecarga > 0 },
        { n: "Passei na Determinação", ic: "cranio-escudo", tipo: "Reação", p: "Quando o Mestre pede o teste de Determinação e você passa, a máscara passa a durar mais turnos.", b: "Passei (+tempo)", fn: L.treinarMascara, on: L.podeTreinarMascara },
        { n: "Tirar a Máscara", ic: "mascara-rachada", tipo: "Ação", p: "Tira a máscara antes do tempo acabar. Você não fica Esgotado, mas ela só volta depois do dobro do tempo usado.", b: "Tirar", fn: () => L.tirarMascara(false), on: mascOn },
      ].map((x, i) => (
        <div className="cwx fc-wrap" data-orig="hol" key={x.n}>
          <article className={`fc fc-acao${x.on ? "" : " off"}`} style={{ ["--i" as string]: i }} aria-label={x.n}>
            <div className="fc-top"><svg className="fc-art" aria-hidden="true"><use href={`#fa-hol-${i % 3}`} /></svg><span className="fc-tipo">{x.tipo}</span><Html html={FA.medalhao("hol", x.ic)} />{!x.on && <span className="fc-trava"><Ic n="cadeado" /><span className="vh">travada</span></span>}</div>
            <h4>{x.n}</h4><div className="fc-tags" />
            <p>{x.p}</p>
            <div className="fc-act"><button type="button" className={`fc-b${x.on ? "" : " fraco"}`} disabled={!x.on} onClick={x.fn}>{x.on ? x.b : "Ponha a máscara"}</button></div>
            <Cantos v="holc" />
          </article>
        </div>
      ))}
    </>
  ) : null;

  const disponivel = L.libs.some((l) => l.id === lib);
  const botaoPrincipal = ligada
    ? <button type="button" className="fp-btn" aria-pressed="true" onClick={() => (ehMascara ? L.tirarMascara(false) : alterar({ estado: { ...f.estado, liberado: "" } }))}><Ic n="ligar" /><span>{encerrarTxt}</span></button>
    : disponivel
      ? <button type="button" className="fp-btn" aria-pressed="false" onClick={() => L.liberar(lib as never)}><Ic n="brilho" /><span>{liberarTxt}</span></button>
      : <button type="button" className="fp-btn fp-btn-sec" aria-pressed="false" onClick={() => onIrEvoluir?.()}><Ic n="cadeado" /><span>{ehMascara ? "Faça o treino da Máscara" : `Treine a ${rotulo} em Evoluir`}</span></button>;
  const manterBtn = ligada && !ehMascara && (tipo === "bankai" || tipo === "bankai2") && (forma as FormaLib).custo > 0
    ? <button type="button" className="fp-btn fp-btn-sec" disabled={f.prAtual < (forma as FormaLib).custo} onClick={() => { alterar({ prAtual: Math.max(0, f.prAtual - (forma as FormaLib).custo) }); setMsg(`Bankai mantida por mais ${(forma as FormaLib).duracao}: ${(forma as FormaLib).custo} PR.`); }}><Ic n="relogio" /><span>Manter ({(forma as FormaLib).custo} PR)</span></button>
    : null;

  const trava = ehMascara ? !tr.mascara : false;
  const nAcoes = ehMascara ? 3 : acoes.length;
  return (
    <div className={`fpw fp-${pele}${origem === "hollow" ? " amber" : ""}${acende ? " pf-acende" : ""}${fundida ? " fp-fusao" : ""}${infecta ? " fp-infecta" : ""}`} data-orig={pele} data-forma={id} {...(fundida ? { "data-fusao": "1" } : {})} {...(tk ? { "data-arte": tk } : {})}>
      <section className="fp" data-ligada={ligada ? 1 : 0} aria-labelledby={`fp-h-${id}`}>
        {fundida && <FissurasBorda />}
        <header className="fp-cab">
          <Html tag="div" cls="fp-arte fp-arte-d" html={arte.d} />
          <Html tag="div" cls="fp-arte fp-arte-m" html={arte.m} />
          {fundida && <Html tag="div" cls="fp-arte fp-arte-mask" html={arteMasc} />}
          {fundida && <FissurasCabeca />}
          {pele === "shi" && <span className="fp-hanko" aria-hidden="true">{KANJI[id] ?? "解"}</span>}
          <div className="fp-tit">
            <p className="fp-eb"><Ic n={pele === "shi" && !fundida ? "sol-nuvem" : "mascara-rachada"} />Painel da forma · {rotulo}{fundida ? ` + ${masc?.nome ?? "Máscara Hollow"}` : ""}</p>
            <h2 id={`fp-h-${id}`}>{nomeForma}</h2>
            {sub && <p className="fp-sub">{sub}</p>}
            {temCompleto && <Completo meta={completoMeta} textos={completoTextos} />}
          </div>
          <div className="fp-ctl">
            <dl className="fp-custos" aria-label="Custos">
              <div><dt><Ic n="gota-pr" />Liberar</dt><dd>{custoLib ? `${custoLib} PR` : "sem custo"}</dd></div>
              {manter && <div className="man"><dt><Ic n="relogio" />Manter</dt><dd>{manter}</dd></div>}
              <div><dt><Ic n="livro-aberto" />Duração</dt><dd>{duracaoTxt}</dd></div>
            </dl>
            {turno && (
              <span className="fp-turno" role="img" aria-label={`Turno ${turno[0]} de ${turno[1]}`}>
                {Array.from({ length: Math.min(turno[1], 24) }, (_, k) => <i key={k} className={ligada && k < turno[0] ? "pf-on" : ""} />)}
                <small>{ligada ? `turno ${turno[0]} de ${turno[1]}` : `${turno[1]} turnos`}</small>
              </span>
            )}
            <div className="fp-estado">
              <span className="fp-est" role="status"><Html html={FA.estadoGema(pele, ligada, origem === "hollow")} /><span className="fp-est-t"><b>{ligada ? "Ligada" : "Desligada"}</b><small>{ligada ? `${rotulo} ativa` : `${rotulo} em repouso`}</small></span></span>
              {botaoPrincipal}{manterBtn}
              {ligada && !ehMascara && onEditar && tipoForma && !provisoria && <button type="button" className="fp-btn fp-btn-sec" onClick={() => onEditar(tipoForma)}><span>Editar</span></button>}
            </div>
          </div>
        </header>
        {msg && <p className="fp-msg" role="status">{msg}</p>}
        <AvisoAcao msg={msg} />
        {provisoria && ligada && <p className="fp-msg">Você ainda não montou a sua {rotulo}. {acoes.length > 0 ? "Estas são as técnicas do modelo do livro para o seu Caminho." : "Monte as habilidades para vê-las aqui."} {onEditar && tipoForma && <button type="button" className="link" onClick={() => onEditar(tipoForma)}>Montar a minha agora</button>}</p>}
        {diff.length > 0 && (
          <div className="fp-diff"><em>{ligada ? "O que mudou:" : "Ao ligar:"}</em>
            {diff.map(([k, a, b]) => ligada ? <span key={k}>{k} <b aria-hidden="true">▲</b> {b}</span> : <span key={k}>{k}{a ? `: ${a}` : ""} <b aria-hidden="true">→ ▲</b> {b}</span>)}
          </div>
        )}
        {fundida && (
          <div className="fp-hol fp-fm-pele" data-orig="hol"><section className="fp-sec fp-fm" aria-label="Máscara Hollow fundida à forma">
            <h3><Ic n="mascara-rachada" cls="h-ic" />Máscara Hollow <small>{masc?.nome} · fundida com a {rotulo}</small></h3>
            <div className="fp-fm-resumo">
              <span className="fp-turno" role="img" aria-label={`Turno ${L.mascaraGasta} de ${L.mascMax} da máscara`}>
                {Array.from({ length: Math.min(L.mascMax, 24) }, (_, k) => <i key={k} className={k < L.mascaraGasta ? "pf-on" : ""} />)}
                <small>turno {L.mascaraGasta} de {L.mascMax}</small>
              </span>
              {L.hg.estabiliza && <span className="fp-fm-tag" title="Hōgyoku: +2 turnos e sem Esgotado ao acabar o tempo">Hōgyoku +2</span>}
            </div>
            {diffMasc.length > 0 && (
              <div className="fp-diff fp-diff-m"><em>Da máscara:</em>
                {diffMasc.map(([k, , b]) => <span key={k}>{k} <b aria-hidden="true">▲</b> {b}</span>)}
              </div>
            )}
            <div className="fp-grade">{cartasMascara}</div>
            <div className="fp-grade fp-un fp-fm-un"><CartaUnica x={precoMasc} pele="hol" /></div>
            {passivasMasc.length > 0 && (
              <div className="fp-grade fp-pa">
                {passivasMasc.map((x, k) => <div className="fc-pas" data-orig="hol" key={x.n + k}><span className="fc-pi" aria-hidden="true"><Ic n={x.icone ?? ICONES_PASSIVA.hol[k % 6]} /></span><h4>{x.n}</h4><p>{x.p}</p></div>)}
              </div>
            )}
            <div className="cwx fp-fm-lc" data-orig="hol"><Completo meta={completoMascMeta} textos={completoMascTextos} /></div>
          </section></div>
        )}
        {ehMascara && trava && <p className="fp-trava">Escolha a sua Máscara Hollow em Agir (a escolha é permanente) para liberar as cartas.</p>}
        {!ehMascara && <SecaoArma f={f} c={c} r={r} alterar={alterar} forma={forma as FormaLib | undefined} ligada={ligada} onMsg={setMsg} />}
        {(nAcoes > 0 || !ligada) && (
          <section className="fp-sec" aria-label="Ações da forma">
            <h3><Ic n={pele === "shi" ? "fatia-espada" : "garras"} cls="h-ic" />Ações da forma <small>{nAcoes} {nAcoes === 1 ? "carta" : "cartas"} · custo em PR</small>{ligada && L.temTurnoDeForma && <button type="button" className="fp-btn-sec fp-novo-turno" onClick={L.proximoTurno} title="Renova os usos por turno (Cura no acerto, Reiatsu no acerto, Absorver…) e conta a duração da forma">Novo turno</button>}</h3>
            {!ligada && nAcoes > 0 && <p className="fp-trava">As cartas acendem quando {pele === "shi" ? "a forma liga" : "a forma desperta"}. Antes disso ficam travadas.</p>}
            <div className="fp-grade">
              {ehMascara ? cartasMascara : acoes.map((h, i) => <CartaAcao key={h.id} f={f} c={c} r={r} alterar={alterar} forma={forma as FormaLib} h={h} ativa={ligada} onMsg={setMsg} pele={pele} i={i} />)}
              {!ehMascara && acoes.length === 0 && <p className="fp-trava">Nenhuma habilidade cadastrada. Abra a seção Evoluir para adicionar.</p>}
            </div>
          </section>
        )}
        {(gruposTec.length > 0 || botoesGerados.length > 0) && (
          <section className="fp-sec fp-tecnicas" aria-label="Técnicas da forma">
            <h3><Ic n="brilho" cls="h-ic" />Técnicas da forma <small>{gruposTec.length > 0 ? "cada técnica especial com as interações que a completam" : "criadas pelos cartões da forma"}</small></h3>
            <PoderesAtivos f={f} c={c} alterar={alterar} />
            <CampoDano botoes={fx?.botoes ?? []} valor={danoSofrido} onChange={setDanoSofrido} />
            <CampoCopia botoes={fx?.botoes ?? []} nome={copiaNome} dano={copiaDano} pr={copiaPr} set={{ nome: setCopiaNome, dano: setCopiaDano, pr: setCopiaPr }} />
            {gruposTec.length > 0 && <div className="fp-grade fp-tec">{gruposTec.map((g) => <CartaTecnica key={g.id} g={g} pele={pele} ligada={ligada} />)}</div>}
            {botoesGerados.length > 0 && <div className="fp-grade fp-un">{botoesGerados.map((x) => <CartaUnica key={x.n} x={x} pele={pele} />)}</div>}
          </section>
        )}
        {unicas.length > 0 && (
          <section className="fp-sec" aria-label="Habilidades únicas">
            <h3><Ic n={pele === "shi" ? "eclipse" : "cranio-rachado"} cls="h-ic" />Únicas e preço <small>uma vez, ou todo turno</small></h3>
            <div className="fp-grade fp-un">{unicas.map((x) => <CartaUnica key={x.n} x={x} pele={pele} />)}</div>
          </section>
        )}
        {passivas.length > 0 && (
          <section className="fp-sec" aria-label="Habilidades passivas">
            <h3><Ic n={pele === "shi" ? "fita" : "costelas"} cls="h-ic" />Passivas <small>sempre valem enquanto a forma durar</small></h3>
            <div className={`fp-grade fp-pa${ligada ? "" : " off"}`}>
              {passivas.map((x, k) => <div className="fc-pas" data-orig={pele} key={x.n + k}><span className="fc-pi" aria-hidden="true"><Ic n={x.icone ?? iconePassiva(k)} /></span><h4>{x.n}</h4><p>{x.p}</p></div>)}
            </div>
          </section>
        )}
        {ligada && ((c.forma?.invocacoes.length ?? 0) > 0 || (f.estado.invocacoes ?? []).length > 0) && <div className="invocacoes-painel"><AbaInvocacoes f={f} c={c} r={r} alterar={alterar} compacto /></div>}
      </section>
      <Cantos v={pele} />
    </div>
  );
}

/** Painel da forma que está ligada agora (aba Agir). */
export function PainelFormaAtiva({ f, c, r, alterar, onEditar }: { f: Ficha; c: Calculo; r: Rolagens; alterar: (p: Partial<Ficha>) => void; onEditar?: (t: TipoForma) => void }) {
  const t = formaDaLiberacao(f.estado.liberado as string);
  if (!t) return null;
  const origem = origemDaForma(t);
  if (origem === "quincy") return <PainelVoll f={f} c={c} r={r} alterar={alterar} onEditar={onEditar} tipo="vollstandig" />;
  return <PainelForma f={f} c={c} r={r} alterar={alterar} tipo={t} onEditar={onEditar} />;
}


/** Painel da Vollständig (pele Quincy: reishi e cristal), no acabamento do protótipo v6. */
export function PainelVoll({ f, c, r, alterar, onEditar, onIrEvoluir }: PainelProps) {
  const [msg, setMsg] = useState("");
  const [danoSofrido, setDanoSofrido] = useState("");
  const [copiaNome, setCopiaNome] = useState("");
  const [copiaDano, setCopiaDano] = useState("");
  const [copiaPr, setCopiaPr] = useState("");
  const L = useLiberacao(f, c, alterar, r, setMsg);
  const forma = f.formas.vollstandig;
  const ligada = f.estado.liberado === "vollstandig";
  const { base, com } = useMemo(() => ({
    base: calcular({ ...f, estado: { ...f.estado, liberado: "" as const } } as Ficha),
    com: calcular({ ...f, estado: { ...f.estado, liberado: "vollstandig" as Ficha["estado"]["liberado"] } } as Ficha),
  }), [f]);
  const [acende, setAcende] = useState(false);
  const antes = useRef(ligada);
  useEffect(() => {
    if (!antes.current && ligada) { setAcende(true); const id = window.setTimeout(() => setAcende(false), 2800); antes.current = ligada; return () => window.clearTimeout(id); }
    antes.current = ligada;
  }, [ligada]);
  const arte = useMemo(() => {
    const cab = VA.cabArte as unknown as (...a: unknown[]) => string;
    return { d: cab("d", 1200, 250, 972, 138, 1, 7, { cols: 18 }), m: cab("m", 400, 176, 200, 104, 0.5, 13, { cols: 10, x0: -20 }) };
  }, []);
  const fx = ligada ? c.forma : com.forma;
  if (!forma || !forma.nome) return null;
  const lista: HabForma[] = habilidadesLidas(forma, f);
  const passivasHab = lista.filter((h) => classificarHab(h).passiva);
  const acoes = lista.filter((h) => !classificarHab(h).passiva);
  const diff = diferencas(f, c, base, com);
  const custoLib = L.custoLib("vollstandig" as never);
  const disponivel = L.libs.some((l) => l.id === "vollstandig");
  const usos = f.estado.usos ?? {};
  const aplicar = (g: { rotulo: string; faz: Faz; limite?: string; peca: string }) => {
    const chave = `fx:${g.peca}:${g.rotulo}`;
    if (g.limite && usos[chave]) { setMsg(`${g.rotulo}: já usado (${g.limite}).`); return; }
    const res = aplicarFaz(f, c, g.faz);
    const est = { ...f.estado };
    if (res.pvTemp !== undefined) est.pvTemp = res.pvTemp;
    if (res.rolar) r.expr(g.rotulo, res.rolar);
    if (g.limite) est.usos = { ...usos, [chave]: 1 };
    alterar({ ...res.parte, estado: est });
    setMsg(`${g.rotulo}: ${res.dito.join(", ") || "feito"}.`);
  };
  const textosFx = fx?.textos ?? [];
  const unicas = (fx?.gatilhos ?? []).filter((g) => !g.lig).map((g) => ({ g, usado: !!g.limite && !!usos[`fx:${g.peca}:${g.rotulo}`] }));
  const passivas: { n: string; p: string }[] = [
    ...textosFx.map((t) => ({ n: t.nome, p: trecho(t.t, 150) })),
    ...passivasHab.map((h) => ({ n: h.nome, p: trecho(h.regra || h.texto, 150) })),
    ...(fx?.linhas ?? []).filter((x) => x.valor.length <= 40).map((l) => ({ n: `${l.rotulo} ${l.valor}`, p: `Vem de ${l.fonte}.` })),
  ];
  const sub = forma.aparencia ? trecho(forma.aparencia, 150) : "";
  const textos: string[] = [];
  if (forma.comando) textos.push(`“${forma.comando}”`);
  if (forma.aparencia) textos.push(forma.aparencia);
  const meta: [string, string][] = [["Forma", "Vollständig"], ["Custo para liberar", custoLib ? `${custoLib} PR` : "sem custo"], ["Duração", forma.duracao || "até você encerrar"]];
  const Ic2 = (n: string) => <Html html={(VA.ic as unknown as (n: string) => string)(n)} />;
  const gemaHtml = (VA.gema as unknown as (on: boolean) => string)(ligada);
  const botao = ligada
    ? <button type="button" className="pf-btn" aria-pressed="true" onClick={() => alterar({ estado: { ...f.estado, liberado: "" } })}>{Ic2("ligar")}<span>Encerrar Vollständig</span></button>
    : disponivel
      ? <button type="button" className="pf-btn" aria-pressed="false" onClick={() => L.liberar("vollstandig" as never)}>{Ic2("brilho")}<span>Ligar Vollständig{custoLib ? ` · ${custoLib} PR` : ""}</span></button>
      : <button type="button" className="pf-btn" aria-pressed="false" onClick={() => onIrEvoluir?.()}>{Ic2("cadeado")}<span>Veja a Vollständig em Evoluir</span></button>;
  return (
    <div className={`cw pfw o-voll${acende ? " acende" : ""}`} data-orig="qui">
      <section className={`pf${acende ? " acende" : ""}`} data-ligada={ligada ? 1 : 0} aria-labelledby="pf-h-voll">
        <header className="pf-cab">
          <Html tag="div" cls="pf-arte pf-arte-d" html={arte.d} />
          <Html tag="div" cls="pf-arte pf-arte-m" html={arte.m} />
          <div className="pf-tit">
            <p className="pf-eb">{Ic2("estrela4")}Painel da forma</p>
            <h2 id="pf-h-voll">{forma.nome}</h2>
            {sub && <p className="pf-sub">{sub}</p>}
            {textos.join("").length > sub.length && <Completo meta={meta} textos={textos} />}
          </div>
          <div className="pf-estado">
            <span className="pf-est" role="status"><Html html={gemaHtml} /><span className="pf-est-t"><b>{ligada ? "Ligada" : "Desligada"}</b><small>{ligada ? "Vollständig ativa" : "Vollständig em repouso"}</small></span></span>
            <span className={`selo-forte${ligada ? "" : " off"}`}>{ligada ? <><b aria-hidden="true">▲</b> mais forte</> : <><b aria-hidden="true">○</b> força base</>}</span>
            {botao}
            {ligada && onEditar && <button type="button" className="pf-btn" onClick={() => onEditar("vollstandig")}><span>Editar</span></button>}
          </div>
        </header>
        {msg && <p className="pf-trava" role="status">{msg}</p>}
        {diff.length > 0 && (
          <div className="pf-diff"><em>{ligada ? "O que mudou:" : "Ao ligar:"}</em>
            {diff.map(([k, a, b]) => ligada ? <span key={k}>{k} <b aria-hidden="true">▲</b> {b}</span> : <span key={k}>{k}{a ? `: ${a}` : ""} <b aria-hidden="true">→ ▲</b> {b}</span>)}
          </div>
        )}
        <section className="pf-sec" aria-label="Ações da forma">
          <h3>{Ic2("estrela4")}Ações da forma <small>{acoes.length} {acoes.length === 1 ? "carta" : "cartas"} · custo em PR</small></h3>
          {!ligada && <p className="pf-trava">As cartas acendem quando a Vollständig liga. Também entram as habilidades únicas, as passivas e a Schrift, mais forte.</p>}
          <div className="cartas">
            {acoes.map((h, i) => <CartaAcao key={h.id} f={f} c={c} r={r} alterar={alterar} forma={forma} h={h} ativa={ligada} onMsg={setMsg} pele="qui" i={i} />)}
          </div>
        </section>
        {ligada && <PainelSchrift f={f} c={c} alterar={alterar} dentro />}
        <SecaoArma f={f} c={c} r={r} alterar={alterar} forma={forma} ligada={ligada} onMsg={setMsg} vollst />
        {(fx?.botoes ?? []).length > 0 && (
          <section className="pf-sec" aria-label="Botões das características">
            <h3>{Ic2("estrela4")}Botões das características <small>criados pelos cartões da forma</small></h3>
            <PoderesAtivos f={f} alterar={alterar} pele="qui" />
            <CampoDano botoes={fx?.botoes ?? []} valor={danoSofrido} onChange={setDanoSofrido} />
            <CampoCopia botoes={fx?.botoes ?? []} nome={copiaNome} dano={copiaDano} pr={copiaPr} set={{ nome: setCopiaNome, dano: setCopiaDano, pr: setCopiaPr }} />
            <div className="cartas">
              {(fx?.botoes ?? []).map((b) => (
                <CartaPoder key={b.rotulo} tipo="voll" selo={b.faz === "invocar" ? "Invocar" : infoRitmo(b.ritmo).nome} nome={b.rotulo} tags={[{ t: custoDoBotao(b, c), pr: true }]} off={!ligada}
                  acao={ligada ? botaoDoPoder(f, c, r, alterar, setMsg, b, { dano: Math.max(0, Math.floor(Number(danoSofrido) || 0)), copia: { nome: copiaNome.trim() || "Poder copiado", dano: copiaDano.trim(), pr: Math.max(0, Math.floor(Number(copiaPr) || 0)) } }, "b") : <button type="button" className="b pf-fraco" disabled>Ligue a forma</button>}>
                  <p>{trecho(b.texto ?? b.rotulo, 150)}</p>
                </CartaPoder>
              ))}
            </div>
          </section>
        )}
        {unicas.length > 0 && (
          <section className="pf-sec" aria-label="Habilidades únicas">
            <h3>{Ic2("estrela4")}Habilidades únicas <small>{unicas.length} {unicas.length === 1 ? "escolhida" : "escolhidas"}</small></h3>
            <div className="cartas">
              {unicas.map(({ g, usado }) => (
                <CartaPoder key={g.rotulo} tipo="voll" selo={g.limite ? "Única" : "Gatilho"} nome={g.rotulo} tags={[{ t: g.limite ? `1 por ${g.limite}` : QUANDO_NOME[g.quando] }]} off={!ligada}
                  acao={ligada ? <button type="button" className="b" disabled={usado} onClick={() => aplicar(g)}>{usado ? "Já usado" : "Usar"}</button> : <button type="button" className="b pf-fraco" disabled>Ligue a forma</button>}>
                  <p>{trecho((g.faz as { texto?: string }).texto ?? `${g.peca}: ${QUANDO_NOME[g.quando]}.`, 150)}</p>
                </CartaPoder>
              ))}
            </div>
          </section>
        )}
        {passivas.length > 0 && (
          <section className="pf-sec" aria-label="Habilidades passivas">
            <h3>{Ic2("estrela4")}Passivas <small>sempre valem enquanto a forma durar</small></h3>
            <div className="cartas">
              {passivas.map((x, k) => <CartaPoder key={x.n + k} tipo="voll" selo="Passiva" nome={x.n} off={!ligada}><p>{x.p}</p></CartaPoder>)}
            </div>
          </section>
        )}
      </section>
      {(["tl", "tr", "bl", "br"] as const).map((k) => (
        <i key={k} className={`cn cn-${k}`} aria-hidden="true"><svg viewBox="0 0 44 44"><use href={`#va-c-${k === "tl" ? "tl" : k === "br" ? "br" : "sq"}`} /></svg></i>
      ))}
    </div>
  );
}

const ORDEM_PAINEIS: { tipo: TipoPainel; quando: (t: string | undefined) => boolean }[] = [
  { tipo: "shikai", quando: (t) => t === "shinigami" },
  { tipo: "bankai", quando: (t) => t === "shinigami" },
  { tipo: "bankai2", quando: (t) => t === "shinigami" },
  { tipo: "resurreccion", quando: (t) => t === "hollow" },
  { tipo: "segunda", quando: (t) => t === "hollow" },
  { tipo: "vollstandig", quando: (t) => t === "quincy" },
  { tipo: "mascara", quando: () => true },
];

/** Aba Poderes: uma aba por forma da classe, cada uma com o painel completo, ligado ou em repouso (travado quando ainda não dá para usar). */
export function FormasPoderes({ f, c, r, alterar, onEditar, onIrEvoluir }: { f: Ficha; c: Calculo; r: Rolagens; alterar: (p: Partial<Ficha>) => void; onEditar: (t: TipoForma) => void; onIrEvoluir: () => void }) {
  const [msg, setMsg] = useState("");
  const L = useLiberacao(f, c, alterar, r, setMsg);
  const tipoClasse = classePorId(f.classe)?.tipo;
  const mascaraDoPersonagem = f.origem === "visored" && f.treinos.feitos.includes("visored-2");
  const abas = ORDEM_PAINEIS.filter((x) => {
    if (x.tipo === "mascara") return mascaraDoPersonagem;
    if (x.tipo === "bankai2") return tipoClasse === "shinigami" && (f.treinos.caminhoBankai === "verdadeira" || !!f.formas.bankai2?.nome || f.estado.liberado === "bankai2");
    return x.quando(tipoClasse) || !!f.formas[x.tipo as TipoForma]?.nome;
  });
  const ativaId = f.estado.liberado ? formaDaLiberacao(f.estado.liberado as string) : undefined;
  const [sel, setSel] = useState<TipoPainel | "">("");
  if (abas.length === 0) return null;
  const atual = abas.find((x) => x.tipo === sel)?.tipo ?? abas.find((x) => x.tipo === ativaId)?.tipo ?? (mascaraAtiva(f) ? "mascara" : abas[0].tipo);
  // Visored com máscara e Shikai/Bankai ligadas: a aba da máscara mostra o mesmo painel fundido da forma
  const fundida = !!ativaId && f.origem === "visored" && !!mascaraAtiva(f) && origemDaForma(ativaId) === "shinigami";
  const mostrar: TipoPainel = atual === "mascara" && fundida ? (ativaId as TipoPainel) : atual;
  const estaLigada = (t: TipoPainel) => (t === "mascara" ? !!mascaraAtiva(f) : f.estado.liberado === liberacaoDaForma(t));
  void L; void msg;
  return (
    <div className="caixa caixa-formas">
      <h3>Formas</h3>
      <div className="fp-tabs" role="tablist" aria-label="Forma">
        {abas.map((x) => {
          const t = x.tipo;
          const pele = t === "mascara" || origemDaForma(t) === "hollow" ? "hol" : origemDaForma(t) === "quincy" ? "qui" : "shi";
          const nome = t === "mascara" ? "Máscara Hollow" : TIPO_FORMA_NOME[t as TipoForma];
          const sub = t === "mascara" ? (MASCARAS.find((m) => m.id === f.treinos.mascara)?.nome.replace("Máscara do ", "") ?? "escolher") : f.formas[t as TipoForma]?.nome || "não montada";
          return (
            <button key={t} role="tab" type="button" className={`fp-tab o-${pele}${pele === "hol" ? " amber" : ""}`} aria-selected={t === atual} data-forma={t} onClick={() => setSel(t)}>
              <i className={`fp-dot${estaLigada(t) ? " pf-on" : ""}`} /><span className="fp-tab-n"><b>{nome}</b><small>{sub}</small></span>
            </button>
          );
        })}
      </div>
      {mostrar === "vollstandig" ? <PainelVoll key={mostrar} f={f} c={c} r={r} alterar={alterar} tipo={mostrar} onEditar={onEditar} onIrEvoluir={onIrEvoluir} /> : <PainelForma key={mostrar} f={f} c={c} r={r} alterar={alterar} tipo={mostrar} onEditar={onEditar} onIrEvoluir={onIrEvoluir} />}
    </div>
  );
}
