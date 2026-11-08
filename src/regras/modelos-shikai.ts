import type { FormaLib, HabForma } from "./ficha";
import { armaDoModelo } from "./modelos-arma";
import { presetPorId } from "./efeitos-presets";
import { liquidoPecas, orcamentoBase, type CtxForma, type InstEfeito } from "./efeitos-forma";
import { analisarDano } from "./teto-dano";
import { calcularLiberacao } from "./liberacao-forma";
import { marcarAcoes, montarCartoesModelo } from "./modelos-cartoes";
import { CARTOES_SHIKAI } from "./modelos-shikai-cartoes";

const novoId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));

export interface ModeloShikaiMontado {
  id: string; nome: string; dono: string; resumo: string; tema: string;
  categoria: "Combate" | "Elemental" | "Kidō" | "Especial";
  comando: string; aparencia: string; espirito: string;
  bankaiRelacionada: string; bankaiEstilo?: string;
  efeitos: { id: string; param?: { atr?: string; tipo?: string; n?: number } }[];
  pontoFraco: string; pontoFracoParam?: { tipo?: string };
  habilidades: { nome: string; acao: string; dano: string; regra: string; desc: string; modelo: string }[];
  ppGasto: number; crescimento?: string; custoLiberacao?: number;
}

export const SHIKAIS_MONTADAS: ModeloShikaiMontado[] = [
 {
  "id": "zangetsu",
  "nome": "Zangetsu",
  "dono": "Ichigo Kurosaki",
  "resumo": "Um cutelo enorme sem guarda que nunca volta a ser selado: força bruta, alcance pela faixa e o Getsuga Tenshō.",
  "tema": "Força crua e reiatsu que transborda",
  "categoria": "Combate",
  "comando": "(Sem comando: a lâmina já nasce liberada e fica assim.)",
  "aparencia": "Um cutelo do tamanho do dono, sem guarda e sem bainha, de fio prateado e corpo negro. O cabo é enrolado num pano branco cuja ponta solta serve de corrente para girar e arremessar a lâmina.",
  "espirito": "Um homem alto de sobretudo negro rasgado, barba rala e óculos escuros, que fala pouco e espera que o dono entenda sozinho. Atrás dele, uma voz branca e debochada às vezes responde no lugar.",
  "bankaiRelacionada": "tensa-zangetsu",
  "bankaiEstilo": "transformadora",
  "efeitos": [
   {
    "id": "sk-peso"
   },
   {
    "id": "sk-onda"
   },
   {
    "id": "sk-alcance"
   },
   {
    "id": "sk-leve"
   }
  ],
  "pontoFraco": "pf-frenesi-leve",
  "habilidades": [
   {
    "nome": "Getsuga Tenshō",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[ESP]",
    "regra": "Linha de 18 m: salvaguarda de Destreza, metade no sucesso.",
    "desc": "Um arco de reiatsu azul-claro sai do fio e corta tudo no caminho.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Getsuga Colado",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[FOR]",
    "regra": "Golpe corpo a corpo; se acertar, o alvo é empurrado 6 m. Se bater em algo sólido, fica Caído.",
    "desc": "A onda é solta com a lâmina ainda encostada no inimigo.",
    "modelo": "Ataque básico"
   },
   {
    "nome": "Girar pela Faixa",
    "acao": "Ação bônus",
    "dano": "4d8+[FOR]",
    "regra": "Golpe contra um alvo a até 9 m; depois a lâmina volta à sua mão.",
    "desc": "Ichigo gira o cutelo pelo pano e o arremessa como um disco.",
    "modelo": "Reforço"
   },
   {
    "nome": "Lâmina Larga",
    "acao": "Reação",
    "dano": "2d10+[PROF]",
    "regra": "Reduz o dano de um ataque contra você na quantidade indicada.",
    "desc": "O corpo largo da lâmina vira escudo.",
    "modelo": "Defesa"
   }
  ],
  "ppGasto": 6,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP, devolução do frenesi conta inteira): tire Corpo Leve. Níveis 12 a 17 (6 a 7 PP): a montagem acima. Nível 18+ (8 PP): acrescente Mente Afiada (o dono começa a ouvir a lâmina) ou troque Lâmina Estendida por Reiatsu Perfurante."
 },
 {
  "id": "senbonzakura",
  "nome": "Senbonzakura",
  "dono": "Byakuya Kuchiki",
  "resumo": "A lâmina se desfaz em mil pétalas cortantes guiadas pelo cabo: alcance enorme, curvas e escudo. É a semente das mil lâminas da Bankai.",
  "tema": "Mil lâminas e controle de área",
  "categoria": "Especial",
  "comando": "Dispersa, Senbonzakura.",
  "aparencia": "A katana de guarda retangular brilha e se desfaz da ponta para o cabo em incontáveis lâminas minúsculas que, contra a luz, parecem pétalas de cerejeira. Só o cabo fica na mão, que aponta para onde a nuvem deve ir.",
  "espirito": "Um samurai alto de armadura de placas e máscara de guerreiro com uma única fenda nos olhos. Fala pouco, com a calma de quem já sabe o fim da luta.",
  "bankaiRelacionada": "senbonzakura-kageyoshi",
  "bankaiEstilo": "potencializadora",
  "efeitos": [
   {
    "id": "sk-dispersa"
   },
   {
    "id": "sk-parede"
   },
   {
    "id": "sk-mente"
   }
  ],
  "pontoFraco": "pf-passos",
  "habilidades": [
   {
    "nome": "Chire: Nuvem de Pétalas",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[ESP]",
    "regra": "Área de 6 m de raio a até 18 m: salvaguarda de Destreza, metade no sucesso.",
    "desc": "A nuvem rosada desce sobre a área e corta em todas as direções.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Perseguir",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[ESP]",
    "regra": "Alvo único a até 18 m; as pétalas fazem curva e ignoram meia e três quartos de cobertura.",
    "desc": "A nuvem contorna pilares e paredes e alcança o alvo por trás.",
    "modelo": "Golpe atravessante"
   },
   {
    "nome": "Rio Rosado",
    "acao": "Ação bônus",
    "dano": "4d8+[ESP]",
    "regra": "Ataque à distância contra um alvo a até 12 m.",
    "desc": "Um fio de pétalas se solta da nuvem e volta antes de o alvo reagir.",
    "modelo": "Reforço"
   },
   {
    "nome": "Defesa Dilacerante",
    "acao": "Reação",
    "dano": "[NIV/2]d8+[ESP]",
    "regra": "Quando uma criatura o acerta corpo a corpo, as pétalas se fecham sobre ela e causam o dano indicado.",
    "desc": "Quem chega perto demais encontra uma parede de lâminas.",
    "modelo": "Contra-ataque"
   }
  ],
  "ppGasto": 6,
  "custoLiberacao": 9,
  "crescimento": "Nível 10 (5 PP): tire Mente Afiada e troque Parede de Reiatsu por Lâmina Estendida (1). Nível 18+ (8 PP): acrescente Kidō Canalizado no lugar de Mente Afiada; a Bankai depois herda a nuvem e a multiplica (Mil Lâminas, Comando das Mãos)."
 },
 {
  "id": "hyorinmaru",
  "nome": "Hyōrinmaru",
  "dono": "Tōshirō Hitsugaya",
  "resumo": "O dragão de gelo mais forte entre as Zanpakutō: o que a lâmina corta congela, a corrente prende e o céu obedece. A Bankai veste esse mesmo gelo no corpo.",
  "tema": "Gelo, dragão e clima",
  "categoria": "Elemental",
  "comando": "Reine sobre os céus congelados, Hyōrinmaru.",
  "aparencia": "A katana cresce e, do cabo, sai uma corrente longa terminada numa lâmina em forma de lua crescente. Ao golpear, um dragão de gelo e água se forma ao longo do fio.",
  "espirito": "Um dragão oriental gigante de gelo e escamas azuladas, olhos vermelhos e voz grave, que vive num céu de nevasca eterna. É paciente e protetor.",
  "bankaiRelacionada": "daiguren-hyorinmaru",
  "bankaiEstilo": "potencializadora",
  "efeitos": [
   {
    "id": "sk-elem",
    "param": {
     "tipo": "Frio"
    }
   },
   {
    "id": "sk-geada"
   },
   {
    "id": "sk-gelo",
    "param": {
     "tipo": "Frio"
    }
   },
   {
    "id": "sk-clima"
   }
  ],
  "pontoFraco": "pf-ferida",
  "pontoFracoParam": {
   "tipo": "Fogo"
  },
  "habilidades": [
   {
    "nome": "Dragão de Gelo",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[ESP]",
    "regra": "Linha de 18 m: salvaguarda de Destreza; na falha, o alvo também fica Preso até o fim do próximo turno dele; metade e sem condição no sucesso.",
    "desc": "Um dragão de gelo nasce do fio e engole tudo na frente.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Rokui Hyōketsujin",
    "acao": "Ação",
    "dano": "[NIV/2]d8+[ESP]",
    "regra": "Cinco flocos formam um pentágono de 6 m de raio a até 18 m. Quem estiver dentro ou entrar até o seu próximo turno faz salvaguarda de Constituição: na falha, sofre o dano e fica Congelado até o fim do próximo turno dele.",
    "desc": "Cinco flocos de neve caem em volta do alvo e o gelo sobe do chão.",
    "modelo": "Controle"
   },
   {
    "nome": "Corrente da Lua Gelada",
    "acao": "Ação bônus",
    "dano": "3d8+[ESP]",
    "regra": "Alvo a até 9 m: salvaguarda de Força ou é puxado até 6 m na sua direção.",
    "desc": "A lâmina crescente enrola o alvo e o arrasta.",
    "modelo": "Onda de choque"
   },
   {
    "nome": "Ryōjin Hyōheki",
    "acao": "Reação",
    "dano": "2d10+[PROF]",
    "regra": "Reduz o dano sofrido por você ou por um aliado a até 3 m na quantidade indicada.",
    "desc": "Fios de gelo se trançam num muro na frente do golpe.",
    "modelo": "Defesa"
   }
  ],
  "ppGasto": 7,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP, devolução máxima 1): tire Domínio do Clima e Guarda Elemental e use Corpo Leve (2). Nível 18+ (8 PP): acrescente Mente Afiada. A Bankai troca a Geada por Frio Cortante (Congelado) e soma as asas e as flores."
 },
 {
  "id": "zabimaru",
  "nome": "Zabimaru",
  "dono": "Renji Abarai",
  "resumo": "Uma lâmina de segmentos que estica como chicote e morde de longe. Na Bankai, os mesmos segmentos viram a serpente de ossos.",
  "tema": "Alcance, força bruta e segmentos",
  "categoria": "Combate",
  "comando": "Uive, Zabimaru.",
  "aparencia": "A katana vira uma lâmina serrilhada de seis segmentos, cada um com um dente voltado para trás, ligados por um fio de reiatsu. Estendida, chicoteia em arco; recolhida, parece uma espada larga e dentada.",
  "espirito": "Dois em um: um babuíno branco e grande, de juba farta e voz grossa, preso por uma corrente a uma cobra que cresce da sua cauda, e que às vezes aparece como um menino de pele pálida. Brigam entre si e com o dono.",
  "bankaiRelacionada": "hihio-zabimaru",
  "bankaiEstilo": "potencializadora",
  "efeitos": [
   {
    "id": "sk-segmentos"
   },
   {
    "id": "sk-peso"
   },
   {
    "id": "sk-parede"
   }
  ],
  "pontoFraco": "pf-lamina-partida",
  "habilidades": [
   {
    "nome": "Hoero: Chicote Estendido",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[FOR]",
    "regra": "Linha de 15 m: salvaguarda de Destreza, metade no sucesso.",
    "desc": "A lâmina se solta em segmentos e varre tudo em linha reta.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Higa Zekkō",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[FOR]",
    "regra": "Alvo único a até 15 m: os segmentos se separam e atacam de vários lados; o alvo não pode usar reações contra este ataque. Depois, a arma fica partida até o fim do seu próximo turno (sem o alcance da Lâmina Segmentada).",
    "desc": "Os dentes voam soltos, cercam o inimigo e se fecham ao mesmo tempo.",
    "modelo": "Técnica final"
   },
   {
    "nome": "Mordida da Serpente",
    "acao": "Ação bônus",
    "dano": "3d8+[FOR]",
    "regra": "Alvo a até 9 m: salvaguarda de Força ou fica Agarrado pelos segmentos.",
    "desc": "A ponta enrola o alvo como uma cobra.",
    "modelo": "Controle"
   },
   {
    "nome": "Segmentos que Voltam",
    "acao": "Reação",
    "dano": "2d10+[PROF]",
    "regra": "Reduz o dano sofrido por você na quantidade indicada.",
    "desc": "Os segmentos se fecham num escudo dentado.",
    "modelo": "Defesa"
   }
  ],
  "ppGasto": 6,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP): tire Parede de Reiatsu (bruto 6, líquido 4). Nível 18+ (8 PP): acrescente Reiatsu Perfurante e Lâmina Estendida. A Bankai amplia os segmentos (Corpo Segmentado) e o arco (Ceifa em Arco)."
 },
 {
  "id": "ryujin-jakka",
  "nome": "Ryūjin Jakka",
  "dono": "Genryūsai Shigekuni Yamamoto",
  "resumo": "A mais antiga e mais forte Zanpakutō de fogo: a lâmina é chama, e a chama cerca, prende e queima tudo em volta. A Bankai recolhe esse fogo no fio.",
  "tema": "Fogo absoluto",
  "categoria": "Elemental",
  "comando": "Que todas as coisas da criação se tornem cinzas, Ryūjin Jakka.",
  "aparencia": "O bastão de madeira se abre numa katana de cabo roxo-escuro e guarda redonda de bronze. A lâmina se acende inteira e cada golpe deixa um rastro de chamas que sobe ao céu.",
  "espirito": "Uma ave ou dragão de fogo tão antiga que quase não fala; sua presença seca o ar e faz o horizonte tremer.",
  "bankaiRelacionada": "zanka-no-tachi",
  "bankaiEstilo": "potencializadora",
  "efeitos": [
   {
    "id": "sk-elem",
    "param": {
     "tipo": "Fogo"
    }
   },
   {
    "id": "sk-queima"
   },
   {
    "id": "sk-aura",
    "param": {
     "tipo": "Fogo"
    }
   },
   {
    "id": "sk-mente"
   }
  ],
  "pontoFraco": "pf-esgota",
  "habilidades": [
   {
    "nome": "Jōkaku Enjō",
    "acao": "Ação",
    "dano": "[NIV/2]d8+[FOR]",
    "regra": "Muralha de fogo de 9 m de raio a até 18 m. Quem estiver dentro faz salvaguarda de Destreza (metade no sucesso) e fica Preso dentro do anel até o fim do seu próximo turno; atravessar a muralha causa o dano de novo.",
    "desc": "Pilares de chama se erguem e prendem o inimigo num castelo de fogo.",
    "modelo": "Controle"
   },
   {
    "nome": "Ennetsu Jigoku",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[FOR]",
    "regra": "Área de 6 m de raio a até 18 m: colunas de fogo sobem do chão; salvaguarda de Destreza, metade no sucesso. Na falha, o alvo também fica Queimado.",
    "desc": "O chão se abre em pilares de fogo que sobem às nuvens.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Taimatsu",
    "acao": "Ação bônus",
    "dano": "4d8+[FOR]",
    "regra": "Só contra uma criatura que você acertou neste turno: o corte acende e queima por dentro.",
    "desc": "A ferida aberta vira uma tocha.",
    "modelo": "Reforço"
   },
   {
    "nome": "Muralha de Chamas",
    "acao": "Reação",
    "dano": "2d10+[PROF]",
    "regra": "Reduz o dano sofrido por você ou por um aliado a até 3 m; o atacante corpo a corpo sofre 1d10 de dano de Fogo.",
    "desc": "Uma parede de fogo sobe entre ele e o golpe.",
    "modelo": "Defesa"
   }
  ],
  "ppGasto": 7,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP): tire Mente Afiada e Fio que Queima. Nível 18+ (8 PP): acrescente Reiatsu Perfurante. A Bankai apaga a chama de fora e a concentra no fio (Lâmina do Sol Nascente, Manto do Sol Poente)."
 },
 {
  "id": "katen-kyokotsu",
  "nome": "Katen Kyōkotsu",
  "dono": "Shunsui Kyōraku",
  "resumo": "Duas lâminas que transformam brincadeiras de criança em lei, para os dois lados da luta. A Bankai leva o jogo ao fim: uma peça trágica em quatro atos.",
  "tema": "Jogos, regras e sombras",
  "categoria": "Kidō",
  "comando": "Vento das flores, agita-te; deus das flores, chora. Vento celeste, agita-te; demônio celeste, ri. Katen Kyōkotsu.",
  "aparencia": "A katana e a wakizashi viram duas cimitarras grandes e negras de fio prateado, muito curvas, com borlas vermelhas pendendo do cabo.",
  "espirito": "Na verdade são duas: Ohana, uma mulher alta e caprichosa de quimono, que adora brincar e muda de humor sem aviso; e a menina Kyōkotsu, quieta, de olhar triste, que cuida do lado cruel do jogo.",
  "bankaiRelacionada": "karamatsu-shinju",
  "bankaiEstilo": "potencializadora",
  "efeitos": [
   {
    "id": "sk-jogo"
   },
   {
    "id": "sk-vento"
   },
   {
    "id": "sk-mente"
   }
  ],
  "pontoFraco": "pf-regra-mutua",
  "habilidades": [
   {
    "nome": "Bushōgoma",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[ESP]",
    "regra": "Área de 6 m ao seu redor: salvaguarda de Destreza, metade no sucesso. O redemoinho também desfaz um disparo, Cero ou Hadō que esteja passando pela área.",
    "desc": "Shunsui gira com as lâminas invertidas e solta um redemoinho cortante.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Kageoni: Saída da Sombra",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[DES]",
    "regra": "Só com Kageoni ativo: você sai de uma sombra a até 9 m e ataca um alvo ao lado dela, com vantagem.",
    "desc": "A lâmina sobe da sombra do inimigo, por baixo.",
    "modelo": "Golpe atravessante"
   },
   {
    "nome": "Irooni: Cor Escolhida",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[ESP]",
    "regra": "Só com Irooni ativo: diga a cor antes de rolar. Se o alvo tiver a cor à mostra, ele também tem desvantagem na próxima salvaguarda até o fim do seu próximo turno.",
    "desc": "Shunsui escolhe a cor com um sorriso e o corte vem por ela.",
    "modelo": "Técnica final"
   },
   {
    "nome": "Kageokuri",
    "acao": "Ação bônus",
    "dano": "",
    "regra": "Você deixa uma imagem na sua sombra e reaparece a até 9 m: o próximo ataque contra você até o seu próximo turno tem desvantagem.",
    "desc": "Quem o enxerga com reiatsu vê um Shunsui que não está mais lá.",
    "modelo": "Passo veloz"
   }
  ],
  "ppGasto": 7,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP): tire Passo Ligeiro (bruto 6, líquido 4; Regra para Todos é preço e devolve 2 inteiros). Nível 18+ (8 PP): acrescente Lâmina Estendida ou Reiatsu Perfurante. A Bankai prende o jogo num roteiro de quatro atos."
 },
 {
  "id": "tenken",
  "nome": "Tenken",
  "dono": "Sajin Komamura",
  "resumo": "Partes de um gigante de armadura aparecem no ar e repetem cada golpe do dono. Na Bankai, o gigante inteiro sobe e passa a dividir as feridas.",
  "tema": "Golpes gigantes e lealdade",
  "categoria": "Combate",
  "comando": "Ruge, Tenken.",
  "aparencia": "A katana, já enorme para o dono, ganha uma guarda de ferro negro. Ao golpear, um braço e uma lâmina gigantes de armadura surgem no ar, imitam o movimento e somem.",
  "espirito": "Um gigante de armadura negra e fumaça escura nas juntas, silencioso e fiel, que só se move quando o dono se move.",
  "bankaiRelacionada": "kokujo-tengen-myoo",
  "bankaiEstilo": "transformadora",
  "efeitos": [
   {
    "id": "sk-gigante"
   },
   {
    "id": "sk-peso"
   },
   {
    "id": "sk-parede"
   },
   {
    "id": "sk-carmesim"
   }
  ],
  "pontoFraco": "pf-guarda",
  "habilidades": [
   {
    "nome": "Corte do Braço Gigante",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[FOR]",
    "regra": "Cone de 9 m: salvaguarda de Destreza, metade no sucesso.",
    "desc": "Uma lâmina do tamanho de um prédio desce em arco.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Lâmina que Esmaga",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[FOR]",
    "regra": "Golpe contra um alvo a até 12 m; se falhar na salvaguarda de Força, o alvo fica Caído.",
    "desc": "A espada gigante cai de cima como um martelo.",
    "modelo": "Técnica final"
   },
   {
    "nome": "Uivo de Comando",
    "acao": "Ação bônus",
    "dano": "",
    "regra": "Inimigos a 9 m: salvaguarda de Mente ou Amedrontados até o fim do próximo turno deles.",
    "desc": "O uivo do lobo ecoa e o gigante ergue o punho junto.",
    "modelo": "Provocação"
   },
   {
    "nome": "Braço que Protege",
    "acao": "Reação",
    "dano": "2d10+[PROF]",
    "regra": "Reduz o dano sofrido por você ou por um aliado a até 6 m na quantidade indicada.",
    "desc": "Um braço de ferro surge na frente do golpe.",
    "modelo": "Defesa"
   }
  ],
  "ppGasto": 6,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP, devolução máxima 1): tire Reiatsu Perfurante e Parede de Reiatsu. Nível 18+ (8 PP): acrescente Mente Afiada. Na Bankai as partes se juntam num colosso (Colosso Espiritual) com Elo de Carne."
 },
 {
  "id": "ashisogi-jizo",
  "nome": "Ashisogi Jizō",
  "dono": "Mayuri Kurotsuchi",
  "resumo": "Um tridente de lâminas tortas que desliga os membros que corta e deixa a dor inteira. A Bankai troca o tridente pela lagarta dourada.",
  "tema": "Paralisia, veneno e ciência",
  "categoria": "Especial",
  "comando": "Rasgue, Ashisogi Jizō.",
  "aparencia": "A lâmina vira um tridente de três pontas curvas como serpentes, douradas e tortas. A guarda é a cabeça de um bebê de olhos fechados e mãos em prece; o cabo tem pontas como folhas.",
  "espirito": "Uma criança de rosto de bebê e corpo de lagarta, que ri baixinho e só obedece porque foi modificada para isso.",
  "bankaiRelacionada": "konjiki-ashisogi-jizo",
  "bankaiEstilo": "transformadora",
  "efeitos": [
   {
    "id": "sk-nervo"
   },
   {
    "id": "sk-veneno"
   },
   {
    "id": "sk-cura"
   },
   {
    "id": "sk-mente"
   }
  ],
  "pontoFraco": "pf-casca",
  "habilidades": [
   {
    "nome": "Rasgar",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[MEN]",
    "regra": "Dois golpes contra o mesmo alvo ou contra dois alvos a 3 m um do outro; o dano é dividido. Cada acerto pode ativar Corte que Paralisa (uma vez por turno).",
    "desc": "As três pontas abrem cortes rasos em ângulos diferentes.",
    "modelo": "Rajada"
   },
   {
    "nome": "Kyōdo Yon: Choro do Bebê",
    "acao": "Ação",
    "dano": "[NIV/2]d8+[MEN]",
    "regra": "Uma vez por cena. Inimigos a 9 m que ouvem: salvaguarda de Constituição; na falha, sofrem o dano e ficam Paralisados até o fim do próximo turno deles; metade e sem condição no sucesso. Surdos são imunes.",
    "desc": "Mayuri fura o olho da cabeça de bebê, que chora um líquido negro e grita.",
    "modelo": "Controle"
   },
   {
    "nome": "Veneno Injetado",
    "acao": "Ação bônus",
    "dano": "4d8+[MEN]",
    "regra": "Só contra uma criatura Envenenada, Presa ou Paralisada a até 3 m: dano de Veneno.",
    "desc": "Uma das pontas solta uma dose a mais na ferida.",
    "modelo": "Reforço"
   },
   {
    "nome": "Corpo Modificado",
    "acao": "Reação",
    "dano": "2d10+[PROF]",
    "regra": "Reduz o dano de um ataque contra você na quantidade indicada.",
    "desc": "O corpo se deforma como borracha e devolve a forma depois.",
    "modelo": "Defesa"
   }
  ],
  "ppGasto": 6,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP, devolução máxima 1): tire Fluxo Restaurador e Mente Afiada. Nível 18+ (8 PP): acrescente Reiatsu Perfurante. A Bankai troca a lâmina pela Criatura Dourada e a Névoa Venenosa."
 },
 {
  "id": "suzumebachi",
  "nome": "Suzumebachi",
  "dono": "Soi Fon",
  "resumo": "Um ferrão de vespa no dedo médio: o primeiro golpe marca, o segundo no mesmo lugar mata. A Bankai troca a precisão por um canhão de um disparo.",
  "tema": "Marca e morte em dois golpes",
  "categoria": "Especial",
  "comando": "Ferroe todos os inimigos até a morte, Suzumebachi.",
  "aparencia": "A wakizashi some e vira uma manopla dourada e preta no braço direito, presa por uma corrente ao ferrão que cobre o dedo médio.",
  "espirito": "Uma fada-vespa pequena, de capacete e roupa de guerreira, impaciente e orgulhosa, que exige que a dona seja implacável.",
  "bankaiRelacionada": "jakuho-raikoben",
  "bankaiEstilo": "transformadora",
  "efeitos": [
   {
    "id": "sk-homonka"
   },
   {
    "id": "sk-leve"
   },
   {
    "id": "sk-vento"
   }
  ],
  "pontoFraco": "pf-guarda",
  "habilidades": [
   {
    "nome": "Ferrão",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[DES]",
    "regra": "Dois golpes contra o mesmo alvo ou contra dois alvos a 3 m um do outro; o dano é dividido. Cada acerto conta para a Marca da Vespa.",
    "desc": "Dois toques rápidos com a ponta do dedo.",
    "modelo": "Rajada"
   },
   {
    "nome": "Nigeki Kessatsu",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[DES]",
    "regra": "Só contra um alvo marcado com o Hōmonka: ataque com vantagem. Se acertar, dispara a marca.",
    "desc": "O segundo ferrão entra exatamente na flor negra.",
    "modelo": "Golpe atravessante"
   },
   {
    "nome": "Passo do Onmitsukidō",
    "acao": "Ação bônus",
    "dano": "",
    "regra": "Move até o dobro do deslocamento sem provocar ataques; o próximo ataque neste turno tem +2 no acerto.",
    "desc": "Soi Fon some num Shunpo e reaparece nas costas do alvo.",
    "modelo": "Passo veloz"
   },
   {
    "nome": "Utsusemi",
    "acao": "Reação",
    "dano": "",
    "regra": "Uma vez por cena, quando for atingida: o ataque acerta só a roupa que você deixou para trás e você não sofre dano.",
    "desc": "Sobra só o casaco cortado no ar.",
    "modelo": "Barreira"
   }
  ],
  "ppGasto": 7,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP, devolução máxima 1): tire Passo Ligeiro e fique com Marca da Vespa e Corpo Leve (bruto 6, líquido 5). Nível 18+ (8 PP): acrescente Mente Afiada ou troque Corpo Leve por Lâmina Afiada (crítico 19). A Bankai abandona a marca e vira artilharia (Tiro Único)."
 },
 {
  "id": "benihime",
  "nome": "Benihime",
  "dono": "Kisuke Urahara",
  "resumo": "Uma espada elegante que solta reiatsu carmesim em ondas, escudos, redes e armadilhas. A Bankai passa a refazer o que toca.",
  "tema": "Reiatsu carmesim e estratégia",
  "categoria": "Kidō",
  "comando": "Desperte, Benihime.",
  "aparencia": "A bengala se abre numa katana fina e curva, de cabo simples, com uma borla vermelha na ponta do cabo. A reiatsu do dono fica cor de sangue.",
  "espirito": "Uma princesa de quimono vermelho e tranças em laço, mimada e ciumenta, que gosta de ser chamada com carinho e se zanga quando o dono a usa sem jeito.",
  "bankaiRelacionada": "benihime-aratame",
  "bankaiEstilo": "transformadora",
  "efeitos": [
   {
    "id": "sk-kido"
   },
   {
    "id": "sk-carmesim"
   },
   {
    "id": "sk-armadilha"
   },
   {
    "id": "sk-parede"
   }
  ],
  "pontoFraco": "pf-corte",
  "habilidades": [
   {
    "nome": "Nake, Benihime",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[ESP]",
    "regra": "Linha de 18 m: salvaguarda de Destreza, metade no sucesso. Você pode curvar a onda uma vez em até 90 graus.",
    "desc": "Uma lâmina de reiatsu vermelha sai do fio e muda de rumo no ar.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Shibari, Benihime",
    "acao": "Ação",
    "dano": "[NIV/2]d8+[ESP]",
    "regra": "Alvo a até 18 m: salvaguarda de Força ou fica Preso numa rede vermelha até o fim do próximo turno dele.",
    "desc": "Fios carmesins se trançam numa rede em volta do inimigo.",
    "modelo": "Controle"
   },
   {
    "nome": "Tsuppane, Benihime",
    "acao": "Ação bônus",
    "dano": "3d8+[ESP]",
    "regra": "Alvo a até 6 m: salvaguarda de Força ou é empurrado 6 m; se bater em algo sólido, fica Caído.",
    "desc": "Uma onda de repulsão empurra tudo para longe.",
    "modelo": "Onda de choque"
   },
   {
    "nome": "Chikasumi no Tate",
    "acao": "Reação",
    "dano": "2d10+[PROF]",
    "regra": "Reduz o dano sofrido por você ou por um aliado a até 3 m na quantidade indicada.",
    "desc": "Um escudo hexagonal de névoa vermelha aparece onde o golpe vai cair.",
    "modelo": "Defesa"
   }
  ],
  "ppGasto": 7,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP, devolução máxima 1): tire Armadilha Preparada. Nível 18+ (8 PP): acrescente Mente Afiada. A Bankai troca as ondas pela Reestruturação."
 },
 {
  "id": "suzumushi",
  "nome": "Suzumushi",
  "dono": "Kaname Tōsen",
  "resumo": "Um anel no cabo canta e derruba quem escuta; a lâmina se divide em centenas. A Bankai fecha o mundo num domo sem sentidos.",
  "tema": "Som, sono e justiça cega",
  "categoria": "Especial",
  "comando": "Cante, Suzumushi.",
  "aparencia": "A katana de guarda em anel ganha um aro solto no fim do cabo. Ao girar, o aro vibra num tom agudo; num segundo comando, a lâmina se multiplica em centenas de fios.",
  "espirito": "Um grilo do tamanho de um homem, de antenas finas e voz que é quase só um zumbido; sério e calado como o dono.",
  "bankaiRelacionada": "enma-korogi",
  "bankaiEstilo": "transformadora",
  "efeitos": [
   {
    "id": "sk-canto"
   },
   {
    "id": "sk-leve"
   },
   {
    "id": "sk-vento"
   },
   {
    "id": "sk-mente"
   }
  ],
  "pontoFraco": "pf-casca",
  "habilidades": [
   {
    "nome": "Benihiko",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[DES]",
    "regra": "Cone de 9 m: salvaguarda de Destreza, metade no sucesso.",
    "desc": "Segundo comando: a lâmina se desfaz em centenas de lâminas que caem de todos os lados.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Corte no Sono",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[DES]",
    "regra": "Golpe corpo a corpo com vantagem contra uma criatura Inconsciente, Surda ou Cega.",
    "desc": "Tōsen acha o alvo pelo som da respiração.",
    "modelo": "Golpe atravessante"
   },
   {
    "nome": "Nota Aguda",
    "acao": "Ação bônus",
    "dano": "",
    "regra": "Uma criatura a 9 m que ouve: salvaguarda de Mente ou fica Surda e com desvantagem na próxima salvaguarda de Mente até o fim do próximo turno dela.",
    "desc": "O anel vibra só para um ouvido.",
    "modelo": "Provocação"
   },
   {
    "nome": "Lâmina que Ouve",
    "acao": "Reação",
    "dano": "[NIV/2]d8+[DES]",
    "regra": "Quando uma criatura o acerta corpo a corpo, você revida com o dano indicado.",
    "desc": "Ele ouve o golpe antes de senti-lo.",
    "modelo": "Contra-ataque"
   }
  ],
  "ppGasto": 7,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP, devolução máxima 1): tire Mente Afiada e Corpo Leve. Nível 18+ (8 PP): acrescente Lâmina Estendida. A Bankai troca o canto pelo Domo do Silêncio."
 },
 {
  "id": "sode-no-shirayuki",
  "nome": "Sode no Shirayuki",
  "dono": "Rukia Kuchiki",
  "resumo": "A Zanpakutō de gelo mais bonita da Soul Society: tudo é dança, e cada dança congela de um jeito.",
  "tema": "Gelo em danças",
  "categoria": "Elemental",
  "comando": "Dance, Sode no Shirayuki.",
  "aparencia": "Depois de um giro da lâmina no sentido anti-horário, a katana inteira fica branca como neve, da guarda à ponta, e uma fita branca longa sai do fim do cabo e dança no ar.",
  "espirito": "Uma mulher pálida de quimono branco e cabelos lilás, serena e elegante, que fala baixo e congela o ar em volta.",
  "bankaiRelacionada": "",
  "bankaiEstilo": "",
  "efeitos": [
   {
    "id": "sk-elem",
    "param": {
     "tipo": "Frio"
    }
   },
   {
    "id": "sk-geada"
   },
   {
    "id": "sk-gelo",
    "param": {
     "tipo": "Frio"
    }
   },
   {
    "id": "sk-leve"
   }
  ],
  "pontoFraco": "pf-coreografia",
  "habilidades": [
   {
    "nome": "Some no Mai: Tsukishiro",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[ESP]",
    "regra": "Círculo de 3 m de raio a até 18 m: salvaguarda de Constituição; na falha, também Congelado até o fim do próximo turno; metade e sem condição no sucesso.",
    "desc": "Um círculo branco se desenha no chão e o gelo sobe em coluna até o céu.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Tsugi no Mai: Hakuren",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[ESP]",
    "regra": "Cone de 12 m: salvaguarda de Destreza, metade no sucesso.",
    "desc": "Rukia risca quatro pontos no chão e solta uma avalanche de frio.",
    "modelo": "Corte distante"
   },
   {
    "nome": "San no Mai: Shirafune",
    "acao": "Ação bônus",
    "dano": "4d8+[ESP]",
    "regra": "Golpe contra um alvo a até 9 m: a lâmina partida se refaz em gelo e estica.",
    "desc": "O gelo completa a lâmina quebrada e a alonga até o alvo.",
    "modelo": "Reforço"
   },
   {
    "nome": "Juhaku",
    "acao": "Reação",
    "dano": "",
    "regra": "Quando uma criatura se move até 3 m de você: salvaguarda de Força ou fica Presa ao chão até o fim do próximo turno dela.",
    "desc": "A ponta toca o chão e o gelo corre até os pés do inimigo.",
    "modelo": "Barreira"
   }
  ],
  "ppGasto": 7,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP): tire Guarda Elemental. Nível 18+ (8 PP): acrescente Mente Afiada. Sem Bankai pronta no site: a Bankai canônica (Hakka no Togame) é transformadora (o corpo vira zero absoluto)."
 },
 {
  "id": "haineko",
  "nome": "Haineko",
  "dono": "Rangiku Matsumoto",
  "resumo": "A lâmina vira cinza, e tudo o que a cinza toca é cortado. Uma nuvem que obedece ao cabo.",
  "tema": "Nuvem de cinzas cortantes",
  "categoria": "Especial",
  "comando": "Rosne, Haineko.",
  "aparencia": "A lâmina se desfaz em cinza clara a partir do fio; só o cabo e a guarda ficam na mão. A nuvem segue cada movimento do pulso, toma formas e se fecha em redemoinho.",
  "espirito": "Uma mulher de cabelos curtos e olhar de gata, preguiçosa, vaidosa e mimada, que discute com a dona por qualquer coisa.",
  "bankaiRelacionada": "",
  "bankaiEstilo": "",
  "efeitos": [
   {
    "id": "sk-dispersa"
   },
   {
    "id": "sk-aura",
    "param": {
     "tipo": "Cortante"
    }
   },
   {
    "id": "sk-leve"
   }
  ],
  "pontoFraco": "pf-sem-lamina",
  "habilidades": [
   {
    "nome": "Unare: Nuvem que Rosna",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[ESP]",
    "regra": "Área de 6 m de raio a até 18 m: salvaguarda de Destreza, metade no sucesso.",
    "desc": "A cinza cai sobre a área e corta tudo de uma vez.",
    "modelo": "Golpe em área"
   },
   {
    "nome": "Garra de Cinzas",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[ESP]",
    "regra": "Alvo único a até 18 m; a nuvem ignora meia e três quartos de cobertura.",
    "desc": "A cinza se fecha numa garra de gata em volta do alvo.",
    "modelo": "Golpe atravessante"
   },
   {
    "nome": "Véu de Cinzas",
    "acao": "Ação bônus",
    "dano": "3d6+[ESP]",
    "regra": "Alvo a até 9 m: salvaguarda de Destreza ou fica Cego até o fim do próximo turno dele.",
    "desc": "A cinza entra nos olhos e arranha.",
    "modelo": "Controle"
   },
   {
    "nome": "Redemoinho de Cinzas",
    "acao": "Reação",
    "dano": "2d10+[PROF]",
    "regra": "Reduz o dano sofrido por você ou por um aliado a até 3 m na quantidade indicada.",
    "desc": "A nuvem gira na frente do golpe e o desvia.",
    "modelo": "Defesa"
   }
  ],
  "ppGasto": 7,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP): tire Aura que Fere (bruto 6, líquido 4). Nível 18+ (8 PP): acrescente Mente Afiada. Combina com gelo de aliados (paredes de cinza e gelo) a critério do Mestre."
 },
 {
  "id": "kyoka-suigetsu",
  "nome": "Kyōka Suigetsu",
  "dono": "Sōsuke Aizen",
  "resumo": "Quem viu a liberação passa a viver na ilusão do dono: vê, ouve e sente o que ele quiser. Poderosa, mas só contra quem olhou.",
  "tema": "Hipnose completa",
  "categoria": "Kidō",
  "comando": "Despedace-se, Kyōka Suigetsu.",
  "aparencia": "A katana parece não mudar. Na liberação, a lâmina reflete como água parada e, para quem olha, se desfaz em névoa e espelhos antes de voltar ao normal.",
  "espirito": "Uma figura de contornos que mudam a cada olhar, com voz calma e educada; ninguém sabe se o que se vê dela é real.",
  "bankaiRelacionada": "",
  "bankaiEstilo": "",
  "efeitos": [
   {
    "id": "sk-hipnose"
   },
   {
    "id": "sk-kido"
   },
   {
    "id": "sk-mente"
   }
  ],
  "pontoFraco": "pg-vista",
  "habilidades": [
   {
    "nome": "Kanzen Saimin",
    "acao": "Ação",
    "dano": "",
    "regra": "Uma criatura a 18 m que viu a liberação: salvaguarda de Mente ou fica Enfeitiçada até o fim do próximo turno dela; ela vê você como aliado e um aliado seu como você.",
    "desc": "O mundo do alvo muda sem ele perceber.",
    "modelo": "Controle"
   },
   {
    "nome": "Corte no Reflexo",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[MEN]",
    "regra": "Golpe corpo a corpo com vantagem contra uma criatura Enfeitiçada ou Distorcida.",
    "desc": "A lâmina entra de onde o alvo jurava não haver ninguém.",
    "modelo": "Golpe atravessante"
   },
   {
    "nome": "Tempo no Espelho",
    "acao": "Ação bônus",
    "dano": "",
    "regra": "Uma criatura a 18 m que viu a liberação: salvaguarda de Mente ou fica Distorcida até o fim do próximo turno dela.",
    "desc": "Um segundo, para ela, dura um minuto.",
    "modelo": "Provocação"
   },
   {
    "nome": "Troca de Lugar",
    "acao": "Reação",
    "dano": "",
    "regra": "Quando uma criatura que viu a liberação ataca você ou um aliado a até 9 m: salvaguarda de Mente; na falha, o ataque, com a mesma rolagem, acerta outra criatura a até 3 m do alvo, à sua escolha.",
    "desc": "O inimigo enxerga o alvo onde está o próprio amigo.",
    "modelo": "Barreira"
   }
  ],
  "ppGasto": 6,
  "custoLiberacao": 10,
  "crescimento": "Nível 10 (5 PP): troque Kidō Canalizado por Corpo Leve (bruto 8, líquido 5; o Espelho é preço e devolve 3 inteiros). Nível 18+ (8 PP): acrescente Lâmina Afiada ou Corpo Leve. Exige aprovação do Mestre: a ilusão mexe com o jogo de todos."
 }
];

