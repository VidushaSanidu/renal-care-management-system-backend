import mongoose from "mongoose";
import type { Document } from "mongoose";
import dotenv from "dotenv";

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import DialysisSession from "../models/DialysisSession.js";
import MonthlyInvestigation from "../models/MonthlyInvestigation.js";
import ClinicalDecision from "../models/ClinicalDecision.js";
import AIPrediction from "../models/AIPrediction.js";
import Notification from "../models/Notification.js";
import envConfig from "../config/env.config.js";

dotenv.config({quiet: true});

/*
|--------------------------------------------------------------------------
| Connect DB
|--------------------------------------------------------------------------
*/

async function connectDB(): Promise<void> {
  try {
    const mongoUri = envConfig.MONGODB_URI;

    await mongoose.connect(mongoUri);

    console.log(`MongoDB connected successfully → ${mongoUri}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

/*
|--------------------------------------------------------------------------
| Clear database
|--------------------------------------------------------------------------
*/

async function clearDatabase(): Promise<void> {
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    DialysisSession.deleteMany({}),
    MonthlyInvestigation.deleteMany({}),
    ClinicalDecision.deleteMany({}),
    AIPrediction.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log("Database cleared");
}

/*
|--------------------------------------------------------------------------
| Create users
|--------------------------------------------------------------------------
*/

async function createUsers() {
  const adminUser = await User.create({
    name: "System Administrator",
    email: "admin@renalcare.com",
    password: "admin123!",
    role: "ADMIN",
  });

  const doctor = await User.create({
    name: "Dr. Demo",
    email: "demo.doctor@renalcare.com",
    password: "doctor123!",
    role: "DOCTOR",
    specialization: "Demo Specialization",
    licenseNumber: "SL-DOC-001",
  });

  const nurse = await User.create({
    name: "Demo Nurse",
    email: "demo.nurse@renalcare.com",
    password: "nurse123!",
    role: "NURSE",
    department: "Demo",
  });

  console.log("Users created");

  return {
    adminUser,
    doctor,
    nurse,
  };
}

/*
|--------------------------------------------------------------------------
| Create patients
|--------------------------------------------------------------------------
*/

async function createPatients(doctor1: Document, doctor2: Document) {
  const patients = await Patient.insertMany([
    {
      name: "Nimal Wijesekera",
      patientId: "RHD_THP_001",
      dateOfBirth: new Date("1979-05-15"),
      gender: "Male",
      bloodType: "O+",
      assignedDoctor: doctor1._id,
    },

    {
      name: "Kamala Senarath",
      patientId: "RHD_THP_002",
      dateOfBirth: new Date("1972-08-22"),
      gender: "Female",
      bloodType: "A+",
      assignedDoctor: doctor1._id,
    },

    {
      name: "Sunil Perera",
      patientId: "RHD_THP_003",
      dateOfBirth: new Date("1986-12-10"),
      gender: "Male",
      bloodType: "B+",
      assignedDoctor: doctor2._id,
    },
  ]);

  console.log("Patients created");

  return patients;
}

/*
|--------------------------------------------------------------------------
| Create AI predictions
|--------------------------------------------------------------------------
*/

async function createPredictions(patients: Document[]) {
  for (const patient of patients) {
    await AIPrediction.create({
      patient: patient._id,

      predictionType: "HYPOTENSION_RISK",

      prediction: {
        outcome: "High hypotension risk",

        probability: 75,

        confidence: 85,

        severity: "HIGH",

        timeframe: "HOURS",
      },

      modelInfo: {
        name: "HypotensionPredictor",

        version: "v1.0",

        type: "XGBOOST",

        accuracy: 92,
      },

      status: "GENERATED",
    });
  }

  console.log("Predictions created");
}

/*
|--------------------------------------------------------------------------
| Create notifications
|--------------------------------------------------------------------------
*/

async function createNotifications(adminUser: Document, doctor: Document) {
  await Notification.create({
    title: "System initialized",

    message: "Database seeded successfully",

    type: "SUCCESS",

    priority: "LOW",

    category: "SYSTEM_ALERT",

    recipient: doctor._id,

    createdBy: adminUser._id,
  });

  console.log("Notifications created");
}

/*
|--------------------------------------------------------------------------
| Seed database
|--------------------------------------------------------------------------
*/

async function seedDatabase(): Promise<void> {
  try {
    await clearDatabase();

    const { adminUser, doctor } = await createUsers();

    const patients = await createPatients(doctor, doctor);

    await createPredictions(patients);

    await createNotifications(adminUser, doctor);

    console.log("Database seeded successfully");

    console.log("Login credentials:");
    console.log("Admin: admin@renalcare.com / admin123!");
    console.log("Doctor: demo.doctor@renalcare.com / doctor123!");
    console.log("Nurse: demo.nurse@renalcare.com / nurse123!");
  } catch (error) {
    console.error("Seed error:", error);
  }
}

/*
|--------------------------------------------------------------------------
| Run
|--------------------------------------------------------------------------
*/

async function runSeed() {
  await connectDB();

  await seedDatabase();

  await mongoose.disconnect();

  process.exit(0);
}

runSeed();
