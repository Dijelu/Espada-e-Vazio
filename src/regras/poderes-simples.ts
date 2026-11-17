/* Motor genérico para técnicas que seguem um molde simples (leva 4 em diante): em vez de um `case` por botão em poderes.ts,
   cada botão é uma linha de dados aqui. Moldes:
   - dito:  só anuncia (com CD e rolagem opcionais);
   - conta: soma 1 num contador até o teto;
   - tempo: liga por N turnos (o Novo turno conta e desliga);
   - liga:  liga/desliga;
   - cena:  N vezes por cena;
   - gasta: gasta 1 (ou tudo) de um contador;
   - ciclo: roda entre 1..N.
   Estado em `estado.usos` com a chave "pw:<ch>", como o resto dos poderes. */
import type { Calculo, Ficha } from "./ficha";

export type Tem = (nome: string) => boolean;
export interface CtxS { P: number; cd: number; cdFor: number; tem: Tem; c: Calculo; f: Ficha; n: number; t: number; dano: number }
export interface ResS { erro?: string; dito?: string; usos?: Record<string, number | undefined>; curaPv?: number; pvTemp?: number; perdePv?: number }

export interface Simples {
  rot: string;
  k: "dito" | "conta" | "tempo" | "liga" | "cena" | "gasta" | "ciclo";
  /** chave do estado (sem "pw:") e o nome dela no painel "Ligado agora" */
  ch?: string; nome?: string;
  cap?: (P: number, tem: Tem) => number;
  /** precisa desta chave acima de zero */
  exige?: string; exigeMsg?: string;
  /** expressão de dados a rolar; o total chega em `t` */
  dado?: (a: CtxS) => string;
  /** bônus temporários (chaves "t-cr:x", "t-desloc:x"...) enquanto a chave está ligada */
  efeito?: Record<string, number>;
  /** ao apertar, deixa esta chave em 1 (para o bônus do próximo golpe) */
  marca?: string | ((a: CtxS) => string | undefined);
  /** gasta: zera em vez de tirar 1 */
  tudo?: boolean;
  /** recusa o botão com esta mensagem */
  pre?: (a: CtxS) => string | undefined;
  /** efeitos nos PV */
  extra?: (a: CtxS) => Partial<ResS>;
  diz: (a: CtxS) => string;
  /** liga: o que dizer ao desligar */
  dizOff?: string;
  /** tempo: aviso a cada Novo turno enquanto dura (pode rolar `dado`) */
  tick?: (a: CtxS) => string;
  medidor?: "pips" | "barra";
}

const PW = (k: string) => "pw:" + k;
const m2 = (n: number) => Math.max(1, Math.floor(n / 2));
const s = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);

