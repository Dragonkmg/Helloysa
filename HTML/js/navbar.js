(function () {
  const CHAVE_CARRINHO = "helloja_carrinho_v1";

  document.addEventListener("DOMContentLoaded", iniciarNavbar);
  window.addEventListener("storage", atualizarContadorCarrinho);
  window.addEventListener("helloja:carrinho-atualizado", atualizarContadorCarrinho);

  function iniciarNavbar() {
    renderizarNavbar();
    configurarBuscaNavbar();
    configurarComportamentoNavbar();
    atualizarContadorCarrinho();
  }

  function renderizarNavbar() {
    const root = document.getElementById("navbar-root");

    if (!root) {
      return;
    }

    const paginaAtual = obterPaginaAtual();
    const params = new URLSearchParams(window.location.search);
    const tagAtual = params.get("tag");

    const produtosAtivo =
      paginaAtual === "index.html" && tagAtual !== "ofertas";

    const ofertasAtivo =
      paginaAtual === "index.html" && tagAtual === "ofertas";

    const carrinhoAtivo = paginaAtual === "carrinho.html";
    const perfilAtivo = paginaAtual === "perfil.html";

    root.innerHTML = `
      <nav class="navbar d-flex flex-nowrap align-items-center" id="mainNavbar">
        <a href="/index.html" class="logo flex-shrink-0" aria-label="Helloja"></a>

        <form class="search-bar flex-grow-1 mx-3" id="formBuscaNavbar">
          <input
            id="inputBusca"
            type="text"
            class="form-control"
            placeholder="Buscar produtos..."
            autocomplete="off"
          >
        </form>

        <div class="nav-links d-flex flex-nowrap gap-3">
          <a
            href="/index.html"
            class="tag-link ${produtosAtivo ? "active" : ""}"
            data-tag="catalogo"
            ${produtosAtivo ? 'aria-current="page"' : ""}
          >
            Produtos
          </a>

          <a
            href="/index.html?tag=ofertas"
            class="tag-link ${ofertasAtivo ? "active" : ""}"
            data-tag="ofertas"
            ${ofertasAtivo ? 'aria-current="page"' : ""}
          >
            Ofertas
          </a>
        </div>

        <div class="user-actions d-flex flex-nowrap gap-2 ms-3">
          <a
            href="/carrinho.html"
            class="btn-icon btn-cart ${carrinhoAtivo ? "active" : ""}"
            aria-label="Carrinho"
            ${carrinhoAtivo ? 'aria-current="page"' : ""}
          >
            <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2ZM7.2 14.8c-.75 0-1.4-.42-1.73-1.03L2 4H1V2h2.35l.95 2h15.4c.75 0 1.25.78.94 1.46l-2.9 6.22A2.99 2.99 0 0 1 15.02 13H8.1l-1.1 2H19v2H7.2Z"/>
            </svg>

            <span id="contador-carrinho" class="contador-carrinho">0</span>
          </a>

          <a
            href="/perfil.html"
            class="btn-icon ${perfilAtivo ? "active" : ""}"
            aria-label="Perfil"
            ${perfilAtivo ? 'aria-current="page"' : ""}
          >
            <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5Zm0 2c-3.34 0-10 1.68-10 5v3h20v-3c0-3.32-6.66-5-10-5Z"/>
            </svg>
          </a>
        </div>
      </nav>
    `;
  }

  function configurarBuscaNavbar() {
    const form = document.getElementById("formBuscaNavbar");
    const input = document.getElementById("inputBusca");

    if (!form || !input) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const buscaAtual = params.get("busca");

    if (buscaAtual) {
      input.value = buscaAtual;
    }

    form.addEventListener("submit", (evento) => {
      evento.preventDefault();

      const termo = input.value.trim();

      if (!termo) {
        window.location.href = "/index.html";
        return;
      }

      window.location.href = `/index.html?busca=${encodeURIComponent(termo)}`;
    });
  }

  function configurarComportamentoNavbar() {
    const navbar = document.getElementById("mainNavbar");

    if (!navbar) {
      return;
    }

    let ultimoScroll = window.scrollY;

    function atualizarNavbar() {
      const scrollAtual = window.scrollY;
      const pertoDoTopo = scrollAtual < 80;
      const subindo = scrollAtual < ultimoScroll;

      if (pertoDoTopo || subindo) {
        navbar.classList.add("visible");
      } else {
        navbar.classList.remove("visible");
      }

      ultimoScroll = scrollAtual;
    }

    navbar.classList.add("visible");

    window.addEventListener("scroll", atualizarNavbar);
  }

  function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem(CHAVE_CARRINHO);

    if (!carrinhoSalvo) {
      return { itens: [] };
    }

    try {
      const carrinho = JSON.parse(carrinhoSalvo);

      if (!carrinho || !Array.isArray(carrinho.itens)) {
        return { itens: [] };
      }

      return carrinho;
    } catch (erro) {
      console.error("Erro ao ler carrinho:", erro);
      return { itens: [] };
    }
  }

  function atualizarContadorCarrinho() {
    const contador = document.getElementById("contador-carrinho");

    if (!contador) {
      return;
    }

    const carrinho = carregarCarrinho();

    const totalItens = carrinho.itens.reduce((total, item) => {
      const quantidade = Number(item.quantidade || 0);

      if (!Number.isFinite(quantidade) || quantidade < 0) {
        return total;
      }

      return total + quantidade;
    }, 0);

    contador.textContent = totalItens;

    if (totalItens > 0) {
      contador.classList.add("visivel");
    } else {
      contador.classList.remove("visivel");
    }
  }

  function obterPaginaAtual() {
    const caminho = window.location.pathname;

    if (!caminho || caminho === "/") {
      return "index.html";
    }

    return caminho.split("/").pop() || "index.html";
  }

  window.HellojaNavbar = {
    atualizarContadorCarrinho
  };
})();