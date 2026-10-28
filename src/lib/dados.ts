export type Modo = "normal" | "vantagem" | "desvantagem";

export interface Rolagem {
  id: number;
  rotulo: string;
  /** texto das parcelas, como "d20 (14) + 5" */
  detalhe: string;
  total: number;
  critico: boolean;
  falhaCritica: boolean;
  modo: Modo;
  tipo: "d20" | "dano";
}

let contador = 0;
const d = (lados: number) => 1 + Math.floor(Math.random() * lados);

/** Rola um d20 somando o bônus, com vantagem ou desvantagem. */
export function rolarD20(rotulo: string, bonus: number, modo: Modo): Rolagem {
  const a = d(20);
  const b = modo === "normal" ? null : d(20);
  const usado = b === null ? a : modo === "vantagem" ? Math.max(a, b) : Math.min(a, b);
  const sinal = bonus >= 0 ? `+ ${bonus}` : `− ${Math.abs(bonus)}`;
  const dados = b === null ? `d20 (${a})` : `d20 (${a}, ${b} → ${usado})`;
  return {
    id: ++contador,
    rotulo,
    detalhe: `${dados} ${sinal}`,
    total: usado + bonus,
    critico: usado === 20,
    falhaCritica: usado === 1,
    modo,
    tipo: "d20",
  };
}

/** Rola uma expressão como "2d8+3" ou "1d10 + 2d6 - 1". No crítico, dobra a quantidade de dados. */
export function rolarExpressao(rotulo: string, expr: string, critico = false): Rolagem | null {
  const limpo = expr.replace(/\s+/g, "").toLowerCase().replace(/,/g, ".");
  if (!limpo || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(limpo)) return null;
  const partes = limpo.match(/[+-]?(\d*d\d+|\d+)/g) ?? [];
  let total = 0;
  const textos: string[] = [];
  for (const p of partes) {
    const neg = p.startsWith("-");
    const corpo = p.replace(/^[+-]/, "");
    const m = corpo.match(/^(\d*)d(\d+)$/);
    if (m) {
      let n = m[1] ? Number(m[1]) : 1;
      const lados = Number(m[2]);
      if (n > 100 || lados > 1000) return null;
      if (critico) n *= 2;
      const rs = Array.from({ length: n }, () => d(lados));
      const soma = rs.reduce((x, y) => x + y, 0);
      total += neg ? -soma : soma;
      textos.push(`${neg ? "−" : textos.length ? "+" : ""}${n}d${lados} [${rs.join(", ")}]`);
    } else {
      const v = Number(corpo);
      total += neg ? -v : v;
      textos.push(`${neg ? "−" : textos.length ? "+" : ""}${v}`);
    }
  }
  return { id: ++contador, rotulo, detalhe: textos.join(" "), total, critico, falhaCritica: false, modo: "normal", tipo: "dano" };
}