export const SIMPLES: Record<string, Simples> = {
  /* Criaturas e invocações */
  "s-montar": { rot: "Montar ou desmontar", k: "liga", ch: "s-montado", nome: "Montado", efeito: { "t-desloc:montaria": 6 }, diz: (a) => `Você monta: +6 m de deslocamento e não provoca ataque de oportunidade de quem a montaria deixa para trás.${a.tem("Montaria alada") ? " Montaria alada: o deslocamento vale como voo." : ""}`, dizOff: "Você desmonta." },
  "s-trocar-espirito": { rot: "Trocar de lugar com o espírito", k: "dito", diz: () => "Você e o espírito da lâmina trocam de lugar, sem provocar ataque de oportunidade." },
  "s-ninho": { rot: "Fazer o ninho", k: "liga", ch: "s-ninho", nome: "Ninho", diz: (a) => `Ninho posto a até 9 m (PV ${a.P * (a.tem("Ninho blindado") ? 5 : 3)}, CR ${a.tem("Ninho blindado") ? 14 : 10}): a cada Novo turno nasce 1 cria, até ${a.P}.`, dizOff: "O ninho se desfaz." },
  "s-crias": { rot: "Soltar as crias", k: "gasta", ch: "s-crias", tudo: true, exigeMsg: "não há crias", dado: (a) => `${a.n}d4+${a.n * a.P}`, diz: (a) => `${a.n} ${s(a.n, "cria ataca", "crias atacam")} (acerto +${a.P} cada; some 1d4 + ${a.P} por cria que acertar): até ${a.t} de dano no total.${a.tem("Crias venenosas") ? " Crias venenosas: quem for ferido fica Envenenado até o fim do próximo turno." : ""}` },
  /* Campo e terreno */
  "s-zona": { rot: "Moldar o terreno", k: "conta", ch: "s-zonas", nome: "Zonas moldadas", cap: (P) => m2(P), medidor: "pips", diz: (a) => `Zona ${a.n}: um cubo de 6 m a até 18 m vira terreno difícil ou ergue um muro de 6 × 3 m (PV ${a.P * 3}, cobertura total).${a.tem("Muro de espinhos") ? " Muro de espinhos: quem toca o muro sofre 1d6." : ""}` },
  "s-zona-fim": { rot: "Desfazer zona", k: "gasta", ch: "s-zonas", exigeMsg: "não há zona moldada", diz: (a) => `Uma zona se desfaz. Restam ${a.n - 1}.` },
  "s-clima": { rot: "Mudar o clima", k: "tempo", ch: "s-clima", nome: "Clima (turnos)", cap: (P) => P, medidor: "barra", diz: (a) => `O clima muda num raio de 18 m por ${a.P} turnos. Escolha: visão obscurecida para inimigos, terreno escorregadio (Destreza, CD ${a.cd}, ao correr) ou resistência ao seu elemento para aliados.${a.tem("Olho da tempestade") ? " Olho da tempestade: você e aliados a até 3 m ignoram o clima." : ""}` },
  "s-raio-clima": { rot: "Raio do clima", k: "dito", exige: "s-clima", exigeMsg: "mude o clima primeiro", dado: (a) => `${a.P}d6`, diz: (a) => `O clima descarrega numa criatura a até 18 m: salvaguarda de Destreza (CD ${a.cd}), ${a.t} de dano do seu elemento, metade no sucesso.` },
  "s-arena": { rot: "Fechar a arena", k: "liga", ch: "s-arena", nome: "Arena de duelo", diz: (a) => `Um anel de 12 m fecha você e uma criatura a até 9 m. Ninguém entra; sair exige Força ou Espírito (CD ${a.cd}). Dura até um dos dois cair.${a.tem("Plateia") ? " Plateia: quem está de fora não pode atacar para dentro." : ""}`, dizOff: "A arena se abre." },
  "s-gravidade": { rot: "Alterar a gravidade", k: "tempo", ch: "s-gravidade", nome: "Gravidade (turnos)", cap: (P) => P, medidor: "barra", diz: (a) => `Esfera de 6 m a até 18 m por ${a.P} turnos. Pesada: deslocamento à metade e voo cai. Leve: saltos triplos e quedas sem dano.${a.tem("Chão que some") ? " Chão que some: na gravidade leve, quem falhar em Destreza (CD " + a.cd + ") flutua 3 m e fica sem apoio." : ""}` },
  "s-esmagar": { rot: "Esmagar", k: "dito", exige: "s-gravidade", exigeMsg: "altere a gravidade primeiro", dado: (a) => `${a.P}d6`, diz: (a) => `A gravidade dobra de repente: quem está na esfera faz salvaguarda de Força (CD ${a.cd}) ou sofre ${a.t} e fica Caído.` },
  /* Vínculo e ressonância */
  "s-ressonancia": { rot: "Entrar em ressonância", k: "conta", ch: "s-ressonancia", nome: "Aliados em ressonância", cap: (P) => m2(P), medidor: "pips", diz: (a) => `Aliado ${a.n} em ressonância: enquanto estiver a até 9 m de você, ele e você têm +1 de acerto.${a.tem("Ressonância que cura") ? " Ressonância que cura: quando um de vocês é curado, o outro recupera metade." : ""}` },
  "s-combinado": { rot: "Golpe combinado", k: "dito", marca: "s-combinado", diz: (a) => `Um aliado a até 9 m gasta a reação: o seu próximo ataque causa +${a.P}d6 de Energia e conta como dos dois.${a.tem("Combinação tripla") ? " Combinação tripla: um segundo aliado pode gastar a reação para somar +1d6." : ""}` },
  "s-vingar": { rot: "Vingar o irmão", k: "cena", ch: "s-vingar", marca: "s-vinganca", diz: () => "O irmão de arma caiu: até o fim da cena, +1d6 nos seus golpes." },
  "s-ordem": { rot: "Dar ordem", k: "dito", diz: (a) => `Um aliado a até 18 m que ouça você usa a reação para andar até metade do deslocamento ou fazer um ataque.${a.tem("Ordem de recuo") ? " Ordem de recuo: o movimento não provoca ataque de oportunidade e ele ganha +2 de CR até o próximo turno dele." : ""}${a.tem("Ordem de ataque") ? ` Ordem de ataque: o ataque dele causa +${a.P} de dano.` : ""}` },
  /* Marcas e maldições */
  "s-corte": { rot: "Abrir corte", k: "conta", ch: "s-cortes", nome: "Cortes abertos", cap: (P) => P, medidor: "pips", diz: (a) => `Corte ${a.n} aberto: cada vez que o alvo anda mais de 3 m no turno, sofre ${a.tem("Corte fundo") ? "1d6" : "1d4"} por corte. Somem com cura mágica ou no fim da cena.` },
  "s-corte-anda": { rot: "Ele se moveu", k: "dito", exige: "s-cortes", exigeMsg: "abra um corte primeiro", dado: (a) => `${a.n}${a.tem("Corte fundo") ? "d6" : "d4"}`, diz: (a) => `Os cortes rasgam com o movimento: ${a.t} de dano.` },
  "s-ima": { rot: "Imantar", k: "liga", ch: "s-ima", nome: "Alvo imantado", diz: () => "Marca posta numa criatura ou objeto a até 18 m: os seus projéteis e armas lançadas contra ela ignoram meia cobertura e voltam à sua mão.", dizOff: "O ímã se desfaz." },
  "s-ima-puxa": { rot: "Puxar o imantado", k: "dito", exige: "s-ima", exigeMsg: "imante um alvo primeiro", diz: (a) => `O alvo imantado faz salvaguarda de Força (CD ${a.cd}) ou é ${a.tem("Polos opostos") ? "puxado ou empurrado 3 m, à sua escolha" : "puxado 3 m para você"}.` },
  "s-chuva-metal": { rot: "Chuva de metal", k: "dito", exige: "s-ima", exigeMsg: "imante um alvo primeiro", dado: (a) => `${a.P}d6`, diz: (a) => `Todo o metal solto a até 9 m voa no alvo imantado: salvaguarda de Destreza (CD ${a.cd}), ${a.t} de dano, metade no sucesso.` },
  /* Cargas, reservas e preço */
  "s-ultimo": { rot: "Último recurso", k: "cena", ch: "s-ultimo", marca: "s-ultimo-golpe", pre: (a) => (a.f.pvAtual * 4 > a.c.pv ? "só abaixo de 1/4 dos PV" : undefined), diz: (a) => `O próximo golpe causa o máximo em todos os dados. Depois dele ${a.tem("Ainda de pé") ? "a forma dura só mais 1 turno" : "a forma termina"}.${a.tem("Arrastar junto") ? " Arrastar junto: se o golpe derrubar o alvo, a forma não termina." : ""}` },
  /* Controle e defesa */
  "s-espelhar": { rot: "Espelhar condição", k: "dito", diz: (a) => `Faça salvaguarda de Espírito contra a CD de quem causou a condição: se passar, ela volta para ele${a.tem("Espelho largo") ? " e para outra criatura a até 3 m dele" : ""}.` },
  "s-guardar-cond": { rot: "Guardar a condição", k: "dito", marca: "s-cond", diz: () => "Em vez de devolver, você guarda a condição: ela vai no seu próximo golpe que acertar." },
  "s-suprimir": { rot: "Suprimir", k: "dito", diz: (a) => `Esfera de 6 m a até 18 m: cada criatura faz salvaguarda de Espírito (CD ${a.cd}); se falhar, as técnicas dela custam +${a.P} PR até o fim do próximo turno dela${a.tem("Silêncio total") ? " e ela não usa reações" : ""}.${a.tem("Peso da presença") ? " Peso da presença: quem falhar por 5 ou mais fica Caído." : ""}` },
  "s-prisao": { rot: "Prender no cubo", k: "liga", ch: "s-prisao", nome: "Prisão cúbica", diz: (a) => `Um cubo de 3 m a até 18 m: a criatura dentro faz Destreza (CD ${a.cd}); se falhar, fica isolada (nada entra, sai nem atravessa) até o fim do próximo turno dela ou até o cubo perder ${a.P * 4} PV.${a.tem("Prisão dupla") ? " Prisão dupla: o cubo pode ter 6 m e prender duas criaturas." : ""}`, dizOff: "O cubo se desfaz." },
  "s-cubo-encolhe": { rot: "Encolher o cubo", k: "dito", exige: "s-prisao", exigeMsg: "prenda alguém no cubo primeiro", dado: (a) => `${a.P}d6`, diz: (a) => `O cubo aperta: quem está dentro sofre ${a.t} de dano, sem salvaguarda.` },
  "s-repulsao": { rot: "Onda de repulsão", k: "dito", dado: (a) => (a.tem("Contra a parede") ? "2d6" : ""), diz: (a) => `Cada criatura a até 3 m faz salvaguarda de Força (CD ${a.cd}) ou é empurrada 4,5 m e cai Caída.${a.tem("Contra a parede") ? ` Contra a parede: quem bater num obstáculo sofre ${a.t}.` : ""}${a.tem("Repulsão que protege") ? " Repulsão que protege: projéteis no ar a até 3 m caem." : ""}` },
  /* Corpo e arma mutável */
  "s-modo": { rot: "Mudar a forma da arma", k: "ciclo", ch: "s-modo", nome: "Forma da arma", cap: (_P, tem) => (tem("Quarta forma") ? 4 : 3), diz: (a) => ["", "Lâmina: +1 no acerto dos golpes.", "Lança: +3 m de alcance nos golpes.", "Arco: os golpes viram ataque à distância, até 18 m.", "Escudo: +1 de CR; os golpes causam −1d4."][a.n] + (a.tem("Troca no golpe") ? " Troca no golpe: 1 vez por turno, a troca não gasta a ação bônus." : "") },
  "s-braco": { rot: "Golpe do braço extra", k: "cena", ch: "s-braco-turno", dado: () => "1d6", diz: (a) => `O braço extra golpeia: ${a.t + a.c.atr.for} de dano (1d6 + Força), sem os dados da forma.${a.tem("Agarrar com o braço extra") ? " Pode agarrar em vez de ferir (Força, CD " + a.cdFor + ")." : ""}` },
  "s-estica": { rot: "Esticar a lâmina", k: "dito", dado: (a) => (a.tem("Estocada sem aviso") ? "1d6" : ""), diz: (a) => `Uma criatura a até 12 m se afastou: a lâmina se estica e faz um ataque de oportunidade contra ela${a.tem("Estocada sem aviso") ? `, com +${a.t} de dano` : ""}.${a.tem("Retrair puxando") ? ` Retrair puxando: se acertar, ela faz Força (CD ${a.cdFor}) ou é puxada 6 m de volta.` : ""}` },
  /* Espaço e movimento */
  "s-portais": { rot: "Abrir portais", k: "tempo", ch: "s-portais", nome: "Portais (turnos)", cap: (P) => P, medidor: "barra", diz: (a) => `Dois portais a até 18 m um do outro por ${a.P} turnos: criaturas e ataques passam de um para o outro.` },
  "s-portal-fecha": { rot: "Fechar no meio", k: "gasta", ch: "s-portais", tudo: true, exigeMsg: "não há portal aberto", dado: (a) => `${a.P}d6`, diz: (a) => `Os portais se fecham sobre quem atravessava: salvaguarda de Destreza (CD ${a.cd}) ou ${a.t} de dano.` },
  "s-sombras": { rot: "Passo nas sombras", k: "dito", marca: (a) => (a.tem("Esconder na chegada") ? "s-oculto" : undefined), diz: (a) => `De uma área de luz fraca, você teleporta até 18 m para outra sombra que veja.${a.tem("Esconder na chegada") ? " Esconder na chegada: Furtividade com vantagem; o próximo ataque sai de surpresa." : ""}${a.tem("Levar a sombra") ? " Levar a sombra: um aliado que você toque vai junto." : ""}` },
  "s-mergulho": { rot: "Mergulho", k: "dito", marca: "s-mergulho", diz: (a) => `Você desce pelo menos 9 m e golpeia: o próximo golpe causa +2d8 e o alvo faz Força (CD ${a.cdFor}) ou fica Caído.` },
  "s-distorcao": { rot: "Distorcer distância", k: "tempo", ch: "s-distorcao", nome: "Distância distorcida (turnos)", cap: (P) => P, medidor: "barra", diz: (a) => `Por ${a.P} turnos, num raio de 9 m em volta de você, cada 1,5 m conta como 3 m para inimigos, e ataques à distância deles de mais de 9 m têm desvantagem.${a.tem("Ponto cego") ? " Ponto cego: você escolhe um inimigo que não vê você enquanto durar (Mente, CD " + a.cd + ")." : ""}` },
  "s-arremesso": { rot: "Arremessar", k: "dito", dado: (a) => `${a.P}d6`, diz: (a) => `Com uma criatura agarrada: você a lança até ${3 * a.P} m. Ela sofre ${a.t} (1d6 a cada 3 m) e cai Caída.${a.tem("Contra outro") ? ` Contra outro: se passar por uma criatura, ela faz Destreza (CD ${a.cdFor}) ou sofre o mesmo e cai.` : ""}${a.tem("Arremesso alto") ? " Arremesso alto: lançada para cima, ela também sofre o dano da queda." : ""}` },
  /* Tempo e ritmo */
  "s-lento": { rot: "Desacelerar", k: "dito", diz: (a) => `Esfera de 6 m a até 18 m: cada inimigo faz salvaguarda de Espírito (CD ${a.cd}); se falhar, fica Lento ${a.tem("Câmara lenta") ? "até o fim da cena" : "por 3 turnos"} (metade do deslocamento, −2 de CR, sem reação, só uma ação ou ação bônus por turno; repete a salvaguarda no fim de cada turno).` },
  "s-prever": { rot: "Prever", k: "conta", ch: "s-previsao", nome: "Previsões usadas", cap: (P) => m2(P), medidor: "pips", marca: (a) => (a.tem("Ver e cortar") ? "s-viu" : undefined), diz: (a) => `Você vê o próximo segundo: o ataque declarado contra você tem desvantagem.${a.tem("Ver e cortar") ? " Ver e cortar: se ele errar, o seu próximo golpe tem vantagem." : ""}${a.tem("Aviso") ? " Aviso: pode valer para um aliado a até 9 m." : ""}` },
  "s-desgaste": { rot: "Desgastar", k: "conta", ch: "s-desgaste", nome: "Desgaste no alvo", cap: (P) => m2(P), medidor: "pips", diz: (a) => `O alvo faz salvaguarda de Constituição (CD ${a.cd}); se falhar, −1 de Força ou Destreza (você escolhe) até o fim da cena: desgaste ${a.n}.${a.tem("Ferrugem") ? " Ferrugem: a arma ou armadura dele também perde 1 de bônus." : ""}` },
  "s-instante": { rot: "Esticar o instante", k: "cena", ch: "s-instante", cap: (_P, tem) => (tem("Dois instantes") ? 2 : 1), diz: (a) => `Você ganha uma ação extra neste turno (só ataque ou técnica). No seu próximo turno, fica sem ação bônus e sem reação.${a.tem("Instante partilhado") ? " Instante partilhado: a ação extra pode ir para um aliado a até 9 m." : ""}` },
  /* Ilusão e engano */
  "s-rosto": { rot: "Trocar de rosto", k: "liga", ch: "s-rosto", nome: "Rosto trocado", diz: (a) => `Você parece outra criatura que já viu até o fim da cena. Quem examina faz Intuição contra a CD ${a.cd}.${a.tem("Voz roubada") ? " Voz roubada: a voz e a reiatsu também enganam (desvantagem para examinar)." : ""}${a.tem("Troca de aparências") ? " Troca de aparências: você e um aliado podem trocar de aparência um com o outro." : ""}`, dizOff: "O rosto falso se desfaz." },
  "s-falsa": { rot: "Reiatsu falsa", k: "liga", ch: "s-falsa", nome: "Reiatsu falsa", diz: (a) => `Uma assinatura de reiatsu sua aparece num ponto a até 36 m: quem sente reiatsu acha que você está lá (Mente, CD ${a.cd}, para perceber).${a.tem("Sumir do radar") ? " Sumir do radar: a sua reiatsu verdadeira some para quem sente." : ""}`, dizOff: "A reiatsu falsa se apaga." },
  "s-pressao": { rot: "Pressão de capitão", k: "dito", exige: "s-falsa", exigeMsg: "projete a reiatsu falsa primeiro", diz: (a) => `A reiatsu falsa parece enorme: quem está a até 9 m dela faz salvaguarda de Espírito (CD ${a.cd}) ou fica Amedrontado até o fim do próximo turno.` },
  "s-gatilho-hipnose": { rot: "Gatilho renovado", k: "cena", ch: "s-hipnose", diz: (a) => `Você repete o gesto da liberação: quem vê faz salvaguarda de Mente (CD ${a.cd}) ou cai sob a hipnose até o fim da cena.` },
  "s-cenario": { rot: "Cenário falso", k: "liga", ch: "s-cenario", nome: "Cenário falso", diz: (a) => `Um cubo de 9 m a até 18 m parece outra coisa (abismo, parede, chão firme) até o fim da cena. Inimigos fazem Mente (CD ${a.cd}) ao vê-lo; quem falha age como se fosse real.${a.tem("Abismo") ? " Abismo: quem acredita num abismo não entra na área por vontade própria." : ""}`, dizOff: "O cenário falso se desfaz." },
  "s-cenario-fere": { rot: "Cenário que fere", k: "dito", exige: "s-cenario", exigeMsg: "crie o cenário falso primeiro", dado: (a) => `${a.P}d6`, diz: (a) => `Quem acredita no cenário e o toca sofre ${a.t} de dano psíquico (Mente, CD ${a.cd}, metade).` },
  "s-embaralhar": { rot: "Embaralhar", k: "dito", diz: (a) => `Até ${a.P} criaturas a até 9 m fazem salvaguarda de Mente (CD ${a.cd}). Quem falha, no próximo ataque, rola 1d4: com 1–2 ataca uma criatura aleatória ao alcance${a.tem("Confusão que dura") ? "; isso vale por 3 turnos" : ""}.${a.tem("Você é amigo") ? " Você é amigo: quem falhou não escolhe você como alvo no próximo turno." : ""}` },
  /* Sentidos e regras do duelo */
  "s-medir": { rot: "Medir a força", k: "dito", diz: () => "Você sente a reiatsu de uma criatura a até 36 m: o Mestre diz se o nível dela é menor, igual ou maior que o seu e se ela tem forma liberada." },
  "s-regra": { rot: "Propor regra", k: "liga", ch: "s-duelo", nome: "Regra do duelo", diz: (a) => `Você propõe ${a.tem("Regra dupla") ? "duas regras" : "uma regra"} a um inimigo (só armas, sem Kidō, sem fuga, um contra um). Se ele aceitar, ou falhar em Espírito (CD ${a.cd}), quem quebrar sofre ${a.P + (a.tem("Juiz imparcial") ? 1 : 0)}d8 de Energia e tem desvantagem até o fim do próximo turno.${a.tem("Juiz imparcial") ? " Juiz imparcial: a regra vale também para você, e o dano sobe 1 dado." : ""}`, dizOff: "A regra do duelo acaba." },
  "s-regra-quebra": { rot: "Regra quebrada", k: "dito", exige: "s-duelo", exigeMsg: "proponha uma regra primeiro", dado: (a) => `${a.P + (a.tem("Juiz imparcial") ? 1 : 0)}d8`, diz: (a) => `A regra foi quebrada: quem quebrou sofre ${a.t} de Energia e tem desvantagem até o fim do próximo turno.` },
  "s-memoria": { rot: "Já vi isso", k: "conta", ch: "s-memoria", nome: "Vezes que viu a técnica", cap: () => 3, medidor: "pips", diz: (a) => (a.n >= 3 && a.tem("Na terceira, não") ? "Terceira vez: como reação, o dano dessa técnica em você cai à metade." : a.n >= 2 ? `Já é a ${a.n}ª vez: +2 de CR e nas salvaguardas contra essa técnica até o fim da cena.${a.tem("Ensinar") ? " Ensinar: aliados que ouvirem você ganham +1." : ""}` : "Primeira vez que ela usa essa técnica: você memoriza. Na segunda, ganha +2 de CR e nas salvaguardas contra ela.") },
  "s-faro": { rot: "Farejar ferido", k: "liga", ch: "s-faro", nome: "Alvo ferido farejado", diz: (a) => `Você fareja uma criatura abaixo da metade dos PV a até 36 m: +1d4 nos golpes contra ela.${a.tem("Caçada") ? " Caçada: +3 m de deslocamento ao andar na direção dela." : ""}`, dizOff: "Você perde o rastro." },
  "s-nome": { rot: "Descobri o nome", k: "liga", ch: "s-nome", nome: "Nome da arma dele", diz: (a) => `Você sabe o nome da arma dele: vantagem nas salvaguardas contra as técnicas dele até o fim da cena.${a.tem("Nome guardado") ? " Nome guardado: o nome continua valendo em outras cenas." : ""}`, dizOff: "Você deixa de usar o nome." },
  "s-chamar-lamina": { rot: "Chamar a lâmina dele", k: "cena", ch: "s-chamar", exige: "s-nome", exigeMsg: "descubra o nome primeiro", diz: (a) => `Você chama a arma dele pelo nome: ele faz salvaguarda de Espírito (CD ${a.cd}) ou a forma dele hesita e ele perde a ação bônus do próximo turno.` },
  /* Elementos */
  "s-foco": { rot: "Atear fogo", k: "conta", ch: "s-focos", nome: "Focos de fogo", cap: (P) => P, medidor: "pips", diz: (a) => `Foco ${a.n}: um quadrado de 3 m pega fogo. Quem entra ou começa o turno ali sofre 1d6 + ${a.P} de Fogo.${a.tem("Fogo que anda") ? " Fogo que anda: no Novo turno, cada foco pode andar 3 m." : ""}` },
  "s-foco-dano": { rot: "Entraram no fogo", k: "dito", exige: "s-focos", exigeMsg: "ateie fogo primeiro", dado: (a) => `1d6+${a.P}`, diz: (a) => `Quem entrou ou começou o turno no fogo sofre ${a.t} de Fogo.` },
  "s-foco-apaga": { rot: "Apagar o fogo", k: "gasta", ch: "s-focos", tudo: true, exigeMsg: "não há foco aceso", diz: (a) => `${a.n} ${s(a.n, "foco se apaga", "focos se apagam")}.`, extra: (a) => ({ pvTemp: Math.max(a.f.estado.pvTemp ?? 0, a.n * 2) }) },
  "s-correnteza": { rot: "Correnteza", k: "dito", diz: (a) => `Uma linha de 18 × 3 m de água: quem está nela faz salvaguarda de Força (CD ${a.cd}) ou é empurrado 6 m e cai Caído; todos ficam molhados até o fim do próximo turno.${a.tem("Maré que volta") ? " Maré que volta: no Novo turno a água volta e puxa 3 m quem falhou." : ""}${a.tem("Afogar") ? " Afogar: uma criatura agarrada por você na água não fala e sofre 1d6 por turno." : ""}` },
  "s-pilar": { rot: "Erguer pilar", k: "conta", ch: "s-pilares", nome: "Pilares", cap: () => 2, medidor: "pips", dado: (a) => (a.tem("Pilar que lança") ? "2d6" : ""), diz: (a) => `Pilar ${a.n}/2 de 1,5 × 6 m a até 18 m (cobertura total; dá para subir).${a.tem("Pilar que lança") ? ` Pilar que lança: se nascer debaixo de um inimigo, ele faz Destreza (CD ${a.cd}) ou sobe 6 m e cai (${a.t}).` : ""}` },
  "s-pilar-cai": { rot: "Derrubar o pilar", k: "gasta", ch: "s-pilares", exigeMsg: "não há pilar", dado: () => "3d6", diz: (a) => `O pilar tomba numa linha de 6 m: salvaguarda de Destreza (CD ${a.cd}) ou ${a.t} de dano e Caído.` },
  "s-elemento": { rot: "Trocar de elemento", k: "ciclo", ch: "s-elemento", nome: "Elemento da forma", cap: () => 3, diz: (a) => `O dano da forma passa a ser ${["", "o primeiro", "o segundo", "o terceiro"][a.n]} elemento escolhido ao montar a forma.${a.tem("Dois elementos") ? " Dois elementos: um ataque por turno causa metade de cada um de dois tipos." : ""}${a.tem("Elemento certo") ? " Elemento certo: contra um alvo vulnerável ao elemento, +1d6." : ""}` },
  /* Vida, morte e veneno */
  "s-recusar": { rot: "Recusar a morte", k: "cena", ch: "s-recusa", pre: (a) => (a.f.pvAtual > 0 ? "só ao cair a 0 PV" : undefined), marca: (a) => (a.tem("Fúria do quase morto") ? "s-furia-morto" : undefined), extra: (a) => ({ curaPv: 1, pvTemp: Math.max(a.f.estado.pvTemp ?? 0, a.P * 2) }), diz: (a) => `Você se recusa a cair: fica com 1 PV e ${a.P * 2} PV temporários.${a.tem("Fúria do quase morto") ? " Fúria do quase morto: por 2 turnos, +1d8 e vantagem nos golpes." : ""}${a.tem("Último aviso") ? " Último aviso: quem derrubou você faz Espírito (CD " + a.cd + ") ou fica Amedrontado." : ""}` },
  "s-adaptar": { rot: "Adaptar", k: "conta", ch: "s-adaptacao", nome: "Tipos de dano adaptados", cap: () => 2, medidor: "pips", extra: (a) => (a.tem("Casca nova") ? { pvTemp: Math.max(a.f.estado.pvTemp ?? 0, a.P) } : {}), diz: (a) => `Você sofreu o mesmo tipo de dano ${a.tem("Adaptação rápida") ? "uma vez" : "duas vezes"}: ganha resistência a ele até o fim da cena (${a.n} de 2 tipos).${a.tem("Casca nova") ? ` Casca nova: ${a.P} PV temporários.` : ""}` },
  "s-semente": { rot: "Plantar semente", k: "tempo", ch: "s-semente", nome: "Semente de vida (turnos)", cap: (P) => P, medidor: "barra", diz: (a) => `Semente plantada num aliado a até 9 m: por ${a.P} turnos, no início do turno dele, ele recupera 1d6 PV.${a.tem("Flor de emergência") ? " Flor de emergência: se ele cair a 0 PV, a semente floresce e ele fica com 1 PV (a semente acaba)." : ""}${a.tem("Jardim") ? " Jardim: a semente vale para dois aliados." : ""}`, dado: () => "1d6", tick: (a) => `Semente de vida: o aliado recupera ${a.t} PV` },
  /* Hollow e Vazio */
  "s-garganta": { rot: "Abrir Garganta", k: "dito", marca: (a) => (a.tem("Emboscada") ? "s-emboscada" : undefined), diz: (a) => `Uma Garganta se abre: você e até ${a.P} aliados a 3 m saem da cena no fim do seu turno, ou você reaparece a até 36 m.${a.tem("Emboscada") ? " Emboscada: ao reaparecer, o primeiro golpe tem vantagem." : ""}` },
  "s-garganta-curta": { rot: "Garganta curta", k: "dito", marca: (a) => (a.tem("Emboscada") ? "s-emboscada" : undefined), diz: () => "Um rasgo rápido: você reaparece a até 36 m." },
};

