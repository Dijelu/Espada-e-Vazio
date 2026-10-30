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
  { id: 'jail', nome: 'Jail', dano: 'Energia', base: 'Ataque de Técnica de Reishi: se acertar, o alvo sofre o dano de tema e fica Contido numa jaula de Reishi com 5 × proficiência de PV (CR 12 + proficiência). Ele só sai quebrando a jaula.', voll: 'Prende até 3 alvos, todos sofrem o dano de tema. A jaula tem 10 × proficiência de PV e quem está dentro tem desvantagem em salvaguardas.' },
  { id: 'power', nome: 'Power', base: 'Ação bônus: até o fim do turno, todos os seus ataques somam +2 × proficiência ao dano e +2 ao acerto.', voll: '+3 × proficiência de dano e +3 ao acerto. O primeiro acerto do turno empurra o alvo 6 m e o derruba (Força evita).' },
  { id: 'miracle', nome: 'Miracle', base: 'Schrift de Gerard Valkyrie: manipula as probabilidades. Reação: depois de qualquer jogada sua (ataque, dano, teste ou salvaguarda), refaça-a e fique com o melhor resultado. Uma jogada de ataque sua que erra por 3 ou menos acerta automaticamente.', voll: 'Também vale contra jogadas de inimigos contra você ou um aliado a até 9 m: o inimigo refaz e fica com o pior resultado. Um acerto crítico seu que falhar na salvaguarda do alvo vira acerto normal.' },
  { id: 'x-axis', nome: 'X-Axis', base: 'Schrift de Lille Barro: o seu ataque atravessa o espaço. Ação bônus: até o fim do turno, seus ataques e técnicas à distância vêm de qualquer ângulo, ignoram cobertura e obstáculos e podem atingir alvos que você não vê (desvantagem em vez de falhar). Seu primeiro ataque do turno ignora 5 + proficiência de RD e tem vantagem.', voll: 'Seus ataques atravessam o espaço por 1 minuto (ação bônus para ativar), a RD ignorada vale para todos os ataques, e você pode se reposicionar até 9 m por ataque, atravessando criaturas e paredes.' },
  { id: 'love', nome: 'The Love', dano: 'Psíquico', base: 'Uma criatura à vista faz salvaguarda de Mente: na falha sofre o dano de tema e fica Enfeitiçada por 1 minuto, sem atacar você nem seus aliados. Ela repete a salvaguarda sempre que sofrer dano.', voll: 'Atinge até 3 alvos, todos sofrem o dano de tema, e você usa a reação de cada um como quiser.' },
  { id: 'zombie', nome: 'The Zombie', base: 'Invoca 2 mortos-vivos, que duram 1 minuto. Cada um tem 1 PV e CR 10 + proficiência. No seu turno, cada morto-vivo ataca uma vez, com o seu acerto, causando proficiência d10 + proficiência de dano, e depois desmorona. Se for atingido antes de atacar, ele morre sem atacar.', voll: 'Invoca 4 mortos-vivos, e o ataque de cada um causa +proficiência de dano.' },
  { id: 'antitese', nome: 'Antítese', base: 'Libera a Troca Perfeita (veja o Capítulo 7), que inverte o que aconteceu entre dois alvos.', voll: 'O custo da Troca Perfeita cai 10 PR (mínimo 5) e a Troca de Ferimentos pode ser feita com uma reação.' },
  { id: 'balance', nome: 'The Balance', base: 'Libera o Equilíbrio (veja o Capítulo 7), que distribui a força entre você e seus aliados.', voll: 'O custo do Equilíbrio cai 10 PR (mínimo 5) e o efeito vale para todos os aliados a até 18 m.' },
  { id: 'almighty', nome: 'The Almighty', base: 'Schrift de Yhwach: vê vários futuros e escolhe qual deles acontece. Reação: um inimigo que você vê tem desvantagem na próxima jogada contra você e você ganha +proficiência na CR contra ele até o fim da rodada; você sabe, antes de agir, o que ele pretende fazer. Exclusiva de Yhwach; só por história, com a aprovação do Mestre.', voll: 'Também protege um aliado a até 9 m, e o efeito pode ser usado sem gastar a reação.' },
  { id: 'compulsory', nome: 'The Compulsory', dano: 'Energia', base: 'Ataque de Técnica de Reishi: se acertar, causa o dano de tema e nervos de Reishi prendem o alvo, que faz salvaguarda de Constituição ou perde o movimento e a reação até o fim do próximo turno dele.', voll: 'O alvo fica Paralisado em vez de só perder o movimento.' },
  { id: 'glutton', nome: 'The Glutton', dano: 'Energia', base: 'Schrift de Liltotto Lamperd: consome tudo. Ataque de Técnica de Reishi: se acertar, causa o dano de tema e você devora a energia do alvo, recuperando PR igual a 3 × proficiência. Como reação, você pode devorar um projétil, um Cero ou uma técnica lançada contra você: o dano cai à metade e você recupera PR iguais à proficiência.', voll: 'Recupera 6 × proficiência de PR. A reação anula o dano em vez de reduzir à metade. Se o alvo tiver uma técnica especial, você a usa uma vez até o fim da cena.' },
  { id: 'heat', nome: 'The Heat', dano: 'Fogo', base: 'Chamas de calor atravessam uma linha de 18 m por 3 m. Quem estiver nela faz salvaguarda de Destreza: sofre o dano de tema, ou metade no sucesso.', voll: 'Quem falhar fica Queimado, e o dano ignora a resistência a fogo.' },
  { id: 'iron', nome: 'The Iron', base: 'Schrift de Cang Du: uma pele defensiva. Reação: sua pele endurece e você ganha resistência a todo dano físico e RD igual à proficiência até o início do seu próximo turno.', voll: 'A resistência dura 1 minuto, a RD sobe para 2 × proficiência e quem acertar você em corpo a corpo sofre proficiência d10 de dano de Energia.' },
  { id: 'overkill', nome: 'The Overkill', base: 'Schrift de Driscoll Berci: cresce a cada abate. Cada inimigo que você derrubar acrescenta +proficiência em todos os danos e no acerto, até o fim da cena, acumulando até +2 × proficiência. Ao derrubar um inimigo ou acertar um crítico, você também faz um ataque imediato como reação e tem vantagem no próximo ataque.', voll: 'O acúmulo vai até +4 × proficiência, e cada abate recupera PV iguais à proficiência.' },
  { id: 'question', nome: 'The Question', dano: 'Psíquico', base: 'Uma criatura à vista faz salvaguarda de Espírito: na falha sofre o dano de tema e fica com desvantagem nos ataques por 1 minuto.', voll: 'Atinge todos os inimigos a até 9 m do alvo, e a desvantagem também vale para as salvaguardas.' },
  { id: 'roar', nome: 'The Roar', dano: 'Sônico', base: 'Grito em cone de 9 m. Quem estiver nele faz salvaguarda de Constituição: sofre o dano de tema, ou metade no sucesso. Quem falhar também fica surdo e Caído.', voll: 'Cone de 13,5 m. Quem falhar fica Atordoado por 1 rodada.' },
  { id: 'superstar', nome: 'The Superstar', base: 'Schrift de Mask de Masculin: o poder dele cresce com os fãs que o assistem. Ação bônus: ganhe PV temporários iguais a 4 × proficiência e, por 1 rodada, +1 de dano e acerto para cada 2 criaturas (aliadas ou inimigas) que estejam a até 18 m e o vejam, até o máximo de +proficiência.', voll: 'PV temporários iguais a 8 × proficiência e +3 na CR por 1 minuto, e o bônus de dano e acerto pode chegar a +2 × proficiência.' },
  { id: 'underbelly', nome: 'The Underbelly', base: 'Schrift de NaNaNa Najahkoop: detecta o ponto fraco do reiatsu de qualquer criatura. Ação bônus: marque um alvo à vista; você descobre o ponto fraco do reiatsu dele. Seu próximo ataque contra ele ignora 8 de CR, causa +proficiência d10 de dano e ignora resistências ao tipo de dano que você causa.', voll: 'O ataque ignora 15 de CR, a marca dura 1 minuto em ataques e técnicas suas e de um aliado à sua escolha.' },
  { id: 'visionary', nome: 'The Visionary', dano: 'Energia', base: 'Ação: faça uma ilusão se tornar real por 1 minuto. Pode ser um obstáculo ou parede de até 3 m, ou uma lança de ilusão: uma criatura à vista faz salvaguarda de Destreza e sofre o dano de tema (metade no sucesso).', voll: 'A criação pode ter o tamanho de uma criatura Grande, agir como você mandar e o dano de tema vale para todas as criaturas na área de 4,5 m.' },
  { id: 'wind', nome: 'The Wind', base: 'Schrift de Nianzol Weizol: evasão pura. Reação: ao ser atacado, mova-se até 6 m sem provocar ataques de oportunidade e dê desvantagem ao ataque. Se o ataque errar, o atacante fica exposto: seu próximo ataque contra ele tem vantagem.', voll: 'Mova-se até 9 m, use a reação duas vezes por rodada e, depois de se mover, faça um ataque.' },
  { id: 'yourself', nome: 'The Yourself', base: 'Schrift de Royd e Loyd Lloyd: copia a aparência, a voz e o estilo de luta de uma criatura que você viu, por 1 hora. Enquanto estiver copiando, por 1 minuto, o primeiro ataque de cada turno seu, corpo a corpo ou à distância, tem vantagem e causa +proficiência d10 de dano, usando o estilo dela.', voll: 'Também copia 1 técnica que ela mostrou, e o bônus de dano passa a 2 × proficiência d10. Se a criatura copiada for aliada ou inimiga, você usa a CR e o deslocamento dela se forem melhores.' },
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
