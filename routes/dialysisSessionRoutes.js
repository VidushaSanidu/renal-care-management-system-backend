const express = require("express");
const dialysisSessionController = require("../controllers/dialysisSessionController");
const dialysisSessionValidation = require("../validations/dialysisSessionValidation");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Statistics route (must come before parameterized routes)
router.get(
  "/stats/overview",
  protect,
  authorize("doctor", "nurse"),
  dialysisSessionController.getSessionStats,
);

// Patient session routes
router.get(
  "/:patientId",
  protect,
  authorize("doctor", "nurse"),
  dialysisSessionController.getPatientSessions,
);
router.post(
  "/:patientId",
  protect,
  authorize("nurse", "doctor"),
  dialysisSessionValidation.createSession,
  dialysisSessionController.createSession,
);

// Individual session routes
router.get(
  "/:patientId/:id",
  protect,
  authorize("doctor", "nurse"),
  dialysisSessionController.getSessionById,
);
router.put(
  "/:patientId/:id",
  protect,
  authorize("doctor", "nurse"),
  dialysisSessionValidation.updateSession,
  dialysisSessionController.updateSession,
);
router.put(
  "/:patientId/:id/complete",
  protect,
  authorize("nurse", "doctor"),
  dialysisSessionValidation.completeSession,
  dialysisSessionController.completeSession,
);
router.delete(
  "/:patientId/:id",
  protect,
  authorize("doctor", "nurse"),
  dialysisSessionController.deleteSession,
);

module.exports = router;
