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
});