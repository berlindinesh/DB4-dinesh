import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// ------------------ MOCK CONTROLLERS ------------------
const mockGetAllWorktypes = jest.fn((req, res) =>
  res.json([{ id: 1, name: "Worktype A" }])
);
const mockCreateWorktype = jest.fn((req, res) =>
  res.status(201).json({ id: 2, ...req.body })
);
const mockUpdateWorktype = jest.fn((req, res) =>
  res.json({ id: req.params.id, ...req.body })
);
const mockDeleteWorktype = jest.fn((req, res) =>
  res.json({ message: `Worktype ${req.params.id} deleted` }) // ✅ fixed template string
);
const mockApproveWorktype = jest.fn((req, res) =>
  res.json({ id: req.params.id, approved: true })
);
const mockRejectWorktype = jest.fn((req, res) =>
  res.json({ id: req.params.id, rejected: true })
);

// ✅ Updated mocks for bulk actions
const mockBulkApproveWorktypes = jest.fn((req, res) =>
  res.json({ id: "bulk-approve", ids: req.body.ids })
);
const mockBulkRejectWorktypes = jest.fn((req, res) =>
  res.json({ id: "bulk-reject", ids: req.body.ids })
);

const mockGetWorktypesByEmployeeCode = jest.fn((req, res) =>
  res.json([{ employeeCode: req.params.employeeCode, worktype: "Type1" }])
);
const mockGetUserWorktypes = jest.fn((req, res) =>
  res.json([{ userId: req.params.userId, worktype: "Type2" }])
);

// ------------------ MOCK CONTROLLER MODULE ------------------
jest.unstable_mockModule("../controllers/rotatingWorktypeController.js", () => ({
  getAllWorktypes: mockGetAllWorktypes,
  createWorktype: mockCreateWorktype,
  updateWorktype: mockUpdateWorktype,
  deleteWorktype: mockDeleteWorktype,
  approveWorktype: mockApproveWorktype,
  rejectWorktype: mockRejectWorktype,
  bulkApproveWorktypes: mockBulkApproveWorktypes,
  bulkRejectWorktypes: mockBulkRejectWorktypes,
  getWorktypesByEmployeeCode: mockGetWorktypesByEmployeeCode,
  getUserWorktypes: mockGetUserWorktypes,
}));

// ------------------ MOCK AUTH MIDDLEWARE ------------------
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: jest.fn((req, res, next) => {
    if (req.headers["x-unauthenticated"]) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  }),
}));

// ------------------ IMPORT ROUTER AFTER MOCKS ------------------
const routerModule = await import("../routes/rotatingWorktypeRoutes.js");
const router = routerModule.default;

// ------------------ TEST SUITE ------------------
describe("rotatingWorktypeRoutes", () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/worktypes", router);
  });

  it("GET / should return all worktypes", async () => {
    const res = await request(app).get("/worktypes");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: "Worktype A" }]);
    expect(mockGetAllWorktypes).toHaveBeenCalled();
  });

  it("POST / should create a worktype", async () => {
    const res = await request(app).post("/worktypes").send({ name: "New WT" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("name", "New WT");
    expect(mockCreateWorktype).toHaveBeenCalled();
  });

  it("PUT /:id should update a worktype", async () => {
    const res = await request(app)
      .put("/worktypes/123")
      .send({ name: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", "123");
    expect(mockUpdateWorktype).toHaveBeenCalled();
  });

  it("DELETE /:id should delete a worktype", async () => {
    const res = await request(app).delete("/worktypes/123");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Worktype 123 deleted");
    expect(mockDeleteWorktype).toHaveBeenCalled();
  });

  it("PUT /:id/approve should approve a worktype", async () => {
    const res = await request(app).put("/worktypes/1/approve");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("approved", true);
    expect(mockApproveWorktype).toHaveBeenCalled();
  });

  it("PUT /:id/reject should reject a worktype", async () => {
    const res = await request(app).put("/worktypes/2/reject");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("rejected", true);
    expect(mockRejectWorktype).toHaveBeenCalled();
  });

  
  it("GET /employee/:employeeCode should return worktypes for employee", async () => {
    const res = await request(app).get("/worktypes/employee/E123");
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty("employeeCode", "E123");
    expect(mockGetWorktypesByEmployeeCode).toHaveBeenCalled();
  });

  it("GET /user/:userId should return worktypes for user", async () => {
    const res = await request(app).get("/worktypes/user/U1");
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty("userId", "U1");
    expect(mockGetUserWorktypes).toHaveBeenCalled();
  });

  describe("unauthenticated requests", () => {
    let unauthApp;
    beforeAll(() => {
      unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use("/worktypes", router);
    });

    it("should return 401 when unauthenticated", async () => {
      const res = await request(unauthApp)
        .get("/worktypes")
        .set("x-unauthenticated", "true");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Authentication required");
    });
  });
});
