// tests/skillZoneRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------
jest.unstable_mockModule("../controllers/skillZoneController.js", () => ({
  getAllSkills: jest.fn((req, res) => res.json({ route: "getAllSkills" })),
  addSkill: jest.fn((req, res) => res.json({ route: "addSkill" })),
  addCandidate: jest.fn((req, res) =>
    res.json({ route: "addCandidate", skillId: req.params.skillId })
  ),
  updateCandidate: jest.fn((req, res) =>
    res.json({
      route: "updateCandidate",
      skillId: req.params.skillId,
      candidateId: req.params.candidateId,
    })
  ),
  deleteCandidate: jest.fn((req, res) =>
    res.json({
      route: "deleteCandidate",
      skillId: req.params.skillId,
      candidateId: req.params.candidateId,
    })
  ),
  deleteSkill: jest.fn((req, res) =>
    res.json({ route: "deleteSkill", skillId: req.params.skillId })
  ),
}));

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: "mockUser" };
    next();
  },
}));

// ------------------ IMPORT ROUTER AFTER MOCKS ------------------
const routerModule = await import("../routes/skillZoneRoutes.js");
const router = routerModule.default;
const controllers = await import("../controllers/skillZoneController.js");

// ------------------ APP SETUP ------------------
const app = express();
app.use(express.json());
app.use(router);

// ------------------ TEST SUITE ------------------
describe("Skill Zone Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("GET /api/skill-zone", async () => {
    const res = await request(app).get("/api/skill-zone");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getAllSkills");
    expect(controllers.getAllSkills).toHaveBeenCalled();
  });

  test("POST /api/skill-zone", async () => {
    const res = await request(app).post("/api/skill-zone").send({ name: "Node.js" });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("addSkill");
    expect(controllers.addSkill).toHaveBeenCalled();
  });

  test("POST /api/skill-zone/:skillId/candidates", async () => {
    const res = await request(app).post("/api/skill-zone/123/candidates").send({ name: "Alice" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "addCandidate", skillId: "123" });
    expect(controllers.addCandidate).toHaveBeenCalled();
  });

  test("PUT /api/skill-zone/:skillId/candidates/:candidateId", async () => {
    const res = await request(app)
      .put("/api/skill-zone/123/candidates/456")
      .send({ name: "Updated Alice" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "updateCandidate", skillId: "123", candidateId: "456" });
    expect(controllers.updateCandidate).toHaveBeenCalled();
  });

  test("DELETE /api/skill-zone/:skillId/candidates/:candidateId", async () => {
    const res = await request(app).delete("/api/skill-zone/123/candidates/456");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "deleteCandidate", skillId: "123", candidateId: "456" });
    expect(controllers.deleteCandidate).toHaveBeenCalled();
  });

  test("DELETE /api/skill-zone/:skillId", async () => {
    const res = await request(app).delete("/api/skill-zone/789");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "deleteSkill", skillId: "789" });
    expect(controllers.deleteSkill).toHaveBeenCalled();
  });
});
