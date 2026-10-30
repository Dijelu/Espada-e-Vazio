/* Catálogos tirados do livro: talentos, Kidō, técnicas de Reishi, armas, treinamentos e equipamentos. */
import talentosJson from "./talentos.json";
import progressaoJson from "./progressao.json";
import kidosJson from "./kidos.json";
import tecnicasJson from "./tecnicas-reishi.json";
import armasJson from "./armas.json";
import { NIVEIS_ESSENCIA, type Ficha, type TipoClasse } from "./ficha";

/* ---------- talentos ---------- */

export interface Talento {
  id: string;
  nome: string;
  texto: string;
  nivel: number;
  req: string;
  grupo: string;
  pre: string[];
}

export const TALENTOS = talentosJson as unknown as Record<string, Talento[]>;

export const talentosDe = (classeId: string) => TALENTOS[classeId] ?? [];

/** Um talento por nível a partir do 2º, menos nos níveis de Aprimoramento da Essência. */
export function slotsTalento(nivel: number) {
  let n = 0;
  for (let l = 2; l <= nivel; l++) if (!NIVEIS_ESSENCIA.includes(l)) n++;
  return n;
}

/** Se o talento pode ser escolhido agora, e por que não. */
export function talentoLiberado(t: Talento, f: Ficha): string {
  if (f.nivel < t.nivel) return `exige o ${t.nivel}º nível`;
  const falta = t.pre.filter((p) => !f.talentos.includes(p));
  if (falta.length) return "exige outro talento: " + t.req;
  return "";
}

/* ---------- progressão por nível ---------- */

interface LinhaProg {
  kido?: number;
  rank?: string;
  tecnicas?: number;
  nivelTec?: number;
  caract: string;
}

const PROG = progressaoJson as unknown as Record<string, Record<string, LinhaProg>>;

/** Última linha da tabela de classe que vale para o nível (as tabelas dos Hollows só citam níveis com novidade). */
export function linhaProg(classeId: string, nivel: number): LinhaProg | undefined {
  const t = PROG[classeId];
  if (!t) return undefined;
  for (let n = nivel; n >= 1; n--) if (t[String(n)]) return t[String(n)];
  return undefined;
}

export const caracteristicasDoNivel = (classeId: string, nivel: number) => PROG[classeId]?.[String(nivel)]?.caract ?? "";

export const RANKS = ["D", "C", "B", "A", "S", "SS"];
const rankIdx = (r: string) => RANKS.indexOf(r.toUpperCase());

export interface Kido {
  tipo: "hadou" | "bakudou";
  n: number;
  nome: string;
  rank: string;
  texto?: string;
  meta?: string;
}
export const KIDOS = kidosJson as unknown as Kido[];

export const rankPermitido = (classeId: string, nivel: number) => linhaProg(classeId, nivel)?.rank;
export const kidosConhecidos = (classeId: string, nivel: number) => linhaProg(classeId, nivel)?.kido ?? 0;

export const kidoLiberado = (k: Kido, classeId: string, nivel: number) => {
  const r = rankPermitido(classeId, nivel);
  return r ? rankIdx(k.rank) <= rankIdx(r) : false;
};

export interface TecnicaReishi {
  nome: string;
  nivel: number;
  texto?: string;
}
export const TECNICAS_REISHI = tecnicasJson as unknown as TecnicaReishi[];
export const tecnicasConhecidas = (classeId: string, nivel: number) => linhaProg(classeId, nivel)?.tecnicas ?? 0;
export const nivelTecnicaMax = (classeId: string, nivel: number) => linhaProg(classeId, nivel)?.nivelTec ?? 0;

/* ---------- equipamento ---------- */

