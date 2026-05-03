const sessoesRepo = require("../repositories/sessoesRepo");

function extrairToken(req) {
  const authorization = req.headers.authorization || "";

  if (!authorization) {
    return null;
  }

  const partes = authorization.split(" ");

  if (partes.length !== 2) {
    return null;
  }

  const tipo = partes[0];
  const token = partes[1];

  if (tipo.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

async function obrigatorio(req, res, next) {
  try {
    const token = extrairToken(req);

    if (!token) {
      return res.status(401).json({
        erro: true,
        precisa_login: true,
        mensagem: "Faça login para continuar."
      });
    }

    const usuario = await sessoesRepo.buscarUsuarioPorToken(token);

    if (!usuario) {
      return res.status(401).json({
        erro: true,
        precisa_login: true,
        mensagem: "Sessão inválida ou expirada. Faça login novamente."
      });
    }

    req.usuario = usuario;
    req.token = token;

    return next();
  } catch (erro) {
    console.error("Erro no middleware de autenticação:", erro);

    return res.status(500).json({
      erro: true,
      mensagem: "Erro interno ao verificar autenticação."
    });
  }
}

async function opcional(req, res, next) {
  try {
    const token = extrairToken(req);

    if (!token) {
      req.usuario = null;
      req.token = null;
      return next();
    }

    const usuario = await sessoesRepo.buscarUsuarioPorToken(token);

    req.usuario = usuario;
    req.token = usuario ? token : null;

    return next();
  } catch (erro) {
    console.error("Erro no middleware opcional de autenticação:", erro);

    req.usuario = null;
    req.token = null;

    return next();
  }
}

module.exports = {
  obrigatorio,
  opcional,
  extrairToken
};