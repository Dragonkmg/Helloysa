const fs = require("fs/promises");
const path = require("path");
const db = require("../DB/database");

const RAIZ_PROJETO = path.join(__dirname, "..");
const EXTENSOES_IMAGEM = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".svg"
]);

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

function criarErroNaoEncontrado(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 404;
  return erro;
}

function validarId(valor, nomeCampo = "ID") {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw criarErroValidacao(`${nomeCampo} inválido.`);
  }

  return id;
}

function normalizarTexto(valor) {
  return String(valor || "").trim();
}

function normalizarNumero(valor, padrao = 0) {
  if (valor === null || valor === undefined || valor === "") {
    return padrao;
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return padrao;
  }

  return numero;
}

function normalizarInteiro(valor, padrao = 0) {
  const numero = Number(valor);

  if (!Number.isInteger(numero)) {
    return padrao;
  }

  return numero;
}

function normalizarTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map(normalizarTexto)
      .filter(Boolean);
  }

  return String(tags || "")
    .split(",")
    .map(normalizarTexto)
    .filter(Boolean);
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

async function criarProduto(dados = {}) {
  const nome = normalizarTexto(dados.nome);
  const descricao = normalizarTexto(dados.descricao);
  const preco = normalizarNumero(dados.preco, NaN);
  const precoPromo = dados.preco_promo === "" || dados.preco_promo === null || dados.preco_promo === undefined
    ? null
    : normalizarNumero(dados.preco_promo, null);
  const qtd = normalizarInteiro(dados.qtd, 0);
  const sku = normalizarTexto(dados.sku);
  const ativo = Number(dados.ativo) === 0 ? 0 : 1;
  const tags = normalizarTags(dados.tags);

  if (!nome) {
    throw criarErroValidacao("Informe o nome do produto.");
  }

  if (!Number.isFinite(preco) || preco < 0) {
    throw criarErroValidacao("Informe um preço válido.");
  }

  if (precoPromo !== null && (!Number.isFinite(precoPromo) || precoPromo < 0)) {
    throw criarErroValidacao("Informe um preço promocional válido ou deixe vazio.");
  }

  if (qtd < 0) {
    throw criarErroValidacao("A quantidade não pode ser negativa.");
  }

  await run("BEGIN TRANSACTION");

  try {
    const resultadoProduto = await run(
      `
        INSERT INTO produtos (
          nome,
          descricao,
          preco,
          preco_promo,
          qtd,
          sku,
          ativo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nome,
        descricao,
        preco,
        precoPromo,
        qtd,
        sku,
        ativo
      ]
    );

    const produtoId = resultadoProduto.id;

    for (const tag of tags) {
      await run(
        `
          INSERT OR IGNORE INTO tags (nome)
          VALUES (?)
        `,
        [tag]
      );

      const tagCriada = await get(
        `
          SELECT id
          FROM tags
          WHERE nome = ?
          LIMIT 1
        `,
        [tag]
      );

      if (tagCriada) {
        await run(
          `
            INSERT OR IGNORE INTO produto_tags (
              produto_id,
              tag_id
            )
            VALUES (?, ?)
          `,
          [produtoId, tagCriada.id]
        );
      }
    }

    await run("COMMIT");

    return {
      id: produtoId,
      nome,
      descricao,
      preco,
      preco_promo: precoPromo,
      qtd,
      sku,
      ativo,
      tags,
      pasta_imagens: `HTML/assets/img/${produtoId}`
    };
  } catch (erro) {
    await run("ROLLBACK");
    throw erro;
  }
}

async function buscarProduto(id) {
  const produtoId = validarId(id, "ID do produto");

  const produto = await get(
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

  if (!produto) {
    throw criarErroNaoEncontrado("Produto não encontrado.");
  }

  return produto;
}

async function importarImagensProduto(id) {
  const produtoId = validarId(id, "ID do produto");
  const produto = await buscarProduto(produtoId);

  const pasta = path.join(
    RAIZ_PROJETO,
    "HTML",
    "assets",
    "img",
    String(produtoId)
  );

  let entradas;

  try {
    entradas = await fs.readdir(pasta, {
      withFileTypes: true
    });
  } catch (erro) {
    if (erro.code === "ENOENT") {
      throw criarErroNaoEncontrado(`Pasta não encontrada: HTML/assets/img/${produtoId}`);
    }

    throw erro;
  }

  const arquivos = entradas
    .filter((entrada) => entrada.isFile())
    .map((entrada) => entrada.name)
    .filter((nomeArquivo) => {
      const extensao = path.extname(nomeArquivo).toLowerCase();
      return EXTENSOES_IMAGEM.has(extensao);
    })
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  if (arquivos.length === 0) {
    throw criarErroValidacao(`Nenhuma imagem encontrada em HTML/assets/img/${produtoId}.`);
  }

  await run("BEGIN TRANSACTION");

  try {
    await run(
      `
        DELETE FROM produto_imagens
        WHERE produto_id = ?
      `,
      [produtoId]
    );

    for (let indice = 0; indice < arquivos.length; indice += 1) {
      const nomeArquivo = arquivos[indice];
      const caminho = `assets/img/${produtoId}/${nomeArquivo}`;

      await run(
        `
          INSERT INTO produto_imagens (
            produto_id,
            caminho,
            alt,
            ordem,
            principal
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          produtoId,
          caminho,
          `${produto.nome} imagem ${indice + 1}`,
          indice,
          indice === 0 ? 1 : 0
        ]
      );
    }

    await run("COMMIT");

    return {
      produto_id: produtoId,
      produto_nome: produto.nome,
      total: arquivos.length,
      imagens: arquivos.map((nomeArquivo, indice) => {
        return {
          arquivo: nomeArquivo,
          caminho: `assets/img/${produtoId}/${nomeArquivo}`,
          principal: indice === 0
        };
      })
    };
  } catch (erro) {
    await run("ROLLBACK");
    throw erro;
  }
}

async function listarPedidos({ somenteIndevidos = false, limite = 50 } = {}) {
  const limiteSeguro = Math.min(Math.max(Number(limite) || 50, 1), 200);

  const where = somenteIndevidos
    ? "WHERE pedidos.compra_indevida = 1"
    : "";

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
      ${where}
      GROUP BY pedidos.id
      ORDER BY pedidos.criado_em DESC, pedidos.id DESC
      LIMIT ?
    `,
    [limiteSeguro]
  );

  return pedidos.map(normalizarPedidoResumo);
}

async function buscarPedido(id) {
  const pedidoId = validarId(id, "ID do pedido");

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
        atualizado_em
      FROM pedidos
      WHERE id = ?
      LIMIT 1
    `,
    [pedidoId]
  );

  if (!pedido) {
    throw criarErroNaoEncontrado("Pedido não encontrado.");
  }

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
    [pedidoId]
  );

  const itensNormalizados = itens.map(normalizarItemPedido);

  return {
    ...normalizarPedidoResumo({
      ...pedido,
      total_itens: itensNormalizados.length,
      quantidade_total: itensNormalizados.reduce((total, item) => {
        return total + item.quantidade_solicitada;
      }, 0)
    }),
    itens: itensNormalizados
  };
}

module.exports = {
  criarProduto,
  importarImagensProduto,
  listarPedidos,
  buscarPedido
};