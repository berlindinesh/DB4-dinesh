// tests/payrollRoutes.test.js
import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// ---------------- MOCKS ----------------
jest.unstable_mockModule("../controllers/PayrollController.js", () => ({
  PayrollController: {
    // Employee
    getAllEmployees: jest.fn((req, res) => res.json({ route: "getAllEmployees" })),
    createEmployee: jest.fn((req, res) => res.json({ route: "createEmployee" })),
    updateEmployee: jest.fn((req, res) => res.json({ route: "updateEmployee" })),
    updateEmployeeLOP: jest.fn((req, res) => res.json({ route: "updateEmployeeLOP" })),
    deleteEmployee: jest.fn((req, res) => res.json({ route: "deleteEmployee" })),
    bulkCreateEmployees: jest.fn((req, res) => res.json({ route: "bulkCreateEmployees" })),

    // Allowances
    getAllAllowances: jest.fn((req, res) => res.json({ route: "getAllAllowances" })),
    createAllowance: jest.fn((req, res) => res.json({ route: "createAllowance" })),
    updateAllowance: jest.fn((req, res) => res.json({ route: "updateAllowance" })),
    deleteAllowance: jest.fn((req, res) => res.json({ route: "deleteAllowance" })),

    // Deductions
    getAllDeductions: jest.fn((req, res) => res.json({ route: "getAllDeductions" })),
    createDeduction: jest.fn((req, res) => res.json({ route: "createDeduction" })),
    updateDeduction: jest.fn((req, res) => res.json({ route: "updateDeduction" })),
    deleteDeduction: jest.fn((req, res) => res.json({ route: "deleteDeduction" })),

    // Payslips
    generatePayslip: jest.fn((req, res) => res.json({ route: "generatePayslip" })),
    downloadPayslip: jest.fn((req, res) => res.json({ route: "downloadPayslip" })),
    getPayslipsByEmployee: jest.fn((req, res) => res.json({ route: "getPayslipsByEmployee" })),
    getPayslipsByMonth: jest.fn((req, res) => res.json({ route: "getPayslipsByMonth" })),
    bulkGeneratePayslips: jest.fn((req, res) => res.json({ route: "bulkGeneratePayslips" })),
    getAllPayslips: jest.fn((req, res) => res.json({ route: "getAllPayslips" })),

    calculateBaseAfterDeductions: jest.fn((req, res) =>
      res.json({ route: "calculateBaseAfterDeductions" })
    ),

    // User-specific
    getUserPayslips: jest.fn((req, res) => res.json({ route: "getUserPayslips" })),
    downloadUserPayslip: jest.fn((req, res) => res.json({ route: "downloadUserPayslip" })),
    linkUserToEmployee: jest.fn((req, res) => res.json({ route: "linkUserToEmployee" })),
  },
}));

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: jest.fn((req, res, next) => next()),
}));

// ---------------- SETUP ----------------
let PayrollController;
let authenticate;
let router;
let app;

beforeAll(async () => {
  ({ PayrollController } = await import("../controllers/PayrollController.js"));
  ({ authenticate } = await import("../middleware/companyAuth.js"));
  router = (await import("../routes/payrollRoutes.js")).default;

  app = express();
  app.use(express.json());
  app.use("/payroll", router);
});

