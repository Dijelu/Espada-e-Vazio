import { useMemo, useState } from "react";
import { classePorId, type Ficha, type FormaLib, type HabForma, type TipoForma } from "../regras/ficha";
import { ACOES_DADOS, HAB_UNICAS, habilidadesDaForma, TIPO_FORMA_NOME, VOLL_PASSIVAS, picksVoll, totalPicks } from "../regras/liberacoes";
import { novoId } from "./FichaPecas";
import { SeletorSchrift } from "./SeletorSchrift";
import { schriftDaFicha } from "../regras/schrifts";
import { CANALIZADORES_EXTRA, FRAQUEZAS_EXTRA, NOMES, TEMAS, type Tema } from "../regras/forma-sugestoes";

interface Props {
  f: Ficha;
  tipo: TipoForma;
  r: FormaLib;
  mud: (p: Partial<FormaLib>) => void;
  onSalvar: () => void;
  onEditarTudo: () => void;
}

interface Passo {
  id: string;
  titulo: string;
  ajuda: string;
}

const PASSOS: Record<TipoForma, Passo[]> = {
  shikai: [
    { id: "categoria", titulo: "Categoria", ajuda: "Defina o tipo da sua Zanpakutou. Combate é voltada só para lutar. Elemental usa um elemento da natureza. Kido tem uma habilidade que faz tudo funcionar. Especial é o que não cabe nas outras." },
    { id: "espirito", titulo: "Espírito", ajuda: "A alma do Shinigami se reflete na Zanpakutou. Crie a aparência e a personalidade do espírito com base no seu personagem (ou no contrário dele). O espírito pode ter vontades diferentes das suas." },
    { id: "nome", titulo: "Nome e comando", ajuda: "O nome tem relação com a natureza da Zanpakutou. Na Shikai ele é um nome incompleto. O comando é a frase de liberação, como “Reduza tudo a Cinzas” seguido do nome." },
    { id: "aparencia", titulo: "Forma", ajuda: "Ao liberar, a Zanpakutou pode ter outra forma: outra arma ou algo exótico. Pode ser dupla (duas armas). Ela usa o mesmo atributo da Asauchi nos ataques." },
    { id: "acoes", titulo: "Habilidades e técnicas", ajuda: "Habilidades são poderes passivos da Shikai. Técnicas são ativadas de propósito. Quanto mais forte, maior o custo. Use os modelos e edite." },
    { id: "custo", titulo: "Custo de liberação", ajuda: "De 3 a 10 PR. Custos altos são para Shikais completas e poderosas; custos baixos, para as mais simples ou incompletas." },
    { id: "revisao", titulo: "Revisão", ajuda: "Confira tudo. Ao salvar, o nome e a frase vão para a sua ficha e as habilidades viram cartas no Resumo." },
  ],
  bankai: [
    { id: "conceito", titulo: "Conceito", ajuda: "A Bankai reflete a alma do Shinigami. Pense no que ele esconde dentro de si e escolha como ela vai se comportar em relação à sua Shikai." },
    { id: "nome", titulo: "Nome e comando", ajuda: "O nome verdadeiro do espírito aparece na Bankai. O comando é a frase dita ao liberar, seguida do nome." },
    { id: "aparencia", titulo: "Aparência", ajuda: "Na Bankai o espírito aparece no mundo real. A forma pode ficar igual ou mudar por completo. Pode ser algo grande ou pequeno." },
    { id: "acoes", titulo: "Habilidades e técnicas", ajuda: "Escolha de 3 a 4 habilidades. Quanto mais forte a habilidade, maior o custo de reiatsu. Use os modelos abaixo e edite o que quiser." },
    { id: "custo", titulo: "Custo e duração", ajuda: "O custo de liberação vai de 40 a 80 PR: mais poder, mais custo. A Bankai dura 1 minuto e precisa de novo custo para continuar." },
    { id: "fraqueza", titulo: "Ponto fraco", ajuda: "Quase toda Bankai tem uma fraqueza: um efeito colateral para quem usa ou uma vulnerabilidade que os inimigos podem explorar." },
    { id: "revisao", titulo: "Revisão", ajuda: "Confira tudo. Depois de salvar, as habilidades viram cartas no Resumo e aparecem no painel quando a Bankai estiver ativa." },
  ],
  resurreccion: [
    { id: "conceito", titulo: "Conceito", ajuda: "A Resurrección é o corpo verdadeiro do Hollow. Pense em um animal, um monstro ou uma ideia, e em como isso combina com o seu Caminho." },
    { id: "nome", titulo: "Nome e comando", ajuda: "O nome costuma ser um animal ou conceito em espanhol. O comando é a frase dita ao liberar." },
    { id: "aparencia", titulo: "Aparência", ajuda: "Descreva o corpo, a máscara e a arma natural na forma liberada." },
    { id: "traco", titulo: "Traço da forma", ajuda: "Um efeito pequeno e claro, na escala dos modelos do livro. O dano já vem da forma, então nada de bônus grandes." },
    { id: "acoes", titulo: "Técnicas", ajuda: "Inclua a técnica de assinatura do seu Caminho (12 PR) e mais uma ou duas técnicas: uma básica e uma final de 30 PR." },
    { id: "fraqueza", titulo: "Ponto fraco", ajuda: "Toda Resurrección tem um preço, como menos CR contra um tipo de ataque, menos deslocamento ou um custo extra." },
    { id: "revisao", titulo: "Revisão", ajuda: "Confira tudo. O Mestre aprova o traço, o ponto fraco e as técnicas." },
  ],
  segunda: [
    { id: "conceito", titulo: "Conceito", ajuda: "A Segunda Etapa é a Resurrección levada além: o corpo muda de novo, mais forte e mais cruel, e o Hollow mostra o que vinha escondendo. Pense no que a forma anterior segurava e no que se solta agora." },
    { id: "nome", titulo: "Nome e comando", ajuda: "O nome costuma ser a forma verdadeira do Hollow, mais sombria que a da Resurrección. O comando é a frase dita ao liberar, que costuma ser curta e pesada." },
    { id: "aparencia", titulo: "Transformação", ajuda: "Descreva o que muda em relação à Resurrección: o corpo, a máscara, as asas, as armas e o ambiente. A Segunda Etapa precisa parecer outra criatura." },
    { id: "traco", titulo: "Novo traço", ajuda: "Um efeito novo e claro, no mesmo nível dos traços do livro. Ele substitui o traço da Resurrección enquanto a Segunda Etapa estiver ativa." },
    { id: "acoes", titulo: "Técnicas", ajuda: "Traga as técnicas da Resurrección, mais fortes, e crie uma técnica final de 40 PR. Pense em uma técnica de assinatura de longo alcance e em uma de defesa ou controle." },
    { id: "fraqueza", titulo: "Ponto fraco", ajuda: "Toda Segunda Etapa tem um preço. O livro já cobra 2 PR por turno e o Esgotado até o descanso longo. Aqui vai o ponto fraco extra da forma." },
    { id: "revisao", titulo: "Revisão", ajuda: "Confira tudo. O Mestre aprova o traço, o ponto fraco e as técnicas. Os bônus numéricos vêm da sua classe." },
  ],
  vollstandig: [
    { id: "nome", titulo: "Nome e frase", ajuda: "A frase de liberação pode ser “Quincy Vollständig” ou um nome próprio. Se tiver Schrift, ela influencia o nome." },
    { id: "aparencia", titulo: "Aparência", ajuda: "A Vollständig envolve o Quincy em reishi, em forma de asas e auréola. A cor costuma seguir a do reishi do Quincy." },
    { id: "canal", titulo: "Canalizador e Schrift", ajuda: "Todo Quincy precisa de um objeto para ativar a Vollständig. Se perder, recria no próximo descanso longo. A Schrift é opcional e precisa do aval do Mestre." },
    { id: "unicas", titulo: "Habilidades únicas", ajuda: "Escolha as habilidades que diferenciam a sua Vollständig. Depois de definidas, não mudam. Você pode repetir uma habilidade para acumular, menos Força e Precisão Espiritual." },
    { id: "acoes", titulo: "Ações", ajuda: "Monte de duas a três ações no padrão da Bankai: uma básica, uma de apoio e uma final de 30 PR." },
    { id: "revisao", titulo: "Revisão", ajuda: "Confira tudo. Ativar custa 60 PR e usa uma ação." },
  ],
};

