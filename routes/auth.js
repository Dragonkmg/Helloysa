const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/cadastro", authController.cadastro);
router.post("/login", authController.login);
router.post("/logout", authMiddleware.obrigatorio, authController.logout);
router.get("/me", authMiddleware.obrigatorio, authController.me);

module.exports = router;