/** Bônus que essas técnicas dão ao próximo golpe (ou enquanto ligadas). */
export const BONUS_SIMPLES: { ch: string; so?: string; corpo?: boolean; gasta?: boolean; acerto?: (P: number, n: number) => number; dados?: (P: number, n: number) => string; tag: (P: number, n: number) => string }[] = [
  { ch: "s-montado", so: "Carga montada", corpo: true, dados: () => "1d8", tag: () => "Carga montada: +1d8 (depois de andar 6 m)" },
  { ch: "s-arena", so: "Só nós dois", acerto: () => 1, tag: () => "Só nós dois: +1 no acerto dentro da arena" },
  { ch: "s-ressonancia", acerto: () => 1, tag: () => "Ressonância: +1 no acerto (aliado a até 9 m)" },
  { ch: "s-combinado", gasta: true, dados: (P) => `${P}d6`, tag: (P) => `Golpe combinado: +${P}d6 de Energia` },
  { ch: "s-vinganca", dados: () => "1d6", tag: () => "Vingar o irmão: +1d6" },
  { ch: "s-ultimo-golpe", gasta: true, tag: () => "Último recurso: máximo em todos os dados; a forma termina depois" },
  { ch: "s-cond", gasta: true, tag: () => "Condição guardada: vai neste golpe, se acertar" },
  { ch: "s-modo", acerto: (_P, n) => (n === 1 ? 1 : 0), tag: (_P, n) => ["", "Lâmina: +1 no acerto", "Lança: +3 m de alcance", "Arco: ataque à distância, 18 m", "Escudo: −1d4 de dano"][n] ?? "" },
  { ch: "s-oculto", gasta: true, tag: () => "Saiu das sombras: ataque de surpresa (vantagem)" },
  { ch: "s-mergulho", gasta: true, corpo: true, dados: () => "2d8", tag: () => "Mergulho: +2d8; Força ou Caído" },
  { ch: "s-portais", so: "Ataque pelo portal", tag: () => "Ataque pelo portal: 1 vez por turno, vantagem" },
  { ch: "s-viu", gasta: true, tag: () => "Ver e cortar: vantagem (se o ataque dele errou)" },
  { ch: "s-faro", dados: () => "1d4", tag: () => "Faro de sangue: +1d4 contra o ferido" },
  { ch: "s-elemento", tag: (_P, n) => `Elemento da forma: ${["", "primeiro", "segundo", "terceiro"][n] ?? ""}` },
  { ch: "s-furia-morto", dados: () => "1d8", tag: () => "Fúria do quase morto: +1d8 e vantagem" },
  { ch: "s-emboscada", gasta: true, tag: () => "Emboscada: vantagem no primeiro golpe" },
];

