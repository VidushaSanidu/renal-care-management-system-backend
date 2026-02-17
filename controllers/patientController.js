const { validationResult } = require("express-validator");
const PatientService = require("../services/patientService");

/**
 * @desc    Get all patients
 * @route   GET /api/patients
 * @access  Private
 */
const getPatients = async (req, res) => {
  try {
    const result = await PatientService.getAllPatients(req.user);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get patient by ID
 * @route   GET /api/patients/:id
 * @access  Private
 */
const getPatientById = async (req, res) => {
  try {
    const patient = await PatientService.getPatientById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Create new patient
 * @route   POST /api/patients
 * @access  Private/Nurse/Doctor/Admin
 */
const createPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const existingPatient = await PatientService.checkPatientExists(
      req.body.patientId,
    );
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient ID already exists",
      });
    }

    const patient = await PatientService.createPatient(req.body);

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Update patient
 * @route   PUT /api/patients/:id
 * @access  Private
 */
const updatePatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
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

    res.json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete patient
 * @route   DELETE /api/patients/:id
 * @access  Private/Admin
 */
const deletePatient = async (req, res) => {
  try {
    const result = await PatientService.deletePatient(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Patient deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Add note to patient
 * @route   POST /api/patients/:id/notes
 * @access  Private
 */
const addPatientNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const noteData = {
      content: req.body.content,
      type: req.body.type || "GENERAL",
      addedBy: req.user.id,
    };

    const note = await PatientService.addNote(req.params.id, noteData);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(201).json({
      success: true,
      message: "Note added successfully",
      note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get patient statistics
 * @route   GET /api/patients/stats/overview
 * @access  Private
 */
const getPatientStats = async (req, res) => {
  try {
    const stats = await PatientService.getPatientStatistics(req.user);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Search patients
 * @route   GET /api/patients/search
 * @access  Private
 */
const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    const patients = await PatientService.searchPatients(q, req.user);

    res.json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  addPatientNote,
  getPatientStats,
  searchPatients,
};
