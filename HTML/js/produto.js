const estado = {
  produto: null,
  imagemAtual: null
};

document.addEventListener('DOMContentLoaded', iniciarPagina);

async function iniciarPagina() {
  configurarNavbar();
  configurarBuscaNavbar();
  atualizarContadorCarrinho();

  const id = obterIdProdutoDaUrl();

  if (!id) {
    mostrarErro('Produto inválido. Acesse a página usando algo como /item.html?id=1.');
    return;
  }

  try {
    const produto = await buscarProduto(id);

    estado.produto = produto;

    renderizarProduto(produto);
    configurarEventos();
  } catch (erro) {
    console.error(erro);
    mostrarErro('Não foi possível carregar este produto.');
  }
}

function obterIdProdutoDaUrl() {
  const params = new URLSearchParams(window.location.search);

  const id = Number(params.get('id'));

  if (!id || Number.isNaN(id)) {
    return null;
  }

  return id;
}

async function buscarProduto(id) {
  const resposta = await fetch(`/produto/${id}`);
  const dados = await resposta.json();

  if (!resposta.ok || dados.erro) {
    throw new Error(dados.mensagem || 'Erro ao buscar produto.');
  }

  return dados.produto;
}

function renderizarProduto(produto) {
  document.getElementById('status-produto').classList.add('escondido');
  document.getElementById('produto').classList.remove('escondido');

  document.getElementById('produto-id').textContent = produto.id;
  document.getElementById('produto-nome').textContent = produto.nome || 'Produto sem nome';
  document.getElementById('produto-descricao').textContent = produto.descricao || 'Produto sem descrição.';
  document.getElementById('produto-sku').textContent = produto.sku ? `SKU: ${produto.sku}` : 'SKU não informado';

  document.getElementById('produto-variacao').textContent = produto.variacao || 'Nenhuma';
  document.getElementById('produto-item-pai').textContent = produto.item_pai || 'Nenhum';

  renderizarPrecos(produto);
  renderizarEstoque(produto);
  renderizarImagens(produto);
  configurarQuantidade(produto);
}

function renderizarPrecos(produto) {
  const precoOriginalEl = document.getElementById('preco-original');
  const precoFinalEl = document.getElementById('preco-final');

  const preco = Number(produto.preco || 0);
  const precoPromo = Number(produto.preco_promo || 0);

  const temPromocao = precoPromo > 0 && precoPromo < preco;

  if (temPromocao) {
    precoOriginalEl.textContent = formatarMoeda(preco);
    precoFinalEl.textContent = formatarMoeda(precoPromo);
    return;
  }

  precoOriginalEl.textContent = '';
  precoFinalEl.textContent = formatarMoeda(preco);
}

function renderizarEstoque(produto) {
  const estoqueEl = document.getElementById('produto-estoque');
  const btnAdicionar = document.getElementById('btn-adicionar');

  const estoque = Number(produto.qtd || 0);

  if (estoque <= 0) {
    estoqueEl.textContent = 'Produto indisponível no momento.';
    btnAdicionar.disabled = true;
    return;
  }

  if (estoque === 1) {
    estoqueEl.textContent = 'Última unidade disponível.';
    return;
  }

  estoqueEl.textContent = `${estoque} unidades disponíveis.`;
}

function renderizarImagens(produto) {
  const miniaturasEl = document.getElementById('miniaturas');

  const imagens = montarListaDeImagens(produto);

  miniaturasEl.innerHTML = '';

  const imagemInicial =
    imagens.find((imagem) => Number(imagem.principal) === 1) ||
    imagens[0];

  trocarImagemPrincipal(imagemInicial);

  imagens.forEach((imagem) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'miniatura';

    if (imagem.caminho === imagemInicial.caminho) {
      botao.classList.add('ativa');
    }

    const img = document.createElement('img');
    img.src = normalizarCaminhoImagem(imagem.caminho);
    img.alt = imagem.alt || produto.nome || 'Imagem do produto';

    botao.appendChild(img);

    botao.addEventListener('click', () => {
      trocarImagemPrincipal(imagem);

      document.querySelectorAll('.miniatura').forEach((miniatura) => {
        miniatura.classList.remove('ativa');
      });

      botao.classList.add('ativa');
    });

    miniaturasEl.appendChild(botao);
  });
}

function montarListaDeImagens(produto) {
  if (Array.isArray(produto.imagens) && produto.imagens.length > 0) {
    return produto.imagens;
  }

  if (produto.imagem) {
    return [
      {
        caminho: produto.imagem,
        alt: produto.nome || 'Imagem do produto',
        principal: 1
      }
    ];
  }

  return [
    {
      caminho: gerarImagemPlaceholder(),
      alt: 'Produto sem imagem',
      principal: 1
    }
  ];
}

function trocarImagemPrincipal(imagem) {
  const imagemPrincipal = document.getElementById('imagem-principal');

  imagemPrincipal.src = normalizarCaminhoImagem(imagem.caminho);
  imagemPrincipal.alt = imagem.alt || 'Imagem do produto';

  estado.imagemAtual = imagem;
}

function configurarQuantidade(produto) {
  const input = document.getElementById('quantidade');

  const estoque = Number(produto.qtd || 0);

  input.min = '1';
  input.max = String(Math.max(estoque, 1));
  input.value = estoque > 0 ? '1' : '0';

  if (estoque <= 0) {
    input.disabled = true;
  }
}

