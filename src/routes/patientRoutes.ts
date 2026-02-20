import type { Router } from "express";
import express from "express";

import {
  protect,
  authorize,
  checkPatientAssignment,
} from "../middleware/auth.js";
import {
  validateCreatePatient,
  validateUpdatePatient,
  validatePatientNote,
  validateSearchQuery,
  validatePatientId,
} from "../middleware/patientValidation.js";
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  addPatientNote,
  getPatientStats,
  searchPatients,
} from "../controllers/patientController.js";

const router: Router = express.Router();

/**
 * Get all patients
 */
router.get("/", protect, authorize("doctor", "nurse"), getPatients);

/**
 * Get patient by ID
 */
router.get("/:id", protect, validatePatientId, getPatientById);

/**
 * Create patient
 */
router.post(
  "/",
  protect,
  authorize("nurse", "doctor", "admin"),
  validateCreatePatient,
  createPatient,
);

/**
 * Update patient
 */
router.put(
  "/:id",
  protect,
  checkPatientAssignment,
  validatePatientId,
  validateUpdatePatient,
  updatePatient,
);

/**
 * Delete patient (soft delete)
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validatePatientId,
  deletePatient,
);

/**
 * Add patient note
 */
router.post(
  "/:id/notes",
  protect,
  checkPatientAssignment,
  validatePatientId,
  validatePatientNote,
  addPatientNote,
);

/**
 * Patient statistics overview
 */
router.get("/stats/overview", protect, getPatientStats);

/**
 * Search patients
 */
router.get("/search/query", protect, validateSearchQuery, searchPatients);

export default router;
