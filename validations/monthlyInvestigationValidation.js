const { body } = require("express-validator");

const monthlyInvestigationValidation = {
  // Create investigation validation
  createInvestigation: [
    body("date").isISO8601().withMessage("Valid date is required"),
    body("scrPreHD")
      .optional()
      .isNumeric()
      .withMessage("SCR Pre-HD must be a number"),
    body("scrPostHD")
      .optional()
      .isNumeric()
      .withMessage("SCR Post-HD must be a number"),
    body("bu_pre_hd")
      .optional()
      .isNumeric()
      .withMessage("BU Pre-HD must be a number"),
    body("bu_post_hd")
      .optional()
      .isNumeric()
      .withMessage("BU Post-HD must be a number"),
    body("hb")
      .optional()
      .isNumeric()
      .withMessage("Hemoglobin must be a number"),
    body("serumNaPreHD")
      .optional()
      .isNumeric()
      .withMessage("Serum Na Pre-HD must be a number"),
    body("serumNaPostHD")
      .optional()
      .isNumeric()
      .withMessage("Serum Na Post-HD must be a number"),
    body("serumKPreHD")
      .optional()
      .isNumeric()
      .withMessage("Serum K Pre-HD must be a number"),
    body("serumKPostHD")
      .optional()
      .isNumeric()
      .withMessage("Serum K Post-HD must be a number"),
    body("sCa").optional().isNumeric().withMessage("S Ca must be a number"),
    body("sPhosphate")
      .optional()
      .isNumeric()
      .withMessage("S Phosphate must be a number"),
    body("albumin")
      .optional()
      .isNumeric()
      .withMessage("Albumin must be a number"),
    body("ua").optional().isNumeric().withMessage("UA must be a number"),
    body("hco").optional().isNumeric().withMessage("HCO must be a number"),
    body("al").optional().isNumeric().withMessage("AL must be a number"),
    body("hbA1C").optional().isNumeric().withMessage("HbA1C must be a number"),
    body("pth").optional().isNumeric().withMessage("PTH must be a number"),
    body("vitD").optional().isNumeric().withMessage("Vit D must be a number"),
    body("serumIron")
      .optional()
      .isNumeric()
      .withMessage("Serum Iron must be a number"),
    body("serumFerritin")
      .optional()
      .isNumeric()
      .withMessage("Serum Ferritin must be a number"),
    body("status")
      .optional()
      .isIn(["PENDING", "COMPLETED", "REVIEWED"])
      .withMessage("Invalid status"),
  ],

  // Update investigation validation
  updateInvestigation: [
    body("date").optional().isISO8601().withMessage("Valid date is required"),
    body("scrPreHD")
      .optional()
      .isNumeric()
      .withMessage("SCR Pre-HD must be a number"),
    body("scrPostHD")
      .optional()
      .isNumeric()
      .withMessage("SCR Post-HD must be a number"),
    body("bu_pre_hd")
      .optional()
      .isNumeric()
      .withMessage("BU Pre-HD must be a number"),
    body("bu_post_hd")
      .optional()
      .isNumeric()
      .withMessage("BU Post-HD must be a number"),
    body("hb")
      .optional()
      .isNumeric()
      .withMessage("Hemoglobin must be a number"),
    body("serumNaPreHD")
      .optional()
      .isNumeric()
      .withMessage("Serum Na Pre-HD must be a number"),
    body("serumNaPostHD")
      .optional()
      .isNumeric()
      .withMessage("Serum Na Post-HD must be a number"),
    body("serumKPreHD")
      .optional()
      .isNumeric()
      .withMessage("Serum K Pre-HD must be a number"),
    body("serumKPostHD")
      .optional()
      .isNumeric()
      .withMessage("Serum K Post-HD must be a number"),
    body("sCa").optional().isNumeric().withMessage("S Ca must be a number"),
    body("sPhosphate")
      .optional()
      .isNumeric()
      .withMessage("S Phosphate must be a number"),
    body("albumin")
      .optional()
      .isNumeric()
      .withMessage("Albumin must be a number"),
    body("ua").optional().isNumeric().withMessage("UA must be a number"),
    body("hco").optional().isNumeric().withMessage("HCO must be a number"),
    body("al").optional().isNumeric().withMessage("AL must be a number"),
    body("hbA1C").optional().isNumeric().withMessage("HbA1C must be a number"),
    body("pth").optional().isNumeric().withMessage("PTH must be a number"),
    body("vitD").optional().isNumeric().withMessage("Vit D must be a number"),
    body("serumIron")
      .optional()
      .isNumeric()
      .withMessage("Serum Iron must be a number"),
    body("serumFerritin")
      .optional()
      .isNumeric()
      .withMessage("Serum Ferritin must be a number"),
    body("status")
      .optional()
      .isIn(["PENDING", "COMPLETED", "REVIEWED"])
      .withMessage("Invalid status"),
  ],
};

module.exports = monthlyInvestigationValidation;
