import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";
import {
  AppBar,
  Tabs,
  Tab,
  Box,
  Typography,
  Container,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
  Grid,
  Snackbar,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Fade,
  Checkbox,
  FormHelperText,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import SaveIcon from "@mui/icons-material/Save";
import Divider from "@mui/material/Divider";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PreviewIcon from "@mui/icons-material/Preview";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";

import "./Payrollsystem.css";
import { ApiOutlined } from "@mui/icons-material";

const API_URL = "/payroll";

const TabPanel = ({ children, value, index }) => (
  <div
    hidden={value !== index}
    style={{
      animation: value === index ? "fadeIn 0.5s ease-in-out" : "none",
      padding: "24px",
    }}
  >
    {value === index && (
      <Fade in={true} timeout={500}>
        <Box
          sx={{
            opacity: 1,
            transform: "translateY(0)",
            transition: "all 0.5s ease-in-out",
          }}
        >
          {children}
        </Box>
      </Fade>
    )}
  </div>
);
const PayrollSystem = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [employeeData, setEmployeeData] = useState([]);
  const [allowanceData, setAllowanceData] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeductionDialog, setOpenDeductionDialog] = useState(false);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
    transition: Fade,
  });

  // Add the isLoading state variable here
  const [isLoading, setIsLoading] = useState(false);

  // Add these state variables near your other state declarations
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Add these state variables near your other state declarations
  const [deleteAllowanceDialogOpen, setDeleteAllowanceDialogOpen] =
    useState(false);
  const [employeeToDeleteAllowances, setEmployeeToDeleteAllowances] =
    useState(null);

  // Add these state variables near your other state declarations
  const [selectedAllowances, setSelectedAllowances] = useState([]);
  const [bulkEmployeeId, setBulkEmployeeId] = useState("");
  const [allowancePercentages, setAllowancePercentages] = useState({});

  // Add these state variables for deductions similar to allowances
  const [selectedDeductions, setSelectedDeductions] = useState([]);
  const [showDeductionSection, setShowDeductionSection] = useState(false);

  // First, add a new state variable to track the LPA value
  const [lpaValue, setLpaValue] = useState("");

  // First, add state variables to track deduction eligibility
  const [isEligibleForDeductions, setIsEligibleForDeductions] = useState(false);
  const [manualDeductionAmounts, setManualDeductionAmounts] = useState({});
  const [deductionTypes, setDeductionTypes] = useState({}); // Add this new state variable
  // Add state for registered employees
  const [registeredEmployees, setRegisteredEmployees] = useState([]);
  const [selectedRegisteredEmployee, setSelectedRegisteredEmployee] =
    useState("");

  const handleDeductionSelection = (deductionType, isChecked) => {
    if (isChecked) {
      setSelectedDeductions([...selectedDeductions, deductionType]);
      // Initialize with default amount if not already set
      if (!manualDeductionAmounts[deductionType]) {
        setManualDeductionAmounts({
          ...manualDeductionAmounts,
          [deductionType]: 0,
        });
      }
    } else {
      setSelectedDeductions(
        selectedDeductions.filter((item) => item !== deductionType)
      );
    }
  };

  // Separate state variables for employee preview and allowance/deduction preview
  const [employeePreviewDialogOpen, setEmployeePreviewDialogOpen] =
    useState(false);
  const [allowancePreviewDialogOpen, setAllowancePreviewDialogOpen] =
    useState(false);
  const [previewEmployee, setPreviewEmployee] = useState(null);

  // Handler for opening employee preview
  const handleOpenEmployeePreview = (empId) => {
    const employee = employeeData.find((emp) => emp.empId === empId);
    if (employee) {
      setPreviewEmployee(employee);
      setEmployeePreviewDialogOpen(true);
    }
  };

  // Handler for closing employee preview
  const handleCloseEmployeePreview = () => {
    setEmployeePreviewDialogOpen(false);
    setPreviewEmployee(null);
  };

  // Handler for opening allowance/deduction preview
  const handleOpenAllowancePreview = (empId) => {
    // First close the dialog if it's already open to ensure fresh data
    if (allowancePreviewDialogOpen) {
      setAllowancePreviewDialogOpen(false);
    }

    // Fetch the latest data
    Promise.all([fetchAllowances(), fetchDeductions()]).then(() => {
      // Now set the employee and open the dialog with fresh data
      const employee = employeeData.find((emp) => emp.empId === empId);
      if (employee) {
        setPreviewEmployee(employee);
        setAllowancePreviewDialogOpen(true);
      }
    });
  };

  // Handler for closing allowance/deduction preview
  const handleCloseAllowancePreview = () => {
    setAllowancePreviewDialogOpen(false);
    setPreviewEmployee(null);
  };

  // Add this function to handle multiple allowance selection
  const handleAllowanceSelection = (allowanceType, isChecked) => {
    if (isChecked) {
      setSelectedAllowances([...selectedAllowances, allowanceType]);
      // Initialize with default percentage if not already set
      if (!allowancePercentages[allowanceType]) {
        setAllowancePercentages({
          ...allowancePercentages,
          [allowanceType]: 0,
        });
      }
    } else {
      setSelectedAllowances(
        selectedAllowances.filter((item) => item !== allowanceType)
      );
    }
  };

  // Add a handler for percentage changes
  const handlePercentageChange = (allowanceType, value) => {
    const percentage = Math.max(0, Math.min(100, Number(value)));
    setAllowancePercentages({
      ...allowancePercentages,
      [allowanceType]: percentage,
    });
  };

  // Modify the handleRegisteredEmployeeSelect function
  const handleRegisteredEmployeeSelect = (empId) => {
    if (!empId) {
      setSelectedRegisteredEmployee("");
      return;
    }

    setSelectedRegisteredEmployee(empId);

    // Find the selected employee
    const selectedEmp = registeredEmployees.find((emp) => emp.Emp_ID === empId);

    if (selectedEmp) {
      // Map the fields from registered employee to payroll employee
      const basicPay = selectedEmp.joiningDetails?.salary || 0;
      const lpa = (parseFloat(basicPay) * 12) / 100000;

      // Format the date of joining if it exists
      let formattedDateOfJoining = "";
      if (selectedEmp.joiningDetails?.dateOfJoining) {
        const dateObj = new Date(selectedEmp.joiningDetails.dateOfJoining);
        formattedDateOfJoining = dateObj.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      }

      // Get PAN, UAN, and PF numbers from the correct locations
      const panNo = selectedEmp.personalInfo?.panNumber || "";
      const uanNo = selectedEmp.joiningDetails?.uanNumber || "";
      const pfNo = selectedEmp.joiningDetails?.pfNumber || "";

      // Get bank information
      const bankName = selectedEmp.bankInfo?.bankName || "";
      const bankAccountNo = selectedEmp.bankInfo?.accountNumber || "";

      setNewEmployee({
        ...newEmployee,
        empId: selectedEmp.Emp_ID || "",
        empName: `${selectedEmp.personalInfo?.firstName || ""} ${
          selectedEmp.personalInfo?.lastName || ""
        }`,
        department: selectedEmp.joiningDetails?.department || "",
        designation: selectedEmp.joiningDetails?.initialDesignation || "",
        email: selectedEmp.personalInfo?.email || "",
        basicPay: basicPay,
        dateOfJoining: formattedDateOfJoining,
        // Add the PAN, UAN, and PF numbers from the correct locations
        panNo: panNo,
        uanNo: uanNo,
        pfNo: pfNo,
        // Add bank information
        bankName: bankName,
        bankAccountNo: bankAccountNo,
        // Keep other fields as they are since they might not have direct mappings
      });

      setLpaValue(lpa.toFixed(2));

      showAlert("Employee data loaded successfully", "success");
    }
  };

  const handleAddMultipleAllowances = async () => {
    try {
      // First validate the allowance percentages if any allowances are selected
      if (selectedAllowances.length > 0) {
        const shouldProceed = validateAllowancePercentages();
        if (!shouldProceed) {
          return; // User chose not to proceed
        }
      }
      setIsLoading(true);

      // Show loading indicator
      setAlert({
        open: true,
        message: "Processing, please wait...",
        severity: "info",
        transition: Fade,
      });

      if (
        !bulkEmployeeId ||
        (selectedAllowances.length === 0 && selectedDeductions.length === 0)
      ) {
        showAlert(
          "Please select an employee and at least one allowance or deduction",
          "error"
        );
        setIsLoading(false);
        return;
      }

      const employee = employeeData.find((e) => e.empId === bulkEmployeeId);
      if (!employee) {
        showAlert("Invalid employee selected", "error");
        setIsLoading(false);
        return;
      }

      // In edit mode, we need to handle updates differently
      if (editMode) {
        // First, get current allowances and deductions
        const currentAllowances = allowanceData.filter(
          (a) => a.empId === bulkEmployeeId && a.status === "Active"
        );
        const currentDeductions = deductions.filter(
          (d) => d.empId === bulkEmployeeId && d.status === "Active"
        );

        // For allowances: update existing ones and add new ones
        for (const allowanceName of selectedAllowances) {
          const percentage = parseFloat(
            allowancePercentages[allowanceName] || 0
          );
          const amount = calculateAllowanceAmount(
            employee.basicPay,
            percentage
          ).toString();

          const existingAllowance = currentAllowances.find(
            (a) => a.name === allowanceName
          );

          if (existingAllowance) {
            // Update existing allowance
            const id = `${bulkEmployeeId}_${allowanceName}`;
            await api.put(`${API_URL}/allowances/${id}`, {
              empId: bulkEmployeeId,
              name: allowanceName,
              percentage,
              amount,
              category: existingAllowance.category || "Regular",
              status: "Active",
              isRecurring: true,
            });
          } else {
            // Add new allowance
            await api.post(`${API_URL}/allowances`, {
              empId: bulkEmployeeId,
              name: allowanceName,
              percentage,
              amount,
              category: "Regular",
              status: "Active",
              isRecurring: true,
            });
          }
        }

        // For deductions: update existing ones and add new ones
        for (const deductionName of selectedDeductions) {
          const amount = parseFloat(
            manualDeductionAmounts[deductionName] || 0
          ).toString();

          const existingDeduction = currentDeductions.find(
            (d) => d.name === deductionName
          );

          if (existingDeduction) {
            // Update existing deduction
            const id = `${bulkEmployeeId}_${deductionName}`;
            await api.put(`${API_URL}/deductions/${id}`, {
              empId: bulkEmployeeId,
              name: deductionName,
              percentage: 0, // Always 0 for fixed amounts
              amount,
              category: existingDeduction.category || "Tax",
              status: "Active",
              isRecurring: true,
              isFixedAmount: true,
            });
          } else {
            // Add new deduction
            await api.post(`${API_URL}/deductions`, {
              empId: bulkEmployeeId,
              name: deductionName,
              percentage: 0, // Always 0 for fixed amounts
              amount,
              category: "Tax",
              status: "Active",
              isRecurring: true,
              isFixedAmount: true,
            });
          }
        }

        showAlert(`Successfully updated allowances and deductions`);
      } else {
        // Process allowances in add mode
        for (const allowanceName of selectedAllowances) {
          const percentage = parseFloat(
            allowancePercentages[allowanceName] || 0
          );
          const amount = calculateAllowanceAmount(
            employee.basicPay,
            percentage
          ).toString();

          try {
            await api.post(`${API_URL}/allowances`, {
              empId: bulkEmployeeId,
              name: allowanceName,
              percentage,
              amount,
              category: "Regular",
              status: "Active",
              isRecurring: true,
            });
          } catch (error) {
            console.error(`Error adding allowance ${allowanceName}:`, error);
            showAlert(`Error adding allowance ${allowanceName}`, "error");
          }
        }

        // Process deductions in add mode
        if (selectedDeductions.length > 0) {
          for (const deductionName of selectedDeductions) {
            // Use manual amount directly
            const amount = parseFloat(
              manualDeductionAmounts[deductionName] || 0
            ).toString();

            try {
              await api.post(`${API_URL}/deductions`, {
                empId: bulkEmployeeId,
                name: deductionName,
                percentage: 0, // Always 0 for fixed amounts
                amount,
                category: "Tax",
                status: "Active",
                isRecurring: true,
                isFixedAmount: true,
              });
            } catch (error) {
              console.error(`Error adding deduction ${deductionName}:`, error);
              showAlert(`Error adding deduction ${deductionName}`, "error");
            }
          }
        }

        showAlert(`Successfully added allowances and deductions`);
      }

      // Refresh the data after adding/updating allowances and deductions
      await Promise.all([fetchAllowances(), fetchDeductions()]);
      handleCloseDialog();
      setIsLoading(false);
    } catch (error) {
      console.error("Error in handleAddMultipleAllowances:", error);
      showAlert(
        error.response?.data?.message ||
          "Error saving allowances and deductions",
        "error"
      );
      setIsLoading(false);
    }
  };

  const confirmDeleteAllowancesAndDeductions = async () => {
    try {
      if (!employeeToDeleteAllowances) return;

      // First delete all allowances for this employee
      const employeeAllowances = allowanceData.filter(
        (a) => a.empId === employeeToDeleteAllowances.empId
      );

      for (const allowance of employeeAllowances) {
        const id = `${allowance.empId}_${allowance.name}`;
        await api.delete(`${API_URL}/allowances/${id}`);
      }

      // Then delete all deductions for this employee
      const employeeDeductions = deductions.filter(
        (d) => d.empId === employeeToDeleteAllowances.empId
      );

      for (const deduction of employeeDeductions) {
        const id = `${deduction.empId}_${deduction.name}`;
        await api.delete(`${API_URL}/deductions/${id}`);
      }

      showAlert("Allowances and deductions deleted successfully");
      await Promise.all([fetchAllowances(), fetchDeductions()]);
      setDeleteAllowanceDialogOpen(false);
      setEmployeeToDeleteAllowances(null);
    } catch (error) {
      showAlert(
        error.response?.data?.message ||
          "Error deleting allowances and deductions",
        "error"
      );
    }
  };

  const validateAllowancePercentages = () => {
    // Calculate total percentage
    const totalPercentage = Object.values(allowancePercentages).reduce(
      (sum, percentage) => sum + parseFloat(percentage || 0),
      0
    );

    // Define a small tolerance (e.g., 0.1%)
    const tolerance = 0.1;

    // Check if total is within acceptable range (99.9% to 100.1%)
    if (
      totalPercentage < 100 - tolerance ||
      totalPercentage > 100 + tolerance
    ) {
      // Show alert with option to proceed anyway
      const message =
        totalPercentage > 100 + tolerance
          ? `Warning: Total allowance percentage (${totalPercentage.toFixed(
              2
            )}%) exceeds 100%. This may result in incorrect calculations.`
          : `Warning: Total allowance percentage (${totalPercentage.toFixed(
              2
            )}%) is less than 100%. Some of the employee's pay will not be allocated.`;

      // Use the browser's confirm dialog to allow the user to proceed anyway
      return window.confirm(`${message}\n\nDo you want to proceed anyway?`);
    }

    // If total is within acceptable range, no alert needed
    return true;
  };

  const isPercentageWithinRange = (percentage) => {
    const tolerance = 0.1;
    return percentage >= 100 - tolerance && percentage <= 100 + tolerance;
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      employeeData.map((emp) => {
        const lpa = ((parseFloat(emp.basicPay) * 12) / 100000).toFixed(2);
        return {
          "Employee ID": emp.empId,
          Name: emp.empName,
          Department: emp.department,
          Designation: emp.designation,
          "Total Pay (Monthly)": parseFloat(emp.basicPay).toFixed(2),
          "Annual Salary (LPA)": lpa,
          "Bank Name": emp.bankName,
          "Bank Account No": emp.bankAccountNo,
          "PF Number": emp.pfNo,
          "UAN Number": emp.uanNo,
          "PAN Number": emp.panNo,
          "Payable Days": emp.payableDays,
          "LOP Days": emp.lop,
          Status: emp.status,
        };
      })
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, "employees.xlsx");
  };

  const importFromExcel = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) {
        showAlert("No file selected", "error");
        return;
      }

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate and format each row before sending to API
          const validEmployees = jsonData
            .map((row) => {
              // Check if we have LPA or monthly basic pay
              let basicPay;
              if (row["Annual Salary (LPA)"]) {
                // Convert LPA to monthly
                basicPay =
                  (parseFloat(row["Annual Salary (LPA)"]) * 100000) / 12;
              } else {
                basicPay = parseFloat(row["Basic Pay (Monthly)"]) || 0;
              }

              return {
                empId: String(row["Employee ID"] || "").trim(),
                empName: String(row["Name"] || "").trim(),
                department: String(row["Department"] || "").trim(),
                designation: String(row["Designation"] || "").trim(),
                basicPay: basicPay,
                bankName: String(row["Bank Name"] || "").trim(),
                bankAccountNo: String(row["Bank Account No"] || "").trim(),
                pfNo: String(row["PF Number"] || "").trim(),
                uanNo: String(row["UAN Number"] || "").trim(),
                panNo: String(row["PAN Number"] || "").trim(),
                payableDays: parseInt(row["Payable Days"]) || 30,
                lop: parseFloat(row["LOP Days"]) || 0,
                status: "Active",
                email: row["Email"] || "",
              };
            })
            .filter((emp) => emp.empId && emp.empName && emp.basicPay > 0);

          if (validEmployees.length === 0) {
            showAlert("No valid employee data found in Excel file", "error");
            return;
          }

          // Show loading message
          showAlert(`Importing ${validEmployees.length} employees...`, "info");

          // Try individual employee creation instead of bulk
          let successCount = 0;
          for (const employee of validEmployees) {
            try {
              // Use the single employee creation endpoint instead of bulk
              await api.post(`${API_URL}/employees`, employee);
              successCount++;
            } catch (err) {
              console.error(
                `Failed to import employee ${employee.empId}:`,
                err
              );
              // Continue with the next employee
            }
          }

          // Clear the file input
          event.target.value = "";

          // Refresh all data
          await fetchEmployees();

          if (successCount > 0) {
            showAlert(
              `Successfully imported ${successCount} out of ${validEmployees.length} employees`
            );
          } else {
            showAlert("Failed to import any employees", "error");
          }
        } catch (error) {
          console.error("Error processing Excel file:", error);
          showAlert(
            error.response?.data?.message || "Error processing Excel file",
            "error"
          );
          // Clear the file input
          event.target.value = "";
        }
      };

      reader.onerror = () => {
        showAlert("Error reading file", "error");
        event.target.value = "";
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Import error:", error);
      showAlert(
        "Import failed: " + (error.response?.data?.message || error.message),
        "error"
      );
      // Clear the file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const [newEmployee, setNewEmployee] = useState({
    empId: "",
    empName: "",
    basicPay: "",
    bankName: "",
    bankAccountNo: "",
    pfNo: "",
    uanNo: "",
    panNo: "",
    payableDays: 30,
    lop: 0.0,
    department: "",
    designation: "",
    email: "",
    dateOfJoining: "",
    status: "Active",
  });

  const [newAllowance, setNewAllowance] = useState({
    empId: "",
    name: "",
    amount: "",
    percentage: 0,
    category: "Regular",
    status: "Active",
    description: "",
    isRecurring: true,
  });

  const [newDeduction, setNewDeduction] = useState({
    empId: "",
    name: "",
    amount: "",
    percentage: 0,
    category: "Tax",
    status: "Active",
    description: "",
    isRecurring: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchEmployees(),
          fetchAllowances(),
          fetchDeductions(),
          fetchPayslips(),
          fetchRegisteredEmployees(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        showAlert(
          "Error fetching data. Please try refreshing the page.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [tabIndex]); // Re-fetch when tab changes

  // Add this after your existing useEffect hooks
  useEffect(() => {
    if (bulkEmployeeId) {
      const employee = employeeData.find((e) => e.empId === bulkEmployeeId);
      setIsEligibleForDeductions(!!employee);
    } else {
      setIsEligibleForDeductions(false);
    }
  }, [bulkEmployeeId, employeeData]);

  // Helper functions for calculations
  const calculatePerDayPay = (basicPay, payableDays) => {
    const pay = parseFloat(basicPay) || 0;
    const days = parseFloat(payableDays) || 30;
    return Number((pay / days).toFixed(2));
  };

  const calculateAttendanceBasedPay = (basicPay, payableDays, lop) => {
    const perDayPay = calculatePerDayPay(basicPay, payableDays);
    const actualPayableDays =
      (parseFloat(payableDays) || 30) - (parseFloat(lop) || 0);
    return Number((perDayPay * actualPayableDays).toFixed(2));
  };

  // Update the calculateBaseAfterDeductions function to handle only fixed amount deductions
  const calculateBaseAfterDeductions = (empId) => {
    const employee = employeeData.find((e) => e.empId === empId);
    if (!employee) return 0;

    // Start with the total pay
    const totalPay = parseFloat(employee.basicPay);

    // Calculate total deductions - now only fixed amounts
    const totalDeductions = deductions
      .filter((d) => d.empId === empId && d.status === "Active")
      .reduce((sum, item) => {
        return sum + parseFloat(item.amount || 0);
      }, 0);

    // Return the base after deductions
    return totalPay - totalDeductions;
  };

  // Update the allowance amount calculation with attendance adjustment and proportional deduction distribution
  const calculateAllowanceAmount = (empId, percentage) => {
    const employee = employeeData.find((e) => e.empId === empId);
    if (!employee) return 0;

    // Get all active allowances for this employee
    const activeAllowances = allowanceData.filter(
      (a) => a.empId === empId && a.status === "Active"
    );

    // Calculate total allowance percentage
    const totalAllowancePercentage = activeAllowances.reduce(
      (sum, allowance) => sum + parseFloat(allowance.percentage || 0),
      0
    );

    // Get all fixed amount deductions for this employee
    const fixedDeductions = deductions.filter(
      (d) =>
        d.empId === empId &&
        d.status === "Active" &&
        d.percentage === 0 &&
        parseFloat(d.amount) > 0
    );

    // Calculate total fixed deduction amount
    const totalFixedDeductionAmount = fixedDeductions.reduce(
      (sum, deduction) => sum + parseFloat(deduction.amount || 0),
      0
    );

    // Calculate the base pay after percentage-based deductions
    const baseAfterPercentageDeductions =
      calculateBaseAfterDeductions(empId) + totalFixedDeductionAmount;

    // Calculate this allowance's proportion of the total allowance percentage
    const allowanceProportion = percentage / totalAllowancePercentage;

    // Calculate the amount for this allowance based on its percentage of the base pay
    const allowanceAmount = baseAfterPercentageDeductions * (percentage / 100);

    // Calculate the proportional fixed deduction amount for this allowance
    const fixedDeductionForAllowance =
      totalFixedDeductionAmount * allowanceProportion;

    // Subtract the proportional fixed deduction
    const adjustedAllowanceAmount =
      allowanceAmount - fixedDeductionForAllowance;

    // Apply attendance adjustment
    const attendanceRatio =
      (employee.payableDays - employee.lop) / employee.payableDays;

    return adjustedAllowanceAmount * attendanceRatio;
  };

  // Add this function for calculating allowance amount in the summary section
  const calculateEstimatedAllowanceAmount = (employee, percentage) => {
    if (!employee) return 0;
    const basicPay = parseFloat(employee.basicPay) || 0;
    return (basicPay * percentage) / 100;
  };

  const calculateDeductionAmount = (basicPay, percentage) => {
    const pay = parseFloat(basicPay) || 0;
    const pct = parseFloat(percentage) || 0;
    return Number(((pay * pct) / 100).toFixed(2));
  };

  const calculateGrossSalary = (empId) => {
    const employee = employeeData.find((e) => e.empId === empId);
    if (!employee) return 0;

    // Calculate base after deductions
    const baseAfterDeductions = calculateBaseAfterDeductions(empId);

    // Apply attendance adjustment to the base
    const attendanceRatio =
      (employee.payableDays - employee.lop) / employee.payableDays;
    const attendanceAdjustedBase = baseAfterDeductions * attendanceRatio;

    // Calculate total allowances only (don't add the base separately)
    const totalAllowances = allowanceData
      .filter((a) => a.empId === empId && a.status === "Active")
      .reduce((sum, item) => {
        return sum + calculateAllowanceAmount(empId, item.percentage);
      }, 0);

    return Number(totalAllowances.toFixed(2));
  };

  const calculateTotalDeductions = (empId) => {
    const employee = employeeData.find((e) => e.empId === empId);
    if (!employee) return 0;

    return deductions
      .filter((d) => d.empId === empId && d.status === "Active")
      .reduce((sum, item) => {
        // Check if this is a fixed amount deduction
        if (item.percentage === 0 && parseFloat(item.amount) > 0) {
          return sum + parseFloat(item.amount);
        } else {
          // Calculate based on percentage of total pay
          return (
            sum + calculateDeductionAmount(employee.basicPay, item.percentage)
          );
        }
      }, 0);
  };

  const calculateNetSalary = (empId) => {
    // For net salary, we start with the base after deductions
    const baseAfterDeductions = calculateBaseAfterDeductions(empId);

    // Apply attendance adjustment
    const employee = employeeData.find((e) => e.empId === empId);
    if (!employee) return 0;

    const attendanceRatio =
      (employee.payableDays - employee.lop) / employee.payableDays;
    const attendanceAdjustedBase = baseAfterDeductions * attendanceRatio;

    // Calculate total allowances with attendance adjustment
    const totalAllowances = allowanceData
      .filter((a) => a.empId === empId && a.status === "Active")
      .reduce((sum, item) => {
        return sum + calculateAllowanceAmount(empId, item.percentage);
      }, 0);

    // Net salary = Total Allowances (since deductions are already applied in calculateAllowanceAmount)
    return Number(totalAllowances.toFixed(2));
  };

  const handleLOPChange = (e) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setNewEmployee({ ...newEmployee, lop: 0 });
      return;
    }
    const roundedValue = Math.round(value * 2) / 2;
    setNewEmployee({ ...newEmployee, lop: roundedValue });
  };

  // Handle LPA input change
  const handleLPAChange = (e) => {
    const lpaValue = parseFloat(e.target.value);
    setLpaValue(lpaValue);

    // Convert LPA to monthly basic pay
    if (!isNaN(lpaValue)) {
      const monthlyPay = (lpaValue * 100000) / 12;
      setNewEmployee({
        ...newEmployee,
        basicPay: monthlyPay.toFixed(2),
      });
    }
  };

  // API Calls and CRUD Operations
  const showAlert = (message, severity = "success") => {
    setAlert({
      open: true,
      message,
      severity,
      transition: Fade,
    });
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get(`${API_URL}/employees`);
      console.log("Employee data received:", response.data.data);
      setEmployeeData(response.data.data);
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Error fetching employees",
        "error"
      );
    }
  };

  const fetchAllowances = async () => {
    try {
      console.log("Fetching allowances...");
      const response = await api.get(`${API_URL}/allowances`);
      console.log("Allowances fetched:", response.data.data.length);
      setAllowanceData(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching allowances:", error);
      showAlert(
        error.response?.data?.message || "Error fetching allowances",
        "error"
      );
      return [];
    }
  };

  const fetchDeductions = async () => {
    try {
      console.log("Fetching deductions...");
      const response = await api.get(`${API_URL}/deductions`);
      console.log("Deductions fetched:", response.data.data.length);
      setDeductions(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching deductions:", error);
      showAlert(
        error.response?.data?.message || "Error fetching deductions",
        "error"
      );
      return [];
    }
  };

  const fetchPayslips = async () => {
    try {
      const response = await api.get(`${API_URL}/payslips`);
      if (response.data.success) {
        setPayslips(response.data.data);
      } else {
        showAlert("Failed to fetch payslips", "error");
      }
    } catch (error) {
      console.error("Error fetching payslips:", error);
      // If the endpoint doesn't exist yet, don't show an error to the user
      // Just set an empty array
      setPayslips([]);
    }
  };

  const fetchRegisteredEmployees = async () => {
    try {
      const response = await api.get("/employees/registered");
      setRegisteredEmployees(response.data);
    } catch (error) {
      console.error("Error fetching registered employees:", error);
      // Don't show an error alert to avoid confusing users if this is optional
      setRegisteredEmployees([]);
    }
  };

  const confirmDeleteEmployee = async () => {
    try {
      if (!employeeToDelete) return;

      await api.delete(`${API_URL}/employees/${employeeToDelete.empId}`);
      showAlert("Employee deleted successfully");
      await Promise.all([
        fetchEmployees(),
        fetchAllowances(),
        fetchDeductions(),
      ]);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Error deleting employee",
        "error"
      );
    }
  };

  const handleDeleteEmployee = async (empId) => {
    try {
      await api.delete(`${API_URL}/employees/${empId}`);
      showAlert("Employee deleted successfully");
      await Promise.all([
        fetchEmployees(),
        fetchAllowances(),
        fetchDeductions(),
      ]);
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Error deleting employee",
        "error"
      );
    }
  };

  const handleAddEmployee = async () => {
    try {
      if (!newEmployee.empId || !newEmployee.empName || !newEmployee.basicPay) {
        showAlert("Please fill all required fields", "error");
        return;
      }
      // Format the date properly
      const formattedDate = newEmployee.dateOfJoining
        ? new Date(newEmployee.dateOfJoining).toISOString()
        : null;

      const payload = {
        ...newEmployee,
        basicPay: parseFloat(newEmployee.basicPay),
        payableDays: parseInt(newEmployee.payableDays),
        lop: parseFloat(newEmployee.lop),
        dateOfJoining: formattedDate, // Use the formatted date
      };

      if (editMode && selectedItem) {
        await api.put(`${API_URL}/employees/${selectedItem.empId}`, payload);
        showAlert("Employee updated successfully");
      } else {
        await api.post(`${API_URL}/employees`, payload);
        showAlert("Employee added successfully");
      }
      await fetchEmployees();
      handleCloseEmployeeDialog();
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Error saving employee",
        "error"
      );
    }
  };

  const handleAddAllowance = async () => {
    try {
      if (
        !newAllowance.empId ||
        !newAllowance.name ||
        !newAllowance.percentage
      ) {
        showAlert("Please fill all required fields", "error");
        return;
      }

      const employee = employeeData.find((e) => e.empId === newAllowance.empId);
      if (!employee) {
        showAlert("Invalid employee selected", "error");
        return;
      }

      // Calculate the amount based on the percentage of basic pay
      const calculatedAmount = calculateAllowanceAmount(
        employee.empId,
        newAllowance.percentage
      );

      const payload = {
        empId: newAllowance.empId,
        name: newAllowance.name,
        amount: calculatedAmount.toString(),
        percentage: parseFloat(newAllowance.percentage),
        category: newAllowance.category || "Regular",
        status: newAllowance.status || "Active",
        isRecurring: true,
      };

      if (editMode && selectedItem) {
        // For edit mode, we need to use the virtual ID format: empId_allowanceName
        const id = `${selectedItem.empId}_${selectedItem.name}`;
        await api.put(`${API_URL}/allowances/${id}`, payload);
        showAlert("Allowance updated successfully");
      } else {
        await api.post(`${API_URL}/allowances`, payload);
        showAlert("Allowance added successfully");
      }

      await fetchAllowances();
      handleCloseDialog();
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Error saving allowance",
        "error"
      );
    }
  };

  const handleCloseEmployeeDialog = () => {
    setOpenEmployeeDialog(false);
    setEditMode(false);
    setSelectedItem(null);
    setSelectedRegisteredEmployee(""); // Reset the selected registered employee
    setLpaValue(""); // Reset LPA value
    setNewEmployee({
      empId: "",
      empName: "",
      basicPay: "",
      bankName: "",
      bankAccountNo: "",
      pfNo: "",
      uanNo: "",
      panNo: "",
      payableDays: 30,
      lop: 0,
      department: "",
      designation: "",
      email: "",
      status: "Active",
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedItem(null);
    setSelectedAllowances([]);
    setAllowancePercentages({});
    setBulkEmployeeId("");
    setSelectedDeductions([]);
    setManualDeductionAmounts({});
    setIsEligibleForDeductions(false);
    setShowDeductionSection(false); // Reset the checkbox
    setIsLoading(false);
    setNewAllowance({
      empId: "",
      name: "",
      amount: "",
      percentage: 0,
      category: "Regular",
      status: "Active",
      description: "",
      isRecurring: true,
    });
  };

  const generatePayslip = async (empId) => {
    try {
      const employee = employeeData.find((e) => e.empId === empId);
      if (!employee) {
        showAlert("Employee not found", "error");
        return null;
      }

      // Log the employee data to see if dateOfJoining exists
      console.log("Employee data for payslip:", employee);

      // Calculate attendance-adjusted pay
      const attendanceAdjustedPay = calculateAttendanceBasedPay(
        employee.basicPay,
        employee.payableDays,
        employee.lop
      );

      // Calculate base after deductions
      const baseAfterDeductions = calculateBaseAfterDeductions(empId);

      // Apply attendance adjustment to the base
      const attendanceRatio =
        (employee.payableDays - employee.lop) / employee.payableDays;
      const attendanceAdjustedBase = baseAfterDeductions * attendanceRatio;

      // Get all active allowances for this employee
      const employeeAllowances = allowanceData.filter(
        (a) => a.empId === empId && a.status === "Active"
      );

      // Get all active deductions for this employee
      const employeeDeductions = deductions.filter(
        (d) => d.empId === empId && d.status === "Active"
      );

      // Calculate total allowance amount directly
      const totalAllowanceAmount = employeeAllowances.reduce(
        (sum, allowance) => {
          return sum + calculateAllowanceAmount(empId, allowance.percentage);
        },
        0
      );

      // Calculate total deduction amount directly
      const totalDeductionAmount = employeeDeductions.reduce(
        (sum, deduction) => {
          if (deduction.percentage === 0 && parseFloat(deduction.amount) > 0) {
            return sum + parseFloat(deduction.amount);
          } else {
            return (
              sum +
              calculateDeductionAmount(employee.basicPay, deduction.percentage)
            );
          }
        },
        0
      );

      // Calculate net salary directly (this is the correct way)
      const netSalary = totalAllowanceAmount;

      const payslipData = {
        empId: employee.empId,
        empName: employee.empName,
        department: employee.department,
        designation: employee.designation,
        pfNo: employee.pfNo || "",
        uanNo: employee.uanNo || "",
        panNo: employee.panNo || "",
        email: employee.email || "",
        dateOfJoining: employee.dateOfJoining || employee.joiningDate, // Check both fields
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basicPay: employee.basicPay,
        payableDays: employee.payableDays,
        lopDays: employee.lop,
        bankDetails: {
          bankName: employee.bankName || "",
          accountNo: employee.bankAccountNo || "",
        },
        attendanceDetails: {
          totalDays: employee.payableDays,
          lopDays: employee.lop,
          workingDays: employee.payableDays - employee.lop,
          perDayPay: calculatePerDayPay(
            employee.basicPay,
            employee.payableDays
          ),
        },
        totalPayBeforeDistribution: employee.basicPay,
        attendanceAdjustedPay: attendanceAdjustedPay,
        baseAfterDeductions: baseAfterDeductions,
        attendanceAdjustedBase: attendanceAdjustedBase,
        allowances: employeeAllowances.map((allowance) => ({
          name: allowance.name,
          amount: calculateAllowanceAmount(empId, allowance.percentage),
          percentage: allowance.percentage,
          isBasicPay: allowance.name === "BASIC PAY" ? true : false,
        })),
        deductions: employeeDeductions.map((deduction) => ({
          name: deduction.name,
          amount:
            deduction.percentage === 0 && parseFloat(deduction.amount) > 0
              ? parseFloat(deduction.amount)
              : calculateDeductionAmount(
                  employee.basicPay,
                  deduction.percentage
                ),
          percentage: deduction.percentage,
          isFixedAmount:
            deduction.percentage === 0 && parseFloat(deduction.amount) > 0,
        })),
        grossSalary: totalAllowanceAmount,
        totalDeductions: totalDeductionAmount,
        netSalary: netSalary,
        generatedOn: new Date(),
        paymentStatus: "Pending",
        paymentMethod: "Bank Transfer",
        paymentDate: null,
        notes: `Payslip for ${new Date().toLocaleString("default", {
          month: "long",
        })} ${new Date().getFullYear()}`,
        lopImpact: {
          totalPayBeforeLOP: employee.basicPay,
          lopDeduction: employee.basicPay - attendanceAdjustedPay,
          lopPercentage: (employee.lop / employee.payableDays) * 100,
        },
      };

      console.log("Sending payslip data:", payslipData);

      // Let's log what API_URL actually is
      console.log("API_URL value:", API_URL);

      // Use a direct endpoint instead of trying to construct it from API_URL
      // This is more reliable when we're not sure about the structure of API_URL
      // const endpoint = `${process.env.REACT_APP_API_URL}/api/payroll/payslips/generate`;
      const endpoint = 'payroll/payslips/generate';

      console.log("Using endpoint:", endpoint);

      // Make API call to generate payslip
      const response = await api.post(endpoint, payslipData);

      console.log("Payslip generation response:", response.data);
      showAlert("Payslip generated successfully");
      await fetchPayslips();
      return response.data.data;
    } catch (error) {
      console.error("Error generating payslip:", error);
      console.error("Error response:", error.response?.data);

      showAlert(
        error.response?.data?.message || "Error generating payslip",
        "error"
      );
      return null;
    }
  };

  const downloadPayslip = async (payslipId) => {
    try {
      // Use a direct endpoint instead of trying to construct it from API_URL
      // const endpoint = `${process.env.REACT_APP_API_URL}/api/payroll/payslips/download/${payslipId}`;
      const endpoint = `payroll/payslips/download/${payslipId}`;

      console.log(`Downloading payslip from: ${endpoint}`);

      // The backend will now handle fetching company details using the token
      const response = await api.get(endpoint, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payslip_${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading payslip:", error);
      showAlert(
        error.response?.data?.message || "Error downloading payslip",
        "error"
      );
    }
  };

  const handleDeleteAllowance = async (empId, name) => {
    try {
      const id = `${empId}_${name}`;
      await api.delete(`${API_URL}/allowances/${id}`);
      showAlert("Allowance deleted successfully");
      return true;
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Error deleting allowance",
        "error"
      );
      return false;
    }
  };

  const calculateTotalAllowancePercentage = () => {
    const total = Object.values(allowancePercentages).reduce(
      (sum, percentage) => sum + parseFloat(percentage || 0),
      0
    );

    // Return with 2 decimal places for display
    return parseFloat(total.toFixed(2));
  };

  const handleDeleteDeduction = async (empId, name) => {
    try {
      const id = `${empId}_${name}`;
      await api.delete(`${API_URL}/deductions/${id}`);
      showAlert("Deduction deleted successfully");
      return true;
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Error deleting deduction",
        "error"
      );
      return false;
    }
  };

  const handleManualDeductionAmountChange = (deductionType, value) => {
    const amount = Math.max(0, Number(value));
    setManualDeductionAmounts({
      ...manualDeductionAmounts,
      [deductionType]: amount,
    });
  };

  return (
    <Container className="payroll-container">
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        TransitionComponent={alert.transition}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
          variant="filled"
          elevation={6}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      <Paper className="main-paper" elevation={0}>
        <AppBar position="static" className="payroll-appbar" elevation={0}>
          <Tabs
            value={tabIndex}
            onChange={(e, newIndex) => setTabIndex(newIndex)}
            variant="fullWidth"
            className="payroll-tabs"
            TabIndicatorProps={{
              style: {
                backgroundColor: "white",
                height: "3px",
              },
            }}
            centered
          >
            <Tab
              label={<span className="tab-label">Employees</span>}
              icon={<AddCircleIcon className="tab-icon" />}
              className="tab-item"
              aria-label="Employees Tab"
            />

            <Tab
              label={
                <span className="tab-label">
                  <span className="full-label">Allowances-Deductions</span>
                  <span className="short-label">Allowances</span>
                </span>
              }
              icon={<AttachMoneyIcon className="tab-icon" />}
              className="tab-item"
              aria-label="Allowances and Deductions Tab"
            />
            <Tab
              label={<span className="tab-label">Payslips</span>}
              icon={<DescriptionIcon className="tab-icon" />}
              className="tab-item"
              aria-label="Payslips Tab"
            />
          </Tabs>
        </AppBar>

        {/* Employees Tab */}
        <TabPanel value={tabIndex} index={0}>
          <Box className="header-container employee-header">
            <Box className="title-wrapper">
              <Typography variant="h5" className="section-title">
                Employee Management
                <span className="title-badge">{employeeData.length} Total</span>
              </Typography>
            </Box>
            <Box className="header-actions">
              <input
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                id="excel-upload"
                onChange={importFromExcel}
              />
              <label htmlFor="excel-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  className="import-button blue-button"
                  size="medium"
                >
                  <span className="button-text">Import</span>
                </Button>
              </label>
              <Button
                variant="contained"
                onClick={exportToExcel}
                startIcon={<CloudDownloadIcon />}
                className="export-button blue-button"
                size="medium"
              >
                <span className="button-text">Export</span>
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setEditMode(false);
                  setLpaValue("");
                  setNewEmployee({
                    empId: "",
                    empName: "",
                    basicPay: "",
                    bankName: "",
                    bankAccountNo: "",
                    pfNo: "",
                    uanNo: "",
                    panNo: "",
                    payableDays: 30,
                    lop: 0,
                    department: "",
                    designation: "",
                    email: "",
                    status: "Active",
                  });
                  setOpenEmployeeDialog(true);
                }}
                startIcon={<AddCircleIcon />}
                className="create-button blue-button"
                size="medium"
              >
                <span className="button-text">Add</span>
              </Button>
            </Box>
          </Box>

          <TableContainer
            component={Paper}
            className="table-container employee-table-container mobile-scroll-table"
            sx={{ overflowX: "auto" }}
          >
            <Table
              className="responsive-table employee-table non-responsive-mobile"
              sx={{ minWidth: 650 }}
            >
              <TableHead>
                <TableRow className="table-header">
                  <TableCell className="table-cell">Emp ID</TableCell>
                  <TableCell className="table-cell">Name</TableCell>
                  <TableCell className="table-cell">Department</TableCell>
                  <TableCell className="table-cell">Designation</TableCell>
                  <TableCell className="table-cell">Total Pay</TableCell>
                  <TableCell className="table-cell">Bank Details</TableCell>
                  <TableCell className="table-cell">PF/UAN</TableCell>
                  <TableCell className="table-cell">Payable Days</TableCell>
                  <TableCell className="table-cell">LOP Days</TableCell>
                  <TableCell className="table-cell action-column">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {employeeData.map((item) => (
                  <TableRow key={item.empId} className="table-row employee-row">
                    <TableCell className="table-cell">{item.empId}</TableCell>
                    <TableCell className="table-cell">{item.empName}</TableCell>
                    <TableCell className="table-cell">
                      {item.department}
                    </TableCell>
                    <TableCell className="table-cell">
                      {item.designation}
                    </TableCell>
                    <TableCell className="table-cell amount-cell">
                      Rs. {parseFloat(item.basicPay).toFixed(2)}
                      <Typography
                        variant="caption"
                        display="block"
                        color="textSecondary"
                      >
                        {((parseFloat(item.basicPay) * 12) / 100000).toFixed(2)}{" "}
                        LPA
                      </Typography>
                    </TableCell>
                    <TableCell className="table-cell">
                      <Typography variant="body2">{item.bankName}</Typography>
                      <Typography variant="caption">
                        {item.bankAccountNo}
                      </Typography>
                    </TableCell>
                    <TableCell className="table-cell">
                      <Typography variant="body2">PF: {item.pfNo}</Typography>
                      <Typography variant="caption">
                        UAN: {item.uanNo}
                      </Typography>
                    </TableCell>
                    <TableCell className="table-cell">
                      {item.payableDays}
                    </TableCell>
                    <TableCell className="table-cell">{item.lop}</TableCell>
                    <TableCell className="table-cell action-cell">
                      <Tooltip title="Preview">
                        <IconButton
                          className="preview-button"
                          onClick={() => handleOpenEmployeePreview(item.empId)}
                        >
                          <PreviewIcon className="action-icon preview-icon" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          className="edit-button"
                          onClick={() => {
                            setEditMode(true);
                            setSelectedItem(item);

                            // Calculate LPA from monthly salary
                            const lpa =
                              (parseFloat(item.basicPay) * 12) / 100000;
                            setLpaValue(lpa.toFixed(2));
                            // Format the date of joining for the form
                            let formattedDate = "";
                            if (item.joiningDate) {
                              formattedDate = new Date(item.joiningDate)
                                .toISOString()
                                .split("T")[0];
                            } else if (item.dateOfJoining) {
                              formattedDate = new Date(item.dateOfJoining)
                                .toISOString()
                                .split("T")[0];
                            }

                            setNewEmployee({ ...item });
                            setOpenEmployeeDialog(true);
                          }}
                        >
                          <EditIcon className="action-icon edit-icon" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          className="delete-button"
                          onClick={() => {
                            setEmployeeToDelete(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon className="action-icon delete-icon" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Allowances & Deductions Tab */}
        <TabPanel value={tabIndex} index={1}>
          <Box className="header-container">
            <Box className="title-container">
              <Typography variant="h5" className="section-title">
                Allowances & Deductions
              </Typography>
              <span className="title-badge">Management</span>
            </Box>
            <Box className="header-actions">
              <Button
                variant="contained"
                onClick={() => {
                  setEditMode(false);
                  setNewAllowance({
                    empId: "",
                    name: "",
                    percentage: 0,
                    category: "Regular",
                    status: "Active",
                  });
                  setOpenDialog(true);
                }}
                startIcon={<AddCircleIcon />}
                className="create-button allowance-create-button"
              >
                <span className="button-text">Create</span>
              </Button>
            </Box>
          </Box>

          {/* Combined Employee-based Table */}

          <TableContainer component={Paper} className="table-container">
            <Table className="responsive-table">
              <TableHead>
                <TableRow className="table-header">
                  <TableCell className="table-cell" data-priority="1">
                    Employee
                  </TableCell>
                  <TableCell className="table-cell" data-priority="1">
                    Department
                  </TableCell>
                  <TableCell className="table-cell" data-priority="1">
                    Total Pay
                  </TableCell>

                  <TableCell
                    className="table-cell action-column"
                    data-priority="1"
                    align="center"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {employeeData.map((employee) => {
                  // Get all allowances for this employee
                  const employeeAllowances = allowanceData.filter(
                    (a) => a.empId === employee.empId && a.status === "Active"
                  );

                  // Get all deductions for this employee
                  const employeeDeductions = deductions.filter(
                    (d) => d.empId === employee.empId && d.status === "Active"
                  );

                  // Skip employees with no allowances or deductions
                  if (
                    employeeAllowances.length === 0 &&
                    employeeDeductions.length === 0
                  ) {
                    return null;
                  }

                  // Calculate total allowance amount
                  const totalAllowanceAmount = employeeAllowances.reduce(
                    (sum, item) => {
                      return (
                        sum +
                        calculateAllowanceAmount(
                          employee.empId,
                          item.percentage
                        )
                      );
                    },
                    0
                  );

                  // Calculate total deduction amount
                  const totalDeductionAmount = employeeDeductions.reduce(
                    (sum, item) => {
                      if (
                        item.percentage === 0 &&
                        parseFloat(item.amount) > 0
                      ) {
                        return sum + parseFloat(item.amount);
                      } else {
                        return (
                          sum +
                          calculateDeductionAmount(
                            employee.basicPay,
                            item.percentage
                          )
                        );
                      }
                    },
                    0
                  );

                  // Calculate net impact
                  // const netImpact = totalAllowanceAmount - totalDeductionAmount;

                  return (
                    <TableRow key={employee.empId} className="table-row">
                      <TableCell>
                        <Typography variant="subtitle2">
                          {employee.empName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {employee.empId}
                        </Typography>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>
                        Rs. {parseFloat(employee.basicPay).toFixed(2)}
                        <Typography
                          variant="caption"
                          display="block"
                          color="textSecondary"
                        >
                          {(
                            (parseFloat(employee.basicPay) * 12) /
                            100000
                          ).toFixed(2)}{" "}
                          LPA
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Preview">
                          <IconButton
                            className="preview-button"
                            onClick={() =>
                              handleOpenAllowancePreview(employee.empId)
                            }
                          >
                            <PreviewIcon
                              sx={{
                                color: "#4caf50",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  color: "#2e7d32",
                                  transform: "scale(1.1)",
                                },
                              }}
                            />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Allowances/Deductions">
                          <IconButton
                            className="edit-button"
                            onClick={() => {
                              // First fetch the latest data
                              Promise.all([
                                fetchAllowances(),
                                fetchDeductions(),
                              ]).then(() => {
                                // Get existing allowances and deductions for this employee
                                const employeeAllowances = allowanceData.filter(
                                  (a) =>
                                    a.empId === employee.empId &&
                                    a.status === "Active"
                                );
                                const employeeDeductions = deductions.filter(
                                  (d) =>
                                    d.empId === employee.empId &&
                                    d.status === "Active"
                                );

                                // Pre-populate the selected allowances and their percentages
                                const initialAllowancePercentages = {};
                                const allowanceNames = employeeAllowances.map(
                                  (a) => {
                                    initialAllowancePercentages[a.name] =
                                      a.percentage;
                                    return a.name;
                                  }
                                );

                                // Pre-populate the selected deductions and their amounts
                                const initialManualDeductionAmounts = {};
                                const deductionNames = employeeDeductions.map(
                                  (d) => {
                                    initialManualDeductionAmounts[d.name] =
                                      parseFloat(d.amount);
                                    return d.name;
                                  }
                                );

                                // Set the state with existing data
                                setBulkEmployeeId(employee.empId);
                                setSelectedAllowances(allowanceNames);
                                setAllowancePercentages(
                                  initialAllowancePercentages
                                );
                                setManualDeductionAmounts(
                                  initialManualDeductionAmounts
                                );
                                setSelectedDeductions(deductionNames);
                                setIsEligibleForDeductions(true);

                                // Set the deduction section visibility based on whether the employee has deductions
                                setShowDeductionSection(
                                  employeeDeductions.length > 0
                                );

                                // Open the dialog in edit mode
                                setEditMode(true); // Set to true to indicate we're in edit mode
                                setOpenDialog(true);
                              });
                            }}
                          >
                            <EditIcon
                              sx={{
                                color: "#007bff",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  color: "#0056b3",
                                  transform: "scale(1.1)",
                                },
                              }}
                            />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            className="delete-button"
                            onClick={() => {
                              setEmployeeToDeleteAllowances(employee);
                              setDeleteAllowanceDialogOpen(true);
                            }}
                          >
                            <DeleteIcon
                              sx={{
                                color: "#d32f2f",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  color: "#ff1744",
                                  transform: "scale(1.1)",
                                },
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Payslips Tab */}

        <TabPanel value={tabIndex} index={2}>
          <Box className="payslip-header-container">
            <Typography variant="h5" className="payslip-section-title">
              Payslip Management
            </Typography>
            <Chip
              label={`${employeeData.length} Employees`}
              className="payslip-title-badge"
              size="small"
            />
          </Box>

          {employeeData.length === 0 ? (
            <Paper className="payslip-no-data-paper">
              <Typography variant="h6" align="center" sx={{ py: 4 }}>
                No employee data available. Please add employees first.
              </Typography>
            </Paper>
          ) : (
            <Box className="payslip-container">
              {employeeData.map((emp) => (
                <Paper key={emp.empId} className="payslip-employee-card">
                  {/* Employee Details Section */}
                  <Box className="payslip-section">
                    <Box className="payslip-employee-header">
                      <Typography variant="h5" className="payslip-header-title">
                        Employee Details
                      </Typography>
                      <Chip
                        label={`ID: ${emp.empId}`}
                        className="payslip-emp-id-chip"
                        size="small"
                      />
                    </Box>

                    <Grid
                      container
                      spacing={2}
                      className="payslip-details-grid"
                    >
                      <Grid item xs={12} sm={4}>
                        <Box className="payslip-detail-group">
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              Name
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.empName}
                            </Typography>
                          </Box>
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              Department
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.department}
                            </Typography>
                          </Box>
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              Designation
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.designation}
                            </Typography>
                          </Box>
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              Date of Joining
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.dateOfJoining || emp.joiningDate
                                ? new Date(
                                    emp.dateOfJoining || emp.joiningDate
                                  ).toLocaleDateString()
                                : "Not available"}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Box className="payslip-detail-group">
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              Bank Name
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.bankName}
                            </Typography>
                          </Box>
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              Account No
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.bankAccountNo}
                            </Typography>
                          </Box>
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              PAN No
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.panNo}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Box className="payslip-detail-group">
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              PF No
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.pfNo}
                            </Typography>
                          </Box>
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              UAN No
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.uanNo}
                            </Typography>
                          </Box>
                          <Box className="payslip-detail-item">
                            <Typography
                              variant="subtitle2"
                              className="payslip-detail-label"
                            >
                              Status
                            </Typography>
                            <Typography
                              variant="body1"
                              className="payslip-detail-value"
                            >
                              {emp.status}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Attendance Details Section */}
                  <Box className="payslip-section">
                    <Typography variant="h6" className="payslip-section-header">
                      Attendance Details
                    </Typography>

                    <Grid
                      container
                      spacing={2}
                      className="payslip-attendance-grid"
                    >
                      <Grid item xs={6} sm={3}>
                        <Paper className="payslip-stat-card">
                          <Typography
                            variant="subtitle2"
                            className="payslip-stat-label"
                          >
                            Total Days
                          </Typography>
                          <Typography
                            variant="h6"
                            className="payslip-stat-value"
                          >
                            {emp.payableDays}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <Paper className="payslip-stat-card">
                          <Typography
                            variant="subtitle2"
                            className="payslip-stat-label"
                          >
                            LOP Days
                          </Typography>
                          <Typography
                            variant="h6"
                            className="payslip-stat-value"
                          >
                            {emp.lop}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <Paper className="payslip-stat-card">
                          <Typography
                            variant="subtitle2"
                            className="payslip-stat-label"
                          >
                            Working Days
                          </Typography>
                          <Typography
                            variant="h6"
                            className="payslip-stat-value"
                          >
                            {emp.payableDays - emp.lop}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <Paper className="payslip-stat-card">
                          <Typography
                            variant="subtitle2"
                            className="payslip-stat-label"
                          >
                            Per Day Pay
                          </Typography>
                          <Typography
                            variant="h6"
                            className="payslip-stat-value"
                          >
                            Rs.{" "}
                            {calculatePerDayPay(
                              emp.basicPay,
                              emp.payableDays
                            ).toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Earnings & Deductions Section */}
                  <Box className="payslip-section">
                    <Grid
                      container
                      spacing={2}
                      className="payslip-calculations-grid"
                    >
                      {/* Earnings Column */}
                      <Grid item xs={12} sm={6}>
                        <Paper className="payslip-earnings-section">
                          {/* Add this at the top of the Earnings section */}
                          <Box
                            sx={{
                              mb: 2,
                              p: 2,
                              bgcolor: "#f5f5f5",
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body2" color="textSecondary">
                              <strong>Note:</strong> Total Pay is distributed
                              across allowances according to the defined
                              percentages.
                            </Typography>
                          </Box>

                          <Typography
                            variant="h6"
                            className="payslip-section-header"
                          >
                            Earnings
                          </Typography>

                          <Box className="payslip-amount-list">
                            {/* Add table headers for Actual and Earned columns */}
                            <Box
                              className="payslip-amount-row"
                              sx={{
                                borderBottom: "1px solid #eee",
                                mb: 1,
                                pb: 1,
                              }}
                            >
                              <Typography
                                variant="body2"
                                className="payslip-amount-label"
                                sx={{ fontWeight: "bold", flex: 2 }}
                              >
                                Component
                              </Typography>
                              <Typography
                                variant="body2"
                                className="payslip-amount-value"
                                sx={{
                                  fontWeight: "bold",
                                  flex: 1,
                                  textAlign: "right",
                                }}
                              >
                                Actual
                              </Typography>
                              <Typography
                                variant="body2"
                                className="payslip-amount-value"
                                sx={{
                                  fontWeight: "bold",
                                  flex: 1,
                                  textAlign: "right",
                                }}
                              >
                                Earned
                              </Typography>
                            </Box>

                            {allowanceData
                              .filter(
                                (a) =>
                                  a.empId === emp.empId && a.status === "Active"
                              )
                              .map((allowance) => {
                                // Calculate the actual amount (without LOP adjustment)
                                const actualAmount =
                                  parseFloat(emp.basicPay) *
                                  (parseFloat(allowance.percentage) / 100);

                                // Calculate the earned amount (with LOP adjustment)
                                const earnedAmount = calculateAllowanceAmount(
                                  emp.empId,
                                  allowance.percentage
                                );

                                return (
                                  <Box
                                    key={
                                      allowance._id ||
                                      `${allowance.empId}_${allowance.name}`
                                    }
                                    className="payslip-amount-row"
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      py: 0.5,
                                    }}
                                  >
                                    <Typography
                                      variant="body1"
                                      className="payslip-amount-label"
                                      sx={{ flex: 2 }}
                                    >
                                      {allowance.name}
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      className="payslip-amount-value"
                                      sx={{
                                        flex: 1,
                                        textAlign: "right",
                                        color: "#555",
                                      }}
                                    >
                                      Rs. {actualAmount.toFixed(2)}
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      className="payslip-amount-value"
                                      sx={{
                                        flex: 1,
                                        textAlign: "right",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Rs. {earnedAmount.toFixed(2)}
                                    </Typography>
                                  </Box>
                                );
                              })}

                            {allowanceData.filter(
                              (a) =>
                                a.empId === emp.empId && a.status === "Active"
                            ).length === 0 && (
                              <Box className="payslip-amount-row payslip-empty-row">
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  align="center"
                                  sx={{ width: "100%" }}
                                >
                                  No active allowances
                                </Typography>
                              </Box>
                            )}

                            {/* Total row with both actual and earned totals */}
                            <Box
                              className="payslip-amount-row payslip-total-row"
                              sx={{ borderTop: "1px solid #eee", mt: 1, pt: 1 }}
                            >
                              <Typography
                                variant="body1"
                                className="payslip-total-label"
                                sx={{ flex: 2, fontWeight: "bold" }}
                              >
                                Total Earnings
                              </Typography>

                              {/* Calculate actual total (without LOP adjustment) */}
                              <Typography
                                variant="body1"
                                className="payslip-total-value"
                                sx={{
                                  flex: 1,
                                  textAlign: "right",
                                  color: "#555",
                                }}
                              >
                                Rs.{" "}
                                {allowanceData
                                  .filter(
                                    (a) =>
                                      a.empId === emp.empId &&
                                      a.status === "Active"
                                  )
                                  .reduce((sum, item) => {
                                    return (
                                      sum +
                                      parseFloat(emp.basicPay) *
                                        (parseFloat(item.percentage) / 100)
                                    );
                                  }, 0)
                                  .toFixed(2)}
                              </Typography>

                              {/* Earned total (with LOP adjustment) */}
                              <Typography
                                variant="body1"
                                className="payslip-total-value"
                                sx={{
                                  flex: 1,
                                  textAlign: "right",
                                  fontWeight: "bold",
                                }}
                              >
                                Rs. {calculateGrossSalary(emp.empId).toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>

                      {/* Deductions Column */}
                      <Grid item xs={12} sm={6}>
                        <Paper className="payslip-deductions-section">
                          <Typography
                            variant="h6"
                            className="payslip-section-header"
                          >
                            Deductions
                          </Typography>

                          <Box className="payslip-amount-list">
                            {deductions
                              .filter(
                                (d) =>
                                  d.empId === emp.empId && d.status === "Active"
                              )
                              .map((deduction) => (
                                <Box
                                  key={
                                    deduction._id ||
                                    `${deduction.empId}_${deduction.name}`
                                  }
                                  className="payslip-amount-row"
                                >
                                  <Typography
                                    variant="body1"
                                    className="payslip-amount-label"
                                  >
                                    {deduction.name}
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    className="payslip-amount-value"
                                  >
                                    Rs.{" "}
                                    {deduction.percentage === 0 &&
                                    parseFloat(deduction.amount) > 0
                                      ? parseFloat(deduction.amount).toFixed(2)
                                      : calculateDeductionAmount(
                                          emp.basicPay,
                                          deduction.percentage
                                        ).toFixed(2)}
                                  </Typography>
                                </Box>
                              ))}

                            {deductions.filter(
                              (d) =>
                                d.empId === emp.empId && d.status === "Active"
                            ).length === 0 && (
                              <Box className="payslip-amount-row payslip-empty-row">
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  align="center"
                                  sx={{ width: "100%" }}
                                >
                                  No active deductions
                                </Typography>
                              </Box>
                            )}

                            <Box className="payslip-amount-row payslip-total-row">
                              <Typography
                                variant="body1"
                                className="payslip-total-label"
                              >
                                Total Deductions
                              </Typography>
                              <Typography
                                variant="body1"
                                className="payslip-total-value"
                              >
                                Rs.{" "}
                                {calculateTotalDeductions(emp.empId).toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Net Salary Section */}
                  <Box className="payslip-section">
                    <Paper className="payslip-net-salary-section">
                      <Grid
                        container
                        spacing={2}
                        alignItems="center"
                        className="payslip-net-salary-grid"
                      >
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          className="payslip-net-salary-amount"
                        >
                          <Typography
                            variant="h5"
                            className="payslip-net-salary-label"
                          >
                            Net Salary: Rs.{" "}
                            {calculateNetSalary(emp.empId).toFixed(2)}
                          </Typography>
                        </Grid>

                        <Grid
                          item
                          xs={12}
                          sm={6}
                          className="payslip-download-container"
                        >
                          <Button
                            variant="contained"
                            onClick={async () => {
                              const payslip = await generatePayslip(emp.empId);
                              if (payslip) {
                                downloadPayslip(payslip._id);
                              }
                            }}
                            startIcon={<FileDownloadIcon />}
                            className="payslip-download-button"
                          >
                            Generate & Download Payslip
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Employee Preview Dialog */}
        <Dialog
          open={employeePreviewDialogOpen}
          onClose={handleCloseEmployeePreview}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: "600px" },
              maxWidth: "100%",
              borderRadius: { xs: 0, sm: "20px" },
              margin: { xs: 0, sm: 2 },
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: "#1976d2",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Employee Details Preview</Typography>
            <IconButton
              onClick={handleCloseEmployeePreview}
              sx={{ color: "white" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          {previewEmployee && (
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Employee Basic Info */}
                <Grid item xs={12}>
                  <Paper
                    sx={{ p: 2, mb: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: "bold", mr: 2 }}
                      >
                        {previewEmployee.empName}
                      </Typography>
                      <Chip
                        label={`ID: ${previewEmployee.empId}`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={previewEmployee.status}
                        color={
                          previewEmployee.status === "Active"
                            ? "success"
                            : "error"
                        }
                        sx={{ ml: 1 }}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Department
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.department}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Designation
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.designation}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Total Pay
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                          Rs. {parseFloat(previewEmployee.basicPay).toFixed(2)}
                          <Typography
                            variant="caption"
                            display="block"
                            color="textSecondary"
                          >
                            {(
                              (parseFloat(previewEmployee.basicPay) * 12) /
                              100000
                            ).toFixed(2)}{" "}
                            LPA
                          </Typography>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Date of Joining
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.joiningDate
                            ? new Date(
                                previewEmployee.joiningDate
                              ).toLocaleDateString()
                            : previewEmployee.dateOfJoining
                            ? new Date(
                                previewEmployee.dateOfJoining
                              ).toLocaleDateString()
                            : "Not available"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Bank & ID Details */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: "100%", borderRadius: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, borderBottom: "1px solid #eee", pb: 1 }}
                    >
                      Bank & ID Details
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Bank Name
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.bankName}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Account Number
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.bankAccountNo}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          PF Number
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.pfNo}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          UAN Number
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.uanNo}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          PAN Number
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.panNo}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Attendance & Pay Details */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: "100%", borderRadius: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, borderBottom: "1px solid #eee", pb: 1 }}
                    >
                      Attendance & Pay Details
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Payable Days
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.payableDays} days
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          LOP Days
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.lop} days
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Working Days
                        </Typography>
                        <Typography variant="body1">
                          {previewEmployee.payableDays - previewEmployee.lop}{" "}
                          days
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Per Day Pay
                        </Typography>
                        <Typography variant="body1">
                          Rs.{" "}
                          {calculatePerDayPay(
                            previewEmployee.basicPay,
                            previewEmployee.payableDays
                          ).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          Attendance Adjusted Pay
                        </Typography>
                        <Typography variant="body1">
                          Rs.{" "}
                          {calculateAttendanceBasedPay(
                            previewEmployee.basicPay,
                            previewEmployee.payableDays,
                            previewEmployee.lop
                          ).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
          )}

          <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Button onClick={handleCloseEmployeePreview} variant="outlined">
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                handleCloseEmployeePreview();
                setEditMode(true);
                setSelectedItem(previewEmployee);

                // Calculate LPA from monthly salary
                const lpa =
                  (parseFloat(previewEmployee.basicPay) * 12) / 100000;
                setLpaValue(lpa.toFixed(2));

                setNewEmployee({ ...previewEmployee });
                setOpenEmployeeDialog(true);
              }}
              sx={{ mr: 1 }}
            >
              Edit Employee
            </Button>
          </DialogActions>
        </Dialog>

        {/* Allowances & Deductions Preview Dialog */}
        <Dialog
          open={allowancePreviewDialogOpen}
          onClose={handleCloseAllowancePreview}
          maxWidth="md"
          fullWidth
          PaperProps={{
            elevation: 3,
            sx: { borderRadius: 2, overflow: "hidden" },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: "#1976d2",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              Allowances & Deductions for {previewEmployee?.empName}
            </Typography>
            <IconButton
              onClick={handleCloseAllowancePreview}
              sx={{ color: "white" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          {previewEmployee && (
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Allowances */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        borderBottom: "1px solid #eee",
                        pb: 1,
                        color: "#4caf50",
                      }}
                    >
                      Allowances
                    </Typography>
                    {allowanceData.filter(
                      (a) =>
                        a.empId === previewEmployee.empId &&
                        a.status === "Active"
                    ).length > 0 ? (
                      <TableContainer sx={{ maxHeight: 300 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Percentage</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell align="right">Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {allowanceData
                              .filter(
                                (a) =>
                                  a.empId === previewEmployee.empId &&
                                  a.status === "Active"
                              )
                              .map((allowance) => (
                                <TableRow
                                  key={
                                    allowance._id ||
                                    `${allowance.empId}_${allowance.name}`
                                  }
                                >
                                  <TableCell>{allowance.name}</TableCell>
                                  <TableCell>{allowance.percentage}%</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={allowance.category}
                                      size="small"
                                      sx={{
                                        bgcolor:
                                          allowance.category === "Regular"
                                            ? "#e3f2fd"
                                            : allowance.category === "Travel"
                                            ? "#e8f5e9"
                                            : "#fff8e1",
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    Rs.{" "}
                                    {calculateAllowanceAmount(
                                      previewEmployee.empId,
                                      allowance.percentage
                                    ).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                              <TableCell
                                colSpan={3}
                                sx={{ fontWeight: "bold" }}
                              >
                                Total Allowances
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: "bold" }}
                              >
                                Rs.{" "}
                                {allowanceData
                                  .filter(
                                    (a) =>
                                      a.empId === previewEmployee.empId &&
                                      a.status === "Active"
                                  )
                                  .reduce((sum, item) => {
                                    return (
                                      sum +
                                      calculateAllowanceAmount(
                                        previewEmployee.empId,
                                        item.percentage
                                      )
                                    );
                                  }, 0)
                                  .toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ py: 2, textAlign: "center" }}
                      >
                        No active allowances found
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Deductions */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        borderBottom: "1px solid #eee",
                        pb: 1,
                        color: "#f44336",
                      }}
                    >
                      Deductions
                    </Typography>
                    {deductions.filter(
                      (d) =>
                        d.empId === previewEmployee.empId &&
                        d.status === "Active"
                    ).length > 0 ? (
                      <TableContainer sx={{ maxHeight: 300 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell align="right">Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {deductions
                              .filter(
                                (d) =>
                                  d.empId === previewEmployee.empId &&
                                  d.status === "Active"
                              )
                              .map((deduction) => (
                                <TableRow
                                  key={
                                    deduction._id ||
                                    `${deduction.empId}_${deduction.name}`
                                  }
                                >
                                  <TableCell>{deduction.name}</TableCell>
                                  <TableCell>
                                    {deduction.percentage === 0 &&
                                    parseFloat(deduction.amount) > 0
                                      ? "Fixed Amount"
                                      : `${deduction.percentage}% of Basic`}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={deduction.category}
                                      size="small"
                                      sx={{
                                        bgcolor:
                                          deduction.category === "Tax"
                                            ? "#ffebee"
                                            : deduction.category === "Insurance"
                                            ? "#e8eaf6"
                                            : "#fce4ec",
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    Rs.{" "}
                                    {deduction.percentage === 0 &&
                                    parseFloat(deduction.amount) > 0
                                      ? parseFloat(deduction.amount).toFixed(2)
                                      : calculateDeductionAmount(
                                          previewEmployee.basicPay,
                                          deduction.percentage
                                        ).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                              <TableCell
                                colSpan={3}
                                sx={{ fontWeight: "bold" }}
                              >
                                Total Deductions
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: "bold" }}
                              >
                                Rs.{" "}
                                {calculateTotalDeductions(
                                  previewEmployee.empId
                                ).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ py: 2, textAlign: "center" }}
                      >
                        No active deductions found
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
          )}

          <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Button onClick={handleCloseAllowancePreview} variant="outlined">
              Close
            </Button>
            {/* <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                handleCloseAllowancePreview();
                setEditMode(false);
                setBulkEmployeeId(previewEmployee.empId);
                setOpenDialog(true);
              }}
            >
              Manage Allowances & Deductions
            </Button> */}
          </DialogActions>
        </Dialog>

        {/* Create Employee Dialog */}
        <Dialog
          open={openEmployeeDialog}
          onClose={handleCloseEmployeeDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: "600px" },
              maxWidth: "100%",
              borderRadius: { xs: 0, sm: "20px" },
              margin: { xs: 0, sm: 2 },
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle className="dialog-title">
            {editMode ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
          <DialogContent className="dialog-content">
            {/* Add this section at the top of the dialog content */}
            {!editMode && (
              <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, fontWeight: "bold" }}
                >
                  Select from Onboarded Employees
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Select Onboarded Employee</InputLabel>
                  <Select
                    value={selectedRegisteredEmployee}
                    onChange={(e) =>
                      handleRegisteredEmployeeSelect(e.target.value)
                    }
                    label="Select Onboarded Employee"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {registeredEmployees.map((emp) => (
                      <MenuItem key={emp.Emp_ID} value={emp.Emp_ID}>
                        {emp.Emp_ID} - {emp.personalInfo?.firstName || ""}{" "}
                        {emp.personalInfo?.lastName || ""}
                        {emp.joiningDetails?.department
                          ? ` (${emp.joiningDetails.department})`
                          : ""}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Select an employee to auto-fill available information
                  </FormHelperText>
                </FormControl>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Employee ID"
                  fullWidth
                  value={newEmployee.empId}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, empId: e.target.value })
                  }
                  disabled={editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Employee Name"
                  fullWidth
                  value={newEmployee.empName}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, empName: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Department"
                  fullWidth
                  value={newEmployee.department}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      department: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Designation"
                  fullWidth
                  value={newEmployee.designation}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      designation: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Annual Salary (LPA)"
                  type="number"
                  fullWidth
                  value={lpaValue}
                  onChange={handleLPAChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">LPA</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Monthly Total Pay"
                  type="number"
                  fullWidth
                  value={newEmployee.basicPay}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, basicPay: e.target.value })
                  }
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">Rs.</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Bank Name"
                  fullWidth
                  value={newEmployee.bankName}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, bankName: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Bank Account No"
                  fullWidth
                  value={newEmployee.bankAccountNo}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      bankAccountNo: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="PF Number"
                  fullWidth
                  value={newEmployee.pfNo}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, pfNo: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="UAN Number"
                  fullWidth
                  value={newEmployee.uanNo}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, uanNo: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="PAN Number"
                  fullWidth
                  value={newEmployee.panNo}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, panNo: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Payable Days"
                  type="number"
                  fullWidth
                  value={newEmployee.payableDays}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      payableDays: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="LOP Days"
                  type="number"
                  fullWidth
                  value={newEmployee.lop}
                  onChange={handleLOPChange}
                  inputProps={{
                    step: 0.5,
                    min: 0,
                  }}
                  helperText="Enter values in 0.5 day increments"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      email: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Date of Joining"
                  type="date"
                  fullWidth
                  value={newEmployee.dateOfJoining}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      dateOfJoining: e.target.value,
                    })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button
              onClick={handleCloseEmployeeDialog}
              color="error"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddEmployee}
              color="primary"
              variant="contained"
            >
              {editMode ? "Update" : "Add"} Employee
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Allowance Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: "16px" },
              margin: { xs: 0, sm: "16px", md: "24px" },
              width: { xs: "100%", sm: "90%", md: "800px" },
              maxWidth: "100%",
              maxHeight: { xs: "100%", sm: "90vh" },
              overflow: "hidden",
            },
          }}
          className="allowance-dialog"
        >
          <DialogTitle className="dialog-title">
            {editMode
              ? "Edit Allowances & Deductions"
              : "Add Allowances & Deductions"}
          </DialogTitle>

          <DialogContent className="allowance-dialog-content">
            {/* Employee Selection - Keep this outside the scrollable area */}
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel>Employee</InputLabel>
              <Select
                value={bulkEmployeeId}
                onChange={(e) => {
                  setBulkEmployeeId(e.target.value);
                }}
                label="Employee"
                disabled={editMode} // Disable in edit mode since we're editing for a specific employee
              >
                {employeeData.map((emp) => (
                  <MenuItem key={emp.empId} value={emp.empId}>
                    {emp.empId} - {emp.empName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Scrollable content area */}
            <Box
              sx={{
                overflowY: "auto",
                maxHeight: { xs: "60vh", sm: "50vh", md: "60vh" },
                pr: 1,
                mr: -1,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "#f1f1f1",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#888",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: "#555",
                },
              }}
            >
              <Grid container spacing={2}>
                {/* Allowances Section */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    className="dialog-section-title"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      color: editMode ? "#1976d2" : "inherit",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {editMode ? (
                      <>
                        <EditIcon sx={{ mr: 1, fontSize: 20 }} />
                        Manage Allowances
                      </>
                    ) : (
                      "Add Allowances"
                    )}
                  </Typography>

                  {/* Current Allowances in Edit Mode */}
                  {editMode && selectedAllowances.length > 0 && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 3,
                        bgcolor: "#f5f5f5",
                        borderRadius: 2,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Current Allowances
                      </Typography>
                      <TableContainer sx={{ maxHeight: 200 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Percentage</TableCell>
                              <TableCell align="right">Amount (Est.)</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedAllowances.map((name) => {
                              const percentage =
                                allowancePercentages[name] || 0;
                              const employee = employeeData.find(
                                (e) => e.empId === bulkEmployeeId
                              );
                              const estimatedAmount = employee
                                ? calculateAllowanceAmount(
                                    employee.empId,
                                    percentage
                                  )
                                : 0;

                              return (
                                <TableRow key={name}>
                                  <TableCell>{name}</TableCell>
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={percentage}
                                      onChange={(e) => {
                                        const newPercentage = Math.max(
                                          0,
                                          Math.min(100, Number(e.target.value))
                                        );
                                        setAllowancePercentages({
                                          ...allowancePercentages,
                                          [name]: newPercentage,
                                        });
                                      }}
                                      InputProps={{
                                        endAdornment: (
                                          <InputAdornment position="end">
                                            %
                                          </InputAdornment>
                                        ),
                                        inputProps: {
                                          min: 0,
                                          max: 100,
                                          step: 0.5,
                                        },
                                      }}
                                      sx={{ width: 100 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    Rs. {estimatedAmount.toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={async () => {
                                        try {
                                          await handleDeleteAllowance(
                                            bulkEmployeeId,
                                            name
                                          );
                                          setSelectedAllowances(
                                            selectedAllowances.filter(
                                              (item) => item !== name
                                            )
                                          );
                                          const updatedPercentages = {
                                            ...allowancePercentages,
                                          };
                                          delete updatedPercentages[name];
                                          setAllowancePercentages(
                                            updatedPercentages
                                          );
                                        } catch (error) {
                                          console.error(
                                            "Error deleting allowance:",
                                            error
                                          );
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  )}

                  {/* Add New Allowances Section - Available in both Add and Edit modes */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: "#f8f9fa",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {editMode ? "Add New Allowance" : "Select Allowances"}
                    </Typography>

                    {/* Allowance selection table */}
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">Select</TableCell>
                            <TableCell>Allowance Type</TableCell>
                            <TableCell className="dialog-hide-sm">
                              Description
                            </TableCell>
                            <TableCell>Percentage (%)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[
                            {
                              name: "BASIC PAY",
                              desc: "Base component of salary structure",
                            },
                            {
                              name: "TRAVEL ALLOWANCE",
                              desc: "For travel-related expenses",
                            },
                            {
                              name: "MEDICAL ALLOWANCE",
                              desc: "For healthcare expenses",
                            },
                            {
                              name: "HOUSE RENT ALLOWANCE",
                              desc: "For accommodation expenses",
                            },
                            {
                              name: "DEARNESS ALLOWANCE",
                              desc: "Cost of living adjustment",
                            },
                            {
                              name: "SPECIAL ALLOWANCE",
                              desc: "Additional benefits",
                            },
                          ].map((allowance) => (
                            <TableRow key={allowance.name}>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedAllowances.includes(
                                    allowance.name
                                  )}
                                  onChange={(e) =>
                                    handleAllowanceSelection(
                                      allowance.name,
                                      e.target.checked
                                    )
                                  }
                                  disabled={
                                    editMode &&
                                    selectedAllowances.includes(allowance.name)
                                  } // Disable if already selected in edit mode
                                />
                              </TableCell>
                              <TableCell>{allowance.name}</TableCell>
                              <TableCell className="dialog-hide-sm">
                                {allowance.desc}
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={
                                    allowancePercentages[allowance.name] || 0
                                  }
                                  onChange={(e) =>
                                    handlePercentageChange(
                                      allowance.name,
                                      e.target.value
                                    )
                                  }
                                  disabled={
                                    !selectedAllowances.includes(allowance.name)
                                  }
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        %
                                      </InputAdornment>
                                    ),
                                    inputProps: { min: 0, max: 100, step: 0.5 },
                                  }}
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Custom allowance input */}
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <TextField
                        label="Custom Allowance"
                        size="small"
                        id="custom-allowance"
                        sx={{ flexGrow: 1 }}
                      />
                      <TextField
                        label="%"
                        type="number"
                        size="small"
                        id="custom-allowance-percentage"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                          inputProps: { min: 0, max: 100 },
                        }}
                        sx={{ width: 100 }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          const customName =
                            document.getElementById("custom-allowance").value;
                          const percentage = parseFloat(
                            document.getElementById(
                              "custom-allowance-percentage"
                            ).value || 0
                          );

                          if (
                            customName &&
                            !selectedAllowances.includes(customName)
                          ) {
                            setSelectedAllowances([
                              ...selectedAllowances,
                              customName,
                            ]);
                            setAllowancePercentages({
                              ...allowancePercentages,
                              [customName]: percentage,
                            });

                            // Clear inputs
                            document.getElementById("custom-allowance").value =
                              "";
                            document.getElementById(
                              "custom-allowance-percentage"
                            ).value = "";
                          }
                        }}
                      >
                        Add
                      </Button>
                    </Box>
                    {/* <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  <Typography variant="body2">
    Total Percentage: 
    <Box component="span" sx={{ 
      fontWeight: 'bold',
      color: calculateTotalAllowancePercentage() === 100 ? 'green' : 'orange'
    }}>
      {' '}{calculateTotalAllowancePercentage()}%
    </Box>
  </Typography>
  
  {calculateTotalAllowancePercentage() !== 100 && (
    <Typography variant="caption" color="warning.main">
      {calculateTotalAllowancePercentage() > 100 
        ? "Warning: Total exceeds 100%" 
        : "Warning: Total is less than 100%"}
    </Typography>
  )}
</Box> */}
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="body2">
                        Total Percentage:
                        <Box
                          component="span"
                          sx={{
                            fontWeight: "bold",
                            color: isPercentageWithinRange(
                              calculateTotalAllowancePercentage()
                            )
                              ? "green"
                              : "orange",
                          }}
                        >
                          {" "}
                          {calculateTotalAllowancePercentage().toFixed(2)}%
                        </Box>
                      </Typography>

                      {!isPercentageWithinRange(
                        calculateTotalAllowancePercentage()
                      ) && (
                        <Typography variant="caption" color="warning.main">
                          {calculateTotalAllowancePercentage() > 100 + 0.1
                            ? "Warning: Total exceeds 100%"
                            : "Warning: Total is less than 100%"}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                {/* Deduction Eligibility Checkbox */}
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: "#f8f9fa",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showDeductionSection}
                          onChange={(e) =>
                            setShowDeductionSection(e.target.checked)
                          }
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2">
                            Is this employee eligible for deductions?
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Check this box to enable adding deductions for this
                            employee
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                </Grid>

                {/* Deductions Section */}
                {showDeductionSection && (
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      className="dialog-section-title"
                      sx={{
                        fontWeight: "bold",
                        mb: 2,
                        color: editMode ? "#1976d2" : "inherit",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {editMode ? (
                        <>
                          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
                          Manage Deductions
                        </>
                      ) : (
                        "Add Deductions (Optional)"
                      )}
                    </Typography>

                    {/* Current Deductions in Edit Mode */}
                    {editMode && selectedDeductions.length > 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          mb: 3,
                          bgcolor: "#f5f5f5",
                          borderRadius: 2,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          Current Deductions
                        </Typography>
                        <TableContainer sx={{ maxHeight: 200 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedDeductions.map((name) => {
                                const amount = parseFloat(
                                  manualDeductionAmounts[name] || 0
                                );

                                return (
                                  <TableRow key={name}>
                                    <TableCell>{name}</TableCell>
                                    <TableCell>
                                      <TextField
                                        type="number"
                                        size="small"
                                        value={amount}
                                        onChange={(e) => {
                                          const newAmount = Math.max(
                                            0,
                                            Number(e.target.value)
                                          );
                                          setManualDeductionAmounts({
                                            ...manualDeductionAmounts,
                                            [name]: newAmount,
                                          });
                                        }}
                                        InputProps={{
                                          startAdornment: (
                                            <InputAdornment position="start">
                                              Rs.
                                            </InputAdornment>
                                          ),
                                          inputProps: { min: 0, step: 1 },
                                        }}
                                        sx={{ width: 150 }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={async () => {
                                          try {
                                            await handleDeleteDeduction(
                                              bulkEmployeeId,
                                              name
                                            );
                                            setSelectedDeductions(
                                              selectedDeductions.filter(
                                                (item) => item !== name
                                              )
                                            );
                                            const updatedAmounts = {
                                              ...manualDeductionAmounts,
                                            };
                                            delete updatedAmounts[name];
                                            setManualDeductionAmounts(
                                              updatedAmounts
                                            );
                                          } catch (error) {
                                            console.error(
                                              "Error deleting deduction:",
                                              error
                                            );
                                          }
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}

                              {/* Total row */}
                              <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Total Deductions
                                </TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>
                                  Rs.{" "}
                                  {selectedDeductions
                                    .reduce(
                                      (sum, name) =>
                                        sum +
                                        parseFloat(
                                          manualDeductionAmounts[name] || 0
                                        ),
                                      0
                                    )
                                    .toFixed(2)}
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    )}

                    {/* Add New Deductions Section - Available in both Add and Edit modes */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: "#f8f9fa",
                        borderRadius: 2,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        {editMode ? "Add New Deduction" : "Select Deductions"}
                      </Typography>

                      {/* Deduction selection table */}
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox">Select</TableCell>
                              <TableCell>Deduction Type</TableCell>
                              <TableCell className="dialog-hide-sm">
                                Description
                              </TableCell>
                              <TableCell>Amount (Rs.)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[
                              {
                                name: "PROFESSIONAL TAX",
                                desc: "State-mandated tax on employment",
                              },
                              {
                                name: "INCOME TAX",
                                desc: "Tax on employee income",
                              },
                              {
                                name: "PROVIDENT FUND",
                                desc: "Retirement savings contribution",
                              },
                              {
                                name: "HEALTH INSURANCE",
                                desc: "Medical insurance premium",
                              },
                            ].map((deduction) => (
                              <TableRow key={deduction.name}>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={selectedDeductions.includes(
                                      deduction.name
                                    )}
                                    onChange={(e) =>
                                      handleDeductionSelection(
                                        deduction.name,
                                        e.target.checked
                                      )
                                    }
                                    disabled={
                                      editMode &&
                                      selectedDeductions.includes(
                                        deduction.name
                                      )
                                    } // Disable if already selected in edit mode
                                  />
                                </TableCell>
                                <TableCell>{deduction.name}</TableCell>
                                <TableCell className="dialog-hide-sm">
                                  {deduction.desc}
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={
                                      manualDeductionAmounts[deduction.name] ||
                                      0
                                    }
                                    onChange={(e) =>
                                      handleManualDeductionAmountChange(
                                        deduction.name,
                                        e.target.value
                                      )
                                    }
                                    disabled={
                                      !selectedDeductions.includes(
                                        deduction.name
                                      )
                                    }
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          Rs.
                                        </InputAdornment>
                                      ),
                                      inputProps: { min: 0, step: 1 },
                                    }}
                                    sx={{ width: 150 }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Custom deduction input */}
                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <TextField
                          label="Custom Deduction"
                          size="small"
                          id="custom-deduction"
                          sx={{ flexGrow: 1 }}
                        />
                        <TextField
                          label="Amount"
                          type="number"
                          size="small"
                          id="custom-deduction-amount"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                Rs.
                              </InputAdornment>
                            ),
                            inputProps: { min: 0 },
                          }}
                          sx={{ width: 150 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            const customName =
                              document.getElementById("custom-deduction").value;
                            const amount = parseFloat(
                              document.getElementById("custom-deduction-amount")
                                .value || 0
                            );

                            if (
                              customName &&
                              !selectedDeductions.includes(customName)
                            ) {
                              setSelectedDeductions([
                                ...selectedDeductions,
                                customName,
                              ]);
                              setManualDeductionAmounts({
                                ...manualDeductionAmounts,
                                [customName]: amount,
                              });

                              // Clear inputs
                              document.getElementById(
                                "custom-deduction"
                              ).value = "";
                              document.getElementById(
                                "custom-deduction-amount"
                              ).value = "";
                            }
                          }}
                        >
                          Add
                        </Button>
                      </Box>
                    </Paper>

                    {/* Explanation note about fixed amount deductions */}
                    {selectedDeductions.length > 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: "#f8f9fa",
                          borderRadius: 2,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <InfoIcon
                            sx={{ color: "#1976d2", fontSize: 20, mt: 0.5 }}
                          />
                          <Box>
                            <Typography
                              variant="subtitle2"
                              color="#1976d2"
                              gutterBottom
                            >
                              How Deductions Work
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Deductions are fixed amounts that are subtracted
                              directly from the employee's total pay. The exact
                              amount you specify will be deducted from the
                              salary.
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              <strong>Example:</strong> If you add a deduction
                              of Rs. 1,000 and the employee's total pay is Rs.
                              50,000, the net salary will be Rs. 49,000.
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    )}
                  </Grid>
                )}

                {/* Summary Section - Show in both Add and Edit modes */}
                {(selectedAllowances.length > 0 ||
                  selectedDeductions.length > 0) && (
                  <Grid item xs={12}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        mt: 2,
                        bgcolor: "#e3f2fd",
                        borderRadius: 2,
                        border: "1px solid #90caf9",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", mb: 2 }}
                      >
                        Summary of Changes
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Paper
                            sx={{ p: 2, bgcolor: "#ffffff", height: "100%" }}
                          >
                            <Typography variant="subtitle2" gutterBottom>
                              Allowances ({selectedAllowances.length})
                            </Typography>
                            {selectedAllowances.length > 0 ? (
                              <Box sx={{ mt: 1 }}>
                                {selectedAllowances.map((name) => {
                                  const percentage =
                                    allowancePercentages[name] || 0;
                                  const employee = employeeData.find(
                                    (e) => e.empId === bulkEmployeeId
                                  );

                                  const estimatedAmount =
                                    calculateEstimatedAllowanceAmount(
                                      employee,
                                      percentage
                                    );

                                  return (
                                    <Box
                                      key={name}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 1,
                                      }}
                                    >
                                      <Typography variant="body2">
                                        {name} ({percentage}%)
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Rs. {estimatedAmount.toFixed(2)}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                                <Divider sx={{ my: 1 }} />
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "bold" }}
                                  >
                                    Total Allowances
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: "bold",
                                      color: "#4caf50",
                                    }}
                                  >
                                    Rs.{" "}
                                    {selectedAllowances
                                      .reduce((sum, name) => {
                                        const percentage =
                                          allowancePercentages[name] || 0;
                                        const employee = employeeData.find(
                                          (e) => e.empId === bulkEmployeeId
                                        );
                                        // Use the new function here
                                        const estimatedAmount =
                                          calculateEstimatedAllowanceAmount(
                                            employee,
                                            percentage
                                          );
                                        return sum + estimatedAmount;
                                      }, 0)
                                      .toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No allowances selected
                              </Typography>
                            )}
                          </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Paper
                            sx={{ p: 2, bgcolor: "#ffffff", height: "100%" }}
                          >
                            <Typography variant="subtitle2" gutterBottom>
                              Deductions ({selectedDeductions.length})
                            </Typography>
                            {selectedDeductions.length > 0 ? (
                              <Box sx={{ mt: 1 }}>
                                {selectedDeductions.map((name) => {
                                  const amount = parseFloat(
                                    manualDeductionAmounts[name] || 0
                                  );

                                  return (
                                    <Box
                                      key={name}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 1,
                                      }}
                                    >
                                      <Typography variant="body2">
                                        {name}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Rs. {amount.toFixed(2)}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                                <Divider sx={{ my: 1 }} />
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "bold" }}
                                  >
                                    Total Deductions
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: "bold",
                                      color: "#f44336",
                                    }}
                                  >
                                    Rs.{" "}
                                    {selectedDeductions
                                      .reduce(
                                        (sum, name) =>
                                          sum +
                                          parseFloat(
                                            manualDeductionAmounts[name] || 0
                                          ),
                                        0
                                      )
                                      .toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No deductions selected
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{ p: 2, bgcolor: "#f5f5f5", borderTop: "1px solid #e0e0e0" }}
          >
            <Button
              onClick={handleCloseDialog}
              color="error"
              variant="outlined"
              startIcon={<CloseIcon />}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMultipleAllowances}
              color="primary"
              variant="contained"
              disabled={
                (!selectedAllowances.length && !selectedDeductions.length) ||
                !bulkEmployeeId ||
                isLoading
              }
              startIcon={editMode ? <SaveIcon /> : <AddCircleIcon />}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : editMode ? (
                "Save Changes"
              ) : (
                "Add Items"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: "16px" },
            width: { xs: "100%", sm: "450px" },
            maxWidth: "100%",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #f44336, #ff7961)",
            color: "white",
            fontWeight: 600,
            padding: "16px 24px",
          }}
        >
          Delete Employee
        </DialogTitle>
        <DialogContent sx={{ padding: "24px", paddingTop: "24px" }}>
          <Typography variant="body1">
            Are you sure you want to delete{" "}
            <strong>{employeeToDelete?.empName}</strong>? This action cannot be
            undone and will also remove all associated allowances and
            deductions.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            padding: "16px 24px",
            borderTop: "1px solid #e0e0e0",
            gap: 2,
          }}
        >
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              border: "2px solid #1976d2",
              color: "#1976d2",
              "&:hover": {
                border: "2px solid #64b5f6",
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
              },
              textTransform: "none",
              borderRadius: "8px",
              padding: "6px 16px",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteEmployee}
            variant="contained"
            color="error"
            sx={{
              background: "linear-gradient(45deg, #f44336, #ff7961)",
              fontSize: "0.95rem",
              textTransform: "none",
              padding: "8px 24px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg, #d32f2f, #f44336)",
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Allowances & Deductions Delete Confirmation Dialog */}
      <Dialog
        open={deleteAllowanceDialogOpen}
        onClose={() => setDeleteAllowanceDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: "16px" },
            width: { xs: "100%", sm: "450px" },
            maxWidth: "100%",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #f44336, #ff7961)",
            color: "white",
            fontWeight: 600,
            padding: "16px 24px",
          }}
        >
          Delete Allowances & Deductions
        </DialogTitle>
        <DialogContent sx={{ padding: "24px", paddingTop: "24px" }}>
          <Typography variant="body1">
            Are you sure you want to delete all allowances and deductions for{" "}
            <strong>{employeeToDeleteAllowances?.empName}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            padding: "16px 24px",
            borderTop: "1px solid #e0e0e0",
            gap: 2,
          }}
        >
          <Button
            onClick={() => setDeleteAllowanceDialogOpen(false)}
            sx={{
              border: "2px solid #1976d2",
              color: "#1976d2",
              "&:hover": {
                border: "2px solid #64b5f6",
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
              },
              textTransform: "none",
              borderRadius: "8px",
              padding: "6px 16px",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteAllowancesAndDeductions}
            variant="contained"
            color="error"
            sx={{
              background: "linear-gradient(45deg, #f44336, #ff7961)",
              fontSize: "0.95rem",
              textTransform: "none",
              padding: "8px 24px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg, #d32f2f, #f44336)",
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PayrollSystem;
