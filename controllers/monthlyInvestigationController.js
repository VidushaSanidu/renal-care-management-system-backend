const { validationResult } = require("express-validator");
const monthlyInvestigationService = require("../services/monthlyInvestigationService");

class MonthlyInvestigationController {
  /**
   * @desc    Get all monthly investigations for a patient
   * @route   GET /api/monthly-investigations/:patientId
   * @access  Private
   */
  async getPatientInvestigations(req, res) {
    try {
      const { patientId } = req.params;
      const queryParams = {
        page: req.query.page,
        limit: req.query.limit,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await monthlyInvestigationService.getPatientInvestigations(
        patientId,
        queryParams,
      );

      // Format response
      const formattedInvestigations = result.investigations.map((inv) =>
        monthlyInvestigationService.formatInvestigationResponse(inv),
      );

      res.json({
        investigations: formattedInvestigations,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      res.status(error.message === "Patient not found" ? 404 : 500).json({
        message: error.message || "Server error",
      });
    }
  }

  /**
   * @desc    Create a new monthly investigation for a patient
   * @route   POST /api/monthly-investigations/:patientId
   * @access  Private (Doctor/Nurse)
   */
  async createInvestigation(req, res) {
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

      const investigation =
        await monthlyInvestigationService.createInvestigation(
          patientId,
          req.body,
          req.user.id,
        );

      const formattedInvestigation =
        monthlyInvestigationService.formatInvestigationResponse(investigation);

      res.status(201).json(formattedInvestigation);
    } catch (error) {
      res.status(error.message === "Patient not found" ? 404 : 400).json({
        message: error.message || "Server error",
      });
    }
  }

  /**
   * @desc    Get a specific monthly investigation
   * @route   GET /api/monthly-investigations/:patientId/:id
   * @access  Private
   */
  async getInvestigationById(req, res) {
    try {
      const { patientId, id } = req.params;

      const investigation =
        await monthlyInvestigationService.getInvestigationById(patientId, id);

      const formattedInvestigation =
        monthlyInvestigationService.formatInvestigationResponse(investigation);

      res.json(formattedInvestigation);
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 500;
      res.status(statusCode).json({
        message: error.message || "Server error",
      });
    }
  }

  /**
   * @desc    Update a monthly investigation
   * @route   PUT /api/monthly-investigations/:patientId/:id
   * @access  Private (Doctor/Nurse)
   */
  async updateInvestigation(req, res) {
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

      const investigation =
        await monthlyInvestigationService.updateInvestigation(
          patientId,
          id,
          req.body,
        );

      const formattedInvestigation =
        monthlyInvestigationService.formatInvestigationResponse(investigation);

      res.json(formattedInvestigation);
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        message: error.message || "Server error",
      });
    }
  }

  /**
   * @desc    Delete a monthly investigation
   * @route   DELETE /api/monthly-investigations/:patientId/:id
   * @access  Private (Doctor/Nurse)
   */
  async deleteInvestigation(req, res) {
    try {
      const { patientId, id } = req.params;

      await monthlyInvestigationService.deleteInvestigation(patientId, id);

      res
        .status(200)
        .json({ message: "Monthly investigation deleted successfully" });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 500;
      res.status(statusCode).json({
        message: error.message || "Server error",
      });
    }
  }
}

module.exports = new MonthlyInvestigationController();
