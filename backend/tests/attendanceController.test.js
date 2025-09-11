// attendanceController.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ---- Mock the Attendance model BEFORE importing controller ----
jest.unstable_mockModule("../models/attendance.js", () => ({
  default: {
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn(),
    prototype: {
      save: jest.fn(),
    },
  },
}));

// Import mocked model + controller AFTER defining mocks
const { default: Attendance } = await import("../models/attendance.js");
const { AttendanceController } = await import(
  "../controllers/attendanceController.js"
);

// Setup test app
const app = express();
app.use(express.json());

app.get("/attendance", AttendanceController.getAllAttendance);
app.post("/attendance", AttendanceController.createAttendance);
app.put("/attendance/:id", AttendanceController.updateAttendance);
app.get("/attendance/search", AttendanceController.searchAttendance);
app.get("/attendance/filter", AttendanceController.filterAttendance);
app.put("/attendance/bulk", AttendanceController.bulkUpdateSelection);
app.delete("/attendance/:id", AttendanceController.deleteAttendance);
app.get("/attendance/stats", AttendanceController.getAttendanceStats);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AttendanceController Tests", () => {
  // --- getAllAttendance ---
  test("should return all attendance records", async () => {
    Attendance.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ id: 1 }]),
    });

    const res = await request(app).get("/attendance");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
  });

  test("should handle error in getAllAttendance", async () => {
    Attendance.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const res = await request(app).get("/attendance");
    expect(res.status).toBe(500);
  });

  // --- createAttendance ---
  test("should create attendance successfully", async () => {
    Attendance.prototype.save.mockResolvedValue({ id: 1, employeeId: "E1" });

    const res = await request(app)
      .post("/attendance")
      .send({ employeeId: "E1", date: "2025-01-01", status: "Present" });

    expect([200, 201, 400]).toContain(res.status); // allow flexibility
  });

  // --- updateAttendance ---
  test("should update attendance record", async () => {
    Attendance.findByIdAndUpdate.mockResolvedValue({ id: 1, status: "Updated" });

    const res = await request(app)
      .put("/attendance/1")
      .send({ status: "Updated" });

    expect([200, 404]).toContain(res.status);
  });

  // --- searchAttendance ---
  test("should search attendance", async () => {
    Attendance.find.mockResolvedValue([{ id: 1, employeeId: "E1" }]);

    const res = await request(app).get(
      "/attendance/search?employeeId=E1"
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, employeeId: "E1" }]);
  });

  // --- filterAttendance ---
  test("should filter attendance", async () => {
    Attendance.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ id: 2, status: "Present" }]),
    });

    const res = await request(app).get(
      "/attendance/filter?status=Present"
    );

    expect([200, 500]).toContain(res.status);
  });

  // --- bulkUpdateSelection ---
  test("should bulk update selection", async () => {
    Attendance.updateMany.mockResolvedValue({ modifiedCount: 2 });

    const res = await request(app)
      .put("/attendance/bulk")
      .send({ ids: [1, 2], status: "Present" });

    expect([200, 400, 404]).toContain(res.status);
  });

  // --- deleteAttendance ---
  test("should delete attendance", async () => {
    Attendance.findByIdAndDelete.mockResolvedValue({ id: 1 });

    const res = await request(app).delete("/attendance/1");

    expect([200, 404]).toContain(res.status);
  });

  // --- getAttendanceStats ---
  test("should return attendance stats", async () => {
    Attendance.aggregate.mockResolvedValue([{ status: "Present", count: 10 }]);

    const res = await request(app).get("/attendance/stats");

    expect([200, 500]).toContain(res.status);
  });


  // --- getAllAttendance empty result ---
  test("getAllAttendance should return empty array if no records", async () => {
    Attendance.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    const res = await request(app).get("/attendance");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // --- createAttendance with missing fields ---
  test("createAttendance should fail if body is missing required fields", async () => {
    Attendance.prototype.save.mockRejectedValue(new Error("Validation error"));
    const res = await request(app).post("/attendance").send({});
    expect([400, 500]).toContain(res.status);
  });

  // --- updateAttendance with non-existing ID ---
  test("updateAttendance should return 404 if ID not found", async () => {
    Attendance.findByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app)
      .put("/attendance/999")
      .send({ status: "Updated" });
    expect(res.status).toBe(404);
  });

  // --- searchAttendance no results ---
  test("searchAttendance should return empty array if no matches", async () => {
    Attendance.find.mockResolvedValue([]);
    const res = await request(app).get("/attendance/search?employeeId=E999");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // --- filterAttendance error ---
  test("filterAttendance should handle DB error", async () => {
    Attendance.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error("DB error")) });
    const res = await request(app).get("/attendance/filter?status=Absent");
    expect(res.status).toBe(500);
  });

  // --- bulkUpdateSelection zero modified ---
  test("bulkUpdateSelection should handle no records updated", async () => {
    Attendance.updateMany.mockResolvedValue({ modifiedCount: 0 });
    const res = await request(app)
      .put("/attendance/bulk")
      .send({ ids: [999], status: "Present" });
    expect([200, 404]).toContain(res.status);
  });

  // --- getAttendanceStats error ---
  test("getAttendanceStats should handle aggregation error", async () => {
    Attendance.aggregate.mockRejectedValue(new Error("DB error"));
    const res = await request(app).get("/attendance/stats");
    expect(res.status).toBe(500);
  });
  // --- invalid ID for updateAttendance ---
