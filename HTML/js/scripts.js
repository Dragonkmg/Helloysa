import { buscarProdutos } from "./busca.js";
import { renderizarCatalogo } from "./catalogo.js";

document.addEventListener("DOMContentLoaded", () => {
  const inputBusca = document.getElementById("inputBusca");
  const tagLinks = document.querySelectorAll(".tag-link[data-tag]");

  let timeout;
  let tagAtual = "catalogo";

  const params = new URLSearchParams(window.location.search);
  const buscaUrl = params.get("busca");
  const tagUrl = params.get("tag");

  if (buscaUrl && inputBusca) {
    inputBusca.value = buscaUrl;
  }

  if (tagUrl) {
    tagAtual = tagUrl;
  }

  async function atualizarCatalogo() {
    try {
      const termo = inputBusca?.value || "";

      const produtos = await buscarProdutos({
        busca: termo,
        tag: tagAtual
      });

      renderizarCatalogo(produtos);
    } catch (erro) {
      console.error("Erro ao atualizar catálogo:", erro);
    }
  }

  function atualizarLinkAtivo() {
    tagLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.tag === tagAtual);
    });
  }

  if (inputBusca) {
    inputBusca.addEventListener("input", () => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        atualizarCatalogo();
      }, 300);
    });
  }

  tagLinks.forEach((link) => {
    link.addEventListener("click", (evento) => {
      evento.preventDefault();

      const novaTag = link.dataset.tag;

      if (!novaTag) {
        return;
      }

      tagAtual = novaTag;

      atualizarLinkAtivo();
      atualizarCatalogo();
    });
  });

  atualizarLinkAtivo();
  atualizarCatalogo();
});