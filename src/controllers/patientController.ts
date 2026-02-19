import { Request, Response } from "express";
import { validationResult } from "express-validator";
import PatientService from "../services/patientService.js";

/**
 * Extend Express Request to include authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * @desc Get all patients
 * @route GET /api/patients
 */
export const getPatients = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const result = await PatientService.getAllPatients(req.user);

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: message,
    });
  }
};

/**
 * @desc Get patient by ID
 */
export const getPatientById = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const patient = await PatientService.getPatientById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.json({
      success: true,
      patient,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: message,
    });
  }
};

/**
 * @desc Create patient
 */
export const createPatient = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const exists = await PatientService.checkPatientExists(req.body.patientId);

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Patient ID already exists",
      });
    }

    const patient = await PatientService.createPatient(req.body);

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
      error: message,
    });
  }
};

/**
 * @desc Update patient
 */
export const updatePatient = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const patient = await PatientService.updatePatient(req.params.id, req.body);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
      error: message,
    });
  }
};

/**
 * @desc Delete patient
 */
export const deletePatient = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const result = await PatientService.deletePatient(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.json({
      success: true,
      message: "Patient deactivated successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
      error: message,
    });
  }
};

/**
 * @desc Add patient note
 */
export const addPatientNote = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const noteData = {
      content: req.body.content,
      type: req.body.type ?? "GENERAL",
      addedBy: req.user!.id,
    };

    const note = await PatientService.addNote(req.params.id, noteData);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Note added successfully",
      note,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
      error: message,
    });
  }
};

/**
 * @desc Get stats
 */
export const getPatientStats = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const stats = await PatientService.getPatientStatistics(req.user);

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
      error: message,
    });
  }
};

/**
 * @desc Search patients
 */
export const searchPatients = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const query = req.query.q as string;

    const patients = await PatientService.searchPatients(query, req.user);

    return res.json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      success: false,
      message,
      error: message,
    });
  }
};
