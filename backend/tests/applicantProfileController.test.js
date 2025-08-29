import { jest } from "@jest/globals";

// Mock getModelForCompany BEFORE importing controllers
const mockGetModelForCompany = jest.fn();
jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  __esModule: true,
  default: mockGetModelForCompany,
}));

// Import controllers AFTER mocking
const {
  getAllApplicantProfiles,
  createApplicantProfile,
  deleteApplicantProfile,
  batchDeleteApplicantProfiles,
} = await import("../controllers/applicantProfileController.js");

// Import mocked factory
import getModelForCompany from "../models/genericModelFactory.js";

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("ApplicantProfile Controller", () => {
  let req, res, CompanyApplicantProfile;

  beforeEach(() => {
    jest.clearAllMocks();

    req = { companyCode: "testCompany", body: {}, params: {} };
    res = mockRes();

    // Base mock model
    CompanyApplicantProfile = {
      find: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
    };

    // Constructor for new profiles
    const MockProfileConstructor = function (data) {
      this.data = data;
      this.save = jest.fn().mockResolvedValue({ ...data, _id: "new-id" });
    };

    mockGetModelForCompany.mockImplementation(() => {
      const model = function (data) {
        return new MockProfileConstructor(data);
      };
      Object.assign(model, CompanyApplicantProfile);
      return Promise.resolve(model);
    });
  });

  afterAll(async () => {
    jest.resetModules();
  });

  describe("getAllApplicantProfiles", () => {
    test("should return all profiles", async () => {
      const mockProfiles = [{ name: "John" }];
      CompanyApplicantProfile.find.mockResolvedValue(mockProfiles);

      await getAllApplicantProfiles(req, res);

      expect(res.json).toHaveBeenCalledWith(mockProfiles);
    });

    test("should return 401 if companyCode missing", async () => {
      req.companyCode = null;
      await getAllApplicantProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("should handle DB error", async () => {
      CompanyApplicantProfile.find.mockRejectedValue(new Error("DB failed"));

      await getAllApplicantProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Error fetching applicant profiles" })
      );
    });
  });

  describe("createApplicantProfile", () => {
    test("should create a new profile", async () => {
      const profileData = { name: "Jane Doe" };
      req.body = profileData;

      await createApplicantProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("should handle validation error", async () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      validationError.errors = { field: { message: "Required" } };

      mockGetModelForCompany.mockImplementation(() =>
        Promise.resolve(function () {
          return { save: jest.fn().mockRejectedValue(validationError) };
        })
      );

      await createApplicantProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should handle duplicate key error", async () => {
      const duplicateError = new Error("Duplicate key");
      duplicateError.name = "MongoServerError";
      duplicateError.code = 11000;

      mockGetModelForCompany.mockImplementation(() =>
        Promise.resolve(function () {
          return { save: jest.fn().mockRejectedValue(duplicateError) };
        })
      );

      await createApplicantProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test("should handle generic error", async () => {
      const genericError = new Error("Unexpected failure");

      mockGetModelForCompany.mockImplementation(() =>
        Promise.resolve(function () {
          return { save: jest.fn().mockRejectedValue(genericError) };
        })
      );

      await createApplicantProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("deleteApplicantProfile", () => {
    test("should delete a profile", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      CompanyApplicantProfile.findByIdAndDelete.mockResolvedValue({
        _id: req.params.id,
      });

      await deleteApplicantProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should return 404 if profile not found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      CompanyApplicantProfile.findByIdAndDelete.mockResolvedValue(null);

      await deleteApplicantProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("should return 400 if id missing", async () => {
      req.params.id = null;

      await deleteApplicantProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should handle CastError for invalid ID", async () => {
      req.params.id = "invalid";
      const castError = new Error("Cast failed");
      castError.name = "CastError";
      castError.kind = "ObjectId";
      CompanyApplicantProfile.findByIdAndDelete.mockRejectedValue(castError);

      await deleteApplicantProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should handle generic DB error", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      CompanyApplicantProfile.findByIdAndDelete.mockRejectedValue(
        new Error("DB error")
      );

      await deleteApplicantProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("batchDeleteApplicantProfiles", () => {
    test("should batch delete profiles", async () => {
      const ids = ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"];
      req.body.ids = ids;
      CompanyApplicantProfile.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await batchDeleteApplicantProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should handle database errors", async () => {
      req.body.ids = ["507f1f77bcf86cd799439011"];
      CompanyApplicantProfile.deleteMany.mockRejectedValue(new Error("DB fail"));

      await batchDeleteApplicantProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return 401 if companyCode missing", async () => {
      req.companyCode = null;
      req.body.ids = ["507f1f77bcf86cd799439011"];

      await batchDeleteApplicantProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test("should return 400 if ids missing or empty", async () => {
      req.body.ids = [];
      await batchDeleteApplicantProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return 400 if ids not an array", async () => {
      req.body.ids = "not-an-array";
      await batchDeleteApplicantProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("should return 200 with deletedCount = 0", async () => {
      req.body.ids = ["507f1f77bcf86cd799439011"];
      CompanyApplicantProfile.deleteMany.mockResolvedValue({ deletedCount: 0 });

      await batchDeleteApplicantProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ deletedCount: 0 })
      );
    });
  });
});
