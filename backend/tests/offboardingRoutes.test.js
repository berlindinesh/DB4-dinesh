// tests/offboardingRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";

// ---------------- Mock controllers ----------------
const mockControllers = {
  getAllOffboardings: jest.fn((req, res) => res.json({ route: "getAllOffboardings" })),
  getOffboardingById: jest.fn((req, res) => res.json({ route: "getOffboardingById", id: req.params.id })),
  createOffboarding: jest.fn((req, res) => res.json({ route: "createOffboarding" })),
  updateOffboarding: jest.fn((req, res) => res.json({ route: "updateOffboarding", id: req.params.id })),
  deleteOffboarding: jest.fn((req, res) => res.json({ route: "deleteOffboarding", id: req.params.id })),
  getOffboardingsByStage: jest.fn((req, res) => res.json({ route: "getOffboardingsByStage", stage: req.params.stage })),
  getOffboardingsByDepartment: jest.fn((req, res) => res.json({ route: "getOffboardingsByDepartment", dept: req.params.department })),
  getOffboardingsByManager: jest.fn((req, res) => res.json({ route: "getOffboardingsByManager", manager: req.params.manager })),
  updateAssetStatus: jest.fn((req, res) => res.json({ route: "updateAssetStatus" })),
  updateClearanceStatus: jest.fn((req, res) => res.json({ route: "updateClearanceStatus" })),
  completeOffboarding: jest.fn((req, res) => res.json({ route: "completeOffboarding", id: req.params.id })),
  getOffboardingStats: jest.fn((req, res) => res.json({ route: "getOffboardingStats" })),
  uploadDocument: jest.fn((req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");
    return res.json({ route: "uploadDocument", file: req.file.filename });
  }),
  downloadDocument: jest.fn((req, res) => res.json({ route: "downloadDocument", filename: req.params.filename })),
  deleteDocument: jest.fn((req, res) => res.json({ route: "deleteDocument", id: req.params.id, index: req.params.documentIndex })),
  getOffboardingsByDateRange: jest.fn((req, res) => res.json({ route: "getOffboardingsByDateRange" })),
  searchOffboardings: jest.fn((req, res) => res.json({ route: "searchOffboardings" })),
};

jest.unstable_mockModule("../controllers/offboardingController.js", () => mockControllers);


jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});

// ---------------- Mock middleware ----------------
jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: jest.fn((req, res, next) => {
    if (req.simulateUnauthorized) return res.status(401).send("Unauthorized");
    req.companyCode = "testCompany";
    next();
  }),
}));

// ---------------- Import router after mocks ----------------
const { default: offboardingRouter } = await import("../routes/offboardingRoutes.js");

// ---------------- Express setup ----------------
const app = express();
app.use(express.json());
app.use("/offboarding", offboardingRouter);

// ---------------- Tests ----------------
describe("offboardingRoutes (100% coverage)", () => {

  it("GET /offboarding → getAllOffboardings", async () => {
    const res = await request(app).get("/offboarding");
    expect(res.body.route).toBe("getAllOffboardings");
  });

  it("GET /offboarding/search → searchOffboardings", async () => {
    const res = await request(app).get("/offboarding/search");
    expect(res.body.route).toBe("searchOffboardings");
  });

  it("GET /offboarding/date-range → getOffboardingsByDateRange", async () => {
    const res = await request(app).get("/offboarding/date-range");
    expect(res.body.route).toBe("getOffboardingsByDateRange");
  });

  it("GET /offboarding/stats → getOffboardingStats", async () => {
    const res = await request(app).get("/offboarding/stats");
    expect(res.body.route).toBe("getOffboardingStats");
  });

  it("GET /offboarding/stage/:stage → getOffboardingsByStage", async () => {
    const res = await request(app).get("/offboarding/stage/testing");
    expect(res.body.route).toBe("getOffboardingsByStage");
  });

  it("GET /offboarding/department/:department → getOffboardingsByDepartment", async () => {
    const res = await request(app).get("/offboarding/department/HR");
    expect(res.body.route).toBe("getOffboardingsByDepartment");
  });

  it("GET /offboarding/manager/:manager → getOffboardingsByManager", async () => {
    const res = await request(app).get("/offboarding/manager/123");
    expect(res.body.route).toBe("getOffboardingsByManager");
  });

  it("GET /offboarding/:id → getOffboardingById", async () => {
    const res = await request(app).get("/offboarding/42");
    expect(res.body.route).toBe("getOffboardingById");
  });

  it("POST /offboarding → createOffboarding", async () => {
    const res = await request(app).post("/offboarding").send({ name: "Test" });
    expect(res.body.route).toBe("createOffboarding");
  });

  it("PUT /offboarding/:id → updateOffboarding", async () => {
    const res = await request(app).put("/offboarding/55").send({ status: "done" });
    expect(res.body.route).toBe("updateOffboarding");
  });

  it("DELETE /offboarding/:id → deleteOffboarding", async () => {
    const res = await request(app).delete("/offboarding/77");
    expect(res.body.route).toBe("deleteOffboarding");
  });

  it("POST /offboarding/asset-status → updateAssetStatus", async () => {
    const res = await request(app).post("/offboarding/asset-status").send({});
    expect(res.body.route).toBe("updateAssetStatus");
  });

  it("POST /offboarding/clearance-status → updateClearanceStatus", async () => {
    const res = await request(app).post("/offboarding/clearance-status").send({});
    expect(res.body.route).toBe("updateClearanceStatus");
  });

  it("POST /offboarding/:id/complete → completeOffboarding", async () => {
    const res = await request(app).post("/offboarding/10/complete");
    expect(res.body.route).toBe("completeOffboarding");
  });

it("POST /offboarding/:id/document → uploadDocument", async () => {
  const res = await request(app)
    .post("/offboarding/99/document")
    .attach("document", Buffer.from("fake file"), "test.pdf");

  expect(res.statusCode).toBe(200);
  expect(res.body.route).toBe("uploadDocument");
  expect(res.body.file).toMatch(/99-\d+-\d+\.pdf/);  // ✅ matches multer's generated filename
});


  it("POST /offboarding/:id/document → missing file returns 400", async () => {
    const res = await request(app)
      .post("/offboarding/100/document"); // no file attached
    expect(res.status).toBe(400);
  });

  it("POST /offboarding/:id/document → invalid file type", async () => {
    const res = await request(app)
      .post("/offboarding/101/document")
      .attach("document", Buffer.from("fake"), "bad.exe"); // invalid
    expect(res.status).toBe(500);
  });

  it("GET /offboarding/documents/download/:filename → downloadDocument", async () => {
    const res = await request(app).get("/offboarding/documents/download/testfile.pdf");
    expect(res.body.route).toBe("downloadDocument");
  });

  it("DELETE /offboarding/:id/document/:documentIndex → deleteDocument", async () => {
    const res = await request(app).delete("/offboarding/12/document/0");
    expect(res.body.route).toBe("deleteDocument");
  });

  it("GET /offboarding → unauthorized without companyCode", async () => {
    const app2 = express();
    app2.use(express.json());
    const { authenticate } = await import("../middleware/companyAuth.js");
    app2.use("/offboarding", (req, res, next) => { req.simulateUnauthorized = true; next(); }, authenticate, offboardingRouter);
    const res = await request(app2).get("/offboarding");
    expect(res.status).toBe(401);
  });
  
});