function configurarEventos() {
  document.getElementById('btn-diminuir').addEventListener('click', diminuirQuantidade);
  document.getElementById('btn-aumentar').addEventListener('click', aumentarQuantidade);
  document.getElementById('btn-adicionar').addEventListener('click', adicionarAoCarrinho);

  document.getElementById('quantidade').addEventListener('change', () => {
    const valor = Number(document.getElementById('quantidade').value);
    ajustarQuantidade(valor);
  });
}

function diminuirQuantidade() {
  const input = document.getElementById('quantidade');
  ajustarQuantidade(Number(input.value) - 1);
}

function aumentarQuantidade() {
  const input = document.getElementById('quantidade');
  ajustarQuantidade(Number(input.value) + 1);
}

function ajustarQuantidade(novaQuantidade) {
  const produto = estado.produto;
  const input = document.getElementById('quantidade');

  const estoque = Number(produto.qtd || 0);

  if (estoque <= 0) {
    input.value = '0';
    return;
  }

  if (!novaQuantidade || Number.isNaN(novaQuantidade) || novaQuantidade < 1) {
    input.value = '1';
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

  if (!produto) {
    mostrarMensagem('Produto não carregado.', true);
    return;
  }

  const quantidade = Number(document.getElementById('quantidade').value || 1);
  const estoque = Number(produto.qtd || 0);

  if (estoque <= 0) {
    mostrarMensagem('Produto indisponível.', true);
    return;
  }

  if (quantidade > estoque) {
    mostrarMensagem('Quantidade maior que o estoque disponível.', true);
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
      quantidade: quantidade,
      estoque: estoque,
      imagem: estado.imagemAtual ? estado.imagemAtual.caminho : '',
      adicionado_em: new Date().toISOString()
    });
  }

  salvarCarrinho(carrinho);
  atualizarContadorCarrinho();

  mostrarMensagem('Produto adicionado ao carrinho.');
}

function carregarCarrinho() {
  const carrinhoSalvo = localStorage.getItem('helloja_carrinho_v1');

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

function salvarCarrinho(carrinho) {
  localStorage.setItem('helloja_carrinho_v1', JSON.stringify(carrinho));
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

function obterPrecoFinal(produto) {
  const preco = Number(produto.preco || 0);
  const precoPromo = Number(produto.preco_promo || 0);

  if (precoPromo > 0 && precoPromo < preco) {
    return precoPromo;
  }

  return preco;
}

function mostrarMensagem(texto, erro = false) {
  const mensagem = document.getElementById('mensagem-produto');

  mensagem.textContent = texto;
  mensagem.classList.toggle('erro', erro);

  setTimeout(() => {
    mensagem.textContent = '';
    mensagem.classList.remove('erro');
  }, 3500);
}

function mostrarErro(texto) {
  const status = document.getElementById('status-produto');
  const produto = document.getElementById('produto');

  produto.classList.add('escondido');

  status.textContent = texto;
  status.classList.add('erro');
  status.classList.remove('escondido');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function normalizarCaminhoImagem(caminho) {
  if (!caminho) {
    return gerarImagemPlaceholder();
  }

  if (caminho.startsWith('data:image')) {
    return caminho;
  }

  if (caminho.startsWith('http')) {
    return caminho;
  }

  if (caminho.startsWith('/')) {
    return caminho;
  }

  return `/${caminho}`;
}

function gerarImagemPlaceholder() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
      <rect width="800" height="1000" fill="#eeeaf2"/>
      <circle cx="400" cy="390" r="120" fill="#d8cde8"/>
      <rect x="210" y="560" width="380" height="36" rx="18" fill="#bda9dc"/>
      <rect x="270" y="625" width="260" height="28" rx="14" fill="#cfc1e3"/>
      <text x="400" y="720" font-family="Arial" font-size="42" text-anchor="middle" fill="#5b516b">Sem imagem</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function configurarNavbar() {
  const navbar = document.getElementById('mainNavbar');

  if (!navbar) {
    return;
  }

  let mousePertoDoTopo = false;
  let mouseNaNavbar = false;
  let focoNaNavbar = false;

  function atualizarNavbar() {
    const estaNoTopo = window.scrollY <= 20;
    const deveMostrar = estaNoTopo || mousePertoDoTopo || mouseNaNavbar || focoNaNavbar;

    navbar.classList.toggle('navbar-escondida', !deveMostrar);
  }

  window.addEventListener('scroll', atualizarNavbar);

  document.addEventListener('mousemove', (evento) => {
    mousePertoDoTopo = evento.clientY <= 90;
    atualizarNavbar();
  });

  navbar.addEventListener('mouseenter', () => {
    mouseNaNavbar = true;
    atualizarNavbar();
  });

  navbar.addEventListener('mouseleave', () => {
    mouseNaNavbar = false;
    atualizarNavbar();
  });

  navbar.addEventListener('focusin', () => {
    focoNaNavbar = true;
    atualizarNavbar();
  });

  navbar.addEventListener('focusout', () => {
    focoNaNavbar = false;
    atualizarNavbar();
  });

  atualizarNavbar();
}

function configurarBuscaNavbar() {
  const form = document.getElementById('formBuscaProduto');
  const input = document.getElementById('inputBusca');

  if (!form || !input) {
    return;
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