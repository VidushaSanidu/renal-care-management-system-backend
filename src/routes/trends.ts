import express, { Router, Request, Response } from "express";

import Patient from "../models/Patient.js";
import MonthlyInvestigation from "../models/MonthlyInvestigation.js";

import { protect, authorize } from "../middleware/auth.js";

const router: Router = express.Router();

/**
 * GET Hb trend analysis
 */
router.get(
  "/hb/:patientId",
  protect,
  authorize("doctor", "nurse"),
  async (
    req: Request<{ patientId: string }, any, any, { months?: string }>,
    res: Response,
  ) => {
    try {
      const { patientId } = req.params;
      const months: number = parseInt(req.query.months || "6", 10);

      /**
       * Validate patient ID format
       */
      const patientIdRegex = /^RHD_THP_\d{3}$/;

      if (!patientIdRegex.test(patientId)) {
        return res.status(400).json({
          message: "Invalid patient ID format. Expected format: RHD_THP_XXX",
        });
      }

      /**
       * Find patient
       */
      const patient = await Patient.findOne({ patientId });

      if (!patient) {
        return res.status(404).json({
          message: "Patient not found",
        });
      }

      /**
       * Date range calculation
       */
      const endDate = new Date();

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      /**
       * Fetch Hb data
       */
      const hbData = await MonthlyInvestigation.find({
        patient: patient._id,
        date: { $gte: startDate, $lte: endDate },
        hb: { $exists: true, $ne: null },
      })
        .select("date hb")
        .sort({ date: 1 })
        .lean();

      /**
       * No data case
       */
      if (hbData.length === 0) {
        return res.json({
          patient: {
            id: patient._id,
            name: patient.name,
            patientId: patient.patientId,
          },
          trendData: [],
          statistics: {
            average: null,
            min: null,
            max: null,
            trend: "insufficient_data",
            normalRange: {
              min: 12,
              max: 16,
            },
          },
        });
      }

      /**
       * Normal Hb range
       */
      const normalRange = {
        min: 12,
        max: 16,
      };

      /**
       * Build trend data
       */
      const trendData = hbData.map((record) => {
        let status: "normal" | "low" | "high" = "normal";

        if (record.hb < normalRange.min) status = "low";
        else if (record.hb > normalRange.max) status = "high";

        return {
          date: record.date,
          hb: record.hb,
          status,
        };
      });

      /**
       * Statistics
       */
      const hbValues = hbData.map((r) => r.hb);

      const average =
        hbValues.reduce((sum, val) => sum + val, 0) / hbValues.length;

      const min = Math.min(...hbValues);
      const max = Math.max(...hbValues);

      /**
       * Trend calculation
       */
      let trend: "improving" | "declining" | "stable" | "insufficient_data" =
        "stable";

      if (hbValues.length >= 2) {
        const midpoint = Math.floor(hbValues.length / 2);

        const firstHalf = hbValues.slice(0, midpoint);
        const secondHalf = hbValues.slice(midpoint);

        const firstAvg =
          firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;

        const secondAvg =
          secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

        const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (changePercent > 5) trend = "improving";
        else if (changePercent < -5) trend = "declining";
      }

      /**
       * Response
       */
      return res.json({
        patient: {
          id: patient._id,
          name: patient.name,
          patientId: patient.patientId,
        },
        trendData,
        statistics: {
          average: Number(average.toFixed(2)),
          min,
          max,
          trend,
          normalRange,
        },
      });
    } catch (error) {
      console.error("Hb trend error:", error);

      return res.status(500).json({
        message: "Server error occurred while retrieving Hb trend data",
      });
    }
  },
);

export default router;
