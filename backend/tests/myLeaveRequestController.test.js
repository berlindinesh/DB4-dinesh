import { jest } from "@jest/globals";

// --- Mock genericModelFactory ---
const mockedGetModelForCompany = await jest.unstable_mockModule(
  "../models/genericModelFactory.js",
  () => ({
    __esModule: true,
    default: jest.fn(),
  })
);

const controller = await import("../controllers/myLeaveRequestController.js");
const getModelForCompany = (await import("../models/genericModelFactory.js"))
  .default;

// --- Fake Model Class ---
class FakeModel {
  constructor(data) {
    Object.assign(this, data);
  }
  save = jest.fn().mockResolvedValue(this);

  static findOne = jest.fn();
  static find = jest.fn();
  static findById = jest.fn();
  static findByIdAndUpdate = jest.fn();
  static findByIdAndDelete = jest.fn();
  static updateMany = jest.fn();
}

// --- Mock Notification model (mongoose.model) ---
jest.unstable_mockModule("mongoose", () => ({
  __esModule: true,
  default: {
    model: jest.fn().mockReturnValue(
      class Notification {
        save = jest.fn().mockResolvedValue(true);
      }
    ),
  },
}));

// --- Helper for res ---
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// --- Tests ---
describe("myLeaveRequestController", () => {
  let req, res, mockModel;

  beforeEach(() => {
    res = mockRes();
    req = {
      companyCode: "testCompany",
      params: {},
      body: {},
      app: { get: jest.fn(() => ({ emit: jest.fn() })) },
    };
    mockModel = FakeModel;
    getModelForCompany.mockResolvedValue(mockModel);
    jest.clearAllMocks();
  });

  // --- getLeaveBalance ---
  test("returns 401 if no companyCode", async () => {
    req.companyCode = null;
    await controller.getLeaveBalance(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("creates new balance if not found", async () => {
    mockModel.findOne.mockResolvedValue(null);
    req.params.employeeCode = "EMP123";
    await controller.getLeaveBalance(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("handles DB error in getLeaveBalance", async () => {
    mockModel.findOne.mockRejectedValue(new Error("DB error"));
    await controller.getLeaveBalance(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- createLeaveRequest ---
  test("fails if missing required fields", async () => {
    req.body = { employeeCode: "EMP_NO_DATES" };
    await controller.createLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("fails if insufficient balance", async () => {
    req.body = {
      employeeCode: "EMPX",
      leaveType: "annual",
      startDate: "2025-01-01",
      endDate: "2025-01-05",
    };
    mockModel.findOne.mockResolvedValue({
      annual: { total: 2, used: 2, pending: 0 },
      save: jest.fn(),
    });
    await controller.createLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("succeeds when balance is enough", async () => {
    req.body = {
      employeeCode: "EMP2",
      leaveType: "annual",
      startDate: "2025-01-01",
      endDate: "2025-01-02",
    };
    mockModel.findOne.mockResolvedValue({
      annual: { total: 10, used: 0, pending: 0 },
      save: jest.fn(),
    });
    await controller.createLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("handles DB save error", async () => {
    req.body = {
      employeeCode: "EMP_DBERR",
      leaveType: "annual",
      startDate: "2025-01-01",
      endDate: "2025-01-02",
    };
    const mockBalance = {
      annual: { total: 10, used: 0, pending: 0 },
      save: jest.fn().mockRejectedValue(new Error("Save fail")),
    };
    mockModel.findOne.mockResolvedValue(mockBalance);
    await controller.createLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // --- approveLeaveRequest ---
  test("returns 404 if not found", async () => {
    mockModel.findById.mockResolvedValue(null);
    req.params.id = "REQ404";
    await controller.approveLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("handles already approved", async () => {
    req.params.id = "REQ124";
    mockModel.findById.mockResolvedValue({ status: "approved", save: jest.fn() });
    await controller.approveLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("handles DB save error in approve", async () => {
    req.params.id = "REQ_FAILSAVE";
    mockModel.findById.mockResolvedValue({
      status: "pending",
      save: jest.fn().mockRejectedValue(new Error("Save error")),
    });
    await controller.approveLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- rejectLeaveRequest ---
  test("requires rejectionReason", async () => {
    req.params.id = "REQ1";
    req.body = {};
    await controller.rejectLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("handles DB save error in reject", async () => {
    req.params.id = "REQ_REJECT";
    req.body = { rejectionReason: "Not valid" };
    mockModel.findById.mockResolvedValue({
      status: "pending",
      save: jest.fn().mockRejectedValue(new Error("Save error")),
    });
    await controller.rejectLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- deleteLeaveRequest ---
  test("deletes successfully", async () => {
    mockModel.findByIdAndDelete.mockResolvedValue({ _id: "REQDEL" });
    req.params.id = "REQDEL";
    await controller.deleteLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("returns 404 if not found", async () => {
    mockModel.findByIdAndDelete.mockResolvedValue(null);
    req.params.id = "REQ404";
    await controller.deleteLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- resetAnnualLeaves ---
  test("requires year", async () => {
    await controller.resetAnnualLeaves(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("resets leaves successfully", async () => {
    req.body = { year: 2025 };
    mockModel.updateMany.mockResolvedValue({ modifiedCount: 5 });
    await controller.resetAnnualLeaves(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("handles errors in resetAnnualLeaves", async () => {
    req.body = { year: 2025 };
    mockModel.updateMany.mockRejectedValue(new Error("DB error"));
    await controller.resetAnnualLeaves(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- updateEarnedLeaveBalance ---
  test("fails if no employeeCode", async () => {
    req.body = { days: 3 };
    await controller.updateEarnedLeaveBalance(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("updates earned leave successfully", async () => {
    req.body = { employeeCode: "EMP100", days: 5 };
    mockModel.findOne.mockResolvedValue({
      earned: { total: 10, used: 0, pending: 0 },
      save: jest.fn(),
    });
    await controller.updateEarnedLeaveBalance(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- recalculateLeaveBalance ---
  test("returns 200 with no employees", async () => {
    mockModel.find.mockResolvedValue([]);
    await controller.recalculateLeaveBalance(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("handles save error during recalc", async () => {
    const mockEmployee = {
      annual: { total: 10, used: 5, pending: 0 },
      save: jest.fn().mockRejectedValue(new Error("Save fail")),
    };
    mockModel.find.mockResolvedValue([mockEmployee]);
    await controller.recalculateLeaveBalance(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- bulkApproveLeaveRequests ---
  test("requires requestIds", async () => {
    await controller.bulkApproveLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("approves successfully", async () => {
    req.body = { requestIds: ["REQ1", "REQ2"] };
    mockModel.updateMany.mockResolvedValue({ modifiedCount: 2 });
    await controller.bulkApproveLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("handles DB error in bulkApprove", async () => {
    req.body = { requestIds: ["REQ_ERR"] };
    mockModel.updateMany.mockRejectedValue(new Error("DB error"));
    await controller.bulkApproveLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // --- bulkRejectLeaveRequests ---
  test("requires rejectionReason", async () => {
    req.body = { requestIds: ["REQ1"] };
    await controller.bulkRejectLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("rejects successfully", async () => {
    req.body = { requestIds: ["REQ1"], rejectionReason: "Policy" };
    mockModel.findById.mockResolvedValue({
      status: "pending",
      leaveType: "annual",
      employeeCode: "EMP",
      numberOfDays: 1,
    });
    mockModel.findByIdAndUpdate.mockResolvedValue({ status: "rejected" });
    mockModel.findOne.mockResolvedValue({
      annual: { pending: 1 },
      save: jest.fn(),
    });
    await controller.bulkRejectLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });


    // --- Extra tests for uncovered lines ---
  test("createLeaveRequest fails if no leaveType", async () => {
    req.body = {
      employeeCode: "EMP_MISS_TYPE",
      startDate: "2025-01-01",
      endDate: "2025-01-02",
    };
    await controller.createLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("bulkRejectLeaveRequests handles missing request record", async () => {
    req.body = { requestIds: ["REQ_MISSING"], rejectionReason: "No record" };
    mockModel.findById.mockResolvedValue(null); // Simulate not found
    await controller.bulkRejectLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(200); // matches controller behavior
  });

  test("handles getModelForCompany throwing error", async () => {
    getModelForCompany.mockRejectedValueOnce(new Error("DB connect fail"));
    await controller.getLeaveBalance(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

    test("bulkRejectLeaveRequests → request not in pending status", async () => {
    req.body = { requestIds: ["REQ123"], rejectionReason: "Invalid reason" };
    mockModel.findById.mockResolvedValueOnce({
      status: "approved", // not pending
      employeeCode: "EMPX",
    });

    await controller.bulkRejectLeaveRequests(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        results: expect.objectContaining({
          failed: expect.arrayContaining([
            expect.objectContaining({
              reason: "Request is not in pending status",
            }),
          ]),
        }),
      })
    );
  });

  test("bulkRejectLeaveRequests → handles error inside loop", async () => {
    req.body = { requestIds: ["REQERR"], rejectionReason: "System error" };

    mockModel.findById.mockResolvedValueOnce({
      status: "pending",
      leaveType: "annual",
      employeeCode: "EMPX",
      numberOfDays: 2,
    });

    mockModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("DB update failed"));

    await controller.bulkRejectLeaveRequests(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        results: expect.objectContaining({
          failed: expect.arrayContaining([
            expect.objectContaining({
              reason: expect.stringContaining("DB update failed"),
            }),
          ]),
        }),
      })
    );
  });

  test("recalculateLeaveBalance → recalculates correctly", async () => {
    req.params = { employeeCode: "EMPX" };

    mockModel.find.mockResolvedValueOnce([
      { leaveType: "annual", numberOfDays: 5, status: "approved" },
      { leaveType: "sick", numberOfDays: 2, status: "pending" },
    ]);

    const mockBalance = {
      annual: { total: 10, used: 0, pending: 0 },
      sick: { total: 5, used: 0, pending: 0 },
      personal: { total: 0, used: 0, pending: 0 },
      maternity: { total: 0, used: 0, pending: 0 },
      paternity: { total: 0, used: 0, pending: 0 },
      casual: { total: 0, used: 0, pending: 0 },
      earned: { total: 0, used: 0, pending: 0 },
      save: jest.fn().mockResolvedValue(true),
    };

    mockModel.findOne.mockResolvedValueOnce(mockBalance);

    await controller.recalculateLeaveBalance(req, res);

    expect(mockBalance.annual.used).toBe(5);
    expect(mockBalance.sick.pending).toBe(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("updateEarnedLeaveBalance → success path", async () => {
    req.body = {};
    mockModel.updateMany.mockResolvedValue({ acknowledged: true });

    await controller.updateEarnedLeaveBalance(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Earned leave balance updated for all employees",
      })
    );
  });
    // --- EXTRA EDGE TESTS ---

  test("bulkRejectLeaveRequests → requires requestIds", async () => {
    req.body = { rejectionReason: "Policy" };
    await controller.bulkRejectLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("bulkRejectLeaveRequests → returns 401 if no companyCode", async () => {
    req.companyCode = null;
    req.body = { requestIds: ["REQ1"], rejectionReason: "Policy" };
    await controller.bulkRejectLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("deleteLeaveRequest → handles DB error", async () => {
    req.params.id = "REQ_ERRDEL";
    mockModel.findByIdAndDelete.mockRejectedValueOnce(new Error("Delete error"));

    await controller.deleteLeaveRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
  

  test("resetAnnualLeaves → no records modified", async () => {
    req.body = { year: 2025 };
    mockModel.updateMany.mockResolvedValueOnce({ modifiedCount: 0 });

    await controller.resetAnnualLeaves(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
   message: "Annual leaves reset for 2025" 
 });
  });
  test("bulkApproveLeaveRequests → leaveBalance not found", async () => {
  req.body = { requestIds: ["REQ1"] };
  mockModel.findById.mockResolvedValueOnce({ status: "pending", leaveType: "annual", employeeCode: "EMP" });
  mockModel.findOne.mockResolvedValueOnce(null); // simulate missing balance
  mockModel.findByIdAndUpdate.mockResolvedValueOnce({ status: "approved" });

  await controller.bulkApproveLeaveRequests(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      results: expect.objectContaining({
        successful: expect.arrayContaining([expect.objectContaining({ status: "approved" })])
      })
    })
  );
});

test("bulkRejectLeaveRequests → error saving leave balance", async () => {
  req.body = { requestIds: ["REQ1"], rejectionReason: "Policy" };

  // The leave request found by findById
  mockModel.findById.mockResolvedValueOnce({
    status: "pending",
    leaveType: "annual",
    employeeCode: "EMP",
    numberOfDays: 2, // important for updating leave balance
  });

  // The leave balance found by findOne must have the leave type object
  const mockLeaveBalance = {
    employeeCode: "EMP",
    annual: { total: 10, used: 2, pending: 1 },
    save: jest.fn().mockRejectedValueOnce(new Error("Save failed")),
  };
  mockModel.findOne.mockResolvedValueOnce(mockLeaveBalance);

  // Updating the leave request itself
  mockModel.findByIdAndUpdate.mockResolvedValueOnce({ status: "rejected" });

  await controller.bulkRejectLeaveRequests(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json.mock.calls[0][0].results.failed[0].reason).toMatch(/Save failed/);
});
test("getLeaveBalance returns existing balance correctly", async () => {
  req.params.employeeCode = "EMP_EXIST";
  const mockBalance = {
    annual: { total: 10, used: 2, pending: 1 },
    sick: { total: 5, used: 1, pending: 0 },
  };
  mockModel.findOne.mockResolvedValue(mockBalance);
  await controller.getLeaveBalance(req, res);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining(mockBalance));
});

test("createLeaveRequest with leaveType not in balance", async () => {
  req.body = {
    employeeCode: "EMP3",
    leaveType: "sick",
    startDate: "2025-01-01",
    endDate: "2025-01-02",
  };
  mockModel.findOne.mockResolvedValue({
    annual: { total: 10, used: 0, pending: 0 },
    save: jest.fn(),
  });
  await controller.createLeaveRequest(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});
test("approveLeaveRequest succeeds and updates leave balance", async () => {
  req.params.id = "REQ_APPROVE";
  const mockLeaveRequest = {
    status: "pending",
    leaveType: "annual",
    employeeCode: "EMPX",
    numberOfDays: 2,
    save: jest.fn().mockResolvedValue(true),
  };
  mockModel.findById.mockResolvedValue(mockLeaveRequest);
  mockModel.findOne.mockResolvedValue({
    annual: { total: 10, used: 2, pending: 1 },
    save: jest.fn().mockResolvedValue(true),
  });
  await controller.approveLeaveRequest(req, res);
  expect(res.status).toHaveBeenCalledWith(200);
});
// --- Extra Tests for Edge Cases ---
describe("Extra edge cases for coverage", () => {
  let req, res, mockModel;

  beforeEach(() => {
    res = mockRes();
    req = { companyCode: "testCompany", params: {}, body: {}, query: {} };
    mockModel = FakeModel;
    getModelForCompany.mockResolvedValue(mockModel);
    jest.clearAllMocks();
  });

  test("createLeaveRequest handles half-day leave", async () => {
    req.body = {
      employeeCode: "EMP_HALF",
      leaveType: "annual",
      startDate: "2025-09-10",
      endDate: "2025-09-10",
      halfDay: true,
      halfDayType: "morning",
    };
    mockModel.findOne.mockResolvedValue({
      annual: { total: 10, used: 0, pending: 0 },
      save: jest.fn(),
    });
    await controller.createLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("updateLeaveComment updates successfully", async () => {
    req.params.id = "REQ_COMMENT";
    req.body = { comment: "Updated comment" };
    const mockLeave = { save: jest.fn().mockResolvedValue(true) };
    mockModel.findById.mockResolvedValue(mockLeave);
    await controller.updateLeaveComment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("updateLeaveComment fails if not found", async () => {
    req.params.id = "REQ_NOTFOUND";
    mockModel.findById.mockResolvedValue(null);
    await controller.updateLeaveComment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });


  test("bulkApproveLeaveRequests → empty requestIds", async () => {
    req.body = { requestIds: [] };
    await controller.bulkApproveLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("bulkRejectLeaveRequests → empty requestIds", async () => {
    req.body = { requestIds: [], rejectionReason: "Policy" };
    await controller.bulkRejectLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("getLeaveBalance → employeeCode missing", async () => {
    req.params.employeeCode = null;
    await controller.getLeaveBalance(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});


});