import type { HabForma } from "./ficha";
import type { FormaLib } from "./ficha";
import { presetPorId } from "./efeitos-presets";
import type { CtxForma, InstEfeito } from "./efeitos-forma";
import { analisarDano } from "./teto-dano";
import { calcularLiberacao } from "./liberacao-forma";

const novoId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));

export interface HabHollow { nome: string; acao: string; dano: string; regra: string; desc: string; modelo: string; fixa?: boolean; prFixo?: number }
interface ParamPeca { atr?: string; tipo?: string; n?: number }
export interface PecaModelo { id: string; param?: ParamPeca }
export interface ModeloResHollow {
  id: string; nome: string; dono: string; classe: "hueco" | "vazio"; caminho: string; canonica: boolean;
  resumo: string; tema: string; comando: string; aparencia: string; traco: string;
  efeitos: PecaModelo[]; pontoFraco: string; pontoFracoParam?: ParamPeca; habilidades: HabHollow[]; ppGasto: number;
}
export interface ModeloSegunda {
  id: string; nome: string; dono: string; baseResurreccion: string; canonica: boolean;
  resumo: string; tema: string; comando: string; aparencia: string; preRequisito: string;
  efeitos: PecaModelo[]; pontoFraco: string; pontoFracoParam?: ParamPeca; habilidades: HabHollow[]; ppGasto: number;
}