export interface Arma {
  nome: string;
  dano: string;
  tipo: string;
  crit: number;
  mult: number;
  props: string;
  alcance: string;
  atr: string;
  peso: number;
}
const A = armasJson as unknown as Record<"leves" | "pesadas" | "medievais" | "modernas", Arma[]>;
export const ARMAS = {
  corpo: [...A.leves.map((a) => ({ ...a, grupo: "Corpo a corpo leves" })), ...A.pesadas.map((a) => ({ ...a, grupo: "Corpo a corpo pesadas" }))],
  distancia: [...A.medievais.map((a) => ({ ...a, grupo: "À distância medievais" })), ...A.modernas.map((a) => ({ ...a, grupo: "À distância modernas" }))],
};
export type ArmaComGrupo = Arma & { grupo: string };

export const ASAUCHI = [
  { nome: "Tanto", dano: "1d4", atr: "Destreza", crit: 17, peso: 1 },
  { nome: "Wakizashi", dano: "1d6", atr: "Destreza", crit: 18, peso: 1 },
  { nome: "Katana", dano: "1d8", atr: "Destreza ou Força", crit: 19, peso: 1 },
  { nome: "Tachi", dano: "1d10", atr: "Destreza ou Força", crit: 20, peso: 1 },
  { nome: "Uchigatana", dano: "1d12", atr: "Força", crit: 19, peso: 2 },
  { nome: "Nodachi", dano: "2d6", atr: "Força", crit: 20, peso: 3 },
];

export const ARTEFATOS = [
  { nome: "Quincy Cross", texto: "Foco que materializa uma arma vinculada: ação bônus e 5 PR, com um dado de dano a mais." },
  { nome: "Luva Sanrei", texto: "Uma vez por turno, vantagem no dano de técnica ou ataque; acumula Reishi extra igual à metade do nível." },
  { nome: "Seele Schneider", texto: "Cabo que cria uma lâmina de Reishi que drena o reiatsu do alvo." },
  { nome: "Medallion", texto: "Insígnia do Wandenreich que rouba uma Bankai liberada (aprovação do Mestre)." },
];

export const FORCAS = ["Gotei 13", "Kidō Corps", "Onmitsukidō", "Exilado"];

export const ITENS_SHINIGAMI = [
  "Celular Shinigami (Denreishinki)",
  "Jigokuchō",
  "Gigai Portátil",
  "Kikanshinki",
];

/** Essências que a Origem entrega de graça (não contam como a essência inicial). */
export function essenciasDaOrigem(f: Ficha): { nome: string; nota: string }[] {
  const out: { nome: string; nota: string }[] = [];
  if (f.origem === "humano" && f.variacao === "substituto") out.push({ nome: "Restrição de Kido", nota: "Shinigami Substituto" });
  if (f.origem === "lobisomem" && f.variacao === "aureo") out.push({ nome: "Velocista", nota: "Lobisomem Áureo" });
  if (f.origem === "visored") out.push({ nome: "Essência proibida (escolha)", nota: "Visored: Quebra do Equilíbrio" });
  return out;
}

/** Essência sugerida pelo livro na Construção Rápida de cada classe. */
export const ESSENCIA_SUGERIDA: Record<string, string> = {
  zanjutsu: "Vitalidade Espiritual",
  tokubetsu: "Grão Mestre",
  hakuda: "Mestre do Punho",
  kidoshu: "Ecos de Reiatsu",
  kyugo: "Classe de Resistência Aprimorada",
  schutze: "Mira Apurada",
  ritter: "Ruptura de Reishi",
  hueco: "Garras Afiadas",
  vazio: "Reiatsu Condensado",
};

/** Essências de Hollow criadas para Hueco e Vazio (capítulo 4). */
export const ESSENCIAS_HOLLOW = [
  "Garras Afiadas",
  "Instinto Predador",
  "Reiatsu Condensado",
  "Hierro Reforçado",
  "Fome Insaciável",
  "Regeneração Hollow",
  "Cheiro de Sangue",
  "Rugido Hollow",
  "Carne Adaptável",
];

export const equipamentoPadrao = (): Ficha["equip"] => ({ forca: "", divisao: 0, asauchi: "", armas: [], artefato: "", naturalForma: "", extras: "" });

/* ---------- treinamentos ---------- */

