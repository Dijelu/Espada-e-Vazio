/* Habilidades que só valem em certas situações. Viram cartas no Resumo, com um botão para ligar e desligar.
   Quando ligadas, os números que dá para somar entram na ficha. */
import type { Ficha, Atr } from "./ficha";
import talentosJson from "./talentos.json";
import { CARTAS } from "./talentos-efeitos";

export interface Ctx {
  n: number;
  prof: number;
  atr: Record<Atr, number>;
}

export interface Efeito {
  cr?: number;
  danoCorpo?: number;
  /** dados extras de dano, ex.: "2d8" */
  dados?: string;
  /** soma no acerto de ataques corpo a corpo */
  acertoCorpo?: number;
  /** soma no acerto de ataques à distância */
  acertoDist?: number;
  /** dano e acerto em todos os ataques (corpo a corpo e à distância) */
  danoGeral?: number;
  acertoGeral?: number;
  desloc?: number;
  resumo: string;
}

export interface Situacao {
  id: string;
  nome: string;
  fonte: string;
  /** a situação em que vale, em poucas palavras */
  quando: string;
  texto: string;
  /** o que entra nos números da ficha enquanto estiver ligada */
  efeito?: (c: Ctx) => Efeito;
}

interface Def extends Situacao {
  classe: string;
  subclasse?: string;
  nivel: number;
}

type Fn = (c: Ctx) => Efeito;
const D = (classe: string, subclasse: string | undefined, nivel: number, id: string, nome: string, quando: string, texto: string, efeito?: Fn): Def => ({
  classe, subclasse, nivel, id, nome, fonte: subclasse ?? classe.charAt(0).toUpperCase() + classe.slice(1), quando, texto, efeito,
});
const ZJ = "zanjutsu", HK = "hakuda", KD = "kidoshu", KY = "kyugo", SC = "schutze", RT = "ritter", HU = "hueco", VZ = "vazio";

/** dados de Precisão da Lâmina de Reishi (Energia), pelo nível */
const dadosPrecisao = (n: number, prof: number) => (n <= 14 ? `${prof}d6` : n <= 16 ? "1d6" : n <= 19 ? "2d6" : "3d6");
/** dano de Energia do Shunko por golpe, pelo nível */
const dadosShunko = (n: number) => (n <= 5 ? "1d10" : n <= 9 ? "2d10" : n <= 19 ? "6d10" : "4d10");
const dadoApoio = (n: number) => (n >= 19 ? "1d12" : n >= 16 ? "1d10" : n >= 12 ? "1d8" : n >= 8 ? "1d6" : "1d4");

