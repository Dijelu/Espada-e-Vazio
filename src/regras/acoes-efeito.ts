/* Efeitos dos cartões de ação sem dano: o cartão de Reação com efeito escolhido e o cartão de Ação sem dano (controle, marca e utilidade).
   O jogador escolhe o efeito numa lista; o texto do efeito vira a regra da habilidade. O PR é o fixo do ritmo (ver cartoes.ts).
   Só tipos (import type) vêm de cartoes, para não fazer ciclo. Os textos evitam as frases que o leitor de habilidades usa para achar cura ou redução de dano. */
import type { SubAcao } from "./cartoes";
import type { CaracArmaId } from "./arma-forma";

/** Grupos do cartão de ação sem dano. */
export type GrupoSemDano = "controle" | "marca" | "utilidade";

export interface EfeitoAcao {
  id: string;
  nome: string;
  texto: string;
  /** só no cartão de ação sem dano */
  grupo?: GrupoSemDano;
  /** características da arma de que o efeito precisa (basta uma). Sem o campo, qualquer arma serve. */
  armaReq?: CaracArmaId[];
}

export const GRUPOS_SEM_DANO: { id: GrupoSemDano; nome: string; sobre: string }[] = [
  { id: "controle", nome: "Controle", sobre: "Prende, assusta ou cala um alvo." },
  { id: "marca", nome: "Marca", sobre: "Marca um alvo para você e os aliados." },
  { id: "utilidade", nome: "Utilidade", sobre: "Ajuda você e os aliados a se mover, se proteger ou enxergar." },
];

/** Efeitos do cartão de Reação com efeito escolhido. */
export const EFEITOS_REACAO: EfeitoAcao[] = [
  { id: "anular", nome: "Anular técnica", texto: "Quando uma técnica, um kidō ou um ataque à distância mira você ou um aliado a até 3 metros, quem o usou faz uma salvaguarda de Espírito (CD 8 + proficiência + atributo). Se falhar, a técnica é anulada e não causa nada." },
  { id: "trocar", nome: "Trocar de lugar", texto: "Você troca de lugar com um aliado a até 9 metros. O ataque que ia atingir um dos dois atinge o outro." },
  { id: "redirecionar", nome: "Redirecionar o ataque", texto: "Um ataque contra você muda de alvo: outra criatura a até 3 metros de você passa a ser o alvo, com um novo teste de acerto." },
  { id: "esquivar", nome: "Passo de esquiva", texto: "Você se move até 6 metros sem provocar ataques de oportunidade, e o ataque contra você sofre desvantagem no teste de acerto." },
  { id: "travar", armaReq: ["corrente", "segmentavel", "contato", "pesada", "escudo"], nome: "Travar o atacante", texto: "Quando uma criatura a até 3 metros ataca você, ela faz uma salvaguarda de Força (CD 8 + proficiência + atributo). Se falhar, fica Preso até o início do próximo turno dela e o ataque erra." },
  { id: "absorver", nome: "Absorver reiatsu", texto: "Você absorve parte da técnica que atinge você e ganha PR extras iguais à sua proficiência. Funciona uma vez por turno." },
];

/** Efeitos do cartão de Ação sem dano (controle, marca e utilidade). */
export const EFEITOS_SEM_DANO: EfeitoAcao[] = [
  { id: "conter", armaReq: ["corrente", "segmentavel", "enxame", "invocada", "foco"], grupo: "controle", nome: "Contenção", texto: "Uma criatura a até 18 metros faz uma salvaguarda de Força (CD 8 + proficiência + atributo). Se falhar, fica Preso até o fim do próximo turno dela." },
  { id: "pavor", grupo: "controle", nome: "Pavor", texto: "Uma criatura a até 18 metros faz uma salvaguarda de Mente (CD 8 + proficiência + atributo). Se falhar, fica Amedrontada até o fim do próximo turno dela." },
  { id: "silencio", grupo: "controle", nome: "Silêncio espiritual", texto: "Uma criatura a até 18 metros faz uma salvaguarda de Espírito (CD 8 + proficiência + atributo). Se falhar, não pode usar técnicas que gastem PR até o fim do próximo turno dela." },
  { id: "marca-caca", grupo: "marca", nome: "Marca de caça", texto: "Marca uma criatura a até 18 metros até o fim da cena. Você sempre sabe onde ela está, e o primeiro ataque seu em cada turno contra ela soma +2 no teste de acerto." },
  { id: "marca-reveladora", grupo: "marca", nome: "Marca reveladora", texto: "Marca uma criatura a até 18 metros até o fim da cena. Ela não consegue ficar invisível nem escondida de você, e os aliados somam +1 no primeiro ataque do turno contra ela." },
  { id: "impulso", grupo: "utilidade", nome: "Impulso", texto: "Você ou um aliado a até 9 metros se move até o dobro do deslocamento, sem provocar ataques de oportunidade." },
  { id: "veu", armaReq: ["escudo", "elemental", "invocada"], grupo: "utilidade", nome: "Véu de reiatsu", texto: "Você ou um aliado a até 9 metros ganha +2 de CR até o início do seu próximo turno." },
  { id: "luz", armaReq: ["elemental", "foco", "invocada"], grupo: "utilidade", nome: "Luz espiritual", texto: "Uma luz de reiatsu ilumina uma área de 18 metros por 1 minuto e deixa à mostra as criaturas invisíveis dentro dela." },
];

/** Os cartões de ação que escolhem o efeito numa lista. */
export const SUBS_COM_EFEITO: SubAcao[] = ["reacao", "utilidade"];
export const temEfeitoEscolhido = (sub: SubAcao | string | undefined): boolean => sub === "reacao" || sub === "utilidade";

/** Efeitos que o cartão aceita (o de reação, ou os do grupo escolhido no cartão de ação sem dano). */
export function efeitosDoCartao(sub: SubAcao, grupo?: GrupoSemDano): EfeitoAcao[] {
  if (sub === "reacao") return EFEITOS_REACAO;
  return grupo ? EFEITOS_SEM_DANO.filter((e) => e.grupo === grupo) : EFEITOS_SEM_DANO;
}

/** O efeito escolhido (se o id não existir mais, vale o primeiro da lista, para um arquivo estranho não quebrar a tela). */
export function efeitoDaAcao(sub: SubAcao, id?: string): EfeitoAcao {
  const lista = efeitosDoCartao(sub);
  return lista.find((e) => e.id === id) ?? lista[0];
}
