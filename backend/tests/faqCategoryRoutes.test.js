// tests/faqCategoryRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";

// --- Mocks for models ---
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockCountDocuments = jest.fn();
const mockDeleteMany = jest.fn();

const MockFaqCategory = jest.fn(function (data) {
  this.save = jest.fn().mockResolvedValue({ _id: "fc1", ...data });
});
MockFaqCategory.find = mockFind;
MockFaqCategory.findById = mockFindById;
MockFaqCategory.findByIdAndUpdate = mockFindByIdAndUpdate;
MockFaqCategory.findByIdAndDelete = mockFindByIdAndDelete;

const MockFaq = { countDocuments: mockCountDocuments, deleteMany: mockDeleteMany };

// --- Mock middleware + factory ---
const authenticate = (req, res, next) => {
  req.companyCode = req.headers["x-company-code"];
  next();
};

await jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  __esModule: true,
  authenticate,
}));

await jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((code, name) => {
    if (name === "FaqCategory") return MockFaqCategory;
    if (name === "Faq") return MockFaq;
    return null;
  }),
}));

// --- Import router AFTER mocks ---
const { default: faqCategoryRouter } = await import("../routes/faqCategoryRoutes.js");

const app = express();
app.use(express.json());
app.use("/faq-categories", faqCategoryRouter);

describe("faqCategoryRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /faq-categories ---
  it("GET / → 401 if no companyCode", async () => {
    const res = await request(app).get("/faq-categories");
    expect(res.status).toBe(401);
  });

  it("GET / success → 200", async () => {
    mockFind.mockResolvedValue([
      { _id: "c1", title: "General", toObject: () => ({ _id: "c1", title: "General" }) },
    ]);
    mockCountDocuments.mockResolvedValue(2);

    const res = await request(app).get("/faq-categories").set("x-company-code", "c1");
    expect(res.status).toBe(200);
    expect(res.body[0].faqCount).toBe(2);
  });

  it("GET / throws → 500", async () => {
    mockFind.mockRejectedValue(new Error("DB error"));
    const res = await request(app).get("/faq-categories").set("x-company-code", "c1");
    expect(res.status).toBe(500);
  });

  // --- GET /:id ---
  it("GET /:id → 401 if no companyCode", async () => {
    const res = await request(app).get("/faq-categories/123");
    expect(res.status).toBe(401);
  });

  it("GET /:id not found → 404", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindById.mockResolvedValue(null);
    const res = await request(app).get("/faq-categories/" + id).set("x-company-code", "c1");
    expect(res.status).toBe(404);
  });

  it("GET /:id success → 200", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindById.mockResolvedValue({
      _id: id,
      title: "Billing",
      toObject: () => ({ _id: id, title: "Billing" }),
    });
    mockCountDocuments.mockResolvedValue(5);

    const res = await request(app).get("/faq-categories/" + id).set("x-company-code", "c1");
    expect(res.status).toBe(200);
    expect(res.body.faqCount).toBe(5);
  });

  it("GET /:id throws → 500", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindById.mockRejectedValue(new Error("Boom"));
    const res = await request(app).get("/faq-categories/" + id).set("x-company-code", "c1");
    expect(res.status).toBe(500);
  });

  // --- POST / ---
  it("POST / → 401 if no companyCode", async () => {
    const res = await request(app).post("/faq-categories").send({ title: "NewCat" });
    expect(res.status).toBe(401);
  });

  it("POST / success → 201", async () => {
    const res = await request(app)
      .post("/faq-categories")
      .set("x-company-code", "c1")
      .send({ title: "Tech", description: "Tech FAQs" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Tech");
  });

  it("POST / save throws → 400", async () => {
    MockFaqCategory.mockImplementationOnce(function (data) {
      this.save = jest.fn().mockRejectedValue(new Error("Save fail"));
    });
    const res = await request(app)
      .post("/faq-categories")
      .set("x-company-code", "c1")
      .send({ title: "Err" });
    expect(res.status).toBe(400);
  });

  // --- PUT /:id ---
  it("PUT /:id → 401 if no companyCode", async () => {
    const res = await request(app).put("/faq-categories/123").send({ title: "X" });
    expect(res.status).toBe(401);
  });

  it("PUT /:id not found → 404", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app)
      .put("/faq-categories/" + id)
      .set("x-company-code", "c1")
      .send({ title: "Updated" });
    expect(res.status).toBe(404);
  });

  it("PUT /:id success → 200", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndUpdate.mockResolvedValue({ _id: id, title: "Updated" });
    const res = await request(app)
      .put("/faq-categories/" + id)
      .set("x-company-code", "c1")
      .send({ title: "Updated" });
    expect(res.status).toBe(200);
  });

  it("PUT /:id throws → 400", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndUpdate.mockRejectedValue(new Error("Update fail"));
    const res = await request(app)
      .put("/faq-categories/" + id)
      .set("x-company-code", "c1")
      .send({ title: "Updated" });
    expect(res.status).toBe(400);
  });

  // --- DELETE /:id ---
  it("DELETE /:id → 401 if no companyCode", async () => {
    const res = await request(app).delete("/faq-categories/123");
    expect(res.status).toBe(401);
  });

  it("DELETE /:id not found → 404", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockFindByIdAndDelete.mockResolvedValue(null);
    const res = await request(app).delete("/faq-categories/" + id).set("x-company-code", "c1");
    expect(res.status).toBe(404);
  });

  it("DELETE /:id success → 200", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockDeleteMany.mockResolvedValue({ deletedCount: 2 });
    mockFindByIdAndDelete.mockResolvedValue({ _id: id });
    const res = await request(app).delete("/faq-categories/" + id).set("x-company-code", "c1");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/);
  });

  it("DELETE /:id throws → 500", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockDeleteMany.mockRejectedValue(new Error("Del fail"));
    const res = await request(app).delete("/faq-categories/" + id).set("x-company-code", "c1");
    expect(res.status).toBe(500);
  });

  // --- Module check ---
  it("module loads correctly", async () => {
    const mod = await import("../routes/faqCategoryRoutes.js");
    expect(mod.default).toBeDefined();
  });
});
