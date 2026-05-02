import { buscarProdutos } from "./busca.js";
import { renderizarCatalogo } from "./catalogo.js";

document.addEventListener("DOMContentLoaded", () => {
    const inputBusca = document.getElementById("inputBusca");

    let timeout;

    async function atualizarCatalogo() {
        try {
            const termo = inputBusca?.value || "";

            const produtos = await buscarProdutos({
                busca: termo,
                tag: "catalogo"
            });

            renderizarCatalogo(produtos);
        } catch (erro) {
            console.error("Erro ao atualizar catálogo:", erro);
        }
    }

    if (inputBusca) {
        inputBusca.addEventListener("input", () => {
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                atualizarCatalogo();
            }, 300);
        });
    }

    atualizarCatalogo();
});
const navbar = document.getElementById("mainNavbar");

let ultimoScroll = window.scrollY;

function atualizarNavbar() {
  const scrollAtual = window.scrollY;
  const pertoDoTopo = scrollAtual < 80;
  const subindo = scrollAtual < ultimoScroll;

  if (pertoDoTopo || subindo) {
    navbar.classList.add("visible");
  } else {
    navbar.classList.remove("visible");
  }

  ultimoScroll = scrollAtual;
}

navbar.classList.add("visible");

window.addEventListener("scroll", atualizarNavbar);