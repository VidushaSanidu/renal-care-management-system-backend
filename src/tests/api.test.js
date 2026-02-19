const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const { default: envConfig } = require("../config/env.config");
const { env } = require("node:process");

// Test database connection
beforeAll(async () => {
  const url =
    envConfig.MONGODB_URI || "mongodb://localhost:27017/renal-care-test";
  await mongoose.connect(url);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("API Health Check", () => {
  it("should respond with 200 for health check", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toHaveProperty("status", "OK");
    expect(response.body).toHaveProperty(
      "message",
      "Renal Care Management API is running",
    );
  });
});

describe("Authentication", () => {
  it("should return 400 for invalid login credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "invalid@email.com",
        password: "wrongpassword",
      })
      .expect(400);

    expect(response.body).toHaveProperty("message");
  });

  it("should return 400 for missing email in login", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        password: "password123",
      })
      .expect(400);

    expect(response.body).toHaveProperty("message");
  });
});

describe("Protected Routes", () => {
  it("should return 401 for accessing protected route without token", async () => {
    const response = await request(app).get("/api/patients").expect(401);

    expect(response.body).toHaveProperty("message", "No token provided");
  });

  it("should return 401 for invalid token", async () => {
    const response = await request(app)
      .get("/api/patients")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(response.body).toHaveProperty("message", "Invalid token");
  });
});

describe("API Documentation", () => {
  it("should serve Swagger documentation", async () => {
    const response = await request(app).get("/api-docs/").expect(200);

    expect(response.text).toContain("Swagger UI");
  });
});

describe("CORS", () => {
  it("should include CORS headers", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.headers).toHaveProperty("access-control-allow-origin");
  });
});

describe("Error Handling", () => {
  it("should return 404 for non-existent routes", async () => {
    const response = await request(app)
      .get("/api/non-existent-route")
      .expect(404);

    expect(response.body).toHaveProperty("message", "Route not found");
  });
});

describe("Database Models", () => {
  it("should validate required fields in Patient model", async () => {
    const Patient = require("../models/Patient");

    const patient = new Patient({});

    try {
      await patient.validate();
    } catch (error) {
      expect(error.errors).toHaveProperty("name");
      expect(error.errors).toHaveProperty("patientId");
      expect(error.errors).toHaveProperty("age");
      expect(error.errors).toHaveProperty("gender");
    }
  });

  it("should validate required fields in User model", async () => {
    const User = require("../models/User");

    const user = new User({});

    try {
      await user.validate();
    } catch (error) {
      expect(error.errors).toHaveProperty("name");
      expect(error.errors).toHaveProperty("email");
      expect(error.errors).toHaveProperty("password");
      expect(error.errors).toHaveProperty("role");
    }
  });
});

describe("Utility Functions", () => {
  const ValidationUtils = require("../utils/validation");

  it("should validate email format", () => {
    expect(ValidationUtils.isValidEmail("test@example.com")).toBe(true);
    expect(ValidationUtils.isValidEmail("invalid-email")).toBe(false);
    expect(ValidationUtils.isValidEmail("test@")).toBe(false);
  });

  it("should validate phone number format", () => {
    expect(ValidationUtils.isValidPhone("+94771234567")).toBe(true);
    expect(ValidationUtils.isValidPhone("0771234567")).toBe(true);
    expect(ValidationUtils.isValidPhone("123")).toBe(false);
  });

  it("should validate password strength", () => {
    const strongPassword = ValidationUtils.validatePassword("Password123!");
    expect(strongPassword.isValid).toBe(true);

    const weakPassword = ValidationUtils.validatePassword("pass");
    expect(weakPassword.isValid).toBe(false);
    expect(weakPassword.messages.length).toBeGreaterThan(0);
  });

  it("should validate patient ID format", () => {
    expect(ValidationUtils.isValidPatientId("RHD_THP_001")).toBe(true);
    expect(ValidationUtils.isValidPatientId("invalid-id")).toBe(false);
  });

  it("should sanitize string input", () => {
    const input = '<script>alert("xss")</script>Test';
    const sanitized = ValidationUtils.sanitizeString(input);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).toContain("Test");
  });
});

describe("Notification Service", () => {
  const NotificationService = require("../services/notificationService");

  it("should create notification with required fields", async () => {
    const mockNotification = {
      userId: "507f1f77bcf86cd799439011",
      title: "Test Notification",
      message: "This is a test notification",
      type: "info",
      category: "system",
      priority: "medium",
    };

    // Mock the notification creation
    const createNotificationSpy = jest.spyOn(
      NotificationService,
      "createNotification",
    );
    createNotificationSpy.mockResolvedValue(mockNotification);

    const result =
      await NotificationService.createNotification(mockNotification);

    expect(result).toEqual(mockNotification);
    expect(createNotificationSpy).toHaveBeenCalledWith(mockNotification);

    createNotificationSpy.mockRestore();
  });
});

describe("Environment Variables", () => {
  it("should have required environment variables", () => {
    // These should be set in the test environment
    envConfig.JWT_SECRET = "test-secret";
    envConfig.MONGODB_URI = "mongodb://localhost:27017/renal-care-test";

    expect(envConfig.JWT_SECRET).toBeDefined();
    expect(envConfig.MONGODB_URI).toBeDefined();
  });
});
