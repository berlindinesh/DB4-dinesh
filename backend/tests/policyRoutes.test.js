//  
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ---------------- MOCKS ----------------

// Mock controller functions
const mockGetAll = jest.fn((req, res) => res.json({ route: "getAll" }));
const mockCreate = jest.fn((req, res) => res.json({ route: "create" }));
const mockUpdate = jest.fn((req, res) => res.json({ route: "update" }));
const mockDelete = jest.fn((req, res) => res.json({ route: "delete" }));

jest.unstable_mockModule("../controllers/policyController.js", () => ({
  policyController: {
    getAllPolicies: mockGetAll,
    createPolicy: mockCreate,
    updatePolicy: mockUpdate,
    deletePolicy: mockDelete,
  },
}));

// Mock authenticate middleware
const mockAuthenticate = jest.fn((req, res, next) => next());

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: mockAuthenticate,
}));

// ---------------- IMPORT ROUTER AFTER MOCKS ----------------
const { default: policyRoutes } = await import("../routes/policyRoutes.js");

const app = express();
app.use(express.json());
app.use("/", policyRoutes);

// ---------------- TESTS ----------------
describe("Policy Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call authenticate middleware for every request", async () => {
    await request(app).get("/policies");
    await request(app).post("/policies").send({ name: "test" });
    await request(app).put("/policies/123").send({ name: "updated" });
    await request(app).delete("/policies/123");

    expect(mockAuthenticate).toHaveBeenCalledTimes(4);
  });

  it("GET /policies should call getAllPolicies", async () => {
    const res = await request(app).get("/policies");
    expect(res.body).toEqual({ route: "getAll" });
    expect(mockGetAll).toHaveBeenCalled();
  });

  it("POST /policies should call createPolicy", async () => {
    const res = await request(app).post("/policies").send({ name: "new" });
    expect(res.body).toEqual({ route: "create" });
    expect(mockCreate).toHaveBeenCalled();
  });

  it("PUT /policies/:id should call updatePolicy", async () => {
  const res = await request(app).put("/policies/123").send({ name: "upd" });

  expect(res.body).toEqual({ route: "update" });

  // ✅ Just check it was called once
  expect(mockUpdate).toHaveBeenCalledTimes(1);

  // ✅ And that it was called with req + res objects
  const [reqArg, resArg] = mockUpdate.mock.calls[0];
  expect(reqArg.params.id).toBe("123");       // route param check
  expect(reqArg.body).toEqual({ name: "upd" }); // request body check
  expect(typeof resArg.json).toBe("function"); // response object
});


  it("DELETE /policies/:id should call deletePolicy", async () => {
    const res = await request(app).delete("/policies/123");
    expect(res.body).toEqual({ route: "delete" });
    expect(mockDelete).toHaveBeenCalled();
  });

  it("should block request if authenticate middleware denies", async () => {
    // Override middleware to block
    mockAuthenticate.mockImplementationOnce((req, res) =>
      res.status(401).json({ error: "Unauthorized" })
    );

    const res = await request(app).get("/policies");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});
