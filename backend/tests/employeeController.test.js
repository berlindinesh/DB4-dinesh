// tests/employeeController.test.js
import { jest } from "@jest/globals";

// --- Step 1: Mock Employees model ---
const mockSave = jest.fn();
const EmployeesMock = jest.fn().mockImplementation(() => ({ save: mockSave }));
EmployeesMock.find = jest.fn();
EmployeesMock.findByIdAndUpdate = jest.fn();
EmployeesMock.findByIdAndDelete = jest.fn();

// Mock Employees module before importing controller
jest.unstable_mockModule("../models/Employees.js", () => ({
  __esModule: true,
  default: EmployeesMock,
}));

// --- Step 2: Import controller AFTER mocks ---
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = await import("../controllers/employeeController.js");

describe("employeeController.js", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, query: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  // --- getEmployees ---
  it("should get all employees without filters", async () => {
    EmployeesMock.find.mockResolvedValue([{ id: "emp1" }]);
    await getEmployees(req, res);
    expect(EmployeesMock.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should filter employees by searchTerm and stage", async () => {
    req.query = { searchTerm: "John", stage: "Interview" };
    EmployeesMock.find.mockResolvedValue([{ id: "emp2" }]);

    await getEmployees(req, res);

    expect(EmployeesMock.find).toHaveBeenCalledWith({
      name: { $regex: "John", $options: "i" },
      stage: "Interview",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should handle error in getEmployees", async () => {
    EmployeesMock.find.mockRejectedValue(new Error("DB error"));
    await getEmployees(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- createEmployee ---
  it("should create a new employee", async () => {
    req.body = { name: "Alice" };
    mockSave.mockResolvedValue({ id: "emp3" });

    await createEmployee(req, res);

    expect(EmployeesMock).toHaveBeenCalledWith({ name: "Alice" });
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should handle error in createEmployee", async () => {
    mockSave.mockRejectedValue(new Error("Save error"));
    await createEmployee(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // --- updateEmployee ---
  it("should update employee details", async () => {
    req.params.id = "emp4";
    req.body = { stage: "Hired" };
    EmployeesMock.findByIdAndUpdate.mockResolvedValue({ id: "emp4", stage: "Hired" });

    await updateEmployee(req, res);

    expect(EmployeesMock.findByIdAndUpdate).toHaveBeenCalledWith("emp4", { stage: "Hired" }, { new: true });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 404 if employee not found in updateEmployee", async () => {
    req.params.id = "emp5";
    EmployeesMock.findByIdAndUpdate.mockResolvedValue(null);

    await updateEmployee(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should handle error in updateEmployee", async () => {
    EmployeesMock.findByIdAndUpdate.mockRejectedValue(new Error("Update error"));
    await updateEmployee(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // --- deleteEmployee ---
  it("should delete employee successfully", async () => {
    req.params.id = "emp6";
    EmployeesMock.findByIdAndDelete.mockResolvedValue({ id: "emp6" });

    await deleteEmployee(req, res);

    expect(EmployeesMock.findByIdAndDelete).toHaveBeenCalledWith("emp6");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Employee deleted successfully" });
  });

  it("should return 404 if employee not found in deleteEmployee", async () => {
    req.params.id = "emp7";
    EmployeesMock.findByIdAndDelete.mockResolvedValue(null);

    await deleteEmployee(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Employee not found" });
  });

  it("should handle error in deleteEmployee", async () => {
    EmployeesMock.findByIdAndDelete.mockRejectedValue(new Error("Delete error"));
    await deleteEmployee(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
