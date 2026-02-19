import cron, { ScheduledTask } from "node-cron";

import notificationService from "./notificationService.js";

import Patient from "../models/Patient.js";
import DialysisSession from "../models/DialysisSession.js";
import MonthlyInvestigation from "../models/MonthlyInvestigation.js";
import User from "../models/User.js";

/*
|--------------------------------------------------------------------------
| Scheduled Notification Service
|--------------------------------------------------------------------------
*/

class ScheduledNotificationService {
  private static tasks: ScheduledTask[] = [];

  /*
  |--------------------------------------------------------------------------
  | Initialize cron jobs
  |--------------------------------------------------------------------------
  */

  static initializeScheduledNotifications(): void {
    console.log("Initializing scheduled notification services...");

    this.tasks.push(
      cron.schedule("0 8 * * *", () => {
        this.sendDailyAppointmentReminders();
      }),
    );

    this.tasks.push(
      cron.schedule("0 8-18/2 * * *", () => {
        this.checkMissedSessions();
      }),
    );

    this.tasks.push(
      cron.schedule("0 9 * * 1", () => {
        this.sendWeeklyPatientReviews();
      }),
    );

    this.tasks.push(
      cron.schedule("0 7 * * *", () => {
        this.sendMaintenanceReminders();
      }),
    );

    this.tasks.push(
      cron.schedule("0 */4 * * *", () => {
        this.checkCriticalLabFollowups();
      }),
    );

    console.log("Scheduled notification services initialized");
  }

  /*
  |--------------------------------------------------------------------------
  | Daily appointment reminders
  |--------------------------------------------------------------------------
  */

  static async sendDailyAppointmentReminders(): Promise<void> {
    try {
      const today = new Date();

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const patients = await Patient.find({
        status: "ACTIVE",
        "dialysisInfo.frequency": "THRICE_WEEKLY",
      }).populate("assignedDoctor");

      const dialysisDays = [1, 3, 5];

      for (const patient of patients) {
        const dayOfWeek = tomorrow.getDay();

        if (!dialysisDays.includes(dayOfWeek)) continue;

        if (patient.assignedDoctor) {
          await notificationService.createNotification({
            title: "Dialysis Session Reminder",

            message: `${patient.name} has dialysis tomorrow.`,

            type: "INFO",

            priority: "MEDIUM",

            category: "APPOINTMENT_REMINDER",

            recipient: patient.assignedDoctor._id,

            relatedEntity: {
              entityType: "Patient",

              entityId: patient._id,
            },

            data: {
              appointmentDate: tomorrow,

              appointmentType: "Hemodialysis Session",
            },
          });
        }

        const nurses = await User.find({
          role: "nurse",
          isActive: true,
        }).limit(2);

        for (const nurse of nurses) {
          await notificationService.createNotification({
            title: "Dialysis Schedule",

            message: `${patient.name} dialysis tomorrow.`,

            type: "INFO",

            priority: "MEDIUM",

            category: "APPOINTMENT_REMINDER",

            recipient: nurse._id,

            relatedEntity: {
              entityType: "Patient",

              entityId: patient._id,
            },
          });
        }
      }

      console.log("Daily appointment reminders sent");
    } catch (error) {
      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Missed sessions
  |--------------------------------------------------------------------------
  */

  static async checkMissedSessions(): Promise<void> {
    try {
      const today = new Date();

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const start = new Date(yesterday);
      start.setHours(0, 0, 0, 0);

      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);

      const patients = await Patient.find({
        status: "ACTIVE",
      }).populate("assignedDoctor");

      const dialysisDays = [1, 3, 5];

      for (const patient of patients) {
        const session = await DialysisSession.findOne({
          patient: patient._id,
          date: {
            $gte: start,
            $lte: end,
          },
        });

        if (session) continue;

        if (!dialysisDays.includes(yesterday.getDay())) continue;

        if (patient.assignedDoctor) {
          await notificationService.createNotification({
            title: "Missed Dialysis Session",

            message: `${patient.name} missed dialysis.`,

            type: "WARNING",

            priority: "HIGH",

            category: "PATIENT_ALERT",

            recipient: patient.assignedDoctor._id,
          });
        }
      }

      console.log("Missed session check done");
    } catch (error) {
      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Weekly reviews
  |--------------------------------------------------------------------------
  */

  static async sendWeeklyPatientReviews(): Promise<void> {
    try {
      const doctors = await User.find({
        role: "doctor",
        isActive: true,
      });

      for (const doctor of doctors) {
        const count = await Patient.countDocuments({
          assignedDoctor: doctor._id,
          status: "ACTIVE",
        });

        if (!count) continue;

        await notificationService.createNotification({
          title: "Weekly Review",

          message: `You have ${count} patients.`,

          type: "INFO",

          priority: "MEDIUM",

          category: "SYSTEM_ALERT",

          recipient: doctor._id,
        });
      }

      console.log("Weekly review sent");
    } catch (error) {
      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Maintenance reminders
  |--------------------------------------------------------------------------
  */

  static async sendMaintenanceReminders(): Promise<void> {
    try {
      if (new Date().getDay() !== 0) return;

      const staff = await User.find({
        role: { $in: ["nurse", "admin"] },
        isActive: true,
      }).limit(3);

      for (const user of staff) {
        await notificationService.createNotification({
          title: "Maintenance Reminder",

          message: "Weekly dialysis equipment maintenance",

          type: "INFO",

          priority: "MEDIUM",

          category: "SYSTEM_ALERT",

          recipient: user._id,
        });
      }

      console.log("Maintenance reminder sent");
    } catch (error) {
      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Critical lab followups
  |--------------------------------------------------------------------------
  */

  static async checkCriticalLabFollowups(): Promise<void> {
    try {
      const date = new Date();
      date.setDate(date.getDate() - 3);

      const labs = await MonthlyInvestigation.find({
        date: { $gte: date },

        $or: [
          { hb: { $lt: 7 } },

          { scrPreHD: { $gt: 1200 } },

          { serumKPreHD: { $gt: 6.5 } },

          { serumKPreHD: { $lt: 2.5 } },
        ],
      }).populate("patient");

      for (const lab of labs) {
        const patient = lab.patient as any;

        if (!patient?.assignedDoctor) continue;

        await notificationService.createNotification({
          title: "Critical Lab Followup",

          message: `${patient.name} requires followup.`,

          type: "WARNING",

          priority: "HIGH",

          category: "LAB_RESULT",

          recipient: patient.assignedDoctor,
        });
      }

      console.log("Critical lab followup check complete");
    } catch (error) {
      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Stop all jobs
  |--------------------------------------------------------------------------
  */

  static stopAllScheduledJobs(): void {
    for (const task of this.tasks) {
      task.stop();
    }

    console.log("All cron jobs stopped");
  }
}

export default ScheduledNotificationService;
