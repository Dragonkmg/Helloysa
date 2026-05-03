const estado = {
  produto: null,
  imagemAtual: null
};

document.addEventListener("DOMContentLoaded", iniciarPaginaProduto);

async function iniciarPaginaProduto() {
  const id = obterIdProdutoDaUrl();

  if (!id) {
    mostrarErro("Produto inválido. Acesse usando /item.html?id=1.");
    return;
  }

  try {
    const produto = await buscarProduto(id);

    estado.produto = produto;

    renderizarProduto(produto);
    configurarEventosProduto();
  } catch (erro) {
    console.error("Erro ao iniciar página de produto:", erro);
    mostrarErro("Não foi possível carregar este produto.");
  }
}

function obterIdProdutoDaUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));

  if (!id || Number.isNaN(id)) {
    return null;
  }

  return id;
}

async function buscarProduto(id) {
  const resposta = await fetch(`/produto/${id}`);
  const dados = await resposta.json();

  if (!resposta.ok || dados.erro) {
    throw new Error(dados.mensagem || "Erro ao buscar produto.");
  }

  return dados.produto;
}

function renderizarProduto(produto) {
  const statusEl = document.getElementById("status-produto");
  const produtoEl = document.getElementById("produto");

  if (statusEl) {
    statusEl.classList.add("escondido");
  }

  if (produtoEl) {
    produtoEl.classList.remove("escondido");
  }

  preencherTexto("produto-id", produto.id);
  preencherTexto("produto-nome", produto.nome || "Produto sem nome");
  preencherTexto("produto-descricao", produto.descricao || "Produto sem descrição.");
  preencherTexto("produto-sku", produto.sku ? `SKU: ${produto.sku}` : "SKU não informado");
  preencherTexto("produto-variacao", produto.variacao || "Nenhuma");
  preencherTexto("produto-item-pai", produto.item_pai || "Nenhum");

  renderizarPrecos(produto);
  renderizarEstoque(produto);
  renderizarImagens(produto);
  configurarQuantidade(produto);
}

function preencherTexto(id, texto) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = texto;
  }
}

function renderizarPrecos(produto) {
  const precoOriginalEl = document.getElementById("preco-original");
  const precoFinalEl = document.getElementById("preco-final");

  if (!precoFinalEl) {
    return;
  }

  const preco = Number(produto.preco || 0);
  const precoPromo = Number(produto.preco_promo || 0);

  const temPromocao = precoPromo > 0 && precoPromo < preco;

  if (temPromocao) {
    if (precoOriginalEl) {
      precoOriginalEl.textContent = formatarMoeda(preco);
    }

    precoFinalEl.textContent = formatarMoeda(precoPromo);
    return;
  }

  if (precoOriginalEl) {
    precoOriginalEl.textContent = "";
  }

  precoFinalEl.textContent = formatarMoeda(preco);
}

function renderizarEstoque(produto) {
  const estoqueEl = document.getElementById("produto-estoque");
  const btnAdicionar = document.getElementById("btn-adicionar");

  const estoque = Number(produto.qtd || 0);

  if (!estoqueEl) {
    return;
  }

  if (estoque <= 0) {
    estoqueEl.textContent = "Produto indisponível no momento.";

    if (btnAdicionar) {
      btnAdicionar.disabled = true;
    }

    return;
  }

  if (estoque === 1) {
    estoqueEl.textContent = "Última unidade disponível.";
    return;
  }

  estoqueEl.textContent = `${estoque} unidades disponíveis.`;
}

