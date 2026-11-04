import { useEffect, useMemo, useRef, useState } from "react";
import { calcular, type Invocacao } from "../regras/ficha";
import {
  ATRS, acoesDoEstado, bonusDaMascara, calcularAmeaca, comEtapaAnterior, comLiberacao, efeitosDaLiberacao, estadoDoNpc, estadoValido, formaDoEstado, resumoEtapaAnterior,
  type Ameaca, type EstadoNpc, type EtapaNpc, type FormaPrincipal,
} from "../regras/ameacas";
import { publicarCombate, type FichaDaMesa, type Npc } from "../lib/campanhas";
import { rolarExpressao } from "../lib/dados";
import { minimoUmDado } from "../regras/forma-npc";
import { resolverDano } from "../regras/liberacoes";

interface AcaoNpc {
  nome: string;
  tipo: "ataque" | "tecnica" | "invocar";
  acerto: number;
  /** expressão de dano, ex.: "2d8 + 6" */
  dano: string;
  custo: number;
  cd: number;
  /** menor valor do d20 que é crítico */
  crit: number;
  mult: number;
  /** o que a Máscara do Visored somou nesta ação ("+2d10", "+4d6, CD +4") */
  mascara?: string;
  /** criatura que a ação invoca (tipo "invocar") */
  inv?: { chave: string; nome: string; pv: number; cr: number; acerto: number; dano: string; max: number };
}

interface Resultado {
  texto: string;
  dano: number;
  alvoId: string;
  tecnica: boolean;
  acertou: boolean;
  /** ataque que acertou: o dano ainda não foi rolado (botão no resultado) */
  pendente?: { nome: string; expr: string; crit: boolean; quem: string };
}

interface Participante {
  id: string;
  nome: string;
  tipo: "jogador" | "npc";
  /** iniciativa já rolada (null = ainda não rolou) */
  ini: number | null;
  /** bônus somado ao d20: metade da Destreza e extras */
  bonus: number;
  pv: number;
  pvMax: number;
  pr: number;
  prMax: number;
  cr: number;
  fora: boolean;
  nota: string;
  /** NPCs adicionados juntos rolam uma iniciativa só */
  grupo: string;
  /** os jogadores veem "Criatura desconhecida" no lugar do nome */
  oculto: boolean;
  acoes: AcaoNpc[];
  /** atributos e proficiência do NPC (para os testes de resistência) */
  atr?: Record<string, number>;
  prof?: number;
  /** ficha de origem (jogadores) */
  fichaId?: string;
  /** invocação ou clone: id do participante que a criou */
  dono?: string;
  /** invocação vinda da ficha de um jogador (id da invocação na ficha) */
  invId?: string;
  /** chave do modelo de invocação (para contar quantas estão em campo) */
  chaveInv?: string;
  /** forma liberada (Bankai, Resurrección, Vollständig) */
  lib?: {
    nome: string; ativo: boolean; base: Forma; liberada: Forma; efeito: { dano: number; tipo: string; curaPv: number };
    /** etapa anterior (Shikai; em combates salvos por versões antigas, também a Máscara); `antesAtivo` = ela está ativa (nunca junto com `ativo`: a Bankai substitui) */
    antes?: { nome: string; forma: Forma; nota: string };
    antesAtivo?: boolean;
    /** Máscara do Visored: soma por cima da forma ativa; uma versão de cada forma já com a máscara, e os bônus dela em cada uma */
    mascara?: { nome: string; base: Forma; antes?: Forma; liberada: Forma; notas: Record<FormaPrincipal, string[]> };
    mascaraAtiva?: boolean;
  };
}

interface Forma { acoes: AcaoNpc[]; cr: number; pvMax: number; prMax: number; atr: Record<string, number>; prof: number }

interface Estado {
  ativo: boolean;
  rodada: number;
  vez: string | null;
  lista: Participante[];
}

function formaDe(am: Ameaca, etapa: boolean | EtapaNpc | EstadoNpc): Forma {
  const s = estadoValido(am, etapa);
  const c = calcularAmeaca(am, s);
  const fonte = s.forma === "bankai" ? comLiberacao(am) : s.forma === "shikai" ? comEtapaAnterior(am) : am;
  const atr = fonte.atr;
  const acoes: AcaoNpc[] = [
    ...c.ataques.map((a) => ({
      nome: a.nome, tipo: "ataque" as const, acerto: a.acerto, dano: a.dano, custo: a.custo || Number(/\((\d+) PR\)/.exec(a.nome)?.[1] ?? 0),
      cd: 0, crit: a.crit !== 20 ? a.crit : Number(/Crítico (\d+)/.exec(a.nome)?.[1] ?? 20), mult: Number(/x(\d)/.exec(a.nome)?.[1] ?? 2),
      ...(a.mascara ? { mascara: a.mascara } : {}),
    })),
    ...c.tecnicas.map((t, i) => ({
      nome: t.nome, tipo: "tecnica" as const, acerto: 0, dano: `${t.dados} + ${atr[fonte.tecnicas[i]?.atr ?? "esp"]}`, custo: t.custo, cd: t.cd, crit: 21, mult: 1,
      ...(t.mascara ? { mascara: t.mascara } : {}),
    })),
  ];
  const modelo = formaDoEstado(am, s);
  if (modelo) {
    for (const a of acoesDoEstado(am, s)) acoes.push({ nome: a.nome, tipo: a.tipo, acerto: a.acerto, dano: a.dano, custo: a.custo, cd: a.cd, crit: 20, mult: 2, ...(a.mascara ? { mascara: a.mascara } : {}) });
    const rd = (e: string) => minimoUmDado(resolverDano(e, { nivel: c.nd } as never, { prof: c.prof, atr } as never));
    for (const v of modelo.invocacoes) {
      acoes.push({ nome: `Invocar ${v.nome}`, tipo: "invocar", acerto: 0, dano: "", custo: v.custoPr, cd: 0, crit: 21, mult: 1, inv: { chave: v.chave, nome: v.nome, pv: v.pv, cr: v.cr, acerto: v.acerto, dano: v.dano ? rd(v.dano) : "", max: v.max } });
    }
  }
  return { acoes, cr: c.cr, pvMax: c.pv, prMax: c.pr, atr: { ...atr }, prof: c.prof };
}

