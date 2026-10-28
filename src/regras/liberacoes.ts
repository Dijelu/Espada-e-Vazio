import bankaisJson from "./bankais.json";
import type { FormaLib, TipoForma } from "./ficha";

/* ---------- Bankai: modelos prontos do capítulo de Zanpakutōs ---------- */

export interface ModeloBankai {
  id: string;
  nome: string;
  resumo: string;
  texto: string;
  custo: number;
}
export const BANKAIS: ModeloBankai[] = bankaisJson as ModeloBankai[];

/* ---------- Resurrección: modelos do livro ---------- */

export interface ModeloResurreccion {
  id: string;
  nome: string;
  classe: "hueco" | "vazio";
  caminho: string;
  comando: string;
  aparencia: string;
  tecnica: string;
  traco: string;
  pontoFraco: string;
}

export const RESURRECCIONES: ModeloResurreccion[] = [
  {
    id: "pantera", nome: "Pantera", classe: "hueco", caminho: "Sonido",
    comando: "Rasgue o silêncio, Pantera.",
    aparencia: "Corpo esguio de felino, garras longas de osso, cauda e a máscara reduzida a uma crista na face.",
    tecnica: "O Golpe Fantasma surge como uma sequência de arranhões de garras, cada um vindo de uma direção diferente.",
    traco: "Salto de Pantera: deslocamento +6 metros e, uma vez por turno, Desengajar como ação livre.",
    pontoFraco: "Pelagem Rasgada: -2 de CR contra ataques à distância.",
  },
  {
    id: "los-lobos", nome: "Los Lobos", classe: "hueco", caminho: "Estallido",
    comando: "Uivem, Los Lobos.",
    aparencia: "Duas silhuetas de lobo feitas de reiatsu acompanham você; o corpo ganha pelagem de névoa e uma pistola de osso nas mãos.",
    tecnica: "Os dois Ceros do Gran Rey Cero saem um de cada lobo.",
    traco: "Cero em Matilha: o Cero pode ser dividido entre até 2 alvos a até 6 metros um do outro; cada um sofre metade do dano (arredonde para cima). O custo não muda.",
    pontoFraco: "Sede de Matilha: se nenhum aliado estiver a até 9 metros, o Cero custa +3 PR.",
  },
  {
    id: "santa-teresa", nome: "Santa Teresa", classe: "hueco", caminho: "Glotonería",
    comando: "Estraçalhe, Santa Teresa.",
    aparencia: "Corpo magro e alto, com quatro braços de osso afiado e uma boca extra no peito.",
    tecnica: "O Devorar usa os quatro braços para prender e rasgar o alvo.",
    traco: "Braços Múltiplos: alcance corpo a corpo +3 metros. Se acertar a mesma criatura duas vezes na mesma ação, ela fica agarrada (salvaguarda de Força, CD 8 + proficiência + Força).",
    pontoFraco: "Guarda Aberta: enquanto agarra uma criatura, a margem de crítico dos ataques contra você aumenta em 1.",
  },
  {
    id: "murcielago", nome: "Murciélago", classe: "vazio", caminho: "Ilusión",
    comando: "Cubra o céu, Murciélago.",
    aparencia: "Asas membranosas, pele pálida, lágrimas negras sob os olhos e uma lança de reiatsu esverdeado.",
    tecnica: "O Mundo Quebrado surge como um céu escuro que apaga as referências do alvo.",
    traco: "Asas Negras: voo igual ao seu deslocamento.",
    pontoFraco: "Olhos Sensíveis: desvantagem em testes de Percepção com luz intensa.",
  },
  {
    id: "fornicaras", nome: "Fornicarás", classe: "vazio", caminho: "Ponzoña",
    comando: "Teça a ruína, Fornicarás.",
    aparencia: "Corpo coberto de casulos que se abrem como flores, de onde escorre um veneno roxo.",
    tecnica: "O Veneno Total faz as cargas escorrerem pelo corpo do alvo como fios.",
    traco: "Casulo Venenoso: uma vez por rodada, quando uma criatura acerta você em combate corpo a corpo, ela recebe 1 carga de Ponzoña (respeitando o máximo).",
    pontoFraco: "Corpo Pesado: deslocamento -3 metros.",
  },
  {
    id: "espejo-negro", nome: "Espejo Negro", classe: "vazio", caminho: "Reflejo",
    comando: "Reflita-os, Espejo Negro.",
    aparencia: "A pele vira vidro escuro e o rosto some atrás de uma máscara lisa em que o inimigo vê o próprio reflexo.",
    tecnica: "O Espejo Roto devolve o golpe em estilhaços de vidro negro.",
    traco: "Véu de Reflexo: uma vez por rodada, quando um ataque erra você, ganhe PV temporários iguais ao bônus de proficiência.",
    pontoFraco: "Vidro Frágil: se sofrer um acerto crítico, o Véu deixa de funcionar até o fim da Resurrección.",
  },
];

/* ---------- Vollständig ---------- */

export interface HabUnica {
  id: string;
  nome: string;
  texto: string;
  /** só pode ser escolhida uma vez */
  unica?: boolean;
}

