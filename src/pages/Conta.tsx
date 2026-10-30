import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { configurado, supabase } from "../lib/supabase";

export default function Conta() {
  const { sessao, carregando, sair, recuperando, fimRecuperacao } = useAuth();
  const local = useLocation();
  const voltar = (local.state as { voltar?: string } | null)?.voltar ?? "/fichas";
  const [modo, setModo] = useState<"entrar" | "criar" | "esqueci">("entrar");
  const [novaSenha, setNovaSenha] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const trocarSenha = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (novaSenha.length < 8) {
      setMsg({ tipo: "erro", texto: "Use uma senha com pelo menos 8 caracteres." });
      return;
    }
    setOcupado(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setOcupado(false);
    if (error) setMsg({ tipo: "erro", texto: "Não foi possível trocar a senha. Peça um link novo e tente de novo." });
    else {
      setNovaSenha("");
      setMsg({ tipo: "ok", texto: "Senha trocada. Você já está dentro da sua conta." });
      fimRecuperacao();
    }
  };

  if (sessao && recuperando) {
    return (
      <main className="page">
        <div className="login">
          <form className="login-card" onSubmit={trocarSenha}>
            <h1 className="title-font">Nova senha</h1>
            <p>Escolha a nova senha da sua conta.</p>
            <label>
              Nova senha
              <input type="password" required minLength={8} autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            </label>
            {msg && <p className={`msg ${msg.tipo}`}>{msg.texto}</p>}
            <button className="btn btn-red" disabled={ocupado}>Salvar nova senha</button>
          </form>
        </div>
      </main>
    );
  }

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
    if (modo === "esqueci") {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/conta" });
      // a resposta é a mesma exista a conta ou não, para não revelar quem tem cadastro
      setMsg({ tipo: "ok", texto: "Se existir uma conta com esse e-mail, enviamos um link para criar uma senha nova. Olhe também o spam." });
    } else if (modo === "entrar") {
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
          <h1 className="title-font">{modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Recuperar senha"}</h1>
          {!configurado && <p className="msg erro">O login ainda não foi configurado neste site.</p>}
          {modo !== "esqueci" && (
            <>
              <button type="button" className="btn btn-paper" onClick={google} disabled={!configurado}>
                Continuar com Google
              </button>
              <div className="ou">ou com e-mail</div>
            </>
          )}
          {modo === "esqueci" && <p>Digite o e-mail da sua conta. Enviaremos um link para você criar uma senha nova.</p>}
          <label>
            E-mail
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {modo !== "esqueci" && (
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
          )}
          {msg && <p className={`msg ${msg.tipo}`}>{msg.texto}</p>}
          <button className="btn btn-red" disabled={ocupado || !configurado}>
            {modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Enviar link"}
          </button>
          {modo === "entrar" && (
            <button type="button" className="link" onClick={() => { setModo("esqueci"); setMsg(null); }}>
              Esqueci minha senha
            </button>
          )}
          <button type="button" className="link" onClick={() => { setModo(modo === "criar" ? "entrar" : modo === "entrar" ? "criar" : "entrar"); setMsg(null); }}>
            {modo === "entrar" ? "Não tenho conta: criar uma" : modo === "criar" ? "Já tenho conta: entrar" : "Voltar para entrar"}
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
