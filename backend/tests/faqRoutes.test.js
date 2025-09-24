// tests/faqRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------
const mockFind = jest.fn();
const mockSave = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();

jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    find: mockFind,
    prototype: { save: mockSave },
    findByIdAndUpdate: mockFindByIdAndUpdate,
    findByIdAndDelete: mockFindByIdAndDelete,
  })),
}));

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  __esModule: true,
  authenticate: (req, res, next) => {
    req.companyCode = req.headers["x-company-code"] || null;
    next();
  },
}));

// ------------------ IMPORT ROUTER ------------------
const faqRouter = (await import("../routes/faqRoutes.js")).default;

const app = express();
app.use(express.json());
app.use("/faqs", faqRouter);

// ------------------ TESTS ------------------
describe("faqRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- GET /category/:categoryId ----------
  it("should return FAQs for a category", async () => {
    mockFind.mockResolvedValue([{ id: "faq1", q: "Q1" }]);
    const res = await request(app)
      .get("/faqs/category/cat1")
      .set("x-company-code", "comp1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "faq1", q: "Q1" }]);
  });

  it("should return 401 if no companyCode on GET", async () => {
    const res = await request(app).get("/faqs/category/cat1");
    expect(res.status).toBe(401);
  });

  it("should handle DB error on GET", async () => {
    mockFind.mockRejectedValue(new Error("DB fail"));
    const res = await request(app)
      .get("/faqs/category/cat1")
      .set("x-company-code", "comp1");
    expect(res.status).toBe(500);
  });

  // ---------- POST /category/:categoryId ----------
  

  it("should return 401 if no companyCode on POST", async () => {
    const res = await request(app)
      .post("/faqs/category/cat1")
      .send({ question: "Q?", answer: "A" });
    expect(res.status).toBe(401);
  });

  it("should handle DB error on POST", async () => {
    mockSave.mockRejectedValue(new Error("Save fail"));
    const res = await request(app)
      .post("/faqs/category/cat1")
      .set("x-company-code", "comp1")
      .send({ question: "Q?", answer: "A" });
    expect(res.status).toBe(500);
  });

  // ---------- PUT /:id ----------
  it("should update an FAQ", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ id: "faq1", updated: true });
    const res = await request(app)
      .put("/faqs/faq1")
      .set("x-company-code", "comp1")
      .send({ answer: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "faq1", updated: true });
  });

  it("should return 401 if no companyCode on PUT", async () => {
    const res = await request(app).put("/faqs/faq1").send({ answer: "U" });
    expect(res.status).toBe(401);
  });

  it("should return 404 if FAQ not found on PUT", async () => {
    mockFindByIdAndUpdate.mockResolvedValue(null);
    const res = await request(app)
      .put("/faqs/faq1")
      .set("x-company-code", "comp1")
      .send({ answer: "U" });
    expect(res.status).toBe(404);
  });

  it("should handle DB error on PUT", async () => {
    mockFindByIdAndUpdate.mockRejectedValue(new Error("Update fail"));
    const res = await request(app)
      .put("/faqs/faq1")
      .set("x-company-code", "comp1")
      .send({ answer: "U" });
    expect(res.status).toBe(500);
  });

  // ---------- DELETE /:id ----------
  it("should delete an FAQ", async () => {
    mockFindByIdAndDelete.mockResolvedValue({ id: "faq1" });
    const res = await request(app)
      .delete("/faqs/faq1")
      .set("x-company-code", "comp1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "FAQ deleted" });
  });

  it("should return 401 if no companyCode on DELETE", async () => {
    const res = await request(app).delete("/faqs/faq1");
    expect(res.status).toBe(401);
  });

  it("should return 404 if FAQ not found on DELETE", async () => {
    mockFindByIdAndDelete.mockResolvedValue(null);
    const res = await request(app)
      .delete("/faqs/faq1")
      .set("x-company-code", "comp1");
    expect(res.status).toBe(404);
  });

  it("should handle DB error on DELETE", async () => {
    mockFindByIdAndDelete.mockRejectedValue(new Error("Delete fail"));
    const res = await request(app)
      .delete("/faqs/faq1")
      .set("x-company-code", "comp1");
    expect(res.status).toBe(500);
  });
});
