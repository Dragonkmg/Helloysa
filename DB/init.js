const db = require("./database");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            preco REAL NOT NULL,
            preco_promo REAL,
            qtd INTEGER DEFAULT 0 CHECK(qtd >= 0),
            item_pai INTEGER REFERENCES produtos(id),
            variacao TEXT,
            imagem TEXT,
            sku TEXT,
            ativo INTEGER DEFAULT 1,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS produto_tags (
            produto_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (produto_id, tag_id),
            FOREIGN KEY (produto_id) REFERENCES produtos(id),
            FOREIGN KEY (tag_id) REFERENCES tags(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS produto_imagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            caminho TEXT NOT NULL,
            alt TEXT,
            ordem INTEGER DEFAULT 0,
            principal INTEGER DEFAULT 0,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (produto_id) REFERENCES produtos(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS comentarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            nome_usuario TEXT NOT NULL,
            nota INTEGER NOT NULL CHECK(nota >= 1 AND nota <= 5),
            comentario TEXT NOT NULL,
            ativo INTEGER DEFAULT 1,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (produto_id) REFERENCES produtos(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            cliente_nome TEXT,
            cliente_email TEXT,
            cliente_telefone TEXT,

            subtotal REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,

            status TEXT NOT NULL DEFAULT 'pendente',
            status_estoque TEXT NOT NULL DEFAULT 'ok',

            compra_indevida INTEGER NOT NULL DEFAULT 0,
            motivo_indevido TEXT,
            aviso_cliente TEXT,

            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS pedido_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            pedido_id INTEGER NOT NULL,
            produto_id INTEGER,

            nome_snapshot TEXT NOT NULL,
            sku_snapshot TEXT,
            preco_unitario REAL NOT NULL DEFAULT 0,

            quantidade_solicitada INTEGER NOT NULL,
            quantidade_disponivel INTEGER NOT NULL DEFAULT 0,

            subtotal REAL NOT NULL DEFAULT 0,

            estoque_suficiente INTEGER NOT NULL DEFAULT 1,
            produto_ativo INTEGER NOT NULL DEFAULT 1,
            observacao TEXT,

            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
            FOREIGN KEY (produto_id) REFERENCES produtos(id)
        )
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_produtos_ativo
        ON produtos(ativo)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_produto_tags_produto
        ON produto_tags(produto_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_produto_tags_tag
        ON produto_tags(tag_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_produto_imagens_produto
        ON produto_imagens(produto_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_comentarios_produto
        ON comentarios(produto_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_pedidos_status
        ON pedidos(status)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_pedidos_compra_indevida
        ON pedidos(compra_indevida)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido
        ON pedido_itens(pedido_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto
        ON pedido_itens(produto_id)
    `);
});