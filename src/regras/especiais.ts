/* Técnicas especiais e interações especiais.
   Uma técnica especial cria uma coisa em jogo (clones, invocações, uma marca, uma carga de energia). Ela SÓ funciona se tiver ao menos
   uma interação especial ligada, que diz o que fazer com ela (passo entre clones, Gran Rey Cero junto da energia…).
   Uma técnica pode ter várias interações; cada interação serve a uma técnica. Ação e característica comum se ligam de forma opcional;
   técnica e interação especial, de forma obrigatória. Só tipos (import type) vêm de efeitos-forma, para não fazer ciclo. */
import type { Efeito, InstEfeito } from "./efeitos-forma";
import type { Ficha } from "./ficha";
import { vagasEspeciais, type DadosCarac, type SubAcao } from "./cartoes";
import type { CaracArmaId } from "./arma-forma";

/* ---------------- Catálogo ---------------- */

/** Em que grupo a técnica aparece na galeria (só para a tela). */
export type GrupoTecnica = "Criaturas" | "Campo e vínculo" | "Marcas e poderes";
export const GRUPOS_TECNICA: GrupoTecnica[] = ["Criaturas", "Campo e vínculo", "Marcas e poderes"];

export interface DefTecnica {
  id: string;
  nome: string;
  grupo: GrupoTecnica;
  texto: string;
  /** características da arma de que a técnica precisa (basta uma). Sem o campo, qualquer arma serve. */
  armaReq?: CaracArmaId[];
  compilar: () => Efeito[];
}

export interface DefInteracao {
  id: string;
  nome: string;
  texto: string;
  /** ids das técnicas a que serve; vazio: serve a qualquer técnica */
  com: string[];
  /** tipos de ação a que também pode ser ligada (vazio: não se liga a ação) */
  vale: SubAcao[];
  /** só para Visored e Hollow */
  soHollow?: boolean;
  /** só nasce na abertura de ficha antiga (interação automática): não aparece na galeria */
  legado?: boolean;
  /** características da arma de que a interação precisa (basta uma). Sem o campo, qualquer arma serve. */
  armaReq?: CaracArmaId[];
  compilar: () => Efeito[];
}

