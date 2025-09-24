// tests/timesheetRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------
jest.unstable_mockModule("../controllers/timesheetController.js", () => ({
  checkIn: jest.fn((req, res) => res.json({ route: "checkIn" })),
  checkOut: jest.fn((req, res) => res.json({ route: "checkOut" })),
  forceCheckIn: jest.fn((req, res) => res.json({ route: "forceCheckIn" })),
  getTodayTimesheet: jest.fn((req, res) => res.json({ route: "getTodayTimesheet" })),
  getWeeklyTimesheets: jest.fn((req, res) => res.json({ route: "getWeeklyTimesheets" })),
  getAllTimesheets: jest.fn((req, res) => res.json({ route: "getAllTimesheets" })),
  getTimesheetById: jest.fn((req, res) =>
    res.json({ route: "getTimesheetById", id: req.params.id })
  ),
  updateTimesheet: jest.fn((req, res) =>
    res.json({ route: "updateTimesheet", id: req.params.id, body: req.body })
  ),
  deleteTimesheet: jest.fn((req, res) =>
    res.json({ route: "deleteTimesheet", id: req.params.id })
  ),
  getTimesheetsByDateRange: jest.fn((req, res) => res.json({ route: "getTimesheetsByDateRange" })),
}));

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: "mockUser" };
    next();
  },
}));

// ------------------ IMPORT ROUTER AFTER MOCKS ------------------
const routerModule = await import("../routes/timesheetRoutes.js");
const router = routerModule.default;
const controllers = await import("../controllers/timesheetController.js");

// ------------------ APP SETUP ------------------
const app = express();
app.use(express.json());
app.use("/api/timesheets", router);

// ------------------ TEST SUITE ------------------
describe("Timesheet Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("POST /check-in → checkIn", async () => {
    const res = await request(app).post("/api/timesheets/check-in");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("checkIn");
    expect(controllers.checkIn).toHaveBeenCalled();
  });

  test("POST /check-out → checkOut", async () => {
    const res = await request(app).post("/api/timesheets/check-out");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("checkOut");
    expect(controllers.checkOut).toHaveBeenCalled();
  });

  test("POST /force-check-in → forceCheckIn", async () => {
    const res = await request(app).post("/api/timesheets/force-check-in");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("forceCheckIn");
    expect(controllers.forceCheckIn).toHaveBeenCalled();
  });

  test("GET /today → getTodayTimesheet", async () => {
    const res = await request(app).get("/api/timesheets/today");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getTodayTimesheet");
    expect(controllers.getTodayTimesheet).toHaveBeenCalled();
  });

  test("GET /weekly → getWeeklyTimesheets", async () => {
    const res = await request(app).get("/api/timesheets/weekly");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getWeeklyTimesheets");
    expect(controllers.getWeeklyTimesheets).toHaveBeenCalled();
  });

  test("GET /date-range → getTimesheetsByDateRange", async () => {
    const res = await request(app).get("/api/timesheets/date-range");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getTimesheetsByDateRange");
    expect(controllers.getTimesheetsByDateRange).toHaveBeenCalled();
  });

  test("GET / → getAllTimesheets", async () => {
    const res = await request(app).get("/api/timesheets/");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getAllTimesheets");
    expect(controllers.getAllTimesheets).toHaveBeenCalled();
  });

  test("GET /:id → getTimesheetById", async () => {
    const res = await request(app).get("/api/timesheets/abc123");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "getTimesheetById", id: "abc123" });
    expect(controllers.getTimesheetById).toHaveBeenCalled();
  });

  test("PUT /:id → updateTimesheet", async () => {
    const res = await request(app).put("/api/timesheets/xyz789").send({ hours: 8 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "updateTimesheet", id: "xyz789", body: { hours: 8 } });
    expect(controllers.updateTimesheet).toHaveBeenCalled();
  });

  test("DELETE /:id → deleteTimesheet", async () => {
    const res = await request(app).delete("/api/timesheets/xyz789");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "deleteTimesheet", id: "xyz789" });
    expect(controllers.deleteTimesheet).toHaveBeenCalled();
  });
});
