import { formaNpc, TIPOS_MODELO_NPC, type FormaNpc, type RefModeloNpc } from "./forma-npc";
import { MASCARAS, tempMascara, type TipoMascara } from "./mascara";
/* Criação de ameaças e NPCs, seguindo o capítulo 14 do livro. */
import { FATOR_K, escalarDados, fatorSuporte } from "./simulador";

export type Categoria = "hollow" | "shinigami" | "quincy";
export type Formato = "solo" | "raid";
export type Dificuldade = "facil" | "medio" | "dificil";
/** comum: ameaça do livro; pareado: rival de um jogador (fator k); suporte: par do Curandeiro; boss: chefe de grupo */
export type Modo = "comum" | "pareado" | "suporte" | "boss";
export type ChaveAtr = "for" | "des" | "con" | "men" | "esp";

export const ATRS: { id: ChaveAtr; nome: string }[] = [
  { id: "for", nome: "Força" },
  { id: "des", nome: "Destreza" },
  { id: "con", nome: "Constituição" },
  { id: "men", nome: "Mente" },
  { id: "esp", nome: "Espírito" },
];

export const CATEGORIAS: { id: Categoria; nome: string }[] = [
  { id: "hollow", nome: "Hollow" },
  { id: "shinigami", nome: "Shinigami" },
  { id: "quincy", nome: "Quincy" },
];

/** PV base, PR base e pontos de atributo por ND (índice = ND − 1). */
const TABELA: Record<Categoria, { pv: (n: number) => number; pr: (n: number) => number; atr: (n: number) => number }> = {
  hollow: { pv: (n) => 30 * n, pr: (n) => 10 * n, atr: (n) => 9 + n },
  shinigami: { pv: (n) => 25 * n, pr: (n) => 20 * n, atr: (n) => 11 + n },
  quincy: { pv: (n) => 20 * n, pr: (n) => 25 * n, atr: (n) => 10 + n },
};

export const GRAUS: Record<Categoria, { nome: string; cr: number; atr: number }[]> = {
  hollow: [
    { nome: "Hollow Comum", cr: 0, atr: 0 },
    { nome: "Gillian", cr: 2, atr: 3 },
    { nome: "Adjuchas", cr: 3, atr: 5 },
    { nome: "Vasto Lorde", cr: 4, atr: 7 },
    { nome: "Arrancar", cr: 5, atr: 9 },
  ],
  shinigami: [
    { nome: "Shinigami", cr: 0, atr: 0 },
    { nome: "Tenente", cr: 1, atr: 3 },
    { nome: "Capitão", cr: 2, atr: 5 },
    { nome: "Capitão Comandante", cr: 3, atr: 7 },
  ],
  quincy: [
    { nome: "Soldat", cr: 0, atr: 0 },
    { nome: "Oficial", cr: 1, atr: 3 },
    { nome: "Sternritter", cr: 2, atr: 5 },
    { nome: "Schutzstaffel", cr: 4, atr: 7 },
  ],
};

const CR_BASE: Record<Categoria, Record<Dificuldade, number>> = {
  hollow: { facil: 8, medio: 10, dificil: 12 },
  shinigami: { facil: 10, medio: 12, dificil: 14 },
  quincy: { facil: 9, medio: 11, dificil: 13 },
};

export const proficienciaDoND = (nd: number) => (nd <= 4 ? 2 : nd <= 8 ? 3 : nd <= 12 ? 4 : nd <= 16 ? 5 : 6);
const atrRaid = (nd: number) => (nd <= 5 ? 5 : nd <= 10 ? 7 : nd <= 15 ? 9 : 11);

export interface AtaqueAmeaca { nome: string; atr: ChaveAtr; dados: string; tipo: string; custo?: number; crit?: number }
/** Forma liberada: Bankai (Shinigami), Resurrección (Hollow), Vollständig (Quincy). */
export interface LiberacaoAmeaca {
  /** a ameaça tem uma forma liberada */
  existe: boolean;
  nome: string;
  bonusCr: number;
  bonusAtr: Record<ChaveAtr, number>;
  /** % dos PV máximos recuperados ao liberar */
  cura: number;
  /** dano em área ao liberar: mult × atributo (0 = não tem) */
  explosao: { mult: number; atr: ChaveAtr; tipo: string };
  /** ataques e técnicas daqui substituem os normais (em vez de somar) */
  trocar: boolean;
  ataques: AtaqueAmeaca[];
  tecnicas: TecnicaAmeaca[];
  texto: string;
  /** modelo pronto de forma (Bankai, Resurrección…) que dá as peças e as habilidades; sem ele, só valem os campos acima */
  modelo?: RefModeloNpc;
  /** etapa anterior opcional (Shikai antes da Bankai); ausente = libera direto a forma principal. A forma principal SUBSTITUI a Shikai. */
  antes?: EtapaAnterior;
  /** Máscara Hollow do Visored (opcional): SOMA por cima da forma ativa (base, Shikai ou Bankai) */
  mascara?: MascaraNpc;
}

