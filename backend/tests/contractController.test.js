import { jest } from "@jest/globals";

// --- Mock Model Methods ---
const saveMock = jest.fn();
const findMock = jest.fn();
const findByIdMock = jest.fn();
const findByIdAndUpdateMock = jest.fn();
const findByIdAndDeleteMock = jest.fn();

// Mock the Contract model
jest.unstable_mockModule("../models/contractModels.js", () => {
  return {
    __esModule: true,
    default: class {
      constructor(data) {
        Object.assign(this, data);
        this.save = saveMock;
      }
      static find = findMock;
      static findById = findByIdMock;
      static findByIdAndUpdate = findByIdAndUpdateMock;
      static findByIdAndDelete = findByIdAndDeleteMock;
    },
  };
});

// Import controller *after* mocks applied
const {
  createContract,
  getContractsByEmployeeId,
  getContractById,
  updateContract,
  deleteContract,
} = await import("../controllers/contractController.js");

describe("contractController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // --- createContract ---
  describe("createContract", () => {
    it("should create and return contract", async () => {
      const mockContract = { _id: "c1", title: "Test" };
      saveMock.mockResolvedValue(mockContract);

      req.body = { title: "Test" };
      await createContract(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Object) })
      );
    });

    it("should handle error in createContract", async () => {
      saveMock.mockRejectedValue(new Error("DB error"));

      req.body = { title: "Bad" };
      await createContract(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "DB error" })
      );
    });
  });

  // --- getContractsByEmployeeId ---
  describe("getContractsByEmployeeId", () => {
    it("should return contracts", async () => {
      const contracts = [{ _id: "c1" }];
      findMock.mockResolvedValue(contracts);

      req.params.userId = "1";
      await getContractsByEmployeeId(req, res);

      expect(findMock).toHaveBeenCalledWith({ employeeId: "1" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: contracts })
      );
    });

    it("should handle error", async () => {
      findMock.mockRejectedValue(new Error("DB error"));

      req.params.userId = "1";
      await getContractsByEmployeeId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "DB error" })
      );
    });
  });

  // --- getContractById ---
  describe("getContractById", () => {
    it("should return contract if found", async () => {
      const contract = { _id: "c1" };
      findByIdMock.mockResolvedValue(contract);

      req.params.id = "c1";
      await getContractById(req, res);

      expect(findByIdMock).toHaveBeenCalledWith("c1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: contract })
      );
    });

    it("should return 404 if not found", async () => {
      findByIdMock.mockResolvedValue(null);

      req.params.id = "c1";
      await getContractById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Contract not found" })
      );
    });

    it("should handle error", async () => {
      findByIdMock.mockRejectedValue(new Error("DB error"));

      req.params.id = "c1";
      await getContractById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "DB error" })
      );
    });
  });

  // --- updateContract ---
  describe("updateContract", () => {
    it("should update contract", async () => {
      const updated = { _id: "c1", title: "Updated" };
      findByIdAndUpdateMock.mockResolvedValue(updated);

      req.params.contractId = "c1";
      req.body = { title: "Updated" };
      await updateContract(req, res);

      expect(findByIdAndUpdateMock).toHaveBeenCalledWith("c1", { title: "Updated" }, { new: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: updated })
      );
    });

    it("should return 404 if not found", async () => {
      findByIdAndUpdateMock.mockResolvedValue(null);

      req.params.contractId = "c1";
      req.body = {};
      await updateContract(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Contract not found" })
      );
    });

    it("should handle error", async () => {
      findByIdAndUpdateMock.mockRejectedValue(new Error("DB error"));

      req.params.contractId = "c1";
      await updateContract(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "DB error" })
      );
    });
  });

  // --- deleteContract ---
  describe("deleteContract", () => {
    it("should delete contract", async () => {
      const deleted = { _id: "c1" };
      findByIdAndDeleteMock.mockResolvedValue(deleted);

      req.params.contractId = "c1";
      await deleteContract(req, res);

      expect(findByIdAndDeleteMock).toHaveBeenCalledWith("c1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Contract deleted successfully" })
      );
    });

    it("should return 404 if not found", async () => {
      findByIdAndDeleteMock.mockResolvedValue(null);

      req.params.contractId = "c1";
      await deleteContract(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Contract not found" })
      );
    });

    it("should handle error", async () => {
      findByIdAndDeleteMock.mockRejectedValue(new Error("DB error"));

      req.params.contractId = "c1";
      await deleteContract(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "DB error" })
      );
    });
  });
});
