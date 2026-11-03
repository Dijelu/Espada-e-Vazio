/* Formas prontas (modelos de Shikai, Bankai, Resurrección…) usadas por NPCs do Mestre, sem precisar de uma ficha completa. */
import type { Ficha, FormaLib } from "./ficha";
import { somarForma, type CtxForma, type ModeloInvocacao, type SomaForma } from "./efeitos-forma";
import { resolverDano } from "./liberacoes";
import { classificarHab } from "./classificar-hab";
import { MODELOS_BANKAI, formaDoModelo } from "./modelos-bankai";
import { RESURRECCIONES_MONTADAS, SEGUNDAS_MONTADAS, formaDaResurreccion, formaDaSegunda } from "./modelos-hollow";
import { SHIKAIS_MONTADAS, formaDaShikai } from "./modelos-shikai";

export type TipoModeloNpc = "shikai" | "bankai" | "bankai2" | "resurreccion" | "segunda";
export interface RefModeloNpc { tipo: TipoModeloNpc; id: string }
export const TIPOS_MODELO_NPC: TipoModeloNpc[] = ["shikai", "bankai", "bankai2", "resurreccion", "segunda"];

export interface AcaoDeForma {
  nome: string;
  tipo: "ataque" | "tecnica";
  acerto: number;
  dano: string;
  custo: number;
  cd: number;
}
export interface FormaNpc {
  nome: string;
  soma: SomaForma;
  acoes: AcaoDeForma[];
  invocacoes: ModeloInvocacao[];
  /** habilidades sem dano, passivas e cura: o Mestre as conduz pelo texto */
  notas: { nome: string; texto: string }[];
}

const profDoND = (nd: number) => (nd <= 4 ? 2 : nd <= 8 ? 3 : nd <= 12 ? 4 : nd <= 16 ? 5 : 6);

/** Modelos que uma ameaça de cada categoria pode usar. */
export function modelosParaNpc(categoria: string): { ref: RefModeloNpc; rotulo: string }[] {
  if (categoria === "hollow") {
    return [
      ...RESURRECCIONES_MONTADAS.map((m) => ({ ref: { tipo: "resurreccion" as const, id: m.id }, rotulo: `Resurrección · ${m.nome}` })),
      ...SEGUNDAS_MONTADAS.map((m) => ({ ref: { tipo: "segunda" as const, id: m.id }, rotulo: `Segunda Etapa · ${m.nome}` })),
    ];
  }
  if (categoria === "shinigami") {
    return [
      ...SHIKAIS_MONTADAS.map((m) => ({ ref: { tipo: "shikai" as const, id: m.id }, rotulo: `Shikai · ${m.nome}` })),
      ...MODELOS_BANKAI.map((m) => ({ ref: { tipo: "bankai" as const, id: m.id }, rotulo: `Bankai · ${m.bankai.nome}` })),
      ...MODELOS_BANKAI.filter((m) => m.verdadeira).map((m) => ({ ref: { tipo: "bankai2" as const, id: m.id }, rotulo: `Bankai Verdadeira · ${m.verdadeira!.nome}` })),
    ];
  }
  return [];
}

function montar(ref: RefModeloNpc, ctx: CtxForma): { forma: Partial<FormaLib>; formas: Partial<Record<string, Partial<FormaLib>>>; liberado: string } | null {
  switch (ref.tipo) {
    case "shikai": { const m = SHIKAIS_MONTADAS.find((x) => x.id === ref.id); return m ? { forma: formaDaShikai(m, ctx), formas: { shikai: formaDaShikai(m, ctx) }, liberado: "shikai" } : null; }
    case "bankai": case "bankai2": {
      const m = MODELOS_BANKAI.find((x) => x.id === ref.id);
      const f = m ? formaDoModelo(m, ref.tipo, ctx) : null;
      return f ? { forma: f, formas: { [ref.tipo]: f }, liberado: ref.tipo } : null;
    }
    case "resurreccion": { const m = RESURRECCIONES_MONTADAS.find((x) => x.id === ref.id); if (!m) return null; const f = formaDaResurreccion(m, ctx); return { forma: f, formas: { resurreccion: f }, liberado: "resurreccion" }; }
    case "segunda": {
      const m = SEGUNDAS_MONTADAS.find((x) => x.id === ref.id);
      if (!m) return null;
      const base = RESURRECCIONES_MONTADAS.find((x) => x.id === m.baseResurreccion);
      const seg = formaDaSegunda(m, ctx);
      return { forma: seg, formas: { segunda: seg, ...(base ? { resurreccion: formaDaResurreccion(base, ctx) } : {}) }, liberado: "terror" };
    }
  }
}

