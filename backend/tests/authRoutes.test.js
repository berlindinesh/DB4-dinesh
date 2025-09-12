import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ------------------ MOCKS ------------------

// Mock authController
jest.unstable_mockModule("../controllers/authController.js", () => ({
  registerAuth: jest.fn((req, res) => res.json({ route: "register" })),
  verifyOtp: jest.fn((req, res) => res.json({ route: "verify-otp" })),
  loginAuth: jest.fn((req, res) => res.json({ route: "login" })),
  forgotPassword: jest.fn((req, res) => res.json({ route: "forgot-password" })),
  resetPassword: jest.fn((req, res) => res.json({ route: "reset-password" })),
  getUserId: jest.fn((req, res) => res.json({ route: "get-user-id" })),
}));

// Mock companyAuth
const authMiddleware = {
  authenticate: jest.fn((req, res, next) => {
    req.companyCode = "testCompany";
    next();
  }),
};
jest.unstable_mockModule("../middleware/companyAuth.js", () => authMiddleware);

// Mock Users
let mockUsers = [
  {
    userId: "u1",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "admin",
    permissions: [],
  },
];

// Mock User model with .select() chain support
jest.unstable_mockModule("../models/User.js", () => ({
  getUserModel: jest.fn(async () => ({
    findOne: jest.fn(({ userId, email }) => {
      let user = null;
      if (userId) user = mockUsers.find((u) => u.userId === userId) || null;
      if (email) user = mockUsers.find((u) => u.email === email.toLowerCase()) || null;

      return {
        select: jest.fn().mockResolvedValue(user),
      };
    }),
    find: jest.fn(() => ({
      select: jest.fn().mockResolvedValue(mockUsers),
    })),
  })),
}));

// Mock genericModelFactory + employee model
let mockEmployee = {
  Emp_ID: "emp123",
  userId: "u1",
  personalInfo: {
    email: "john@example.com",
    workemail: "john@work.com",
    firstName: "John",
    lastName: "Doe",
  },
};
jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  default: jest.fn(async () => ({
    findOne: jest.fn(({ Emp_ID }) =>
      Emp_ID === mockEmployee.Emp_ID ? mockEmployee : null
    ),
  })),
}));
jest.unstable_mockModule("../models/employeeRegisterModel.js", () => ({
  default: { schema: {} },
}));

// ------------------ APP SETUP ------------------
const expressModule = await import("express");
const authRouterModule = await import("../routes/authRouter.js");
const app = expressModule.default();
app.use(expressModule.default.json());
app.use("/auth", authRouterModule.default);

