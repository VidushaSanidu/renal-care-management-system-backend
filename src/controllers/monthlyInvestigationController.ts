import { Request, Response } from "express";
import { validationResult } from "express-validator";
import monthlyInvestigationService from "../services/monthlyInvestigationService.js";
import type { InvestigationQueryParams } from "../services/monthlyInvestigationService.js";

class MonthlyInvestigationController {
  /**
   * @desc Get all investigations for patient
   * @route GET /api/monthly-investigations/:patientId
   */
  async getPatientInvestigations(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { patientId } = req.params as { patientId: string };

      const queryParams: InvestigationQueryParams = {
        page: req.query.page as string,
        limit: req.query.limit as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await monthlyInvestigationService.getPatientInvestigations(
        patientId,
        queryParams,
      );

      const formattedInvestigations = result.investigations.map(
        (inv: unknown) =>
          monthlyInvestigationService.formatInvestigationResponse(inv),
      );

      return res.json({
        success: true,
        investigations: formattedInvestigations,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(message === "Patient not found" ? 404 : 500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Create investigation
   * @route POST /api/monthly-investigations/:patientId
   */
  async createInvestigation(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params as { patientId: string };

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
          req.user!.id,
        );

      const formattedInvestigation =
        monthlyInvestigationService.formatInvestigationResponse(investigation);

      return res.status(201).json({
        success: true,
        investigation: formattedInvestigation,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(message === "Patient not found" ? 404 : 400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Get investigation by ID
   */
  async getInvestigationById(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, id } = req.params as { patientId: string; id: string };

      const investigation =
        await monthlyInvestigationService.getInvestigationById(patientId, id);

      const formattedInvestigation =
        monthlyInvestigationService.formatInvestigationResponse(investigation);

      return res.json({
        success: true,
        investigation: formattedInvestigation,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      const statusCode = message.includes("not found") ? 404 : 500;

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Update investigation
   */
  async updateInvestigation(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, id } = req.params as { patientId: string; id: string };

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

      return res.json({
        success: true,
        investigation: formattedInvestigation,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      const statusCode = message.includes("not found") ? 404 : 400;

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Delete investigation
   */
  async deleteInvestigation(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, id } = req.params as { patientId: string; id: string };

      await monthlyInvestigationService.deleteInvestigation(patientId, id);

      return res.json({
        success: true,
        message: "Monthly investigation deleted successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      const statusCode = message.includes("not found") ? 404 : 500;

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
}

export default new MonthlyInvestigationController();
