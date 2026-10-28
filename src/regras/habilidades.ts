/* Habilidades da Origem que se usam em jogo (viram cartas no Resumo da ficha). */
import { partesOrigem, type Calculo, type Ficha } from "./ficha";

export interface Habilidade {
  id: string;
  nome: string;
  texto: string;
  fonte: string;
  /** quando se usa: Reação, Ação bônus, Início do turno… */
  acao: string;
  limite?: { max: number; por: "combate" | "dia" };
  /** motivo pelo qual não dá para usar agora; vazio quando pode */
  bloqueio?: (f: Ficha, c: Calculo) => string;
  /** efeito aplicado na ficha ao usar */
  usar: (f: Ficha, c: Calculo) => { patch: Partial<Ficha>; msg: string };
}

const d4 = () => 1 + Math.floor(Math.random() * 4);
const curar = (f: Ficha, c: Calculo, v: number): Partial<Ficha> => ({ pvAtual: Math.min(c.pv, f.pvAtual + v) });
const vivo = (f: Ficha) => (f.pvAtual < 1 ? "Precisa ter pelo menos 1 PV." : "");
const soTexto = (msg: string) => () => ({ patch: {}, msg });

export function habilidadesDaFicha(f: Ficha): Habilidade[] {
  const out: Habilidade[] = [];
  const partes = partesOrigem(f);
  const origemId = f.origem;
  const ultima = partes[partes.length - 1];
  const estagio = ultima?.origem.id;
  const varId = ultima?.variacao?.id;
  const hollow = ["hollow-comum", "gillian", "adjuchas", "vasto-lorde"].includes(origemId);

  if (origemId === "humano") {
    out.push({
      id: "ultimo-folego",
      nome: "Último Fôlego",
      fonte: "Humano",
      acao: "No seu turno, a 0 PV",
      texto: "Uma vez por combate, a 0 PV, recupera PV e PR iguais a 5 × proficiência e se levanta.",
      limite: { max: 1, por: "combate" },
      bloqueio: (x) => (x.pvAtual > 0 ? "Só quando seus PV chegarem a 0." : ""),
      usar: (x, c) => {
        const v = 5 * c.prof;
        return { patch: { pvAtual: Math.min(c.pv, v), prAtual: Math.min(c.pr, x.prAtual + v) }, msg: `Último Fôlego: +${v} PV e +${v} PR.` };
      },
    });
  }
  if (origemId === "lobisomem") {
    out.push({
      id: "corpo-animalesco",
      nome: "Corpo Animalesco",
      fonte: "Lobisomem",
      acao: "Reação",
      texto: "Ao ser atacado, reduz o dano à metade (exceto Psíquico ou Temporal).",
      usar: soTexto("Corpo Animalesco: o dano do ataque cai pela metade. Marque \"metade\" ao aplicar o dano."),
    });
  }
  if (origemId === "mod-soul" && f.variacao === "original") {
    out.push({
      id: "modo-massacre",
      nome: "Modo Massacre",
      fonte: "Mod Soul Original",
      acao: "Antes da iniciativa",
      texto: "Contra uma criatura hostil a você ou aos aliados, faz uma ação de ataque antes da iniciativa, só nela.",
      limite: { max: 1, por: "dia" },
      usar: soTexto("Modo Massacre: faça uma ação de ataque antes da iniciativa."),
    });
  }
  if (origemId === "mod-soul" && f.variacao === "perfeita") {
    out.push({
      id: "regeneracao-perfeita",
      nome: "Regeneração",
      fonte: "Mod Soul Perfeita",
      acao: "Cada turno em combate",
      texto: "Regenera 1d4 PV por turno em combate, com pelo menos 1 PV.",
      bloqueio: vivo,
      usar: (x, c) => {
        const v = d4();
        return { patch: curar(x, c, v), msg: `Regeneração: 1d4 = ${v} PV.` };
      },
    });
  }
  if (hollow) {
    out.push({
      id: "fome",
      nome: "Fome",
      fonte: "Hollow",
      acao: "Ao reduzir um inimigo a 0 PV",
      texto: "Uma vez por rodada, ao reduzir uma criatura hostil a 0 PV, recupera PR iguais ao seu nível.",
      usar: (x, c) => ({ patch: { prAtual: Math.min(c.pr, x.prAtual + x.nivel) }, msg: `Fome: +${x.nivel} PR.` }),
    });
  }
  if (origemId === "hollow-comum" && f.variacao === "persistente" && estagio === "hollow-comum") {
    out.push({
      id: "cicatrizacao",
      nome: "Cicatrização Hollow",
      fonte: "Hollow Comum Persistente",
      acao: "Início do turno em combate",
      texto: "Recupera 1 PV no início de cada turno seu em combate, com pelo menos 1 PV.",
      bloqueio: vivo,
      usar: (x, c) => ({ patch: curar(x, c, 1), msg: "Cicatrização Hollow: +1 PV." }),
    });
  }
  if (estagio === "adjuchas" || (origemId === "vasto-lorde" && f.nivel >= 5)) {
    out.push({
      id: "regen-alta",
      nome: "Regeneração de Alta Velocidade",
      fonte: "Hollow",
      acao: "Início do turno em combate",
      texto: "Recupera PV iguais à proficiência no início de cada turno seu em combate, com pelo menos 1 PV.",
      bloqueio: vivo,
      usar: (x, c) => ({ patch: curar(x, c, c.prof), msg: `Regeneração de Alta Velocidade: +${c.prof} PV.` }),
    });
  }
  if (estagio === "adjuchas") {
    out.push({
      id: "corpo-agil",
      nome: "Corpo Ágil",
      fonte: "Adjuchas",
      acao: "Ação bônus",
      texto: "Usa a ação Desengajar como ação bônus.",
      usar: soTexto("Corpo Ágil: Desengajar como ação bônus."),
    });
  }
  if (origemId === "gillian" || (origemId === "hollow-comum" && f.nivel >= 5 && estagio === "gillian")) {
    out.push({
      id: "kumon",
      nome: "Kumon",
      fonte: "Gillian",
      acao: "1 hora para abrir",
      texto: "Uma vez por dia, abre uma fenda para o Hueco Mundo (aprovação do Mestre).",
      limite: { max: 1, por: "dia" },
      usar: soTexto("Kumon: a fenda leva 1 hora para abrir."),
    });
  }
  if (origemId === "quincy" && varId === "gemischt") {
    out.push({
      id: "determinacao",
      nome: "Determinação",
      fonte: "Quincy Gemischt",
      acao: "Ao falhar numa salvaguarda",
      texto: "Repete uma salvaguarda falha uma vez por descanso longo.",
      limite: { max: 1, por: "dia" },
      usar: soTexto("Determinação: repita a salvaguarda que falhou."),
    });
  }
  return out;
}

/** Usos restantes de uma habilidade limitada (infinito quando não há limite). */
export function usosRestantes(f: Ficha, h: Habilidade) {
  if (!h.limite) return Infinity;
  return Math.max(0, h.limite.max - (f.estado.usos[h.id] ?? 0));
}

/** Traços contínuos da Origem, já aplicados nos números da ficha. */
export function efeitosContinuos(f: Ficha): { nome: string; texto: string; fonte: string }[] {
  const out: { nome: string; texto: string; fonte: string }[] = [];
  for (const p of partesOrigem(f)) {
    for (const t of p.origem.tracos) {
      const i = t.indexOf(":");
      out.push(i > 0 && i < 40 ? { nome: t.slice(0, i), texto: t.slice(i + 1).trim(), fonte: p.origem.nome } : { nome: p.origem.nome, texto: t, fonte: p.origem.nome });
    }
    if (p.variacao && (p.variacao.desdeNivel ?? 1) <= f.nivel) out.push({ nome: p.variacao.nome, texto: p.variacao.texto, fonte: `Variação de ${p.origem.nome}` });
  }
  return out;
}
