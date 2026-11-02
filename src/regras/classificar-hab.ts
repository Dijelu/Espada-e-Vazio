/* Lê o texto de uma habilidade de forma e diz como ela se usa em jogo: ataque, salvaguarda, cura, passiva… */
import type { HabForma } from "./ficha";

export type Atr = "for" | "des" | "con" | "men" | "esp";
export interface ClasseHab {
  /** ataque = rola acerto; salva = o alvo faz salvaguarda; os dois = golpe que também exige salvaguarda */
  teste: "ataque" | "salva" | "ataque+salva" | "nenhum";
  salvaAtr?: Atr;
  metade: boolean;
  /** à distância usa o bônus de acerto à distância */
  distancia: boolean;
  /** expressão da cura, quando a habilidade recupera PV */
  cura?: string;
  curaPctDano?: number;
  passiva: boolean;
  /** quem age é a invocação ou o clone, não você */
  usaInvocacao: boolean;
  rolagem?: "reducao" | "reflexo";
}

const ATR_DE: Record<string, Atr> = { força: "for", destreza: "des", constituição: "con", mente: "men", espírito: "esp" };
const SALVA = /salvaguarda de (Força|Destreza|Constituição|Mente|Espírito)/i;
const AREA = /^[^.:]*\b(linha|cone|área|raio|todos os inimigos|inimigos a|toda criatura|quem estiver)\b[^:]*:\s*salvaguarda/i;
const ATAQUE = /\b(ataques?|golpes?|acert(?:ar|em|a)|atacam?|alvo único|um alvo|arremess\w*|dispar\w*|estocada|corte)\b/i;
const REDUZ = /\breduz(?:indo)? o dano\b|\bo dano cai\b|\bdano (?:cai|é reduzido)\b/i;
const REFLEXO = /quando uma criatura o acerta|revida|,\s*ela sofre o dano/i;
const CURA = /\brecupera(?:m)?\b[^.;]*\bPV\b/i;
const SEMCURA = /n[ãa]o recupera(?:m)? PV/i;
const INVOC = /\b(da criatura|da figura|da cria|seus clones|os clones|as Calaveras|os esqueletos|a invocação|suas invocações)\b/i;
const DIST = /à distância|a até \d+ m|arremess|dispar|linha de|cone de/i;

export function classificarHab(h: Pick<HabForma, "acao" | "dano" | "regra" | "texto" | "pr" | "custo">): ClasseHab {
  const t = (h.regra ?? h.texto ?? "").trim();
  const tem = !!h.dano && /\d/.test(h.dano);
  const m = t.match(SALVA);
  const salvaAtr = m ? ATR_DE[m[1].toLowerCase()] : undefined;
  const passiva = /passiva|sempre|contínu/i.test(h.acao) || (!tem && !(h.pr ?? 0) && !/\d\s*PR/.test(h.custo ?? "") && /^(você|enquanto|sempre|seus|suas)\b/i.test(t) && !CURA.test(t));
  const base = { metade: /metade/i.test(t), distancia: DIST.test(t), passiva, usaInvocacao: INVOC.test(t) };
  if (REFLEXO.test(t) && /rea[cç][aã]o/i.test(h.acao)) return { ...base, teste: "nenhum", rolagem: "reflexo" };
  if (REDUZ.test(t) && !tem) return { ...base, teste: "nenhum", rolagem: "reducao" };
  let cura: string | undefined;
  let curaPctDano: number | undefined;
  if (CURA.test(t) && !SEMCURA.test(t)) {
    const pct = t.match(/(\d+)\s*%\s*do dano/);
    const mult = t.match(/(\d+|o dobro)\s*[×x]?\s*(?:do\s*)?(nível|proficiência)/i);
    if (pct) curaPctDano = Number(pct[1]);
    else if (mult) { const k = mult[1].toLowerCase() === "o dobro" ? 2 : Number(mult[1]); cura = `${k}*${/nível/i.test(mult[2]) ? "[NIV]" : "[PROF]"}`; }
    else if (/PV indicados/i.test(t) && tem) cura = h.dano;
    else cura = "[NIV]";
  }
  if (cura) return { ...base, teste: "nenhum", cura };
  // cura que depende do dano causado: continua sendo um ataque e ganha um botão de curar
  const extra = curaPctDano ? { curaPctDano } : {};
  if (!tem) return { ...base, teste: m ? "salva" : "nenhum", salvaAtr };
  // "…: salvaguarda de X" ou texto que já começa pela salvaguarda é só salvaguarda; "Golpe…; se falhar na salvaguarda" é ataque e depois salvaguarda
  const antes = m ? t.slice(0, m.index) : "";
  if (m && (AREA.test(t) || /(:|^)\s*salvaguarda/i.test(t.slice(Math.max(0, (m.index ?? 0) - 2), (m.index ?? 0) + 12)) || !ATAQUE.test(antes))) return { ...base, ...extra, teste: "salva", salvaAtr };
  if (m) return { ...base, ...extra, teste: "ataque+salva", salvaAtr };
  return { ...base, ...extra, teste: "ataque" };
}
