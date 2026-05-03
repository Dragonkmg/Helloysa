const db = require("../DB/database");

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

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (erro, rows) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(rows || []);
    });
  });
}

function criarErroValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function criarErroAutenticacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 401;
  erro.precisa_login = true;
  return erro;
}

function criarErroNaoEncontrado(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 404;
  return erro;
}

function obterPrecoFinal(produto) {
  const preco = Number(produto.preco || 0);
  const precoPromo = Number(produto.preco_promo || 0);

  if (precoPromo > 0 && precoPromo < preco) {
    return precoPromo;
  }

  return preco;
}

function normalizarItens(itens = []) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw criarErroValidacao("Carrinho vazio.");
  }

  return itens.map((item) => {
    const produtoId = Number(item.produto_id);
    const quantidade = Number(item.quantidade);

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      throw criarErroValidacao("Produto inválido no carrinho.");
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw criarErroValidacao("Quantidade inválida no carrinho.");
    }

    return {
      produto_id: produtoId,
      quantidade
    };
  });
}

async function buscarProdutoParaPedido(produtoId) {
  return get(
    `
      SELECT
        id,
        nome,
        descricao,
        preco,
        preco_promo,
        qtd,
        sku,
        ativo
      FROM produtos
      WHERE id = ?
      LIMIT 1
    `,
    [produtoId]
  );
}

function escolherStatusEstoque(statusAtual, novoStatus) {
  const prioridade = {
    ok: 0,
    estoque_insuficiente: 1,
    produto_indisponivel: 2,
    produto_inexistente: 3
  };

  const prioridadeAtual = prioridade[statusAtual] ?? 0;
  const prioridadeNova = prioridade[novoStatus] ?? 0;

  if (prioridadeNova > prioridadeAtual) {
    return novoStatus;
  }

  return statusAtual;
}

function validarUsuarioPedido(usuario) {
  if (!usuario || !usuario.id) {
    throw criarErroAutenticacao("Faça login para finalizar a compra.");
  }

  if (Number(usuario.ativo) !== 1) {
    throw criarErroAutenticacao("Usuário inativo. Faça login novamente.");
  }
}

