import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// ---------------- MOCK CONTROLLERS ----------------
const mockControllers = {
  createPaymentOrder: jest.fn((req, res) =>
    res.json({ route: "createPaymentOrder" })
  ),
  verifyPayment: jest.fn((req, res) =>
    res.json({ route: "verifyPayment" })
  ),
  handlePaymentFailure: jest.fn((req, res) =>
    res.json({ route: "handlePaymentFailure" })
  ),
  getPaymentStatus: jest.fn((req, res) =>
    res.json({ route: "getPaymentStatus", companyCode: req.params.companyCode })
  ),
  handleWebhook: jest.fn((req, res) =>
    res.json({ route: "handleWebhook" })
  ),
  getPaymentConfig: jest.fn((req, res) =>
    res.json({ route: "getPaymentConfig" })
  ),
};

// Mock the paymentController
jest.unstable_mockModule("../controllers/paymentController.js", () => mockControllers);

// ---------------- BASE APP SETUP ----------------
let app;
beforeAll(async () => {
  const { default: paymentRoutes } = await import("../routes/paymentRoutes.js");
  app = express();
  app.use(express.json());
  app.use("/payments", paymentRoutes);
});

// ---------------- TESTS ----------------
describe("Payment Routes", () => {
  it("logs request (middleware)", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await request(app).get("/payments/config");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("GET /config calls getPaymentConfig", async () => {
    const res = await request(app).get("/payments/config");
    expect(res.body.route).toBe("getPaymentConfig");
    expect(mockControllers.getPaymentConfig).toHaveBeenCalled();
  });

  it("POST /create-order calls createPaymentOrder", async () => {
    const res = await request(app).post("/payments/create-order");
    expect(res.body.route).toBe("createPaymentOrder");
    expect(mockControllers.createPaymentOrder).toHaveBeenCalled();
  });

  it("POST /verify calls verifyPayment", async () => {
    const res = await request(app).post("/payments/verify");
    expect(res.body.route).toBe("verifyPayment");
    expect(mockControllers.verifyPayment).toHaveBeenCalled();
  });

  it("POST /failure calls handlePaymentFailure", async () => {
    const res = await request(app).post("/payments/failure");
    expect(res.body.route).toBe("handlePaymentFailure");
    expect(mockControllers.handlePaymentFailure).toHaveBeenCalled();
  });

  it("GET /status/:companyCode calls getPaymentStatus", async () => {
    const res = await request(app).get("/payments/status/ABC123");
    expect(res.body.route).toBe("getPaymentStatus");
    expect(res.body.companyCode).toBe("ABC123");
  });

  it("POST /webhook calls handleWebhook", async () => {
    const res = await request(app)
      .post("/payments/webhook")
      .set("Content-Type", "application/json")
      .send({ test: "webhook" });
    expect(res.body.route).toBe("handleWebhook");
    expect(mockControllers.handleWebhook).toHaveBeenCalled();
  });

  it("GET /health returns service running", async () => {
    const res = await request(app).get("/payments/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Payment service is running");
  });
});

// ---------------- DEVELOPMENT-ONLY TESTS ----------------
describe("development-only /test-connection", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // clear module cache so NODE_ENV takes effect
    process.env = { ...OLD_ENV, NODE_ENV: "development" };
  });

  afterEach(() => {
    process.env = OLD_ENV; // restore
  });

  it("should return success when Razorpay returns 400", async () => {
    const mockInstance = {
      razorpayInstance: {
        orders: { fetch: jest.fn().mockRejectedValue({ statusCode: 400 }) },
      },
    };

    jest.unstable_mockModule("../config/payment.js", () => mockInstance);

    const { default: devPaymentRoutes } = await import("../routes/paymentRoutes.js");
    const devApp = express();
    devApp.use("/payments", devPaymentRoutes);

    const res = await request(devApp).get("/payments/test-connection");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Razorpay connection successful");
  });

  it("should return 500 on unexpected Razorpay error", async () => {
    const mockInstance = {
      razorpayInstance: {
        orders: { fetch: jest.fn().mockRejectedValue(new Error("Unexpected failure")) },
      },
    };

    jest.unstable_mockModule("../config/payment.js", () => mockInstance);

    const { default: devPaymentRoutes } = await import("../routes/paymentRoutes.js");
    const devApp = express();
    devApp.use("/payments", devPaymentRoutes);

    const res = await request(devApp).get("/payments/test-connection");
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Razorpay connection failed");
  });

  it("POST /webhook calls handleWebhook with raw body", async () => {
    const payload = JSON.stringify({ event: "payment.captured" });
    const res = await request(app)
      .post("/payments/webhook")
      .set("Content-Type", "application/json")
      .send(payload); // send raw string

    expect(mockControllers.handleWebhook).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
