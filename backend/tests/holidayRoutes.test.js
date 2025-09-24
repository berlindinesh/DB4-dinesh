// tests/holidayRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock middleware (always allow + add companyCode by default) ---
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.companyCode = "testCompany"; // simulate authenticated user
    next();
  }),
}));

// --- Mock Holiday model factory ---
const mockFind = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockSave = jest.fn();

const MockHolidayModel = function (data) {
  return {
    ...data,
    save: (...args) => mockSave(...args),
  };
};

MockHolidayModel.find = mockFind;
MockHolidayModel.findByIdAndUpdate = mockFindByIdAndUpdate;
MockHolidayModel.findByIdAndDelete = mockFindByIdAndDelete;

jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  default: jest.fn(async () => MockHolidayModel),
}));

// Import router AFTER mocks
const { default: holidayRouter } = await import("../routes/holidays.js");

const app = express();
app.use(express.json());
app.use("/holidays", holidayRouter);

describe("holidayRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- GET ALL ---
  it("GET /holidays → success", async () => {
    mockFind.mockResolvedValue([{ name: "Diwali" }]);
    const res = await request(app).get("/holidays");
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe("Diwali");
  });

  it("GET /holidays → 401 if no companyCode", async () => {
  const auth = await import("../middleware/companyAuth.js");
  auth.authenticate.mockImplementationOnce((req, res, next) => next()); // skip companyCode
  const res = await request(app).get("/holidays");
  expect(res.status).toBe(401);
});

  it("GET /holidays → 500 on error", async () => {
    mockFind.mockRejectedValue(new Error("DB error"));
    const res = await request(app).get("/holidays");
    expect(res.status).toBe(500);
  });

  // --- CREATE ---
  it("POST /holidays → success", async () => {
    mockSave.mockResolvedValue({ name: "Holi" });
    const res = await request(app).post("/holidays").send({
      name: "Holi",
      startDate: "2025-03-24",
      endDate: "2025-03-24",
      recurring: false,
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Holi");
  });

  it("POST /holidays → 500 on error", async () => {
    mockSave.mockRejectedValue(new Error("Save failed"));
    const res = await request(app).post("/holidays").send({ name: "Bad" });
    expect(res.status).toBe(500);
  });

  // --- UPDATE ---
  it("PUT /holidays/:id → success", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "1", name: "Updated" });
    const res = await request(app).put("/holidays/1").send({ name: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
  });

  it("PUT /holidays/:id → 404 not found", async () => {
    mockFindByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app).put("/holidays/999").send({ name: "X" });
    expect(res.status).toBe(404);
  });

  it("PUT /holidays/:id → 500 on error", async () => {
    mockFindByIdAndUpdate.mockRejectedValue(new Error("DB fail"));
    const res = await request(app).put("/holidays/1").send({ name: "Err" });
    expect(res.status).toBe(500);
  });

  // --- DELETE ---
  it("DELETE /holidays/:id → success", async () => {
    mockFindByIdAndDelete.mockResolvedValue({ _id: "1" });
    const res = await request(app).delete("/holidays/1");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Holiday deleted successfully");
  });

  it("DELETE /holidays/:id → 404 not found", async () => {
    mockFindByIdAndDelete.mockResolvedValue(null);
    const res = await request(app).delete("/holidays/999");
    expect(res.status).toBe(404);
  });

  it("DELETE /holidays/:id → 500 on error", async () => {
    mockFindByIdAndDelete.mockRejectedValue(new Error("Delete fail"));
    const res = await request(app).delete("/holidays/1");
    expect(res.status).toBe(500);
  });

  // --- FILTER ---
  it("GET /holidays/filter → success with params", async () => {
    mockFind.mockResolvedValue([{ name: "RecurringHoliday" }]);
    const res = await request(app).get(
      "/holidays/filter?fromDate=2025-01-01&toDate=2025-12-31&recurring=true"
    );
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe("RecurringHoliday");
  });

  it("GET /holidays/filter → 500 on error", async () => {
    mockFind.mockRejectedValue(new Error("Filter fail"));
    const res = await request(app).get("/holidays/filter");
    expect(res.status).toBe(500);
  });
  it("POST /holidays → 401 if no companyCode", async () => {
    const auth = await import("../middleware/companyAuth.js");
    auth.authenticate.mockImplementationOnce((req, res, next) => next()); // no companyCode
    const res = await request(app).post("/holidays").send({ name: "NoAuth" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("PUT /holidays/:id → 401 if no companyCode", async () => {
    const auth = await import("../middleware/companyAuth.js");
    auth.authenticate.mockImplementationOnce((req, res, next) => next());
    const res = await request(app).put("/holidays/123").send({ name: "NoAuth" });
    expect(res.status).toBe(401);
  });

  it("DELETE /holidays/:id → 401 if no companyCode", async () => {
    const auth = await import("../middleware/companyAuth.js");
    auth.authenticate.mockImplementationOnce((req, res, next) => next());
    const res = await request(app).delete("/holidays/123");
    expect(res.status).toBe(401);
  });

  it("GET /holidays/filter → 401 if no companyCode", async () => {
    const auth = await import("../middleware/companyAuth.js");
    auth.authenticate.mockImplementationOnce((req, res, next) => next());
    const res = await request(app).get("/holidays/filter?fromDate=2025-01-01&toDate=2025-12-31");
    expect(res.status).toBe(401);
  });
});
