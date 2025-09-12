// tests/companyHolidayRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";

// --- Mock authenticate middleware ---
const authenticate = (req, res, next) => {
  req.companyCode = req.headers["x-company-code"]; // allow test to control
  next();
};

// --- Mock CompanyHoliday model factory ---
const mockFind = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();

const MockModel = jest.fn(function (data) {
  this.save = jest.fn().mockResolvedValue({ _id: "new123", ...data });
});
MockModel.prototype.save = jest.fn().mockResolvedValue({ _id: "new123" });
MockModel.find = mockFind;
MockModel.findByIdAndUpdate = mockFindByIdAndUpdate;
MockModel.findByIdAndDelete = mockFindByIdAndDelete;

await jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate,
}));
await jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  default: jest.fn().mockResolvedValue(MockModel),
}));
await jest.unstable_mockModule("../models/CompanyHolidays.js", () => ({
  __esModule: true,
  default: MockModel,
  companyHolidaySchema: {},
}));

const { default: holidayRouter } = await import(
  "../routes/companyHolidays.js"
);

const app = express();
app.use(express.json());
app.use("/", holidayRouter);

describe("companyHolidayRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- validateHoliday ---
  it("POST / with missing fields → 400", async () => {
    const res = await request(app)
      .post("/")
      .set("x-company-code", "c1")
      .send({ week: "w1" }); // no day
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/);
  });

  // --- GET ---
  it("GET / without companyCode → 401", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(401);
  });

  it("GET / success → 200", async () => {
    mockFind.mockResolvedValue([{ id: "h1" }]);
    const res = await request(app).get("/").set("x-company-code", "c1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "h1" }]);
  });

  it("GET / throws → 500", async () => {
    mockFind.mockRejectedValue(new Error("DB fail"));
    const res = await request(app).get("/").set("x-company-code", "c1");
    expect(res.status).toBe(500);
  });

  // --- POST ---
  it("POST / without companyCode → 401", async () => {
    const res = await request(app).post("/").send({ week: "w1", day: "Mon" });
    expect(res.status).toBe(401);
  });

  it("POST / success → 201", async () => {
    const res = await request(app)
      .post("/")
      .set("x-company-code", "c1")
      .send({ week: "w1", day: "Mon" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ week: "w1", day: "Mon" });
  });

  it("POST / save throws → 500", async () => {
  // Override the save for this instance
  MockModel.mockImplementationOnce(function (data) {
    this.save = jest.fn().mockRejectedValueOnce(new Error("Save fail"));
    this._id = "new123"; // optional, matches normal behavior
  });

  const res = await request(app)
    .post("/")
    .set("x-company-code", "c1")
    .send({ week: "w1", day: "Mon" });

  expect(res.status).toBe(500);
});


  // --- PUT ---
  it("PUT /:id without companyCode → 401", async () => {
    const res = await request(app).put("/123").send({ week: "w1", day: "Mon" });
    expect(res.status).toBe(401);
  });

  it("PUT /:id invalid ObjectId → 400", async () => {
    const res = await request(app)
      .put("/badid")
      .set("x-company-code", "c1")
      .send({ week: "w1", day: "Mon" });
    expect(res.status).toBe(400);
  });

  it("PUT /:id not found → 404", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app)
      .put("/" + id)
      .set("x-company-code", "c1")
      .send({ week: "w1", day: "Mon" });
    expect(res.status).toBe(404);
  });

  it("PUT /:id success → 200", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndUpdate.mockResolvedValue({ id, week: "w2", day: "Tue" });
    const res = await request(app)
      .put("/" + id)
      .set("x-company-code", "c1")
      .send({ week: "w2", day: "Tue" });
    expect(res.status).toBe(200);
    expect(res.body.week).toBe("w2");
  });

  it("PUT /:id throws → 500", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndUpdate.mockRejectedValue(new Error("Update fail"));
    const res = await request(app)
      .put("/" + id)
      .set("x-company-code", "c1")
      .send({ week: "w2", day: "Tue" });
    expect(res.status).toBe(500);
  });

  // --- DELETE ---
  it("DELETE /:id without companyCode → 401", async () => {
    const res = await request(app).delete("/123");
    expect(res.status).toBe(401);
  });

  it("DELETE /:id invalid ObjectId → 400", async () => {
    const res = await request(app)
      .delete("/badid")
      .set("x-company-code", "c1");
    expect(res.status).toBe(400);
  });

  it("DELETE /:id not found → 404", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndDelete.mockResolvedValue(null);
    const res = await request(app)
      .delete("/" + id)
      .set("x-company-code", "c1");
    expect(res.status).toBe(404);
  });

  it("DELETE /:id success → 200", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndDelete.mockResolvedValue({ id });
    const res = await request(app)
      .delete("/" + id)
      .set("x-company-code", "c1");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/);
  });

  it("DELETE /:id throws → 500", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndDelete.mockRejectedValue(new Error("Delete fail"));
    const res = await request(app)
      .delete("/" + id)
      .set("x-company-code", "c1");
    expect(res.status).toBe(500);
  });

  // --- export default router ---
  it("module loads correctly", async () => {
  const mod = await import("../routes/companyHolidays.js");
  expect(mod.default).toBeDefined();
});
});