const efeitoDe = (sp: Simples, liga: boolean) => Object.fromEntries(Object.entries(sp.efeito ?? {}).map(([k, v]) => [PW(k), liga ? v : undefined]));

/** Resolve um botão simples. `v` lê o estado; `rolar` rola a expressão. */
export function acionarSimples(id: string, base: Omit<CtxS, "n" | "t">, v: (ch: string) => number, rolar: (rot: string, expr: string) => number): ResS | undefined {
  const sp = SIMPLES[id];
  if (!sp) return undefined;
  const R = sp.rot, ch = sp.ch ?? "";
  const atual = ch ? v(ch) : sp.exige ? v(sp.exige) : 0;
  const cap = sp.cap ? sp.cap(base.P, base.tem) : 1;
  if (sp.exige && v(sp.exige) < 1) return { erro: `${R}: ${sp.exigeMsg ?? "falta preparar antes"}.` };
  const pre = sp.pre?.({ ...base, n: atual, t: 0 });
  if (pre) return { erro: `${R}: ${pre}.` };
  const usos: Record<string, number | undefined> = {};
  let n = atual;
  if (sp.k === "conta") { if (atual >= cap) return { erro: `${R}: já está no máximo (${cap}).` }; n = atual + 1; usos[PW(ch)] = n; Object.assign(usos, efeitoDe(sp, true)); }
  else if (sp.k === "tempo") { if (atual > 0) return { erro: `${R}: já está ativo (${atual} ${s(atual, "turno", "turnos")}).` }; n = cap; usos[PW(ch)] = n; Object.assign(usos, efeitoDe(sp, true)); }
  else if (sp.k === "liga") { n = atual > 0 ? 0 : 1; usos[PW(ch)] = n || undefined; Object.assign(usos, efeitoDe(sp, n > 0)); if (n === 0) return { usos, dito: sp.dizOff ?? "Desligado." }; }
  else if (sp.k === "cena") { if (atual >= cap) return { erro: `${R}: ${cap === 1 ? "já usou" : `já usou ${cap} vezes`}.` }; n = atual + 1; usos[PW(ch)] = n; }
  else if (sp.k === "gasta") { if (atual < 1) return { erro: `${R}: ${sp.exigeMsg ?? "não há o que gastar"}.` }; const fica = sp.tudo ? 0 : atual - 1; usos[PW(ch)] = fica || undefined; if (fica === 0) Object.assign(usos, efeitoDe(sp, false)); }
  else if (sp.k === "ciclo") { n = (atual % cap) + 1; usos[PW(ch)] = n; usos[PW("t-cr:modo")] = ch === "s-modo" && n === 4 ? 1 : undefined; }
  const a0: CtxS = { ...base, n, t: 0 };
  const expr = sp.dado?.(a0) ?? "";
  const a: CtxS = { ...a0, t: expr ? rolar(R, expr) : 0 };
  const marca = typeof sp.marca === "function" ? sp.marca(a) : sp.marca;
  if (marca) usos[PW(marca)] = marca === "s-furia-morto" ? 2 : 1;
  return { usos, dito: sp.diz(a), ...(sp.extra?.(a) ?? {}) };
}

