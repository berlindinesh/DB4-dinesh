// tests/s3Routes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------
jest.unstable_mockModule("../services/s3Service.js", () => ({
  default: {
    testConnection: jest.fn(),
    deleteFile: jest.fn(),
    getSignedUrl: jest.fn(),
    migrateLocalFileToS3: jest.fn(),
  },
}));

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => next(),
  companyFilter: (req, res, next) => next(),
}));

// Fake multer upload middleware
const mockUpload = {
  single: () => (req, res, next) => {
    req.file = req._mockFile || null;
    next();
  },
};
jest.unstable_mockModule("../config/s3Config.js", () => ({
  upload: mockUpload,
  useS3: true,
}));

// ------------------ IMPORT ROUTER AFTER MOCKS ------------------
const routerModule = await import("../routes/s3Routes.js");
const router = routerModule.default;
const s3Service = (await import("../services/s3Service.js")).default;

// ------------------ APP SETUP ------------------
const app = express();
app.use(express.json());

// test helper middleware → injects mock file if header present
app.use((req, res, next) => {
  if (req.headers["x-mock-file"]) {
    req._mockFile = {
      location: "http://s3/file.png",
      key: "file.png",
      originalname: "file.png",
      size: 123,
      mimetype: "image/png",
    };
  }
  next();
});

app.use("/s3", router);

// ------------------ TEST SUITE ------------------
describe("S3 Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------- GET /test ----------
  test("GET /test → success", async () => {
    s3Service.testConnection.mockResolvedValue({ ok: true });

    const res = await request(app).get("/s3/test");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, useS3: true });
  });

  test("GET /test → failure", async () => {
    s3Service.testConnection.mockRejectedValue(new Error("boom"));

    const res = await request(app).get("/s3/test");
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ message: "S3 test failed", error: "boom" });
  });

  // ---------- POST /upload ----------
  test("POST /upload → success", async () => {
    const res = await request(app).post("/s3/upload").set("x-mock-file", "1");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "File uploaded successfully",
      file: expect.objectContaining({ url: "http://s3/file.png" }),
      storage: "S3",
    });
  });

  test("POST /upload → exception", async () => {
  const originalSingle = mockUpload.single;
  mockUpload.single = () => (req, res, next) => {
    throw new Error("Upload crash");
  };

  const res = await request(app).post("/s3/upload");
  expect(res.status).toBe(400);
  expect(res.body).toEqual({ message: "No file uploaded" });

  mockUpload.single = originalSingle;
});
  test("POST /upload → no file", async () => {
    const res = await request(app).post("/s3/upload");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "No file uploaded" });
  });

  // ---------- DELETE /delete/:fileKey ----------
  test("DELETE /delete/:fileKey → success", async () => {
    s3Service.deleteFile.mockResolvedValue({ deleted: true });

    const res = await request(app).delete("/s3/delete/myFile.png");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "File deleted successfully" });
  });

  test("DELETE /delete/:fileKey → failure", async () => {
    s3Service.deleteFile.mockRejectedValue(new Error("bad delete"));

    const res = await request(app).delete("/s3/delete/myFile.png");
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      message: "File deletion failed",
      error: "bad delete",
    });
  });

  // ---------- GET /signed-url/:fileKey ----------
  test("GET /signed-url/:fileKey → success", async () => {
    s3Service.getSignedUrl.mockResolvedValue("http://signed-url");

    const res = await request(app).get("/s3/signed-url/myFile.png?expiresIn=100");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Signed URL generated",
      url: "http://signed-url",
      expiresIn: 100,
    });
  });

  test("GET /signed-url/:fileKey → failure", async () => {
    s3Service.getSignedUrl.mockRejectedValue(new Error("bad signed"));

    const res = await request(app).get("/s3/signed-url/myFile.png");
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      message: "Failed to generate signed URL",
      error: "bad signed",
    });
  });

  // ---------- POST /migrate ----------
  test("POST /migrate → success", async () => {
    s3Service.migrateLocalFileToS3.mockResolvedValue({ migrated: true });

    const res = await request(app)
      .post("/s3/migrate")
      .send({ localPath: "a.txt", s3Key: "b.txt" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "File migrated successfully",
      migrated: true,
    });
  });

  test("POST /migrate → missing params", async () => {
    const res = await request(app).post("/s3/migrate").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "Both localPath and s3Key are required",
    });
  });

  test("POST /migrate → failure", async () => {
    s3Service.migrateLocalFileToS3.mockRejectedValue(new Error("bad migrate"));

    const res = await request(app)
      .post("/s3/migrate")
      .send({ localPath: "a.txt", s3Key: "b.txt" });

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      message: "File migration failed",
      error: "bad migrate",
    });
  });
  test("POST /upload → file is null (explicit branch)", async () => {
  // Force the upload middleware to set req.file = null
  const originalSingle = mockUpload.single;
  mockUpload.single = () => (req, res, next) => {
    req.file = null;
    next();
  };

  const res = await request(app).post("/s3/upload");

  expect(res.status).toBe(400);
  expect(res.body).toEqual({ message: "No file uploaded" });

  mockUpload.single = originalSingle;
});

});
