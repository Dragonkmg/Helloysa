const crypto = require("crypto");
const db = require("../DB/database");

const ITERACOES_HASH = 120000;
const TAMANHO_CHAVE = 64;
const ALGORITMO_HASH = "sha512";

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (erro) {
      if (erro) {
        reject(erro);
        return;
      }

      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (erro, row) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(row);
    });
  });
}

function criarErroValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function limparUsuario(usuario) {
  if (!usuario) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone || "",
    ativo: usuario.ativo,
    criado_em: usuario.criado_em,
    atualizado_em: usuario.atualizado_em
  };
}

function gerarSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function gerarHashSenha(senha, salt) {
  return crypto
    .pbkdf2Sync(String(senha), salt, ITERACOES_HASH, TAMANHO_CHAVE, ALGORITMO_HASH)
    .toString("hex");
}

function verificarSenha(senha, usuario) {
  if (!usuario || !usuario.senha_hash || !usuario.senha_salt) {
    return false;
  }

  const hashCalculado = gerarHashSenha(senha, usuario.senha_salt);

  const bufferCalculado = Buffer.from(hashCalculado, "hex");
  const bufferSalvo = Buffer.from(usuario.senha_hash, "hex");

  if (bufferCalculado.length !== bufferSalvo.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferCalculado, bufferSalvo);
}

async function buscarPorEmail(email) {
  const emailNormalizado = normalizarEmail(email);

  return get(
    `
      SELECT
        id,
        nome,
        email,
        telefone,
        senha_hash,
        senha_salt,
        ativo,
        criado_em,
        atualizado_em
      FROM usuarios
      WHERE email = ?
      LIMIT 1
    `,
    [emailNormalizado]
  );
}

async function buscarPorId(id) {
  return get(
    `
      SELECT
        id,
        nome,
        email,
        telefone,
        ativo,
        criado_em,
        atualizado_em
      FROM usuarios
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
}

async function criarUsuario({ nome, email, telefone = "", senha } = {}) {
  const nomeLimpo = String(nome || "").trim();
  const emailNormalizado = normalizarEmail(email);
  const telefoneLimpo = String(telefone || "").trim();
  const senhaTexto = String(senha || "");

  if (!nomeLimpo) {
    throw criarErroValidacao("Informe o nome.");
  }

  if (!emailNormalizado) {
    throw criarErroValidacao("Informe o e-mail.");
  }

  if (!emailNormalizado.includes("@")) {
    throw criarErroValidacao("Informe um e-mail válido.");
  }

  if (senhaTexto.length < 6) {
    throw criarErroValidacao("A senha deve ter pelo menos 6 caracteres.");
  }

  const usuarioExistente = await buscarPorEmail(emailNormalizado);

  if (usuarioExistente) {
    throw criarErroValidacao("Este e-mail já está cadastrado.");
  }

  const salt = gerarSalt();
  const senhaHash = gerarHashSenha(senhaTexto, salt);

  const resultado = await run(
    `
      INSERT INTO usuarios (
        nome,
        email,
        telefone,
        senha_hash,
        senha_salt
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      nomeLimpo,
      emailNormalizado,
      telefoneLimpo,
      senhaHash,
      salt
    ]
  );

  const usuarioCriado = await buscarPorId(resultado.id);

  return limparUsuario(usuarioCriado);
}

module.exports = {
  criarUsuario,
  buscarPorEmail,
  buscarPorId,
  limparUsuario,
  verificarSenha,
  normalizarEmail
};