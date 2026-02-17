const { validationResult } = require("express-validator");
const dialysisSessionService = require("../services/dialysisSessionService");

class DialysisSessionController {
  // @desc    Get all dialysis sessions for a patient
  // @route   GET /api/dialysis-sessions/:patientId
  // @access  Private
  async getPatientSessions(req, res) {
    try {
      const { patientId } = req.params;
      const queryParams = {
        page: req.query.page,
        limit: req.query.limit,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status,
      };

      const result = await dialysisSessionService.getPatientSessions(
        patientId,
        req.user.id,
        req.user.role,
        queryParams,
      );

      // Format response
      const formattedSessions = result.sessions.map((session) =>
        dialysisSessionService.formatSessionResponse(session),
      );

      res.json({
        success: true,
        sessions: formattedSessions,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      res.status(error.message === "Patient not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Get dialysis session by ID
  // @route   GET /api/dialysis-sessions/:patientId/:id
  // @access  Private
  async getSessionById(req, res) {
    try {
      const { patientId, id } = req.params;

      const session = await dialysisSessionService.getSessionById(
        patientId,
        id,
        req.user.id,
        req.user.role,
      );

      const formattedSession =
        dialysisSessionService.formatSessionResponse(session);

      res.json({
        success: true,
        session: formattedSession,
      });
    } catch (error) {
      const statusCode = error.message.includes("not found")
        ? 404
        : error.message.includes("Not authorized")
          ? 403
          : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Create new dialysis session
  // @route   POST /api/dialysis-sessions/:patientId
  // @access  Private/Nurse
  async createSession(req, res) {
    try {
      const { patientId } = req.params;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const session = await dialysisSessionService.createSession(
        patientId,
        req.body,
        req.user.id,
      );

      const formattedSession =
        dialysisSessionService.formatSessionResponse(session);

      res.status(201).json({
        success: true,
        message: "Dialysis session created successfully",
        session: formattedSession,
      });
    } catch (error) {
      res.status(error.message === "Patient not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Update dialysis session
  // @route   PUT /api/dialysis-sessions/:patientId/:id
  // @access  Private
  async updateSession(req, res) {
    try {
      const { patientId, id } = req.params;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const session = await dialysisSessionService.updateSession(
        patientId,
        id,
        req.body,
        req.user.id,
        req.user.role,
      );

      const formattedSession =
        dialysisSessionService.formatSessionResponse(session);

      res.json({
        success: true,
        message: "Dialysis session updated successfully",
        session: formattedSession,
      });
    } catch (error) {
      const statusCode = error.message.includes("not found")
        ? 404
        : error.message.includes("Not authorized")
          ? 403
          : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Complete dialysis session
  // @route   PUT /api/dialysis-sessions/:patientId/:id/complete
  // @access  Private/Nurse
  async completeSession(req, res) {
    try {
      const { patientId, id } = req.params;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const session = await dialysisSessionService.completeSession(
        patientId,
        id,
        req.body,
      );

      const formattedSession =
        dialysisSessionService.formatSessionResponse(session);

      res.json({
        success: true,
        message: "Dialysis session completed successfully",
        session: formattedSession,
      });
    } catch (error) {
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Delete dialysis session
  // @route   DELETE /api/dialysis-sessions/:patientId/:id
  // @access  Private (Doctor/Nurse)
  async deleteSession(req, res) {
    try {
      const { patientId, id } = req.params;

      await dialysisSessionService.deleteSession(patientId, id);

      res.status(200).json({
        success: true,
        message: "Dialysis session deleted successfully",
      });
    } catch (error) {
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  // @desc    Get dialysis session statistics
  // @route   GET /api/dialysis-sessions/stats/overview
  // @access  Private
  async getSessionStats(req, res) {
    try {
      const stats = await dialysisSessionService.getSessionStats(
        req.user.id,
        req.user.role,
      );

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }
}

module.exports = new DialysisSessionController();
