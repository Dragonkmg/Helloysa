const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const caminhoBanco = path.join(__dirname, "database.db");

const db = new sqlite3.Database(caminhoBanco, (err) => {
  if (err) {
    console.error("Erro ao conectar no banco:", err);
  } else {
    console.log("Banco conectado em:", caminhoBanco);
  }
});

db.run("PRAGMA foreign_keys = ON");

module.exports = db;