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

function aplicarBuscaDaUrl() {
  const params = new URLSearchParams(window.location.search);
  const busca = params.get('busca');

  if (!busca) {
    return;
  }

  const inputBusca = document.getElementById('inputBusca');

  if (!inputBusca) {
    return;
  }

  inputBusca.value = busca;

  inputBusca.dispatchEvent(new Event('input', {
    bubbles: true
  }));
}