function renderizarImagens(produto) {
  const imagemPrincipal = document.getElementById("imagem-principal");
  const miniaturasEl = document.getElementById("miniaturas");

  if (!imagemPrincipal) {
    console.error("Elemento #imagem-principal não encontrado.");
    return;
  }

  if (!miniaturasEl) {
    console.error("Elemento #miniaturas não encontrado.");
    return;
  }

  const imagens = montarListaDeImagens(produto);

  miniaturasEl.innerHTML = "";

  const imagemInicial =
    imagens.find((imagem) => Boolean(imagem.principal)) ||
    imagens[0];

  trocarImagemPrincipal(imagemInicial);

  imagens.forEach((imagem, index) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "miniatura";

    if (imagem.caminho === imagemInicial.caminho) {
      botao.classList.add("ativa");
    }

    const img = document.createElement("img");
    img.src = normalizarCaminhoImagem(imagem.caminho);
    img.alt = imagem.alt || produto.nome || `Imagem ${index + 1} do produto`;

    botao.appendChild(img);

    botao.addEventListener("click", () => {
      trocarImagemPrincipal(imagem);

      document.querySelectorAll(".miniatura").forEach((miniatura) => {
        miniatura.classList.remove("ativa");
      });

      botao.classList.add("ativa");
    });

    miniaturasEl.appendChild(botao);
  });
}

function montarListaDeImagens(produto) {
  if (Array.isArray(produto.imagens) && produto.imagens.length > 0) {
    return produto.imagens
      .filter((imagem) => imagem && imagem.caminho)
      .map((imagem, index) => {
        return {
          caminho: imagem.caminho,
          alt: imagem.alt || produto.nome || "Imagem do produto",
          ordem: imagem.ordem ?? index,
          principal: imagem.principal === true || Number(imagem.principal) === 1
        };
      });
  }

  if (produto.imagem) {
    return [
      {
        caminho: produto.imagem,
        alt: produto.nome || "Imagem do produto",
        principal: true
      }
    ];
  }

  return [
    {
      caminho: gerarImagemPlaceholder(),
      alt: "Produto sem imagem",
      principal: true
    }
  ];
}

function trocarImagemPrincipal(imagem) {
  const imagemPrincipal = document.getElementById("imagem-principal");

  if (!imagemPrincipal || !imagem) {
    return;
  }

  imagemPrincipal.src = normalizarCaminhoImagem(imagem.caminho);
  imagemPrincipal.alt = imagem.alt || "Imagem do produto";

  estado.imagemAtual = imagem;
}

function configurarQuantidade(produto) {
  const input = document.getElementById("quantidade");

  if (!input) {
    return;
  }

  const estoque = Number(produto.qtd || 0);

  input.min = "1";
  input.max = String(Math.max(estoque, 1));
  input.value = estoque > 0 ? "1" : "0";

  if (estoque <= 0) {
    input.disabled = true;
  }
}

function configurarEventosProduto() {
  const btnDiminuir = document.getElementById("btn-diminuir");
  const btnAumentar = document.getElementById("btn-aumentar");
  const btnAdicionar = document.getElementById("btn-adicionar");
  const inputQuantidade = document.getElementById("quantidade");

  if (btnDiminuir) {
    btnDiminuir.addEventListener("click", diminuirQuantidade);
  }

  if (btnAumentar) {
    btnAumentar.addEventListener("click", aumentarQuantidade);
  }

  if (btnAdicionar) {
    btnAdicionar.addEventListener("click", adicionarAoCarrinho);
  }

  if (inputQuantidade) {
    inputQuantidade.addEventListener("change", () => {
      ajustarQuantidade(Number(inputQuantidade.value));
    });
  }
}

function diminuirQuantidade() {
  const input = document.getElementById("quantidade");

  if (!input) {
    return;
  }

  ajustarQuantidade(Number(input.value) - 1);
}

function aumentarQuantidade() {
  const input = document.getElementById("quantidade");

  if (!input) {
    return;
  }

  ajustarQuantidade(Number(input.value) + 1);
}

