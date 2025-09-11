// tests/assetController.test.js
import { jest } from "@jest/globals";
 
// ---- Mock Asset.js ----
const mockSave = jest.fn();
const AssetMock = jest.fn().mockImplementation((data) => ({
  ...data,
  save: mockSave,
}));
jest.unstable_mockModule("../models/Asset.js", () => ({
  __esModule: true,
  default: AssetMock,
}));
 
// ---- Mock AssetBatch.js ----
const findById = jest.fn();
jest.unstable_mockModule("../models/AssetBatch.js", () => ({
  __esModule: true,
  default: { findById },
}));
 
// ---- Import after mocks ----
const { createAssetsFromBatch } = await import("../controllers/assetController.js");
const AssetBatch = (await import("../models/AssetBatch.js")).default;
const Asset = (await import("../models/Asset.js")).default;
 
describe("createAssetsFromBatch", () => {
  let mockReq, mockRes;
 
  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {
        batchId: "batch123",
        assetNames: ["Laptop", "Monitor"],
        category: "Hardware",
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });
 
  it("✅ should create assets successfully", async () => {
    AssetBatch.findById.mockResolvedValue({ _id: "batch123", batchNumber: "B001" });
    mockSave.mockResolvedValue(true);
 
    await createAssetsFromBatch(mockReq, mockRes);
 
    expect(AssetBatch.findById).toHaveBeenCalledWith("batch123");
    expect(mockSave).toHaveBeenCalledTimes(2);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining("2 assets created successfully"),
      })
    );
  });
 
  it("✅ should return 404 if batch not found", async () => {
    AssetBatch.findById.mockResolvedValue(null);
 
    await createAssetsFromBatch(mockReq, mockRes);
 
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Asset batch not found",
    });
  });
 
  it("✅ should handle errors when saving assets", async () => {
    AssetBatch.findById.mockResolvedValue({ _id: "batch123", batchNumber: "B002" });
    mockSave.mockRejectedValue(new Error("DB error"));
 
    await createAssetsFromBatch(mockReq, mockRes);
 
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "DB error",
    });
  });
});
 