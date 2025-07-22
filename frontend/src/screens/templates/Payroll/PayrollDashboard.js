import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './PayrollDashboard.css';
import api from '../../../api/axiosInstance';
import {
  CircularProgress,
  Box,
  Alert,
  Snackbar,
  Fade,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import DateRangeIcon from '@mui/icons-material/DateRange';

// Register the necessary components for the chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_URL = "/payroll";
const CONTRACTS_API_URL = "/payroll-contracts";

const PayrollDashboard = () => {
  // State variables
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // Default to current month

  // Data states
  const [employeeData, setEmployeeData] = useState([]);
  const [allowanceData, setAllowanceData] = useState([]);
  const [deductionData, setDeductionData] = useState([]);
  const [payslipData, setPayslipData] = useState([]);
  const [contractsData, setContractsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [departmentStats, setDepartmentStats] = useState({});

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
    transition: Fade,
  });



  // // Helper function to create headers with auth token
  // const getAuthHeaders = () => {
  //   const token = getAuthToken();
  //   return {
  //     headers: {
  //       'Authorization': `Bearer ${token}`
  //     }
  //   };
  // };



  // Fetch data on component mount and when selected date changes
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchEmployees(),
          fetchAllowances(),
          fetchDeductions(),
          fetchPayslips(),
          fetchContracts()
        ]);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchAllData();
  }, [selectedDate]);

  // Process data for charts and statistics when data changes
  useEffect(() => {
    if (employeeData.length > 0) {
      processPayrollData();
      processDepartmentData();
    }
  }, [employeeData, allowanceData, deductionData, payslipData]);

  // Update fetchEmployees function
  const fetchEmployees = async () => {
    try {
      // const token = getAuthToken();
      const response = await api.get(`${API_URL}/employees`
        //   , {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      const employees = response.data.data || [];
      setEmployeeData(employees);

      // Set default selected employee if available
      if (employees.length > 0) {
        setSelectedEmployee(employees[0]);
      }

      return employees;
    } catch (error) {
      console.error("Error fetching employees:", error);
      showAlert("Error fetching employees", "error");
      return [];
    }
  };

  // Update fetchAllowances function
  const fetchAllowances = async () => {
    try {
      // const token = getAuthToken();
      const response = await api.get(`${API_URL}/allowances`
        //   , {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      const allowances = response.data.data || [];
      setAllowanceData(allowances);
      return allowances;
    } catch (error) {
      console.error("Error fetching allowances:", error);
      showAlert("Error fetching allowances", "error");
      return [];
    }
  };

  // Update fetchDeductions function
  const fetchDeductions = async () => {
    try {
      // const token = getAuthToken();
      const response = await api.get(`${API_URL}/deductions`
        //   , {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      const deductions = response.data.data || [];
      setDeductionData(deductions);
      return deductions;
    } catch (error) {
      console.error("Error fetching deductions:", error);
      showAlert("Error fetching deductions", "error");
      return [];
    }
  };

  // Update fetchPayslips function
  const fetchPayslips = async () => {
    try {
      // const token = getAuthToken();
      const response = await api.get(`${API_URL}/payslips`
        //   , {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      if (response.data.success) {
        const payslips = response.data.data || [];
        setPayslipData(payslips);
        return payslips;
      } else {
        console.warn("No payslips found or endpoint returned error");
        setPayslipData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching payslips:", error);
      setPayslipData([]);
      return [];
    }
  };

  // Update fetchContracts function
  const fetchContracts = async () => {
    try {
      // const token = getAuthToken();
      const response = await api.get(CONTRACTS_API_URL
        //   , {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      if (response.data.success) {
        const contracts = response.data.data || [];
        setContractsData(contracts);
        return contracts;
      } else {
        console.warn("No contracts found or endpoint returned error");
        setContractsData([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      setContractsData([]);
      return [];
    }
  };


  // Data processing functions
  const processPayrollData = () => {
    // Get last 6 months for chart
    const months = [];
    const grossSalaryData = [];
    const deductionsData = [];
    const netSalaryData = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'long' });
      months.push(monthName);

      // Calculate totals for this month
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      employeeData.forEach(employee => {
        // Calculate basic pay
        const basicPay = parseFloat(employee.basicPay) || 0;

        // Calculate allowances for this employee
        const employeeAllowances = allowanceData
          .filter(a => a.empId === employee.empId && a.status === "Active")
          .reduce((sum, allowance) => {
            const percentage = parseFloat(allowance.percentage) || 0;
            return sum + (basicPay * percentage / 100);
          }, 0);

        // Calculate deductions for this employee
        const employeeDeductions = deductionData
          .filter(d => d.empId === employee.empId && d.status === "Active")
          .reduce((sum, deduction) => {
            const percentage = parseFloat(deduction.percentage) || 0;
            return sum + (basicPay * percentage / 100);
          }, 0);

        // Add to totals
        totalGross += basicPay + employeeAllowances;
        totalDeductions += employeeDeductions;
        totalNet += (basicPay + employeeAllowances - employeeDeductions);
      });

      // Add to chart data arrays
      grossSalaryData.push(totalGross);
      deductionsData.push(totalDeductions);
      netSalaryData.push(totalNet);
    }

    // Update chart data
    setChartData({
      labels: months,
      datasets: [
        {
          label: 'Gross Salary',
          data: grossSalaryData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Deductions',
          data: deductionsData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        {
          label: 'Net Salary',
          data: netSalaryData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }
      ]
    });
  };

  const processDepartmentData = () => {
    // Count employees by department
    const departmentCounts = {};
    const departmentColors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
      "#FF9F40", "#8AC249", "#EA5545", "#27AEEF", "#87BC45"
    ];

    employeeData.forEach(employee => {
      const dept = employee.department || "Unassigned";
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    // Convert to chart format
    const labels = Object.keys(departmentCounts);
    const data = Object.values(departmentCounts);
    const backgroundColors = labels.map((_, index) => departmentColors[index % departmentColors.length]);

    setDepartmentStats({
      labels,
      datasets: [
        {
          label: "Employee Distribution",
          data,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: backgroundColors.map(color => color.replace(')', ', 0.8)')),
          borderWidth: 1,
          borderColor: backgroundColors.map(color => color.replace(')', ', 1)'))
        }
      ]
    });
  };




  // Add this useEffect for debugging
  useEffect(() => {
    console.log('=== DEBUGGING DATA ===');
    console.log('Employee Data:', employeeData);
    console.log('Deduction Data:', deductionData);
    console.log('Selected Employee:', selectedEmployee);

    if (selectedEmployee) {
      console.log('Contributions for selected employee:', calculateContributions(selectedEmployee));
    }
  }, [employeeData, deductionData, selectedEmployee]);


  // Calculate employee contributions
  const calculateContributions = (employee) => {
    if (!employee) return [];

    const basicPay = parseFloat(employee.basicPay) || 0;

    // Debug logging
    console.log('Employee:', employee);
    console.log('Basic Pay:', basicPay);
    console.log('All Deduction Data:', deductionData);

    // Get deductions for this employee
    const employeeDeductions = deductionData.filter(d => {
      console.log('Checking deduction:', d);
      console.log('Deduction empId:', d.empId, 'Employee empId:', employee.empId);
      console.log('Deduction status:', d.status);

      // Make sure we're comparing the right field names and values
      return (d.empId === employee.empId || d.employeeId === employee.empId) &&
        (d.status === "Active" || d.status === "active");
    });

    console.log('Filtered Employee Deductions:', employeeDeductions);

    // If no deductions found, try without status filter
    if (employeeDeductions.length === 0) {
      const allEmployeeDeductions = deductionData.filter(d =>
        d.empId === employee.empId || d.employeeId === employee.empId
      );
      console.log('All deductions for employee (ignoring status):', allEmployeeDeductions);
    }

    // Map deductions to contributions format
    return employeeDeductions.map(deduction => {
      const percentage = parseFloat(deduction.percentage) || parseFloat(deduction.deductionPercentage) || 0;
      const fixedAmount = parseFloat(deduction.amount) || parseFloat(deduction.deductionAmount) || 0;

      // Calculate amount - either percentage of basic pay or fixed amount
      let amount = 0;
      if (percentage > 0) {
        amount = (basicPay * percentage / 100);
      } else if (fixedAmount > 0) {
        amount = fixedAmount;
      }

      console.log('Deduction calculation:', {
        name: deduction.name || deduction.deductionName,
        percentage,
        fixedAmount,
        basicPay,
        calculatedAmount: amount
      });

      // For employer contribution, you might want to use a different calculation
      // For now, using the same amount, but you can modify this based on your business logic
      const employerAmount = amount;

      return {
        type: deduction.name || deduction.deductionName || 'Unknown Deduction',
        employeeContribution: `Rs. ${amount.toFixed(2)}`,
        employerContribution: `Rs. ${employerAmount.toFixed(2)}`
      };
    });
  };

  // Event handlers
  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleEmployeeChange = (event) => {
    const empId = event.target.value;
    const employee = employeeData.find(emp => emp.empId === empId);
    setSelectedEmployee(employee || null);
  };

  const showAlert = (message, severity = "success") => {
    setAlert({
      open: true,
      message,
      severity,
      transition: Fade,
    });
  };

  // Initialize chart data state
  const [chartData, setChartData] = useState({
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Gross Salary',
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Deductions',
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
      {
        label: 'Net Salary',
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      }
    ]
  });

  // Loading and error states
  if (loading) {
    return (
      <Box className="pd-loading-container">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" className="pd-loading-text">
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="pd-error-container">
        <Alert severity="error" className="pd-error-alert">{error}</Alert>
      </Box>
    );
  }

  return (
    <div className="pd-dashboard">
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        TransitionComponent={alert.transition}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
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

      <Typography variant="h4" className="pd-dashboard-title">
        Payroll Dashboard
      </Typography>

      <div className="pd-status-container">
        <Card className="pd-status-card pd-status-employees">
          <CardContent className="pd-status-content">
            <div className="pd-status-icon-container">
              <PersonIcon className="pd-status-icon" />
            </div>
            <div className="pd-status-details">
              <Typography variant="h6" className="pd-status-title">Total Employees</Typography>
              <Typography variant="h3" className="pd-status-count">{employeeData.length}</Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="pd-status-card pd-status-allowances">
          <CardContent className="pd-status-content">
            <div className="pd-status-icon-container">
              <AttachMoneyIcon className="pd-status-icon" />
            </div>
            <div className="pd-status-details">
              <Typography variant="h6" className="pd-status-title">Active Allowances</Typography>
              <Typography variant="h3" className="pd-status-count">
                {allowanceData.filter(a => a.status === "Active").length}
              </Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="pd-status-card pd-status-deductions">
          <CardContent className="pd-status-content">
            <div className="pd-status-icon-container">
              <RemoveCircleOutlineIcon className="pd-status-icon" />
            </div>
            <div className="pd-status-details">
              <Typography variant="h6" className="pd-status-title">Active Deductions</Typography>
              <Typography variant="h3" className="pd-status-count">
                {deductionData.filter(d => d.status === "Active").length}
              </Typography>
            </div>
          </CardContent>
        </Card>

        <Card className="pd-status-card pd-status-payslips">
          <CardContent className="pd-status-content">
            <div className="pd-status-icon-container">
              <DescriptionIcon className="pd-status-icon" />
            </div>
            <div className="pd-status-details">
              <Typography variant="h6" className="pd-status-title">Generated Payslips</Typography>
              <Typography variant="h3" className="pd-status-count">{payslipData.length}</Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date selector */}
      <Card className="pd-date-selector-card">
        <CardContent className="pd-date-selector-content">
          <div className="pd-date-selector">
            <DateRangeIcon className="pd-date-icon" />
            <Typography variant="subtitle1" className="pd-date-label">
              Select Month and Year:
            </Typography>
            <input
              type="month"
              value={selectedDate}
              onChange={handleDateChange}
              className="pd-date-input"
            />
          </div>
        </CardContent>
      </Card>

      <div className="pd-dashboard-grid">
        <Card className="pd-chart-card">
          <CardHeader
            title="Payroll Summary - Last 6 Months"
            className="pd-card-header"
          />
          <Divider />
          <CardContent className="pd-chart-content">
            <div className="pd-payslip-chart">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return `${context.dataset.label}: Rs. ${context.raw.toFixed(2)}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="pd-contributions-card">
          <CardHeader
            title="Employer Contributions"
            className="pd-card-header"
          />
          <Divider />
          <CardContent className="pd-contributions-content">
            <select
              className="pd-employee-dropdown"
              onChange={handleEmployeeChange}
              value={selectedEmployee?.empId || ""}
            >
              <option value="">Select an employee</option>
              {employeeData.map((employee) => (
                <option key={employee.empId} value={employee.empId}>
                  {employee.empName} ({employee.empId})
                </option>
              ))}
            </select>

            {selectedEmployee ? (
              calculateContributions(selectedEmployee).length > 0 ? (
                <table className="pd-contributions-table">
                  <thead>
                    <tr>
                      <th>Deduction</th>
                      <th>Employee Contribution</th>
                      <th>Employer Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculateContributions(selectedEmployee).map((contribution, index) => (
                      <tr key={index} className="pd-contribution-row">
                        <td>
                          <div className="pd-contribution-type">
                            <Avatar className="pd-avatar">
                              {contribution.type.charAt(0)}
                            </Avatar>
                            <span>{contribution.type}</span>
                          </div>
                        </td>
                        <td className="pd-contribution-amount">{contribution.employeeContribution}</td>
                        <td className="pd-contribution-amount">{contribution.employerContribution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="pd-no-data">
                  <Typography variant="body1">No contributions found for this employee</Typography>
                </div>
              )
            ) : (
              <div className="pd-no-data">
                <Typography variant="body1">Please select an employee to view contributions</Typography>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="pd-contracts-card">
          <CardHeader
            title="Contracts Ending Soon"
            className="pd-card-header"
            subheader={`${contractsData.length} contract(s) expiring soon`}
          />
          <Divider />
          <CardContent className="pd-contracts-content">
            {contractsData.length > 0 ? (
              <div className="pd-contract-list">
                {contractsData.map((contract, index) => (
                  <div className="pd-contract-item" key={index}>
                    <Avatar className="pd-contract-avatar">
                      {contract.employeeName?.split(' ').map(n => n[0]).join('') || 'NA'}
                    </Avatar>
                    <div className="pd-contract-details">
                      <Typography variant="subtitle1" className="pd-employee-name">
                        {contract.employeeName}
                      </Typography>
                      <Typography variant="body2" className="pd-contract-date">
                        Ending on {new Date(contract.endDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pd-no-data">
                <Typography variant="body1">No contracts ending soon</Typography>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="pd-department-card">
          <CardHeader
            title="Department Distribution"
            className="pd-card-header"
            avatar={<BusinessIcon />}
          />
          <Divider />
          <CardContent className="pd-department-content">
            {departmentStats.labels?.length > 0 ? (
              <div className="pd-department-chart">
                <Pie
                  data={departmentStats}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          boxWidth: 15,
                          padding: 15
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="pd-no-data">
                <Typography variant="body1">No department data available</Typography>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayrollDashboard;

