import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock controllers ---
const getContractsByEmployeeId = jest.fn((req, res) =>
  res.status(200).json({ route: "getContractsByEmployeeId", userId: req.params.userId })
);
const updateContract = jest.fn((req, res) =>
  res.status(200).json({ route: "updateContract", contractId: req.params.contractId, body: req.body })
);
const deleteContract = jest.fn((req, res) =>
  res.status(200).json({ route: "deleteContract", contractId: req.params.contractId })
);

// Replace real controller imports with mocks
await jest.unstable_mockModule("../controllers/contractController.js", () => ({
  __esModule: true,
  getContractsByEmployeeId,
  updateContract,
  deleteContract,
}));

// ⚡ Import the real router (note the correct filename: contractRouter.js)
const { default: contractRoutes } = await import("../routes/contractRouter.js");

// Setup test app
const app = express();
app.use(express.json());
app.use("/contracts", contractRoutes);

describe("Contract Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /contracts/employee/:userId should call getContractsByEmployeeId", async () => {
    const res = await request(app).get("/contracts/employee/123");
    expect(res.status).toBe(200);
    expect(getContractsByEmployeeId).toHaveBeenCalled();
    expect(res.body).toEqual({ route: "getContractsByEmployeeId", userId: "123" });
  });

  it("PUT /contracts/:contractId should call updateContract", async () => {
    const res = await request(app)
      .put("/contracts/abc123")
      .send({ title: "New Contract" });
    expect(res.status).toBe(200);
    expect(updateContract).toHaveBeenCalled();
    expect(res.body).toEqual({
      route: "updateContract",
      contractId: "abc123",
      body: { title: "New Contract" },
    });
  });

  it("DELETE /contracts/:contractId should call deleteContract", async () => {
    const res = await request(app).delete("/contracts/abc123");
    expect(res.status).toBe(200);
    expect(deleteContract).toHaveBeenCalled();
    expect(res.body).toEqual({ route: "deleteContract", contractId: "abc123" });
  });
});