const APARENCIA: Record<TipoForma, string[]> = {
  shikai: [
    "A Asauchi se transforma numa espada de lâmina diferente.",
    "A lâmina se desfaz em milhares de pétalas ou lâminas minúsculas.",
    "A arma vira uma lança, naginata ou arco.",
    "A Zanpakutou se divide em duas armas.",
    "Uma manopla, leque ou arma exótica surge na mão.",
  ],
  bankai: [
    "A lâmina continua a mesma, mas o corpo é envolto pelo elemento da Zanpakutou.",
    "O ambiente muda: nuvens, tempestade, neve ou noite cobrem o céu.",
    "O espírito da Zanpakutou se materializa ao lado do usuário.",
    "A arma se transforma em outra coisa, como manopla, arco ou leque.",
    "Asas, auréola ou armadura cobrem o corpo.",
  ],
  resurreccion: [
    "Máscara reduzida a uma crista na face.",
    "Corpo de animal, com garras e cauda de osso.",
    "Asas membranosas e pele pálida.",
    "Pele de vidro, cristal ou carapaça.",
    "Chifres, tentáculos ou membros extras.",
  ],
  segunda: [
    "A máscara cobre quase todo o rosto e o corpo fica esguio, pálido e liso.",
    "Asas negras de osso e membrana nascem das costas.",
    "O corpo se cobre de uma armadura natural, com chifres e cauda longa.",
    "Os braços ganham lâminas ou garras enormes de osso.",
    "A pele escurece e o reiatsu escorre do corpo como fumaça.",
    "Uma coroa de chifres e uma capa de reiatsu se formam ao redor do Hollow.",
  ],
  vollstandig: [
    "Asas de reishi azuis.",
    "Uma auréola brilhante sobre a cabeça.",
    "Roupa branca e cabelo flutuando.",
    "A arma espiritual em forma de arco, espada ou lança.",
    "Reishi dourado e cheio de faíscas.",
  ],
};

