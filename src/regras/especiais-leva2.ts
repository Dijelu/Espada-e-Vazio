/* Segunda leva de técnicas e interações especiais (10 técnicas). O que cada botão faz fica em poderes.ts (pelo rótulo). */
import type { DefInteracao, DefTecnica } from "./especiais";

const bt = (rotulo: string, ritmo: "acao" | "bonus" | "reacao" = "bonus") => ({ k: "gera" as const, botao: { rotulo, ritmo, faz: "texto" as const } });
const tx = (t: string) => ({ k: "texto" as const, t });

export const TECNICAS_LEVA2: DefTecnica[] = [
  {
    id: "voltar-instante", grupo: "Tempo e ritmo", nome: "Voltar um instante", armaReq: ["espacial", "foco"],
    texto: "Reação, 1 vez por cena (2 com proficiência 5 ou mais): quando você sofre dano, recupera o que perdeu naquele golpe (até 5 × proficiência) e volta para onde estava no início do turno. Cria o botão “Voltar um instante”. Precisa de uma interação do instante.",
    compilar: () => [bt("Voltar um instante", "reacao")],
  },
  {
    id: "reserva-oculta", grupo: "Cargas, reservas e preço", nome: "Reserva oculta",
    texto: "Ação bônus: separa 2 PR numa reserva que nada drena (até 2 × proficiência). Ação bônus: solta a reserva, você recupera esse PR e o próximo golpe causa +1d6 a cada 3 PR soltos. Cria os botões “Guardar reserva” e “Soltar reserva”. Precisa de uma interação da reserva.",
    compilar: () => [bt("Guardar reserva"), bt("Soltar reserva")],
  },
  {
    id: "aposta", grupo: "Cargas, reservas e preço", nome: "Aposta",
    texto: "Ação bônus: role 1d6 antes do ataque. Par: o próximo ataque causa +proficiência d6. Ímpar: você sofre proficiência d4 e o próximo ataque tem desvantagem. Cria o botão “Apostar”. Precisa de uma interação da aposta.",
    compilar: () => [bt("Apostar")],
  },
  {
    id: "desaparecer", grupo: "Ilusão e engano", nome: "Desaparecer", armaReq: ["ilusoria", "agil"],
    texto: "Ação bônus: você fica invisível até atacar, usar técnica ou o fim do seu próximo turno. O ataque que sai da invisibilidade tem vantagem. Cria o botão “Desaparecer”. Precisa de uma interação da invisibilidade.",
    compilar: () => [bt("Desaparecer")],
  },
  {
    id: "ancora-retorno", grupo: "Espaço e movimento", nome: "Âncora de retorno", armaReq: ["espacial", "arremesso", "projetil"],
    texto: "Ação bônus: deixa uma âncora num ponto a até 18 m (até 2). Ação bônus: teleporta até uma âncora a até 36 m; ela some. Cria os botões “Deixar âncora” e “Voltar à âncora”. Precisa de uma interação da âncora.",
    compilar: () => [bt("Deixar âncora"), bt("Voltar à âncora")],
  },
  {
    id: "endurecer", grupo: "Corpo e arma mutável", nome: "Endurecer", armaReq: ["natural", "contato", "pesada"],
    texto: "Reação, quando um golpe físico o atinge: endurece a parte atingida e o dano cai em 2 × proficiência. No seu próximo golpe, aquela parte ataca com desvantagem. Cria o botão “Endurecer”. Precisa de uma interação do endurecimento.",
    compilar: () => [bt("Endurecer", "reacao")],
  },
  {
    id: "fio-reiatsu", grupo: "Vínculo e ressonância", nome: "Fio de reiatsu", armaReq: ["corrente", "segmentavel", "projetil"],
    texto: "Ação bônus: prende um fio num objeto ou criatura a até 18 m (até 2 fios). Ação bônus: você se puxa até lá sem provocar ataque de oportunidade, ou puxa o alvo 6 m (salvaguarda de Força). Cria os botões “Lançar fio” e “Puxar o fio”. Precisa de uma interação do fio.",
    compilar: () => [bt("Lançar fio"), bt("Puxar o fio")],
  },
  {
    id: "armadilhas", grupo: "Campo e terreno", nome: "Armadilhas de reiatsu", armaReq: ["foco", "arremesso", "projetil", "corrente"],
    texto: "Ação bônus: esconde uma armadilha num ponto a até 9 m (até a proficiência, ao mesmo tempo). Quando um inimigo entra no ponto: salvaguarda de Destreza ou 1d10 + proficiência de Energia. Cria os botões “Esconder armadilha” e “Armadilha disparou”. Precisa de uma interação das armadilhas.",
    compilar: () => [bt("Esconder armadilha"), bt("Armadilha disparou", "reacao")],
  },
  {
    id: "bala", grupo: "Hollow e Vazio", nome: "Bala", soHollow: true, armaReq: ["natural", "foco"],
    texto: "Para Hollow e Visored. Ação bônus: disparo rápido de reiatsu a até 18 m, 1d10 + proficiência de Energia. Cria o botão “Bala”. Precisa de uma interação da bala.",
    compilar: () => [bt("Bala")],
  },
  {
    id: "fome-vazio", grupo: "Hollow e Vazio", nome: "Devorar", soHollow: true, armaReq: ["natural"],
    texto: "Para Hollow e Visored. Quando você derruba uma criatura, recupera 2 × proficiência PV. Ação reativa: soma 1 de fome (até metade da proficiência, mínimo 1), que dá +1 de acerto por ponto até o fim da cena. Cria o botão “Saciar a fome”. Precisa de uma interação da fome.",
    compilar: () => [{ k: "gatilho", quando: "abate", rotulo: "Devorar", faz: { curaPv: "[PROF]*2" } }, bt("Saciar a fome", "reacao")],
  },
];

