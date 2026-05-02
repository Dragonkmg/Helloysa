const fs = require("fs");

const arquivoEntrada = "../css/antigo.css";
const arquivoSaida = "../css/styles.css";

const seletoresDesejados = [
    ":root",
    "body",
    "header",
    "footer",

    ".hero-banner",
    ".hero-content",
    ".gothic-title",
    ".gothic-subtitle",

    ".logo-img",

    ".categorias",
    ".categorias .nav-link",

    "#produtos-container",

    ".product-card",
    ".product-image-box",
    ".product-image",
    ".product-badge",
    ".product-price",
    ".product-price-old",
    ".product-price-promo",

    "#CarrinhoQtd",
    "#Usuario"
];

if (!fs.existsSync(arquivoEntrada)) {
    console.error(`Arquivo nao encontrado: ${arquivoEntrada}`);
    process.exit(1);
}

const css = fs.readFileSync(arquivoEntrada, "utf8");

function normalizarTexto(texto) {
    return texto.replace(/\s+/g, " ").trim();
}

function encontrarInicioBloco(css, indiceChaveAbertura) {
    let inicio = indiceChaveAbertura;

    while (inicio > 0) {
        const char = css[inicio];

        if (char === "}") {
            inicio++;
            break;
        }

        inicio--;
    }

    return inicio;
}

function encontrarFimBloco(css, indiceChaveAbertura) {
    let profundidade = 0;

    for (let i = indiceChaveAbertura; i < css.length; i++) {
        if (css[i] === "{") {
            profundidade++;
        }

        if (css[i] === "}") {
            profundidade--;

            if (profundidade === 0) {
                return i + 1;
            }
        }
    }

    return -1;
}

function extrairBlocosPorSeletor(css, seletor) {
    const blocos = [];
    let indiceBusca = 0;

    while (indiceBusca < css.length) {
        const indiceSeletor = css.indexOf(seletor, indiceBusca);

        if (indiceSeletor === -1) break;

        const indiceChave = css.indexOf("{", indiceSeletor);

        if (indiceChave === -1) break;

        const trechoSeletor = css.slice(indiceSeletor, indiceChave);
        const seletorNormalizado = normalizarTexto(trechoSeletor);

        const seletorEncontrado =
            seletorNormalizado === seletor ||
            seletorNormalizado.includes(`${seletor},`) ||
            seletorNormalizado.includes(`, ${seletor}`) ||
            seletorNormalizado.includes(`${seletor} `);

        if (seletorEncontrado) {
            const inicioBloco = encontrarInicioBloco(css, indiceChave);
            const fimBloco = encontrarFimBloco(css, indiceChave);

            if (fimBloco !== -1) {
                const bloco = css.slice(inicioBloco, fimBloco).trim();

                if (!blocos.includes(bloco)) {
                    blocos.push(bloco);
                }

                indiceBusca = fimBloco;
                continue;
            }
        }

        indiceBusca = indiceSeletor + seletor.length;
    }

    return blocos;
}

let saida = `/*
CSS extraido automaticamente de ${arquivoEntrada}

Revise este arquivo antes de substituir o styles.css original.
Bootstrap deve ser carregado via CDN no index.html.
*/

`;

let totalBlocos = 0;

for (const seletor of seletoresDesejados) {
    const blocos = extrairBlocosPorSeletor(css, seletor);

    if (blocos.length > 0) {
        saida += `\n/* ==============================\n   ${seletor}\n============================== */\n\n`;
        saida += blocos.join("\n\n");
        saida += "\n";
        totalBlocos += blocos.length;
    }
}

fs.writeFileSync(arquivoSaida, saida, "utf8");

console.log(`Arquivo gerado: ${arquivoSaida}`);
console.log(`Blocos encontrados: ${totalBlocos}`);