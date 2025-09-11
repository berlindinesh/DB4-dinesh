import { jest } from "@jest/globals";

// --- Mock functions ---
const mockSave = jest.fn();
const mockFind = jest.fn();
const mockFindByIdAndUpdate = jest.fn();

// Mocked Document constructor with static methods
const MockDocument = jest.fn().mockImplementation(() => ({ save: mockSave }));
MockDocument.find = mockFind;
MockDocument.findByIdAndUpdate = mockFindByIdAndUpdate;

// --- Mock the module BEFORE importing controller ---
jest.unstable_mockModule("../models/Document-1.js", () => ({
  __esModule: true,
  default: {}, // controller imports "documents" but uses global Document
}));

// Inject fake global Document so controller code doesn’t crash
global.Document = MockDocument;

// --- Import controller AFTER mocks are ready ---
const {
  uploadDocument,
  getEmployeeDocuments,
  getFamilyDocuments,
  getEducationDocuments,
  updateDocumentStatus,
} = await import("../controllers/documentController-1.js");

describe("documentController-1.js", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, file: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  // -------- uploadDocument --------
  it("should save and return uploaded document", async () => {
    req.body = {
      employeeId: "emp1",
      category: "Personal",
      documentType: "aadhar",
    };
    req.file = { originalname: "aadhar.pdf", path: "/uploads/aadhar.pdf" };
    mockSave.mockResolvedValue({ _id: "doc1", employeeId: "emp1" });

    await uploadDocument(req, res);

    expect(MockDocument).toHaveBeenCalledWith({
      employeeId: "emp1",
      category: "Personal",
      documentType: "aadhar",
      fileName: "aadhar.pdf",
      fileUrl: "/uploads/aadhar.pdf",
      relatedTo: "self",
    });
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: "doc1", employeeId: "emp1" });
  });

  it("should handle error in uploadDocument", async () => {
    mockSave.mockRejectedValue(new Error("Save fail"));

    await uploadDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Save fail" });
  });

  // -------- getEmployeeDocuments --------
  it("should get employee documents", async () => {
    req.params = { employeeId: "emp1" };
    mockFind.mockResolvedValue([{ _id: "doc1" }]);

    await getEmployeeDocuments(req, res);

    expect(mockFind).toHaveBeenCalledWith({ employeeId: "emp1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ _id: "doc1" }]);
  });

  it("should handle error in getEmployeeDocuments", async () => {
    mockFind.mockRejectedValue(new Error("DB error"));

    await getEmployeeDocuments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
  });

  // -------- getFamilyDocuments --------
  it("should get family documents", async () => {
    req.params = { employeeId: "emp1" };
    mockFind.mockResolvedValue([{ _id: "famdoc" }]);

    await getFamilyDocuments(req, res);

    expect(mockFind).toHaveBeenCalledWith({
      employeeId: "emp1",
      category: "Personal",
      documentType: "familyAadhar",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ _id: "famdoc" }]);
  });

  it("should handle error in getFamilyDocuments", async () => {
    mockFind.mockRejectedValue(new Error("Fam error"));

    await getFamilyDocuments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Fam error" });
  });

  // -------- getEducationDocuments --------
  it("should get education documents", async () => {
    req.params = { employeeId: "emp1" };
    mockFind.mockResolvedValue([{ _id: "edudoc" }]);

    await getEducationDocuments(req, res);

    expect(mockFind).toHaveBeenCalledWith({
      employeeId: "emp1",
      category: "Education",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ _id: "edudoc" }]);
  });

  it("should handle error in getEducationDocuments", async () => {
    mockFind.mockRejectedValue(new Error("Edu error"));

    await getEducationDocuments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Edu error" });
  });

  // -------- updateDocumentStatus --------
  it("should update document status", async () => {
    req.params = { id: "doc1" };
    req.body = { status: "Approved" };
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "doc1", status: "Approved" });

    await updateDocumentStatus(req, res);

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      "doc1",
      { status: "Approved" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ _id: "doc1", status: "Approved" });
  });

  it("should handle error in updateDocumentStatus", async () => {
    mockFindByIdAndUpdate.mockRejectedValue(new Error("Update fail"));

    await updateDocumentStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Update fail" });
  });
});
