/* Poderes das técnicas especiais e das interações especiais: o estado que os botões guardam na ficha e os bônus que ele dá
   aos cartões de ação. Tudo aqui é conta pura (sem tela), para poder testar com fichas.
   O estado fica em `estado.usos`, em chaves "pw:<poder>" com números. Ele some quando a forma termina.
   Os botões são achados pelo ROTULO, porque fichas antigas guardaram esses botões como texto (sem nenhuma marca de poder). */
import type { Calculo, Ficha } from "./ficha";

export const PW = (id: string) => `pw:${id}`;
export const ehChavePoder = (k: string) => k.startsWith("pw:");

/** Rola uma expressão como "3d8" e devolve o total (a tela rola e registra; o teste usa números fixos). */
export type Rolar = (rotulo: string, expr: string) => number;

type Patch = Record<string, number | undefined>;
export interface ResPoder {
  /** mudanças nos usos (undefined apaga a chave) */
  usos?: Patch;
  /** PV temporários novos (só sobe) */
  pvTemp?: number;
  /** PV a perder (autodano) */
  perdePv?: number;
  /** o que aconteceu, em uma frase */
  dito?: string;
  /** motivo de não ter feito nada (o PR não é gasto) */
  erro?: string;
}

/** Rótulo do botão -> poder. */
export const PODER_POR_ROTULO: Record<string, string> = {
  "Juntar energia": "energia",
  "Gran Rey Cero": "gran-rey-cero",
  "Ganhar carga": "cargas",
  "Descarregar as cargas": "descarregar",
  "Gastar cargas para se proteger": "cargas-escudo",
  "Sobrecarregar": "sobrecarga",
  "Absorver o golpe": "absorver",
  "Devolver o absorvido": "devolver",
  "Guardado vira PV temporários": "absorvido-cura",
  "Cortar o espaço": "corte",
  "Marcar alvo": "marcar-alvo",
  "Marcar para detonar": "marcar-detonar",
  "Empilhar marca": "empilhar",
  "Detonar as marcas": "detonar",
  "Abrir o domínio": "dominio",
  "Impor a regra do domínio": "regra-dominio",
  "Criar vínculo": "vinculo",
  "Passar o dano": "vinculo-dano",
  "Usar o elo": "vinculo-sentidos",
  "Copiar poder": "copiar",
  "Guardar a cópia": "guardar-copia",
  "Usar o poder copiado": "usar-copia",
  "Reforço": "reforco",
  "Provocar": "provocar",
  "Jogar a criatura na frente": "escudo-vivo",
  "Enxame sobre o alvo": "enxame",
  "Lançar o enxame": "enxame",
};
export const poderDoBotao = (rotulo: string) => PODER_POR_ROTULO[rotulo];

const usosDe = (f: Ficha) => f.estado.usos ?? {};
const val = (f: Ficha, id: string) => Math.max(0, Number(usosDe(f)[PW(id)]) || 0);
const prof = (c: Calculo) => Math.max(1, c.prof || 1);

/** A forma tem esta técnica ou interação? (pelo nome do cartão, ou pelo texto que ele deixou na forma) */
export function temCartao(c: Calculo, nome: string): boolean {
  const fx = c.forma;
  if (!fx) return false;
  return fx.textos.some((x) => x.nome === nome || x.t.startsWith(nome)) || (fx.botoes ?? []).some((b) => b.rotulo === nome);
}

const set = (id: string, v: number): Patch => ({ [PW(id)]: v <= 0 ? undefined : v });
const junta = (...p: Patch[]): Patch => Object.assign({}, ...p);

/** Depois de alguns botões, a Explosão em cadeia dá +1d6 no próximo ataque (1 vez por turno). */
function cadeia(f: Ficha, c: Calculo): { p: Patch; t: string } | undefined {
  if (!temCartao(c, "Explosão em cadeia") || val(f, "cadeia-usada") > 0) return undefined;
  return { p: junta(set("cadeia", 1), set("cadeia-usada", 1)), t: " Explosão em cadeia: o seu próximo ataque no turno causa +1d6." };
}

