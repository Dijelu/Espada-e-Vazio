import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface Estado { falhou: boolean }

/** Evita a tela em branco: se algo quebrar ao desenhar a página, mostra um aviso e um jeito de seguir. */
export class ErroTela extends Component<Props, Estado> {
  state: Estado = { falhou: false };

  static getDerivedStateFromError(): Estado {
    return { falhou: true };
  }

  componentDidCatch(_erro: Error, _info: ErrorInfo) {
    /* o aviso na tela basta; nada é enviado a lugar nenhum */
  }

  render() {
    if (!this.state.falhou) return this.props.children;
    return (
      <main className="page">
        <div className="em-breve">
          <h1 className="title-font">Algo deu errado</h1>
          <p>Esta tela não conseguiu abrir. O que você escreveu em fichas fica guardado no aparelho, então nada se perde.</p>
          <div className="row">
            <button type="button" className="btn btn-red" onClick={() => window.location.reload()}>Recarregar</button>
            <a className="btn btn-paper" href="/">Voltar ao início</a>
          </div>
        </div>
      </main>
    );
  }
}
