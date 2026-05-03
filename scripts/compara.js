const fs = require("fs");

const arquivoOriginal = "@/startbootstrap-shop-item-gh-pages/css/styles.css";
const arquivoAtual = "css/styles.css";
const arquivoSaida = "styles.txt";

function lerLinhas(caminho) {
    if (!fs.existsSync(caminho)) {
        console.error(`Arquivo nao encontrado: ${caminho}`);
        process.exit(1);
    }

    return fs.readFileSync(caminho, "utf8").split(/\r?\n/);
}

const original = lerLinhas(arquivoOriginal);
const atual = lerLinhas(arquivoAtual);

const setOriginal = new Set(
    original
        .map(linha => linha.trim())
        .filter(linha => linha !== "")
);

const linhasDiferentes = [];

atual.forEach((linha, index) => {
    const linhaLimpa = linha.trim();

    if (linhaLimpa === "") return;

    if (!setOriginal.has(linhaLimpa)) {
        linhasDiferentes.push(`Linha ${index + 1}: ${linha}`);
    }
});

fs.writeFileSync(
    arquivoSaida,
    linhasDiferentes.join("\n"),
    "utf8"
);

console.log(`Diferenças exportadas para ${arquivoSaida}`);
console.log(`${linhasDiferentes.length} linhas diferentes encontradas.`);