import type { Preset } from "./efeitos-presets";
import type { TipoForma } from "./ficha";

/* Peças de criação de 16/11: iniciativa (peça nova) e gatilhos pouco explorados (ao errar, no crítico). Preço = soma dos efeitos. */
const TODAS: TipoForma[] = ["shikai", "bankai", "bankai2", "resurreccion", "segunda", "vollstandig"];
const GRANDES: TipoForma[] = ["bankai", "bankai2", "resurreccion", "segunda", "vollstandig"];

export const PRESETS_LEVA: Preset[] = [
  { id: "n-olhos-abertos", nome: "Olhos Abertos", familias: TODAS, categoria: "Mobilidade", texto: "+3 de iniciativa.", monta: () => [{ k: "ini", v: 3 }] },
  { id: "n-saque-relampago", nome: "Saque Relâmpago", familias: ["shikai"], categoria: "Ofensivo", texto: "+2 de iniciativa e +1 no acerto dos golpes.", monta: () => [{ k: "ini", v: 2 }, { k: "acerto", em: ["golpe"], v: 1 }] },
  { id: "n-instinto-caca", nome: "Instinto de Caça", familias: ["resurreccion", "segunda"], categoria: "Mobilidade", texto: "+proficiência de iniciativa e +3 m de deslocamento.", monta: () => [{ k: "ini", v: "[PROF]" }, { k: "desloc", modo: "chao", v: 3 }] },
  { id: "n-antes-trovao", nome: "Passo Antes do Trovão", familias: GRANDES, categoria: "Mobilidade", texto: "+5 de iniciativa e +3 m de deslocamento.", monta: () => [{ k: "ini", v: 5 }, { k: "desloc", modo: "chao", v: 3 }] },
  { id: "n-guarda-desperta", nome: "Guarda Desperta", familias: TODAS, categoria: "Defesa", texto: "+2 de iniciativa e +1 de CR.", monta: () => [{ k: "ini", v: 2 }, { k: "cr", v: 1 }] },
  { id: "n-peso-coroa", nome: "Peso da Coroa", familias: TODAS, categoria: "Pontos fracos", texto: "A forma é lenta para começar: −4 de iniciativa.", monta: () => [{ k: "ini", v: -4 }] },
  { id: "n-licao-erro", nome: "Lição do Erro", familias: TODAS, categoria: "Gatilhos", texto: "Uma vez por turno, ao errar um ataque, você recupera 1 PR.", monta: () => [{ k: "gatilho", quando: "errou", limite: "turno", faz: { pr: 1 }, rotulo: "Lição do Erro" }] },
  { id: "n-guarda-apos-erro", nome: "Recuo Calculado", familias: TODAS, categoria: "Gatilhos", texto: "Uma vez por turno, ao errar um ataque, a reiatsu se fecha em guarda: PV temporários iguais à proficiência.", monta: () => [{ k: "gatilho", quando: "errou", limite: "turno", faz: { pvTemp: "[PROF]" }, rotulo: "Recuo Calculado" }] },
  { id: "n-finta", nome: "Finta", familias: TODAS, categoria: "Gatilhos", texto: "Uma vez por turno, ao errar um ataque, o seu próximo ataque no mesmo alvo tem +2 no acerto.", monta: () => [{ k: "gatilho", quando: "errou", limite: "turno", faz: { texto: "o próximo ataque no mesmo alvo tem +2 no acerto" }, rotulo: "Finta" }] },
  { id: "n-misericordia", nome: "Queda Certa", familias: TODAS, categoria: "Gatilhos", texto: "Em um crítico, o alvo faz salvaguarda de Força ou cai Caído.", monta: () => [{ k: "gatilho", quando: "critico", limite: "turno", faz: { condicao: { nome: "Caído", salva: "for" } }, rotulo: "Queda Certa" }] },
  { id: "n-sangue-frio", nome: "Sangue Frio", familias: TODAS, categoria: "Gatilhos", texto: "Em um crítico, você recupera PR iguais à metade da proficiência.", monta: () => [{ k: "gatilho", quando: "critico", limite: "turno", faz: { pr: "[PROF]/2" }, rotulo: "Sangue Frio" }] },
  { id: "n-impeto", nome: "Ímpeto", familias: TODAS, categoria: "Gatilhos", texto: "Em um crítico, você ganha PV temporários iguais a 2 × proficiência.", monta: () => [{ k: "gatilho", quando: "critico", limite: "turno", faz: { pvTemp: "[PROF]*2" }, rotulo: "Ímpeto" }] },
  { id: "n-corte-marca", nome: "Corte que Marca", familias: GRANDES, categoria: "Gatilhos", texto: "Em um crítico, o alvo faz salvaguarda de Constituição ou fica Sangrando (1d6 no início de cada turno dele) até o fim da cena ou até ser tratado.", monta: () => [{ k: "gatilho", quando: "critico", limite: "turno", faz: { condicao: { nome: "Sangrando (1d6 por turno)", salva: "con", duracao: "até o fim da cena ou até ser tratado" } }, rotulo: "Corte que Marca" }] },
  { id: "n-abertura", nome: "Abertura Fulminante", familias: GRANDES, categoria: "Gatilhos", texto: "Ao liberar, a pressão espiritual explode: proficiência d6 de Energia em quem estiver a até 6 m.", monta: () => [{ k: "gatilho", quando: "liberar", limite: "cena", faz: { dano: { expr: "[PROF]d6", tipo: "Energia", area: "6 m ao seu redor" } }, rotulo: "Abertura Fulminante" }] },
  { id: "n-sede-vitoria", nome: "Sede de Vitória", familias: ["resurreccion", "segunda", "bankai2"], categoria: "Gatilhos", texto: "Ao derrubar um inimigo, você ganha PV temporários iguais a 2 × proficiência.", monta: () => [{ k: "gatilho", quando: "abate", faz: { pvTemp: "[PROF]*2" }, rotulo: "Sede de Vitória" }] },
  { id: "n-pele-aprende", nome: "Pele que Aprende", familias: GRANDES, categoria: "Gatilhos", texto: "Uma vez por rodada, ao ser atingido, você ganha PV temporários iguais à proficiência.", monta: () => [{ k: "gatilho", quando: "atingido", limite: "rodada", faz: { pvTemp: "[PROF]" }, rotulo: "Pele que Aprende" }] },
];