export const MAX_TRACOS = 3;

/** Quantas habilidades/técnicas cada forma aceita, para a lista não crescer sem fim. */
export const LIMITE_HAB: Record<TipoForma, number> = { shikai: 4, bankai: 5, resurreccion: 5, segunda: 6, vollstandig: 4 };

const TRACOS = [
  "Deslocamento +6 metros e Desengajar como ação livre uma vez por turno.",
  "Alcance corpo a corpo +3 metros.",
  "Voo igual ao seu deslocamento.",
  "Uma vez por rodada, quando um ataque erra você, ganhe PV temporários iguais à proficiência.",
  "Vantagem no primeiro ataque de cada turno.",
  "Uma vez por rodada, quando uma criatura o acerta em corpo a corpo, ela sofre 1d10 de dano de Energia.",
  "Deslocamento de escalada e de nado iguais ao seu deslocamento.",
  "Visão no escuro até 18 metros e vantagem em testes de Percepção para notar reiatsu.",
  "Resistência a um tipo de dano ligado ao tema da forma.",
  "Uma vez por turno, ao se mover pelo menos 6 metros em linha reta, seu próximo ataque causa +1d6 de dano.",
  "Ao reduzir uma criatura a 0 PV, ganhe PV temporários iguais ao seu nível.",
  "Uma vez por rodada, use a reação para reduzir em 1d10 + proficiência o dano de um ataque.",
  "Seus ataques ignoram cobertura parcial.",
  "Você pode usar Desengajar e Esconder como ação bônus.",
  "Alcance à distância +9 metros nos ataques de Cero e técnicas à distância.",
  "Aura de pressão: criaturas hostis a 3 metros têm -2 em salvaguardas contra medo.",
  "Seu primeiro ataque a cada rodada contra uma criatura que se moveu neste turno tem vantagem.",
  "Uma vez por turno, troque de lugar com um aliado a até 9 metros como ação livre.",
  "Regeneração: recupere PV iguais à proficiência no início de cada turno enquanto estiver abaixo da metade dos PV.",
  "Imune a ficar Agarrado, Contido ou Caído enquanto a forma estiver ativa.",
  "Ataques corpo a corpo contra você, feitos por criaturas que o veem, têm desvantagem se você não se moveu no turno.",
  "Uma vez por turno, ao acertar, você pode empurrar o alvo 3 metros.",
  "Seu dano de uma arma ou técnica escolhida ao entrar na forma passa a contar como mágico/espiritual e ignora a RD comum.",
  "Ao usar uma técnica de 20 PR ou mais, recupere 2 PR.",
  "Seus passos não fazem barulho e deixam rastro de reishi por 1 minuto.",
  "Ao entrar na forma, ganhe um ataque extra de oportunidade livre contra uma criatura a até 3 metros.",
  "Sentido de reiatsu: sabe a posição de qualquer criatura com reiatsu a até 18 metros, mesmo sem vê-la.",
];

const FRAQUEZAS: Record<TipoForma, string[]> = {
  shikai: [],
  bankai: [
    "Só pode ser liberada longe de aliados, porque o poder também os atinge.",
    "Ao encerrar a Bankai, você fica Esgotado até o fim do próximo turno.",
    "Vulnerável ao tipo de dano oposto ao tema da Zanpakutou.",
    "Uma das habilidades só pode ser usada uma vez por Bankai.",
    "A Bankai se desfaz se você sofrer um acerto crítico.",
  ],
  resurreccion: [
    "-2 de CR contra ataques à distância.",
    "Deslocamento -3 metros.",
    "Desvantagem em Percepção com luz intensa.",
    "Se nenhum aliado estiver a 9 metros, uma das técnicas custa +3 PR.",
    "Ao sofrer um acerto crítico, o traço da forma deixa de funcionar até o fim da Resurrección.",
  ],
  segunda: [
    "Os ataques de Energia ignoram parte da sua defesa: -2 de CR contra dano de Energia.",
    "A forma toma o controle: no início do seu turno com menos de metade dos PV, faça um teste de Determinação ou ataque o alvo mais próximo.",
    "As técnicas de área também atingem aliados a até 3 metros.",
    "Depois da técnica final, você perde o traço até o início do seu próximo turno.",
  ],
  vollstandig: [],
};

