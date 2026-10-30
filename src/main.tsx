import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./components/Auth";
import { ThemeProvider } from "./components/Theme";
import { iniciarSom } from "./lib/som";
import { iniciarProtecao } from "./lib/protecao";
import { iniciarQuincy } from "./lib/quincy";
import { recarregarUmaVez } from "./components/ErroTela";
import "./styles.css";

// pedaço do site que sumiu depois de uma atualização: busca a versão nova
window.addEventListener("vite:preloadError", (ev) => {
  ev.preventDefault();
  recarregarUmaVez();
});

iniciarSom();
iniciarProtecao();
iniciarQuincy();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
