/* Schrift do mangá (Quincy, a partir do 10º nível) e como elas reforçam a Vollständig. */
import type { Ficha } from "./ficha";

export interface Schrift {
  id: string;
  nome: string;
  /** tipo de dano de tema; vazio nas Schrift sem dano */
  dano?: string;
  /** poder de tema */
  base: string;
  /** efeito a mais com a Vollständig ativa */
  voll: string;
}

export const SCHRIFTS: Schrift[] = [
  { id: "explosion", nome: "Explosion", dano: "Fogo", base: "Explosão de 3 m de raio. Destreza evita metade.", voll: "Raio de 4,5 m e a condição Queimado." },
  { id: "thunderbolt", nome: "Thunderbolt", dano: "Elétrico", base: "Raio em linha de 18 m. Destreza evita metade.", voll: "A condição Eletrificado." },
  { id: "deathdealing", nome: "The Deathdealing", dano: "Energia", base: "O dano dobra contra criatura com menos da metade dos PV.", voll: "Também dobra contra criatura Atordoada." },
  { id: "fear", nome: "Fear", dano: "Psíquico", base: "O alvo faz Teste de Espírito ou fica Amedrontado por 1 rodada.", voll: "Atinge criaturas a até 9 m do alvo." },
  { id: "jail", nome: "Jail", base: "Ataque: se acertar, o alvo fica Preso numa jaula de Reishi.", voll: "Atinge 2 alvos; a jaula tem 5 × proficiência de PV." },
  { id: "power", nome: "Power", base: "Ação bônus: +proficiência ao dano corpo a corpo até o fim do turno.", voll: "Também +2 em testes de Força e empurra o alvo 3 m." },
  { id: "miracle", nome: "Miracle", base: "Refaça uma jogada sua e use a nova.", voll: "Duas vezes por cena; pode obrigar um inimigo a refazer uma jogada." },
  { id: "x-axis", nome: "X-Axis", base: "Reposicione-se até 9 m, como ação bônus.", voll: "18 m, levando 1 aliado adjacente." },
  { id: "love", nome: "The Love", base: "O alvo faz Teste de Mente ou fica Enfeitiçado por 1 rodada.", voll: "Até 3 alvos, por 1 minuto." },
  { id: "zombie", nome: "The Zombie", base: "Invoca 1 morto-vivo por 1 minuto (PV 5 × nível, CR 10 + proficiência).", voll: "Invoca 2 mortos-vivos." },
  { id: "antitese", nome: "Antítese", base: "Troca Perfeita (veja o Capítulo 7).", voll: "O custo da Troca Perfeita cai 5 PR (mínimo 5)." },
  { id: "balance", nome: "The Balance", base: "Equilíbrio (veja o Capítulo 7).", voll: "O custo do Equilíbrio cai 5 PR (mínimo 5)." },
  { id: "almighty", nome: "The Almighty", base: "Reação: um inimigo que você vê tem desvantagem na próxima jogada contra você. Exclusiva de Yhwach; só por história, com a aprovação do Mestre.", voll: "Também vale para um aliado a até 9 m, duas vezes por cena." },
  { id: "compulsory", nome: "The Compulsory", dano: "Energia", base: "Ataque: se acertar, nervos de Reishi prendem o alvo, que faz Teste de Constituição ou perde o movimento por 1 rodada.", voll: "O alvo fica Paralisado em vez de só perder o movimento." },
  { id: "glutton", nome: "The Glutton", base: "Ataque: se acertar, você devora um pouco da energia do alvo e recupera PR igual a 2 × proficiência.", voll: "Recupera PR igual a 4 × proficiência; se o alvo tiver técnica especial, você a usa uma vez até o fim da cena." },
  { id: "heat", nome: "The Heat", dano: "Fogo", base: "Chamas de calor em linha de 18 m. Destreza evita metade.", voll: "Também a condição Queimado e o dano ignora resistência a fogo." },
  { id: "iron", nome: "The Iron", base: "Reação: sua pele endurece e você ganha resistência a um tipo de dano físico até o início do seu próximo turno.", voll: "Resistência a todo dano físico por 1 minuto; a pele também causa dano ao atacante corpo a corpo." },
  { id: "overkill", nome: "The Overkill", base: "Ao derrubar um inimigo, a próxima jogada de dano do seu turno ganha +proficiência.", voll: "O bônus vale por 1 minuto e acumula até +2 × proficiência." },
  { id: "question", nome: "The Question", dano: "Psíquico", base: "O alvo faz Teste de Espírito ou fica com dúvida: desvantagem no próximo ataque dele.", voll: "Atinge criaturas a até 9 m do alvo e a desvantagem vale por 1 minuto." },
  { id: "roar", nome: "The Roar", dano: "Sônico", base: "Grito em cone de 9 m. Constituição evita metade e quem falhar não ouve até o fim do próximo turno.", voll: "Cone de 13,5 m e quem falhar fica Atordoado por 1 rodada." },
  { id: "superstar", nome: "The Superstar", base: "Ação bônus: ganhe PV temporários iguais a 2 × proficiência, alimentados por quem assiste.", voll: "PV temporários iguais a 4 × proficiência e +2 na CR por 1 rodada." },
  { id: "underbelly", nome: "The Underbelly", base: "Ação bônus: marque um alvo e descubra o ponto fraco do reiatsu dele; seu próximo ataque contra ele ignora 5 de CR.", voll: "O ataque ignora 10 de CR e vale para um aliado também." },
  { id: "visionary", nome: "The Visionary", base: "Ação: faça uma ilusão se tornar real por 1 rodada (objeto ou obstáculo pequeno, a critério do Mestre).", voll: "A criação dura 1 minuto e pode ser do tamanho de uma criatura Média." },
  { id: "wind", nome: "The Wind", base: "Reação: ao ser atacado, mova-se até 3 m sem provocar ataques de oportunidade e dê desvantagem ao ataque.", voll: "Mova-se até 6 m e use a reação duas vezes por cena." },
  { id: "yourself", nome: "The Yourself", base: "Ação: assuma a aparência e a voz de uma criatura que você viu, por 1 hora.", voll: "Também copia 1 técnica que ela mostrou, por 1 minuto." },
];

