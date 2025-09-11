import { jest } from "@jest/globals";
 
// --- static methods mocks ---
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockCountDocuments = jest.fn();
const mockAggregate = jest.fn();
 
// --- instance method mock (for new Model().save) ---
const mockSave = jest.fn();
 
// --- mock the model factory to return a constructor ---
jest.unstable_mockModule("../models/genericModelFactory.js", () => {
  class MockModel {
    constructor(data) {
      this.data = data;
      this.save = mockSave;
    }
  }
  MockModel.find = mockFind;
  MockModel.findById = mockFindById;
  MockModel.findByIdAndUpdate = mockFindByIdAndUpdate;
  MockModel.findByIdAndDelete = mockFindByIdAndDelete;
  MockModel.countDocuments = mockCountDocuments;
  MockModel.aggregate = mockAggregate;
 
  return {
    __esModule: true,
    default: jest.fn().mockResolvedValue(MockModel),
  };
});
 
// --- import controller after mocks ---
const {
  getAllAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getSummaryData,
} = await import("../controllers/assetHistoryController.js");
 
// --- helper to mock res ---
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
 
beforeEach(() => {
  jest.clearAllMocks();
});
 
describe("assetHistoryController", () => {
  test("getAllAssets - success", async () => {
    const req = { companyCode: "c1" };
    const res = mockRes();
    const assets = [{ name: "A" }];
    mockFind.mockResolvedValue(assets);
 
    await getAllAssets(req, res);
 
    expect(mockFind).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(assets);
  });
 
  test("getAllAssets - missing companyCode", async () => {
    const req = {};
    const res = mockRes();
 
    await getAllAssets(req, res);
 
    expect(res.status).toHaveBeenCalledWith(401);
  });
 
  test("createAsset - success", async () => {
    const req = {
      companyCode: "c1",
      body: { name: "Laptop", category: "Hardware", status: "Available" },
    };
    const res = mockRes();
    mockSave.mockResolvedValue(req.body);
 
    await createAsset(req, res);
 
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(req.body);
  });
 
  test("createAsset - validation error", async () => {
    const req = {
      companyCode: "c1",
      body: { category: "Hardware" },
    };
    const res = mockRes();
 
    await createAsset(req, res);
 
    expect(res.status).toHaveBeenCalledWith(400);
  });
 
  test("updateAsset - success", async () => {
    const req = {
      companyCode: "c1",
      params: { id: "123" },
      body: { name: "Updated", category: "Hardware", status: "Available" },
    };
    const res = mockRes();
    mockFindById.mockResolvedValue({ _id: "123" });
    mockFindByIdAndUpdate.mockResolvedValue({
      _id: "123",
      name: "Updated",
      category: "Hardware",
      status: "Available",
    });
 
    await updateAsset(req, res);
 
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      "123",
      expect.objectContaining({
        name: "Updated",
        category: "Hardware",
        status: "Available",
      }),
      expect.any(Object)
    );
    expect(res.json).toHaveBeenCalled();
  });
 
  test("updateAsset - not found", async () => {
    const req = {
      companyCode: "c1",
      params: { id: "123" },
      body: { name: "N", category: "C", status: "S" },
    };
    const res = mockRes();
    mockFindById.mockResolvedValue(null);
 
    await updateAsset(req, res);
 
    expect(res.status).toHaveBeenCalledWith(404);
  });
 
  test("deleteAsset - success", async () => {
    const req = { companyCode: "c1", params: { id: "123" } };
    const res = mockRes();
    mockFindByIdAndDelete.mockResolvedValue({ _id: "123" });
 
    await deleteAsset(req, res);
 
    expect(res.json).toHaveBeenCalledWith({ message: "Asset deleted" });
  });
 
  test("deleteAsset - not found", async () => {
    const req = { companyCode: "c1", params: { id: "123" } };
    const res = mockRes();
    mockFindByIdAndDelete.mockResolvedValue(null);
 
    await deleteAsset(req, res);
 
    expect(res.status).toHaveBeenCalledWith(404);
  });
 
  test("getSummaryData - success", async () => {
    const req = { companyCode: "c1" };
    const res = mockRes();
    mockCountDocuments.mockResolvedValueOnce(5);
    mockCountDocuments.mockResolvedValueOnce(2);
    mockAggregate
      .mockResolvedValueOnce([{ _id: "Hardware", count: 3 }])
      .mockResolvedValueOnce([{ _id: "Available", count: 4 }]);
 
    await getSummaryData(req, res);
 
    expect(res.json).toHaveBeenCalledWith({
      totalAssets: 5,
      assetsInUse: 2,
      categoryData: [{ _id: "Hardware", count: 3 }],
      statusData: [{ _id: "Available", count: 4 }],
    });
  });
});
 