const express = require("express");
const router = express.Router();

const localOnlyMiddleware = require("../middlewares/localOnlyMiddleware");
const gerencialController = require("../controllers/gerencialController");

router.use(localOnlyMiddleware);

router.get("/", gerencialController.pagina);

router.get("/api/status", gerencialController.status);

router.get("/api/produtos", gerencialController.listarProdutos);
router.post("/api/produtos", gerencialController.criarProduto);

router.get("/api/produtos/:id", gerencialController.buscarProduto);
router.put("/api/produtos/:id", gerencialController.atualizarProduto);
router.patch("/api/produtos/:id/ativar", gerencialController.ativarProduto);
router.patch("/api/produtos/:id/desativar", gerencialController.desativarProduto);
router.delete("/api/produtos/:id", gerencialController.excluirProduto);
router.post("/api/produtos/:id/importar-imagens", gerencialController.importarImagensProduto);

router.get("/api/pedidos/indevidos", gerencialController.listarComprasIndevidas);
router.get("/api/pedidos", gerencialController.listarPedidos);
router.get("/api/pedidos/:id", gerencialController.buscarPedido);

module.exports = router;