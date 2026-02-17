# Automatic Notification System

## Overview

The renal care management system automatically creates notifications for various critical scenarios to ensure patient safety and operational efficiency. This document outlines all automatic notification triggers implemented in the system.

## 🚨 Critical Lab Value Notifications

**Triggered in:** `models/MonthlyInvestigation.js` (post-save hook)

### Scenarios

1. **Critical Hemoglobin Levels**
   - **Trigger:** Hb < 7.0 g/dL or Hb > 18.0 g/dL
   - **Recipients:** Assigned doctor (URGENT), All medical staff (URGENT)
   - **Type:** CRITICAL notification
   - **Expires:** 24 hours (doctor), 12 hours (staff)

2. **Critical Serum Creatinine**
   - **Trigger:** Serum Creatinine Pre-HD > 1200 µmol/L
   - **Recipients:** Assigned doctor, All medical staff
   - **Type:** CRITICAL notification
   - **Action Required:** Yes

3. **Critical Potassium Levels**
   - **Trigger:** Serum K < 2.5 mmol/L or > 6.5 mmol/L
   - **Recipients:** Assigned doctor, All medical staff
   - **Type:** CRITICAL notification
   - **Action Required:** Yes

4. **Critical Phosphate Levels**
   - **Trigger:** Serum Phosphate > 2.5 mmol/L
   - **Recipients:** Assigned doctor, All medical staff
   - **Type:** CRITICAL notification
   - **Action Required:** Yes

## 🤖 AI Prediction Notifications

**Triggered in:** `models/AIPrediction.js` (post-save hook)

### Scenarios

1. **High-Risk Predictions**
   - **Trigger:** Prediction severity = 'HIGH' OR probability > 80%
   - **Recipients:** Assigned doctor
   - **Type:** WARNING notification
   - **Priority:** HIGH

2. **Critical Risk Predictions**
   - **Trigger:** Prediction severity = 'CRITICAL' OR probability > 90%
   - **Recipients:** Assigned doctor + All nurses
   - **Type:** CRITICAL notification
   - **Priority:** URGENT
   - **Expires:** 8 hours

### Prediction Types Monitored

- Hypotension Risk
- Anemia Risk
- Cardiovascular Events
- Dialysis Adequacy Issues

## 🏥 Dialysis Session Notifications

**Triggered in:** `models/DialysisSession.js` (post-save hook)

### Scenarios

1. **Session Cancelled**
   - **Trigger:** Session status = 'CANCELLED'
   - **Recipients:** Assigned doctor, Session nurse
   - **Type:** WARNING notification
   - **Priority:** HIGH

2. **Incomplete Session**
   - **Trigger:** Session duration < 180 minutes
   - **Recipients:** Assigned doctor, Session nurse
   - **Type:** WARNING notification
   - **Priority:** HIGH

3. **Inadequate Ultrafiltration**
   - **Trigger:** Achieved UF < 80% of prescribed UF
   - **Recipients:** Assigned doctor, Session nurse
   - **Type:** INFO notification
   - **Priority:** MEDIUM

4. **Critical Blood Pressure**
   - **Trigger:** Systolic > 180 or < 90 mmHg, Diastolic > 110 mmHg
   - **Recipients:** Assigned doctor, Session nurse
   - **Type:** WARNING notification
   - **Priority:** HIGH

5. **High Transmembrane Pressure**
   - **Trigger:** TMP > 200 mmHg (possible filter clotting)
   - **Recipients:** Assigned doctor, Session nurse
   - **Type:** INFO notification
   - **Priority:** MEDIUM

## 👥 Patient Status Notifications

**Triggered in:** `models/Patient.js` (post-save hook)

### Scenarios

1. **Status Changes**
   - **INACTIVE:** WARNING notification to assigned doctor + relevant staff
   - **DECEASED:** INFO notification (HIGH priority) to assigned doctor + staff
   - **TRANSFERRED:** INFO notification to assigned doctor
   - **ACTIVE:** SUCCESS notification to assigned doctor

2. **Doctor Assignment Changes**
   - **New Assignment:** INFO notification to new doctor
   - **Reassignment:** INFO notification to previous doctor about handover

## 📋 Clinical Decision Notifications

**Triggered in:** `models/ClinicalDecision.js` (post-save hook)

### Scenarios

1. **Decision Approved**
   - **Trigger:** Status changed to 'APPROVED'
   - **Recipients:** All nurses
   - **Type:** SUCCESS notification
   - **Priority:** MEDIUM

2. **Decision Needs Review**
   - **Trigger:** Status changed to 'NEEDS_REVIEW'
   - **Recipients:** All doctors
   - **Type:** WARNING notification
   - **Priority:** HIGH

