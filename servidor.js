require("./DB/init");

const express = require("express");
const cors = require("cors");
const path = require("path");

const produtosRoutes = require("./routes/produtos");
const produtoDetalheRoutes = require("./routes/produtoDetalhe");
const pedidosRoutes = require("./routes/pedidos");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Servir arquivos da pasta HTML
app.use(express.static(path.join(__dirname, "HTML")));

// Rotas da API
app.use("/produtos", produtosRoutes);
app.use("/produto", produtoDetalheRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/auth", authRoutes);

// Página inicial
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "HTML", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});