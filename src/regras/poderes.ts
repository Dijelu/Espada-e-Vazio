/* Poderes das técnicas especiais e das interações especiais: o estado que os botões guardam na ficha e os bônus que ele dá
   aos cartões de ação. Tudo aqui é conta pura (sem tela), para poder testar com fichas.
   O estado fica em `estado.usos`, em chaves "pw:<poder>" com números. Ele some quando a forma termina.
   Os botões são achados pelo ROTULO, porque fichas antigas guardaram esses botões como texto (sem nenhuma marca de poder). */
import type { Calculo, Ficha, Invocacao } from "./ficha";
import type { InstEfeito } from "./efeitos-forma";

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
  /** criatura que volta ao campo (Fazer renascer) */
  renasce?: Invocacao;
  /** PV que você recupera */
  curaPv?: number;
  /** PR que você recupera */
  ganhaPr?: number;
  /** id da criatura em campo que some (Devorar a criatura) */
  some?: string;
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
  "Regenerar a criatura": "regenerar",
  "Dispersar o enxame": "dispersar",
  "Fazer renascer": "renascer",
  "Criatura vira arma": "mutavel-arma",
  "Criatura vira escudo": "mutavel-escudo",
  "Lançar ilusão": "ilusao",
  "Inverter os sentidos": "inverter",
  "Golpe no vazio": "golpe-vazio",
  "Selar": "selo",
  "Estilhaçar o selo": "estilhacar",
  "Erguer barreira": "barreira",
  "Barreira recebe o golpe": "barreira-recebe",
  "Envenenar": "veneno",
  "Segunda picada": "segunda-picada",
  "Beber o veneno": "beber-veneno",
  "Acelerar": "acelerar",
  "Golpe em passagem": "golpe-passagem",
  "Drenar": "drenar",
  "Ataque conjunto": "conjunto",
  "Devorar a criatura": "devorar",
  "Entrar em fúria": "furia",
  "Atravessar a fenda": "fenda",
  "Apertar o elo": "elo",
  "Revelar o alvo": "revelar",
};
/** As três regras que o domínio pode impor (a pessoa escolhe uma). */
export const REGRA_DOMINIO: Record<number, string> = { 1: "terreno difícil para os inimigos no campo", 2: "inimigos no campo com −2 de CR", 3: "você com vantagem nas salvaguardas dentro do campo" };
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
/** `dano`: o dano que a pessoa digitou (o golpe que ela ia sofrer); sem ele, os botões de defesa só mostram a regra. */
export function acionarPoder(rotulo: string, f: Ficha, c: Calculo, rolar: Rolar, dano = 0, opcao = 0): ResPoder | undefined {
  const id = poderDoBotao(rotulo);
  if (!id) return undefined;
  const P = prof(c);
  const v = (x: string) => val(f, x);
  switch (id) {
    case "energia": {
      const cap = temCartao(c, "Energia em dobro") ? 2 : 1;
      const n = Math.min(cap, v("energia") + 1);
      if (n === v("energia")) return { erro: `${rotulo}: a energia já está no máximo (${cap}).` };
      return { usos: set("energia", n), dito: `Energia carregada (${n}/${cap}): a sua próxima ação de ataque à distância sai com +${n >= 2 ? 12 : 6} metros de alcance. Use o cartão Lançar a energia para soltá-la.` };
    }
    case "gran-rey-cero": {
      if (v("energia") < 1) return { erro: `${rotulo}: junte energia primeiro.` };
      return { usos: set("grc", 1), dito: `Gran Rey Cero pronto: ao lançar a energia (cartão Lançar a energia), o ataque causa +${P}d8 de dano de Energia.` };
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
      if (dano > 0) { const corta = Math.min(dano, t); return { usos: set("cargas", 0), perdePv: dano - corta, dito: `${n} cargas gastas: o dano cai em ${corta} (de ${dano}). Você sofre ${dano - corta}, já descontado dos seus PV.` }; }
      return { usos: set("cargas", 0), dito: `${n} cargas gastas: o dano que você sofreria cai em ${t}.` };
    }
    case "sobrecarga": {
      if (v("sobre") > 0) return { erro: `${rotulo}: a Sobrecarga já está ligada.` };
      const ctl = temCartao(c, "Sobrecarga controlada");
      return { usos: set("sobre", 2), dito: `Sobrecarga: até o fim do próximo turno, os seus ataques causam +${ctl ? "1d4" : "1d6"}, e no início de cada turno seu você perde ${ctl ? "1d4" : `${P}d4`} PV (use Novo turno).` };
    }
    case "absorver": {
      const rol = rolar("Absorver o golpe", `${P}d8`);
      const t = dano > 0 ? Math.min(dano, rol) : rol;
      if (dano > 0) return { usos: set("guardado", v("guardado") + t), perdePv: dano - t, dito: `O golpe cai em ${t} (de ${dano}); o valor fica guardado (total ${v("guardado") + t}). Você sofre ${dano - t}, já descontado dos seus PV.` };
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
      return { usos: temCartao(c, "Fenda aberta") ? junta(set("corte", 1), set("fenda", 2)) : set("corte", 1), dito: `O espaço se abre: a sua próxima ação de ataque corpo a corpo alcança 12 metros, sem ser barrada por cobertura${linha ? ", em linha de 12 por 1,5 m" : ""}. Use o cartão Golpe pelo espaço para atacar.` };
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
      return { usos: junta(set("marcas", 0), set("pilha", 0), ch?.p ?? {}), dito: `${m} marcas explodem: ${t} de dano de Energia (salvaguarda de Destreza, metade no sucesso).${temCartao(c, "Detonação em cadeia") ? ` As criaturas a 3 m de cada marca sofrem metade (${Math.floor(t / 2)}), salvaguarda de Destreza anula.` : ""}${ch?.t ?? ""}` };
    }
    case "dominio": {
      if (v("dominio") > 0) return { erro: `${rotulo}: o campo já está aberto.` };
      return { usos: set("dominio", 1), dito: "Campo de 9 metros aberto até o fim da cena. As regras vêm das interações (use Novo turno para aplicar as de início de turno)." };
    }
    case "regra-dominio": {
      if (v("dominio") < 1) return { erro: `${rotulo}: abra o domínio primeiro.` };
      if (opcao < 1 || opcao > 3) return { erro: `${rotulo}: escolha a regra (terreno difícil, −2 de CR dos inimigos ou vantagem nas salvaguardas).` };
      return { usos: set("regra", opcao), dito: `Regra do campo imposta: ${REGRA_DOMINIO[opcao]}.` };
    }
    case "vinculo":
      return { usos: set("vinculo", 1), dito: "Vínculo criado (a criatura faz salvaguarda de Mente para resistir). Dura até o fim da cena." };
    case "vinculo-dano":
      if (v("vinculo") < 1) return { erro: `${rotulo}: crie o vínculo primeiro.` };
      if (dano > 0) { const passa = Math.floor(dano / 2); return { perdePv: dano - passa, dito: `${passa} dos ${dano} de dano passam para a criatura ligada, sem resistência. Você sofre ${dano - passa}, já descontado dos seus PV.` }; }
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
      if (!(f.estado.copiados ?? []).length) return { dito: "Você usa o poder copiado com o seu atributo de ataque (custo em PR do poder original). Anote o nome e o dano ao copiar para o sistema rolar." };
      return { dito: "Poder copiado usado." };
    case "reforco":
      return { usos: set("reforco", 1), dito: "Reforço: o seu próximo ataque no turno causa +2d10." };
    case "provocar": {
      const cd = 8 + P + Math.max(c.atr.men, c.atr.esp);
      return { usos: set("provocado", 1), dito: `Uma criatura a até 18 metros faz salvaguarda de Mente (CD ${cd}); se falhar, só pode atacar você até o fim do próximo turno dela (o marcador sai no Novo turno).` };
    }
    case "renascer": {
      if (v("renasceu") > 0) return { erro: `${rotulo}: já renasceu uma criatura nesta cena.` };
      const x = f.estado.caida;
      if (!x) return { erro: `${rotulo}: nenhuma criatura chamada chegou a 0 PV.` };
      const pv = Math.max(1, Math.floor(x.pvMax / 2));
      return { usos: set("renasceu", 1), renasce: { ...x, pv }, dito: `${x.nome} volta com ${pv} PV (metade dos ${x.pvMax}). Só uma vez por cena.` };
    }
    case "escudo-vivo":
      return { dito: "Uma criatura, clone ou parte do enxame leva o golpe no seu lugar." };
    case "enxame": {
      const ch = cadeia(f, c);
      const t = rolar("Lançar o enxame", `${P}d4`);
      return { usos: ch?.p, dito: `O enxame cobre o alvo: ${t} de dano; salvaguarda de Destreza (CD ${8 + P + Math.max(c.atr.des, c.atr.esp)}); se falhar, o alvo fica com desvantagem nos ataques até o fim do próximo turno dele.${ch?.t ?? ""}` };
    }
    case "dispersar": {
      if (dano > 0) { const sofre = Math.ceil(dano / 2); return { perdePv: sofre, dito: `O enxame se espalha: dos ${dano} de dano em área você sofre só ${sofre}, já descontado dos seus PV. Metade das criaturas do enxame some.` }; }
      return { dito: "O enxame se espalha à sua volta: você sofre só metade do dano em área, e metade das criaturas do enxame some. Digite o dano para o sistema descontar." };
    }
    case "ilusao": {
      if (v("ilusao") > 0) return { erro: `${rotulo}: já há uma criatura iludida.` };
      const cd = 8 + P + Math.max(c.atr.men, c.atr.esp);
      const perfeita = temCartao(c, "Ilusão perfeita");
      return { usos: set("ilusao", perfeita ? 99 : 2), dito: `Ilusão lançada: salvaguarda de Mente (CD ${cd}). Se falhar, os seus ataques contra a criatura têm vantagem e os dela contra você têm desvantagem ${perfeita ? "até o fim da cena (ela repete a salvaguarda no fim de cada turno dela)" : "até o fim do seu próximo turno"}. Se ela passar, tire a ilusão no painel de poderes ligados.` };
    }
    case "inverter": {
      if (v("ilusao") < 1) return { erro: `${rotulo}: não há criatura iludida.` };
      if (v("invertido") > 0) return { erro: `${rotulo}: os sentidos dela já estão invertidos.` };
      return { usos: set("invertido", 1), dito: "Sentidos invertidos: no próximo turno dela, a criatura iludida anda na direção oposta e ataca com desvantagem contra qualquer alvo." };
    }
    case "golpe-vazio": {
      if (v("ilusao") < 1) return { erro: `${rotulo}: não há criatura iludida.` };
      const t = rolar("Golpe no vazio", `${P}d6`);
      return { dito: `A criatura iludida errou o ataque e a ilusão a fere: ${t} de dano psíquico.` };
    }
    case "selo": {
      if (v("selo") > 0) return { erro: `${rotulo}: já há uma criatura selada.` };
      const cd = 8 + P + Math.max(c.atr.for, c.atr.esp);
      return { usos: set("selo", 3), dito: `Selo lançado: salvaguarda de Força (CD ${cd}). Se falhar, a criatura fica Presa por 3 turnos${temCartao(c, "Selo em área") ? " (as criaturas a 3 m dela também fazem a salvaguarda)" : ""}${temCartao(c, "Selo que cala") ? "; selada, não usa reações nem técnicas com PR" : ""}. Se ela passar, tire o selo no painel de poderes ligados.` };
    }
    case "estilhacar": {
      if (v("selo") < 1) return { erro: `${rotulo}: não há criatura selada.` };
      const t = rolar("Estilhaçar o selo", `${P}d10`);
      return { usos: set("selo", 0), dito: `O selo se parte com a criatura dentro: ${t} de dano. O selo terminou.` };
    }
    case "barreira": {
      if (v("barreira") > 0) return { erro: `${rotulo}: a barreira já está de pé (${v("barreira")} PV).` };
      const pv = (temCartao(c, "Barreira ampla") ? 8 : 5) * P;
      return { usos: set("barreira", pv), dito: `Barreira erguida com ${pv} PV${temCartao(c, "Barreira ampla") ? ", protegendo aliados a até 9 m" : ""}. Use “Barreira recebe o golpe” quando um golpe vier.` };
    }
    case "barreira-recebe": {
      const b = v("barreira");
      if (b < 1) return { erro: `${rotulo}: não há barreira de pé.` };
      if (dano < 1) return { erro: `${rotulo}: escreva o dano do golpe no campo “Dano que você ia sofrer”.` };
      const pega = Math.min(b, dano), resto = dano - pega;
      const dev = temCartao(c, "Barreira que devolve") ? ` Quem atacou sofre ${rolar("Barreira que devolve", `${P}d4`)} de dano de Energia.` : "";
      return { usos: set("barreira", b - pega), perdePv: resto, dito: `A barreira recebe ${pega} dos ${dano} de dano${b - pega <= 0 ? " e se quebra" : ` (restam ${b - pega} PV nela)`}.${resto > 0 ? ` ${resto} passam e já foram descontados dos seus PV.` : ""}${dev}` };
    }
    case "veneno": {
      const n = Math.min(P, v("doses") + 1);
      if (n === v("doses")) return { erro: `${rotulo}: o alvo já tem o máximo de doses (${P}).` };
      const cr = temCartao(c, "Veneno que corrói") ? Math.min(3, Math.floor(n / 2)) : 0;
      return { usos: set("doses", n), dito: `Dose ${n} de ${P}: no início de cada turno seu, o alvo sofre ${n}d4 de veneno${cr > 0 ? `; ele está com −${cr} de CR` : ""}.${n === P && temCartao(c, "Segunda picada") ? " Máximo de doses: a Segunda picada está pronta." : ""}` };
    }
    case "segunda-picada": {
      if (v("doses") < P) return { erro: `${rotulo}: o alvo precisa ter o máximo de doses (${v("doses")} de ${P}).` };
      const t = rolar("Segunda picada", `${2 * P}d8`);
      return { usos: set("doses", 0), dito: `Segunda picada no mesmo ponto: ${t} de dano (salvaguarda de Constituição, CD ${8 + P + Math.max(c.atr.des, c.atr.esp)}; metade no sucesso). As doses somem.` };
    }
    case "beber-veneno": {
      const n = v("doses");
      if (n < 1) return { erro: `${rotulo}: o alvo não tem doses de veneno.` };
      const t = rolar("Beber o veneno", `${n}d6`);
      return { usos: set("doses", 0), curaPv: t, dito: `Você puxa o veneno de volta: ${n} dose${n === 1 ? "" : "s"} somem e você recupera ${t} PV.` };
    }
    case "acelerar": {
      if (v("acel") > 0) return { erro: `${rotulo}: você já está acelerado neste turno.` };
      const ritmo = temCartao(c, "Ritmo crescente") ? Math.min(3, v("ritmo") + 1) : 1;
      return { usos: junta(set("acel", 1), set("acel-golpe", 1), set("ritmo", ritmo), temCartao(c, "Imagem residual") ? set("imagem", 1) : {}), dito: `Acelerado até o fim do turno: +9 m de deslocamento, sem ataques de oportunidade, e o seu primeiro ataque causa +${ritmo}d8.${temCartao(c, "Imagem residual") ? " Imagem residual: o primeiro ataque contra você tem desvantagem." : ""}` };
    }
    case "golpe-passagem": {
      if (v("acel") < 1) return { erro: `${rotulo}: acelere primeiro.` };
      const t = rolar("Golpe em passagem", `${P}d6`);
      return { dito: `Você atravessa uma linha de até 9 m: cada criatura no caminho sofre ${t} de dano (salvaguarda de Destreza, CD ${8 + P + Math.max(c.atr.des, c.atr.for)}; metade no sucesso).` };
    }
    case "drenar": {
      const estados = temCartao(c, "Fome") ? [v("marca"), v("doses"), v("selo"), v("ilusao")].filter((x) => x > 0).length : 0;
      const t = rolar("Drenar", `${P + estados}d6`);
      const pr = temCartao(c, "Dreno de reiatsu") ? Math.floor(t / 2) : 0;
      return { curaPv: t, ganhaPr: pr || undefined, dito: `Você drena ${t} do alvo${estados > 0 ? ` (Fome: +${estados} dado${estados === 1 ? "" : "s"})` : ""} e recupera ${t} PV${pr > 0 ? ` e ${pr} PR` : ""}.${temCartao(c, "Dreno partilhado") ? ` Um aliado a até 9 m recupera ${Math.floor(t / 2)} PV.` : ""}` };
    }
    case "conjunto": {
      const cri = (f.estado.invocacoes ?? []).find((x) => x.tipo !== "clone");
      if (!cri) return { erro: `${rotulo}: você não tem uma criatura em campo.` };
      if (v("conjunto") > 0) return { erro: `${rotulo}: o ataque conjunto já está armado.` };
      return { usos: set("conjunto", 1), dito: `${cri.nome} ataca junto com você: o seu próximo ataque no turno causa +1d8.` };
    }
    case "devorar": {
      const lista = f.estado.invocacoes ?? [];
      const cri = lista.find((x) => x.tipo !== "clone") ?? lista[0];
      if (!cri) return { erro: `${rotulo}: você não tem uma criatura em campo.` };
      const t = rolar("Devorar a criatura", `${P}d6`);
      return { some: cri.id, curaPv: t, dito: `Você absorve ${cri.nome} de volta e recupera ${t} PV.` };
    }
    case "furia": {
      if (v("sobre") < 1) return { erro: `${rotulo}: ligue a Sobrecarga primeiro.` };
      if (v("furia") > 0) return { erro: `${rotulo}: a fúria já está ligada.` };
      return { usos: set("furia", 1), dito: "Fúria sem distinção: até a Sobrecarga acabar você é imune a Amedrontado e tem vantagem contra quem o feriu no último turno; os seus golpes em área também atingem aliados." };
    }
    case "fenda": {
      if (v("fenda") < 1) return { erro: `${rotulo}: não há fenda aberta. Use Cortar o espaço primeiro.` };
      if (v("fenda-usada") > 0) return { erro: `${rotulo}: você já atravessou a fenda neste turno.` };
      return { usos: set("fenda-usada", 1), dito: "Você atravessa a fenda como parte do movimento: até 12 metros na direção do corte, sem provocar ataques de oportunidade." };
    }
    case "elo": {
      if (v("vinculo") < 1) return { erro: `${rotulo}: crie o vínculo primeiro.` };
      if (v("elo") > 0) return { erro: `${rotulo}: o elo já está apertado.` };
      return { usos: set("elo", 1), dito: `Elo apertado: a criatura ligada não se afasta mais de 9 metros de você. Se tentar, faz salvaguarda de Força (CD ${8 + P + c.atr.esp}) e, na falha, o movimento termina.` };
    }
    case "revelar": {
      if (v("marca") < 1 && v("marcas") < 1) return { erro: `${rotulo}: marque o alvo primeiro.` };
      if (v("revelado") > 0) return { erro: `${rotulo}: o alvo já está revelado.` };
      return { usos: set("revelado", 1), dito: "Alvo revelado: ele não fica invisível nem se esconde de você, e os seus aliados têm vantagem para achá-lo." };
    }
    case "regenerar": {
      const t = rolar("Regenerar a criatura", `${P}d8`);
      return { dito: `A criatura chamada recupera ${t} PV (some no total de PV dela na aba Invocações).` };
    }
    case "mutavel-arma": {
      if (v("mutavel") > 0) return { erro: `${rotulo}: a criatura já é uma arma.` };
      return { usos: set("mutavel", 1), dito: "A criatura vira uma arma de reiatsu: o seu próximo ataque no turno causa +1d10." };
    }
    case "mutavel-escudo": {
      if (v("escudo-mutavel") > 0) return { erro: `${rotulo}: a criatura já é um escudo.` };
      return { usos: set("escudo-mutavel", 1), dito: "A criatura vira um escudo de reiatsu: +2 de CR até o início do seu próximo turno (use Novo turno)." };
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
  if (v("mutavel") > 0) { b.dados.push("1d10"); b.tags.push("Criatura vira arma: +1d10"); b.gasta.push("mutavel"); }
  if (v("vantagem") > 0) { b.tags.push("Passo entre clones: vantagem no ataque"); b.gasta.push("vantagem"); }
  if (v("cadeia") > 0) { b.dados.push("1d6"); b.tags.push("Explosão em cadeia: +1d6"); b.gasta.push("cadeia"); }
  if (v("acel-golpe") > 0) { const n = Math.max(1, v("ritmo")); b.dados.push(`${n}d8`); b.tags.push(`Aceleração: +${n}d8`); b.gasta.push("acel-golpe"); }
  if (v("conjunto") > 0) { b.dados.push("1d8"); b.tags.push("Ataque conjunto: +1d8"); b.gasta.push("conjunto"); }
  if (v("marca-caca") > 0 && v("caca-usada") < 1) { b.acerto += 2; b.tags.push("Marca de caça: +2 no acerto (1º ataque do turno)"); }
  if (v("devolvido") > 0) { b.dados.push(String(v("devolvido"))); b.tags.push(`Devolver o golpe: +${v("devolvido")}`); b.gasta.push("devolvido", "devolvido-t"); }
  if (v("furia") > 0) b.tags.push("Fúria sem distinção: vantagem contra quem o feriu no último turno; golpe em área atinge aliados");
  if (v("revelado") > 0) b.tags.push("Alvo revelado: sem invisibilidade nem esconderijo");
  if (v("ilusao") > 0) b.tags.push("Alvo iludido: vantagem no ataque");
  if (v("selo") > 0) b.tags.push("Alvo selado (Preso)");
  if (v("doses") > 0) { const cr = temCartao(c, "Veneno que corrói") ? Math.min(3, Math.floor(v("doses") / 2)) : 0; b.tags.push(`Alvo envenenado: ${v("doses")} dose${v("doses") === 1 ? "" : "s"}${cr > 0 ? ` (−${cr} de CR)` : ""}`); }
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
  if (b.tags.some((t) => t.startsWith("Marca de caça"))) return { ...gastarAcertoBase(f, c, b), [PW("caca-usada")]: 1 };
  return gastarAcertoBase(f, c, b);
}
function gastarAcertoBase(f: Ficha, c: Calculo, b: BonusAtaque): Patch {
  return b.acerto > 0 ? { [PW("pg-usado")]: 1 } : {};
}

/** Quantos poderes copiados a forma guarda ao mesmo tempo (Cópia dupla: 2). */
export const capacidadeDeCopias = (c: Calculo) => (temCartao(c, "Cópia dupla") ? 2 : 1);

/** O ataque do poder copiado: acerto com o melhor atributo de ataque e o dano que a pessoa anotou. */
export function ataqueDoCopiado(c: Calculo, x: { nome: string; dano: string; pr: number }) {
  const atr = Math.max(c.atr.for, c.atr.des, c.atr.esp);
  return { nome: x.nome, acerto: c.prof + atr, dano: x.dano, pr: x.pr };
}

/* ---------- cartão de ação gerado pela técnica "Ataque com energia" ---------- */

export interface AtaqueEnergia {
  /** dano a rolar (base + Gran Rey Cero + bônus de outros poderes) */
  dano: string;
  /** soma do acerto */
  acerto: number;
  tags: string[];
  /** a energia está carregada? */
  pronto: boolean;
  /** o Lançar já foi pago e o acerto rolado: falta o dano */
  lancada: boolean;
  /** chaves a gastar quando o dano sai */
  gasta: string[];
  bonus: BonusAtaque;
}

/** A forma tem "Juntar energia" (técnica Ataque com energia)? */
export const temEnergia = (c: Calculo) => (c.forma?.botoes ?? []).some((b) => b.rotulo === "Juntar energia");

/** O ataque à distância que a própria técnica cria: proficiência d6 de Energia (+ proficiência d8 do Gran Rey Cero) + Espírito. Não depende de a forma ter um ataque à distância. */
export function ataqueDeEnergia(f: Ficha, c: Calculo): AtaqueEnergia | undefined {
  if (!temEnergia(c)) return undefined;
  const P = prof(c);
  const b = bonusDeAtaque(f, c, true);
  const esp = c.atr.esp;
  const dano = [`${P}d6`, ...b.dados].join("+") + (esp > 0 ? `+${esp}` : esp < 0 ? `${esp}` : "");
  const gasta = [...b.gasta, "lancada"];
  return { dano, acerto: c.prof + esp + (c.acertoDist ?? 0) + b.acerto, tags: b.tags, pronto: val(f, "energia") > 0, lancada: val(f, "lancada") > 0, gasta, bonus: b };
}

export interface AtaqueCorte { dano: string; acerto: number; tags: string[]; pronto: boolean; lancada: boolean; gasta: string[]; bonus: BonusAtaque; linha: boolean }

/** A forma tem "Cortar o espaço" (técnica Corte no espaço)? */
export const temCorte = (c: Calculo) => (c.forma?.botoes ?? []).some((b) => b.rotulo === "Cortar o espaço");

/** O ataque corpo a corpo que a própria técnica cria, a até 12 m e sem ser barrado por cobertura: proficiência d8 de dano cortante + atributo de Força ou Destreza (o maior). Com Corte em linha, atinge todos numa linha de 12 m. */
export function ataqueDeCorte(f: Ficha, c: Calculo): AtaqueCorte | undefined {
  if (!temCorte(c)) return undefined;
  const P = prof(c);
  const b = bonusDeAtaque(f, c, false);
  const atr = Math.max(c.atr.for, c.atr.des);
  const outros = b.dados;
  const dano = [`${P}d8`, ...outros].join("+") + (atr > 0 ? `+${atr}` : atr < 0 ? `${atr}` : "");
  return { dano, acerto: c.prof + atr + (c.acertoCorpo ?? 0) + b.acerto, tags: b.tags, pronto: val(f, "corte") > 0, lancada: val(f, "cortada") > 0, gasta: [...b.gasta, "cortada"], bonus: b, linha: temCartao(c, "Corte em linha") };
}
export const marcarCortada = (): Patch => set("cortada", 1);

/** O Lançar foi pago: marca o ataque como lançado (o dano vem depois). */
export const marcarLancada = (): Patch => set("lancada", 1);

/* ---------- virada de turno ---------- */

export interface ResTurno { usos: Patch; perdePv: number; ditos: string[] }

/** "Novo turno": renova o que vale por turno e aplica o que acontece no início do turno. */
export function turnoDosPoderes(f: Ficha, c: Calculo, rolar: Rolar): ResTurno {
  const P = prof(c);
  const r: ResTurno = { usos: {}, perdePv: 0, ditos: [] };
  r.usos[PW("cadeia-usada")] = undefined;
  r.usos[PW("pg-usado")] = undefined;
  if (val(f, "provocado") > 0) { r.usos[PW("provocado")] = undefined; r.ditos.push("a provocação terminou"); }
  if (val(f, "escudo-mutavel") > 0) { r.usos[PW("escudo-mutavel")] = undefined; r.ditos.push("a criatura-escudo se desfez (−2 de CR)"); }
  // veneno: o alvo sofre 1d4 por dose
  if (val(f, "doses") > 0) { const t = rolar("Veneno", `${val(f, "doses")}d4`); r.ditos.push(`Veneno: o alvo sofre ${t} (${val(f, "doses")} dose${val(f, "doses") === 1 ? "" : "s"})`); }
  // ilusão: dura até o fim do seu próximo turno (2 viradas), ou a cena inteira com Ilusão perfeita
  const ilu = val(f, "ilusao");
  if (ilu > 0 && ilu < 90) { r.usos[PW("ilusao")] = ilu - 1 <= 0 ? undefined : ilu - 1; if (ilu - 1 <= 0) r.ditos.push("a ilusão terminou"); }
  else if (ilu >= 90) r.ditos.push("Ilusão perfeita: a criatura repete a salvaguarda de Mente no fim do turno dela");
  if (val(f, "invertido") > 0) r.usos[PW("invertido")] = undefined;
  // selo: 3 turnos
  const selo = val(f, "selo");
  if (selo > 0) { r.usos[PW("selo")] = selo - 1 <= 0 ? undefined : selo - 1; r.ditos.push(selo - 1 <= 0 ? "o selo terminou" : `Selo: a criatura repete a salvaguarda de Força (faltam ${selo - 1} turno${selo - 1 === 1 ? "" : "s"})`); }
  // barreira que restaura
  if (val(f, "barreira") > 0 && temCartao(c, "Barreira que restaura")) r.ditos.push(`Barreira que restaura: aliados a até 3 m recuperam ${P} PV`);
  // aceleração: acaba no fim do turno; o ritmo só continua se você acelerou neste turno
  if (val(f, "acel") > 0) { r.usos[PW("acel")] = undefined; r.usos[PW("acel-golpe")] = undefined; }
  else if (val(f, "ritmo") > 0) { r.usos[PW("ritmo")] = undefined; if (temCartao(c, "Ritmo crescente")) r.ditos.push("o ritmo da aceleração zerou"); }
  if (val(f, "imagem") > 0) r.usos[PW("imagem")] = undefined;
  if (val(f, "conjunto") > 0) r.usos[PW("conjunto")] = undefined;
  // características de ação: o que é "1 vez por turno" volta, e o golpe guardado vale até o fim do próximo turno
  for (const k of ["exec-usada", "debil-usado", "duplo-usado", "caca-usada", "veu"]) if (val(f, k) > 0) r.usos[PW(k)] = undefined;
  const dev = val(f, "devolvido-t");
  if (dev > 0) { r.usos[PW("devolvido-t")] = dev - 1 <= 0 ? undefined : dev - 1; if (dev - 1 <= 0) { r.usos[PW("devolvido")] = undefined; r.ditos.push("o golpe guardado se perdeu"); } }
  // fenda do corte: fica aberta até o fim do próximo turno
  if (val(f, "fenda-usada") > 0) r.usos[PW("fenda-usada")] = undefined;
  const fenda = val(f, "fenda");
  if (fenda > 0) { r.usos[PW("fenda")] = fenda - 1 <= 0 ? undefined : fenda - 1; if (fenda - 1 <= 0) r.ditos.push("a fenda do corte se fechou"); }
  if (val(f, "elo") > 0) r.ditos.push(`Elo que prende: a criatura ligada que se afastar mais de 9 m faz salvaguarda de Força (CD ${8 + P + c.atr.esp})`);
  const sobre = val(f, "sobre");
  if (sobre > 0) {
    const ctl = temCartao(c, "Sobrecarga controlada");
    const t = rolar("Sobrecarga", ctl ? "1d4" : `${P}d4`);
    r.perdePv += t;
    r.usos[PW("sobre")] = sobre - 1 <= 0 ? undefined : sobre - 1;
    if (sobre - 1 <= 0 && val(f, "furia") > 0) { r.usos[PW("furia")] = undefined; r.ditos.push("a fúria terminou com a Sobrecarga"); }
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
  ["ilusao", "Alvo iludido"], ["invertido", "Sentidos invertidos"], ["selo", "Selo (turnos)"], ["barreira", "Barreira (PV)"], ["doses", "Doses de veneno"], ["acel", "Acelerado"], ["ritmo", "Ritmo"], ["imagem", "Imagem residual"], ["conjunto", "Ataque conjunto"], ["furia", "Fúria sem distinção"], ["alvo-fraco", "Alvo com metade dos PV"], ["marca-caca", "Marca de caça"], ["veu", "Véu de reiatsu (+2 CR)"], ["devolvido", "Golpe guardado"], ["fenda", "Fenda aberta (turnos)"], ["elo", "Elo apertado"], ["revelado", "Alvo revelado"],
  ["provocado", "Alvo provocado"], ["renasceu", "Já renasceu"], ["lancada", "Energia lançada"], ["cortada", "Corte lançado"], ["mutavel", "Criatura-arma"], ["escudo-mutavel", "Criatura-escudo (+2 CR)"], ["vantagem", "Vantagem no ataque"], ["dominio", "Domínio aberto"], ["regra", "Regra do campo"], ["vinculo", "Vínculo"], ["copia", "Poder copiado"], ["reforco", "Reforço"], ["cadeia", "Explosão em cadeia"],
];
export function poderesAtivos(f: Ficha): PoderAtivo[] {
  return NOMES.filter(([id]) => val(f, id) > 0).map(([id, nome]) => ({ id, nome, valor: (id === "copia" || id === "ilusao") && val(f, id) >= 90 ? "até a cena acabar" : id === "regra" ? (REGRA_DOMINIO[val(f, id)] ?? String(val(f, id))).replace(/ (para os inimigos )?(no campo|dentro do campo)/, "") : String(val(f, id)) }));
}
/** Apaga um poder do painel. */
export const limparPoder = (id: string): Patch => ({ [PW(id)]: undefined });

/** Junta um patch nos usos da ficha (apaga as chaves com undefined). */
export function aplicarUsos(f: Ficha, ...patches: Patch[]): Record<string, number> {
  const u: Record<string, number> = { ...usosDe(f) };
  for (const p of patches) for (const [k, x] of Object.entries(p)) { if (x === undefined) delete u[k]; else u[k] = x; }
  return u;
}

/* ---------- estado dos botões para a tela (pronto, aceso, medidor) ---------- */

export interface Medidor { nome: string; atual: number; max: number; /** "pips" = bolinhas; "barra" = barra com número */ tipo: "pips" | "barra" }
export interface EstadoBotao {
  /** dá para apertar agora? */
  pronto: boolean;
  /** por que não dá (em palavras) */
  motivo?: string;
  /** o botão é o "pagamento" de algo que você preparou e está pronto: a tela o destaca */
  aceso: boolean;
}

/** Botões que gastam ou usam algo preparado antes: quando ficam prontos, a tela acende. */
const PAGAMENTO = new Set([
  "Gran Rey Cero", "Descarregar as cargas", "Gastar cargas para se proteger", "Devolver o absorvido", "Guardado vira PV temporários", "Detonar as marcas", "Empilhar marca",
  "Impor a regra do domínio", "Passar o dano", "Usar o elo", "Guardar a cópia", "Usar o poder copiado", "Fazer renascer", "Inverter os sentidos", "Golpe no vazio",
  "Estilhaçar o selo", "Barreira recebe o golpe", "Segunda picada", "Beber o veneno", "Golpe em passagem", "Ataque conjunto", "Devorar a criatura",
]);

/** O estado de um botão de poder, sem mudar nada: o mesmo teste que o botão faz ao ser apertado. */
export function estadoDoBotao(rotulo: string, f: Ficha, c: Calculo): EstadoBotao {
  if (!poderDoBotao(rotulo)) return { pronto: true, aceso: false };
  const r = acionarPoder(rotulo, f, c, () => 0, 1, rotulo === "Impor a regra do domínio" ? 1 : 0);
  if (r?.erro) return { pronto: false, motivo: r.erro.replace(/^[^:]+:\s*/, ""), aceso: false };
  if (rotulo === "Impor a regra do domínio" && val(f, "regra") > 0) return { pronto: true, aceso: false };
  return { pronto: true, aceso: PAGAMENTO.has(rotulo) };
}

/** O medidor de uma técnica, pelo botão principal dela (cargas, marcas, doses, PV da barreira…). */
export function medidorDoBotao(rotulo: string, f: Ficha, c: Calculo): Medidor | undefined {
  const P = prof(c);
  const v = (x: string) => val(f, x);
  switch (rotulo) {
    case "Juntar energia": return { nome: "Energia", atual: v("energia"), max: temCartao(c, "Energia em dobro") ? 2 : 1, tipo: "pips" };
    case "Ganhar carga": return { nome: "Cargas", atual: v("cargas"), max: P, tipo: "pips" };
    case "Marcar para detonar": return { nome: "Marcas", atual: v("marcas"), max: P, tipo: "pips" };
    case "Envenenar": return { nome: "Doses", atual: v("doses"), max: P, tipo: "pips" };
    case "Selar": return { nome: "Selo (turnos)", atual: v("selo"), max: 3, tipo: "pips" };
    case "Sobrecarregar": return { nome: "Sobrecarga (turnos)", atual: v("sobre"), max: 2, tipo: "pips" };
    case "Acelerar": return temCartao(c, "Ritmo crescente") ? { nome: "Ritmo", atual: v("ritmo"), max: 3, tipo: "pips" } : { nome: "Acelerado", atual: v("acel"), max: 1, tipo: "pips" };
    case "Marcar alvo": return temCartao(c, "Peso dobrado") ? { nome: "Peso", atual: v("peso"), max: P, tipo: "pips" } : { nome: "Marcado", atual: v("marca"), max: 1, tipo: "pips" };
    case "Absorver o golpe": return { nome: "Guardado", atual: v("guardado"), max: 4 * P, tipo: "barra" };
    case "Erguer barreira": return { nome: "Barreira", atual: v("barreira"), max: (temCartao(c, "Barreira ampla") ? 8 : 5) * P, tipo: "barra" };
    case "Copiar poder": return v("copia") >= 90 ? { nome: "Cópia guardada", atual: 1, max: 1, tipo: "pips" } : { nome: "Cópia (turnos)", atual: v("copia"), max: P, tipo: "pips" };
    case "Abrir o domínio": return { nome: "Domínio", atual: v("dominio"), max: 1, tipo: "pips" };
    case "Criar vínculo": return { nome: "Vínculo", atual: v("vinculo"), max: 1, tipo: "pips" };
    case "Lançar ilusão": return { nome: "Ilusão", atual: v("ilusao") > 0 ? 1 : 0, max: 1, tipo: "pips" };
    case "Cortar o espaço": return { nome: "Corte", atual: v("corte"), max: 1, tipo: "pips" };
    default: return undefined;
  }
}

/** O que os poderes ligados somam no próximo golpe, em uma linha (ex.: "+5d6 +1d8"), para o painel. */
export function resumoDoProximoGolpe(f: Ficha, c: Calculo): { corpo: string; dist: string } {
  const junta_ = (b: BonusAtaque) => [...b.dados.map((d) => `+${d}`), ...(b.acerto ? [`+${b.acerto} acerto`] : [])].join(" ");
  return { corpo: junta_(bonusDeAtaque(f, c, false)), dist: junta_(bonusDeAtaque(f, c, true)) };
}


/* ---------- cartões de característica ligados a uma ação ---------- */

/** Um botão que a característica põe no cartão de ação. */
export interface BotaoCarac {
  id: string;
  rotulo: string;
  dica: string;
  /** rola o d20 de acerto da ação (segundo golpe) */
  d20?: boolean;
  /** rola esta expressão */
  expr?: string;
  /** muda os usos */
  usos?: Patch;
  /** o que dizer na tela */
  dito?: string;
  /** botão ligado/desligado (mostra aceso) */
  aceso?: boolean;
  /** o motivo de não poder agora */
  travado?: string;
}
export interface EfeitoDeCaracs {
  /** dados a mais no dano desta ação */
  dados: string[];
  tags: string[];
  /** menor valor do d20 que dá crítico */
  critMin: number;
  /** chaves de uso que o dano rolado gasta */
  gasta: string[];
  botoes: BotaoCarac[];
}

/** O que os cartões de característica ligados a uma ação fazem de verdade: dados, crítico, tags e botões.
    `reduzido`: o último valor que a ação de proteção rolou (Devolver o golpe guarda esse valor). */
export function efeitoDasCaracs(marcas: InstEfeito[], f: Ficha, c: Calculo, opc: { reduzido?: number; efeito?: string } = {}): EfeitoDeCaracs {
  const P = prof(c);
  const r: EfeitoDeCaracs = { dados: [], tags: [], critMin: 20, gasta: [], botoes: [] };
  const cd = (atr: number) => 8 + P + atr;
  if (opc.efeito) { const b = botaoDoEfeito(opc.efeito, f, c); if (b) r.botoes.push(b); }
  const ids = new Set(marcas.map((m) => m.carac?.id).filter(Boolean) as string[]);
  const tem = (id: string) => ids.has(id);
  const v = (x: string) => val(f, x);
  if (tem("critico-ampliado")) { r.critMin = 19; r.tags.push("Crítico em 19 ou 20"); }
  if (tem("atravessa")) r.tags.push("Ignora 5 de redução de dano");
  if (tem("alcance")) r.tags.push("+6 m de alcance");
  if (tem("linha")) r.tags.push(`Linha de 12 m · CD ${cd(Math.max(c.atr.esp, c.atr.for))} Destreza`);
  if (tem("explosao")) r.tags.push(`Explosão de 9 m em volta · CD ${cd(c.atr.esp)} Destreza · sem reação`);
  if (tem("area-ampliada")) r.tags.push("Raio de 12 m");
  if (tem("execucao")) {
    const fraco = v("alvo-fraco") > 0, usada = v("exec-usada") > 0;
    if (fraco && !usada) { r.dados.push(`${P}d6`); r.gasta.push("exec-usada"); r.tags.push(`Misericórdia: +${P}d6`); }
    else if (fraco) r.tags.push("Misericórdia já usada neste turno");
    r.botoes.push({ id: "alvo-fraco", rotulo: fraco ? "Alvo com metade dos PV: sim" : "Alvo com metade dos PV?", dica: "Golpe de misericórdia: liga quando o alvo está com metade dos PV ou menos.", aceso: fraco, usos: set("alvo-fraco", fraco ? 0 : 1) });
  }
  if (tem("golpe-duplo")) {
    r.tags.push("Dois golpes");
    r.botoes.push({ id: "duplo", rotulo: "Segundo golpe", dica: "Rola o acerto do segundo golpe, no mesmo alvo ou em outro a 3 m. O dano é dividido entre os alvos.", d20: true, travado: v("duplo-usado") > 0 ? "o segundo golpe já saiu neste turno" : undefined, usos: set("duplo-usado", 1), dito: "segundo golpe rolado. Se for em outro alvo a 3 m, o dano total é dividido entre os dois." });
  }
  if (tem("empurrao")) r.botoes.push({ id: "empurrao", rotulo: "Empurrar 6 m", dica: "Empurra o alvo 6 m; se bater em algo sólido, 1d6 de dano.", expr: "1d6", dito: "o alvo é empurrado 6 metros. O 1d6 só vale se ele bater em algo sólido." });
  if (tem("puxar")) r.botoes.push({ id: "puxar", rotulo: "Puxar 6 m", dica: "Salvaguarda de Força; se falhar, é puxado 6 m.", expr: "1d6", dito: `o alvo faz salvaguarda de Força (CD ${cd(Math.max(c.atr.for, c.atr.esp))}); se falhar, é puxado 6 metros na sua direção. O 1d6 só vale se ele bater em algo sólido no caminho.` });
  if (tem("debilitar")) r.botoes.push({ id: "debilitar", rotulo: "Enfraquecer", dica: "Constituição; na falha, −2 na CR, no acerto ou no dano dele. 1 vez por turno.", travado: v("debil-usado") > 0 ? "já enfraqueceu neste turno" : undefined, usos: set("debil-usado", 1), dito: `o alvo faz salvaguarda de Constituição (CD ${cd(c.atr.esp)}); se falhar, você escolhe −2 na CR, no acerto ou no dano dele até o fim do próximo turno dele.` });
  if (tem("limpar-condicao")) r.botoes.push({ id: "purificar", rotulo: "Purificar", dica: "Remove uma condição leve ou média sua ou de um aliado a até 9 m.", dito: "uma condição leve ou média sua, ou de um aliado a até 9 metros, é removida." });
  if (tem("devolver-golpe")) {
    const n = Math.min(2 * P, Math.max(0, Math.floor(opc.reduzido ?? 0)));
    const guardado = v("devolvido") > 0;
    r.botoes.push({ id: "devolver", rotulo: guardado ? `Golpe guardado: +${v("devolvido")}` : "Guardar o reduzido", dica: `Guarda o que a ação reduziu (até ${2 * P}); o seu próximo ataque, até o fim do próximo turno, causa esse valor a mais.`, aceso: guardado, travado: guardado ? "já há um golpe guardado" : n < 1 ? "role a proteção primeiro" : undefined, usos: junta(set("devolvido", n), set("devolvido-t", 2)), dito: `${n} de dano reduzido ficam guardados: o seu próximo ataque, até o fim do próximo turno, causa +${n}.` });
  }
  return r;
}

/** Os cartões de Reação com efeito e de Ação sem dano: o botão que aplica o efeito escolhido, com a CD já calculada. */
export function botaoDoEfeito(id: string, f: Ficha, c: Calculo): BotaoCarac | undefined {
  const P = prof(c);
  const v = (x: string) => val(f, x);
  const cd = (atr: number) => 8 + P + atr;
  const esp = c.atr.esp;
  const salva = (rotulo: string, dica: string, atrNome: string, atr: number, falha: string): BotaoCarac => ({ id: "ef-" + id, rotulo, dica, dito: `o alvo faz salvaguarda de ${atrNome} (CD ${cd(atr)}). ${falha}` });
  switch (id) {
    case "anular": return salva("Anular", "Salvaguarda de Espírito de quem usou a técnica.", "Espírito", esp, "Se falhar, a técnica é anulada e não causa nada.");
    case "travar": return salva("Travar o atacante", "Salvaguarda de Força de quem atacou.", "Força", Math.max(c.atr.for, esp), "Se falhar, fica Preso até o início do próximo turno dele.");
    case "imagem-falsa": return salva("Imagem falsa", "Salvaguarda de Mente de quem atacou.", "Mente", esp, "Se falhar, o golpe acerta uma imagem sua e erra.");
    case "conter": return salva("Conter", "Salvaguarda de Força, alvo a até 18 m.", "Força", Math.max(c.atr.for, esp), "Se falhar, fica Preso até o fim do próximo turno dele.");
    case "pavor": return salva("Pavor", "Salvaguarda de Mente, alvo a até 18 m.", "Mente", esp, "Se falhar, fica Amedrontado até o fim do próximo turno dele.");
    case "silencio": return salva("Silêncio espiritual", "Salvaguarda de Espírito, alvo a até 18 m.", "Espírito", esp, "Se falhar, não usa técnicas que gastem PR até o fim do próximo turno dele.");
    case "veneno-paralisante": return salva("Veneno que enfraquece", "Salvaguarda de Constituição, alvo a até 9 m.", "Constituição", Math.max(c.atr.des, esp), "Se falhar, sofre −2 no acerto e no dano até o fim do próximo turno dele.");
    case "trocar": return { id: "ef-" + id, rotulo: "Trocar de lugar", dica: "Troca com um aliado a até 9 m.", dito: "você troca de lugar com um aliado a até 9 metros; o ataque que ia atingir um dos dois atinge o outro." };
    case "redirecionar": return { id: "ef-" + id, rotulo: "Redirecionar", dica: "Outra criatura a até 3 m vira o alvo.", dito: "o ataque muda de alvo: outra criatura a até 3 metros de você passa a ser o alvo, com um novo teste de acerto." };
    case "esquivar": return { id: "ef-" + id, rotulo: "Esquivar", dica: "Move até 6 m sem provocar; o ataque tem desvantagem.", dito: "você se move até 6 metros sem provocar ataques de oportunidade e o ataque contra você tem desvantagem." };
    case "fenda-fuga": return { id: "ef-" + id, rotulo: "Fugir pela fenda", dica: "Reaparece a até 9 m; o ataque se perde.", dito: "você some e reaparece em um ponto livre a até 9 metros; o ataque que mirava você é perdido." };
    case "marca-caca": return { id: "ef-" + id, rotulo: v("marca-caca") > 0 ? "Alvo marcado (caça)" : "Marcar a presa", dica: "Até o fim da cena: você sabe onde ela está e o 1º ataque do turno soma +2 no acerto.", aceso: v("marca-caca") > 0, travado: v("marca-caca") > 0 ? "a presa já está marcada" : undefined, usos: set("marca-caca", 1), dito: "presa marcada até o fim da cena: você sempre sabe onde ela está e o primeiro ataque seu em cada turno contra ela soma +2 no acerto (já entra no Acerto da ação de ataque)." };
    case "marca-reveladora": return { id: "ef-" + id, rotulo: v("revelado") > 0 ? "Alvo revelado" : "Marcar para revelar", dica: "Até o fim da cena: sem invisibilidade nem esconderijo; aliados +1 no 1º ataque do turno.", aceso: v("revelado") > 0, travado: v("revelado") > 0 ? "o alvo já está revelado" : undefined, usos: set("revelado", 1), dito: "alvo marcado até o fim da cena: ele não fica invisível nem escondido de você, e os aliados somam +1 no primeiro ataque do turno contra ele." };
    case "veu": return { id: "ef-" + id, rotulo: v("veu") > 0 ? "Véu erguido (+2 CR)" : "Erguer o véu", dica: "+2 de CR em você ou num aliado a até 9 m, até o início do seu próximo turno.", aceso: v("veu") > 0, travado: v("veu") > 0 ? "o véu já está erguido" : undefined, usos: set("veu", 1), dito: "véu de reiatsu: +2 de CR em você ou em um aliado a até 9 metros, até o início do seu próximo turno." };
    case "voo": return { id: "ef-" + id, rotulo: "Alçar voo", dica: "Você ou um aliado a até 9 m voa até o deslocamento.", dito: "você ou um aliado a até 9 metros voa até o deslocamento, sem provocar ataques de oportunidade, e fica no ar até o fim do turno." };
    case "impulso": return { id: "ef-" + id, rotulo: "Dar impulso", dica: "Você ou um aliado a até 9 m se move o dobro do deslocamento.", dito: "você ou um aliado a até 9 metros se move até o dobro do deslocamento, sem provocar ataques de oportunidade." };
    case "luz": return { id: "ef-" + id, rotulo: "Acender a luz", dica: "Ilumina 18 m por 1 minuto e revela invisíveis.", dito: "a luz de reiatsu ilumina uma área de 18 metros por 1 minuto e deixa à mostra as criaturas invisíveis dentro dela." };
  }
  return undefined;
}
