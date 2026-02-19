import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import DialysisSession from "../models/DialysisSession.js";
import MonthlyInvestigation from "../models/MonthlyInvestigation.js";
import ClinicalDecision from "../models/ClinicalDecision.js";
import AIPrediction from "../models/AIPrediction.js";
import Notification from "../models/Notification.js";
import envConfig from "../config/env.config.js";

dotenv.config();

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
    password: "Admin123!",
    role: "admin",
  });

  const doctor1 = await User.create({
    name: "Dr. Samantha Perera",
    email: "samantha@renalcare.com",
    password: "Doctor123!",
    role: "doctor",
    specialization: "Nephrology",
    licenseNumber: "SL-DOC-001",
  });

  const doctor2 = await User.create({
    name: "Dr. Rajesh Fernando",
    email: "rajesh@renalcare.com",
    password: "Doctor123!",
    role: "doctor",
    specialization: "Nephrology",
    licenseNumber: "SL-DOC-002",
  });

  const nurse1 = await User.create({
    name: "Nurse Priya Silva",
    email: "priya@renalcare.com",
    password: "Nurse123!",
    role: "nurse",
    department: "Dialysis Unit",
  });

  const nurse2 = await User.create({
    name: "Nurse Kumari Jayasinghe",
    email: "kumari@renalcare.com",
    password: "Nurse123!",
    role: "nurse",
    department: "Dialysis Unit",
  });

  console.log("Users created");

  return {
    adminUser,
    doctor1,
    doctor2,
    nurse1,
    nurse2,
  };
}

/*
|--------------------------------------------------------------------------
| Create patients
|--------------------------------------------------------------------------
*/

async function createPatients(doctor1: any, doctor2: any) {
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

async function createPredictions(patients: any[]) {
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

async function createNotifications(adminUser: any, doctor1: any) {
  await Notification.create({
    title: "System initialized",

    message: "Database seeded successfully",

    type: "SUCCESS",

    priority: "LOW",

    category: "SYSTEM_ALERT",

    recipient: doctor1._id,

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

    const { adminUser, doctor1, doctor2, nurse1, nurse2 } = await createUsers();

    const patients = await createPatients(doctor1, doctor2);

    await createPredictions(patients);

    await createNotifications(adminUser, doctor1);

    console.log("Database seeded successfully");

    console.log(`
Login credentials:

Admin:
admin@renalcare.com / Admin123!

Doctor:
samantha@renalcare.com / Doctor123!
rajesh@renalcare.com / Doctor123!

Nurse:
priya@renalcare.com / Nurse123!
kumari@renalcare.com / Nurse123!
`);
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