/** O que acontece com essas técnicas no Novo turno: os temporizadores contam e os avisos saem. */
export function turnoSimples(base: Omit<CtxS, "n" | "t">, v: (ch: string) => number, rolar: (rot: string, expr: string) => number): { usos: Record<string, number | undefined>; ditos: string[] } {
  const usos: Record<string, number | undefined> = {}, ditos: string[] = [];
  usos[PW("s-braco-turno")] = undefined;
  for (const sp of Object.values(SIMPLES)) {
    if (sp.k !== "tempo" || !sp.ch) continue;
    const n = v(sp.ch);
    if (n < 1) continue;
    if (sp.tick) { const a0: CtxS = { ...base, n, t: 0 }; const e = sp.dado?.(a0) ?? ""; ditos.push(sp.tick({ ...a0, t: e ? rolar(sp.rot, e) : 0 })); }
    if (n - 1 <= 0) { usos[PW(sp.ch)] = undefined; Object.assign(usos, efeitoDe(sp, false)); ditos.push(`${(sp.nome ?? sp.rot).replace(/ \(turnos\)$/, "")} acabou`); }
    else usos[PW(sp.ch)] = n - 1;
  }
  if (v("s-ninho") > 0 && v("s-crias") < base.P) { usos[PW("s-crias")] = v("s-crias") + 1; ditos.push(`Ninho: nasce 1 cria (${v("s-crias") + 1}/${base.P})`); }
  const fm = v("s-furia-morto");
  if (fm > 0) { usos[PW("s-furia-morto")] = fm - 1 <= 0 ? undefined : fm - 1; if (fm - 1 <= 0) ditos.push("a Fúria do quase morto acabou"); }
  return { usos, ditos };
}

/** Nomes das chaves para o painel "Ligado agora". */
export const NOMES_SIMPLES: [string, string][] = [
  ...Object.values(SIMPLES).filter((x) => x.ch && x.nome).map((x) => [x.ch!, x.nome!] as [string, string]),
  ["s-crias", "Crias do ninho"], ["s-combinado", "Golpe combinado"], ["s-vinganca", "Vingar o irmão"], ["s-ultimo-golpe", "Último recurso"], ["s-cond", "Condição guardada"],
  ["s-oculto", "Saiu das sombras"], ["s-mergulho", "Mergulho"], ["s-viu", "Ver e cortar"], ["s-furia-morto", "Fúria do quase morto"], ["s-emboscada", "Emboscada"],
];
