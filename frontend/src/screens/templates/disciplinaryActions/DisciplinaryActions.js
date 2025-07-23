import React, { useState, useEffect } from "react";
import { styled } from "@mui/material";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  DialogActions,
  Autocomplete,
  CircularProgress,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";

import {
  UploadFile,
  Close,
  Search,
  Edit,
  Delete,
  FilterList,
  Sort,
  Download,
} from "@mui/icons-material";
import GavelIcon from "@mui/icons-material/Gavel";
// RBAC imports
import { useSelector } from "react-redux";
import {
  selectUserRole,
  selectUserPermissions,
  selectUser,
} from "../../../redux/authSlice";

import api from "../../../api/axiosInstance";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const SearchTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(2),
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontSize: 14,
  fontWeight: "bold",
  padding: theme.spacing(2),
  "&.MuiTableCell-body": {
    color: theme.palette.text.primary,
    fontSize: 14,
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5),
    fontSize: 13,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  },
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
    transition: "background-color 0.2s ease",
  },
}));

const DisciplinaryActions = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingAction, setEditingAction] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [registeredEmployees, setRegisteredEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedAction, setExpandedAction] = useState(null);
  const userRole = useSelector(selectUserRole);
  const userPermissions = useSelector(selectUserPermissions);
  const currentUser = useSelector(selectUser);

  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // 0-600px
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md")); // 600-900px
  const isSmallDesktop = useMediaQuery(theme.breakpoints.between("md", "lg")); // 900-1200px
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up("lg")); // 1200px+

  const actionStatuses = [
    "Warning",
    "Suspension",
    "Termination",
    "Written Notice",
  ];

  const initialFormState = {
    employee: "",
    action: "",
    description: "",
    startDate: "",
    status: "",
    attachments: null,
    employeeId: "",
    email: "",
    department: "",
    designation: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);

  // Permission helper functions
  const canCreateActions = () => {
    return ["hr", "admin"].includes(userRole?.toLowerCase());
  };

  const canEditActions = () => {
    return ["hr", "admin"].includes(userRole?.toLowerCase());
  };

  const canDeleteActions = () => {
    return ["hr", "admin"].includes(userRole?.toLowerCase());
  };

  const canViewAllActions = () => {
    return ["hr", "admin", "employee"].includes(userRole?.toLowerCase());
  };

  // Add this after your permission helper functions
  const getColumnSpan = () => {
    let baseColumns = isMobile ? 6 : 8; // Adjust based on your current column count
    if (canEditActions() || canDeleteActions()) {
      baseColumns += 1; // Add 1 for Actions column
    }
    return baseColumns;
  };

  // Replace the current handleDelete function with these two functions
  const handleDeleteClick = (action) => {
    setActionToDelete(action);
    setDeleteDialogOpen(true);
  };

  // const handleConfirmDelete = async () => {
  //   if (!actionToDelete) return;

  //   try {
  //     setLoading(true);
  //     // const token = getAuthToken();
  //     const response = await fetch(
  //       `/disciplinary-actions/${actionToDelete._id}`,
  //       {
  //         method: "DELETE"
  //         // ,
  //         // headers: {
  //         //   'Authorization': `Bearer ${token}`
  //         // }
  //       }
  //     );

  //     if (!response.ok) throw new Error("Failed to delete action");

  //     showSnackbar("Action deleted successfully");
  //     fetchActions();
  //   } catch (error) {
  //     showSnackbar("Error deleting action", "error");
  //   } finally {
  //     setLoading(false);
  //     handleCloseDeleteDialog();
  //   }
  // };

  // With this api call:
  const handleConfirmDelete = async () => {
    if (!actionToDelete) return;

    try {
      setLoading(true);
      await api.delete(`/disciplinary-actions/${actionToDelete._id}`);

      showSnackbar("Action deleted successfully");
      fetchActions();
    } catch (error) {
      showSnackbar("Error deleting action", "error");
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setActionToDelete(null);
  };

  useEffect(() => {
    fetchActions();
    fetchRegisteredEmployees();
  }, [searchQuery, filterStatus]);

  // // In fetchActions function, add filtering logic
  // const fetchActions = async () => {
  //   try {
  //     setLoading(true);
  //     let apiUrl = `/disciplinary-actions?searchQuery=${searchQuery}&status=${filterStatus}`;

  //     // If user is employee, filter by their employee ID
  //     if (userRole?.toLowerCase() === 'employee') {
  //       apiUrl += `&employeeId=${currentUser?.employeeId || currentUser?.Emp_ID}`;
  //     }

  //     const response = await api.get(apiUrl);
  //     setActions(response.data);
  //   } catch (error) {
  //     showSnackbar("Error fetching actions", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const fetchActions = async () => {
  //   try {
  //     setLoading(true);
  //     let apiUrl = `/disciplinary-actions?searchQuery=${searchQuery}&status=${filterStatus}`;

  //     const response = await api.get(apiUrl);
  //     let filteredActions = response.data;

  //     // If user is employee, filter client-side as backup
  //     if (userRole?.toLowerCase() === "employee") {
  //       const employeeId =
  //         currentUser?.employeeId || currentUser?.Emp_ID || currentUser?.empId;

  //       if (employeeId) {
  //         filteredActions = response.data.filter(
  //           (action) =>
  //             action.employeeId === employeeId ||
  //             action.empId === employeeId ||
  //             action.Emp_ID === employeeId
  //         );
  //       } else if (currentUser?.email) {
  //         // Fallback: filter by email
  //         filteredActions = response.data.filter(
  //           (action) => action.email === currentUser.email
  //         );
  //       }
  //     }

  //     setActions(filteredActions);
  //   } catch (error) {
  //     console.error("Error fetching actions:", error);
  //     showSnackbar("Error fetching actions", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

//   const fetchActions = async () => {
//   try {
//     setLoading(true);
//     let apiUrl = `/disciplinary-actions?searchQuery=${searchQuery}&status=${filterStatus}`;

//     const response = await api.get(apiUrl);
//     let filteredActions = response.data;

//     if (userRole?.toLowerCase() === "employee") {
//       const employeeId = [currentUser?.employeeId, currentUser?.Emp_ID, currentUser?.empId].find((id) => id);

//       if (employeeId) {
//         filteredActions = response.data.filter(
//           (action) => action.employeeId === employeeId
//         );
//       } else if (currentUser?.email) {
//         // Fallback: filter by email
//         filteredActions = response.data.filter(
//           (action) => action.email === currentUser.email
//         );
//       } else {
//         // If no employeeId or email is found, return an empty array
//         filteredActions = [];
//       }
//     } else {
//       // If user is not an employee, return all actions
//       filteredActions = response.data;
//     }

//     setActions(filteredActions);
//   } catch (error) {
//     console.error("Error fetching actions:", error);
//     showSnackbar("Error fetching actions", "error");
//   } finally {
//     setLoading(false);
//   }
// };

const fetchActions = async () => {
  try {
    setLoading(true);
    let apiUrl = `/disciplinary-actions?searchQuery=${searchQuery}&status=${filterStatus}`;

    // If user is employee, filter by their employee ID
    if (userRole?.toLowerCase() === 'employee') {
      const employeeId =
        currentUser?.employeeId || currentUser?.Emp_ID || currentUser?.empId;
      apiUrl += `&employeeId=${employeeId}`;
    }

    const response = await api.get(apiUrl);
    setActions(response.data);
  } catch (error) {
    console.error("Error fetching actions:", error);
    showSnackbar("Error fetching actions", "error");
  } finally {
    setLoading(false);
  }
};

  const fetchRegisteredEmployees = async () => {
    try {
      setLoadingEmployees(true);
      // const token = getAuthToken();
      const response = await api.get(
        "/employees/registered"
        // ,
        // {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      setRegisteredEmployees(response.data);
      setLoadingEmployees(false);
    } catch (error) {
      console.error("Error fetching registered employees:", error);
      showSnackbar("Error fetching employees", "error");
      setLoadingEmployees(false);
    }
  };

  const handleEmployeeSelect = (event, employee) => {
    setSelectedEmployee(employee);
    if (employee) {
      // Populate the form with employee data
      const fullName = `${employee.personalInfo?.firstName || ""} ${
        employee.personalInfo?.lastName || ""
      }`.trim();
      setFormData({
        ...formData,
        employee: fullName,
        employeeId: employee.Emp_ID || "",
        email: employee.personalInfo?.email || "",
        department: employee.joiningDetails?.department || "",
        designation: employee.joiningDetails?.initialDesignation || "",
      });
    } else {
      // Reset employee-related fields if selection is cleared
      setFormData({
        ...formData,
        employee: "",
        employeeId: "",
        email: "",
        department: "",
        designation: "",
      });
    }
  };

  const handleClickOpen = () => {
    setEditingAction(null);
    setFormData(initialFormState);
    setSelectedEmployee(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingAction(null);
    setSelectedEmployee(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e) => {
    setFormData((prev) => ({
      ...prev,
      attachments: e.target.files[0],
    }));
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async () => {
    const requiredFields = [
      "employee",
      "action",
      "description",
      "startDate",
      "status",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      showSnackbar(
        `Missing required fields: ${missingFields.join(", ")}`,
        "error"
      );
      return;
    }
    try {
      setLoading(true);
      const formDataToSend = new FormData();

      // Add all form fields to FormData
      Object.keys(formData).forEach((key) => {
        if (key !== "attachments") {
          formDataToSend.append(key, formData[key]);
          console.log(`Appending ${key}: ${formData[key]}`);
        }
      });

      if (formData.attachments) {
        formDataToSend.append("attachment", formData.attachments);
        console.log(`Appending file: ${formData.attachments.name}`);
      }

      console.log("Sending form data to server...");

      if (editingAction) {
        const response = await api.put(
          `/disciplinary-actions/${editingAction._id}`,
          formDataToSend
        );
        console.log("Server response:", response.data);
      } else {
        const response = await api.post(
          "/disciplinary-actions",
          formDataToSend
        );
        console.log("Server response:", response.data);
      }

      showSnackbar(
        editingAction
          ? "Action updated successfully"
          : "Action created successfully"
      );
      fetchActions();
      handleClose();
    } catch (error) {
      console.error("Error saving action:", error);
      console.error("Error response:", error.response?.data);
      showSnackbar(
        `Error: ${error.response?.data?.message || error.message}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (action) => {
    setEditingAction(action);

    // Find the employee if there's an employeeId
    const employee = action.employeeId
      ? registeredEmployees.find((emp) => emp.Emp_ID === action.employeeId)
      : null;

    setSelectedEmployee(employee);

    setFormData({
      ...action,
      attachments: null, // Reset file input
    });

    setOpen(true);
  };

  const downloadFile = async (filename, originalName) => {
    try {
      const response = await api.get(
        `/disciplinary-actions/attachment/${filename}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showSnackbar("Error downloading file", "error");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Warning: "warning",
      Suspension: "error",
      Termination: "error",
      "Written Notice": "info",
    };
    return colors[status] || "default";
  };

  const toggleExpandAction = (id) => {
    setExpandedAction(expandedAction === id ? null : id);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Typography
        variant="h4"
        sx={{
          mb: { xs: 2, sm: 3, md: 4 },
          color: theme.palette.primary.main,
          fontWeight: 600,
          letterSpacing: 0.5,
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
        }}
      >
        Disciplinary Actions
      </Typography>

      <StyledPaper sx={{ p: { xs: 2, sm: 2, md: 3 } }}>
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "column", md: "row" }}
          alignItems={{ xs: "flex-start", sm: "flex-start", md: "center" }}
          gap={2}
          sx={{
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <SearchTextField
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              width: { xs: "100%", sm: "100%", md: "300px", lg: "350px" },
              marginRight: { xs: 0, md: "auto" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="primary" />
                </InputAdornment>
              ),
            }}
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1, sm: 2 },
              width: { xs: "100%", sm: "100%", md: "auto" },
              justifyContent: {
                xs: "flex-start",
                sm: "space-between",
                md: "flex-end",
              },
            }}
          >
            <TextField
              select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="small"
              sx={{
                width: { xs: "100%", sm: "48%", md: "200px" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.spacing(2),
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterList color="primary" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {actionStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            {canCreateActions() && (
              <Button
                variant="contained"
                onClick={handleClickOpen}
                sx={{
                  height: { xs: "auto", sm: "40px" },
                  padding: { xs: "8px 16px", sm: "6px 16px" },
                  width: { xs: "100%", sm: "48%", md: "auto" },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                  color: "white",
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                  },
                  whiteSpace: "nowrap",
                }}
              >
                Take An Action
              </Button>
            )}
          </Box>
        </Box>
      </StyledPaper>

      {/* Responsive Table */}
      <Box sx={{ overflowX: "auto" }}>
        <TableContainer
          component={Paper}
          elevation={3}
          sx={{
            borderRadius: 2,
            mb: 4,
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          <Table
            stickyHeader
            sx={{ minWidth: isMobile ? 800 : isTablet ? 900 : 1000 }}
          >
            <TableHead>
              <TableRow>
                <StyledTableCell>Employee</StyledTableCell>
                {!isMobile && <StyledTableCell>Employee ID</StyledTableCell>}
                {!isMobile && <StyledTableCell>Department</StyledTableCell>}
                <StyledTableCell>Action Type</StyledTableCell>
                <StyledTableCell>Description</StyledTableCell>
                {!isMobile && <StyledTableCell>Start Date</StyledTableCell>}
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Attachments</StyledTableCell>
                {(canEditActions() || canDeleteActions()) && (
                  <StyledTableCell align="center">Actions</StyledTableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={getColumnSpan()}
                    align="center"
                    sx={{ py: 4 }}
                  >
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2 }}>Loading actions...</Typography>
                  </TableCell>
                </TableRow>
              ) : actions.length > 0 ? (
                actions.map((action) => (
                  <StyledTableRow key={action._id}>
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {action.employee}
                        </Typography>
                        {isMobile && (
                          <>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {action.employeeId} • {action.department}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(action.startDate).toLocaleDateString()}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </TableCell>
                    {!isMobile && <TableCell>{action.employeeId}</TableCell>}
                    {!isMobile && <TableCell>{action.department}</TableCell>}
                    <TableCell>{action.action}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: { xs: 120, sm: 150, md: 200 },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {action.description}
                      </Typography>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        {new Date(action.startDate).toLocaleDateString()}
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={action.status}
                        color={getStatusColor(action.status)}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>

                    <TableCell>
                      {action.attachments && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            downloadFile(
                              action.attachments.filename,
                              action.attachments.originalName
                            )
                          }
                        >
                          <Download />
                        </IconButton>
                      )}
                    </TableCell>

                    {/* <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(action)}
                          sx={{
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.1
                            ),
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.2
                              ),
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(action)}
                          sx={{
                            backgroundColor: alpha(
                              theme.palette.error.main,
                              0.1
                            ),
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette.error.main,
                                0.2
                              ),
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell> */}
                    {(canEditActions() || canDeleteActions()) && (
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          {canEditActions() && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(action)}
                              sx={{
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.1
                                ),
                                "&:hover": {
                                  backgroundColor: alpha(
                                    theme.palette.primary.main,
                                    0.2
                                  ),
                                },
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          )}
                          {canDeleteActions() && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(action)}
                              sx={{
                                backgroundColor: alpha(
                                  theme.palette.error.main,
                                  0.1
                                ),
                                "&:hover": {
                                  backgroundColor: alpha(
                                    theme.palette.error.main,
                                    0.2
                                  ),
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </StyledTableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={getColumnSpan()}
                    align="center"
                    sx={{ py: 4 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <GavelIcon
                        sx={{
                          fontSize: 40,
                          color: "text.secondary",
                          opacity: 0.5,
                        }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        No disciplinary actions found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery || filterStatus !== "all"
                          ? "Try adjusting your search or filters"
                          : "Click 'Take An Action' to create a new disciplinary action"}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create/Edit Dialog */}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : "20px",
            overflow: "hidden",
            margin: isMobile ? 0 : isTablet ? 1 : 2,
            width: isMobile ? "100%" : isTablet ? "90%" : "80%",
            maxWidth: isMobile ? "100%" : isTablet ? "700px" : "900px",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: 600,
            padding: "24px 32px",
          }}
        >
          {editingAction ? "Edit Action" : "Take An Action"}
        </DialogTitle>

        <DialogContent
          sx={{
            padding: "32px",
            backgroundColor: "#f8fafc",
            marginTop: "20px",
          }}
        >
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Employee Selection Autocomplete */}
            <Grid item xs={12}>
              <Autocomplete
                id="employee-select"
                options={registeredEmployees}
                getOptionLabel={(option) =>
                  `${option.Emp_ID} - ${option.personalInfo?.firstName || ""} ${
                    option.personalInfo?.lastName || ""
                  }`
                }
                value={selectedEmployee}
                onChange={handleEmployeeSelect}
                loading={loadingEmployees}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Employee"
                    variant="outlined"
                    fullWidth
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingEmployees ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "white",
                        borderRadius: "12px",
                        "&:hover fieldset": {
                          borderColor: "#1976d2",
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="employee"
                label="Employee Name"
                fullWidth
                required
                value={formData.employee}
                onChange={handleInputChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#1976d2",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email"
                fullWidth
                value={formData.email}
                onChange={handleInputChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="department"
                label="Department"
                fullWidth
                value={formData.department}
                onChange={handleInputChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="designation"
                label="Designation"
                fullWidth
                value={formData.designation}
                onChange={handleInputChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="action"
                label="Action Type"
                select
                fullWidth
                required
                value={formData.action}
                onChange={handleInputChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                }}
              >
                <MenuItem value="Verbal Warning">Verbal Warning</MenuItem>
                <MenuItem value="Written Warning">Written Warning</MenuItem>
                <MenuItem value="Suspension">Suspension</MenuItem>
                <MenuItem value="Termination">Termination</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="startDate"
                label="Start Date"
                type="date"
                fullWidth
                required
                value={formData.startDate}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="status"
                label="Status"
                select
                fullWidth
                required
                value={formData.status}
                onChange={handleInputChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                }}
              >
                {actionStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                multiline
                rows={4}
                fullWidth
                required
                value={formData.description}
                onChange={handleInputChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFile />}
                sx={{
                  borderRadius: "12px",
                  padding: "10px 16px",
                  textTransform: "none",
                }}
              >
                Upload Attachment
                <input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </Button>
              {formData.attachments && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  File selected: {formData.attachments.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            padding: { xs: "16px 24px", sm: "20px 28px", md: "24px 32px" },
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e0e0e0",
            gap: { xs: 1, sm: 2 },
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: { xs: "stretch", sm: "flex-end" },
          }}
        >
          <Button
            onClick={handleClose}
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
              px: { xs: 2, sm: 3 },
              fontWeight: 600,
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "120px" },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            sx={{
              background: "linear-gradient(45deg, #1976d2, #64b5f6)",
              fontSize: { xs: "0.9rem", sm: "0.95rem" },
              textTransform: "none",
              padding: { xs: "8px 24px", sm: "8px 32px" },
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
              "&:hover": {
                background: "linear-gradient(45deg, #1565c0, #42a5f5)",
              },
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "160px" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : editingAction ? (
              "Update Action"
            ) : (
              "Save Action"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "80%", md: "500px" },
            maxWidth: "500px",
            borderRadius: { xs: "12px", sm: "20px" },
            overflow: "hidden",
            margin: { xs: "8px", sm: "16px", md: "32px" },
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #f44336, #ff7961)",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            fontWeight: 600,
            padding: { xs: "16px 24px", sm: "24px 32px" },
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Delete color="white" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent
          sx={{
            padding: { xs: "24px", sm: "32px" },
            backgroundColor: "#f8fafc",
            paddingTop: { xs: "24px", sm: "32px" },
          }}
        >
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete this disciplinary action?
          </Alert>
          {actionToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
              <Typography variant="body1" fontWeight={600} color="#2c3e50">
                Employee: {actionToDelete.employee}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Action Type: {actionToDelete.action}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {actionToDelete.status}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {new Date(actionToDelete.startDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            padding: { xs: "16px 24px", sm: "24px 32px" },
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e0e0e0",
            gap: 2,
          }}
        >
          <Button
            onClick={handleCloseDeleteDialog}
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
              px: 3,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
            sx={{
              background: "linear-gradient(45deg, #f44336, #ff7961)",
              fontSize: "0.95rem",
              textTransform: "none",
              padding: "8px 32px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg, #d32f2f, #f44336)",
              },
            }}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DisciplinaryActions;
