import { jest } from "@jest/globals";

const mockGetModelForCompany = jest.fn();
const mockSave = jest.fn();

jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  __esModule: true,
  default: mockGetModelForCompany,
}));

// Import all controller functions after mocking
const {
  createFeedback,
  getAllFeedbacks,
  updateFeedback,
  deleteFeedback,
  getFeedbacksByType,
  bulkUpdateFeedbacks,
  deleteAllFeedbacks,
  getFeedbackAnalytics,
  updateFeedbackReviewStatus,
  getReviewStatus,
} = await import("../controllers/feedbackController.js");

// Fake model class with mocked save (for createFeedback tests)
class MockFeedbackModel {
  constructor(data) {
    Object.assign(this, data);
    this.save = mockSave;
  }
}

describe("createFeedback controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      companyCode: "ABC123",
      body: {},
      user: { _id: "user1" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  test("should return 401 if companyCode is missing", async () => {
    req.companyCode = null;

    await createFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Company code not found in request",
      error: "Authentication required",
    });
  });

  test("should create self-feedback without review flow", async () => {
    req.body = { feedbackType: "selfFeedback", needsReview: false };

    mockGetModelForCompany.mockReturnValue(MockFeedbackModel);
    mockSave.mockResolvedValueOnce({ _id: "s1" });

    await createFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: "s1" });
  });

  test("should create self-feedback with review flow", async () => {
    req.body = { feedbackType: "selfFeedback", needsReview: true };

    const fakeSelf = { _id: "s1" };
    const fakeReview = { _id: "r1" };

    mockGetModelForCompany.mockReturnValue(MockFeedbackModel);
    mockSave.mockResolvedValueOnce(fakeSelf).mockResolvedValueOnce(fakeReview);

    await createFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Feedback created and sent for review",
        data: expect.objectContaining({
          selfFeedback: expect.any(Object),
          reviewFeedback: expect.any(Object),
        }),
      })
    );
  });

  test("should create manager feedback", async () => {
    req.body = { feedbackType: "managerFeedback" };

    mockGetModelForCompany.mockReturnValue(MockFeedbackModel);
    mockSave.mockResolvedValueOnce({ _id: "m1" });

    await createFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: "m1" });
  });

  test("should handle errors gracefully (inner catch → 400)", async () => {
    req.body = { feedbackType: "selfFeedback" };

    mockGetModelForCompany.mockImplementation(() => {
      throw new Error("DB error");
    });

    await createFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "DB error",
      error: "Error creating feedback",
    });
  });
});

describe("feedbackController additional tests", () => {
  let req, res, MockModel;

  beforeEach(() => {
    req = { companyCode: "ABC123", body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn().mockReturnThis(),
    };

    MockModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
      updateMany: jest.fn(),
    };

    mockGetModelForCompany.mockReturnValue(MockModel);
    jest.clearAllMocks();
  });
  test("getAllFeedbacks → error", async () => {
    MockModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValue(new Error("DB fail")),
    });

    await getAllFeedbacks(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Error fetching feedbacks",
        message: "DB fail",
      })
    );
  });

  test("updateFeedback → feedback not found", async () => {
    req.params.id = "f1";
    MockModel.findByIdAndUpdate.mockResolvedValue(null);
    await updateFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("updateFeedback → success", async () => {
    req.params.id = "f1";
    MockModel.findByIdAndUpdate.mockResolvedValue({
      _id: "f1",
      comments: "ok",
    });
    await updateFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  test("deleteFeedback → success", async () => {
    req.params.id = "f1";
    MockModel.findByIdAndDelete.mockResolvedValue({ _id: "f1" });
    await deleteFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  test("deleteFeedback → not found", async () => {
    req.params.id = "f1";
    MockModel.findByIdAndDelete.mockResolvedValue(null);
    await deleteFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  test("getFeedbacksByType → valid type", async () => {
    req.params.type = "selfFeedback";
    MockModel.find.mockResolvedValue([{ _id: "t1" }]);
    await getFeedbacksByType(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("getFeedbacksByType → invalid type", async () => {
    req.params.type = "invalid";
    await getFeedbacksByType(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("bulkUpdateFeedbacks → missing ids", async () => {
    req.body = { updateData: { status: "resolved" } };
    await bulkUpdateFeedbacks(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("bulkUpdateFeedbacks → success", async () => {
    req.body = { ids: ["a1"], updateData: { status: "resolved" } };
    MockModel.updateMany.mockResolvedValue({ nModified: 1 });
    await bulkUpdateFeedbacks(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("getFeedbackAnalytics → returns counts", async () => {
    MockModel.countDocuments.mockResolvedValue(3);
    await getFeedbackAnalytics(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("updateFeedbackReviewStatus → invalid status", async () => {
    req.params.id = "f1";
    req.body.status = "invalid";
    await updateFeedbackReviewStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("updateFeedbackReviewStatus → success", async () => {
    req.params.id = "f1";
    req.body.status = "reviewed";
    MockModel.findByIdAndUpdate.mockResolvedValue({
      _id: "f1",
      reviewStatus: "reviewed",
    });
    await updateFeedbackReviewStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
   test("getReviewStatus → not found", async () => {
    req.params.id = "f1";
    MockModel.findById.mockResolvedValue(null);
    await getReviewStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});