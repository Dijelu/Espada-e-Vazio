import { somaSituacoes } from "./situacionais";
import { ataquesHueco, danoFixoHueco } from "./hueco";
import { bonusEscudo, type Melhoria } from "./melhorias";
import { atributosPassivos, passivasDaFicha, type PassivaAtiva, type EfeitoSoma } from "./passivas";
/* Regras de criação e cálculo da ficha (Espada & vazio). Tudo o que está aqui vem dos capítulos 1, 2, 3, 4 e 8 do livro. */

export type Atr = "for" | "des" | "con" | "men" | "esp";

export const ATRIBUTOS: { id: Atr; nome: string; sigla: string }[] = [
  { id: "for", nome: "Força", sigla: "FOR" },
  { id: "des", nome: "Destreza", sigla: "DES" },
  { id: "con", nome: "Constituição", sigla: "CON" },
  { id: "men", nome: "Mente", sigla: "MEN" },
  { id: "esp", nome: "Espírito", sigla: "ESP" },
];

export const nomeAtr = (a: Atr) => ATRIBUTOS.find((x) => x.id === a)!.nome;

export interface Pericia {
  id: string;
  nome: string;
  atr: Atr;
}

export const PERICIAS: Pericia[] = [
  { id: "preparo-fisico", nome: "Preparo Físico", atr: "for" },
  { id: "velocidade", nome: "Velocidade", atr: "for" },
  { id: "acrobacia", nome: "Acrobacia", atr: "des" },
  { id: "furtividade", nome: "Furtividade", atr: "des" },
  { id: "durabilidade", nome: "Durabilidade", atr: "con" },
  { id: "vigor", nome: "Vigor", atr: "con" },
  { id: "percepcao", nome: "Percepção", atr: "men" },
  { id: "investigacao", nome: "Investigação", atr: "men" },
  { id: "conhecimento", nome: "Conhecimento", atr: "men" },
  { id: "influencia", nome: "Influência", atr: "men" },
  { id: "medicina", nome: "Medicina", atr: "men" },
  { id: "exploracao", nome: "Exploração", atr: "men" },
  { id: "reiatsu", nome: "Reiatsu", atr: "esp" },
  { id: "suprimir-reiatsu", nome: "Suprimir Reiatsu", atr: "esp" },
  { id: "percepcao-espiritual", nome: "Percepção Espiritual", atr: "esp" },
  { id: "determinacao", nome: "Determinação", atr: "esp" },
  { id: "presenca", nome: "Presença", atr: "esp" },
];

/* ---------- progressão ---------- */

export const XP_NIVEL = [0, 10, 25, 45, 70, 100, 135, 175, 220, 270, 325, 385, 450, 520, 595, 675, 760, 850, 945, 1045];
export const NIVEIS_PONTO_ATRIBUTO = [3, 5, 7, 9, 11, 13, 15, 17, 19];
export const NIVEIS_ESSENCIA = [4, 8, 12, 16, 19];
export const NIVEIS_SUBCLASSE = [3, 6, 10, 15, 20];

export const proficiencia = (n: number) => 2 + Math.floor((n - 1) / 4);

export function nivelPorXp(xp: number) {
  let n = 1;
  XP_NIVEL.forEach((m, i) => {
    if (xp >= m) n = i + 1;
  });
  return n;
}

export function pontosAtributoDeNivel(n: number) {
  return NIVEIS_PONTO_ATRIBUTO.filter((x) => x <= n).length;
}

/** Pontos de Essência acumulados: 1 na criação e 2 em cada Aprimoramento da Essência. */
export function pontosEssencia(n: number) {
  return 1 + 2 * NIVEIS_ESSENCIA.filter((x) => x <= n).length;
}

/** Regra opcional "Por favor um doze": resultado do d12 → pontos e máximo por atributo. */
export const TABELA_D12: { pontos: number; max: number }[] = [
  { pontos: 7, max: 2 },
  { pontos: 8, max: 3 },
  { pontos: 9, max: 3 },
  { pontos: 10, max: 3 },
  { pontos: 11, max: 4 },
  { pontos: 12, max: 4 },
  { pontos: 13, max: 4 },
  { pontos: 14, max: 5 },
  { pontos: 15, max: 5 },
  { pontos: 16, max: 5 },
  { pontos: 17, max: 6 },
  { pontos: 18, max: 7 },
];

/* ---------- origens ---------- */

export interface Efeito {
  atr?: Partial<Record<Atr, number>>;
  pvIni?: number;
  prIni?: number;
  pvNivel?: number;
  prNivel?: number;
  cr?: number;
  rdFis?: number;
  rdEso?: number;
  desloc?: number;
  pericias?: string[];
  /** pontos de atributo a distribuir livremente */
  livre?: number;
  /** dano extra em ataques corpo a corpo */
  danoCorpo?: number;
  /** Evasão Aprimorada: soma metade da proficiência (arredondada para baixo) à CR */
  evasao?: boolean;
  /** Raciocínio Rápido: iniciativa pode usar Mente no lugar de Destreza */
  iniMente?: boolean;
}

export interface Variacao {
  id: string;
  nome: string;
  texto: string;
  efeito?: Efeito;
  /** a variação só funciona a partir deste nível */
  desdeNivel?: number;
}

export type TipoClasse = "shinigami" | "quincy" | "hollow";

export interface Origem {
  id: string;
  nome: string;
  tipos: TipoClasse[];
  texto: string;
  base: (nivel: number) => Efeito;
  tracos: string[];
  variacoes: Variacao[];
  /** origem que não se escolhe na criação */
  soEvolucao?: boolean;
}

