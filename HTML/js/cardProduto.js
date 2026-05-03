const ESTADO_CARROSSEL = new Map();

document.addEventListener("click", lidarComCliqueCard);
document.addEventListener("keydown", lidarComTecladoCard);

export function criarCardProduto(produto) {
  const imagens = montarListaImagens(produto);
  const linkProduto = montarLinkProduto(produto);

  const preco = Number(produto.preco || 0);
  const precoPromo = Number(produto.preco_promo || 0);

  const temPromocao = precoPromo > 0 && precoPromo < preco;

  const idCard = `produto-card-${produto.id}`;

  return `
    <div class="col mb-5 produto-coluna">
      <article 
        class="produto-card" 
        data-card-produto 
        data-card-id="${idCard}"
        data-link-produto="${linkProduto}"
        tabindex="0"
        aria-label="Abrir produto ${escaparHtml(produto.nome || "Produto")}"
      >
        <a 
          href="${linkProduto}" 
          class="produto-card-link" 
          aria-label="Ver produto ${escaparHtml(produto.nome || "Produto")}"
        ></a>

        ${
          temPromocao
            ? `<span class="produto-card-selo">Oferta</span>`
            : ""
        }

        <div class="produto-card-carrossel">
          <div 
            class="produto-card-trilho" 
            data-card-trilho
            style="transform: translateX(0%);"
          >
            ${imagens.map((imagem) => `
              <div class="produto-card-slide">
                <img
                  class="produto-card-img"
                  src="${imagem.src}"
                  alt="${escaparHtml(imagem.alt)}"
                  loading="lazy"
                />
              </div>
            `).join("")}
          </div>

          <button 
            type="button" 
            class="produto-card-seta anterior" 
            data-card-anterior
            aria-label="Imagem anterior"
            ${imagens.length <= 1 ? "disabled" : ""}
          >
            ‹
          </button>

          <button 
            type="button" 
            class="produto-card-seta proxima" 
            data-card-proxima
            aria-label="Próxima imagem"
            ${imagens.length <= 1 ? "disabled" : ""}
          >
            ›
          </button>

          ${
            imagens.length > 1
              ? `
                <div class="produto-card-indicadores">
                  ${imagens.map((_, index) => `
                    <button
                      type="button"
                      class="produto-card-indicador ${index === 0 ? "ativo" : ""}"
                      data-card-indicador="${index}"
                      aria-label="Ir para imagem ${index + 1}"
                    ></button>
                  `).join("")}
                </div>
              `
              : ""
          }
        </div>

        <div class="produto-card-conteudo">
          <h5 class="produto-card-titulo">
            ${escaparHtml(produto.nome || "Produto sem nome")}
          </h5>

          <div class="produto-card-precos">
            ${
              temPromocao
                ? `
                  <span class="produto-card-preco-original">
                    ${formatarMoeda(preco)}
                  </span>

                  <span class="produto-card-preco-final produto-card-preco-promo">
                    ${formatarMoeda(precoPromo)}
                  </span>
                `
                : `
                  <span class="produto-card-preco-final">
                    ${formatarMoeda(preco)}
                  </span>
                `
            }
          </div>
        </div>
      </article>
    </div>
  `;
}

function lidarComCliqueCard(evento) {
  const botaoAnterior = evento.target.closest("[data-card-anterior]");
  const botaoProxima = evento.target.closest("[data-card-proxima]");
  const indicador = evento.target.closest("[data-card-indicador]");
  const card = evento.target.closest("[data-card-produto]");

  if (!card) {
    return;
  }

  if (botaoAnterior) {
    evento.preventDefault();
    evento.stopPropagation();

    moverCarrossel(card, -1);
    return;
  }

  if (botaoProxima) {
    evento.preventDefault();
    evento.stopPropagation();

    moverCarrossel(card, 1);
    return;
  }

  if (indicador) {
    evento.preventDefault();
    evento.stopPropagation();

    const index = Number(indicador.dataset.cardIndicador);
    irParaSlide(card, index);
    return;
  }

  const link = card.dataset.linkProduto;

  if (link) {
    window.location.href = link;
  }
}

function lidarComTecladoCard(evento) {
  const card = evento.target.closest("[data-card-produto]");

  if (!card) {
    return;
  }

  if (evento.key === "Enter") {
    const link = card.dataset.linkProduto;

    if (link) {
      window.location.href = link;
    }

    return;
  }

  if (evento.key === "ArrowLeft") {
    evento.preventDefault();
    moverCarrossel(card, -1);
    return;
  }

  if (evento.key === "ArrowRight") {
    evento.preventDefault();
    moverCarrossel(card, 1);
  }
}