/** Etapa anterior à forma principal: um modelo pronto (Shikai). (Máscara salva aqui por versões antigas migra para `mascara`.) */
export interface EtapaAnterior {
  tipo: "modelo";
  nome: string;
  modelo?: RefModeloNpc;
  bonusCr: number;
}

/** Máscara Hollow do Visored de um NPC: liga e desliga à parte da forma. */
export interface MascaraNpc {
  mascara: TipoMascara;
  nome: string;
  bonusCr: number;
}

/** base = sem forma; antes = Shikai (ou, sem Shikai, a máscara salva por versões antigas); liberado = forma principal ativa */
export type EtapaNpc = "base" | "antes" | "liberado";
/** forma principal ativa (a Bankai substitui a Shikai) */
export type FormaPrincipal = "base" | "shikai" | "bankai";
/** forma principal + máscara (que soma por cima de qualquer uma) */
export interface EstadoNpc { forma: FormaPrincipal; mascara: boolean }

/** Estado que vale de fato: a forma precisa existir e a Shikai/máscara, estarem montadas. */
export function estadoValido(a: Ameaca, e: boolean | EtapaNpc | EstadoNpc): EstadoNpc {
  const l = a.liberacao;
  let s: EstadoNpc;
  if (typeof e === "object" && e) s = { forma: e.forma, mascara: e.mascara === true };
  else if (e === true || e === "liberado") s = { forma: "bankai", mascara: false };
  else if (e === "antes") s = l.antes ? { forma: "shikai", mascara: false } : { forma: "base", mascara: !!l.mascara };
  else s = { forma: "base", mascara: false };
  if (!l.existe) return { forma: "base", mascara: false };
  if (s.forma === "shikai" && !l.antes) s = { ...s, forma: "base" };
  if (s.forma !== "base" && s.forma !== "shikai" && s.forma !== "bankai") s = { ...s, forma: "base" };
  return { forma: s.forma, mascara: s.mascara && !!l.mascara };
}

/** Etapa (formato antigo) que corresponde ao estado; a máscara sozinha conta como "antes" quando não há Shikai. */
export function etapaValida(a: Ameaca, e: boolean | EtapaNpc | EstadoNpc): EtapaNpc {
  const s = estadoValido(a, e);
  return s.forma === "bankai" ? "liberado" : s.forma === "shikai" || (s.mascara && !a.liberacao.antes) ? "antes" : "base";
}

/** Etapa ativa de um NPC a partir das marcas salvas (liberado e antes são mutuamente exclusivos). */
export const etapaDoNpc = (a: Ameaca, liberado: boolean, antes?: boolean): EtapaNpc => etapaValida(a, liberado ? "liberado" : antes ? "antes" : "base");

/** Estado de um NPC a partir das marcas salvas: `antes` é a Shikai; sem Shikai montada, é a máscara (NPCs salvos antes da máscara somar). */
export function estadoDoNpc(a: Ameaca, liberado: boolean, antes?: boolean, mascara?: boolean): EstadoNpc {
  const base = estadoValido(a, liberado ? "liberado" : antes ? "antes" : "base");
  return mascara === true ? estadoValido(a, { ...base, mascara: true }) : base;
}

/** Marcas a salvar no NPC para um estado. A máscara só fica salva (em `antes`) quando está sozinha e não há Shikai; nos outros casos ela vive na tela/no combate. */
export function marcasDoEstado(a: Ameaca, e: EstadoNpc): { liberado: boolean; antes: boolean; mascara: boolean } {
  const s = estadoValido(a, e);
  return { liberado: s.forma === "bankai", antes: s.forma === "shikai" || (s.forma === "base" && s.mascara && !a.liberacao.antes), mascara: s.mascara };
}

/** Nome curto do estado para avisos e cabeçalhos ("Shikai Senbonzakura + Máscara do Predador"). */
export function nomeDoEstado(a: Ameaca, e: EstadoNpc): string {
  const s = estadoValido(a, e);
  const l = a.liberacao;
  const forma = s.forma === "bankai" ? l.nome : s.forma === "shikai" ? l.antes?.nome ?? "Shikai" : "";
  return [forma, s.mascara ? l.mascara?.nome ?? "" : ""].filter(Boolean).join(" + ");
}

/** Soma `n` dados ao primeiro termo NdF da expressão ("2d8 + 4" com 3 → "5d8 + 4"); sem termo de dado, fica igual. */
export function somarDados(expr: string, n: number): string {
  if (!n) return expr;
  return expr.replace(/(\d+)d(\d+)/i, (_, q: string, f: string) => `${Math.max(1, Number(q) + n)}d${f}`);
}

