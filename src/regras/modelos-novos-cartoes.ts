/* Cartões dos modelos novos (Shikai, Bankai e Resurrección acrescentados). Dados, não lógica.
   Segue as mesmas regras dos demais: dano e PR vêm das ações; o que não virou cartão fica como texto de sabor. */
import type { CartoesDoModelo } from "./modelos-cartoes";

const leve = (prejuizo: string) => ({ forca: "leve" as const, modo: "pronta" as const, prejuizo });
const medio = (prejuizo: string) => ({ forca: "medio" as const, modo: "pronta" as const, prejuizo });

export const CARTOES_SHIKAI_NOVOS: Record<string, CartoesDoModelo> = {
  "hozukimaru": {
    acoes: {
      "Estocada Estendida": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Giro do Sansetsukon": { sub: "area", ritmo: "acao", atr: "FOR" },
      "Haste Partida": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Guarda da Haste": { sub: "cura", ritmo: "reacao", atr: "FOR" },
    },
    blocos: [[{ k: "C", id: "alcance", liga: "Estocada Estendida" }], [{ k: "C", id: "golpe-duplo", liga: "Haste Partida" }]],
    fraco: leve("l-guarda"), sabor: "",
  },
  "wabisuke": {
    acoes: {
      "Golpe do Peso": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Gancho da Penitência": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Cortes Encadeados": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Gancho de Defesa": { sub: "cura", ritmo: "reacao", atr: "FOR" },
    },
    blocos: [[{ k: "T", id: "marcar-alvo" }, { k: "I", id: "peso-dobrado", tec: "marcar-alvo" }], [{ k: "C", id: "condicao-escala", p: { condicao: "Caído" }, liga: "Golpe do Peso" }], [{ k: "C", id: "condicao-acerto", p: { condicao: "Caído" }, liga: "Gancho da Penitência" }], [{ k: "P", id: "sk-peso" }], [{ k: "P", id: "sk-retardo" }]],
    fraco: leve("l-passos"), sabor: "",
  },
  "kazeshini": {
    acoes: {
      "Ceifa em Corrente": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Roda de Foices": { sub: "area", ritmo: "acao", atr: "FOR" },
      "Kubikake": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Prender a Lâmina": { sub: "cura", ritmo: "reacao", atr: "FOR" },
    },
    blocos: [[{ k: "C", id: "alcance", liga: "Ceifa em Corrente" }], [{ k: "C", id: "puxar", liga: "Kubikake" }]],
    fraco: leve("l-visao"), sabor: "",
  },
  "sogyo-no-kotowari": {
    acoes: {
      "Escudo das Ondas": { sub: "cura", ritmo: "reacao", atr: "ESP" },
      "Trovão Devolvido": { sub: "ataque", ritmo: "reacao", atr: "ESP" },
      "Corte do Fio Vermelho": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Dança das Gêmeas": { sub: "ataque", ritmo: "bonus", atr: "ESP" },
    },
    blocos: [[{ k: "T", id: "absorver-devolver" }, { k: "I", id: "devolver-absorvido", tec: "absorver-devolver" }], [{ k: "C", id: "critico-ampliado", liga: "Trovão Devolvido" }], [{ k: "C", id: "golpe-duplo", liga: "Dança das Gêmeas" }]],
    fraco: leve("l-corpo"), sabor: "",
  },
  "nozarashi": {
    acoes: {
      "Corte que Rasga Tudo": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Machadada Larga": { sub: "area", ritmo: "acao", atr: "FOR" },
      "Fome de Luta": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Sugar a Força": { sub: "cura", ritmo: "reacao", atr: "FOR", cura: "temp" },
    },
    blocos: [[{ k: "T", id: "corte-espaco" }, { k: "I", id: "fenda-aberta", tec: "corte-espaco" }], [{ k: "C", id: "atravessa", liga: "Corte que Rasga Tudo" }], [{ k: "C", id: "critico-ampliado", liga: "Corte que Rasga Tudo" }]],
    fraco: leve("l-guarda"), sabor: "",
  },
  "minazuki": {
    acoes: {
      "Arraia Envolvente": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Cauda da Arraia": { sub: "area", ritmo: "acao", atr: "ESP" },
      "Calor da Arraia": { sub: "cura", ritmo: "bonus", atr: "ESP" },
      "Manto de Reiatsu": { sub: "cura", ritmo: "reacao", atr: "ESP" },
    },
    blocos: [[{ k: "C", id: "condicao-acerto", p: { condicao: "Agarrado" }, liga: "Arraia Envolvente" }], [{ k: "C", id: "cura-no-acerto", liga: "Arraia Envolvente" }]],
    fraco: leve("l-corpo"), sabor: "",
  },
  "tachikaze": {
    acoes: {
      "Corte do Vento": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Rajada Cortante": { sub: "area", ritmo: "acao", atr: "FOR" },
      "Estocada Rápida": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Vento de Guarda": { sub: "cura", ritmo: "reacao", atr: "FOR" },
    },
    blocos: [[{ k: "C", id: "golpe-duplo", liga: "Estocada Rápida" }], [{ k: "C", id: "empurrao", liga: "Corte do Vento" }]],
    fraco: leve("l-guarda"), sabor: "",
  },
  "fuji-kujaku": {
    acoes: {
      "Foice de Quatro Lâminas": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Ramas Sugadoras": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Pétalas de Cura": { sub: "cura", ritmo: "bonus", atr: "ESP" },
      "Cortina de Pétalas": { sub: "cura", ritmo: "reacao", atr: "ESP" },
    },
    blocos: [[{ k: "T", id: "vinculo" }, { k: "I", id: "vinculo-cura", tec: "vinculo" }], [{ k: "C", id: "condicao-acerto", p: { condicao: "Agarrado" }, liga: "Ramas Sugadoras" }], [{ k: "C", id: "pr-no-acerto", liga: "Ramas Sugadoras" }], [{ k: "P", id: "sk-cura" }], [{ k: "P", id: "sk-alcance" }]],
    fraco: { forca: "leve", modo: "livre", nome: "Vaidade ferida", texto: "Se um alvo passar na salvaguarda das ramas duas vezes seguidas, a Shikai emburra: as ramas ficam sem efeito até o fim da cena." }, sabor: "",
  },
};

