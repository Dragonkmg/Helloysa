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

module.exports = {
  criarPedido
};