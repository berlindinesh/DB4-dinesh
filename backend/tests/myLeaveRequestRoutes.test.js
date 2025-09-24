// tests/myLeaveRequestRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock middleware ---
const mockAuthenticate = jest.fn((req, res, next) => next());
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: mockAuthenticate,
}));

// --- Mock controllers ---
jest.unstable_mockModule("../controllers/myLeaveRequestController.js", () => ({
  getAllLeaveRequests: jest.fn((req, res) => res.json({ route: "getAllLeaveRequests" })),
  createLeaveRequest: jest.fn((req, res) => res.status(201).json({ route: "createLeaveRequest" })),
  updateLeaveComment: jest.fn((req, res) => res.json({ route: "updateLeaveComment", id: req.params.id })),
  deleteLeaveRequest: jest.fn((req, res) => res.json({ route: "deleteLeaveRequest", id: req.params.id })),
  approveLeaveRequest: jest.fn((req, res) => res.json({ route: "approveLeaveRequest", id: req.params.id })),
  rejectLeaveRequest: jest.fn((req, res) => res.json({ route: "rejectLeaveRequest", id: req.params.id })),
  getEmployeeLeaveRequests: jest.fn((req, res) => res.json({ route: "getEmployeeLeaveRequests", employeeCode: req.params.employeeCode })),
  getLeaveBalance: jest.fn((req, res) => res.json({ route: "getLeaveBalance", employeeCode: req.params.employeeCode })),
  getLeaveStatistics: jest.fn((req, res) => res.json({ route: "getLeaveStatistics", employeeCode: req.params.employeeCode })),
  resetAnnualLeaves: jest.fn((req, res) => res.json({ route: "resetAnnualLeaves" })),
  recalculateLeaveBalance: jest.fn((req, res) => res.json({ route: "recalculateLeaveBalance", employeeCode: req.params.employeeCode })),
  updateEarnedLeaveBalance: jest.fn((req, res) => res.json({ route: "updateEarnedLeaveBalance" })),
  bulkApproveLeaveRequests: jest.fn((req, res) => res.json({ route: "bulkApproveLeaveRequests" })),
  bulkRejectLeaveRequests: jest.fn((req, res) => res.json({ route: "bulkRejectLeaveRequests" })),
}));

// Import router after mocks
const { default: myLeaveRequestRouter } = await import("../routes/myLeaveRequestRoutes.js");

const app = express();
app.use(express.json());
app.use("/leave-requests", myLeaveRequestRouter);

describe("myLeaveRequestRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Employee routes ---
  it("GET /leave-requests/employee/:employeeCode → getEmployeeLeaveRequests", async () => {
    const res = await request(app).get("/leave-requests/employee/E123");
    expect(res.body).toEqual({ route: "getEmployeeLeaveRequests", employeeCode: "E123" });
  });

  it("GET /leave-requests/balance/:employeeCode → getLeaveBalance", async () => {
    const res = await request(app).get("/leave-requests/balance/E456");
    expect(res.body).toEqual({ route: "getLeaveBalance", employeeCode: "E456" });
  });

  it("GET /leave-requests/statistics/:employeeCode → getLeaveStatistics", async () => {
    const res = await request(app).get("/leave-requests/statistics/E789");
    expect(res.body).toEqual({ route: "getLeaveStatistics", employeeCode: "E789" });
  });

  // --- Admin/HR routes ---
  it("GET /leave-requests → getAllLeaveRequests", async () => {
    const res = await request(app).get("/leave-requests");
    expect(res.body).toEqual({ route: "getAllLeaveRequests" });
  });

  it("POST /leave-requests → createLeaveRequest", async () => {
    const res = await request(app).post("/leave-requests").send({ reason: "Vacation" });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe("createLeaveRequest");
  });

  it("DELETE /leave-requests/:id → deleteLeaveRequest", async () => {
    const res = await request(app).delete("/leave-requests/123");
    expect(res.body).toEqual({ route: "deleteLeaveRequest", id: "123" });
  });

  it("PUT /leave-requests/:id/approve → approveLeaveRequest", async () => {
    const res = await request(app).put("/leave-requests/456/approve");
    expect(res.body).toEqual({ route: "approveLeaveRequest", id: "456" });
  });

  it("PUT /leave-requests/:id/reject → rejectLeaveRequest", async () => {
    const res = await request(app).put("/leave-requests/789/reject");
    expect(res.body).toEqual({ route: "rejectLeaveRequest", id: "789" });
  });

  it("POST /leave-requests/reset-annual → resetAnnualLeaves", async () => {
    const res = await request(app).post("/leave-requests/reset-annual");
    expect(res.body.route).toBe("resetAnnualLeaves");
  });

  it("POST /leave-requests/update-earned-leave → updateEarnedLeaveBalance", async () => {
    const res = await request(app).post("/leave-requests/update-earned-leave");
    expect(res.body.route).toBe("updateEarnedLeaveBalance");
  });

  it("POST /leave-requests/recalculate-balance/:employeeCode → recalculateLeaveBalance", async () => {
    const res = await request(app).post("/leave-requests/recalculate-balance/E111");
    expect(res.body).toEqual({ route: "recalculateLeaveBalance", employeeCode: "E111" });
  });

  // --- Bulk routes ---
  it("POST /leave-requests/bulk-approve → bulkApproveLeaveRequests", async () => {
    const res = await request(app).post("/leave-requests/bulk-approve");
    expect(res.body.route).toBe("bulkApproveLeaveRequests");
  });

  it("POST /leave-requests/bulk-reject → bulkRejectLeaveRequests", async () => {
    const res = await request(app).post("/leave-requests/bulk-reject");
    expect(res.body.route).toBe("bulkRejectLeaveRequests");
  });

  // --- Comment update ---
  it("PUT /leave-requests/:id → updateLeaveComment", async () => {
    const res = await request(app).put("/leave-requests/999").send({ comment: "Needs review" });
    expect(res.body).toEqual({ route: "updateLeaveComment", id: "999" });
  });

  // --- Middleware ---
  it("should call authenticate middleware", async () => {
    await request(app).get("/leave-requests");
    expect(mockAuthenticate).toHaveBeenCalled();
  });
});
