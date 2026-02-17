const express = require("express");
const {
  protect,
  authorize,
  checkPatientAssignment,
} = require("../middleware/auth");
const {
  validateCreatePatient,
  validateUpdatePatient,
  validatePatientNote,
  validateSearchQuery,
  validatePatientId,
} = require("../middleware/patientValidation");
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  addPatientNote,
  getPatientStats,
  searchPatients,
} = require("../controllers/patientController");

const router = express.Router();

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 total:
 *                   type: number
 *                 patients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 */
router.get("/", protect, authorize("doctor", "nurse"), getPatients);

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 */
router.get("/:id", protect, validatePatientId, getPatientById);

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePatient'
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error or patient ID already exists
 */
router.post(
  "/",
  protect,
  authorize("nurse", "doctor", "admin"),
  validateCreatePatient,
  createPatient,
);

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Update patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePatient'
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
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
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Delete patient (soft delete)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Patient not found
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validatePatientId,
  deletePatient,
);

/**
 * @swagger
 * /api/patients/{id}/notes:
 *   post:
 *     summary: Add note to patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Note content
 *               type:
 *                 type: string
 *                 enum: [GENERAL, MEDICAL, ADMINISTRATIVE]
 *                 description: Note type
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: Note added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 note:
 *                   $ref: '#/components/schemas/PatientNote'
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
 * @swagger
 * /api/patients/stats/overview:
 *   get:
 *     summary: Get patient statistics overview
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalPatients:
 *                       type: number
 *                     activePatients:
 *                       type: number
 *                     patientsByDialysisType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     patientsByGender:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     ageDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 */
router.get("/stats/overview", protect, getPatientStats);

/**
 * @swagger
 * /api/patients/search/query:
 *   get:
 *     summary: Search patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 patients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PatientSummary'
 *       400:
 *         description: Search query is required
 */
router.get("/search/query", protect, validateSearchQuery, searchPatients);

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         patientId:
 *           type: string
 *         name:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         bloodType:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *         contactNumber:
 *           type: string
 *         assignedDoctor:
 *           type: object
 *         assignedNurse:
 *           type: object
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         notes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PatientNote'
 *
 *     CreatePatient:
 *       type: object
 *       required:
 *         - patientId
 *         - name
 *         - dateOfBirth
 *         - gender
 *         - bloodType
 *         - contactNumber
 *         - assignedDoctor
 *       properties:
 *         patientId:
 *           type: string
 *         name:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         bloodType:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *         contactNumber:
 *           type: string
 *         assignedDoctor:
 *           type: string
 *         medicalHistory:
 *           type: object
 *           properties:
 *             renalDiagnosis:
 *               type: string
 *         dialysisInfo:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date
 *             accessType:
 *               type: string
 *               enum: [AVF, AVG, CENTRAL_CATHETER, PERITONEAL_CATHETER]
 *             dryWeight:
 *               type: number
 *
 *     UpdatePatient:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         bloodType:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *         contactNumber:
 *           type: string
 *
 *     PatientNote:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         content:
 *           type: string
 *         type:
 *           type: string
 *           enum: [GENERAL, MEDICAL, ADMINISTRATIVE]
 *         addedBy:
 *           type: object
 *         addedAt:
 *           type: string
 *           format: date-time
 *
 *     PatientSummary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         patientId:
 *           type: string
 *         name:
 *           type: string
 *         age:
 *           type: number
 *         gender:
 *           type: string
 *         status:
 *           type: string
 *         medicalHistory:
 *           type: object
 *           properties:
 *             renalDiagnosis:
 *               type: string
 */

module.exports = router;