const P = (id: string, param?: { atr?: string; tipo?: string; n?: number }) => [{ k: "P" as const, id, ...(param ? { param } : {}) }];

export const CARTOES_BANKAI_NOVOS: Record<string, CartoesDoModelo> = {
  "ryumon-hozukimaru": {
    acoes: {
      "Machado do Dragão": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Corrente de Pomos": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Ryūmon: Corte Final": { sub: "ataque", ritmo: "acao", atr: "FOR", final: true },
      "Escudo de Pomo": { sub: "cura", ritmo: "reacao", atr: "FOR" },
    },
    blocos: [
      [{ k: "T", id: "acumular-poder" }, { k: "I", id: "descarregar-poder", tec: "acumular-poder" }],
      P("bk-forca", { atr: "for" }), P("bk-precisao"), [{ k: "C", id: "alcance", liga: "Corrente de Pomos" }], P("bk-reacao"), P("bk-ferro"), P("bk-fio-golpe", { n: 1 }), P("bk-veloz"), P("bk-duplo"),
    ],
    fraco: { forca: "forte", modo: "livre", nome: "Lâmina Quebradiça", texto: "Se você sofrer um acerto crítico com a Bankai ativa, ela se quebra e a forma termina." },
    sabor: "",
  },
  "kenpachi-bankai": {
    acoes: {
      "Golpe do Monstro": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Pisada Brutal": { sub: "area", ritmo: "acao", atr: "FOR" },
      "Corte que Arranca a Mão": { sub: "ataque", ritmo: "acao", atr: "FOR", final: true },
      "Fúria Sem Dor": { sub: "cura", ritmo: "reacao", atr: "FOR", cura: "temp" },
    },
    blocos: [[{ k: "T", id: "sobrecarga" }, { k: "I", id: "furia-sem-distincao", tec: "sobrecarga" }], [{ k: "C", id: "atravessa", liga: "Golpe do Monstro" }], P("bk-forca", { atr: "for" }), P("bk-ferro"), P("bk-fio-golpe", { n: 1 }), P("bk-reacao"), P("bk-gigante"), P("bk-explosao"), P("bk-recompor"), [{ k: "C", id: "efeito-critico", p: { condicao: "Caído" }, liga: "Golpe do Monstro" }]],
    fraco: { forca: "forte", modo: "pronta", prejuizo: "f-colapso" },
    sabor: "",
  },
  "minazuki-bankai": {
    acoes: {
      "Lâminas da Névoa": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Chuva de Lâminas": { sub: "area", ritmo: "acao", atr: "ESP" },
      "Sangue que Cura": { sub: "cura", ritmo: "bonus", atr: "ESP" },
      "Esfera de Lâminas": { sub: "cura", ritmo: "reacao", atr: "ESP" },
      "Fim Carmesim": { sub: "ataque", ritmo: "acao", atr: "ESP", final: true },
    },
    blocos: [[{ k: "T", id: "dominio" }, { k: "I", id: "regra-dominio", tec: "dominio" }], [{ k: "C", id: "alcance", liga: "Lâminas da Névoa" }], [{ k: "C", id: "cura-no-acerto", liga: "Lâminas da Névoa" }], P("bk-nevoa-veneno"), P("bk-barreira"), P("bk-refaz"), P("bk-recompor"), P("bk-reacao"), P("bk-precisao")],
    fraco: { forca: "medio", modo: "livre", nome: "Sangue exposto", texto: "A névoa é feita do seu próprio sangue: cada vez que você usa Sangue que Cura, perde [PROF]d4 PV; nada reduz esse dano." }, sabor: "",
  },
  "tekken-tachikaze": {
    acoes: {
      "Soco Explosivo": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Onda de Impacto": { sub: "area", ritmo: "acao", atr: "FOR" },
      "Duplo Soco": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Guarda Explosiva": { sub: "cura", ritmo: "reacao", atr: "FOR" },
      "Rajada de Tachikaze": { sub: "ataque", ritmo: "acao", atr: "FOR", final: true },
    },
    blocos: [[{ k: "C", id: "golpe-duplo", liga: "Duplo Soco" }], [{ k: "C", id: "empurrao", liga: "Soco Explosivo" }], [{ k: "C", id: "explosao", liga: "Onda de Impacto" }], P("bk-forca", { atr: "for" }), P("bk-ferro"), P("bk-explosao"), P("bk-reacao"), P("bk-veloz"), P("bk-duplo")],
    fraco: medio("m-peso"), sabor: "",
  },
  "fushi-no-kojo": {
    acoes: {
      "Laço Preso": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Roda de Correntes": { sub: "area", ritmo: "acao", atr: "FOR" },
      "Ferida Recíproca": { sub: "cura", ritmo: "bonus", atr: "ESP" },
      "Corrente de Guarda": { sub: "cura", ritmo: "reacao", atr: "FOR" },
      "Execução do Laço": { sub: "ataque", ritmo: "acao", atr: "FOR", final: true },
    },
    blocos: [[{ k: "C", id: "condicao-acerto", p: { condicao: "Agarrado" }, liga: "Laço Preso" }], [{ k: "C", id: "puxar", liga: "Laço Preso" }], [{ k: "T", id: "vinculo" }, { k: "I", id: "vinculo-cura", tec: "vinculo" }], P("bk-correntes"), P("bk-escudo-corrente"), P("bk-refaz"), P("bk-forca", { atr: "for" }), P("bk-reacao"), P("bk-ferro")],
    fraco: { forca: "forte", modo: "livre", nome: "Laço mortal", texto: "Se a Bankai estiver ativa quando você ou o alvo ligado levar o golpe final, os dois morrem." }, sabor: "",
  },
};

