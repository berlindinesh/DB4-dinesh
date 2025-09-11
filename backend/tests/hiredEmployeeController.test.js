import { jest } from "@jest/globals";

// 1. Setup mock before importing the controller
const mockGetModelForCompany = jest.fn();
await jest.unstable_mockModule("../models/modelFactory.js", () => ({
  __esModule: true,
  default: mockGetModelForCompany,
}));

// 2. Now import controller functions (after mocking)
const {
  getAllHiredEmployees,
  createHiredEmployee,
  updateHiredEmployee,
  deleteHiredEmployee,
  getHiredEmployeeById,
  filterHiredEmployees,
} = await import("../controllers/hiredEmployeeController.js");

// Helper response mock
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("HiredEmployee Controller", () => {
  let req, res, mockModel;

  beforeEach(() => {
    res = mockRes();
    req = { companyCode: "testCompany", body: {}, params: {}, query: {} };

    mockModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      save: jest.fn(),
    };

    mockGetModelForCompany.mockResolvedValue(mockModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- getAllHiredEmployees ----------------
  describe("getAllHiredEmployees", () => {
    it("should return employees when companyCode exists", async () => {
      await getAllHiredEmployees(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 401 if companyCode is missing", async () => {
      delete req.companyCode;
      await getAllHiredEmployees(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ---------------- createHiredEmployee ----------------
  describe("createHiredEmployee", () => {
    it("should create and return employee", async () => {
      const saveMock = jest.fn().mockResolvedValue({ id: 1, name: "John" });
      mockGetModelForCompany.mockResolvedValue(function () {
        this.save = saveMock;
        return this;
      });
      req.body = { name: "John" };
      await createHiredEmployee(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle validation error", async () => {
      const err = new Error("Validation failed");
      err.name = "ValidationError";
      err.errors = { name: { message: "Name is required" } }; // ✅ add errors
      const saveMock = jest.fn().mockRejectedValue(err);
      mockGetModelForCompany.mockResolvedValue(function () {
        this.save = saveMock;
        return this;
      });
      await createHiredEmployee(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation error",
          details: ["Name is required"], // ✅ ensures mapped correctly
        })
      );
    });

    it("should handle duplicate error", async () => {
      const err = new Error("Duplicate");
      err.name = "MongoServerError";
      err.code = 11000;
      const saveMock = jest.fn().mockRejectedValue(err);
      mockGetModelForCompany.mockResolvedValue(function () {
        this.save = saveMock;
        return this;
      });
      await createHiredEmployee(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  // ---------------- updateHiredEmployee ----------------
  describe("updateHiredEmployee", () => {
    it("should update employee successfully", async () => {
      req.params.id = "123";
      mockModel.findByIdAndUpdate.mockResolvedValue({ id: "123" });
      await updateHiredEmployee(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if not found", async () => {
      req.params.id = "123";
      mockModel.findByIdAndUpdate.mockResolvedValue(null);
      await updateHiredEmployee(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 400 on invalid ID", async () => {
      req.params.id = "bad";
      const err = new Error();
      err.name = "CastError";
      err.kind = "ObjectId";
      mockModel.findByIdAndUpdate.mockRejectedValue(err);
      await updateHiredEmployee(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- deleteHiredEmployee ----------------
  describe("deleteHiredEmployee", () => {
    it("should delete employee", async () => {
      req.params.id = "123";
      mockModel.findByIdAndDelete.mockResolvedValue({ id: "123" });
      await deleteHiredEmployee(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if employee not found", async () => {
      req.params.id = "123";
      mockModel.findByIdAndDelete.mockResolvedValue(null);
      await deleteHiredEmployee(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 400 on invalid ID", async () => {
      req.params.id = "bad";
      const err = new Error();
      err.name = "CastError";
      err.kind = "ObjectId";
      mockModel.findByIdAndDelete.mockRejectedValue(err);
      await deleteHiredEmployee(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- getHiredEmployeeById ----------------
  describe("getHiredEmployeeById", () => {
    it("should return employee if found", async () => {
      req.params.id = "123";
      mockModel.findById.mockResolvedValue({ id: "123" });
      await getHiredEmployeeById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if not found", async () => {
      req.params.id = "123";
      mockModel.findById.mockResolvedValue(null);
      await getHiredEmployeeById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- filterHiredEmployees ----------------
  describe("filterHiredEmployees", () => {
    it("should filter and return employees", async () => {
      req.query = { department: "HR", status: "Active", search: "John" };
      await filterHiredEmployees(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 401 if no companyCode", async () => {
      delete req.companyCode;
      await filterHiredEmployees(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