/** Efeito do livro de cada máscara em números de NPC (prof. e ND no lugar de proficiência e nível). */
export function efeitoMascaraNpc(m: TipoMascara, prof: number, nd: number) {
  return {
    rd: m === "predador" ? Math.floor(nd / 2) : 0,
    cd: m === "conquistador" ? prof : 0,
    dadosGolpe: m === "predador" ? prof : m === "equilibrio" ? 1 : 0,
    dadosTecnica: m === "conquistador" ? 2 * prof : m === "equilibrio" ? Math.floor(prof / 2) : 0,
    temp: tempMascara(m),
  };
}

/** Forma pronta (Shikai) da etapa anterior, se a etapa for de modelo. */
export function formaDaEtapaAnterior(a: Ameaca): FormaNpc | null {
  const e = a.liberacao.antes;
  return e?.tipo === "modelo" && e.modelo ? formaNpc(a, e.modelo) : null;
}

/** Forma pronta (com habilidades) da forma principal ativa: Bankai → modelo da Bankai; Shikai → modelo da Shikai; base → nenhuma. */
export function formaDoEstado(a: Ameaca, e: boolean | EtapaNpc | EstadoNpc): FormaNpc | null {
  const s = estadoValido(a, e);
  return s.forma === "bankai" ? formaNpc(a) : s.forma === "shikai" ? formaDaEtapaAnterior(a) : null;
}

/** "+2d10" dos `n` dados que somarDados acrescenta ao primeiro termo de `expr` (vazio se não acrescenta nada). */
function rotuloDados(expr: string, n: number): string {
  const m = /(\d+)d(\d+)/i.exec(expr);
  return n > 0 && m ? `+${n}d${m[2]}` : "";
}

/** Ações da forma pronta ativa, já com a máscara por cima (as habilidades de Zanpakutō contam como técnicas). `mascara` diz o que veio dela. */
export function acoesDoEstado(a: Ameaca, e: boolean | EtapaNpc | EstadoNpc): (FormaNpc["acoes"][number] & { mascara?: string })[] {
  const s = estadoValido(a, e);
  const f = formaDoEstado(a, s);
  if (!f) return [];
  const m = s.mascara ? a.liberacao.mascara : undefined;
  if (!m) return f.acoes;
  const c = calcularAmeaca(a, { forma: s.forma, mascara: false });
  const ef = efeitoMascaraNpc(m.mascara, c.prof, c.nd);
  return f.acoes.map((x) => {
    const extra = [rotuloDados(x.dano, ef.dadosTecnica), ef.cd && x.tipo === "tecnica" ? `CD +${ef.cd}` : ""].filter(Boolean).join(", ");
    return { ...x, dano: somarDados(x.dano, ef.dadosTecnica), cd: x.cd + (x.tipo === "tecnica" ? ef.cd : 0), ...(extra ? { mascara: extra } : {}) };
  });
}

/** Bônus da máscara na forma indicada, um por efeito, com o nome "Máscara do Predador: Corpo Hollow" etc. */
export function bonusDaMascara(a: Ameaca, forma: FormaPrincipal = "base"): { nome: string; texto: string }[] {
  const m = a.liberacao.mascara;
  if (!m || !a.liberacao.existe) return [];
  const c = calcularAmeaca(a, { forma, mascara: false });
  const ef = efeitoMascaraNpc(m.mascara, c.prof, c.nd);
  const pv = Math.floor(c.pv * ef.temp.pv), pr = Math.floor(c.pr * ef.temp.pr);
  const nome = MASCARAS.find((x) => x.id === m.mascara)?.nome ?? m.nome;
  const r: { nome: string; texto: string }[] = [];
  const add = (efeito: string, texto: string) => r.push({ nome: `${nome}: ${efeito}`, texto });
  if (m.mascara === "predador") {
    add("Corpo Hollow", `RD ${ef.rd} contra tudo, menos psíquico e temporal. Soma com a RD que o NPC já tem (física e esotérica).`);
    add("Golpes Amplificados", `+${ef.dadosGolpe} dados nos ataques (golpes de Zanpakutō e Hakuda).`);
    add("Vitalidade Hollow", `+${pv} PV temporários (metade do total) enquanto ativa.`);
  } else if (m.mascara === "conquistador") {
    add("Imposição Hollow", `+${ef.cd} na CD das técnicas e Kidōs.`);
    add("Poder Aumentado", `+${ef.dadosTecnica} dados nas técnicas (Zanpakutō, Hadō e Bakudō).`);
    add("Reiatsu Amplificada", `+${pr} PR temporários (metade do total) enquanto ativa.`);
  } else {
    add("Poder Amplificado", `+${ef.dadosTecnica} dado${ef.dadosTecnica === 1 ? "" : "s"} nas técnicas e +${ef.dadosGolpe} dado nos golpes.`);
    add("Reiatsu Amplificada e Vitalidade Hollow", `+${pv} PV e +${pr} PR temporários (um quarto do total) enquanto ativa.`);
  }
  if (m.bonusCr) add("CR extra", `${m.bonusCr > 0 ? "+" : ""}${m.bonusCr} de CR.`);
  add("Duração", "Para NPC, dura até o Mestre tirar a máscara.");
  return r;
}

