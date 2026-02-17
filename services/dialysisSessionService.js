const DialysisSession = require("../models/DialysisSession");
const Patient = require("../models/Patient");

class DialysisSessionService {
  // Get patient by patientId
  async getPatientByPatientId(patientId) {
    const patient = await Patient.findOne({ patientId: patientId });
    if (!patient) {
      throw new Error("Patient not found");
    }
    return patient;
  }

  // Get all dialysis sessions for a patient
  async getPatientSessions(patientId, userId, userRole, queryParams) {
    const patient = await this.getPatientByPatientId(patientId);

    const { page = 1, limit = 10, startDate, endDate, status } = queryParams;
    const skip = (page - 1) * limit;

    let query = { patient: patient._id };

    // Role-based filtering (commented out as in original)
    // if (userRole === 'doctor') {
    //   if (patient.assignedDoctor.toString() !== userId) {
    //     throw new Error('Not authorized to access this patient\'s sessions');
    //   }
    // } else if (userRole === 'nurse') {
    //   query.nurse = userId;
    // }

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

    // Filter by status
    if (status) {
      query.status = status;
    }

    const sessions = await DialysisSession.find(query)
      .populate("nurse", "name email")
      .populate("doctor", "name email")
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DialysisSession.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      sessions,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
    };
  }

  // Get single dialysis session
  async getSessionById(patientId, sessionId, userId, userRole) {
    const patient = await this.getPatientByPatientId(patientId);

    const session = await DialysisSession.findOne({
      sessionId: sessionId,
      patient: patient._id,
    })
      .populate("nurse", "name email phoneNumber")
      .populate("doctor", "name email phoneNumber specialization")
      .populate("aiPredictions.type", "prediction confidence");

    if (!session) {
      throw new Error("Dialysis session not found");
    }

    // Check access permissions
    if (userRole === "doctor") {
      if (patient.assignedDoctor.toString() !== userId) {
        throw new Error("Not authorized to access this session");
      }
    } else if (
      userRole === "nurse" &&
      session.nurse._id.toString() !== userId
    ) {
      throw new Error("Not authorized to access this session");
    }

    return session;
  }

  // Create new dialysis session
  async createSession(patientId, sessionData, userId) {
    const patient = await this.getPatientByPatientId(patientId);

    const newSessionData = {
      ...sessionData,
      patient: patient._id,
      nurse: userId,
      doctor: patient.assignedDoctor,
    };

    const session = await DialysisSession.create(newSessionData);

    // Populate the response
    const populatedSession = await DialysisSession.findById(session._id)
      .populate("nurse", "name email")
      .populate("doctor", "name email");

    return populatedSession;
  }

  // Update dialysis session
  async updateSession(patientId, sessionId, updateData, userId, userRole) {
    const patient = await this.getPatientByPatientId(patientId);

    // Find and update session using sessionId
    const session = await DialysisSession.findOneAndUpdate(
      { sessionId: sessionId, patient: patient._id },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("nurse", "name email")
      .populate("doctor", "name email");

    if (!session) {
      throw new Error("Dialysis session not found");
    }

    // Check permissions
    if (userRole === "nurse" && session.nurse._id.toString() !== userId) {
      throw new Error("Not authorized to update this session");
    }

    return session;
  }

  // Complete dialysis session
  async completeSession(patientId, sessionId, completionData) {
    const patient = await this.getPatientByPatientId(patientId);

    // Find session using sessionId
    const session = await DialysisSession.findOne({
      sessionId: sessionId,
      patient: patient._id,
    });

    if (!session) {
      throw new Error("Dialysis session not found");
    }

    // Update session with completion data
    const updateData = {
      ...completionData,
      status: "COMPLETED",
      "qualityIndicators.sessionCompleted": true,
    };

    // Calculate adequacy parameters if provided
    if (completionData.adequacyParameters) {
      updateData.adequacyParameters = completionData.adequacyParameters;
      updateData["qualityIndicators.prescriptionAchieved"] =
        completionData.adequacyParameters.ktv >= 1.2 &&
        completionData.adequacyParameters.urr >= 65;
    }

    const updatedSession = await DialysisSession.findOneAndUpdate(
      { sessionId: sessionId, patient: patient._id },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).populate("nurse", "name email");

    return updatedSession;
  }

  // Delete dialysis session
  async deleteSession(patientId, sessionId) {
    const patient = await this.getPatientByPatientId(patientId);

    // Find and delete session using sessionId
    const session = await DialysisSession.findOneAndDelete({
      sessionId: sessionId,
      patient: patient._id,
    });

    if (!session) {
      throw new Error("Dialysis session not found");
    }

    return { message: "Dialysis session deleted successfully" };
  }

  // Get dialysis session statistics
  async getSessionStats(userId, userRole) {
    let matchCondition = {};

    // Role-based filtering
    if (userRole === "doctor") {
      const patients = await Patient.find({ assignedDoctor: userId }).select(
        "_id",
      );
      const patientIds = patients.map((p) => p._id);
      matchCondition.patient = { $in: patientIds };
    } else if (userRole === "nurse") {
      matchCondition.nurse = userId;
    }

    const totalSessions = await DialysisSession.countDocuments(matchCondition);
    const completedSessions = await DialysisSession.countDocuments({
      ...matchCondition,
      status: "COMPLETED",
    });

    const sessionsByStatus = await DialysisSession.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Average session metrics
    const avgMetrics = await DialysisSession.aggregate([
      { $match: { ...matchCondition, status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$duration" },
          avgUfAchieved: { $avg: "$dialysisParameters.ufAchieved" },
          avgKtv: { $avg: "$adequacyParameters.ktv" },
          avgUrr: { $avg: "$adequacyParameters.urr" },
        },
      },
    ]);

    return {
      totalSessions,
      completedSessions,
      sessionsByStatus,
      averageMetrics: avgMetrics[0] || {},
    };
  }

  // Format session response
  formatSessionResponse(session) {
    return {
      id: session._id,
      sessionId: session.sessionId,
      patientId: session.patient,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      status: session.status,
      preDialysis: session.preDialysis,
      postDialysis: session.postDialysis,
      dialysisParameters: session.dialysisParameters,
      adequacyParameters: session.adequacyParameters,
      vascularAccess: session.vascularAccess,
      complications: session.complications,
      qualityIndicators: session.qualityIndicators,
      aiPredictions: session.aiPredictions,
      nurse: session.nurse,
      doctor: session.doctor,
      notes: session.notes,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}

module.exports = new DialysisSessionService();
