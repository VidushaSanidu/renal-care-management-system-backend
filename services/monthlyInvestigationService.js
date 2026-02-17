const MonthlyInvestigation = require("../models/MonthlyInvestigation");
const Patient = require("../models/Patient");

class MonthlyInvestigationService {
  // Get patient by patientId
  async getPatientByPatientId(patientId) {
    const patient = await Patient.findOne({ patientId: patientId });
    if (!patient) {
      throw new Error("Patient not found");
    }
    return patient;
  }

  // Get all monthly investigations for a patient
  async getPatientInvestigations(patientId, queryParams) {
    const patient = await this.getPatientByPatientId(patientId);

    const { page = 1, limit = 10, startDate, endDate } = queryParams;
    const skip = (page - 1) * limit;

    // Build query
    const query = { patient: patient._id };

    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Get investigations with pagination
    const investigations = await MonthlyInvestigation.find(query)
      .populate("laboratoryInfo.requestedBy", "name")
      .populate("laboratoryInfo.performedBy", "name")
      .populate("laboratoryInfo.reportedBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MonthlyInvestigation.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      investigations,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
    };
  }

  // Create a new monthly investigation
  async createInvestigation(patientId, investigationData, userId) {
    const patient = await this.getPatientByPatientId(patientId);

    // Set patient ID and laboratory info
    const newInvestigationData = {
      ...investigationData,
      patient: patient._id,
      laboratoryInfo: {
        ...investigationData.laboratoryInfo,
        requestedBy: userId,
      },
    };

    const investigation = new MonthlyInvestigation(newInvestigationData);
    await investigation.save();

    // Populate the response
    const populatedInvestigation = await MonthlyInvestigation.findById(
      investigation._id,
    )
      .populate("laboratoryInfo.requestedBy", "name")
      .populate("laboratoryInfo.performedBy", "name")
      .populate("laboratoryInfo.reportedBy", "name");

    return populatedInvestigation;
  }

  // Get a specific monthly investigation
  async getInvestigationById(patientId, investigationId) {
    const patient = await this.getPatientByPatientId(patientId);

    // Find investigation
    const investigation = await MonthlyInvestigation.findOne({
      investigationId: investigationId,
      patient: patient._id,
    })
      .populate("laboratoryInfo.requestedBy", "name")
      .populate("laboratoryInfo.performedBy", "name")
      .populate("laboratoryInfo.reportedBy", "name");

    if (!investigation) {
      throw new Error("Monthly investigation not found");
    }

    return investigation;
  }

  // Update a monthly investigation
  async updateInvestigation(patientId, investigationId, updateData) {
    const patient = await this.getPatientByPatientId(patientId);

    // Find and update investigation
    const investigation = await MonthlyInvestigation.findOneAndUpdate(
      { investigationId: investigationId, patient: patient._id },
      updateData,
      { new: true, runValidators: true },
    )
      .populate("laboratoryInfo.requestedBy", "name")
      .populate("laboratoryInfo.performedBy", "name")
      .populate("laboratoryInfo.reportedBy", "name");

    if (!investigation) {
      throw new Error("Monthly investigation not found");
    }

    return investigation;
  }

  // Delete a monthly investigation
  async deleteInvestigation(patientId, investigationId) {
    const patient = await this.getPatientByPatientId(patientId);

    // Find and delete investigation
    const investigation = await MonthlyInvestigation.findOneAndDelete({
      investigationId: investigationId,
      patient: patient._id,
    });

    if (!investigation) {
      throw new Error("Monthly investigation not found");
    }

    return { message: "Monthly investigation deleted successfully" };
  }

  // Format investigation response
  formatInvestigationResponse(investigation) {
    return {
      id: investigation._id,
      investigationId: investigation.investigationId,
      patientId: investigation.patient,
      date: investigation.date,
      scrPreHD: investigation.scrPreHD,
      scrPostHD: investigation.scrPostHD,
      bu_pre_hd: investigation.bu_pre_hd,
      bu_post_hd: investigation.bu_post_hd,
      hb: investigation.hb,
      serumNaPreHD: investigation.serumNaPreHD,
      serumNaPostHD: investigation.serumNaPostHD,
      serumKPreHD: investigation.serumKPreHD,
      serumKPostHD: investigation.serumKPostHD,
      sCa: investigation.sCa,
      sPhosphate: investigation.sPhosphate,
      albumin: investigation.albumin,
      ua: investigation.ua,
      hco: investigation.hco,
      al: investigation.al,
      hbA1C: investigation.hbA1C,
      pth: investigation.pth,
      vitD: investigation.vitD,
      serumIron: investigation.serumIron,
      serumFerritin: investigation.serumFerritin,
      additionalTests: investigation.additionalTests,
      laboratoryInfo: investigation.laboratoryInfo,
      notes: investigation.notes,
      status: investigation.status,
      createdAt: investigation.createdAt,
      updatedAt: investigation.updatedAt,
    };
  }
}

module.exports = new MonthlyInvestigationService();