type LibNpc = NonNullable<Participante["lib"]>;
/** Forma principal ativa de um participante (a Bankai substitui a Shikai). */
const formaAtiva = (l: LibNpc): FormaPrincipal => (l.ativo ? "bankai" : l.antesAtivo ? "shikai" : "base");
/** Números da forma pedida, com ou sem a máscara por cima. */
function formaDoParticipante(l: LibNpc, s: EstadoNpc): Forma {
  const m = s.mascara ? l.mascara : undefined;
  if (s.forma === "bankai") return m ? m.liberada : l.liberada;
  if (s.forma === "shikai" && l.antes) return m?.antes ?? l.antes.forma;
  return m ? m.base : l.base;
}

/** Ataque de uma invocação ou clone, a partir dos números da ficha (ou da ação que a criou). */
const acaoDeInvocacao = (acerto: number, dano: string): AcaoNpc[] =>
  dano && /\d/.test(dano) ? [{ nome: "Ataque", tipo: "ataque", acerto, dano, custo: 0, cd: 0, crit: 20, mult: 2 }] : [];

const vazio: Estado = { ativo: false, rodada: 1, vez: null, lista: [] };
const chave = (id: string) => `esv:combate:${id}`;
const d20 = () => 1 + Math.floor(Math.random() * 20);
type ModoD20 = "normal" | "vantagem" | "desvantagem";
/** d20 com vantagem ou desvantagem; devolve o dado usado e o texto dos dois */
function d20m(modo: ModoD20): { nat: number; txt: string } {
  if (modo === "normal") { const n = d20(); return { nat: n, txt: `${n}` }; }
  const a = d20(), b = d20();
  const nat = modo === "vantagem" ? Math.max(a, b) : Math.min(a, b);
  return { nat, txt: `${nat} (${a} e ${b}, ${modo})` };
}
const novoId = () => Math.random().toString(36).slice(2, 10);

function ler(id: string): Estado {
  try {
    const t = localStorage.getItem(chave(id));
    if (!t) return vazio;
    const o = JSON.parse(t) as Partial<Estado>;
    if (!o || !Array.isArray(o.lista)) return vazio;
    return { ativo: o.ativo === true, rodada: Math.max(1, Number(o.rodada) || 1), vez: typeof o.vez === "string" ? o.vez : null, lista: (o.lista.slice(0, 60) as Participante[]).map((p) => ({ ...p, oculto: p.oculto === true, acoes: Array.isArray(p.acoes) ? p.acoes : [] })) };
  } catch {
    return vazio;
  }
}

