const express = require("express");
const router = express.Router();

const pedidosController = require("../controllers/pedidosController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/me", authMiddleware.obrigatorio, pedidosController.listarMe);
router.get("/:id", authMiddleware.obrigatorio, pedidosController.buscarMeuPedido);
router.post("/", authMiddleware.obrigatorio, pedidosController.criarPedido);

module.exports = router;