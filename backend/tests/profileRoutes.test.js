// tests/profileRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ----------- MOCKS ----------- //
const mockGetUserProfile = jest.fn((req, res) =>
  res.json({ route: "getUserProfile", id: req.params.Id })
);

const mockUpdateUserProfile = jest.fn((req, res) =>
  res.json({ route: "updateUserProfile", id: req.params.Id, body: req.body })
);

const mockGetAllProfiles = jest.fn((req, res) =>
  res.json({ route: "getAllProfiles" })
);

jest.unstable_mockModule("../controllers/profileController.js", () => ({
  getUserProfile: mockGetUserProfile,
  updateUserProfile: mockUpdateUserProfile,
  getAllProfiles: mockGetAllProfiles,
}));

// Import router AFTER mocks
const { default: profileRoutes } = await import("../routes/profileRouter.js");

const app = express();
app.use(express.json());
app.use("/", profileRoutes);

// ----------- TESTS ----------- //
describe("Profile Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /profile/:Id should call getUserProfile", async () => {
    const res = await request(app).get("/profile/123");
    expect(res.body).toEqual({ route: "getUserProfile", id: "123" });

    expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
    const [reqArg, resArg] = mockGetUserProfile.mock.calls[0];
    expect(reqArg.params.Id).toBe("123");
    expect(typeof resArg.json).toBe("function");
  });

  it("GET /all should call getAllProfiles", async () => {
    const res = await request(app).get("/all");
    expect(res.body).toEqual({ route: "getAllProfiles" });

    expect(mockGetAllProfiles).toHaveBeenCalledTimes(1);
  });

  it("PUT /profile/:Id should call updateUserProfile", async () => {
    const payload = { name: "New User" };
    const res = await request(app).put("/profile/456").send(payload);

    expect(res.body).toEqual({
      route: "updateUserProfile",
      id: "456",
      body: payload,
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledTimes(1);
    const [reqArg, resArg] = mockUpdateUserProfile.mock.calls[0];
    expect(reqArg.params.Id).toBe("456");
    expect(reqArg.body).toEqual(payload);
    expect(typeof resArg.json).toBe("function");
  });
});
