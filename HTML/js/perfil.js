(function () {
  document.addEventListener("DOMContentLoaded", iniciarPerfil);

  async function iniciarPerfil() {
    if (!window.HellojaAuth) {
      window.location.href = "/login.html?redirect=/perfil.html";
      return;
    }

    if (!HellojaAuth.estaLogado()) {
      HellojaAuth.redirecionarParaLogin("/perfil.html");
      return;
    }

    configurarEventos();

    await carregarPerfil();
  }

  function configurarEventos() {
    const btnSair = document.getElementById("btn-sair");
    const btnRecarregar = document.getElementById("btn-recarregar-pedidos");

    if (btnSair) {
      btnSair.addEventListener("click", sairDaConta);
    }

    if (btnRecarregar) {
      btnRecarregar.addEventListener("click", carregarPedidos);
    }
  }

  async function carregarPerfil() {
    mostrarMensagem("Carregando perfil...", false);

    const sessao = await HellojaAuth.verificarSessao();

    if (!sessao || !sessao.usuario) {
      HellojaAuth.redirecionarParaLogin("/perfil.html");
      return;
    }

    renderizarUsuario(sessao.usuario);
    esconderMensagem();

    await carregarPedidos();
  }

  async function carregarPedidos() {
    const lista = document.getElementById("lista-pedidos");
    const resumo = document.getElementById("resumo-pedidos");
    const vazio = document.getElementById("perfil-sem-pedidos");

    if (lista) {
      lista.innerHTML = "";
    }

    if (vazio) {
      vazio.classList.add("escondido");
    }

    if (resumo) {
      resumo.textContent = "Carregando histórico...";
    }

    try {
      const resposta = await HellojaAuth.fetchAutenticado("/pedidos/me");
      const dados = await resposta.json();

      if (resposta.status === 401 || dados.precisa_login) {
        HellojaAuth.limparSessao();
        HellojaAuth.redirecionarParaLogin("/perfil.html");
        return;
      }

      if (!resposta.ok || dados.erro) {
        mostrarMensagem(dados.mensagem || "Não foi possível carregar os pedidos.", true);
        if (resumo) resumo.textContent = "Erro ao carregar pedidos.";
        return;
      }

      renderizarPedidos(dados.pedidos || []);
    } catch (erro) {
      console.error("Erro ao carregar pedidos:", erro);
      mostrarMensagem("Erro ao conectar com o servidor.", true);

      if (resumo) {
        resumo.textContent = "Erro ao carregar pedidos.";
      }
    }
  }

  function renderizarUsuario(usuario) {
    preencherTexto("perfil-nome", usuario.nome || "Nome não informado");
    preencherTexto("perfil-email", usuario.email || "E-mail não informado");
    preencherTexto("perfil-telefone", usuario.telefone || "Não informado");
  }

  function renderizarPedidos(pedidos) {
    const lista = document.getElementById("lista-pedidos");
    const resumo = document.getElementById("resumo-pedidos");
    const vazio = document.getElementById("perfil-sem-pedidos");

    if (!lista) return;

    lista.innerHTML = "";

    if (!pedidos.length) {
      if (resumo) {
        resumo.textContent = "Nenhum pedido encontrado.";
      }

      if (vazio) {
        vazio.classList.remove("escondido");
      }

      return;
    }

    if (resumo) {
      resumo.textContent = `${pedidos.length} pedido${pedidos.length === 1 ? "" : "s"} encontrado${pedidos.length === 1 ? "" : "s"}.`;
    }

    pedidos.forEach((pedido) => {
      lista.appendChild(criarCardPedido(pedido));
    });
  }

  function criarCardPedido(pedido) {
    const article = document.createElement("article");
    article.className = "pedido-card";

    const topo = document.createElement("div");
    topo.className = "pedido-topo";

    const grupoTitulo = document.createElement("div");

    const titulo = document.createElement("h3");
    titulo.textContent = `Pedido #${pedido.id}`;

    const data = document.createElement("p");
    data.className = "pedido-data";
    data.textContent = formatarData(pedido.criado_em);

    grupoTitulo.appendChild(titulo);
    grupoTitulo.appendChild(data);

    const status = document.createElement("span");
    status.className = `pedido-status ${pedido.compra_indevida ? "pedido-status-alerta" : ""}`;
    status.textContent = obterTextoStatus(pedido);

    topo.appendChild(grupoTitulo);
    topo.appendChild(status);

    const detalhes = document.createElement("div");
    detalhes.className = "pedido-detalhes";

    detalhes.appendChild(criarDetalhePedido("Total", formatarMoeda(pedido.total)));
    detalhes.appendChild(criarDetalhePedido("Itens", String(pedido.quantidade_total || 0)));
    detalhes.appendChild(criarDetalhePedido("Status", pedido.status || "pendente"));

    if (pedido.compra_indevida && pedido.aviso_cliente) {
      const aviso = document.createElement("p");
      aviso.className = "pedido-aviso";
      aviso.textContent = pedido.aviso_cliente;
      detalhes.appendChild(aviso);
    }

    const acoes = document.createElement("div");
    acoes.className = "pedido-acoes";

    const linkDetalhes = document.createElement("a");
    linkDetalhes.className = "btn-mini btn-mini-link";
    linkDetalhes.href = `/pedidos.html?id=${encodeURIComponent(pedido.id)}`;
    linkDetalhes.textContent = "Ver detalhes";
    linkDetalhes.title = "A página detalhada de pedido será criada depois";

    acoes.appendChild(linkDetalhes);

    article.appendChild(topo);
    article.appendChild(detalhes);
    article.appendChild(acoes);

    return article;
  }

  function criarDetalhePedido(rotulo, valor) {
    const item = document.createElement("div");
    item.className = "pedido-detalhe";

    const span = document.createElement("span");
    span.textContent = rotulo;

    const strong = document.createElement("strong");
    strong.textContent = valor;

    item.appendChild(span);
    item.appendChild(strong);

    return item;
  }

  async function sairDaConta() {
    const botao = document.getElementById("btn-sair");

    if (botao) {
      botao.disabled = true;
      botao.textContent = "Saindo...";
    }

    await HellojaAuth.logout();

    window.location.href = "/login.html";
  }

  function preencherTexto(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.textContent = texto;
    }
  }

  function mostrarMensagem(texto, erro = false) {
    const mensagem = document.getElementById("mensagem-perfil");

    if (!mensagem) return;

    mensagem.textContent = texto;
    mensagem.classList.remove("escondido");
    mensagem.classList.toggle("erro", erro);
  }

  function esconderMensagem() {
    const mensagem = document.getElementById("mensagem-perfil");

    if (mensagem) {
      mensagem.classList.add("escondido");
    }
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function formatarData(valor) {
    if (!valor) return "Data não informada";

    const dataNormalizada = String(valor).replace(" ", "T");
    const data = new Date(dataNormalizada);

    if (Number.isNaN(data.getTime())) {
      return valor;
    }

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function obterTextoStatus(pedido) {
    if (pedido.compra_indevida) {
      return "Precisa revisão";
    }

    if (pedido.status === "concluido") {
      return "Concluído";
    }

    if (pedido.status === "pendente") {
      return "Pendente";
    }

    if (pedido.status === "cancelado") {
      return "Cancelado";
    }

    return pedido.status || "Pendente";
  }
})();