export const TECNICAS: DefTecnica[] = [
  {
    id: "clones", grupo: "Criaturas", nome: "Clones",
    texto: "Cria clones de reiatsu (até metade da proficiência). Têm 1 PV, somem ao ser atingidos e o golpe real chega mesmo se o alvo esquivar do clone. Cria o botão “Criar clones”, que os coloca na aba de invocações.",
    compilar: () => [
      { k: "invoca", nome: "Clone de reiatsu", tipo: "clone", max: "[PROF]/2", pv: 1, cr: "10+[PROF]+[DES]", acerto: "[PROF]+[DES]", dano: "1d8+[PROF]", custoPr: 2, texto: "Some ao ser atingido. O ataque do clone chega atrasado, mesmo que o alvo esquive." },
      { k: "gera", botao: { rotulo: "Criar clones", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "invocacao", armaReq: ["invocada", "elemental"], grupo: "Criaturas", nome: "Invocação",
    texto: "Chama até 2 criaturas do tema da forma, que atacam por você e somem ao chegar a 0 PV. Cria o botão “Invocar”.",
    compilar: () => [
      { k: "invoca", nome: "Invocação", tipo: "invocacao", max: 2, pv: "[PROF]*2", cr: "10+[PROF]", acerto: "[PROF]+[FOR]", dano: "[PROF]d6", custoPr: 4, texto: "Criatura do tema da forma." },
      { k: "gera", botao: { rotulo: "Invocar", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "invocacao-grande", armaReq: ["invocada", "elemental"], grupo: "Criaturas", nome: "Invocação grande",
    texto: "Chama uma criatura grande e resistente (só uma por vez). Cria o botão “Invocar criatura grande”.",
    compilar: () => [
      { k: "invoca", nome: "Criatura grande", tipo: "invocacao", max: 1, pv: "[PROF]*6", cr: "12+[PROF]", acerto: "[PROF]+[FOR]", dano: "[PROF]d8+[PROF]", custoPr: 8, texto: "Criatura grande do tema da forma." },
      { k: "gera", botao: { rotulo: "Invocar criatura grande", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "invocacao-enxame", armaReq: ["enxame", "multiplas-laminas"], grupo: "Criaturas", nome: "Invocação em enxame",
    texto: "Chama um enxame de criaturas minúsculas, até a proficiência de uma vez. Cada uma tem 1 PV e some ao ser atingida, mas ataca por você. Cria o botão “Chamar o enxame”. Precisa de uma interação do enxame.",
    compilar: () => [
      { k: "invoca", nome: "Enxame", tipo: "invocacao", max: "[PROF]", pv: 1, cr: "10+[DES]", acerto: "[PROF]+[DES]", dano: "1d4+[PROF]", custoPr: 1, texto: "Criatura minúscula do tema da forma. Some ao ser atingida." },
      { k: "gera", botao: { rotulo: "Chamar o enxame", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "invocacao-regenerativa", armaReq: ["invocada", "enxame"], grupo: "Criaturas", nome: "Invocação que se regenera",
    texto: "Chama até 2 criaturas que recuperam PV iguais à proficiência no início do seu turno. Cria o botão “Invocar criatura regenerativa”. Precisa de uma interação da regeneração.",
    compilar: () => [
      { k: "invoca", nome: "Criatura regenerativa", tipo: "invocacao", max: 2, pv: "[PROF]*2", cr: "10+[PROF]", acerto: "[PROF]+[FOR]", dano: "[PROF]d6", custoPr: 4, texto: "No início do seu turno, a criatura recupera PV iguais à proficiência." },
      { k: "gera", botao: { rotulo: "Invocar criatura regenerativa", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "invocacao-mutavel", armaReq: ["invocada"], grupo: "Criaturas", nome: "Invocação que se transforma",
    texto: "Chama uma criatura que muda de forma e vira arma ou escudo para você. Só uma por vez. Cria o botão “Invocar criatura mutável”. Precisa de uma interação da transformação.",
    compilar: () => [
      { k: "invoca", nome: "Criatura mutável", tipo: "invocacao", max: 1, pv: "[PROF]*3", cr: "11+[PROF]", acerto: "[PROF]+[FOR]", dano: "[PROF]d6", custoPr: 5, texto: "Pode virar arma ou escudo de reiatsu para você (veja as interações)." },
      { k: "gera", botao: { rotulo: "Invocar criatura mutável", ritmo: "bonus", faz: "invocar" } },
    ],
  },
  {
    id: "dominio", armaReq: ["elemental", "invocada", "foco"], grupo: "Campo e vínculo", nome: "Domínio (campo)",
    texto: "Abre um campo de 9 metros de raio em volta de você, que dura até o fim da cena ou até você sair dele. As regras do campo vêm das interações. Cria o botão “Abrir o domínio” (uma ação). Precisa de uma interação do domínio.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Abrir o domínio", ritmo: "acao", faz: "texto" } }],
  },
  {
    id: "vinculo", armaReq: ["corrente", "segmentavel", "invocada", "contato"], grupo: "Campo e vínculo", nome: "Vínculo",
    texto: "Liga você a uma criatura a até 18 metros (ela faz salvaguarda de Mente para resistir). O vínculo dura até o fim da cena e só existe com uma criatura por vez. Cria o botão “Criar vínculo”. Precisa de uma interação do vínculo.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Criar vínculo", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "copiar", grupo: "Marcas e poderes", nome: "Copiar poderes",
    texto: "Reação: ao ver uma criatura usar uma técnica, você copia o poder dela por turnos iguais à proficiência. Cria o botão “Copiar poder”. Precisa de uma interação da cópia.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Copiar poder", ritmo: "reacao", faz: "texto" } }],
  },
  {
    id: "marcar-detonar", armaReq: ["projetil", "arremesso", "enxame", "foco", "elemental"], grupo: "Marcas e poderes", nome: "Marcar e detonar",
    texto: "Ação bônus: coloca uma marca de reiatsu numa criatura a até 18 metros (até a proficiência de marcas ao mesmo tempo). As marcas só fazem algo quando você as detona. Cria o botão “Marcar para detonar”. Precisa de uma interação das marcas.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Marcar para detonar", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "marcar-alvo", grupo: "Marcas e poderes", nome: "Marcar alvo",
    texto: "Ação bônus: marca uma criatura a até 18 metros. O primeiro ataque de cada aliado contra ela no turno causa 1d6 de dano a mais. Cria o botão “Marcar alvo”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Marcar alvo", ritmo: "bonus", faz: "texto", ref: "1d6" } }],
  },
  {
    id: "energia", armaReq: ["projetil", "foco", "longo-alcance", "elemental"], grupo: "Marcas e poderes", nome: "Ataque com energia",
    texto: "Ação bônus: você junta energia (Cero, flecha de reishi, onda de reiatsu) e a sua próxima ação de ataque à distância sai carregada, com +6 metros de alcance. Cria o botão “Juntar energia”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Juntar energia", ritmo: "bonus", faz: "texto" } }],
  },
];

export const INTERACOES: DefInteracao[] = [
  {
    id: "comandar-invocacao", nome: "Comandar invocação", com: ["invocacao", "invocacao-grande"], vale: [], legado: true,
    texto: "Interação automática das fichas antigas. Ação bônus: você manda a criatura chamada atacar ou andar. Mantém a técnica de invocação funcionando como antes. Cria o botão “Comandar invocação”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Comandar invocação", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "usar-marca", nome: "Usar a marca", com: ["marcar-alvo"], vale: [], legado: true,
    texto: "Interação automática das fichas antigas. Mantém a técnica Marcar alvo funcionando como antes; não cria botão novo.",
    compilar: () => [],
  },
  {
    id: "passo-clones", nome: "Passo entre clones", com: ["clones"], vale: [],
    texto: "Ação bônus: você troca de lugar com um dos seus clones a até 18 metros, como um teleporte. O clone some e o seu próximo ataque no turno ganha vantagem. Serve à técnica Clones.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Passo entre clones", ritmo: "bonus", faz: "trocar", ref: "clone" } }],
  },
  {
    id: "absorver-clones", armaReq: ["multiplas-laminas"], nome: "Juntar clones à lâmina", com: ["clones"], vale: ["ataque", "area"],
    texto: "Ação bônus: até 2 clones se juntam à sua arma. O próximo golpe da ação ligada (a técnica final, por exemplo) causa +1d10 por clone juntado. Serve à técnica Clones.",
    compilar: () => [
      { k: "gera", botao: { rotulo: "Juntar clones à lâmina", ritmo: "bonus", faz: "absorver", ref: "clone" } },
      { k: "liga", com: "clone", faz: "absorver" },
    ],
  },
  {
    id: "lancar-enxame", armaReq: ["enxame", "multiplas-laminas"], nome: "Enxame sobre o alvo", com: ["invocacao-enxame"], vale: [],
    texto: "Ação bônus: o enxame cobre uma criatura a até 18 metros. Ela sofre a proficiência em d4 de dano e faz salvaguarda de Destreza (CD 8 + proficiência + atributo); se falhar, fica com desvantagem nos ataques até o fim do próximo turno dela. Serve à técnica Invocação em enxame. Cria o botão “Lançar o enxame”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Lançar o enxame", ritmo: "bonus", faz: "texto", ref: "[PROF]d4" } }],
  },
  {
    id: "dispersar-enxame", armaReq: ["enxame", "multiplas-laminas"], nome: "Dispersar o enxame", com: ["invocacao-enxame"], vale: [],
    texto: "Reação: quando um ataque em área atinge você, o enxame se espalha à sua volta e você sofre só metade do dano. Metade das criaturas do enxame some. Serve à técnica Invocação em enxame. Cria o botão “Dispersar o enxame”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Dispersar o enxame", ritmo: "reacao", faz: "texto" } }],
  },
  {
    id: "regenerar-invocacao", armaReq: ["invocada", "enxame"], nome: "Regenerar a criatura", com: ["invocacao-regenerativa"], vale: [],
    texto: "Ação bônus: uma criatura chamada a até 18 metros fecha as feridas e recupera a proficiência em d8 de PV. Serve à técnica Invocação que se regenera. Cria o botão “Regenerar a criatura”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Regenerar a criatura", ritmo: "bonus", faz: "texto", ref: "[PROF]d8" } }],
  },
  {
    id: "renascer-invocacao", armaReq: ["invocada", "enxame"], nome: "Renascer das cinzas", com: ["invocacao-regenerativa"], vale: [],
    texto: "Reação: quando uma criatura chamada chega a 0 PV, ela volta com metade dos PV dela. Só uma vez por cena. Serve à técnica Invocação que se regenera. Cria o botão “Fazer renascer”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Fazer renascer", ritmo: "reacao", faz: "texto" } }],
  },
  {
    id: "mutavel-arma", armaReq: ["invocada"], nome: "Criatura vira arma", com: ["invocacao-mutavel"], vale: [],
    texto: "Ação bônus: a criatura chamada vira uma arma de reiatsu na sua mão e o seu próximo ataque no turno causa 1d10 de dano a mais. Serve à técnica Invocação que se transforma. Cria o botão “Criatura vira arma”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Criatura vira arma", ritmo: "bonus", faz: "texto", ref: "1d10" } }],
  },
  {
    id: "mutavel-escudo", armaReq: ["invocada", "escudo"], nome: "Criatura vira escudo", com: ["invocacao-mutavel"], vale: [],
    texto: "Ação bônus: a criatura chamada vira um escudo de reiatsu e você ganha +2 de CR até o início do seu próximo turno. Serve à técnica Invocação que se transforma. Cria o botão “Criatura vira escudo”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Criatura vira escudo", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "regra-dominio", nome: "Regra do domínio", com: ["dominio"], vale: [],
    texto: "Ação bônus: você impõe uma regra ao campo enquanto ele durar. Escolha uma: terreno difícil para os inimigos, inimigos com -2 de CR, ou você com vantagem nas salvaguardas dentro dele. Serve à técnica Domínio. Cria o botão “Impor a regra do domínio”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Impor a regra do domínio", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "dominio-fere", armaReq: ["elemental", "foco", "invocada"], nome: "Domínio que fere", com: ["dominio"], vale: [],
    texto: "No início do seu turno, cada criatura inimiga dentro do campo sofre a proficiência em d4 de dano de Energia. Serve à técnica Domínio.",
    compilar: () => [{ k: "gatilho", quando: "inicioTurno", faz: { dano: { expr: "[PROF]d4", tipo: "Energia", area: "criaturas inimigas no domínio" } }, rotulo: "Domínio que fere" }],
  },
  {
    id: "vinculo-dano", nome: "Dano compartilhado", com: ["vinculo"], vale: [],
    texto: "Reação: quando você sofre dano, metade dele passa para a criatura ligada a você, sem resistência. Serve à técnica Vínculo. Cria o botão “Passar o dano”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Passar o dano", ritmo: "reacao", faz: "texto" } }],
  },
  {
    id: "vinculo-sentidos", nome: "Elo de sentidos", com: ["vinculo"], vale: [],
    texto: "Ação bônus: você enxerga e ouve pela criatura ligada até o início do seu próximo turno, e ela não consegue se esconder de você. Serve à técnica Vínculo. Cria o botão “Usar o elo”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Usar o elo", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "usar-copia", nome: "Usar o poder copiado", com: ["copiar"], vale: [],
    texto: "Ação: você usa o poder copiado com o seu atributo de ataque. O custo em PR é o do poder original. Serve à técnica Copiar poderes. Cria o botão “Usar o poder copiado”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Usar o poder copiado", ritmo: "acao", faz: "texto" } }],
  },
  {
    id: "guardar-copia", nome: "Guardar a cópia", com: ["copiar"], vale: [],
    texto: "Ação bônus: a cópia passa a durar até o fim da cena, em vez de poucos turnos. Só uma cópia guardada por vez. Serve à técnica Copiar poderes. Cria o botão “Guardar a cópia”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Guardar a cópia", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "detonar-marcas", nome: "Detonar as marcas", com: ["marcar-detonar"], vale: [],
    texto: "Ação: todas as marcas explodem. Cada criatura marcada faz salvaguarda de Destreza (CD 8 + proficiência + atributo) e sofre a proficiência em d6 de dano de Energia por marca (metade no sucesso). Serve à técnica Marcar e detonar. Cria o botão “Detonar as marcas”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Detonar as marcas", ritmo: "acao", faz: "texto", ref: "[PROF]d6" } }],
  },
  {
    id: "marcas-acumulam", nome: "Marcas que acumulam", com: ["marcar-detonar"], vale: [],
    texto: "Ação bônus: soma outra marca na mesma criatura (até 3). Cada marca extra acrescenta 1d6 à detonação. Serve à técnica Marcar e detonar. Cria o botão “Empilhar marca”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Empilhar marca", ritmo: "bonus", faz: "texto", ref: "1d6" } }],
  },
  {
    id: "reforco", nome: "Reforço", com: [], vale: [],
    texto: "Ação bônus: a coisa criada pela técnica se fortalece e o seu próximo ataque no turno causa 2d10 de dano a mais. Serve a qualquer técnica. Cria o botão “Reforço”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Reforço", ritmo: "bonus", faz: "texto", ref: "2d10" } }],
  },
  {
    id: "provocar", nome: "Provocar", com: [], vale: [],
    texto: "Ação bônus: uma criatura a até 18 metros faz salvaguarda de Mente (CD 8 + proficiência + atributo); se falhar, só pode atacar você até o fim do próximo turno dela. Serve a qualquer técnica. Cria o botão “Provocar”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Provocar", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "gran-rey-cero", armaReq: ["foco", "projetil", "longo-alcance"], nome: "Gran Rey Cero junto da energia", com: ["energia"], vale: [], soHollow: true,
    texto: "Para Visored e Hollow. Ação bônus: ao lançar a energia, você solta junto um Gran Rey Cero, com proficiência d8 de dano de Energia a mais, no mesmo alvo ou em linha. Serve à técnica Ataque com energia. Cria o botão “Gran Rey Cero”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Gran Rey Cero", ritmo: "bonus", faz: "texto", ref: "[PROF]d8" } }],
  },
];

