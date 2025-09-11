// tests/employeesController.test.js
import { jest } from "@jest/globals";

import {
  generateEmployeeCode,
  savePersonalInfo,
  saveAddressInfo,
  saveJoiningDetails,
  saveEducationDetails,
  saveFamilyDetails,
  saveServiceHistory,
  saveNominationDetails,
  getEmployeeData,
} from "../controllers/employeesController.js";

import EmployeeRegister from "../models/employeeRegisterModel.js";

// Mock Response Helper
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Reset mocks
beforeEach(() => {
  jest.clearAllMocks();
});

describe("employeesController.js", () => {
  // ----------------- generateEmployeeCode -----------------
  describe("generateEmployeeCode", () => {
    it("should return DB-0001 if no employees", async () => {
      EmployeeRegister.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });
      const result = await generateEmployeeCode();
      expect(result).toBe("DB-0001");
    });

    it("should increment last Emp_ID", async () => {
      EmployeeRegister.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue({ Emp_ID: "DB-0005" }),
      });
      const result = await generateEmployeeCode();
      expect(result).toBe("DB-0006");
    });

    it("should throw error if DB fails", async () => {
      EmployeeRegister.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("DB error")),
      });
      await expect(generateEmployeeCode()).rejects.toThrow(
        "Failed to generate employee code"
      );
    });
  });

  // ----------------- savePersonalInfo -----------------
  describe("savePersonalInfo", () => {
    

    it("should update existing employee", async () => {
      const req = {
        body: {
          formData: JSON.stringify({
            Emp_ID: "DB-0002",
            personalInfo: { name: "Updated" },
          }),
        },
        file: { path: "fake.png" },
      };
      const res = mockResponse();

      EmployeeRegister.findOneAndUpdate = jest.fn().mockResolvedValue({
        Emp_ID: "DB-0002",
      });

      await savePersonalInfo(req, res);

      expect(EmployeeRegister.findOneAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle error in savePersonalInfo", async () => {
      const req = {
        body: { formData: "INVALID_JSON" },
      };
      const res = mockResponse();

      await savePersonalInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  // ----------------- updateEmployeeField functions -----------------
  const updateTests = [
    { fn: saveAddressInfo, field: "addressInfo" },
    { fn: saveJoiningDetails, field: "joiningDetails" },
    { fn: saveEducationDetails, field: "educationDetails" },
    { fn: saveFamilyDetails, field: "familyDetails" },
    { fn: saveServiceHistory, field: "serviceHistory" },
    { fn: saveNominationDetails, field: "nominationDetails" },
  ];

  updateTests.forEach(({ fn, field }) => {
    describe(`${field}`, () => {
      it(`should update ${field}`, async () => {
        const req = {
          body: { Emp_ID: "DB-0003", formData: { test: "data" } },
        };
        const res = mockResponse();

        EmployeeRegister.findOneAndUpdate = jest
          .fn()
          .mockResolvedValue({ Emp_ID: "DB-0003" });

        await fn(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: `${field} updated successfully`,
          })
        );
      });

      it(`should return 404 if employee not found for ${field}`, async () => {
        const req = {
          body: { Emp_ID: "DB-9999", formData: { test: "data" } },
        };
        const res = mockResponse();

        EmployeeRegister.findOneAndUpdate = jest.fn().mockResolvedValue(null);

        await fn(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ success: false })
        );
      });

      it(`should handle error in ${field}`, async () => {
        const req = {
          body: { Emp_ID: "DB-0003", formData: {} },
        };
        const res = mockResponse();

        EmployeeRegister.findOneAndUpdate = jest
          .fn()
          .mockRejectedValue(new Error("DB error"));

        await fn(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ success: false })
        );
      });
    });
  });

  // ----------------- getEmployeeData -----------------
  describe("getEmployeeData", () => {
    it("should return employee data", async () => {
      const req = { params: { employeeId: "DB-0004" } };
      const res = mockResponse();

      EmployeeRegister.findOne = jest
        .fn()
        .mockResolvedValue({ Emp_ID: "DB-0004" });

      await getEmployeeData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ Emp_ID: "DB-0004" }),
        })
      );
    });

    it("should return 404 if employee not found", async () => {
      const req = { params: { employeeId: "DB-404" } };
      const res = mockResponse();

      EmployeeRegister.findOne = jest.fn().mockResolvedValue(null);

      await getEmployeeData(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("should handle error in getEmployeeData", async () => {
      const req = { params: { employeeId: "DB-0005" } };
      const res = mockResponse();

      EmployeeRegister.findOne = jest
        .fn()
        .mockRejectedValue(new Error("DB error"));

      await getEmployeeData(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });
});
