// tests/userRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------
jest.unstable_mockModule("../controllers/userController.js", () => ({
  getUsers: jest.fn((req, res) => res.json({ route: "getUsers" })),
  getUser: jest.fn((req, res) => res.json({ route: "getUser", id: req.params.userId })),
  updateUserRole: jest.fn((req, res) =>
    res.json({ route: "updateUserRole", id: req.params.userId, body: req.body })
  ),
  updateUserStatus: jest.fn((req, res) =>
    res.json({ route: "updateUserStatus", id: req.params.userId, body: req.body })
  ),
  updateUserProfile: jest.fn((req, res) =>
    res.json({ route: "updateUserProfile", id: req.params.userId, body: req.body })
  ),
  deleteUser: jest.fn((req, res) => res.json({ route: "deleteUser", id: req.params.userId })),
  resetUserPassword: jest.fn((req, res) =>
    res.json({ route: "resetUserPassword", id: req.params.userId })
  ),
}));

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: "mockUser" };
    next();
  },
  authorize: (roles) => (req, res, next) => next(),
}));

// ------------------ IMPORT ROUTER AFTER MOCKS ------------------
const routerModule = await import("../routes/userRoutes.js");
const router = routerModule.default;
const controllers = await import("../controllers/userController.js");

// ------------------ APP SETUP ------------------
const app = express();
app.use(express.json());
app.use("/api/users", router);

// ------------------ TEST SUITE ------------------
describe("User Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("GET / → getUsers", async () => {
    const res = await request(app).get("/api/users/");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("getUsers");
    expect(controllers.getUsers).toHaveBeenCalled();
  });

  test("GET /:userId → getUser", async () => {
    const res = await request(app).get("/api/users/123");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "getUser", id: "123" });
    expect(controllers.getUser).toHaveBeenCalled();
  });

  test("PUT /:userId/role → updateUserRole", async () => {
    const res = await request(app).put("/api/users/123/role").send({ role: "admin" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "updateUserRole", id: "123", body: { role: "admin" } });
    expect(controllers.updateUserRole).toHaveBeenCalled();
  });

  test("PUT /:userId/status → updateUserStatus", async () => {
    const res = await request(app).put("/api/users/123/status").send({ status: "active" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "updateUserStatus", id: "123", body: { status: "active" } });
    expect(controllers.updateUserStatus).toHaveBeenCalled();
  });

  test("PUT /:userId/profile → updateUserProfile", async () => {
    const res = await request(app).put("/api/users/123/profile").send({ name: "John" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "updateUserProfile", id: "123", body: { name: "John" } });
    expect(controllers.updateUserProfile).toHaveBeenCalled();
  });

  test("DELETE /:userId → deleteUser", async () => {
    const res = await request(app).delete("/api/users/123");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "deleteUser", id: "123" });
    expect(controllers.deleteUser).toHaveBeenCalled();
  });

  test("POST /:userId/reset-password → resetUserPassword", async () => {
    const res = await request(app).post("/api/users/123/reset-password");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ route: "resetUserPassword", id: "123" });
    expect(controllers.resetUserPassword).toHaveBeenCalled();
  });
});