export const ORIGENS: Origem[] = [
  {
    id: "alma",
    nome: "Alma",
    tipos: ["shinigami"],
    texto: "Alma da Soul Society que ingressa na Academia Shinigami.",
    base: () => ({ desloc: 9 }),
    tracos: ["Recuperação Acelerada: o descanso longo dura apenas 4 horas.", "Vive até dois milênios; até 3 m de altura."],
    variacoes: [
      {
        id: "nobre",
        nome: "Nobre",
        texto: "Estudos Avançados (Mente +1, História), Nobreza (vantagem em assuntos de nobres), Reiatsu Superior (+5 PR iniciais e +2 por nível seguinte), Treinamento de Kido (dois Kidōs adicionais).",
        efeito: { atr: { men: 1 }, prIni: 5, prNivel: 2, pericias: ["conhecimento"] },
      },
      {
        id: "reencarnado",
        nome: "Reencarnado",
        texto: "Resistência Melhorada (+2 na CR), Corpo Aprimorado (Força e Destreza +1), Movimento Aprimorado (deslocamento 12 m), Sobrevivência (proficiência em Exploração).",
        efeito: { atr: { for: 1, des: 1 }, cr: 2, desloc: 12, pericias: ["exploracao"] },
      },
      {
        id: "espirito-vivo",
        nome: "Espírito Vivo",
        texto: "Zanpakutou projetada. Atributo Herdado (+1 em um atributo, o maior ou segundo maior do Shinigami de Origem), Herança Espiritual (Impacto de Reiatsu) e Vínculo com o Shinigami de Origem.",
        efeito: { livre: 1 },
      },
    ],
  },
  {
    id: "humano",
    nome: "Humano",
    tipos: ["shinigami", "quincy"],
    texto: "Humano que despertou a percepção espiritual.",
    base: () => ({ desloc: 9 }),
    tracos: ["Último Fôlego: uma vez por combate, ao cair a 0 PV, recupera PV e PR iguais a 5 × proficiência.", "Vive em média 90 anos; até 2 m de altura."],
    variacoes: [
      {
        id: "substituto",
        nome: "Shinigami Substituto (classe de Shinigami)",
        texto: "Sem treinamento da Academia: começa com a essência Restrição de Kido (não conta como inicial). Sensitivo: vantagem em Percepção. Característica de Shinigami Substituto no Capítulo 6.",
      },
      {
        id: "quincy-bastardo",
        nome: "Quincy Bastardo (classe de Quincy)",
        texto: "Potencial Oculto (Espírito +2), Aprendizado Independente (uma perícia temporária por descanso longo) e Despertar Espiritual (vantagem em Percepção Espiritual).",
        efeito: { atr: { esp: 2 } },
      },
    ],
  },
  {
    id: "lobisomem",
    nome: "Lobisomem",
    tipos: ["shinigami"],
    texto: "Lobo humanoide do Reino das Bestas.",
    base: () => ({ desloc: 9 }),
    tracos: ["Corpo Animalesco: com a reação, reduz à metade o dano de um ataque (exceto Psíquico ou Temporal).", "Vive até dois milênios; até 4 m de altura."],
    variacoes: [
      {
        id: "tita",
        nome: "Titã",
        texto: "Físico Animal (proficiência em Preparo Físico), Fortaleza (+5 PV iniciais e +2 PV por nível), Poder Bestial (Força +2 e vantagem em testes de resistência de Força).",
        efeito: { atr: { for: 2 }, pvIni: 5, pvNivel: 2, pericias: ["preparo-fisico"] },
      },
      {
        id: "aureo",
        nome: "Áureo",
        texto: "Agilidade Animal (Destreza +2), Deslocamento Aprimorado (essência Velocista, que não conta como inicial) e Evasão Aprimorada (CR +½ proficiência: +1 até o 8º nível, +2 até o 16º, +3 depois).",
        efeito: { atr: { des: 2 }, evasao: true },
      },
    ],
  },
  {
    id: "mod-soul",
    nome: "Mod Soul",
    tipos: ["shinigami"],
    texto: "Alma Modificada do Projeto Spearhead.",
    base: () => ({ desloc: 9, atr: { for: 1 } }),
    tracos: ["Físico Artificial: Força +1 e dano desarmado 1d6 (ou um passo acima).", "Doce de Alma: precisa de um Gigai para agir."],
    variacoes: [
      {
        id: "original",
        nome: "Original",
        texto: "Força +1 e Modo Massacre (uma ação de ataque antes da iniciativa, uma vez por dia). Deslocamento máximo +6 m.",
        efeito: { atr: { for: 1 }, desloc: 15 },
      },
      {
        id: "perfeita",
        nome: "Perfeita",
        texto: "Corpo Próprio (não precisa de Gigai) e Regeneração (1d4 PV por turno em combate).",
      },
    ],
  },
  {
    id: "quincy",
    nome: "Quincy",
    tipos: ["quincy"],
    texto: "Humano que controla o Reishi.",
    base: () => ({ desloc: 9 }),
    tracos: ["Percepção Espiritual: vantagem em testes de Percepção Espiritual.", "Vive em média 80 anos; até 2 m de altura."],
    variacoes: [
      {
        id: "echt",
        nome: "Echt",
        texto: "Estudos Echt (Mente +1, Conhecimento), Reiatsu Aumentada (+5 PR iniciais e +2 por nível seguinte), Blut Herdado.",
        efeito: { atr: { men: 1 }, prIni: 5, prNivel: 2, pericias: ["conhecimento"] },
      },
      {
        id: "gemischt",
        nome: "Gemischt",
        texto: "Treino Intenso (Destreza +2), Determinação (repete uma salvaguarda falha por descanso longo) e Raciocínio Rápido na iniciativa.",
        efeito: { atr: { des: 2 }, iniMente: true },
      },
    ],
  },
  {
    id: "visored",
    nome: "Visored",
    tipos: ["shinigami"],
    texto: "Alma infundida com um Hollow.",
    base: () => ({ desloc: 9 }),
    tracos: ["Quebra do Equilíbrio: pode escolher uma essência proibida (não conta como inicial; não evolui com a classe).", "Perda de Controle: em momentos extremos o Hollow assume e o Mestre controla o personagem."],
    variacoes: [
      {
        id: "infectado",
        nome: "Infectado",
        texto: "Corpo Reforçado (Constituição +1), Força Instintiva (+2 de dano corpo a corpo) e Corpo Hollowdificado (RD 5 contra dano físico).",
        efeito: { atr: { con: 1 }, rdFis: 5, danoCorpo: 2 },
      },
      {
        id: "unificado",
        nome: "Unificado",
        texto: "Reiatsu Hollow (+5 PR iniciais e +2 por nível seguinte), Vitalidade Unificada (+5 PV iniciais) e RD 2 contra dano físico.",
        efeito: { prIni: 5, prNivel: 2, pvIni: 5, rdFis: 2 },
      },
    ],
  },
  {
    id: "hollow-comum",
    nome: "Hollow Comum",
    tipos: ["hollow"],
    texto: "Evolui sozinho: Gillian no 5º nível e, se for Mente Clara, Adjuchas no 10º.",
    base: () => ({ desloc: 9, rdFis: 2 }),
    tracos: [
      "Máscara Hollow, dano de Energia à escolha, Fome (recupera PR igual ao nível ao reduzir um inimigo a 0 PV).",
      "Instinto Hollow: vantagem em Percepção e Iniciativa contra emboscadas; não pode ser surpreendido.",
      "Corpo Hollow: RD 2 contra dano físico. Até 3 m de altura.",
    ],
    variacoes: [
      { id: "predador", nome: "Predador", texto: "Corpo Forte (Força +1) e Ataque Feroz (+2 de dano corpo a corpo).", efeito: { atr: { for: 1 }, danoCorpo: 2 } },
      { id: "persistente", nome: "Persistente", texto: "Corpo Reforçado (Constituição +1 e +5 PV iniciais) e Cicatrização Hollow (1 PV no início de cada turno).", efeito: { atr: { con: 1 }, pvIni: 5 } },
    ],
  },
  {
    id: "gillian",
    nome: "Gillian",
    tipos: ["hollow"],
    texto: "Menos Grande gigante. Só o Mente Clara evolui, para Adjuchas no 10º nível.",
    base: () => ({ desloc: 9, rdFis: 5 }),
    tracos: [
      "Máscara Hollow, dano de Energia à escolha, Fome.",
      "Corpo Colossal: vantagem em Preparo Físico, desvantagem em Furtividade. Até 6 m de altura.",
      "Hierro Menor: RD 5 contra dano físico. Kumon: abre uma fenda para o Hueco Mundo uma vez por dia.",
    ],
    variacoes: [
      { id: "fusao", nome: "Fusão", texto: "Muitas Vozes (+5 PV iniciais e +2 por nível). Alvo Enorme (CR −1). Não evolui.", efeito: { pvIni: 5, pvNivel: 2, cr: -1 } },
      { id: "mente-clara", nome: "Mente Clara", texto: "Vontade Forte (Espírito +1, vantagem em Determinação), Reiatsu Concentrada (+5 PR iniciais e +1 por nível). Hierro Menor cai para RD 3.", efeito: { atr: { esp: 1 }, prIni: 5, prNivel: 1, rdFis: -2 } },
    ],
  },
  {
    id: "adjuchas",
    nome: "Adjuchas",
    tipos: ["hollow"],
    texto: "Só se chega por evolução do Gillian Mente Clara, no 10º nível.",
    soEvolucao: true,
    base: () => ({ desloc: 12, rdFis: 5 }),
    tracos: [
      "Hierro: RD 5 contra dano físico. Corpo Ágil: Desengajar como ação bônus.",
      "Regeneração de Alta Velocidade: recupera PV igual à proficiência no início de cada turno em combate.",
      "Cero Menor: Bala de Cero (18 m, Energia, 5 PR).",
    ],
    variacoes: [
      { id: "guardiao", nome: "Guardião", texto: "Presença Hollow (Espírito +1, proficiência em Presença) e Comando (aliado Hollow recebe +2 de dano).", efeito: { atr: { esp: 1 }, pericias: ["presenca"] } },
      { id: "cacador", nome: "Caçador", texto: "Ataque Focado (+2 de dano corpo a corpo) e Instinto Afiado (a CR do alvo cai 1 até o fim do próximo turno dele).", efeito: { danoCorpo: 2 } },
    ],
  },
  {
    id: "vasto-lorde",
    nome: "Vasto Lorde (Latente)",
    tipos: ["hollow"],
    texto: "Origem de nascimento: o poder se manifesta com o nível.",
    base: (n) => ({
      desloc: n >= 10 ? 12 : 9,
      rdFis: n >= 5 ? 5 : 2,
      rdEso: n >= 10 ? 2 : 0,
    }),
    tracos: [
      "1º: Máscara Hollow, Instinto Hollow, Corpo Hollow (RD 2 físico).",
      "5º: Hierro (RD 5 físico) e Regeneração de Alta Velocidade.",
      "10º: RD 2 esotérico, Sonido, Aura Predatória e deslocamento 12 m.",
    ],
    variacoes: [
      { id: "soberano", nome: "Soberano", texto: "10º nível: Mente Soberana (Espírito +1, CR +1) e Ordem Real.", desdeNivel: 10, efeito: { atr: { esp: 1 }, cr: 1 } },
      { id: "predador-supremo", nome: "Predador Supremo", texto: "10º nível: Arma Real (+3 de dano corpo a corpo) e Perseguição (CR +1, reação de ataque).", desdeNivel: 10, efeito: { cr: 1, danoCorpo: 3 } },
    ],
  },
];

