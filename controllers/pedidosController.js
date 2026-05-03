const pedidosRepo = require("../repositories/pedidosRepo");

async function criarPedido(req, res) {
  try {
    const pedido = await pedidosRepo.criarPedido({
      ...req.body,
      usuario: req.usuario
    });

    return res.status(201).json({
      erro: false,
      pedido,
      mensagem: pedido.mensagem
    });
  } catch (erro) {
    console.error("Erro ao criar pedido:", erro);

    const status = erro.status || 500;

    return res.status(status).json({
      erro: true,
      precisa_login: erro.precisa_login || false,
      mensagem: erro.status
        ? erro.message
        : "Erro interno ao criar pedido."
    });
  }
}

module.exports = {
  criarPedido
};