/** Aciona o poder de um botão. Devolve undefined se o botão não é de um poder. */
export function acionarPoder(rotulo: string, f: Ficha, c: Calculo, rolar: Rolar): ResPoder | undefined {
  const id = poderDoBotao(rotulo);
  if (!id) return undefined;
  const P = prof(c);
  const v = (x: string) => val(f, x);
  switch (id) {
    case "energia": {
      const cap = temCartao(c, "Energia em dobro") ? 2 : 1;
      const n = Math.min(cap, v("energia") + 1);
      if (n === v("energia")) return { erro: `${rotulo}: a energia já está no máximo (${cap}).` };
      return { usos: set("energia", n), dito: `Energia carregada (${n}/${cap}): a sua próxima ação de ataque à distância sai com +${n >= 2 ? 12 : 6} metros de alcance.` };
    }
    case "gran-rey-cero": {
      if (v("energia") < 1) return { erro: `${rotulo}: junte energia primeiro.` };
      return { usos: set("grc", 1), dito: `Gran Rey Cero pronto: ao lançar a energia, o ataque causa +${P}d8 de dano de Energia.` };
    }
    case "cargas": {
      if (v("cargas") >= P) return { erro: `${rotulo}: já são ${P} cargas, o máximo.` };
      return { usos: set("cargas", v("cargas") + 1), dito: `Carga ${v("cargas") + 1}/${P}.` };
    }
    case "descarregar": {
      const n = v("cargas");
      if (n < 1) return { erro: `${rotulo}: você não tem cargas.` };
      return { usos: junta(set("cargas", 0), set("descarga", n)), dito: `${n} cargas soltas: o seu próximo golpe causa +${n}d6.` };
    }
    case "cargas-escudo": {
      const n = v("cargas");
      if (n < 1) return { erro: `${rotulo}: você não tem cargas.` };
      const t = rolar("Cargas como escudo", `${n}d8`);
      return { usos: set("cargas", 0), dito: `${n} cargas gastas: o dano que você sofreria cai em ${t}.` };
    }
    case "sobrecarga": {
      if (v("sobre") > 0) return { erro: `${rotulo}: a Sobrecarga já está ligada.` };
      const ctl = temCartao(c, "Sobrecarga controlada");
      return { usos: set("sobre", 2), dito: `Sobrecarga: até o fim do próximo turno, os seus ataques causam +${ctl ? "1d4" : "1d6"}, e no início de cada turno seu você perde ${ctl ? "1d4" : `${P}d4`} PV (use Novo turno).` };
    }
    case "absorver": {
      const t = rolar("Absorver o golpe", `${P}d8`);
      return { usos: set("guardado", v("guardado") + t), dito: `O golpe cai em ${t}, e o valor fica guardado (total ${v("guardado") + t}).` };
    }
    case "devolver": {
      const g = v("guardado");
      if (g < 1) return { erro: `${rotulo}: não há nada guardado. Use Absorver o golpe antes.` };
      const dano = Math.min(g, 4 * P);
      rolar("Devolver o absorvido", String(dano));
      return { usos: set("guardado", 0), dito: `Devolve ${dano} de dano a uma criatura a até 18 metros (salvaguarda de Destreza, metade no sucesso).` };
    }
    case "absorvido-cura": {
      const g = v("guardado");
      if (g < 1) return { erro: `${rotulo}: não há nada guardado.` };
      const pv = Math.min(g, 2 * P);
      return { usos: set("guardado", 0), pvTemp: Math.max(f.estado.pvTemp ?? 0, pv), dito: `${pv} PV temporários.` };
    }
    case "corte": {
      const linha = temCartao(c, "Corte em linha");
      return { usos: set("corte", 1), dito: `O espaço se abre: a sua próxima ação de ataque corpo a corpo alcança 12 metros, sem ser barrada por cobertura${linha ? ", em linha de 12 por 1,5 m" : ""}.` };
    }
    case "marcar-alvo":
      return { usos: junta(set("marca", 1), set("peso", 0)), dito: "Alvo marcado até o fim da cena: o primeiro ataque de cada aliado contra ele, no turno, causa +1d6." };
    case "marcar-detonar": {
      if (v("marcas") >= P) return { erro: `${rotulo}: já são ${P} marcas, o máximo.` };
      return { usos: set("marcas", v("marcas") + 1), dito: `Marca ${v("marcas") + 1}/${P} colocada.` };
    }
    case "empilhar": {
      if (v("marcas") < 1) return { erro: `${rotulo}: coloque uma marca primeiro.` };
      if (v("pilha") >= 3) return { erro: `${rotulo}: já são 3 marcas empilhadas.` };
      return { usos: set("pilha", v("pilha") + 1), dito: `Marca empilhada (${v("pilha") + 1}/3): +1d6 na detonação.` };
    }
    case "detonar": {
      const m = v("marcas");
      if (m < 1) return { erro: `${rotulo}: não há marcas.` };
      const expr = `${P * m}d6${v("pilha") > 0 ? `+${v("pilha")}d6` : ""}`;
      const t = rolar("Detonar as marcas", expr);
      const ch = cadeia(f, c);
      return { usos: junta(set("marcas", 0), set("pilha", 0), ch?.p ?? {}), dito: `${m} marcas explodem: ${t} de dano de Energia (salvaguarda de Destreza, metade no sucesso).${ch?.t ?? ""}` };
    }
    case "dominio": {
      if (v("dominio") > 0) return { erro: `${rotulo}: o campo já está aberto.` };
      return { usos: set("dominio", 1), dito: "Campo de 9 metros aberto até o fim da cena. As regras vêm das interações (use Novo turno para aplicar as de início de turno)." };
    }
    case "regra-dominio":
      if (v("dominio") < 1) return { erro: `${rotulo}: abra o domínio primeiro.` };
      return { usos: set("regra", 1), dito: "Regra do campo imposta: terreno difícil para inimigos, inimigos com -2 de CR, ou vantagem em salvaguardas para você (escolha uma)." };
    case "vinculo":
      return { usos: set("vinculo", 1), dito: "Vínculo criado (a criatura faz salvaguarda de Mente para resistir). Dura até o fim da cena." };
    case "vinculo-dano":
      if (v("vinculo") < 1) return { erro: `${rotulo}: crie o vínculo primeiro.` };
      return { dito: "Metade do dano que você sofreu passa para a criatura ligada, sem resistência." };
    case "vinculo-sentidos":
      if (v("vinculo") < 1) return { erro: `${rotulo}: crie o vínculo primeiro.` };
      return { dito: "Você enxerga e ouve pela criatura ligada até o início do próximo turno." };
    case "copiar":
      return { usos: junta(set("copia", P)), dito: `Poder copiado por ${P} turnos.` };
    case "guardar-copia":
      if (v("copia") < 1) return { erro: `${rotulo}: não há cópia.` };
      return { usos: set("copia", 99), dito: "A cópia dura até o fim da cena." };
    case "usar-copia":
      if (v("copia") < 1) return { erro: `${rotulo}: não há cópia.` };
      return { dito: "Você usa o poder copiado com o seu atributo de ataque (custo em PR do poder original)." };
    case "reforco":
      return { usos: set("reforco", 1), dito: "Reforço: o seu próximo ataque no turno causa +2d10." };
    case "provocar":
      return { dito: "Uma criatura a até 18 metros faz salvaguarda de Mente; se falhar, só pode atacar você até o fim do próximo turno dela." };
    case "escudo-vivo":
      return { dito: "Uma criatura, clone ou parte do enxame leva o golpe no seu lugar." };
    case "enxame": {
      const ch = cadeia(f, c);
      return { usos: ch?.p, dito: `O enxame cai sobre o alvo.${ch?.t ?? ""}` };
    }
  }
  return undefined;
}

