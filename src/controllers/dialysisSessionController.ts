import type { Request, Response } from "express";
import { validationResult } from "express-validator";

import dialysisSessionService from "../services/dialysisSessionService.js";
import type { SessionQueryParams } from "../services/dialysisSessionService.js";
import type { IDialysisSession } from "../models/DialysisSession.js";

class DialysisSessionController {
  /**
   * @desc Get all dialysis sessions for a patient
   */
  async getPatientSessions(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params as { patientId: string };

      const queryParams: SessionQueryParams = {
        page: req.query.page ? Number(req.query.page) : 0,
        limit: req.query.limit ? Number(req.query.limit) : 0,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        status: req.query.status as string,
      };

      const result = await dialysisSessionService.getPatientSessions(
        patientId,
        req.user!.id,
        req.user!.role,
        queryParams,
      );

      const formattedSessions = result.sessions.map(
        (session: IDialysisSession) =>
          dialysisSessionService.formatSessionResponse(session),
      );

      return res.json({
        success: true,
        sessions: formattedSessions,
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
   * @desc Get dialysis session by ID
   */
  async getSessionById(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, id } = req.params as { patientId: string; id: string };

      const session = await dialysisSessionService.getSessionById(
        patientId,
        id,
        req.user!.id,
        req.user!.role,
      );

      const formattedSession =
        dialysisSessionService.formatSessionResponse(session);

      return res.json({
        success: true,
        session: formattedSession,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      const statusCode = message.includes("not found")
        ? 404
        : message.includes("Not authorized")
          ? 403
          : 500;

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Create session
   */
  async createSession(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params as { patientId: string };

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const session = await dialysisSessionService.createSession(
        patientId,
        req.body,
        req.user!.id,
      );

      if (!session) {
        return res.status(500).json({
          success: false,
          message: "Failed to create dialysis session",
        });
      }

      const formattedSession =
        dialysisSessionService.formatSessionResponse(session);

      return res.status(201).json({
        success: true,
        message: "Dialysis session created successfully",
        session: formattedSession,
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
   * @desc Update session
   */
  async updateSession(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, id } = req.params as { patientId: string; id: string };

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const session = await dialysisSessionService.updateSession(
        patientId,
        id,
        req.body,
        req.user!.id,
        req.user!.role,
      );

      const formattedSession =
        dialysisSessionService.formatSessionResponse(session);

      return res.json({
        success: true,
        message: "Dialysis session updated successfully",
        session: formattedSession,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      const statusCode = message.includes("not found")
        ? 404
        : message.includes("Not authorized")
          ? 403
          : 500;

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Complete session
   */
  async completeSession(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, id } = req.params as { patientId: string; id: string };

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
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

      return res.json({
        success: true,
        message: "Dialysis session completed successfully",
        session: formattedSession,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(message.includes("not found") ? 404 : 500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Delete session
   */
  async deleteSession(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, id } = req.params as { patientId: string; id: string };

      await dialysisSessionService.deleteSession(patientId, id);

      return res.json({
        success: true,
        message: "Dialysis session deleted successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(message.includes("not found") ? 404 : 500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * @desc Get stats
   */
  async getSessionStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await dialysisSessionService.getSessionStats(
        req.user!.id,
        req.user!.role,
      );

      return res.json({
        success: true,
        stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export default new DialysisSessionController();