export const RESURRECCIONES_MONTADAS: ModeloResHollow[] = [
 {
  "id": "tiburon",
  "nome": "Tiburón",
  "dono": "Tier Halibel",
  "classe": "hueco",
  "caminho": "Estallido",
  "canonica": true,
  "resumo": "A rainha do mar: água comprimida em projéteis, ondas que inundam o campo e vapor que desfaz o gelo.",
  "tema": "Água, pressão e ondas",
  "comando": "Destrua, Tiburón.",
  "aparencia": "A lâmina se desfaz em água e a envolve como um casulo. Ela surge com ombreiras e uma armadura óssea de tubarão sobre o peito, a máscara reduzida a uma gola, a pele marcada por guelras. No braço direito, uma espada larga em forma de dente de tubarão.",
  "traco": "Maré Viva: disparos e Cero de água ganham +1d10 e empurram o alvo 3 m.",
  "efeitos": [
   {
    "id": "rs-mare"
   },
   {
    "id": "rs-hirviendo"
   },
   {
    "id": "rs-cero-denso"
   },
   {
    "id": "rs-mira"
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "esp"
    }
   },
   {
    "id": "rs-hierro"
   },
   {
    "id": "rs-regen"
   },
   {
    "id": "rs-instinto"
   }
  ],
  "pontoFraco": "pf-ferida",
  "pontoFracoParam": {
   "tipo": "Gelo"
  },
  "habilidades": [
   {
    "nome": "Gran Rey Cero: Dente do Mar",
    "acao": "Ação",
    "dano": "[(NIV+12+PROF)*1.4]d8+[ESP]",
    "regra": "Técnica de assinatura do Caminho Estallido (regra do livro): Cero de Resurrección com +proficiência d8; ignora o Hierro. Custo 15 PR.",
    "desc": "O Cero sai da cavidade da lâmina envolto num redemoinho de água.",
    "modelo": "",
    "fixa": true,
    "prFixo": 15
   },
   {
    "nome": "Cascada",
    "acao": "Ação",
    "dano": "[NIV/2+4]d10+[ESP]",
    "regra": "Linha de 24 m por 6 m de largura: salvaguarda de Força; na falha, dano total e Caído; no sucesso, metade.",
    "desc": "Uma cachoeira despenca do nada e varre tudo à frente.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "La Gota",
    "acao": "Ação bônus",
    "dano": "[NIV/4+2]d10+[ESP]",
    "regra": "Ataque de técnica a até 36 m contra um alvo.",
    "desc": "Uma gota de água comprimida, afiada como dente, atravessa paredes.",
    "modelo": "Ataque básico",
    "fixa": false
   },
   {
    "nome": "Trident",
    "acao": "Ação",
    "dano": "[NIV/2+2]d10+[DES]",
    "regra": "Três lâminas de reiatsu em leque: um alvo, ou até três alvos a 3 m um do outro dividindo o dano.",
    "desc": "A espada corta três vezes de uma vez, cada fio deixando um rastro azul.",
    "modelo": "Rajada",
    "fixa": false
   },
   {
    "nome": "Hirviendo",
    "acao": "Reação",
    "dano": "",
    "regra": "Quando uma técnica de Gelo ou de água o atinge: o dano cai em proficiência d10 e você termina a condição Congelado.",
    "desc": "A água em volta dela ferve num instante e o gelo vira vapor.",
    "modelo": "Defesa",
    "fixa": false
   }
  ],
  "ppGasto": 18
 },
 {
  "id": "arrogante",
  "nome": "Arrogante",
  "dono": "Barragan Luisenbarn",
  "classe": "vazio",
  "caminho": "Ponzoña",
  "canonica": true,
  "resumo": "O Rei do Mundo dos Hollows: um esqueleto coroado cuja aura envelhece e apodrece tudo o que toca.",
  "tema": "Tempo, envelhecimento e decomposição",
  "comando": "Apodreça, Arrogante.",
  "aparencia": "Uma chama negra sai do olho no machado e consome a carne até restar um esqueleto coroado, com manto de pele escura e o machado Gran Caída preso por correntes. Uma névoa roxa e preta escorre pelas órbitas.",
  "traco": "Respira: no início do turno, quem está a 3 m sofre dano de Veneno que ignora a armadura e pode ficar Envenenado.",
  "efeitos": [
   {
    "id": "rs-respira"
   },
   {
    "id": "rs-veneno"
   },
   {
    "id": "rs-hierro"
   },
   {
    "id": "rs-presa",
    "param": {
     "n": 2
    }
   },
   {
    "id": "rs-garra"
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "esp"
    }
   },
   {
    "id": "rs-uivo"
   },
   {
    "id": "rs-casulo"
   }
  ],
  "pontoFraco": "pg-ruina-devolvida",
  "habilidades": [
   {
    "nome": "Veneno Total: Senilidade",
    "acao": "Ação",
    "dano": "",
    "regra": "Técnica de assinatura do Caminho Ponzoña (regra do livro): até o fim do seu próximo turno, as cargas de Ponzoña causam +50% de dano. Custo 12 PR.",
    "desc": "A névoa engrossa sobre quem já foi tocado e acelera o tempo dentro do corpo.",
    "modelo": "",
    "fixa": true,
    "prFixo": 12
   },
   {
    "nome": "Sopro de Respira",
    "acao": "Ação",
    "dano": "[NIV/2+3]d10+[ESP]",
    "regra": "Cone de 9 m: salvaguarda de Constituição; na falha, dano total, 1 carga de Ponzoña e Envenenado até o fim do próximo turno; no sucesso, metade. Kidō e barreiras no cone se desfazem.",
    "desc": "Ele abre a boca e a névoa negra corre para a frente, envelhecendo pedra e carne.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "Gran Caída",
    "acao": "Ação",
    "dano": "[NIV/2+1]d10+[FOR]",
    "regra": "Um golpe com alcance de 6 m (correntes). Se acertar, o alvo tem desvantagem na próxima salvaguarda contra Respira.",
    "desc": "O machado gira nas correntes e cai como uma sentença.",
    "modelo": "Ataque básico",
    "fixa": false
   },
   {
    "nome": "Mão da Velhice",
    "acao": "Ação bônus",
    "dano": "[NIV/4+1]d10+[ESP]",
    "regra": "Toque: salvaguarda de Constituição ou o alvo fica com Força ou Destreza -2 até o fim da cena (não acumula). Membros apodrecidos não regeneram até o fim da cena.",
    "desc": "Os dedos de osso tocam o braço e a pele enruga até o osso.",
    "modelo": "Marca",
    "fixa": false
   }
  ],
  "ppGasto": 17
 },
 {
  "id": "brujeria",
  "nome": "Brujería",
  "dono": "Zommari Rureaux",
  "classe": "vazio",
  "caminho": "Ilusión",
  "canonica": true,
  "resumo": "Cinquenta olhos que roubam o corpo do inimigo pedaço por pedaço, e um Sonido tão rápido que deixa cópias no ar.",
  "tema": "Hipnose, controle do corpo e imagens residuais",
  "comando": "Ore, Brujería.",
  "aparencia": "A lâmina se enrola em espiral e solta fumaça. O corpo incha numa forma bulbosa, parecida com uma abóbora, coberta de dezenas de olhos fechados; rostos de um olho só cercam a base e mais olhos se escondem na testa.",
  "traco": "Amor: com ação bônus, um olho marca o braço ou a perna de um inimigo e o membro passa a obedecer você.",
  "efeitos": [
   {
    "id": "rs-amor"
   },
   {
    "id": "rs-escuro"
   },
   {
    "id": "rs-sonido-selvagem"
   },
   {
    "id": "rs-gemeo"
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "esp"
    }
   },
   {
    "id": "rs-hierro"
   },
   {
    "id": "rs-instinto"
   },
   {
    "id": "rs-regen"
   }
  ],
  "pontoFraco": "pg-olhos",
  "habilidades": [
   {
    "nome": "Mundo Quebrado: Olhar Total",
    "acao": "Ação",
    "dano": "",
    "regra": "Técnica de assinatura do Caminho Ilusión (regra do livro): alvo a 24 m, salvaguarda de Constituição; na falha, desvantagem nos ataques e sem reações até o fim do próximo turno dele. Custo 12 PR.",
    "desc": "Todos os olhos se abrem ao mesmo tempo sobre um único alvo.",
    "modelo": "",
    "fixa": true,
    "prFixo": 12
   },
   {
    "nome": "Amor Pleno",
    "acao": "Ação",
    "dano": "",
    "regra": "Até 3 criaturas a 18 m fazem salvaguarda de Mente. Na falha, ficam Enfeitiçadas por você até o fim do próximo turno delas (não atacam você e você escolhe o deslocamento delas). Repetir no mesmo alvo na mesma cena dá vantagem a ele.",
    "desc": "Os olhos marcam o corpo inteiro: tudo o que vê o olho passa a amar o dono.",
    "modelo": "Controle",
    "fixa": false
   },
   {
    "nome": "Gemelos Sonido",
    "acao": "Ação bônus",
    "dano": "",
    "regra": "Move até 9 m e deixa até 2 imagens residuais; o próximo ataque contra você tem desvantagem e, se errar, uma imagem some.",
    "desc": "Ele se divide em cinco por um instante, e todas as cópias são reais demais.",
    "modelo": "Passo veloz",
    "fixa": false
   },
   {
    "nome": "Corpo Emprestado",
    "acao": "Reação",
    "dano": "[NIV/2]d10+[ESP]",
    "regra": "Quando uma criatura marcada pelo Amor ataca um aliado seu, ela sofre o dano (salvaguarda de Mente para metade) e a marca termina.",
    "desc": "O membro roubado se volta contra o próprio dono.",
    "modelo": "Contra-ataque",
    "fixa": false
   }
  ],
  "ppGasto": 16
 },
 {
  "id": "gloton",
  "nome": "Glotonería",
  "dono": "Aaroniero Arruruerie",
  "classe": "hueco",
  "caminho": "Glotonería",
  "canonica": true,
  "resumo": "Uma massa de tentáculos que guarda milhares de Hollows devorados e usa os poderes de quem engoliu.",
  "tema": "Devorar, imitar e sombras",
  "comando": "Devore, Glotonería.",
  "aparencia": "Da cintura para baixo o corpo vira uma massa enorme de carne roxa, com dezenas de tentáculos cheios de bocas. Em cima, o torso mantém a aparência roubada; a cabeça é um tubo de vidro com duas caveiras flutuando num líquido vermelho.",
  "traco": "Absorção: ao derrubar um inimigo espiritual, você o engole, ganha PV temporários e copia uma habilidade dele.",
  "efeitos": [
   {
    "id": "rs-absorcao"
   },
   {
    "id": "rs-tentaculos"
   },
   {
    "id": "rs-fome"
   },
   {
    "id": "rs-carne"
   },
   {
    "id": "rs-presa",
    "param": {
     "n": 1
    }
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "for"
    }
   },
   {
    "id": "rs-regen"
   },
   {
    "id": "rs-cria"
   },
   {
    "id": "rs-hierro"
   }
  ],
  "pontoFraco": "pg-luz",
  "habilidades": [
   {
    "nome": "Devorar: Banquete",
    "acao": "Ação",
    "dano": "[NIV+10]d10+[2*FOR]",
    "regra": "Técnica de assinatura do Caminho Glotonería (regra do livro): ataque de Energia; você recupera 60% do dano causado em PV. Custo 12 PR.",
    "desc": "As bocas dos tentáculos se fecham sobre o alvo ao mesmo tempo.",
    "modelo": "",
    "fixa": true,
    "prFixo": 12
   },
   {
    "nome": "Rosto Roubado",
    "acao": "Ação bônus",
    "dano": "",
    "regra": "Assume a aparência e a voz de alguém que você devorou ou copiou. Quem o conhecia faz salvaguarda de Mente ou fica Enfeitiçado até você atacar. Não funciona sob luz forte.",
    "desc": "O rosto escorre e se refaz no de alguém amado.",
    "modelo": "Controle",
    "fixa": false
   },
   {
    "nome": "Chuva de Bocas",
    "acao": "Ação",
    "dano": "[NIV/2+3]d10+[FOR]",
    "regra": "Todas as criaturas a até 6 m: salvaguarda de Destreza; na falha, dano total e Agarradas; no sucesso, metade.",
    "desc": "Os tentáculos se abrem como uma flor e mordem tudo em volta.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "Lâmina Engolida",
    "acao": "Ação",
    "dano": "[NIV/2+1]d10+[FOR]",
    "regra": "Golpe com a arma de um inimigo que você copiou: a técnica ignora a resistência que ele tinha ao próprio poder.",
    "desc": "Ele usa a espada de quem engoliu, com a técnica dele, contra os amigos dele.",
    "modelo": "Ataque básico",
    "fixa": false
   }
  ],
  "ppGasto": 18
 },
 {
  "id": "gamuza",
  "nome": "Gamuza",
  "dono": "Nelliel Tu Odelschwanck",
  "classe": "vazio",
  "caminho": "Reflejo",
  "canonica": true,
  "resumo": "A guerreira centauro: lança dupla, galope veloz e um Cero que engole o do inimigo e o devolve dobrado.",
  "tema": "Lança, carga e devolução",
  "comando": "Declare, Gamuza.",
  "aparencia": "O corpo de baixo vira o de um cervo, como uma centaura com cascos e armadura óssea nos ombros. O crânio da máscara cresce em chifres curvos, e a espada vira uma lança de duas pontas.",
  "traco": "Cero Doble: uma vez por cena, engole um Cero ou técnica de energia e o soma ao próprio Cero.",
  "efeitos": [
   {
    "id": "rs-cero-doble"
   },
   {
    "id": "rs-saliva"
   },
   {
    "id": "rs-sonido-selvagem"
   },
   {
    "id": "rs-hierro"
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "for"
    }
   },
   {
    "id": "rs-presa",
    "param": {
     "n": 1
    }
   },
   {
    "id": "rs-garra"
   },
   {
    "id": "rs-veu"
   }
  ],
  "pontoFraco": "pg-mascara",
  "habilidades": [
   {
    "nome": "Espejo Roto: Duelo Honrado",
    "acao": "Ação",
    "dano": "",
    "regra": "Técnica de assinatura do Caminho Reflejo (regra do livro): até o início do seu próximo turno, devolve 50% do dano sofrido ao atacante como Energia. Custo 12 PR.",
    "desc": "Ela gira a lança e espera: cada golpe que recebe volta pelo mesmo caminho.",
    "modelo": "",
    "fixa": true,
    "prFixo": 12
   },
   {
    "nome": "Lanzador Verde",
    "acao": "Ação",
    "dano": "[NIV/2+4]d10+[FOR]",
    "regra": "Linha de 30 m por 1,5 m: salvaguarda de Destreza; na falha, dano total; no sucesso, metade. Ignora 5 de redução de dano. Uma vez por cena.",
    "desc": "A lança gira até virar um raio verde e é arremessada com o corpo inteiro.",
    "modelo": "Técnica final",
    "fixa": false
   },
   {
    "nome": "Carga do Centauro",
    "acao": "Ação",
    "dano": "[NIV/2+1]d10+[FOR]",
    "regra": "Move até o deslocamento em linha reta e faz um golpe com a lança. Se andou 6 m ou mais, o alvo faz salvaguarda de Força ou fica Caído.",
    "desc": "Os cascos racham o chão antes de a ponta chegar.",
    "modelo": "Rajada",
    "fixa": false
   },
   {
    "nome": "Cero Devolvido",
    "acao": "Ação bônus",
    "dano": "[NIV/4+2]d10+[ESP]",
    "regra": "Só depois de usar o Cero Doble: dispara o que engoliu (soma o dano guardado, até 2 × nível) num alvo a 30 m.",
    "desc": "Ela cospe o raio inimigo, misturado ao próprio.",
    "modelo": "Contra-ataque",
    "fixa": false
   }
  ],
  "ppGasto": 17
 },
 {
  "id": "ira",
  "nome": "Ira",
  "dono": "Yammy Llargo",
  "classe": "hueco",
  "caminho": "Glotonería",
  "canonica": true,
  "resumo": "Força bruta que cresce com a raiva: quanto mais apanha, maior e mais forte fica.",
  "tema": "Força bruta e crescimento",
  "comando": "Enfureça-se, Ira.",
  "aparencia": "O corpo incha até virar uma fera colossal: braços e pernas grossos como colunas, pelagem marrom, uma cauda de réptil, chifres e uma crista de espinhos nas costas. A cada ferida, cresce mais.",
  "traco": "Ira Crescente: Força +2, e cada turno de muito dano sofrido aumenta a Força até +4.",
  "efeitos": [
   {
    "id": "rs-ira"
   },
   {
    "id": "rs-hierro"
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "con"
    }
   },
   {
    "id": "rs-presa",
    "param": {
     "n": 2
    }
   },
   {
    "id": "rs-cauda"
   },
   {
    "id": "rs-carne"
   },
   {
    "id": "rs-fome"
   },
   {
    "id": "rs-garra"
   },
   {
    "id": "rs-instinto"
   }
  ],
  "pontoFraco": "pf-frenesi-leve",
  "habilidades": [
   {
    "nome": "Devorar: Mordida da Fera",
    "acao": "Ação",
    "dano": "[NIV+10]d10+[2*FOR]",
    "regra": "Técnica de assinatura do Caminho Glotonería (regra do livro): ataque de Energia; você recupera 60% do dano causado em PV. Custo 12 PR.",
    "desc": "Ele agarra o inimigo com a mão inteira e o leva à boca.",
    "modelo": "",
    "fixa": true,
    "prFixo": 12
   },
   {
    "nome": "Cero Gigante",
    "acao": "Ação",
    "dano": "[NIV/2+3]d10+[FOR]",
    "regra": "Cone de 12 m: salvaguarda de Destreza; na falha, dano total; no sucesso, metade. Com 2 cargas de raiva, o cone vai a 18 m.",
    "desc": "Um Cero do tamanho de um prédio sai da boca.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "Bala Pesada",
    "acao": "Ação bônus",
    "dano": "[NIV/4+2]d10+[FOR]",
    "regra": "Ataque à distância a 24 m; se acertar, o alvo é empurrado 3 m.",
    "desc": "Um soco no ar dispara uma bala de reiatsu do tamanho de uma pedra.",
    "modelo": "Ataque básico",
    "fixa": false
   },
   {
    "nome": "Pisotear",
    "acao": "Ação",
    "dano": "[NIV/2]d12+[FOR]",
    "regra": "Todas as criaturas a 3 m: salvaguarda de Força ou ficam Caídas e sofrem o dano; no sucesso, metade e ficam de pé.",
    "desc": "O pé desce e o chão afunda em cratera.",
    "modelo": "Golpe em área",
    "fixa": false
   }
  ],
  "ppGasto": 18
 },
 {
  "id": "extinguir",
  "nome": "Extinguir",
  "dono": "Wonderweiss Margela",
  "classe": "vazio",
  "caminho": "Reflejo",
  "canonica": true,
  "resumo": "Um corpo feito para uma só missão: engolir as chamas mais quentes do mundo e devolvê-las.",
  "tema": "Anular e absorver fogo",
  "comando": "Extinguir! (um grito sem palavras; a forma desperta sozinha diante do fogo)",
  "aparencia": "O corpo de criança se cobre de placas brancas e se expande em dezenas de braços grossos que saem das costas como raízes. O rosto fica vazio, com um buraco no peito que suga o ar quente.",
  "traco": "Selo das Chamas: imune a Fogo; o fogo que você engole fica guardado para ser solto numa técnica.",
  "efeitos": [
   {
    "id": "rs-extinguir"
   },
   {
    "id": "rs-presa",
    "param": {
     "n": 1
    }
   },
   {
    "id": "rs-garra"
   },
   {
    "id": "rs-hierro"
   },
   {
    "id": "rs-veu"
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "for"
    }
   },
   {
    "id": "rs-sonido-selvagem"
   },
   {
    "id": "rs-regen"
   }
  ],
  "pontoFraco": "pg-chama-engolida",
  "habilidades": [
   {
    "nome": "Espejo Roto: Corpo Selado",
    "acao": "Ação",
    "dano": "",
    "regra": "Técnica de assinatura do Caminho Reflejo (regra do livro): até o início do seu próximo turno, devolve 50% do dano sofrido ao atacante como Energia. Custo 12 PR.",
    "desc": "As placas brancas se fecham e o que entra não sai do jeito que entrou.",
    "modelo": "",
    "fixa": true,
    "prFixo": 12
   },
   {
    "nome": "Punhos Infinitos",
    "acao": "Ação",
    "dano": "[NIV/2+2]d10+[FOR]",
    "regra": "Golpes com todos os braços contra até 3 alvos a 6 m (dano dividido entre eles, ou todo num só).",
    "desc": "Dezenas de punhos descem ao mesmo tempo, sem pressa e sem pausa.",
    "modelo": "Rajada",
    "fixa": false
   },
   {
    "nome": "Selo Engolido",
    "acao": "Ação",
    "dano": "",
    "regra": "Uma criatura a 9 m que usa fogo (Shikai, Bankai ou técnica de Fogo) faz salvaguarda de Espírito. Na falha, não pode usar técnicas de Fogo até o fim do próximo turno dela e você guarda proficiência × 5 de Fogo no estoque.",
    "desc": "O buraco no peito suga as chamas do ar até a lâmina inimiga esfriar.",
    "modelo": "Controle",
    "fixa": false
   },
   {
    "nome": "Chama Devolvida",
    "acao": "Ação",
    "dano": "[NIV/2+3]d10+[ESP]",
    "regra": "Esfera de 6 m num ponto a 18 m: salvaguarda de Destreza, metade no sucesso. Some o estoque do Selo das Chamas (1 vez por cena) e zere-o.",
    "desc": "Ele abre a boca e o fogo que comeu sai de uma vez.",
    "modelo": "Golpe em área",
    "fixa": false
   }
  ],
  "ppGasto": 17
 },
 {
  "id": "giralda",
  "nome": "Giralda",
  "dono": "Dordoni Alessandro del Socaccio",
  "classe": "hueco",
  "caminho": "Sonido",
  "canonica": true,
  "resumo": "Um bailarino de vento: pernas em turbinas, ciclones que mordem como bicos de pássaro e passos que somem no ar.",
  "tema": "Vento, giro e velocidade",
  "comando": "Rodopie, Giralda.",
  "aparencia": "As pernas viram cones ósseos que giram como turbinas e soltam vento sem parar. Pequenos chifres saem da cabeça e o tronco ganha placas de osso; ele flutua num redemoinho constante.",
  "traco": "Pernas de Ciclone: voo de 6 m e golpes que alcançam 6 m a mais como lâminas de vento.",
  "efeitos": [
   {
    "id": "rs-ciclone"
   },
   {
    "id": "rs-pantera"
   },
   {
    "id": "rs-primeiro"
   },
   {
    "id": "rs-gemelos"
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "des"
    }
   },
   {
    "id": "rs-presa",
    "param": {
     "n": 2
    }
   },
   {
    "id": "rs-garra"
   },
   {
    "id": "rs-instinto"
   },
   {
    "id": "rs-regen"
   }
  ],
  "pontoFraco": "pf-guarda",
  "habilidades": [
   {
    "nome": "Golpe Fantasma: Passo do Bailarino",
    "acao": "Ação",
    "dano": "[NIV/2-3]d10+[2*DES]",
    "regra": "Técnica de assinatura do Caminho Sonido (regra do livro): um ataque com vantagem e crítico com 19–20; substitui os ataques da ação. Custo 12 PR.",
    "desc": "Ele rodopia e reaparece por trás, com o pé já descendo.",
    "modelo": "",
    "fixa": true,
    "prFixo": 12
   },
   {
    "nome": "Ciclones",
    "acao": "Ação",
    "dano": "[NIV/2+2]d10+[DES]",
    "regra": "Dois redemoinhos com cabeça de pássaro atacam um alvo a até 18 m cada (dano dividido entre eles, ou todo num só). Se os dois acertarem o mesmo alvo, ele fica Caído.",
    "desc": "Os ciclones têm bico e mordem como aves de rapina.",
    "modelo": "Rajada",
    "fixa": false
   },
   {
    "nome": "Cero Cornada",
    "acao": "Ação",
    "dano": "[NIV/2+3]d10+[DES]",
    "regra": "Linha de 18 m: salvaguarda de Destreza, metade no sucesso.",
    "desc": "Um Cero disparado entre os chifres, girando como uma broca.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "Giro Defensivo",
    "acao": "Reação",
    "dano": "",
    "regra": "Quando um ataque à distância o atinge: o vento desvia, reduzindo o dano em proficiência d8.",
    "desc": "As turbinas giram mais rápido e o projétil escorrega pelo vento.",
    "modelo": "Defesa",
    "fixa": false
   }
  ],
  "ppGasto": 18
 },
 {
  "id": "dragra",
  "nome": "Dragra",
  "dono": "Gantenbainne Mosqueda",
  "classe": "hueco",
  "caminho": "Estallido",
  "canonica": true,
  "resumo": "Um guerreiro em couraça de dragão que junta os punhos e solta uma rajada capaz de arrasar o campo.",
  "tema": "Couraça, punhos e rajada dracônica",
  "comando": "Desperte, Dragra. (comando adaptado: no original ele libera sem frase registrada)",
  "aparencia": "Placas de escama cobrem o corpo como armadura, os braços ganham manoplas com garras e uma viseira óssea desce sobre o rosto. Uma cauda curta e espinhosa completa o dragão.",
  "traco": "Hierro Espinhoso: a couraça reduz o dano e fere quem bate de perto.",
  "efeitos": [
   {
    "id": "rs-cero-denso"
   },
   {
    "id": "rs-hierro"
   },
   {
    "id": "rs-espinhos"
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "for"
    }
   },
   {
    "id": "rs-presa",
    "param": {
     "n": 1
    }
   },
   {
    "id": "rs-mira"
   },
   {
    "id": "rs-uivo"
   },
   {
    "id": "rs-instinto"
   },
   {
    "id": "rs-cauda"
   }
  ],
  "pontoFraco": "pf-casca",
  "habilidades": [
   {
    "nome": "Gran Rey Cero: Rugido do Dragão",
    "acao": "Ação",
    "dano": "[(NIV+12+PROF)*1.4]d8+[ESP]",
    "regra": "Técnica de assinatura do Caminho Estallido (regra do livro): Cero de Resurrección com +proficiência d8; ignora o Hierro. Custo 15 PR.",
    "desc": "O Cero sai das duas manoplas unidas, em forma de cabeça de dragão.",
    "modelo": "",
    "fixa": true,
    "prFixo": 15
   },
   {
    "nome": "Rajada Dracônica",
    "acao": "Ação",
    "dano": "[NIV/2+4]d10+[ESP]",
    "regra": "Cone de 15 m: salvaguarda de Destreza, metade no sucesso. Depois de usar, você não pode usar outra técnica de Ação até o fim do próximo turno. Uma vez por cena.",
    "desc": "Ele une os punhos, pede perdão em voz baixa e solta tudo.",
    "modelo": "Técnica final",
    "fixa": false
   },
   {
    "nome": "Punho do Dragão",
    "acao": "Ação",
    "dano": "[NIV/2+1]d10+[FOR]",
    "regra": "Dois golpes de manopla no mesmo alvo; se os dois acertarem, ele fica Atordoado até o início do seu próximo turno (salvaguarda de Constituição evita).",
    "desc": "Um soco abre a guarda e o outro entra.",
    "modelo": "Ataque básico",
    "fixa": false
   },
   {
    "nome": "Escamas Eriçadas",
    "acao": "Reação",
    "dano": "[NIV/4+1]d10+[CON]",
    "regra": "Quando uma criatura o acerta corpo a corpo, ela sofre o dano.",
    "desc": "As escamas se levantam como facas.",
    "modelo": "Contra-ataque",
    "fixa": false
   }
  ],
  "ppGasto": 17
 },
 {
  "id": "arbol",
  "nome": "Árbol",
  "dono": "Rudbornn Chelute",
  "classe": "vazio",
  "caminho": "Ilusión",
  "canonica": true,
  "resumo": "Um comandante-árvore que faz brotar soldados de máscara de caveira dos próprios galhos.",
  "tema": "Exército, galhos e números",
  "comando": "Cresça, Árbol.",
  "aparencia": "A cabeça vira uma copa de galhos secos em volta de uma máscara de caveira; os braços se ramificam e, dos galhos, pendem frutos brancos que se abrem em soldados mascarados.",
  "traco": "Exército de Calaveras: até 4 soldados mascarados lutam por você e brotam de novo quando caem.",
  "efeitos": [
   {
    "id": "rs-calaveras"
   },
   {
    "id": "rs-cria"
   },
   {
    "id": "rs-escuro"
   },
   {
    "id": "rs-forca",
    "param": {
     "atr": "esp"
    }
   },
   {
    "id": "rs-hierro"
   },
   {
    "id": "rs-garra"
   },
   {
    "id": "rs-presa",
    "param": {
     "n": 1
    }
   },
   {
    "id": "rs-regen"
   },
   {
    "id": "rs-instinto"
   },
   {
    "id": "rs-uivo"
   }
  ],
  "pontoFraco": "pf-elo",
  "habilidades": [
   {
    "nome": "Mundo Quebrado: Floresta de Máscaras",
    "acao": "Ação",
    "dano": "",
    "regra": "Técnica de assinatura do Caminho Ilusión (regra do livro): alvo a 24 m, salvaguarda de Constituição; na falha, desvantagem nos ataques e sem reações até o fim do próximo turno dele. Custo 12 PR.",
    "desc": "Dezenas de máscaras iguais encaram o alvo até ele não saber qual é a verdadeira.",
    "modelo": "",
    "fixa": true,
    "prFixo": 12
   },
   {
    "nome": "Colheita",
    "acao": "Ação bônus",
    "dano": "",
    "regra": "Brota até 2 Calaveras novas (até o máximo da peça), pagando 1 PR cada.",
    "desc": "Os frutos brancos caem e se abrem em soldados.",
    "modelo": "Reforço",
    "fixa": false
   },
   {
    "nome": "Raízes que Prendem",
    "acao": "Ação",
    "dano": "[NIV/2+2]d10+[ESP]",
    "regra": "Área de 6 m a até 18 m: salvaguarda de Força; na falha, dano total e Presas até o fim do próximo turno delas; no sucesso, metade.",
    "desc": "Raízes brotam do chão e apertam até os ossos.",
    "modelo": "Controle",
    "fixa": false
   },
   {
    "nome": "Ordem de Ataque",
    "acao": "Ação",
    "dano": "",
    "regra": "Todas as Calaveras atacam agora com vantagem; cada acerto causa +proficiência de dano.",
    "desc": "Um gesto e o exército se move como um só.",
    "modelo": "Reforço",
    "fixa": false
   }
  ],
  "ppGasto": 18
 }
];

