// tests/hiredEmployeeRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock middleware ---
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: jest.fn((req, res, next) => next()), // always allow
}));

// --- Mock controller functions ---
const mockControllers = {
  getAllHiredEmployees: jest.fn((req, res) => res.json({ route: "getAllHiredEmployees" })),
  createHiredEmployee: jest.fn((req, res) => res.json({ route: "createHiredEmployee" })),
  updateHiredEmployee: jest.fn((req, res) => res.json({ route: "updateHiredEmployee" })),
  deleteHiredEmployee: jest.fn((req, res) => res.json({ route: "deleteHiredEmployee" })),
  getHiredEmployeeById: jest.fn((req, res) => res.json({ route: "getHiredEmployeeById" })),
  filterHiredEmployees: jest.fn((req, res) => res.json({ route: "filterHiredEmployees" })),
};

jest.unstable_mockModule("../controllers/hiredEmployeeController.js", () => mockControllers);

// --- Import router after mocks ---
const { default: hiredEmployeeRouter } = await import("../routes/hiredEmployeeRoutes.js");

const app = express();
app.use(express.json());
app.use("/hired", hiredEmployeeRouter);

// --- Tests ---
describe("hiredEmployeeRoutes", () => {
  it("GET /hired → getAllHiredEmployees", async () => {
    const res = await request(app).get("/hired");
    expect(res.body.route).toBe("getAllHiredEmployees");
  });

  it("POST /hired → createHiredEmployee", async () => {
    const res = await request(app).post("/hired").send({ name: "Test" });
    expect(res.body.route).toBe("createHiredEmployee");
  });

  it("GET /hired/filter → filterHiredEmployees", async () => {
    const res = await request(app).get("/hired/filter");
    expect(res.body.route).toBe("filterHiredEmployees");
  });

  it("GET /hired/:id → getHiredEmployeeById", async () => {
    const res = await request(app).get("/hired/123");
    expect(res.body.route).toBe("getHiredEmployeeById");
  });

  it("PUT /hired/:id → updateHiredEmployee", async () => {
    const res = await request(app).put("/hired/123").send({ role: "Manager" });
    expect(res.body.route).toBe("updateHiredEmployee");
  });

  it("DELETE /hired/:id → deleteHiredEmployee", async () => {
    const res = await request(app).delete("/hired/123");
    expect(res.body.route).toBe("deleteHiredEmployee");
  });
});