/** Resumo da máscara na forma indicada: CR, PV/PR temporários e os bônus. */
export function resumoMascara(a: Ameaca, forma: FormaPrincipal = "base"): { nome: string; cr: number; pvTemp: number; prTemp: number; notas: { nome: string; texto: string }[] } | null {
  const m = a.liberacao.mascara;
  if (!m || !a.liberacao.existe) return null;
  const sem = calcularAmeaca(a, { forma, mascara: false }), com = calcularAmeaca(a, { forma, mascara: true });
  return { nome: m.nome, cr: com.cr - sem.cr, pvTemp: com.pv - sem.pv, prTemp: com.pr - sem.pr, notas: bonusDaMascara(a, forma) };
}

/** Resumo da etapa anterior (Shikai) para a carta e o combate: bônus de CR e a forma pronta. A máscara tem o próprio resumo (resumoMascara). */
export function resumoEtapaAnterior(a: Ameaca): { nome: string; cr: number; pvTemp: number; prTemp: number; forma: FormaNpc | null; notas: { nome: string; texto: string }[] } | null {
  const e = a.liberacao.antes;
  if (!e || !a.liberacao.existe) return null;
  const base = calcularBase(a);
  const antes = calcularAmeaca(a, { forma: "shikai", mascara: false });
  return { nome: e.nome, cr: antes.cr - base.cr, pvTemp: antes.pv - base.pv, prTemp: antes.pr - base.pr, forma: formaDaEtapaAnterior(a), notas: [] };
}

export const NOME_LIBERACAO: Record<Categoria, string> = { shinigami: "Bankai", hollow: "Resurrección", quincy: "Vollständig" };

export function liberacaoVazia(categoria: Categoria = "shinigami"): LiberacaoAmeaca {
  return { existe: false, nome: NOME_LIBERACAO[categoria], bonusCr: 0, bonusAtr: { for: 0, des: 0, con: 0, men: 0, esp: 0 }, cura: 0, explosao: { mult: 0, atr: "esp", tipo: "Psíquico" }, trocar: false, ataques: [], tecnicas: [], texto: "" };
}

/** Ponto de partida de mesa: CR +1, +2 no atributo mais alto; Shinigami com explosão de 5× Espírito, Hollow que cura metade dos PV. */
export function liberacaoPadrao(a: Pick<Ameaca, "categoria" | "formato" | "atr">): LiberacaoAmeaca {
  const l = liberacaoVazia(a.categoria);
  const maior = ATRS.map((x) => x.id).sort((x, y) => a.atr[y] - a.atr[x])[0];
  l.existe = true;
  l.bonusCr = 1;
  l.bonusAtr[maior] = 2;
  if (a.categoria === "shinigami") l.explosao = { mult: a.formato === "raid" ? 10 : 5, atr: "esp", tipo: "Psíquico" };
  if (a.categoria === "hollow") l.cura = 50;
  return l;
}

export interface ZanpakutouAmeaca { nome: string; shikai: string; bankai: string }
export interface TecnicaAmeaca { nome: string; dados: string; custo: number; atr: ChaveAtr; texto: string }

export interface HabilidadeAmeaca { titulo: string; texto: string }

export interface Ameaca {
  categoria: Categoria;
  formato: Formato;
  nd: number;
  grau: number;
  dificuldade: Dificuldade;
  atr: Record<ChaveAtr, number>;
  modo: Modo;
  /** só no modo boss */
  jogadores: number;
  /** PV extra em %, para o 5v5 e ajustes de mesa */
  pvExtra: number;
  ataques: AtaqueAmeaca[];
  tecnicas: TecnicaAmeaca[];
  caracteristicas: string;
  /** subtítulo: cargo, divisão, apelido */
  titulo: string;
  zanpakutou: ZanpakutouAmeaca;
  liberacao: LiberacaoAmeaca;
  /** Reação, Ação Suprema, Zanpakutō, Bankai, Kidō… (texto livre) */
  habilidades: HabilidadeAmeaca[];
}

/** Modelo de ameaça pronta do livro (capítulo 14). */
export interface ModeloAmeaca {
  id: string;
  nome: string;
  categoria: Categoria;
  grau: number;
  formato: Formato;
  nd: number;
  estilo: string;
  caracteristicas: string;
  ataques: AtaqueAmeaca[];
  tecnicas: TecnicaAmeaca[];
  habilidades?: HabilidadeAmeaca[];
}

