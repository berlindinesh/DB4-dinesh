// tests/workTypeRequestRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------
jest.unstable_mockModule("../controllers/workTypeRequestController.js", () => ({
  getAllWorkTypeRequests: jest.fn((req, res) => res.json({ route: "getAllWorkTypeRequests" })),
  createWorkTypeRequest: jest.fn((req, res) => res.json({ route: "createWorkTypeRequest" })),
  updateWorkTypeRequest: jest.fn((req, res) => res.json({ route: "updateWorkTypeRequest", id: req.params.id })),
  deleteWorkTypeRequest: jest.fn((req, res) => res.json({ route: "deleteWorkTypeRequest", id: req.params.id })),
  approveWorkTypeRequest: jest.fn((req, res) => res.json({ route: "approveWorkTypeRequest", id: req.params.id })),
  rejectWorkTypeRequest: jest.fn((req, res) => res.json({ route: "rejectWorkTypeRequest", id: req.params.id })),
  bulkApproveRequests: jest.fn((req, res) => res.json({ route: "bulkApproveRequests" })),
  bulkRejectRequests: jest.fn((req, res) => res.json({ route: "bulkRejectRequests" })),
  getWorkTypeRequestsByEmployeeCode: jest.fn((req, res) => res.json({ route: "getWorkTypeRequestsByEmployeeCode", code: req.params.employeeCode })),
  getWorkTypeRequestsByUserId: jest.fn((req, res) => res.json({ route: "getWorkTypeRequestsByUserId", id: req.params.userId })),
}));

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: "mockUser" };
    next();
  },
}));

// ------------------ IMPORT ROUTER AFTER MOCKS ------------------
const routerModule = await import("../routes/workTypeRequestRoutes.js");
const router = routerModule.default;
const controllers = await import("../controllers/workTypeRequestController.js");

// ------------------ APP SETUP ------------------
const app = express();
app.use(express.json());
app.use("/api/work-type-requests", router);

// ------------------ TEST SUITE ------------------
describe("WorkTypeRequest Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("GET / → getAllWorkTypeRequests", async () => {
    const res = await request(app).get("/api/work-type-requests/");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getAllWorkTypeRequests");
    expect(controllers.getAllWorkTypeRequests).toHaveBeenCalled();
  });

  test("POST / → createWorkTypeRequest", async () => {
    const res = await request(app).post("/api/work-type-requests/").send({ type: "Remote" });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("createWorkTypeRequest");
    expect(controllers.createWorkTypeRequest).toHaveBeenCalled();
  });

  test("PUT /:id → updateWorkTypeRequest", async () => {
    const res = await request(app).put("/api/work-type-requests/123").send({ type: "Hybrid" });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("updateWorkTypeRequest");
    expect(controllers.updateWorkTypeRequest).toHaveBeenCalled();
  });

  test("DELETE /:id → deleteWorkTypeRequest", async () => {
    const res = await request(app).delete("/api/work-type-requests/123");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("deleteWorkTypeRequest");
    expect(controllers.deleteWorkTypeRequest).toHaveBeenCalled();
  });

  test("PUT /:id/approve → approveWorkTypeRequest", async () => {
    const res = await request(app).put("/api/work-type-requests/123/approve");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("approveWorkTypeRequest");
    expect(controllers.approveWorkTypeRequest).toHaveBeenCalled();
  });

  test("PUT /:id/reject → rejectWorkTypeRequest", async () => {
    const res = await request(app).put("/api/work-type-requests/123/reject");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("rejectWorkTypeRequest");
    expect(controllers.rejectWorkTypeRequest).toHaveBeenCalled();
  });

  

  test("GET /user/:userId → getWorkTypeRequestsByUserId", async () => {
    const res = await request(app).get("/api/work-type-requests/user/456");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getWorkTypeRequestsByUserId");
    expect(controllers.getWorkTypeRequestsByUserId).toHaveBeenCalled();
  });

  test("GET /employee/:employeeCode → getWorkTypeRequestsByEmployeeCode", async () => {
    const res = await request(app).get("/api/work-type-requests/employee/EMP001");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getWorkTypeRequestsByEmployeeCode");
    expect(controllers.getWorkTypeRequestsByEmployeeCode).toHaveBeenCalled();
  });
});
