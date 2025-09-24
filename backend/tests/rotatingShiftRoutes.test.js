// tests/rotatingShiftRoutes.test.js
import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// -------- MOCKS --------
const mockGetAllShifts = jest.fn((req, res) =>
  res.json([{ id: "1", title: "Shift A" }])
);
const mockGetUserShifts = jest.fn((req, res) =>
  res.json([{ id: "2", userId: req.params.userId }])
);
const mockCreateShift = jest.fn((req, res) =>
  res.status(201).json({ id: "3", ...req.body })
);
const mockUpdateShift = jest.fn((req, res) =>
  res.json({ id: req.params.id, ...req.body })
);
const mockDeleteShift = jest.fn((req, res) =>
  res.json({ message: `Deleted ${req.params.id}` })
);
const mockApproveShift = jest.fn((req, res) =>
  res.json({ id: req.params.id, status: "approved" })
);
const mockRejectShift = jest.fn((req, res) =>
  res.json({ id: req.params.id, status: "rejected" })
);
const mockBulkApproveShifts = jest.fn((req, res) =>
  res.json({ approved: req.body.ids })
);
const mockBulkRejectShifts = jest.fn((req, res) =>
  res.json({ rejected: req.body.ids })
);

jest.unstable_mockModule("../controllers/rotatingShiftController.js", () => ({
  getAllShifts: mockGetAllShifts,
  getUserShifts: mockGetUserShifts,
  createShift: mockCreateShift,
  updateShift: mockUpdateShift,
  deleteShift: mockDeleteShift,
  approveShift: mockApproveShift,
  rejectShift: mockRejectShift,
  bulkApproveShifts: mockBulkApproveShifts,
  bulkRejectShifts: mockBulkRejectShifts,
}));

// Auth middleware mock
const mockAuthenticate = jest.fn((req, res, next) => {
  req.companyCode = "TEST_COMPANY";
  req.user = { id: "U1" };
  next();
});

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: mockAuthenticate,
}));

// Import router after mocks
const { default: shiftRouter } = await import("../routes/rotatingShiftRoutes.js");

// Setup app
const app = express();
app.use(express.json());
app.use("/shifts", shiftRouter);

// -------- TESTS --------
describe("rotatingShiftRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET / should return all shifts", async () => {
    const res = await request(app).get("/shifts");
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty("title", "Shift A");
    expect(mockGetAllShifts).toHaveBeenCalled();
  });

  it("GET /user/:userId should return shifts for a user", async () => {
    const res = await request(app).get("/shifts/user/42");
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty("userId", "42");
    expect(mockGetUserShifts).toHaveBeenCalled();
  });

  it("POST / should create a shift", async () => {
    const res = await request(app).post("/shifts").send({ title: "Night Shift" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("title", "Night Shift");
    expect(mockCreateShift).toHaveBeenCalled();
  });

  it("PUT /:id should update a shift", async () => {
    const res = await request(app).put("/shifts/123").send({ title: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title", "Updated");
    expect(mockUpdateShift).toHaveBeenCalled();
  });

  it("DELETE /:id should delete a shift", async () => {
    const res = await request(app).delete("/shifts/123");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Deleted 123");
    expect(mockDeleteShift).toHaveBeenCalled();
  });

  it("PUT /:id/approve should approve a shift", async () => {
    const res = await request(app).put("/shifts/123/approve");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "approved");
    expect(mockApproveShift).toHaveBeenCalled();
  });

  it("PUT /:id/reject should reject a shift", async () => {
    const res = await request(app).put("/shifts/123/reject");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "rejected");
    expect(mockRejectShift).toHaveBeenCalled();
  });

  it("POST /bulk-approve should bulk approve shifts", async () => {
    const res = await request(app).post("/shifts/bulk-approve").send({ ids: ["1", "2"] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("approved");
    expect(mockBulkApproveShifts).toHaveBeenCalled();
  });

  it("POST /bulk-reject should bulk reject shifts", async () => {
    const res = await request(app).post("/shifts/bulk-reject").send({ ids: ["3", "4"] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("rejected");
    expect(mockBulkRejectShifts).toHaveBeenCalled();
  });
});