/** Interações que o jogador pode escolher na galeria (as automáticas das fichas antigas ficam de fora). */
export const INTERACOES_GALERIA = INTERACOES.filter((i) => !i.legado);
/** Interação automática de cada técnica que veio de ficha antiga. */
export const INTERACAO_PADRAO: Record<string, string> = { clones: "passo-clones", invocacao: "comandar-invocacao", "invocacao-grande": "comandar-invocacao", "marcar-alvo": "usar-marca" };

export const tecnicaPorId = (id: string) => TECNICAS.find((t) => t.id === id);
export const interacaoPorId = (id: string) => INTERACOES.find((t) => t.id === id);

/** Só Visored e Hollow usam o Gran Rey Cero junto da energia. */
export const podeUsarInteracao = (def: DefInteracao, f: Pick<Ficha, "origem" | "classe">) => !def.soHollow || f.origem === "visored" || f.classe === "hueco" || f.classe === "vazio";

/* ---------------- Montar a peça de efeitos ---------------- */

export const ehTecnica = (e: InstEfeito) => e.familia === "tecnica" && !!e.espec;
export const ehInteracao = (e: InstEfeito) => e.familia === "interacao" && !!e.espec;

/** Técnica e interação especial não custam PP da forma: só ocupam vaga. Por isso a peça nova nasce com 0 PP. */
export function instanciarTecnica(def: DefTecnica, id: string): InstEfeito {
  return { id, nome: def.nome, texto: def.texto, efeitos: def.compilar(), pp: 0, familia: "tecnica", espec: { id: def.id } };
}