export const FONTES_SHIKAI: string[] = ["https://sportskeeda.com/anime/what-shikai-release-commands-bleach-25-famous-zanpakutos-shikai-commands", "https://comicbook.com/anime/list/bleach-every-ichigo-form-explained-list", "https://www.animeexplained.com/explained/bleach-byakuya-kuchikis-zanpakuto-senbonzakura-explained", "https://www.cbr.com/bleach-toshiro-hitsugaya-zanpakuto-explained/", "https://swordslice.com/blogs/news/renji-s-sword-in-bleach-from-shikai-to-bankai-transformation", "https://en.wikipedia.org/wiki/Renji_Abarai", "https://www.animeexplained.com/?p=10929", "https://www.cbr.com/bleach-manga-ryujin-jakka-facts-trivia/", "https://www.animeexplained.com/explained/bleach-shunsui-kyorakus-zanpakuto-katen-kyokotsu-explained/", "https://fictionhorizon.com/what-is-komamuras-special-power-in-bleach/", "https://www.animeexplained.com/explained/bleach-mayuri-kurotsuchis-zanpakuto-explained/", "https://en.wikipedia.org/wiki/Mayuri_Kurotsuchi", "https://www.soapcentral.com/anime/whose-zanpakuto-suzumebachi-bleach-explained", "https://swordslice.com/blogs/news/kisuke-sword-abilities-explained-from-shikai-to-bankai", "https://gotai13.blogspot.com/2010/03/tosen-kaname.html", "https://fictionhorizon.com/bleach-rukias-shikai-sode-no-shirayuki-explained/", "https://www.animeexplained.com/explained/bleach-rukias-zanpakuto-sode-no-shirayuki-explained", "https://giantbomb.com/wiki/Characters/Rangiku_Matsumoto", "https://sportskeeda.com/anime/was-tosen-immune-aizen-s-kyoka-suigetsu-bleach-explained"];

