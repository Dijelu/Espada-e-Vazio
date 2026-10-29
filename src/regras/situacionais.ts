/* Habilidades que só valem em certas situações. Viram cartas no Resumo, com um botão para ligar e desligar.
   Quando ligadas, os números que dá para somar entram na ficha. */
import type { Ficha, Atr } from "./ficha";

export interface Situacao {
  id: string;
  nome: string;
  fonte: string;
  /** a situação em que vale, em poucas palavras */
  quando: string;
  texto: string;
  /** o que entra nos números da ficha enquanto estiver ligada */
  efeito?: (c: { n: number; prof: number; atr: Record<Atr, number> }) => { cr?: number; danoCorpo?: number; dados?: string; resumo: string };
}

interface Def extends Situacao {
  classe: string;
  subclasse?: string;
  nivel: number;
}

const DEFS: Def[] = [
  {
    id: "postura-de-duelo", nome: "Postura de Duelo", fonte: "Seele Schneider", classe: "ritter", subclasse: "Seele Schneider", nivel: 3,
    quando: "Uma única arma Leve de uma mão, sem escudo",
    texto: "Sua CR sobe +1 e seus golpes com essa arma causam +2 de dano.",
    efeito: () => ({ cr: 1, danoCorpo: 2, resumo: "CR +1 e dano +2" }),
  },
  {
    id: "riposta", nome: "Riposta", fonte: "Seele Schneider", classe: "ritter", subclasse: "Seele Schneider", nivel: 3,
    quando: "Um inimigo erra um ataque corpo a corpo contra você",
    texto: "Use a reação para atacá-lo, somando sua Destreza ao dano. Uma vez por rodada.",
  },
  {
    id: "abertura", nome: "Abertura", fonte: "Seele Schneider", classe: "ritter", subclasse: "Seele Schneider", nivel: 6,
    quando: "Depois de acertar uma criatura",
    texto: "O próximo ataque contra ela antes do seu próximo turno tem vantagem e ignora metade da RD.",
  },
  {
    id: "estocada-decisiva", nome: "Estocada Decisiva", fonte: "Seele Schneider", classe: "ritter", subclasse: "Seele Schneider", nivel: 10,
    quando: "Ao acertar, gastando 10 PR",
    texto: "Gaste 10 pontos de reiatsu para ignorar completamente a RD do alvo.",
  },
  {
    id: "passo-cruzado", nome: "Passo Cruzado", fonte: "Seele Schneider", classe: "ritter", subclasse: "Seele Schneider", nivel: 15,
    quando: "Primeiro ataque do turno, depois de usar o Hirenkyaku para ficar adjacente",
    texto: "Seu primeiro ataque contra a criatura neste turno causa +2d8 de Energia.",
    efeito: () => ({ dados: "2d8", resumo: "+2d8 de Energia no primeiro ataque" }),
  },
  {
    id: "golpe-pesado", nome: "Golpe Pesado", fonte: "Eisenritter", classe: "ritter", subclasse: "Eisenritter", nivel: 3,
    quando: "Arma Pesada de duas mãos",
    texto: "Você soma sua proficiência ao dano. Nos níveis 3 e 4, o Eisenritter causa +5 de dano com a arma pesada, no lugar dos +3 de dano da classe.",
    efeito: (c) => {
      const v = c.prof + (c.n <= 4 ? 2 : 0);
      return { danoCorpo: v, resumo: `dano +${v}${c.n <= 4 ? " (inclui o +5 no lugar do +3 da classe)" : ""}` };
    },
  },
  {
    id: "varredura", nome: "Varredura", fonte: "Eisenritter", classe: "ritter", subclasse: "Eisenritter", nivel: 6,
    quando: "Arma Pesada, gastando 5 PR",
    texto: "Ataque todas as criaturas a até 3 metros (uma jogada de ataque contra a CR de cada uma).",
  },
  {
    id: "quebra-guarda", nome: "Quebra-Guarda", fonte: "Eisenritter", classe: "ritter", subclasse: "Eisenritter", nivel: 10,
    quando: "Ao acertar",
    texto: "A CR do alvo cai pelo seu bônus de proficiência até o início do seu próximo turno.",
  },
  {
    id: "disparo-de-precisao", nome: "Disparo de Precisão", fonte: "Sniper", classe: "schutze", subclasse: "Sniper", nivel: 3,
    quando: "Arma à distância, alvo a 9 metros ou mais",
    texto: "Com sua ação, você ataca e soma dados extras da arma, em quantidade igual a metade da sua Mente (arredondada para cima).",
    efeito: (c) => ({ resumo: `+${Math.ceil(c.atr.men / 2)} dado(s) da arma` }),
  },
  {
    id: "mira-mortal", nome: "Mira Mortal", fonte: "Sniper", classe: "schutze", subclasse: "Sniper", nivel: 10,
    quando: "Disparo de Precisão contra alvo a 18 metros ou mais",
    texto: "Você recebe +5 na jogada de ataque.",
    efeito: () => ({ resumo: "+5 no acerto" }),
  },
];

/** Situações que a ficha tem (classe, estilo e nível batem). */
export function situacoesDaFicha(f: Ficha): Situacao[] {
  return DEFS.filter((d) => d.classe === f.classe && (!d.subclasse || d.subclasse === f.subclasse) && f.nivel >= d.nivel);
}

export const idSituacao = (id: string) => `sit:${id}`;

export interface SomaSituacao {
  cr: number;
  danoCorpo: number;
  dados: string[];
  resumos: { nome: string; resumo: string }[];
}

/** Soma o que as situações ligadas dão. */
export function somaSituacoes(f: Ficha, c: { n: number; prof: number; atr: Record<Atr, number> }): SomaSituacao {
  const out: SomaSituacao = { cr: 0, danoCorpo: 0, dados: [], resumos: [] };
  for (const s of situacoesDaFicha(f)) {
    if (!f.estado.ativas.includes(idSituacao(s.id))) continue;
    const e = s.efeito?.(c);
    if (!e) {
      out.resumos.push({ nome: s.nome, resumo: "ligada" });
      continue;
    }
    out.cr += e.cr ?? 0;
    out.danoCorpo += e.danoCorpo ?? 0;
    if (e.dados) out.dados.push(e.dados);
    out.resumos.push({ nome: s.nome, resumo: e.resumo });
  }
  return out;
}
