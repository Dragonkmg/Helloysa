(function () {
  document.addEventListener("DOMContentLoaded", iniciarCadastro);

  function iniciarCadastro() {
    const form = document.getElementById("form-cadastro");
    const linkLogin = document.getElementById("link-login");

    preservarRedirectNoLink(linkLogin, "/login.html");

    if (window.HellojaAuth && HellojaAuth.estaLogado()) {
      window.location.href = HellojaAuth.consumirRedirect("/perfil.html");
      return;
    }

    if (!form) return;

    form.addEventListener("submit", enviarCadastro);
  }

  async function enviarCadastro(evento) {
    evento.preventDefault();

    const botao = document.getElementById("btn-cadastro");

    const nome = document.getElementById("cadastro-nome").value.trim();
    const email = document.getElementById("cadastro-email").value.trim();
    const telefone = document.getElementById("cadastro-telefone").value.trim();
    const senha = document.getElementById("cadastro-senha").value;
    const confirmarSenha = document.getElementById("cadastro-confirmar-senha").value;

    if (!nome || !email || !senha || !confirmarSenha) {
      mostrarMensagem("Preencha os campos obrigatórios.", true);
      return;
    }

    if (senha.length < 6) {
      mostrarMensagem("A senha deve ter pelo menos 6 caracteres.", true);
      return;
    }

    if (senha !== confirmarSenha) {
      mostrarMensagem("As senhas não conferem.", true);
      return;
    }

    alterarCarregando(botao, true, "Criando conta...");

    try {
      const resposta = await fetch("/auth/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          senha
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok || dados.erro) {
        mostrarMensagem(dados.mensagem || "Não foi possível criar a conta.", true);
        return;
      }

      HellojaAuth.salvarSessao({
        token: dados.token,
        usuario: dados.usuario
      });

      mostrarMensagem("Cadastro criado com sucesso.", false);

      window.location.href = HellojaAuth.consumirRedirect("/perfil.html");
    } catch (erro) {
      console.error("Erro ao criar cadastro:", erro);
      mostrarMensagem("Erro ao conectar com o servidor.", true);
    } finally {
      alterarCarregando(botao, false, "Criar conta");
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
    const mensagem = document.getElementById("mensagem-cadastro");

    if (!mensagem) return;

    mensagem.textContent = texto;
    mensagem.classList.remove("escondido");
    mensagem.classList.toggle("erro", erro);
  }
})();