import { criarCardProduto } from "./cardProduto.js";

export function renderizarCatalogo(produtos) {
    const container = document.getElementById("produtos-container");

    if (!container) {
        console.error("Container de produtos não encontrado.");
        return;
    }

    container.innerHTML = "";

    produtos.forEach(produto => {
        container.innerHTML += criarCardProduto(produto);
    });
}