import express, { Router } from "express";

import dialysisSessionController from "../controllers/dialysisSessionController.js";
import dialysisSessionValidation from "../validations/dialysisSessionValidation.js";

import { protect, authorize } from "../middleware/auth.js";

const router: Router = express.Router();

/**
 * Statistics route
 * Must come before parameterized routes
 */
router.get(
  "/stats/overview",
  protect,
  authorize("doctor", "nurse"),
  dialysisSessionController.getSessionStats,
);

/**
 * Patient session routes
 */
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

/**
 * Individual session routes
 */
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

export default router;