/* ---------- bônus que o estado dá a um ataque ---------- */

export interface BonusAtaque {
  /** dados a somar ao dano (ex.: ["2d10", "1d6"]) */
  dados: string[];
  /** soma ao acerto */
  acerto: number;
  /** avisos do que está valendo (aparecem no cartão) */
  tags: string[];
  /** chaves a gastar quando o dano é rolado */
  gasta: string[];
}

/** O que está ligado e vale para um ataque (distância ou corpo a corpo). Não muda a ficha. */
export function bonusDeAtaque(f: Ficha, c: Calculo, distancia: boolean): BonusAtaque {
  const P = prof(c);
  const b: BonusAtaque = { dados: [], acerto: 0, tags: [], gasta: [] };
  const v = (x: string) => val(f, x);
  if (v("energia") > 0 && distancia) {
    b.tags.push(`Energia: +${v("energia") >= 2 ? 12 : 6} m de alcance`);
    b.gasta.push("energia");
    if (v("grc") > 0) { b.dados.push(`${P}d8`); b.tags.push(`Gran Rey Cero: +${P}d8`); b.gasta.push("grc"); }
  }
  if (v("descarga") > 0) { b.dados.push(`${v("descarga")}d6`); b.tags.push(`Descarga: +${v("descarga")}d6`); b.gasta.push("descarga"); }
  if (v("reforco") > 0) { b.dados.push("2d10"); b.tags.push("Reforço: +2d10"); b.gasta.push("reforco"); }
  if (v("sobre") > 0) { const d = temCartao(c, "Sobrecarga controlada") ? "1d4" : "1d6"; b.dados.push(d); b.tags.push(`Sobrecarga: +${d}`); }
  if (v("cadeia") > 0) { b.dados.push("1d6"); b.tags.push("Explosão em cadeia: +1d6"); b.gasta.push("cadeia"); }
  if (v("corte") > 0 && !distancia) { b.tags.push("Corte no espaço: alcance 12 m, ignora cobertura"); b.gasta.push("corte"); }
  if (v("marca") > 0) {
    if (temCartao(c, "Peso dobrado")) b.tags.push(`Alvo marcado · peso ${v("peso")}/${P} (−${1.5 * v("peso")} m de deslocamento)`);
    else b.tags.push("Alvo marcado");
  }
  if ((v("marca") > 0 || v("vinculo") > 0) && temCartao(c, "Marca que passa o golpe") && v("pg-usado") < 1) { b.acerto += 1; b.tags.push("Marca que passa o golpe: +1 no acerto"); }
  return b;
}

