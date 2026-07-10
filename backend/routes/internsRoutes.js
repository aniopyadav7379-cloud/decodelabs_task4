const express = require("express");
const router = express.Router();
const controller = require("../controllers/internsController");
const requireAuth = require("../middleware/requireAuth");

// Static sub-paths must be declared before the "/:id" param route below,
// or Express would try to parse "export"/"bulk-delete" as an id.
router.get("/export", controller.exportInterns);
router.post("/bulk-delete", requireAuth, controller.bulkDeleteInterns);

// REST resource: nouns, not verbs — /interns, never /getInterns.
// Reads are public; writes require a logged-in session (requireAuth).
router.get("/", controller.listInterns);
router.get("/:id", controller.getIntern);
router.post("/", requireAuth, controller.createIntern);
router.put("/:id", requireAuth, controller.replaceIntern);
router.patch("/:id", requireAuth, controller.patchIntern);
router.delete("/:id", requireAuth, controller.deleteIntern);

module.exports = router;