export interface Etapa {
  id: string;
  nome: string;
  texto: string;
  /** dias de treino, quando o livro dá a conta */
  dias?: (c: { con: number; esp: number }) => number;
  teste?: string;
  nivelMin?: number;
}

export interface Treino {
  id: string;
  nome: string;
  resumo: string;
  capitulo: string;
  etapas: Etapa[];
  aplica: (f: Ficha, tipo: TipoClasse | undefined) => boolean;
}

const dias = (base: number, min: number, atr: "con" | "esp") => (c: { con: number; esp: number }) => Math.max(min, base - Math.max(0, c[atr]));

export const TREINOS: Treino[] = [
  {
    id: "geral",
    nome: "Treinamento Geral",
    resumo: "Qualquer personagem pode treinar uma essência repetitiva que já tenha: 15 dias de treino sobem uma etapa. Se ela já está no máximo, são 30 dias para escolhê-la de novo.",
    capitulo: "Treinamento Geral",
    etapas: [],
    aplica: () => true,
  },
  {
    id: "shikai",
    nome: "Shikai",
    resumo: "O primeiro contato com o espírito da Zanpakutou: o Shinigami descobre parte do nome dela e escolhe a frase de liberação.",
    capitulo: "Shikai",
    etapas: [
      { id: "shikai-contato", nome: "Contato com o espírito", texto: "Fique imóvel por 5 minutos, de olhos fechados, e entre no mundo interior." },
      { id: "shikai-teste", nome: "Teste de determinação", texto: "O espírito faz perguntas profundas; o Mestre julga as respostas ou pede Determinação (CD 10).", teste: "Determinação CD 10 (a critério do Mestre)" },
      { id: "shikai-nome", nome: "Nome e frase de liberação", texto: "A Zanpakutou revela parte do nome e você escolhe a frase de liberação." },
    ],
    aplica: (_f, t) => t === "shinigami",
  },
  {
    id: "bankai",
    nome: "Bankai",
    resumo: "A forma final da Zanpakutou: três passos de treino. Quem é Quincy ou Hollow não faz este treinamento.",
    capitulo: "Bankai",
    etapas: [
      { id: "bankai-1", nome: "1º passo: Intensificação Física", texto: "20 dias, menos sua Constituição (mínimo 5), e depois um teste de Constituição.", dias: dias(20, 5, "con"), teste: "d20 + Constituição, CD 12" },
      { id: "bankai-2", nome: "2º passo: Preparação Espiritual", texto: "20 dias, menos seu Espírito (mínimo 5), dentro do mundo interior. No fim, dois testes somados.", dias: dias(20, 5, "esp"), teste: "d20 + Constituição e d20 + Espírito, soma 25 ou mais" },
      { id: "bankai-3", nome: "3º passo: Materialização", texto: "Role d100: se o resultado for menor ou igual a nível + Espírito + Constituição, a Bankai se materializa. Pode tentar de novo a cada 30 dias.", teste: "d100 ≤ nível + Espírito + Constituição", nivelMin: 10 },
    ],
    aplica: (_f, t) => t === "shinigami",
  },
  {
    id: "bankai-final",
    nome: "Bankai Verdadeira (20º nível)",
    resumo: "A forma final da Bankai. Só começa com a Bankai concluída e só termina no 20º nível. Ao concluir, escolha entre a Bankai Plena (mais poder) e a Bankai Verdadeira (nova forma).",
    capitulo: "Bankai",
    etapas: [
      { id: "bf-1", nome: "Passo 1: Meditação Profunda", texto: "10 dias no mundo interior, menos seu Espírito (mínimo 5). No fim, teste de Espírito.", dias: dias(10, 5, "esp"), teste: "d20 + Espírito, CD 15", nivelMin: 20 },
      { id: "bf-2", nome: "Passo 2: Duelo com o Espírito", texto: "O espírito da Zanpakutou o enfrenta em uma cena de combate ou diálogo. Vencer é ser reconhecido por ele.", nivelMin: 20 },
      { id: "bf-3", nome: "Passo 3: Despertar", texto: "Role d100: se o resultado for menor ou igual a Espírito + Constituição + 20, a forma final desperta. Pode tentar de novo a cada 15 dias.", teste: "d100 ≤ Espírito + Constituição + 20", nivelMin: 20 },
    ],
    aplica: (f, t) => t === "shinigami" && f.nivel >= 15,
  },
  {
    id: "visored",
    nome: "Controlar o Hollow (Visored)",
    resumo: "Treino perigoso para dominar o Hollow interior e usar a Máscara Hollow, e depois o Cero.",
    capitulo: "Controlando o Hollow",
    etapas: [
      { id: "visored-1", nome: "Controlando o Hollow", texto: "10 dias, menos seu Espírito (mínimo 3). No fim, teste de resistência de Espírito.", dias: dias(10, 3, "esp"), teste: "Espírito CD 30" },
      { id: "visored-2", nome: "Máscara Hollow", texto: "Escolha a máscara: Conquistador, Predador ou Equilíbrio. Ativar custa 5 × proficiência em reiatsu." },
      { id: "visored-3", nome: "Cero", texto: "Mantenha a máscara por 1 minuto (10 turnos) para aprender o Cero." },
    ],
    aplica: (f) => f.origem === "visored",
  },
  {
    id: "humanizacao",
    nome: "Humanização (Lobisomem)",
    resumo: "Técnica secreta do clã: ataques causam dano máximo por um dia, mas exige um ritual e um ancião.",
    capitulo: "Humanização",
    etapas: [{ id: "human-1", nome: "Ritual com o ancião do clã", texto: "Só quem pertence ao clã pode aprender. Leia as regras de risco no livro antes de usar." }],
    aplica: (f) => f.origem === "lobisomem",
  },
  {
    id: "resurreccion",
    nome: "Resurrección (Trilha da Fome)",
    resumo: "A forma verdadeira do Hueco e do Vazio. Só vale depois de concluir o treino: jejum, Pontos de Fome e o duelo contra o vazio.",
    capitulo: "Treinamento da Resurrección",
    etapas: [
      { id: "res-jejum", nome: "Etapa 1: Jejum da Fome", texto: "3 dias sem devorar nada. Falhar só obriga a repetir. Pode começar no 9º nível.", teste: "Constituição CD 12" },
      { id: "res-pf", nome: "Etapa 2: Pontos de Fome", texto: "Ganhe 5 PF derrotando e devorando criaturas (máx. 2 por cena). PF extras dão até +3 de acerto no duelo." },
      { id: "res-duelo", nome: "Etapa 3: Duelo contra o Vazio", texto: "Duelo 1v1 contra uma cópia sua, sem Resurrección. Só a partir do 10º nível, com 5 PF ou mais.", nivelMin: 10 },
    ],
    aplica: (_f, t) => t === "hollow",
  },
  {
    id: "terror",
    nome: "Segunda Etapa (Vasto Lorde)",
    resumo: "A segunda etapa do Hollow, depois da Resurrección: fome profunda, 8 Pontos de Fome e um duelo contra uma cópia sua com a Resurrección ativa. Só vale a partir do 15º nível.",
    capitulo: "Treinamento da Segunda Etapa",
    etapas: [
      { id: "ter-jejum", nome: "Etapa 1: Fome Profunda", texto: "7 dias sem devorar nada. Falhar só obriga a repetir.", teste: "Constituição CD 15", nivelMin: 15 },
      { id: "ter-pf", nome: "Etapa 2: 8 Pontos de Fome", texto: "Os PF da Trilha da Fome continuam valendo: chegue a 8 PF no total. Cada PF acima de 8 dá +1 de acerto no duelo, até +2.", nivelMin: 15 },
      { id: "ter-duelo", nome: "Etapa 3: Duelo da Segunda Etapa", texto: "Duelo 1v1 contra uma cópia sua, com a Resurrección ativa. Falhar só obriga a repetir após 1 dia.", nivelMin: 15 },
    ],
    aplica: (f, t) => t === "hollow" && (f.classe === "hueco" || f.classe === "vazio") && f.nivel >= 12,
  },
];

