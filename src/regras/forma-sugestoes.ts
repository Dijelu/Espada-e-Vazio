/* Sugestões prontas para o passo a passo da Bankai, da Resurrección e da Vollständig.
   São ideias para começar: o jogador edita tudo e o Mestre aprova. */
import type { TipoForma } from "./ficha";

export interface Tema {
  id: string;
  nome: string;
  ideia: string;
  aparencia: string;
  pontoFraco?: string;
  traco?: string;
}

export interface NomeComando { nome: string; comando: string }

/** Temas para o passo de conceito: um clique preenche aparência e ponto fraco. */
export const TEMAS: Partial<Record<TipoForma, Tema[]>> = {
  bankai: [
    { id: "gigante", nome: "Colosso espiritual", ideia: "O espírito da Zanpakutou surge enorme ao seu lado e luta com você.", aparencia: "Uma figura gigante feita de reiatsu se ergue atrás do usuário e imita cada golpe dele.", pontoFraco: "Só pode ser liberada longe de aliados, porque o poder também os atinge." },
    { id: "armadura", nome: "Armadura e arma única", ideia: "Todo o poder se concentra numa armadura e numa arma só, no estilo de duelista.", aparencia: "A lâmina some e uma armadura de reiatsu cobre o corpo, com uma arma nova na mão.", pontoFraco: "Ao encerrar a Bankai, você fica Esgotado até o fim do próximo turno." },
    { id: "ambiente", nome: "Domínio do ambiente", ideia: "A Bankai muda o campo de batalha: tempo, luz, gelo ou noite cobrem a área.", aparencia: "O céu escurece e o cenário muda de acordo com o tema da Zanpakutou, num raio de 30 metros.", pontoFraco: "Vulnerável ao tipo de dano oposto ao tema da Zanpakutou." },
    { id: "enxame", nome: "Enxame e lâminas", ideia: "Milhares de partes pequenas cumprem o seu comando, atacando e defendendo.", aparencia: "A espada se desfaz em milhares de lâminas, pétalas ou fragmentos que obedecem a sua mão.", pontoFraco: "A Bankai se desfaz se você sofrer um acerto crítico." },
    { id: "veneno", nome: "Marca e veneno", ideia: "Um efeito que fica no inimigo e cresce com o tempo, em vez de dano imediato.", aparencia: "Uma arma pequena e discreta, com marcas que aparecem na pele dos alvos.", pontoFraco: "Uma das habilidades só pode ser usada uma vez por Bankai." },
    { id: "velocidade", nome: "Velocidade absoluta", ideia: "Você fica tão rápido que parece estar em vários lugares ao mesmo tempo.", aparencia: "O corpo é envolto em luz e deixa rastros de imagem por onde passa.", pontoFraco: "Ao encerrar a Bankai, você fica Esgotado até o fim do próximo turno." },
    { id: "cura", nome: "Proteção e cura", ideia: "A Bankai protege aliados, fecha ferimentos e sustenta o grupo.", aparencia: "Um escudo, flores ou uma cúpula de luz cobre você e os aliados próximos.", pontoFraco: "O custo de manter a Bankai sobe em +5 PR se nenhum aliado estiver a até 9 metros." },
    { id: "fogo-gelo", nome: "Elemento puro", ideia: "O elemento da Zanpakutou domina tudo: fogo, gelo, raio, vento ou água.", aparencia: "O corpo e a arma ficam envoltos pelo elemento, e o chão ao redor reage a ele.", pontoFraco: "Vulnerável ao tipo de dano oposto ao tema da Zanpakutou." },
  ],
  resurreccion: [
    { id: "predador", nome: "Predador veloz", ideia: "Um caçador de garras e velocidade, que fecha a distância num piscar de olhos.", aparencia: "Corpo esguio de felino ou lobo, com garras de osso, cauda e máscara reduzida a uma crista.", traco: "Deslocamento +6 metros e Desengajar como ação livre uma vez por turno.", pontoFraco: "-2 de CR contra ataques à distância." },
    { id: "bestial", nome: "Fera devoradora", ideia: "Uma fera enorme que devora e cresce com o que come.", aparencia: "Corpo largo e musculoso, com mandíbula aberta no peito e pele de carapaça.", traco: "Vantagem no primeiro ataque de cada turno.", pontoFraco: "Deslocamento -3 metros." },
    { id: "canhao", nome: "Canhão vivo", ideia: "Artilharia: tudo na forma existe para disparar um Cero maior.", aparencia: "Chifres e placas de osso se abrem e concentram energia, com a máscara cobrindo metade do rosto.", traco: "Alcance corpo a corpo +3 metros.", pontoFraco: "Se nenhum aliado estiver a 9 metros, uma das técnicas custa +3 PR." },
    { id: "ilusionista", nome: "Enganador", ideia: "Truques, ilusões e imitações que confundem o inimigo.", aparencia: "Asas membranosas e pele pálida, com olhos que brilham e vários rostos de osso.", traco: "Uma vez por rodada, quando um ataque erra você, ganhe PV temporários iguais à proficiência.", pontoFraco: "Desvantagem em Percepção com luz intensa." },
    { id: "veneno", nome: "Envenenador", ideia: "Toxinas e doenças que enfraquecem o inimigo aos poucos.", aparencia: "Corpo de inseto ou serpente, com ferrões, glândulas e uma cauda longa.", traco: "Uma vez por rodada, quando uma criatura o acerta em corpo a corpo, ela sofre 1d10 de dano de Energia.", pontoFraco: "Ao sofrer um acerto crítico, o traço da forma deixa de funcionar até o fim da Resurrección." },
    { id: "espelho", nome: "Cristal e reflexo", ideia: "Pele de vidro ou cristal que devolve parte do que recebe.", aparencia: "Pele de cristal polido, que reflete a luz, com a máscara em forma de espelho.", traco: "Voo igual ao seu deslocamento.", pontoFraco: "Ao sofrer um acerto crítico, o traço da forma deixa de funcionar até o fim da Resurrección." },
  ],
  vollstandig: [
    { id: "luz", nome: "Luz e asas", ideia: "A forma clássica: asas de reishi, auréola e arco ou lança de luz.", aparencia: "Asas de reishi azuis e uma auréola brilhante, com roupa branca e cabelo flutuando." },
    { id: "armadura", nome: "Armadura de reishi", ideia: "Uma armadura de reishi cobre o corpo e reforça o combate corpo a corpo.", aparencia: "Placas de reishi cobrem peito e braços, com uma lâmina de luz na mão." },
    { id: "sombra", nome: "Sombra e escuridão", ideia: "Um Vollständig sombrio, que usa a noite e a ilusão a seu favor.", aparencia: "Reishi escuro, com asas de contorno brilhante e olhos que reluzem." },
    { id: "canhao", nome: "Artilharia", ideia: "Toda a forma é voltada ao disparo à distância, com flechas ou canhões.", aparencia: "Asas que se abrem como mira, com um arco gigante de reishi dourado." },
    { id: "guerreiro", nome: "Guerreiro duplo", ideia: "Duas armas e movimento constante: ataque e defesa ao mesmo tempo.", aparencia: "Duas lâminas de reishi nas mãos, com asas curtas e leves." },
    { id: "apoio", nome: "Guardião", ideia: "Protege e fortalece os aliados com escudos e cura.", aparencia: "Uma cúpula de reishi branco ao redor do grupo, com asas largas e brilhantes." },
  ],
};