const DEFS: Def[] = [
  /* ---- Zanjutsu ---- */
  D(ZJ, undefined, 1, "impacto-de-reiatsu", "Impacto de Reiatsu", "Ao acertar com a Zanpakutou, ação bônus e 4 PR",
    "Causa 2d8 de Energia a mais. Cada 2 PR a mais somam 1d8, até 6d8 no total.", () => ({ dados: "2d8", resumo: "+2d8 de Energia (mais 1d8 por 2 PR extras, até 6d8)" })),
  D(ZJ, "Forja Espiritual", 6, "vinculo-espiritual", "Vínculo Espiritual", "Sem a Shikai liberada", "Use uma técnica da Shikai sem liberá-la. Pode trocar a técnica a cada nível novo."),
  D(ZJ, "Ryoka", 3, "ryodan", "Técnica: Ryodan", "Ação, 8 PR", "Ataque com a Asauchi: 5d10 + Força de dano cortante. Não combina com Impacto de Reiatsu. +1d10 por 3 PR extras, no máximo Espírito dados."),
  D(ZJ, "Ryoka", 3, "hozuri", "Técnica: Hozuri", "Ação, 10 PR", "Ataque: 5d10 + Força. O alvo faz salvaguarda de Constituição ou fica com CR −5 até o fim do próximo turno dele."),
  D(ZJ, "Ryoka", 6, "restricao-reiatsu", "Restrição de Reiatsu", "Depois de 2 turnos contra a mesma criatura", "Sele metade do seu reiatsu e libere com ação bônus para recuperá-lo. Uma vez por descanso longo."),
  D(ZJ, "Ryoka", 15, "caveira-espectral", "Caveira Espectral", "Ao usar Liberar Reiatsu", "Quem falhar na salvaguarda fica paralisado e sofre 8d10 + Espírito de dano psíquico (metade se passar)."),
  D(ZJ, "Colosso", 6, "pele-de-aco", "Pele de Aço", "No início do seu turno, ação livre e 4 PR", "Você fica resistente a dano físico até o início do próximo turno. No 15º nível vale para todo dano, menos Temporal e Psíquico."),
  D(ZJ, "Colosso", 6, "determinacao-colosso", "Determinação do Colosso", "Teste de Força ou Constituição", "Gaste 1d6 PR para fazer o teste com vantagem e somar o resultado do d6."),
  D(ZJ, "Colosso", 13, "carga-energetica", "Carga Energética", "Reação, ao ser atingido", "Converta o dano sofrido em energia (até 2 × nível) para Ataque Revestido, Destruição de Campo ou Revestimento Corporal. Você ainda sofre o dano."),

  /* ---- Hakuda ---- */
  D(HK, undefined, 1, "bloqueio", "Bloqueio", "Reação, ao ser atingido", "Reduz o dano de cada ataque pela metade da sua Destreza ou Força, até o início do próximo turno.", (c) => ({ resumo: `reduz ${Math.floor(Math.max(c.atr.des, c.atr.for) / 2)} de cada ataque` })),
  D(HK, undefined, 1, "continuacao", "Continuação", "Depois da ação Atacar", "Com a ação bônus, faça um ataque desarmado."),
  D(HK, undefined, 1, "desestabilizar", "Desestabilizar", "Depois de acertar corpo a corpo, ação bônus", "Salvaguarda de Constituição (CD 8 + proficiência + Força ou Destreza, a maior) ou o alvo é desestabilizado."),
  D(HK, undefined, 2, "shunpo-veloz", "Shunpo Veloz", "Ao usar o Shunpo Aprimorado, ação bônus", "Dobra a distância do Shunpo."),
  D(HK, "Caminho do Shunko", 3, "shunko-ativo", "Shunko ativo", "Com o Shunko liberado, nos golpes desarmados", "Cada golpe causa dano de Energia extra pelo seu nível.", (c) => ({ dados: dadosShunko(c.n), resumo: `+${dadosShunko(c.n)} de Energia por golpe desarmado` })),
  D(HK, "Caminho Híbrido", 6, "shunko-ativo-hibrido", "Shunko ativo", "Com o Shunko liberado, nos golpes desarmados", "Cada golpe causa dano de Energia extra pelo seu nível.", (c) => ({ dados: dadosShunko(c.n), resumo: `+${dadosShunko(c.n)} de Energia por golpe desarmado` })),
  D(HK, "Caminho do Shunko", 10, "sombra-veloz", "Sombra Veloz", "Ao reduzir uma criatura a 0 PV com golpe desarmado", "Faça imediatamente um ataque corpo a corpo adicional contra outra criatura."),
  D(HK, "Caminho do Shunko", 15, "destruidor-de-escudos", "Destruidor de Escudos", "Golpes desarmados e técnicas do Shunko", "Ignora resistência e imunidade ao dano."),
  D(HK, "Caminho do Guerreiro", 3, "ataque-livre", "Ataque Livre", "Ao usar uma técnica da Zanpakutou", "Faça um ataque desarmado com ação livre contra uma criatura ao alcance."),
  D(HK, "Caminho do Guerreiro", 6, "intercalar", "Intercalar", "Depois de atacar com a Zanpakutou", "Use uma Técnica de Hakuda com requisito Combo no próximo ataque, por metade do PR e com +1 dado de dano."),
  D(HK, "Caminho do Guerreiro", 15, "impacto-ininterrupto", "Impacto Ininterrupto", "Reação, ao acertar corpo a corpo", "Use uma Técnica de Hakuda com requisito Ação."),
  D(HK, "Caminho do Guerreiro", 20, "lamina-e-punho", "Lâmina e Punho", "Bankai ativa; ao acertar corpo a corpo", "Técnicas de Hakuda e da Zanpakutou custam metade. O alvo fica com −5 nas salvaguardas contra suas técnicas até o fim do seu próximo turno."),
  D(HK, "Caminho do Punho", 6, "espirito-combatente", "Espírito Combatente", "Ao usar uma Técnica de Hakuda", "Gaste o custo de reiatsu de novo para criar um espectro de reiatsu em forma de animal."),

  /* ---- Kidōshū ---- */
  D(KD, "Mago", 3, "convergencia-elemental", "Convergência Elemental", "Hadō de dano esotérico que acerta", "Cria uma Marca Elemental. Cada marca gasta num Hadō seguinte soma +5 de dano Temporal. Com 4 marcas, todo o dano vira Temporal e não pode ser reduzido."),
  D(KD, "Mago", 6, "contra-feitico", "Contra Feitiço", "Reação, outro conjurador a 9 m tenta lançar Kido", "Use o Bakudō 31 (Kido Shoumei) para dissipar o Kido. Rank D é dissipado na hora; rank C ou mais exige disputa de acerto."),
  D(KD, "Mago", 10, "alteracao-de-kido", "Alteração de Kido", "Ao conjurar Hadō de dano esotérico", "Gaste o custo de 2 aprimoramentos para trocar o tipo de dano. Gera uma Marca extra e dá +2 no acerto (ou +5 de dano se for automático).", () => ({ resumo: "+2 no acerto do Hadō" })),
  D(KD, "Mago", 20, "mago-supremo", "Mago Supremo", "Primeiro Hadō ou Bakudō do turno", "Não custa reiatsu. Se aprimorá-lo, paga só o aprimoramento."),
  D(KD, "Sacerdote", 3, "selos-sagrados", "Selos Sagrados", "Liberar um selo em combate", "Conjura o Kido gravado sem gastar reiatsu, como encantamento rápido. Acerto e dano com vantagem; quem resiste faz a salvaguarda com desvantagem."),
  D(KD, "Sacerdote", 6, "construtor", "Construtor", "Ação, ponto a até 18 m", "Cria uma barreira de até 6 m de lado. PV e RD dependem do tempo de preparação."),
  D(KD, "Sacerdote", 6, "guilhotina", "Guilhotina", "Ação ou Kido Extra, 5 PR", "Barreira cúbica ataca uma criatura a até 18 m com jogada de acerto de Kido. Pode gastar 2 PR por +1d10."),
  D(KD, "Sacerdote", 20, "mestre-dos-selos", "Mestre dos Selos", "Ao liberar um selo", "Role 1d4: com 4, o selo não é gasto."),
  D(KD, "Lâmina Espiritual", 3, "uniao", "União", "Ação livre", "Manifesta uma lâmina de reiatsu como sua Zanpakutou (forma normal ou Shikai) e usa Mente no lugar do atributo de ataque."),
  D(KD, "Lâmina Espiritual", 6, "lamina-e-kido", "Lâmina e Kido", "Ao usar um Kido como parte da ação", "Ataque bônus com a Zanpakutou somando Mente ao dano (e +2 × proficiência a partir do 10º nível)."),
  D(KD, "Lâmina Espiritual", 15, "liberacao-perfeita", "Liberação Perfeita", "Liberar a Bankai", "Ação livre, sem verbalizar o nome, mesmo sob condição."),
  D(KD, "Bibliotecário", 3, "conhecimento-replicado", "Conhecimento Replicado", "Reação, uma criatura usa Hadō ou Bakudō à vista", "Teste de Mente (CD 10 + 2 por rank do Kido) para aprender o Kido."),
  D(KD, "Bibliotecário", 6, "leitura-espiritual", "Leitura Espiritual", "Reação, criatura usa técnica que exige teste", "Substitui o teste por um de Conhecimento (ou salvaguarda pelo de Conhecimento)."),

  /* ---- Kyūgo ---- */
  D(KY, "Curandeiro", 3, "kido-de-cura", "Kido de Cura (Kaido)", "Para curar", "Cura Ágil, Menor, Focada, Maior, Dupla, Completa ou Massiva. Pague o custo de novo para dobrar os dados e o valor fixo da cura."),
  D(KY, "Curandeiro", 6, "cura-de-reiatsu", "Cura de Reiatsu", "Ao usar um Kido de Cura", "Em vez de PV, cure os pontos de reiatsu da criatura (não os seus)."),
  D(KY, "Curandeiro", 15, "maestria-em-kaido", "Maestria em Kaido", "Qualquer Kido de Cura", "Você cura sempre o valor máximo possível.", () => ({ resumo: "cura no máximo" })),
  D(KY, "Curandeiro", 20, "kaido-supremo", "Kaido Supremo", "Ação completa, 100 PR", "Ressuscita uma criatura que morreu há menos de um dia."),
  D(KY, "Ajudante", 3, "apoio", "Apoio", "Quando usar a ação Ajudar", "Quem foi ajudado ganha um dado bônus para testes de resistência e perícia.", (c) => ({ resumo: `dado bônus ${dadoApoio(c.n)} para quem você ajudar` })),
  D(KY, "Ajudante", 6, "defesa-compartilhada", "Defesa Compartilhada", "Aliado a até 9 m é atacado", "Use uma técnica ou Kido defensivo de Reação, com você de alvo, para proteger o aliado."),
  D(KY, "Ajudante", 6, "ataque-combinado", "Ataque Combinado", "Reação, aliado usa técnica ou Kido", "As duas habilidades ganham +2 dados de dano (+4 a partir do 20º nível) e ignoram resistência."),
  D(KY, "Ajudante", 15, "intervencao", "Intervenção", "Um teste contra um inimigo a até 9 m já foi rolado", "Role 1d8 e some ou subtraia do resultado do teste. Uma vez por turno."),

  /* ---- Schütze ---- */
  D(SC, undefined, 1, "mira-impecavel", "Mira Impecável", "Início do turno, sem se mover", "Soma sua Mente ao acerto de ataques à distância. A partir do 3º nível, esses ataques têm vantagem.", (c) => ({ acertoDist: c.atr.men, resumo: `+${c.atr.men} no acerto à distância` })),
  D(SC, "Arqueiro", 3, "disparo-adicional", "Disparo Adicional", "Ataque com arma medieval à distância", "Gaste o mesmo reiatsu para repetir o disparo, com o mesmo acerto. Declare antes de saber se o primeiro acertou."),
  D(SC, "Arqueiro", 6, "curvar", "Curvar", "Depois de errar com arma medieval", "Gaste o dobro do reiatsu do disparo para curvar o projétil e tentar acertar de novo."),
  D(SC, "Arqueiro", 10, "licht-regen", "Licht Regen", "Arma medieval à distância", "Dispare num cone de 12 metros e atinja todas as criaturas na mira."),
  D(SC, "Arqueiro", 20, "marca-quincy", "Marca Quincy", "Início do turno, ação livre e 5 PR", "Marca uma criatura até o fim do seu turno."),
  D(SC, "Sniper", 3, "disparo-de-precisao", "Disparo de Precisão", "Arma à distância, alvo a 9 metros ou mais", "Com sua ação, soma dados extras da arma, em quantidade igual a metade da sua Mente (arredondada para cima).", (c) => ({ resumo: `+${Math.ceil(c.atr.men / 2)} dado(s) da arma` })),
  D(SC, "Sniper", 10, "projetil-perfurante", "Projétil Perfurante", "Disparos de arma", "Ignoram até 5 de RD do alvo."),
  D(SC, "Sniper", 10, "mira-mortal", "Mira Mortal", "Disparo de Precisão contra alvo a 18 metros ou mais", "Você recebe +5 na jogada de ataque.", () => ({ acertoDist: 5, resumo: "+5 no acerto à distância" })),
  D(SC, "Pistoleiro", 3, "danca-de-balas", "Dança de Balas", "Ataque com arma à distância dupla", "O mesmo disparo atinge todas as criaturas a até 3 metros de você."),
  D(SC, "Pistoleiro", 5, "queima-roupa", "À Queima-roupa", "Criatura hostil a até 3 metros", "Sua CR sobe +1.", () => ({ cr: 1, resumo: "CR +1" })),
  D(SC, "Pistoleiro", 6, "ponto-cego", "Ponto Cego", "Depois de acertar com arma dupla", "O próximo ataque contra essa criatura antes do seu próximo turno aproveita a abertura."),
  D(SC, "Pistoleiro", 10, "mira-destruidora", "Mira Destruidora", "Ao acertar com armas Quincy duplas, 10 PR", "O ataque ignora completamente a RD do alvo."),
  D(SC, "Pistoleiro", 15, "tiro-ricochete", "Tiro Ricochete", "Depois de acertar com armas Quincy duplas", "O disparo atinge outra criatura a até 6 metros do alvo, com o mesmo dano."),

  /* ---- Ritter ---- */
  D(RT, undefined, 1, "duelo-impecavel", "Duelo Impecável", "Início do turno, ação livre, alvo a até 9 m", "Marca a criatura e soma seu Espírito ao acerto dos ataques corpo a corpo com armas Quincy contra ela.", (c) => ({ acertoCorpo: c.atr.esp, resumo: `+${c.atr.esp} no acerto corpo a corpo` })),
  D(RT, undefined, 1, "lamina-de-reishi", "Lâmina de Reishi", "Ataque corpo a corpo com arma Quincy, 1 PR", "Converte o dano em Energia (ignora o Hierro) e soma dados de Precisão em Energia.", (c) => ({ dados: dadosPrecisao(c.n, c.prof), resumo: `dano vira Energia e soma ${dadosPrecisao(c.n, c.prof)} de Energia` })),
  D(RT, undefined, 3, "blut-arterie", "Blut Arterie", "Ativado com 10 PR", "Seus golpes com armas Quincy somam o Espírito ao dano, e suas Técnicas de Reishi de dano ganham dados extras iguais à metade do Espírito.", (c) => ({ danoCorpo: c.atr.esp, resumo: `dano +${c.atr.esp}` })),
  D(RT, "Seele Schneider", 3, "postura-de-duelo", "Postura de Duelo", "Uma única arma Leve de uma mão, sem escudo", "Sua CR sobe +1 e seus golpes com essa arma causam +2 de dano.", () => ({ cr: 1, danoCorpo: 2, resumo: "CR +1 e dano +2" })),
  D(RT, "Seele Schneider", 3, "riposta", "Riposta", "Um inimigo erra um ataque corpo a corpo contra você", "Use a reação para atacá-lo, somando sua Destreza ao dano. Uma vez por rodada."),
  D(RT, "Seele Schneider", 6, "abertura", "Abertura", "Depois de acertar uma criatura", "O próximo ataque contra ela antes do seu próximo turno tem vantagem e ignora metade da RD."),
  D(RT, "Seele Schneider", 10, "estocada-decisiva", "Estocada Decisiva", "Ao acertar, gastando 10 PR", "Ignora completamente a RD do alvo."),
  D(RT, "Seele Schneider", 15, "passo-cruzado", "Passo Cruzado", "Primeiro ataque do turno, depois de usar o Hirenkyaku para ficar adjacente", "Seu primeiro ataque contra a criatura neste turno causa +2d8 de Energia.", () => ({ dados: "2d8", resumo: "+2d8 de Energia no primeiro ataque" })),
  D(RT, "Eisenritter", 3, "golpe-pesado", "Golpe Pesado", "Arma Pesada de duas mãos", "Você soma sua proficiência ao dano. Nos níveis 3 e 4, o Eisenritter causa +5 de dano com a arma pesada, no lugar dos +3 de dano da classe.", (c) => {
    const v = c.prof + (c.n <= 4 ? 2 : 0);
    return { danoCorpo: v, resumo: `dano +${v}${c.n <= 4 ? " (inclui o +5 no lugar do +3 da classe)" : ""}` };
  }),
  D(RT, "Eisenritter", 6, "varredura", "Varredura", "Arma Pesada, gastando 5 PR", "Ataque todas as criaturas a até 3 metros (uma jogada de ataque contra a CR de cada uma)."),
  D(RT, "Eisenritter", 10, "quebra-guarda", "Quebra-Guarda", "Ao acertar", "A CR do alvo cai pelo seu bônus de proficiência até o início do seu próximo turno."),
  D(RT, "Eisenritter", 15, "muralha-quincy", "Muralha Quincy", "Ao usar Defender", "Aliados a até 3 metros também ganham +2 na CR até o seu próximo turno."),

  /* ---- Hollows ---- */
  D(HU, "Glotonería", 3, "devorar", "Devorar", "Primeiro acerto da rodada", "Você se cura em 5 × proficiência PV (o dobro no 20º nível).", (c) => ({ resumo: `cura ${5 * c.prof} PV no primeiro acerto da rodada` })),
  D(HU, "Glotonería", 6, "mordida", "Mordida", "Ação bônus", "Ataque de mordida: 1d8 + Constituição."),
  D(HU, "Estallido", 6, "cero-duplo", "Cero Duplo", "Ao lançar o Cero", "Você lança dois Ceros por turno."),
  D(HU, "Sonido", 3, "ataque-surpresa", "Ataque Surpresa", "Primeiro ataque do turno", "Vantagem no ataque, e seus golpes causam +1 × proficiência de dano (+2,5 × a partir do 16º nível).", (c) => {
    const v = c.n >= 16 ? Math.floor(2.5 * c.prof) : c.prof;
    return { danoCorpo: v, resumo: `dano +${v} (e vantagem no primeiro ataque)` };
  }),
  D(HU, "Sonido", 6, "passo-sonido", "Passo do Sonido", "Reação", "Você se move 3 metros. Os ataques depois do primeiro somam +proficiência de dano."),
  D(VZ, undefined, 1, "golpe-vazio", "Golpe Vazio", "Quando estiver sem PR", "Um ataque grátis de 1d10 + Espírito (2d10 no 5º nível, 3d10 no 11º e 4d10 no 17º)."),
  D(VZ, "Ponzoña", 3, "ponzona", "Carga de Ponzoña", "Poder Inato acerta o alvo", "Aplica uma carga de veneno. No início do turno do alvo, ele sofre dano de Energia que ignora RD."),
  D(VZ, "Ilusión", 3, "ilusion", "Ilusão", "Poder Inato", "O alvo faz salvaguarda de Constituição (CD 8 + proficiência + Espírito): na falha tem desvantagem nos ataques e −5 × proficiência de dano."),
  D(VZ, "Reflejo", 3, "contra-ataque-reflejo", "Contra-ataque", "Um ataque erra você", "Contra-ataque de 1d8 mais metade do Espírito (2d8 a partir do 7º nível).", (c) => ({ resumo: `${c.n >= 7 ? "2d8" : "1d8"} + ${Math.floor(c.atr.esp / 2)}` })),
  D(VZ, "Reflejo", 10, "devolver-dano", "Devolver Dano", "Ao sofrer dano", "Você devolve 8% do dano sofrido ao atacante."),
];