export const HAB_UNICAS: HabUnica[] = [
  { id: "atributo", nome: "Aumento de Atributo", texto: "Escolha um atributo: ele aumenta em +2 (aplique à mão na ficha)." },
  { id: "armadura", nome: "Armadura de Reishi", texto: "Reduz em 5 todo dano sofrido, exceto Psíquico." },
  { id: "defesa", nome: "Defesa", texto: "+3 na Classe de Resistência." },
  { id: "tokubetsu", nome: "Tokubetsu", texto: "+3 em testes de perícia." },
  { id: "forca", nome: "Força Espiritual", texto: "+5 de dano com a arma espiritual.", unica: true },
  { id: "melhoria", nome: "Melhoria", texto: "Uma melhoria para a arma escolhida na Vollständig." },
  { id: "olhos", nome: "Olhos do Céu", texto: "+6 metros no alcance de ataques à distância (técnicas de Reishi, habilidades e armas)." },
  { id: "potencia", nome: "Potência Espiritual", texto: "+5 de dano com Técnicas de Reishi." },
  { id: "precisao", nome: "Precisão Espiritual", texto: "+3 nas jogadas de ataque com a arma espiritual.", unica: true },
  { id: "reserva-esp", nome: "Reserva Espiritual", texto: "+40 de reiatsu máximo." },
  { id: "reserva-vital", nome: "Reserva Vital", texto: "+40 de PV máximos." },
  { id: "reuniao", nome: "Reunião Eficiente", texto: "+5 pontos de reiatsu ao recuperar com Sklaverei." },
  { id: "sentido", nome: "Sentido Divino", texto: "+12 metros no alcance da Consciência Espiritual Expandida." },
  { id: "velocidade", nome: "Velocidade", texto: "+6 metros de deslocamento (normal ou voo)." },
  { id: "vigor", nome: "Vigor do Reishi", texto: "No início do seu turno recupera 5 PV; no máximo, vira PV temporários." },
];

export const VOLL_PASSIVAS = [
  "Arma Espiritual: uma arma em que você é proficiente, criada sem custo, com 2 melhorias de dano e dano de energia.",
  "Consciência Espiritual Expandida: você sabe onde estão e o ND das criaturas mais fracas num raio de 56 metros.",
  "Sklaverei: ao reunir reishi do ambiente, você recupera o dobro de reiatsu.",
  "Voo: deslocamento de voo de 6 metros.",
];

export interface ProntaVoll {
  id: string;
  nome: string;
  fonte: "arquetipo" | "manga";
  resumo: string;
  picks: Record<string, number>;
}

export const VOLL_PRONTAS: ProntaVoll[] = [
  { id: "conjurador", nome: "Conjurador", fonte: "arquetipo", resumo: "Técnicas de Reishi mais fortes e de mais longe.", picks: { olhos: 1, potencia: 2, reuniao: 1 } },
  { id: "defensivo", nome: "Defensivo", fonte: "arquetipo", resumo: "Resistente e veloz.", picks: { armadura: 2, defesa: 1, velocidade: 1 } },
  { id: "duelista", nome: "Duelista", fonte: "arquetipo", resumo: "Arma espiritual forte, crítica e dura.", picks: { defesa: 1, forca: 1, melhoria: 2 } },
  { id: "expurgador", nome: "Expurgador", fonte: "arquetipo", resumo: "Acerta de longe com a arma espiritual.", picks: { melhoria: 2, olhos: 1, precisao: 1 } },
  { id: "oraculo", nome: "Oráculo", fonte: "arquetipo", resumo: "Percepção enorme e pontaria.", picks: { sentido: 2, olhos: 1, precisao: 1 } },
  { id: "velocista", nome: "Velocista", fonte: "arquetipo", resumo: "Muito deslocamento e golpes rápidos.", picks: { velocidade: 2, precisao: 1, forca: 1 } },
  { id: "atirador-celeste", nome: "Atirador Celeste", fonte: "manga", resumo: "Arqueiro que acerta qualquer coisa à vista e dispara de longe.", picks: { olhos: 1, potencia: 1, precisao: 1, velocidade: 1 } },
  { id: "bombardeiro", nome: "Bombardeiro", fonte: "manga", resumo: "Explosões de reishi e muita reserva espiritual.", picks: { potencia: 2, "reserva-esp": 1, reuniao: 1 } },
  { id: "sentinela", nome: "Sentinela", fonte: "manga", resumo: "Guarda o grupo e aguenta o que vier.", picks: { armadura: 1, defesa: 1, "reserva-vital": 1, vigor: 1 } },
];

/* ---------- regras de nível ---------- */

/** Nível em que o personagem pode ter essa forma, ou 0 se a classe não tem. */
export function nivelLiberacao(classeId: string, tipoClasse: string | undefined, tipo: TipoForma): number {
  if (tipo === "bankai") return tipoClasse === "shinigami" ? 10 : 0;
  if (tipo === "resurreccion") return tipoClasse === "hollow" ? 10 : 0;
  if (tipo === "vollstandig") return tipoClasse === "quincy" ? (classeId === "ritter" ? 12 : 13) : 0;
  return 0;
}

/** Quantas habilidades únicas a Vollständig tem no nível. */
export function picksVoll(classeId: string, nivel: number): number {
  return nivel >= (classeId === "ritter" ? 17 : 18) ? 6 : 4;
}

export const totalPicks = (p: Record<string, number>) => Object.values(p).reduce((a, b) => a + b, 0);

export const TIPO_FORMA_NOME: Record<TipoForma, string> = {
  bankai: "Bankai",
  resurreccion: "Resurrección",
  vollstandig: "Vollständig",
};

/** Forma pendente de configurar (ainda sem nome, ou com habilidades únicas faltando). */
export function formaPendente(f: { classe: string; nivel: number; formas?: Partial<Record<TipoForma, FormaLib>> }, tipoClasse: string | undefined): TipoForma | null {
  for (const t of ["bankai", "resurreccion", "vollstandig"] as TipoForma[]) {
    const n = nivelLiberacao(f.classe, tipoClasse, t);
    if (!n || f.nivel < n) continue;
    const forma = f.formas?.[t];
    if (!forma || !forma.nome.trim()) return t;
    if (t === "vollstandig" && totalPicks(forma.picks) < picksVoll(f.classe, f.nivel)) return t;
  }
  return null;
}