function ajustarQuantidade(novaQuantidade) {
  const produto = estado.produto;
  const input = document.getElementById("quantidade");

  if (!produto || !input) {
    return;
  }

  const estoque = Number(produto.qtd || 0);

  if (estoque <= 0) {
    input.value = "0";
    return;
  }

  if (!novaQuantidade || Number.isNaN(novaQuantidade) || novaQuantidade < 1) {
    input.value = "1";
    return;
  }

  if (novaQuantidade > estoque) {
    input.value = String(estoque);
    mostrarMensagem(`Limite disponível: ${estoque} unidades.`, true);
    return;
  }

  input.value = String(novaQuantidade);
}

function adicionarAoCarrinho() {
  const produto = estado.produto;
  const input = document.getElementById("quantidade");

  if (!produto || !input) {
    mostrarMensagem("Produto não carregado.", true);
    return;
  }

  const quantidade = Number(input.value || 1);
  const estoque = Number(produto.qtd || 0);

  if (estoque <= 0) {
    mostrarMensagem("Produto indisponível.", true);
    return;
  }

  if (quantidade > estoque) {
    mostrarMensagem("Quantidade maior que o estoque disponível.", true);
    return;
  }

  const carrinho = carregarCarrinho();

  const itemExistente = carrinho.itens.find((item) => {
    return Number(item.produto_id) === Number(produto.id);
  });

  if (itemExistente) {
    const novaQuantidade = itemExistente.quantidade + quantidade;

    if (novaQuantidade > estoque) {
      mostrarMensagem(`Você já tem este produto no carrinho. Limite: ${estoque} unidades.`, true);
      return;
    }

    itemExistente.quantidade = novaQuantidade;
  } else {
    carrinho.itens.push({
      produto_id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      sku: produto.sku,
      preco_unitario: obterPrecoFinal(produto),
      quantidade,
      estoque,
      imagem: estado.imagemAtual ? estado.imagemAtual.caminho : "",
      adicionado_em: new Date().toISOString()
    });
  }

  salvarCarrinho(carrinho);

  if (window.HellojaNavbar) {
    window.HellojaNavbar.atualizarContadorCarrinho();
  }

  mostrarMensagem("Produto adicionado ao carrinho.");
}

function carregarCarrinho() {
  const carrinhoSalvo = localStorage.getItem("helloja_carrinho_v1");

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
    console.error("Erro ao ler carrinho:", erro);

    return {
      itens: []
    };
  }
}

function salvarCarrinho(carrinho) {
  localStorage.setItem("helloja_carrinho_v1", JSON.stringify(carrinho));
}

function obterPrecoFinal(produto) {
  const preco = Number(produto.preco || 0);
  const precoPromo = Number(produto.preco_promo || 0);

  if (precoPromo > 0 && precoPromo < preco) {
    return precoPromo;
  }

  return preco;
}

function mostrarMensagem(texto, erro = false) {
  const mensagem = document.getElementById("mensagem-produto");

  if (!mensagem) {
    return;
  }

  mensagem.textContent = texto;
  mensagem.classList.toggle("erro", erro);

  setTimeout(() => {
    mensagem.textContent = "";
    mensagem.classList.remove("erro");
  }, 3500);
}

function mostrarErro(texto) {
  const status = document.getElementById("status-produto");
  const produto = document.getElementById("produto");

  if (produto) {
    produto.classList.add("escondido");
  }

  if (status) {
    status.textContent = texto;
    status.classList.add("erro");
    status.classList.remove("escondido");
  }
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
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
      <rect width="800" height="1000" fill="#fcfffd"/>
      <circle cx="400" cy="370" r="135" fill="#efe2d5"/>
      <circle cx="450" cy="390" r="90" fill="#4c1a57" opacity="0.15"/>
      <rect x="180" y="570" width="440" height="46" rx="23" fill="#cf995f" opacity="0.72"/>
      <rect x="250" y="645" width="300" height="34" rx="17" fill="#2e8b57" opacity="0.58"/>
      <text x="400" y="760" font-family="Arial" font-size="38" text-anchor="middle" fill="#4c1a57">Sem imagem</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}