const express = require("express");
const router = express.Router();
const controller = require("../controllers/internsController");

// REST resource: nouns, not verbs — /interns, never /getInterns
router.get("/", controller.listInterns);
router.get("/:id", controller.getIntern);
router.post("/", controller.createIntern);
router.put("/:id", controller.replaceIntern);
router.patch("/:id", controller.patchIntern);
router.delete("/:id", controller.deleteIntern);

module.exports = router;