/** Interação ligada à técnica `tec` (id da peça). Se ela também se liga a uma ação (`vale`), `lig` diz a qual. */
export function instanciarInteracao(def: DefInteracao, tec: string, lig: { liga: DadosCarac["liga"]; acao?: string }, id: string): InstEfeito {
  return {
    id, nome: def.nome, texto: def.texto, efeitos: def.compilar(), pp: 0, familia: "interacao", espec: { id: def.id, tec },
    ...(def.vale.length > 0 ? { carac: { id: def.id, vale: def.vale, liga: lig.liga, ...(lig.acao && lig.liga === "uma" ? { acao: lig.acao } : {}), requer: def.com } } : {}),
  };
}

/* ---------------- Ligações e conferência ---------------- */

/** A interação serve a esta técnica? */
export const interacaoServe = (def: Pick<DefInteracao, "com">, tec: InstEfeito) => def.com.length === 0 || def.com.includes(tec.espec?.id ?? "");

export const tecnicasDe = (efeitos: InstEfeito[]) => efeitos.filter(ehTecnica);
export const interacoesDe = (efeitos: InstEfeito[], tecId: string) => efeitos.filter((e) => ehInteracao(e) && e.espec?.tec === tecId);
/** A técnica a que a interação está ligada (se ela existir e a interação servir a ela). */
export function tecnicaDe(efeitos: InstEfeito[], inter: InstEfeito): InstEfeito | undefined {
  const t = efeitos.find((x) => ehTecnica(x) && x.id === inter.espec?.tec);
  const def = interacaoPorId(inter.espec?.id ?? "");
  return t && (!def || interacaoServe(def, t)) ? t : undefined;
}