export function ameacaDoModelo(m: ModeloAmeaca, nd = m.nd): Ameaca {
  const base: Ameaca = { ...ameacaPadrao(m.categoria, nd), formato: m.formato, grau: m.grau };
  const pontos = pontosDeAtributo({ categoria: m.categoria, formato: m.formato, nd, grau: m.grau });
  const atr = distribuir(pontos, m.estilo);
  const COM_FORMA = /^(capitao|arrancar|rukia|ichigo|quincy-(oficial|sternritter|schutzstaffel))/;
  const liberacao = COM_FORMA.test(m.id) ? liberacaoPadrao({ categoria: m.categoria, formato: m.formato, atr }) : liberacaoVazia(m.categoria);
  return normalizarAmeaca({ ...base, atr, liberacao, ataques: m.ataques, tecnicas: m.tecnicas, caracteristicas: m.caracteristicas, habilidades: m.habilidades ?? [] });
}

export function ameacaPadrao(categoria: Categoria = "shinigami", nd = 1): Ameaca {
  const pontos = pontosDeAtributo({ categoria, formato: "solo", nd, grau: 0 });
  const atr = distribuir(pontos, "equilibrado");
  return {
    categoria, formato: "solo", nd, grau: 0, dificuldade: "medio", atr, modo: "comum", jogadores: 4, pvExtra: 0,
    ataques: [{ nome: categoria === "hollow" ? "Garras" : categoria === "quincy" ? "Lâmina de Reishi" : "Katana", atr: categoria === "shinigami" ? "des" : "for", dados: "1d8", tipo: "Cortante" }],
    tecnicas: [], caracteristicas: "", titulo: "", zanpakutou: { nome: "", shikai: "", bankai: "" }, liberacao: liberacaoVazia(categoria), habilidades: [],
  };
}

export const ESTILOS: { id: string; nome: string }[] = [
  { id: "equilibrado", nome: "Equilibrado" },
  { id: "fisico", nome: "Lutador físico" },
  { id: "kido", nome: "Especialista em Kidō" },
  { id: "veloz", nome: "Veloz" },
];

/** Distribui os pontos entre os cinco atributos conforme o estilo. */
export function distribuir(pontos: number, estilo: string): Record<ChaveAtr, number> {
  const peso: Record<string, Record<ChaveAtr, number>> = {
    equilibrado: { for: 1, des: 1, con: 1, men: 1, esp: 1 },
    fisico: { for: 3, des: 2, con: 3, men: 0.5, esp: 1 },
    kido: { for: 0.5, des: 1, con: 1, men: 3, esp: 3 },
    veloz: { for: 1.5, des: 3, con: 1.5, men: 1, esp: 1.5 },
  };
  const p = peso[estilo] ?? peso.equilibrado;
  const soma = ATRS.reduce((s, a) => s + p[a.id], 0);
  const r = { for: 0, des: 0, con: 0, men: 0, esp: 0 } as Record<ChaveAtr, number>;
  let usados = 0;
  ATRS.forEach((a) => { r[a.id] = Math.floor((pontos * p[a.id]) / soma); usados += r[a.id]; });
  const ordem = [...ATRS].sort((a, b) => p[b.id] - p[a.id]);
  for (let i = 0; usados < pontos; i++, usados++) r[ordem[i % ordem.length].id]++;
  return r;
}

export function pontosDeAtributo(a: Pick<Ameaca, "categoria" | "formato" | "nd" | "grau">): number {
  const nd = Math.min(20, Math.max(1, a.nd));
  return TABELA[a.categoria].atr(nd) + (GRAUS[a.categoria][a.grau]?.atr ?? 0) + (a.formato === "raid" ? atrRaid(nd) : 0);
}

export interface AmeacaCalculada {
  nd: number;
  prof: number;
  pontos: number;
  usados: number;
  pv: number;
  pr: number;
  cr: number;
  k: number;
  hierro: boolean;
  /** RD física e esotérica do NPC: a das peças da forma ativa mais a do Corpo Hollow da Máscara do Predador (as duas somam) */
  rdFis: number;
  rdEso: number;
  /** quanto da RD acima vem da Máscara do Predador (0 = nada) */
  rdMascara: number;
  grauNome: string;
  /** `mascara`: o que a máscara somou neste ataque/técnica ("+2d10", "+4d6, CD +4"); ausente = nada */
  ataques: { nome: string; acerto: number; dano: string; media: number; tipo: string; custo: number; crit: number; mascara?: string }[];
  tecnicas: { nome: string; dados: string; cd: number; custo: number; texto: string; mascara?: string }[];
  percepcao: number;
  percepcaoEsp: number;
}

const mediaExpr = (e: string) => {
  let t = 0;
  for (const m of e.matchAll(/(\d+)d(\d+)/gi)) t += (Number(m[1]) * (Number(m[2]) + 1)) / 2;
  for (const m of e.matchAll(/\+\s*(\d+)(?!d|\d)/g)) t += Number(m[1]);
  return t;
};

