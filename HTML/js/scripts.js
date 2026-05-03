import { buscarProdutos } from "./busca.js";
import { renderizarCatalogo } from "./catalogo.js";

document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.getElementById("mainNavbar");
    const inputBusca = document.getElementById("inputBusca");
    const linksDeTag = document.querySelectorAll(".tag-link");

    let timeout;
    let ultimoScroll = window.scrollY;
    let tagAtual = "catalogo";

    function atualizarNavbar() {
        if (!navbar) return;

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

    function marcarTagAtiva(linkAtivo) {
        linksDeTag.forEach(link => {
            link.classList.remove("active");
        });

        linkAtivo.classList.add("active");
    }

    if (navbar) {
        navbar.classList.add("visible");
        window.addEventListener("scroll", atualizarNavbar);
    }

    if (inputBusca) {
        inputBusca.addEventListener("input", () => {
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                atualizarCatalogo();
            }, 300);
        });
    }

    linksDeTag.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            const novaTag = link.dataset.tag;

            if (!novaTag) return;

            tagAtual = novaTag;
            marcarTagAtiva(link);
            atualizarCatalogo();
        });
    });

    atualizarCatalogo();
});