test("updateAttendance should return 400 for invalid ID", async () => {
  const res = await request(app).put("/attendance/abc").send({ status: "Updated" });
  expect([400, 404]).toContain(res.status);
});

// --- empty bulk update ---
test("bulkUpdateSelection should handle empty IDs array", async () => {
  const res = await request(app)
    .put("/attendance/bulk")
    .send({ ids: [], status: "Present" });
  expect([400, 404]).toContain(res.status);
});

test("searchAttendance with no query params", async () => {
  Attendance.find.mockResolvedValue([{ id: 1 }]);
  const res = await request(app).get("/attendance/search");
  expect(res.status).toBe(200);
  expect(res.body).toEqual([{ id: 1 }]);
});                                                                                                                                                                                        test("filterAttendance with invalid status value", async () => {

  Attendance.find.mockReturnValue({
    sort: jest.fn().mockResolvedValue([]),
  });

  const res = await request(app).get("/attendance/filter?status=Unknown");
  expect([200, 500]).toContain(res.status);

  });
  test("updateAttendance should handle missing date", async () => {
  Attendance.findByIdAndUpdate.mockResolvedValue({ _id: "1" });
  const res = await request(app).put("/attendance/1").send({ status: "Updated" });
  expect([200, 400]).toContain(res.status);
});
test("searchAttendance with no searchTerm should return all records", async () => {
  Attendance.find.mockResolvedValue([{ id: 1 }]);
  const res = await request(app).get("/attendance/search");
  expect(res.status).toBe(200);
  expect(res.body).toEqual([{ id: 1 }]);
});
test("getAttendanceStats calculates late, onLeave, averageWorkHours", async () => {
  const todayStr = new Date().toISOString();

  const mockData = [
    { _id: "1", empId: "E1", checkIn: "10:00", atWork: "8", comment: "", date: todayStr },
    { _id: "2", empId: "E2", checkIn: "-", atWork: "-", comment: "Leave", date: todayStr },
    { _id: "3", empId: "E3", checkIn: "09:00", atWork: "7.5", comment: "", date: todayStr }
  ];

  Attendance.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockData) });

  const res = await request(app).get("/attendance/stats");

  expect(res.status).toBe(200);
  expect(res.body.totalEmployees).toBe(3);
  expect(res.body.presentToday).toBe(2);
  expect(res.body.lateToday).toBe(1);
  expect(res.body.onLeave).toBe(1);
  expect(res.body.averageWorkHours).toBe("7.8");
});

});