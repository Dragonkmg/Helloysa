
const express = require('express');
const router = express.Router();

const produtoDetalheController = require('../controllers/produtoDetalheController');

router.get('/:id', produtoDetalheController.buscarProdutoPorId);

module.exports = router;