/** Gasta o que o dano rolado consumiu (e soma 1 de peso na criatura marcada). */
export function gastarBonus(f: Ficha, c: Calculo, b: BonusAtaque): Patch {
  const p: Patch = {};
  for (const k of b.gasta) p[PW(k)] = undefined;
  if (val(f, "marca") > 0 && temCartao(c, "Peso dobrado")) p[PW("peso")] = Math.min(prof(c), val(f, "peso") + 1) || undefined;
  if (b.gasta.includes("energia")) {
    const ch = cadeia(f, c);
    if (ch) Object.assign(p, ch.p);
  }
  return p;
}

/** O acerto foi rolado: o +1 da Marca que passa o golpe vale uma vez por turno. */
export function gastarAcerto(f: Ficha, c: Calculo, b: BonusAtaque): Patch {
  return b.acerto > 0 ? { [PW("pg-usado")]: 1 } : {};
}

/* ---------- virada de turno ---------- */

export interface ResTurno { usos: Patch; perdePv: number; ditos: string[] }

/** "Novo turno": renova o que vale por turno e aplica o que acontece no início do turno. */
export function turnoDosPoderes(f: Ficha, c: Calculo, rolar: Rolar): ResTurno {
  const P = prof(c);
  const r: ResTurno = { usos: {}, perdePv: 0, ditos: [] };
  r.usos[PW("cadeia-usada")] = undefined;
  r.usos[PW("pg-usado")] = undefined;
  const sobre = val(f, "sobre");
  if (sobre > 0) {
    const ctl = temCartao(c, "Sobrecarga controlada");
    const t = rolar("Sobrecarga", ctl ? "1d4" : `${P}d4`);
    r.perdePv += t;
    r.usos[PW("sobre")] = sobre - 1 <= 0 ? undefined : sobre - 1;
    r.ditos.push(`Sobrecarga: −${t} PV${sobre - 1 <= 0 ? " (a Sobrecarga terminou)" : ""}`);
  }
  const copia = val(f, "copia");
  if (copia > 0 && copia < 90) {
    r.usos[PW("copia")] = copia - 1 <= 0 ? undefined : copia - 1;
    if (copia - 1 <= 0) r.ditos.push("a cópia do poder acabou");
  }
  if (val(f, "dominio") > 0) {
    if (temCartao(c, "Domínio que fere")) { const t = rolar("Domínio que fere", `${P}d4`); r.ditos.push(`Domínio que fere: inimigos no campo sofrem ${t} de Energia`); }
    if (temCartao(c, "Campo que restaura")) r.ditos.push(`Campo que restaura: aliados no campo recuperam ${P} PV`);
    if (temCartao(c, "Campo que debilita")) r.ditos.push("Campo que debilita: inimigos no campo fazem salvaguarda de Constituição");
    if (temCartao(c, "Domo sem sentidos")) r.ditos.push("Domo sem sentidos: inimigos no campo fazem salvaguarda de Constituição");
  }
  return r;
}

