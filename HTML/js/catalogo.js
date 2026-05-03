import { criarCardProduto } from "./cardProduto.js";

export function renderizarCatalogo(produtos) {
    const container = document.getElementById("produtos-container");

    if (!container) {
        console.error("Container de produtos não encontrado.");
        return;
    }

    container.innerHTML = "";

    if (!produtos || produtos.length === 0) {
        container.innerHTML = `
            <p class="text-center text-muted">
                Nenhum produto encontrado.
            </p>
        `;
        return;
    }

    produtos.forEach(produto => {
        container.innerHTML += criarCardProduto(produto);
    });
}