export const origemPorId = (id: string) => ORIGENS.find((o) => o.id === id);

/* ---------- classes ---------- */

export interface Classe {
  id: string;
  nome: string;
  tipo: TipoClasse;
  texto: string;
  chave: string;
  pvIni: number;
  pvNivel: number;
  prIni: number;
  prNivel: number;
  pericias: number;
  periciasFixas?: string[];
  saves: Atr[];
  /** quantas salvaguardas a mais o jogador escolhe */
  saveEscolha?: number;
  cr: "plena" | "leve";
  subclasseNome: string;
  subclasses: string[];
  /** regra provisória: o livro ainda não fixa este dado */
  provisorio?: string;
  extraPv?: (nivel: number, sub: string) => number;
  slug: string;
}

export const CLASSES: Classe[] = [
  {
    id: "zanjutsu", nome: "Zanjutsu", tipo: "shinigami", slug: "classes",
    texto: "Combate com a Zanpakutou e golpes de grande impacto.",
    chave: "Força e Espírito", pvIni: 30, pvNivel: 10, prIni: 25, prNivel: 7, pericias: 2,
    saves: ["for", "esp"], cr: "plena", subclasseNome: "Especialização", subclasses: ["Forja Espiritual", "Ryoka", "Colosso"],
  },
  {
    id: "tokubetsu", nome: "Tokubetsu", tipo: "shinigami", slug: "classes",
    texto: "Versátil: toma subclasses emprestadas de outras classes de Shinigami.",
    chave: "Força e Mente", pvIni: 28, pvNivel: 9, prIni: 22, prNivel: 6, pericias: 6,
    saves: ["men"], saveEscolha: 1, cr: "plena", subclasseNome: "Subclasse emprestada", subclasses: [],
  },
  {
    id: "hakuda", nome: "Hakuda", tipo: "shinigami", slug: "classes",
    texto: "Combate corpo a corpo com Shunpo e Shunkō.",
    chave: "Destreza e Mente", pvIni: 26, pvNivel: 8, prIni: 22, prNivel: 6, pericias: 4,
    saves: ["des", "men"], cr: "plena", subclasseNome: "Caminho", subclasses: ["Caminho do Shunko", "Caminho Híbrido", "Caminho do Guerreiro", "Caminho do Punho"],
  },
  {
    id: "kidoshu", nome: "Kidōshū", tipo: "shinigami", slug: "classes",
    texto: "Conjurador de Kidō.",
    chave: "Mente e Espírito", pvIni: 28, pvNivel: 11, prIni: 30, prNivel: 14, pericias: 8,
    saves: ["men", "esp"], cr: "leve", subclasseNome: "Tradição", subclasses: ["Mago", "Sacerdote", "Lâmina Espiritual", "Bibliotecário"],
  },
  {
    id: "kyugo", nome: "Kyūgo", tipo: "shinigami", slug: "classes",
    texto: "Suporte: cura, reforço dos aliados e combate com Kaidō.",
    chave: "Força e Mente", pvIni: 22, pvNivel: 6, prIni: 28, prNivel: 9, pericias: 8, periciasFixas: ["medicina"],
    saves: ["men"], saveEscolha: 1, cr: "plena", subclasseNome: "Afinidade", subclasses: ["Curandeiro", "Ajudante", "Médico de Combate"],
  },
  {
    id: "schutze", nome: "Schütze", tipo: "quincy", slug: "classes",
    texto: "Quincy atirador.",
    chave: "Destreza e Mente", pvIni: 25, pvNivel: 9, prIni: 20, prNivel: 6, pericias: 6,
    saves: ["des", "men"], cr: "leve", subclasseNome: "Estilo", subclasses: ["Arqueiro", "Sniper", "Pistoleiro"],
  },
  {
    id: "ritter", nome: "Ritter", tipo: "quincy", slug: "classes",
    texto: "Quincy espadachim: lâminas de reishi no corpo a corpo.",
    chave: "Destreza e Espírito", pvIni: 26, pvNivel: 8, prIni: 20, prNivel: 6, pericias: 6,
    saves: ["des", "esp"], cr: "leve", subclasseNome: "Estilo", subclasses: ["Seele Schneider", "Eisenritter", "Ätherklinge"],
    extraPv: (n) => (n >= 3 ? 3 * (Math.min(n, 10) - 2) : 0),
  },
  {
    id: "hueco", nome: "Hueco", tipo: "hollow", slug: "classes",
    texto: "Luta com o corpo: armas naturais, mordida e Cero. Resurrección no 10º nível.",
    chave: "Conforme o Caminho", pvIni: 28, pvNivel: 9, prIni: 25, prNivel: 7, pericias: 4,
    saves: ["con", "esp"], cr: "plena", subclasseNome: "Caminho", subclasses: ["Glotonería", "Estallido", "Sonido"],
    provisorio: "O livro ainda não fixa quantas perícias o Hueco escolhe; usei 4 + metade da Mente.",
    extraPv: (n, sub) => 6 + 9 * (n - 1) + (sub === "Glotonería" && n >= 3 ? 3 * (n - 2) : 0),
  },
  {
    id: "vazio", nome: "Vazio", tipo: "hollow", slug: "classes",
    texto: "Conjurador Hollow: Poderes Inatos, ilusões, venenos e contra-ataques. Resurrección no 10º nível.",
    chave: "Espírito e Mente", pvIni: 26, pvNivel: 8, prIni: 30, prNivel: 9, pericias: 6,
    saves: ["esp", "men"], cr: "leve", subclasseNome: "Caminho", subclasses: ["Ponzoña", "Ilusión", "Reflejo"],
    provisorio: "O livro ainda não fixa quantas perícias o Vazio escolhe; usei 6 + metade da Mente.",
    extraPv: (n) => 6 * n + (n > 14 ? 20 * (n - 14) : 0),
  },
];

