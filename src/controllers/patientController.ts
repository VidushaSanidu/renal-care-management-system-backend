import type { Request, Response } from "express";
import { validationResult } from "express-validator";

import PatientService from "../services/patientService.js";
import userService from "../services/userService.js";

/**
 * @desc Get all patients
 * @route GET /api/patients
 */
export const getPatients = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params as { id: string };
    const user = await userService.getUserById(id);
    const result = await PatientService.getAllPatients(user);

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
    const userId = req.user!.id;
    const patient = await PatientService.getPatientById(userId);

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
  req: Request,
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

    const { id } = req.params as { id: string };

    const patient = await PatientService.updatePatient(id, req.body);

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
    const { id } = req.params as { id: string };
    const result = await PatientService.deletePatient(id);

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

    const noteData = {
      content: req.body.content,
      type: req.body.type ?? "GENERAL",
      addedBy: req.user!.id,
    };
    const { id } = req.params as { id: string };

    const note = await PatientService.addNote(id, noteData);

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
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const user = await userService.getUserById(userId);
    const stats = await PatientService.getPatientStatistics(user);

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
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const query = req.query.q as string;
    const userId = req.user!.id;
    const user = await userService.getUserById(userId);
    const patients = await PatientService.searchPatients(query, user);

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
