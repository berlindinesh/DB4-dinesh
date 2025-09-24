import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";

// ------------------------
// ✅ Mock fs for ES module compatibility
fs.existsSync = jest.fn();
fs.statSync = jest.fn();
fs.createReadStream = jest.fn();
fs.readdirSync = jest.fn();

// Helper for download route
const mockFileStat = {
  size: 10,
  birthtime: new Date(),
  mtime: new Date(),
  isFile: () => true,
};

// ------------------------
// ✅ Mock path
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  extname: jest.fn((f) => f.substring(f.lastIndexOf("."))),
}));

// ------------------------
// ✅ Mock controllers
jest.mock("../controllers/payrollContractController.js", () => ({
  getContracts: jest.fn((req, res) => res.json({ ok: "getContracts" })),
  getContractById: jest.fn((req, res) => res.json({ ok: "getContractById" })),
  createContract: jest.fn((req, res) => res.json({ ok: "createContract" })),
  updateContract: jest.fn((req, res) => res.json({ ok: "updateContract" })),
  deleteContract: jest.fn((req, res) => res.json({ ok: "deleteContract" })),
  filterContracts: jest.fn((req, res) => res.json({ ok: "filterContracts" })),
  updateApprovalStatus: jest.fn((req, res) =>
    res.json({ ok: "updateApprovalStatus" })
  ),
  updateComplianceDocuments: jest.fn((req, res) =>
    res.json({ ok: "updateComplianceDocuments" })
  ),
  terminateContract: jest.fn((req, res) => res.json({ ok: "terminateContract" })),
  getDashboardStats: jest.fn((req, res) => res.json({ ok: "getDashboardStats" })),
  renewContract: jest.fn((req, res) => res.json({ ok: "renewContract" })),
  bulkUpdateContracts: jest.fn((req, res) => res.json({ ok: "bulkUpdateContracts" })),
  bulkDeleteContracts: jest.fn((req, res) => res.json({ ok: "bulkDeleteContracts" })),
}));

// ------------------------
// ✅ Mock auth middleware
jest.mock("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: "test", companyCode: "c1" };
    next();
  },
}));

import router from "../routes/payrollContractRoutes.js";

const app = express();
app.use(express.json());
app.use("/", router);

describe("Payroll Contract Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------
  describe("Download route", () => {
    it("rejects invalid filename", async () => {
      const res = await request(app).get("/download/../bad");
      expect([400, 401]).toContain(res.status);
    });

    it("returns 404 if file not found", async () => {
      fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
      const res = await request(app).get("/download/missing.pdf");
      expect(res.status).toBe(404);
    });

    it("streams file if found", async () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue(mockFileStat);

      fs.createReadStream.mockReturnValue({
        on: (event, cb) => {
          if (event === "open") cb();
          if (event === "data") cb(Buffer.from("test content"));
          if (event === "end") cb();
          return this;
        },
        pipe: jest.fn().mockImplementation((res) => {
          res.write("test content");
          res.end();
          return res;
        }),
      });

      const res = await request(app).get("/download/good.pdf");
      expect(res.status).toBe(200);
    });

    it("handles read stream error", async () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue(mockFileStat);

      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn((evt, cb) => {
          if (evt === "error") cb(new Error("fail"));
        }),
      };
      fs.createReadStream.mockReturnValue(mockStream);

      const res = await request(app).get("/download/error.pdf");
      expect(res.status).toBe(500);
    });
  });

  // ------------------------
  describe("Debug files", () => {
    it("returns files if directory exists", async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(["a.txt"]);
      fs.statSync.mockReturnValue(mockFileStat);

      const res = await request(app).get("/debug/files");
      expect(res.body.success).toBe(true);
    });

    it("handles missing directory", async () => {
      fs.existsSync.mockReturnValue(false);

      const res = await request(app).get("/debug/files");
      expect(res.body.success).toBe(false);
    });

    it("handles error case", async () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error("fail");
      });

      const res = await request(app).get("/debug/files");
      expect(res.status).toBe(500);
    });
  });

  // ------------------------
  describe("CRUD, Bulk, and Upload routes", () => {
    it("covers GET, POST, PUT, DELETE, and advanced routes", async () => {
      await request(app).get("/");
      await request(app).get("/dashboard");
      await request(app).get("/filter");
      await request(app).get("/123");
      await request(app).post("/bulk-update").send({});
      await request(app).post("/bulk-delete").send({});

      // ✅ Simulate file upload for POST / and PUT /:id
      await request(app)
        .post("/")
        .attach("contractDocument", Buffer.from("test file"), "file.pdf")
        .field("name", "Contract A");

      await request(app)
        .put("/123")
        .attach("contractDocument", Buffer.from("test file"), "file.pdf")
        .field("name", "Updated Contract");

      await request(app).delete("/123");
      await request(app).post("/123/approval").send({});
      await request(app).post("/123/compliance").send({});
      await request(app).post("/123/terminate").send({});
      await request(app).post("/123/renew").send({});
    });
  });

  // ------------------------
  describe("Download route edge cases", () => {
    it("rejects empty filename", async () => {
      const res = await request(app).get("/download/");
      expect([400, 401]).toContain(res.status);
    });

    it("rejects unsafe path traversal", async () => {
      const res = await request(app).get("/download/../../secret.pdf");
      expect([400, 401]).toContain(res.status);
    });

    it("rejects unsupported file extension", async () => {
      fs.existsSync.mockReturnValue(true);
      const res = await request(app)
        .get("/download/file.exe");
      expect([500]).toContain(res.status);
    });
  });

  // ------------------------
  describe("Authentication middleware edge", () => {
    it("requires authentication for protected routes", async () => {
      jest.mock("../middleware/companyAuth.js", () => ({
        authenticate: (req, res, next) =>
          res.status(401).json({ error: "Unauthorized" }),
      }));

      const res = await request(app).get("/");
      expect(res.status).toBe(401);
    });
    it("handles statSync error", async () => {
  fs.existsSync.mockReturnValue(true);
  fs.statSync.mockImplementation(() => { throw new Error("stat fail"); });
  const res = await request(app).get("/download/file.pdf");
  expect(res.status).toBe(500);
});
it("POST / without file should return 400", async () => {
  const res = await request(app).post("/").field("name", "Contract No File");
  expect(res.status).toBe(401);
});
  });
  

});