3. **Critical Decisions**
   - **Trigger:** Primary diagnosis contains 'critical'
   - **Recipients:** All medical staff
   - **Type:** CRITICAL notification
   - **Priority:** URGENT
   - **Expires:** 6 hours

4. **Draft Decision Saved**
   - **Trigger:** New decision with status 'DRAFT'
   - **Recipients:** Creating doctor
   - **Type:** INFO notification
   - **Priority:** LOW

## ⏰ Scheduled Notifications

**Managed by:** `services/scheduledNotificationService.js`

### Daily Notifications (8:00 AM)

1. **Appointment Reminders**
   - **Recipients:** Assigned doctors, Nurses
   - **Type:** INFO notification
   - **Priority:** MEDIUM
   - **Content:** Tomorrow's dialysis sessions

### Bi-hourly Checks (8 AM - 6 PM)

2. **Missed Session Alerts**
   - **Trigger:** No session recorded for scheduled dialysis day
   - **Recipients:** Assigned doctor, Nurses
   - **Type:** WARNING notification
   - **Priority:** HIGH

### Weekly Notifications (Monday 9:00 AM)

3. **Patient Review Reminders**
   - **Recipients:** All doctors
   - **Type:** INFO notification
   - **Priority:** MEDIUM
   - **Content:** Number of assigned active patients

### Daily Maintenance (7:00 AM)

4. **Equipment Maintenance**
   - **Schedule:** Weekly (Sundays)
   - **Recipients:** Nurses
   - **Type:** INFO notification
   - **Priority:** MEDIUM

### Every 4 Hours

5. **Critical Lab Follow-ups**
   - **Trigger:** Critical lab results from 3+ days ago
   - **Recipients:** Assigned doctors
   - **Type:** WARNING notification
   - **Priority:** HIGH

## 🔧 Implementation Details

### Database Triggers

- **Post-save hooks** in Mongoose models automatically create notifications
- **Error handling** prevents notification failures from affecting main operations
- **Async processing** ensures database operations aren't blocked

### Scheduled Jobs

- **Node-cron** manages time-based notifications
- **Graceful initialization** on server startup
- **Error recovery** for failed scheduled tasks

### Performance Considerations

- **Targeted recipients** to avoid notification spam
- **Expiration dates** to clean up old notifications
- **Priority-based** notification levels
- **Rate limiting** on bulk notifications

## 📊 Notification Categories

### By Type

- **INFO:** General information, updates
- **SUCCESS:** Positive outcomes, completions
- **WARNING:** Issues requiring attention
- **CRITICAL:** Urgent situations requiring immediate action

### By Priority

- **LOW:** Can be addressed when convenient
- **MEDIUM:** Should be addressed within shift
- **HIGH:** Requires prompt attention
- **URGENT:** Requires immediate attention

### By Category

- **PATIENT_ALERT:** Patient-specific medical alerts
- **LAB_RESULT:** Laboratory investigation results
- **AI_PREDICTION:** Machine learning predictions
- **DIALYSIS_ALERT:** Dialysis session issues
- **APPOINTMENT_REMINDER:** Scheduled appointments
- **SYSTEM_ALERT:** System and equipment notifications

## 🎯 Action Required Notifications

Certain notifications automatically set `actionRequired: true`:

- Critical lab values
- High-risk AI predictions
- Missed dialysis sessions
- Patient status changes (INACTIVE, DECEASED)
- Clinical decisions needing review
- Equipment maintenance reminders

## 📈 Future Enhancements

### Planned Features

1. **Smart Escalation:** Auto-escalate unread critical notifications
2. **ML-Based Filtering:** Reduce notification fatigue with intelligent filtering
3. **SMS/Email Integration:** Multi-channel notification delivery
4. **Shift-Based Routing:** Route notifications based on staff schedules
5. **Patient-Specific Rules:** Customizable notification rules per patient
6. **Analytics Dashboard:** Notification effectiveness metrics

### Integration Points

- **Real-time WebSocket** notifications for immediate alerts
- **Mobile Push Notifications** for critical alerts
- **Email Summaries** for daily/weekly reports
- **Audit Logging** for compliance and review

## 🔐 Security & Compliance

- **Role-based Access:** Notifications respect user roles and permissions
- **Data Privacy:** No sensitive patient data in notification content
- **Audit Trail:** All notifications logged for compliance
- **Encryption:** Notification data encrypted in transit and at rest

This comprehensive automatic notification system ensures that critical patient care events are never missed while maintaining operational efficiency and reducing alert fatigue through intelligent targeting and prioritization.