async function criarPedido({ usuario, itens = [] } = {}) {
  validarUsuarioPedido(usuario);

  const itensNormalizados = normalizarItens(itens);

  await run("BEGIN TRANSACTION");

  try {
    const itensProcessados = [];
    const avisos = [];

    let total = 0;
    let compraIndevida = false;
    let statusEstoque = "ok";

    for (const item of itensNormalizados) {
      const produto = await buscarProdutoParaPedido(item.produto_id);

      if (!produto) {
        compraIndevida = true;
        statusEstoque = escolherStatusEstoque(statusEstoque, "produto_inexistente");

        avisos.push(`Produto ID ${item.produto_id}: produto não encontrado.`);

        itensProcessados.push({
          pedido_id: null,
          produto_id: null,
          nome_snapshot: `Produto ID ${item.produto_id} não encontrado`,
          sku_snapshot: null,
          preco_unitario: 0,
          quantidade_solicitada: item.quantidade,
          quantidade_disponivel: 0,
          subtotal: 0,
          estoque_suficiente: 0,
          produto_ativo: 0,
          observacao: "Produto inexistente no banco."
        });

        continue;
      }

      const precoUnitario = obterPrecoFinal(produto);
      const quantidadeDisponivel = Number(produto.qtd || 0);
      const subtotal = precoUnitario * item.quantidade;
      const produtoAtivo = Number(produto.ativo) === 1;

      let estoqueSuficiente = 1;
      let observacao = null;

      total += subtotal;

      if (!produtoAtivo) {
        compraIndevida = true;
        estoqueSuficiente = 0;
        statusEstoque = escolherStatusEstoque(statusEstoque, "produto_indisponivel");
        observacao = "Produto indisponível.";
        avisos.push(`${produto.nome}: produto indisponível.`);
      } else if (item.quantidade > quantidadeDisponivel) {
        compraIndevida = true;
        estoqueSuficiente = 0;
        statusEstoque = escolherStatusEstoque(statusEstoque, "estoque_insuficiente");
        observacao = "Quantidade solicitada maior que o estoque disponível.";
        avisos.push(
          `${produto.nome}: solicitado ${item.quantidade}, disponível ${quantidadeDisponivel}.`
        );
      }

      itensProcessados.push({
        pedido_id: null,
        produto_id: produto.id,
        nome_snapshot: produto.nome,
        sku_snapshot: produto.sku,
        preco_unitario: precoUnitario,
        quantidade_solicitada: item.quantidade,
        quantidade_disponivel: quantidadeDisponivel,
        subtotal,
        estoque_suficiente: estoqueSuficiente,
        produto_ativo: produtoAtivo ? 1 : 0,
        observacao
      });
    }

    const status = compraIndevida ? "indevido" : "concluido";

    const avisoCliente = compraIndevida
      ? "Pedido registrado, mas precisa de revisão. Alguns itens não possuem estoque suficiente ou estão indisponíveis."
      : "Compra finalizada com sucesso.";

    const motivoIndevido = compraIndevida
      ? avisos.join(" | ")
      : null;

    const pedidoCriado = await run(
      `
        INSERT INTO pedidos (
          usuario_id,
          cliente_nome,
          cliente_email,
          cliente_telefone,
          subtotal,
          total,
          status,
          status_estoque,
          compra_indevida,
          motivo_indevido,
          aviso_cliente
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        usuario.id,
        usuario.nome || "Cliente não informado",
        usuario.email || "",
        usuario.telefone || "",
        total,
        total,
        status,
        statusEstoque,
        compraIndevida ? 1 : 0,
        motivoIndevido,
        avisoCliente
      ]
    );

    const pedidoId = pedidoCriado.id;

    for (const item of itensProcessados) {
      await run(
        `
          INSERT INTO pedido_itens (
            pedido_id,
            produto_id,
            nome_snapshot,
            sku_snapshot,
            preco_unitario,
            quantidade_solicitada,
            quantidade_disponivel,
            subtotal,
            estoque_suficiente,
            produto_ativo,
            observacao
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          pedidoId,
          item.produto_id,
          item.nome_snapshot,
          item.sku_snapshot,
          item.preco_unitario,
          item.quantidade_solicitada,
          item.quantidade_disponivel,
          item.subtotal,
          item.estoque_suficiente,
          item.produto_ativo,
          item.observacao
        ]
      );
    }

    if (!compraIndevida) {
      for (const item of itensProcessados) {
        const baixa = await run(
          `
            UPDATE produtos
            SET qtd = qtd - ?
            WHERE id = ?
              AND ativo = 1
              AND qtd >= ?
          `,
          [
            item.quantidade_solicitada,
            item.produto_id,
            item.quantidade_solicitada
          ]
        );

        if (baixa.changes !== 1) {
          throw new Error("Falha ao atualizar estoque. A compra foi cancelada.");
        }
      }
    }

    await run("COMMIT");

    return {
      id: pedidoId,
      usuario_id: usuario.id,
      status,
      status_estoque: statusEstoque,
      compra_indevida: compraIndevida,
      total,
      avisos,
      mensagem: avisoCliente
    };
  } catch (erro) {
    await run("ROLLBACK");
    throw erro;
  }
}

function validarUsuarioId(usuarioId) {
  const id = Number(usuarioId);

  if (!Number.isInteger(id) || id <= 0) {
    throw criarErroAutenticacao("Faça login para continuar.");
  }

  return id;
}

function validarPedidoId(pedidoId) {
  const id = Number(pedidoId);

  if (!Number.isInteger(id) || id <= 0) {
    throw criarErroValidacao("Pedido inválido.");
  }

  return id;
}

function normalizarPedidoResumo(pedido) {
  return {
    id: pedido.id,
    usuario_id: pedido.usuario_id,
    cliente_nome: pedido.cliente_nome,
    cliente_email: pedido.cliente_email,
    cliente_telefone: pedido.cliente_telefone || "",
    subtotal: Number(pedido.subtotal || 0),
    total: Number(pedido.total || 0),
    status: pedido.status,
    status_estoque: pedido.status_estoque,
    compra_indevida: Number(pedido.compra_indevida) === 1,
    motivo_indevido: pedido.motivo_indevido,
    aviso_cliente: pedido.aviso_cliente,
    criado_em: pedido.criado_em,
    atualizado_em: pedido.atualizado_em,
    total_itens: Number(pedido.total_itens || 0),
    quantidade_total: Number(pedido.quantidade_total || 0)
  };
}

