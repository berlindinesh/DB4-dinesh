// tests/employeeRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock controller methods ---
const getEmployees = jest.fn((req, res) => res.status(200).json({ ok: "getEmployees" }));
const createEmployee = jest.fn((req, res) => res.status(201).json({ ok: "createEmployee" }));
const updateEmployee = jest.fn((req, res) =>
  res.status(200).json({ ok: "updateEmployee", id: req.params.id })
);
const deleteEmployee = jest.fn((req, res) =>
  res.status(200).json({ ok: "deleteEmployee", id: req.params.id })
);

// Replace real controller with mocks
await jest.unstable_mockModule("../controllers/employeeController.js", () => ({
  __esModule: true,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
}));

// Import router *after* mocks
const { default: employeeRoutes } = await import("../routes/employeeRoutes.js");

// Setup Express app
const app = express();
app.use(express.json());
app.use("/", employeeRoutes);

describe("Employee Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /employees → calls getEmployees", async () => {
    const res = await request(app).get("/employees?department=HR");
    expect(res.status).toBe(200);
    expect(getEmployees).toHaveBeenCalled();
  });

  it("POST /employees → calls createEmployee", async () => {
    const res = await request(app).post("/employees").send({ name: "Alice" });
    expect(res.status).toBe(201);
    expect(createEmployee).toHaveBeenCalled();
  });

  it("PUT /employees/:id → calls updateEmployee", async () => {
    const res = await request(app).put("/employees/123").send({ name: "Bob" });
    expect(res.status).toBe(200);
    expect(updateEmployee).toHaveBeenCalled();
    expect(res.body.id).toBe("123");
  });

  it("DELETE /employees/:id → calls deleteEmployee", async () => {
    const res = await request(app).delete("/employees/456");
    expect(res.status).toBe(200);
    expect(deleteEmployee).toHaveBeenCalled();
    expect(res.body.id).toBe("456");
  });
});