export const INTERACOES_LEVA2: DefInteracao[] = [
  /* Voltar um instante */
  { id: "ja-vi-golpe", nome: "Já vi esse golpe", com: ["voltar-instante"], vale: [], texto: "Depois de voltar, o seu próximo ataque contra quem o feriu tem vantagem (o painel liga isso sozinho).",
    compilar: () => [tx("Já vi esse golpe: depois de voltar um instante, o próximo ataque contra quem o feriu tem vantagem.")] },
  { id: "voltar-erro", nome: "Voltar o erro", com: ["voltar-instante"], vale: [], texto: "Em vez de recuperar dano, você rola de novo um ataque seu que errou. Gasta um uso do Voltar um instante. Cria o botão “Voltar o erro”.",
    compilar: () => [bt("Voltar o erro", "reacao")] },
  { id: "voltar-aliado", nome: "Voltar um aliado", com: ["voltar-instante"], vale: [], texto: "O Voltar um instante pode valer para um aliado a até 9 m (ele recupera o dano do golpe).",
    compilar: () => [tx("Voltar um aliado: o Voltar um instante pode valer para um aliado a até 9 m; ele recupera o dano do golpe, até 5 × proficiência.")] },
  /* Reserva oculta */
  { id: "reserva-emergencia", nome: "Reserva de emergência", com: ["reserva-oculta"], vale: [], texto: "Uma vez por cena, ao cair a 0 PV com reserva: você fica com PV iguais à reserva e ela zera. Cria o botão “Reserva de emergência”.",
    compilar: () => [bt("Reserva de emergência", "reacao")] },
  { id: "reserva-aliado", nome: "Reserva para o aliado", com: ["reserva-oculta"], vale: [], texto: "Ação bônus: solta a reserva num aliado a até 9 m em vez de em você (ele recupera o PR). Cria o botão “Reserva para o aliado”.",
    compilar: () => [bt("Reserva para o aliado")] },
  /* Aposta */
  { id: "dobrar-aposta", nome: "Dobrar a aposta", com: ["aposta"], vale: [], texto: "Ao ganhar, você pode apostar de novo no mesmo turno; se perder agora, paga as duas apostas.",
    compilar: () => [tx("Dobrar a aposta: ao ganhar, pode apostar de novo no mesmo turno; perder agora custa as duas.")] },
  { id: "sorte-jogador", nome: "Sorte de jogador", com: ["aposta"], vale: [], texto: "Uma vez por cena, você joga o d6 da aposta de novo. Cria o botão “Sorte de jogador”.",
    compilar: () => [bt("Sorte de jogador", "reacao")] },
  { id: "apostar-contra", nome: "Apostar contra ele", com: ["aposta"], vale: [], texto: "O alvo escolhe par ou ímpar; se ele errar, o seu ataque também tem vantagem.",
    compilar: () => [tx("Apostar contra ele: o alvo escolhe par ou ímpar; se errar, o seu ataque também tem vantagem.")] },
  /* Desaparecer */
  { id: "golpe-do-nada", nome: "Golpe do nada", com: ["desaparecer"], vale: [], texto: "O ataque que sai da invisibilidade causa +2d6 (o painel soma sozinho).",
    compilar: () => [tx("Golpe do nada: o ataque que sai da invisibilidade causa +2d6.")] },
  { id: "pegadas-falsas", nome: "Pegadas falsas", com: ["desaparecer"], vale: [], texto: "Quem tenta achar você tem desvantagem em Percepção.",
    compilar: () => [tx("Pegadas falsas: quem tenta achar você invisível tem desvantagem em Percepção.")] },
  { id: "sumir-parado", nome: "Sumir parado", com: ["desaparecer"], vale: [], texto: "Uma vez por cena, se você não se moveu no turno, continua invisível depois de atacar. Cria o botão “Sumir parado”.",
    compilar: () => [bt("Sumir parado", "reacao")] },
  /* Âncora */
  { id: "chegar-golpeando", nome: "Chegar golpeando", com: ["ancora-retorno"], vale: [], texto: "O primeiro golpe depois do teleporte tem vantagem (o painel liga sozinho).",
    compilar: () => [tx("Chegar golpeando: o primeiro golpe depois do teleporte tem vantagem.")] },
  { id: "ancora-aliado", nome: "Âncora num aliado", com: ["ancora-retorno"], vale: [], texto: "A âncora pode ficar presa num aliado: você aparece a 1,5 m dele.",
    compilar: () => [tx("Âncora num aliado: a âncora pode ficar presa num aliado; você aparece a 1,5 m dele.")] },
  { id: "com-passageiro", nome: "Com passageiro", com: ["ancora-retorno"], vale: [], texto: "Leva junto uma criatura que você esteja agarrando ou que aceite.",
    compilar: () => [tx("Com passageiro: leva junto uma criatura que você esteja agarrando ou que aceite.")] },
  /* Endurecer */
  { id: "punho-aco", nome: "Punho de aço", com: ["endurecer"], vale: [], texto: "O próximo golpe com a parte endurecida não tem desvantagem: causa +1d8 e ignora 2 de redução de dano (o painel soma sozinho).",
    compilar: () => [tx("Punho de aço: o próximo golpe com a parte endurecida causa +1d8 e ignora 2 de redução de dano, sem desvantagem.")] },
  { id: "corpo-aco", nome: "Corpo de aço", com: ["endurecer"], vale: [], texto: "Uma vez por cena: imune a dano físico até o início do seu próximo turno, com deslocamento 0. Cria o botão “Corpo de aço”.",
    compilar: () => [bt("Corpo de aço", "reacao")] },
  /* Fio */
  { id: "teia", nome: "Teia", com: ["fio-reiatsu"], vale: [], texto: "Com 2 fios presos, a linha entre eles é armadilha: quem cruza faz salvaguarda de Destreza ou cai Caído (o Novo turno lembra).",
    compilar: () => [tx("Teia: com 2 fios presos, a linha entre eles é armadilha; quem cruza faz salvaguarda de Destreza ou cai Caído.")] },
  { id: "fio-cortante", nome: "Fio cortante", com: ["fio-reiatsu"], vale: [], texto: "Ao puxar uma criatura, ela sofre 2d6 de dano cortante (o botão rola).",
    compilar: () => [tx("Fio cortante: ao puxar uma criatura com o fio, ela sofre 2d6 de dano cortante.")] },
  /* Armadilhas */
  { id: "armadilha-segura", nome: "Armadilha que segura", com: ["armadilhas"], vale: [], texto: "Em vez de dano, quem falha fica Contido até o fim do próximo turno dele.",
    compilar: () => [tx("Armadilha que segura: em vez de dano, quem falha na armadilha fica Contido até o fim do próximo turno dele.")] },
  { id: "alarme", nome: "Alarme", com: ["armadilhas"], vale: [], texto: "Quando uma armadilha dispara, você pode usar a reação para andar 6 m.",
    compilar: () => [tx("Alarme: quando uma armadilha dispara, você pode usar a reação para andar 6 m.")] },
  { id: "mover-armadilha", nome: "Mover armadilha", com: ["armadilhas"], vale: [], texto: "Ação bônus: muda uma armadilha de lugar, até 6 m. Cria o botão “Mover armadilha”.",
    compilar: () => [bt("Mover armadilha")] },
  /* Bala */
  { id: "rajada", nome: "Rajada", com: ["bala"], vale: [], soHollow: true, texto: "Ação bônus: duas balas de 1d6 + proficiência cada, no mesmo alvo ou em alvos diferentes. Cria o botão “Rajada”.",
    compilar: () => [bt("Rajada")] },
  { id: "bala-empurra", nome: "Bala que empurra", com: ["bala"], vale: [], soHollow: true, texto: "O alvo da bala é empurrado 3 m (o botão avisa).",
    compilar: () => [tx("Bala que empurra: o alvo da bala é empurrado 3 m.")] },
  /* Fome do Vazio */
  { id: "fome-evolucao", nome: "Evolução", com: ["fome-vazio"], vale: [], soHollow: true, texto: "Com fome no máximo, você ganha resistência ao tipo de dano da última criatura derrubada (o painel lembra).",
    compilar: () => [tx("Evolução: com a fome no máximo, resistência ao tipo de dano da última criatura derrubada, até o fim da cena.")] },
  { id: "fome-sem-freio", nome: "Fome sem freio", com: ["fome-vazio"], vale: [], soHollow: true, texto: "Frenesi leve: +1d6 nos golpes, em troca de perder o controle (o Mestre decide quando).",
    compilar: () => [{ k: "frenesi", nivel: "leve" }, { k: "dados", em: ["golpe"], n: 1, d: 6 }, tx("Fome sem freio: frenesi leve; +1d6 nos golpes, em troca de perder o controle.")] },
];
