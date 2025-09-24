// tests/notificationRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock middleware ---
const mockAuthenticate = jest.fn((req, res, next) => next());
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: mockAuthenticate,
}));

// --- Mock controllers ---
jest.unstable_mockModule("../controllers/notificationController.js", () => ({
  getUserNotifications: jest.fn((req, res) => res.json({ route: "getUserNotifications", userId: req.params.userId })),
  createNotification: jest.fn((req, res) => res.status(201).json({ route: "createNotification" })),
  markAsRead: jest.fn((req, res) => res.json({ route: "markAsRead", id: req.params.id })),
  markAllAsRead: jest.fn((req, res) => res.json({ route: "markAllAsRead", userId: req.params.userId })),
  deleteNotification: jest.fn((req, res) => res.json({ route: "deleteNotification", id: req.params.id })),
  clearAllNotifications: jest.fn((req, res) => res.json({ route: "clearAllNotifications", userId: req.params.userId })),
}));

// Import router after mocks
const { default: notificationRouter } = await import("../routes/notificationRoutes.js");

const app = express();
app.use(express.json());
app.use("/notifications", notificationRouter);

describe("notificationRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /notifications/user/:userId → getUserNotifications", async () => {
    const res = await request(app).get("/notifications/user/U123");
    expect(res.body).toEqual({ route: "getUserNotifications", userId: "U123" });
  });

  it("POST /notifications → createNotification", async () => {
    const res = await request(app).post("/notifications").send({ message: "New task assigned" });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe("createNotification");
  });

  it("PUT /notifications/:id/read → markAsRead", async () => {
    const res = await request(app).put("/notifications/999/read");
    expect(res.body).toEqual({ route: "markAsRead", id: "999" });
  });

  it("PUT /notifications/user/:userId/read-all → markAllAsRead", async () => {
    const res = await request(app).put("/notifications/user/U456/read-all");
    expect(res.body).toEqual({ route: "markAllAsRead", userId: "U456" });
  });

  it("DELETE /notifications/:id → deleteNotification", async () => {
    const res = await request(app).delete("/notifications/321");
    expect(res.body).toEqual({ route: "deleteNotification", id: "321" });
  });

  it("DELETE /notifications/user/:userId/clear-all → clearAllNotifications", async () => {
    const res = await request(app).delete("/notifications/user/U789/clear-all");
    expect(res.body).toEqual({ route: "clearAllNotifications", userId: "U789" });
  });

  it("should call authenticate middleware on every route", async () => {
    await request(app).get("/notifications/user/U000");
    expect(mockAuthenticate).toHaveBeenCalled();
  });
});
