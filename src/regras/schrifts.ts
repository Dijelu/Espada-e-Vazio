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
  { id: 'explosion', nome: 'Explosion', dano: 'Fogo', base: 'Uma explosão de Reishi detona num ponto à sua escolha, com 4,5 m de raio. Quem estiver na área faz salvaguarda de Destreza: sofre o dano de tema, ou metade no sucesso.', voll: 'Raio de 7,5 m. Quem falhar fica Queimado, e o dano ignora a resistência a fogo.' },
  { id: 'thunderbolt', nome: 'Thunderbolt', dano: 'Elétrico', base: 'Um raio atravessa uma linha de 18 m por 1,5 m. Quem estiver nela faz salvaguarda de Destreza: sofre o dano de tema, ou metade no sucesso. Quem falhar não usa reações até o início do próximo turno.', voll: 'A linha vai a 27 m. Quem falhar fica Eletrificado, e o raio salta para outra criatura a até 9 m, que sofre metade do dano.' },
  { id: 'deathdealing', nome: 'The Deathdealing', dano: 'Energia', base: 'Ataque de Técnica de Reishi à distância que causa o dano de tema. Contra uma criatura com menos da metade dos PV, o dano dobra.', voll: 'O dano também dobra contra criatura Atordoada, Presa ou Caída. Se o alvo tiver menos de um quarto dos PV, o acerto o derruba a 0 PV.' },
  { id: 'fear', nome: 'Fear', dano: 'Psíquico', base: 'Uma criatura à vista faz salvaguarda de Espírito: na falha sofre o dano de tema e fica Amedrontada por 1 minuto, repetindo a salvaguarda no fim de cada turno dela.', voll: 'Atinge todos os inimigos a até 9 m do alvo. Quem falhar também tem desvantagem na salvaguarda seguinte.' },
  { id: 'jail', nome: 'Jail', base: 'Ataque de Técnica de Reishi: se acertar, o alvo fica Contido numa jaula de Reishi com 5 × proficiência de PV (CR 12 + proficiência). Ele só sai quebrando a jaula.', voll: 'Prende até 3 alvos. A jaula tem 10 × proficiência de PV e quem está dentro tem desvantagem em salvaguardas.' },
  { id: 'power', nome: 'Power', base: 'Ação bônus: até o fim do turno, todos os seus ataques somam +2 × proficiência ao dano e +2 ao acerto.', voll: '+3 × proficiência de dano e +3 ao acerto. O primeiro acerto do turno empurra o alvo 6 m e o derruba (Força evita).' },
  { id: 'miracle', nome: 'Miracle', base: 'Reação: depois de qualquer jogada sua (ataque, dano, teste ou salvaguarda), refaça-a e fique com o melhor resultado.', voll: 'Também vale contra jogadas de inimigos contra você ou um aliado a até 9 m: o inimigo refaz e fica com o pior resultado.' },
  { id: 'x-axis', nome: 'X-Axis', base: 'Ação bônus: teletransporte-se até 9 m para um espaço que veja, sem provocar ataques de oportunidade. O seu próximo ataque do turno tem vantagem.', voll: 'Até 18 m, levando 1 aliado adjacente. A vantagem vale para todos os ataques do turno.' },
  { id: 'love', nome: 'The Love', base: 'Uma criatura à vista faz salvaguarda de Mente: na falha fica Enfeitiçada por 1 minuto e não ataca você nem seus aliados. Ela repete a salvaguarda sempre que sofrer dano.', voll: 'Atinge até 3 alvos, e você pode usar a reação de cada um como quiser.' },
  { id: 'zombie', nome: 'The Zombie', base: 'Invoca 1 morto-vivo por 1 minuto (PV 5 × nível, CR 10 + proficiência). Ele ataca no seu turno com o seu acerto e causa proficiência d10 + proficiência de dano.', voll: 'Invoca 3 mortos-vivos.' },
  { id: 'antitese', nome: 'Antítese', base: 'Libera a Troca Perfeita (veja o Capítulo 7), que inverte o que aconteceu entre dois alvos.', voll: 'O custo da Troca Perfeita cai 10 PR (mínimo 5) e a Troca de Ferimentos pode ser feita com uma reação.' },
  { id: 'balance', nome: 'The Balance', base: 'Libera o Equilíbrio (veja o Capítulo 7), que distribui a força entre você e seus aliados.', voll: 'O custo do Equilíbrio cai 10 PR (mínimo 5) e o efeito vale para todos os aliados a até 18 m.' },
  { id: 'almighty', nome: 'The Almighty', base: 'Reação: um inimigo que você vê tem desvantagem na próxima jogada contra você e você ganha +proficiência na CR contra ele até o fim da rodada. Exclusiva de Yhwach; só por história, com a aprovação do Mestre.', voll: 'Também protege um aliado a até 9 m, e o efeito pode ser usado sem gastar a reação.' },
  { id: 'compulsory', nome: 'The Compulsory', dano: 'Energia', base: 'Ataque de Técnica de Reishi: se acertar, causa o dano de tema e nervos de Reishi prendem o alvo, que faz salvaguarda de Constituição ou perde o movimento e a reação até o fim do próximo turno dele.', voll: 'O alvo fica Paralisado em vez de só perder o movimento.' },
  { id: 'glutton', nome: 'The Glutton', dano: 'Energia', base: 'Ataque de Técnica de Reishi: se acertar, causa o dano de tema e você devora a energia do alvo, recuperando PR igual a 3 × proficiência.', voll: 'Recupera 6 × proficiência de PR. Se o alvo tiver uma técnica especial, você a usa uma vez até o fim da cena.' },
  { id: 'heat', nome: 'The Heat', dano: 'Fogo', base: 'Chamas de calor atravessam uma linha de 18 m por 3 m. Quem estiver nela faz salvaguarda de Destreza: sofre o dano de tema, ou metade no sucesso.', voll: 'Quem falhar fica Queimado, e o dano ignora a resistência a fogo.' },
  { id: 'iron', nome: 'The Iron', base: 'Reação: a sua pele endurece e você ganha resistência a todo dano físico até o início do seu próximo turno.', voll: 'A resistência dura 1 minuto. Quem acertar você em corpo a corpo sofre proficiência d10 de dano de Energia.' },
  { id: 'overkill', nome: 'The Overkill', base: 'Ao derrubar um inimigo, você ganha +2 × proficiência em todos os danos até o fim do seu próximo turno e faz um ataque imediato.', voll: 'O bônus dura 1 minuto e acumula até +4 × proficiência.' },
  { id: 'question', nome: 'The Question', dano: 'Psíquico', base: 'Uma criatura à vista faz salvaguarda de Espírito: na falha sofre o dano de tema e fica com desvantagem nos ataques por 1 minuto.', voll: 'Atinge todos os inimigos a até 9 m do alvo, e a desvantagem também vale para as salvaguardas.' },
  { id: 'roar', nome: 'The Roar', dano: 'Sônico', base: 'Grito em cone de 9 m. Quem estiver nele faz salvaguarda de Constituição: sofre o dano de tema, ou metade no sucesso. Quem falhar também fica surdo e Caído.', voll: 'Cone de 13,5 m. Quem falhar fica Atordoado por 1 rodada.' },
  { id: 'superstar', nome: 'The Superstar', base: 'Ação bônus: ganhe PV temporários iguais a 4 × proficiência e +2 na CR por 1 rodada, alimentados por quem assiste.', voll: 'PV temporários iguais a 8 × proficiência e +3 na CR por 1 minuto.' },
  { id: 'underbelly', nome: 'The Underbelly', base: 'Ação bônus: marque um alvo e descubra o ponto fraco do reiatsu dele. Seu próximo ataque contra ele ignora 8 de CR e causa +proficiência d10 de dano.', voll: 'O ataque ignora 15 de CR e o bônus vale para um aliado também.' },
  { id: 'visionary', nome: 'The Visionary', base: 'Ação: faça uma ilusão se tornar real por 1 minuto (um objeto, uma parede ou um obstáculo de até 3 m, a critério do Mestre).', voll: 'A criação pode ter o tamanho de uma criatura Grande e agir como você mandar.' },
  { id: 'wind', nome: 'The Wind', base: 'Reação: ao ser atacado, mova-se até 6 m sem provocar ataques de oportunidade e dê desvantagem ao ataque.', voll: 'Mova-se até 9 m, use a reação duas vezes por rodada e, depois de se mover, faça um ataque.' },
  { id: 'yourself', nome: 'The Yourself', base: 'Ação: assuma a aparência e a voz de uma criatura que você viu, por 1 hora.', voll: 'Também copia 1 técnica que ela mostrou, por 1 minuto.' },
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
  if (voll) return { nome: "Completa", alcance: 27, usos: 3, texto: "Alcance e área 50% maiores, 3 usos por cena e o efeito da Vollständig vale." };
  if (nivel <= 12) return { nome: "Despertando", alcance: 9, usos: 1, texto: "Efeito reduzido: alcance, área e duração pela metade (arredonde para cima)." };
  if (nivel <= 16) return { nome: "Dominada", alcance: 13.5, usos: 2, texto: "Efeito quase completo: alcance e área em 75%, e a duração normal." };
  return { nome: "Plena", alcance: 18, usos: 2, texto: "Efeito completo fora da Vollständig." };
}

/** Dano do poder de tema, já com a proficiência: fraco no 10º nível, cresce e fica completo com a Vollständig. */
export function danoSchrift(prof: number, voll: boolean, nivel = 20) {
  if (voll) return `${prof * 4}d10+${prof * 2}`;
  if (nivel <= 12) return `${prof}d10`;
  if (nivel <= 16) return `${prof * 2}d10`;
  return `${prof * 3}d10+${prof}`;
}

export const CUSTO_SCHRIFT = 10;
