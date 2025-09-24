// tests/interviewRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock controllers ---
jest.unstable_mockModule("../controllers/interviewController.js", () => ({
  createInterview: jest.fn((req, res) => res.status(201).json({ route: "createInterview" })),
  getInterviews: jest.fn((req, res) => res.status(200).json([{ route: "getInterviews" }])),
  updateInterview: jest.fn((req, res) => res.status(200).json({ route: "updateInterview" })),
  deleteInterview: jest.fn((req, res) => res.status(200).json({ route: "deleteInterview" })),
}));

// --- Mock middleware ---
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.companyCode = "testCompany"; // simulate authenticated request
    next();
  }),
}));

// Import router AFTER mocks
const { default: interviewRouter } = await import("../routes/interviewRoutes.js");

const app = express();
app.use(express.json());
app.use("/interviews", interviewRouter);

describe("interviewRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /interviews → calls createInterview", async () => {
    const res = await request(app).post("/interviews").send({ name: "Interview1" });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe("createInterview");
  });

  it("GET /interviews → calls getInterviews", async () => {
    const res = await request(app).get("/interviews");
    expect(res.status).toBe(200);
    expect(res.body[0].route).toBe("getInterviews");
  });

  it("PUT /interviews/:id → calls updateInterview", async () => {
    const res = await request(app).put("/interviews/123").send({ name: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("updateInterview");
  });

  it("DELETE /interviews/:id → calls deleteInterview", async () => {
    const res = await request(app).delete("/interviews/123");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("deleteInterview");
  });

  it("should return 401 if authenticate middleware blocks", async () => {
    const { authenticate } = await import("../middleware/companyAuth.js");
    authenticate.mockImplementationOnce((req, res) =>
      res.status(401).json({ error: "Auth failed" })
    );
    const res = await request(app).get("/interviews");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Auth failed");
  });
});