const ATR_NOME: Record<string, string> = { for: "Força", des: "Destreza", con: "Constituição", men: "Mente", esp: "Espírito" };
function nomeDaPeca(nome: string, param?: { atr?: string; tipo?: string; n?: number }): string {
  if (param?.atr) return `${nome} (${ATR_NOME[param.atr] ?? param.atr})`;
  if (param?.tipo) return `${nome} (${param.tipo})`;
  if (param?.n) return `${nome} (+${param.n})`;
  return nome;
}

/** Monta a Shikai pronta com peças, habilidades, ponto fraco, custo e duração calculados. */
export function formaDaShikai(m: ModeloShikaiMontado, ctx: CtxForma): Partial<FormaLib> {
  const cart = CARTOES_SHIKAI[m.id];
  if (cart) return formaDaShikaiComCartoes(m, ctx);
  const efeitos: InstEfeito[] = [];
  const total = orcamentoBase("shikai", ctx.n);
  const fora: string[] = [];
  const nova = (e: { id: string; param?: { atr?: string; tipo?: string; n?: number } }) => {
    const p = presetPorId(e.id);
    return p ? { id: novoId(), preset: p.id, nome: nomeDaPeca(p.nome, e.param), texto: p.texto, efeitos: p.monta((e.param ?? {}) as never), pp: p.pp } as InstEfeito : null;
  };
  // o ponto fraco entra primeiro (ele devolve pontos); as peças entram na ordem do modelo enquanto couberem no orçamento do nível
  const fraco = nova({ id: m.pontoFraco, param: m.pontoFracoParam });
  if (fraco) efeitos.push(fraco);
  for (const e of m.efeitos) {
    const x = nova(e);
    if (!x) continue;
    if (liquidoPecas([...efeitos, x], total, ctx) <= total) efeitos.push(x);
    else fora.push(x.nome);
  }
  const cx = { ...ctx, tipo: "shikai" };
  const habilidades: HabForma[] = m.habilidades.map((h) => {
    const a = h.dano ? analisarDano(h.dano, h.acao, cx, false, (h as { especial?: { condicao: string; duracao: string } }).especial ?? false) : null;
    const pr = a ? a.custoPr : 0;
    return { id: novoId(), nome: h.nome, acao: h.acao, custo: pr ? `${pr} PR` : "", pr: pr || undefined, dano: h.dano || undefined, modelo: h.modelo || undefined, regra: h.regra, desc: h.desc, especial: (h as { especial?: { condicao: string; duracao: string } }).especial, limite: (h as { especial?: unknown }).especial ? undefined : (/uma vez por cena/i.test(h.regra) ? "cena" as const : undefined), texto: [h.desc, h.regra].filter(Boolean).join("\n") };
  });
  const lib = calcularLiberacao("shikai", efeitos, ctx, {});
  return { tipo: "shikai", modelo: m.id, nome: m.nome, comando: m.comando, categoria: m.categoria, aparencia: m.aparencia, espirito: m.espirito, efeitos, habilidades, pontoFraco: presetPorId(m.pontoFraco)?.nome ?? "", ...armaDoModelo("shikai", m.id), custo: lib.custoPr ?? 5, duracao: "até você encerrar", texto: fora.length ? `${m.resumo}\nCartões que ainda não cabem no seu nível e entram quando a Shikai crescer (até 8 PP no nível 13): ${fora.join(", ")}.` : m.resumo };
}

