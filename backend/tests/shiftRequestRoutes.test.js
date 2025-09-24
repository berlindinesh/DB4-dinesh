// tests/shiftRequestRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------
// Mock controller functions
jest.unstable_mockModule("../controllers/shiftRequestController.js", () => ({
  getAllShiftRequests: jest.fn((req, res) => res.json({ route: "getAllShiftRequests" })),
  createShiftRequest: jest.fn((req, res) => res.json({ route: "createShiftRequest" })),
  updateShiftRequest: jest.fn((req, res) => res.json({ route: "updateShiftRequest", id: req.params.id })),
  deleteShiftRequest: jest.fn((req, res) => res.json({ route: "deleteShiftRequest", id: req.params.id })),
  approveShiftRequest: jest.fn((req, res) => res.json({ route: "approveShiftRequest", id: req.params.id })),
  rejectShiftRequest: jest.fn((req, res) => res.json({ route: "rejectShiftRequest", id: req.params.id })),
  bulkApproveRequests: jest.fn((req, res) => res.json({ route: "bulkApproveRequests" })),
  bulkRejectRequests: jest.fn((req, res) => res.json({ route: "bulkRejectRequests" })),
  getUserShiftRequests: jest.fn((req, res) => res.json({ route: "getUserShiftRequests", userId: req.params.userId })),
}));

// Mock authenticate middleware
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: "mockUser" }; // fake user
    next();
  },
}));

// ------------------ IMPORT ROUTER AFTER MOCKS ------------------
const routerModule = await import("../routes/shiftRequestRoutes.js");
const router = routerModule.default;
const controllers = await import("../controllers/shiftRequestController.js");

// ------------------ APP SETUP ------------------
const app = express();
app.use(express.json());
app.use("/api", router);

// ------------------ TEST SUITE ------------------
describe("Shift Request Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("GET /shifts", async () => {
    const res = await request(app).get("/api/shifts");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getAllShiftRequests");
    expect(controllers.getAllShiftRequests).toHaveBeenCalled();
  });

  test("GET /shifts/user/:userId", async () => {
    const res = await request(app).get("/api/shifts/user/123");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "getUserShiftRequests", userId: "123" });
    expect(controllers.getUserShiftRequests).toHaveBeenCalled();
  });

  test("POST /shifts", async () => {
    const res = await request(app).post("/api/shifts").send({ shift: "morning" });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("createShiftRequest");
    expect(controllers.createShiftRequest).toHaveBeenCalled();
  });

  test("PUT /shifts/:id", async () => {
    const res = await request(app).put("/api/shifts/abc123").send({ shift: "evening" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "updateShiftRequest", id: "abc123" });
    expect(controllers.updateShiftRequest).toHaveBeenCalled();
  });

  test("DELETE /shifts/:id", async () => {
    const res = await request(app).delete("/api/shifts/abc123");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "deleteShiftRequest", id: "abc123" });
    expect(controllers.deleteShiftRequest).toHaveBeenCalled();
  });

  test("PUT /shifts/:id/approve", async () => {
    const res = await request(app).put("/api/shifts/abc123/approve");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "approveShiftRequest", id: "abc123" });
    expect(controllers.approveShiftRequest).toHaveBeenCalled();
  });

  test("PUT /shifts/:id/reject", async () => {
    const res = await request(app).put("/api/shifts/abc123/reject");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "rejectShiftRequest", id: "abc123" });
    expect(controllers.rejectShiftRequest).toHaveBeenCalled();
  });

  test("POST /shifts/bulk-approve", async () => {
    const res = await request(app).post("/api/shifts/bulk-approve").send({ ids: [1, 2] });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("bulkApproveRequests");
    expect(controllers.bulkApproveRequests).toHaveBeenCalled();
  });

  test("POST /shifts/bulk-reject", async () => {
    const res = await request(app).post("/api/shifts/bulk-reject").send({ ids: [1, 2] });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("bulkRejectRequests");
    expect(controllers.bulkRejectRequests).toHaveBeenCalled();
  });
});