const CANALIZADORES = ["Colar com a cruz Quincy", "Luva com o emblema", "Máscara", "Sangue desenhando o símbolo no ar", "Anel de prata"];

const ATRIBUTOS_DANO = [
  { v: "ESP", n: "Espírito" },
  { v: "FOR", n: "Força" },
  { v: "DES", n: "Destreza" },
  { v: "MEN", n: "Mente" },
];

const ASSINATURA: Record<string, [string, string]> = {
  Sonido: ["pantera", "Golpe Fantasma"],
  Estallido: ["los-lobos", "Gran Rey Cero"],
  Glotonería: ["santa-teresa", "Devorar"],
  Glotoneria: ["santa-teresa", "Devorar"],
  Ilusión: ["murcielago", "Mundo Quebrado"],
  Ilusion: ["murcielago", "Mundo Quebrado"],
  Ponzoña: ["fornicaras", "Veneno Total"],
  Ponzona: ["fornicaras", "Veneno Total"],
  Reflejo: ["espejo-negro", "Espejo Roto"],
};

/** Modelos de habilidade para quem nunca montou uma forma. Os valores crescem com o nível. */
function modelos(tipo: TipoForma, atr: string): HabForma[] {
  const forte = tipo === "bankai" || tipo === "segunda";
  const d = forte ? "d12" : tipo === "shikai" ? "d8" : "d10";
  const peq = tipo === "shikai";
  const mk = (nome: string, acao: string, pr: number, dano: string, texto: string): HabForma => ({ id: novoId(), nome, acao, custo: pr ? `${pr} PR` : "", pr: pr || undefined, dano: dano || undefined, texto });
  return [
    mk("Ataque básico", "Ação", forte ? 15 : peq ? 4 : 10, peq ? `[NIV/2+1]${d}+[${atr}]` : `[NIV/2+3]${d}+[${atr}]`, "Um ataque do tema da sua forma. Descreva como ele se manifesta."),
    mk("Golpe em área", "Ação", peq ? 8 : 20, peq ? `[NIV/2+2]${d}+[${atr}]` : `[NIV/2+4]${d}+[${atr}]`, "Atinge criaturas numa área de 6 metros de raio. Salvaguarda de Destreza (CD 8 + proficiência + atributo): dano na falha, metade no sucesso."),
    mk("Técnica final", "Ação", peq ? 10 : 30, forte ? `[NIV]${d}+[${atr}]` : peq ? `[NIV/2+4]${d}+[${atr}]` : `[NIV/2+5]${d}+[${atr}]`, "O golpe mais forte da sua forma. Só vale a pena em momentos decisivos."),
    mk("Reforço", "Ação bônus", peq ? 3 : 8, "2d10", "O seu próximo ataque no turno causa o dano indicado a mais."),
    mk("Defesa", "Reação", peq ? 4 : 10, "2d10+[PROF]", "Reduz o dano sofrido por você ou por um aliado a 3 metros na quantidade indicada."),
    mk("Proteção", "Ação", peq ? 6 : 15, "[NIV]", "Você e os aliados a até 3 metros ganham PV temporários na quantidade indicada."),
    mk("Controle", "Ação", peq ? 6 : 15, peq ? `[NIV/2]${d}+[${atr}]` : `[NIV/2+2]${d}+[${atr}]`, "Ataque que também prende, derruba ou atordoa o alvo. Salvaguarda de Força ou Constituição (CD 8 + proficiência + atributo): se falhar, fica Contido até o fim do próximo turno dele."),
    mk("Passo veloz", "Ação bônus", peq ? 2 : 6, "", "Você se desloca até o dobro do seu deslocamento sem provocar ataques de oportunidade e depois pode atacar."),
    mk("Contra-ataque", "Reação", peq ? 4 : 10, `[NIV/2]${d}+[${atr}]`, "Quando uma criatura o acerta em corpo a corpo, você revida e causa o dano indicado nela."),
    mk("Marca", "Ação bônus", peq ? 3 : 8, "", "Marca uma criatura a até 18 metros. O primeiro ataque de cada aliado contra ela no turno causa 1d6 de dano a mais."),
    mk("Regeneração", "Ação", peq ? 5 : 12, "[NIV]", "Você ou um aliado a até 3 metros recupera os PV indicados."),
    mk("Rajada", "Ação", peq ? 7 : 18, `[NIV/2+2]${d}+[${atr}]`, "Dois golpes seguidos contra o mesmo alvo ou contra dois alvos a 3 metros um do outro, o dano indicado é dividido entre os alvos."),
  ];
}