export const SEGUNDAS_MONTADAS: ModeloSegunda[] = [
 {
  "id": "murcielago-segunda",
  "nome": "Murciélago: Segunda Etapa",
  "dono": "Ulquiorra Cifer",
  "baseResurreccion": "murcielago",
  "canonica": true,
  "resumo": "A única Segunda Etapa conhecida: um demônio de asas negras, cauda que estrangula, Cero negro e uma lança de luz que explode como bomba.",
  "tema": "Desespero, lança de luz e regeneração",
  "comando": "Resurrección: Segunda Etapa.",
  "aparencia": "As asas crescem e escurecem, as pernas se cobrem de pelagem negra e terminam em garras, os chifres se alongam e uma cauda fina e longa surge nas costas. O buraco Hollow desce para o pescoço e as lágrimas negras se espalham pelo rosto.",
  "preRequisito": "Exige a Resurrección Murciélago ativa, nível 15+ e o treinamento da Segunda Etapa concluído. Uma ação para assumir; a forma soma as peças da Murciélago.",
  "efeitos": [
   {
    "id": "se-lanza"
   },
   {
    "id": "se-oscuras"
   },
   {
    "id": "se-latigo"
   },
   {
    "id": "se-regen"
   },
   {
    "id": "se-instinto"
   }
  ],
  "pontoFraco": "pg-ruina",
  "habilidades": [
   {
    "nome": "Lanza del Relámpago",
    "acao": "Ação",
    "dano": "[NIV/2+3]d10+[ESP]",
    "regra": "Arremessa a lança num ponto a até 30 m: explosão de 6 m, salvaguarda de Destreza, metade no sucesso. Você não pode estar a menos de 6 m do ponto. As peças da forma somam ao dano.",
    "desc": "Uma lança de luz verde-amarela que explode como uma bomba; até ele se afasta.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "Luz de la Luna",
    "acao": "Ação bônus",
    "dano": "[NIV/4+2]d10+[ESP]",
    "regra": "Uma lança curta de reiatsu usada como espada ou arremessada a 18 m.",
    "desc": "Ele cria a lâmina de luz num gesto e a usa como espada.",
    "modelo": "Ataque básico",
    "fixa": false
   },
   {
    "nome": "Cero Oscuras",
    "acao": "Ação",
    "dano": "[NIV/2+3]d10+[ESP]",
    "regra": "Linha de 30 m: salvaguarda de Destreza, metade no sucesso. Ignora o Hierro.",
    "desc": "Um Cero negro de borda verde que rasga o céu.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "Látigo",
    "acao": "Ação bônus",
    "dano": "[NIV/4+1]d10+[DES]",
    "regra": "Golpe de cauda a 9 m. Se acertar, o alvo fica Agarrado (salvaguarda de Força evita) e não pode usar técnicas que exigem fala enquanto estiver preso.",
    "desc": "A cauda se enrola no pescoço e aperta.",
    "modelo": "Controle",
    "fixa": false
   },
   {
    "nome": "Corpo que se Refaz",
    "acao": "Reação",
    "dano": "",
    "regra": "Uma vez por cena, ao perder um membro ou cair abaixo de metade dos PV: recupera 2 × nível em PV. Não funciona se a cabeça ou o peito forem destruídos (crítico de Técnica final).",
    "desc": "O braço arrancado já está de volta antes da poeira baixar.",
    "modelo": "Regeneração",
    "fixa": false
   }
  ],
  "ppGasto": 13
 },
 {
  "id": "arrogante-trono",
  "nome": "Arrogante: Trono das Eras",
  "dono": "Barragan Luisenbarn (inspirada)",
  "baseResurreccion": "arrogante",
  "canonica": false,
  "resumo": "Forma ORIGINAL, não canônica, inspirada no tema de Barragan: o rei vira o próprio Tempo, e tudo a 9 m envelhece e para.",
  "tema": "O fim do tempo (inspirada em Barragan; não canônica)",
  "comando": "Curvem-se, que o tempo é meu.",
  "aparencia": "O esqueleto se senta num trono de ossos que flutua; a coroa cresce em ponteiros de relógio e o manto vira uma névoa que cobre o chão. Cada passo dele faz as coisas em volta rachar de velhice.",
  "preRequisito": "Exige a Resurrección Arrogante ativa, nível 15+ e o treinamento da Segunda Etapa. Não canônica: o Mestre aprova o uso.",
  "efeitos": [
   {
    "id": "se-eras"
   },
   {
    "id": "se-vazio-total"
   },
   {
    "id": "se-terror"
   },
   {
    "id": "se-hierro"
   },
   {
    "id": "se-forca",
    "param": {
     "atr": "esp"
    }
   }
  ],
  "pontoFraco": "pg-sangue",
  "habilidades": [
   {
    "nome": "Era da Ruína",
    "acao": "Ação",
    "dano": "[NIV/2+4]d10+[ESP]",
    "regra": "Esfera de 9 m centrada em você: salvaguarda de Constituição; na falha, dano total e Envenenado por 1 minuto; no sucesso, metade. Barreiras e Kidō na área se desfazem.",
    "desc": "A névoa engole tudo e anos passam em segundos.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "Ordem do Rei",
    "acao": "Ação bônus",
    "dano": "",
    "regra": "Uma criatura a 18 m faz salvaguarda de Espírito ou fica Amedrontada até o fim do próximo turno dela; Amedrontada, ela não pode se aproximar de você.",
    "desc": "Ele aponta e manda: ajoelhe-se.",
    "modelo": "Controle",
    "fixa": false
   },
   {
    "nome": "Areia que Cai",
    "acao": "Ação",
    "dano": "[NIV/2+2]d10+[ESP]",
    "regra": "Um alvo a 24 m: salvaguarda de Constituição; na falha, dano total, sem reações e com deslocamento pela metade até o fim do próximo turno dele; no sucesso, metade.",
    "desc": "O alvo vê a própria mão envelhecer.",
    "modelo": "Marca",
    "fixa": false
   },
   {
    "nome": "Tempo Parado",
    "acao": "Reação",
    "dano": "",
    "regra": "Uma vez por cena, quando um ataque o atingiria: o ataque chega atrasado e erra.",
    "desc": "O golpe para no ar, velho demais para terminar.",
    "modelo": "Defesa",
    "fixa": false
   }
  ],
  "ppGasto": 13
 },
 {
  "id": "ira-furia",
  "nome": "Ira: Fúria Final",
  "dono": "Yammy Llargo (inspirada)",
  "baseResurreccion": "ira",
  "canonica": false,
  "resumo": "Forma ORIGINAL inspirada no crescimento sem fim da Ira: no cânone Yammy só segue crescendo dentro da Resurrección; aqui isso vira uma Segunda Etapa colossal.",
  "tema": "Colosso (inspirada em Yammy; não canônica como Segunda Etapa)",
  "comando": "Mais! Mais raiva!",
  "aparencia": "O corpo dobra de tamanho até passar dos prédios. A cauda vira um tronco, aparecem chifres novos e a boca se abre até o peito, sempre soltando vapor verde.",
  "preRequisito": "Exige a Resurrección Ira ativa com 2 cargas de raiva, nível 15+ e o treinamento da Segunda Etapa. Não canônica: o Mestre aprova o uso.",
  "efeitos": [
   {
    "id": "se-colosso"
   },
   {
    "id": "se-rei"
   },
   {
    "id": "se-fome"
   },
   {
    "id": "se-grito"
   },
   {
    "id": "se-indomavel"
   }
  ],
  "pontoFraco": "pg-colosso",
  "habilidades": [
   {
    "nome": "Soco do Colosso",
    "acao": "Ação",
    "dano": "[NIV/2+3]d10+[FOR]",
    "regra": "Golpe em cone de 6 m: salvaguarda de Destreza; na falha, dano total e Caído; no sucesso, metade.",
    "desc": "O punho cobre a rua inteira.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "Cero da Fera",
    "acao": "Ação",
    "dano": "[NIV/2+4]d10+[FOR]",
    "regra": "Linha de 36 m por 3 m: salvaguarda de Destreza, metade no sucesso. Uma vez por cena.",
    "desc": "Um Cero tão largo que parece o céu caindo.",
    "modelo": "Técnica final",
    "fixa": false
   },
   {
    "nome": "Pisada Colossal",
    "acao": "Ação bônus",
    "dano": "[NIV/4+1]d10+[FOR]",
    "regra": "Todas as criaturas a 6 m: salvaguarda de Força ou Caídas e sofrem o dano.",
    "desc": "Um passo, e a terra pula.",
    "modelo": "Golpe em área",
    "fixa": false
   },
   {
    "nome": "Raiva sem Dor",
    "acao": "Reação",
    "dano": "",
    "regra": "Quando sofre dano maior que o nível: ganha 1 carga de raiva (Ira Crescente) e PV temporários iguais à proficiência × 2.",
    "desc": "Quanto mais apanha, mais ri.",
    "modelo": "Proteção",
    "fixa": false
   }
  ],
  "ppGasto": 12
 },
 {
  "id": "tiburon-abismo",
  "nome": "Tiburón: Abismo",
  "dono": "Tier Halibel (inspirada)",
  "baseResurreccion": "tiburon",
  "canonica": false,
  "resumo": "Forma ORIGINAL inspirada no tubarão de Halibel: ela leva o fundo do mar para a superfície e caça dentro dele.",
  "tema": "Mar profundo e caça (inspirada em Halibel; não canônica)",
  "comando": "Afunde, Tiburón.",
  "aparencia": "A armadura óssea se alonga numa barbatana dorsal, a espada vira uma mandíbula de lâminas no braço e a água sobe em volta dela como uma maré escura que não molha os aliados.",
  "preRequisito": "Exige a Resurrección Tiburón ativa, nível 15+ e o treinamento da Segunda Etapa. Não canônica: o Mestre aprova o uso.",
  "efeitos": [
   {
    "id": "se-mar-profundo"
   },
   {
    "id": "se-oscuras"
   },
   {
    "id": "se-instinto"
   },
   {
    "id": "se-regen"
   }
  ],
  "pontoFraco": "pf-sede",
  "habilidades": [
   {
    "nome": "Mandíbula do Abismo",
    "acao": "Ação",
    "dano": "[NIV/2+3]d10+[DES]",
    "regra": "Um golpe contra um alvo dentro da água: se acertar, ele fica Agarrado (salvaguarda de Força evita) e é puxado 6 m para baixo d'água.",
    "desc": "Uma sombra passa por baixo e a mandíbula fecha.",
    "modelo": "Ataque básico",
    "fixa": false
   },
   {
    "nome": "Pressão das Profundezas",
    "acao": "Ação",
    "dano": "[NIV/2+4]d10+[ESP]",
    "regra": "Todos os inimigos na água a até 12 m: salvaguarda de Constituição; na falha, dano total e Atordoados até o início do seu próximo turno; no sucesso, metade. Uma vez por cena.",
    "desc": "A água pesa como o fundo do mar.",
    "modelo": "Técnica final",
    "fixa": false
   },
   {
    "nome": "Cardume de Gotas",
    "acao": "Ação bônus",
    "dano": "[NIV/4+2]d10+[ESP]",
    "regra": "Até 3 alvos a 36 m dividindo o dano.",
    "desc": "Gotas afiadas saem da água em todas as direções.",
    "modelo": "Rajada",
    "fixa": false
   },
   {
    "nome": "Maré que Protege",
    "acao": "Reação",
    "dano": "",
    "regra": "Quando um aliado na água é atingido: a água o cobre e o dano cai em proficiência d8.",
    "desc": "A maré se levanta como um muro.",
    "modelo": "Proteção",
    "fixa": false
   }
  ],
  "ppGasto": 13
 },
 {
  "id": "pantera-rei",
  "nome": "Pantera: Rei Felino",
  "dono": "Grimmjow Jaegerjaquez (inspirada)",
  "baseResurreccion": "pantera",
  "canonica": false,
  "resumo": "Forma ORIGINAL inspirada na sede de ser rei de Grimmjow: a pantera vira uma fera azul que ataca duas vezes e não cai.",
  "tema": "Rei predador (inspirada em Grimmjow; não canônica)",
  "comando": "Rasgue o mundo, Pantera.",
  "aparencia": "A crista vira uma juba de reiatsu azul, as garras dos braços crescem em lâminas Desgarrón fixas e a cauda se divide em duas. Os olhos ficam inteiros azuis.",
  "preRequisito": "Exige a Resurrección Pantera ativa, nível 15+ e o treinamento da Segunda Etapa. Não canônica: o Mestre aprova o uso.",
  "efeitos": [
   {
    "id": "se-rei"
   },
   {
    "id": "se-instinto"
   },
   {
    "id": "se-indomavel"
   },
   {
    "id": "se-devorar"
   },
   {
    "id": "se-terror"
   },
   {
    "id": "se-forca",
    "param": {
     "atr": "des"
    }
   }
  ],
  "pontoFraco": "pf-frenesi-leve",
  "habilidades": [
   {
    "nome": "Desgarrón Real",
    "acao": "Ação",
    "dano": "[NIV/2+4]d10+[DES]",
    "regra": "Dez lâminas de reiatsu em leque de 12 m: salvaguarda de Destreza, metade no sucesso. Uma vez por cena.",
    "desc": "As garras se acendem em azul e o ar se rasga em dez linhas.",
    "modelo": "Técnica final",
    "fixa": false
   },
   {
    "nome": "Garra do Rei",
    "acao": "Ação",
    "dano": "[NIV/2+1]d10+[DES]",
    "regra": "Dois ataques de garra (já somando o ataque extra da forma) contra o mesmo alvo ou dois alvos a 3 m.",
    "desc": "Ele não espera: já está atacando de novo.",
    "modelo": "Rajada",
    "fixa": false
   },
   {
    "nome": "Salto Predador",
    "acao": "Ação bônus",
    "dano": "[NIV/4+1]d10+[DES]",
    "regra": "Move até 12 m sem provocar ataques e ataca no fim do movimento.",
    "desc": "Um salto que só se vê pelo rastro azul.",
    "modelo": "Passo veloz",
    "fixa": false
   },
   {
    "nome": "Rugido do Rei",
    "acao": "Reação",
    "dano": "[NIV/2]d10+[DES]",
    "regra": "Quando um inimigo erra você corpo a corpo: revida com o dano indicado.",
    "desc": "Ele ri e devolve no mesmo instante.",
    "modelo": "Contra-ataque",
    "fixa": false
   }
  ],
  "ppGasto": 13
 }
];

