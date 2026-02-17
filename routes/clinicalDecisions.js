const express = require("express");
const router = express.Router();
const ClinicalDecision = require("../models/ClinicalDecision");
const Patient = require("../models/Patient");
const auth = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     ClinicalDecision:
 *       type: object
 *       required:
 *         - patient
 *         - type
 *         - decision
 *         - doctorId
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the clinical decision
 *         patient:
 *           type: string
 *           description: The id of the patient
 *         type:
 *           type: string
 *           enum: [medication, dialysis_adjustment, treatment_plan, dietary_advice, follow_up]
 *           description: The type of clinical decision
 *         decision:
 *           type: string
 *           description: The clinical decision details
 *         reasoning:
 *           type: string
 *           description: The reasoning behind the decision
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: The priority level of the decision
 *         status:
 *           type: string
 *           enum: [pending, implemented, cancelled]
 *           description: The implementation status of the decision
 *         relatedData:
 *           type: object
 *           description: Related data that influenced the decision
 *         followUpDate:
 *           type: string
 *           format: date
 *           description: The date for follow-up if applicable
 *         doctorId:
 *           type: string
 *           description: The id of the doctor who made the decision
 *         implementedBy:
 *           type: string
 *           description: The id of the staff member who implemented the decision
 *         implementedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the decision was implemented
 *         notes:
 *           type: string
 *           description: Additional notes about the decision
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/clinical-decisions:
 *   get:
 *     summary: Get all clinical decisions
 *     tags: [Clinical Decisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *         description: Filter by patient ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [medication, dialysis_adjustment, treatment_plan, dietary_advice, follow_up]
 *         description: Filter by decision type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, implemented, cancelled]
 *         description: Filter by decision status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority level
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Clinical decisions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 decisions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClinicalDecision'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", auth.protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    if (req.query.patient) {
      query.patient = req.query.patient;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Role-based access control
    if (req.user.role === "doctor") {
      query.doctorId = req.user.id;
    }

    const decisions = await ClinicalDecision.find(query)
      .populate("patient", "name patientId")
      .populate("doctorId", "name")
      .populate("implementedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ClinicalDecision.countDocuments(query);

    res.json({
      decisions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/clinical-decisions/{id}:
 *   get:
 *     summary: Get a clinical decision by ID
 *     tags: [Clinical Decisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The clinical decision ID
 *     responses:
 *       200:
 *         description: Clinical decision retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClinicalDecision'
 *       404:
 *         description: Clinical decision not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/:id", auth.protect, async (req, res) => {
  try {
    const decision = await ClinicalDecision.findById(req.params.id)
      .populate("patient", "name patientId")
      .populate("doctorId", "name")
      .populate("implementedBy", "name");

    if (!decision) {
      return res.status(404).json({ message: "Clinical decision not found" });
    }

    // Role-based access control
    if (
      req.user.role === "doctor" &&
      decision.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(decision);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/clinical-decisions:
 *   post:
 *     summary: Create a new clinical decision
 *     tags: [Clinical Decisions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClinicalDecision'
 *     responses:
 *       201:
 *         description: Clinical decision created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClinicalDecision'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", auth.protect, async (req, res) => {
  try {
    // Check if user can create decisions
    if (req.user.role !== "doctor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify patient exists
    const patient = await Patient.findById(req.body.patient);
    if (!patient) {
      return res.status(400).json({ message: "Patient not found" });
    }

    // Set doctor ID if not provided
    if (!req.body.doctorId) {
      req.body.doctorId = req.user.id;
    }

    const decision = new ClinicalDecision(req.body);
    await decision.save();

    const populatedDecision = await ClinicalDecision.findById(decision._id)
      .populate("patient", "name patientId")
      .populate("doctorId", "name");

    res.status(201).json(populatedDecision);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/clinical-decisions/{id}:
 *   put:
 *     summary: Update a clinical decision
 *     tags: [Clinical Decisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The clinical decision ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClinicalDecision'
 *     responses:
 *       200:
 *         description: Clinical decision updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClinicalDecision'
 *       404:
 *         description: Clinical decision not found
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put("/:id", auth.protect, async (req, res) => {
  try {
    const decision = await ClinicalDecision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ message: "Clinical decision not found" });
    }

    // Role-based access control
    if (
      req.user.role === "doctor" &&
      decision.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedDecision = await ClinicalDecision.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    )
      .populate("patient", "name patientId")
      .populate("doctorId", "name")
      .populate("implementedBy", "name");

    res.json(updatedDecision);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/clinical-decisions/{id}:
 *   delete:
 *     summary: Delete a clinical decision
 *     tags: [Clinical Decisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The clinical decision ID
 *     responses:
 *       200:
 *         description: Clinical decision deleted successfully
 *       404:
 *         description: Clinical decision not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete("/:id", auth.protect, async (req, res) => {
  try {
    const decision = await ClinicalDecision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ message: "Clinical decision not found" });
    }

    // Role-based access control
    if (
      req.user.role === "doctor" &&
      decision.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await ClinicalDecision.findByIdAndDelete(req.params.id);

    res.json({ message: "Clinical decision deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/clinical-decisions/{id}/implement:
 *   patch:
 *     summary: Mark a clinical decision as implemented
 *     tags: [Clinical Decisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The clinical decision ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Implementation notes
 *     responses:
 *       200:
 *         description: Clinical decision marked as implemented
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClinicalDecision'
 *       404:
 *         description: Clinical decision not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch("/:id/implement", auth.protect, async (req, res) => {
  try {
    const decision = await ClinicalDecision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ message: "Clinical decision not found" });
    }

    // Update implementation details
    const updateData = {
      status: "implemented",
      implementedBy: req.user.id,
      implementedAt: new Date(),
    };

    if (req.body.notes) {
      updateData.notes = req.body.notes;
    }

    const updatedDecision = await ClinicalDecision.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    )
      .populate("patient", "name patientId")
      .populate("doctorId", "name")
      .populate("implementedBy", "name");

    res.json(updatedDecision);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/clinical-decisions/patient/{patientId}:
 *   get:
 *     summary: Get clinical decisions for a specific patient
 *     tags: [Clinical Decisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The patient ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, implemented, cancelled]
 *         description: Filter by decision status
 *     responses:
 *       200:
 *         description: Patient decisions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ClinicalDecision'
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 */
router.get("/patient/:patientId", auth.protect, async (req, res) => {
  try {
    // Verify patient exists
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const query = { patient: req.params.patientId };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const decisions = await ClinicalDecision.find(query)
      .populate("doctorId", "name")
      .populate("implementedBy", "name")
      .sort({ createdAt: -1 });

    res.json(decisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/clinical-decisions/pending:
 *   get:
 *     summary: Get pending clinical decisions
 *     tags: [Clinical Decisions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority level
 *     responses:
 *       200:
 *         description: Pending decisions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ClinicalDecision'
 *       401:
 *         description: Unauthorized
 */
router.get("/pending", auth.protect, async (req, res) => {
  try {
    const query = { status: "pending" };

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Role-based access control
    if (req.user.role === "doctor") {
      query.doctorId = req.user.id;
    }

    const decisions = await ClinicalDecision.find(query)
      .populate("patient", "name patientId")
      .populate("doctorId", "name")
      .sort({ priority: -1, createdAt: -1 });

    res.json(decisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/clinical-decisions/stats:
 *   get:
 *     summary: Get clinical decision statistics
 *     tags: [Clinical Decisions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Decision statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDecisions:
 *                   type: integer
 *                 pendingDecisions:
 *                   type: integer
 *                 implementedDecisions:
 *                   type: integer
 *                 urgentDecisions:
 *                   type: integer
 *                 decisionsByType:
 *                   type: object
 *                 decisionsByPriority:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/stats", auth.protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "doctor") {
      query.doctorId = req.user.id;
    }

    const totalDecisions = await ClinicalDecision.countDocuments(query);
    const pendingDecisions = await ClinicalDecision.countDocuments({
      ...query,
      status: "pending",
    });
    const implementedDecisions = await ClinicalDecision.countDocuments({
      ...query,
      status: "implemented",
    });
    const urgentDecisions = await ClinicalDecision.countDocuments({
      ...query,
      priority: "urgent",
    });

    // Get decisions by type
    const decisionsByType = await ClinicalDecision.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get decisions by priority
    const decisionsByPriority = await ClinicalDecision.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalDecisions,
      pendingDecisions,
      implementedDecisions,
      urgentDecisions,
      decisionsByType: decisionsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      decisionsByPriority: decisionsByPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