export function AssistenteForma({ f, tipo, r, mud, onSalvar, onEditarTudo }: Props) {
  const classe = classePorId(f.classe);
  const passos = PASSOS[tipo];
  const [i, setI] = useState(0);
  const [atr, setAtr] = useState("ESP");
  const passo = passos[i];
  const limite = picksVoll(f.classe, f.nivel);
  const usados = totalPicks(r.picks);
  const lista = useMemo(() => modelos(tipo, atr), [tipo, atr]);
  const assinatura = ASSINATURA[f.subclasse];

  const maxHab = LIMITE_HAB[tipo];
  const cheio = r.habilidades.length >= maxHab;
  const jaTem = (nome: string) => !!nome && r.habilidades.some((x) => x.nome === nome);
  const addHab = (h: HabForma) => {
    if (cheio || jaTem(h.nome)) return;
    mud({ habilidades: [...r.habilidades, { ...h, id: novoId() }] });
  };
  const tracos = r.traco ? r.traco.split("\n").filter((x) => x.trim()) : [];
  const gravaTracos = (l: string[]) => mud({ traco: l.join("\n") });
  const habil = (id: string, p: Partial<HabForma>) => mud({ habilidades: r.habilidades.map((h) => (h.id === id ? { ...h, ...p } : h)) });
  const anexa = (campo: "aparencia" | "traco" | "pontoFraco", t: string) => mud({ [campo]: r[campo] ? `${r[campo]} ${t}` : t } as Partial<FormaLib>);

  const incluirAssinatura = () => {
    if (!assinatura) return;
    const a = ACOES_DADOS.resurreccion.modelos[assinatura[0]].find((x) => x.nome === assinatura[1]);
    if (a && !r.habilidades.some((h) => h.nome === a.nome))
      addHab({ id: "", nome: a.nome, texto: a.texto, custo: `${a.pr} PR`, acao: a.acao, pr: a.pr, dano: a.dano || undefined });
  };

  const mudarPick = (id: string, delta: number, unica?: boolean) => {
    const atual = r.picks[id] ?? 0;
    if (delta > 0 && (usados >= limite || (unica && atual >= 1))) return;
    const picks = { ...r.picks };
    const novo = Math.max(0, atual + delta);
    if (novo === 0) delete picks[id];
    else picks[id] = novo;
    mud({ picks });
  };

  const erros: string[] = [];
  if (!r.nome.trim()) erros.push("Falta o nome.");
  if (tipo === "vollstandig" && usados < limite) erros.push(`Faltam ${limite - usados} habilidade(s) única(s).`);
  if (r.habilidades.length > maxHab) erros.push(`Há habilidades demais: o limite é ${maxHab}.`);
  if (r.habilidades.length === 0) erros.push("Adicione pelo menos uma habilidade ou técnica.");
  if (tipo === "shikai" && !r.categoria) erros.push("Escolha a categoria.");
  if ((tipo === "bankai" || tipo === "resurreccion" || tipo === "segunda") && !r.pontoFraco.trim()) erros.push("Falta o ponto fraco.");

  return (
    <div className="assistente">
      <ol className="assistente-trilha" aria-label="Passos">
        {passos.map((p, k) => (
          <li key={p.id} className={k === i ? "atual" : k < i ? "feito" : ""}>
            <button type="button" onClick={() => setI(k)} aria-current={k === i ? "step" : undefined}>
              <span>{k + 1}</span> {p.titulo}
            </button>
          </li>
        ))}
      </ol>

      <div className="caixa assistente-passo">
        <small className="ajuda">Passo {i + 1} de {passos.length}</small>
        <h3>{passo.titulo}</h3>
        <p className="ajuda">{passo.ajuda}</p>

        {passo.id === "categoria" && (
          <div className="opcoes-grandes">
            {[
              ["Combate", "Voltada para lutar, como a Zangetsu. Habilidades simples, como somar o dobro da Força no dano."],
              ["Elemental", "Envolve um elemento, como o fogo da Ryuujin Jakka ou o gelo da Sode no Shirayuki."],
              ["Kido", "Tem uma habilidade que faz tudo funcionar, como as marcas da Suzumebachi."],
              ["Especial", "Não se encaixa nas outras, como a névoa de lâminas da Haineko."],
            ].map(([n, d]) => (
              <button key={n} type="button" className={`opcao ${r.categoria === n ? "on" : ""}`} onClick={() => mud({ categoria: n })}>
                <b>{n}</b>
                <small>{d}</small>
              </button>
            ))}
          </div>
        )}

        {passo.id === "espirito" && (
          <label className="campo">Espírito da Zanpakutou<textarea rows={4} value={r.espirito ?? ""} onChange={(e) => mud({ espirito: e.target.value })} placeholder="Aparência e personalidade. Ex.: um dragão de gelo calmo e orgulhoso." /></label>
        )}

        {passo.id === "conceito" && tipo === "bankai" && (
          <>
            <div className="opcoes-grandes">
              <button type="button" className={`opcao ${r.estilo === "potencializadora" ? "on" : ""}`} onClick={() => mud({ estilo: "potencializadora" })}>
                <b>Potencializadora</b>
                <small>Pega os poderes da Shikai e os eleva a outro nível, como a Senbonzakura ou a Zangetsu.</small>
              </button>
              <button type="button" className={`opcao ${r.estilo === "transformadora" ? "on" : ""}`} onClick={() => mud({ estilo: "transformadora" })}>
                <b>Transformadora</b>
                <small>Cria um poder novo, diferente da Shikai, como a Suzumebachi ou a Minazuki.</small>
              </button>
            </div>
            <p className="ajuda">Dica: a Bankai segue o tema da Shikai. Se a Shikai tem um poder, a Bankai terá algo parecido ou dentro do mesmo tema.</p>
          </>
        )}
        {passo.id === "conceito" && tipo === "segunda" && (
          <>
            <p>Sua Resurrección: <b>{f.formas.resurreccion?.nome || "ainda não montada"}</b>{f.subclasse ? ` · Caminho ${f.subclasse}` : ""}.</p>
            <p className="ajuda">A Segunda Etapa é uma <b>nova transformação</b> que vem depois da Resurrección, do mesmo jeito que o Hollow do anime que, ao tirar a sua arma e liberar a forma final, fica mais pálido, ganha asas e passa a usar técnicas de longo alcance. Escolha um tema pronto abaixo ou invente o seu: ele só precisa parecer um passo além da forma anterior.</p>
          </>
        )}
        {passo.id === "conceito" && tipo === "resurreccion" && (
          <>
            <p>Sua classe: <b>{classe?.nome ?? "Hollow"}</b>{f.subclasse ? ` · Caminho ${f.subclasse}` : " (escolha o Caminho na ficha para ver a técnica de assinatura)"}.</p>
            {assinatura && <p className="ajuda">A técnica de assinatura do seu Caminho é <b>{assinatura[1]}</b> (12 PR). Você vai incluí-la no passo das técnicas.</p>}
            <p className="ajuda">Ideias: um animal veloz (Sonido), uma fera que devora (Glotonería), um canhão vivo (Estallido), um enganador (Ilusión), um envenenador (Ponzoña) ou um espelho (Reflejo).</p>
          </>
        )}

        {passo.id === "nome" && NOMES[tipo] && (
          <>
            <p className="ajuda">Ideias de nome e comando (toque para usar e depois mude como quiser):</p>
            <div className="chips">
              {NOMES[tipo]!.map((n) => <button key={n.nome} type="button" className="chip chip-btn" onClick={() => mud({ nome: n.nome, comando: n.comando })}>{n.nome}</button>)}
            </div>
          </>
        )}
        {passo.id === "nome" && (
          <>
            <label className="campo">Nome<input value={r.nome} onChange={(e) => mud({ nome: e.target.value })} placeholder={tipo === "shikai" ? "Nome da Zanpakutou na Shikai" : tipo === "resurreccion" ? "Ex.: Pantera" : tipo === "vollstandig" ? "Ex.: Vollständig do Atirador" : "Nome verdadeiro da Zanpakutou"} /></label>
            <label className="campo">{tipo === "vollstandig" ? "Frase de liberação" : "Comando"}<input value={r.comando} onChange={(e) => mud({ comando: e.target.value })} placeholder={tipo === "shikai" ? "Ex.: Reduza tudo a cinzas, (nome)" : tipo === "bankai" ? "Ex.: Bankai, (nome)" : tipo === "resurreccion" ? "Ex.: Rasgue o silêncio, Pantera." : "Ex.: Quincy Vollständig"} /></label>
          </>
        )}

        {((passo.id === "aparencia" && tipo === "vollstandig") || (passo.id === "conceito" && tipo !== "shikai")) && TEMAS[tipo] && (
          <div className="temas">
            <p className="ajuda">Temas prontos: toque para preencher a aparência{tipo === "vollstandig" ? "" : " e o ponto fraco"} com uma ideia pronta. Dá para mudar tudo depois.</p>
            <div className="opcoes-grandes">
              {TEMAS[tipo]!.map((t: Tema) => (
                <button key={t.id} type="button" className="opcao" onClick={() => mud({ aparencia: t.aparencia, ...(t.pontoFraco && !r.pontoFraco ? { pontoFraco: t.pontoFraco } : {}), ...(t.traco && !r.traco ? { traco: t.traco } : {}) })}>
                  <b>{t.nome}</b>
                  <small>{t.ideia}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {passo.id === "aparencia" && (
          <>
            <label className="campo">Aparência<textarea rows={4} value={r.aparencia} onChange={(e) => mud({ aparencia: e.target.value })} /></label>
            <p className="ajuda">Toque para acrescentar uma ideia:</p>
            <div className="chips">
              {APARENCIA[tipo].map((t) => <button key={t} type="button" className="chip chip-btn" onClick={() => anexa("aparencia", t)}>{t}</button>)}
            </div>
          </>
        )}

        {passo.id === "traco" && (
          <>
            <p className="ajuda">Você pode ter até {MAX_TRACOS} traços ({tracos.length}/{MAX_TRACOS}). Toque numa sugestão para adicionar.</p>
            {tracos.map((t, k) => (
              <div className="hab-edit" key={k}>
                <textarea rows={2} value={t} onChange={(e) => gravaTracos(tracos.map((x, j) => (j === k ? e.target.value.replace(/\n/g, " ") : x)))} aria-label={`Traço ${k + 1}`} />
                <button type="button" className="link-perigo" onClick={() => gravaTracos(tracos.filter((_, j) => j !== k))}>Remover</button>
              </div>
            ))}
            {tracos.length < MAX_TRACOS && (
              <button type="button" className="btn btn-paper" onClick={() => gravaTracos([...tracos, "Novo traço: descreva aqui."])}>+ Traço em branco</button>
            )}
            <p className="ajuda">Sugestões balanceadas:</p>
            <div className="chips">
              {TRACOS.map((t) => {
                const tem = tracos.includes(t);
                return <button key={t} type="button" className="chip chip-btn" disabled={tem || tracos.length >= MAX_TRACOS} onClick={() => gravaTracos([...tracos, t])}>{t}</button>;
              })}
            </div>
          </>
        )}

        {passo.id === "canal" && (
          <>
            <label className="campo">Canalizador<input value={r.canalizador} onChange={(e) => mud({ canalizador: e.target.value })} /></label>
            <div className="chips">
              {[...CANALIZADORES, ...CANALIZADORES_EXTRA.filter((x) => !CANALIZADORES.includes(x))].map((t) => <button key={t} type="button" className="chip chip-btn" onClick={() => mud({ canalizador: t })}>{t}</button>)}
            </div>
            <SeletorSchrift valor={r.schrift} onChange={(nome) => mud({ schrift: nome })} sugerida={schriftDaFicha(f)?.nome} />
          </>
        )}

        {passo.id === "unicas" && (
          <>
            <p><b>Passivas de todo Quincy:</b></p>
            <ul>{VOLL_PASSIVAS.map((t) => <li key={t}>{t}</li>)}</ul>
            <p><b>Habilidades únicas: {usados} de {limite}</b></p>
            {HAB_UNICAS.map((h) => {
              const n = r.picks[h.id] ?? 0;
              return (
                <div className="pick" key={h.id}>
                  <div><b>{h.nome}</b><small>{h.texto}</small></div>
                  <div className="pick-passo">
                    <button type="button" className="btn-mini" onClick={() => mudarPick(h.id, -1)} disabled={n === 0} aria-label={`Tirar ${h.nome}`}>−</button>
                    <span>{n}</span>
                    <button type="button" className="btn-mini" onClick={() => mudarPick(h.id, 1, h.unica)} disabled={usados >= limite || (h.unica && n >= 1)} aria-label={`Escolher ${h.nome}`}>+</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {passo.id === "acoes" && (
          <>
            {tipo === "resurreccion" && assinatura && (
              <button type="button" className="btn btn-paper" onClick={incluirAssinatura}>Incluir a técnica de assinatura: {assinatura[1]}</button>
            )}
            {tipo === "segunda" && f.formas.resurreccion && (
              <button type="button" className="btn btn-paper" onClick={() => {
                const antigas = habilidadesDaForma(f.formas.resurreccion!).filter((h) => !r.habilidades.some((x) => x.nome === `${h.nome} (Segunda Etapa)`));
                mud({ habilidades: [...r.habilidades, ...antigas.slice(0, Math.max(0, maxHab - r.habilidades.length)).map((h) => ({ ...h, id: novoId(), nome: `${h.nome} (Segunda Etapa)`, pr: h.pr ? Math.round(h.pr * 1.25) : h.pr, custo: h.pr ? `${Math.round(h.pr * 1.25)} PR` : h.custo }))] });
              }}>Trazer as técnicas da minha Resurrección (custo +25%)</button>
            )}
            <label className="campo">Atributo usado no dano dos modelos
              <select value={atr} onChange={(e) => setAtr(e.target.value)}>
                {ATRIBUTOS_DANO.map((a) => <option key={a.v} value={a.v}>{a.n}</option>)}
              </select>
            </label>
            <p className="ajuda">Toque num modelo para adicionar. O dano já considera o seu nível. Limite: {r.habilidades.length}/{maxHab} {cheio ? "(remova uma para trocar)" : ""}</p>
            <div className="chips">
              {lista.map((h) => <button key={h.nome} type="button" className="chip chip-btn" disabled={cheio || jaTem(h.nome)} onClick={() => addHab(h)}>{h.nome} · {h.acao}{h.pr ? ` · ${h.pr} PR` : ""}</button>)}
              <button type="button" className="chip chip-btn" disabled={cheio} onClick={() => addHab({ id: "", nome: "", texto: "", custo: "", acao: "Ação" })}>+ Em branco</button>
            </div>
            {r.habilidades.map((h) => (
              <div className="hab-edit" key={h.id}>
                <div className="linha-edit">
                  <input value={h.nome} onChange={(e) => habil(h.id, { nome: e.target.value })} placeholder="Nome" aria-label="Nome" />
                  <input value={h.acao} onChange={(e) => habil(h.id, { acao: e.target.value })} placeholder="Ação" aria-label="Ação" />
                  <input type="number" min={0} value={h.pr ?? ""} onChange={(e) => { const v = e.target.value === "" ? undefined : Number(e.target.value); habil(h.id, { pr: v, custo: v ? `${v} PR` : "" }); }} placeholder="PR" aria-label="PR" />
                  <input value={h.dano ?? ""} onChange={(e) => habil(h.id, { dano: e.target.value })} placeholder="Dano" aria-label="Dano" />
                </div>
                <textarea rows={2} value={h.texto} onChange={(e) => habil(h.id, { texto: e.target.value })} aria-label="O que faz" />
                <button type="button" className="link-perigo" onClick={() => mud({ habilidades: r.habilidades.filter((x) => x.id !== h.id) })}>Remover</button>
              </div>
            ))}
          </>
        )}

        {passo.id === "custo" && tipo === "shikai" && (
          <label className="campo">Custo de liberação (3 a 10 PR)<input type="number" min={3} max={10} value={r.custo} onChange={(e) => mud({ custo: Number(e.target.value) })} /></label>
        )}
        {passo.id === "custo" && tipo !== "shikai" && (
          <>
            <div className="duas">
              <label className="campo">Custo de liberação (PR)<input type="number" min={20} max={80} value={r.custo} onChange={(e) => mud({ custo: Number(e.target.value) })} /></label>
              <label className="campo">Duração<input value={r.duracao} onChange={(e) => mud({ duracao: e.target.value })} /></label>
            </div>
            <p className="ajuda">Referência do livro: 40 PR para Bankais mais simples, 60 para as completas e 80 para as mais poderosas.</p>
          </>
        )}

        {passo.id === "fraqueza" && (
          <>
            <label className="campo">Ponto fraco<textarea rows={3} value={r.pontoFraco} onChange={(e) => mud({ pontoFraco: e.target.value })} /></label>
            <p className="ajuda">Sugestões:</p>
            <div className="chips">
              {[...FRAQUEZAS[tipo], ...FRAQUEZAS_EXTRA[tipo]].map((t) => <button key={t} type="button" className="chip chip-btn" onClick={() => mud({ pontoFraco: t })}>{t}</button>)}
            </div>
          </>
        )}

        {passo.id === "revisao" && (
          <>
            <h3>{r.nome || "(sem nome)"}</h3>
            {r.comando && <p><i>“{r.comando}”</i></p>}
            {r.aparencia && <p>{r.aparencia}</p>}
            {r.traco && <p className="quebra"><b>Traços:</b>{"\n"}{r.traco}</p>}
            {r.canalizador && <p><b>Canalizador:</b> {r.canalizador}</p>}
            {tipo === "shikai" && <p><b>{r.categoria || "Sem categoria"}</b> · {r.custo} PR</p>}
            {tipo === "bankai" && <p><b>{r.estilo || "Tipo não escolhido"}</b> · {r.custo} PR · {r.duracao}</p>}
            {Object.keys(r.picks).length > 0 && (
              <ul>{Object.entries(r.picks).map(([id, n]) => <li key={id}>{HAB_UNICAS.find((h) => h.id === id)?.nome} ({n}x)</li>)}</ul>
            )}
            {r.habilidades.map((h) => <p key={h.id}><b>{h.nome}</b> ({[h.acao, h.custo].filter(Boolean).join(", ")}): {h.texto}</p>)}
            {r.pontoFraco && <p><b>Ponto fraco:</b> {r.pontoFraco}</p>}
            {erros.length > 0 && <ul className="avisos">{erros.map((e) => <li key={e}>{e}</li>)}</ul>}
            <div className="assistente-fim">
              <button type="button" className="btn" disabled={!r.nome.trim()} onClick={onSalvar}>Salvar {TIPO_FORMA_NOME[tipo]}</button>
              <button type="button" className="btn btn-paper" onClick={onEditarTudo}>Editar tudo em uma tela</button>
            </div>
          </>
        )}
      </div>

      <div className="assistente-nav">
        <button type="button" className="btn btn-paper" disabled={i === 0} onClick={() => setI(i - 1)}>Voltar</button>
        {i < passos.length - 1 && <button type="button" className="btn" onClick={() => setI(i + 1)}>Próximo</button>}
      </div>
    </div>
  );
}
