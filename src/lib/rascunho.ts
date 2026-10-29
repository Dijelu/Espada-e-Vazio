/* Cópia de segurança no aparelho: guarda o que a pessoa está fazendo caso o site ou a conexão caiam. */
const PREFIXO = "esv:";

interface Guardado<T> { dados: T; em: number; pendente: boolean }

export function guardar<T>(chave: string, dados: T, pendente: boolean) {
  try {
    const g: Guardado<T> = { dados, em: Date.now(), pendente };
    localStorage.setItem(PREFIXO + chave, JSON.stringify(g));
  } catch {
    /* sem armazenamento: segue sem cópia local */
  }
}

export function ler<T>(chave: string): Guardado<T> | null {
  try {
    const t = localStorage.getItem(PREFIXO + chave);
    return t ? (JSON.parse(t) as Guardado<T>) : null;
  } catch {
    return null;
  }
}

export function limpar(chave: string) {
  try {
    localStorage.removeItem(PREFIXO + chave);
  } catch {
    /* ignora */
  }
}

/** Marca a cópia como já enviada ao servidor. */
export function marcarEnviado(chave: string) {
  const g = ler<unknown>(chave);
  if (g && g.pendente) guardar(chave, g.dados, false);
}