/** Situações que a ficha tem (classe, estilo e nível batem). */
export function situacoesDaFicha(f: Ficha): Situacao[] {
  const doLivro = (talentosJson as unknown as Record<string, { id: string; nome: string; texto: string }[]>)[f.classe] ?? [];
  const cartasTalento: Situacao[] = [];
  for (const id of f.talentos) {
    const carta = CARTAS[`${f.classe}/${id}`];
    const t = doLivro.find((y) => y.id === id);
    if (!carta || !t) continue;
    cartasTalento.push({ id: `tal-${f.classe}-${id}`, nome: t.nome, fonte: "Talentos", quando: carta.quando, texto: t.texto, efeito: carta.efeito });
  }
  return cartasTalento.concat(DEFS.filter((d) => {
    if (f.nivel < d.nivel) return false;
    // subclasse: o Tokubetsu usa a subclasse emprestada de outra classe de Shinigami
    if (d.subclasse) return d.subclasse === f.subclasse && (d.classe === f.classe || f.classe === "tokubetsu");
    return d.classe === f.classe;
  }));
}

export const idSituacao = (id: string) => `sit:${id}`;

export interface SomaSituacao {
  cr: number;
  danoCorpo: number;
  acertoCorpo: number;
  acertoDist: number;
  danoGeral: number;
  desloc: number;
  dados: string[];
  resumos: { nome: string; resumo: string }[];
}

/** Soma o que as situações ligadas dão. */
export function somaSituacoes(f: Ficha, c: Ctx): SomaSituacao {
  const out: SomaSituacao = { cr: 0, danoCorpo: 0, acertoCorpo: 0, acertoDist: 0, danoGeral: 0, desloc: 0, dados: [], resumos: [] };
  for (const s of situacoesDaFicha(f)) {
    if (!f.estado.ativas.includes(idSituacao(s.id))) continue;
    const e = s.efeito?.(c);
    if (!e) {
      out.resumos.push({ nome: s.nome, resumo: "ligada" });
      continue;
    }
    out.cr += e.cr ?? 0;
    out.danoCorpo += e.danoCorpo ?? 0;
    out.acertoCorpo += (e.acertoCorpo ?? 0) + (e.acertoGeral ?? 0);
    out.acertoDist += (e.acertoDist ?? 0) + (e.acertoGeral ?? 0);
    out.danoGeral += e.danoGeral ?? 0;
    out.desloc += e.desloc ?? 0;
    if (e.dados) out.dados.push(e.dados);
    out.resumos.push({ nome: s.nome, resumo: e.resumo });
  }
  return out;
}
