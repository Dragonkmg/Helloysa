const express = require("express");
const router = express.Router();

const pedidosController = require("../controllers/pedidosController");

router.post("/", pedidosController.criarPedido);

module.exports = router;