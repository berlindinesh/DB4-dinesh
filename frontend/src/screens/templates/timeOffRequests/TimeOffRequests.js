import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import {
  alpha,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  MenuItem,
  Grid,
  Chip,
  Divider,
  Tooltip,
  Alert,
  Snackbar,
  Container,
  Card,
  CardContent,
  Stack,
  useMediaQuery,
  useTheme,
  Fade,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Search,
  Visibility,
  Close,
  Edit,
  Delete,
  Add,
  AccessTime,
} from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import api, { retryRequest } from "../../../api/axiosInstance";
import { useNotifications } from "../../../context/NotificationContext";
import { io } from "socket.io-client";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontSize: 14,
  fontWeight: "bold",
  padding: theme.spacing(2),
  whiteSpace: "normal",
  "&.MuiTableCell-body": {
    color: theme.palette.text.primary,
    fontSize: 14,
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
    padding: { xs: theme.spacing(1.5), sm: theme.spacing(2) },
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
  // Hide last border
  "&:last-child td, &:last-child th": {
    borderBottom: 0,
  },
}));

const TimeOffRequests = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // Current user state
  const [currentUser, setCurrentUser] = useState(null);
  const userId = localStorage.getItem("userId");
  const employeeId = localStorage.getItem("employeeId");
  const { addTimeOffNotification } = useNotifications();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const initialFormState = {
    name: "",
    empId: "",
    userId: userId,
    date: new Date(),
    day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
    checkIn: "09:00",
    checkOut: "18:00",
    shift: "Morning",
    workType: "On-Site",
    minHour: "8",
    atWork: "8",
    overtime: "0",
    comment: "",
    status: "Pending",
  };

  const [formData, setFormData] = useState(initialFormState);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { addNotification } = useNotifications();

  const shiftOptions = ["Morning", "Evening", "Night"];
  const workTypeOptions = ["On-Site", "Remote", "Hybrid"];
  const statusOptions = ["Pending", "Approved", "Rejected", "All"];

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await api.get(
          `/employees/by-user/${userId}`
        );
        if (response.data.success) {
          setCurrentUser(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showSnackbar("Error fetching user data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [searchTerm, filterStatus, userId]);

  useEffect(() => {
    if (!userId) return;

    console.log(
      "Setting up WebSocket connection for time off requests:",
      userId
    );

    // Connect to WebSocket
    const socket = io(`${process.env.REACT_APP_API_URL}`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Handle connection events for debugging
    socket.on("connect", () => {
      console.log("Socket connected successfully in TimeOffRequests");

      // Join a room specific to this user
      socket.emit("join", { userId });
      console.log("Joined room:", userId);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error in TimeOffRequests:", error);
    });

    // Listen for new notifications related to time off requests
    socket.on("new-notification", (notification) => {
      // If the notification is about a time off request, refresh the requests
      if (notification.type === "timesheet" && notification.userId === userId) {
        console.log("Received time off request notification:", notification);
        fetchRequests();

        // Show a snackbar with the notification message
        showSnackbar(
          notification.message,
          notification.status === "approved" ? "success" : "error"
        );
      }
    });

    // Clean up on unmount
    return () => {
      console.log("Cleaning up socket connection in TimeOffRequests");
      socket.disconnect();
    };
  }, [userId]);

  // The rest of the component remains the same

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date) => {
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    setFormData({
      ...formData,
      date,
      day,
    });
  };

  const handleCreateNew = () => {
    // Pre-fill the form with current user data if available
    if (currentUser && currentUser.personalInfo) {
      setFormData({
        ...initialFormState,
        name: `${currentUser.personalInfo.firstName || ""} ${
          currentUser.personalInfo.lastName || ""
        }`.trim(),
        empId: currentUser.Emp_ID || employeeId || "",
        userId: userId,
      });
    } else {
      setFormData({
        ...initialFormState,
        userId: userId,
      });
    }
    setEditMode(false);
    setCreateOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "warning",
      Approved: "success",
      Rejected: "error",
    };
    return colors[status] || "default";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    return timeString;
  };



//   // Add this function to get the auth token
// const getAuthToken = () => {
//   return localStorage.getItem('token');
// };

// // Update the fetchRequests function
// const fetchRequests = async () => {
//   try {
//     if (!userId) {
//       setRequests([]);
//       return;
//     }

//     setLoading(true);
//     // const token = getAuthToken();
//     const response = await api.get(
//       `/time-off-requests/by-user/${userId}?searchTerm=${searchTerm}&status=${filterStatus}`,
//       // {
//       //   headers: {
//       //     'Authorization': `Bearer ${token}`
//       //   }
//       // }
//     );
//     setRequests(response.data);
//   } catch (error) {
//     console.error("Error fetching requests:", error);
//     showSnackbar("Error fetching requests", "error");
//   } finally {
//     setLoading(false);
//   }
// };

// // Update the fetchRequests function
// const fetchRequests = async () => {
//   try {
//     if (!userId) {
//       setRequests([]);
//       return;
//     }

//     setLoading(true);
//     // Use the retryRequest utility function from axiosInstance.js
//     const response = await retryRequest(() => 
//       api.get(`/time-off-requests/by-user/${userId}?searchTerm=${searchTerm}&status=${filterStatus}`)
//     );
//     setRequests(response.data);
//   } catch (error) {
//     console.error("Error fetching requests:", error);
//     showSnackbar("Error fetching requests", "error");
//   } finally {
//     setLoading(false);
//   }
// };

// Update the fetchRequests function
const fetchRequests = async () => {
  try {
    if (!userId) {
      setRequests([]);
      return;
    }

    setLoading(true);
    // Change from /by-user/ to /user/ to match the backend route
    const response = await retryRequest(() => 
      api.get(`/time-off-requests/user/${userId}?searchTerm=${searchTerm}&status=${filterStatus}`)
    );
    setRequests(response.data);
  } catch (error) {
    console.error("Error fetching requests:", error);
    showSnackbar("Error fetching requests", "error");
  } finally {
    setLoading(false);
  }
};


// // Update the handlePreview function
// const handlePreview = async (id) => {
//   try {
//     // const token = getAuthToken();
//     const response = await api.get(
//       `/time-off-requests/${id}`,
//       // {
//       //   headers: {
//       //     'Authorization': `Bearer ${token}`
//       //   }
//       // }
//     );
//     setSelectedRequest(response.data);
//     setPreviewOpen(true);
//   } catch (error) {
//     showSnackbar("Error fetching request details", "error");
//   }
// };

// Update the handlePreview function
const handlePreview = async (id) => {
  try {
    const response = await retryRequest(() => 
      api.get(`/time-off-requests/${id}`)
    );
    setSelectedRequest(response.data);
    setPreviewOpen(true);
  } catch (error) {
    showSnackbar("Error fetching request details", "error");
  }
};


// // Update the handleEdit function
// const handleEdit = async (id) => {
//   try {
//     // const token = getAuthToken();
//     const response = await api.get(
//       `/time-off-requests/${id}`,
//       // {
//       //   headers: {
//       //     'Authorization': `Bearer ${token}`
//       //   }
//       // }
//     );
//     const requestData = response.data;

//     setFormData({
//       ...requestData,
//       date: new Date(requestData.date),
//     });

//     setEditMode(true);
//     setSelectedRequest(requestData);
//     setCreateOpen(true);
//   } catch (error) {
//     showSnackbar("Error fetching request details", "error");
//   }
// };

// Update the handleEdit function
const handleEdit = async (id) => {
  try {
    const response = await retryRequest(() => 
      api.get(`/time-off-requests/${id}`)
    );
    const requestData = response.data;

    setFormData({
      ...requestData,
      date: new Date(requestData.date),
    });

    setEditMode(true);
    setSelectedRequest(requestData);
    setCreateOpen(true);
  } catch (error) {
    showSnackbar("Error fetching request details", "error");
  }
};

// // Update the handleDelete function
// const handleDelete = async () => {
//   try {
//     // const token = getAuthToken();
//     await api.delete(
//       `/time-off-requests/${selectedRequest._id}`,
//       // {
//       //   headers: {
//       //     'Authorization': `Bearer ${token}`
//       //   }
//       // }
//     );
//     showSnackbar("Request deleted successfully");
//     fetchRequests();
//     setDeleteOpen(false);
//   } catch (error) {
//     showSnackbar("Error deleting request", "error");
//   }
// };

// Update the handleDelete function
const handleDelete = async () => {
  try {
    await retryRequest(() => 
      api.delete(`/time-off-requests/${selectedRequest._id}`)
    );
    showSnackbar("Request deleted successfully");
    fetchRequests();
    setDeleteOpen(false);
  } catch (error) {
    showSnackbar("Error deleting request", "error");
  }
};

// // Update the handleSave function
// const handleSave = async () => {
//   try {
//     const requiredFields = [
//       "name",
//       "empId",
//       "date",
//       "day",
//       "checkIn",
//       "checkOut",
//       "shift",
//       "workType",
//       "minHour",
//       "atWork",
//     ];
//     const missingFields = requiredFields.filter((field) => !formData[field]);

//     if (missingFields.length > 0) {
//       throw new Error(`Required fields missing: ${missingFields.join(", ")}`);
//     }

//     // Add userId to the form data
//     const formattedData = {
//       ...formData,
//       userId: userId, // Add the current user's ID
//       minHour: Number(formData.minHour),
//       atWork: Number(formData.atWork),
//       overtime: Number(formData.overtime) || 0,
//       date: new Date(formData.date).toISOString(),
//     };

//     // const token = getAuthToken();
//     const url = editMode
//       ? `/time-off-requests/${selectedRequest._id}`
//       : "/time-off-requests";

//     const response = await api({
//       method: editMode ? "PUT" : "POST",
//       url,
//       data: formattedData,
//       // headers: {
//       //   'Authorization': `Bearer ${token}`
//       // }
//     });

//     showSnackbar(
//       editMode
//         ? "Request updated successfully"
//         : "Request created successfully"
//     );
//     fetchRequests();
//     setCreateOpen(false);
//     setFormData(initialFormState);
//   } catch (error) {
//     showSnackbar(error.message, "error");
//   }
// };

// Update the handleSave function
const handleSave = async () => {
  try {
    const requiredFields = [
      "name",
      "empId",
      "date",
      "day",
      "checkIn",
      "checkOut",
      "shift",
      "workType",
      "minHour",
      "atWork",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Required fields missing: ${missingFields.join(", ")}`);
    }

    // Add userId to the form data
    const formattedData = {
      ...formData,
      userId: userId, // Add the current user's ID
      minHour: Number(formData.minHour),
      atWork: Number(formData.atWork),
      overtime: Number(formData.overtime) || 0,
      date: new Date(formData.date).toISOString(),
    };

    const url = editMode
      ? `/time-off-requests/${selectedRequest._id}`
      : "/time-off-requests";

    await retryRequest(() => 
      api({
        method: editMode ? "PUT" : "POST",
        url,
        data: formattedData,
      })
    );

    showSnackbar(
      editMode
        ? "Request updated successfully"
        : "Request created successfully"
    );
    fetchRequests();
    setCreateOpen(false);
    setFormData(initialFormState);
  } catch (error) {
    showSnackbar(error.message, "error");
  }
};


  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Box>
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
          My Time Off Requests
        </Typography>
      </Box>

      <StyledPaper sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={2}
          sx={{
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <TextField
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              width: { xs: "100%", sm: "300px" },
              marginRight: { xs: 0, sm: "auto" },
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
              gap: { xs: 1, sm: 1 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateNew}
              startIcon={<Add />}
              sx={{
                height: { xs: "auto", sm: 50 },
                padding: { xs: "8px 16px", sm: "6px 16px" },
                width: { xs: "100%", sm: "auto" },
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                color: "white",
                "&:hover": {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                },
              }}
            >
              New Request
            </Button>
          </Box>
        </Box>
      </StyledPaper>
      {/* Status Filter buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          mb: 2,
        }}
      >
        <Button
          sx={{
            color: "green",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setFilterStatus("Approved")}
        >
          ● Approved
        </Button>
        <Button
          sx={{
            color: "red",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setFilterStatus("Rejected")}
        >
          ● Rejected
        </Button>
        <Button
          sx={{
            color: "orange",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setFilterStatus("Pending")}
        >
          ● Pending
        </Button>
        <Button
          sx={{
            color: "gray",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setFilterStatus("all")}
        >
          ● All
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            my: 6,
          }}
        >
          <CircularProgress
            size={40}
            thickness={4}
            sx={{ color: theme.palette.primary.main }}
          />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Loading your time off requests...
          </Typography>
        </Box>
      ) : (
        <>
          {requests.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: { xs: 450, sm: 500, md: 550 },
                overflowY: "auto",
                overflowX: "auto",
                mx: 0,
                borderRadius: 2,
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                mb: 4,
                "& .MuiTableContainer-root": {
                  scrollbarWidth: "thin",
                  "&::-webkit-scrollbar": {
                    width: 8,
                    height: 8,
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: alpha(theme.palette.primary.light, 0.1),
                    borderRadius: 8,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: 8,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  },
                },
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <StyledTableCell sx={{ minWidth: 130 }}>
                      Date
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 120 }}>
                      Time
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 100 }}>
                      Shift
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 100 }}>
                      Work Type
                    </StyledTableCell>
                    <StyledTableCell sx={{ minWidth: 100 }}>
                      Status
                    </StyledTableCell>
                    <StyledTableCell
                      sx={{ minWidth: 120, textAlign: "center" }}
                    >
                      Actions
                    </StyledTableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {requests.map((request) => (
                    <StyledTableRow key={request._id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography variant="body2" fontWeight={500}>
                            {formatDate(request.date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.day}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTime(request.checkIn)} -{" "}
                          {formatTime(request.checkOut)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.shift}
                          size="small"
                          sx={{
                            backgroundColor: alpha(
                              theme.palette.primary.light,
                              0.1
                            ),
                            color: theme.palette.primary.dark,
                            fontWeight: 500,
                            borderRadius: "4px",
                            "& .MuiChip-label": { px: 1 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.workType}
                          size="small"
                          sx={{
                            backgroundColor: alpha(
                              theme.palette.success.light,
                              0.1
                            ),
                            color: theme.palette.success.dark,
                            fontWeight: 500,
                            borderRadius: "4px",
                            "& .MuiChip-label": { px: 1 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "inline-block",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            fontWeight: "medium",
                            backgroundColor:
                              request.status === "Approved"
                                ? alpha("#4caf50", 0.1)
                                : request.status === "Rejected"
                                ? alpha("#f44336", 0.1)
                                : alpha("#ff9800", 0.1),
                            color:
                              request.status === "Approved"
                                ? "#2e7d32"
                                : request.status === "Rejected"
                                ? "#d32f2f"
                                : "#e65100",
                          }}
                        >
                          {request.status}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handlePreview(request._id)}
                              color="info"
                              sx={{
                                backgroundColor: alpha(
                                  theme.palette.info.main,
                                  0.1
                                ),
                                "&:hover": {
                                  backgroundColor: alpha(
                                    theme.palette.info.main,
                                    0.2
                                  ),
                                },
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {request.status === "Pending" && (
                            <>
                              <Tooltip title="Edit Request">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(request._id)}
                                  color="primary"
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
                              </Tooltip>
                              <Tooltip title="Delete Request">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setDeleteOpen(true);
                                  }}
                                  color="error"
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
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </StyledTableRow>
                  ))}

                  {requests.length > 0 &&
                    requests.filter(
                      (request) =>
                        (filterStatus === "all" ||
                          request.status === filterStatus) &&
                        (request.name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                          request.empId
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()))
                    ).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body1" color="text.secondary">
                            No time off requests found matching your filters.
                          </Typography>
                          <Button
                            variant="text"
                            color="primary"
                            onClick={() => {
                              setSearchTerm("");
                              setFilterStatus("all");
                            }}
                            sx={{ mt: 1 }}
                          >
                            Clear filters
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Card
              sx={{
                textAlign: "center",
                py: 6,
                borderRadius: 2,
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: "blur(8px)",
              }}
            >
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <AccessTime
                    sx={{
                      fontSize: 60,
                      color: alpha(theme.palette.primary.main, 0.2),
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="h5"
                    color="text.primary"
                    gutterBottom
                    fontWeight={600}
                  >
                    No time off requests found
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: 500, mx: "auto" }}
                  >
                    You haven't created any time off requests yet. Create your
                    first request to get started.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateNew}
                  startIcon={<Add />}
                  sx={{
                    mt: 2,
                    px: 3,
                    py: 1,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                    boxShadow: `0 3px 5px 2px ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                    "&:hover": {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                    },
                  }}
                >
                  Create New Request
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {editMode ? "Edit Time Off Request" : "Create New Time Off Request"}
          </Typography>
          <IconButton onClick={() => setCreateOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={!!currentUser} // Disable if current user data is available
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employee ID"
                name="empId"
                value={formData.empId}
                onChange={handleInputChange}
                required
                disabled={!!currentUser} // Disable if current user data is available
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Day"
                name="day"
                value={formData.day}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Check In Time"
                name="checkIn"
                type="time"
                value={formData.checkIn}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Check Out Time"
                name="checkOut"
                type="time"
                value={formData.checkOut}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Shift</InputLabel>
                <Select
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                  label="Shift"
                  required
                >
                  {shiftOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Work Type</InputLabel>
                <Select
                  name="workType"
                  value={formData.workType}
                  onChange={handleInputChange}
                  label="Work Type"
                  required
                >
                  {workTypeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Minimum Hours"
                name="minHour"
                type="number"
                value={formData.minHour}
                onChange={handleInputChange}
                required
                InputProps={{ inputProps: { min: 0 } }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="At Work Hours"
                name="atWork"
                type="number"
                value={formData.atWork}
                onChange={handleInputChange}
                required
                InputProps={{ inputProps: { min: 0 } }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Overtime Hours"
                name="overtime"
                type="number"
                value={formData.overtime}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comment"
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder="Add any additional information about your time off request"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            {editMode ? "Update Request" : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Time Off Request Details</Typography>
          <IconButton onClick={() => setPreviewOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Employee Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Employee ID
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.empId}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip
                          label={selectedRequest.status}
                          color={getStatusColor(selectedRequest.status)}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Time Off Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Date
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedRequest.date)} (
                          {selectedRequest.day})
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Time
                        </Typography>
                        <Typography variant="body1">
                          {formatTime(selectedRequest.checkIn)} -{" "}
                          {formatTime(selectedRequest.checkOut)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Shift & Work Type
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                          <Chip
                            label={selectedRequest.shift}
                            size="small"
                            sx={{
                              backgroundColor: "#e3f2fd",
                              color: "#1976d2",
                            }}
                          />
                          <Chip
                            label={selectedRequest.workType}
                            size="small"
                            sx={{
                              backgroundColor: "#e8f5e9",
                              color: "#2e7d32",
                            }}
                          />
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Additional Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Minimum Hours
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.minHour} hours
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          At Work
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.atWork} hours
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Overtime
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.overtime || 0} hours
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Comment
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.comment || "No comment provided"}
                        </Typography>
                      </Grid>
                      {selectedRequest.reviewComment && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Review Comment
                          </Typography>
                          <Typography variant="body1">
                            {selectedRequest.reviewComment}
                          </Typography>
                        </Grid>
                      )}
                      {selectedRequest.reviewedBy && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Reviewed By
                          </Typography>
                          <Typography variant="body1">
                            {selectedRequest.reviewedBy}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          {selectedRequest && selectedRequest.status === "Pending" && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setPreviewOpen(false);
                handleEdit(selectedRequest._id);
              }}
            >
              Edit Request
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this time off request? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TimeOffRequests;
