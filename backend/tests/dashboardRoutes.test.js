// tests/dashboardRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock controllers ---
const getAttendanceStats = jest.fn((req, res) =>
  res.status(200).json({ route: "getAttendanceStats" })
);
const getAttendanceTrends = jest.fn((req, res) =>
  res.status(200).json({ route: "getAttendanceTrends" })
);
const getWorkTypeDistribution = jest.fn((req, res) =>
  res.status(200).json({ route: "getWorkTypeDistribution" })
);
const getDepartmentSummary = jest.fn((req, res) =>
  res.status(200).json({ route: "getDepartmentSummary" })
);

// Replace real controller imports with mocks
await jest.unstable_mockModule("../controllers/dashboardController.js", () => ({
  __esModule: true,
  getAttendanceStats,
  getAttendanceTrends,
  getWorkTypeDistribution,
  getDepartmentSummary,
}));

// Import router AFTER mocking
const { default: dashboardRoutes } = await import("../routes/dashboardRoutes.js");

// Setup Express app for testing
const app = express();
app.use("/", dashboardRoutes);

describe("Dashboard Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/dashboard/attendance-stats should call getAttendanceStats", async () => {
    const res = await request(app).get("/api/dashboard/attendance-stats");
    expect(res.status).toBe(200);
    expect(getAttendanceStats).toHaveBeenCalled();
    expect(res.body).toEqual({ route: "getAttendanceStats" });
  });

  it("GET /api/dashboard/attendance-trends should call getAttendanceTrends", async () => {
    const res = await request(app).get("/api/dashboard/attendance-trends");
    expect(res.status).toBe(200);
    expect(getAttendanceTrends).toHaveBeenCalled();
    expect(res.body).toEqual({ route: "getAttendanceTrends" });
  });

  it("GET /api/dashboard/work-type-distribution should call getWorkTypeDistribution", async () => {
    const res = await request(app).get("/api/dashboard/work-type-distribution");
    expect(res.status).toBe(200);
    expect(getWorkTypeDistribution).toHaveBeenCalled();
    expect(res.body).toEqual({ route: "getWorkTypeDistribution" });
  });

  it("GET /api/dashboard/department-summary should call getDepartmentSummary", async () => {
    const res = await request(app).get("/api/dashboard/department-summary");
    expect(res.status).toBe(200);
    expect(getDepartmentSummary).toHaveBeenCalled();
    expect(res.body).toEqual({ route: "getDepartmentSummary" });
  });
});
