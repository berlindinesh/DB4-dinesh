// tests/feedbackRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock middleware ---
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: jest.fn((req, res, next) => next()), // always allow
}));

// --- Mock controller functions ---
const mockControllers = {
  createFeedback: jest.fn((req, res) => res.json({ route: "createFeedback" })),
  getAllFeedbacks: jest.fn((req, res) => res.json({ route: "getAllFeedbacks" })),
  updateFeedback: jest.fn((req, res) => res.json({ route: "updateFeedback" })),
  deleteFeedback: jest.fn((req, res) => res.json({ route: "deleteFeedback" })),
  getFeedbacksByType: jest.fn((req, res) => res.json({ route: "getFeedbacksByType" })),
  getFeedbackHistory: jest.fn((req, res) => res.json({ route: "getFeedbackHistory" })),
  addFeedbackComment: jest.fn((req, res) => res.json({ route: "addFeedbackComment" })),
  getFeedbackAnalytics: jest.fn((req, res) => res.json({ route: "getFeedbackAnalytics" })),
  submitFeedbackResponse: jest.fn((req, res) => res.json({ route: "submitFeedbackResponse" })),
  getFeedbacksByEmployee: jest.fn((req, res) => res.json({ route: "getFeedbacksByEmployee" })),
  getFeedbacksByDepartment: jest.fn((req, res) => res.json({ route: "getFeedbacksByDepartment" })),
  getFeedbacksOverdue: jest.fn((req, res) => res.json({ route: "getFeedbacksOverdue" })),
  getFeedbacksDueThisWeek: jest.fn((req, res) => res.json({ route: "getFeedbacksDueThisWeek" })),
  bulkUpdateFeedbacks: jest.fn((req, res) => res.json({ route: "bulkUpdateFeedbacks" })),
  bulkDeleteFeedbacks: jest.fn((req, res) => res.json({ route: "bulkDeleteFeedbacks" })),
  getFeedbacksByUserId: jest.fn((req, res) => res.json({ route: "getFeedbacksByUserId" })),
  updateFeedbackReviewStatus: jest.fn((req, res) => res.json({ route: "updateFeedbackReviewStatus" })),
  completeFeedbackReview: jest.fn((req, res) => res.json({ route: "completeFeedbackReview" })),
  getLinkedFeedback: jest.fn((req, res) => res.json({ route: "getLinkedFeedback" })),
  getFeedbacksToReviewByUser: jest.fn((req, res) => res.json({ route: "getFeedbacksToReviewByUser" })),
  assignFeedbackForReview: jest.fn((req, res) => res.json({ route: "assignFeedbackForReview" })),
  getFeedbackStatsByUser: jest.fn((req, res) => res.json({ route: "getFeedbackStatsByUser" })),
};

jest.unstable_mockModule("../controllers/feedbackController.js", () => mockControllers);

// --- Import router after mocks ---
const { default: feedbackRouter } = await import("../routes/feedbackRoutes.js");

const app = express();
app.use(express.json());
app.use("/feedback", feedbackRouter);

// --- Tests ---
describe("feedbackRoutes", () => {
  it("POST /feedback → createFeedback", async () => {
    const res = await request(app).post("/feedback").send({});
    expect(res.body.route).toBe("createFeedback");
  });

  it("GET /feedback → getAllFeedbacks", async () => {
    const res = await request(app).get("/feedback");
    expect(res.body.route).toBe("getAllFeedbacks");
  });

  it("PUT /feedback/:id → updateFeedback", async () => {
    const res = await request(app).put("/feedback/123");
    expect(res.body.route).toBe("updateFeedback");
  });

  it("DELETE /feedback/:id → deleteFeedback", async () => {
    const res = await request(app).delete("/feedback/123");
    expect(res.body.route).toBe("deleteFeedback");
  });

  it("GET /feedback/type/:type → getFeedbacksByType", async () => {
    const res = await request(app).get("/feedback/type/general");
    expect(res.body.route).toBe("getFeedbacksByType");
  });

  it("GET /feedback/:id/history → getFeedbackHistory", async () => {
    const res = await request(app).get("/feedback/123/history");
    expect(res.body.route).toBe("getFeedbackHistory");
  });

  it("POST /feedback/:id/comments → addFeedbackComment", async () => {
    const res = await request(app).post("/feedback/123/comments");
    expect(res.body.route).toBe("addFeedbackComment");
  });

  it("GET /feedback/analytics/summary → getFeedbackAnalytics", async () => {
    const res = await request(app).get("/feedback/analytics/summary");
    expect(res.body.route).toBe("getFeedbackAnalytics");
  });

  it("POST /feedback/:id/response → submitFeedbackResponse", async () => {
    const res = await request(app).post("/feedback/123/response");
    expect(res.body.route).toBe("submitFeedbackResponse");
  });

  it("GET /feedback/employee/:employeeId → getFeedbacksByEmployee", async () => {
    const res = await request(app).get("/feedback/employee/456");
    expect(res.body.route).toBe("getFeedbacksByEmployee");
  });

  it("GET /feedback/department/:department → getFeedbacksByDepartment", async () => {
    const res = await request(app).get("/feedback/department/IT");
    expect(res.body.route).toBe("getFeedbacksByDepartment");
  });

  it("GET /feedback/due/overdue → getFeedbacksOverdue", async () => {
    const res = await request(app).get("/feedback/due/overdue");
    expect(res.body.route).toBe("getFeedbacksOverdue");
  });

  it("GET /feedback/due/this-week → getFeedbacksDueThisWeek", async () => {
    const res = await request(app).get("/feedback/due/this-week");
    expect(res.body.route).toBe("getFeedbacksDueThisWeek");
  });

  it("PUT /feedback/bulk/update → bulkUpdateFeedbacks", async () => {
    const res = await request(app).put("/feedback/bulk/update");
    expect(res.body.route).toBe("bulkUpdateFeedbacks");
  });

  it("DELETE /feedback/bulk/delete → bulkDeleteFeedbacks", async () => {
    const res = await request(app).delete("/feedback/bulk/delete");
    expect(res.body.route).toBe("bulkDeleteFeedbacks");
  });

  it("GET /feedback/user/:userId → getFeedbacksByUserId", async () => {
    const res = await request(app).get("/feedback/user/789");
    expect(res.body.route).toBe("getFeedbacksByUserId");
  });

  it("PUT /feedback/:id/review → updateFeedbackReviewStatus", async () => {
    const res = await request(app).put("/feedback/123/review");
    expect(res.body.route).toBe("updateFeedbackReviewStatus");
  });

  it("POST /feedback/:id/complete-review → completeFeedbackReview", async () => {
    const res = await request(app).post("/feedback/123/complete-review");
    expect(res.body.route).toBe("completeFeedbackReview");
  });

  it("GET /feedback/:id/linked → getLinkedFeedback", async () => {
    const res = await request(app).get("/feedback/123/linked");
    expect(res.body.route).toBe("getLinkedFeedback");
  });

  it("GET /feedback/to-review/:userId → getFeedbacksToReviewByUser", async () => {
    const res = await request(app).get("/feedback/to-review/111");
    expect(res.body.route).toBe("getFeedbacksToReviewByUser");
  });

  it("PUT /feedback/:id/assign → assignFeedbackForReview", async () => {
    const res = await request(app).put("/feedback/123/assign");
    expect(res.body.route).toBe("assignFeedbackForReview");
  });

  it("GET /feedback/stats/:userId → getFeedbackStatsByUser", async () => {
    const res = await request(app).get("/feedback/stats/222");
    expect(res.body.route).toBe("getFeedbackStatsByUser");
  });
});
