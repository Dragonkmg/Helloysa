const CHAVE_CARRINHO = "helloja_carrinho_v1";

const estadoCarrinho = {
  carrinho: { itens: [] },
  enviando: false
};

document.addEventListener("DOMContentLoaded", iniciarCarrinho);

function iniciarCarrinho() {
  estadoCarrinho.carrinho = carregarCarrinho();

  configurarEventos();
  renderizarCarrinho();
}

function configurarEventos() {
  const btnLimpar = document.getElementById("btn-limpar-carrinho");
  const formFinalizacao = document.getElementById("form-finalizacao");

  if (btnLimpar) {
    btnLimpar.addEventListener("click", limparCarrinho);
  }

  if (formFinalizacao) {
    formFinalizacao.addEventListener("submit", finalizarCompra);
  }
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

function salvarCarrinho() {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(estadoCarrinho.carrinho));

  if (window.HellojaNavbar) {
    window.HellojaNavbar.atualizarContadorCarrinho();
  }
}

function renderizarCarrinho() {
  const itens = obterItensValidos();

  const areaCarrinho = document.getElementById("area-carrinho");
  const carrinhoVazio = document.getElementById("carrinho-vazio");
  const lista = document.getElementById("lista-carrinho");
  const resumoItens = document.getElementById("resumo-itens");
  const subtotalEl = document.getElementById("subtotal-carrinho");
  const totalEl = document.getElementById("total-carrinho");
  const btnFinalizar = document.getElementById("btn-finalizar");

  if (!areaCarrinho || !carrinhoVazio || !lista) {
    return;
  }

  if (itens.length === 0) {
    areaCarrinho.classList.add("escondido");
    carrinhoVazio.classList.remove("escondido");

    if (btnFinalizar) {
      btnFinalizar.disabled = true;
    }

    return;
  }

  areaCarrinho.classList.remove("escondido");
  carrinhoVazio.classList.add("escondido");

  lista.innerHTML = "";

  itens.forEach((item) => {
    lista.appendChild(criarElementoItem(item));
  });

  const totalQuantidade = itens.reduce((total, item) => {
    return total + Number(item.quantidade || 0);
  }, 0);

  const subtotal = calcularTotal();

  if (resumoItens) {
    resumoItens.textContent = `${totalQuantidade} item(ns) adicionados`;
  }

  if (subtotalEl) {
    subtotalEl.textContent = formatarMoeda(subtotal);
  }

  if (totalEl) {
    totalEl.textContent = formatarMoeda(subtotal);
  }

  if (btnFinalizar) {
    btnFinalizar.disabled = false;
  }
}

function criarElementoItem(item) {
  const artigo = document.createElement("article");
  artigo.className = "item-carrinho";

  const precoUnitario = Number(item.preco_unitario || 0);
  const quantidade = Number(item.quantidade || 1);
  const estoque = Number(item.estoque || 0);
  const subtotal = precoUnitario * quantidade;

  const estaAcimaDoEstoque = estoque > 0 && quantidade > estoque;

  artigo.innerHTML = `
    <div class="item-imagem">
      <img src="${normalizarCaminhoImagem(item.imagem)}" alt="${escaparHtml(item.nome || "Produto")}" />
    </div>

    <div class="item-info">
      <div class="item-linha-topo">
        <div>
          <h3 class="item-nome">${escaparHtml(item.nome || "Produto sem nome")}</h3>
          <p class="item-sku">${item.sku ? `SKU: ${escaparHtml(item.sku)}` : "SKU não informado"}</p>
        </div>

        <button
          class="btn-remover"
          type="button"
          data-acao="remover"
          data-produto-id="${Number(item.produto_id)}"
        >
          Remover
        </button>
      </div>

      <p class="item-preco">${formatarMoeda(precoUnitario)} cada</p>

      <div class="item-acoes">
        <div class="controle-quantidade-carrinho">
          <button
            type="button"
            data-acao="diminuir"
            data-produto-id="${Number(item.produto_id)}"
          >
            -
          </button>

          <input
            type="number"
            min="1"
            value="${quantidade}"
            data-acao="quantidade"
            data-produto-id="${Number(item.produto_id)}"
          />

          <button
            type="button"
            data-acao="aumentar"
            data-produto-id="${Number(item.produto_id)}"
          >
            +
          </button>
        </div>

        <strong class="item-subtotal">${formatarMoeda(subtotal)}</strong>
      </div>

      ${
        estaAcimaDoEstoque
          ? `<p class="aviso-estoque">Quantidade acima do estoque conhecido: ${estoque}. A compra poderá ser marcada como indevida.</p>`
          : ""
      }
    </div>
  `;

  artigo.querySelectorAll("[data-acao]").forEach((elemento) => {
    elemento.addEventListener("click", lidarComAcaoItem);
    elemento.addEventListener("change", lidarComAcaoItem);
  });

  return artigo;
}