describe("Payroll Routes", () => {
  afterEach(() => jest.clearAllMocks());

  // --- Employee routes ---
  it("GET /employees", async () => {
    const res = await request(app).get("/payroll/employees");
    expect(res.body.route).toBe("getAllEmployees");
  });

 it("POST /employees", async () => {
    const res = await request(app).post("/payroll/employees");
    expect(res.body.route).toBe("createEmployee");
  });
  it("PUT /employees/:empId", async () => {
    const res = await request(app).put("/payroll/employees/123");
    expect(res.body.route).toBe("updateEmployee");
  });
  it("PUT /employees/:empId/lop", async () => {
    const res = await request(app).put("/payroll/employees/123/lop");
    expect(res.body.route).toBe("updateEmployeeLOP");
  });
  it("DELETE /employees/:empId", async () => {
    const res = await request(app).delete("/payroll/employees/123");
    expect(res.body.route).toBe("deleteEmployee");
  });
  it("POST /employees/bulk", async () => {
    const res = await request(app).post("/payroll/employees/bulk");
    expect(res.body.route).toBe("bulkCreateEmployees");
  });

  // --- Allowances ---
  it("GET /allowances", async () => {
    const res = await request(app).get("/payroll/allowances");
    expect(res.body.route).toBe("getAllAllowances");
  });
  it("POST /allowances", async () => {
    const res = await request(app).post("/payroll/allowances");
    expect(res.body.route).toBe("createAllowance");
  });
  it("PUT /allowances/:id", async () => {
    const res = await request(app).put("/payroll/allowances/456");
    expect(res.body.route).toBe("updateAllowance");
  });
  it("DELETE /allowances/:id", async () => {
    const res = await request(app).delete("/payroll/allowances/456");
    expect(res.body.route).toBe("deleteAllowance");
  });

  // --- Deductions ---
  it("GET /deductions", async () => {
    const res = await request(app).get("/payroll/deductions");
    expect(res.body.route).toBe("getAllDeductions");
  });
  it("POST /deductions", async () => {
    const res = await request(app).post("/payroll/deductions");
    expect(res.body.route).toBe("createDeduction");
  });
  it("PUT /deductions/:id", async () => {
    const res = await request(app).put("/payroll/deductions/789");
    expect(res.body.route).toBe("updateDeduction");
  });
  it("DELETE /deductions/:id", async () => {
    const res = await request(app).delete("/payroll/deductions/789");
    expect(res.body.route).toBe("deleteDeduction");
  });

  // --- Payslips ---
  it("POST /payslips/generate", async () => {
    const res = await request(app).post("/payroll/payslips/generate");
    expect(res.body.route).toBe("generatePayslip");
  });
  it("GET /payslips/download/:id", async () => {
    const res = await request(app).get("/payroll/payslips/download/1");
    expect(res.body.route).toBe("downloadPayslip");
  });
  it("GET /payslips/employee/:empId", async () => {
    const res = await request(app).get("/payroll/payslips/employee/123");
    expect(res.body.route).toBe("getPayslipsByEmployee");
  });
  it("GET /payslips/month", async () => {
    const res = await request(app).get("/payroll/payslips/month");
    expect(res.body.route).toBe("getPayslipsByMonth");
  });
  it("POST /payslips/bulk-generate", async () => {
    const res = await request(app).post("/payroll/payslips/bulk-generate");
    expect(res.body.route).toBe("bulkGeneratePayslips");
  });
  it("GET /payslips", async () => {
    const res = await request(app).get("/payroll/payslips");
    expect(res.body.route).toBe("getAllPayslips");
  });
  it("GET /calculate-base/:empId", async () => {
    const res = await request(app).get("/payroll/calculate-base/123");
    expect(res.body.route).toBe("calculateBaseAfterDeductions");
  });

  // --- User-specific ---
  it("GET /my-payslips", async () => {
    const res = await request(app).get("/payroll/my-payslips");
    expect(res.body.route).toBe("getUserPayslips");
  });
  it("GET /my-payslips/:payslipId/download", async () => {
    const res = await request(app).get("/payroll/my-payslips/42/download");
    expect(res.body.route).toBe("downloadUserPayslip");
  });
  it("POST /link-employee", async () => {
    const res = await request(app).post("/payroll/link-employee");
    expect(res.body.route).toBe("linkUserToEmployee");
  });

  // --- Middleware ---
  it("applies authenticate middleware", async () => {
    expect(authenticate).toHaveBeenCalled;
    await request(app).get("/payroll/employees");
    expect(authenticate).toHaveBeenCalled();
  }); 
});