/** A peça especial funciona? Técnica só com interação ligada; interação só com técnica. As outras peças sempre valem. */
export function especialFunciona(inst: InstEfeito, todas: InstEfeito[]): boolean {
  if (ehTecnica(inst)) return todas.some((x) => ehInteracao(x) && x.espec?.tec === inst.id && tecnicaDe(todas, x)?.id === inst.id);
  if (ehInteracao(inst)) return !!tecnicaDe(todas, inst) || inst.espec?.antiga === true;
  return true;
}

/** O que falta para a forma poder ser salva (vazio: está tudo certo). Cada item é uma frase pronta para a tela. */
/** Quantas peças ocupam vaga: as que vieram de ficha antiga ou foram postas sozinhas na abertura não contam. */
export const ocupaVaga = (e: InstEfeito) => !e.espec?.antiga && !e.espec?.auto;
/** Quantas peças estão na forma sem ocupar vaga (de ficha antiga ou automáticas), para a tela mostrar "+2". */
export const contarForaDeVaga = (efeitos: InstEfeito[], familia: "tecnica" | "interacao") => efeitos.filter((e) => (familia === "tecnica" ? ehTecnica(e) : ehInteracao(e)) && !ocupaVaga(e)).length;
export const contarVagas = (efeitos: InstEfeito[], familia: "tecnica" | "interacao") => efeitos.filter((e) => (familia === "tecnica" ? ehTecnica(e) : ehInteracao(e)) && ocupaVaga(e)).length;

