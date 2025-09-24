// tests/leaveRequestRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock Controllers ---
jest.unstable_mockModule("../controllers/leaveRequestController.js", () => ({
  getLeaveRequests: jest.fn((req, res) => res.status(200).json({ route: "getLeaveRequests" })),
  createLeaveRequest: jest.fn((req, res) => res.status(201).json({ route: "createLeaveRequest" })),
  updateLeaveRequest: jest.fn((req, res) => res.status(200).json({ route: "updateLeaveRequest", id: req.params.id })),
  deleteLeaveRequest: jest.fn((req, res) => res.status(200).json({ route: "deleteLeaveRequest", id: req.params.id })),
  updateLeaveStatus: jest.fn((req, res) => res.status(200).json({ route: "updateLeaveStatus", id: req.params.id })),
  updateLeaveComment: jest.fn((req, res) => res.status(200).json({ route: "updateLeaveComment", id: req.params.id })),
  approveLeaveRequest: jest.fn((req, res) => res.status(200).json({ route: "approveLeaveRequest", id: req.params.id })),
  rejectLeaveRequest: jest.fn((req, res) => res.status(200).json({ route: "rejectLeaveRequest", id: req.params.id })),
  getEmployeeLeaveRequests: jest.fn((req, res) => res.status(200).json({ route: "getEmployeeLeaveRequests", employeeId: req.params.employeeId })),
}));

// Import router after mocks
const { default: leaveRequestRouter } = await import("../routes/leaveRequestRoutes.js");

const app = express();
app.use(express.json());
app.use("/leave-requests", leaveRequestRouter);

describe("leaveRequestRoutes", () => {
  it("GET /leave-requests → getLeaveRequests", async () => {
    const res = await request(app).get("/leave-requests");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getLeaveRequests");
  });

  it("POST /leave-requests → createLeaveRequest", async () => {
    const res = await request(app).post("/leave-requests").send({ reason: "Vacation" });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe("createLeaveRequest");
  });

  it("PUT /leave-requests/:id → updateLeaveRequest", async () => {
    const res = await request(app).put("/leave-requests/123").send({ reason: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "updateLeaveRequest", id: "123" });
  });

  it("DELETE /leave-requests/:id → deleteLeaveRequest", async () => {
    const res = await request(app).delete("/leave-requests/456");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "deleteLeaveRequest", id: "456" });
  });

  it("PUT /leave-requests/:id/status → updateLeaveStatus", async () => {
    const res = await request(app).put("/leave-requests/789/status");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "updateLeaveStatus", id: "789" });
  });

  it("PUT /leave-requests/:id/comment → updateLeaveComment", async () => {
    const res = await request(app).put("/leave-requests/321/comment");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "updateLeaveComment", id: "321" });
  });

  it("PUT /leave-requests/:id/approve → approveLeaveRequest", async () => {
    const res = await request(app).put("/leave-requests/654/approve");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "approveLeaveRequest", id: "654" });
  });

  it("PUT /leave-requests/:id/reject → rejectLeaveRequest", async () => {
    const res = await request(app).put("/leave-requests/987/reject");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "rejectLeaveRequest", id: "987" });
  });

  it("GET /leave-requests/employee/:employeeId → getEmployeeLeaveRequests", async () => {
    const res = await request(app).get("/leave-requests/employee/emp123");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: "getEmployeeLeaveRequests", employeeId: "emp123" });
  });
});
