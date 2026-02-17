const express = require("express");
const monthlyInvestigationController = require("../controllers/monthlyInvestigationController");
const monthlyInvestigationValidation = require("../validations/monthlyInvestigationValidation");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

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
 *           description: SCR pre HD
 *         scrPostHD:
 *           type: number
 *           description: SCR post HD
 *         bu_pre_hd:
 *           type: number
 *           description: BU pre HD (Blood Urea pre-dialysis)
 *         bu_post_hd:
 *           type: number
 *           description: BU post HD (Blood Urea post-dialysis)
 *         hb:
 *           type: number
 *           description: Hemoglobin
 *         serumNaPreHD:
 *           type: number
 *           description: Serum Na Pre-HD
 *         serumNaPostHD:
 *           type: number
 *           description: Serum Na Post-HD
 *         serumKPreHD:
 *           type: number
 *           description: Serum K Pre-HD
 *         serumKPostHD:
 *           type: number
 *           description: Serum K Post-HD
 *         sCa:
 *           type: number
 *           description: S Ca (Serum Calcium)
 *         sPhosphate:
 *           type: number
 *           description: S Phosphate
 *         albumin:
 *           type: number
 *           description: Albumin
 *         ua:
 *           type: number
 *           description: UA (Uric Acid)
 *         hco:
 *           type: number
 *           description: HCO (Bicarbonate)
 *         al:
 *           type: number
 *           description: AL (Alkaline Phosphatase)
 *         hbA1C:
 *           type: number
 *           description: HbA1C
 *         pth:
 *           type: number
 *           description: PTH (Parathyroid Hormone)
 *         vitD:
 *           type: number
 *           description: Vit D (Vitamin D)
 *         serumIron:
 *           type: number
 *           description: Serum iron (umol/l)
 *         serumFerritin:
 *           type: number
 *           description: Serum ferritin (ng/ml)
 *         notes:
 *           type: string
 *           description: Additional notes about the investigation
 *         status:
 *           type: string
 *           description: Investigation status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Routes
router.get(
  "/:patientId",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationController.getPatientInvestigations,
);
router.post(
  "/:patientId",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationValidation.createInvestigation,
  monthlyInvestigationController.createInvestigation,
);
router.get(
  "/:patientId/:id",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationController.getInvestigationById,
);
router.put(
  "/:patientId/:id",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationValidation.updateInvestigation,
  monthlyInvestigationController.updateInvestigation,
);
router.delete(
  "/:patientId/:id",
  protect,
  authorize("doctor", "nurse"),
  monthlyInvestigationController.deleteInvestigation,
);

module.exports = router;