function moverCarrossel(card, direcao) {
  const totalSlides = contarSlides(card);

  if (totalSlides <= 1) {
    return;
  }

  const idCard = obterIdCard(card);
  const atual = ESTADO_CARROSSEL.get(idCard) || 0;

  let proximo = atual + direcao;

  if (proximo < 0) {
    proximo = totalSlides - 1;
  }

  if (proximo >= totalSlides) {
    proximo = 0;
  }

  irParaSlide(card, proximo);
}

function irParaSlide(card, index) {
  const totalSlides = contarSlides(card);

  if (totalSlides <= 1) {
    return;
  }

  if (index < 0 || index >= totalSlides) {
    return;
  }

  const idCard = obterIdCard(card);
  const trilho = card.querySelector("[data-card-trilho]");

  if (!trilho) {
    return;
  }

  ESTADO_CARROSSEL.set(idCard, index);

  trilho.style.transform = `translateX(-${index * 100}%)`;

  card.querySelectorAll("[data-card-indicador]").forEach((botao) => {
    const botaoIndex = Number(botao.dataset.cardIndicador);

    botao.classList.toggle("ativo", botaoIndex === index);
  });
}

function contarSlides(card) {
  return card.querySelectorAll(".produto-card-slide").length;
}

function obterIdCard(card) {
  return card.dataset.cardId || "card-sem-id";
}

function montarLinkProduto(produto) {
  if (!produto || produto.id === undefined || produto.id === null || produto.id === "") {
    return "#";
  }

  return `/item.html?id=${encodeURIComponent(produto.id)}`;
}

function montarListaImagens(produto) {
  const imagens = [];

  if (Array.isArray(produto.imagens)) {
    produto.imagens.forEach((imagem) => {
      if (!imagem) {
        return;
      }

      if (typeof imagem === "string") {
        imagens.push({
          src: normalizarCaminhoImagem(imagem, produto),
          alt: produto.nome || "Imagem do produto"
        });

        return;
      }

      const caminho = imagem.caminho || imagem.src || imagem.url || imagem.imagem;

      if (caminho) {
        imagens.push({
          src: normalizarCaminhoImagem(caminho, produto),
          alt: imagem.alt || produto.nome || "Imagem do produto"
        });
      }
    });
  }

  if (produto.imagem) {
    imagens.push({
      src: normalizarCaminhoImagem(produto.imagem, produto),
      alt: produto.nome || "Imagem do produto"
    });
  }

  if (produto.imagem_principal) {
    imagens.push({
      src: normalizarCaminhoImagem(produto.imagem_principal, produto),
      alt: produto.nome || "Imagem do produto"
    });
  }

  const imagensSemDuplicatas = removerImagensDuplicadas(imagens);

  if (imagensSemDuplicatas.length > 0) {
    return imagensSemDuplicatas;
  }

  return [
    {
      src: gerarImagemPlaceholder(produto.nome || "Produto"),
      alt: produto.nome || "Produto sem imagem"
    }
  ];
}

function removerImagensDuplicadas(imagens) {
  const caminhos = new Set();

  return imagens.filter((imagem) => {
    if (!imagem.src || caminhos.has(imagem.src)) {
      return false;
    }

    caminhos.add(imagem.src);
    return true;
  });
}

function normalizarCaminhoImagem(caminho, produto) {
  if (!caminho || typeof caminho !== "string") {
    return gerarImagemPlaceholder(produto.nome || "Produto");
  }

  const imagem = caminho.trim();

  if (!imagem) {
    return gerarImagemPlaceholder(produto.nome || "Produto");
  }

  if (
    imagem.startsWith("http://") ||
    imagem.startsWith("https://") ||
    imagem.startsWith("data:image")
  ) {
    return imagem;
  }

  if (imagem.startsWith("/")) {
    return imagem;
  }

  if (imagem.startsWith("assets/")) {
    return `/${imagem}`;
  }

  if (produto && produto.id) {
    return `/assets/img/Produtos/${produto.id}/${imagem}`;
  }

  return `/assets/img/${imagem}`;
}

function gerarImagemPlaceholder(nomeProduto) {
  const nome = escaparHtml(nomeProduto || "Produto");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
      <rect width="800" height="1000" fill="#fcfffd"/>
      <circle cx="400" cy="370" r="135" fill="#efe2d5"/>
      <circle cx="450" cy="390" r="90" fill="#4c1a57" opacity="0.15"/>
      <rect x="180" y="570" width="440" height="46" rx="23" fill="#cf995f" opacity="0.72"/>
      <rect x="250" y="645" width="300" height="34" rx="17" fill="#2e8b57" opacity="0.58"/>
      <text x="400" y="760" font-family="Arial" font-size="38" text-anchor="middle" fill="#4c1a57">${nome}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function escaparHtml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}