/** Rastreador de combate do Mestre: iniciativa, turnos, PV e PR dos jogadores e NPCs da mesa. */
export function CombateMesa({ campanhaId, fichas, npcs, pastas }: { campanhaId: string; fichas: FichaDaMesa[]; npcs: Npc[]; pastas: string[] }) {
  const [est, setEst] = useState<Estado>(() => ler(campanhaId));
  const [origem, setOrigem] = useState("");
  const [qtd, setQtd] = useState(1);
  const [res, setRes] = useState<Resultado | null>(null);
  const [alvos, setAlvos] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState("");
  const [modoD20, setModoD20] = useState<ModoD20>("normal");
  const [provas, setProvas] = useState<Record<string, boolean>>({});
  /** o Mestre mexeu no combate NESTE aparelho (nesta visita)? Só então a ordem é publicada aos jogadores.
   *  Abrir a mesa em outro aparelho/aba (localStorage vazio ou antigo) não publica nada nem apaga a ordem que já está lá. */
  const deliberado = useRef(false);
  const ultimaPublicada = useRef<string | null>(null);
  /** mudança feita pelo Mestre (botões, campos): marca o combate deste aparelho como o que vale */
  const alterar = (f: Estado | ((e: Estado) => Estado)) => { deliberado.current = true; setEst(f); };

  useEffect(() => {
    try { localStorage.setItem(chave(campanhaId), JSON.stringify(est)); } catch { /* sem armazenamento */ }
  }, [campanhaId, est]);

  // a ficha do jogador mudou (dano, cura, PR gasto)? o painel acompanha; ajustes do Mestre valem até a ficha mudar de novo
  const vistas = useRef<Record<string, string>>({});
  useEffect(() => {
    const mudancas: Record<string, { pv: number; pvMax: number; pr: number; prMax: number; cr: number }> = {};
    for (const f of fichas) {
      const c = calcular(f.ficha);
      const marca = `${f.ficha.pvAtual}|${f.ficha.prAtual}|${c.pv}|${c.pr}|${c.cr}`;
      if (vistas.current[f.id] === undefined) { vistas.current[f.id] = marca; continue; }
      if (vistas.current[f.id] !== marca) {
        vistas.current[f.id] = marca;
        mudancas[f.id] = { pv: Math.min(f.ficha.pvAtual, c.pv), pvMax: c.pv, pr: Math.min(f.ficha.prAtual, c.pr), prMax: c.pr, cr: c.cr };
      }
    }
    if (Object.keys(mudancas).length === 0) return;
    setEst((e) => ({ ...e, lista: e.lista.map((p) => (p.fichaId && mudancas[p.fichaId] ? { ...p, ...mudancas[p.fichaId] } : p)) }));
  }, [fichas]);

  // clones e invocações que o jogador cria na ficha aparecem no combate, logo abaixo do dono, e somem quando ele os dispensa
  const vistasInv = useRef<Record<string, string>>({});
  const donosNoCombate = est.lista.filter((p) => p.tipo === "jogador" && !p.dono).map((p) => p.id).join(",");
  useEffect(() => {
    setEst((e) => {
      const donos = new Map<string, Participante>(e.lista.filter((p) => p.tipo === "jogador" && p.fichaId).map((p) => [p.fichaId as string, p] as [string, Participante]));
      const vivas = new Map<string, { inv: Invocacao; ficha: FichaDaMesa; dono: Participante }>();
      for (const f of fichas) {
        const dono = donos.get(f.id);
        if (!dono) continue;
        for (const inv of f.ficha.estado.invocacoes ?? []) vivas.set(inv.id, { inv, ficha: f, dono });
      }
      let mudou = false;
      let lista = e.lista.filter((p) => {
        const fica = (p.dono ? e.lista.some((x) => x.id === p.dono) : true) && (p.invId ? vivas.has(p.invId) : true);
        if (!fica) mudou = true;
        return fica;
      });
      lista = lista.map((p) => {
        if (!p.invId) return p;
        const v = vivas.get(p.invId);
        if (!v) return p;
        const marca = `${v.inv.pv}|${v.inv.pvMax}|${v.inv.cr}`;
        if (vistasInv.current[p.invId] === marca) return p;
        vistasInv.current[p.invId] = marca;
        mudou = true;
        return { ...p, pv: v.inv.pv, pvMax: v.inv.pvMax, cr: v.inv.cr, fora: v.inv.pv <= 0 };
      });
      const existentes = new Set(lista.map((p) => p.invId).filter(Boolean));
      for (const [id, v] of vivas) {
        if (existentes.has(id)) continue;
        const c = calcular(v.ficha.ficha);
        vistasInv.current[id] = `${v.inv.pv}|${v.inv.pvMax}|${v.inv.cr}`;
        mudou = true;
        lista.push({
          id: novoId(), nome: `${v.inv.nome} (${v.ficha.nome})`, tipo: "jogador", ini: v.dono.ini, bonus: 0, pv: v.inv.pv, pvMax: v.inv.pvMax, pr: 0, prMax: 0, cr: v.inv.cr,
          fora: false, nota: "", grupo: v.dono.grupo, oculto: false, acoes: acaoDeInvocacao(v.inv.acerto, v.inv.dano ? resolverDano(v.inv.dano, v.ficha.ficha, c) : ""), dono: v.dono.id, invId: id,
        });
      }
      return mudou ? { ...e, lista } : e;
    });
  }, [fichas, donosNoCombate]);

  // os jogadores só veem a ordem; PV dos NPCs ficam com o Mestre.
  // Só publica depois de uma ação do Mestre neste aparelho: o estado carregado (ou vazio) ao abrir a página nunca é publicado sozinho.
  useEffect(() => {
    if (!deliberado.current) return;
    const t = window.setTimeout(() => {
      const ord = [...est.lista].sort((a, b) => (b.ini ?? -99) - (a.ini ?? -99)).filter((p) => p.ini !== null);
      const publico = ord.length === 0 ? null : {
        rodada: est.rodada,
        ordem: ord.map((p) => ({ nome: p.oculto ? "Criatura desconhecida" : p.nome, jogador: p.tipo === "jogador", ini: p.ini, fora: p.fora, vez: p.id === est.vez })),
      };
      const marca = JSON.stringify(publico);
      if (marca === ultimaPublicada.current) return;
      publicarCombate(campanhaId, publico)
        .then(() => { ultimaPublicada.current = marca; })
        .catch(() => setAviso("Não consegui mostrar a ordem aos jogadores agora."));
    }, 900);
    return () => window.clearTimeout(t);
  }, [campanhaId, est.lista, est.rodada, est.vez]);

  const opcoes = useMemo(
    () => [
      ...fichas.map((f) => ({ id: `f:${f.id}`, nome: f.nome, rotulo: `${f.nome} (jogador)` })),
      ...npcs.map((n) => ({ id: `n:${n.id}`, nome: n.nome, rotulo: `${n.nome} (NPC)` })),
    ],
    [fichas, npcs]
  );
  const primeira = fichas[0] ? `f:${fichas[0].id}` : pastas[0] ? `p:${pastas[0]}` : npcs[0] ? `n:${npcs[0].id}` : "";
  const escolhida = origem || primeira;

  const ordenada = useMemo(
    () => [...est.lista].sort((a, b) => (b.ini ?? -99) - (a.ini ?? -99)),
    [est.lista]
  );
  const ativos = ordenada.filter((p) => !p.fora && p.ini !== null);

  const mudar = (id: string, parte: Partial<Participante>) =>
    alterar((e) => ({ ...e, lista: e.lista.map((p) => (p.id === id ? { ...p, ...parte } : p)) }));

  const doNpc = (n: Npc, qtdN: number): Participante[] => {
    const am = n.dados.ameaca;
    const sem = (forma: FormaPrincipal): EstadoNpc => ({ forma, mascara: false });
    const com = (forma: FormaPrincipal): EstadoNpc => ({ forma, mascara: true });
    const base = formaDe(am, sem("base"));
    const liberada = am.liberacao.existe ? formaDe(am, sem("bankai")) : null;
    const et = liberada && am.liberacao.antes ? resumoEtapaAnterior(am) : null;
    const antes = et ? { nome: et.nome, forma: formaDe(am, sem("shikai")), nota: et.notas.map((x) => `${x.nome}: ${x.texto}`).join(" ") } : undefined;
    const ms = liberada ? am.liberacao.mascara : undefined;
    const notasMascara = (f: FormaPrincipal) => bonusDaMascara(am, f).filter((x) => !/: Duração$/.test(x.nome)).map((x) => `${x.nome} — ${x.texto}`);
    const mascara = ms ? {
      nome: ms.nome, base: formaDe(am, com("base")), ...(antes ? { antes: formaDe(am, com("shikai")) } : {}), liberada: formaDe(am, com("bankai")),
      notas: { base: notasMascara("base"), shikai: antes ? notasMascara("shikai") : [], bankai: notasMascara("bankai") },
    } : undefined;
    // estado salvo no NPC: `liberado` = Bankai; `antes` = Shikai (ou, sem Shikai, a máscara de NPCs antigos)
    const s0 = liberada ? estadoDoNpc(am, n.dados.liberado, n.dados.antes, n.dados.mascara) : sem("base");
    const ativo = s0.forma === "bankai";
    const antesAtivo = !!antes && s0.forma === "shikai";
    const mascaraAtiva = !!mascara && s0.mascara;
    const lib = liberada ? { nome: am.liberacao.nome, ativo, base, liberada, efeito: efeitosDaLiberacao(am), ...(antes ? { antes, antesAtivo } : {}), ...(mascara ? { mascara, mascaraAtiva } : {}) } : undefined;
    const c = lib ? formaDoParticipante(lib, s0) : base;
    const total = Math.max(1, Math.min(20, qtdN));
    const grupo = novoId();
    return Array.from({ length: total }, (_, i) => ({
      id: novoId(), nome: total > 1 ? `${n.nome} ${i + 1}` : n.nome, tipo: "npc" as const, ini: null, bonus: Math.floor(am.atr.des / 2),
      pv: Math.min(n.dados.pvAtual ?? c.pvMax, c.pvMax), pvMax: c.pvMax, pr: Math.min(n.dados.prAtual ?? c.prMax, c.prMax), prMax: c.prMax, cr: c.cr, fora: false, nota: "", grupo, oculto: false, acoes: c.acoes, atr: c.atr, prof: c.prof,
      lib,
    }));
  };

  const adicionar = () => {
    try { adicionarSeguro(); } catch { setAviso("Não consegui colocar este NPC no combate."); }
  };

  const adicionarSeguro = () => {
    const corte = escolhida.indexOf(":");
    const tipo = escolhida.slice(0, corte);
    const id = escolhida.slice(corte + 1);
    const grupo = novoId();
    setAviso("");
    const novos: Participante[] = [];
    if (tipo === "f") {
      const f = fichas.find((x) => x.id === id);
      if (!f) return;
      const c = calcular(f.ficha);
      novos.push({
        id: novoId(), nome: f.nome, tipo: "jogador", ini: null, bonus: Math.floor(c.atr.des / 2) + (c.iniciativa - c.atr.des),
        pv: Math.min(f.ficha.pvAtual, c.pv), pvMax: c.pv, pr: Math.min(f.ficha.prAtual, c.pr), prMax: c.pr, cr: c.cr, fora: false, nota: "", grupo, oculto: false, acoes: [], fichaId: f.id,
      });
    } else {
      const ids = tipo === "p" ? npcs.filter((x) => x.dados.pasta === id).map((x) => x.id) : [id];
      for (const nid of ids) {
        const n = npcs.find((x) => x.id === nid);
        if (n) novos.push(...doNpc(n, tipo === "p" ? 1 : qtd));
      }
    }
    alterar((e) => {
      // entrou depois do começo: rola na hora e age a partir da rodada seguinte
      const jaRolou = e.ativo ? d20() : null;
      return { ...e, lista: [...e.lista, ...novos.map((p) => (jaRolou === null ? p : { ...p, ini: jaRolou + p.bonus }))] };
    });
  };

  const rolarTodos = () =>
    alterar((e) => {
      const porGrupo = new Map<string, number>();
      const lista = e.lista.map((p) => {
        if (p.ini !== null) return p;
        // jogadores rolam cada um; NPCs do mesmo grupo dividem o mesmo d20
        const r = p.tipo === "npc" ? porGrupo.get(p.grupo) ?? d20() : d20();
        if (p.tipo === "npc") porGrupo.set(p.grupo, r);
        return { ...p, ini: r + p.bonus };
      });
      // clones e invocações agem junto com quem os criou
      for (let i = 0; i < lista.length; i++) {
        const dono = lista[i].dono ? lista.find((x) => x.id === lista[i].dono) : undefined;
        if (dono && dono.ini !== null && lista[i].ini !== dono.ini) lista[i] = { ...lista[i], ini: dono.ini };
      }
      const ord = [...lista].sort((a, b) => (b.ini ?? -99) - (a.ini ?? -99)).filter((p) => !p.fora);
      return { ...e, ativo: true, lista, vez: e.vez ?? ord[0]?.id ?? null };
    });

  const proximo = () =>
    alterar((e) => {
      const ord = [...e.lista].filter((p) => !p.fora && p.ini !== null).sort((a, b) => (b.ini ?? 0) - (a.ini ?? 0));
      if (ord.length === 0) return e;
      const i = ord.findIndex((p) => p.id === e.vez);
      const prox = i + 1 >= ord.length ? 0 : i + 1;
      return { ...e, vez: ord[prox].id, rodada: i >= 0 && prox === 0 ? e.rodada + 1 : e.rodada };
    });

  const encerrar = () => {
    if (est.lista.length > 0 && !window.confirm("Encerrar o combate e limpar a ordem de iniciativa?")) return;
    // encerrar de propósito publica a ordem vazia (null) para os jogadores
    alterar(vazio);
  };

  const usar = (p: Participante, a: AcaoNpc) => {
    if (a.tipo === "invocar" && a.inv) {
      const inv = a.inv;
      const emCampo = est.lista.filter((x) => x.dono === p.id && x.chaveInv === inv.chave && !x.fora).length;
      if (emCampo >= inv.max) { setAviso(`${p.nome} já tem o máximo de ${inv.nome} em campo (${inv.max}).`); return; }
      if (a.custo > p.pr) { setAviso(`${p.nome} não tem PR para invocar (${a.custo} PR).`); return; }
      setAviso("");
      alterar((e) => ({
        ...e,
        lista: [
          ...e.lista.map((x) => (x.id === p.id ? { ...x, pr: x.pr - a.custo } : x)),
          { id: novoId(), nome: `${inv.nome} ${emCampo + 1} (${p.nome})`, tipo: p.tipo, ini: p.ini, bonus: 0, pv: inv.pv, pvMax: inv.pv, pr: 0, prMax: 0, cr: inv.cr, fora: false, nota: "", grupo: p.grupo, oculto: p.oculto, acoes: acaoDeInvocacao(inv.acerto, inv.dano), dono: p.id, chaveInv: inv.chave },
        ],
      }));
      setRes({ texto: `${p.nome} invoca ${inv.nome} (${emCampo + 1} de ${inv.max}).`, dano: 0, alvoId: "", tecnica: false, acertou: false });
      return;
    }
    const alvo = est.lista.find((x) => x.id === (alvos[p.id] ?? "")) ?? est.lista.find((x) => x.id !== p.id && !x.fora && x.tipo !== p.tipo) ?? est.lista.find((x) => x.id !== p.id && !x.fora);
    if (!alvo) { setAviso("Escolha um alvo."); return; }
    if (a.custo > p.pr) { setAviso(`${p.nome} não tem PR para ${a.nome} (${a.custo} PR).`); return; }
    setAviso("");
    if (a.custo > 0) mudar(p.id, { pr: p.pr - a.custo });
    if (a.tipo === "ataque") {
      const { nat, txt } = d20m(modoD20);
      const total = nat + a.acerto;
      const crit = nat >= a.crit;
      const acertou = nat !== 1 && (crit || nat === 20 || total >= alvo.cr);
      const cab = `${p.nome} ataca ${alvo.nome} com ${a.nome}: d20 ${txt} + ${a.acerto} = ${total} contra CR ${alvo.cr}.`;
      if (!acertou) { setRes({ texto: `${cab} Errou.`, dano: 0, alvoId: alvo.id, tecnica: false, acertou: false }); return; }
      setRes({ texto: `${cab} ${crit ? "CRÍTICO!" : "Acertou."}`, dano: 0, alvoId: alvo.id, tecnica: false, acertou: false, pendente: { nome: a.nome, expr: a.dano, crit, quem: p.nome } });
    } else {
      const r = rolarExpressao(a.nome, a.dano, false);
      const dano = r?.total ?? 0;
      setRes({ texto: `${p.nome} usa ${a.nome} em ${alvo.nome} (CD ${a.cd}). Dano ${r?.detalhe ?? ""} = ${dano}. Se ${alvo.nome} falhar no teste, sofre tudo; se passar, metade.`, dano, alvoId: alvo.id, tecnica: true, acertou: true });
    }
  };

  /** rola só o dano (depois de um ataque que acertou, ou para refazer) */
  const rolarDano = (nome: string, expr: string, crit: boolean, alvoId: string, quem: string) => {
    const r = rolarExpressao(nome, expr, crit);
    const dano = r?.total ?? 0;
    const alvo = est.lista.find((x) => x.id === alvoId);
    setRes({ texto: `${quem}: dano de ${nome}${crit ? " (crítico)" : ""} ${r?.detalhe ?? ""} = ${dano}.`, dano, alvoId: alvo?.id ?? "", tecnica: false, acertou: !!alvo });
  };
  const danoDireto = (p: Participante, a: AcaoNpc) => {
    const alvo = est.lista.find((x) => x.id === (alvos[p.id] ?? "")) ?? est.lista.find((x) => x.id !== p.id && !x.fora && x.tipo !== p.tipo) ?? est.lista.find((x) => x.id !== p.id && !x.fora);
    rolarDano(a.nome, a.dano, false, alvo?.id ?? "", p.nome);
  };

  /** teste de resistência de um NPC: d20 + atributo (+ proficiência, se marcada) */
  const resistir = (p: Participante, atr: string, nomeAtr: string, comProf: boolean) => {
    const val = p.atr?.[atr] ?? 0;
    const prof = comProf ? p.prof ?? 0 : 0;
    const { nat, txt } = d20m(modoD20);
    setRes({ texto: `${p.nome}: resistência de ${nomeAtr}: d20 ${txt} + ${val}${comProf ? ` + ${prof} (prof.)` : ""} = ${nat + val + prof}.`, dano: 0, alvoId: "", tecnica: false, acertou: false });
  };

  const alternarForma = (p: Participante) => {
    if (!p.lib) return;
    if (!p.lib.ativo) {
      const f = p.lib.liberada;
      const ef = p.lib.efeito;
      mudar(p.id, { lib: { ...p.lib, ativo: true }, atr: f.atr, prof: f.prof, acoes: f.acoes, cr: f.cr, pvMax: f.pvMax, prMax: f.prMax, pv: Math.min(f.pvMax, p.pv + ef.curaPv) });
      setRes({ texto: `${p.nome} libera ${p.lib.nome}! CR ${f.cr}.${ef.dano > 0 ? ` Todos os inimigos que o vejam sofrem ${ef.dano} de dano ${ef.tipo}.` : ""}${ef.curaPv > 0 ? ` Recupera ${ef.curaPv} PV.` : ""}`, dano: 0, alvoId: "", tecnica: false, acertou: false });
    } else {
      const f = p.lib.base;
      mudar(p.id, { lib: { ...p.lib, ativo: false }, atr: f.atr, prof: f.prof, acoes: f.acoes, cr: f.cr, pvMax: f.pvMax, prMax: f.prMax, pv: Math.min(f.pvMax, p.pv), pr: Math.min(f.prMax, p.pr) });
      setRes({ texto: `${p.nome} encerra ${p.lib.nome}.`, dano: 0, alvoId: "", tecnica: false, acertou: false });
    }
  };

  /** NPC com Shikai e/ou máscara: a forma principal (base → Shikai → Bankai, a Bankai substitui a Shikai) e a máscara (liga e desliga à parte, soma por cima).
   *  O PV atual fica (limitado ao novo máximo); se o máximo sobe, a diferença soma ao atual. O mesmo vale para o PR. */
  const trocarEstado = (p: Participante, alvo: EstadoNpc) => {
    const l = p.lib;
    if (!l) return;
    const de: EstadoNpc = { forma: formaAtiva(l), mascara: !!l.mascaraAtiva && !!l.mascara };
    const para: EstadoNpc = { forma: alvo.forma === "shikai" && !l.antes ? de.forma : alvo.forma, mascara: alvo.mascara && !!l.mascara };
    const f = formaDoParticipante(l, para);
    const entraBankai = para.forma === "bankai" && de.forma !== "bankai";
    const cura = entraBankai ? l.efeito.curaPv : 0;
    const pv = Math.max(0, Math.min(f.pvMax, p.pv + Math.max(0, f.pvMax - p.pvMax) + cura));
    const pr = Math.max(0, Math.min(f.prMax, p.pr + Math.max(0, f.prMax - p.prMax)));
    mudar(p.id, { lib: { ...l, ativo: para.forma === "bankai", antesAtivo: para.forma === "shikai", mascaraAtiva: para.mascara }, atr: f.atr, prof: f.prof, acoes: f.acoes, cr: f.cr, pvMax: f.pvMax, prMax: f.prMax, pv, pr });
    const nomeForma = (x: FormaPrincipal) => (x === "bankai" ? l.nome : x === "shikai" ? l.antes?.nome ?? "" : "");
    const nomeMasc = l.mascara?.nome ?? "a máscara";
    const ganhoPv = f.pvMax - p.pvMax, ganhoPr = f.prMax - p.prMax;
    const temp = ganhoPv > 0 || ganhoPr > 0 ? ` ${[ganhoPv > 0 ? `+${ganhoPv} PV` : "", ganhoPr > 0 ? `+${ganhoPr} PR` : ""].filter(Boolean).join(" e ")} temporários.` : "";
    let texto: string;
    if (para.forma === "base" && !para.mascara) {
      texto = `${p.nome} encerra ${[nomeForma(de.forma), de.mascara ? nomeMasc : ""].filter(Boolean).join(" e ") || "as formas"}. CR ${f.cr}.`;
    } else if (para.mascara !== de.mascara && para.forma === de.forma) {
      texto = para.mascara
        ? `${p.nome} põe ${nomeMasc}${de.forma !== "base" ? ` por cima de ${nomeForma(de.forma)}` : ""}! CR ${f.cr}.${temp} ${l.mascara?.notas[para.forma].filter((x) => /Corpo Hollow/.test(x)).join(" ") ?? ""}`.trim()
        : `${p.nome} tira ${nomeMasc}. CR ${f.cr}.`;
    } else {
      const ef = l.efeito;
      const extra = entraBankai ? `${ef.dano > 0 ? ` Todos os inimigos que o vejam sofrem ${ef.dano} de dano ${ef.tipo}.` : ""}${ef.curaPv > 0 ? ` Recupera ${ef.curaPv} PV.` : ""}` : `${temp}${para.forma === "shikai" && l.antes?.nota ? ` ${l.antes.nota}` : ""}`;
      texto = `${p.nome} libera ${nomeForma(para.forma)}${para.mascara ? ` (${nomeMasc} continua)` : ""}! CR ${f.cr}.${extra}`;
    }
    setRes({ texto, dano: 0, alvoId: "", tecnica: false, acertou: false });
  };

  const aplicar = (valor: number) => {
    if (!res) return;
    const alvo = est.lista.find((x) => x.id === res.alvoId);
    if (alvo) ajustar(alvo, "pv", -Math.max(0, Math.floor(valor)));
    setRes(null);
  };

  const ajustar = (p: Participante, campo: "pv" | "pr", d: number) => {
    const max = campo === "pv" ? p.pvMax : p.prMax;
    const novo = Math.max(0, Math.min(max, p[campo] + d));
    mudar(p.id, campo === "pv" ? { pv: novo, fora: novo === 0 && p.tipo === "npc" ? true : p.pv === 0 && novo > 0 ? false : p.fora } : { pr: novo });
  };

  return (
    <section className="caixa combate">
      <h3>Combate {est.ativo && <small>· rodada {est.rodada}</small>}</h3>
      <div className="combate-modo" role="group" aria-label="Vantagem nos d20">
        <small>Testes:</small>
        {(["normal", "vantagem", "desvantagem"] as ModoD20[]).map((m) => <button type="button" key={m} className={`btn ${modoD20 === m ? "btn-red" : "btn-paper"}`} onClick={() => setModoD20(m)}>{m === "normal" ? "Normal" : m === "vantagem" ? "Vantagem" : "Desvantagem"}</button>)}
      </div>
      {opcoes.length === 0 ? (
        <p>Ligue fichas de jogadores à mesa ou crie NPCs para montar o combate.</p>
      ) : (
        <div className="linha-rolar">
          <select value={escolhida} onChange={(e) => setOrigem(e.target.value)} aria-label="Quem entra no combate">
            {fichas.length > 0 && <optgroup label="Jogadores">{opcoes.filter((o) => o.id.startsWith("f:")).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</optgroup>}
            {pastas.length > 0 && <optgroup label="Pastas de NPCs (todos de uma vez)">{pastas.map((p) => <option key={p} value={`p:${p}`}>Pasta: {p}</option>)}</optgroup>}
            {npcs.length > 0 && <optgroup label="NPCs">{opcoes.filter((o) => o.id.startsWith("n:")).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}</optgroup>}
          </select>
          {escolhida.startsWith("n:") && (
            <label className="combate-qtd">Quantos
              <input type="number" min={1} max={20} value={qtd} onChange={(e) => setQtd(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} />
            </label>
          )}
          <button type="button" className="btn btn-paper" onClick={adicionar}>Entrar no combate</button>
        </div>
      )}

      {est.lista.length > 0 && (
        <div className="combate-controles">
          <button type="button" className="btn btn-red" onClick={rolarTodos} disabled={est.lista.every((p) => p.ini !== null)}>Rolar iniciativa</button>
          <button type="button" className="btn btn-paper" onClick={proximo} disabled={ativos.length === 0}>Próximo turno</button>
          <button type="button" className="link-perigo" onClick={encerrar}>Encerrar combate</button>
        </div>
      )}

      {aviso && <p className="aviso" role="alert">{aviso}</p>}
      {res && (
        <div className="combate-resultado" role="status">
          <p>{res.texto}</p>
          <div className="linha-rolar">
            {res.pendente && <button type="button" className="btn btn-red" onClick={() => rolarDano(res.pendente!.nome, res.pendente!.expr, res.pendente!.crit, res.alvoId, res.pendente!.quem)}>Rolar dano{res.pendente.crit ? " crítico" : ""}</button>}
            {res.acertou && <button type="button" className="btn btn-red" onClick={() => aplicar(res.dano)}>Aplicar {res.dano} de dano</button>}
            {res.tecnica && <button type="button" className="btn btn-paper" onClick={() => aplicar(res.dano / 2)}>Aplicar metade ({Math.floor(res.dano / 2)})</button>}
            <button type="button" className="link-perigo" onClick={() => setRes(null)}>Fechar</button>
          </div>
        </div>
      )}

      <ol className="combate-lista">
        {ordenada.map((p) => (
          <li key={p.id} className={`combate-item${p.id === est.vez && !p.fora ? " vez" : ""}${p.fora ? " fora" : ""}${p.tipo === "jogador" ? " jog" : ""}`}>
            <div className="combate-topo">
              <label className="combate-ini">Inic.
                <input type="number" value={p.ini ?? ""} placeholder="—" onChange={(e) => mudar(p.id, { ini: e.target.value === "" ? null : Number(e.target.value) })} />
              </label>
              <div className="combate-nome">
                <b>{p.nome}</b>
                <small>{p.dono ? "Invocação" : p.tipo === "jogador" ? "Jogador" : "NPC"} · CR {p.cr}</small>
              </div>
              {p.id === est.vez && !p.fora && <span className="combate-selo">No turno</span>}
            </div>
            <div className="npc-linha"><b>PV {p.pv}/{p.pvMax}</b>
              <span className="npc-botoes">{[-10, -5, -1, 1, 5, 10].map((d) => <button type="button" key={d} className="btn btn-paper" aria-label={`${d > 0 ? "Somar" : "Tirar"} ${Math.abs(d)} PV de ${p.nome}`} onClick={() => ajustar(p, "pv", d)}>{d > 0 ? `+${d}` : d}</button>)}</span>
            </div>
            <div className="npc-linha"><b>PR {p.pr}/{p.prMax}</b>
              <span className="npc-botoes">{[-5, -1, 1, 5].map((d) => <button type="button" key={d} className="btn btn-paper" aria-label={`${d > 0 ? "Somar" : "Tirar"} ${Math.abs(d)} PR de ${p.nome}`} onClick={() => ajustar(p, "pr", d)}>{d > 0 ? `+${d}` : d}</button>)}</span>
            </div>
            {p.lib && !p.lib.antes && !p.lib.mascara && <button type="button" className={`btn ${p.lib.ativo ? "btn-paper" : "btn-red"}`} onClick={() => alternarForma(p)}>{p.lib.ativo ? `Encerrar ${p.lib.nome}` : `Liberar ${p.lib.nome}`}</button>}
            {p.lib && (p.lib.antes || p.lib.mascara) && (() => {
              const l = p.lib!;
              const fa = formaAtiva(l);
              const mAt = !!l.mascaraAtiva && !!l.mascara;
              return (
                <>
                  <div className="linha-rolar combate-etapas">
                    {l.antes && fa === "base" && <button type="button" className="btn btn-red" onClick={() => trocarEstado(p, { forma: "shikai", mascara: mAt })}>Liberar {l.antes.nome}</button>}
                    {fa !== "bankai" && <button type="button" className="btn btn-red" onClick={() => trocarEstado(p, { forma: "bankai", mascara: mAt })}>Liberar {l.nome}</button>}
                    {l.mascara && <button type="button" className={`btn ${mAt ? "btn-paper" : "btn-red"}`} onClick={() => trocarEstado(p, { forma: fa, mascara: !mAt })}>{mAt ? `Tirar ${l.mascara.nome}` : `Pôr ${l.mascara.nome}`}</button>}
                    {(fa !== "base" || mAt) && <button type="button" className="btn btn-paper" onClick={() => trocarEstado(p, { forma: "base", mascara: false })}>Encerrar formas</button>}
                  </div>
                  {(fa !== "base" || mAt) && (
                    <div className="combate-estado-linha">
                      <span className="chip combate-estado" title="Formas ativas">{[fa === "bankai" ? l.nome : fa === "shikai" ? l.antes?.nome : "", mAt ? l.mascara?.nome : ""].filter(Boolean).join(" + ")}</span>
                      {mAt && l.mascara && l.mascara.notas[fa].length > 0 && (
                        <details className="recolhe combate-efeitos">
                          <summary>Efeitos <small>{l.mascara.notas[fa].length}</small></summary>
                          <ul className="lista-hab-resumo combate-mascara">{l.mascara.notas[fa].map((x) => <li key={x}>{x}</li>)}</ul>
                        </details>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
            {p.acoes.length > 0 && (
              <div className="combate-acoes-box">
                <label className="campo">Alvo
                  <select value={alvos[p.id] ?? ""} onChange={(e) => setAlvos((m) => ({ ...m, [p.id]: e.target.value }))}>
                    <option value="">Automático (um dos jogadores)</option>
                    {est.lista.filter((x) => x.id !== p.id).map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
                  </select>
                </label>
                <div className="combate-acoes-npc">
                  {p.acoes.map((a, i) => (
                    <span key={`${i}-${a.nome}`} className="acao-par">
                      <button type="button" className="btn btn-paper" onClick={() => usar(p, a)}>
                        {a.nome}{a.tipo === "ataque" ? ` · +${a.acerto}` : a.tipo === "invocar" ? (a.custo > 0 ? ` · ${a.custo} PR` : "") : ` · CD ${a.cd}`}{a.mascara ? ` (máscara ${a.mascara})` : ""}
                      </button>
                      {a.tipo === "ataque" && a.dano && <button type="button" className="btn btn-paper acao-dano" style={{ whiteSpace: "nowrap", flexShrink: 0 }} title="Rolar só o dano" onClick={() => danoDireto(p, a)}>Dano</button>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {p.atr && (
              <div className="combate-resist">
                <small>Resistência</small>
                {ATRS.map((x) => (
                  <button type="button" key={x.id} className="btn btn-paper" title={`Teste de resistência de ${x.nome}`} onClick={() => resistir(p, x.id, x.nome, !!provas[`${p.id}:${x.id}`])}>
                    {x.nome.slice(0, 3).toUpperCase()} {(p.atr?.[x.id] ?? 0) + (provas[`${p.id}:${x.id}`] ? p.prof ?? 0 : 0) >= 0 ? "+" : ""}{(p.atr?.[x.id] ?? 0) + (provas[`${p.id}:${x.id}`] ? p.prof ?? 0 : 0)}
                  </button>
                ))}
                <label className="marcar" title="Soma a proficiência nos testes de resistência marcados abaixo">
                  <input type="checkbox" checked={ATRS.every((x) => provas[`${p.id}:${x.id}`])} onChange={(e) => setProvas((m) => { const n = { ...m }; for (const x of ATRS) n[`${p.id}:${x.id}`] = e.target.checked; return n; })} /> com prof.
                </label>
              </div>
            )}
            <label className="campo">Condições e notas
              <input value={p.nota} maxLength={120} placeholder="Sangramento, Preso…" onChange={(e) => mudar(p.id, { nota: e.target.value })} />
            </label>
            <div className="combate-acoes">
              {p.tipo === "npc" && <label className="marcar"><input type="checkbox" checked={p.oculto} onChange={(e) => mudar(p.id, { oculto: e.target.checked })} /> Esconder nome</label>}
              <label className="marcar"><input type="checkbox" checked={p.fora} onChange={(e) => mudar(p.id, { fora: e.target.checked })} /> Fora de combate</label>
              <button type="button" className="link-perigo" onClick={() => alterar((e) => ({ ...e, vez: e.vez === p.id ? null : e.vez, lista: e.lista.filter((x) => x.id !== p.id && x.dono !== p.id) }))}>Tirar da lista</button>
            </div>
          </li>
        ))}
      </ol>
      {est.lista.length > 0 && <p className="ajuda">Iniciativa = d20 + metade da Destreza (mais bônus da ficha). NPCs adicionados juntos rolam uma vez só. Os jogadores veem a ordem de iniciativa (sem PV dos NPCs). O PV/PR dos jogadores acompanha a ficha deles (atualiza sozinho); seus ajustes aqui não mudam a ficha.</p>}
    </section>
  );
}
