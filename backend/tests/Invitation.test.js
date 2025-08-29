// tests/Invitation.test.js
import { jest } from "@jest/globals";

// ------------------ SUPPRESS console logs ------------------
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

// ------------------ MOCK bcryptjs ------------------
jest.unstable_mockModule("bcryptjs", () => ({
  __esModule: true,
  hash: jest.fn(() => "hashed_password"),
  compare: jest.fn(() => true),
}));

// ------------------ MOCK jsonwebtoken ------------------
jest.unstable_mockModule("jsonwebtoken", () => ({
  __esModule: true,
  verify: jest.fn(),
}));

// ------------------ MOCK nodemailer ------------------
const sendMailMock = jest.fn().mockResolvedValue(true);
jest.unstable_mockModule("nodemailer", () => ({
  __esModule: true,
  createTransport: () => ({ sendMail: sendMailMock }),
}));

// ------------------ MOCK crypto ------------------
jest.unstable_mockModule("crypto", () => ({
  __esModule: true,
  randomBytes: jest.fn(() => ({ toString: () => "mockToken" })),
}));

// ------------------ MOCK Invitation model ------------------
const mockInvitationModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
};
jest.unstable_mockModule("../models/Invitation.js", () => ({
  __esModule: true,
  default: mockInvitationModel,
}));

// ------------------ MOCK getUserModel ------------------
const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  assignPermissions: jest.fn(),
};
jest.unstable_mockModule("../models/User.js", () => ({
  __esModule: true,
  getUserModel: jest.fn(() => mockUserModel),
}));

// ------------------ IMPORT controller AFTER mocks ------------------
const {
  validateInvitationToken,
  sendInvitationEmail,
  createInvitation,
  getInvitations,
  resendInvitation,
  cancelInvitation,
  markInvitationAccepted,
} = await import("../controllers/invitationController.js");

// ------------------ TESTS ------------------
describe("Invitation Controller", () => {
  let req, res;
  let jwt;

  beforeAll(async () => {
    jwt = await import("jsonwebtoken"); // Correct ESM import
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, query: {}, user: { id: "admin1" }, companyCode: "COMP1" };
    res = mockRes();
  });

  // ---------------- validateInvitationToken ----------------
  describe("validateInvitationToken", () => {
    it("returns 400 if no token", async () => {
      req.query = {};
      await validateInvitationToken(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 401 if token expired", async () => {
      jwt.verify.mockImplementation(() => { throw { name: "TokenExpiredError" }; });
      req.query = { token: "abc" };
      await validateInvitationToken(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 400 if invalid token", async () => {
      jwt.verify.mockImplementation(() => { throw { name: "JsonWebTokenError" }; });
      req.query = { token: "abc" };
      await validateInvitationToken(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 404 if invitation not found", async () => {
      jwt.verify.mockReturnValue({ email: "test@test.com", companyCode: "COMP123" });
      mockInvitationModel.findOne.mockResolvedValue(null);
      req.query = { token: "abc" };
      await validateInvitationToken(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 410 if invitation expired", async () => {
      jwt.verify.mockReturnValue({ email: "test@test.com", companyCode: "COMP123" });
      mockInvitationModel.findOne.mockResolvedValue({ expiresAt: new Date(Date.now() - 1000), email: "test@test.com", status: "pending" });
      req.query = { token: "abc" };
      await validateInvitationToken(req, res);
      expect(res.status).toHaveBeenCalledWith(410);
    });

    it("returns 200 if valid", async () => {
      jwt.verify.mockReturnValue({ email: "test@test.com", companyCode: "COMP123" });
      mockInvitationModel.findOne.mockResolvedValue({
        email: "test@test.com",
        firstName: "John",
        lastName: "Doe",
        role: "user",
        companyCode: "COMP123",
        expiresAt: new Date(Date.now() + 1000),
        status: "pending",
      });
      req.query = { token: "abc" };
      await validateInvitationToken(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------------- sendInvitationEmail ----------------
  describe("sendInvitationEmail", () => {
    it("calls nodemailer", async () => {
      await sendInvitationEmail({ email: "test@test.com", firstName: "John", lastName: "Doe", role: "user", companyCode: "COMP1" }, "password123");
      expect(sendMailMock).toHaveBeenCalled();
    });
  });

  // ---------------- createInvitation ----------------
  describe("createInvitation", () => {
    it("fails if required fields missing", async () => {
      req.body = { firstName: "John" }; // missing lastName, email, role
      await createInvitation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("sends invitation successfully", async () => {
      req.body = { firstName: "John", lastName: "Doe", email: "test@test.com", role: "user" };
      mockUserModel.findOne.mockResolvedValue(null);
      mockInvitationModel.findOne.mockResolvedValue(null);
      mockInvitationModel.save.mockResolvedValue({ _id: "inv1" });
      mockUserModel.save.mockResolvedValue({ _id: "u1", email: "test@test.com", firstName: "John", lastName: "Doe", role: "user", companyCode: "COMP1", assignPermissions: jest.fn() });

      await createInvitation(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ---------------- getInvitations ----------------
  describe("getInvitations", () => {
    it("returns invitations", async () => {
      mockInvitationModel.find.mockResolvedValue([{ email: "test@test.com" }]);
      await getInvitations(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------------- resendInvitation ----------------
  describe("resendInvitation", () => {
    it("returns 404 if invitation not found", async () => {
      mockInvitationModel.findOne.mockResolvedValue(null);
      await resendInvitation(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- cancelInvitation ----------------
  describe("cancelInvitation", () => {
    it("returns 404 if invitation not found", async () => {
      mockInvitationModel.findOne.mockResolvedValue(null);
      await cancelInvitation(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- markInvitationAccepted ----------------
  describe("markInvitationAccepted", () => {
    it("handles invitation marking", async () => {
      mockUserModel.findById.mockResolvedValue({ invitationId: "inv1" });
      mockInvitationModel.findById.mockResolvedValue({ status: "pending", save: jest.fn() });
      await markInvitationAccepted("u1", "COMP1");
    });
  });
});

// ------------------ MOCK RESPONSE ------------------
function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}