export const classePorId = (id: string) => CLASSES.find((c) => c.id === id);

/* ---------- ficha ---------- */

export interface Essencia {
  id: string;
  nome: string;
  etapa: number;
  /** vinda de Origem ou de Mestre: não gasta pontos */
  gratis?: boolean;
  nota?: string;
}

export interface Poder {
  id: string;
  nome: string;
  tipo: string;
  custo: string;
  texto: string;
}

export interface Ataque {
  id: string;
  nome: string;
  atr: Atr;
  dano: string;
  nota?: string;
  /** ataque à distância: não recebe o dano extra de corpo a corpo */
  distancia?: boolean;
  /** margem de crítico e multiplicador da arma (do livro), usados nas melhorias */
  crit?: number;
  mult?: number;
}

export interface KidoEscolhido {
  tipo: "hadou" | "bakudou";
  n: number;
  nome: string;
}

export interface Equip {
  forca: string;
  divisao: number;
  asauchi: string;
  armas: string[];
  artefato: string;
  naturalForma: string;
  extras: string;
}

export interface Treinos {
  /** ids das etapas concluídas */
  feitos: string[];
  /** Pontos de Fome da Trilha da Resurrección */
  pf: number;
  /** dias acumulados de Treinamento Geral */
  geralDias: number;
  /** forma final da Bankai (20º nível): plena ou verdadeira */
  caminhoBankai: "" | "plena" | "verdadeira";
}