/* ---------- cura compartilhada ---------- */

/** Frase extra quando você recupera PV com vínculo ou domínio. */
export function eco(f: Ficha, c: Calculo, pv: number): string {
  const ligado = val(f, "vinculo") > 0, campo = val(f, "dominio") > 0;
  const p: string[] = [];
  if (ligado && temCartao(c, "Cura compartilhada")) p.push(`a criatura ligada também recupera ${pv} PV`);
  if ((ligado || campo) && temCartao(c, "Sangue partilhado")) p.push(`${ligado ? "a criatura ligada" : "os aliados no campo"} recupera ${Math.floor(pv / 2)} PV (Sangue partilhado)`);
  return p.length ? ` E ${p.join("; ")}.` : "";
}

/* ---------- painel de poderes ativos ---------- */

export interface PoderAtivo { id: string; nome: string; valor: string }
const NOMES: [string, string][] = [
  ["energia", "Energia carregada"], ["grc", "Gran Rey Cero"], ["cargas", "Cargas"], ["descarga", "Descarga pronta"], ["sobre", "Sobrecarga (turnos)"],
  ["guardado", "Dano guardado"], ["corte", "Corte no espaço"], ["marca", "Alvo marcado"], ["peso", "Peso na marca"], ["marcas", "Marcas"], ["pilha", "Marcas empilhadas"],
  ["dominio", "Domínio aberto"], ["regra", "Regra do campo"], ["vinculo", "Vínculo"], ["copia", "Poder copiado"], ["reforco", "Reforço"], ["cadeia", "Explosão em cadeia"],
];
export function poderesAtivos(f: Ficha): PoderAtivo[] {
  return NOMES.filter(([id]) => val(f, id) > 0).map(([id, nome]) => ({ id, nome, valor: id === "copia" && val(f, id) >= 90 ? "até a cena acabar" : String(val(f, id)) }));
}
/** Apaga um poder do painel. */
export const limparPoder = (id: string): Patch => ({ [PW(id)]: undefined });

/** Junta um patch nos usos da ficha (apaga as chaves com undefined). */
export function aplicarUsos(f: Ficha, ...patches: Patch[]): Record<string, number> {
  const u: Record<string, number> = { ...usosDe(f) };
  for (const p of patches) for (const [k, x] of Object.entries(p)) { if (x === undefined) delete u[k]; else u[k] = x; }
  return u;
}
