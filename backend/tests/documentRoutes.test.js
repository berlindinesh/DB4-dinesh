import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock controller ---
const getAllDocuments = jest.fn((req, res) => res.status(200).json({ ok: "getAll" }));
const createDocument = jest.fn((req, res) => res.status(201).json({ ok: "create" }));
const updateDocument = jest.fn((req, res) => res.status(200).json({ ok: "update", id: req.params.id }));
const deleteDocument = jest.fn((req, res) => res.status(200).json({ ok: "delete", id: req.params.id }));
const bulkApprove = jest.fn((req, res) => res.status(200).json({ ok: "bulkApprove" }));
const bulkReject = jest.fn((req, res) => res.status(200).json({ ok: "bulkReject" }));

await jest.unstable_mockModule("../controllers/documentController.js", () => ({
  __esModule: true,
  documentController: {
    getAllDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    bulkApprove,
    bulkReject,
  },
}));

// Import router after mocks
const { default: documentRoutes } = await import("../routes/documentRoutes.js");

// Setup express app
const app = express();
app.use(express.json());
app.use("/", documentRoutes);

describe("Document Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /documents → calls getAllDocuments", async () => {
    const res = await request(app).get("/documents");
    expect(res.status).toBe(200);
    expect(getAllDocuments).toHaveBeenCalled();
  });

  it("POST /documents → calls createDocument", async () => {
    const res = await request(app).post("/documents").send({ name: "Doc1" });
    expect(res.status).toBe(201);
    expect(createDocument).toHaveBeenCalled();
  });

  it("PUT /documents/:id → calls updateDocument", async () => {
    const res = await request(app).put("/documents/123").send({ name: "Updated" });
    expect(res.status).toBe(200);
    expect(updateDocument).toHaveBeenCalled();
    expect(res.body.id).toBe("123");
  });

  it("DELETE /documents/:id → calls deleteDocument", async () => {
    const res = await request(app).delete("/documents/456");
    expect(res.status).toBe(200);
    expect(deleteDocument).toHaveBeenCalled();
    expect(res.body.id).toBe("456");
  });

  it("POST /documents/bulk-approve → calls bulkApprove", async () => {
    const res = await request(app).post("/documents/bulk-approve").send({ ids: [1, 2] });
    expect(res.status).toBe(200);
    expect(bulkApprove).toHaveBeenCalled();
  });

  it("POST /documents/bulk-reject → calls bulkReject", async () => {
    const res = await request(app).post("/documents/bulk-reject").send({ ids: [3, 4] });
    expect(res.status).toBe(200);
    expect(bulkReject).toHaveBeenCalled();
  });
});
