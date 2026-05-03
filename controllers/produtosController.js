const repo = require("../repositories/produtosRepo");

async function listarProdutos(req, res) {
    try {
        const busca = req.query.busca || "";
        const tag = req.query.tag || "";

        const produtos = await repo.buscarProdutosCatalogo({
            busca,
            tag
        });

        res.json(produtos);
    } catch (err) {
        console.error("Erro no controller:", err);
        res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
}

async function buscarProdutoPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID de produto invalido"
            });
        }

        const produto = await repo.buscarProdutoCompletoPorId(id);

        if (!produto) {
            return res.status(404).json({
                erro: "Produto nao encontrado"
            });
        }

        res.json(produto);
    } catch (err) {
        console.error("Erro ao buscar produto por ID:", err);
        res.status(500).json({
            erro: "Erro ao buscar produto"
        });
    }
}

module.exports = {
    listarProdutos,
    buscarProdutoPorId
};