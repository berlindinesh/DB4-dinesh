import { jest } from "@jest/globals";
import mongoose from "mongoose";

// --- Mock save function for instances
const mockSave = jest.fn();

// --- Fake model constructor
function FakeModel(data) {
  Object.assign(this, data);
  this.save = mockSave;
}

// --- Static methods to mimic Mongoose Model
FakeModel.find = jest.fn();
FakeModel.findByIdAndUpdate = jest.fn();
FakeModel.findByIdAndDelete = jest.fn();

// --- Mock candidate.js so it doesn’t register real schema
jest.unstable_mockModule("../models/candidate.js", () => ({
  __esModule: true,
  default: jest.fn(),
  candidateSchema: {},
}));

// --- Mock genericModelFactory to always return FakeModel
jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  __esModule: true,
  default: jest.fn(() => FakeModel),
}));

// --- Import controller AFTER mocks are registered
const controller = await import("../controllers/candidateController.js");
const {
  addCandidate,
  getCandidatesByRecruitment,
  updateCandidate,
  deleteCandidate,
} = controller;

describe("Candidate Controller", () => {
  let req, res, validId;

  beforeEach(() => {
    validId = new mongoose.Types.ObjectId().toString();

    req = {
      companyCode: "testCompany",
      body: {
        name: "John Doe",
        email: "john@example.com",
        department: "Engineering",
        column: "Applied",
        stars: 5,
        recruitment: "rec123",
      },
      params: { id: validId, recruitment: "rec123" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // ------------------ ADD CANDIDATE ------------------
  test("should add a candidate successfully", async () => {
    mockSave.mockResolvedValue(req.body);

    await addCandidate(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "John Doe",
        email: "john@example.com",
      })
    );
  });

  test("should return 400 if required fields are missing", async () => {
    req.body = {};

    await addCandidate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Validation error" })
    );
  });

  test("should return 401 if companyCode missing", async () => {
    req.companyCode = null;

    await addCandidate(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Authentication required",
        message: "Company code not found in request",
      })
    );
  });

  // ------------------ GET CANDIDATES ------------------
  test("should fetch candidates by recruitment", async () => {
    const candidates = [req.body];
    FakeModel.find.mockResolvedValue(candidates);

    await getCandidatesByRecruitment(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "John Doe" })])
    );
  });

  // ------------------ UPDATE CANDIDATE ------------------
  test("should update a candidate successfully", async () => {
    const updatedCandidate = { ...req.body, name: "Updated Name", _id: validId };
    FakeModel.findByIdAndUpdate.mockResolvedValue(updatedCandidate);

    await updateCandidate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Updated Name" })
    );
  });

  test("should return 404 if candidate not found on update", async () => {
    FakeModel.findByIdAndUpdate.mockResolvedValue(null);

    await updateCandidate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Candidate not found" })
    );
  });

  // ------------------ DELETE CANDIDATE ------------------
  test("should delete a candidate successfully", async () => {
    const deletedCandidate = {
      _id: validId,
      name: "John Doe",
      email: "john@example.com",
    };
    FakeModel.findByIdAndDelete.mockResolvedValue(deletedCandidate);

    await deleteCandidate(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Candidate deleted successfully",
        deletedCandidate: expect.objectContaining({
          id: validId,
          name: "John Doe",
          email: "john@example.com",
        }),
      })
    );
  });

  test("should return 404 if candidate not found on delete", async () => {
    FakeModel.findByIdAndDelete.mockResolvedValue(null);

    await deleteCandidate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Candidate not found" })
    );
  });
});
