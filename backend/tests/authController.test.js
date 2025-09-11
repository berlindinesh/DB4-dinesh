import { jest } from "@jest/globals";
import User from "../models/User.js";
import * as authController from "../controllers/authController.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as mailer from "../utils/mailer.js";

// --- Mock dependencies --- //
jest.mock("../models/User.js");

jest.mock("bcryptjs", () => ({
  genSalt: jest.fn(() => Promise.resolve("salt")),
  hash: jest.fn(() => Promise.resolve("hashedPassword")),
  compare: jest.fn(), // Will mock in each test
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "token123"),
}));

jest.mock("../utils/mailer.js", () => ({
  sendOtpEmail: jest.fn(() => Promise.resolve()),
}));

jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, user: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    User.findOne = jest.fn();
    User.countDocuments = jest.fn();
    User.safeSave = jest.fn();
    User.findById = jest.fn();
  });

  // --- registerAuth --- //
  describe("registerAuth", () => {
    it("should return 400 if name is missing", async () => {
      req.body = { email: "test@example.com" };
      await authController.registerAuth(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 409 if email already exists", async () => {
      req.body = { name: "John", email: "john@example.com", password: "123" };
      User.findOne.mockResolvedValue({ email: "john@example.com" });
      await authController.registerAuth(req, res);
      expect(res.status).toHaveBeenCalledWith(409); // Matches controller
    });

    it("should register a user successfully", async () => {
      req.body = {
        name: "John Doe",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "123456",
      };
      User.findOne.mockResolvedValue(null);
      User.countDocuments.mockResolvedValue(0);
      User.safeSave.mockResolvedValue({ userId: "JD-EXAMPLE-0001" });

      await authController.registerAuth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "JD-EXAMPLE-0001" })
      );
    });

    it("should handle save error", async () => {
      req.body = { name: "John Doe", email: "john@example.com", password: "123456" };
      User.findOne.mockResolvedValue(null);
      User.countDocuments.mockResolvedValue(0);
      User.safeSave.mockRejectedValue(new Error("DB error"));

      await authController.registerAuth(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- loginAuth --- //
  describe("loginAuth", () => {
    it("should return 400 for invalid credentials", async () => {
      req.body = { email: "test@example.com", password: "123" };
      User.findOne.mockResolvedValue(null);
      await authController.loginAuth(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should handle unverified user", async () => {
      req.body = { email: "test@example.com", password: "123" };
      const mockUser = { isVerified: false, save: jest.fn(), email: "test@example.com" };
      User.findOne.mockResolvedValue(mockUser);
      await authController.loginAuth(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockUser.save).toHaveBeenCalled();
    });

    
    
  });

  // --- forgotPassword --- //
  describe("forgotPassword", () => {
    it("should return 404 if user not found", async () => {
      req.body = { email: "notfound@example.com" };
      User.findOne.mockResolvedValue(null);
      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle errors", async () => {
      req.body = { email: "error@example.com" };
      User.findOne.mockRejectedValue(new Error("DB error"));
      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- resetPassword --- //
  describe("resetPassword", () => {
    it("should return 400 for invalid token", async () => {
      req.params = { token: "token123" };
      req.body = { password: "newpass" };
      User.findOne.mockResolvedValue(null);
      await authController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    

     it("should handle errors", async () => {
      User.findOne.mockRejectedValue(new Error("DB error"));
      await authController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- verifyOtp --- //
  describe("verifyOtp", () => {
    it("should return 400 if OTP invalid", async () => {
      req.body = { email: "john@example.com", otp: "123456" };
      User.findOne.mockResolvedValue({ otp: "654321", otpExpires: Date.now() + 1000 });
      await authController.verifyOtp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if OTP expired", async () => {
      req.body = { email: "john@example.com", otp: "123456" };
      User.findOne.mockResolvedValue({ otp: "123456", otpExpires: Date.now() - 1000 });
      await authController.verifyOtp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should verify OTP successfully", async () => {
      req.body = { email: "john@example.com", otp: "123456" };
      const mockUser = { otp: "123456", otpExpires: Date.now() + 1000, save: jest.fn() };
      User.findOne.mockResolvedValue(mockUser);

      await authController.verifyOtp(req, res);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it("should handle errors", async () => {
      User.findOne.mockRejectedValue(new Error("DB error"));
      await authController.verifyOtp(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- resendOtp --- //
  describe("resendOtp", () => {
    it("should resend OTP", async () => {
      req.body = { email: "john@example.com" };
      const mockUser = { save: jest.fn() };
      User.findOne.mockResolvedValue(mockUser);

      await authController.resendOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "OTP resent successfully" })
      );
    });
    it("should return 400 if user not found", async () => {
      req.body = { email: "unknown@example.com" };
      User.findOne.mockResolvedValue(null);
      await authController.resendOtp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
     it("should handle errors", async () => {
      User.findOne.mockRejectedValue(new Error("DB error"));
      await authController.resendOtp(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- getCurrentUser --- //
  describe("getCurrentUser", () => {
    it("should get current user", async () => {
      req.user = { id: "id123" };
      const mockUser = { _id: "id123", name: "John Doe" };

      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue(Promise.resolve(mockUser)),
      });

      await authController.getCurrentUser(req, res);

      expect(User.findById).toHaveBeenCalledWith("id123");
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it("should return 404 if user not found", async () => {
      req.user.id = "id123";
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await authController.getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    
  });

  // --- getUserId --- //
  describe("getUserId", () => {
    it("should return 404 if user not found", async () => {
      req.body = { email: "notfound@example.com" };
      User.findOne.mockResolvedValue(null);
      await authController.getUserId(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 400 if email missing", async () => {
      req.body = {};
      await authController.getUserId(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
   it("should return userId successfully", async () => {
      req.body = { email: "found@example.com" };
      User.findOne.mockResolvedValue({ userId: "UID123" });
      await authController.getUserId(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ userId: "UID123" }));
    });
    it("should handle errors", async () => {
      User.findOne.mockRejectedValue(new Error("DB error"));
      await authController.getUserId(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
