import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./components/Auth";
import { ThemeProvider } from "./components/Theme";
import { iniciarSom } from "./lib/som";
import { iniciarProtecao } from "./lib/protecao";
import { iniciarQuincy } from "./lib/quincy";
import "./styles.css";

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
