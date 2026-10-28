import { Children, Fragment, isValidElement, cloneElement, type ReactElement, type ReactNode } from "react";
import { dica, reGlossario } from "../content/glossario";

export function textoDe(c: ReactNode): string {
  if (typeof c === "string" || typeof c === "number") return String(c);
  if (Array.isArray(c)) return c.map(textoDe).join("");
  if (isValidElement(c)) return textoDe((c.props as { children?: ReactNode }).children);
  return "";
}

/** Marca termos do glossário (só a 1ª ocorrência de cada um por bloco) com dica ao passar o mouse. */
export function comDicas(children: ReactNode): ReactNode {
  const vistos = new Set<string>();
  const marca = (n: ReactNode, chave: string): ReactNode => {
    if (typeof n === "string") {
      const partes: ReactNode[] = [];
      let ultimo = 0;
      n.replace(reGlossario, (m: string, _g: string, off: number) => {
        const k = m.toLowerCase();
        if (vistos.has(k) || !dica(m)) return m;
        vistos.add(k);
        if (off > ultimo) partes.push(n.slice(ultimo, off));
        partes.push(
          <abbr key={`${chave}-${off}`} className="termo" tabIndex={0} data-dica={dica(m)}>
            {m}
          </abbr>
        );
        ultimo = off + m.length;
        return m;
      });
      if (!partes.length) return n;
      if (ultimo < n.length) partes.push(n.slice(ultimo));
      return <Fragment key={chave}>{partes}</Fragment>;
    }
    if (isValidElement(n)) {
      const el = n as ReactElement<{ children?: ReactNode }>;
      if (el.type === "abbr" || el.type === "a") return n;
      return cloneElement(el, undefined, ...Children.toArray(el.props.children).map((c, i) => marca(c, `${chave}.${i}`)));
    }
    return n;
  };
  return Children.toArray(children).map((c, i) => marca(c, String(i)));
}

const RE_EXEMPLO = /^(Por exemplo|Exemplos?)\b[,:]?/i;
const RE_ATENCAO = /^(Importante|Atenção|Nota|Lembre-se|Observação|Cuidado|Regra opcional)\b[,:]?/i;
const RE_DEF = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^:.!?]{2,48}?):\s+(?=\S)/;

export function Paragrafo({ children }: { children?: ReactNode }) {
  const t = textoDe(children).trimStart();
  if (RE_EXEMPLO.test(t)) {
    return (
      <div className="callout exemplo">
        <b>Exemplo</b>
        <p>{comDicas(children)}</p>
      </div>
    );
  }
  if (RE_ATENCAO.test(t)) {
    return (
      <div className="callout atencao">
        <b>Atenção</b>
        <p>{comDicas(children)}</p>
      </div>
    );
  }
  const m = RE_DEF.exec(t);
  const arr = Children.toArray(children);
  if (m && typeof arr[0] === "string") {
    const s = arr[0] as string;
    const i = s.indexOf(":");
    if (i > 0 && i <= 52) {
      return (
        <p>
          <strong className="def">{s.slice(0, i + 1)}</strong>
          {comDicas([s.slice(i + 1), ...arr.slice(1)])}
        </p>
      );
    }
  }
  return <p>{comDicas(children)}</p>;
}

export function Item({ children }: { children?: ReactNode }) {
  return <li>{comDicas(children)}</li>;
}
