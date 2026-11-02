import type { FormaLib, HabForma, TipoForma } from "./ficha";
const novoId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));
import { presetPorId } from "./efeitos-presets";
import type { CtxForma, InstEfeito } from "./efeitos-forma";
import { analisarDano } from "./teto-dano";
import { calcularLiberacao } from "./liberacao-forma";

export interface HabModelo { nome: string; acao: string; dano: string; regra: string; desc: string; modelo: string; especial?: { condicao: string; duracao: string } }
export interface FormaModelo {
  nome: string; comando: string; aparencia: string; estilo?: "potencializadora" | "transformadora";
  efeitos: { id: string; param?: { atr?: string; tipo?: string; n?: number } }[];
  pontoFraco: string; habilidades: HabModelo[]; ppGasto: number;
  preRequisito?: string; nota?: string;
}
export interface ModeloMontado {
  id: string; nome: string; dono: string; resumo: string; tema: string;
  bankai: FormaModelo & { estilo: "potencializadora" | "transformadora" };
  verdadeira: FormaModelo | null;
}
export type { HabForma, TipoForma };

export const MODELOS_BANKAI: ModeloMontado[] = [
 {
  "id": "tensa-zangetsu",
  "nome": "Zangetsu",
  "dono": "Ichigo Kurosaki",
  "resumo": "Todo o poder comprimido num corpo veloz e numa lâmina negra: rápido demais para ser visto.",
  "tema": "Velocidade e reiatsu negra comprimida",
  "bankai": {
   "nome": "Tensa Zangetsu",
   "comando": "Bankai! Tensa Zangetsu.",
   "estilo": "transformadora",
   "aparencia": "Um shihakushō negro de barra rasgada, preso ao corpo como um sobretudo, substitui o uniforme. A espada encolhe para uma katana negra de guarda em forma de suástica invertida, com uma corrente curta no cabo. A reiatsu negra e vermelha escapa em faíscas a cada passo.",
   "efeitos": [
    {
     "id": "bk-veloz"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "des"
     }
    },
    {
     "id": "bk-negra"
    },
    {
     "id": "bk-precisao"
    },
    {
     "id": "bk-duplo"
    },
    {
     "id": "bk-reacao"
    },
    {
     "id": "bk-explosao"
    }
   ],
   "pontoFraco": "pf-frenesi-leve",
   "habilidades": [
    {
     "nome": "Getsuga Tenshō Negro",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Linha de 18 m: salvaguarda de Destreza, metade no sucesso.",
     "desc": "Uma meia-lua negra de bordas vermelhas rasga o chão e tudo no caminho.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Cortes Sem Imagem",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[DES]",
     "regra": "Dois golpes contra o mesmo alvo ou contra dois alvos a 3 m um do outro; o dano é dividido.",
     "desc": "Ichigo some e reaparece duas vezes antes de o alvo virar a cabeça.",
     "modelo": "Rajada"
    },
    {
     "nome": "Passo Residual",
     "acao": "Ação bônus",
     "dano": "",
     "regra": "Move até o dobro do deslocamento sem provocar ataques; o primeiro ataque contra você até o seu próximo turno tem desvantagem.",
     "desc": "Deixa para trás uma imagem que ainda parece estar ali.",
     "modelo": "Passo veloz"
    },
    {
     "nome": "Getsuga à Queima-Roupa",
     "acao": "Reação",
     "dano": "[NIV/2]d10+[ESP]",
     "regra": "Quando uma criatura o acerta corpo a corpo, você revida com o dano indicado nela.",
     "desc": "A lâmina negra solta a meia-lua colada ao corpo do inimigo.",
     "modelo": "Contra-ataque"
    }
   ],
   "ppGasto": 17
  },
  "verdadeira": {
   "nome": "Tensa Zangetsu: Correntes de Sangue",
   "comando": "Sangra, Tensa Zangetsu.",
   "aparencia": "A pele fica rubra e surge um segundo chifre; o shihakushō se rasga no peito. Cinco correntes de sangue prendem o pescoço, as mãos e os pés, e a lâmina engrossa num prateado quase negro.",
   "preRequisito": "Exige a Bankai Tensa Zangetsu já ativa (a Verdadeira existe em cima dela).",
   "efeitos": [
    {
     "id": "bv-final"
    },
    {
     "id": "bk-clones"
    },
    {
     "id": "bk-passo-clones"
    },
    {
     "id": "bk-correntes"
    },
    {
     "id": "bk-escudo-corrente"
    },
    {
     "id": "bk-veloz"
    },
    {
     "id": "bk-ferro"
    },
    {
     "id": "bk-negra"
    }
   ],
   "pontoFraco": "pg-sangue",
   "habilidades": [
    {
     "nome": "Getsuga Final dos Clones",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Reabsorve os clones ativos: +1d10 por clone absorvido, até 2.",
     "desc": "Os clones se desfazem em sangue e voltam para a lâmina antes do corte.",
     "modelo": "Técnica final"
    },
    {
     "nome": "Chuva de Clones",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Área de 6 m: salvaguarda de Destreza, metade no sucesso.",
     "desc": "Clones caem de todos os lados ao mesmo tempo.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Correntes que Prendem",
     "acao": "Ação bônus",
     "dano": "4d10+[ESP]",
     "regra": "Se falhar na salvaguarda de Força, o alvo fica Preso até o fim do próximo turno dele.",
     "desc": "As correntes do pescoço disparam e enrolam o alvo.",
     "modelo": "Controle"
    }
   ],
   "nota": "Deixa de ser só velocidade: ganha clones, correntes de defesa e Forma Final, mas o sangue cobra metade do nível em dano a cada turno.",
   "ppGasto": 23
  }
 },
 {
  "id": "senbonzakura-kageyoshi",
  "nome": "Senbonzakura",
  "dono": "Byakuya Kuchiki",
  "resumo": "Mil espadas viram uma tempestade de pétalas que ataca e defende ao mesmo tempo.",
  "tema": "Mil lâminas e controle de área",
  "bankai": {
   "nome": "Senbonzakura Kageyoshi",
   "comando": "Bankai. Senbonzakura Kageyoshi.",
   "estilo": "potencializadora",
   "aparencia": "A espada cai e afunda no chão; duas fileiras de lâminas gigantes sobem ao redor e se desfazem em incontáveis pétalas rosadas. Byakuya fica imóvel no centro, guiando a nuvem com a mão.",
   "efeitos": [
    {
     "id": "bk-mil"
    },
    {
     "id": "bk-maos"
    },
    {
     "id": "bk-escudo-petalas"
    },
    {
     "id": "bk-precisao"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    },
    {
     "id": "bk-reacao"
    }
   ],
   "pontoFraco": "pf-passos",
   "habilidades": [
    {
     "nome": "Tempestade de Pétalas",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Área de 6 m: salvaguarda de Destreza, metade no sucesso.",
     "desc": "Uma onda de pétalas cortantes varre a área.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Gōkei: Esfera Sem Saída",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Alvo único a até 18 m; se falhar na salvaguarda de Destreza, também fica Preso até o fim do próximo turno dele.",
     "desc": "As pétalas formam uma esfera sem frestas e se fecham sobre o alvo.",
     "modelo": "Controle"
    },
    {
     "nome": "Rio de Lâminas",
     "acao": "Ação bônus",
     "dano": "5d10+[ESP]",
     "regra": "Ataque à distância contra um alvo a até 18 m.",
     "desc": "Uma corrente de pétalas segue o gesto dos dedos.",
     "modelo": "Reforço"
    },
    {
     "nome": "Parede Rosada",
     "acao": "Reação",
     "dano": "2d10+[PROF]",
     "regra": "Reduz o dano sofrido por você ou por um aliado a 3 m na quantidade indicada.",
     "desc": "A nuvem se fecha num muro antes do impacto.",
     "modelo": "Defesa"
    }
   ],
   "ppGasto": 18
  },
  "verdadeira": {
   "nome": "Senkei · Shūkei: Hakuteiken",
   "comando": "Senkei. Senbonzakura Kageyoshi.",
   "aparencia": "As pétalas se alinham em fileiras de espadas que formam um anel em volta dos dois lutadores. No passo final, todas se fundem numa só lâmina branca; asas de luz e um halo surgem nas costas de Byakuya.",
   "preRequisito": "Exige a Bankai Senbonzakura Kageyoshi ativa há pelo menos 2 turnos. Como ação, você recolhe as pétalas no Campo de Mil Espadas; a forma começa no turno seguinte.",
   "efeitos": [
    {
     "id": "bv-senkei"
    },
    {
     "id": "bv-final"
    },
    {
     "id": "bk-asas"
    },
    {
     "id": "bv-sem-defesa"
    },
    {
     "id": "bv-heranca"
    },
    {
     "id": "bk-precisao"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    },
    {
     "id": "bk-fio-golpe",
     "param": {
      "n": 1
     }
    }
   ],
   "pontoFraco": "pg-aberto",
   "habilidades": [
    {
     "nome": "Shūkei: Hakuteiken",
     "acao": "Ação",
     "dano": "[NIV/2+4]d10+[ESP]",
     "regra": "Golpe único; voa até 9 m antes de cortar sem provocar ataques.",
     "desc": "Todas as espadas viram uma lâmina branca em forma de ave.",
     "modelo": "Técnica final"
    },
    {
     "nome": "Lâmina na Mão",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[ESP]",
     "regra": "Dois golpes contra o mesmo alvo ou contra dois alvos a 3 m um do outro; o dano é dividido.",
     "desc": "Byakuya chama uma das espadas do anel para a mão e corta de perto.",
     "modelo": "Rajada"
    },
    {
     "nome": "Fileiras que Fecham",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Todos os inimigos dentro do anel: salvaguarda de Destreza, metade no sucesso.",
     "desc": "As fileiras do Senkei desabam para dentro.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Asas Brancas",
     "acao": "Ação bônus",
     "dano": "",
     "regra": "Voa o dobro do deslocamento sem provocar ataques e depois pode atacar.",
     "desc": "Um bater de asas de luz.",
     "modelo": "Passo veloz"
    }
   ],
   "nota": "Troca toda a defesa (sem reações, CR -5) por ataque puro: anel que prende, voo e golpes que ignoram redução de dano.",
   "ppGasto": 23
  }
 },
 {
  "id": "daiguren-hyorinmaru",
  "nome": "Hyōrinmaru",
  "dono": "Tōshirō Hitsugaya",
  "resumo": "Um dragão de gelo vestido como armadura, que cresce até virar a forma adulta quando as flores caem.",
  "tema": "Gelo e contagem regressiva",
  "bankai": {
   "nome": "Daiguren Hyōrinmaru",
   "comando": "Bankai. Daiguren Hyōrinmaru.",
   "estilo": "potencializadora",
   "aparencia": "Gelo cobre os braços em garras de dragão, uma cauda e grandes asas cristalinas nas costas. Atrás dele pairam três flores de gelo de quatro pétalas que vão se desfazendo.",
   "efeitos": [
    {
     "id": "bk-flores-gelo"
    },
    {
     "id": "bk-asas"
    },
    {
     "id": "bk-gelo-lento"
    },
    {
     "id": "bk-elemento",
     "param": {
      "tipo": "Gelo"
     }
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    },
    {
     "id": "bk-fio",
     "param": {
      "n": 1
     }
    },
    {
     "id": "bk-reacao"
    },
    {
     "id": "bk-precisao"
    }
   ],
   "pontoFraco": "pg-degelo",
   "habilidades": [
    {
     "nome": "Ryūsenka",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Golpe corpo a corpo; se falhar na salvaguarda de Constituição, o alvo fica Congelado até o fim do próximo turno dele.",
     "desc": "A lâmina perfura e o gelo floresce dentro do alvo antes de estilhaçar.",
     "modelo": "Ataque básico"
    },
    {
     "nome": "Guncho Tsurara",
     "acao": "Ação bônus",
     "dano": "5d10+[ESP]",
     "regra": "Cone de 9 m: salvaguarda de Destreza, metade no sucesso.",
     "desc": "Um leque de pássaros de gelo sai das asas.",
     "modelo": "Reforço"
    },
    {
     "nome": "Sennen Hyōrō",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[ESP]",
     "regra": "Alvo a até 18 m: se falhar na salvaguarda de Força, fica Preso até o fim do próximo turno dele.",
     "desc": "Pilares de gelo sobem em volta do alvo e se fecham.",
     "modelo": "Controle"
    },
    {
     "nome": "Clone de Gelo",
     "acao": "Reação",
     "dano": "",
     "regra": "Uma vez por cena, quando for atacado: o atacante refaz o ataque com desvantagem, porque acertou um clone de gelo.",
     "desc": "Hitsugaya já estava atrás; o que foi cortado era gelo.",
     "modelo": "Defesa"
    }
   ],
   "ppGasto": 17
  },
  "verdadeira": {
   "nome": "Daiguren Hyōrinmaru: Forma Adulta",
   "comando": "(sem comando: a forma amadurece sozinha quando a última pétala cai)",
   "aparencia": "O corpo cresce até a forma adulta; as asas somem e o gelo fica só nos ombros, braços e pernas, como uma armadura fina. Tudo ao redor dele embranquece de geada.",
   "preRequisito": "A Bankai Daiguren Hyōrinmaru deve estar ativa há 6 turnos completos (as 12 pétalas caem, duas por turno). No 7º turno, como ação bônus, você amadurece: as flores e as asas somem e a forma adulta começa com duração cheia (10 turnos).",
   "efeitos": [
    {
     "id": "bv-quatro-elementos"
    },
    {
     "id": "bv-final"
    },
    {
     "id": "bk-gelo-lento"
    },
    {
     "id": "bk-elemento",
     "param": {
      "tipo": "Gelo"
     }
    },
    {
     "id": "bv-absoluta"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    },
    {
     "id": "bk-fio",
     "param": {
      "n": 1
     }
    },
    {
     "id": "bk-veloz"
    }
   ],
   "pontoFraco": "pg-degelo",
   "habilidades": [
    {
     "nome": "Hyōten Hyakkasō",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Área de 9 m a até 30 m: salvaguarda de Constituição, metade no sucesso; na falha, também Congelado até o fim do próximo turno.",
     "desc": "O céu escurece, a neve cai por um buraco nas nuvens e cada floco vira uma flor de gelo.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Toque dos Quatro Elementos",
     "acao": "Ação bônus",
     "dano": "5d10+[ESP]",
     "regra": "Golpe corpo a corpo: o alvo não recupera PV até o fim do próximo turno dele.",
     "desc": "Tudo o que encosta nele congela por dentro.",
     "modelo": "Reforço"
    },
    {
     "nome": "Ryūsenka",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Golpe corpo a corpo; se falhar na salvaguarda de Constituição, Congelado até o fim do próximo turno dele.",
     "desc": "A perfuração congela e parte o alvo.",
     "modelo": "Ataque básico"
    },
    {
     "nome": "Sennen Hyōrō",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[ESP]",
     "regra": "Alvo a até 18 m: se falhar na salvaguarda de Força, Preso até o fim do próximo turno dele.",
     "desc": "Uma prisão de pilares de gelo se fecha.",
     "modelo": "Controle"
    }
   ],
   "nota": "Perde as asas e a cura das pétalas; ganha congelamento por toque, Forma Final e golpes que ignoram 10 de redução de dano.",
   "ppGasto": 24
  }
 },
 {
  "id": "hihio-zabimaru",
  "nome": "Zabimaru",
  "dono": "Renji Abarai",
  "resumo": "Uma serpente de ossos gigantesca que chicoteia de longe e dispara reiatsu pela boca.",
  "tema": "Alcance, força bruta e segmentos",
  "bankai": {
   "nome": "Hihiō Zabimaru",
   "comando": "Bankai! Hihiō Zabimaru.",
   "estilo": "potencializadora",
   "aparencia": "A lâmina vira uma serpente de ossos enorme, de segmentos ligados por reiatsu e cabeça de babuíno. Renji ganha um manto de pele nos ombros e segura a cauda como um chicote.",
   "efeitos": [
    {
     "id": "bk-segmentos"
    },
    {
     "id": "bk-fio-golpe",
     "param": {
      "n": 2
     }
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "for"
     }
    },
    {
     "id": "bk-ferro"
    },
    {
     "id": "bk-reacao"
    },
    {
     "id": "bk-ceifa"
    }
   ],
   "pontoFraco": "pf-passos",
   "habilidades": [
    {
     "nome": "Hikotsu Taihō",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Linha de 30 m: salvaguarda de Destreza, metade no sucesso.",
     "desc": "A boca da serpente se abre e solta um canhão de reiatsu vermelha.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Mordida do Babuíno",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[FOR]",
     "regra": "Se falhar na salvaguarda de Força, o alvo fica Agarrado pelas presas.",
     "desc": "A cabeça de ossos fecha a mandíbula no alvo.",
     "modelo": "Controle"
    },
    {
     "nome": "Chicote de Segmentos",
     "acao": "Ação bônus",
     "dano": "5d10+[FOR]",
     "regra": "Golpe a até 12 m.",
     "desc": "A cauda varre de lado.",
     "modelo": "Reforço"
    },
    {
     "nome": "Segmentos que Voltam",
     "acao": "Reação",
     "dano": "2d10+[PROF]",
     "regra": "Reduz o dano sofrido por você na quantidade indicada.",
     "desc": "Os segmentos se espalham para amortecer e se religam logo depois.",
     "modelo": "Defesa"
    }
   ],
   "ppGasto": 16
  },
  "verdadeira": {
   "nome": "Sōō Zabimaru",
   "comando": "Bankai. Sōō Zabimaru.",
   "aparencia": "A serpente encolhe: no braço direito, uma manopla em forma de crânio de cobra com uma cauda de vértebras; no esquerdo, um braço gigante de ossos que copia cada movimento. O manto de pele fica mais longo e claro.",
   "preRequisito": "Exige a Bankai Hihiō Zabimaru já ativa. Como ação bônus, a serpente se recolhe em braço e lâmina.",
   "efeitos": [
    {
     "id": "bv-braco-osso"
    },
    {
     "id": "bv-final"
    },
    {
     "id": "bk-fio-golpe",
     "param": {
      "n": 2
     }
    },
    {
     "id": "bv-eco"
    },
    {
     "id": "bk-ferro"
    },
    {
     "id": "bk-precisao"
    }
   ],
   "pontoFraco": "pf-sede",
   "habilidades": [
    {
     "nome": "Zaga Teppō",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[FOR]",
     "regra": "Só contra um alvo Agarrado pelo braço de ossos: o alvo não pode reduzir esse dano com reação.",
     "desc": "As mandíbulas de ossos se fecham no alvo e explodem à queima-roupa.",
     "modelo": "Técnica final"
    },
    {
     "nome": "Orochiō",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[FOR]",
     "regra": "Golpe a até 15 m; depois, puxa o alvo 6 m para perto.",
     "desc": "As vértebras saltam da cintura e cortam como uma cauda.",
     "modelo": "Ataque básico"
    },
    {
     "nome": "Punho de Hihiō",
     "acao": "Ação bônus",
     "dano": "5d10+[FOR]",
     "regra": "Se acertar, o alvo faz salvaguarda de Força ou fica Caído.",
     "desc": "O braço gigante de ossos desce como um martelo.",
     "modelo": "Reforço"
    },
    {
     "nome": "Garra Óssea",
     "acao": "Reação",
     "dano": "[NIV/2]d10+[FOR]",
     "regra": "Quando uma criatura o acerta corpo a corpo, o braço revida com o dano indicado.",
     "desc": "A mão de ossos agarra o golpe e devolve.",
     "modelo": "Contra-ataque"
    }
   ],
   "nota": "Troca o alcance enorme por duas armas próximas: um ataque extra por ação, braço que agarra e defende, e o Zaga Teppō contra quem está preso.",
   "ppGasto": 23
  }
 },
 {
  "id": "zanka-no-tachi",
  "nome": "Ryūjin Jakka",
  "dono": "Genryūsai Shigekuni Yamamoto",
  "resumo": "O fogo some da vista e se esconde na lâmina: o que ela toca vira cinza.",
  "tema": "Fogo absoluto e tempo curto",
  "bankai": {
   "nome": "Zanka no Tachi",
   "comando": "Bankai. Zanka no Tachi.",
   "estilo": "potencializadora",
   "aparencia": "As chamas se apagam de uma vez e a lâmina fica escura, como madeira queimada. O ar treme em volta de Yamamoto, o chão racha e seca sob os pés e a água por perto evapora.",
   "efeitos": [
    {
     "id": "bk-sol-nascente"
    },
    {
     "id": "bk-manto-sol"
    },
    {
     "id": "bk-cinzas"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "for"
     }
    },
    {
     "id": "bk-ferro"
    }
   ],
   "pontoFraco": "pg-sol",
   "habilidades": [
    {
     "nome": "Higashi: Kyokujitsujin",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[FOR]",
     "regra": "Golpe corpo a corpo; se falhar na salvaguarda de Constituição, o alvo fica Queimado.",
     "desc": "Um corte limpo de lâmina escura que desfaz o que toca.",
     "modelo": "Ataque básico"
    },
    {
     "nome": "Kita: Tenchi Kaijin",
     "acao": "Ação",
     "dano": "[NIV/2+4]d10+[FOR]",
     "regra": "Linha de 30 m: salvaguarda de Destreza, metade no sucesso.",
     "desc": "Um único corte solta uma onda de fogo que apaga tudo no caminho.",
     "modelo": "Técnica final"
    },
    {
     "nome": "Minami: Exército de Cinzas",
     "acao": "Ação",
     "dano": "",
     "regra": "Ergue a Legião de Cinzas; neste turno os esqueletos já podem agir e o alvo deles faz salvaguarda de Mente ou fica Amedrontado por 1 turno.",
     "desc": "Mortos que ele derrotou sobem das cinzas para lutar.",
     "modelo": "Proteção"
    },
    {
     "nome": "Nishi: Zanjitsu Gokui",
     "acao": "Reação",
     "dano": "2d10+[PROF]",
     "regra": "Reduz o dano sofrido por você ou por um aliado a 3 m; o atacante corpo a corpo faz salvaguarda de Constituição ou fica Queimado.",
     "desc": "O manto de calor queima a arma antes de ela chegar.",
     "modelo": "Defesa"
    }
   ],
   "ppGasto": 17
  },
  "verdadeira": null
 },
 {
  "id": "karamatsu-shinju",
  "nome": "Katen Kyōkotsu",
  "dono": "Shunsui Kyōraku",
  "resumo": "Uma tragédia em quatro atos onde a dor é dividida e o fim é sempre o mesmo.",
  "tema": "Aposta, dor partilhada e destino",
  "bankai": {
   "nome": "Katen Kyōkotsu: Karamatsu Shinjū",
   "comando": "Bankai. Katen Kyōkotsu: Karamatsu Shinjū.",
   "estilo": "potencializadora",
   "aparencia": "Sombras como tentáculos se espalham ao redor de Shunsui e o chão se cobre de quadrados amarelados. Uma aura fria e melancólica pesa sobre todos na área, e o brilho das espadas fica opaco.",
   "efeitos": [
    {
     "id": "bk-ferida-partilhada"
    },
    {
     "id": "bk-dominio"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    },
    {
     "id": "bk-precisao"
    },
    {
     "id": "bk-reacao"
    },
    {
     "id": "bk-veloz"
    },
    {
     "id": "bk-fio",
     "param": {
      "n": 1
     }
    }
   ],
   "pontoFraco": "pf-atos",
   "habilidades": [
    {
     "nome": "Ato 1: Tameraikizu no Wakachiai",
     "acao": "Ação bônus",
     "dano": "",
     "regra": "Ato 1. Ativa a Ferida Partilhada contra um alvo a 9 m (salvaguarda de Mente evita).",
     "desc": "A ferida de um vira a ferida do outro.",
     "modelo": "Marca"
    },
    {
     "nome": "Ato 2: Zanki no Shitone",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[ESP]",
     "regra": "Ato 2. Área de 9 m: salvaguarda de Constituição; na falha, também Sangramento por 2 turnos; metade e sem condição no sucesso.",
     "desc": "Manchas negras de vergonha surgem na pele e sangram.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Ato 3: Dangyo no Fuchi",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[ESP]",
     "regra": "Ato 3. Área de 9 m: salvaguarda de Força ou Preso até o fim do próximo turno (a água sobe); você não é afetado.",
     "desc": "Uma água escura sobe até a cintura e não deixa ninguém sair.",
     "modelo": "Controle"
    },
    {
     "nome": "Ato 4: Itokiribasami Chizome no Nodobue",
     "acao": "Ação",
     "dano": "[NIV/2+4]d10+[ESP]",
     "regra": "Ato 4. Alvo único a até 3 m; depois dele a peça termina.",
     "desc": "Um corte com os dedos no fio do arrependimento, e a cortina cai.",
     "modelo": "Técnica final"
    }
   ],
   "ppGasto": 16
  },
  "verdadeira": null
 },
 {
  "id": "kokujo-tengen-myoo",
  "nome": "Tenken",
  "dono": "Sajin Komamura",
  "resumo": "Um gigante de armadura copia cada gesto do dono e sangra junto com ele.",
  "tema": "Invocação colossal e defesa",
  "bankai": {
   "nome": "Kokujō Tengen Myōō",
   "comando": "Bankai! Kokujō Tengen Myōō.",
   "estilo": "transformadora",
   "aparencia": "Um samurai gigante de armadura negra sobe às costas de Komamura, com uma espada enorme na mão. Ele imita cada movimento do dono, e as feridas do gigante abrem na pele de Komamura.",
   "efeitos": [
    {
     "id": "bk-colosso"
    },
    {
     "id": "bk-ferro"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "for"
     }
    },
    {
     "id": "bk-reacao"
    },
    {
     "id": "bk-fio-golpe",
     "param": {
      "n": 1
     }
    },
    {
     "id": "bk-explosao"
    },
    {
     "id": "bk-recompor"
    }
   ],
   "pontoFraco": "pf-elo",
   "habilidades": [
    {
     "nome": "Corte do Gigante",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[FOR]",
     "regra": "Cone de 9 m: salvaguarda de Destreza, metade no sucesso.",
     "desc": "A espada do gigante desce e corta o terreno.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Punho de Ferro Negro",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[FOR]",
     "regra": "Golpe a até 6 m; se falhar na salvaguarda de Força, o alvo fica Caído.",
     "desc": "O gigante esmaga o alvo com a manopla.",
     "modelo": "Ataque básico"
    },
    {
     "nome": "Guarda da Armadura",
     "acao": "Reação",
     "dano": "2d10+[PROF]",
     "regra": "Reduz o dano sofrido por você ou por um aliado a 3 m: o gigante põe o braço na frente.",
     "desc": "A armadura negra recebe o golpe.",
     "modelo": "Defesa"
    },
    {
     "nome": "Uivo do Lobo",
     "acao": "Ação bônus",
     "dano": "",
     "regra": "Inimigos a 9 m: salvaguarda de Mente ou Amedrontados por 1 turno.",
     "desc": "Komamura e o gigante urram juntos.",
     "modelo": "Marca"
    }
   ],
   "ppGasto": 18
  },
  "verdadeira": {
   "nome": "Kokujō Tengen Myōō: Dangai Jōe",
   "comando": "Kokujō Tengen Myōō: Dangai Jōe.",
   "aparencia": "Komamura assume a forma humana e o gigante perde a armadura: sobra um corpo esquelético de reishi, que se refaz de qualquer corte. A espada continua enorme, mas o gigante já não protege o dono.",
   "preRequisito": "Exige a Bankai Kokujō Tengen Myōō ativa e a Técnica de Humanização (você entrega o próprio coração). Como ação, a armadura cai. Só uma vez por descanso longo; a forma dura proficiência em turnos.",
   "efeitos": [
    {
     "id": "bv-corpo-ilusao"
    },
    {
     "id": "bk-colosso"
    },
    {
     "id": "bv-final"
    },
    {
     "id": "bv-outra-forma",
     "param": {
      "tipo": "Cortante"
     }
    },
    {
     "id": "bk-fio-golpe",
     "param": {
      "n": 1
     }
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "for"
     }
    },
    {
     "id": "bv-armadura"
    }
   ],
   "pontoFraco": "pg-contagem",
   "habilidades": [
    {
     "nome": "Golpe do Gigante Sem Cerne",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[FOR]",
     "regra": "Linha de 18 m: salvaguarda de Destreza, metade no sucesso.",
     "desc": "O gigante esquelético corta sem medo de ser ferido.",
     "modelo": "Técnica final"
    },
    {
     "nome": "Esmagar",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[FOR]",
     "regra": "Se falhar na salvaguarda de Força, o alvo fica Caído e Preso até o fim do próximo turno.",
     "desc": "A mão de reishi prende o alvo no chão.",
     "modelo": "Controle"
    },
    {
     "nome": "Lâmina do Homem",
     "acao": "Ação bônus",
     "dano": "5d10+[FOR]",
     "regra": "Golpe corpo a corpo do próprio Komamura.",
     "desc": "Agora humano, ele luta lado a lado com o gigante.",
     "modelo": "Reforço"
    }
   ],
   "nota": "O gigante fica indestrutível e você ganha Forma Final, mas a forma dura só proficiência em turnos e, ao terminar, você cai a 0 PV (estável).",
   "ppGasto": 24
  }
 },
 {
  "id": "konjiki-ashisogi-jizo",
  "nome": "Ashisogi Jizō",
  "dono": "Mayuri Kurotsuchi",
  "resumo": "Uma criatura dourada e grotesca que envenena o ar e renasce sob medida contra cada inimigo.",
  "tema": "Veneno, controle e ciência",
  "bankai": {
   "nome": "Konjiki Ashisogi Jizō",
   "comando": "Bankai. Konjiki Ashisogi Jizō.",
   "estilo": "transformadora",
   "aparencia": "Uma lagarta gigante e dourada com rosto de bebê e uma auréola prateada sobe do chão. Um lenço vermelho esconde fileiras de lâminas, e o hálito dela forma uma névoa roxa.",
   "efeitos": [
    {
     "id": "bk-lagarta"
    },
    {
     "id": "bk-nevoa-veneno"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "men"
     }
    },
    {
     "id": "bk-recompor"
    },
    {
     "id": "bk-ferro"
    },
    {
     "id": "bk-reacao"
    }
   ],
   "pontoFraco": "pg-descontrole",
   "habilidades": [
    {
     "nome": "Hálito Mortal",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[MEN]",
     "regra": "Cone de 9 m: salvaguarda de Constituição; na falha, também Envenenado por 2 turnos; metade e sem condição no sucesso.",
     "desc": "A criatura abre a boca e solta uma nuvem de veneno.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Lâminas sob o Lenço",
     "acao": "Ação bônus",
     "dano": "5d10+[MEN]",
     "regra": "Ataque da criatura contra um alvo a 3 m dela.",
     "desc": "Lâminas saltam de baixo do lenço vermelho.",
     "modelo": "Reforço"
    },
    {
     "nome": "Veneno Sob Medida",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[MEN]",
     "regra": "Se falhar na salvaguarda de Constituição, o alvo fica Paralisado até o fim do próximo turno dele.",
     "desc": "Mayuri ajusta a fórmula no meio da luta.",
     "modelo": "Controle"
    },
    {
     "nome": "Autodestruição",
     "acao": "Reação",
     "dano": "[NIV/2]d10+[MEN]",
     "regra": "Quando a criatura cai a 0 PV: explode em 6 m (salvaguarda de Destreza, metade). A invocação acaba.",
     "desc": "Um botão escondido e a criatura vira uma bomba de carne.",
     "modelo": "Contra-ataque"
    }
   ],
   "ppGasto": 16
  },
  "verdadeira": {
   "nome": "Konjiki Ashisogi Jizō: Matai Fukuin Shōtai",
   "comando": "Bankai. Konjiki Ashisogi Jizō: Matai Fukuin Shōtai.",
   "aparencia": "Um bebê gigante e deformado repousa sobre um monte de cordões umbilicais. Do ventre aberto dele nasce uma nova criatura, feita para o inimigo à frente.",
   "preRequisito": "Exige a Bankai Konjiki Ashisogi Jizō ativa há pelo menos 3 turnos, com o alvo escolhido ferido ou Envenenado por você nesse tempo (você coleta os dados). Como ação, o bebê dá à luz a cria adaptada.",
   "efeitos": [
    {
     "id": "bv-gestacao"
    },
    {
     "id": "bk-lagarta"
    },
    {
     "id": "bk-nevoa-veneno"
    },
    {
     "id": "bv-final"
    },
    {
     "id": "bv-inedito"
    }
   ],
   "pontoFraco": "pg-descontrole",
   "habilidades": [
    {
     "nome": "Devorar",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[MEN]",
     "regra": "Ataque da cria; se falhar na salvaguarda de Força, o alvo fica Agarrado dentro da boca.",
     "desc": "O bebê é grande o bastante para engolir um gigante.",
     "modelo": "Controle"
    },
    {
     "nome": "Mil Camadas",
     "acao": "Reação",
     "dano": "2d10+[PROF]",
     "regra": "Reduz o dano sofrido pela cria; se o atacante tentar dominar ou mudar o corpo dela, só uma camada se solta.",
     "desc": "Uma pele de milhares de camadas: perder uma não muda nada.",
     "modelo": "Defesa"
    },
    {
     "nome": "Hálito Mortal",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[MEN]",
     "regra": "Cone de 9 m: salvaguarda de Constituição; na falha, Envenenado por 2 turnos.",
     "desc": "O veneno agora é feito para esse inimigo.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Nervos Expostos",
     "acao": "Ação bônus",
     "dano": "",
     "regra": "O alvo estudado faz salvaguarda de Mente ou fica Atordoado até o fim do próximo turno dele: a cria sente a dor por ele.",
     "desc": "Nervos à mostra devolvem cada toque como dor.",
     "modelo": "Marca"
    }
   ],
   "nota": "A criatura nasce sob medida: resistente ao dano do alvo estudado, que tem desvantagem contra o veneno; técnicas ganham +2d10.",
   "ppGasto": 23
  }
 },
 {
  "id": "jakuho-raikoben",
  "nome": "Suzumebachi",
  "dono": "Soi Fon",
  "resumo": "Um canhão dourado que dispara um míssil só, devastador, e encerra a luta ou a forma.",
  "tema": "Artilharia de um disparo",
  "bankai": {
   "nome": "Jakuhō Raikōben",
   "comando": "Bankai. Jakuhō Raikōben.",
   "estilo": "transformadora",
   "aparencia": "Um canhão dourado e preto cobre o braço direito até o ombro, comprido como um míssil. Uma faixa dourada amarra o canhão ao corpo para aguentar o tranco do disparo.",
   "efeitos": [
    {
     "id": "bk-mil"
    },
    {
     "id": "bk-explosao"
    },
    {
     "id": "bk-precisao"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "des"
     }
    },
    {
     "id": "bk-veloz"
    },
    {
     "id": "bk-eletro"
    },
    {
     "id": "bk-ferro"
    },
    {
     "id": "bk-fio",
     "param": {
      "n": 1
     }
    }
   ],
   "pontoFraco": "pg-tiro",
   "habilidades": [
    {
     "nome": "Jakuhō Raikōben",
     "acao": "Ação",
     "dano": "[NIV/2+4]d10+[DES]",
     "regra": "Área de 12 m de raio a até 60 m: salvaguarda de Destreza, metade no sucesso. Ativa o Tiro Único.",
     "desc": "O míssil sai com um estrondo e abre uma cratera onde caiu.",
     "modelo": "Técnica final"
    },
    {
     "nome": "Ferrão Veloz",
     "acao": "Ação bônus",
     "dano": "5d10+[DES]",
     "regra": "Golpe corpo a corpo com a mão livre; o alvo fica marcado até o fim do seu próximo turno.",
     "desc": "O ferrão da Shikai ainda fere no meio do Shunpo.",
     "modelo": "Reforço"
    },
    {
     "nome": "Mira Ancorada",
     "acao": "Ação bônus",
     "dano": "",
     "regra": "Até o fim do turno, o próximo ataque à distância seu tem vantagem e você não pode ser empurrado nem derrubado.",
     "desc": "A faixa dourada estica e prende o corpo no chão.",
     "modelo": "Marca"
    }
   ],
   "ppGasto": 17
  },
  "verdadeira": null
 },
 {
  "id": "benihime-aratame",
  "nome": "Benihime",
  "dono": "Kisuke Urahara",
  "resumo": "Uma figura gigante que abre e costura tudo o que toca, de feridas a inimigos.",
  "tema": "Reestruturação e suporte",
  "bankai": {
   "nome": "Kannonbiraki Benihime Aratame",
   "comando": "Bankai. Kannonbiraki Benihime Aratame.",
   "estilo": "transformadora",
   "aparencia": "Uma figura feminina gigante de manto vermelho e tranças em laço surge atrás de Urahara. Os braços dela parecem de manequim e carregam agulha e linha.",
   "efeitos": [
    {
     "id": "bk-reestrutura"
    },
    {
     "id": "bk-colosso"
    },
    {
     "id": "bk-encanto"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "men"
     }
    },
    {
     "id": "bk-precisao"
    }
   ],
   "pontoFraco": "pg-costura",
   "habilidades": [
    {
     "nome": "Abrir e Costurar",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[MEN]",
     "regra": "Se falhar na salvaguarda de Constituição, o alvo fica Distorcido até o fim do próximo turno dele.",
     "desc": "A figura abre o inimigo como tecido e costura errado.",
     "modelo": "Controle"
    },
    {
     "nome": "Braços de Manequim",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[MEN]",
     "regra": "Ataque da figura contra um alvo a até 9 m.",
     "desc": "Os braços rígidos descem de cima.",
     "modelo": "Ataque básico"
    },
    {
     "nome": "Refazer o Corpo",
     "acao": "Ação",
     "dano": "[NIV]",
     "regra": "Você ou um aliado a 3 m recupera os PV indicados; conta para a Costura Desfeita.",
     "desc": "Pontos de linha vermelha fecham a ferida.",
     "modelo": "Regeneração"
    },
    {
     "nome": "Abrir Caminho",
     "acao": "Ação bônus",
     "dano": "",
     "regra": "Abre uma passagem numa parede, barreira ou Bakudō a até 9 m; ela fica aberta até o fim do seu próximo turno.",
     "desc": "Uma tesoura invisível corta a barreira de cima a baixo.",
     "modelo": "Passo veloz"
    }
   ],
   "ppGasto": 17
  },
  "verdadeira": null
 },
 {
  "id": "enma-korogi",
  "nome": "Suzumushi",
  "dono": "Kaname Tōsen",
  "resumo": "Um domo de silêncio absoluto onde só quem já vive no escuro sabe lutar.",
  "tema": "Privação de sentidos e sombra",
  "bankai": {
   "nome": "Suzumushi Tsuishiki: Enma Kōrogi",
   "comando": "Bankai. Suzumushi Tsuishiki: Enma Kōrogi.",
   "estilo": "transformadora",
   "aparencia": "Dez anéis surgem no ar e giram em volta de Tōsen; deles se fecha um domo negro. Lá dentro não há luz, som, cheiro nem reiatsu, só o tato.",
   "efeitos": [
    {
     "id": "bk-domo-grilo"
    },
    {
     "id": "bk-precisao"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "des"
     }
    },
    {
     "id": "bk-fio-golpe",
     "param": {
      "n": 1
     }
    },
    {
     "id": "bk-reacao"
    },
    {
     "id": "bk-duplo"
    }
   ],
   "pontoFraco": "pf-casca",
   "habilidades": [
    {
     "nome": "Corte no Silêncio",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[DES]",
     "regra": "Golpe corpo a corpo contra uma criatura dentro do domo.",
     "desc": "Ninguém ouve a lâmina sair da bainha.",
     "modelo": "Ataque básico"
    },
    {
     "nome": "Cem Lâminas do Grilo",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[DES]",
     "regra": "Dois golpes contra o mesmo alvo ou contra dois alvos a 3 m um do outro; o dano é dividido.",
     "desc": "A lâmina vibra e se divide em vários cortes.",
     "modelo": "Rajada"
    },
    {
     "nome": "Passo no Escuro",
     "acao": "Ação bônus",
     "dano": "",
     "regra": "Move até o dobro do deslocamento dentro do domo sem provocar ataques.",
     "desc": "Ele conhece o domo como a própria casa.",
     "modelo": "Passo veloz"
    },
    {
     "nome": "Lâmina Sentida",
     "acao": "Reação",
     "dano": "[NIV/2]d10+[DES]",
     "regra": "Quando uma criatura o acerta corpo a corpo, você revida com o dano indicado.",
     "desc": "Tōsen sente o golpe pelo ar e responde.",
     "modelo": "Contra-ataque"
    }
   ],
   "ppGasto": 17
  },
  "verdadeira": {
   "nome": "Suzumushi Hyakushiki: Grillar Grillo",
   "comando": "Suzumushi Hyakushiki: Grillar Grillo.",
   "aparencia": "A máscara Hollow cobre o rosto e o corpo vira um grilo humanoide de carapaça escura, com asas transparentes e olhos que enxergam pela primeira vez. O domo se desfaz.",
   "preRequisito": "Exige a Bankai Enma Kōrogi ativa e a máscara Hollow (Hollowificação) na ficha. Como ação bônus, você veste a máscara: o domo some e a forma começa. Derivada da Hollowificação: o Mestre aprova.",
   "efeitos": [
    {
     "id": "bk-asas"
    },
    {
     "id": "bv-final"
    },
    {
     "id": "bv-inedito"
    },
    {
     "id": "bv-outra-forma",
     "param": {
      "tipo": "Energia"
     }
    },
    {
     "id": "bk-precisao"
    },
    {
     "id": "bk-duplo"
    },
    {
     "id": "bk-forca",
     "param": {
      "atr": "des"
     }
    }
   ],
   "pontoFraco": "pf-casca",
   "habilidades": [
    {
     "nome": "Los Nueve Aspectos",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[DES]",
     "regra": "Dois golpes de garra contra o mesmo alvo ou dois alvos a 3 m um do outro; o dano é dividido.",
     "desc": "As garras descem em sequência, esmagando.",
     "modelo": "Rajada"
    },
    {
     "nome": "Cero do Grilo",
     "acao": "Ação",
     "dano": "[NIV/2+3]d10+[ESP]",
     "regra": "Linha de 30 m: salvaguarda de Destreza, metade no sucesso.",
     "desc": "Um Cero sai da máscara.",
     "modelo": "Golpe em área"
    },
    {
     "nome": "Canto das Asas",
     "acao": "Ação",
     "dano": "[NIV/2+2]d10+[ESP]",
     "regra": "Área de 6 m: salvaguarda de Constituição ou Surdo e Atordoado até o fim do próximo turno.",
     "desc": "As asas vibram num guincho que estoura os tímpanos.",
     "modelo": "Controle"
    },
    {
     "nome": "Ver pela Primeira Vez",
     "acao": "Ação bônus",
     "dano": "",
     "regra": "Até o fim do turno, você vê tudo a 36 m, inclusive criaturas Invisíveis, e o seu próximo ataque tem vantagem.",
     "desc": "O mundo aparece de repente, com cores.",
     "modelo": "Marca"
    }
   ],
   "nota": "Troca o domo por visão, voo e um corpo Hollow: Forma Final, +2d10 nas técnicas e resistência a Energia.",
   "ppGasto": 23
  }
 },
 {
 "id": "hakka-no-togame",
 "nome": "Hakka no Togame",
 "dono": "Rukia Kuchiki",
 "resumo": "A neve mais branca: um único golpe que congela tudo à volta, inclusive quem o usa.",
 "tema": "Gelo absoluto e custo extremo",
 "bankai": {
  "nome": "Hakka no Togame",
  "comando": "Bankai. Hakka no Togame.",
  "estilo": "potencializadora",
  "aparencia": "Rukia veste um quimono branco de manga longa, o cabelo se solta e esbranquiça, e uma fita de gelo sai da guarda da lâmina branca. A neve flutua em volta e o ar vira pó de cristal.",
  "efeitos": [
   {
    "id": "bk-elemento",
    "param": {
     "tipo": "Gelo"
    }
   },
   {
    "id": "bk-gelo-lento"
   },
   {
    "id": "bk-forca",
    "param": {
     "atr": "esp"
    }
   },
   {
    "id": "bk-veloz"
   },
   {
    "id": "bk-reacao"
   },
   {
    "id": "bk-barreira"
   },
   {
    "id": "bk-perfura"
   },
    {"id": "bk-pele", "param": {"tipo": "Gelo"}},
    {"id": "bk-sentidos"}
  ],
  "pontoFraco": "pg-degelo",
  "habilidades": [
   {
    "nome": "Hakka no Togame: Zero Absoluto",
    "acao": "Ação",
    "dano": "[NIV/2+4]d10+[ESP]",
    "regra": "Área de 6 m ao redor de você: salvaguarda de Constituição; na falha, dano total e Congelado até o fim do próximo turno do alvo; no sucesso, metade.",
    "especial": { "condicao": "Esgotado", "duracao": "até o fim da cena" },
    "desc": "A lâmina toca o chão e tudo ao redor vira cristal, num silêncio de inverno.",
    "modelo": "Técnica final"
   },
   {
    "nome": "Lâmina de Geada",
    "acao": "Ação",
    "dano": "[NIV/2+2]d10+[ESP]",
    "regra": "Golpe corpo a corpo; se falhar na salvaguarda de Constituição, o alvo fica Preso até o fim do próximo turno dele.",
    "desc": "A ponta deixa uma linha de gelo que sobe pelo corpo do inimigo.",
    "modelo": "Ataque básico"
   },
   {
    "nome": "Dança da Neve",
    "acao": "Ação bônus",
    "dano": "4d10+[ESP]",
    "regra": "Cone de 9 m: salvaguarda de Destreza, metade no sucesso.",
    "desc": "A manga branca gira e solta uma rajada de neve cortante.",
    "modelo": "Reforço"
   },
   {
    "nome": "Cortina Branca",
    "acao": "Reação",
    "dano": "",
    "regra": "Uma vez por cena, quando um ataque acerta você: o atacante refaz o ataque com desvantagem, porque acertou uma imagem de neve.",
    "desc": "Onde Rukia estava resta só neve soprada.",
    "modelo": "Barreira"
   }
  ],
  "ppGasto": 16
 },
 "verdadeira": null
},
{
 "id": "kyoka-alter-ego",
 "nome": "Kyōka Suigetsu: Alter-ego",
 "dono": "Sōsuke Aizen (versão da mesa)",
 "resumo": "O alter-ego da Kyōka Suigetsu: você se divide em reflexos que agem por você, e ninguém sabe qual é o real.",
 "tema": "Ilusão e reflexos",
 "bankai": {
  "nome": "Kyōka Suigetsu: Alter-ego",
  "comando": "Bankai. Kyōka Suigetsu, mostre o outro eu.",
  "estilo": "transformadora",
  "aparencia": "O ar ao redor vira um espelho calmo; várias cópias suas surgem lado a lado, todas sorrindo do mesmo jeito, e o som da lâmina vem sempre de algum outro lugar.",
  "efeitos": [
   {
    "id": "bk-clones"
   },
   {
    "id": "bk-passo-clones"
   },
   {
    "id": "bk-concentrado"
   },
   {
    "id": "bk-sentidos"
   },
   {
    "id": "bk-forca",
    "param": {
     "atr": "men"
    }
   },
   {
    "id": "bk-dominio"
   },
   {
    "id": "bk-reacao"
   }
  ],
  "pontoFraco": "pg-vista",
  "ppGasto": 16,
  "nota": "Versão da mesa: o Aizen não mostra uma Bankai na obra. Esta é inspirada na ideia de que a Bankai é o alter-ego da Zanpakutō. Precisa de aprovação do Mestre.",
  "habilidades": [
   {
    "nome": "Ilusão Completa",
    "acao": "Ação",
    "dano": "[NIV/2+2]d8+[MEN]",
    "regra": "Salvaguarda de Mente: na falha, dano total e Enfeitiçado até o fim do próximo turno do alvo, que ataca o reflexo errado; no sucesso, metade.",
    "desc": "Você sorri e o alvo vê, com todos os sentidos, o que você quer que veja.",
    "modelo": "Ataque básico"
   },
   {
    "nome": "Troca de Reflexo",
    "acao": "Reação",
    "dano": "",
    "regra": "Quando um ataque acerta você, troque de lugar com um clone seu a até 9 m: o ataque acerta o clone e some com ele.",
    "desc": "Onde você estava, só um reflexo que se desfaz como água.",
    "modelo": "Barreira"
   },
   {
    "nome": "Mundo de Espelhos",
    "acao": "Ação bônus",
    "dano": "4d8+[MEN]",
    "regra": "Cone de 9 m: salvaguarda de Mente; na falha, dano total e Distorcido até o fim do próximo turno do alvo; no sucesso, metade.",
    "desc": "Cada superfície devolve um você diferente, e o chão deixa de parecer chão.",
    "modelo": "Reforço"
   },
   {
    "nome": "Despertar do Alter-ego",
    "acao": "Ação",
    "dano": "[NIV/2+4]d12+[MEN]",
    "regra": "Todos os seus clones atacam ao mesmo tempo o alvo à sua escolha a até 9 m: salvaguarda de Mente; na falha, dano total e Atordoado até o fim do próximo turno do alvo; no sucesso, metade.",
    "desc": "Todos os reflexos erguem a lâmina no mesmo instante e nenhum deles é falso.",
    "modelo": "Técnica final",
    "especial": {
     "condicao": "Esgotado",
     "duracao": "até o fim da cena"
    }
   }
  ]
 },
 "verdadeira": null
},
{
 "id": "kamishini-no-yari",
 "nome": "Kamishini no Yari",
 "dono": "Gin Ichimaru",
 "resumo": "A lança que se estica sem fim e desfaz o que toca, e um golpe que explode por dentro.",
 "tema": "Alcance e dissolução",
 "bankai": {
  "nome": "Kamishini no Yari",
  "comando": "Bankai. Kamishini no Yari.",
  "estilo": "potencializadora",
  "aparencia": "A lâmina curta vira uma ponta estreita que corre pelo ar numa velocidade que o olho não acompanha. Gin continua com o mesmo sorriso, e o cabo some na mão dele.",
  "efeitos": [
   {
    "id": "bk-corte-distante"
   },
   {
    "id": "bk-perfura"
   },
   {
    "id": "bk-fio-mortal"
   },
   {
    "id": "bk-veloz"
   },
   {
    "id": "bk-precisao"
   },
   {
    "id": "bk-reacao"
   },
   {
    "id": "bk-forca",
    "param": {
     "atr": "des"
    }
   }
  ],
  "pontoFraco": "pg-tiro",
  "ppGasto": 16,
  "nota": "Os detalhes dessa Bankai vêm de fontes de fãs e a obra mostra pouco dela. Trate como adaptação da mesa e confirme com o Mestre.",
  "habilidades": [
   {
    "nome": "Estocada Infinita",
    "acao": "Ação",
    "dano": "[NIV/2+3]d8+[DES]",
    "regra": "Golpe à distância (alcance estendido); o alvo não ganha bônus de cobertura parcial.",
    "desc": "A ponta cresce a cada instante e chega antes de o som voltar.",
    "modelo": "Ataque básico"
   },
   {
    "nome": "Desfazer Molecular",
    "acao": "Ação bônus",
    "dano": "3d8+[DES]",
    "regra": "Depois de acertar um golpe nesta rodada, o alvo faz salvaguarda de Constituição; na falha, sofre dano total e Sangramento até o fim do próximo turno dele; no sucesso, metade.",
    "desc": "Onde a ponta toca, a matéria vira poeira fina.",
    "modelo": "Reforço"
   },
   {
    "nome": "Recolher a Lâmina",
    "acao": "Reação",
    "dano": "",
    "regra": "Quando um inimigo entra a 3 m, a lâmina volta de uma vez e você faz um ataque corpo a corpo contra ele, com +2 no acerto.",
    "desc": "Num estalo a lança já estava de volta na mão.",
    "modelo": "Barreira"
   },
   {
    "nome": "Butō: Renjin",
    "acao": "Ação",
    "dano": "[NIV/2+3]d12+[DES]",
    "regra": "Um golpe que injeta um fragmento no alvo e o detona por dentro: ignora toda a redução de dano do alvo. Salvaguarda de Constituição; na falha, dano total e Sangramento até o fim do próximo turno do alvo; no sucesso, metade.",
    "desc": "A lâmina entra, solta um pedaço, e o corpo do inimigo responde por dentro.",
    "modelo": "Técnica final",
    "especial": {
     "condicao": "Esgotado",
     "duracao": "até o fim da cena"
    }
   }
  ]
 },
 "verdadeira": null
}
];

