const path = require("path");
const gerencialRepo = require("../repositories/gerencialRepo");

function responderErro(res, erro, mensagemPadrao) {
  console.error(mensagemPadrao, erro);

  const status = erro.status || 500;

  return res.status(status).json({
    erro: true,
    mensagem: erro.status
      ? erro.message
      : mensagemPadrao
  });
}

function pagina(req, res) {
  return res.sendFile(
    path.join(__dirname, "..", "gerencial", "gerencial.html")
  );
}

function status(req, res) {
  return res.json({
    erro: false,
    mensagem: "Área gerencial local ativa.",
    acesso: "local"
  });
}

async function criarProduto(req, res) {
  try {
    const produto = await gerencialRepo.criarProduto(req.body);

    return res.status(201).json({
      erro: false,
      produto,
      mensagem: "Produto criado com sucesso."
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro interno ao criar produto.");
  }
}

async function importarImagensProduto(req, res) {
  try {
    const resultado = await gerencialRepo.importarImagensProduto(req.params.id);

    return res.json({
      erro: false,
      resultado,
      mensagem: "Imagens importadas com sucesso."
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro interno ao importar imagens.");
  }
}

async function listarPedidos(req, res) {
  try {
    const pedidos = await gerencialRepo.listarPedidos({
      limite: req.query.limite
    });

    return res.json({
      erro: false,
      pedidos
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro interno ao listar pedidos.");
  }
}

async function listarComprasIndevidas(req, res) {
  try {
    const pedidos = await gerencialRepo.listarPedidos({
      somenteIndevidos: true,
      limite: req.query.limite
    });

    return res.json({
      erro: false,
      pedidos
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro interno ao listar compras indevidas.");
  }
}

async function buscarPedido(req, res) {
  try {
    const pedido = await gerencialRepo.buscarPedido(req.params.id);

    return res.json({
      erro: false,
      pedido
    });
  } catch (erro) {
    return responderErro(res, erro, "Erro interno ao buscar pedido.");
  }
}

module.exports = {
  pagina,
  status,
  criarProduto,
  importarImagensProduto,
  listarPedidos,
  listarComprasIndevidas,
  buscarPedido
};