function lidarComAcaoItem(evento) {
  const elemento = evento.currentTarget;
  const acao = elemento.dataset.acao;
  const produtoId = Number(elemento.dataset.produtoId);

  if (!produtoId) {
    return;
  }

  if (acao === "remover") {
    removerItem(produtoId);
    return;
  }

  if (acao === "diminuir") {
    alterarQuantidade(produtoId, -1);
    return;
  }

  if (acao === "aumentar") {
    alterarQuantidade(produtoId, 1);
    return;
  }

  if (acao === "quantidade") {
    definirQuantidade(produtoId, Number(elemento.value));
  }
}

function obterItensValidos() {
  const itens = estadoCarrinho.carrinho.itens || [];

  return itens.filter((item) => {
    return Number(item.produto_id) > 0 && Number(item.quantidade) > 0;
  });
}

function alterarQuantidade(produtoId, delta) {
  const item = encontrarItem(produtoId);

  if (!item) {
    return;
  }

  const quantidadeAtual = Number(item.quantidade || 1);
  const novaQuantidade = quantidadeAtual + delta;

  definirQuantidade(produtoId, novaQuantidade);
}

function definirQuantidade(produtoId, quantidade) {
  const item = encontrarItem(produtoId);

  if (!item) {
    return;
  }

  if (!Number.isInteger(quantidade) || quantidade < 1) {
    quantidade = 1;
  }

  item.quantidade = quantidade;

  salvarCarrinho();
  renderizarCarrinho();
}

function removerItem(produtoId) {
  estadoCarrinho.carrinho.itens = estadoCarrinho.carrinho.itens.filter((item) => {
    return Number(item.produto_id) !== Number(produtoId);
  });

  salvarCarrinho();
  renderizarCarrinho();
  mostrarMensagem("Item removido do carrinho.");
}

function limparCarrinho() {
  estadoCarrinho.carrinho = { itens: [] };

  salvarCarrinho();
  renderizarCarrinho();
  mostrarMensagem("Carrinho limpo.");
}

function encontrarItem(produtoId) {
  return estadoCarrinho.carrinho.itens.find((item) => {
    return Number(item.produto_id) === Number(produtoId);
  });
}

function calcularTotal() {
  return obterItensValidos().reduce((total, item) => {
    const preco = Number(item.preco_unitario || 0);
    const quantidade = Number(item.quantidade || 0);

    return total + preco * quantidade;
  }, 0);
}

