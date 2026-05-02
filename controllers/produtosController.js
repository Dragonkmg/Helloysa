const repo = require("../repositories/produtosRepo");

async function listarProdutos(req, res) {
    try {
        const busca = req.query.busca || "";
        const tag = req.query.tag || "";

        const produtos = await repo.buscarProdutos({
            busca,
            tag
        });

        res.json(produtos);
    } catch (err) {
        console.error("Erro no controller:", err);
        res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
}

module.exports = {
    listarProdutos
};