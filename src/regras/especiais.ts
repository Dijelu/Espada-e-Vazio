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
  {
    id: "acumular-poder", grupo: "Marcas e poderes", nome: "Acumular poder",
    texto: "Reação: sempre que você sofre dano ou anda pelo menos 6 metros no turno, ganha 1 carga (até a proficiência, até o fim da cena). Cria o botão “Ganhar carga”. Precisa de uma interação das cargas.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Ganhar carga", ritmo: "reacao", faz: "texto" } }],
  },
  {
    id: "absorver-devolver", grupo: "Marcas e poderes", nome: "Absorver e devolver",
    texto: "Reação: a lâmina absorve o golpe que o atingiria: o dano cai em proficiência d8, e o valor reduzido fica guardado até o fim da cena. Cria o botão “Absorver o golpe”. Precisa de uma interação do que foi guardado.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Absorver o golpe", ritmo: "reacao", faz: "texto", ref: "[PROF]d8" } }],
  },
  {
    id: "sobrecarga", grupo: "Marcas e poderes", nome: "Sobrecarga",
    texto: "Ação bônus: você libera mais poder do que o corpo aguenta. Até o fim do seu próximo turno, os seus ataques causam 1d6 de dano a mais, mas no início de cada turno seu você sofre proficiência d4 de dano, que nada reduz. Cria o botão “Sobrecarregar”. Precisa de uma interação da sobrecarga.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Sobrecarregar", ritmo: "bonus", faz: "texto", ref: "1d6" } }],
  },
  {
    id: "corte-espaco", grupo: "Marcas e poderes", nome: "Corte no espaço",
    texto: "Ação bônus: a lâmina corta o próprio espaço. Até o fim do turno, a sua próxima ação de ataque corpo a corpo alcança uma criatura a até 12 metros, sem ser barrada por cobertura nem por barreira. Cria o botão “Cortar o espaço”. Precisa de uma interação do corte.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Cortar o espaço", ritmo: "bonus", faz: "texto" } }],
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
    id: "dominio-condicao", nome: "Campo que debilita", com: ["dominio"], vale: [],
    texto: "Ao abrir o campo, escolha uma condição leve (Surdo, Distorcido, Amedrontado, Caído…). No início do turno de cada criatura inimiga dentro dele, ela faz salvaguarda de Constituição; se falhar, fica com essa condição até o fim do turno dela. Serve à técnica Domínio.",
    compilar: () => [{ k: "texto", t: "Campo que debilita: no início do turno de cada inimigo dentro do campo, salvaguarda de Constituição; se falhar, fica com a condição leve escolhida ao abrir o campo até o fim do turno dele." }],
  },
  {
    id: "dominio-sentidos", nome: "Domo sem sentidos", com: ["dominio"], vale: [],
    texto: "No início do turno de cada criatura inimiga dentro do campo, ela faz salvaguarda de Constituição; se falhar, fica Cega e Surda até o fim do turno dela. Serve à técnica Domínio.",
    compilar: () => [{ k: "texto", t: "Domo sem sentidos: no início do turno de cada inimigo dentro do campo, salvaguarda de Constituição; se falhar, fica Cego e Surdo até o fim do turno dele." }],
  },
  {
    id: "vinculo-dano", nome: "Dano compartilhado", com: ["vinculo"], vale: [],
    texto: "Reação: quando você sofre dano, metade dele passa para a criatura ligada a você, sem resistência. Serve à técnica Vínculo. Cria o botão “Passar o dano”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Passar o dano", ritmo: "reacao", faz: "texto" } }],
  },
  {
    id: "vinculo-cura", nome: "Cura compartilhada", com: ["vinculo"], vale: [],
    texto: "Quando você ou a criatura ligada recupera PV, a outra recupera o mesmo valor, uma vez por turno. Serve à técnica Vínculo.",
    compilar: () => [{ k: "texto", t: "Cura compartilhada: quando você ou a criatura ligada recupera PV, a outra recupera o mesmo valor, uma vez por turno." }],
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
  {
    id: "descarregar-poder", nome: "Descarregar as cargas", com: ["acumular-poder"], vale: [],
    texto: "Ação bônus, ao acertar um golpe: gasta todas as cargas e o golpe causa 1d6 de dano a mais por carga gasta. Serve à técnica Acumular poder. Cria o botão “Descarregar as cargas”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Descarregar as cargas", ritmo: "bonus", faz: "texto", ref: "1d6" } }],
  },
  {
    id: "devolver-absorvido", nome: "Devolver o absorvido", com: ["absorver-devolver"], vale: [],
    texto: "Ação bônus: devolve o que a lâmina guardou a uma criatura a até 18 metros, que faz salvaguarda de Destreza (CD 8 + proficiência + atributo); dano igual ao valor guardado (no máximo 4 × proficiência), metade no sucesso. O valor guardado zera. Serve à técnica Absorver e devolver. Cria o botão “Devolver o absorvido”.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Devolver o absorvido", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "furia-sem-distincao", nome: "Fúria sem distinção", com: ["sobrecarga"], vale: [],
    texto: "Enquanto a Sobrecarga durar, você fica imune a Amedrontado e a cada ataque seu contra quem o feriu no último turno tem vantagem; em troca, os seus golpes em área também atingem aliados. Serve à técnica Sobrecarga.",
    compilar: () => [{ k: "texto", t: "Fúria sem distinção: durante a Sobrecarga, imune a Amedrontado e com vantagem contra quem o feriu no último turno; os seus golpes em área também atingem aliados." }],
  },
  {
    id: "fenda-aberta", nome: "Fenda aberta", com: ["corte-espaco"], vale: [],
    texto: "Depois do corte, a fenda fica aberta até o fim do seu próximo turno: você pode atravessá-la como parte do movimento, até 12 metros na direção do corte, sem provocar ataques. Serve à técnica Corte no espaço.",
    compilar: () => [{ k: "texto", t: "Fenda aberta: até o fim do próximo turno, você atravessa a fenda do corte como parte do movimento (até 12 m na direção do corte), sem provocar ataques." }],
  },
  {
    id: "peso-dobrado", nome: "Peso dobrado", com: ["marcar-alvo"], vale: [],
    texto: "Cada vez que você acerta a criatura marcada, ela ganha 1 peso (até a proficiência): -1,5 metro de deslocamento por peso, e com 3 pesos ou mais fica com desvantagem em salvaguardas de Destreza. Os pesos somem quando a marca termina. Serve à técnica Marcar alvo.",
    compilar: () => [{ k: "texto", t: "Peso dobrado: cada acerto seu na criatura marcada soma 1 peso (até a proficiência): -1,5 m de deslocamento por peso; com 3 ou mais, desvantagem em salvaguardas de Destreza. Somem quando a marca termina." }],
  },
  {
    id: "dominio-cura", nome: "Campo que restaura", com: ["dominio"], vale: [],
    texto: "No início do turno de cada aliado dentro do campo, ele recupera PV iguais à proficiência. Serve à técnica Domínio.",
    compilar: () => [{ k: "texto", t: "Campo que restaura: no início do turno de cada aliado dentro do campo, ele recupera PV iguais à proficiência." }],
  },
  {
    id: "vinculo-prende", nome: "Elo que prende", com: ["vinculo"], vale: [],
    texto: "A criatura ligada a você não pode se afastar mais de 9 metros de você; se tentar, faz salvaguarda de Força e, se falhar, o movimento termina. Serve à técnica Vínculo.",
    compilar: () => [{ k: "texto", t: "Elo que prende: a criatura ligada não se afasta mais de 9 m de você; se tentar, salvaguarda de Força, e na falha o movimento termina." }],
  },
  {
    id: "copia-dupla", nome: "Cópia dupla", com: ["copiar"], vale: [],
    texto: "Você guarda até duas cópias ao mesmo tempo, e não só uma. Serve à técnica Copiar poderes.",
    compilar: () => [{ k: "texto", t: "Cópia dupla: você guarda até duas cópias de poderes ao mesmo tempo." }],
  },
  {
    id: "marca-revela", nome: "Marca que revela", com: ["marcar-alvo", "marcar-detonar"], vale: [],
    texto: "A criatura marcada não pode ficar invisível nem se esconder de você, e os seus aliados têm vantagem para achá-la. Serve às técnicas de marca.",
    compilar: () => [{ k: "texto", t: "Marca que revela: a criatura marcada não fica invisível nem se esconde de você; os aliados têm vantagem para achá-la." }],
  },
  {
    id: "detonar-cadeia", nome: "Detonação em cadeia", com: ["marcar-detonar"], vale: [],
    texto: "Ao detonar uma marca, as criaturas a 3 metros dela sofrem metade do dano (salvaguarda de Destreza anula). Serve à técnica Marcar e detonar.",
    compilar: () => [{ k: "texto", t: "Detonação em cadeia: ao detonar uma marca, as criaturas a 3 m dela sofrem metade do dano; salvaguarda de Destreza anula." }],
  },
  {
    id: "clones-explodem", nome: "Clones que explodem", com: ["clones"], vale: [],
    texto: "Quando um clone seu é destruído, ele explode: as criaturas a 3 metros sofrem proficiência d6 de dano (salvaguarda de Destreza, metade no sucesso). Serve à técnica Clones.",
    compilar: () => [{ k: "texto", t: "Clones que explodem: ao ser destruído, um clone explode; as criaturas a 3 m sofrem [PROF]d6 (salvaguarda de Destreza, metade)." }],
  },
  {
    id: "escudo-vivo", nome: "Escudo vivo", com: ["invocacao", "invocacao-grande", "clones", "invocacao-enxame"], vale: [],
    texto: "Reação: quando você ou um aliado a até 3 metros seria atingido, uma criatura, clone ou parte do enxame se joga na frente e leva o golpe no lugar. Ela some se o dano a reduzir a 0 PV. Serve às técnicas de criatura.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Jogar a criatura na frente", ritmo: "reacao", faz: "texto" } }],
  },
  {
    id: "energia-dupla", nome: "Energia em dobro", com: ["energia"], vale: [],
    texto: "Você pode guardar até duas cargas de energia ao mesmo tempo; gastas as duas juntas, a ação sai com +12 metros de alcance em vez de +6. Serve à técnica Ataque com energia.",
    compilar: () => [{ k: "texto", t: "Energia em dobro: guarde até duas cargas; gastas juntas, a ação sai com +12 m de alcance." }],
  },
  {
    id: "explosao-em-cadeia", nome: "Explosão em cadeia", com: ["marcar-detonar", "clones", "invocacao-enxame", "energia"], vale: [],
    texto: "Combo: uma vez por turno, quando uma marca é detonada, um clone é destruído ou um enxame é lançado, a próxima ação de ataque sua no mesmo turno causa 1d6 de dano a mais. Serve a marcas, clones, enxame e energia.",
    compilar: () => [{ k: "texto", t: "Explosão em cadeia: 1 vez por turno, ao detonar uma marca, destruir um clone, lançar o enxame ou gastar energia, a próxima ação de ataque sua no turno causa 1d6 a mais." }],
  },
  {
    id: "sangue-partilhado", nome: "Sangue partilhado", com: ["vinculo", "dominio"], vale: [],
    texto: "Combo: quem estiver ligado a você, ou dentro do campo, recupera metade dos PV que você recuperar (uma vez por turno). Serve às técnicas Vínculo e Domínio.",
    compilar: () => [{ k: "texto", t: "Sangue partilhado: o ligado a você, ou os aliados no campo, recuperam metade dos PV que você recuperar (1 vez por turno)." }],
  },
  {
    id: "cargas-escudo", nome: "Cargas como escudo", com: ["acumular-poder"], vale: [],
    texto: "Reação: gasta cargas para reduzir o dano que você sofreria em 1d8 por carga gasta. Serve à técnica Acumular poder.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Gastar cargas para se proteger", ritmo: "reacao", faz: "texto" } }],
  },
  {
    id: "absorvido-cura", nome: "Absorvido que cura", com: ["absorver-devolver"], vale: [],
    texto: "Ação bônus: em vez de devolver, usa o valor guardado como PV temporários, até o máximo de 2 × proficiência. Serve à técnica Absorver e devolver.",
    compilar: () => [{ k: "gera", botao: { rotulo: "Guardado vira PV temporários", ritmo: "bonus", faz: "texto" } }],
  },
  {
    id: "sobrecarga-controlada", nome: "Sobrecarga controlada", com: ["sobrecarga"], vale: [],
    texto: "O autodano da Sobrecarga cai para 1d4 fixo por turno, mas o dano a mais também cai para 1d4. Serve à técnica Sobrecarga.",
    compilar: () => [{ k: "texto", t: "Sobrecarga controlada: autodano de 1d4 fixo por turno, e o dano a mais da Sobrecarga cai para 1d4." }],
  },
  {
    id: "corte-em-linha", nome: "Corte em linha", com: ["corte-espaco"], vale: [],
    texto: "O corte no espaço atinge todas as criaturas numa linha de 12 metros e 1,5 metro de largura: cada uma faz salvaguarda de Destreza e sofre metade do dano no sucesso. Serve à técnica Corte no espaço.",
    compilar: () => [{ k: "texto", t: "Corte em linha: o corte no espaço atinge todas as criaturas numa linha de 12 m por 1,5 m; salvaguarda de Destreza, metade no sucesso." }],
  },
  {
    id: "marca-passa-golpe", nome: "Marca que passa o golpe", com: ["vinculo", "marcar-alvo"], vale: [],
    texto: "Combo: o primeiro ataque do turno contra a criatura marcada ou ligada a você ganha +1 de acerto. Serve às técnicas Vínculo e Marcar alvo.",
    compilar: () => [{ k: "texto", t: "Marca que passa o golpe: o primeiro ataque do turno contra a criatura marcada ou ligada tem +1 de acerto." }],
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