export const NIVEL_SCHRIFT = 10;

const temSchrift = (f: Pick<Ficha, "classe">) => f.classe === "schutze" || f.classe === "ritter";

/** A Schrift chega no 10º nível e ainda não foi escolhida. */
export const schriftPendente = (f: Pick<Ficha, "classe" | "nivel" | "schrift">) => temSchrift(f) && f.nivel >= NIVEL_SCHRIFT && !f.schrift;

export const schriftDaFicha = (f: Pick<Ficha, "classe" | "nivel" | "schrift">) =>
  temSchrift(f) && f.nivel >= NIVEL_SCHRIFT ? SCHRIFTS.find((s) => s.id === f.schrift) : undefined;

/** A Schrift cresce com o nível e fica completa com a Vollständig ativa. */
export interface EstagioSchrift {
  nome: string;
  /** alcance do poder de tema, em metros */
  alcance: number;
  /** usos por cena */
  usos: number;
  /** quanto do efeito vale (para os poderes sem dano): reduzido pela metade no começo */
  texto: string;
}
export function estagioSchrift(nivel: number, voll: boolean): EstagioSchrift {
  if (voll) return { nome: "Completa", alcance: 27, usos: 2, texto: "Alcance e área 50% maiores e o efeito adicional vale." };
  if (nivel <= 12) return { nome: "Despertando", alcance: 9, usos: 1, texto: "Efeito reduzido: alcance, área e duração pela metade (arredonde para cima)." };
  if (nivel <= 16) return { nome: "Dominada", alcance: 13.5, usos: 1, texto: "Efeito quase completo: alcance e área em 75%, e a duração normal." };
  return { nome: "Plena", alcance: 18, usos: 1, texto: "Efeito completo fora da Vollständig." };
}

/** Dano do poder de tema, já com a proficiência: fraco no 10º nível, cresce e fica completo com a Vollständig. */
export function danoSchrift(prof: number, voll: boolean, nivel = 20) {
  if (voll) return `${prof}d10+${prof}`;
  if (nivel <= 12) return `${Math.max(1, Math.floor(prof / 2))}d8`;
  if (nivel <= 16) return `${Math.max(1, Math.floor(prof * 0.75))}d8`;
  return `${prof}d8`;
}

export const CUSTO_SCHRIFT = 10;
