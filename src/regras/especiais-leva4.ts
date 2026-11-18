/* Quarta leva de técnicas e interações especiais (48 técnicas). Os botões seguem o motor genérico de poderes-simples.ts (pelo rótulo). */
import type { DefInteracao, DefTecnica, GrupoTecnica } from "./especiais";
import type { CaracArmaId } from "./arma-forma";
import type { Efeito } from "./efeitos-forma";

type Ritmo = "acao" | "bonus" | "reacao";
const bt = (rotulo: string, ritmo: Ritmo = "bonus"): Efeito => ({ k: "gera", botao: { rotulo, ritmo, faz: "texto" } });
const tx = (t: string): Efeito => ({ k: "texto", t });
const PRECISA = (de: string) => ` Precisa de uma interação ${de}.`;
/** técnica cujos efeitos são só botões */
const T = (id: string, grupo: GrupoTecnica, nome: string, texto: string, de: string, botoes: [string, Ritmo?][], armaReq?: CaracArmaId[], extra: Efeito[] = [], soHollow = false): DefTecnica =>
  ({ id, grupo, nome, texto: texto + PRECISA(de), ...(armaReq ? { armaReq } : {}), ...(soHollow ? { soHollow } : {}), compilar: () => [...extra, ...botoes.map(([r, x]) => bt(r, x))] });
/** interação passiva (texto) */
const I = (id: string, nome: string, com: string, texto: string, extra: Efeito[] = [], soHollow = false): DefInteracao =>
  ({ id, nome, com: [com], vale: [], texto, ...(soHollow ? { soHollow } : {}), compilar: () => [...extra, tx(`${nome}: ${texto.charAt(0).toLowerCase()}${texto.slice(1)}`)] });
/** interação que cria botão */
const B = (id: string, nome: string, com: string, texto: string, rotulo: string, ritmo: Ritmo = "bonus", soHollow = false): DefInteracao =>
  ({ id, nome, com: [com], vale: [], texto: `${texto} Cria o botão “${rotulo}”.`, ...(soHollow ? { soHollow } : {}), compilar: () => [bt(rotulo, ritmo), ...(rotulo === nome ? [] : [tx(`${nome}: ${texto.charAt(0).toLowerCase()}${texto.slice(1)}`)])] });

/** interação geral: serve a qualquer técnica */
const G = (id: string, nome: string, texto: string, ef: Efeito): DefInteracao => ({ id, nome, com: [], vale: [], texto: `${texto} Serve a qualquer técnica.`, compilar: () => [ef] });