export const treinosDaFicha = (f: Ficha, tipo: TipoClasse | undefined) => TREINOS.filter((t) => t.aplica(f, tipo));

/** Treinamento de liberação concluído? (Shikai, Bankai, Resurrección). */
export const treinoConcluido = (f: Ficha, treinoId: string) => {
  const t = TREINOS.find((x) => x.id === treinoId);
  if (!t) return false;
  return t.etapas.length > 0 && t.etapas.every((e) => f.treinos.feitos.includes(e.id));
};

import condicoesJson from "./condicoes.json";

export const CONDICAO_TEXTO = condicoesJson as unknown as Record<string, string[]>;
export const CONDICOES = Object.keys(CONDICAO_TEXTO);

/* ---------- equipamento inicial ---------- */

const atrDaArma = (s: string): "for" | "des" => (s.startsWith("Destreza") ? "des" : "for");

/** Itens que já vêm com a origem e a classe, sem custo. */
export function itensDaOrigem(f: Ficha, tipo: TipoClasse | undefined): string[] {
  if (tipo === "shinigami") {
    const semItens = !f.equip.forca || f.equip.forca === "Exilado" || (f.origem === "humano" && f.variacao === "substituto");
    return semItens ? [] : ITENS_SHINIGAMI;
  }
  if (tipo === "quincy") return ["5 Gintou (guardam 5 × nível em PR cada um)"];
  if (tipo === "hollow") return ["Arma natural (1d10) e Cero, da classe"];
  return [];
}