export const FONTES_HOLLOW: string[] = ["https://sportskeeda.com/anime/how-powerful-tier-harribel-bleach-abilities-explored", "https://sportskeeda.com/anime/what-baraggan-s-ability-bleach-his-powers-explained", "https://www.sportskeeda.com/anime/barragan-s-arrogante-bleach-spoiled-yhwach-s-plans-thousand-year-blood-war", "https://www.sportskeeda.com/anime/how-powerful-nelliel-bleach-powers-abilities-explored", "https://sportskeeda.com/anime/bleach-every-type-cero-explained", "https://www.sportskeeda.com/anime/bleach-aaroniero-might-become-strongest-espada", "https://fictionhorizon.com/strongest-espada-in-bleach/", "https://criticalhits.com.br/anime/as-5-tecnicas-mais-fortes-do-ulquiorra-em-bleach/", "https://criticalhits.com.br/anime/as-tecnicas-mais-fortes-da-halibel-de-bleach/", "https://criticalhits.com.br/anime/bleach-todos-os-espada/", "https://destructoidmod.netlify.app/host-https-bleach.fandom.com/wiki/Right_Arm_of_the_Giant,_Left_Arm_of_the_Devil", "https://breezewiki.discard.no/bleach/wiki/Cero_Doble", "https://daddyjim.ai/bleach/character/Wonderweiss-Margela", "https://daddyjim.ai/bleach/character/Rugir-del-Dragon", "https://daddyjim.ai/bleach/character/Cyclones", "https://daddyjim.ai/es/bleach/character/Lanzador-Verde", "https://myanimelist.net/character/1081/Ulquiorra_Cifer"];

