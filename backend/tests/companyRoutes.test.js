// tests/companyRoutes.test.js
import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// ---------------- MOCKS ----------------
jest.unstable_mockModule("../models/Company.js", () => ({
  default: { findOne: jest.fn(), find: jest.fn() }
}));
jest.unstable_mockModule("../models/User.js", () => ({
  default: { findById: jest.fn(), findOne: jest.fn() },
  getUserModel: jest.fn().mockResolvedValue({
    find: jest.fn().mockReturnValue({
      select: () => ({
        sort: jest.fn().mockResolvedValue([])
      })
    })
  })
}));
jest.unstable_mockModule("../controllers/companyController.js", () => ({
  getCompanyDetails: jest.fn((req, res) => res.json({ route: "getCompanyDetails" })),
  updateCompanyDetails: jest.fn((req, res) => res.json({ route: "updateCompanyDetails" })),
  updateCompanySettings: jest.fn((req, res) => res.json({ route: "updateCompanySettings" })),
  registerCompany: jest.fn((req, res) => res.json({ route: "registerCompany" })),
  forgotPassword: jest.fn((req, res) => res.json({ route: "forgotPassword" })),
  resetPassword: jest.fn((req, res) => res.json({ route: "resetPassword" })),
  verifyResetToken: jest.fn((req, res) => res.json({ route: "verifyResetToken" })),
  changePassword: jest.fn((req, res) => res.json({ route: "changePassword" })),
  verifyOtp: jest.fn((req, res) => res.json({ route: "verifyOtp" })),
  verifyDualOtp: jest.fn((req, res) => res.json({ route: "verifyDualOtp" })),
  resendOtp: jest.fn((req, res) => res.json({ route: "resendOtp" })),
  getCompanySettings: jest.fn((req, res) => res.json({ route: "getCompanySettings" })),
  checkCompanyCode: jest.fn((req, res) => res.json({ route: "checkCompanyCode" })),
  upload: jest.fn()
}));
jest.unstable_mockModule("../controllers/authControllerCompany.js", () => ({
  login: jest.fn((req, res) => res.json({ route: "login" })),
  createUser: jest.fn((req, res) => res.json({ route: "createUser" }))
}));
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.companyCode = "TESTCODE";
    next();
  }),
  authorize: jest.fn(() => (req, res, next) => next())
}));
jest.unstable_mockModule("../config/s3Config.js", () => ({
  getFileUrl: jest.fn((file) => `http://mocked-url/${file}`)
}));
jest.unstable_mockModule("../utils/paymentMailer.js", () => ({
  sendPaymentLinkEmail: jest.fn().mockResolvedValue(true),
  sendPaymentReminderEmail: jest.fn().mockResolvedValue(true)
}));

// bcrypt mock (CJS compatibility)
jest.unstable_mockModule("bcrypt", () => ({
  genSalt: jest.fn().mockResolvedValue("salt"),
  hash: jest.fn().mockResolvedValue("hashed"),
  default: {
    genSalt: jest.fn().mockResolvedValue("salt"),
    hash: jest.fn().mockResolvedValue("hashed")
  }
}));

// ---------------- IMPORT ROUTER ----------------
const Company = (await import("../models/Company.js")).default;
const User = (await import("../models/User.js")).default;
const { sendPaymentLinkEmail, sendPaymentReminderEmail } = await import("../utils/paymentMailer.js");
const router = (await import("../routes/companyRoutes.js")).default;

// Setup Express test app
const app = express();
app.use(express.json());
app.use("/company", router);