/** Aplica a forma liberada: atributos, ataques e técnicas. O bônus de CR entra em calcularAmeaca. */
export function comLiberacao(a: Ameaca): Ameaca {
  const l = a.liberacao;
  const atr = { ...a.atr };
  const mod = formaNpc(a);
  ATRS.forEach((x) => { atr[x.id] = a.atr[x.id] + l.bonusAtr[x.id] + (mod?.soma.atr[x.id] ?? 0); });
  return { ...a, atr, ataques: l.trocar ? l.ataques : [...a.ataques, ...l.ataques], tecnicas: l.trocar ? l.tecnicas : [...a.tecnicas, ...l.tecnicas] };
}

/** Aplica a etapa anterior: atributos do modelo (Shikai). A máscara mexe nos números depois, em calcularAmeaca. */
export function comEtapaAnterior(a: Ameaca): Ameaca {
  const mod = formaDaEtapaAnterior(a);
  if (!mod) return a;
  const atr = { ...a.atr };
  ATRS.forEach((x) => { atr[x.id] = a.atr[x.id] + (mod.soma.atr[x.id] ?? 0); });
  return { ...a, atr };
}

/** Dano em área e cura de quando a forma é liberada (valores do NPC já liberado). */
export function efeitosDaLiberacao(a: Ameaca): { dano: number; tipo: string; curaPv: number } {
  const l = a.liberacao;
  const lib = comLiberacao(a);
  const pvMax = calcularAmeaca(a, true).pv;
  return { dano: l.explosao.mult * lib.atr[l.explosao.atr], tipo: l.explosao.tipo, curaPv: Math.floor((pvMax * l.cura) / 100) };
}

/** `etapa` aceita true/false (forma principal), a etapa ("base", "antes", "liberado") ou o estado { forma, mascara }. */
export function calcularAmeaca(original: Ameaca, etapa: boolean | EtapaNpc | EstadoNpc = false): AmeacaCalculada {
  const s = estadoValido(original, etapa);
  const l = original.liberacao;
  let r: AmeacaCalculada;
  if (s.forma === "bankai") {
    // a Bankai substitui a Shikai: só as peças e o CR da forma principal
    const b = calcularBase(comLiberacao(original));
    const sm = formaNpc(original)?.soma;
    r = { ...b, cr: b.cr + l.bonusCr + (sm?.cr ?? 0), rdFis: sm?.rdFis ?? 0, rdEso: sm?.rdEso ?? 0 };
  } else if (s.forma === "shikai") {
    const b = calcularBase(comEtapaAnterior(original));
    const sm = formaDaEtapaAnterior(original)?.soma;
    r = { ...b, cr: b.cr + (l.antes?.bonusCr ?? 0) + (sm?.cr ?? 0), rdFis: sm?.rdFis ?? 0, rdEso: sm?.rdEso ?? 0 };
  } else r = calcularBase(original);
  return s.mascara && l.mascara ? comMascara(r, l.mascara) : r;
}

/** Máscara por cima de qualquer forma: dados nos golpes e nas técnicas, CD, CR extra e PV/PR temporários. */
function comMascara(r: AmeacaCalculada, m: MascaraNpc): AmeacaCalculada {
  const ef = efeitoMascaraNpc(m.mascara, r.prof, r.nd);
  const ataques = r.ataques.map((x) => {
    const dano = somarDados(x.dano, ef.dadosGolpe);
    const extra = rotuloDados(x.dano, ef.dadosGolpe);
    return { ...x, dano, media: mediaExpr(dano), ...(extra ? { mascara: extra } : {}) };
  });
  const tecnicas = r.tecnicas.map((x) => {
    const extra = [rotuloDados(x.dados, ef.dadosTecnica), ef.cd ? `CD +${ef.cd}` : ""].filter(Boolean).join(", ");
    return { ...x, dados: somarDados(x.dados, ef.dadosTecnica), cd: x.cd + ef.cd, ...(extra ? { mascara: extra } : {}) };
  });
  // PV e PR temporários da máscara: entram como aumento do máximo enquanto ela está ativa
  return { ...r, cr: r.cr + m.bonusCr, ataques, tecnicas, rdFis: r.rdFis + ef.rd, rdEso: r.rdEso + ef.rd, rdMascara: ef.rd, pv: r.pv + Math.floor(r.pv * ef.temp.pv), pr: r.pr + Math.floor(r.pr * ef.temp.pr) };
}

