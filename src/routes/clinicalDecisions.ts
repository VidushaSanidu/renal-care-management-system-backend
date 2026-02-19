import express, { Router, Request, Response } from "express";

import ClinicalDecision from "../models/ClinicalDecision.js";
import Patient from "../models/Patient.js";
import { protect } from "../middleware/auth.js";

const router: Router = express.Router();

// =========================
// Types
// =========================

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

interface DecisionQuery {
  patient?: string;
  type?: string;
  status?: string;
  priority?: string;
  doctorId?: string;
}

// =========================
// GET all decisions
// =========================

router.get("/", protect, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query: DecisionQuery = {};

    if (req.query.patient) query.patient = String(req.query.patient);

    if (req.query.type) query.type = String(req.query.type);

    if (req.query.status) query.status = String(req.query.status);

    if (req.query.priority) query.priority = String(req.query.priority);

    // Role restriction
    if (req.user.role === "DOCTOR") query.doctorId = req.user.id;

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
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// =========================
// GET decision by id
// =========================

router.get("/:id", protect, async (req: Request, res: Response) => {
  try {
    const decision = await ClinicalDecision.findById(req.params.id)
      .populate("patient", "name patientId")
      .populate("doctorId", "name")
      .populate("implementedBy", "name");

    if (!decision)
      return res.status(404).json({
        message: "Clinical decision not found",
      });

    if (req.user.role === "DOCTOR" && decision.id !== req.user.id)
      return res.status(403).json({
        message: "Access denied",
      });

    res.json(decision);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// =========================
// CREATE decision
// =========================

router.post("/", protect, async (req: Request, res: Response) => {
  try {
    if (!["doctor", "admin"].includes(req.user.role))
      return res.status(403).json({
        message: "Access denied",
      });

    const patient = await Patient.findById(req.body.patient);

    if (!patient)
      return res.status(400).json({
        message: "Patient not found",
      });

    if (!req.body.doctorId) req.body.doctorId = req.user.id;

    const decision = await ClinicalDecision.create(req.body);

    const populatedDecision = await ClinicalDecision.findById(decision._id)
      .populate("patient", "name patientId")
      .populate("doctorId", "name");

    res.status(201).json(populatedDecision);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// =========================
// UPDATE decision
// =========================

router.put("/:id", protect, async (req: Request, res: Response) => {
  try {
    const decision = await ClinicalDecision.findById(req.params.id);

    if (!decision)
      return res.status(404).json({
        message: "Clinical decision not found",
      });

    if (req.user.role === "doctor" && decision.id !== req.user.id)
      return res.status(403).json({
        message: "Access denied",
      });

    const updatedDecision = await ClinicalDecision.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("patient", "name patientId")
      .populate("doctorId", "name")
      .populate("implementedBy", "name");

    res.json(updatedDecision);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// =========================
// DELETE decision
// =========================

router.delete("/:id", protect, async (req: Request, res: Response) => {
  try {
    const decision = await ClinicalDecision.findById(req.params.id);

    if (!decision)
      return res.status(404).json({
        message: "Clinical decision not found",
      });

    if (req.user.role === "doctor" && decision.id !== req.user.id)
      return res.status(403).json({
        message: "Access denied",
      });

    await ClinicalDecision.findByIdAndDelete(req.params.id);

    res.json({
      message: "Clinical decision deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// =========================
// IMPLEMENT decision
// =========================

router.patch("/:id/implement", protect, async (req: Request, res: Response) => {
  try {
    const decision = await ClinicalDecision.findById(req.params.id);

    if (!decision)
      return res.status(404).json({
        message: "Clinical decision not found",
      });

    const updateData: any = {
      status: "implemented",
      implementedBy: req.user.id,
      implementedAt: new Date(),
    };

    if (req.body.notes) updateData.notes = req.body.notes;

    const updatedDecision = await ClinicalDecision.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    )
      .populate("patient", "name patientId")
      .populate("doctorId", "name")
      .populate("implementedBy", "name");

    res.json(updatedDecision);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
});

export default router;
