import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock controllers ---
const uploadDocument = jest.fn((req, res) =>
  res.status(201).json({ ok: true, file: req.file?.originalname })
);
const getEmployeeDocuments = jest.fn((req, res) =>
  res.status(200).json({ route: "employee", id: req.params.employeeId })
);
const getFamilyDocuments = jest.fn((req, res) =>
  res.status(200).json({ route: "family", id: req.params.employeeId })
);
const getEducationDocuments = jest.fn((req, res) =>
  res.status(200).json({ route: "education", id: req.params.employeeId })
);
const updateDocumentStatus = jest.fn((req, res) =>
  res.status(200).json({ route: "update", id: req.params.id })
);

// --- Mock multer ---
const multer = jest.fn(() => {
  return {
    single: (field) => {
      // ✅ capture field immediately when router imports
      multer._lastField = field;
      return (req, res, next) => {
        req.file = { originalname: "mock.txt" };
        next();
      };
    },
  };
});

// ✅ Single definition of diskStorage (don’t override twice)
multer.diskStorage = jest.fn((opts) => {
  // Call provided callbacks to simulate usage
  if (opts.destination) opts.destination({}, { originalname: "x.pdf" }, () => {});
  if (opts.filename) opts.filename({}, { originalname: "x.pdf" }, () => {});
  return { storage: true };
});

// Replace real imports with mocks
await jest.unstable_mockModule("../controllers/documentController-1.js", () => ({
  __esModule: true,
  uploadDocument,
  getEmployeeDocuments,
  getFamilyDocuments,
  getEducationDocuments,
  updateDocumentStatus,
}));
await jest.unstable_mockModule("multer", () => ({
  __esModule: true,
  default: multer,
}));

// ✅ Import router AFTER mocks
const { default: documentRoutes } = await import("../routes/documentRoutes-1.js");

// Setup express app
const app = express();
app.use(express.json());
app.use("/", documentRoutes);

describe("Document Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /upload calls uploadDocument with multer.single('file')", async () => {
    const res = await request(app).post("/upload").send({});
    expect(res.status).toBe(201);
    expect(multer._lastField).toBe("file"); // ✅ should now pass
    expect(uploadDocument).toHaveBeenCalled();
  });

  it("GET /employee/:employeeId calls getEmployeeDocuments", async () => {
    const res = await request(app).get("/employee/123");
    expect(res.status).toBe(200);
    expect(getEmployeeDocuments).toHaveBeenCalled();
    expect(res.body.id).toBe("123");
  });

  it("GET /family/:employeeId calls getFamilyDocuments", async () => {
    const res = await request(app).get("/family/456");
    expect(res.status).toBe(200);
    expect(getFamilyDocuments).toHaveBeenCalled();
    expect(res.body.id).toBe("456");
  });

  it("GET /education/:employeeId calls getEducationDocuments", async () => {
    const res = await request(app).get("/education/789");
    expect(res.status).toBe(200);
    expect(getEducationDocuments).toHaveBeenCalled();
    expect(res.body.id).toBe("789");
  });

  it("PATCH /:id/status calls updateDocumentStatus", async () => {
    const res = await request(app).patch("/42/status").send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(updateDocumentStatus).toHaveBeenCalled();
    expect(res.body.id).toBe("42");
  });
});