const ATR_NOME: Record<string, string> = { for: "Força", des: "Destreza", con: "Constituição", men: "Mente", esp: "Espírito" };
function nomeDaPeca(nome: string, param?: ParamPeca): string {
  if (param?.atr) return `${nome} (${ATR_NOME[param.atr] ?? param.atr})`;
  if (param?.tipo) return `${nome} (${param.tipo})`;
  if (param?.n) return `${nome} (+${param.n})`;
  return nome;
}

function montar(tipo: "resurreccion" | "segunda", m: ModeloResHollow | ModeloSegunda, ctx: CtxForma) {
  const ids = [...m.efeitos, { id: m.pontoFraco, param: m.pontoFracoParam }];
  const efeitos: InstEfeito[] = [];
  for (const e of ids) {
    const p = presetPorId(e.id);
    if (!p) continue;
    efeitos.push({ id: novoId(), preset: p.id, nome: nomeDaPeca(p.nome, e.param), texto: p.texto, efeitos: p.monta((e.param ?? {}) as never), pp: p.pp });
  }
  const habilidades: HabForma[] = m.habilidades.map((h) => {
    const a = !h.fixa && h.dano ? analisarDano(h.dano, h.acao, ctx, false, !!(h as { especial?: unknown }).especial) : null;
    const pr = h.fixa ? (h.prFixo ?? 12) : a ? a.custoPr : 0;
    return { id: novoId(), nome: h.nome, acao: h.acao, custo: pr ? `${pr} PR` : "", pr: pr || undefined, dano: h.dano || undefined, modelo: h.modelo || undefined, regra: h.regra, desc: h.desc, especial: (h as { especial?: { condicao: string; duracao: string } }).especial, fixa: h.fixa || undefined, texto: [h.desc, h.regra].filter(Boolean).join("\n") };
  });
  const lib = calcularLiberacao(tipo, efeitos, ctx, {});
  const ponto = presetPorId(m.pontoFraco);
  return { efeitos, habilidades, lib, ponto };
}

