import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; /** muda a cada página: tira o aviso quando a pessoa navega */ chave?: string }
interface Estado { falhou: boolean; detalhe: string }

/** Erro de pedaço do site que não existe mais: acontece quando uma versão nova foi publicada com a aba antiga aberta. */
const ehPedacoAntigo = (m: string) => /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically|Unable to preload/i.test(m);

/** Recarrega uma vez só (por minuto) para buscar a versão nova, sem ficar em ciclo. */
export function recarregarUmaVez(): boolean {
  try {
    const ult = Number(sessionStorage.getItem("esv:recarga") || 0);
    if (Date.now() - ult < 60_000) return false;
    sessionStorage.setItem("esv:recarga", String(Date.now()));
  } catch { /* sem armazenamento: recarrega mesmo assim */ }
  window.location.reload();
  return true;
}

/** Evita a tela em branco: se algo quebrar ao desenhar a página, mostra um aviso e um jeito de seguir. */
export class ErroTela extends Component<Props, Estado> {
  state: Estado = { falhou: false, detalhe: "" };

  static getDerivedStateFromError(erro: Error): Estado {
    return { falhou: true, detalhe: `${erro?.name ?? "Erro"}: ${erro?.message ?? ""}`.slice(0, 300) };
  }

  componentDidCatch(erro: Error, _info: ErrorInfo) {
    if (ehPedacoAntigo(String(erro?.message ?? ""))) recarregarUmaVez();
  }

  componentDidUpdate(antes: Props) {
    if (this.state.falhou && antes.chave !== this.props.chave) this.setState({ falhou: false, detalhe: "" });
  }

  render() {
    if (!this.state.falhou) return this.props.children;
    return (
      <main className="page">
        <div className="em-breve">
          <h1 className="title-font">Algo deu errado</h1>
          <p>Esta tela não conseguiu abrir. O que você escreveu em fichas fica guardado no aparelho, então nada se perde.</p>
          {this.state.detalhe && <details className="ajuda"><summary>Detalhes técnicos</summary><code>{this.state.detalhe}</code></details>}
          <div className="row">
            <button type="button" className="btn btn-red" onClick={() => window.location.reload()}>Recarregar</button>
            <a className="btn btn-paper" href="/">Voltar ao início</a>
          </div>
        </div>
      </main>
    );
  }
}
