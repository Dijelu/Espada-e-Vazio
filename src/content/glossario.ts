export const glossario: Record<string, string> = {
  "Classe de Resistência": "CR: valor que representa a defesa da criatura. Para acertar, o atacante precisa rolar igual ou maior que a CR.",
  "Classe de Dificuldade": "CD: número que o resultado do teste precisa igualar ou superar para ter sucesso.",
  "Pontos de Vida": "PV: saúde e vigor. Ao chegar a zero, o personagem fica inconsciente e pode morrer.",
  "Pontos de Reiatsu": "PR: energia espiritual usada em habilidades, Shikai, Bankai e Kidō. Zerar deixa a criatura Esgotada.",
  "Bônus de Proficiência": "Soma-se uma única vez a testes de perícia, testes de resistência e ataques em que você é proficiente.",
  "Proficiência": "Bônus que cresce com o nível e entra nos testes em que o personagem é treinado.",
  "Vantagem": "Role dois d20 e use o maior. Vantagem e desvantagem não se acumulam.",
  "Desvantagem": "Role dois d20 e use o menor. Vantagem e desvantagem não se acumulam.",
  "Teste Resistido": "Duas partes rolam em oposição e o resultado mais alto vence.",
  "Descanso Longo": "8 horas: recupera todos os PV, PR e habilidades.",
  "Descanso Curto": "10 minutos: recupera metade dos PV e PR totais. Dois por intervalo entre descansos longos.",
  "Resistência a Dano": "Reduz pela metade o dano daquele tipo.",
  "Shikai": "Primeira liberação da Zanpakutō.",
  "Bankai": "Liberação final da Zanpakutō.",
  "Reiatsu": "Pressão espiritual; a energia que alimenta os poderes.",
  "Kidō": "Artes demoníacas: feitiços de Shinigami.",
  "Hakuda": "Combate desarmado.",
  "Zanjutsu": "Arte da espada.",
  "Agarrado": "Deslocamento 0 e sem bônus de deslocamento.",
  "Amendrontado": "Desvantagem em testes e ataques contra a fonte do medo; só se aproxima até metade do deslocamento.",
  "Atordoado": "Sem ações nem reações, move só 3 m por turno, falha em resistência de Força/Destreza; ataques contra ele têm vantagem.",
  "Caído": "Só rasteja ou se levanta; ataques contra ele têm vantagem.",
  "Congelado": "Coberto de gelo, não se move, fica Incapacitado e sofre 1d8 de dano de Frio por turno.",
  "Distorcido": "Só reúne Reiatsu até 2× o nível por ataque; habilidades acima do limite se desativam.",
  "Queimado": "Dano de Fogo no início de cada turno; acumula até 5 vezes.",
  "Eletrificado": "Condição de dano elétrico; cessa com Congelado.",
};

const termos = Object.keys(glossario).sort((a, b) => b.length - a.length);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const reGlossario = new RegExp(`\\b(${termos.map(esc).join("|")})\\b`, "gi");

export function dica(t: string): string | undefined {
  const k = termos.find((x) => x.toLowerCase() === t.toLowerCase());
  return k ? glossario[k] : undefined;
}
