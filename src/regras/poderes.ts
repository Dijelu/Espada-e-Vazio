/* Poderes das técnicas especiais e das interações especiais: o estado que os botões guardam na ficha e os bônus que ele dá
   aos cartões de ação. Tudo aqui é conta pura (sem tela), para poder testar com fichas.
   O estado fica em `estado.usos`, em chaves "pw:<poder>" com números. Ele some quando a forma termina.
   Os botões são achados pelo ROTULO, porque fichas antigas guardaram esses botões como texto (sem nenhuma marca de poder). */
import type { Calculo, Ficha, Invocacao } from "./ficha";
import { BONUS_SIMPLES, NOMES_SIMPLES, SIMPLES, acionarSimples, turnoSimples } from "./poderes-simples";
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
  /** PR a mais que o botão gasta (além do custo do ritmo), ex.: guardar na reserva */
  gastaPr?: number;
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
  "Forçar a regeneração": "forcar-regen", "Regenerar membro": "regen-membro", "Recompor a armadura": "recompor-armadura", "Armadura que estoura": "armadura-estoura",
  "Esticar o limite": "esticar-limite", "Somar sequência": "seq", "Errar a sequência": "seq-erro", "Finalizar a sequência": "seq-final",
  "Esquentar": "calor", "Ventilar": "ventilar", "Dissipar em escudo": "calor-escudo", "Pagar com sangue": "sangue", "Sangue na lâmina": "sangue-lamina",
  "Ler o oponente": "ler", "Ler o padrão": "ler-padrao", "Gelo no alvo": "gelo", "Arco voltaico": "arco",
  "Começar contagem": "contagem", "Acertar o marcado": "contagem-acerto", "Impor tabu": "tabu", "Ela quebrou o tabu": "tabu-quebra",
  "Apoio do familiar": "familiar-apoio", "Desviar": "desviar",
  "Voltar um instante": "voltar", "Voltar o erro": "voltar-erro", "Guardar reserva": "reserva", "Soltar reserva": "reserva-solta", "Reserva de emergência": "reserva-emerg", "Reserva para o aliado": "reserva-aliado",
  "Apostar": "aposta", "Sorte de jogador": "sorte", "Desaparecer": "invisivel", "Sumir parado": "sumir", "Deixar âncora": "ancora", "Voltar à âncora": "ancora-volta",
  "Endurecer": "endurecer", "Corpo de aço": "corpo-aco", "Lançar fio": "fio", "Puxar o fio": "fio-puxa", "Esconder armadilha": "armadilha", "Armadilha disparou": "armadilha-dispara",
  "Mover armadilha": "armadilha-move", "Bala": "bala", "Rajada": "rajada", "Saciar a fome": "fome",
  "Marcar território": "territorio", "Entrar ou sair do território": "territorio-troca", "Voltar ao território": "territorio-volta", "Cruzaram a fronteira": "fronteira",
  "Abrir santuário": "santuario", "Doar reiatsu": "doar", "Jurar proteção": "juramento", "Feriram o protegido": "ira", "O protegido caiu": "juramento-caiu",
  "Amaldiçoar": "maldicao", "A maldição pula": "maldicao-pula", "Ela usou técnica": "maldicao-preco", "Marca protetora": "protetora", "A marca protege": "protetora-usa",
  "Aparar": "aparar", "Aparei": "aparei", "Firmar a postura": "postura", "Crescer": "crescer", "Pisotear": "pisotear",
  "Lâmina em órbita": "orbita", "Lançar lâmina": "orbita-lanca", "Muralha giratória": "orbita-muralha", "Chuva de órbita": "orbita-chuva",
  "Trocar de lugar": "troca", "Troca na linha de fogo": "troca-fogo", "Surpresa total": "surpresa", "Atrasar o golpe": "atraso", "O golpe atrasado acertou": "atraso-guarda", "Soltar o atraso": "atraso-solta",
  "Achar o ponto vital": "vital", "Lâmina de vento": "vento", "Vento a favor": "vento-favor", "Clarão": "clarao", "Curar a si": "cura-si", "Curar um aliado": "cura-aliado",
  "Executar": "executar", "Regenerar": "regen-veloz", "Sem dor": "sem-dor", "Rugir": "rugido", "Blefar": "blefe",
};
/** As três regras que o domínio pode impor (a pessoa escolhe uma). */
export const REGRA_DOMINIO: Record<number, string> = { 1: "terreno difícil para os inimigos no campo", 2: "inimigos no campo com −2 de CR", 3: "você com vantagem nas salvaguardas dentro do campo" };
for (const [id, sp] of Object.entries(SIMPLES)) PODER_POR_ROTULO[sp.rot] = id;
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
/** Interações que só mudam como a mesa lê o efeito: o botão da técnica lembra delas na hora em que é apertado. */
const LEMBRETES: Record<string, [string, string][]> = {
  "Ler o oponente": [["Fraqueza exposta", "os aliados que ouvirem você também recebem o bônus de acerto das leituras."]],
  "Arco voltaico": [["Raio na água", "alvos molhados que falharem por 5 ou mais ficam Atordoados até o fim do próximo turno deles."], ["Aterrar", "o raio pula os seus aliados."]],
  "Desviar": [["Cobrir o aliado", "o desvio vale também para um aliado a até 1,5 m de você."]],
  "Voltar um instante": [["Voltar um aliado", "pode valer para um aliado a até 9 m; ele recupera o dano do golpe, até 5 × proficiência."]],
  "Apostar": [["Apostar contra ele", "o alvo escolhe par ou ímpar; se errar, o seu ataque também tem vantagem."]],
  "Desaparecer": [["Pegadas falsas", "quem tenta achar você tem desvantagem em Percepção."]],
  "Voltar à âncora": [["Âncora num aliado", "se a âncora estiver presa num aliado, você aparece a 1,5 m dele."], ["Com passageiro", "leva junto uma criatura que você esteja agarrando ou que aceite."]],
  "Marcar território": [["Raízes", "no território você não pode ser empurrado nem derrubado."]],
  "Marca protetora": [["Marca que avisa", "o aliado marcado não pode ser surpreendido e tem +2 de iniciativa."], ["Passar a marca", "como reação, a marca pula para outro aliado a até 9 m."]],
  "Firmar a postura": [["Quebrar o golpe", "se um golpe corpo a corpo não passar da sua redução de dano, quem atacou faz salvaguarda de Força ou fica Caído."]],
  "Executar": [["Olhar do ceifador", "você sabe quais criaturas a até 18 m estão abaixo do limite da execução."]],
  "Blefar": [["Nome falso", "o blefe também confunde quem tenta Copiar ou Ler você."]],
  "Gelo no alvo": [["Chão gelado", "quando o gelo chega a 3, o chão a 3 m do alvo vira escorregadio (Destreza ou Caído)."]],
  "Acertar o marcado": [["Contagem que passa", "se o marcado cair, a contagem continua noutra criatura, com o número que tinha."]],
  "Apoio do familiar": [["Familiar que leva o toque", "técnicas e Kidō de toque podem sair do familiar."], ["Familiar na sombra", "o familiar pode se esconder na sombra de um aliado (não pode ser alvo)."]],
  "Golpe combinado": [["Elementos cruzados", "se o aliado tiver outro tipo de dano, o alvo perde a resistência aos dois até o fim do turno."]],
  "Abrir corte": [["Cheiro de sangue", "você sempre sabe onde está a criatura cortada, mesmo invisível."]],
  "Distorcer distância": [["Passo curto", "para você e aliados, dentro da área, cada 3 m conta como 1,5 m."]],
  "Desacelerar": [["Tempo roubado", "para cada inimigo Lento, você ganha +1,5 m de deslocamento no turno."]],
  "Desgastar": [["Desgaste fundo", "o desgaste só sai com um descanso longo."]],
  "Entrar em ressonância": [["Eco", "quando você acerta um crítico, os aliados em ressonância ganham vantagem no próximo ataque."]],
  "Farejar ferido": [["Golpe no ferido", "um crítico no ferido farejado faz ele sangrar 1d6 por turno até ser tratado."]],
  "Medir a força": [["Rastro", "você segue uma criatura que fugiu até o fim da cena."]],
};