export const FONTES_MODELOS: string[] = ["https://www.cbr.com/bleach-toshiro-hitsugaya-zanpakuto-explained/", "https://fandomwire.com/bleach-thousand-year-blood-war-the-calamity-toshiro-hitsugaya-complete-bankai-explained/", "https://bleach.fandom.com/wiki/Sennen_Hy%C5%8Dr%C5%8D", "https://sportskeeda.com/anime/what-renji-s-true-bankai-bleach-explained", "https://comicbook.com/anime/news/bleach-tybw-renji-bankai-so-oh-zabimaru-true-form", "https://www.animeexplained.com/explained/bleach-byakuya-kuchikis-zanpakuto-senbonzakura-explained", "https://sportskeeda.com/anime/what-byakuya-s-bankai-bleach-senbonzakura-kageyoshi-explained", "https://animehunch.com/bankai-of-yamamoto-genryusai-explained-in-detail/", "https://sportskeeda.com/anime/bleach-tybw-yamamoto-s-bankai-zanka-tachi-explained", "https://www.soapcentral.com/anime/bleach-what-katen-kyokotsu-karamatsu-shinju", "https://sportskeeda.com/anime/why-shunsui-s-bankai-banned-bleach-explained", "https://fictionhorizon.com/bleach-komamuras-human-form-explained-how-powerful-is-it/", "https://fictionhorizon.com/what-is-mayuri-kurotsuchis-bankai-in-bleach-including-modified-explained/", "https://sportskeeda.com/anime/what-mayuri-s-bankai-ability-bleach-explained", "https://www.sportskeeda.com/anime/does-soifon-weakest-bankai-among-soul-reaper-captains-bleach-explored", "https://sportskeeda.com/anime/bleach-why-urahara-s-bankai-broken-ability-entire-series", "https://gotai13.blogspot.com/2010/03/tosen-kaname.html", "https://comicbook.com/anime/list/bleach-every-ichigo-form-explained-list"];

