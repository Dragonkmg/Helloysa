(function () {
  const CHAVE_CARRINHO = 'helloja_carrinho_v1';

  document.addEventListener('DOMContentLoaded', iniciarNavbar);

  function iniciarNavbar() {
    renderizarNavbar();
    configurarBusca();
    configurarComportamentoNavbar();
    atualizarContadorCarrinho();
    marcarLinkAtivo();
  }

  function renderizarNavbar() {
    const root = document.getElementById('navbar-root');

    if (!root) {
      return;
    }

    root.innerHTML = `
      <nav class="navbar d-flex flex-nowrap align-items-center" id="mainNavbar">
        <a href="/index.html" class="logo flex-shrink-0" aria-label="Helloja"></a>

        <form class="search-bar flex-grow-1 mx-3" id="formBuscaNavbar">
          <input 
            id="inputBuscaNavbar" 
            type="text" 
            class="form-control" 
            placeholder="Buscar produtos..."
            autocomplete="off"
          >
        </form>

        <div class="nav-links d-flex flex-nowrap gap-3">
          <a href="/index.html" class="tag-link" data-nav="catalogo">Produtos</a>
          <a href="/index.html?tag=ofertas" class="tag-link" data-nav="ofertas">Ofertas</a>
        </div>

        <div class="user-actions d-flex flex-nowrap gap-2 ms-3">
          <a href="/carrinho.html" class="btn-icon btn-cart" aria-label="Carrinho" data-nav="carrinho">
            <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2Zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2ZM7.2 14.8c-.75 0-1.4-.42-1.73-1.03L2 4H1V2h2.35l.95 2h15.4c.75 0 1.25.78.94 1.46l-2.9 6.22A2.99 2.99 0 0 1 15.02 13H8.1l-1.1 2H19v2H7.2Z"/>
            </svg>

            <span id="contador-carrinho" class="contador-carrinho">0</span>
          </a>

          <a href="/perfil.html" class="btn-icon" aria-label="Perfil" data-nav="perfil">
            <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.34 0-10 1.68-10 5v3h20v-3c0-3.32-6.66-5-10-5Z"/>
            </svg>
          </a>
        </div>
      </nav>
    `;
  }

  function configurarBusca() {
    const form = document.getElementById('formBuscaNavbar');
    const input = document.getElementById('inputBuscaNavbar');

    if (!form || !input) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const buscaAtual = params.get('busca');

    if (buscaAtual) {
      input.value = buscaAtual;
    }

    form.addEventListener('submit', (evento) => {
      evento.preventDefault();

      const termo = input.value.trim();

      if (!termo) {
        window.location.href = '/index.html';
        return;
      }

      window.location.href = `/index.html?busca=${encodeURIComponent(termo)}`;
    });
  }

  function configurarComportamentoNavbar() {
    const navbar = document.getElementById('mainNavbar');

    if (!navbar) {
      return;
    }

    let mousePertoDoTopo = false;
    let mouseNaNavbar = false;
    let focoNaNavbar = false;

    function atualizarVisibilidade() {
      const estaNoTopo = window.scrollY <= 20;
      const deveMostrar = estaNoTopo || mousePertoDoTopo || mouseNaNavbar || focoNaNavbar;

      navbar.classList.toggle('navbar-escondida', !deveMostrar);
    }

    window.addEventListener('scroll', atualizarVisibilidade);

    document.addEventListener('mousemove', (evento) => {
      mousePertoDoTopo = evento.clientY <= 90;
      atualizarVisibilidade();
    });

    navbar.addEventListener('mouseenter', () => {
      mouseNaNavbar = true;
      atualizarVisibilidade();
    });

    navbar.addEventListener('mouseleave', () => {
      mouseNaNavbar = false;
      atualizarVisibilidade();
    });

    navbar.addEventListener('focusin', () => {
      focoNaNavbar = true;
      atualizarVisibilidade();
    });

    navbar.addEventListener('focusout', () => {
      focoNaNavbar = false;
      atualizarVisibilidade();
    });

    atualizarVisibilidade();
  }

  function atualizarContadorCarrinho() {
    const contador = document.getElementById('contador-carrinho');

    if (!contador) {
      return;
    }

    const carrinho = carregarCarrinho();

    const totalItens = carrinho.itens.reduce((total, item) => {
      return total + Number(item.quantidade || 0);
    }, 0);

    contador.textContent = totalItens;
  }

  function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem(CHAVE_CARRINHO);

    if (!carrinhoSalvo) {
      return {
        itens: []
      };
    }

    try {
      const carrinho = JSON.parse(carrinhoSalvo);

      if (!carrinho || !Array.isArray(carrinho.itens)) {
        return {
          itens: []
        };
      }

      return carrinho;
    } catch (erro) {
      console.error('Erro ao ler carrinho:', erro);

      return {
        itens: []
      };
    }
  }

  function marcarLinkAtivo() {
    const caminho = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const tag = params.get('tag');

    document.querySelectorAll('[data-nav]').forEach((link) => {
      link.classList.remove('active');
    });

    if (caminho.includes('carrinho')) {
      marcarAtivo('carrinho');
      return;
    }

    if (caminho.includes('perfil')) {
      marcarAtivo('perfil');
      return;
    }

    if (tag === 'ofertas') {
      marcarAtivo('ofertas');
      return;
    }

    marcarAtivo('catalogo');
  }

  function marcarAtivo(nome) {
    const link = document.querySelector(`[data-nav="${nome}"]`);

    if (link) {
      link.classList.add('active');
    }
  }

  window.HellojaNavbar = {
    atualizarContadorCarrinho
  };
})();