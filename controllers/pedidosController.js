const pedidosRepo = require("../repositories/pedidosRepo");

function responderErro(res, erro, mensagemPadrao) {
  console.error(mensagemPadrao, erro);

  const status = erro.status || 500;

  return res.status(status).json({
    erro: true,
    precisa_login: erro.precisa_login || false,
    mensagem: erro.status
      ? erro.message
      : mensagemPadrao
  });
}

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
    return responderErro(res, erro, "Erro interno ao criar pedido.");
  }
}

async function listarMe(req, res) {
  try {
    const pedidos = await pedidosRepo.listarPedidosDoUsuario(req.usuario.id);

    return res.json({
      erro: false,
      pedidos
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro interno ao listar pedidos.");
  }
}

async function buscarMeuPedido(req, res) {
  try {
    const pedido = await pedidosRepo.buscarPedidoDoUsuario(
      req.params.id,
      req.usuario.id
    );

    return res.json({
      erro: false,
      pedido
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro interno ao buscar pedido.");
  }
}

module.exports = {
  criarPedido,
  listarMe,
  buscarMeuPedido
};