export type Liberacao = "" | "shikai" | "bankai" | "resurreccion" | "terror" | "vollstandig" | "mascara";

export type TipoForma = "shikai" | "bankai" | "resurreccion" | "vollstandig" | "segunda";

export interface HabForma {
  id: string;
  nome: string;
  texto: string;
  custo: string;
  acao: string;
  /** custo em PR, para o botão de usar */
  pr?: number;
  /** custo em PR que depende do nível, como "8+[NIV/5]" */
  prExpr?: string;
  /** dano ou valor rolável, como "4d10+[ESP]" */
  dano?: string;
}

/** Forma de liberação avançada do personagem (Bankai, Resurrección ou Vollständig). */
export interface FormaLib {
  tipo: TipoForma;
  /** id do modelo pronto usado, ou vazio se for própria */
  modelo: string;
  nome: string;
  comando: string;
  aparencia: string;
  estilo: "" | "potencializadora" | "transformadora";
  custo: number;
  duracao: string;
  habilidades: HabForma[];
  traco: string;
  pontoFraco: string;
  canalizador: string;
  schrift: string;
  /** Vollständig: habilidades únicas escolhidas (id -> vezes) */
  picks: Record<string, number>;
  /** texto de referência do modelo pronto */
  texto: string;
  /** Shikai: Combate, Elemental, Kido ou Especial */
  categoria?: string;
  /** true quando o jogador digitou o custo de liberação à mão (a sugestão automática para de mexer) */
  custoManual?: boolean;
  /** Shikai: o espírito da Zanpakutou (aparência e personalidade) */
  espirito?: string;
}

export interface Estado {
  pvTemp: number;
  liberado: Liberacao;
  condicoes: string[];
  ultimoFolegoUsado: boolean;
  curtosUsados: number;
  /** habilidades ativas ligadas (efeitos que duram) */
  ativas: string[];
  /** usos gastos de habilidades limitadas, por id */
  usos: Record<string, number>;
  /** passos de PR extra gastos em habilidades de situação ligadas, por id */
  extras?: Record<string, number>;
}

export interface Ficha {
  versao: 1;
  nome: string;
  origem: string;
  variacao: string;
  variacaoGillian: string;
  variacaoAdjuchas: string;
  classe: string;
  subclasse: string;
  nivel: number;
  xp: number;
  base: Record<Atr, number>;
  livre: Record<Atr, number>;
  nivelAtr: Record<Atr, number>;
  pontosIniciais: number;
  maxInicial: number;
  d12: number | null;
  pericias: string[];
  saveExtra: Atr[];
  essencias: Essencia[];
  ataques: Ataque[];
  /** melhorias de equipamento Quincy escolhidas ao subir de nível */
  melhorias: Melhoria[];
  /** Schrift do Quincy (a partir do 10º nível), id de schrifts.ts */
  schrift: string;
  poderes: Poder[];
  ajuste: { pv: number; pr: number; cr: number };
  pvAtual: number;
  prAtual: number;
  aparencia: string;
  tendencia: string;
  historia: string;
  notas: string;
  equipamento: string;
  talentos: string[];
  kidos: KidoEscolhido[];
  tecnicasReishi: string[];
  equip: Equip;
  treinos: Treinos;
  estado: Estado;
  zanpakutou: { nome: string; frase: string };
  formas: Partial<Record<TipoForma, FormaLib>>;
}

const zero = (): Record<Atr, number> => ({ for: 0, des: 0, con: 0, men: 0, esp: 0 });

export function fichaNova(): Ficha {
  return {
    versao: 1,
    nome: "",
    origem: "",
    variacao: "",
    variacaoGillian: "",
    variacaoAdjuchas: "",
    classe: "",
    subclasse: "",
    nivel: 1,
    xp: 0,
    base: zero(),
    livre: zero(),
    nivelAtr: zero(),
    pontosIniciais: 12,
    maxInicial: 4,
    d12: null,
    pericias: [],
    saveExtra: [],
    essencias: [],
    ataques: [],
    melhorias: [],
    schrift: "",
    poderes: [],
    ajuste: { pv: 0, pr: 0, cr: 0 },
    pvAtual: 0,
    prAtual: 0,
    aparencia: "",
    tendencia: "",
    historia: "",
    notas: "",
    equipamento: "",
    talentos: [],
    kidos: [],
    tecnicasReishi: [],
    equip: { forca: "", divisao: 0, asauchi: "", armas: [], artefato: "", naturalForma: "", extras: "" },
    treinos: { feitos: [], pf: 0, geralDias: 0, caminhoBankai: "" },
    estado: { pvTemp: 0, liberado: "", condicoes: [], ultimoFolegoUsado: false, curtosUsados: 0, ativas: [], usos: {} },
    zanpakutou: { nome: "", frase: "" },
    formas: {},
  };
}