export const CARTOES_RES_NOVOS: Record<string, CartoesDoModelo> = {
  "lobos": {
    acoes: {
      "Gran Rey Cero: Alvorada de Lobos": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Cero Metralleta": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Matilha Explosiva": { sub: "area", ritmo: "acao", atr: "ESP" },
      "Lilynette no Gatilho": { sub: "ataque", ritmo: "bonus", atr: "ESP" },
      "Lobo de Guarda": { sub: "cura", ritmo: "reacao", atr: "ESP" },
    },
    blocos: [[{ k: "T", id: "invocacao-enxame" }, { k: "I", id: "lancar-enxame", tec: "invocacao-enxame" }], P("rs-matilha"), P("rs-cero-denso"), P("rs-mira"), P("rs-hierro"), P("rs-forca", { atr: "esp" }), P("rs-instinto"), [{ k: "C", id: "golpe-duplo", liga: "Cero Metralleta" }]],
    fraco: { forca: "medio", modo: "livre", nome: "Lobos presos às pistolas", texto: "Os lobos e a matilha só existem enquanto você segura as duas pistolas. Se for desarmado ou as largar, as habilidades de lobo ficam bloqueadas até recuperá-las." }, sabor: "",
  },
  "santa-teresa": {
    acoes: {
      "Golpe Fantasma: Dança das Foices": { sub: "ataque", ritmo: "acao", atr: "DES" },
      "Foices Gêmeas": { sub: "ataque", ritmo: "acao", atr: "FOR" },
      "Moinho de Foices": { sub: "area", ritmo: "acao", atr: "FOR" },
      "Braços Longos": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Quatro Braços Cruzados": { sub: "cura", ritmo: "reacao", atr: "FOR" },
    },
    blocos: [P("rs-bracos"), [{ k: "C", id: "golpe-duplo", liga: "Foices Gêmeas" }], P("rs-forca", { atr: "for" }), P("rs-hierro"), P("rs-regen"), P("rs-garra"), P("rs-instinto")],
    fraco: { forca: "leve", modo: "livre", nome: "Regeneração limitada", texto: "A regeneração dos braços não cura órgãos nem o cérebro: golpes fatais ao tronco ou à cabeça não se regeneram." }, sabor: "",
  },
  "fornicaras": {
    acoes: {
      "Mundo Quebrado: Desespero": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Cópia de Carbono": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Teatro de Títere": { sub: "ataque", ritmo: "bonus", atr: "ESP" },
      "Possessão": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Telón Balón": { sub: "cura", ritmo: "reacao", atr: "ESP" },
    },
    blocos: [
      [{ k: "T", id: "copiar" }, { k: "I", id: "usar-copia", tec: "copiar" }],
      [{ k: "T", id: "vinculo" }, { k: "I", id: "vinculo-dano", tec: "vinculo" }],
      [{ k: "C", id: "condicao-acerto", p: { condicao: "Enfeitiçado" }, liga: "Possessão" }],
      [{ k: "C", id: "segunda-chance" }],
      P("rs-hierro"), P("rs-regen"), P("rs-escuro"), P("rs-forca", { atr: "esp" }), P("rs-presa", { n: 1 }), P("rs-instinto"),
    ],
    fraco: medio("m-reiatsu"), sabor: "Gabriel (renascer por dentro de um inimigo) usa a característica Segunda chance.",
  },
  "trepadora": {
    acoes: {
      "Veneno Total: Senilidade": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "La Hélice": { sub: "area", ritmo: "acao", atr: "ESP" },
      "Jaula Tentáculo": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Lanza Tentáculo": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Hierro Virgen": { sub: "cura", ritmo: "reacao", atr: "ESP" },
    },
    blocos: [P("rs-bracos"), [{ k: "C", id: "condicao-acerto", p: { condicao: "Agarrado" }, liga: "Jaula Tentáculo" }], P("rs-forca", { atr: "esp" }), P("rs-hierro"), P("rs-regen")],
    fraco: leve("l-passos"), sabor: "",
  },
  "golondrina": {
    acoes: {
      "Golpe Fantasma: Corte de Asa": { sub: "ataque", ritmo: "acao", atr: "DES" },
      "Ala Cortadora": { sub: "ataque", ritmo: "acao", atr: "DES" },
      "Revoada de Lâminas": { sub: "area", ritmo: "acao", atr: "DES" },
      "Voo Rasante": { sub: "ataque", ritmo: "bonus", atr: "DES" },
      "Asas Cruzadas": { sub: "cura", ritmo: "reacao", atr: "DES" },
    },
    blocos: [P("rs-asas"), [{ k: "C", id: "golpe-duplo", liga: "Ala Cortadora" }], P("rs-pantera"), P("rs-hierro"), P("rs-garra"), P("rs-instinto"), P("rs-gemelos")],
    fraco: medio("m-reiatsu"), sabor: "",
  },
};

