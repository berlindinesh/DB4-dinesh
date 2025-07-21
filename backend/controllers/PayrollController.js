import UnifiedPayroll, { unifiedPayrollSchema } from "../models/UnifiedPayroll.js";
import { PayrollPDFService } from "../services/PayrollPDFService.js";
import fs from 'fs';
import getModelForCompany from '../models/genericModelFactory.js';

export class PayrollController {
  // Employee Management
  static async bulkCreateEmployees(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Bulk creating employees for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { employees } = req.body;
      const createdEmployees = await Promise.all(
        employees.map(async (employeeData) => {
          const employee = new CompanyPayroll({
            ...employeeData,
            lop: parseFloat(employeeData.lop) || 0,
            payableDays: parseFloat(employeeData.payableDays) || 30,
            joiningDate: employeeData.dateOfJoining ? new Date(employeeData.dateOfJoining) : null, // Convert dateOfJoining to joiningDate
            workEmail: employeeData.workEmail || "", // Ensure workEmail is handled
            allowances: [],
            deductions: [],
            payslips: []
          });
          return await employee.save();
        })
      );

      res.status(201).json({
        success: true,
        data: createdEmployees,
        message: "Employees imported successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async createEmployee(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Creating employee for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const employeeData = {
        ...req.body,
        lop: parseFloat(req.body.lop) || 0,
        payableDays: parseFloat(req.body.payableDays) || 30,
        joiningDate: req.body.dateOfJoining ? new Date(req.body.dateOfJoining) : null, // Convert dateOfJoining to joiningDate
        workEmail: req.body.workEmail || "", // Ensure workEmail is handled
        allowances: [],
        deductions: [],
        payslips: []
      };

      const employee = new CompanyPayroll(employeeData);
      await employee.save();
      res.status(201).json({
        success: true,
        data: employee,
        message: "Employee created successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllEmployees(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Fetching all employees for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const employees = await CompanyPayroll.find();
      res.status(200).json({
        success: true,
        data: employees,
        count: employees.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateEmployee(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Updating employee for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const updateData = {
        ...req.body,
        lop: Math.round(parseFloat(req.body.lop) * 2) / 2, // Rounds to nearest 0.5
        payableDays: parseFloat(req.body.payableDays),
        joiningDate: req.body.dateOfJoining ? new Date(req.body.dateOfJoining) : undefined, // Convert dateOfJoining to joiningDate
        workEmail: req.body.workEmail || "", // Ensure workEmail is handled
      };

      const employee = await CompanyPayroll.findOneAndUpdate(
        { empId: req.params.empId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      res.status(200).json({
        success: true,
        data: employee,
        message: "Employee updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateEmployeeLOP(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Updating employee LOP for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { lop } = req.body;
      const roundedLOP = Math.round(parseFloat(lop) * 2) / 2;

      const employee = await CompanyPayroll.findOneAndUpdate(
        { empId: req.params.empId },
        { lop: roundedLOP },
        { new: true, runValidators: true }
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      res.status(200).json({
        success: true,
        data: employee,
        message: "LOP updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteEmployee(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Deleting employee for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const employee = await CompanyPayroll.findOneAndDelete({
        empId: req.params.empId,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Employee and related records deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Allowance Management
  static async createAllowance(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Creating allowance for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      console.log("Creating allowance:", req.body);
      const { empId, name, percentage, amount, category, status, isRecurring, isBasicPay, baseAfterDeductions } = req.body;
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        console.error("Employee not found:", empId);
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      // Check if allowance already exists
      const existingIndex = employee.allowances.findIndex(a => a.name === name);
      
      if (existingIndex >= 0) {
        console.log("Updating existing allowance:", name);
        // Update existing allowance
        employee.allowances[existingIndex] = {
          name,
          percentage: parseFloat(percentage),
          amount: parseFloat(amount),
          category: category || 'Regular',
          status: status || 'Active',
          isRecurring: isRecurring !== undefined ? isRecurring : true,
          isBasicPay: isBasicPay || name === "BASIC PAY" // Set isBasicPay flag
        };
      } else {
        console.log("Adding new allowance:", name);
        // Add new allowance
        employee.allowances.push({
          name,
          percentage: parseFloat(percentage),
          amount: parseFloat(amount),
          category: category || 'Regular',
          status: status || 'Active',
          isRecurring: isRecurring !== undefined ? isRecurring : true,
          isBasicPay: isBasicPay || name === "BASIC PAY" // Set isBasicPay flag
        });
      }
      
      await employee.save();
      console.log("Allowance saved successfully");
      
      res.status(201).json({
        success: true,
        data: employee,
        message: "Allowance added successfully",
      });
    } catch (error) {
      console.error("Error creating allowance:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllAllowances(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Fetching all allowances for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const employees = await CompanyPayroll.find();
      
      // Extract all allowances from all employees
      const allowances = [];
      employees.forEach(employee => {
        employee.allowances.forEach(allowance => {
          allowances.push({
            _id: `${employee.empId}_${allowance.name}`, // Create a virtual ID
            empId: employee.empId,
            empName: employee.empName,
            ...allowance.toObject()
          });
        });
      });
      
      res.status(200).json({
        success: true,
        data: allowances,
        count: allowances.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateAllowance(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Updating allowance for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { id } = req.params;
      const [empId, allowanceName] = id.split('_');
      
      const { name, percentage, amount, category, status, isRecurring, isBasicPay } = req.body;
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      const allowanceIndex = employee.allowances.findIndex(a => a.name === allowanceName);
      if (allowanceIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Allowance not found",
        });
      }
      
      // Update the allowance
      employee.allowances[allowanceIndex] = {
        name: name || allowanceName,
        percentage,
        amount,
        category: category || employee.allowances[allowanceIndex].category,
        status: status || employee.allowances[allowanceIndex].status,
        isRecurring: isRecurring !== undefined ? isRecurring : employee.allowances[allowanceIndex].isRecurring,
        isBasicPay: isBasicPay !== undefined ? isBasicPay : (name === "BASIC PAY" || allowanceName === "BASIC PAY")
      };
      
      await employee.save();
      
      res.status(200).json({
        success: true,
        data: {
          _id: `${empId}_${name || allowanceName}`,
          empId,
          empName: employee.empName,
          ...employee.allowances[allowanceIndex].toObject()
        },
              message: "Allowance updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteAllowance(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Deleting allowance for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { id } = req.params;
      const [empId, allowanceName] = id.split('_');
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      const allowanceIndex = employee.allowances.findIndex(a => a.name === allowanceName);
      if (allowanceIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Allowance not found",
        });
      }
      
      // Remove the allowance
      employee.allowances.splice(allowanceIndex, 1);
      await employee.save();
      
      res.status(200).json({
        success: true,
        message: "Allowance deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Deduction Management
  static async createDeduction(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Creating deduction for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      console.log("Creating deduction:", req.body);
      const { empId, name, percentage, amount, category, status, isRecurring, isFixedAmount } = req.body;
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        console.error("Employee not found:", empId);
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      // Check if deduction already exists
      const existingIndex = employee.deductions.findIndex(d => d.name === name);
      
      if (existingIndex >= 0) {
        console.log("Updating existing deduction:", name);
        // Update existing deduction
        employee.deductions[existingIndex] = {
          name,
          percentage: parseFloat(percentage),
          amount: parseFloat(amount),
          category: category || 'Tax',
          status: status || 'Active',
          isRecurring: isRecurring !== undefined ? isRecurring : true,
          isFixedAmount: isFixedAmount || parseFloat(percentage) === 0 // Set isFixedAmount flag
        };
      } else {
        console.log("Adding new deduction:", name);
        // Add new deduction
        employee.deductions.push({
          name,
          percentage: parseFloat(percentage),
          amount: parseFloat(amount),
          category: category || 'Tax',
          status: status || 'Active',
          isRecurring: isRecurring !== undefined ? isRecurring : true,
          isFixedAmount: isFixedAmount || parseFloat(percentage) === 0 // Set isFixedAmount flag
        });
      }
      
      await employee.save();
      console.log("Deduction saved successfully");
      
      res.status(201).json({
        success: true,
        data: employee,
        message: "Deduction added successfully",
      });
    } catch (error) {
      console.error("Error creating deduction:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllDeductions(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Fetching all deductions for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const employees = await CompanyPayroll.find();
      
      // Extract all deductions from all employees
      const deductions = [];
      employees.forEach(employee => {
        employee.deductions.forEach(deduction => {
          deductions.push({
            _id: `${employee.empId}_${deduction.name}`, // Create a virtual ID
            empId: employee.empId,
            empName: employee.empName,
            ...deduction.toObject()
          });
        });
      });
      
      res.status(200).json({
        success: true,
        data: deductions,
        count: deductions.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateDeduction(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Updating deduction for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { id } = req.params;
      const [empId, deductionName] = id.split('_');
      
      const { name, percentage, amount, category, status, isRecurring, isFixedAmount } = req.body;
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      const deductionIndex = employee.deductions.findIndex(d => d.name === deductionName);
      if (deductionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Deduction not found",
        });
      }
      
      // Update the deduction
      employee.deductions[deductionIndex] = {
        name: name || deductionName,
        percentage,
        amount,
        category: category || employee.deductions[deductionIndex].category,
        status: status || employee.deductions[deductionIndex].status,
        isRecurring: isRecurring !== undefined ? isRecurring : employee.deductions[deductionIndex].isRecurring,
        isFixedAmount: isFixedAmount !== undefined ? isFixedAmount : percentage === 0
      };
      
      await employee.save();
      
      res.status(200).json({
        success: true,
        data: {
          _id: `${empId}_${name || deductionName}`,
          empId,
          empName: employee.empName,
          ...employee.deductions[deductionIndex].toObject()
        },
        message: "Deduction updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteDeduction(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Deleting deduction for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { id } = req.params;
      const [empId, deductionName] = id.split('_');
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      const deductionIndex = employee.deductions.findIndex(d => d.name === deductionName);
      if (deductionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Deduction not found",
        });
      }
      
      // Remove the deduction
      employee.deductions.splice(deductionIndex, 1);
      await employee.save();
      
      res.status(200).json({
        success: true,
        message: "Deduction deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  
  static async generatePayslip(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      // Get token from request headers
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Generating payslip for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const payslipData = req.body;
      const { empId, month, year } = payslipData;
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      // Check if payslip for this month/year already exists
      const existingPayslipIndex = employee.payslips.findIndex(
        p => p.month === month && p.year === year
      );
      
      // Create payslip object with additional fields
      const newPayslip = {
        month,
        year,
        generatedDate: new Date(),
        grossSalary: payslipData.grossSalary,
        totalDeductions: payslipData.totalDeductions,
        netSalary: payslipData.netSalary,
        status: 'Generated',
        baseAfterDeductions: payslipData.baseAfterDeductions,
        attendanceAdjustedBase: payslipData.attendanceAdjustedBase,
        lopImpact: payslipData.lopImpact || {
          totalPayBeforeLOP: employee.basicPay,
          lopDeduction: (employee.basicPay / employee.payableDays) * payslipData.lopDays,
          lopPercentage: (payslipData.lopDays / employee.payableDays) * 100
        }
      };
      
      // Generate PDF with company details
      const pdfPath = await PayrollPDFService.generatePayslipPDF(
        {
          ...payslipData,
          _id: `${empId}_${month}_${year}`, // Create a virtual ID for the PDF
          dateOfJoining: employee.joiningDate // Pass joining date to PDF service
        },
        token,
        companyCode
      );
      
      newPayslip.pdfPath = pdfPath;
      
      if (existingPayslipIndex >= 0) {
        // Update existing payslip
        employee.payslips[existingPayslipIndex] = newPayslip;
      } else {
        // Add new payslip
        employee.payslips.push(newPayslip);
      }
      
      await employee.save();
      
      res.status(201).json({
        success: true,
        data: {
          _id: `${empId}_${month}_${year}`,
          ...newPayslip
        },
        message: "Payslip generated successfully",
      });
    } catch (error) {
      console.error('Error in generatePayslip:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async bulkGeneratePayslips(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      // Get token from request headers
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Bulk generating payslips for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { month, year } = req.body;
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      const employees = await CompanyPayroll.find({ status: "Active" });
      const generatedPayslips = [];

      for (const employee of employees) {
        try {
          // Get active allowances and deductions
          const activeAllowances = employee.allowances.filter(a => a.status === "Active");
          const activeDeductions = employee.deductions.filter(d => d.status === "Active");
          
          // Calculate basic values
          const basicPay = employee.basicPay;
          const payableDays = employee.payableDays;
          const lopDays = employee.lop;
          
          // Calculate per day pay
          const perDayPay = basicPay / payableDays;
          
          // Calculate attendance adjusted basic pay
          const actualPayableDays = payableDays - lopDays;
          const attendanceRatio = actualPayableDays / payableDays;
          
          // Calculate total deductions first
          let totalDeductionAmount = 0;
          const deductionsWithAmounts = activeDeductions.map(deduction => {
            let amount;
            if (deduction.isFixedAmount || deduction.percentage === 0) {
              // Fixed amount deduction
              amount = deduction.amount;
              totalDeductionAmount += amount;
              return {
                name: deduction.name,
                amount,
                percentage: deduction.percentage,
                isFixedAmount: true
              };
            } else {
              // Percentage-based deduction
              amount = basicPay * (deduction.percentage / 100);
              totalDeductionAmount += amount;
              return {
                name: deduction.name,
                amount,
                percentage: deduction.percentage,
                isFixedAmount: false
              };
            }
          });
          
          // Calculate base after deductions
          const baseAfterDeductions = basicPay - totalDeductionAmount;
          
          // Apply attendance adjustment to the base
          const attendanceAdjustedBase = baseAfterDeductions * attendanceRatio;
          
          // Calculate allowances based on the attendance-adjusted base
          let totalAllowanceAmount = 0;
          const allowancesWithAmounts = activeAllowances.map(allowance => {
            // Calculate allowance amount based on percentage of base after deductions
            const amount = attendanceAdjustedBase * (allowance.percentage / 100);
            totalAllowanceAmount += amount;
            
            return {
              name: allowance.name,
              amount,
              percentage: allowance.percentage,
              isBasicPay: allowance.isBasicPay || allowance.name === "BASIC PAY"
            };
          });
          
          // Net salary is the total of all allowances
          const netSalary = totalAllowanceAmount;
          
          // Create payslip data
          const payslipData = {
            empId: employee.empId,
            empName: employee.empName,
            department: employee.department,
            designation: employee.designation,
            pfNo: employee.pfNo,
            uanNo: employee.uanNo,
            panNo: employee.panNo,
            month: monthNum,
            year: yearNum,
            basicPay,
            payableDays,
            lopDays,
            dateOfJoining: employee.joiningDate,
            bankDetails: {
              bankName: employee.bankName,
              accountNo: employee.bankAccountNo,
            },
            allowances: allowancesWithAmounts,
            deductions: deductionsWithAmounts,
            baseAfterDeductions,
            attendanceAdjustedBase,
            grossSalary: totalAllowanceAmount,
            totalDeductions: totalDeductionAmount,
            netSalary,
            lopImpact: {
              totalPayBeforeLOP: basicPay,
              lopDeduction: basicPay - (perDayPay * actualPayableDays),
              lopPercentage: (lopDays / payableDays) * 100
            }
          };
          
          // Generate PDF with company details
          console.log(`Generating PDF for employee ${employee.empId} with token and company code`);
          const pdfPath = await PayrollPDFService.generatePayslipPDF(
            {
              ...payslipData,
              _id: `${employee.empId}_${monthNum}_${yearNum}`
            },
            token,
            companyCode
          );
          
          // Create or update payslip in employee record
          const existingPayslipIndex = employee.payslips.findIndex(
            p => p.month === monthNum && p.year === yearNum
          );
          
          const newPayslip = {
            month: monthNum,
            year: yearNum,
            generatedDate: new Date(),
            grossSalary: totalAllowanceAmount,
            totalDeductions: totalDeductionAmount,
            netSalary,
            status: 'Generated',
            pdfPath,
            baseAfterDeductions,
            attendanceAdjustedBase,
            lopImpact: {
              totalPayBeforeLOP: basicPay,
              lopDeduction: basicPay - (perDayPay * actualPayableDays),
              lopPercentage: (lopDays / payableDays) * 100
            }
          };
          
          if (existingPayslipIndex >= 0) {
            employee.payslips[existingPayslipIndex] = newPayslip;
          } else {
            employee.payslips.push(newPayslip);
          }
          
          await employee.save();
          
          generatedPayslips.push({
            _id: `${employee.empId}_${monthNum}_${yearNum}`,
            empId: employee.empId,
            empName: employee.empName,
            ...newPayslip
          });
        } catch (employeeError) {
          console.error(`Error generating payslip for employee ${employee.empId}:`, employeeError);
          // Continue with next employee instead of failing the entire batch
        }
      }

      res.status(200).json({
        success: true,
        data: generatedPayslips,
        count: generatedPayslips.length,
        message: "Bulk payslips generated successfully",
      });
    } catch (error) {
      console.error('Error in bulkGeneratePayslips:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async downloadPayslip(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      // Get token from request headers
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Downloading payslip for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { id } = req.params;
      const [empId, month, year] = id.split('_');
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      const payslip = employee.payslips.find(
        p => p.month === parseInt(month) && p.year === parseInt(year)
      );
      
      if (!payslip || !payslip.pdfPath) {
        return res.status(404).json({
          success: false,
          message: "Payslip not found or PDF not generated",
        });
      }
      
      // Check if file exists
      if (!fs.existsSync(payslip.pdfPath)) {
        console.log(`PDF file not found at ${payslip.pdfPath}, regenerating...`);
        // If PDF doesn't exist, regenerate it
        const activeAllowances = employee.allowances.filter(a => a.status === "Active");
        const activeDeductions = employee.deductions.filter(d => d.status === "Active");
        
        // Calculate basic values
        const basicPay = employee.basicPay;
        const payableDays = employee.payableDays;
        const lopDays = employee.lop;
        
        // Calculate per day pay
        const perDayPay = basicPay / payableDays;
        
        // Calculate attendance adjusted basic pay
        const actualPayableDays = payableDays - lopDays;
        const attendanceRatio = actualPayableDays / payableDays;
        
        // Calculate total deductions first
        let totalDeductionAmount = 0;
        const deductionsWithAmounts = activeDeductions.map(deduction => {
          let amount;
          if (deduction.isFixedAmount || deduction.percentage === 0) {
            // Fixed amount deduction
            amount = deduction.amount;
            totalDeductionAmount += amount;
            return {
              name: deduction.name,
              amount,
              percentage: deduction.percentage,
              isFixedAmount: true
            };
          } else {
            // Percentage-based deduction
            amount = basicPay * (deduction.percentage / 100);
            totalDeductionAmount += amount;
            return {
              name: deduction.name,
              amount,
              percentage: deduction.percentage,
              isFixedAmount: false
            };
          }
        });
        
        // Calculate base after deductions
        const baseAfterDeductions = basicPay - totalDeductionAmount;
        
        // Apply attendance adjustment to the base
        const attendanceAdjustedBase = baseAfterDeductions * attendanceRatio;
        
        // Calculate allowances based on the attendance-adjusted base
        let totalAllowanceAmount = 0;
        const allowancesWithAmounts = activeAllowances.map(allowance => {
          // Calculate allowance amount based on percentage of base after deductions
          const amount = attendanceAdjustedBase * (allowance.percentage / 100);
          totalAllowanceAmount += amount;
          
          return {
            name: allowance.name,
            amount,
            percentage: allowance.percentage,
            isBasicPay: allowance.isBasicPay || allowance.name === "BASIC PAY"
          };
        });
        
        // Net salary is the total of all allowances
        const netSalary = totalAllowanceAmount;
        
        // Create payslip data
        const payslipData = {
          empId: employee.empId,
          empName: employee.empName,
          department: employee.department,
          designation: employee.designation,
          pfNo: employee.pfNo,
          uanNo: employee.uanNo,
          panNo: employee.panNo,
          month: parseInt(month),
          year: parseInt(year),
          basicPay,
          payableDays,
          lopDays,
          dateOfJoining: employee.joiningDate,
                    bankDetails: {
            bankName: employee.bankName,
            accountNo: employee.bankAccountNo,
          },
          allowances: allowancesWithAmounts,
          deductions: deductionsWithAmounts,
          baseAfterDeductions,
          attendanceAdjustedBase,
          grossSalary: totalAllowanceAmount,
          totalDeductions: totalDeductionAmount,
          netSalary,
          lopImpact: {
            totalPayBeforeLOP: basicPay,
            lopDeduction: basicPay - (perDayPay * actualPayableDays),
            lopPercentage: (lopDays / payableDays) * 100
          }
        };
        
        // Regenerate PDF with company details
        const pdfPath = await PayrollPDFService.generatePayslipPDF(
          {
            ...payslipData,
            _id: id
          },
          token,
          companyCode
        );
        
        // Update payslip record with new path
        payslip.pdfPath = pdfPath;
        await employee.save();
        
        return res.download(pdfPath);
      }
      
      res.download(payslip.pdfPath);
    } catch (error) {
      console.error('Error in downloadPayslip:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }





  static async getPayslipsByEmployee(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Fetching payslips by employee for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { empId } = req.params;
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      // Map payslips to include virtual ID
      const payslips = employee.payslips.map(payslip => ({
        _id: `${empId}_${payslip.month}_${payslip.year}`,
        empId,
        empName: employee.empName,
        ...payslip.toObject()
      }));
      
      res.status(200).json({
        success: true,
        data: payslips,
        count: payslips.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getPayslipsByMonth(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Fetching payslips by month for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { month, year } = req.query;
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (isNaN(monthNum) || isNaN(yearNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid month or year",
        });
      }
      
      const employees = await CompanyPayroll.find();
      const payslips = [];
      
      employees.forEach(employee => {
        const payslip = employee.payslips.find(
          p => p.month === monthNum && p.year === yearNum
        );
        
        if (payslip) {
          payslips.push({
            _id: `${employee.empId}_${monthNum}_${yearNum}`,
            empId: employee.empId,
            empName: employee.empName,
            ...payslip.toObject()
          });
        }
      });
      
      res.status(200).json({
        success: true,
        data: payslips,
        count: payslips.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllPayslips(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Fetching all payslips for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const employees = await CompanyPayroll.find();
      const payslips = [];
      
      employees.forEach(employee => {
        employee.payslips.forEach(payslip => {
          payslips.push({
            _id: `${employee.empId}_${payslip.month}_${payslip.year}`,
            empId: employee.empId,
            empName: employee.empName,
            ...payslip.toObject()
          });
        });
      });
      
      res.status(200).json({
        success: true,
        data: payslips,
        count: payslips.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

    static async calculateBaseAfterDeductions(req, res) {
    try {
      // Get company code from authenticated user
      const companyCode = req.companyCode;
      
      if (!companyCode) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          message: 'Company code not found in request' 
        });
      }
      
      console.log(`Calculating base after deductions for company: ${companyCode}`);
      
      // Get company-specific UnifiedPayroll model
      const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
      
      const { empId } = req.params;
      
      const employee = await CompanyPayroll.findOne({ empId });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      
      // Calculate total deductions
      const activeDeductions = employee.deductions.filter(d => d.status === "Active");
      let totalDeductionAmount = 0;
      
      activeDeductions.forEach(deduction => {
        if (deduction.isFixedAmount || deduction.percentage === 0) {
          totalDeductionAmount += parseFloat(deduction.amount);
        } else {
          totalDeductionAmount += (employee.basicPay * (deduction.percentage / 100));
        }
      });
      
      // Calculate base after deductions
      const baseAfterDeductions = employee.basicPay - totalDeductionAmount;
      
      // Calculate attendance adjusted base
      const attendanceRatio = (employee.payableDays - employee.lop) / employee.payableDays;
      const attendanceAdjustedBase = baseAfterDeductions * attendanceRatio;
      
      res.status(200).json({
        success: true,
        data: {
          empId: employee.empId,
          basicPay: employee.basicPay,
          totalDeductions: totalDeductionAmount,
          baseAfterDeductions,
          attendanceAdjustedBase,
          attendanceRatio
        },
        message: "Base after deductions calculated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


// Update the getUserPayslips method to handle missing user info better
static async getUserPayslips(req, res) {
  try {
    const companyCode = req.companyCode;
    const userId = req.userId || req.user?._id?.toString();
    const userEmail = req.userEmail || req.user?.email;
    
    console.log("PayrollController - getUserPayslips called with:", {
      companyCode,
      userId,
      userEmail,
      hasUser: !!req.user
    });
    
    if (!companyCode) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    if (!userId) {
      console.error("No userId found in request. req.user:", req.user);
      return res.status(401).json({
        success: false,
        message: 'User authentication required. Please login again.'
      });
    }
    
    console.log(`Fetching user payslips for company: ${companyCode}, user: ${userId}, email: ${userEmail}`);
    
    // Get company-specific UnifiedPayroll model
    const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
    
    // Get query parameters for filtering
    const { month, year } = req.query;
    
    // Find employee by userId or email
    const employee = await CompanyPayroll.findByUser(userId, userEmail);

    if (!employee) {
      return res.status(200).json({
        success: true,
        needsLinking: true,
        message: "Your account is not linked to an employee record. Please contact HR to link your account.",
        data: {
          payslips: [],
          employee: null
        }
      });
    }
    
    // Filter payslips based on query parameters
    let filteredPayslips = employee.payslips || [];
    
    if (month && !isNaN(parseInt(month))) {
      filteredPayslips = filteredPayslips.filter(p => p.month === parseInt(month));
    }
    
    if (year && !isNaN(parseInt(year))) {
      filteredPayslips = filteredPayslips.filter(p => p.year === parseInt(year));
    }
    
    // Sort payslips by date (newest first)
    filteredPayslips.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    // Map payslips to include virtual ID and all necessary data
    const payslipsWithId = filteredPayslips.map(payslip => {
      // Calculate allowances and deductions for display
      const activeAllowances = employee.allowances.filter(a => a.status === 'Active');
      const activeDeductions = employee.deductions.filter(d => d.status === 'Active');
      
      return {
        _id: `${employee.empId}_${payslip.month}_${payslip.year}`,
        month: payslip.month,
        year: payslip.year,
        generatedDate: payslip.generatedDate,
        grossSalary: payslip.grossSalary,
        totalDeductions: payslip.totalDeductions,
        netSalary: payslip.netSalary,
                status: payslip.status || 'Generated',
        allowances: activeAllowances.map(a => ({
          name: a.name,
          amount: a.amount,
          percentage: a.percentage
        })),
        deductions: activeDeductions.map(d => ({
          name: d.name,
          amount: d.amount,
          percentage: d.percentage,
          isFixedAmount: d.isFixedAmount
        })),
        basicPay: employee.basicPay,
        lopDays: employee.lop || 0,
        payableDays: employee.payableDays || 30,
        workingDays: (employee.payableDays || 30) - (employee.lop || 0)
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        payslips: payslipsWithId,
        employee: {
          empId: employee.empId,
          empName: employee.empName,
          department: employee.department,
          designation: employee.designation,
          workEmail: employee.workEmail || employee.userEmail,
          // email: employee.email || employee.userEmail,
          bankName: employee.bankName,
          bankAccountNo: employee.bankAccountNo,
          pfNo: employee.pfNo,
          uanNo: employee.uanNo,
          panNo: employee.panNo,
          joiningDate: employee.joiningDate
        }
      },
      count: payslipsWithId.length,
    });
  } catch (error) {
    console.error('Error fetching user payslips:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching payslips',
      error: error.message
    });
  }
}

// Update downloadUserPayslip method with better error handling
static async downloadUserPayslip(req, res) {
  try {
    const companyCode = req.companyCode;
    const userId = req.userId || req.user?._id?.toString();
    const userEmail = req.userEmail || req.user?.email;
    const token = req.headers.authorization?.split(' ')[1];
    
    console.log("PayrollController - downloadUserPayslip called with:", {
      companyCode,
      userId,
      userEmail,
      hasToken: !!token
    });
    
    if (!companyCode) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    if (!userId) {
      console.error("No userId found in request for download. req.user:", req.user);
      return res.status(401).json({
        success: false,
        message: 'User authentication required for download. Please login again.'
      });
    }
    
    console.log(`Downloading user payslip for company: ${companyCode}, user: ${userId}`);
    
    const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
    
    const { payslipId } = req.params;
    console.log('Payslip ID received:', payslipId);
    
    if (!payslipId || !payslipId.includes('_')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payslip ID format'
      });
    }
    
    const [empId, month, year] = payslipId.split('_');
    console.log('Parsed payslip details:', { empId, month, year });
    
    if (!empId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payslip ID - missing components'
      });
    }
    
    // Find employee by userId/email and verify empId matches
    const employee = await CompanyPayroll.findByEmpIdAndUser(empId, userId, userEmail);
    
    if (!employee) {
      console.log(`Access denied: Employee ${empId} not found or doesn't belong to user ${userId}`);
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only download your own payslips.",
      });
    }
    
    const payslip = employee.payslips.find(
      p => p.month === parseInt(month) && p.year === parseInt(year)
    );
    
    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: "Payslip not found for the specified month and year",
      });
    }
    
    // Check if PDF exists, if not regenerate
    if (!payslip.pdfPath || !fs.existsSync(payslip.pdfPath)) {
      console.log(`PDF file not found at ${payslip.pdfPath || 'undefined'}, regenerating...`);
      
      try {
        // Regenerate PDF logic
        const activeAllowances = employee.allowances.filter(a => a.status === "Active");
        const activeDeductions = employee.deductions.filter(d => d.status === "Active");
        
        const basicPay = employee.basicPay;
        const payableDays = employee.payableDays || 30;
        const lopDays = employee.lop || 0;
        const perDayPay = basicPay / payableDays;
        const actualPayableDays = payableDays - lopDays;
        const attendanceRatio = actualPayableDays / payableDays;
        
        // Calculate deductions
        let totalDeductionAmount = 0;
        const deductionsWithAmounts = activeDeductions.map(deduction => {
          let amount;
          if (deduction.isFixedAmount || deduction.percentage === 0) {
            amount = deduction.amount;
            totalDeductionAmount += amount;
            return {
              name: deduction.name,
              amount,
              percentage: deduction.percentage,
              isFixedAmount: true
            };
          } else {
            amount = basicPay * (deduction.percentage / 100);
            totalDeductionAmount += amount;
            return {
              name: deduction.name,
              amount,
              percentage: deduction.percentage,
              isFixedAmount: false
            };
          }
        });
        
        const baseAfterDeductions = basicPay - totalDeductionAmount;
        const attendanceAdjustedBase = baseAfterDeductions * attendanceRatio;
        
        // Calculate allowances
        let totalAllowanceAmount = 0;
        const allowancesWithAmounts = activeAllowances.map(allowance => {
          const amount = attendanceAdjustedBase * (allowance.percentage / 100);
          totalAllowanceAmount += amount;
          
          return {
            name: allowance.name,
            amount,
            percentage: allowance.percentage,
            isBasicPay: allowance.isBasicPay || allowance.name === "BASIC PAY"
          };
        });
        
        const netSalary = totalAllowanceAmount;
        
        const payslipData = {
          empId: employee.empId,
          empName: employee.empName,
          department: employee.department,
          designation: employee.designation,
          pfNo: employee.pfNo,
          uanNo: employee.uanNo,
          panNo: employee.panNo,
          month: parseInt(month),
          year: parseInt(year),
          basicPay,
          payableDays,
          lopDays,
          workingDays: payableDays,
          dateOfJoining: employee.joiningDate,
          bankDetails: {
            bankName: employee.bankName,
            accountNo: employee.bankAccountNo,
          },
          allowances: allowancesWithAmounts,
          deductions: deductionsWithAmounts,
          baseAfterDeductions,
          attendanceAdjustedBase,
          grossSalary: totalAllowanceAmount,
          totalDeductions: totalDeductionAmount,
          netSalary,
          lopImpact: {
            totalPayBeforeLOP: basicPay,
            lopDeduction: basicPay - (perDayPay * actualPayableDays),
            lopPercentage: (lopDays / payableDays) * 100
          }
        };
        
        // Regenerate PDF
        const pdfPath = await PayrollPDFService.generatePayslipPDF(
          {
            ...payslipData,
            _id: payslipId
          },
          token,
          companyCode
        );
        
        // Update payslip record
        payslip.pdfPath = pdfPath;
        await employee.save();
        
        console.log('PDF regenerated successfully:', pdfPath);
        
        // Set proper headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="payslip_${empId}_${month}_${year}.pdf"`);
        
        return res.download(pdfPath, `payslip_${empId}_${month}_${year}.pdf`, (err) => {
          if (err) {
            console.error('Error downloading regenerated PDF:', err);
            res.status(500).json({
              success: false,
              message: 'Error downloading payslip file'
            });
          }
        });
      } catch (pdfError) {
        console.error('Error regenerating PDF:', pdfError);
        return res.status(500).json({
          success: false,
          message: 'Error generating payslip PDF'
        });
      }
    }
    
    // Download existing PDF
    console.log('Downloading existing PDF:', payslip.pdfPath);
    
    // Verify file exists before attempting download
    if (!fs.existsSync(payslip.pdfPath)) {
      return res.status(404).json({
        success: false,
        message: 'Payslip file not found on server'
      });
    }
    
    // Set proper headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip_${empId}_${month}_${year}.pdf"`);
    
    res.download(payslip.pdfPath, `payslip_${empId}_${month}_${year}.pdf`, (err) => {
      if (err) {
        console.error('Error downloading existing PDF:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading payslip file'
        });
      }
    });
  } catch (error) {
    console.error('Error downloading user payslip:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading payslip. Please try again.',
      error: error.message
    });
  }
}



// Add a new method to link user to employee
static async linkUserToEmployee(req, res) {
  try {
    const companyCode = req.companyCode;
    const userId = req.userId;
    const userEmail = req.userEmail;
    
    if (!companyCode) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { empId } = req.body;
    
    if (!empId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }
    
    console.log(`Linking user ${userId} to employee ${empId} for company: ${companyCode}`);
    
    const CompanyPayroll = await getModelForCompany(companyCode, 'UnifiedPayroll', unifiedPayrollSchema);
    
    // Find the employee
    const employee = await CompanyPayroll.findOne({ empId: empId });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check if employee is already linked to another user
    if (employee.isLinkedToUser && employee.userId && employee.userId.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'This employee is already linked to another user account'
      });
    }
    
    // Link the user to employee
    await employee.linkToUser(userId, userEmail);
    
    res.status(200).json({
      success: true,
      message: 'User successfully linked to employee',
      data: {
        empId: employee.empId,
        empName: employee.empName,
        department: employee.department,
        designation: employee.designation
      }
    });
  } catch (error) {
    console.error('Error linking user to employee:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}




} // End of PayrollController class

// Helper function for month names
function getMonthName(monthNumber) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || monthNumber;
}







 
  
