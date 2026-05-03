(function () {
  const CHAVE_AUTH = "helloja_auth_v1";
  const CHAVE_REDIRECT = "helloja_redirect_pos_login";

  function salvarSessao(dados) {
    if (!dados || !dados.token || !dados.usuario) {
      limparSessao();
      return;
    }

    const sessao = {
      token: dados.token,
      usuario: dados.usuario,
      salvo_em: new Date().toISOString()
    };

    localStorage.setItem(CHAVE_AUTH, JSON.stringify(sessao));

    window.dispatchEvent(new CustomEvent("helloja:auth-atualizado", {
      detail: {
        logado: true,
        usuario: sessao.usuario
      }
    }));
  }

  function obterSessao() {
    const salvo = localStorage.getItem(CHAVE_AUTH);

    if (!salvo) {
      return null;
    }

    try {
      const sessao = JSON.parse(salvo);

      if (!sessao || !sessao.token || !sessao.usuario) {
        limparSessao();
        return null;
      }

      return sessao;
    } catch (erro) {
      console.error("Erro ao ler sessão:", erro);
      limparSessao();
      return null;
    }
  }

  function obterToken() {
    const sessao = obterSessao();
    return sessao ? sessao.token : null;
  }

  function obterUsuario() {
    const sessao = obterSessao();
    return sessao ? sessao.usuario : null;
  }

  function estaLogado() {
    return Boolean(obterToken());
  }

  function limparSessao() {
    localStorage.removeItem(CHAVE_AUTH);

    window.dispatchEvent(new CustomEvent("helloja:auth-atualizado", {
      detail: {
        logado: false,
        usuario: null
      }
    }));
  }

  async function logout() {
    const token = obterToken();

    if (token) {
      try {
        await fetch("/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (erro) {
        console.error("Erro ao avisar logout ao servidor:", erro);
      }
    }

    limparSessao();
  }

  async function verificarSessao() {
    const token = obterToken();

    if (!token) {
      return null;
    }

    try {
      const resposta = await fetch("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dados = await resposta.json();

      if (!resposta.ok || dados.erro || !dados.usuario) {
        limparSessao();
        return null;
      }

      const sessaoAtual = obterSessao();

      salvarSessao({
        token,
        usuario: dados.usuario
      });

      return sessaoAtual
        ? {
            ...sessaoAtual,
            usuario: dados.usuario
          }
        : {
            token,
            usuario: dados.usuario
          };
    } catch (erro) {
      console.error("Erro ao verificar sessão:", erro);
      return obterSessao();
    }
  }

  async function fetchAutenticado(url, opcoes = {}) {
    const token = obterToken();

    const headers = {
      ...(opcoes.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
      ...opcoes,
      headers
    });
  }

  function salvarRedirect(destino) {
    const destinoFinal = destino || obterCaminhoAtual();

    localStorage.setItem(CHAVE_REDIRECT, destinoFinal);
  }

  function obterRedirectPadrao(padrao = "/perfil.html") {
    const params = new URLSearchParams(window.location.search);

    const redirectUrl = params.get("redirect");
    const redirectLocal = localStorage.getItem(CHAVE_REDIRECT);

    return redirectUrl || redirectLocal || padrao;
  }

  function consumirRedirect(padrao = "/perfil.html") {
    const destino = obterRedirectPadrao(padrao);

    localStorage.removeItem(CHAVE_REDIRECT);

    return destino;
  }

  function redirecionarParaLogin(destino) {
    const destinoFinal = destino || obterCaminhoAtual();

    salvarRedirect(destinoFinal);

    window.location.href = `/login.html?redirect=${encodeURIComponent(destinoFinal)}`;
  }

  function exigirLogin(destino) {
    if (estaLogado()) {
      return true;
    }

    redirecionarParaLogin(destino);
    return false;
  }

  function obterCaminhoAtual() {
    return `${window.location.pathname}${window.location.search || ""}`;
  }

  window.HellojaAuth = {
    CHAVE_AUTH,
    CHAVE_REDIRECT,
    salvarSessao,
    obterSessao,
    obterToken,
    obterUsuario,
    estaLogado,
    limparSessao,
    logout,
    verificarSessao,
    fetchAutenticado,
    salvarRedirect,
    obterRedirectPadrao,
    consumirRedirect,
    redirecionarParaLogin,
    exigirLogin
  };
})();