const ATR_NOME: Record<string, string> = { for: "Força", des: "Destreza", con: "Constituição", men: "Mente", esp: "Espírito" };

function nomeDaPeca(nome: string, param?: { atr?: string; tipo?: string; n?: number }): string {
  if (param?.atr) return `${nome} (${ATR_NOME[param.atr] ?? param.atr})`;
  if (param?.tipo) return `${nome} (${param.tipo})`;
  if (param?.n) return `${nome} (+${param.n})`;
  return nome;
}

/** Monta a forma pronta (Bankai ou Bankai Verdadeira) de um modelo, já com custo e duração calculados. */
export function formaDoModelo(m: ModeloMontado, qual: "bankai" | "bankai2", ctx: CtxForma): Partial<FormaLib> | null {
  const base = qual === "bankai" ? m.bankai : m.verdadeira;
  if (!base) return null;
  const ids = [...base.efeitos, { id: base.pontoFraco }];
  const efeitos: InstEfeito[] = [];
  for (const e of ids) {
    const p = presetPorId(e.id);
    if (!p) continue;
    const par = { ...(e.param ?? {}) } as never as { atr?: never; tipo?: string; n?: number };
    efeitos.push({ id: novoId(), preset: p.id, nome: nomeDaPeca(p.nome, e.param), texto: p.texto, efeitos: p.monta(par as never), pp: p.pp });
  }
  const habilidades: HabForma[] = base.habilidades.map((h) => {
    const a = h.dano ? analisarDano(h.dano, h.acao, ctx, false, !!h.especial) : null;
    const pr = a ? a.custoPr : 0;
    return { id: novoId(), nome: h.nome, acao: h.acao, custo: pr ? `${pr} PR` : "", pr: pr || undefined, dano: h.dano || undefined, modelo: h.modelo || undefined, regra: h.regra, desc: h.desc, especial: h.especial, texto: [h.desc, h.regra, h.especial ? `Técnica especial: 1 uso por cena. Depois de usar, você fica ${h.especial.condicao} ${h.especial.duracao}.` : ""].filter(Boolean).join("\n") };
  });
  const lib = calcularLiberacao(qual, efeitos, ctx, {});
  const ponto = presetPorId(base.pontoFraco);
  return {
    tipo: qual, modelo: m.id, nome: base.nome, comando: base.comando, aparencia: base.aparencia,
    estilo: base.estilo ?? m.bankai.estilo, efeitos, habilidades, pontoFraco: ponto?.nome ?? "",
    custo: lib.custoPr ?? 0, duracao: lib.duracaoTexto ?? "", texto: m.resumo,
    preRequisito: base.preRequisito, baseModelo: qual === "bankai2" ? m.id : undefined,
  };
}
