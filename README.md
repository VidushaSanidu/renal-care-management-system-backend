# Renal Care Management System - Backend

This is the backend server for the Renal Care Management System. It is built using Node.js and Express.js, and it provides REST API endpoints for managing users, patients, dialysis sessions, monthly investigations, clinical decisions, AI predictions, notifications, and dashboard data. The backend server also handles authentication and authorization using JWT tokens. It is designed to work alongside the ML server and serves data to the frontend applications.

## Features

- **User Management**: Role-based authentication for admins, doctors, and nurses
- **Patient Management**: Complete patient records and medical history
- **Dialysis Session Management**: Track dialysis sessions with detailed parameters
- **Monthly Investigations**: Laboratory results tracking and analysis
- **Clinical Decisions**: Decision support system for medical staff
- **AI Predictions**: Machine learning predictions for patient outcomes
- **Dashboard & Reports**: Comprehensive analytics and reporting
- **RESTful API**: Well-documented API endpoints with Swagger

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Swagger** - API documentation
- **bcryptjs** - Password hashing

## Prerequisites

- Node.js 20.x or higher
- MongoDB 8.0
- npm or bun

## Installation

1. **Install dependencies**

   ```bash
   npm install
   # or using bun
   bun install
   ```

2. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/renal-care
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on your system.

4. **Seed the database (optional)**

   ```bash
   npm run seed
   # or using bun
   bun run seed
   ```

5. **Start the server**

   ```bash
   # Development mode
   npm run dev
   # or using bun
   bun run dev

   # Production mode
   npm start
   # or using bun
   bun start
   ```

## API Documentation

Once the server is running, you can access the API documentation at:

- **Swagger UI**: [`http://localhost:5000/api-docs`](http://localhost:5000/api-docs)

## Default Users (after seeding)

| Role   | Email                  | Password   | Description          |
| ------ | ---------------------- | ---------- | -------------------- |
| Admin  | `admin@renalcare.com`  | admin123!  | System administrator |
| Doctor | `doctor@renalcare.com` | doctor123! | Nephrologist         |
| Nurse  | `nurse@renalcare.com`  | nurse123!  | Dialysis nurse       |

## API Endpoints

### Authentication

```http
POST /api/auth/register - Register new user
POST /api/auth/login - User login
GET /api/auth/me - Get current user profile
PUT /api/auth/profile - Update user profile
```

### Users

```http
GET /api/users - Get all users
GET /api/users/:id - Get user by ID
PUT /api/users/:id - Update user
DELETE /api/users/:id - Delete user
```

### Patients

```http
GET /api/patients - Get all patients
POST /api/patients - Create new patient
GET /api/patients/:id - Get patient by ID
PUT /api/patients/:id - Update patient
DELETE /api/patients/:id - Delete patient
```

### Dialysis Sessions

```http
GET /api/dialysis-sessions - Get all sessions
POST /api/dialysis-sessions - Create new session
GET /api/dialysis-sessions/:id - Get session by ID
PUT /api/dialysis-sessions/:id - Update session
DELETE /api/dialysis-sessions/:id - Delete session
```

### Monthly Investigations

```http
GET /api/monthly-investigations - Get all investigations
POST /api/monthly-investigations - Create new investigation
GET /api/monthly-investigations/:id - Get investigation by ID
PUT /api/monthly-investigations/:id - Update investigation
DELETE /api/monthly-investigations/:id - Delete
```

### Clinical Decisions

```http
GET /api/clinical-decisions - Get all decisions
POST /api/clinical-decisions - Create new decision
GET /api/clinical-decisions/:id - Get decision by ID
PUT /api/clinical-decisions/:id - Update decision
DELETE /api/clinical-decisions/:id - Delete decision
```

### AI Predictions

```http
GET /api/ai-predictions - Get all predictions
POST /api/ai-predictions/generate - Generate new prediction
GET /api/ai-predictions/:id - Get prediction by ID
PATCH /api/ai-predictions/:id/validate - Validate prediction
```

### Notifications

```http
GET /api/notifications - Get user notifications
PATCH /api/notifications/:id/read - Mark notification as read
DELETE /api/notifications/:id - Delete notification
```

### Dashboard

```http
GET /api/dashboard/overview - Get dashboard overview
GET /api/dashboard/charts - Get chart data
GET /api/dashboard/alerts - Get alerts and warnings
```

### Reports

```http
GET /api/reports/patient-summary - Get patient summary report
GET /api/reports/dialysis-summary - Get dialysis summary report
GET /api/reports/investigation-summary - Get investigation summary
```

### Code Structure

```text
backend/
   └── src/
      ├── config/          # Database and Env configuration
      ├── middleware/      # Authentication and error handling
      ├── models/          # Mongoose schemas
      ├── routes/          # API route handlers
      ├── services/        # Business logic services
      ├── utils/           # Utility functions
      ├── seeds/           # Database seeding scripts
      └── server.ts        # Main application file
```

## Testing

The backend server includes unit and integration tests using Jest. To run the tests, use the following command:

```bash
npm test
# or using bun
bun test
```
## Security Configuration

Please Read the [ENV.md](ENV.md) file for details about environment variables and security configuration.
