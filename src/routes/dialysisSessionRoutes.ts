import type { Router } from "express";
import express from "express";

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
  authorize("DOCTOR", "NURSE"),
  dialysisSessionController.getSessionStats,
);

/**
 * Patient session routes
 */
router.get(
  "/:patientId",
  protect,
  authorize("DOCTOR", "NURSE"),
  dialysisSessionController.getPatientSessions,
);

router.post(
  "/:patientId",
  protect,
  authorize("DOCTOR", "NURSE"),
  dialysisSessionValidation.createSession,
  dialysisSessionController.createSession,
);

/**
 * Individual session routes
 */
router.get(
  "/:patientId/:id",
  protect,
  authorize("DOCTOR", "NURSE"),
  dialysisSessionController.getSessionById,
);

router.put(
  "/:patientId/:id",
  protect,
  authorize("DOCTOR", "NURSE"),
  dialysisSessionValidation.updateSession,
  dialysisSessionController.updateSession,
);

router.put(
  "/:patientId/:id/complete",
  protect,
  authorize("DOCTOR", "NURSE"),
  dialysisSessionValidation.completeSession,
  dialysisSessionController.completeSession,
);

router.delete(
  "/:patientId/:id",
  protect,
  authorize("DOCTOR", "NURSE"),
  dialysisSessionController.deleteSession,
);

export default router;
