const db = require("../DB/database");

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (erro, rows) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(rows);
    });
  });
}

async function main() {
  try {
    console.log("\n==============================");
    console.log("ESTRUTURA DA TABELA produtos");
    console.log("==============================");

    const estruturaProdutos = await all("PRAGMA table_info(produtos)");
    console.table(estruturaProdutos);

    console.log("\n=====================================");
    console.log("ESTRUTURA DA TABELA produto_imagens");
    console.log("=====================================");

    const estruturaImagens = await all("PRAGMA table_info(produto_imagens)");
    console.table(estruturaImagens);

    console.log("\n==============================");
    console.log("PRODUTOS CADASTRADOS");
    console.log("==============================");

    const produtos = await all(`
      SELECT
        id,
        nome,
        descricao,
        preco,
        preco_promo,
        qtd,
        imagem,
        sku,
        ativo
      FROM produtos
      ORDER BY id ASC
    `);

    console.table(produtos);

    console.log("\n==============================");
    console.log("IMAGENS CADASTRADAS");
    console.log("==============================");

    const imagens = await all(`
      SELECT
        id,
        produto_id,
        caminho,
        alt,
        ordem,
        principal
      FROM produto_imagens
      ORDER BY produto_id ASC, principal DESC, ordem ASC, id ASC
    `);

    console.table(imagens);

    console.log("\n==============================");
    console.log("PRODUTOS COM IMAGENS AGRUPADAS");
    console.log("==============================");

    const produtosComImagens = produtos.map((produto) => {
      const imagensDoProduto = imagens.filter((imagem) => {
        return Number(imagem.produto_id) === Number(produto.id);
      });

      return {
        ...produto,
        total_imagens: imagensDoProduto.length,
        imagens: imagensDoProduto.map((imagem) => imagem.caminho).join(" | ")
      };
    });

    console.table(produtosComImagens);

    console.log("\n==============================");
    console.log("JSON COMPLETO PARA DEBUG");
    console.log("==============================");

    console.log(
      JSON.stringify(
        produtosComImagens.map((produto) => {
          return {
            ...produto,
            imagens_array: imagens.filter((imagem) => {
              return Number(imagem.produto_id) === Number(produto.id);
            })
          };
        }),
        null,
        2
      )
    );
  } catch (erro) {
    console.error("Erro ao inspecionar banco:", erro);
  } finally {
    db.close();
  }
}

main();