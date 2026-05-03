function normalizarIp(ip) {
  return String(ip || "")
    .trim()
    .replace("::ffff:", "");
}

function ehIpLocal(ip) {
  const normalizado = normalizarIp(ip);

  return [
    "127.0.0.1",
    "::1",
    "localhost"
  ].includes(normalizado);
}

function localOnlyMiddleware(req, res, next) {
  const ips = [
    req.ip,
    req.socket && req.socket.remoteAddress,
    req.connection && req.connection.remoteAddress
  ].filter(Boolean);

  const permitido = ips.some(ehIpLocal);

  if (permitido) {
    return next();
  }

  const mensagem = "Área gerencial disponível apenas localmente.";

  if (req.path.startsWith("/api")) {
    return res.status(403).json({
      erro: true,
      mensagem
    });
  }

  return res.status(403).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Acesso negado</title>
    </head>
    <body style="font-family: Arial, sans-serif; padding: 40px;">
      <h1>Acesso negado</h1>
      <p>${mensagem}</p>
      <p>Use <strong>http://localhost:3000/gerencial</strong> diretamente na máquina do servidor.</p>
    </body>
    </html>
  `);
}

module.exports = localOnlyMiddleware;