export const CARTOES_SEGUNDA_NOVOS: Record<string, CartoesDoModelo> = {
  "lobos-segunda": {
    acoes: {
      "Cero Metralleta Final": { sub: "ataque", ritmo: "acao", atr: "ESP", final: true },
      "Matilha Gigante": { sub: "area", ritmo: "acao", atr: "ESP" },
      "Disparo da Lilynette": { sub: "ataque", ritmo: "bonus", atr: "ESP" },
      "Lobo Escudo": { sub: "cura", ritmo: "reacao", atr: "ESP" },
    },
    blocos: [P("se-oscuras"), P("se-legiao"), P("se-instinto"), P("se-hierro"), P("se-forca", { atr: "esp" })],
    fraco: { forca: "medio", modo: "livre", nome: "Lobos presos às pistolas", texto: "Os lobos e a matilha só existem enquanto você segura as duas pistolas. Se for desarmado ou as largar, as habilidades de lobo ficam bloqueadas até recuperá-las." },
    sabor: "",
  },
  "santa-teresa-segunda": {
    acoes: {
      "Colheita das Seis Foices": { sub: "ataque", ritmo: "acao", atr: "FOR", final: true },
      "Moinho Completo": { sub: "area", ritmo: "acao", atr: "FOR" },
      "Pulso que Corta": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Grade de Foices": { sub: "cura", ritmo: "reacao", atr: "FOR" },
    },
    blocos: [P("se-forca", { atr: "for" }), P("se-hierro"), P("se-instinto"), P("se-regen"), [{ k: "C", id: "golpe-duplo", liga: "Colheita das Seis Foices" }]],
    fraco: { forca: "leve", modo: "livre", nome: "Regeneração limitada", texto: "A regeneração dos braços não cura órgãos nem o cérebro: golpes fatais ao tronco ou à cabeça não se regeneram." },
    sabor: "",
  },
  "fornicaras-segunda": {
    acoes: {
      "Cópia Aperfeiçoada": { sub: "ataque", ritmo: "acao", atr: "ESP", final: true },
      "Boneco Preso": { sub: "ataque", ritmo: "acao", atr: "ESP" },
      "Asa Esticada": { sub: "ataque", ritmo: "bonus", atr: "ESP" },
      "Telón Balón Total": { sub: "cura", ritmo: "reacao", atr: "ESP" },
    },
    blocos: [
      [{ k: "T", id: "copiar" }, { k: "I", id: "usar-copia", tec: "copiar" }],
      [{ k: "T", id: "vinculo" }, { k: "I", id: "vinculo-dano", tec: "vinculo" }],
      [{ k: "C", id: "segunda-chance" }],
      [{ k: "C", id: "condicao-acerto", p: { condicao: "Enfeitiçado" }, liga: "Boneco Preso" }],
      P("se-hierro"), P("se-forca", { atr: "esp" }),
    ],
    fraco: { forca: "medio", modo: "livre", nome: "Gabriel exige um inimigo marcado", texto: "A Segunda chance só funciona se, antes, você tiver engravidado um inimigo presente na cena. Sem inimigo marcado, ela não age." },
    sabor: "Gabriel (renascer por dentro de um inimigo) usa a característica Segunda chance.",
  },
  "trepadora-segunda": {
    acoes: {
      "Floresta de Lanzas": { sub: "area", ritmo: "acao", atr: "ESP", final: true },
      "Hélice Maior": { sub: "area", ritmo: "acao", atr: "ESP" },
      "Jaula Fechada": { sub: "ataque", ritmo: "bonus", atr: "FOR" },
      "Hierro Virgen Total": { sub: "cura", ritmo: "reacao", atr: "ESP" },
    },
    blocos: [P("se-latigo"), [{ k: "C", id: "condicao-acerto", p: { condicao: "Agarrado" }, liga: "Jaula Fechada" }], [{ k: "C", id: "puxar", liga: "Jaula Fechada" }], P("se-hierro"), P("se-forca", { atr: "esp" })],
    fraco: leve("l-passos"), sabor: "",
  },
};
