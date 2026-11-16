/* Primeira leva de técnicas e interações especiais novas (16 técnicas, as interações delas e 2 interações gerais).
   Só o catálogo: o que cada botão faz fica em poderes.ts (pelo rótulo). Só tipos vêm de especiais.ts, para não fazer ciclo. */
import type { DefInteracao, DefTecnica } from "./especiais";

const bt = (rotulo: string, ritmo: "acao" | "bonus" | "reacao" = "bonus", ref?: string) => ({ k: "gera" as const, botao: { rotulo, ritmo, faz: "texto" as const, ...(ref ? { ref } : {}) } });

export const TECNICAS_LEVA1: DefTecnica[] = [
  {
    id: "regeneracao", grupo: "Vida, morte e veneno", nome: "Regeneração", armaReq: ["natural"],
    texto: "No início do seu turno, se estiver abaixo da metade dos PV, você recupera PV iguais à proficiência. Precisa de uma interação da regeneração.",
    compilar: () => [{ k: "gatilho", quando: "inicioTurno", rotulo: "Regeneração", faz: { curaPv: "[PROF]", texto: "só vale com menos da metade dos PV" } }],
  },
  {
    id: "armadura-reiatsu", grupo: "Cargas, reservas e preço", nome: "Armadura de reiatsu", armaReq: ["natural", "pesada", "escudo"],
    texto: "Ao liberar a forma você ganha PV temporários iguais a 3 × proficiência e 2 de redução de dano física. Precisa de uma interação da armadura.",
    compilar: () => [{ k: "gatilho", quando: "liberar", rotulo: "Armadura de reiatsu", faz: { pvTemp: "[PROF]*3" } }, { k: "rd", tipo: "fis", v: 2 }],
  },
  {
    id: "toxina-paralisante", grupo: "Vida, morte e veneno", nome: "Toxina paralisante", armaReq: ["venenosa", "contato", "natural"],
    texto: "Uma vez por turno, ao acertar: o alvo faz salvaguarda de Constituição. Se falhar, fica Envenenado (desvantagem em ataques) até o fim do próximo turno dele; se falhar por 5 ou mais, fica Paralisado. Não causa dano: só tira ações. Diferente do Veneno. Precisa de uma interação da toxina.",
    compilar: () => [{ k: "gatilho", quando: "acerto", limite: "turno", rotulo: "Toxina paralisante", faz: { condicao: { nome: "Envenenado (Paralisado se falhar por 5 ou mais)", salva: "con", duracao: "até o fim do próximo turno dele" } } }],
  },
  {
    id: "voto-restritivo", grupo: "Cargas, reservas e preço", nome: "Voto restritivo",
    texto: "Ao liberar, escolha uma restrição para a cena: sem ataques à distância, sem andar mais de 3 m por turno ou sem Kidō. Enquanto cumprir: +proficiência de dano nos golpes e +1 na CD. Se quebrar, a forma termina e você perde 2 × proficiência PV. Precisa de uma interação do voto.",
    compilar: () => [{ k: "dano", em: ["golpe"], v: "[PROF]" }, { k: "cd", v: 1 }, { k: "preco", pp: 2, texto: "Voto restritivo: se quebrar a restrição escolhida, a forma termina e você perde 2 × proficiência PV." }],
  },
  {
    id: "limite-liberacao", grupo: "Tempo e ritmo", nome: "Limite de liberação",
    texto: "A forma ganha um limite de proficiência + 2 turnos. Enquanto dura: +1d6 nos golpes e +1 de CR. Quando acaba, a forma termina e você fica com 1 nível de cansaço. Precisa de uma interação do limite.",
    compilar: () => [{ k: "duracao", turnos: "[PROF]+2" }, { k: "dados", em: ["golpe"], n: 1, d: 6 }, { k: "cr", v: 1 }, { k: "preco", pp: 1, texto: "Limite de liberação: ao fim do limite a forma termina e você fica com 1 nível de cansaço." }],
  },
  {
    id: "sequencia", grupo: "Tempo e ritmo", nome: "Sequência", armaReq: ["agil", "dupla", "natural"],
    texto: "Cada golpe que acerta soma 1 de sequência (até a proficiência); errar zera. Cada ponto dá +1 de dano nos golpes. Cria os botões “Somar sequência” e “Errar a sequência”. Precisa de uma interação da sequência.",
    compilar: () => [bt("Somar sequência", "reacao"), bt("Errar a sequência", "reacao")],
  },
  {
    id: "calor-acumulado", grupo: "Cargas, reservas e preço", nome: "Calor acumulado", armaReq: ["elemental", "pesada", "foco"],
    texto: "Cada técnica especial ou Kidō que você usa soma 1 de calor (até 5). Cada ponto dá +1 de dano nos golpes. Com 5, no início do seu próximo turno você descarrega ou sofre 3d6 de Fogo. Cria o botão “Esquentar”. Precisa de uma interação do calor.",
    compilar: () => [bt("Esquentar", "reacao")],
  },
  {
    id: "pagar-sangue", grupo: "Cargas, reservas e preço", nome: "Pagar com sangue",
    texto: "Ação bônus: você perde até 3 × proficiência PV (nada reduz) e recupera PR iguais à metade do que perdeu. Cria o botão “Pagar com sangue”. Precisa de uma interação do sangue.",
    compilar: () => [bt("Pagar com sangue")],
  },
  {
    id: "ler-oponente", grupo: "Sentidos e regras do duelo", nome: "Ler o oponente",
    texto: "Ação bônus: teste de Intuição contra 10 + proficiência do alvo. Sucesso: você descobre uma resistência, uma fraqueza ou a CR exata dele e ganha +1 no acerto contra ele até o fim da cena (acumula até 3 leituras). Cria o botão “Ler o oponente”. Precisa de uma interação da leitura.",
    compilar: () => [bt("Ler o oponente")],
  },
  {
    id: "congelamento", grupo: "Elementos", nome: "Congelamento gradual", armaReq: ["elemental"],
    texto: "Cada golpe que acerta dá 1 de gelo no alvo (até 3): 1 = −3 m de deslocamento; 2 = sem reações; 3 = salvaguarda de Constituição ou Contido até o fim do próximo turno dele, e o gelo zera. Cria o botão “Gelo no alvo”. Precisa de uma interação do gelo.",
    compilar: () => [bt("Gelo no alvo", "reacao")],
  },
  {
    id: "arco-voltaico", grupo: "Elementos", nome: "Arco voltaico", armaReq: ["elemental", "longo-alcance", "foco"],
    texto: "Ação: um raio atinge uma criatura a até 18 m (salvaguarda de Destreza; proficiência d6 de dano elétrico) e salta para até metade da proficiência de outras, cada uma a até 4,5 m da anterior, com metade do dano anterior. Cria o botão “Arco voltaico”. Precisa de uma interação do raio.",
    compilar: () => [bt("Arco voltaico", "acao", "[PROF]d6")],
  },
  {
    id: "contagem", grupo: "Marcas e maldições", nome: "Contagem regressiva",
    texto: "Ação bônus: marca uma criatura com o número da sua proficiência. Cada vez que você a acerta, o número cai 1. No 0, o seu próximo golpe nela é crítico e a marca some. Cria os botões “Começar contagem” e “Acertar o marcado”. Precisa de uma interação da contagem.",
    compilar: () => [bt("Começar contagem"), bt("Acertar o marcado", "reacao")],
  },
  {
    id: "tabu", grupo: "Marcas e maldições", nome: "Tabu", armaReq: ["foco", "corrente", "contato"],
    texto: "Ação bônus: marca uma criatura a até 18 m e uma ação proibida (atacar você, andar mais de 3 m ou usar técnica). Se ela fizer, sofre proficiência d6 de Energia sem salvaguarda e a marca some. Uma marca por vez. Cria os botões “Impor tabu” e “Ela quebrou o tabu”. Precisa de uma interação do tabu.",
    compilar: () => [bt("Impor tabu"), bt("Ela quebrou o tabu", "reacao")],
  },
  {
    id: "familiar-apoio", grupo: "Criaturas e invocações", nome: "Familiar de apoio", armaReq: ["invocada", "enxame", "foco"],
    texto: "Ação bônus: chama uma criatura minúscula que não ataca (PV 2 × proficiência). Como ação bônus sua, ela dá a um aliado a até 9 m dela +1d4 na próxima jogada de ataque ou salvaguarda. Cria os botões “Chamar o familiar” e “Apoio do familiar”. Precisa de uma interação do familiar.",
    compilar: () => [
      { k: "invoca", nome: "Familiar de apoio", tipo: "invocacao", max: 1, pv: "[PROF]*2", cr: "12+[PROF]", acerto: "0", dano: "", custoPr: 2, texto: "Criatura minúscula que não ataca: dá apoio a aliados." },
      { k: "gera", botao: { rotulo: "Chamar o familiar", ritmo: "bonus", faz: "invocar" } },
      bt("Apoio do familiar"),
    ],
  },
  {
    id: "sentinela", grupo: "Criaturas e invocações", nome: "Sentinela imóvel", armaReq: ["elemental", "foco", "invocada"],
    texto: "Ação bônus: ergue uma sentinela (totem, torre, estátua) num ponto a até 9 m. Ela não se move; PV 4 × proficiência; ataca à distância até 18 m. Até 1 sentinela. Cria o botão “Erguer sentinela”. Precisa de uma interação da sentinela.",
    compilar: () => [
      { k: "invoca", nome: "Sentinela", tipo: "invocacao", max: 1, pv: "[PROF]*4", cr: "12+[PROF]", acerto: "[PROF]+[ESP]", dano: "1d10+[PROF]", custoPr: 3, texto: "Deslocamento 0. Ataca até 18 m." },
      { k: "gera", botao: { rotulo: "Erguer sentinela", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "desviar-projeteis", grupo: "Controle e defesa", nome: "Desviar projéteis", armaReq: ["agil", "dupla", "escudo", "segmentavel"],
    texto: "Reação: o dano de um ataque à distância cai em 1d10 + Destreza + proficiência. Se cair a 0, você pode lançá-lo de volta (ataque à distância, 18 m, mesmo dano). Cria o botão “Desviar”. Precisa de uma interação do desvio.",
    compilar: () => [bt("Desviar", "reacao")],
  },
];

const tx = (t: string) => ({ k: "texto" as const, t });

export const INTERACOES_LEVA1: DefInteracao[] = [
  /* Regeneração */
  { id: "regenerar-abate", nome: "Regenerar ao abater", com: ["regeneracao"], vale: [], texto: "Ao derrubar um inimigo, você recupera 2 × proficiência PV.",
    compilar: () => [{ k: "gatilho", quando: "abate", rotulo: "Regenerar ao abater", faz: { curaPv: "[PROF]*2" } }] },
  { id: "forcar-regeneracao", nome: "Forçar a regeneração", com: ["regeneracao"], vale: [], texto: "Ação bônus: a regeneração deste turno dobra (você recupera mais proficiência PV na hora). Cria o botão “Forçar a regeneração”.",
    compilar: () => [bt("Forçar a regeneração")] },
  { id: "regenerar-membro", nome: "Regenerar membro", com: ["regeneracao"], vale: [], texto: "Uma vez por cena, ação bônus: você recupera 3 × proficiência PV e se livra de uma condição física. Cria o botão “Regenerar membro”.",
    compilar: () => [bt("Regenerar membro")] },
  /* Armadura de reiatsu */
  { id: "recompor-armadura", nome: "Recompor a armadura", com: ["armadura-reiatsu"], vale: [], texto: "Ação bônus: os seus PV temporários voltam a 2 × proficiência (se estiverem menores). Cria o botão “Recompor a armadura”.",
    compilar: () => [bt("Recompor a armadura")] },
  { id: "armadura-estoura", nome: "Armadura que estoura", com: ["armadura-reiatsu"], vale: [], texto: "Reação, quando os PV temporários acabam (1 vez por cena): criaturas a até 3 m fazem salvaguarda de Destreza ou sofrem 2d6 de dano. Cria o botão “Armadura que estoura”.",
    compilar: () => [bt("Armadura que estoura", "reacao")] },
  { id: "armadura-leve", nome: "Armadura ágil", com: ["armadura-reiatsu"], vale: [], texto: "A armadura de reiatsu não pesa: +3 m de deslocamento e +2 de iniciativa.",
    compilar: () => [{ k: "desloc", modo: "chao", v: 3 }, { k: "ini", v: 2 }, tx("Armadura ágil: +3 m de deslocamento e +2 de iniciativa.")] },
  /* Toxina paralisante */
  { id: "toxina-lenta", nome: "Toxina lenta", com: ["toxina-paralisante"], vale: [], texto: "O efeito da toxina só vem no fim do próximo turno do alvo; em troca, a CD da forma sobe 2.",
    compilar: () => [{ k: "cd", v: 2 }, tx("Toxina lenta: a toxina só faz efeito no fim do próximo turno do alvo; em troca, a CD da forma sobe 2.")] },
  { id: "antidoto", nome: "Antídoto", com: ["toxina-paralisante"], vale: [], texto: "Ação bônus: tira Envenenado de um aliado a até 1,5 m.",
    compilar: () => [tx("Antídoto: ação bônus, tira Envenenado de um aliado a até 1,5 m.")] },
  { id: "toxina-acumula", nome: "Toxina que acumula", com: ["toxina-paralisante"], vale: [], texto: "Cada vez que o mesmo alvo falha na salvaguarda da toxina, a CD dela contra ele sobe 1 até o fim da cena (máximo +3).",
    compilar: () => [tx("Toxina que acumula: a cada falha do mesmo alvo, a CD da toxina contra ele sobe 1 até o fim da cena (máximo +3).")] },
  { id: "toxina-veneno", nome: "Toxina e veneno", com: ["toxina-paralisante", "veneno"], vale: [], texto: "Liga as duas técnicas: cada dose de veneno no alvo (até 3) soma +1 na CD da toxina contra ele (o botão Envenenar avisa).",
    compilar: () => [tx("Toxina e veneno: cada dose de veneno no alvo (até 3) soma +1 na CD da toxina contra ele.")] },
  /* Voto restritivo */
  { id: "voto-duplo", nome: "Voto duplo", com: ["voto-restritivo"], vale: [], texto: "Você aceita duas restrições; o bônus de CD do voto vira +2.",
    compilar: () => [{ k: "cd", v: 1 }, tx("Voto duplo: duas restrições ao mesmo tempo; o bônus de CD do voto vira +2.")] },
  { id: "voto-selado", nome: "Voto selado", com: ["voto-restritivo"], vale: [], texto: "Ser movido à força por um inimigo não quebra o voto.",
    compilar: () => [tx("Voto selado: ser movido à força por um inimigo não quebra o voto.")] },
  { id: "voto-partilhado", nome: "Voto partilhado", com: ["voto-restritivo"], vale: [], texto: "Um aliado aceita o mesmo voto e ganha metade do bônus de dano e de CD.",
    compilar: () => [tx("Voto partilhado: um aliado que aceite o mesmo voto ganha metade do bônus de dano e de CD enquanto cumprir.")] },
  /* Limite de liberação */
  { id: "esticar-limite", nome: "Esticar o limite", com: ["limite-liberacao"], vale: [], texto: "Ação bônus, 1 vez por turno: +1 turno no limite da forma (o Novo turno conta os turnos e avisa quando acaba). Cria o botão “Esticar o limite”.",
    compilar: () => [bt("Esticar o limite")] },
  { id: "ultimo-folego", nome: "Último fôlego", com: ["limite-liberacao"], vale: [], texto: "No último turno do limite, o seu primeiro golpe causa +proficiência d8 de dano.",
    compilar: () => [tx("Último fôlego: no último turno do limite, o seu primeiro golpe causa +proficiência d8 de dano.")] },
  /* Sequência */
  { id: "finalizador", nome: "Finalizador", com: ["sequencia"], vale: [], texto: "Ação bônus, com 3 ou mais de sequência: gasta tudo; o próximo golpe exige salvaguarda de Constituição (CD) ou deixa o alvo Atordoado até o fim do próximo turno dele. Cria o botão “Finalizar a sequência”.",
    compilar: () => [bt("Finalizar a sequência")] },
  { id: "sequencia-firme", nome: "Sequência firme", com: ["sequencia"], vale: [], texto: "Um golpe errado só tira metade da sequência, em vez de zerar.",
    compilar: () => [tx("Sequência firme: errar um golpe só tira metade da sequência.")] },
  /* Calor acumulado */
  { id: "ventilar", nome: "Ventilar", com: ["calor-acumulado"], vale: [], texto: "Ação bônus: zera o calor e solta um cone de vapor de 4,5 m: salvaguarda de Destreza, dano de Fogo igual ao calor × 1d4. Cria o botão “Ventilar”.",
    compilar: () => [bt("Ventilar")] },
  { id: "ponto-fusao", nome: "Ponto de fusão", com: ["calor-acumulado"], vale: [], texto: "Com 5 de calor, os seus golpes ignoram redução de dano igual à proficiência.",
    compilar: () => [tx("Ponto de fusão: com 5 de calor, os seus golpes ignoram redução de dano igual à proficiência.")] },
  { id: "dissipar-escudo", nome: "Dissipar em escudo", com: ["calor-acumulado"], vale: [], texto: "Reação: zera o calor e ganha PV temporários iguais ao calor × proficiência. Cria o botão “Dissipar em escudo”.",
    compilar: () => [bt("Dissipar em escudo", "reacao")] },
  /* Pagar com sangue */
  { id: "sangue-lamina", nome: "Sangue na lâmina", com: ["pagar-sangue"], vale: [], texto: "Ação bônus: o próximo golpe causa +1d6 para cada 5 PV pagos com sangue. Cria o botão “Sangue na lâmina”.",
    compilar: () => [bt("Sangue na lâmina")] },
  { id: "ferido-perigoso", nome: "Ferido e perigoso", com: ["pagar-sangue"], vale: [], texto: "Enquanto estiver abaixo da metade dos PV, você ganha +1 no acerto.",
    compilar: () => [tx("Ferido e perigoso: abaixo da metade dos PV, +1 no acerto.")] },
  /* Ler o oponente */
  { id: "ler-padrao", nome: "Ler o padrão", com: ["ler-oponente"], vale: [], texto: "Reação, com 3 leituras: um ataque do alvo lido tem desvantagem; as leituras zeram. Cria o botão “Ler o padrão”.",
    compilar: () => [bt("Ler o padrão", "reacao")] },
  { id: "dissecar", nome: "Dissecar", com: ["ler-oponente"], vale: [], texto: "Com 2 ou mais leituras, os seus golpes no alvo ignoram 2 de redução de dano.",
    compilar: () => [tx("Dissecar: com 2 ou mais leituras, os seus golpes no alvo lido ignoram 2 de redução de dano.")] },
  { id: "fraqueza-exposta", nome: "Fraqueza exposta", com: ["ler-oponente"], vale: [], texto: "Os aliados que ouvirem você também recebem o +1 de acerto das leituras.",
    compilar: () => [tx("Fraqueza exposta: os aliados que ouvirem você também recebem o bônus de acerto das leituras.")] },
  /* Congelamento gradual */
  { id: "gelo-racha", nome: "Gelo que racha a defesa", com: ["congelamento"], vale: [], texto: "Com 2 ou mais de gelo, o alvo perde 2 de redução de dano contra os seus golpes.",
    compilar: () => [tx("Gelo que racha a defesa: com 2 ou mais de gelo, o alvo tem −2 de redução de dano contra os seus golpes.")] },
  { id: "frio-espalha", nome: "Frio que se espalha", com: ["congelamento"], vale: [], texto: "Quando o gelo chega a 3, cada criatura a até 3 m do alvo ganha 1 de gelo.",
    compilar: () => [tx("Frio que se espalha: quando o gelo chega a 3, cada criatura a até 3 m do alvo ganha 1 de gelo.")] },
  { id: "chao-gelado", nome: "Chão gelado", com: ["congelamento"], vale: [], texto: "O chão a 3 m do alvo congelado vira terreno escorregadio: salvaguarda de Destreza ou fica Caído.",
    compilar: () => [tx("Chão gelado: o chão a 3 m do alvo congelado vira terreno escorregadio (salvaguarda de Destreza ou fica Caído).")] },
  /* Arco voltaico */
  { id: "raio-agua", nome: "Raio na água", com: ["arco-voltaico"], vale: [], texto: "Alvos molhados (chuva, correnteza) que falharem por 5 ou mais ficam Atordoados até o fim do próximo turno deles.",
    compilar: () => [tx("Raio na água: alvos molhados que falharem por 5 ou mais ficam Atordoados até o fim do próximo turno deles.")] },
  { id: "aterrar", nome: "Aterrar", com: ["arco-voltaico"], vale: [], texto: "O raio pula os seus aliados.",
    compilar: () => [tx("Aterrar: o raio pula os seus aliados.")] },
  { id: "magnetismo", nome: "Magnetismo", com: ["arco-voltaico"], vale: [], texto: "O último alvo do raio é puxado 3 m para você.",
    compilar: () => [tx("Magnetismo: o último alvo do raio é puxado 3 m para você.")] },
  /* Contagem regressiva */
  { id: "tempo-corre", nome: "O tempo corre", com: ["contagem"], vale: [], texto: "No Novo turno, a contagem também cai 1.",
    compilar: () => [tx("O tempo corre: no início do seu turno, a contagem cai 1.")] },
  { id: "contagem-passa", nome: "Contagem que passa", com: ["contagem"], vale: [], texto: "Se o marcado cair, a contagem continua noutra criatura, com o número que tinha.",
    compilar: () => [tx("Contagem que passa: se o marcado cair, a contagem continua noutra criatura, com o número que tinha.")] },
  { id: "anuncio", nome: "Anúncio", com: ["contagem"], vale: [], texto: "Com 2 ou menos na contagem, o marcado tem desvantagem em salvaguardas de Mente.",
    compilar: () => [tx("Anúncio: com 2 ou menos na contagem, o marcado tem desvantagem em salvaguardas de Mente.")] },
  /* Tabu */
  { id: "tabu-duplo", nome: "Tabu duplo", com: ["tabu"], vale: [], texto: "Duas proibições ao mesmo tempo na mesma criatura.",
    compilar: () => [tx("Tabu duplo: duas proibições ao mesmo tempo na mesma criatura (a marca só some quando ela quebra a segunda).")] },
  { id: "tabu-trava", nome: "Tabu que trava", com: ["tabu"], vale: [], texto: "Em vez de dano, a criatura que quebra o tabu faz salvaguarda de Espírito ou fica Atordoada até o fim do próximo turno dela.",
    compilar: () => [tx("Tabu que trava: em vez de dano, quem quebra o tabu faz salvaguarda de Espírito ou fica Atordoado até o fim do próximo turno dele.")] },
  { id: "tabu-secreto", nome: "Tabu secreto", com: ["tabu"], vale: [], texto: "A criatura não sabe qual é a regra; o dano ao quebrar sobe 1 dado.",
    compilar: () => [tx("Tabu secreto: a criatura não sabe qual é a regra; o dano ao quebrar o tabu sobe 1 dado.")] },
  /* Familiar de apoio */
  { id: "familiar-toque", nome: "Familiar que leva o toque", com: ["familiar-apoio"], vale: [], texto: "Técnicas e Kidō de toque suas podem sair do familiar, como se você estivesse no lugar dele.",
    compilar: () => [tx("Familiar que leva o toque: técnicas e Kidō de toque suas podem sair do familiar, como se você estivesse no lugar dele.")] },
  { id: "apoio-redobrado", nome: "Apoio redobrado", com: ["familiar-apoio"], vale: [], texto: "O dado do apoio vira 1d6 e serve a dois aliados ao mesmo tempo.",
    compilar: () => [tx("Apoio redobrado: o apoio do familiar vira 1d6 e serve a dois aliados ao mesmo tempo.")] },
  { id: "familiar-sombra", nome: "Familiar na sombra", com: ["familiar-apoio"], vale: [], texto: "O familiar entra na sombra de um aliado: vantagem em Furtividade e não pode ser alvo.",
    compilar: () => [tx("Familiar na sombra: o familiar entra na sombra de um aliado, com vantagem em Furtividade, e não pode ser alvo.")] },
  /* Sentinela imóvel */
  { id: "rede-sentinelas", nome: "Rede de sentinelas", com: ["sentinela"], vale: [], texto: "Uma segunda sentinela (botão “Erguer sentinela da rede”); a linha entre as duas é terreno difícil para os inimigos.",
    compilar: () => [
      { k: "invoca", nome: "Sentinela da rede", tipo: "invocacao", max: 1, pv: "[PROF]*4", cr: "12+[PROF]", acerto: "[PROF]+[ESP]", dano: "1d10+[PROF]", custoPr: 3, texto: "Deslocamento 0. Ataca até 18 m. A linha até a outra sentinela é terreno difícil." },
      { k: "gera", botao: { rotulo: "Erguer sentinela da rede", ritmo: "bonus", faz: "invocar" } },
    ] },
  { id: "sentinela-cura", nome: "Sentinela que cura", com: ["sentinela"], vale: [], texto: "No Novo turno, um aliado a até 9 m da sentinela recupera PV iguais à proficiência.",
    compilar: () => [tx("Sentinela que cura: no início do seu turno, um aliado a até 9 m da sentinela recupera PV iguais à proficiência.")] },
  { id: "sentinela-farol", nome: "Sentinela-farol", com: ["sentinela"], vale: [], texto: "Inimigos a até 9 m da sentinela não ficam invisíveis nem se escondem.",
    compilar: () => [tx("Sentinela-farol: inimigos a até 9 m da sentinela não ficam invisíveis nem se escondem.")] },
  /* Desviar projéteis */
  { id: "cobrir-aliado", nome: "Cobrir o aliado", com: ["desviar-projeteis"], vale: [], texto: "O desvio vale também para um aliado a até 1,5 m de você.",
    compilar: () => [tx("Cobrir o aliado: o desvio vale também para um aliado a até 1,5 m de você.")] },
  { id: "ricochete", nome: "Ricochete", com: ["desviar-projeteis"], vale: [], texto: "O projétil devolvido pula para mais uma criatura a até 4,5 m, com metade do dano.",
    compilar: () => [tx("Ricochete: o projétil devolvido pula para mais uma criatura a até 4,5 m, com metade do dano.")] },
  /* Gerais */
  { id: "recarga-abate", nome: "Recarga no abate", com: [], vale: [], texto: "Ao derrubar um inimigo, você recupera PR iguais à metade da proficiência (mínimo 1). Serve a qualquer técnica.",
    compilar: () => [{ k: "gatilho", quando: "abate", rotulo: "Recarga no abate", faz: { pr: "[PROF]/2" } }] },
  { id: "disparo-critico", nome: "Disparo no crítico", com: [], vale: [], texto: "Ao acertar um crítico, uma descarga de reiatsu causa proficiência d6 de dano de Energia no alvo. Serve a qualquer técnica.",
    compilar: () => [{ k: "gatilho", quando: "critico", rotulo: "Disparo no crítico", faz: { dano: { expr: "[PROF]d6", tipo: "Energia" } } }] },
];