export const TECNICAS_LEVA4: DefTecnica[] = [
  /* Criaturas e invocações */
  { id: "montaria", grupo: "Criaturas e invocações", nome: "Montaria espiritual", armaReq: ["invocada", "natural", "aerea"],
    texto: "Ação bônus: chama uma montaria do tema da forma (PV 3 × proficiência). Montado, você tem +6 m de deslocamento e não provoca ataque de oportunidade de quem a montaria deixa para trás. Cria os botões “Chamar montaria” e “Montar ou desmontar”." + PRECISA("da montaria"),
    compilar: () => [{ k: "invoca", nome: "Montaria", tipo: "invocacao", max: 1, pv: "[PROF]*3", cr: "11+[PROF]", acerto: "[PROF]", dano: "1d6", custoPr: 4, texto: "Montaria do tema da forma. Leva você nas costas." }, { k: "gera", botao: { rotulo: "Chamar montaria", ritmo: "bonus", faz: "invocar" } }, bt("Montar ou desmontar")] },
  { id: "espirito-lamina", grupo: "Criaturas e invocações", nome: "Espírito da lâmina",
    texto: "Ação: o espírito da arma toma forma ao seu lado (PV 4 × proficiência) e luta com você. Um por vez. Cria o botão “Manifestar o espírito”." + PRECISA("do espírito"),
    compilar: () => [{ k: "invoca", nome: "Espírito da lâmina", tipo: "invocacao", max: 1, pv: "[PROF]*4", cr: "12+[PROF]", acerto: "[PROF]+[ESP]", dano: "2d8+[PROF]", custoPr: 6, texto: "O espírito da sua arma, em corpo. Um por vez." }, { k: "gera", botao: { rotulo: "Manifestar o espírito", ritmo: "acao", faz: "invocar" } }] },
  T("sombra-imitadora", "Criaturas e invocações", "Sombra imitadora", "Ação: a sombra de um inimigo a até 18 m levanta e luta por você por proficiência turnos (ele faz Espírito; se passar, nada). Ela tem metade dos PV atuais dele (até 5 × proficiência) e o ataque básico dele. Digite os PV atuais do alvo no campo de dano. Cria os botões “Levantar a sombra” e “Desfazer a sombra”.", "da sombra", [["Levantar a sombra", "acao"], ["Desfazer a sombra"]], ["ilusoria", "espacial"]),
  T("ninho", "Criaturas e invocações", "Ninho", "Ação bônus: você deixa um ninho a até 9 m. A cada Novo turno ele gera 1 cria (1 PV, ataque 1d4 + proficiência), até a proficiência. Cria os botões “Fazer o ninho” e “Soltar as crias”.", "do ninho", [["Fazer o ninho"], ["Soltar as crias", "acao"]], ["enxame", "venenosa", "natural"]),
  /* Campo e terreno */
  T("moldar-terreno", "Campo e terreno", "Moldar o terreno", "Ação bônus: um cubo de 6 m a até 18 m vira terreno difícil ou ergue um muro de 6 × 3 m. Até metade da proficiência de zonas ao mesmo tempo. Cria o botão “Moldar o terreno”.", "do terreno", [["Moldar o terreno"]], ["elemental", "pesada", "natural"]),
  T("clima", "Campo e terreno", "Clima da forma", "Ação: chuva, nevasca, tempestade de areia ou calor num raio de 18 m, por proficiência turnos, com um efeito à sua escolha. Cria o botão “Mudar o clima”.", "do clima", [["Mudar o clima", "acao"]], ["elemental", "aerea", "foco"]),
  T("arena", "Campo e terreno", "Arena de duelo", "Ação: um anel de 12 m fecha você e uma criatura a até 9 m. Ninguém entra; sair exige Força ou Espírito. Dura até um dos dois cair. Cria o botão “Fechar a arena”.", "da arena", [["Fechar a arena", "acao"]]),
  T("gravidade", "Campo e terreno", "Gravidade alterada", "Ação: esfera de 6 m a até 18 m, por proficiência turnos. Pesada: deslocamento à metade e voo cai. Leve: saltos triplos e quedas sem dano. Cria o botão “Alterar a gravidade”.", "da gravidade", [["Alterar a gravidade", "acao"]], ["pesada", "espacial", "foco"]),
  /* Vínculo e ressonância */
  T("ressonancia", "Vínculo e ressonância", "Ressonância", "Ação bônus: um aliado a até 9 m entra em ressonância até o fim da cena (até metade da proficiência de aliados). Perto um do outro, ele e você têm +1 de acerto. Cria o botão “Entrar em ressonância”.", "da ressonância", [["Entrar em ressonância"]]),
  T("golpe-combinado", "Vínculo e ressonância", "Golpe combinado", "Ação: um aliado a até 9 m gasta a reação; o seu próximo ataque causa +proficiência d6 de Energia e conta como dos dois. Cria o botão “Golpe combinado”.", "do golpe combinado", [["Golpe combinado", "acao"]]),
  { id: "irmaos-arma", grupo: "Vínculo e ressonância", nome: "Irmãos de arma",
    texto: "Ao liberar, escolha um aliado que também esteja com forma liberada. Enquanto os dois estiverem liberados, você causa + metade da proficiência de dano nos golpes." + PRECISA("dos irmãos de arma"),
    compilar: () => [{ k: "dano", em: ["golpe"], v: "[PROF]/2" }, tx("Irmãos de arma: o bônus de dano só vale enquanto o aliado escolhido também estiver com a forma liberada.")] },
  T("ordem-batalha", "Vínculo e ressonância", "Ordem de batalha", "Ação bônus: um aliado a até 18 m que ouça você usa a reação para andar até metade do deslocamento ou fazer um ataque. Cria o botão “Dar ordem”.", "da ordem", [["Dar ordem"]]),
  /* Marcas e maldições */
  T("ferida-aberta", "Marcas e maldições", "Ferida que não fecha", "Ação bônus ao acertar um golpe cortante ou perfurante: o alvo ganha 1 corte (até a proficiência). Cada vez que ele anda mais de 3 m no turno, sofre 1d4 por corte. Cria os botões “Abrir corte” e “Ele se moveu”.", "da ferida", [["Abrir corte"], ["Ele se moveu", "reacao"]], ["agil", "multiplas-laminas", "dupla"]),
  T("ima", "Marcas e maldições", "Ímã", "Ação bônus: marca uma criatura ou objeto a até 18 m. Os seus projéteis contra ela ignoram meia cobertura e voltam à mão; você pode puxá-la 3 m. Cria os botões “Imantar” e “Puxar o imantado”.", "do ímã", [["Imantar"], ["Puxar o imantado"]], ["arremesso", "projetil", "corrente", "segmentavel"]),
  /* Cargas, reservas e preço */
  T("ultimo-recurso", "Cargas, reservas e preço", "Último recurso", "Ação, só abaixo de 1/4 dos PV, 1 vez por cena: o próximo golpe causa o máximo em todos os dados. Depois dele a forma termina. Cria o botão “Último recurso”.", "do último recurso", [["Último recurso", "acao"]]),
  /* Controle e defesa */
  T("espelho-condicao", "Controle e defesa", "Espelho de condição", "Reação, quando você sofre uma condição: faça Espírito contra a CD de quem causou; se passar, a condição volta para ele. Cria o botão “Espelhar condição”.", "do espelho", [["Espelhar condição", "reacao"]], ["escudo", "ilusoria", "espacial"]),
  T("supressao", "Controle e defesa", "Supressão de reiatsu", "Ação: esfera de 6 m a até 18 m. Cada criatura faz Espírito; se falhar, as técnicas dela custam +proficiência de PR até o fim do próximo turno dela. Cria o botão “Suprimir”.", "da supressão", [["Suprimir", "acao"]], ["foco", "pesada"]),
  T("prisao-cubica", "Controle e defesa", "Prisão cúbica", "Ação: um cubo de 3 m a até 18 m. A criatura dentro faz Destreza; se falhar, fica isolada: nada entra, sai nem atravessa. Cria o botão “Prender no cubo”.", "da prisão", [["Prender no cubo", "acao"]], ["espacial", "foco", "escudo"]),
  T("onda-repulsao", "Controle e defesa", "Onda de repulsão", "Ação bônus: cada criatura a até 3 m faz Força ou é empurrada 4,5 m e cai Caída. Cria o botão “Onda de repulsão”.", "da repulsão", [["Onda de repulsão"]], ["pesada", "escudo", "elemental"]),
  /* Corpo e arma mutável */
  T("arma-formas", "Corpo e arma mutável", "Arma de muitas formas", "Ação bônus: a arma roda entre três formas. Lâmina: +1 no acerto. Lança: +3 m de alcance. Arco: ataque à distância, 18 m. Cria o botão “Mudar a forma da arma”.", "da arma mutável", [["Mudar a forma da arma"]], ["segmentavel", "multiplas-laminas", "dupla"]),
  T("bracos-extras", "Corpo e arma mutável", "Braços extras", "Você ganha braços a mais. Uma vez por turno, ao usar a ação de ataque, faz um golpe extra de 1d6 + Força (sem os dados da forma). Cria o botão “Golpe do braço extra”.", "dos braços", [["Golpe do braço extra", "reacao"]], ["natural", "dupla", "multiplas-laminas"]),
  T("lamina-estica", "Corpo e arma mutável", "Lâmina que estica", "Reação: quando uma criatura a até 12 m se afasta de você, a lâmina se estica e faz um ataque de oportunidade contra ela. Cria o botão “Esticar a lâmina”.", "da lâmina que estica", [["Esticar a lâmina", "reacao"]], ["longo-alcance", "segmentavel", "corrente"]),
  /* Espaço e movimento */
  T("portais", "Espaço e movimento", "Portais gêmeos", "Ação: abre dois portais a até 18 m um do outro, por proficiência turnos. Criaturas e ataques passam de um para o outro. Cria o botão “Abrir portais”.", "dos portais", [["Abrir portais", "acao"]], ["espacial"]),
  T("passo-sombras", "Espaço e movimento", "Passo nas sombras", "Ação bônus: de uma área de luz fraca ou escuridão, você teleporta até 18 m para outra sombra que veja. Cria o botão “Passo nas sombras”.", "das sombras", [["Passo nas sombras"]], ["ilusoria", "espacial", "agil"]),
  { id: "voo-forma", grupo: "Espaço e movimento", nome: "Voo da forma", armaReq: ["aerea", "natural"],
    texto: "Você ganha 9 m de deslocamento de voo enquanto a forma durar." + PRECISA("do voo"),
    compilar: () => [{ k: "desloc", modo: "voo", v: 9 }, tx("Voo da forma: 9 m de deslocamento de voo enquanto a forma durar.")] },
  T("distancia-distorcida", "Espaço e movimento", "Distância distorcida", "Ação: por proficiência turnos, num raio de 9 m em volta de você, cada 1,5 m conta como 3 m para inimigos, e ataques à distância deles de mais de 9 m têm desvantagem. Cria o botão “Distorcer distância”.", "da distorção", [["Distorcer distância", "acao"]], ["espacial", "ilusoria"]),
  T("arremesso", "Espaço e movimento", "Arremesso", "Ação, com uma criatura agarrada: lança-a até 3 × proficiência metros. Ela sofre 1d6 a cada 3 m e cai Caída. Cria o botão “Arremessar”.", "do arremesso", [["Arremessar", "acao"]], ["natural", "pesada", "corrente"]),
  /* Tempo e ritmo */
  T("tempo-lento", "Tempo e ritmo", "Tempo lento", "Ação: esfera de 6 m a até 18 m. Cada inimigo faz Espírito; se falhar, fica Lento por 3 turnos (metade do deslocamento, −2 de CR, sem reação). Cria o botão “Desacelerar”.", "do tempo lento", [["Desacelerar", "acao"]], ["foco", "espacial"]),
  T("previsao", "Tempo e ritmo", "Ver o próximo segundo", "Reação, metade da proficiência de vezes por cena: um ataque declarado contra você tem desvantagem. Cria o botão “Prever”.", "da previsão", [["Prever", "reacao"]]),
  T("desgaste", "Tempo e ritmo", "Desgaste do tempo", "Ao acertar, 1 vez por turno: o alvo faz Constituição; se falhar, −1 de Força ou Destreza até o fim da cena, acumulando até metade da proficiência. Cria o botão “Desgastar”.", "do desgaste", [["Desgastar", "reacao"]], ["contato", "venenosa", "foco"]),
  T("instante", "Tempo e ritmo", "Instante esticado", "Ação bônus, 1 vez por cena: você ganha uma ação extra neste turno (só ataque ou técnica). No seu próximo turno, fica sem ação bônus e sem reação. Cria o botão “Esticar o instante”.", "do instante", [["Esticar o instante"]]),
  /* Ilusão e engano */
  T("trocar-rosto", "Ilusão e engano", "Trocar de rosto", "Ação bônus: você parece outra criatura que já viu até o fim da cena. Quem examina faz Intuição contra a sua CD. Cria o botão “Trocar de rosto”.", "do rosto", [["Trocar de rosto"]], ["ilusoria"]),
  T("reiatsu-falsa", "Ilusão e engano", "Reiatsu falsa", "Ação bônus: projeta uma assinatura de reiatsu sua num ponto a até 36 m. Quem sente reiatsu acha que você está lá. Cria o botão “Reiatsu falsa”.", "da reiatsu falsa", [["Reiatsu falsa"]], ["ilusoria", "foco"]),
  { id: "hipnose", grupo: "Ilusão e engano", nome: "Hipnose por gatilho", armaReq: ["ilusoria"],
    texto: "Ao liberar, cada criatura que veja a liberação faz Mente. Quem falha fica sob hipnose até o fim da cena: desvantagem em todas as salvaguardas contra as suas ilusões." + PRECISA("da hipnose"),
    compilar: () => [{ k: "gatilho", quando: "liberar", limite: "cena", rotulo: "Hipnose por gatilho", faz: { condicao: { nome: "Hipnose (desvantagem contra as suas ilusões)", salva: "men", duracao: "até o fim da cena" } } }] },
  T("cenario-falso", "Ilusão e engano", "Cenário falso", "Ação: um cubo de 9 m a até 18 m parece outra coisa (abismo, parede, chão firme) até o fim da cena. Quem falha em Mente age como se fosse real. Cria o botão “Cenário falso”.", "do cenário", [["Cenário falso", "acao"]], ["ilusoria", "foco"]),
  T("embaralhar", "Ilusão e engano", "Embaralhar", "Ação: até a proficiência de criaturas a até 9 m fazem Mente. Quem falha, no próximo ataque, rola 1d4: com 1–2 ataca uma criatura aleatória. Cria o botão “Embaralhar”.", "da confusão", [["Embaralhar", "acao"]], ["ilusoria"]),
  /* Sentidos e regras do duelo */
  { id: "sentido-reiatsu", grupo: "Sentidos e regras do duelo", nome: "Sentido de reiatsu",
    texto: "Você sente criaturas a até 36 m, mesmo invisíveis ou escondidas, não pode ser surpreendido e tem vantagem em Percepção." + PRECISA("do sentido"),
    compilar: () => [{ k: "vant", em: "Percepção" }, tx("Sentido de reiatsu: você sente criaturas a até 36 m, mesmo invisíveis ou escondidas, e não pode ser surpreendido.")] },
  T("regras-duelo", "Sentidos e regras do duelo", "Regras do duelo", "Ação: você propõe uma regra a um inimigo (só armas, sem Kidō, sem fuga, um contra um). Se ele aceitar ou falhar em Espírito, quem quebrar sofre proficiência d8 de Energia. Cria os botões “Propor regra” e “Regra quebrada”.", "das regras", [["Propor regra", "acao"], ["Regra quebrada", "reacao"]]),
  T("memoria-combate", "Sentidos e regras do duelo", "Memória de combate", "Quando um inimigo usa a mesma técnica contra você pela segunda vez na cena, você ganha +2 de CR e nas salvaguardas contra ela. Cria o botão “Já vi isso”.", "da memória", [["Já vi isso", "reacao"]]),
  T("faro-sangue", "Sentidos e regras do duelo", "Faro de sangue", "Você sente criaturas abaixo da metade dos PV a até 36 m e causa +1d4 nos golpes contra a que estiver farejando. Cria o botão “Farejar ferido”.", "do faro", [["Farejar ferido", "reacao"]], ["natural", "venenosa"]),
  T("saber-nome", "Sentidos e regras do duelo", "Saber o nome", "Se você descobrir o nome da arma de um inimigo (Intuição ou Investigação, CD 15, ou ele o disser), tem vantagem nas salvaguardas contra as técnicas dele até o fim da cena. Cria o botão “Descobri o nome”.", "do nome", [["Descobri o nome", "reacao"]]),
  /* Elementos */
  T("incendio", "Elementos", "Incêndio", "Quando você causa dano de Fogo, 1 vez por turno, um quadrado de 3 m perto do alvo pega fogo (até a proficiência de focos). Quem entra ou começa o turno ali sofre 1d6 + proficiência. Cria os botões “Atear fogo” e “Entraram no fogo”.", "do incêndio", [["Atear fogo", "reacao"], ["Entraram no fogo", "reacao"]], ["elemental"]),
  T("correnteza", "Elementos", "Correnteza", "Ação: uma linha de 18 × 3 m de água. Quem está nela faz Força ou é empurrado 6 m e cai Caído; todos ficam molhados. Cria o botão “Correnteza”.", "da correnteza", [["Correnteza", "acao"]], ["elemental"]),
  T("pilares", "Elementos", "Pilares", "Ação bônus: ergue um pilar de 1,5 × 6 m a até 18 m (até 2): cobertura total, dá para subir. Cria o botão “Erguer pilar”.", "dos pilares", [["Erguer pilar"]], ["elemental", "pesada"]),
  T("elemento-mutavel", "Elementos", "Elemento mutável", "Ação bônus: troca o tipo de dano da forma entre três elementos escolhidos ao montar a forma. Cria o botão “Trocar de elemento”.", "do elemento", [["Trocar de elemento"]], ["elemental", "foco"]),
  /* Vida, morte e veneno */
  T("recusar-morte", "Vida, morte e veneno", "Recusar a morte", "Uma vez por cena, quando você cairia a 0 PV: fica com 1 PV e PV temporários iguais a 2 × proficiência. Cria o botão “Recusar a morte”.", "da recusa", [["Recusar a morte", "reacao"]]),
  T("adaptacao", "Vida, morte e veneno", "Adaptação", "Quando você sofre o mesmo tipo de dano duas vezes na cena, ganha resistência a ele até o fim da cena (até 2 tipos). Cria o botão “Adaptar”.", "da adaptação", [["Adaptar", "reacao"]], ["natural", "venenosa"]),
  T("semente-vida", "Vida, morte e veneno", "Semente de vida", "Ação bônus: planta uma semente num aliado a até 9 m. No início de cada turno dele, por proficiência turnos, ele recupera 1d6. Cria o botão “Plantar semente”.", "da semente", [["Plantar semente"]], ["natural", "invocada", "elemental"]),
  /* Hollow e Vazio */
  T("garganta", "Hollow e Vazio", "Garganta", "Para Hollow e Visored. Ação: abre uma Garganta; você e até a proficiência de aliados a 3 m saem da cena no fim do seu turno, ou você reaparece a até 36 m. Cria o botão “Abrir Garganta”.", "da Garganta", [["Abrir Garganta", "acao"]], undefined, [], true),
];

