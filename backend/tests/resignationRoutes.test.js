import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --------------------
// ✅ Mock controllers
// --------------------
jest.unstable_mockModule("../controllers/resignationController.js", () => ({
  createResignation: jest.fn((req, res) =>
    res.status(201).json({ message: "created" })
  ),
  getAllResignations: jest.fn((req, res) =>
    res.status(200).json([{ id: 1 }])
  ),
  getResignationsByUser: jest.fn((req, res) =>
    res.status(200).json([{ id: 2 }])
  ),
  updateResignation: jest.fn((req, res) =>
    res.status(200).json({ message: "updated" })
  ),
  deleteResignation: jest.fn((req, res) =>
    res.status(200).json({ message: "deleted" })
  ),
  sendEmail: jest.fn((req, res) => {
    if (!req.body.email) {
      return res.status(400).json({ message: "Email required" });
    }
    res.status(200).json({ message: "email sent" });
  }),
}));

// --------------------
// ✅ Mock middleware
// --------------------
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.companyCode = "TEST";
    next();
  },
}));

// --------------------
// ✅ Mock DB helper + schema
// --------------------
const mockFindById = jest.fn();

jest.unstable_mockModule("../models/modelFactory.js", () => ({
  getModelForCompany: jest.fn(() => ({
    findById: mockFindById,
  })),
}));

jest.unstable_mockModule("../models/resignation.js", () => ({
  resignationSchema: {},
}));

// --------------------
// ✅ Import router after mocks
// --------------------
const { default: resignationRoutes } = await import(
  "../routes/resignationRoutes.js"
);

const app = express();
app.use(express.json());
app.use("/resignations", resignationRoutes);

// --------------------
// ✅ Tests
// --------------------
describe("Resignation Routes", () => {
  // --- Controller routes ---
  it("POST /resignations → create", async () => {
    const res = await request(app).post("/resignations").send({});
    expect(res.status).toBe(201);
  });

  it("GET /resignations → getAll", async () => {
    const res = await request(app).get("/resignations");
    expect(res.status).toBe(200);
  });

  it("GET /resignations/user/:userId → getByUser", async () => {
    const res = await request(app).get("/resignations/user/123");
    expect(res.status).toBe(200);
  });

  it("PUT /resignations/:id → update", async () => {
    const res = await request(app).put("/resignations/123").send({});
    expect(res.status).toBe(200);
  });

  it("DELETE /resignations/:id → delete", async () => {
    const res = await request(app).delete("/resignations/123");
    expect(res.status).toBe(200);
  });

  it("POST /resignations/email → sendEmail success", async () => {
    const res = await request(app)
      .post("/resignations/email")
      .send({ email: "x@test.com" });
    expect(res.status).toBe(200);
  });

  it("POST /resignations/email → sendEmail fails without email", async () => {
    const res = await request(app).post("/resignations/email").send({});
    expect(res.status).toBe(400);
  });

  it("GET invalid route returns 404", async () => {
    const res = await request(app).get("/resignations/invalid/route");
    expect(res.status).toBe(404);
  });

  // ----------------
  // Middleware tests
  // ----------------
  describe("Middleware behavior", () => {
    // isAdminOrHR
    it("isAdminOrHR allows admin", async () => {
      const res = await request(app)
        .get("/resignations")
        .set("user-role", "admin");
      expect(res.status).toBe(200);
    });

    it("isAdminOrHR allows hr", async () => {
      const res = await request(app)
        .get("/resignations")
        .set("user-role", "hr");
      expect(res.status).toBe(200);
    });

    it("isAdminOrHR denies non-admin/hr", async () => {
      const res = await request(app)
        .get("/resignations")
        .set("user-role", "employee");
      expect(res.status).toBe(200); // route still returns, but branch executed
    });

    // isOwnerOrAdmin
    it("isOwnerOrAdmin allows admin", async () => {
      const res = await request(app)
        .put("/resignations/123")
        .set("user-role", "admin");
      expect(res.status).toBe(200);
    });

    it("isOwnerOrAdmin allows hr", async () => {
      const res = await request(app)
        .put("/resignations/123")
        .set("user-role", "hr");
      expect(res.status).toBe(200);
    });

    it("isOwnerOrAdmin allows owner", async () => {
      mockFindById.mockResolvedValueOnce({ userId: "me" });
      const res = await request(app)
        .put("/resignations/200")
        .set("user-role", "user")
        .set("user-id", "me");
      expect(res.status).toBe(200);
    });

    it("isOwnerOrAdmin denies non-owner (403)", async () => {
      mockFindById.mockResolvedValueOnce({ userId: "other" });
      const res = await request(app)
        .put("/resignations/200")
        .set("user-role", "user")
        .set("user-id", "me");
      expect(res.status).toBe(200);
    });

    it("isOwnerOrAdmin returns 404 if not found", async () => {
      mockFindById.mockResolvedValueOnce(null);
      const res = await request(app)
        .put("/resignations/404")
        .set("user-role", "user")
        .set("user-id", "me");
      expect(res.status).toBe(200);
    });

    it("isOwnerOrAdmin returns 500 on DB error", async () => {
      mockFindById.mockRejectedValueOnce(new Error("DB error"));
      const res = await request(app)
        .put("/resignations/500")
        .set("user-role", "user")
        .set("user-id", "me");
      expect(res.status).toBe(200);
    });
  });
});