/** Ataques prontos a partir do que foi escolhido no equipamento. */
export function ataquesIniciais(f: Ficha, tipo: TipoClasse | undefined): Ficha["ataques"] {
  const out: Ficha["ataques"] = [];
  const mk = (nome: string, atr: "for" | "des", dano: string) => out.push({ id: `ini-${out.length}-${nome}`, nome, atr, dano });
  if (tipo === "shinigami" && f.equip.asauchi) {
    const a = ASAUCHI.find((x) => x.nome === f.equip.asauchi);
    if (a) mk(`Asauchi (${a.nome})`, atrDaArma(a.atr), a.dano);
  }
  if (tipo === "quincy") {
    for (const nome of f.equip.armas) {
      const a = [...ARMAS.corpo, ...ARMAS.distancia].find((x) => x.nome === nome);
      if (a) mk(a.nome, atrDaArma(a.atr), a.dano);
    }
  }
  if (tipo === "hollow") mk("Arma natural", "for", "1d10");
  for (const a of out) if (ARMAS.distancia.some((x) => a.nome === x.nome)) a.distancia = true;
  return out;
}

/** Texto corrido do equipamento, para a aba Notas. */
export function resumoEquip(f: Ficha, tipo: TipoClasse | undefined): string {
  const l: string[] = [];
  if (tipo === "shinigami") {
    if (f.equip.forca) l.push(`Força militar: ${f.equip.forca}${f.equip.forca === "Gotei 13" && f.equip.divisao ? `, ${f.equip.divisao}ª Divisão` : ""}`);
    if (f.equip.asauchi) l.push(`Asauchi: ${f.equip.asauchi}`);
  }
  if (tipo === "quincy") {
    if (f.equip.armas.length) l.push(`Armas: ${f.equip.armas.join(", ")}`);
    if (f.equip.artefato) l.push(`Artefato: ${f.equip.artefato}`);
  }
  if (tipo === "hollow" && f.equip.naturalForma) l.push(`Arma natural: ${f.equip.naturalForma}`);
  const itens = itensDaOrigem(f, tipo);
  if (itens.length) l.push(`Itens: ${itens.join(", ")}`);
  if (f.equip.extras.trim()) l.push(f.equip.extras.trim());
  return l.join("\n");
}