export const INTERACOES_LEVA4: DefInteracao[] = [
  I("carga-montada", "Carga montada", "montaria", "Montado, depois de andar 6 m, o seu golpe causa +1d8."),
  I("montaria-alada", "Montaria alada", "montaria", "A montaria voa: o deslocamento montado vale como voo."),
  I("dois-corpos", "Dois corpos, um golpe", "espirito-lamina", "Quando você e o espírito atacam o mesmo alvo no turno, o segundo ataque tem vantagem."),
  B("trocar-espirito", "Trocar de lugar com o espírito", "espirito-lamina", "Ação bônus: você e o espírito trocam de lugar, sem provocar ataque de oportunidade.", "Trocar de lugar com o espírito"),
  I("sombra-dono", "A sombra conhece o dono", "sombra-imitadora", "O original tem desvantagem no primeiro ataque contra a própria sombra."),
  I("sombra-rouba", "Sombra que rouba", "sombra-imitadora", "Enquanto a sombra estiver de pé, o original tem −1 de CR."),
  I("sombra-volta", "Sombra que volta", "sombra-imitadora", "Ao desfazer a sombra, ela entra no corpo do original: proficiência d6 de dano psíquico."),
  I("crias-venenosas", "Crias venenosas", "ninho", "Quem for ferido pelas crias fica Envenenado até o fim do próximo turno."),
  I("ninho-blindado", "Ninho blindado", "ninho", "O ninho tem PV 5 × proficiência e CR 14."),
  I("muro-espinhos", "Muro de espinhos", "moldar-terreno", "Quem toca o muro moldado sofre 1d6."),
  B("desfazer-zona", "Desfazer zona", "moldar-terreno", "Ação bônus: desfaz uma zona para poder moldar outra.", "Desfazer zona"),
  I("olho-tempestade", "Olho da tempestade", "clima", "Você e aliados a até 3 m ignoram os efeitos do clima."),
  B("raio-clima", "Raio do clima", "clima", "Ação: o clima descarrega numa criatura a até 18 m, proficiência d6 do seu elemento.", "Raio do clima", "acao"),
  I("so-nos-dois", "Só nós dois", "arena", "Dentro da arena, +1 no acerto contra o adversário."),
  I("plateia", "Plateia", "arena", "Quem está de fora não pode atacar para dentro da arena."),
  B("esmagar", "Esmagar", "gravidade", "Ação bônus: a gravidade dobra de repente; quem está na esfera faz Força ou sofre proficiência d6 e fica Caído.", "Esmagar"),
  I("chao-some", "Chão que some", "gravidade", "Na gravidade leve, quem falhar em Destreza flutua 3 m e fica sem apoio."),
  I("eco", "Eco", "ressonancia", "Quando você acerta um crítico, os aliados em ressonância ganham vantagem no próximo ataque."),
  I("ressonancia-cura", "Ressonância que cura", "ressonancia", "Quando um de vocês é curado, o outro recupera metade."),
  I("elementos-cruzados", "Elementos cruzados", "golpe-combinado", "Se o aliado tiver outro tipo de dano, o alvo perde a resistência aos dois até o fim do turno."),
  I("combinacao-tripla", "Combinação tripla", "golpe-combinado", "Um segundo aliado pode gastar a reação para somar +1d6."),
  I("liberacao-sincronizada", "Liberação sincronizada", "irmaos-arma", "Se os dois liberarem no mesmo turno, você ganha PV temporários iguais à proficiência.", [{ k: "gatilho", quando: "liberar", rotulo: "Liberação sincronizada", faz: { pvTemp: "[PROF]", texto: "só se o irmão de arma liberar no mesmo turno" } }]),
  B("vingar-irmao", "Vingar o irmão", "irmaos-arma", "Uma vez por cena, quando o irmão de arma cai: +1d6 nos seus golpes até o fim da cena.", "Vingar o irmão", "reacao"),
  I("ordem-recuo", "Ordem de recuo", "ordem-batalha", "O movimento ordenado não provoca ataque de oportunidade e o aliado ganha +2 de CR até o próximo turno dele."),
  I("ordem-ataque", "Ordem de ataque", "ordem-batalha", "O ataque ordenado causa +proficiência de dano."),
  I("corte-fundo", "Corte fundo", "ferida-aberta", "Cada corte causa 1d6 em vez de 1d4."),
  I("cheiro-sangue", "Cheiro de sangue", "ferida-aberta", "Você sempre sabe onde está a criatura cortada, mesmo invisível."),
  I("polos-opostos", "Polos opostos", "ima", "Em vez de puxar, você pode empurrar o alvo imantado 3 m."),
  B("chuva-metal", "Chuva de metal", "ima", "Ação: todo o metal solto a até 9 m voa no alvo imantado, proficiência d6.", "Chuva de metal", "acao"),
  I("ainda-de-pe", "Ainda de pé", "ultimo-recurso", "Depois do último recurso, a forma não termina na hora: dura só mais 1 turno."),
  I("arrastar-junto", "Arrastar junto", "ultimo-recurso", "Se o golpe derrubar o alvo, a forma não termina."),
  B("espelho-guarda", "Espelho que guarda", "espelho-condicao", "Em vez de devolver, você guarda a condição e a aplica no seu próximo golpe que acertar.", "Guardar a condição", "reacao"),
  I("espelho-largo", "Espelho largo", "espelho-condicao", "A condição devolvida pega também outra criatura a até 3 m de quem a causou."),
  I("silencio-total", "Silêncio total", "supressao", "Quem falhar na supressão também não usa reações."),
  I("peso-presenca", "Peso da presença", "supressao", "Quem falhar por 5 ou mais fica Caído."),
  B("cubo-encolhe", "Cubo que encolhe", "prisao-cubica", "Ação bônus: o cubo aperta e quem está dentro sofre proficiência d6, sem salvaguarda.", "Encolher o cubo"),
  I("prisao-dupla", "Prisão dupla", "prisao-cubica", "O cubo pode ter 6 m e prender duas criaturas."),
  I("contra-parede", "Contra a parede", "onda-repulsao", "Quem for empurrado contra um obstáculo sofre 2d6."),
  I("repulsao-protege", "Repulsão que protege", "onda-repulsao", "Projéteis no ar a até 3 m de você caem."),
  I("troca-no-golpe", "Troca no golpe", "arma-formas", "Uma vez por turno, mudar a forma da arma não gasta a ação bônus."),
  I("quarta-forma", "Quarta forma", "arma-formas", "A arma ganha uma quarta forma, Escudo: +1 de CR, e os golpes causam −1d4."),
  I("agarrar-braco", "Agarrar com o braço extra", "bracos-extras", "O golpe do braço extra pode agarrar em vez de ferir."),
  I("quatro-guardas", "Quatro guardas", "bracos-extras", "Os braços a mais aparam: +1 de CR.", [{ k: "cr", v: 1 }]),
  I("retrair-puxando", "Retrair puxando", "lamina-estica", "Se a lâmina esticada acertar, o alvo faz Força ou é puxado 6 m de volta."),
  I("estocada-sem-aviso", "Estocada sem aviso", "lamina-estica", "O ataque da lâmina esticada causa +1d6."),
  I("ataque-portal", "Ataque pelo portal", "portais", "Uma vez por turno, um ataque através do portal tem vantagem."),
  B("fechar-meio", "Fechar no meio", "portais", "Reação: fecha os portais sobre quem atravessava, proficiência d6.", "Fechar no meio", "reacao"),
  I("esconder-chegada", "Esconder na chegada", "passo-sombras", "Depois do passo, Furtividade com vantagem e o próximo ataque sai de surpresa."),
  I("levar-sombra", "Levar a sombra", "passo-sombras", "Um aliado que você toque vai junto no passo."),
  B("mergulho", "Mergulho", "voo-forma", "Ação: desce pelo menos 9 m e golpeia: +2d8 e Força ou Caído.", "Mergulho", "acao"),
  I("pairar", "Pairar", "voo-forma", "Você pode parar no ar sem cair e não provoca ataque de oportunidade ao subir."),
  I("ponto-cego", "Ponto cego", "distancia-distorcida", "Você escolhe um inimigo que não vê você enquanto a distorção durar (Mente para resistir)."),
  I("passo-curto", "Passo curto", "distancia-distorcida", "Para você e aliados, dentro da área, cada 3 m conta como 1,5 m."),
  I("contra-outro", "Contra outro", "arremesso", "Se a criatura arremessada passar por outra, ela faz Destreza ou sofre o mesmo dano e cai."),
  I("arremesso-alto", "Arremesso alto", "arremesso", "Lançada para cima, a criatura também sofre o dano da queda."),
  I("camara-lenta", "Câmara lenta", "tempo-lento", "A lentidão dura até o fim da cena, em vez de 3 turnos."),
  I("tempo-roubado", "Tempo roubado", "tempo-lento", "Para cada inimigo Lento, você ganha +1,5 m de deslocamento no turno."),
  I("ver-cortar", "Ver e cortar", "previsao", "Se o ataque previsto errar, o seu próximo golpe tem vantagem."),
  I("aviso", "Aviso", "previsao", "A previsão pode valer para um aliado a até 9 m."),
  I("ferrugem", "Ferrugem", "desgaste", "A arma ou armadura do alvo desgastado também perde 1 de bônus."),
  I("desgaste-fundo", "Desgaste fundo", "desgaste", "O desgaste só sai com um descanso longo."),
  I("dois-instantes", "Dois instantes", "instante", "O instante esticado pode ser usado 2 vezes por cena."),
  I("instante-partilhado", "Instante partilhado", "instante", "A ação extra pode ir para um aliado a até 9 m."),
  I("troca-aparencias", "Troca de aparências", "trocar-rosto", "Você e um aliado podem trocar de aparência um com o outro."),
  I("voz-roubada", "Voz roubada", "trocar-rosto", "A voz e a reiatsu também enganam: desvantagem para quem examina."),
  B("pressao-capitao", "Pressão de capitão", "reiatsu-falsa", "Ação: a reiatsu falsa parece enorme; quem está a até 9 m dela faz Espírito ou fica Amedrontado.", "Pressão de capitão", "acao"),
  I("sumir-radar", "Sumir do radar", "reiatsu-falsa", "A sua reiatsu verdadeira some para quem sente."),
  B("gatilho-renovado", "Gatilho renovado", "hipnose", "Ação, 1 vez por cena: repete o gesto da liberação e quem vê faz Mente de novo.", "Gatilho renovado", "acao"),
  I("hipnose-profunda", "Hipnose profunda", "hipnose", "A CD da forma sobe 1.", [{ k: "cd", v: 1 }]),
  I("abismo", "Abismo", "cenario-falso", "Quem acredita num abismo não entra na área por vontade própria."),
  B("cenario-fere", "Cenário que fere", "cenario-falso", "Reação: quem acredita no cenário e o toca sofre proficiência d6 de dano psíquico.", "Cenário que fere", "reacao"),
  I("voce-amigo", "Você é amigo", "embaralhar", "Quem falhou não escolhe você como alvo no próximo turno."),
  I("confusao-dura", "Confusão que dura", "embaralhar", "A confusão vale por 3 turnos."),
  I("rastro", "Rastro", "sentido-reiatsu", "Você segue uma criatura que fugiu até o fim da cena."),
  B("medir-forca", "Medir a força", "sentido-reiatsu", "Ação bônus: você sente se uma criatura a até 36 m é mais fraca, igual ou mais forte que você.", "Medir a força"),
  I("regra-dupla", "Regra dupla", "regras-duelo", "Você propõe duas regras de uma vez."),
  I("juiz-imparcial", "Juiz imparcial", "regras-duelo", "A regra vale também para você, e o dano de quem quebrar sobe 1 dado."),
  I("na-terceira-nao", "Na terceira, não", "memoria-combate", "Na terceira vez, como reação, o dano dessa técnica em você cai à metade."),
  I("ensinar", "Ensinar", "memoria-combate", "Aliados que ouvirem você ganham +1 de CR e nas salvaguardas contra a técnica memorizada."),
  I("cacada", "Caçada", "faro-sangue", "+3 m de deslocamento ao andar na direção do ferido farejado."),
  I("golpe-no-ferido", "Golpe no ferido", "faro-sangue", "Um crítico no ferido farejado faz ele sangrar: 1d6 no início de cada turno dele até ser tratado."),
  B("chamar-lamina", "Chamar a lâmina dele", "saber-nome", "Ação, 1 vez por cena: chama a arma dele pelo nome; ele faz Espírito ou perde a ação bônus do próximo turno.", "Chamar a lâmina dele", "acao"),
  I("nome-guardado", "Nome guardado", "saber-nome", "O nome descoberto continua valendo em outras cenas."),
  I("fogo-anda", "Fogo que anda", "incendio", "No Novo turno, cada foco pode andar 3 m."),
  B("apagar-fogo", "Apagar o fogo", "incendio", "Ação bônus: apaga todos os focos e você ganha 2 PV temporários por foco.", "Apagar o fogo"),
  I("afogar", "Afogar", "correnteza", "Uma criatura agarrada por você na água não fala e sofre 1d6 por turno."),
  I("mare-volta", "Maré que volta", "correnteza", "No Novo turno a água volta e puxa 3 m quem falhou."),
  I("pilar-lanca", "Pilar que lança", "pilares", "Se o pilar nascer debaixo de um inimigo, ele faz Destreza ou sobe 6 m e cai (2d6)."),
  B("derrubar-pilar", "Derrubar o pilar", "pilares", "Ação: um pilar tomba numa linha de 6 m, 3d6 e Caído.", "Derrubar o pilar", "acao"),
  I("dois-elementos", "Dois elementos", "elemento-mutavel", "Um ataque por turno causa metade de cada um de dois tipos."),
  I("elemento-certo", "Elemento certo", "elemento-mutavel", "Contra um alvo vulnerável ao elemento atual, +1d6."),
  I("furia-quase-morto", "Fúria do quase morto", "recusar-morte", "Depois de recusar a morte, por 2 turnos, +1d8 e vantagem nos golpes."),
  I("ultimo-aviso", "Último aviso", "recusar-morte", "Quem derrubou você faz Espírito ou fica Amedrontado."),
  I("adaptacao-rapida", "Adaptação rápida", "adaptacao", "Basta sofrer o tipo de dano uma vez para se adaptar."),
  I("casca-nova", "Casca nova", "adaptacao", "Cada adaptação dá PV temporários iguais à proficiência."),
  I("flor-emergencia", "Flor de emergência", "semente-vida", "Se o aliado cair a 0 PV, a semente floresce e ele fica com 1 PV; a semente acaba."),
  I("jardim", "Jardim", "semente-vida", "A semente vale para dois aliados."),
  B("garganta-curta", "Garganta curta", "garganta", "Ação bônus: só o teleporte de 36 m.", "Garganta curta", "bonus", true),
  I("emboscada", "Emboscada", "garganta", "Ao reaparecer pela Garganta, o primeiro golpe tem vantagem.", [], true),
  /* Gerais: servem a qualquer técnica */
  G("eco-liberacao", "Eco da liberação", "Ao liberar a forma, você ganha PV temporários iguais a 2 × proficiência.", { k: "gatilho", quando: "liberar", limite: "cena", rotulo: "Eco da liberação", faz: { pvTemp: "[PROF]*2" } }),
  G("folego-abate", "Fôlego no abate", "Ao derrubar um inimigo, você recupera PV iguais à proficiência.", { k: "gatilho", quando: "abate", rotulo: "Fôlego no abate", faz: { curaPv: "[PROF]" } }),
  G("impulso-critico", "Impulso no crítico", "Ao acertar um crítico, você ganha PV temporários iguais à proficiência.", { k: "gatilho", quando: "critico", limite: "turno", rotulo: "Impulso no crítico", faz: { pvTemp: "[PROF]" } }),
  G("guarda-ao-errar", "Guarda ao errar", "Uma vez por turno, ao errar um ataque, você ganha PV temporários iguais à metade da proficiência.", { k: "gatilho", quando: "errou", limite: "turno", rotulo: "Guarda ao errar", faz: { pvTemp: "[PROF]/2" } }),
  G("revide", "Revide", "Uma vez por rodada, quando uma criatura o acerta corpo a corpo, ela sofre 1d6 de Energia.", { k: "gatilho", quando: "atingido", limite: "rodada", rotulo: "Revide", faz: { dano: { expr: "1d6", tipo: "Energia", area: "no atacante corpo a corpo" } } }),
  G("abertura-pressao", "Abertura com pressão", "Ao liberar, quem estiver a até 6 m faz salvaguarda de Espírito ou fica Amedrontado até o fim do próximo turno.", { k: "gatilho", quando: "liberar", limite: "cena", rotulo: "Abertura com pressão", faz: { condicao: { nome: "Amedrontado", salva: "esp", duracao: "até o fim do próximo turno" } } }),
  G("ferida-alimenta", "Ferida que alimenta", "Uma vez por rodada, ao ser atingido, você recupera 1 PR.", { k: "gatilho", quando: "atingido", limite: "rodada", rotulo: "Ferida que alimenta", faz: { pr: 1 } }),
  G("golpe-corrigido", "Golpe corrigido", "Uma vez por turno, ao errar um ataque, o próximo ataque no mesmo alvo tem +2 no acerto.", { k: "gatilho", quando: "errou", limite: "turno", rotulo: "Golpe corrigido", faz: { texto: "o próximo ataque no mesmo alvo tem +2 no acerto" } }),
];
