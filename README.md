# AI-Driven Renal Care Management System - Backend

A comprehensive backend API for managing dialysis patients, sessions, investigations, and AI-driven predictions in renal care facilities.

## Features

- **User Management**: Role-based authentication for admins, doctors, and nurses
- **Patient Management**: Complete patient records and medical history
- **Dialysis Session Management**: Track dialysis sessions with detailed parameters
- **Monthly Investigations**: Laboratory results tracking and analysis
- **Clinical Decisions**: Decision support system for medical staff
- **AI Predictions**: Machine learning predictions for patient outcomes
- **Real-time Notifications**: Socket.IO based notification system
- **Dashboard & Reports**: Comprehensive analytics and reporting
- **RESTful API**: Well-documented API endpoints with Swagger

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Socket.IO** - Real-time communication
- **Swagger** - API documentation
- **bcryptjs** - Password hashing

## Prerequisites

- Node.js 14.x or higher
- MongoDB 4.x or higher
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Software_Component/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/renal-care
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed the database (optional)**

   ```bash
   npm run seed
   ```

6. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Documentation

Once the server is running, you can access the API documentation at:

- **Swagger UI**: `http://localhost:5000/api-docs`

## Default Users (after seeding)

| Role   | Email                  | Password   | Description          |
| ------ | ---------------------- | ---------- | -------------------- |
| Admin  | admin@renalcare.com    | Admin123!  | System administrator |
| Doctor | samantha@renalcare.com | Doctor123! | Nephrologist         |
| Doctor | rajesh@renalcare.com   | Doctor123! | Nephrologist         |
| Nurse  | priya@renalcare.com    | Nurse123!  | Dialysis nurse       |
| Nurse  | kumari@renalcare.com   | Nurse123!  | Dialysis nurse       |

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Patients

- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Dialysis Sessions

- `GET /api/dialysis-sessions` - Get all sessions
- `POST /api/dialysis-sessions` - Create new session
- `GET /api/dialysis-sessions/:id` - Get session by ID
- `PUT /api/dialysis-sessions/:id` - Update session
- `DELETE /api/dialysis-sessions/:id` - Delete session

### Monthly Investigations

- `GET /api/monthly-investigations` - Get all investigations
- `POST /api/monthly-investigations` - Create new investigation
- `GET /api/monthly-investigations/:id` - Get investigation by ID
- `PUT /api/monthly-investigations/:id` - Update investigation
- `DELETE /api/monthly-investigations/:id` - Delete investigation

### Clinical Decisions

- `GET /api/clinical-decisions` - Get all decisions
- `POST /api/clinical-decisions` - Create new decision
- `GET /api/clinical-decisions/:id` - Get decision by ID
- `PUT /api/clinical-decisions/:id` - Update decision
- `DELETE /api/clinical-decisions/:id` - Delete decision

### AI Predictions

- `GET /api/ai-predictions` - Get all predictions
- `POST /api/ai-predictions/generate` - Generate new prediction
- `GET /api/ai-predictions/:id` - Get prediction by ID
- `PATCH /api/ai-predictions/:id/validate` - Validate prediction

### Notifications

- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

### Dashboard

- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/charts` - Get chart data
- `GET /api/dashboard/alerts` - Get alerts and warnings

### Reports

- `GET /api/reports/patient-summary` - Get patient summary report
- `GET /api/reports/dialysis-summary` - Get dialysis summary report
- `GET /api/reports/investigation-summary` - Get investigation summary

## Database Schema

### Users

- Authentication and authorization
- Role-based access control (admin, doctor, nurse)
- Profile information and preferences

### Patients

- Complete patient demographics
- Medical history and diagnosis
- Emergency contacts and insurance
- Assigned doctor and current status

### Dialysis Sessions

- Session details (date, duration, weights)
- Vital signs and parameters
- Complications and notes
- Treatment adequacy metrics

### Monthly Investigations

- Laboratory results and values
- Trend analysis and comparisons
- Doctor notes and recommendations

### Clinical Decisions

- Decision types and priorities
- Implementation status tracking
- Related data and reasoning

### AI Predictions

- ML model predictions and confidence
- Validation status and feedback
- Recommendations and risk factors

### Notifications

- Real-time system notifications
- Priority levels and categories
- Read status and expiration

## Socket.IO Events

### Client to Server

- `join_room` - Join user-specific room
- `leave_room` - Leave room

### Server to Client

- `new_notification` - New notification received
- `notification_read` - Notification marked as read
- `session_update` - Dialysis session updated
- `prediction_ready` - AI prediction completed

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Role-based access control

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Development

### Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests

### Code Structure

```
backend/
├── config/          # Database and socket configuration
├── middleware/      # Authentication and error handling
├── models/          # Mongoose schemas
├── routes/          # API route handlers
├── services/        # Business logic services
├── utils/           # Utility functions
├── seeds/           # Database seeding scripts
└── server.js        # Main application file
```

## Testing

Run the test suite:

```bash
npm test
```

## Deployment

1. **Set environment variables**

   ```bash
   export NODE_ENV=production
   export MONGODB_URI=mongodb://your-prod-db
   export JWT_SECRET=your-production-secret
   ```

2. **Install dependencies**

   ```bash
   npm install --production
   ```

3. **Start the server**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
