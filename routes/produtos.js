const express = require("express");
const router = express.Router();
const controller = require("../controllers/produtosController");

router.get("/", controller.listarProdutos);
router.get("/:id", controller.buscarProdutoPorId);

module.exports = router;