describe("Company Routes", () => {
  afterEach(() => jest.clearAllMocks());

  // ---------- PUBLIC ROUTES ----------
  it("POST /register", async () => {
    const res = await request(app).post("/company/register");
    expect(res.body.route).toBe("registerCompany");
  });

  it("POST /login", async () => {
    const res = await request(app).post("/company/login");
    expect(res.body.route).toBe("login");
  });

  it("POST /verify-otp", async () => {
    const res = await request(app).post("/company/verify-otp");
    expect(res.body.route).toBe("verifyOtp");
  });

  it("POST /verify-dual-otp", async () => {
    const res = await request(app).post("/company/verify-dual-otp");
    expect(res.body.route).toBe("verifyDualOtp");
  });

  it("POST /resend-otp", async () => {
    const res = await request(app).post("/company/resend-otp");
    expect(res.body.route).toBe("resendOtp");
  });

  it("POST /forgot-password", async () => {
    const res = await request(app).post("/company/forgot-password");
    expect(res.body.route).toBe("forgotPassword");
  });

  it("POST /verify-reset-token", async () => {
    const res = await request(app).post("/company/verify-reset-token");
    expect(res.body.route).toBe("verifyResetToken");
  });

  it("POST /reset-password", async () => {
    const res = await request(app).post("/company/reset-password");
    expect(res.body.route).toBe("resetPassword");
  });

  it("GET /verification-status/:companyCode - not found", async () => {
    Company.findOne.mockResolvedValue(null);
    const res = await request(app).get("/company/verification-status/FAKE");
    expect(res.status).toBe(404);
  });

  it("GET /verification-status/:companyCode - success", async () => {
    Company.findOne.mockResolvedValue({
      name: "Test",
      adminUserId: "1",
      isActive: true,
      pendingVerification: false
    });
    User.findById.mockResolvedValue({ isVerified: true });
    const res = await request(app).get("/company/verification-status/TEST");
    expect(res.status).toBe(200);
    expect(res.body.companyName).toBe("Test");
  });

  it("GET /check-code/:companyCode", async () => {
    const res = await request(app).get("/company/check-code/TEST");
    expect(res.body.route).toBe("checkCompanyCode");
  });

  // ---------- PAYMENT ROUTES ----------
  it("GET /payment-link/:companyCode - not found", async () => {
    Company.findOne.mockResolvedValue(null);
    const res = await request(app).get("/company/payment-link/FAKE");
    expect(res.status).toBe(404);
  });

  it("GET /payment-link/:companyCode - already paid", async () => {
    Company.findOne.mockResolvedValue({ paymentCompleted: true });
    const res = await request(app).get("/company/payment-link/TEST");
    expect(res.status).toBe(400);
  });

  it("GET /payment-link/:companyCode - pending verification", async () => {
    Company.findOne.mockResolvedValue({ paymentCompleted: false, pendingVerification: true });
    const res = await request(app).get("/company/payment-link/TEST");
    expect(res.status).toBe(400);
  });

  it("GET /payment-link/:companyCode - success", async () => {
    Company.findOne.mockResolvedValue({
      name: "Comp",
      companyCode: "TEST",
      contactEmail: "test@test.com",
      paymentCompleted: false,
      pendingVerification: false,
      paymentLinkShared: false,
      save: jest.fn()
    });
    const res = await request(app).get("/company/payment-link/TEST");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /send-payment-link/:companyCode - success", async () => {
    Company.findOne.mockResolvedValue({
      name: "Comp",
      companyCode: "TEST",
      contactEmail: "test@test.com",
      paymentCompleted: false,
      pendingVerification: false,
      paymentLinkShared: false,
      save: jest.fn()
    });
    const res = await request(app).post("/company/send-payment-link/TEST");
    expect(sendPaymentLinkEmail).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  // ❌ error cases for send-payment-link
  it("POST /send-payment-link/:companyCode - not found", async () => {
    Company.findOne.mockResolvedValue(null);
    const res = await request(app).post("/company/send-payment-link/NOPE");
    expect(res.status).toBe(404);
  });

  it("POST /send-payment-link/:companyCode - already paid", async () => {
    Company.findOne.mockResolvedValue({ paymentCompleted: true });
    const res = await request(app).post("/company/send-payment-link/TEST");
    expect(res.status).toBe(400);
  });

  it("POST /send-payment-link/:companyCode - pending verification", async () => {
    Company.findOne.mockResolvedValue({ paymentCompleted: false, pendingVerification: true });
    const res = await request(app).post("/company/send-payment-link/TEST");
    expect(res.status).toBe(400);
  });

  it("GET /pending-payments - success", async () => {
    const mockDoc = {
      toObject: () => ({
        name: "Comp1",
        companyCode: "C1",
        contactEmail: "admin@test.com",
        createdAt: new Date(Date.now() - 86400000),
        paymentLinkShared: false,
        paymentLinkSharedDate: null
      }),
      companyCode: "C1",
      createdAt: new Date(Date.now() - 86400000)
    };
    Company.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([mockDoc])
    });
    const res = await request(app).get("/company/pending-payments");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
  });

  // ❌ error case for pending-payments
  it("GET /pending-payments - error", async () => {
    Company.find.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error("DB error"))
    });
    const res = await request(app).get("/company/pending-payments");
    expect(res.status).toBe(500);
  });

  it("POST /send-payment-reminders", async () => {
    Company.find.mockResolvedValue([
      { toObject: () => ({ name: "Comp1", adminEmail: "admin@test.com", paymentStatus: "pending" }) }
    ]);
    const res = await request(app).post("/company/send-payment-reminders");
    expect(sendPaymentReminderEmail).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  // ❌ error case for send-payment-reminders
  it("POST /send-payment-reminders - error", async () => {
    Company.find.mockRejectedValue(new Error("DB fail"));
    const res = await request(app).post("/company/send-payment-reminders");
    expect(res.status).toBe(500);
  });

  it("POST /test-payment-link/:companyCode", async () => {
    Company.findOne.mockResolvedValue({
      companyCode: "TEST",
      name: "Test Co",
      contactEmail: "t@test.com",
      paymentCompleted: false,
      pendingVerification: false
    });
    const res = await request(app).post("/company/test-payment-link/TEST");
    expect(res.status).toBe(200);
    expect(res.body.tests.companyExists).toBe(true);
  });

  // ❌ error case for test-payment-link
  it("POST /test-payment-link/:companyCode - not found", async () => {
    Company.findOne.mockResolvedValue(null);
    const res = await request(app).post("/company/test-payment-link/NOPE");
    expect(res.status).toBe(404);
  });

  // ---------- DEBUG ROUTES ----------
  it("GET /debug-otp/:email - not found", async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).get("/company/debug-otp/fake@test.com");
    expect(res.status).toBe(404);
  });

  it("GET /debug-otp/:email - success", async () => {
    User.findOne.mockResolvedValue({ email: "e", otp: "123", otpExpires: new Date(), isVerified: true });
    const res = await request(app).get("/company/debug-otp/e@test.com");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("e");
  });

  // ❌ error case for debug-otp
  it("GET /debug-otp/:email - error", async () => {
    User.findOne.mockRejectedValue(new Error("DB issue"));
    const res = await request(app).get("/company/debug-otp/fail@test.com");
    expect(res.status).toBe(500);
  });

  it("POST /debug-reset-password - missing fields", async () => {
    const res = await request(app).post("/company/debug-reset-password").send({});
    expect(res.status).toBe(400);
  });

  it("POST /debug-reset-password - user not found", async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).post("/company/debug-reset-password").send({
      email: "e@test.com",
      companyCode: "C1",
      newPassword: "123"
    });
    expect(res.status).toBe(404);
  });

  it("POST /debug-reset-password - success", async () => {
    const save = jest.fn();
    User.findOne.mockResolvedValue({ email: "e@test.com", companyCode: "C1", save });
    const res = await request(app).post("/company/debug-reset-password").send({
      email: "e@test.com",
      companyCode: "C1",
      newPassword: "123"
    });
    expect(res.status).toBe(200);
  });

  // ❌ error case for debug-reset-password
  it("POST /debug-reset-password - error", async () => {
    User.findOne.mockRejectedValue(new Error("DB fail"));
    const res = await request(app).post("/company/debug-reset-password").send({
      email: "fail@test.com",
      companyCode: "C1",
      newPassword: "123"
    });
    expect(res.status).toBe(500);
  });

  // ---------- PROTECTED ROUTES ----------
  it("GET / should call getCompanyDetails", async () => {
    const res = await request(app).get("/company");
    expect(res.body.route).toBe("getCompanyDetails");
  });

  it("PUT / should call updateCompanyDetails", async () => {
    const res = await request(app).put("/company");
    expect(res.body.route).toBe("updateCompanyDetails");
  });

  it("PUT /settings should call updateCompanySettings", async () => {
    const res = await request(app).put("/company/settings");
    expect(res.body.route).toBe("updateCompanySettings");
  });

  it("GET /settings should call getCompanySettings", async () => {
    const res = await request(app).get("/company/settings");
    expect(res.body.route).toBe("getCompanySettings");
  });

  it("POST /users should call createUser", async () => {
    const res = await request(app).post("/company/users");
    expect(res.body.route).toBe("createUser");
  });

  it("GET /users should return empty list", async () => {
    const res = await request(app).get("/company/users");
    expect(res.status).toBe(200);
    expect(res.body.users).toEqual([]);
  });

  it("POST /change-password should call changePassword", async () => {
    const res = await request(app).post("/company/change-password");
    expect(res.body.route).toBe("changePassword");
  });

  it("GET /logo should return mocked logo url", async () => {
    Company.findOne.mockResolvedValue({ logo: "logo.png" });
    const res = await request(app).get("/company/logo");
    expect(res.status).toBe(200);
    expect(res.body.logoUrl).toContain("mocked-url");
  });

  it("GET /details should return company details", async () => {
    Company.findOne.mockResolvedValue({
      name: "Comp",
      address: { street: "s", city: "c", state: "st", country: "co", zipCode: "123" },
      contactEmail: "c@test.com",
      contactPhone: "123",
      logo: "logo.png"
    });
    const res = await request(app).get("/company/details");
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Comp");
  });
});

