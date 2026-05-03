const db = require("../DB/database");

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });
}

/*
  GET /produtos

  Resposta para o catálogo/cards.
  Agora retorna:
  - dados básicos do produto
  - imagem principal em produto.imagem
  - array completo em produto.imagens
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
      pai.sku,
      pai.ativo
    FROM produtos p
    LEFT JOIN produto_tags pt ON p.id = pt.produto_id
    LEFT JOIN tags t ON t.id = pt.tag_id
    JOIN produtos pai ON pai.id = COALESCE(NULLIF(p.item_pai, ''), p.id)
    WHERE p.ativo = 1
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

  if (tag && tag !== "catalogo") {
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
    produtos.map(async (produto) => {
      const imagens = await buscarImagensDoProduto(produto);
      const imagemPrincipal = obterImagemPrincipal(imagens);

      return {
        ...produto,
        imagem: imagemPrincipal || normalizarImagemProduto(produto),
        imagens
      };
    })
  );
}

/*
  GET /produtos/:id

  Resposta completa para página do item.
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

  return rows.map((row) => row.nome);
}

async function buscarImagensDoProduto(produto) {
  const imagensTabela = await all(
    `
      SELECT
        id,
        produto_id,
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
    return imagensTabela.map((img, index) => {
      return {
        id: img.id,
        produto_id: img.produto_id,
        caminho: img.caminho,
        alt: img.alt || produto.nome,
        ordem: img.ordem ?? index,
        principal: Number(img.principal) === 1
      };
    });
  }

  return montarImagensFallback(produto);
}

function obterImagemPrincipal(imagens) {
  if (!Array.isArray(imagens) || imagens.length === 0) {
    return "";
  }

  const principal = imagens.find((imagem) => imagem.principal);

  return principal?.caminho || imagens[0].caminho || "";
}

/*
  Fallback para produtos antigos que ainda usam produtos.imagem.

  Aceita:
  - "assets/img/Produtos/1/calca.webp"
  - "assets/img/Produtos/1/calca.webp,assets/img/Produtos/1/calca-2.webp"
  - "calca.webp"
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
    .map((img) => img.trim())
    .filter(Boolean)
    .map((caminho, index) => {
      return {
        caminho,
        alt: produto.nome,
        principal: index === 0,
        ordem: index
      };
    });
}

/*
  Se a imagem já vier com caminho completo, usa direto.
  Se vier só o nome do arquivo, assume:
  assets/img/Produtos/{id}/arquivo
*/
function normalizarImagemProduto(produto) {
  if (!produto.imagem || produto.imagem.trim() === "") {
    return "";
  }

  return produto.imagem
    .split(",")
    .map((img) => img.trim())
    .filter(Boolean)
    .map((img) => {
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