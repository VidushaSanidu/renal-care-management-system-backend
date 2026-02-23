import type { Types, QueryFilter } from "mongoose";

import DialysisSession from "../models/DialysisSession.js";
import Patient from "../models/Patient.js";
import type { IDialysisSession } from "../models/DialysisSession.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface SessionQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface PaginationResult<T> {
  sessions: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/*
|--------------------------------------------------------------------------
| Service
|--------------------------------------------------------------------------
*/

class DialysisSessionService {
  /*
  |--------------------------------------------------------------------------
  | Get patient by patientId
  |--------------------------------------------------------------------------
  */

  async getPatientByPatientId(patientId: string) {
    const patient = await Patient.findOne({
      patientId,
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    return patient;
  }

  /*
  |--------------------------------------------------------------------------
  | Get patient sessions
  |--------------------------------------------------------------------------
  */

  async getPatientSessions(
    patientId: string,

    userId: string | Types.ObjectId,

    userRole: string,

    queryParams: SessionQueryParams,
  ): Promise<PaginationResult<IDialysisSession>> {
    const patient = await this.getPatientByPatientId(patientId);

    const { page = 1, limit = 10, startDate, endDate, status } = queryParams;

    const skip = (page - 1) * limit;

    const query: QueryFilter<IDialysisSession> = {
      patient: patient._id,
    };

    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        query.date.$gte = new Date(startDate);
      }

      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    if (status) {
      query.status = status;
    }

    const sessions = await DialysisSession.find(query)
      .populate("nurse", "name email")
      .populate("doctor", "name email")
      .sort({
        date: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await DialysisSession.countDocuments(query);

    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Get single session
  |--------------------------------------------------------------------------
  */

  async getSessionById(
    patientId: string,

    sessionId: string,

    userId: string | Types.ObjectId,

    userRole: string,
  ) {
    const patient = await this.getPatientByPatientId(patientId);

    const session = await DialysisSession.findOne({
      sessionId,
      patient: patient._id,
    })
      .populate("nurse", "name email phoneNumber")
      .populate("doctor", "name email phoneNumber specialization");

    if (!session) {
      throw new Error("Dialysis session not found");
    }

    if (
      userRole === "DOCTOR" &&
      patient.assignedDoctor?.toString() !== userId.toString()
    ) {
      throw new Error("Not authorized");
    }

    if (
      userRole === "NURSE" &&
      session.nurse?.toString() !== userId.toString()
    ) {
      throw new Error("Not authorized");
    }

    return session;
  }

  /*
  |--------------------------------------------------------------------------
  | Create session
  |--------------------------------------------------------------------------
  */

  async createSession(
    patientId: string,

    sessionData: Partial<IDialysisSession>,

    userId: string | Types.ObjectId,
  ) {
    const patient = await this.getPatientByPatientId(patientId);

    const session = await DialysisSession.create({
      ...sessionData,

      patient: patient._id,

      nurse: userId,

      doctor: patient.assignedDoctor,
    });

    return DialysisSession.findById(session._id)
      .populate("nurse", "name email")
      .populate("doctor", "name email");
  }

  /*
  |--------------------------------------------------------------------------
  | Update session
  |--------------------------------------------------------------------------
  */

  async updateSession(
    patientId: string,

    sessionId: string,

    updateData: Partial<IDialysisSession>,

    userId: string | Types.ObjectId,

    userRole: string,
  ) {
    const patient = await this.getPatientByPatientId(patientId);

    const session = await DialysisSession.findOneAndUpdate(
      {
        sessionId,
        patient: patient._id,
      },

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

    if (
      userRole === "NURSE" &&
      session.nurse?.toString() !== userId.toString()
    ) {
      throw new Error("Not authorized");
    }

    return session;
  }

  /*
  |--------------------------------------------------------------------------
  | Complete session
  |--------------------------------------------------------------------------
  */

  async completeSession(
    patientId: string,

    sessionId: string,

    completionData: Partial<IDialysisSession>,
  ) {
    const patient = await this.getPatientByPatientId(patientId);

    const session = await DialysisSession.findOneAndUpdate(
      {
        sessionId,
        patient: patient._id,
      },

      {
        ...completionData,
        status: "COMPLETED",
      },

      {
        new: true,
        runValidators: true,
      },
    ).populate("nurse", "name email");

    if (!session) {
      throw new Error("Dialysis session not found");
    }

    return session;
  }

  /*
  |--------------------------------------------------------------------------
  | Delete session
  |--------------------------------------------------------------------------
  */

  async deleteSession(
    patientId: string,

    sessionId: string,
  ) {
    const patient = await this.getPatientByPatientId(patientId);

    const session = await DialysisSession.findOneAndDelete({
      sessionId,
      patient: patient._id,
    });

    if (!session) {
      throw new Error("Dialysis session not found");
    }

    return {
      message: "Dialysis session deleted successfully",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Session statistics
  |--------------------------------------------------------------------------
  */

  async getSessionStats(
    userId: string | Types.ObjectId,

    userRole: string,
  ) {
    const match: Record<string, unknown> = {};

    if (userRole === "DOCTOR") {
      const patients = await Patient.find({
        assignedDoctor: userId,
      }).select("_id");

      match.patient = {
        $in: patients.map((p) => p._id),
      };
    }

    if (userRole === "NURSE") {
      match.nurse = userId;
    }

    const totalSessions = await DialysisSession.countDocuments(match);

    const completedSessions = await DialysisSession.countDocuments({
      ...match,
      status: "COMPLETED",
    });

    const sessionsByStatus = await DialysisSession.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    return {
      totalSessions,
      completedSessions,
      sessionsByStatus,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Format response
  |--------------------------------------------------------------------------
  */

  formatSessionResponse(session: IDialysisSession) {
    return {
      id: session._id,

      sessionId: session.sessionId,

      patientId: session.patient,

      date: session.date,

      status: session.status,

      nurse: session.nurse,

      doctor: session.doctor,

      notes: session.notes,

      createdAt: session.createdAt,

      updatedAt: session.updatedAt,
    };
  }
}

export default new DialysisSessionService();