/** Completa uma ficha lida do banco com os campos que faltarem. */
export function normalizar(bruto: Partial<Ficha> | null | undefined): Ficha {
  const n = fichaNova();
  const f = { ...n, ...(bruto ?? {}) } as Ficha;
  f.base = { ...n.base, ...f.base };
  f.livre = { ...n.livre, ...f.livre };
  f.nivelAtr = { ...n.nivelAtr, ...f.nivelAtr };
  f.ajuste = { ...n.ajuste, ...f.ajuste };
  f.equip = { ...n.equip, ...f.equip };
  f.treinos = { ...n.treinos, ...f.treinos };
  f.estado = { ...n.estado, ...f.estado };
  f.zanpakutou = { ...n.zanpakutou, ...f.zanpakutou };
  f.formas = f.formas ?? {};
  f.melhorias = f.melhorias ?? [];
  f.schrift = f.schrift ?? "";
  f.talentos = f.talentos ?? [];
  f.kidos = f.kidos ?? [];
  f.tecnicasReishi = f.tecnicasReishi ?? [];
  return f;
}

/* ---------- cálculo ---------- */

export interface ParteOrigem {
  origem: Origem;
  variacao?: Variacao;
}

/** Origens ativas no nível atual. Hollows evoluem sozinhos. */
export function partesOrigem(f: Ficha): ParteOrigem[] {
  const o = origemPorId(f.origem);
  if (!o) return [];
  const achar = (org: Origem, id: string) => org.variacoes.find((v) => v.id === id);
  const adj = origemPorId("adjuchas")!;
  const gil = origemPorId("gillian")!;
  if (o.id === "hollow-comum") {
    if (f.nivel < 5) return [{ origem: o, variacao: achar(o, f.variacao) }];
    const vg = achar(gil, f.variacaoGillian);
    if (f.nivel >= 10 && f.variacaoGillian === "mente-clara") return [{ origem: adj, variacao: achar(adj, f.variacaoAdjuchas) }];
    return [{ origem: gil, variacao: vg }];
  }
  if (o.id === "gillian") {
    if (f.nivel >= 10 && f.variacao === "mente-clara") return [{ origem: adj, variacao: achar(adj, f.variacaoAdjuchas) }];
    return [{ origem: o, variacao: achar(o, f.variacao) }];
  }
  return [{ origem: o, variacao: achar(o, f.variacao) }];
}

/** Atributos que o Hollow Comum ganhou das variações já "gastas" não se acumulam: só vale o estágio atual. */
export function efeitoOrigem(f: Ficha): Required<Pick<Efeito, "pvIni" | "prIni" | "pvNivel" | "prNivel" | "cr" | "rdFis" | "rdEso" | "desloc">> & {
  atr: Record<Atr, number>;
  pericias: string[];
  livre: number;
  danoCorpo: number;
  evasao: boolean;
  iniMente: boolean;
} {
  const out = { danoCorpo: 0, evasao: false, iniMente: false, pvIni: 0, prIni: 0, pvNivel: 0, prNivel: 0, cr: 0, rdFis: 0, rdEso: 0, desloc: 9, atr: zero(), pericias: [] as string[], livre: 0 };
  const soma = (e?: Efeito) => {
    if (!e) return;
    out.pvIni += e.pvIni ?? 0;
    out.prIni += e.prIni ?? 0;
    out.pvNivel += e.pvNivel ?? 0;
    out.prNivel += e.prNivel ?? 0;
    out.cr += e.cr ?? 0;
    out.rdFis += e.rdFis ?? 0;
    out.rdEso += e.rdEso ?? 0;
    out.livre += e.livre ?? 0;
    out.danoCorpo += e.danoCorpo ?? 0;
    if (e.evasao) out.evasao = true;
    if (e.iniMente) out.iniMente = true;
    if (e.desloc) out.desloc = Math.max(out.desloc, e.desloc);
    (Object.keys(e.atr ?? {}) as Atr[]).forEach((a) => (out.atr[a] += e.atr![a] ?? 0));
    out.pericias.push(...(e.pericias ?? []));
  };
  for (const p of partesOrigem(f)) {
    const b = p.origem.base(f.nivel);
    soma(b);
    if (p.variacao && (p.variacao.desdeNivel ?? 1) <= f.nivel) soma(p.variacao.efeito);
  }
  return out;
}

export const mod = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

/** Onde o jogador conserta o problema. */
export type DestinoAviso = "atributos" | "pericias" | "salvaguarda" | "essencias";
export interface Aviso {
  texto: string;
  destino: DestinoAviso;
}

export interface Calculo {
  prof: number;
  atr: Record<Atr, number>;
  pv: number;
  pr: number;
  cr: number;
  desloc: number;
  rdFis: number;
  rdEso: number;
  iniciativa: number;
  danoCorpo: number;
  /** dano extra em todos os ataques (talentos ligados) */
  danoGeral: number;
  /** dados extras de dano corpo a corpo de situações ligadas, ex.: "2d8" */
  danoDados: string[];
  /** acerto extra de situações ligadas */
  acertoCorpo: number;
  acertoDist: number;
  /** CR veio da Evasão Aprimorada */
  crEvasao: boolean;
  percPassiva: number;
  saves: Record<Atr, { prof: boolean; total: number }>;
  pericias: Record<string, { prof: boolean; fixa: boolean; total: number }>;
  quantasPericias: number;
  periciasFixas: string[];
  pontosAtrib: { inicial: number; usados: number; nivel: number; nivelUsados: number; livre: number; livreUsados: number; max: number };
  pontosEssencia: { total: number; usados: number };
  pontosNivel: number;
  cd: number;
  proximoXp: number | null;
  avisos: Aviso[];
  /** efeitos passivos de talentos e essências (os automáticos já estão somados acima) */
  passivas: PassivaAtiva[];
  /** bônus na CD dos Kidōs */
  cdKido: number;
  /** quanto cada essência reduz o custo de liberação */
  reducaoLib: EfeitoSoma["reducaoLib"];
}

