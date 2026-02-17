const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Patient = require("../models/Patient");
const MonthlyInvestigation = require("../models/MonthlyInvestigation");
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/trends/hb/{patientId}:
 *   get:
 *     summary: Get Hemoglobin trend analysis for a patient
 *     tags: [Trends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^RHD_THP_\d{3}$'
 *           example: 'RHD_THP_001'
 *         description: Patient ID in RHD_THP_XXX format
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 6
 *         description: Number of months to include in trend analysis
 *     responses:
 *       200:
 *         description: Hemoglobin trend data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patient:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     patientId:
 *                       type: string
 *                 trendData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       hb:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [normal, low, high]
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     average:
 *                       type: number
 *                     min:
 *                       type: number
 *                     max:
 *                       type: number
 *                     trend:
 *                       type: string
 *                       enum: [improving, declining, stable]
 *                     normalRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                         max:
 *                           type: number
 *       400:
 *         description: Invalid patient ID or parameters
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.get(
  "/hb/:patientId",
  auth.protect,
  auth.authorize("doctor", "nurse"),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const months = parseInt(req.query.months) || 6;

      // Validate patient ID format (should be like RHD_THP_XXX)
      const patientIdRegex = /^RHD_THP_\d{3}$/;
      if (!patientIdRegex.test(patientId)) {
        return res.status(400).json({
          message: "Invalid patient ID format. Expected format: RHD_THP_XXX",
        });
      }

      // Check if patient exists using patientId field
      const patient = await Patient.findOne({ patientId: patientId });
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Role-based access control
      if (req.user.role === "doctor") {
        // Doctors can only access their assigned patients
        // if (patient.assignedDoctor.toString() !== req.user.id) {
        //   return res.status(403).json({ message: 'Access denied. You can only view trends for your assigned patients.' });
        // }
      }

      // Calculate date range for trend analysis
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get Hb data for the specified period using patient's ObjectId
      const hbData = await MonthlyInvestigation.find({
        patient: patient._id, // Use the ObjectId for database query
        date: { $gte: startDate, $lte: endDate },
        hb: { $exists: true, $ne: null },
      })
        .select("date hb")
        .sort({ date: 1 });

      if (hbData.length === 0) {
        return res.json({
          patient: {
            id: patient._id,
            name: `${patient.name}`,
            patientId: patient.patientId,
          },
          trendData: [],
          statistics: {
            average: null,
            min: null,
            max: null,
            trend: "insufficient_data",
            normalRange: { min: 12, max: 16 },
          },
        });
      }

      // Define normal Hb ranges (g/dL)
      const normalRange = { min: 12, max: 16 };

      // Process trend data with status classification
      const trendData = hbData.map((record) => {
        let status = "normal";
        if (record.hb < normalRange.min) {
          status = "low";
        } else if (record.hb > normalRange.max) {
          status = "high";
        }

        return {
          date: record.date,
          hb: record.hb,
          status: status,
        };
      });

      // Calculate statistics
      const hbValues = hbData.map((record) => record.hb);
      const average =
        hbValues.reduce((sum, val) => sum + val, 0) / hbValues.length;
      const min = Math.min(...hbValues);
      const max = Math.max(...hbValues);

      // Calculate trend direction
      let trend = "stable";
      if (hbData.length >= 2) {
        const firstHalf = hbValues.slice(0, Math.floor(hbValues.length / 2));
        const secondHalf = hbValues.slice(Math.floor(hbValues.length / 2));

        const firstHalfAvg =
          firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

        const changePercentage =
          ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        if (changePercentage > 5) {
          trend = "improving";
        } else if (changePercentage < -5) {
          trend = "declining";
        }
      }

      res.json({
        patient: {
          id: patient._id,
          name: `${patient.name}`,
          patientId: patient.patientId,
        },
        trendData: trendData,
        statistics: {
          average: Math.round(average * 100) / 100,
          min: min,
          max: max,
          trend: trend,
          normalRange: normalRange,
        },
      });
    } catch (error) {
      console.error("Error in Hb trend analysis:", error);
      res.status(500).json({
        message: "Server error occurred while retrieving Hb trend data",
      });
    }
  },
);

module.exports = router;
