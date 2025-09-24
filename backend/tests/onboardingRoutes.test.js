// tests/onboardingRoutes.test.js
import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Correct ESM mocking ---
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.companyCode = "testCompany"; // fake authentication
    next();
  },
}));

const mockControllers = {
  getCandidates: jest.fn((req, res) => res.json({ route: "getCandidates" })),
  createCandidate: jest.fn((req, res) => res.json({ route: "createCandidate" })),
  updateCandidate: jest.fn((req, res) => res.json({ route: "updateCandidate" })),
  deleteCandidate: jest.fn((req, res) => res.json({ route: "deleteCandidate" })),
  sendEmail: jest.fn((req, res) => res.json({ route: "sendEmail" })),
  filterByStage: jest.fn((req, res) => res.json({ route: "filterByStage" })),
};

jest.unstable_mockModule("../controllers/onboardingController.js", () => mockControllers);

// Import router after mocks are registered
let onboardingRoutes;
beforeAll(async () => {
  onboardingRoutes = (await import("../routes/onboardingRoutes.js")).default;
});

let app;
beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use("/onboarding", onboardingRoutes);

  // reset mocks
  Object.values(mockControllers).forEach(fn => fn.mockClear());
});

describe("✅ onboardingRoutes", () => {
  it("GET / should call getCandidates", async () => {
    const res = await request(app).get("/onboarding");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "getCandidates" });
    expect(mockControllers.getCandidates).toHaveBeenCalled();
  });

  it("POST / should call createCandidate", async () => {
    const res = await request(app).post("/onboarding").send({ name: "John" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "createCandidate" });
    expect(mockControllers.createCandidate).toHaveBeenCalled();
  });

  it("PUT /:id should call updateCandidate", async () => {
    const res = await request(app).put("/onboarding/123").send({ name: "Jane" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "updateCandidate" });
    expect(mockControllers.updateCandidate).toHaveBeenCalled();
  });

  it("DELETE /:id should call deleteCandidate", async () => {
    const res = await request(app).delete("/onboarding/123");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "deleteCandidate" });
    expect(mockControllers.deleteCandidate).toHaveBeenCalled();
  });

  it("POST /send-email should call sendEmail", async () => {
    const res = await request(app).post("/onboarding/send-email").send({ email: "test@test.com" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "sendEmail" });
    expect(mockControllers.sendEmail).toHaveBeenCalled();
  });

  it("GET /filter should call filterByStage", async () => {
    const res = await request(app).get("/onboarding/filter?stage=applied");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "filterByStage" });
    expect(mockControllers.filterByStage).toHaveBeenCalled();
  });
});
