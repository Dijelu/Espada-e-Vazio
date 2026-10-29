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
];

export const NIVEL_SCHRIFT = 10;

const temSchrift = (f: Pick<Ficha, "classe">) => f.classe === "schutze" || f.classe === "ritter";

/** A Schrift chega no 10º nível e ainda não foi escolhida. */
export const schriftPendente = (f: Pick<Ficha, "classe" | "nivel" | "schrift">) => temSchrift(f) && f.nivel >= NIVEL_SCHRIFT && !f.schrift;

export const schriftDaFicha = (f: Pick<Ficha, "classe" | "nivel" | "schrift">) =>
  temSchrift(f) && f.nivel >= NIVEL_SCHRIFT ? SCHRIFTS.find((s) => s.id === f.schrift) : undefined;

/** Dano do poder de tema, já com a proficiência. */
export const danoSchrift = (prof: number, voll: boolean) => (voll ? `${prof}d10+${prof}` : `${prof}d8`);
