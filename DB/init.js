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
});