/** Aperta um botão de técnica: resolve o poder e acrescenta os lembretes das interações que estão na forma. */
export function acionarPoder(rotulo: string, f: Ficha, c: Calculo, rolar: Rolar, dano = 0, opcao = 0): ResPoder | undefined {
  const r = acionarPoderBase(rotulo, f, c, rolar, dano, opcao);
  if (!r || r.erro || !r.dito) return r;
  const extra = (LEMBRETES[rotulo] ?? []).filter(([n]) => temCartao(c, n)).map(([n, t]) => ` ${n}: ${t}`).join("");
  return extra ? { ...r, dito: r.dito + extra } : r;
}

function acionarPoderBase(rotulo: string, f: Ficha, c: Calculo, rolar: Rolar, dano = 0, opcao = 0): ResPoder | undefined {
  const id = poderDoBotao(rotulo);
  if (!id) return undefined;
  const P = prof(c);
  const v = (x: string) => val(f, x);
  if (SIMPLES[id]) return acionarSimples(id, { P, cd: 8 + P + c.atr.esp, cdFor: 8 + P + Math.max(c.atr.for, c.atr.des), tem: (n) => temCartao(c, n), c, f, dano }, v, rolar);
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
      const tox = temCartao(c, "Toxina e veneno") ? Math.min(3, n) : 0;
      return { usos: set("doses", n), dito: `Dose ${n} de ${P}: no início de cada turno seu, o alvo sofre ${n}d4 de veneno${cr > 0 ? `; ele está com −${cr} de CR` : ""}${tox > 0 ? `; a CD da toxina contra ele sobe +${tox}` : ""}.${n === P && temCartao(c, "Segunda picada") ? " Máximo de doses: a Segunda picada está pronta." : ""}` };
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
    /* ---- primeira leva de técnicas novas ---- */
    case "forcar-regen": return { curaPv: P, dito: `A regeneração deste turno dobra: você recupera mais ${P} PV.` };
    case "regen-membro": {
      if (v("regen-membro") > 0) return { erro: `${rotulo}: já foi usado nesta cena.` };
      return { usos: set("regen-membro", 1), curaPv: 3 * P, dito: `Um membro se refaz: você recupera ${3 * P} PV e se livra de uma condição física.` };
    }
    case "recompor-armadura": {
      const alvo = 2 * P;
      if ((f.estado.pvTemp ?? 0) >= alvo) return { erro: `${rotulo}: a armadura já está com ${f.estado.pvTemp} PV temporários.` };
      return { pvTemp: alvo, dito: `A armadura se recompõe: ${alvo} PV temporários.` };
    }
    case "armadura-estoura": {
      if ((f.estado.pvTemp ?? 0) > 0) return { erro: `${rotulo}: só quando os PV temporários acabam.` };
      if (v("estourou") > 0) return { erro: `${rotulo}: já estourou nesta cena.` };
      const t = rolar("Armadura que estoura", "2d6");
      return { usos: set("estourou", 1), dito: `A armadura estoura: criaturas a até 3 m fazem salvaguarda de Destreza (CD ${8 + P + c.atr.esp}) ou sofrem ${t}.` };
    }
    case "esticar-limite": {
      if (v("limite-turno") > 0) return { erro: `${rotulo}: só 1 vez por turno.` };
      return { usos: junta(set("limite-turno", 1), set("limite-extra", v("limite-extra") + 1)), dito: `O limite da forma sobe 1 turno (+${v("limite-extra") + 1} no total).` };
    }
    case "seq": {
      if (v("seq") >= P) return { erro: `${rotulo}: a sequência já está no máximo (${P}).` };
      return { usos: set("seq", v("seq") + 1), dito: `Sequência ${v("seq") + 1}/${P}: +${v("seq") + 1} de dano nos golpes.` };
    }
    case "seq-erro": {
      if (v("seq") < 1) return { erro: `${rotulo}: não há sequência.` };
      const fica = temCartao(c, "Sequência firme") ? Math.floor(v("seq") / 2) : 0;
      return { usos: set("seq", fica), dito: fica > 0 ? `Sequência firme: a sequência cai para ${fica}.` : "A sequência zerou." };
    }
    case "seq-final": {
      if (v("seq") < 3) return { erro: `${rotulo}: precisa de 3 ou mais de sequência.` };
      return { usos: junta(set("seq", 0), set("seq-final", 1)), dito: `Sequência gasta: o próximo golpe exige salvaguarda de Constituição (CD ${8 + P + Math.max(c.atr.for, c.atr.des, c.atr.esp)}) ou deixa o alvo Atordoado até o fim do próximo turno dele.` };
    }
    case "calor": {
      if (v("calor") >= 5) return { erro: `${rotulo}: o calor já está em 5; descarregue (Ventilar) ou sofra no início do turno.` };
      return { usos: set("calor", v("calor") + 1), dito: `Calor ${v("calor") + 1}/5: +${v("calor") + 1} de dano nos golpes.${v("calor") + 1 >= 5 ? " No início do próximo turno você descarrega ou sofre 3d6 de Fogo." : ""}` };
    }
    case "ventilar": {
      if (v("calor") < 1) return { erro: `${rotulo}: não há calor.` };
      const t = rolar("Ventilar", `${v("calor")}d4`);
      return { usos: set("calor", 0), dito: `O calor sai em vapor (cone de 4,5 m): salvaguarda de Destreza (CD ${8 + P + c.atr.esp}), ${t} de dano de Fogo.` };
    }
    case "calor-escudo": {
      if (v("calor") < 1) return { erro: `${rotulo}: não há calor.` };
      const t = v("calor") * P;
      return { usos: set("calor", 0), pvTemp: Math.max(f.estado.pvTemp ?? 0, t), dito: `O calor vira escudo: ${t} PV temporários.` };
    }
    case "sangue": {
      if (f.pvAtual <= 1) return { erro: `${rotulo}: PV insuficientes.` };
      const pago = Math.min(3 * P, f.pvAtual - 1);
      return { usos: set("sangue", v("sangue") + pago), perdePv: pago, ganhaPr: Math.floor(pago / 2), dito: `Você paga ${pago} PV (nada reduz) e recupera ${Math.floor(pago / 2)} PR.` };
    }
    case "sangue-lamina": {
      const n = Math.floor(v("sangue") / 5);
      if (n < 1) return { erro: `${rotulo}: pague pelo menos 5 PV com sangue primeiro.` };
      return { usos: junta(set("sangue", 0), set("sangue-golpe", n)), dito: `O próximo golpe causa +${n}d6.` };
    }
    case "ler": {
      if (v("leituras") >= 3) return { erro: `${rotulo}: já são 3 leituras, o máximo.` };
      return { usos: set("leituras", v("leituras") + 1), dito: `Teste de Intuição contra 10 + a proficiência do alvo. Se passar: leitura ${v("leituras") + 1}/3 (+${v("leituras") + 1} no acerto contra ele até o fim da cena) e você descobre uma resistência, uma fraqueza ou a CR dele.` };
    }
    case "ler-padrao": {
      if (v("leituras") < 3) return { erro: `${rotulo}: precisa de 3 leituras.` };
      return { usos: set("leituras", 0), dito: "Você lê o padrão dele: um ataque do alvo lido tem desvantagem. As leituras zeram." };
    }
    case "gelo": {
      const n = v("gelo") + 1;
      const cd = 8 + P + c.atr.esp;
      if (n >= 3) return { usos: set("gelo", 0), dito: `Gelo 3/3: o alvo faz salvaguarda de Constituição (CD ${cd}) ou fica Contido até o fim do próximo turno dele. O gelo zera.${temCartao(c, "Frio que se espalha") ? " Frio que se espalha: cada criatura a até 3 m dele ganha 1 de gelo." : ""}` };
      return { usos: set("gelo", n), dito: n === 1 ? "Gelo 1/3: o alvo perde 3 m de deslocamento." : "Gelo 2/3: o alvo fica sem reações." };
    }
    case "arco": {
      const t = rolar("Arco voltaico", `${P}d6`);
      const saltos = Math.max(1, Math.floor(P / 2));
      return { dito: `O raio atinge uma criatura a até 18 m (salvaguarda de Destreza, CD ${8 + P + c.atr.esp}): ${t} de dano elétrico. Salta para até ${saltos} criatura${saltos === 1 ? "" : "s"}, cada uma a até 4,5 m da anterior, com metade do dano anterior.${temCartao(c, "Magnetismo") ? " Magnetismo: o último alvo é puxado 3 m para você." : ""}` };
    }
    case "contagem": {
      if (v("contagem") > 0) return { erro: `${rotulo}: já há uma contagem em andamento.` };
      return { usos: set("contagem", P), dito: `Marca posta com o número ${P}. Cada vez que você a acerta, o número cai 1; no 0, o seu próximo golpe nela é crítico.` };
    }
    case "contagem-acerto": {
      if (v("contagem") < 1) return { erro: `${rotulo}: comece uma contagem primeiro.` };
      const n = v("contagem") - 1;
      if (n <= 0) return { usos: junta(set("contagem", 0), set("contagem-crit", 1)), dito: "A contagem chegou a 0: o seu próximo golpe no marcado é crítico." };
      return { usos: set("contagem", n), dito: `A contagem cai para ${n}.` };
    }
    case "tabu": {
      const cap = temCartao(c, "Tabu duplo") ? 2 : 1;
      if (v("tabu") >= 1) return { erro: `${rotulo}: já há um tabu imposto.` };
      return { usos: set("tabu", cap), dito: `Tabu imposto a uma criatura a até 18 m: ${cap === 2 ? "duas ações proibidas" : "uma ação proibida"} (atacar você, andar mais de 3 m ou usar técnica).` };
    }
    case "tabu-quebra": {
      if (v("tabu") < 1) return { erro: `${rotulo}: não há tabu imposto.` };
      const resta = v("tabu") - 1;
      if (temCartao(c, "Tabu que trava")) return { usos: set("tabu", resta), dito: `Ela quebrou o tabu: salvaguarda de Espírito (CD ${8 + P + c.atr.esp}) ou fica Atordoada até o fim do próximo turno dela.` };
      const t = rolar("Tabu", `${P + (temCartao(c, "Tabu secreto") ? 1 : 0)}d6`);
      return { usos: set("tabu", resta), dito: `Ela quebrou o tabu e sofre ${t} de dano de Energia, sem salvaguarda.` };
    }
    case "familiar-apoio": {
      if (!(f.estado.invocacoes ?? []).some((x) => /^Familiar/.test(x.nome))) return { erro: `${rotulo}: chame o familiar primeiro.` };
      const d = temCartao(c, "Apoio redobrado") ? "1d6" : "1d4";
      const t = rolar("Apoio do familiar", d);
      return { dito: `O familiar apoia ${temCartao(c, "Apoio redobrado") ? "dois aliados" : "um aliado"} a até 9 m dele: +${t} (${d}) na próxima jogada de ataque ou salvaguarda.` };
    }
    /* ---- segunda leva ---- */
    case "voltar": case "voltar-erro": {
      const lim = P >= 5 ? 2 : 1;
      if (v("voltou") >= lim) return { erro: `${rotulo}: já usou ${lim === 1 ? "o único uso" : "os dois usos"} desta cena.` };
      if (id === "voltar-erro") return { usos: set("voltou", v("voltou") + 1), dito: "O tempo volta: role de novo o ataque seu que errou, no mesmo alvo." };
      const cura = dano > 0 ? Math.min(dano, 5 * P) : 0;
      const ja = temCartao(c, "Já vi esse golpe");
      return { usos: junta(set("voltou", v("voltou") + 1), ja ? set("vant-voltou", 1) : {}), ...(dano > 0 ? { perdePv: dano - cura } : {}), dito: `${dano > 0 ? `O golpe é desfeito: você recupera ${cura} (de ${dano}); sofre ${dano - cura}, já descontado. ` : "Digite o dano do golpe para o sistema descontar. "}Você volta para onde estava no início do turno.${ja ? " Já vi esse golpe: o seu próximo ataque contra quem o feriu tem vantagem." : ""}` };
    }
    case "reserva": {
      const cap = 2 * P;
      if (v("reserva") >= cap) return { erro: `${rotulo}: a reserva já está cheia (${cap} PR).` };
      const add = Math.min(2, cap - v("reserva"));
      if (f.prAtual < add) return { erro: `${rotulo}: faltam PR para guardar.` };
      return { usos: set("reserva", v("reserva") + add), gastaPr: add, dito: `${add} PR guardados na reserva (${v("reserva") + add}/${cap}); nada drena essa reserva.` };
    }
    case "reserva-solta": {
      const r = v("reserva");
      if (r < 1) return { erro: `${rotulo}: a reserva está vazia.` };
      const n = Math.floor(r / 3);
      return { usos: junta(set("reserva", 0), set("reserva-golpe", n)), ganhaPr: r, dito: `Você recupera ${r} PR${n > 0 ? ` e o próximo golpe causa +${n}d6` : ""}.` };
    }
    case "reserva-emerg": {
      if (f.pvAtual > 0) return { erro: `${rotulo}: só ao cair a 0 PV.` };
      if (v("reserva") < 1) return { erro: `${rotulo}: a reserva está vazia.` };
      if (v("reserva-emerg") > 0) return { erro: `${rotulo}: já usou nesta cena.` };
      return { usos: junta(set("reserva", 0), set("reserva-emerg", 1)), curaPv: v("reserva"), dito: `Você se levanta com ${v("reserva")} PV; a reserva zera.` };
    }
    case "reserva-aliado": {
      const r = v("reserva");
      if (r < 1) return { erro: `${rotulo}: a reserva está vazia.` };
      return { usos: set("reserva", 0), dito: `Um aliado a até 9 m recupera ${r} PR; a reserva zera.` };
    }
    case "aposta": {
      const dobra = temCartao(c, "Dobrar a aposta");
      if ((v("aposta-ganha") > 0 && !dobra) || v("aposta-perda") > 0) return { erro: `${rotulo}: a aposta de agora ainda não foi gasta (ataque primeiro).` };
      const d = Math.floor(rolar("Apostar", "1d6"));
      if (d % 2 === 0) return { usos: junta(set("aposta-ganha", v("aposta-ganha") + 1), set("aposta-perda", 0)), dito: `Saiu ${d} (par): o próximo ataque causa +${P * (v("aposta-ganha") + 1)}d6.` };
      const mult = v("aposta-ganha") > 0 ? 2 : 1;
      const t = rolar("Apostar: o preço", `${P * mult}d4`);
      return { usos: junta(set("aposta-perda", 1), set("aposta-ganha", 0)), perdePv: t, dito: `Saiu ${d} (ímpar): você sofre ${t} e o próximo ataque tem desvantagem${mult === 2 ? " (pagou as duas apostas)" : ""}.` };
    }
    case "sorte": {
      if (v("sorte-usada") > 0) return { erro: `${rotulo}: já usou nesta cena.` };
      return { usos: junta(set("sorte-usada", 1), set("aposta-ganha", 0), set("aposta-perda", 0)), dito: "Você joga o d6 de novo: aperte Apostar outra vez." };
    }
    case "invisivel": {
      if (v("invisivel") > 0) return { erro: `${rotulo}: você já está invisível.` };
      return { usos: set("invisivel", 2), dito: "Você some: invisível até atacar, usar técnica ou o fim do seu próximo turno. O ataque que sai da invisibilidade tem vantagem." };
    }
    case "sumir": {
      if (v("sumir-usado") > 0) return { erro: `${rotulo}: já usou nesta cena.` };
      return { usos: junta(set("sumir-usado", 1), set("invisivel", 2)), dito: "Parado, você continua invisível depois de atacar." };
    }
    case "ancora": {
      if (v("ancoras") >= 2) return { erro: `${rotulo}: já são 2 âncoras.` };
      return { usos: set("ancoras", v("ancoras") + 1), dito: `Âncora ${v("ancoras") + 1}/2 deixada num ponto a até 18 m.` };
    }
    case "ancora-volta": {
      if (v("ancoras") < 1) return { erro: `${rotulo}: não há âncora.` };
      const ch = temCartao(c, "Chegar golpeando");
      return { usos: junta(set("ancoras", v("ancoras") - 1), ch ? set("chegada", 1) : {}), dito: `Você aparece na âncora (até 36 m); ela some.${ch ? " Chegar golpeando: o primeiro golpe agora tem vantagem." : ""}` };
    }
    case "endurecer": {
      const corta = dano > 0 ? Math.min(dano, 2 * P) : 0;
      return { usos: set("endurecido", 1), ...(dano > 0 ? { perdePv: dano - corta } : {}), dito: `${dano > 0 ? `O dano cai em ${corta} (de ${dano}); você sofre ${dano - corta}, já descontado. ` : `O dano que você sofreria cai em ${2 * P}. `}A parte endurecida ataca com desvantagem no próximo golpe${temCartao(c, "Punho de aço") ? " — mas com Punho de aço ele causa +1d8 e ignora 2 de redução de dano" : ""}.` };
    }
    case "corpo-aco": {
      if (v("corpo-aco-usado") > 0) return { erro: `${rotulo}: já usou nesta cena.` };
      return { usos: junta(set("corpo-aco-usado", 1), set("corpo-aco", 1), set("t-rd-fis", 99)), dito: "Corpo de aço: imune a dano físico até o início do seu próximo turno, com deslocamento 0." };
    }
    case "fio": {
      if (v("fios") >= 2) return { erro: `${rotulo}: já são 2 fios.` };
      return { usos: set("fios", v("fios") + 1), dito: `Fio ${v("fios") + 1}/2 preso a até 18 m.${v("fios") + 1 === 2 && temCartao(c, "Teia") ? " Teia: a linha entre os fios é armadilha." : ""}` };
    }
    case "fio-puxa": {
      if (v("fios") < 1) return { erro: `${rotulo}: não há fio preso.` };
      const corta = temCartao(c, "Fio cortante") ? rolar("Fio cortante", "2d6") : 0;
      return { usos: set("fios", v("fios") - 1), dito: `Você se puxa até o fio sem provocar ataque de oportunidade, ou puxa o alvo 6 m (salvaguarda de Força, CD ${8 + P + Math.max(c.atr.for, c.atr.esp)}).${corta > 0 ? ` Fio cortante: se puxar uma criatura, ela sofre ${corta} cortante.` : ""}` };
    }
    case "armadilha": {
      if (v("armadilhas") >= P) return { erro: `${rotulo}: já são ${P} armadilhas, o máximo.` };
      return { usos: set("armadilhas", v("armadilhas") + 1), dito: `Armadilha ${v("armadilhas") + 1}/${P} escondida num ponto a até 9 m.` };
    }
    case "armadilha-dispara": {
      if (v("armadilhas") < 1) return { erro: `${rotulo}: não há armadilha escondida.` };
      const cd = 8 + P + c.atr.esp;
      if (temCartao(c, "Armadilha que segura")) return { usos: set("armadilhas", v("armadilhas") - 1), dito: `A armadilha dispara: salvaguarda de Destreza (CD ${cd}) ou fica Contido até o fim do próximo turno dele.${temCartao(c, "Alarme") ? " Alarme: use a reação para andar 6 m." : ""}` };
      const t = rolar("Armadilha", `1d10+${P}`);
      return { usos: set("armadilhas", v("armadilhas") - 1), dito: `A armadilha dispara: salvaguarda de Destreza (CD ${cd}) ou ${t} de Energia.${temCartao(c, "Alarme") ? " Alarme: use a reação para andar 6 m." : ""}` };
    }
    case "armadilha-move": {
      if (v("armadilhas") < 1) return { erro: `${rotulo}: não há armadilha escondida.` };
      return { dito: "Uma armadilha muda de lugar, até 6 m." };
    }
    case "bala": {
      const t = rolar("Bala", `1d10+${P}`);
      return { dito: `Disparo de reiatsu a até 18 m (acerto +${P + c.atr.esp}): ${t} de Energia.${temCartao(c, "Bala que empurra") ? " Bala que empurra: o alvo é empurrado 3 m." : ""}` };
    }
    case "rajada": {
      const a = rolar("Rajada: 1ª bala", `1d6+${P}`), b = rolar("Rajada: 2ª bala", `1d6+${P}`);
      return { dito: `Duas balas (acerto +${P + c.atr.esp} cada): ${a} e ${b} de Energia.${temCartao(c, "Bala que empurra") ? " Bala que empurra: os alvos são empurrados 3 m." : ""}` };
    }
    case "fome": {
      const cap = Math.max(1, Math.floor(P / 2));
      if (v("fome") >= cap) return { erro: `${rotulo}: a fome já está no máximo (${cap}).` };
      return { usos: set("fome", v("fome") + 1), dito: `Fome ${v("fome") + 1}/${cap}: +${v("fome") + 1} no acerto até o fim da cena.` };
    }
    /* ---- terceira leva ---- */
    case "territorio": {
      if (v("territorio") > 0) return { erro: `${rotulo}: o território já está marcado.` };
      return { usos: junta(set("territorio", 1), set("no-territorio", 1), set("t-cr:territorio", 1)), dito: "Território marcado (cubo de 9 m) até o fim da cena: dentro dele, +1 de CR e +1 de acerto; inimigos que entram provocam ataque de oportunidade seu." };
    }
    case "territorio-troca": case "territorio-volta": {
      if (v("territorio") < 1) return { erro: `${rotulo}: marque o território primeiro.` };
      if (id === "territorio-volta") {
        if (v("no-territorio") > 0) return { erro: `${rotulo}: você já está no território.` };
        return { usos: junta(set("no-territorio", 1), set("t-cr:territorio", 1)), dito: "Você volta ao centro do território (até 36 m): +1 de CR e +1 de acerto de novo." };
      }
      const dentro = v("no-territorio") > 0;
      return { usos: junta(set("no-territorio", dentro ? 0 : 1), set("t-cr:territorio", dentro ? 0 : 1)), dito: dentro ? "Você saiu do território: perde o +1 de CR e de acerto." : "Você entrou no território: +1 de CR e +1 de acerto." };
    }
    case "fronteira": {
      if (v("territorio") < 1) return { erro: `${rotulo}: marque o território primeiro.` };
      if (v("fronteira-turno") > 0) return { erro: `${rotulo}: só a primeira criatura de cada rodada.` };
      const t = rolar("Fronteira", `${P}d4`);
      return { usos: set("fronteira-turno", 1), dito: `Quem cruzou a fronteira sofre ${t} de Energia.` };
    }
    case "santuario": {
      if (v("santuario") > 0) return { erro: `${rotulo}: o santuário já está aberto (${v("santuario")} turnos).` };
      return { usos: set("santuario", P), dito: `Santuário aberto (esfera de 3 m) por ${P} turnos: quem quer atacar alguém lá dentro faz salvaguarda de Espírito (CD ${8 + P + c.atr.esp}); se falhar, escolhe outro alvo ou perde o ataque${temCartao(c, "Santuário que acalma") ? " e fica Amedrontado de você até o fim do próximo turno" : ""}.` };
    }
    case "doar": {
      const x = Math.min(2 * P, f.prAtual);
      if (x < 1) return { erro: `${rotulo}: você não tem PR para doar.` };
      const dados = Math.min(P, Math.floor(x / 2));
      return { gastaPr: x, dito: `Você passa ${x} PR para um aliado ou criatura sua a até 9 m.${temCartao(c, "Doação que cura") ? ` Doação que cura: ele também recupera ${x} PV.` : ""}${temCartao(c, "Doação explosiva") && dados > 0 ? ` Doação explosiva: o próximo ataque dele causa +${dados}d6.` : ""}` };
    }
    case "juramento": {
      if (v("protegido") > 0) return { erro: `${rotulo}: você já jurou proteger alguém nesta cena.` };
      return { usos: set("protegido", 1), dito: "Juramento feito: ataques corpo a corpo contra o protegido têm desvantagem enquanto você estiver a 1,5 m dele." };
    }
    case "ira": {
      if (v("protegido") < 1) return { erro: `${rotulo}: jure proteger alguém primeiro.` };
      return { usos: set("ira", 1), dito: `Ira do guardião: o seu próximo ataque contra quem feriu o protegido causa +${P}d4.` };
    }
    case "juramento-caiu": {
      if (v("protegido") < 1) return { erro: `${rotulo}: não há protegido.` };
      return { usos: junta(set("protegido", 0), set("furia-juramento", 1)), dito: "O protegido caiu: você entra em fúria até o fim da cena (+1d6 nos golpes; não pode fugir nem poupar quem o derrubou)." };
    }
    case "maldicao": {
      if (v("maldicao") > 0) return { erro: `${rotulo}: já há uma criatura amaldiçoada.` };
      return { usos: set("maldicao", 1), dito: `Uma criatura a até 18 m faz salvaguarda de Espírito (CD ${8 + P + c.atr.esp}). Se falhar: desvantagem nos testes e salvaguardas de ${temCartao(c, "Maldição dupla") ? "dois atributos (Força, Destreza ou Espírito)" : "um atributo (Força, Destreza ou Espírito)"}; repete a salvaguarda no fim de cada turno dela.` };
    }
    case "maldicao-pula": {
      if (v("maldicao") < 1) return { erro: `${rotulo}: não há maldição ativa.` };
      return { dito: "A maldição passa para outra criatura a até 9 m, sem nova salvaguarda." };
    }
    case "maldicao-preco": {
      if (v("maldicao") < 1) return { erro: `${rotulo}: não há maldição ativa.` };
      const t = rolar("Preço da técnica", "1d6");
      return { dito: `A amaldiçoada usou técnica: sofre ${t} de Energia.` };
    }
    case "protetora": {
      const cap = Math.max(1, Math.floor(P / 2));
      if (v("protegidos") >= cap) return { erro: `${rotulo}: já são ${cap} marca${cap === 1 ? "" : "s"}, o máximo.` };
      return { usos: set("protegidos", v("protegidos") + 1), dito: `Marca protetora ${v("protegidos") + 1}/${cap} num aliado a até 18 m.` };
    }
    case "protetora-usa": {
      if (v("protegidos") < 1) return { erro: `${rotulo}: não há aliado marcado.` };
      const cura = temCartao(c, "Marca que cura") ? rolar("Marca que cura", "1d6") : 0;
      return { dito: `A marca protege: o dano no aliado cai em ${P + c.atr.esp} (1 vez por rodada por aliado).${cura > 0 ? ` Marca que cura: ele recupera ${cura} PV.` : ""}` };
    }
    case "aparar": return { dito: `Aparada: CR ${c.cr + P} contra esse golpe (+${P}). Se ele errar, você faz um ataque corpo a corpo contra quem atacou${temCartao(c, "Desarmar") ? `; Desarmar: se acertar, ele faz salvaguarda de Força (CD ${8 + P + Math.max(c.atr.for, c.atr.des)}) ou a arma cai a 3 m` : ""}.${temCartao(c, "Aparar o kidō") ? " Vale também contra ataques à distância e Hadō." : ""}` };
    case "aparei": {
      if (v("ritmo-duelo") >= P) return { erro: `${rotulo}: o ritmo já está no máximo (${P}).` };
      return { usos: set("ritmo-duelo", v("ritmo-duelo") + 1), dito: `Ritmo do duelo ${v("ritmo-duelo") + 1}/${P}: +${v("ritmo-duelo") + 1} no seu próximo acerto.` };
    }
    case "postura": {
      if (v("postura") > 0) return { erro: `${rotulo}: você já está em postura.` };
      return { usos: junta(set("postura", 1), set("t-rd-fis:postura", P), set("t-rd-eso:postura", P)), dito: `Postura inquebrável até o início do seu próximo turno: +${P} de redução de dano física e espiritual; não pode ser empurrado nem derrubado; deslocamento ${temCartao(c, "Postura que avança") ? "3 m" : "0"}.` };
    }
    case "crescer": {
      if (v("gigante") > 0) return { erro: `${rotulo}: você já está Grande (${v("gigante")} turnos).` };
      const col = P >= 5 && temCartao(c, "Colosso");
      return { usos: junta(set("gigante", P), { [PW("t-cr:gigante")]: -2 }), dito: `Você fica ${col ? "Enorme" : "Grande"} por ${P} turnos: +${col ? "2d4" : "1d4"} nos golpes, +${col ? "3" : "1,5"} m de alcance corpo a corpo, vantagem em Força e −2 de CR.` };
    }
    case "pisotear": {
      if (v("gigante") < 1) return { erro: `${rotulo}: só enquanto estiver Grande.` };
      const t = rolar("Pisotear", "2d6");
      return { dito: `Uma criatura Média a 1,5 m faz salvaguarda de Destreza (CD ${8 + P + c.atr.for}) ou sofre ${t} e cai Caída.` };
    }
    case "orbita": {
      if (v("orbita") >= P) return { erro: `${rotulo}: já são ${P} lâminas, o máximo.` };
      const n = v("orbita") + 1;
      return { usos: junta(set("orbita", n), set("t-cr:orbita", Math.min(3, n))), dito: `Lâmina ${n}/${P} em órbita: +${Math.min(3, n)} de CR.` };
    }
    case "orbita-lanca": {
      if (v("orbita") < 1) return { erro: `${rotulo}: não há lâmina em órbita.` };
      const n = v("orbita") - 1, t = rolar("Lançar lâmina", `1d8+${P}`);
      return { usos: junta(set("orbita", n), set("t-cr:orbita", Math.min(3, n))), dito: `Lâmina lançada a até 18 m (acerto +${P + Math.max(c.atr.des, c.atr.esp)}): ${t} de dano. Restam ${n} em órbita (+${Math.min(3, n)} de CR).` };
    }
    case "orbita-muralha": {
      if (v("orbita") < 2) return { erro: `${rotulo}: precisa de 2 lâminas em órbita.` };
      const n = v("orbita") - 2, red = rolar("Muralha giratória", "2d8");
      const corta = dano > 0 ? Math.min(dano, red) : 0;
      return { usos: junta(set("orbita", n), set("t-cr:orbita", Math.min(3, n))), ...(dano > 0 ? { perdePv: dano - corta } : {}), dito: dano > 0 ? `Duas lâminas barram o golpe: o dano cai em ${corta} (de ${dano}); você sofre ${dano - corta}, já descontado.` : `Duas lâminas barram o golpe: o dano cai em ${red}.` };
    }
    case "orbita-chuva": {
      const n = v("orbita");
      if (n < 1) return { erro: `${rotulo}: não há lâmina em órbita.` };
      const ts: number[] = []; for (let i = 0; i < n; i++) ts.push(rolar(`Chuva de órbita: lâmina ${i + 1}`, `1d8+${P}`));
      return { usos: junta(set("orbita", 0), set("t-cr:orbita", 0)), dito: `${n} lâmina${n === 1 ? "" : "s"} lançada${n === 1 ? "" : "s"} (acerto +${P + Math.max(c.atr.des, c.atr.esp)} cada, ataques separados): ${ts.join(", ")} de dano.` };
    }
    case "troca": return { dito: `Duas criaturas a até 18 m trocam de lugar (você pode ser uma). Um inimigo faz salvaguarda de Espírito (CD ${8 + P + c.atr.esp}) para resistir.${temCartao(c, "Troca com objeto") ? " Também vale com um objeto de até o seu tamanho." : ""}` };
    case "troca-fogo": {
      if (v("troca-fogo") > 0) return { erro: `${rotulo}: já usou nesta cena.` };
      return { usos: set("troca-fogo", 1), dito: "O aliado atacado troca de lugar com um inimigo a até 9 m: o ataque acerta o inimigo se passar da CR dele." };
    }
    case "surpresa": {
      if (v("surpresa-usada") > 0) return { erro: `${rotulo}: já usou nesta cena.` };
      return { usos: junta(set("surpresa-usada", 1), set("surpresa", 1)), dito: "Surpresa total: o próximo golpe, contra quem ainda não agiu, causa +1d6." };
    }
    case "atraso": {
      const cap = temCartao(c, "Atrasos em camadas") ? 2 : 1;
      if (v("atraso-n") + v("atraso-pronto") >= cap) return { erro: `${rotulo}: já ${cap === 1 ? "há um golpe atrasado" : "são 2 golpes atrasados"}.` };
      return { usos: set("atraso-pronto", 1), dito: "O próximo golpe que acertar não causa dano agora: aperte “O golpe atrasado acertou” e digite o dano." };
    }
    case "atraso-guarda": {
      if (v("atraso-pronto") < 1) return { erro: `${rotulo}: aperte “Atrasar o golpe” antes.` };
      if (dano <= 0) return { erro: `${rotulo}: digite o dano do golpe no campo de dano.` };
      return { usos: junta(set("atraso-pronto", 0), set("atraso", v("atraso") + dano), set("atraso-n", v("atraso-n") + 1)), dito: `${dano} de dano guardado no tempo: chega no seu Novo turno com +${P}d6, sem reação que o reduza.` };
    }
    case "atraso-solta": {
      if (v("atraso") < 1) return { erro: `${rotulo}: não há golpe atrasado.` };
      const t = v("atraso") + rolar("Golpe atrasado", `${P * v("atraso-n")}d6`);
      return { usos: junta(set("atraso", 0), set("atraso-n", 0)), dito: `O golpe atrasado chega agora: ${t} de dano, sem reação que o reduza.` };
    }
    case "vital": {
      if (v("vital") > 0) return { erro: `${rotulo}: o ponto vital já está marcado.` };
      return { usos: set("vital", 1), dito: `O seu próximo golpe contra uma criatura que você já atacou tem crítico com ${P >= 5 ? "18–20" : "19–20"}.${temCartao(c, "Apontar ao aliado") ? " Pode valer para o próximo golpe de um aliado." : ""}` };
    }
    case "vento": {
      const t = rolar("Lâmina de vento", `${P}d6`);
      return { dito: `Linha de 9 m: salvaguarda de Destreza (CD ${8 + P + c.atr.esp}). Falha: ${t} cortante e empurrado 3 m; sucesso: metade, sem empurrão. Ignora meia cobertura${temCartao(c, "Vento cortante") ? ", 2 de redução de dano e cobertura fina" : ""}.` };
    }
    case "vento-favor": {
      if (v("vento") > 0) return { erro: `${rotulo}: o vento já está a favor.` };
      return { usos: junta(set("vento", 1), set("t-desloc:vento", 3)), dito: "Vento a favor: você e aliados a até 9 m ganham +3 m de deslocamento e +3 m de alcance à distância até o seu próximo turno." };
    }
    case "clarao": return { dito: `${temCartao(c, "Prisma") ? "Três cones de 4,5 m" : "Cone de 9 m"}: salvaguarda de Constituição (CD ${8 + P + c.atr.esp}) ou Cego até o fim do próximo turno.${temCartao(c, "Luz que aquece") ? ` Luz que aquece: aliados no cone ganham ${P} PV temporários.` : ""}` };
    case "cura-si": case "cura-aliado": {
      const longe = temCartao(c, "Cura a distância"), limpa = temCartao(c, "Cura que limpa") ? " Também tira uma condição (Envenenado, Cego, Surdo ou Amedrontado)." : "";
      const t = rolar("Toque restaurador", `${P}d8`) + c.atr.esp;
      if (id === "cura-aliado") return { dito: `Uma criatura a 1,5 m recupera ${t} PV${longe ? ` (ou ${Math.floor(t / 2)} PV a até 9 m)` : ""}.${limpa}${temCartao(c, "Excesso vira escudo") ? " O que passar do máximo vira PV temporários." : ""}` };
      const sobra = Math.max(0, f.pvAtual + t - c.pv);
      const escudo = sobra > 0 && temCartao(c, "Excesso vira escudo");
      return { curaPv: t, ...(escudo ? { pvTemp: Math.max(f.estado.pvTemp ?? 0, sobra) } : {}), dito: `Você recupera ${t} PV.${escudo ? ` O excesso vira ${sobra} PV temporários.` : ""}${limpa}` };
    }
    case "executar": return { dito: `Golpe de execução: só contra quem tem ${5 * P} PV ou menos e sem Bankai, Resurrección ou forma equivalente ativa. Se acertar, o alvo faz salvaguarda de Constituição (CD ${8 + P + Math.max(c.atr.for, c.atr.des)}) ou cai a 0 PV.${temCartao(c, "Ceifa") ? " Ceifa: se executar, ande 9 m e faça outro golpe." : ""}` };
    case "regen-veloz": case "sem-dor": {
      if (id === "sem-dor") {
        if (v("sem-dor") > 0) return { erro: `${rotulo}: já usou nesta cena.` };
        if (f.pvAtual * 2 >= c.pv) return { erro: `${rotulo}: só abaixo da metade dos PV.` };
      } else if (v("regen-turno") > 0) return { erro: `${rotulo}: só 1 vez por turno.` };
      const casca = temCartao(c, "Casca dura");
      return { usos: junta(id === "sem-dor" ? set("sem-dor", 1) : set("regen-turno", 1), casca ? junta(set("casca", 1), set("t-rd-fis:casca", 2), set("t-rd-eso:casca", 2)) : {}), curaPv: 4 * P, dito: `Você regenera ${4 * P} PV e um membro perdido (não vale se o golpe foi na cabeça ou no buraco).${casca ? " Casca dura: +2 de redução de dano até o início do seu próximo turno." : ""}` };
    }
    case "rugido": {
      const racha = temCartao(c, "Rugido que racha") ? rolar("Rugido que racha", `${P}d10`) : 0;
      return { dito: `Criaturas a até 9 m fazem salvaguarda de Espírito (CD ${8 + P + c.atr.esp}) ou ficam Amedrontadas até o fim do próximo turno delas.${racha > 0 ? ` Rugido que racha: barreiras e Bakudō a até 9 m sofrem ${racha}.` : ""}` };
    }
    case "blefe": {
      if (v("blefe") > 0) return { erro: `${rotulo}: o blefe de agora ainda não foi gasto (ataque primeiro).` };
      return { usos: set("blefe", 1), dito: `Você anuncia uma técnica que não vai usar: Intuição dele contra a sua Enganação. Se acreditar, gasta a reação e você tem +2 no próximo acerto contra ele.${temCartao(c, "Blefe duplo") ? " Blefe duplo: se não acreditar, o seu próximo ataque tem vantagem." : ""}` };
    }
    case "desviar": {
      const red = rolar("Desviar projéteis", "1d10") + c.atr.des + P;
      if (dano > 0) {
        const corta = Math.min(dano, red);
        return { perdePv: dano - corta, dito: `O projétil cai em ${corta} (de ${dano}). Você sofre ${dano - corta}, já descontado.${corta >= dano ? ` Ele zerou: você pode lançá-lo de volta (ataque à distância, 18 m, ${dano} de dano).${temCartao(c, "Ricochete") ? " Ricochete: pula para mais uma criatura a até 4,5 m, com metade do dano." : ""}` : ""}` };
      }
      return { dito: `O dano do ataque à distância cai em ${red}. Se cair a 0, você pode lançá-lo de volta.` };
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
  if (v("seq") > 0 && !distancia) { b.dados.push(String(v("seq"))); b.tags.push(`Sequência ${v("seq")}: +${v("seq")}`); }
  if (v("seq-final") > 0) { b.tags.push(`Finalizador: o alvo faz salvaguarda de Constituição (CD ${8 + P + Math.max(c.atr.for, c.atr.des, c.atr.esp)}) ou fica Atordoado`); b.gasta.push("seq-final"); }
  if (v("calor") > 0 && !distancia) { b.dados.push(String(v("calor"))); b.tags.push(`Calor ${v("calor")}: +${v("calor")}`); if (v("calor") >= 5 && temCartao(c, "Ponto de fusão")) b.tags.push(`Ponto de fusão: ignora ${P} de redução de dano`); }
  if (v("sangue-golpe") > 0) { b.dados.push(`${v("sangue-golpe")}d6`); b.tags.push(`Sangue na lâmina: +${v("sangue-golpe")}d6`); b.gasta.push("sangue-golpe"); }
  if (v("leituras") > 0) { b.acerto += v("leituras"); b.tags.push(`Leitura ${v("leituras")}/3: +${v("leituras")} no acerto${v("leituras") >= 2 && temCartao(c, "Dissecar") ? " e ignora 2 de redução de dano" : ""}`); }
  if (temCartao(c, "Ferido e perigoso") && f.pvAtual > 0 && f.pvAtual * 2 < c.pv) { b.acerto += 1; b.tags.push("Ferido e perigoso: +1 no acerto"); }
  if (v("gelo") > 0) b.tags.push(`Alvo com gelo ${v("gelo")}/3${v("gelo") >= 2 && temCartao(c, "Gelo que racha a defesa") ? " (−2 de redução de dano contra os seus golpes)" : ""}`);
  if (v("contagem") > 0) b.tags.push(`Contagem: ${v("contagem")}`);
  if (v("contagem-crit") > 0) { b.tags.push("Contagem zerada: este golpe é crítico"); b.gasta.push("contagem-crit"); }
  if (v("tabu") > 0) b.tags.push("Tabu imposto");
  if (v("ultimo-folego") > 0 && temCartao(c, "Último fôlego")) { b.dados.push(`${P}d8`); b.tags.push(`Último fôlego: +${P}d8 (último turno do limite)`); b.gasta.push("ultimo-folego"); }
  if (v("contagem") > 0 && v("contagem") <= 2 && temCartao(c, "Anúncio")) b.tags.push("Anúncio: o marcado tem desvantagem nas salvaguardas de Mente");
  if (temCartao(c, "Dois corpos, um golpe") && (f.estado.invocacoes ?? []).some((x) => /^Espírito da lâmina/.test(x.nome))) b.tags.push("Dois corpos: se o espírito já atacou este alvo no turno, vantagem");
  if (v("no-territorio") > 0) { b.acerto += 1; b.tags.push("No território: +1 no acerto"); }
  if (v("ira") > 0) { b.dados.push(`${P}d4`); b.tags.push(`Ira do guardião: +${P}d4`); b.gasta.push("ira"); }
  if (v("furia-juramento") > 0 && !distancia) { b.dados.push("1d6"); b.tags.push("Juramento quebrado: +1d6"); }
  if (v("ritmo-duelo") > 0) { b.acerto += v("ritmo-duelo"); b.tags.push(`Ritmo do duelo: +${v("ritmo-duelo")} no acerto`); b.gasta.push("ritmo-duelo"); }
  if (v("gigante") > 0 && !distancia) { const col = P >= 5 && temCartao(c, "Colosso"); b.dados.push(col ? "2d4" : "1d4"); b.tags.push(`${col ? "Enorme" : "Grande"}: +${col ? "2d4" : "1d4"} e +${col ? "3" : "1,5"} m de alcance`); }
  if (v("surpresa") > 0) { b.dados.push("1d6"); b.tags.push("Surpresa total: +1d6"); b.gasta.push("surpresa"); }
  if (v("atraso-pronto") > 0) b.tags.push("Golpe atrasado: se acertar, o dano fica guardado (aperte “O golpe atrasado acertou”)");
  if (v("vital") > 0) { b.tags.push(`Ponto vital: crítico com ${P >= 5 ? "18–20" : "19–20"}${temCartao(c, "Golpe único") ? "; no crítico, +1 dado da arma" : ""}`); b.gasta.push("vital"); }
  if (v("blefe") > 0) { b.acerto += 2; b.tags.push("Blefe: +2 no acerto (se ele acreditou)"); b.gasta.push("blefe"); }
  if (v("reserva-golpe") > 0) { b.dados.push(`${v("reserva-golpe")}d6`); b.tags.push(`Reserva solta: +${v("reserva-golpe")}d6`); b.gasta.push("reserva-golpe"); }
  if (v("aposta-ganha") > 0) { const d = `${P * v("aposta-ganha")}d6`; b.dados.push(d); b.tags.push(`Aposta ganha: +${d}`); b.gasta.push("aposta-ganha"); }
  if (v("aposta-perda") > 0) { b.tags.push("Aposta perdida: desvantagem no ataque"); b.gasta.push("aposta-perda"); }
  if (v("invisivel") > 0) { b.tags.push("Invisível: vantagem no ataque"); if (temCartao(c, "Golpe do nada")) { b.dados.push("2d6"); b.tags.push("Golpe do nada: +2d6"); } b.gasta.push("invisivel"); }
  if (v("chegada") > 0) { b.tags.push("Chegar golpeando: vantagem no ataque"); b.gasta.push("chegada"); }
  if (v("vant-voltou") > 0) { b.tags.push("Já vi esse golpe: vantagem contra quem o feriu"); b.gasta.push("vant-voltou"); }
  if (v("endurecido") > 0 && !distancia) {
    if (temCartao(c, "Punho de aço")) { b.dados.push("1d8"); b.tags.push("Punho de aço: +1d8 e ignora 2 de redução de dano"); } else b.tags.push("Parte endurecida: desvantagem neste golpe");
    b.gasta.push("endurecido");
  }
  if (v("fome") > 0) { b.acerto += v("fome"); b.tags.push(`Devorar: +${v("fome")} no acerto${v("fome") >= Math.max(1, Math.floor(P / 2)) && temCartao(c, "Evolução") ? " e resistência ao dano da última criatura derrubada" : ""}`); }
  if (v("corpo-aco") > 0) b.tags.push("Corpo de aço: imune a dano físico, deslocamento 0");
  for (const x of BONUS_SIMPLES) {
    const n = v(x.ch);
    if (n < 1 || (x.so && !temCartao(c, x.so)) || (x.corpo && distancia)) continue;
    const t = x.tag(P, n);
    if (!t) continue;
    if (x.acerto) b.acerto += x.acerto(P, n);
    if (x.dados) b.dados.push(x.dados(P, n));
    b.tags.push(t);
    if (x.gasta) b.gasta.push(x.ch);
  }
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
  r.usos[PW("limite-turno")] = undefined;
  for (const k of ["fronteira-turno", "regen-turno"]) r.usos[PW(k)] = undefined;
  if (val(f, "postura") > 0) { for (const k of ["postura", "t-rd-fis:postura", "t-rd-eso:postura"]) r.usos[PW(k)] = undefined; r.ditos.push("a postura inquebrável acabou"); }
  if (val(f, "casca") > 0) for (const k of ["casca", "t-rd-fis:casca", "t-rd-eso:casca"]) r.usos[PW(k)] = undefined;
  if (val(f, "vento") > 0) { r.usos[PW("vento")] = undefined; r.usos[PW("t-desloc:vento")] = undefined; r.ditos.push("o vento a favor acabou"); }
  if (val(f, "santuario") > 0) {
    const n = val(f, "santuario") - 1; r.usos[PW("santuario")] = n <= 0 ? undefined : n;
    if (n <= 0) r.ditos.push("o santuário se fechou");
    else r.ditos.push(`Santuário: ${n} turno${n === 1 ? "" : "s"}${temCartao(c, "Preço do santuário") ? `; quem está dentro recupera ${rolar("Preço do santuário", "1d6")} PV` : ""}`);
  }
  if (val(f, "gigante") > 0) {
    const n = val(f, "gigante") - 1; r.usos[PW("gigante")] = n <= 0 ? undefined : n;
    if (n <= 0) { r.usos[PW("t-cr:gigante")] = undefined; r.ditos.push("você volta ao tamanho normal"); }
  }
  if (val(f, "atraso") > 0) {
    const t = val(f, "atraso") + rolar("Golpe atrasado", `${P * Math.max(1, val(f, "atraso-n"))}d6`);
    r.usos[PW("atraso")] = undefined; r.usos[PW("atraso-n")] = undefined; r.ditos.push(`O golpe atrasado chega: ${t} de dano no alvo, sem reação que o reduza`);
  }
  if (temCartao(c, "Limite de liberação")) {
    const lim = P + 2 + val(f, "limite-extra"), n = val(f, "limite-t") + 1;
    if (n > lim) { r.usos[PW("limite-t")] = undefined; r.usos[PW("limite-extra")] = undefined; r.ditos.push(`O limite de ${lim} turnos acabou: a forma termina e você fica com 1 nível de cansaço`); }
    else { r.usos[PW("limite-t")] = n; if (n === lim && temCartao(c, "Último fôlego")) r.usos[PW("ultimo-folego")] = 1; r.ditos.push(`Limite de liberação: turno ${n} de ${lim}${n === lim ? (temCartao(c, "Último fôlego") ? ` (o último: o primeiro golpe causa +${P}d8)` : " (o último)") : ""}`); }
  }
  if (val(f, "corpo-aco") > 0) { r.usos[PW("corpo-aco")] = undefined; r.usos[PW("t-rd-fis")] = undefined; r.ditos.push("o Corpo de aço acabou"); }
  const inv = val(f, "invisivel");
  if (inv > 0) { r.usos[PW("invisivel")] = inv - 1 <= 0 ? undefined : inv - 1; if (inv - 1 <= 0) r.ditos.push("a invisibilidade acabou"); }
  if (val(f, "fios") >= 2 && temCartao(c, "Teia")) r.ditos.push(`Teia: quem cruzar a linha entre os fios faz salvaguarda de Destreza (CD ${8 + P + c.atr.esp}) ou cai Caído`);
  if (val(f, "calor") >= 5) { const d = rolar("Calor acumulado", "3d6"); r.perdePv += d; r.usos[PW("calor")] = undefined; r.ditos.push(`Calor em 5: você sofre ${d} de Fogo e o calor zera (descarregue com Ventilar antes, se quiser evitar)`); }
  if (val(f, "contagem") > 0 && temCartao(c, "O tempo corre")) {
    const n = val(f, "contagem") - 1;
    if (n <= 0) { r.usos[PW("contagem")] = undefined; r.usos[PW("contagem-crit")] = 1; r.ditos.push("a contagem chegou a 0: o próximo golpe no marcado é crítico"); }
    else { r.usos[PW("contagem")] = n; r.ditos.push(`O tempo corre: a contagem cai para ${n}`); }
  }
  if (temCartao(c, "Sentinela que cura") && (f.estado.invocacoes ?? []).some((x) => /^Sentinela/.test(x.nome))) r.ditos.push(`Sentinela que cura: um aliado a até 9 m dela recupera ${P} PV`);
  if (temCartao(c, "Sentinela-farol") && (f.estado.invocacoes ?? []).some((x) => /^Sentinela/.test(x.nome))) r.ditos.push("Sentinela-farol: inimigos a até 9 m dela não ficam invisíveis nem se escondem");
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
  const ts = turnoSimples({ P, cd: 8 + P + c.atr.esp, cdFor: 8 + P + Math.max(c.atr.for, c.atr.des), tem: (n) => temCartao(c, n), c, f, dano: 0 }, (x) => val(f, x), rolar);
  Object.assign(r.usos, ts.usos); r.ditos.push(...ts.ditos);
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
  ...NOMES_SIMPLES,
  ["energia", "Energia carregada"], ["grc", "Gran Rey Cero"], ["cargas", "Cargas"], ["descarga", "Descarga pronta"], ["sobre", "Sobrecarga (turnos)"],
  ["guardado", "Dano guardado"], ["corte", "Corte no espaço"], ["marca", "Alvo marcado"], ["peso", "Peso na marca"], ["marcas", "Marcas"], ["pilha", "Marcas empilhadas"],
  ["ilusao", "Alvo iludido"], ["invertido", "Sentidos invertidos"], ["selo", "Selo (turnos)"], ["barreira", "Barreira (PV)"], ["doses", "Doses de veneno"], ["acel", "Acelerado"], ["ritmo", "Ritmo"], ["imagem", "Imagem residual"], ["conjunto", "Ataque conjunto"], ["furia", "Fúria sem distinção"], ["alvo-fraco", "Alvo com metade dos PV"], ["marca-caca", "Marca de caça"], ["veu", "Véu de reiatsu (+2 CR)"], ["devolvido", "Golpe guardado"], ["fenda", "Fenda aberta (turnos)"], ["elo", "Elo apertado"], ["revelado", "Alvo revelado"],
  ["reserva", "Reserva de PR"], ["reserva-golpe", "Reserva no golpe"], ["aposta-ganha", "Aposta ganha"], ["aposta-perda", "Aposta perdida"], ["invisivel", "Invisível"], ["ancoras", "Âncoras"], ["chegada", "Chegou golpeando"], ["endurecido", "Parte endurecida"], ["corpo-aco", "Corpo de aço"], ["fios", "Fios presos"], ["armadilhas", "Armadilhas"], ["fome", "Fome (Devorar)"], ["voltou", "Voltas no tempo"], ["vant-voltou", "Já vi esse golpe"],
  ["territorio", "Território marcado"], ["no-territorio", "Dentro do território"], ["santuario", "Santuário (turnos)"], ["protegido", "Juramento de proteção"], ["ira", "Ira do guardião"], ["furia-juramento", "Fúria do juramento"], ["maldicao", "Maldição ativa"], ["protegidos", "Marcas protetoras"], ["ritmo-duelo", "Ritmo do duelo"], ["postura", "Postura inquebrável"], ["gigante", "Grande (turnos)"], ["orbita", "Lâminas em órbita"], ["surpresa", "Surpresa total"], ["atraso-pronto", "Golpe a atrasar"], ["atraso", "Dano atrasado"], ["vital", "Ponto vital"], ["vento", "Vento a favor"], ["casca", "Casca dura"], ["blefe", "Blefe"],
  ["seq", "Sequência"], ["seq-final", "Finalizador pronto"], ["calor", "Calor"], ["sangue", "Sangue pago"], ["sangue-golpe", "Sangue na lâmina"], ["leituras", "Leituras"], ["gelo", "Gelo no alvo"], ["contagem", "Contagem"], ["contagem-crit", "Próximo golpe crítico"], ["tabu", "Tabu imposto"], ["estourou", "Armadura estourou"], ["regen-membro", "Já regenerou membro"], ["limite-extra", "Turnos extras do limite"], ["limite-t", "Turnos do limite"], ["ultimo-folego", "Último fôlego pronto"],
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
  "Lançar lâmina", "Muralha giratória", "Chuva de órbita", "Soltar o atraso", "Pisotear", "A marca protege", "Soltar reserva", "Voltar à âncora", "Armadilha disparou", "Puxar o fio", "Reserva de emergência", "Voltar um instante", "Ventilar", "Dissipar em escudo", "Sangue na lâmina", "Ler o padrão", "Finalizar a sequência", "Ela quebrou o tabu", "Acertar o marcado",
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
    case "Somar sequência": return { nome: "Sequência", atual: v("seq"), max: P, tipo: "pips" };
    case "Esquentar": return { nome: "Calor", atual: v("calor"), max: 5, tipo: "pips" };
    case "Ler o oponente": return { nome: "Leituras", atual: v("leituras"), max: 3, tipo: "pips" };
    case "Gelo no alvo": return { nome: "Gelo", atual: v("gelo"), max: 3, tipo: "pips" };
    case "Começar contagem": return { nome: "Contagem", atual: v("contagem"), max: P, tipo: "pips" };
    case "Impor tabu": return { nome: "Tabu", atual: v("tabu"), max: temCartao(c, "Tabu duplo") ? 2 : 1, tipo: "pips" };
    case "Abrir santuário": return { nome: "Santuário (turnos)", atual: v("santuario"), max: P, tipo: "barra" };
    case "Marca protetora": return { nome: "Marcas", atual: v("protegidos"), max: Math.max(1, Math.floor(P / 2)), tipo: "pips" };
    case "Crescer": return { nome: "Grande (turnos)", atual: v("gigante"), max: P, tipo: "barra" };
    case "Lâmina em órbita": return { nome: "Órbita", atual: v("orbita"), max: P, tipo: "pips" };
    case "Aparei": return { nome: "Ritmo", atual: v("ritmo-duelo"), max: P, tipo: "pips" };
    case "Atrasar o golpe": return { nome: "Dano atrasado", atual: v("atraso"), max: Math.max(1, v("atraso")), tipo: "barra" };
    case "Esticar o limite": return { nome: "Limite (turnos)", atual: v("limite-t"), max: P + 2 + v("limite-extra"), tipo: "barra" };
    case "Voltar um instante": return { nome: "Voltas", atual: v("voltou"), max: P >= 5 ? 2 : 1, tipo: "pips" };
    case "Guardar reserva": return { nome: "Reserva (PR)", atual: v("reserva"), max: 2 * P, tipo: "barra" };
    case "Deixar âncora": return { nome: "Âncoras", atual: v("ancoras"), max: 2, tipo: "pips" };
    case "Lançar fio": return { nome: "Fios", atual: v("fios"), max: 2, tipo: "pips" };
    case "Esconder armadilha": return { nome: "Armadilhas", atual: v("armadilhas"), max: P, tipo: "pips" };
    case "Saciar a fome": return { nome: "Fome", atual: v("fome"), max: Math.max(1, Math.floor(P / 2)), tipo: "pips" };
    case "Abrir o domínio": return { nome: "Domínio", atual: v("dominio"), max: 1, tipo: "pips" };
    case "Criar vínculo": return { nome: "Vínculo", atual: v("vinculo"), max: 1, tipo: "pips" };
    case "Lançar ilusão": return { nome: "Ilusão", atual: v("ilusao") > 0 ? 1 : 0, max: 1, tipo: "pips" };
    case "Cortar o espaço": return { nome: "Corte", atual: v("corte"), max: 1, tipo: "pips" };
    default: {
      const sp = SIMPLES[PODER_POR_ROTULO[rotulo]];
      if (!sp?.medidor || !sp.ch) return undefined;
      return { nome: (sp.nome ?? sp.rot).replace(/ \(turnos\)$/, ""), atual: v(sp.ch), max: sp.cap ? sp.cap(P, (n) => temCartao(c, n)) : 1, tipo: sp.medidor };
    }
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