const cache = new Map<string, FormaNpc | null>();

/** Soma as peças do modelo e converte as habilidades em ações de combate. `atr` são os atributos da ameaça sem a forma. */
export function formaNpc(am: { nd: number; atr: Record<"for" | "des" | "con" | "men" | "esp", number>; liberacao: { modelo?: RefModeloNpc } }): FormaNpc | null {
  const ref = am.liberacao.modelo;
  if (!ref) return null;
  const chave = `${ref.tipo}:${ref.id}:${am.nd}:${JSON.stringify(am.atr)}`;
  if (cache.has(chave)) return cache.get(chave) ?? null;
  const prof = profDoND(am.nd);
  const ctx: CtxForma = { n: am.nd, prof, atr: { ...am.atr } };
  const m = montar(ref, ctx);
  let saida: FormaNpc | null = null;
  if (m) {
    const ficha = { nivel: am.nd, estado: { liberado: m.liberado }, formas: m.formas } as unknown as Ficha;
    const soma = somarForma(ficha, ctx);
    if (soma) {
      const atr = { for: am.atr.for + soma.atr.for, des: am.atr.des + soma.atr.des, con: am.atr.con + soma.atr.con, men: am.atr.men + soma.atr.men, esp: am.atr.esp + soma.atr.esp };
      const calc = { prof, atr } as never;
      const acoes: AcaoDeForma[] = [];
      const notas: { nome: string; texto: string }[] = [];
      for (const h of m.forma.habilidades ?? []) {
        const cl = classificarHab(h);
        const texto = h.regra || h.texto;
        const tem = !!h.dano && /\d/.test(h.dano);
        if (!tem || cl.passiva || cl.cura) { notas.push({ nome: h.nome, texto }); continue; }
        let dano = resolverDano(h.dano!, ficha, calc);
        const dados = soma.dados.tecnica ?? [];
        if (dados.length) dano += ` + ${dados.join(" + ")}`;
        if (soma.dano.tecnica) dano += ` + ${soma.dano.tecnica}`;
        const ataque = cl.teste === "ataque" || cl.teste === "ataque+salva";
        acoes.push({ nome: h.nome, tipo: ataque ? "ataque" : "tecnica", acerto: ataque ? prof + atr.esp + (soma.acerto.tecnica ?? 0) : 0, dano, custo: h.pr ?? 0, cd: 8 + prof + atr.esp + soma.cd });
        if (cl.teste === "ataque+salva") notas.push({ nome: h.nome, texto });
      }
      for (const t of soma.textos) notas.push({ nome: t.nome, texto: t.t });
      saida = { nome: m.forma.nome ?? "", soma, acoes, invocacoes: soma.invocacoes, notas };
    }
  }
  cache.set(chave, saida);
  return saida;
}

/** Bônus de CR e de atributos que o modelo dá ao NPC liberado. */
export function bonusDoModelo(am: Parameters<typeof formaNpc>[0]): { cr: number; atr: Record<"for" | "des" | "con" | "men" | "esp", number> } | null {
  const f = formaNpc(am);
  return f ? { cr: f.soma.cr, atr: f.soma.atr } : null;
}
