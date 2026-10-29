import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { configurado, supabase } from "../lib/supabase";

export default function Conta() {
  const { sessao, carregando, sair } = useAuth();
  const local = useLocation();
  const voltar = (local.state as { voltar?: string } | null)?.voltar ?? "/fichas";
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  if (!carregando && sessao && local.state) return <Navigate to={voltar} replace />;

  if (sessao) {
    return (
      <main className="page">
        <div className="em-breve">
          <h1 className="title-font">Minha conta</h1>
          <p>Você entrou como <b>{sessao.user.email}</b>.</p>
          <div className="row">
            <Link className="btn btn-red" to="/fichas">Minhas fichas</Link>
            <button className="btn btn-paper" onClick={sair}>Sair</button>
          </div>
        </div>
      </main>
    );
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setOcupado(true);
    setMsg(null);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setMsg({ tipo: "erro", texto: "E-mail ou senha incorretos." });
    } else {
      if (senha.length < 8) {
        setMsg({ tipo: "erro", texto: "Use uma senha com pelo menos 8 caracteres." });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin + "/conta" },
        });
        if (error) setMsg({ tipo: "erro", texto: "Não foi possível criar a conta: " + error.message });
        else if (!data.session) setMsg({ tipo: "ok", texto: "Conta criada. Confirme pelo e-mail que enviamos e depois entre." });
      }
    }
    setOcupado(false);
  };

  const google = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/conta" },
    });
    if (error) setMsg({ tipo: "erro", texto: "O login com Google não está disponível agora. Entre com e-mail e senha." });
  };

  return (
    <main className="page">
      <div className="login">
        <form className="login-card" onSubmit={enviar}>
          <h1 className="title-font">{modo === "entrar" ? "Entrar" : "Criar conta"}</h1>
          {!configurado && <p className="msg erro">O login ainda não foi configurado neste site.</p>}
          <button type="button" className="btn btn-paper" onClick={google} disabled={!configurado}>
            Continuar com Google
          </button>
          <div className="ou">ou com e-mail</div>
          <label>
            E-mail
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Senha
            <input
              type="password"
              required
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </label>
          {msg && <p className={`msg ${msg.tipo}`}>{msg.texto}</p>}
          <button className="btn btn-red" disabled={ocupado || !configurado}>
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
          <button type="button" className="link" onClick={() => { setModo(modo === "entrar" ? "criar" : "entrar"); setMsg(null); }}>
            {modo === "entrar" ? "Não tenho conta: criar uma" : "Já tenho conta: entrar"}
          </button>
        </form>
        <div className="login-lado">
          <h2 className="title-font">Sua mesa,<br />suas fichas,<br />o livro na mão.</h2>
          <p>Entre para criar e guardar personagens e participar de campanhas. O livro continua aberto para leitura.</p>
        </div>
      </div>
    </main>
  );
}
