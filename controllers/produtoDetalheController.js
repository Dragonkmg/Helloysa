const produtoDetalheRepo = require('../repositories/produtoDetalheRepo');

async function buscarProdutoPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        erro: true,
        mensagem: 'ID do produto inválido.'
      });
    }

    const produto = await produtoDetalheRepo.buscarProdutoCompletoPorId(id);

    if (!produto) {
      return res.status(404).json({
        erro: true,
        mensagem: 'Produto não encontrado.'
      });
    }

    if (produto.ativo === 0) {
      return res.status(404).json({
        erro: true,
        mensagem: 'Produto indisponível.'
      });
    }

    return res.json({
      erro: false,
      produto
    });
  } catch (erro) {
    console.error('Erro ao buscar produto por ID:', erro);

    return res.status(500).json({
      erro: true,
      mensagem: 'Erro interno ao buscar produto.'
    });
  }
}

module.exports = {
  buscarProdutoPorId
};