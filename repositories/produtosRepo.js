const db = require("../DB/database");

function buscarProdutos({ busca = "", tag = "" } = {}) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT DISTINCT pai.*
            FROM produtos p
            LEFT JOIN produto_tags pt ON p.id = pt.produto_id
            LEFT JOIN tags t ON t.id = pt.tag_id
            JOIN produtos pai
                ON pai.id = COALESCE(NULLIF(p.item_pai, ''), p.id)
            WHERE
                p.ativo = 1
                AND pai.ativo = 1
        `;

        const params = [];

        if (busca) {
            query += `
                AND (
                    p.nome LIKE ?
                    OR p.descricao LIKE ?
                    OR t.nome LIKE ?
                )
            `;

            params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
        }

        if (tag) {
            query += `
                AND EXISTS (
                    SELECT 1
                    FROM produto_tags pt2
                    JOIN tags t2 ON t2.id = pt2.tag_id
                    WHERE pt2.produto_id = p.id
                    AND t2.nome = ?
                )
            `;

            params.push(tag);
        }

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error("Erro na busca:", err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    buscarProdutos
};