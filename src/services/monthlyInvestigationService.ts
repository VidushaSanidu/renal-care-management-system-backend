import MonthlyInvestigation from "../models/MonthlyInvestigation.js";
import Patient from "../models/Patient.js";

import { Types, FilterQuery } from "mongoose";

import type { IMonthlyInvestigation } from "../models/MonthlyInvestigation.js";
import type { IPatient } from "../models/Patient.js";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface InvestigationQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginationResult<T> {
  investigations: T[];
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

class MonthlyInvestigationService {
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
  | Get investigations for patient
  |--------------------------------------------------------------------------
  */

  async getPatientInvestigations(
    patientId: string,
    queryParams: InvestigationQueryParams,
  ): Promise<PaginationResult<IMonthlyInvestigation>> {
    const patient = await this.getPatientByPatientId(patientId);

    const { page = 1, limit = 10, startDate, endDate } = queryParams;

    const skip = (page - 1) * limit;

    const query: FilterQuery<IMonthlyInvestigation> = {
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

    const investigations = await MonthlyInvestigation.find(query)
      .populate("laboratoryInfo.requestedBy", "name")
      .populate("laboratoryInfo.performedBy", "name")
      .populate("laboratoryInfo.reportedBy", "name")
      .sort({
        date: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MonthlyInvestigation.countDocuments(query);

    return {
      investigations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Create investigation
  |--------------------------------------------------------------------------
  */

  async createInvestigation(
    patientId: string,
    investigationData: Partial<IMonthlyInvestigation>,
    userId: string | Types.ObjectId,
  ) {
    const patient = await this.getPatientByPatientId(patientId);

    const investigation = await MonthlyInvestigation.create({
      ...investigationData,

      patient: patient._id,

      laboratoryInfo: {
        ...investigationData.laboratoryInfo,

        requestedBy: userId,
      },
    });

    return MonthlyInvestigation.findById(investigation._id)
      .populate("laboratoryInfo.requestedBy", "name")
      .populate("laboratoryInfo.performedBy", "name")
      .populate("laboratoryInfo.reportedBy", "name");
  }

  /*
  |--------------------------------------------------------------------------
  | Get investigation by ID
  |--------------------------------------------------------------------------
  */

  async getInvestigationById(patientId: string, investigationId: string) {
    const patient = await this.getPatientByPatientId(patientId);

    const investigation = await MonthlyInvestigation.findOne({
      investigationId,

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

  /*
  |--------------------------------------------------------------------------
  | Update investigation
  |--------------------------------------------------------------------------
  */

  async updateInvestigation(
    patientId: string,
    investigationId: string,
    updateData: Partial<IMonthlyInvestigation>,
  ) {
    const patient = await this.getPatientByPatientId(patientId);

    const investigation = await MonthlyInvestigation.findOneAndUpdate(
      {
        investigationId,

        patient: patient._id,
      },

      updateData,

      {
        new: true,
        runValidators: true,
      },
    )
      .populate("laboratoryInfo.requestedBy", "name")
      .populate("laboratoryInfo.performedBy", "name")
      .populate("laboratoryInfo.reportedBy", "name");

    if (!investigation) {
      throw new Error("Monthly investigation not found");
    }

    return investigation;
  }

  /*
  |--------------------------------------------------------------------------
  | Delete investigation
  |--------------------------------------------------------------------------
  */

  async deleteInvestigation(patientId: string, investigationId: string) {
    const patient = await this.getPatientByPatientId(patientId);

    const investigation = await MonthlyInvestigation.findOneAndDelete({
      investigationId,

      patient: patient._id,
    });

    if (!investigation) {
      throw new Error("Monthly investigation not found");
    }

    return {
      message: "Monthly investigation deleted successfully",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Format response
  |--------------------------------------------------------------------------
  */

  formatInvestigationResponse(investigation: IMonthlyInvestigation) {
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

export default new MonthlyInvestigationService();