const soma = (r: Record<Atr, number>) => ATRIBUTOS.reduce((s, a) => s + (r[a.id] ?? 0), 0);

export function calcular(f: Ficha): Calculo {
  const c = classePorId(f.classe);
  const ef = efeitoOrigem(f);
  const n = Math.max(1, f.nivel);
  const prof = proficiencia(n);
  const avisos: Aviso[] = [];

  const pas = atributosPassivos(f);
  const atr = zero();
  ATRIBUTOS.forEach(({ id }) => {
    atr[id] = (f.base[id] ?? 0) + ef.atr[id] + (f.livre[id] ?? 0) + (f.nivelAtr[id] ?? 0) + (pas.atr[id] ?? 0);
  });

  const pontosNivel = pontosAtributoDeNivel(n);
  const pa = {
    inicial: f.pontosIniciais,
    usados: soma(f.base),
    nivel: pontosNivel,
    nivelUsados: soma(f.nivelAtr),
    livre: ef.livre,
    livreUsados: soma(f.livre),
    max: f.maxInicial,
  };
  if (pa.usados > pa.inicial) avisos.push({ texto: "Você usou mais pontos de atributo do que tem na criação.", destino: "atributos" });
  ATRIBUTOS.forEach(({ id, nome }) => {
    if ((f.base[id] ?? 0) > f.maxInicial) avisos.push({ texto: `${nome} passa do máximo de ${f.maxInicial} na criação.`, destino: "atributos" });
    const lim = pas.limite[id] ?? 15;
    if (atr[id] > lim) avisos.push({ texto: `${nome} passa do limite de ${lim}.`, destino: "atributos" });
  });
  if (pa.nivelUsados > pa.nivel) avisos.push({ texto: "Você gastou mais pontos de atributo de nível do que ganhou.", destino: "atributos" });
  if (pa.livreUsados > pa.livre) avisos.push({ texto: "Você gastou mais pontos livres de variação do que a Origem dá.", destino: "atributos" });

  let pv = 0;
  let pr = 0;
  let cr = 0;
  let crEvasao = false;
  if (c) {
    pv = c.pvIni + atr.con + ef.pvIni + (n - 1) * (c.pvNivel + atr.con + ef.pvNivel);
    pr = c.prIni + atr.esp + ef.prIni + (n - 1) * (c.prNivel + atr.esp + ef.prNivel);
    pv += c.extraPv ? c.extraPv(n, f.subclasse) : 0;
    cr = c.cr === "plena" ? 10 + prof + atr.con + atr.des : 10 + prof + atr.des + Math.floor(atr.con / 2);
    // Defesa Ágil (Zanjutsu) e Defesa Inteligente (Kidōshū) trocam a fórmula da CR; vale a melhor
    const crAgil = f.classe === "zanjutsu" && f.talentos.includes("defesa-agil") ? 10 + prof + atr.des : 0;
    const crInteligente = f.classe === "kidoshu" && f.talentos.includes("defesa-inteligente") ? 10 + prof + Math.floor(atr.men / 2) : 0;
    cr = Math.max(cr, crAgil, crInteligente);
    if (ef.evasao) {
      cr += Math.floor(prof / 2);
      crEvasao = true;
    }
  }
  pv += f.ajuste.pv;
  pr += f.ajuste.pr;
  cr += ef.cr + f.ajuste.cr;
  // liberações que mexem na CR (Shikai soma a proficiência; Resurrección conforme a classe)
  if (f.estado.liberado === "shikai") cr += prof;
  if (f.estado.liberado === "resurreccion") {
    if (c?.id === "hueco") cr += prof + 1;
    if (c?.id === "vazio") cr += n >= 16 ? prof : prof - 1;
  }
  // Segunda Etapa (Vasto Lorde) substitui a Resurrección
  if (f.estado.liberado === "terror") {
    if (c?.id === "hueco") cr += prof + 2;
    if (c?.id === "vazio") cr += prof + 1;
  }
  // Bankai Plena (20º nível): +2 na CR
  if (f.estado.liberado === "bankai" && f.treinos.caminhoBankai === "plena") cr += 2;

  const sit = somaSituacoes(f, { n, prof, atr });
  cr += sit.cr + bonusEscudo(f);

  let rdFisExtra = 0;
  let rdEsoExtra = 0;
  let deslocExtra = 0;
  // Vollständig dos Quincy: bônus de ataque, dano e CR do livro. Ritter (arma corpo a corpo): 12º; Schütze (à distância): 13º, e o segundo degrau vem 5 níveis depois.
  const vollQ = f.estado.liberado === "vollstandig" && (f.classe === "ritter" || f.classe === "schutze");
  const vollIni = f.classe === "ritter" ? 12 : 13;
  const vollOk = vollQ && n >= vollIni;
  const vollAtq = vollOk ? (n >= 20 ? 4 : n >= vollIni + 5 ? 2 : 1) : 0;
  const vollDano = vollOk ? (n >= vollIni + 5 ? 3 : 2) : 0;
  const vollRitter = vollOk;
  // Formas liberadas dão dano extra a cada golpe: Shikai +proficiência, Bankai +2 × proficiência (+1 de ataque), Segunda Etapa +2 × proficiência
  const lib = f.estado.liberado;
  const formaDano = (lib === "shikai" ? prof : 0) + (lib === "bankai" ? 2 * prof : 0) + (lib === "terror" ? 2 * prof : 0);
  const formaAtq = lib === "bankai" ? 1 : 0;
  if (f.estado.liberado === "vollstandig") {
    const pk = f.formas?.vollstandig?.picks ?? {};
    cr += 3 * (pk["defesa"] ?? 0);
    if (vollRitter) cr += 1;
    pv += 40 * (pk["reserva-vital"] ?? 0);
    pr += 40 * (pk["reserva-esp"] ?? 0);
    rdFisExtra = 5 * (pk["armadura"] ?? 0);
    rdEsoExtra = rdFisExtra;
    deslocExtra = 6 * (pk["velocidade"] ?? 0);
  }

  const { soma: px, lista: passivas } = passivasDaFicha(f, { atr, prof, n });
  pv += px.pv;
  pr += px.pr;
  cr += px.cr;

  const saves = {} as Calculo["saves"];
  const fixos = c?.saves ?? [];
  ATRIBUTOS.forEach(({ id }) => {
    const p = fixos.includes(id) || f.saveExtra.includes(id) || pas.saves.includes(id);
    saves[id] = { prof: p, total: atr[id] + (p ? prof : 0) };
  });
  if (c?.saveEscolha && f.saveExtra.length < c.saveEscolha) avisos.push({ texto: "Escolha a salvaguarda extra da classe.", destino: "salvaguarda" });

  const fixas = [...(c?.periciasFixas ?? []), ...ef.pericias];
  const quantas = c ? c.pericias + Math.floor(atr.men / 2) : 0;
  const escolhidas = f.pericias.filter((p) => !fixas.includes(p));
  if (c && escolhidas.length > quantas) avisos.push({ texto: `Você escolheu ${escolhidas.length} perícias, mas a classe permite ${quantas}.`, destino: "pericias" });

  const pericias: Calculo["pericias"] = {};
  PERICIAS.forEach((p) => {
    const fixa = fixas.includes(p.id);
    const prf = fixa || f.pericias.includes(p.id);
    const outro = px.periciaAtr[p.id];
    pericias[p.id] = { prof: prf, fixa, total: Math.max(atr[p.atr], outro ? atr[outro] : -99) + (prf ? prof : 0) };
  });

  const pe = { total: pontosEssencia(n), usados: f.essencias.filter((e) => !e.gratis).reduce((s, e) => s + e.etapa, 0) };
  if (pe.usados > pe.total) avisos.push({ texto: "Você gastou mais pontos de essência do que tem.", destino: "essencias" });

  const proximoXp = n >= 20 ? null : XP_NIVEL[n];

  return {
    prof,
    atr,
    pv,
    pr,
    cr,
    desloc: Math.max(ef.desloc + deslocExtra + px.desloc + sit.desloc, f.estado.liberado === "terror" ? 12 : 0),
    rdFis: ef.rdFis + rdFisExtra + px.rdFis,
    rdEso: ef.rdEso + rdEsoExtra + px.rdEso,
    iniciativa: (ef.iniMente ? Math.max(atr.des, atr.men) : atr.des) + px.iniciativa,
    // Ritter: armas Quincy corpo a corpo causam +3 de dano do 3º ao 9º nível
    danoCorpo: ef.danoCorpo + px.danoCorpo + sit.danoCorpo + (f.classe === "ritter" && n >= 3 && n <= 9 ? 3 : 0) + danoFixoHueco(f, prof) + (f.classe === "ritter" ? vollDano : 0),
    crEvasao,
    percPassiva: 10 + pericias["percepcao"].total + px.percPassiva,
    saves,
    pericias,
    quantasPericias: quantas,
    periciasFixas: fixas,
    pontosAtrib: pa,
    pontosEssencia: pe,
    pontosNivel,
    cd: 8 + prof + atr.esp,
    proximoXp,
    avisos,
    passivas,
    cdKido: 8 + prof + atr.esp + px.cdKido,
    reducaoLib: px.reducaoLib,
    danoGeral: sit.danoGeral + formaDano + (f.classe === "schutze" ? vollDano : 0),
    danoDados: sit.dados,
    acertoCorpo: sit.acertoCorpo + formaAtq + (f.classe === "ritter" ? vollAtq : 0),
    acertoDist: sit.acertoDist + formaAtq + (f.classe === "schutze" ? vollAtq : 0),
  };
}

