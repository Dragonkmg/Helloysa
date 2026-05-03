(function () {
  document.addEventListener("DOMContentLoaded", iniciarLogin);

  function iniciarLogin() {
    const form = document.getElementById("form-login");
    const linkCadastro = document.getElementById("link-cadastro");

    preservarRedirectNoLink(linkCadastro, "/cadastro.html");

    if (window.HellojaAuth && HellojaAuth.estaLogado()) {
      window.location.href = HellojaAuth.consumirRedirect("/perfil.html");
      return;
    }

    if (!form) return;

    form.addEventListener("submit", enviarLogin);
  }

  async function enviarLogin(evento) {
    evento.preventDefault();

    const botao = document.getElementById("btn-login");

    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value;

    if (!email || !senha) {
      mostrarMensagem("Informe e-mail e senha.", true);
      return;
    }

    alterarCarregando(botao, true, "Entrando...");

    try {
      const resposta = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          senha
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok || dados.erro) {
        mostrarMensagem(dados.mensagem || "Não foi possível entrar.", true);
        return;
      }

      HellojaAuth.salvarSessao({
        token: dados.token,
        usuario: dados.usuario
      });

      mostrarMensagem("Login realizado com sucesso.", false);

      window.location.href = HellojaAuth.consumirRedirect("/perfil.html");
    } catch (erro) {
      console.error("Erro ao fazer login:", erro);
      mostrarMensagem("Erro ao conectar com o servidor.", true);
    } finally {
      alterarCarregando(botao, false, "Entrar");
    }
  }

  function preservarRedirectNoLink(link, destinoBase) {
    if (!link || !window.HellojaAuth) return;

    const redirect = HellojaAuth.obterRedirectPadrao(null);

    if (!redirect) return;

    link.href = `${destinoBase}?redirect=${encodeURIComponent(redirect)}`;
  }

  function alterarCarregando(botao, carregando, texto) {
    if (!botao) return;

    botao.disabled = carregando;
    botao.textContent = texto;
  }

  function mostrarMensagem(texto, erro = false) {
    const mensagem = document.getElementById("mensagem-login");

    if (!mensagem) return;

    mensagem.textContent = texto;
    mensagem.classList.remove("escondido");
    mensagem.classList.toggle("erro", erro);
  }
})();