import { Types } from "mongoose";

import Patient from "../models/Patient.js";
import type { IUser } from "../models/User.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface AddNoteInput {
  content: string;
  addedBy: Types.ObjectId | string;
  type?: "GENERAL" | "MEDICAL" | "ADMINISTRATIVE";
}

interface PatientSearchResult {
  patientId: string;
  name: string;
  gender: string;
  age?: number;
  status: string;
}

/*
|--------------------------------------------------------------------------
| Service
|--------------------------------------------------------------------------
*/

class PatientService {
  /*
  |--------------------------------------------------------------------------
  | Get all patients
  |--------------------------------------------------------------------------
  */

  static async getAllPatients(user: IUser) {
    const query: Record<string, unknown> = {};

    // Role filtering
    if (user.role === "DOCTOR") {
      query.assignedDoctor = user._id;
    }

    if (user.role === "NURSE") {
      query.assignedNurse = user._id;
    }

    const patients = await Patient.find(query)
      .select(
        "patientId name gender dateOfBirth bloodType contactNumber assignedDoctor assignedNurse",
      )
      .populate("assignedDoctor", "name")
      .populate("assignedNurse", "name")
      .sort({ createdAt: -1 })
      .lean();

    const total = await Patient.countDocuments(query);

    return {
      success: true,
      count: patients.length,
      total,
      patients,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Get patient by patientId
  |--------------------------------------------------------------------------
  */

  static async getPatientById(patientId: string) {
    return Patient.findOne({
      patientId,
    })
      .populate("assignedDoctor", "name email phoneNumber specialization")
      .populate("assignedNurse", "name email phoneNumber")
      .populate("notes.addedBy", "name role")
      .lean();
  }

  /*
  |--------------------------------------------------------------------------
  | Check exists
  |--------------------------------------------------------------------------
  */

  static async checkPatientExists(patientId: string) {
    return Patient.exists({
      patientId,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Create
  |--------------------------------------------------------------------------
  */

  static async createPatient(patientData: Record<string, unknown>) {
    const patient = await Patient.create(patientData);

    await patient.populate("assignedDoctor", "name email");

    if (patient.assignedNurse) {
      await patient.populate("assignedNurse", "name email");
    }

    return patient;
  }

  /*
  |--------------------------------------------------------------------------
  | Update
  |--------------------------------------------------------------------------
  */

  static async updatePatient(
    patientId: string,
    updateData: Record<string, unknown>,
  ) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new Error("Invalid patient ID");
    }

    const patient = await Patient.findByIdAndUpdate(patientId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("assignedDoctor", "name email")
      .populate("assignedNurse", "name email");

    return patient;
  }

  /*
  |--------------------------------------------------------------------------
  | Soft delete
  |--------------------------------------------------------------------------
  */

  static async deletePatient(patientId: string) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new Error("Invalid patient ID");
    }

    const patient = await Patient.findById(patientId);

    if (!patient) return null;

    patient.status = "INACTIVE";

    await patient.save();

    return patient;
  }

  /*
  |--------------------------------------------------------------------------
  | Add note
  |--------------------------------------------------------------------------
  */

  static async addNote(patientId: string, noteData: AddNoteInput) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new Error("Invalid patient ID");
    }

    const patient = await Patient.findById(patientId);

    if (!patient) return null;

    patient.notes?.push({
      ...noteData,
      addedAt: new Date(),
    });

    await patient.save();

    await patient.populate("notes.addedBy", "name role");

    if (patient.notes) {
      return patient.notes.at(-1);
    }

    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  static async getPatientStatistics(user: IUser) {
    const match: Record<string, unknown> = {};

    if (user.role === "DOCTOR") {
      match.assignedDoctor = user._id;
    }

    if (user.role === "NURSE") {
      match.assignedNurse = user._id;
    }

    const totalPatients = await Patient.countDocuments(match);

    const activePatients = await Patient.countDocuments({
      ...match,
      status: "ACTIVE",
    });

    const patientsByDialysisType = await Patient.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$dialysisInfo.dialysisType",
          count: { $sum: 1 },
        },
      },
    ]);

    const patientsByGender = await Patient.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    const ageDistribution = await Patient.aggregate([
      { $match: match },

      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                {
                  $subtract: [new Date(), "$dateOfBirth"],
                },
                31557600000,
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
                {
                  case: {
                    $lt: ["$age", 30],
                  },
                  then: "Under 30",
                },
                {
                  case: {
                    $lt: ["$age", 50],
                  },
                  then: "30-49",
                },
                {
                  case: {
                    $lt: ["$age", 70],
                  },
                  then: "50-69",
                },
              ],
              default: "70+",
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

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  static async searchPatients(
    searchQuery: string,
    user: IUser,
  ): Promise<PatientSearchResult[]> {
    const baseQuery: Record<string, unknown> = {};

    if (user.role === "DOCTOR") {
      baseQuery.assignedDoctor = user._id;
    }

    if (user.role === "NURSE") {
      baseQuery.assignedNurse = user._id;
    }

    return Patient.find({
      ...baseQuery,

      $or: [
        {
          name: {
            $regex: searchQuery,
            $options: "i",
          },
        },

        {
          patientId: {
            $regex: searchQuery,
            $options: "i",
          },
        },

        {
          "medicalHistory.renalDiagnosis": {
            $regex: searchQuery,
            $options: "i",
          },
        },
      ],
    })
      .select("patientId name gender status medicalHistory.renalDiagnosis")
      .limit(20)
      .lean();
  }
}

export default PatientService;
