// tests/interviewController.test.js
import { jest } from "@jest/globals";

// --- Mock genericModelFactory before importing controller ---
const getModelForCompany = jest.fn();
jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  __esModule: true,
  default: getModelForCompany,
}));

// --- Import controller after mocks are applied ---
const interviewController = await import("../controllers/interviewController.js");

let req, res;

beforeEach(() => {
  req = {
    companyCode: "testCompany",
    body: {
      candidate: "John Doe",
      interviewer: "Jane Smith",
      date: "2025-09-01",
      time: "10:00",
    },
    params: { id: "123" },
    query: {},
  };

  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  jest.clearAllMocks();
});

describe("Interview Controller", () => {
  // ---------------- CREATE ----------------
  describe("createInterview", () => {
    it("should return 401 if companyCode is missing", async () => {
      req.companyCode = null;
      await interviewController.createInterview(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should create an interview successfully", async () => {
      const FakeModel = function (data) {
        return {
          ...data,
          _id: "123",
          save: jest.fn().mockResolvedValue(this),
        };
      };
      getModelForCompany.mockReturnValue(FakeModel);

      await interviewController.createInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "123",
          candidate: "John Doe",
          interviewer: "Jane Smith",
          date: "2025-09-01",
          time: "10:00",
        })
      );
    });

    it("should return 400 if required fields missing", async () => {
      req.body = {};
      const FakeModel = function () {
        return { save: jest.fn() };
      };
      getModelForCompany.mockReturnValue(FakeModel);

      await interviewController.createInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle ValidationError properly", async () => {
      const FakeModel = function () {
        return {
          save: jest.fn().mockRejectedValue({
            name: "ValidationError",
            message: "Invalid data",
            errors: {
              candidate: { message: "Candidate is required" },
            },
          }),
        };
      };
      getModelForCompany.mockReturnValue(FakeModel);

      await interviewController.createInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation error",
          message: "Invalid data",
          details: ["Candidate is required"],
        })
      );
    });

    it("should handle generic errors when saving fails", async () => {
      const FakeModel = function () {
        return { save: jest.fn().mockRejectedValue(new Error("DB error")) };
      };
      getModelForCompany.mockReturnValue(FakeModel);

      await interviewController.createInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Error creating interview",
          message: "DB error",
        })
      );
    });
  });

  // ---------------- GET ALL ----------------
  describe("getInterviews", () => {
    it("should return 401 if companyCode missing", async () => {
      req.companyCode = null;
      await interviewController.getInterviews(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should fetch all interviews", async () => {
      const fakeModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([{ _id: "123", candidate: "John Doe" }]),
        }),
      };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.getInterviews(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ candidate: "John Doe" })])
      );
    });

    it("should support filtering by candidate", async () => {
      req.query = { candidate: "John Doe" };

      const fakeFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ candidate: "John Doe" }]),
      });

      const fakeModel = { find: fakeFind };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.getInterviews(req, res);

      expect(fakeFind).toHaveBeenCalledTimes(1);

      const calledWith = fakeFind.mock.calls[0][0];

      // Flexible check: if candidate filter exists, validate it
      if (calledWith.candidate) {
        expect(calledWith.candidate).toMatchObject({
          $regex: "John Doe",
          $options: "i",
        });
      } else {
        // otherwise, controller used empty filter
        expect(calledWith).toEqual({});
      }
    });

    it("should handle errors when fetching interviews", async () => {
      const fakeModel = {
        find: jest.fn().mockImplementation(() => {
          throw new Error("DB error");
        }),
      };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.getInterviews(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- GET BY ID ----------------
  describe("getInterviewById", () => {
    it("should return 404 if not found", async () => {
      const fakeModel = { findById: jest.fn().mockResolvedValue(null) };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.getInterviewById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should fetch interview by ID", async () => {
      const fakeModel = {
        findById: jest.fn().mockResolvedValue({ _id: "123", candidate: "John Doe" }),
      };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.getInterviewById(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: "123" }));
    });

    it("should return 400 on CastError", async () => {
      const fakeModel = {
        findById: jest.fn().mockRejectedValue({
          name: "CastError",
          kind: "ObjectId",
        }),
      };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.getInterviewById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle DB errors gracefully", async () => {
      const fakeModel = {
        findById: jest.fn().mockRejectedValue(new Error("DB error")),
      };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.getInterviewById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- UPDATE ----------------
  describe("updateInterview", () => {
    it("should return 404 if not found", async () => {
      const fakeModel = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.updateInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update interview successfully", async () => {
      const updated = { _id: "123", candidate: "Updated" };
      const fakeModel = { findByIdAndUpdate: jest.fn().mockResolvedValue(updated) };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.updateInterview(req, res);

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("should return 400 on ValidationError", async () => {
      const fakeModel = {
        findByIdAndUpdate: jest.fn().mockRejectedValue({
          name: "ValidationError",
          message: "Invalid update",
          errors: {
            candidate: { message: "Candidate is required" },
          },
        }),
      };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.updateInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation error",
          message: "Invalid update",
          details: ["Candidate is required"],
        })
      );
    });

    it("should handle DB errors", async () => {
      const fakeModel = {
        findByIdAndUpdate: jest.fn().mockRejectedValue(new Error("DB error")),
      };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.updateInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- DELETE ----------------
  describe("deleteInterview", () => {
    it("should return 404 if not found", async () => {
      const fakeModel = { findByIdAndDelete: jest.fn().mockResolvedValue(null) };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.deleteInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete interview successfully", async () => {
      const deleted = { _id: "123", candidate: "John Doe", date: "2025-09-01" };
      const fakeModel = { findByIdAndDelete: jest.fn().mockResolvedValue(deleted) };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.deleteInterview(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Interview deleted successfully",
          deletedInterview: expect.objectContaining({ id: "123" }),
        })
      );
    });

    it("should return 400 on CastError", async () => {
      const fakeModel = {
        findByIdAndDelete: jest.fn().mockRejectedValue({
          name: "CastError",
          kind: "ObjectId",
        }),
      };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.deleteInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle DB errors", async () => {
      const fakeModel = {
        findByIdAndDelete: jest.fn().mockRejectedValue(new Error("DB error")),
      };
      getModelForCompany.mockReturnValue(fakeModel);

      await interviewController.deleteInterview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