function normalizarItemPedido(item) {
  return {
    id: item.id,
    pedido_id: item.pedido_id,
    produto_id: item.produto_id,
    nome_snapshot: item.nome_snapshot,
    sku_snapshot: item.sku_snapshot,
    preco_unitario: Number(item.preco_unitario || 0),
    quantidade_solicitada: Number(item.quantidade_solicitada || 0),
    quantidade_disponivel: Number(item.quantidade_disponivel || 0),
    subtotal: Number(item.subtotal || 0),
    estoque_suficiente: Number(item.estoque_suficiente) === 1,
    produto_ativo: Number(item.produto_ativo) === 1,
    observacao: item.observacao,
    criado_em: item.criado_em
  };
}

async function listarPedidosDoUsuario(usuarioId) {
  const idUsuario = validarUsuarioId(usuarioId);

  const pedidos = await all(
    `
      SELECT
        pedidos.id,
        pedidos.usuario_id,
        pedidos.cliente_nome,
        pedidos.cliente_email,
        pedidos.cliente_telefone,
        pedidos.subtotal,
        pedidos.total,
        pedidos.status,
        pedidos.status_estoque,
        pedidos.compra_indevida,
        pedidos.motivo_indevido,
        pedidos.aviso_cliente,
        pedidos.criado_em,
        pedidos.atualizado_em,
        COUNT(pedido_itens.id) AS total_itens,
        COALESCE(SUM(pedido_itens.quantidade_solicitada), 0) AS quantidade_total
      FROM pedidos
      LEFT JOIN pedido_itens ON pedido_itens.pedido_id = pedidos.id
      WHERE pedidos.usuario_id = ?
      GROUP BY pedidos.id
      ORDER BY pedidos.criado_em DESC, pedidos.id DESC
    `,
    [idUsuario]
  );

  return pedidos.map(normalizarPedidoResumo);
}

async function listarItensPedido(pedidoId) {
  const idPedido = validarPedidoId(pedidoId);

  const itens = await all(
    `
      SELECT
        id,
        pedido_id,
        produto_id,
        nome_snapshot,
        sku_snapshot,
        preco_unitario,
        quantidade_solicitada,
        quantidade_disponivel,
        subtotal,
        estoque_suficiente,
        produto_ativo,
        observacao,
        criado_em
      FROM pedido_itens
      WHERE pedido_id = ?
      ORDER BY id ASC
    `,
    [idPedido]
  );

  return itens.map(normalizarItemPedido);
}

async function buscarPedidoDoUsuario(pedidoId, usuarioId) {
  const idPedido = validarPedidoId(pedidoId);
  const idUsuario = validarUsuarioId(usuarioId);

  const pedido = await get(
    `
      SELECT
        id,
        usuario_id,
        cliente_nome,
        cliente_email,
        cliente_telefone,
        subtotal,
        total,
        status,
        status_estoque,
        compra_indevida,
        motivo_indevido,
        aviso_cliente,
        criado_em,
        atualizado_em,
        0 AS total_itens,
        0 AS quantidade_total
      FROM pedidos
      WHERE id = ?
        AND usuario_id = ?
      LIMIT 1
    `,
    [idPedido, idUsuario]
  );

  if (!pedido) {
    throw criarErroNaoEncontrado("Pedido não encontrado.");
  }

  const itens = await listarItensPedido(idPedido);

  return {
    ...normalizarPedidoResumo({
      ...pedido,
      total_itens: itens.length,
      quantidade_total: itens.reduce((total, item) => {
        return total + item.quantidade_solicitada;
      }, 0)
    }),
    itens
  };
}

module.exports = {
  criarPedido,
  listarPedidosDoUsuario,
  buscarPedidoDoUsuario
};