/** Monta a Resurrección pronta, com peças, habilidades e ponto fraco. */
export function formaDaResurreccion(m: ModeloResHollow, ctx: CtxForma): Partial<FormaLib> {
  const { efeitos, habilidades, lib, ponto } = montar("resurreccion", m, ctx);
  return { tipo: "resurreccion", modelo: m.id, nome: m.nome, comando: m.comando, aparencia: m.aparencia, traco: m.traco, efeitos, habilidades, pontoFraco: ponto?.nome ?? "", custo: lib.custoPr ?? (m.classe === "vazio" ? 40 : 45), duracao: lib.duracaoTexto || "até o fim da cena", texto: m.resumo };
}

/** Monta a Segunda Etapa pronta, apoiada na Resurrección indicada. */
export function formaDaSegunda(m: ModeloSegunda, ctx: CtxForma): Partial<FormaLib> {
  const { efeitos, habilidades, lib, ponto } = montar("segunda", m, ctx);
  return { tipo: "segunda", modelo: m.id, nome: m.nome, comando: m.comando, aparencia: m.aparencia, efeitos, habilidades, pontoFraco: ponto?.nome ?? "", custo: lib.custoPr ?? 0, duracao: lib.duracaoTexto || "até o fim da cena", texto: m.resumo, preRequisito: m.preRequisito, baseModelo: m.baseResurreccion };
}
