const usuariosRepo = require("../repositories/usuariosRepo");
const sessoesRepo = require("../repositories/sessoesRepo");
const authMiddleware = require("../middlewares/authMiddleware");

async function cadastro(req, res) {
  try {
    const usuario = await usuariosRepo.criarUsuario(req.body);
    const token = await sessoesRepo.criarSessao(usuario.id);

    return res.status(201).json({
      erro: false,
      usuario,
      token,
      mensagem: "Cadastro realizado com sucesso."
    });
  } catch (erro) {
    console.error("Erro ao cadastrar usuário:", erro);

    const status = erro.status || 500;

    return res.status(status).json({
      erro: true,
      mensagem: erro.status
        ? erro.message
        : "Erro interno ao cadastrar usuário."
    });
  }
}

async function login(req, res) {
  try {
    const email = usuariosRepo.normalizarEmail(req.body.email);
    const senha = String(req.body.senha || "");

    if (!email || !senha) {
      return res.status(400).json({
        erro: true,
        mensagem: "Informe e-mail e senha."
      });
    }

    const usuarioCompleto = await usuariosRepo.buscarPorEmail(email);

    if (
      !usuarioCompleto ||
      Number(usuarioCompleto.ativo) !== 1 ||
      !usuariosRepo.verificarSenha(senha, usuarioCompleto)
    ) {
      return res.status(401).json({
        erro: true,
        mensagem: "E-mail ou senha inválidos."
      });
    }

    const token = await sessoesRepo.criarSessao(usuarioCompleto.id);
    const usuario = usuariosRepo.limparUsuario(usuarioCompleto);

    return res.json({
      erro: false,
      usuario,
      token,
      mensagem: "Login realizado com sucesso."
    });
  } catch (erro) {
    console.error("Erro ao fazer login:", erro);

    return res.status(500).json({
      erro: true,
      mensagem: "Erro interno ao fazer login."
    });
  }
}

async function logout(req, res) {
  try {
    const token = req.token || authMiddleware.extrairToken(req);

    await sessoesRepo.revogarToken(token);

    return res.json({
      erro: false,
      mensagem: "Logout realizado com sucesso."
    });
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro);

    return res.status(500).json({
      erro: true,
      mensagem: "Erro interno ao fazer logout."
    });
  }
}

async function me(req, res) {
  return res.json({
    erro: false,
    usuario: req.usuario
  });
}

module.exports = {
  cadastro,
  login,
  logout,
  me
};