// ------------------ TESTS ------------------
describe("Auth Routes 100% coverage", () => {
  // Simple routes
  test("POST /auth/register", async () => {
    const res = await request(app).post("/auth/register").send({});
    expect(res.body.route).toBe("register");
  });
  test("POST /auth/verify-otp", async () => {
    const res = await request(app).post("/auth/verify-otp").send({});
    expect(res.body.route).toBe("verify-otp");
  });
  test("POST /auth/login", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect(res.body.route).toBe("login");
  });
  test("POST /auth/forgot-password", async () => {
    const res = await request(app).post("/auth/forgot-password").send({});
    expect(res.body.route).toBe("forgot-password");
  });
  test("POST /auth/reset-password/:token", async () => {
    const res = await request(app)
      .post("/auth/reset-password/123")
      .send({});
    expect(res.body.route).toBe("reset-password");
  });
  test("POST /auth/get-user-id", async () => {
    const res = await request(app).post("/auth/get-user-id").send({});
    expect(res.body.route).toBe("get-user-id");
  });

  // GET user by ID
  
  test("GET /auth/user/:userId - not found", async () => {
    const res = await request(app).get("/auth/user/notfound");
    expect(res.body.success).toBe(false);
  });
  test("GET /auth/user/:userId - error", async () => {
    const oldUsers = mockUsers;
    mockUsers = null; // force error
    const res = await request(app).get("/auth/user/u1");
    expect(res.body.success).toBe(false);
    mockUsers = oldUsers;
  });

  // GET user role by ID
  test("GET /auth/user-role-by-id/:userId - success", async () => {
    const res = await request(app).get("/auth/user-role-by-id/u1");
    expect(res.body.success).toBe(true);
  });
  test("GET /auth/user-role-by-id/:userId - not found", async () => {
    const res = await request(app).get("/auth/user-role-by-id/notfound");
    expect(res.body.success).toBe(false);
  });
  test("GET /auth/user-role-by-id/:userId - no companyCode", async () => {
    authMiddleware.authenticate.mockImplementationOnce((req, res, next) => next());
    const res = await request(app).get("/auth/user-role-by-id/u1");
    expect(res.body.success).toBe(false);
  });

  // Debug employee
  test("GET /auth/debug-user-employee/:empId - success", async () => {
    const res = await request(app).get("/auth/debug-user-employee/emp123");
    expect(res.body.success).toBe(true);
  });
  test("GET /auth/debug-user-employee/:empId - not found", async () => {
    const res = await request(app).get("/auth/debug-user-employee/xyz");
    expect(res.body.success).toBe(false);
  });
  test("GET /auth/debug-user-employee/:empId - error", async () => {
    const oldEmployee = mockEmployee;
    mockEmployee = null;
    const res = await request(app).get("/auth/debug-user-employee/emp123");
    expect(res.body.success).toBe(false);
    mockEmployee = oldEmployee;
  });

  // GET user role by email
  test("GET /auth/user-role/:email - success", async () => {
    const res = await request(app).get("/auth/user-role/john@example.com");
    expect(res.body.success).toBe(true);
  });
  test("GET /auth/user-role/:email - not found", async () => {
    const res = await request(app).get("/auth/user-role/nobody@example.com");
    expect(res.body.success).toBe(false);
  });
  test("GET /auth/user-role/:email - no companyCode", async () => {
    authMiddleware.authenticate.mockImplementationOnce((req, res, next) => next());
    const res = await request(app).get("/auth/user-role/john@example.com");
    expect(res.body.success).toBe(false);
  });
  test("GET /auth/user-role/:email - error", async () => {
    const oldUsers = mockUsers;
    mockUsers = null; // force error
    const res = await request(app).get("/auth/user-role/john@example.com");
    expect(res.body.success).toBe(false);
    mockUsers = oldUsers;
  });
test("GET /auth/ root route - not found", async () => {
  const res = await request(app).get("/auth");
  expect(res.status).toBe(404);
});
test("GET /auth/user/:userId - null user object", async () => {
  mockUsers = []; // empty users
  const res = await request(app).get("/auth/user/u1");
  expect(res.body.success).toBe(false);
  mockUsers = [
    { userId: "u1", email: "john@example.com", firstName: "John", lastName: "Doe", role: "admin", permissions: [] }
  ]; // restore
});
test("GET /auth/user-role-by-id/:userId - throws error", async () => {
  const old = mockUsers;
  mockUsers = null; // will cause throw
  const res = await request(app).get("/auth/user-role-by-id/u1");
  expect(res.status).toBe(500); // or .success === false if handled
  mockUsers = old;
});
// ------------------ EXTRA TESTS for 100% ------------------
describe("Auth Routes extra branches", () => {
  test("GET /auth/unknown should return 404", async () => {
    const res = await request(app).get("/auth/unknown");
    expect(res.status).toBe(404);
  });

  test("POST /auth/reset-password/:token without body still works", async () => {
    const res = await request(app).post("/auth/reset-password/xyz");
    expect(res.body.route).toBe("reset-password");
  });

  test("GET /auth/user-role-by-id/:userId when user object exists but missing fields", async () => {
    const oldUsers = mockUsers;
    mockUsers = [{ userId: "u2" }]; // missing email/role/etc.
    const res = await request(app).get("/auth/user-role-by-id/u2");
    expect(res.body.success).toBe(true);
    mockUsers = oldUsers;
  });
});
test("authRouter module loads without crashing", async () => {
  const routerModule = await import("../routes/authRouter.js");
  expect(routerModule).toBeDefined();
  expect(routerModule.default).toBeDefined();
});

it("GET /auth/user-role-by-id/:userId → returns 404 when no companyCode", async () => {
  jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
    authenticate: (req, res, next) => next(),
  }));

  const { default: freshRouter } = await import("../routes/authRouter.js");
  const tempApp = express();
  tempApp.use(express.json());
  tempApp.use("/auth", freshRouter);

  const res = await request(tempApp).get("/auth/user-role-by-id/123");
  expect(res.status).toBe(404);
  expect(res.body.message).toBe("User not found");
});


});