/** Quantos ataques a ação Atacar dá: Ataque Extra (2), Golpe Triplo (3), Golpe Superior (4). */
export function ataquesPorAcao(f: Ficha): number {
  if (f.classe === "hueco") return ataquesHueco(f);
  const tem = (id: string) => f.talentos.some((t) => t === id || t.endsWith("/" + id));
  let n = tem("golpe-superior") ? 4 : tem("golpe-triplo") ? 3 : tem("ataque-extra") ? 2 : 1;
  // Tokubetsu recebe Ataque Extra no 5º nível pela subclasse de combate (Zanjutsu ou Hakuda), sem talento
  if (f.classe === "tokubetsu" && f.nivel >= 5) {
    const combate = CLASSES.filter((x) => x.id === "zanjutsu" || x.id === "hakuda").some((x) => x.subclasses.includes(f.subclasse));
    if (combate) n = Math.max(n, 2);
  }
  // Médico de Combate (Kyūgo): Ataque Extra no 5º, Golpe Triplo no 11º e Golpe Superior no 15º nível
  if (f.classe === "kyugo" && f.subclasse === "Médico de Combate") n = Math.max(n, f.nivel >= 15 ? 4 : f.nivel >= 11 ? 3 : f.nivel >= 5 ? 2 : 1);
  return n;
}

export function ataqueBonus(f: Ficha, c: Calculo, a: Ataque) {
  return c.prof + c.atr[a.atr] + (a.distancia ? c.acertoDist : c.acertoCorpo);
}

/** Modificador do atributo do ataque somado ao dano (regra do livro: dano da arma + atributo).
 *  Se quem montou o ataque já escreveu um valor fixo (ex.: 2d8+3), não soma de novo. */
export function danoAtributo(c: Calculo, a: Ataque): string {
  if (!a.dano.trim() || /[+-]\s*\d+\s*$/.test(a.dano.trim())) return "";
  const v = c.atr[a.atr];
  return v > 0 ? `+${v}` : v < 0 ? `${v}` : "";
}
