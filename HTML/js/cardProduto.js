export function criarCardProduto(produto) {
    const imagem = obterCaminhoImagem(produto);

    const temPromocao =
        produto.preco_promo !== null &&
        produto.preco_promo !== undefined &&
        produto.preco_promo !== "";

    const precoNormal = Number(produto.preco || 0);
    const precoPromo = Number(produto.preco_promo || 0);

    return `
        <div class="col mb-5">
            <div class="card h-100 product-card">

                <img
                    class="card-img-top"
                    src="${imagem}"
                    alt="${produto.nome || "Produto"}"
                />

                <div class="card-body p-4">
                    <div class="text-center">
                        <h5 class="fw-bolder">${produto.nome || "Produto sem nome"}</h5>

                        ${
                            temPromocao
                                ? `
                                    <span class="text-muted text-decoration-line-through me-1">
                                        R$ ${precoNormal.toFixed(2)}
                                    </span>
                                    <span class="fw-bold text-danger">
                                        R$ ${precoPromo.toFixed(2)}
                                    </span>
                                `
                                : `
                                    <span>
                                        R$ ${precoNormal.toFixed(2)}
                                    </span>
                                `
                        }
                    </div>
                </div>

                <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                    <div class="text-center">
                        <a class="btn btn-outline-dark mt-auto"
                           href="item.html?id=${produto.id}">
                           Ver Produto
                        </a>
                    </div>
                </div>

            </div>
        </div>
    `;
}

function obterCaminhoImagem(produto) {
    if (!produto.imagem || produto.imagem.trim() === "") {
        return "assets/img/sem-imagem.png";
    }

    const imagem = produto.imagem.trim();

    const caminhoJaCompleto =
        imagem.startsWith("assets/") ||
        imagem.startsWith("/") ||
        imagem.startsWith("http://") ||
        imagem.startsWith("https://");

    if (caminhoJaCompleto) {
        return imagem;
    }

    return `assets/img/Produtos/${produto.id}/${imagem}`;
}