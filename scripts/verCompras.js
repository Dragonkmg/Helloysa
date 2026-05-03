const fs = require("fs");
const path = require("path");
const db = require("../DB/database");

const caminhoSaida = path.join(__dirname, "saida-banco-compras.txt");

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (erro, rows) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(rows);
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

function fecharBanco() {
  return new Promise((resolve) => {
    db.close(() => resolve());
  });
}

function adicionarLinha(linhas, texto = "") {
  linhas.push(texto);
}

function adicionarSeparador(linhas, titulo) {
  adicionarLinha(linhas);
  adicionarLinha(linhas, "============================================================");
  adicionarLinha(linhas, titulo);
  adicionarLinha(linhas, "============================================================");
}

function formatarJson(valor) {
  return JSON.stringify(valor, null, 2);
}

function validarNomeTabela(nome) {
  return /^[a-zA-Z0-9_]+$/.test(nome);
}

async function tabelaExiste(nome) {
  const row = await get(
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
    `,
    [nome]
  );

  return !!row;
}

async function exportarTabela(linhas, nomeTabela, limite = 100) {
  adicionarSeparador(linhas, `TABELA: ${nomeTabela}`);

  if (!validarNomeTabela(nomeTabela)) {
    adicionarLinha(linhas, `Nome de tabela invalido: ${nomeTabela}`);
    return;
  }

  const existe = await tabelaExiste(nomeTabela);

  if (!existe) {
    adicionarLinha(linhas, `A tabela "${nomeTabela}" nao existe no banco.`);
    return;
  }

  const total = await get(`SELECT COUNT(*) AS total FROM ${nomeTabela}`);
  const colunas = await all(`PRAGMA table_info(${nomeTabela})`);

  adicionarLinha(linhas, `Total de registros: ${total.total}`);
  adicionarLinha(linhas);
  adicionarLinha(linhas, "Colunas:");
  adicionarLinha(linhas, formatarJson(colunas));

  const temColunaId = colunas.some((coluna) => coluna.name === "id");

  const sql = temColunaId
    ? `SELECT * FROM ${nomeTabela} ORDER BY id DESC LIMIT ?`
    : `SELECT * FROM ${nomeTabela} LIMIT ?`;

  const rows = await all(sql, [limite]);

  adicionarLinha(linhas);
  adicionarLinha(linhas, `Registros exibidos, limite ${limite}:`);
  adicionarLinha(linhas, formatarJson(rows));
}

async function exportarConsulta(linhas, titulo, sql, params = []) {
  adicionarSeparador(linhas, titulo);

  try {
    const rows = await all(sql, params);
    adicionarLinha(linhas, formatarJson(rows));
  } catch (erro) {
    adicionarLinha(linhas, `Erro ao executar consulta: ${erro.message}`);
  }
}

async function gerarRelatorio() {
  const linhas = [];

  adicionarLinha(linhas, "RELATORIO DO BANCO APOS COMPRA");
  adicionarLinha(linhas, `Gerado em: ${new Date().toLocaleString("pt-BR")}`);
  adicionarLinha(linhas, `Script: ${__filename}`);
  adicionarLinha(linhas, `Banco esperado: ${path.join(__dirname, "..", "DB", "database.db")}`);

  await exportarTabela(linhas, "produtos", 100);
  await exportarTabela(linhas, "produto_imagens", 100);
  await exportarTabela(linhas, "pedidos", 100);
  await exportarTabela(linhas, "pedido_itens", 200);

  const existePedidos = await tabelaExiste("pedidos");
  const existePedidoItens = await tabelaExiste("pedido_itens");

  if (existePedidos && existePedidoItens) {
    await exportarConsulta(
      linhas,
      "ULTIMOS PEDIDOS COM ITENS",
      `
        SELECT
          p.id AS pedido_id,
          p.cliente_nome,
          p.cliente_email,
          p.cliente_telefone,
          p.status,
          p.status_estoque,
          p.compra_indevida,
          p.motivo_indevido,
          p.aviso_cliente,
          p.subtotal AS pedido_subtotal,
          p.total AS pedido_total,
          p.criado_em AS pedido_criado_em,

          pi.id AS pedido_item_id,
          pi.produto_id,
          pi.nome_snapshot,
          pi.sku_snapshot,
          pi.preco_unitario,
          pi.quantidade_solicitada,
          pi.quantidade_disponivel,
          pi.subtotal AS item_subtotal,
          pi.estoque_suficiente,
          pi.produto_ativo,
          pi.observacao,
          pi.criado_em AS item_criado_em
        FROM pedidos p
        LEFT JOIN pedido_itens pi
          ON pi.pedido_id = p.id
        ORDER BY p.id DESC, pi.id ASC
        LIMIT 200
      `
    );

    await exportarConsulta(
      linhas,
      "RESUMO DOS PEDIDOS",
      `
        SELECT
          COUNT(*) AS total_pedidos,
          SUM(CASE WHEN compra_indevida = 1 THEN 1 ELSE 0 END) AS pedidos_indevidos,
          SUM(CASE WHEN compra_indevida = 0 THEN 1 ELSE 0 END) AS pedidos_validos,
          SUM(total) AS soma_total
        FROM pedidos
      `
    );
  } else {
    adicionarSeparador(linhas, "AVISO");
    adicionarLinha(
      linhas,
      "As tabelas pedidos e pedido_itens ainda nao existem. Rode o servidor depois de atualizar o DB/init.js."
    );
  }

  fs.writeFileSync(caminhoSaida, linhas.join("\n"), "utf8");

  console.log("Relatorio gerado com sucesso:");
  console.log(caminhoSaida);
}

gerarRelatorio()
  .catch((erro) => {
    console.error("Erro ao gerar relatorio:", erro);
  })
  .finally(async () => {
    await fecharBanco();
  });