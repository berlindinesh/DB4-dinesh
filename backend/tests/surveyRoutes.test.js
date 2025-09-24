// tests/surveyRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------
jest.unstable_mockModule("../controllers/surveyController.js", () => ({
  getAllTemplates: jest.fn((req, res) => res.json({ route: "getAllTemplates" })),
  addTemplate: jest.fn((req, res) => res.json({ route: "addTemplate" })),
  addQuestionToTemplate: jest.fn((req, res) =>
    res.json({ route: "addQuestionToTemplate", templateId: req.params.templateId })
  ),
  updateTemplate: jest.fn((req, res) =>
    res.json({ route: "updateTemplate", id: req.params.id })
  ),
  updateQuestion: jest.fn((req, res) =>
    res.json({
      route: "updateQuestion",
      templateId: req.params.templateId,
      questionId: req.params.questionId,
    })
  ),
  deleteQuestion: jest.fn((req, res) =>
    res.json({
      route: "deleteQuestion",
      templateId: req.params.templateId,
      questionId: req.params.questionId,
    })
  ),
  deleteTemplate: jest.fn((req, res) =>
    res.json({ route: "deleteTemplate", id: req.params.id })
  ),
}));

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: "mockUser" };
    next();
  },
}));

// ------------------ IMPORT ROUTER AFTER MOCKS ------------------
const routerModule = await import("../routes/surveyRoutes.js");
const router = routerModule.default;
const controllers = await import("../controllers/surveyController.js");

// ------------------ APP SETUP ------------------
const app = express();
app.use(express.json());
app.use(router);

// ------------------ TEST SUITE ------------------
describe("Survey Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("GET /api/recruitment-survey", async () => {
    const res = await request(app).get("/api/recruitment-survey");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getAllTemplates");
    expect(controllers.getAllTemplates).toHaveBeenCalled();
  });

  test("POST /api/recruitment-survey/add", async () => {
    const res = await request(app).post("/api/recruitment-survey/add").send({ name: "Template 1" });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("addTemplate");
    expect(controllers.addTemplate).toHaveBeenCalled();
  });

  test("POST /api/recruitment-survey/:templateId/questions", async () => {
    const res = await request(app).post("/api/recruitment-survey/123/questions").send({ text: "Q1" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "addQuestionToTemplate", templateId: "123" });
    expect(controllers.addQuestionToTemplate).toHaveBeenCalled();
  });

  test("PUT /api/recruitment-survey/:id", async () => {
    const res = await request(app).put("/api/recruitment-survey/456").send({ name: "Updated Template" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "updateTemplate", id: "456" });
    expect(controllers.updateTemplate).toHaveBeenCalled();
  });

  test("PUT /api/recruitment-survey/:templateId/questions/:questionId", async () => {
    const res = await request(app)
      .put("/api/recruitment-survey/123/questions/789")
      .send({ text: "Updated Q1" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "updateQuestion", templateId: "123", questionId: "789" });
    expect(controllers.updateQuestion).toHaveBeenCalled();
  });

  test("DELETE /api/recruitment-survey/:templateId/questions/:questionId", async () => {
    const res = await request(app).delete("/api/recruitment-survey/123/questions/789");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "deleteQuestion", templateId: "123", questionId: "789" });
    expect(controllers.deleteQuestion).toHaveBeenCalled();
  });

  test("DELETE /api/recruitment-survey/:id", async () => {
    const res = await request(app).delete("/api/recruitment-survey/999");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "deleteTemplate", id: "999" });
    expect(controllers.deleteTemplate).toHaveBeenCalled();
  });
});