/** Os habilidades do modelo como estão no livro (dano e PR não mudam). */
function habilidadesDoModelo(m: ModeloShikaiMontado, ctx: CtxForma): HabForma[] {
  const cx = { ...ctx, tipo: "shikai" };
  return m.habilidades.map((h) => {
    const a = h.dano ? analisarDano(h.dano, h.acao, cx, false, (h as { especial?: { condicao: string; duracao: string } }).especial ?? false) : null;
    const pr = a ? a.custoPr : 0;
    return { id: novoId(), nome: h.nome, acao: h.acao, custo: pr ? `${pr} PR` : "", pr: pr || undefined, dano: h.dano || undefined, modelo: h.modelo || undefined, regra: h.regra, desc: h.desc, especial: (h as { especial?: { condicao: string; duracao: string } }).especial, limite: (h as { especial?: unknown }).especial ? undefined : (/uma vez por cena/i.test(h.regra) ? "cena" as const : undefined), texto: [h.desc, h.regra].filter(Boolean).join("\n") };
  });
}

/** A Shikai do modelo montada só com os cartões neutros: ações com os números do livro, cartões de característica e de condição, ponto fraco neutro e o resto como sabor. */
function formaDaShikaiComCartoes(m: ModeloShikaiMontado, ctx: CtxForma): Partial<FormaLib> {
  const cart = CARTOES_SHIKAI[m.id];
  const total = orcamentoBase("shikai", ctx.n);
  const habilidades = marcarAcoes(habilidadesDoModelo(m, ctx), cart.acoes);
  const { efeitos, fora, pontoFraco } = montarCartoesModelo(cart, habilidades, { ...ctx, tipo: "shikai" }, "shikai", total, novoId);
  const lib = calcularLiberacao("shikai", efeitos, ctx, {});
  const texto = [m.resumo, cart.sabor, fora.length ? `Cartões que ainda não cabem no seu nível e entram quando a Shikai crescer: ${fora.join("; ")}.` : ""].filter(Boolean).join("\n");
  return { tipo: "shikai", modelo: m.id, nome: m.nome, comando: m.comando, categoria: m.categoria, aparencia: m.aparencia, espirito: m.espirito, efeitos, habilidades, pontoFraco, ...armaDoModelo("shikai", m.id), custo: lib.custoPr ?? 5, duracao: "até você encerrar", texto };
}
