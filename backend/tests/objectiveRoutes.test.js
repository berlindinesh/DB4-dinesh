// tests/objectiveRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock middleware ---
const mockAuthenticate = jest.fn((req, res, next) => next());
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: mockAuthenticate,
}));

// --- Mock controllers ---
jest.unstable_mockModule("../controllers/objectiveController.js", () => ({
  getObjectives: jest.fn((req, res) => res.json({ route: "getObjectives" })),
  createObjective: jest.fn((req, res) => res.status(201).json({ route: "createObjective" })),
  updateObjective: jest.fn((req, res) => res.json({ route: "updateObjective", id: req.params.id })),
  deleteObjective: jest.fn((req, res) => res.json({ route: "deleteObjective", id: req.params.id })),
  toggleArchive: jest.fn((req, res) => res.json({ route: "toggleArchive", id: req.params.id })),
  getObjectivesByUser: jest.fn((req, res) => res.json({ route: "getObjectivesByUser", userId: req.params.userId })),
  calculateObjectiveProgress: jest.fn((req, res) => res.json({ route: "calculateObjectiveProgress", id: req.params.id })),
  updateKeyResultStatus: jest.fn((req, res) => res.json({
    route: "updateKeyResultStatus",
    objectiveId: req.params.objectiveId,
    keyResultIndex: req.params.keyResultIndex,
  })),
}));

// Import router after mocks
const { default: objectiveRouter } = await import("../routes/objectiveRoutes.js");

const app = express();
app.use(express.json());
app.use("/objectives", objectiveRouter);

describe("objectiveRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /objectives → getObjectives", async () => {
    const res = await request(app).get("/objectives");
    expect(res.body.route).toBe("getObjectives");
  });

  it("POST /objectives → createObjective", async () => {
    const res = await request(app).post("/objectives").send({ title: "New Objective" });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe("createObjective");
  });

  it("PUT /objectives/:id → updateObjective", async () => {
    const res = await request(app).put("/objectives/123");
    expect(res.body).toEqual({ route: "updateObjective", id: "123" });
  });

  it("DELETE /objectives/:id → deleteObjective", async () => {
    const res = await request(app).delete("/objectives/456");
    expect(res.body).toEqual({ route: "deleteObjective", id: "456" });
  });

  it("GET /objectives/:id/progress → calculateObjectiveProgress", async () => {
    const res = await request(app).get("/objectives/789/progress");
    expect(res.body).toEqual({ route: "calculateObjectiveProgress", id: "789" });
  });

  it("PATCH /objectives/:objectiveId/keyresults/:keyResultIndex → updateKeyResultStatus", async () => {
    const res = await request(app).patch("/objectives/111/keyresults/2");
    expect(res.body).toEqual({ route: "updateKeyResultStatus", objectiveId: "111", keyResultIndex: "2" });
  });

  it("OPTIONS /objectives/:id/archive → should return 204 with CORS headers", async () => {
    const res = await request(app).options("/objectives/222/archive");
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("PATCH");
  });

  it("PATCH /objectives/:id/archive → toggleArchive", async () => {
    const res = await request(app).patch("/objectives/333/archive");
    expect(res.body).toEqual({ route: "toggleArchive", id: "333" });
  });

  it("GET /objectives/user/:userId → getObjectivesByUser", async () => {
    const res = await request(app).get("/objectives/user/U123");
    expect(res.body).toEqual({ route: "getObjectivesByUser", userId: "U123" });
  });

  it("should call authenticate middleware on all routes", async () => {
    await request(app).get("/objectives");
    expect(mockAuthenticate).toHaveBeenCalled();
  });
});
