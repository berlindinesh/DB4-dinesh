// tests/timeOffRequestRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------
jest.unstable_mockModule("../controllers/timeOffRequestController.js", () => ({
  getAllRequests: jest.fn((req, res) => res.json({ route: "getAllRequests" })),
  getRequestsByUserId: jest.fn((req, res) =>
    res.json({ route: "getRequestsByUserId", userId: req.params.userId })
  ),
  createRequest: jest.fn((req, res) => res.json({ route: "createRequest", body: req.body })),
  getRequestById: jest.fn((req, res) =>
    res.json({ route: "getRequestById", id: req.params.id })
  ),
  updateRequest: jest.fn((req, res) =>
    res.json({ route: "updateRequest", id: req.params.id, body: req.body })
  ),
  deleteRequest: jest.fn((req, res) =>
    res.json({ route: "deleteRequest", id: req.params.id })
  ),
  getRequestStats: jest.fn((req, res) => res.json({ route: "getRequestStats" })),
}));

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: "mockUser" };
    next();
  },
}));

// ------------------ IMPORT ROUTER AFTER MOCKS ------------------
const routerModule = await import("../routes/timeOffRequests.js");
const router = routerModule.default;
const controllers = await import("../controllers/timeOffRequestController.js");

// ------------------ APP SETUP ------------------
const app = express();
app.use(express.json());
app.use("/api/timeoff", router);

// ------------------ TEST SUITE ------------------
describe("Time Off Request Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("GET /api/timeoff/ → getAllRequests", async () => {
    const res = await request(app).get("/api/timeoff/");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getAllRequests");
    expect(controllers.getAllRequests).toHaveBeenCalled();
  });

  test("GET /api/timeoff/stats → getRequestStats", async () => {
    const res = await request(app).get("/api/timeoff/stats");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getRequestStats");
    expect(controllers.getRequestStats).toHaveBeenCalled();
  });

  test("GET /api/timeoff/user/:userId → getRequestsByUserId", async () => {
    const res = await request(app).get("/api/timeoff/user/123");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "getRequestsByUserId", userId: "123" });
    expect(controllers.getRequestsByUserId).toHaveBeenCalled();
  });

  test("GET /api/timeoff/:id → getRequestById", async () => {
    const res = await request(app).get("/api/timeoff/abc123");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "getRequestById", id: "abc123" });
    expect(controllers.getRequestById).toHaveBeenCalled();
  });

  test("POST /api/timeoff/ → createRequest", async () => {
    const res = await request(app).post("/api/timeoff/").send({ type: "vacation" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "createRequest", body: { type: "vacation" } });
    expect(controllers.createRequest).toHaveBeenCalled();
  });

  test("PUT /api/timeoff/:id → updateRequest", async () => {
    const res = await request(app).put("/api/timeoff/xyz789").send({ type: "sick" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "updateRequest", id: "xyz789", body: { type: "sick" } });
    expect(controllers.updateRequest).toHaveBeenCalled();
  });

  test("DELETE /api/timeoff/:id → deleteRequest", async () => {
    const res = await request(app).delete("/api/timeoff/xyz789");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "deleteRequest", id: "xyz789" });
    expect(controllers.deleteRequest).toHaveBeenCalled();
  });
});