/** Exemplos de nome e comando, para quem trava na página em branco. */
export const NOMES: Partial<Record<TipoForma, NomeComando[]>> = {
  bankai: [
    { nome: "Tenchi Kaigyoku", comando: "Cubra o céu e a terra" },
    { nome: "Kōri no Shōgun", comando: "Congele o campo de batalha" },
    { nome: "Hōzuki Raimei", comando: "Trovão, responda ao meu chamado" },
    { nome: "Yami no Tsukikage", comando: "Que a lua esconda o meu rastro" },
    { nome: "Senka Ryūjin", comando: "Desperte, dragão de chamas" },
    { nome: "Mugen Kasumi", comando: "Dissolva-se em névoa" },
  ],
  resurreccion: [
    { nome: "Lobo Gris", comando: "Rasgue, Lobo Gris" },
    { nome: "Serpiente Blanca", comando: "Envolva, Serpiente Blanca" },
    { nome: "Halcón Negro", comando: "Voe, Halcón Negro" },
    { nome: "Oso Rojo", comando: "Esmague, Oso Rojo" },
    { nome: "Escorpión de Cristal", comando: "Pique, Escorpión de Cristal" },
    { nome: "Tigre Sombrío", comando: "Caçe, Tigre Sombrío" },
  ],
  vollstandig: [
    { nome: "Vollständig", comando: "Quincy Vollständig" },
    { nome: "Licht Vollständig", comando: "Que a luz escolha o meu caminho" },
    { nome: "Stern Vollständig", comando: "Estrelas, desçam sobre mim" },
    { nome: "Blut Vollständig", comando: "Que o sangue queime em azul" },
  ],
};

export const CANALIZADORES_EXTRA = ["Cruz Quincy no pescoço", "Luva com o emblema", "Máscara", "Sangue desenhando o símbolo no ar", "Anel de prata", "Livro de orações", "Relógio de bolso", "Brinco de prata", "Bracelete com a estrela"];

export const FRAQUEZAS_EXTRA: Record<TipoForma, string[]> = {
  shikai: [],
  bankai: [
    "Depois de usar a técnica mais forte, você não pode usá-la de novo por 1d4 turnos.",
    "O custo para manter a Bankai sobe em +5 PR a cada minuto.",
    "Você sofre 1d6 de dano de Energia no início do turno se estiver com menos da metade dos PV.",
    "Você fica com -2 de CR contra ataques do tipo oposto ao tema.",
  ],
  resurreccion: [
    "As técnicas custam +2 PR quando você está com menos da metade dos PV.",
    "Você fica vulnerável ao tipo de dano oposto ao tema da forma.",
    "Quando você usa a técnica final, a forma recua e você perde o traço até o seu próximo turno.",
  ],
  vollstandig: [
    "Se o canalizador for destruído, a Vollständig termina ao fim do turno.",
    "Ao encerrar a Vollständig, você fica Esgotado até o fim do próximo turno.",
    "Se um aliado cair a 0 PV na sua frente, você fica com desvantagem no próximo ataque.",
  ],
};