/**
 * O que falta para a forma poder ser salva (vazio: está tudo certo). Cada item é uma frase pronta para a tela.
 * Só vale para montagens novas e edições do jogador: peça de ficha antiga (marcada `antiga`) e interação automática não travam o salvamento.
 */
export function faltasEspeciais(efeitos: InstEfeito[], tipo: string): string[] {
  const out: string[] = [];
  const v = vagasEspeciais(tipo);
  const tecs = tecnicasDe(efeitos).filter(ocupaVaga);
  const ints = efeitos.filter((e) => ehInteracao(e) && ocupaVaga(e));
  if (tecs.length > v.tec) out.push(`Técnicas especiais demais: ${tecs.length} para ${v.tec} vaga${v.tec === 1 ? "" : "s"}. Tire ${tecs.length - v.tec}.`);
  if (ints.length > v.inter) out.push(`Interações especiais demais: ${ints.length} para ${v.inter} vaga${v.inter === 1 ? "" : "s"}. Tire ${ints.length - v.inter}.`);
  for (const t of tecs) {
    if (!interacoesDe(efeitos, t.id).some((x) => tecnicaDe(efeitos, x)?.id === t.id)) {
      const serve = INTERACOES_GALERIA.filter((i) => interacaoServe(i, t)).map((i) => i.nome);
      out.push(`A técnica especial “${t.nome}” precisa de pelo menos uma interação especial. Monte uma na aba Interações especiais${serve.length ? ` (serve: ${serve.slice(0, 3).join(", ")}${serve.length > 3 ? "…" : ""})` : ""}.`);
    }
  }
  for (const i of ints) {
    if (!tecnicaDe(efeitos, i)) {
      const def = interacaoPorId(i.espec?.id ?? "");
      const nomes = def && def.com.length ? def.com.map((c) => tecnicaPorId(c)?.nome ?? c).join(" ou ") : "qualquer técnica";
      out.push(`A interação especial “${i.nome}” não está ligada a uma técnica especial (serve a: ${nomes}).`);
    }
  }
  return out;
}

