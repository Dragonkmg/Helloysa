const express = require("express");
const router = express.Router();

const pedidosController = require("../controllers/pedidosController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware.obrigatorio, pedidosController.criarPedido);

module.exports = router;