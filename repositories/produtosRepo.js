const db = require("../DB/database");

function all(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function get(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/*
    GET /produtos
    Resposta curta para catalogo/cards.
*/
async function buscarProdutosCatalogo({ busca = "", tag = "" } = {}) {
    let query = `
        SELECT DISTINCT
            pai.id,
            pai.nome,
            pai.descricao,
            pai.preco,
            pai.preco_promo,
            pai.qtd,
            pai.imagem,
            pai.sku
        FROM produtos p
        LEFT JOIN produto_tags pt ON p.id = pt.produto_id
        LEFT JOIN tags t ON t.id = pt.tag_id
        JOIN produtos pai
            ON pai.id = COALESCE(NULLIF(p.item_pai, ''), p.id)
        WHERE
            p.ativo = 1
            AND pai.ativo = 1
    `;

    const params = [];

    if (busca) {
        query += `
            AND (
                p.nome LIKE ?
                OR p.descricao LIKE ?
                OR t.nome LIKE ?
            )
        `;

        params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    if (tag) {
        query += `
            AND EXISTS (
                SELECT 1
                FROM produto_tags pt2
                JOIN tags t2 ON t2.id = pt2.tag_id
                WHERE pt2.produto_id = p.id
                AND t2.nome = ?
            )
        `;

        params.push(tag);
    }

    query += `
        ORDER BY pai.id DESC
    `;

    const produtos = await all(query, params);

    return Promise.all(
        produtos.map(async produto => {
            const imagemPrincipal = await buscarImagemPrincipalDoProduto(produto.id);

            return {
                ...produto,
                imagem: imagemPrincipal || normalizarImagemProduto(produto)
            };
        })
    );
}

/*
    GET /produtos/:id
    Resposta completa para pagina do item.
*/
async function buscarProdutoCompletoPorId(id) {
    const produto = await get(
        `
        SELECT
            id,
            nome,
            descricao,
            preco,
            preco_promo,
            qtd,
            item_pai,
            variacao,
            imagem,
            sku,
            ativo,
            criado_em
        FROM produtos
        WHERE id = ?
        AND ativo = 1
        `,
        [id]
    );

    if (!produto) {
        return null;
    }

    const tags = await buscarTagsDoProduto(id);
    const imagens = await buscarImagensDoProduto(produto);

    return {
        ...produto,
        tags,
        imagens
    };
}

async function buscarTagsDoProduto(produtoId) {
    const rows = await all(
        `
        SELECT t.nome
        FROM tags t
        JOIN produto_tags pt ON pt.tag_id = t.id
        WHERE pt.produto_id = ?
        ORDER BY t.nome
        `,
        [produtoId]
    );

    return rows.map(row => row.nome);
}

async function buscarImagensDoProduto(produto) {
    const imagensTabela = await all(
        `
        SELECT
            id,
            caminho,
            alt,
            ordem,
            principal
        FROM produto_imagens
        WHERE produto_id = ?
        ORDER BY principal DESC, ordem ASC, id ASC
        `,
        [produto.id]
    );

    if (imagensTabela.length > 0) {
        return imagensTabela.map((img, index) => ({
            id: img.id,
            caminho: img.caminho,
            alt: img.alt || produto.nome,
            ordem: img.ordem ?? index,
            principal: Boolean(img.principal)
        }));
    }

    return montarImagensFallback(produto);
}

async function buscarImagemPrincipalDoProduto(produtoId) {
    const imagem = await get(
        `
        SELECT caminho
        FROM produto_imagens
        WHERE produto_id = ?
        ORDER BY principal DESC, ordem ASC, id ASC
        LIMIT 1
        `,
        [produtoId]
    );

    return imagem?.caminho || null;
}

/*
    Fallback para produtos antigos que ainda usam produtos.imagem.

    Aceita:
    "assets/img/Produtos/1/calca.webp"
    "assets/img/Produtos/1/calca.webp,assets/img/Produtos/1/calca-2.webp"
    "calca.webp"
*/
function montarImagensFallback(produto) {
    const imagemNormalizada = normalizarImagemProduto(produto);

    if (!imagemNormalizada) {
        return [
            {
                caminho: "assets/img/sem-imagem.png",
                alt: produto.nome,
                principal: true,
                ordem: 0
            }
        ];
    }

    return imagemNormalizada
        .split(",")
        .map(img => img.trim())
        .filter(Boolean)
        .map((caminho, index) => ({
            caminho,
            alt: produto.nome,
            principal: index === 0,
            ordem: index
        }));
}

/*
    Se a imagem ja vier com caminho completo, usa direto.
    Se vier so o nome do arquivo, assume a pasta:
    assets/img/Produtos/{id}/arquivo
*/
function normalizarImagemProduto(produto) {
    if (!produto.imagem || produto.imagem.trim() === "") {
        return "";
    }

    return produto.imagem
        .split(",")
        .map(img => img.trim())
        .filter(Boolean)
        .map(img => {
            const jaTemPasta =
                img.startsWith("assets/") ||
                img.startsWith("/") ||
                img.startsWith("http://") ||
                img.startsWith("https://");

            if (jaTemPasta) {
                return img;
            }

            return `assets/img/Produtos/${produto.id}/${img}`;
        })
        .join(",");
}

module.exports = {
    buscarProdutosCatalogo,
    buscarProdutoCompletoPorId
};