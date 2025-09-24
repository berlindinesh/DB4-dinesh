// tests/restrictLeaveRoutes.test.js
import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// ---------------- MOCKS ----------------
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockSave = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();

// Mock model class returned by getModelForCompany
class MockRestrictLeave {
  constructor(data) {
    Object.assign(this, data);
    this.save = mockSave;
  }
  static find = mockFind;
  static findById = mockFindById;
  static findByIdAndUpdate = mockFindByIdAndUpdate;
  static findByIdAndDelete = mockFindByIdAndDelete;
}

// Mock companyAuth middleware (authenticated by default)
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.companyCode = "TEST_COMPANY";
    next();
  },
}));

// Mock genericModelFactory to always return our fake model
jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  default: jest.fn(() => MockRestrictLeave),
}));

// Mock schema import
jest.unstable_mockModule("../models/restrictLeave.js", () => ({
  default: {},
  restrictLeaveSchema: {},
}));

// Import router after mocks
const { default: restrictLeaveRouter } = await import(
  "../routes/restrictLeaveRoutes.js"
);

// Setup app
const app = express();
app.use(express.json());
app.use("/restrict-leave", restrictLeaveRouter);

// ---------------- TESTS ----------------
describe("restrictLeaveRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------- GET ALL --------
  it("GET / should return leaves", async () => {
    mockFind.mockResolvedValueOnce([{ title: "Holiday" }]);
    const res = await request(app).get("/restrict-leave");
    expect(res.body[0].title).toBe("Holiday");
  });

  it("GET / should return 500 on error", async () => {
    mockFind.mockRejectedValueOnce(new Error("DB fail"));
    const res = await request(app).get("/restrict-leave");
    expect(res.status).toBe(500);
  });

  // -------- GET BY ID --------
  it("GET /:id should return a leave", async () => {
    mockFindById.mockResolvedValueOnce({ id: "1", title: "Holiday" });
    const res = await request(app).get("/restrict-leave/1");
    expect(res.body.title).toBe("Holiday");
  });

  it("GET /:id should return 404 if not found", async () => {
    mockFindById.mockResolvedValueOnce(null);
    const res = await request(app).get("/restrict-leave/1");
    expect(res.status).toBe(404);
  });

  it("GET /:id should return 500 on error", async () => {
    mockFindById.mockRejectedValueOnce(new Error("DB fail"));
    const res = await request(app).get("/restrict-leave/1");
    expect(res.status).toBe(500);
  });

  // -------- POST --------
  it("POST / should create leave", async () => {
    mockSave.mockResolvedValueOnce({ id: "1", title: "NewLeave" });
    const res = await request(app).post("/restrict-leave").send({ title: "NewLeave" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("NewLeave");
  });

  it("POST / should return 400 on error", async () => {
    mockSave.mockRejectedValueOnce(new Error("Bad data"));
    const res = await request(app).post("/restrict-leave").send({ title: "Fail" });
    expect(res.status).toBe(400);
  });

  // -------- PUT --------
  it("PUT /:id should update leave", async () => {
    mockFindByIdAndUpdate.mockResolvedValueOnce({ id: "1", title: "Updated" });
    const res = await request(app).put("/restrict-leave/1").send({ title: "Updated" });
    expect(res.body.title).toBe("Updated");
  });

  it("PUT /:id should return 404 if not found", async () => {
    mockFindByIdAndUpdate.mockResolvedValueOnce(null);
    const res = await request(app).put("/restrict-leave/1").send({ title: "X" });
    expect(res.status).toBe(404);
  });

  it("PUT /:id should return 400 on error", async () => {
    mockFindByIdAndUpdate.mockRejectedValueOnce(new Error("Update fail"));
    const res = await request(app).put("/restrict-leave/1").send({ title: "X" });
    expect(res.status).toBe(400);
  });

  // -------- DELETE --------
  it("DELETE /:id should delete leave", async () => {
    mockFindByIdAndDelete.mockResolvedValueOnce({ id: "1" });
    const res = await request(app).delete("/restrict-leave/1");
    expect(res.body.message).toBe("Restricted leave deleted");
  });

  it("DELETE /:id should return 404 if not found", async () => {
    mockFindByIdAndDelete.mockResolvedValueOnce(null);
    const res = await request(app).delete("/restrict-leave/1");
    expect(res.status).toBe(404);
  });

  it("DELETE /:id should return 500 on error", async () => {
    mockFindByIdAndDelete.mockRejectedValueOnce(new Error("Delete fail"));
    const res = await request(app).delete("/restrict-leave/1");
    expect(res.status).toBe(500);
  });

  // -------- UNAUTHENTICATED TESTS --------
  describe("unauthenticated (companyCode missing)", () => {
    let unauthApp;

    beforeAll(async () => {
      jest.resetModules(); // 🔑 reset all module state

      // Override middleware to simulate missing companyCode
      jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
        authenticate: (req, res, next) => {
          // no companyCode set → should trigger 401
          next();
        },
      }));

      // Reapply other mocks
      jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
        default: jest.fn(() => MockRestrictLeave),
      }));
      jest.unstable_mockModule("../models/restrictLeave.js", () => ({
        default: {},
        restrictLeaveSchema: {},
      }));

      // Import router fresh with new mocks
      const { default: unauthRouter } = await import("../routes/restrictLeaveRoutes.js");
      unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use("/restrict-leave", unauthRouter);
    });

    it("GET / should return 401 if companyCode is missing", async () => {
      const res = await request(unauthApp).get("/restrict-leave");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Authentication required");
    });

    it("GET /:id should return 401 if companyCode is missing", async () => {
      const res = await request(unauthApp).get("/restrict-leave/123");
      expect(res.status).toBe(401);
    });

    it("POST / should return 401 if companyCode is missing", async () => {
      const res = await request(unauthApp).post("/restrict-leave").send({ title: "X" });
      expect(res.status).toBe(401);
    });

    it("PUT /:id should return 401 if companyCode is missing", async () => {
      const res = await request(unauthApp).put("/restrict-leave/123").send({ title: "Y" });
      expect(res.status).toBe(401);
    });

    it("DELETE /:id should return 401 if companyCode is missing", async () => {
      const res = await request(unauthApp).delete("/restrict-leave/123");
      expect(res.status).toBe(401);
    });
  });
});
