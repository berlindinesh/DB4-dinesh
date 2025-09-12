// tests/candidateRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock controller functions ---
const addCandidate = jest.fn((req, res) => res.json({ route: "add" }));
const getCandidatesByRecruitment = jest.fn((req, res) =>
  res.json({ route: "get", recruitment: req.params.recruitment })
);
const updateCandidate = jest.fn((req, res) =>
  res.json({ route: "update", id: req.params.id })
);
const deleteCandidate = jest.fn((req, res) =>
  res.json({ route: "delete", id: req.params.id })
);

// Mock authenticate middleware (just passes through)
const authenticate = jest.fn((req, res, next) => next());

// --- Mock imports before loading router ---
await jest.unstable_mockModule("../controllers/candidateController.js", () => ({
  addCandidate,
  getCandidatesByRecruitment,
  updateCandidate,
  deleteCandidate,
}));
await jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate,
}));

// Import the router after mocks
const { default: candidateRouter } = await import(
  "../routes/candidateRoutes.js"
);

// Build an Express app with the router mounted
const app = express();
app.use(express.json());
app.use("/", candidateRouter);

describe("candidateRoutes", () => {
  it("POST /api/recruitment calls addCandidate", async () => {
    const res = await request(app).post("/api/recruitment").send({ name: "John" });
    expect(res.body).toEqual({ route: "add" });
    expect(addCandidate).toHaveBeenCalled();
    expect(authenticate).toHaveBeenCalled();
  });

  it("GET /api/recruitment/:recruitment calls getCandidatesByRecruitment", async () => {
    const res = await request(app).get("/api/recruitment/drive1");
    expect(res.body).toEqual({ route: "get", recruitment: "drive1" });
    expect(getCandidatesByRecruitment).toHaveBeenCalled();
  });

  it("PUT /api/recruitment/:id calls updateCandidate", async () => {
    const res = await request(app).put("/api/recruitment/123").send({ status: "updated" });
    expect(res.body).toEqual({ route: "update", id: "123" });
    expect(updateCandidate).toHaveBeenCalled();
  });

  it("DELETE /api/recruitment/:id calls deleteCandidate", async () => {
    const res = await request(app).delete("/api/recruitment/456");
    expect(res.body).toEqual({ route: "delete", id: "456" });
    expect(deleteCandidate).toHaveBeenCalled();
  });

  it("module loads correctly (export default router)", async () => {
    const routerModule = await import("../routes/candidateRoutes.js");
    expect(routerModule).toBeDefined();
    expect(routerModule.default).toBeDefined();
  });
});
