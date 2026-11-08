/* Em quais "alvos" de cartão de dano uma habilidade da forma entra (golpe, ataque à distância, Hadō, Cero…). */
import { classificarHab } from "./classificar-hab";
import type { Alvo } from "./efeitos-forma";
import type { HabForma } from "./ficha";

type Hab = Pick<HabForma, "nome" | "acao" | "dano" | "regra" | "texto" | "pr" | "custo"> & { desc?: string; modelo?: string };

const DISTANTE = /à distância|arremess\w*|dispar\w*|projét\w*|linha de|cone de|\bonda\b|\braio\b/i;

/**
 * Toda habilidade de dano de uma forma é uma "técnica da forma". Além disso ela conta como um só destes, pelo texto:
 * Cero, Poder Inato, Schrift, Técnica de Reishi, Hadō/Kidō, ataque à distância ou golpe corpo a corpo.
 * Assim "+1d6 nos golpes" soma nas habilidades de corpo a corpo e "+1d8 nos Hadō" nas de Hadō, sem somar duas vezes.
 */
export function alvosDaAcao(h: Hab, tipoForma?: string): Alvo[] {
  const t = `${h.nome} ${h.regra ?? ""} ${h.desc ?? ""} ${h.texto ?? ""}`;
  const cl = classificarHab(h as never);
  // cura e redução de dano rolam um valor que não é dano causado: cartões de dano não entram
  if (cl.cura || cl.rolagem === "reducao" || /^(Defesa|Barreira)$/i.test(h.modelo ?? "") || /\breduz(?:indo)? o dano\b/i.test(h.regra ?? h.texto ?? "")) return [];
  const out: Alvo[] = ["tecnica"];
  if (/\bcero\b/i.test(t)) out.push("cero");
  if (/poder inato|\binato\b/i.test(t)) out.push("inato");
  if (/schrift/i.test(t)) out.push("schrift");
  if (tipoForma === "vollstandig" || /reishi/i.test(t)) out.push("reishi");
  if (out.length > 1) return out;
  if (/\b(had[ōo]|kid[ōo])\b/i.test(t)) return [...out, "hado"];
  // golpe ou à distância: vale a regra da habilidade ("Golpe corpo a corpo…", "à distância…"), não a descrição de cena
  const regra = h.regra || h.texto || "";
  return [...out, !/corpo a corpo/i.test(regra) && DISTANTE.test(regra) ? "disparo" : "golpe"];
}
