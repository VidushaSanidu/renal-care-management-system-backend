import express, { Router } from "express";

import monthlyInvestigationController from "../controllers/monthlyInvestigationController.js";
import monthlyInvestigationValidation from "../validations/monthlyInvestigationValidation.js";

import { protect, authorize } from "../middleware/auth.js";

const router: Router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MonthlyInvestigation:
 *       type: object
 *       required:
 *         - patient
 *         - date
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the monthly investigation
 *         patientId:
 *           type: string
 *           description: The id of the patient
 *         date:
 *           type: string
 *           format: date
 *           description: The date of the investigation
 *         scrPreHD:
 *           type: number
 *         scrPostHD:
 *           type: number
 *         bu_pre_hd:
 *           type: number
 *         bu_post_hd:
 *           type: number
 *         hb:
 *           type: number
 *         serumNaPreHD:
 *           type: number
 *         serumNaPostHD:
 *           type: number
 *         serumKPreHD:
 *           type: number
 *         serumKPostHD:
 *           type: number
 *         sCa:
 *           type: number
 *         sPhosphate:
 *           type: number
 *         albumin:
 *           type: number
 *         ua:
 *           type: number
 *         hco:
 *           type: number
 *         al:
 *           type: number
 *         hbA1C:
 *           type: number
 *         pth:
 *           type: number
 *         vitD:
 *           type: number
 *         serumIron:
 *           type: number
 *         serumFerritin:
 *           type: number
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * Get all investigations for a patient
 */
router.get(
  "/:patientId",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationController.getPatientInvestigations,
);

/**
 * Create investigation
 */
router.post(
  "/:patientId",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationValidation.createInvestigation,
  monthlyInvestigationController.createInvestigation,
);

/**
 * Get single investigation
 */
router.get(
  "/:patientId/:id",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationController.getInvestigationById,
);

/**
 * Update investigation
 */
router.put(
  "/:patientId/:id",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationValidation.updateInvestigation,
  monthlyInvestigationController.updateInvestigation,
);

/**
 * Delete investigation
 */
router.delete(
  "/:patientId/:id",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationController.deleteInvestigation,
);

export default router;
