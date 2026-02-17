const Patient = require("../models/Patient");

class PatientService {
  /**
   * Get all patients with role-based filtering
   */
  static async getAllPatients(user) {
    const query = {};

    const patients = await Patient.find(query)
      .select(
        "id patientId name gender dateOfBirth bloodType contactNumber assignedDoctor",
      )
      .populate("assignedDoctor", "name")
      .populate("assignedNurse", "name")
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments(query);

    return {
      success: true,
      count: patients.length,
      total,
      patients,
    };
  }

  /**
   * Get patient by ID with populated fields
   */
  static async getPatientById(patientId) {
    return await Patient.findOne({ patientId })
      .populate("assignedDoctor", "name email phoneNumber specialization")
      .populate("assignedNurse", "name email phoneNumber")
      .populate("notes.addedBy", "name role");
  }

  /**
   * Check if patient exists by patientId
   */
  static async checkPatientExists(patientId) {
    return await Patient.findOne({ patientId });
  }

  /**
   * Create new patient
   */
  static async createPatient(patientData) {
    const patient = await Patient.create(patientData);

    await patient.populate("assignedDoctor", "name email");
    if (patient.assignedNurse) {
      await patient.populate("assignedNurse", "name email");
    }

    return patient;
  }

  /**
   * Update patient by ID
   */
  static async updatePatient(patientId, updateData) {
    return await Patient.findByIdAndUpdate(patientId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("assignedDoctor", "name email")
      .populate("assignedNurse", "name email");
  }

  /**
   * Soft delete patient (set status to inactive)
   */
  static async deletePatient(patientId) {
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return null;
    }

    patient.status = "INACTIVE";
    await patient.save();

    return patient;
  }

  /**
   * Add note to patient
   */
  static async addNote(patientId, noteData) {
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return null;
    }

    const note = {
      ...noteData,
      addedAt: new Date(),
    };

    patient.notes.push(note);
    await patient.save();

    await patient.populate("notes.addedBy", "name role");

    return patient.notes[patient.notes.length - 1];
  }

  /**
   * Get patient statistics with role-based filtering
   */
  static async getPatientStatistics(user) {
    let matchCondition = {};

    // Role-based filtering
    if (user.role === "doctor") {
      matchCondition.assignedDoctor = user.id;
    } else if (user.role === "nurse") {
      matchCondition.assignedNurse = user.id;
    }

    const totalPatients = await Patient.countDocuments(matchCondition);
    const activePatients = await Patient.countDocuments({
      ...matchCondition,
      status: "ACTIVE",
    });

    const patientsByDialysisType = await Patient.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$dialysisInfo.dialysisType",
          count: { $sum: 1 },
        },
      },
    ]);

    const patientsByGender = await Patient.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    const ageDistribution = await Patient.aggregate([
      { $match: matchCondition },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$dateOfBirth"] },
                365.25 * 24 * 60 * 60 * 1000,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$age", 30] }, then: "Under 30" },
                { case: { $lt: ["$age", 50] }, then: "30-49" },
                { case: { $lt: ["$age", 70] }, then: "50-69" },
                { case: { $gte: ["$age", 70] }, then: "70+" },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalPatients,
      activePatients,
      patientsByDialysisType,
      patientsByGender,
      ageDistribution,
    };
  }

  /**
   * Search patients with role-based filtering
   */
  static async searchPatients(searchQuery, user) {
    let baseQuery = {};

    // Role-based filtering
    if (user.role === "doctor") {
      baseQuery.assignedDoctor = user.id;
    } else if (user.role === "nurse") {
      baseQuery.assignedNurse = user.id;
    }

    return await Patient.find({
      ...baseQuery,
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { patientId: { $regex: searchQuery, $options: "i" } },
        {
          "medicalHistory.renalDiagnosis": {
            $regex: searchQuery,
            $options: "i",
          },
        },
      ],
    })
      .select("patientId name age gender medicalHistory.renalDiagnosis status")
      .limit(20);
  }
}

module.exports = PatientService;
