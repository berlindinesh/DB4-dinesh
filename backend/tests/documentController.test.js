import { jest } from "@jest/globals";

// --- Mock Document model ---
const mockSave = jest.fn();
const DocumentMock = jest.fn().mockImplementation(() => ({ save: mockSave }));
DocumentMock.find = jest.fn();
DocumentMock.findByIdAndUpdate = jest.fn();
DocumentMock.findByIdAndDelete = jest.fn();
DocumentMock.updateMany = jest.fn();

// Mock module BEFORE importing controller
jest.unstable_mockModule("../models/Document.js", () => ({
  __esModule: true,
  default: DocumentMock,
}));

// Import controller AFTER mocking
const { documentController } = await import("../controllers/documentController.js");

describe("documentController.js", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  // --- getAllDocuments ---
  it("should get all documents", async () => {
    DocumentMock.find.mockResolvedValue([{ id: "doc1" }]);
    await documentController.getAllDocuments(req, res);
    expect(DocumentMock.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should handle error in getAllDocuments", async () => {
    DocumentMock.find.mockRejectedValue(new Error("DB error"));
    await documentController.getAllDocuments(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- createDocument ---
  it("should create a document", async () => {
    req.body = {
      title: "Doc",
      employee: "emp123",
      format: "pdf",
      maxSize: "2MB",
      description: "desc",
      status: "pending",
    };
    mockSave.mockResolvedValue({ id: "doc123" });

    await documentController.createDocument(req, res);

    expect(DocumentMock).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should handle error in createDocument", async () => {
    mockSave.mockRejectedValue(new Error("Save error"));

    await documentController.createDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // --- updateDocument ---
  it("should update a document", async () => {
    req.params.id = "doc123";
    req.body = { status: "approved" };
    DocumentMock.findByIdAndUpdate.mockResolvedValue({ id: "doc123" });

    await documentController.updateDocument(req, res);

    expect(DocumentMock.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should handle error in updateDocument", async () => {
    DocumentMock.findByIdAndUpdate.mockRejectedValue(new Error("Update error"));

    await documentController.updateDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // --- deleteDocument ---
  it("should delete a document", async () => {
    req.params.id = "doc123";
    DocumentMock.findByIdAndDelete.mockResolvedValue({});

    await documentController.deleteDocument(req, res);

    expect(DocumentMock.findByIdAndDelete).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should handle error in deleteDocument", async () => {
    DocumentMock.findByIdAndDelete.mockRejectedValue(new Error("Delete error"));

    await documentController.deleteDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // --- bulkApprove ---
  it("should bulk approve documents", async () => {
    req.body.documentIds = ["doc1", "doc2"];
    DocumentMock.updateMany.mockResolvedValue({});

    await documentController.bulkApprove(req, res);

    expect(DocumentMock.updateMany).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should handle error in bulkApprove", async () => {
    DocumentMock.updateMany.mockRejectedValue(new Error("Bulk error"));

    await documentController.bulkApprove(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // --- bulkReject ---
  it("should bulk reject documents", async () => {
    req.body.documentIds = ["doc1", "doc2"];
    DocumentMock.updateMany.mockResolvedValue({});

    await documentController.bulkReject(req, res);

    expect(DocumentMock.updateMany).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should handle error in bulkReject", async () => {
    DocumentMock.updateMany.mockRejectedValue(new Error("Bulk reject error"));

    await documentController.bulkReject(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
