const db = require('../DB/database');

function buscarProdutoPorId(id) {
  return new Promise((resolve, reject) => {
    const sql = `
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
      LIMIT 1
    `;

    db.get(sql, [id], (erro, produto) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(produto);
    });
  });
}

function buscarImagensDoProduto(produtoId) {
  return new Promise((resolve, reject) => {
    const sql = `
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
    `;

    db.all(sql, [produtoId], (erro, imagens) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(imagens || []);
    });
  });
}

async function buscarProdutoCompletoPorId(id) {
  const produto = await buscarProdutoPorId(id);

  if (!produto) {
    return null;
  }

  const imagens = await buscarImagensDoProduto(id);

  return {
    ...produto,
    imagens
  };
}

module.exports = {
  buscarProdutoCompletoPorId
};