const crypto = require("crypto");
const db = require("../DB/database");
const usuariosRepo = require("./usuariosRepo");

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

function gerarToken() {
  return crypto.randomBytes(32).toString("hex");
}

function gerarHashToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token || ""))
    .digest("hex");
}

async function criarSessao(usuarioId) {
  const token = gerarToken();
  const tokenHash = gerarHashToken(token);

  await run(
    `
      INSERT INTO sessoes (
        usuario_id,
        token_hash,
        expira_em
      )
      VALUES (?, ?, datetime('now', '+7 days'))
    `,
    [usuarioId, tokenHash]
  );

  return token;
}

async function buscarUsuarioPorToken(token) {
  const tokenTexto = String(token || "").trim();

  if (!tokenTexto) {
    return null;
  }

  const tokenHash = gerarHashToken(tokenTexto);

  const sessao = await get(
    `
      SELECT
        sessoes.id AS sessao_id,
        sessoes.usuario_id,
        sessoes.expira_em,
        sessoes.revogado_em,
        usuarios.id,
        usuarios.nome,
        usuarios.email,
        usuarios.telefone,
        usuarios.ativo,
        usuarios.criado_em,
        usuarios.atualizado_em
      FROM sessoes
      INNER JOIN usuarios ON usuarios.id = sessoes.usuario_id
      WHERE sessoes.token_hash = ?
        AND sessoes.revogado_em IS NULL
        AND usuarios.ativo = 1
        AND (
          sessoes.expira_em IS NULL
          OR sessoes.expira_em > datetime('now')
        )
      LIMIT 1
    `,
    [tokenHash]
  );

  if (!sessao) {
    return null;
  }

  await run(
    `
      UPDATE sessoes
      SET ultimo_uso_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [sessao.sessao_id]
  );

  return usuariosRepo.limparUsuario(sessao);
}

async function revogarToken(token) {
  const tokenTexto = String(token || "").trim();

  if (!tokenTexto) {
    return {
      changes: 0
    };
  }

  const tokenHash = gerarHashToken(tokenTexto);

  return run(
    `
      UPDATE sessoes
      SET revogado_em = CURRENT_TIMESTAMP
      WHERE token_hash = ?
        AND revogado_em IS NULL
    `,
    [tokenHash]
  );
}

module.exports = {
  criarSessao,
  buscarUsuarioPorToken,
  revogarToken,
  gerarHashToken
};