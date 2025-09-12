// tests/disciplinaryActionRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// --- Mock controllers ---
const getAllActions = jest.fn((req, res) =>
  res.status(200).json({ route: "getAllActions" })
);
const createAction = jest.fn((req, res) =>
  res.status(201).json({ route: "createAction" })
);
const getAction = jest.fn((req, res) =>
  res.status(200).json({ route: "getAction", id: req.params.id })
);
const updateAction = jest.fn((req, res) =>
  res.status(200).json({ route: "updateAction", id: req.params.id })
);
const deleteAction = jest.fn((req, res) =>
  res.status(200).json({ route: "deleteAction", id: req.params.id })
);
const downloadAttachment = jest.fn((req, res) =>
  res
    .status(200)
    .json({ route: "downloadAttachment", file: req.params.filename })
);

// --- Mock upload.single middleware ---
const upload = {
  single: jest.fn((fieldName) => {
    return (req, res, next) => {
      req.file = { originalname: "mock.txt" }; // simulate uploaded file
      next();
    };
  }),
};

// Replace real controller imports with mocks
await jest.unstable_mockModule(
  "../controllers/disciplinaryActionController.js",
  () => ({
    __esModule: true,
    getAllActions,
    createAction,
    getAction,
    updateAction,
    deleteAction,
    downloadAttachment,
    upload,
  })
);

// Mock auth middleware
await jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  __esModule: true,
  authenticate: (req, res, next) => {
    req.companyCode = "XYZ"; // fake auth
    next();
  },
}));

// Import router AFTER mocks
const { default: disciplinaryRoutes } = await import(
  "../routes/disciplinaryActions.js"
);

// Setup Express app
const app = express();
app.use(express.json());
app.use("/", disciplinaryRoutes);

describe("Disciplinary Action Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET / should call getAllActions", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(getAllActions).toHaveBeenCalled();
  });

  it("GET /:id should call getAction", async () => {
    const res = await request(app).get("/123");
    expect(res.status).toBe(200);
    expect(getAction).toHaveBeenCalled();
    expect(res.body.id).toBe("123");
  });

  it("DELETE /:id should call deleteAction", async () => {
    const res = await request(app).delete("/123");
    expect(res.status).toBe(200);
    expect(deleteAction).toHaveBeenCalled();
    expect(res.body.id).toBe("123");
  });

  it("GET /attachment/:filename should call downloadAttachment", async () => {
    const res = await request(app).get("/attachment/mock.txt");
    expect(res.status).toBe(200);
    expect(downloadAttachment).toHaveBeenCalled();
    expect(res.body.file).toBe("mock.txt");
  });
});