function calcularBase(a: Ameaca): AmeacaCalculada {
  const nd = Math.min(20, Math.max(1, Math.round(a.nd)));
  const t = TABELA[a.categoria];
  const prof = proficienciaDoND(nd);
  const grau = GRAUS[a.categoria][a.grau] ?? GRAUS[a.categoria][0];
  const raid = a.formato === "raid";
  let pv = raid ? t.pv(nd) * 4 + a.atr.con * nd : t.pv(nd) + a.atr.con * nd;
  const pr = raid ? t.pr(nd) * 2 + a.atr.esp * nd : t.pr(nd) + a.atr.esp * nd;
  const cr = CR_BASE[a.categoria][a.dificuldade] + nd + Math.floor(Math.max(a.atr.con, a.atr.des) / 2) + grau.cr;
  // modos de duelo só valem para ameaças Solo
  let k = 1;
  let fs = 1;
  const modo = raid ? "comum" : a.modo;
  if (modo !== "comum") {
    k = FATOR_K[nd - 1];
    pv = Math.floor(pv * k);
    if (modo === "suporte") {
      fs = fatorSuporte(nd);
      pv = Math.floor(pv * (nd === 2 ? 1.1 : fs));
      if (nd === 2) fs = 1;
    }
    if (modo === "boss") pv = Math.floor(pv * Math.max(1, a.jogadores) * (nd >= 11 ? 2.3 : 1.8));
  }
  if (a.pvExtra) pv = Math.floor(pv * (1 + a.pvExtra / 100));
  // "NDd8" e "2NDd10" valem ND (ou 2 × ND) dados
  const comND = (e: string) => e.replace(/(\d*)ND(?=d\d)/gi, (_, m: string) => String((m ? Number(m) : 1) * nd));
  const esc = (e: string) => escalarDados(escalarDados(comND(e), k), fs === 1 ? 1 : fs);
  const ataques = a.ataques.map((x) => {
    const dano = `${esc(x.dados)} + ${a.atr[x.atr]}`;
    return { nome: x.nome, acerto: prof + a.atr[x.atr], dano, media: mediaExpr(dano), tipo: x.tipo, custo: x.custo ?? 0, crit: x.crit ?? 20 };
  });
  const tecnicas = a.tecnicas.map((x) => ({ nome: x.nome, dados: esc(x.dados), cd: 8 + prof + a.atr[x.atr], custo: x.custo, texto: x.texto }));
  return {
    nd, prof, pontos: pontosDeAtributo({ ...a, nd }), usados: ATRS.reduce((s, x) => s + a.atr[x.id], 0), pv, pr, cr, k,
    hierro: a.categoria === "hollow" && modo !== "comum",
    rdFis: 0, rdEso: 0, rdMascara: 0,
    grauNome: grau.nome, ataques, tecnicas,
    percepcao: 10 + a.atr.men + prof, percepcaoEsp: 10 + a.atr.esp + prof,
  };
}

const num = (v: unknown, p: number, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : p);
const txt = (v: unknown, p = "") => (typeof v === "string" ? v : p);
const em = <T extends string>(v: unknown, l: readonly T[], p: T): T => (l.includes(v as T) ? (v as T) : p);

/** Aceita qualquer coisa vinda do banco e devolve uma ameaça válida. */
function normalizarLiberacao(raw: unknown, categoria: Categoria): LiberacaoAmeaca {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<LiberacaoAmeaca>;
  const v = liberacaoVazia(categoria);
  const bonusAtr = { ...v.bonusAtr };
  ATRS.forEach((x) => { bonusAtr[x.id] = num(o.bonusAtr?.[x.id], 0, -10, 20); });
  return {
    existe: o.existe === true,
    nome: txt(o.nome, v.nome).slice(0, 60) || v.nome,
    bonusCr: num(o.bonusCr, 0, -5, 10),
    bonusAtr,
    cura: num(o.cura, 0, 0, 100),
    explosao: { mult: num(o.explosao?.mult, 0, 0, 30), atr: em(o.explosao?.atr, ["for", "des", "con", "men", "esp"] as const, "esp"), tipo: txt(o.explosao?.tipo, "Psíquico").slice(0, 30) },
    trocar: o.trocar === true,
    ataques: Array.isArray(o.ataques) ? o.ataques.slice(0, 8).map((x) => ({ nome: txt(x?.nome, "Ataque"), atr: em(x?.atr, ["for", "des", "con", "men", "esp"] as const, "for"), dados: txt(x?.dados, "1d8"), tipo: txt(x?.tipo), custo: num(x?.custo, 0, 0, 999), crit: num(x?.crit, 20, 15, 20) })) : [],
    tecnicas: Array.isArray(o.tecnicas) ? o.tecnicas.slice(0, 10).map((x) => ({ nome: txt(x?.nome, "Técnica"), dados: txt(x?.dados, "2d6"), custo: num(x?.custo, 0, 0, 999), atr: em(x?.atr, ["for", "des", "con", "men", "esp"] as const, "esp"), texto: txt(x?.texto) })) : [],
    texto: txt(o.texto),
    ...(refValida(o.modelo) ? { modelo: { tipo: o.modelo!.tipo, id: o.modelo!.id } } : {}),
    ...(categoria === "shinigami" ? normalizarEtapas(o.antes, (o as { mascara?: unknown }).mascara) : {}),
  };
}

