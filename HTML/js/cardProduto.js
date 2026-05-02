export function criarCardProduto(produto) {
    const estrelas = criarEstrelas(produto.rating || 0);

    const imagem = produto.imagem && produto.imagem.trim() !== ""
        ? produto.imagem
        : "placeholder.png";

    const temPromocao = produto.preco_promo !== null && produto.preco_promo !== undefined;
    const precoNormal = Number(produto.preco || 0);
    const precoPromo = Number(produto.preco_promo || 0);

    return `
        <div class="col mb-5">
            <div class="card h-100 overflow-hidden product-card">

                <div class="img-zoom-container position-relative overflow-hidden">
                    <img
                        class="card-img-top img-zoom-element"
                        src="assets/img/${imagem}"
                        alt="${produto.nome}"
                    />

                    ${produto.tags?.length ? `
                        <div class="badge bg-dark text-white position-absolute"
                             style="top: 0.5rem; right: 0.5rem;">
                            ${produto.tags[0]}
                        </div>
                    ` : ""}
                </div>

                <div class="card-body p-4">
                    <div class="text-center">
                        <h5 class="fw-bolder">${produto.nome}</h5>

                        <div class="d-flex justify-content-center small text-warning mb-2">
                            ${estrelas}
                        </div>

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
                           href="/item.html?id=${produto.id}">
                           Ver Produto
                        </a>
                    </div>
                </div>

            </div>
        </div>
    `;
}

function criarEstrelas(rating) {
    let estrelas = "";

    for (let i = 0; i < 5; i++) {
        estrelas += i < rating
            ? '<div class="bi-star-fill"></div>'
            : '<div class="bi-star"></div>';
    }

    return estrelas;
}