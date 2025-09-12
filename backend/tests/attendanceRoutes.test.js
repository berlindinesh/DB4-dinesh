import { jest } from "@jest/globals";

// ✅ mock the controller FIRST
jest.unstable_mockModule("../controllers/attendanceController.js", () => ({
  AttendanceController: {
    getAllAttendance: jest.fn((req, res) => res.status(200).json({ route: "getAllAttendance" })),
    filterAttendance: jest.fn((req, res) => res.status(200).json({ route: "filterAttendance" })),
    createAttendance: jest.fn((req, res) => res.status(201).json({ route: "createAttendance" })),
    searchAttendance: jest.fn((req, res) => res.status(200).json({ route: "searchAttendance" })),
    bulkUpdateSelection: jest.fn((req, res) => res.status(200).json({ route: "bulkUpdateSelection" })),
    updateAttendance: jest.fn((req, res) =>
      res.status(200).json({ route: "updateAttendance", id: req.params.id })
    ),
    deleteAttendance: jest.fn((req, res) =>
      res.status(200).json({ route: "deleteAttendance", id: req.params.id })
    ),
  },
}));

// ✅ then dynamically import router & controller (so they see the mock)
const { default: attendanceRoutes } = await import("../routes/attendanceRoutes.js");
const { AttendanceController } = await import("../controllers/attendanceController.js");

import request from "supertest";
import express from "express";

// Setup Express app with router
const app = express();
app.use(express.json());
app.use("/attendance", attendanceRoutes);

describe("Attendance Routes", () => {
  it("GET /attendance should call getAllAttendance", async () => {
    const res = await request(app).get("/attendance");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getAllAttendance");
    expect(AttendanceController.getAllAttendance).toHaveBeenCalled();
  });

  it("GET /attendance/filter should call filterAttendance", async () => {
    const res = await request(app).get("/attendance/filter");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("filterAttendance");
    expect(AttendanceController.filterAttendance).toHaveBeenCalled();
  });

  it("POST /attendance should call createAttendance", async () => {
    const res = await request(app).post("/attendance").send({ name: "Test" });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe("createAttendance");
    expect(AttendanceController.createAttendance).toHaveBeenCalled();
  });

  it("GET /attendance/search should call searchAttendance", async () => {
    const res = await request(app).get("/attendance/search?q=test");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("searchAttendance");
    expect(AttendanceController.searchAttendance).toHaveBeenCalled();
  });

  it("PUT /attendance/bulk-select should call bulkUpdateSelection", async () => {
    const res = await request(app).put("/attendance/bulk-select").send({ ids: [1, 2] });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("bulkUpdateSelection");
    expect(AttendanceController.bulkUpdateSelection).toHaveBeenCalled();
  });

  it("PUT /attendance/:id should call updateAttendance", async () => {
    const res = await request(app).put("/attendance/123").send({ status: "Present" });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("updateAttendance");
    expect(res.body.id).toBe("123");
    expect(AttendanceController.updateAttendance).toHaveBeenCalled();
  });

  it("DELETE /attendance/:id should call deleteAttendance", async () => {
    const res = await request(app).delete("/attendance/456");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("deleteAttendance");
    expect(res.body.id).toBe("456");
    expect(AttendanceController.deleteAttendance).toHaveBeenCalled();
  });
});