const refValida = (r: unknown): r is RefModeloNpc => {
  const x = r as Partial<RefModeloNpc> | null | undefined;
  return !!x && typeof x === "object" && TIPOS_MODELO_NPC.includes(x.tipo as RefModeloNpc["tipo"]) && typeof x.id === "string" && x.id.length > 0 && x.id.length <= 60;
};

/** Máscara vinda do banco ({ mascara, nome, bonusCr }); inválida = nenhuma. */
function normalizarMascara(raw: unknown): MascaraNpc | undefined {
  const o = (raw && typeof raw === "object" ? raw : null) as { mascara?: unknown; nome?: unknown; bonusCr?: unknown } | null;
  if (!o || !MASCARAS.some((x) => x.id === o.mascara)) return undefined;
  const m = o.mascara as TipoMascara;
  const nome = MASCARAS.find((x) => x.id === m)?.nome ?? "Máscara Hollow";
  return { mascara: m, nome: txt(o.nome, nome).slice(0, 60) || nome, bonusCr: num(o.bonusCr, 0, -5, 10) };
}

/** Shikai (etapa anterior) e máscara vindas do banco; inválidas ou ausentes = sem elas.
 *  NPCs antigos guardavam a máscara em `antes` ({ tipo: "mascara" }): ela passa para `mascara` sem perder nome nem CR extra. */
function normalizarEtapas(rawAntes: unknown, rawMascara: unknown): { antes?: EtapaAnterior; mascara?: MascaraNpc } {
  const o = (rawAntes && typeof rawAntes === "object" ? rawAntes : null) as { tipo?: unknown; nome?: unknown; modelo?: unknown; mascara?: unknown; bonusCr?: unknown } | null;
  const r: { antes?: EtapaAnterior; mascara?: MascaraNpc } = {};
  if (o && o.tipo === "modelo" && refValida(o.modelo)) r.antes = { tipo: "modelo", nome: txt(o.nome, "Shikai").slice(0, 60) || "Shikai", modelo: { tipo: o.modelo.tipo, id: o.modelo.id }, bonusCr: num(o.bonusCr, 0, -5, 10) };
  const mascara = normalizarMascara(rawMascara) ?? (o && o.tipo === "mascara" ? normalizarMascara(o) : undefined);
  if (mascara) r.mascara = mascara;
  return r;
}

export function normalizarAmeaca(raw: unknown): Ameaca {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<Ameaca>;
  const categoria = em(o.categoria, ["hollow", "shinigami", "quincy"] as const, "shinigami");
  const base = ameacaPadrao(categoria, num(o.nd, 1, 1, 20));
  const atr = { ...base.atr };
  ATRS.forEach((x) => { atr[x.id] = num(o.atr?.[x.id], base.atr[x.id], 0, 40); });
  return {
    categoria,
    formato: em(o.formato, ["solo", "raid"] as const, "solo"),
    nd: base.nd,
    grau: num(o.grau, 0, 0, GRAUS[categoria].length - 1),
    dificuldade: em(o.dificuldade, ["facil", "medio", "dificil"] as const, "medio"),
    atr,
    modo: em(o.modo, ["comum", "pareado", "suporte", "boss"] as const, "comum"),
    jogadores: num(o.jogadores, 4, 1, 8),
    pvExtra: num(o.pvExtra, 0, -50, 100),
    ataques: Array.isArray(o.ataques) ? o.ataques.slice(0, 8).map((x) => ({ nome: txt(x?.nome, "Ataque"), atr: em(x?.atr, ["for", "des", "con", "men", "esp"] as const, "for"), dados: txt(x?.dados, "1d8"), tipo: txt(x?.tipo), custo: num(x?.custo, 0, 0, 999), crit: num(x?.crit, 20, 15, 20) })) : base.ataques,
    tecnicas: Array.isArray(o.tecnicas) ? o.tecnicas.slice(0, 10).map((x) => ({ nome: txt(x?.nome, "Técnica"), dados: txt(x?.dados, "2d6"), custo: num(x?.custo, 0, 0, 999), atr: em(x?.atr, ["for", "des", "con", "men", "esp"] as const, "esp"), texto: txt(x?.texto) })) : [],
    caracteristicas: txt(o.caracteristicas),
    titulo: txt(o.titulo).slice(0, 80),
    zanpakutou: { nome: txt(o.zanpakutou?.nome).slice(0, 60), shikai: txt(o.zanpakutou?.shikai), bankai: txt(o.zanpakutou?.bankai) },
    liberacao: normalizarLiberacao(o.liberacao, categoria),
    habilidades: Array.isArray(o.habilidades) ? o.habilidades.slice(0, 16).map((x) => ({ titulo: txt(x?.titulo, "Habilidade"), texto: txt(x?.texto) })) : [],
  };
}
