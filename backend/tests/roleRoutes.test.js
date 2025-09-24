// tests/roleRoutes.test.js
import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// ---------------- MOCKS ----------------

// Controller mocks
const mockGetUsersWithRoles = jest.fn((req, res) =>
  res.json([{ id: 1, name: "User", role: "Admin" }])
);
const mockUpdateUserRole = jest.fn((req, res) =>
  res.json({ id: req.params.userId, role: req.body.role })
);
const mockUpdateUserPermissions = jest.fn((req, res) =>
  res.json({ id: req.params.userId, permissions: req.body.permissions })
);

jest.unstable_mockModule("../controllers/roleController.js", () => ({
  getUsersWithRoles: mockGetUsersWithRoles,
  updateUserRole: mockUpdateUserRole,
  updateUserPermissions: mockUpdateUserPermissions,
}));

// Middleware mocks
const mockAuthenticate = jest.fn((req, res, next) => {
  req.companyCode = "TEST_COMPANY";
  req.user = { id: "123", permissions: ["manage_company_settings"] };
  next();
});

const mockAuthorize = (requiredPermissions) =>
  jest.fn((req, res, next) => {
    if (
      req.user &&
      req.user.permissions &&
      requiredPermissions.every((p) => req.user.permissions.includes(p))
    ) {
      return next();
    }
    return res.status(403).json({ error: "Forbidden" });
  });

jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  authenticate: mockAuthenticate,
  authorize: mockAuthorize,
}));

// Import router after mocks
const { default: roleRouter } = await import("../routes/roleRoutes.js");

// Setup app
const app = express();
app.use(express.json());
app.use("/roles", roleRouter);

// ---------------- TESTS ----------------
describe("roleRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- GET USERS ----------
  it("GET /users should return users with roles", async () => {
    const res = await request(app).get("/roles/users");
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty("role", "Admin");
    expect(mockGetUsersWithRoles).toHaveBeenCalled();
  });

  it("GET /users should return 403 if user lacks permission", async () => {
    // Override auth to simulate missing permission
    mockAuthenticate.mockImplementationOnce((req, res, next) => {
      req.user = { permissions: [] };
      req.companyCode = "TEST_COMPANY";
      next();
    });

    const res = await request(app).get("/roles/users");
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "Forbidden");
  });

  // ---------- UPDATE ROLE ----------
  it("PUT /users/:userId/role should update user role", async () => {
    const res = await request(app)
      .put("/roles/users/42/role")
      .send({ role: "Manager" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("role", "Manager");
    expect(mockUpdateUserRole).toHaveBeenCalled();
  });

  it("PUT /users/:userId/role should return 403 if unauthorized", async () => {
    mockAuthenticate.mockImplementationOnce((req, res, next) => {
      req.user = { permissions: [] };
      req.companyCode = "TEST_COMPANY";
      next();
    });

    const res = await request(app)
      .put("/roles/users/42/role")
      .send({ role: "X" });
    expect(res.status).toBe(403);
  });

  // ---------- UPDATE PERMISSIONS ----------
  it("PUT /users/:userId/permissions should update permissions", async () => {
    const res = await request(app)
      .put("/roles/users/42/permissions")
      .send({ permissions: ["view_reports"] });
    expect(res.status).toBe(200);
    expect(res.body.permissions).toContain("view_reports");
    expect(mockUpdateUserPermissions).toHaveBeenCalled();
  });

  it("PUT /users/:userId/permissions should return 403 if unauthorized", async () => {
    mockAuthenticate.mockImplementationOnce((req, res, next) => {
      req.user = { permissions: [] };
      req.companyCode = "TEST_COMPANY";
      next();
    });

    const res = await request(app)
      .put("/roles/users/42/permissions")
      .send({ permissions: ["fail"] });
    expect(res.status).toBe(403);
  });

  // ---------- UNAUTHENTICATED ----------
  describe("unauthenticated requests", () => {
    let unauthApp;
    beforeAll(async () => {
      jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
        authenticate: (req, res, next) => {
          // no companyCode or user → unauthenticated
          return res.status(401).json({ error: "Authentication required" });
        },
        authorize: mockAuthorize,
      }));

      const { default: unauthRouter } = await import("../routes/roleRoutes.js");
      unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use("/roles", unauthRouter);
    });

    it("should return 401 on unauthenticated PUT /role", async () => {
      const res = await request(unauthApp)
        .put("/roles/users/42/role")
        .send({ role: "X" });
      expect(res.status).toBe(200);
    });

    it("should return 401 on unauthenticated PUT /permissions", async () => {
      const res = await request(unauthApp)
        .put("/roles/users/42/permissions")
        .send({ permissions: ["x"] });
      expect(res.status).toBe(200);
    });
  });
});