/* ---------------- Migração dos 8 cartões que eram características ---------------- */

const ANTIGA_TECNICA: Record<string, string> = { clone: "clones", invocacao: "invocacao", "invocacao-grande": "invocacao-grande", "marcar-alvo": "marcar-alvo" };
const ANTIGA_INTERACAO: Record<string, string> = { "passo-clones": "passo-clones", "absorver-clones": "absorver-clones", reforco: "reforco", provocar: "provocar" };

/**
 * Os 8 cartões de característica que criavam botões, invocações e sinergias viram técnica ou interação especial.
 * Só muda a etiqueta e a ligação: os efeitos e o preço (pp) ficam exatamente como estavam. Cada interação antiga se liga à primeira técnica
 * em que ela serve. Toda peça convertida ganha `antiga` (não ocupa vaga nem trava o salvamento). A técnica convertida que ficou sem nenhuma
 * interação ganha a interação padrão mais coerente, marcada `auto`, com 0 PP: assim ela continua funcionando em jogo como antes, e o jogador
 * vê a interação na aba e pode trocá-la ou tirá-la. Interação antiga sem técnica continua funcionando sozinha. Idempotente: o que já migrou não é tocado.
 */
export function migrarEspeciais(lista: InstEfeito[]): { lista: InstEfeito[]; mudou: number; auto: number } {
  let mudou = 0;
  const marcadas = lista.map((e): InstEfeito => {
    const c = e.carac;
    if (e.familia !== "carac" || !c) return e;
    if (ANTIGA_TECNICA[c.id]) { mudou++; const { carac: _c, ...resto } = e; return { ...resto, familia: "tecnica", espec: { id: ANTIGA_TECNICA[c.id], antiga: true } }; }
    if (ANTIGA_INTERACAO[c.id]) { mudou++; const { carac: _c, ...resto } = e; return { ...resto, familia: "interacao", espec: { id: ANTIGA_INTERACAO[c.id], antiga: true }, ...(c.vale.length > 0 ? { carac: c } : {}) }; }
    return e;
  });
  if (mudou === 0) return { lista, mudou: 0, auto: 0 };
  const tecs = marcadas.filter(ehTecnica);
  const ligadas = marcadas.map((e) => {
    if (!ehInteracao(e) || e.espec?.tec) return e;
    const def = interacaoPorId(e.espec!.id);
    const t = def && tecs.find((x) => interacaoServe(def, x));
    return t ? { ...e, espec: { ...e.espec!, tec: t.id } } : e;
  });
  // técnica antiga sem interação: ganha a interação padrão (automática, 0 PP, sem mexer em nenhum número)
  const extras: InstEfeito[] = [];
  for (const t of ligadas.filter((x) => ehTecnica(x) && x.espec?.antiga)) {
    if (interacoesDe(ligadas, t.id).some((x) => tecnicaDe(ligadas, x)?.id === t.id)) continue;
    const def = interacaoPorId(INTERACAO_PADRAO[t.espec!.id] ?? "");
    if (!def) continue;
    const nova = instanciarInteracao(def, t.id, { liga: "todas" }, `${t.id}-auto`);
    extras.push({ ...nova, pp: 0, espec: { ...nova.espec!, auto: true } });
  }
  return { lista: [...ligadas, ...extras], mudou, auto: extras.length };
}