async function finalizarCompra(evento) {
  evento.preventDefault();

  if (estadoCarrinho.enviando) {
    return;
  }

  const itens = obterItensValidos();

  if (itens.length === 0) {
    mostrarMensagem("O carrinho está vazio.", true);
    return;
  }

  const payload = montarPayloadPedido(itens);

  estadoCarrinho.enviando = true;
  atualizarBotaoFinalizar(true);
  esconderResultadoPedido();
  mostrarMensagem("Enviando pedido...");

  try {
    const resposta = await fetch("/pedidos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    let dados = null;

    try {
      dados = await resposta.json();
    } catch (erroJson) {
      throw new Error("O servidor respondeu, mas não retornou JSON válido.");
    }

    if (!resposta.ok || dados.erro) {
      throw new Error(dados.mensagem || "Erro ao finalizar compra.");
    }

    mostrarResultadoPedido(dados);

    estadoCarrinho.carrinho = { itens: [] };
    salvarCarrinho();
    renderizarCarrinho();
  } catch (erro) {
    console.error("Erro ao finalizar compra:", erro);
    mostrarResultadoPedido(
      {
        erro: true,
        mensagem: erro.message || "Não foi possível finalizar a compra."
      },
      true
    );
  } finally {
    estadoCarrinho.enviando = false;
    atualizarBotaoFinalizar(false);
  }
}

function montarPayloadPedido(itens) {
  const nome = document.getElementById("cliente-nome")?.value.trim() || "";
  const email = document.getElementById("cliente-email")?.value.trim() || "";
  const telefone = document.getElementById("cliente-telefone")?.value.trim() || "";

  return {
    cliente: {
      nome,
      email,
      telefone
    },
    itens: itens.map((item) => {
      return {
        produto_id: Number(item.produto_id),
        quantidade: Number(item.quantidade)
      };
    })
  };
}

function atualizarBotaoFinalizar(enviando) {
  const btn = document.getElementById("btn-finalizar");

  if (!btn) {
    return;
  }

  btn.disabled = enviando;

  btn.textContent = enviando
    ? "Finalizando..."
    : "Finalizar compra";
}

function mostrarResultadoPedido(dados, erro = false) {
  const resultado = document.getElementById("resultado-pedido");

  if (!resultado) {
    return;
  }

  resultado.classList.remove("escondido");
  resultado.classList.toggle("erro", erro);

  if (erro) {
    resultado.innerHTML = `
      <strong>Não foi possível finalizar.</strong>
      <br />
      ${escaparHtml(dados.mensagem || "Erro inesperado.")}
    `;
    return;
  }

  const pedido = dados.pedido || {};
  const avisos = pedido.avisos || dados.avisos || [];

  resultado.innerHTML = `
    <strong>${escaparHtml(dados.mensagem || pedido.mensagem || "Pedido registrado.")}</strong>
    <br />
    Pedido: #${pedido.id ?? "-"}
    <br />
    Status: ${escaparHtml(pedido.status || "-")}
    <br />
    Total: ${formatarMoeda(pedido.total || 0)}
    ${
      avisos.length > 0
        ? `
          <ul>
            ${avisos.map((aviso) => `<li>${escaparHtml(aviso)}</li>`).join("")}
          </ul>
        `
        : ""
    }
  `;
}

function esconderResultadoPedido() {
  const resultado = document.getElementById("resultado-pedido");

  if (!resultado) {
    return;
  }

  resultado.classList.add("escondido");
  resultado.classList.remove("erro");
  resultado.innerHTML = "";
}

function mostrarMensagem(texto, erro = false) {
  const mensagem = document.getElementById("mensagem-carrinho");

  if (!mensagem) {
    return;
  }

  mensagem.textContent = texto;
  mensagem.classList.remove("escondido");
  mensagem.classList.toggle("erro", erro);

  setTimeout(() => {
    mensagem.classList.add("escondido");
    mensagem.classList.remove("erro");
    mensagem.textContent = "";
  }, 3500);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function normalizarCaminhoImagem(caminho) {
  if (!caminho) {
    return gerarImagemPlaceholder();
  }

  if (caminho.startsWith("data:image")) {
    return caminho;
  }

  if (caminho.startsWith("http://") || caminho.startsWith("https://")) {
    return caminho;
  }

  if (caminho.startsWith("/")) {
    return caminho;
  }

  return `/${caminho}`;
}

function gerarImagemPlaceholder() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="420" viewBox="0 0 320 420">
      <rect width="320" height="420" fill="#f5edf7"/>
      <text x="160" y="210" text-anchor="middle" fill="#4c1a57" font-family="Arial" font-size="22" font-weight="700">
        Sem imagem
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}