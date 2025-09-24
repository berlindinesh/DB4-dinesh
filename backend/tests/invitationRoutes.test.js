// tests/invitationRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock Controllers ---
jest.unstable_mockModule("../controllers/invitationController.js", () => ({
  createInvitation: jest.fn((req, res) => res.status(201).json({ route: "createInvitation" })),
  getInvitations: jest.fn((req, res) => res.status(200).json([{ route: "getInvitations" }])),
  resendInvitation: jest.fn((req, res) => res.status(200).json({ route: "resendInvitation" })),
  cancelInvitation: jest.fn((req, res) => res.status(200).json({ route: "cancelInvitation" })),
  validateInvitationToken: jest.fn((req, res) => res.status(200).json({ route: "validateInvitationToken" })),
}));

// --- Mock Middleware ---
const mockAuthenticate = jest.fn((req, res, next) => {
  req.companyCode = "testCompany"; // simulate authenticated
  next();
});

const mockAuthorize = jest.fn((roles) => (req, res, next) => {
  if (req.headers["x-unauthorized"]) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: mockAuthenticate,
  authorize: mockAuthorize,
}));

// Import router AFTER mocks
const { default: invitationRouter } = await import("../routes/invitationRoutes.js");

const app = express();
app.use(express.json());
app.use("/invitations", invitationRouter);

describe("invitationRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /invitations/validate → validateInvitationToken", async () => {
    const res = await request(app).get("/invitations/validate?token=abc123");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("validateInvitationToken");
  });

  

  it("GET /invitations → getInvitations", async () => {
    const res = await request(app).get("/invitations");
    expect(res.status).toBe(200);
    expect(res.body[0].route).toBe("getInvitations");
  });

  it("POST /invitations/:id/resend → resendInvitation", async () => {
    const res = await request(app).post("/invitations/123/resend");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("resendInvitation");
  });

  it("DELETE /invitations/:id → cancelInvitation", async () => {
    const res = await request(app).delete("/invitations/123");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("cancelInvitation");
  });

  it("should return 401 if authenticate blocks request", async () => {
    mockAuthenticate.mockImplementationOnce((req, res) =>
      res.status(401).json({ error: "Auth failed" })
    );
    const res = await request(app).post("/invitations").send({ email: "fail@example.com" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Auth failed");
  });

  it("should return 403 if authorize blocks request", async () => {
    const res = await request(app)
      .post("/invitations")
      .set("x-unauthorized", "true")
      .send({ email: "fail@example.com" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });
});
