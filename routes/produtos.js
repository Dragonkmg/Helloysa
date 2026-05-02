const express = require("express");
const router = express.Router();

const controller = require("../controllers/produtosController");

router.get("/", controller.listarProdutos);

module.exports = router;