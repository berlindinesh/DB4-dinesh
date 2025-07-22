import React, { useState, useEffect } from "react";
import {styled} from "@mui/material/styles";
import api from "../../../api/axiosInstance";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
  Tooltip,
  Snackbar,
  Alert,
  Box,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
} from "@mui/material";
import {
  FilterList,
  Search,
  CheckCircle,
  Cancel,
  ChatBubbleOutline,
  Info,
  DeleteOutline,
  CalendarToday,
  Person,
  Description,
} from "@mui/icons-material";
import "./LeaveRequests.css";
import Popover from "@mui/material/Popover";
import { Stack } from "@mui/material";
import { io } from 'socket.io-client';
import { useNotifications } from '../../../context/NotificationContext';

// Use the new API endpoint for leave requests
const API_URL = "/leave-requests";


const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "personal", label: "Personal Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "earned", label: "Earned Leave" },
];

const LeaveRequests = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { addLeaveRequestNotification } = useNotifications();
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [leaveData, setLeaveData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [leaveToDelete, setLeaveToDelete] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [filters, setFilters] = useState({
    type: "",
    status: "",
    dateRange: { start: "", end: "" },
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

//   // Add this useEffect for socket connection
// useEffect(() => {
//   const userId = localStorage.getItem("userId");
//   if (!userId) return;

//   // Get the base URL from your API configuration
//   const baseURL = ${process.env.REACT_APP_API_URL} || 'http://localhost:5002';
//   const socket = io(baseURL, {
//     reconnection: true,
//     reconnectionAttempts: 5,
//     reconnectionDelay: 1000,
//     query: { userId }
//   });

//   // Listen for new notifications
//   socket.on('new-notification', (notification) => {
//     console.log('Received real-time notification:', notification);
    
//     // If this is a leave notification, show a snackbar and refresh data
//     if (notification.type === 'leave') {
//       showSnackbar(notification.message, notification.status === 'approved' ? 'success' : 'info');
      
//       // Refresh leave data
//       fetchLeaveRequests();
//     }
//   });

//   // Join a room specific to this user
//   socket.emit('join', userId);

//   // Cleanup on component unmount
//   return () => {
//     socket.disconnect();
//   };
// }, []);

// Add this useEffect for socket connection
useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  // Get the base URL from your API configuration
  // Determine the correct Socket.IO URL
const getSocketUrl = () => {
  // For production (EC2/ALB), use current domain so nginx can proxy
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  // For development, use the environment variable or localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5002';
};

const baseURL = getSocketUrl();
const socket = io(baseURL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    query: { userId }
  });

  // Listen for new notifications
  socket.on('new-notification', (notification) => {
    console.log('Received real-time notification:', notification);
    
    // If this is a leave notification, show a snackbar and refresh data
    if (notification.type === 'leave') {
      showSnackbar(notification.message, notification.status === 'approved' ? 'success' : 'info');
      
      // Refresh leave data
      fetchLeaveRequests();
    }
  });

  // Join a room specific to this user
  socket.emit('join', userId);

  // Cleanup on component unmount
  return () => {
    socket.disconnect();
  };
}, []);



 
const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      // const token = getAuthToken();
      
      const response = await api.get(API_URL
        
    );

      // Get current date
      const currentDate = new Date();

      // Filter out leave requests that are older than 30 days after their end date
      // and have been either approved or rejected
      const filteredLeaveData = response.data.filter((leave) => {
        const endDate = new Date(leave.endDate);
        const daysSinceEnd = Math.floor(
          (currentDate - endDate) / (1000 * 60 * 60 * 24)
        );

        // Keep requests if they are:
        // 1. Still pending, OR
        // 2. Less than 30 days old after end date
        return leave.status === "pending" || daysSinceEnd < 30;
      });

      setLeaveData(filteredLeaveData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      showSnackbar("Error fetching leave requests", "error");
      setLoading(false);
    }
  };
 
// const handleApproveRequest = async (id) => {
//   try {
//     setLoading(true);
    
//     // Get the leave request before updating it
//     const leaveToApprove = leaveData.find(leave => leave._id === id);
    
//     if (!leaveToApprove) {
//       showSnackbar("Leave request not found", "error");
//       setLoading(false);
//       return;
//     }
    
//     console.log("Found leave request to approve:", leaveToApprove);
    
//     // Store the employeeCode before making the API call
//     const employeeCodeToNotify = leaveToApprove.employeeCode;
    
//     const response = await api.put(
//       `${API_URL}/${id}/approve`,
//       {}
//     );

//     console.log("Leave request approved, response:", response.data);

//     // Update the local state with the updated leave request
//     setLeaveData(
//       leaveData.map((leave) => (leave._id === id ? response.data : leave))
//     );

//     // Send notification to the employee who submitted the leave request
//     if (employeeCodeToNotify) {
//       console.log("Sending approval notification to employee:", employeeCodeToNotify);
      
//       try {
//         await addLeaveRequestNotification(
//           leaveToApprove.employeeName || "Employee",
//           "approved",
//           employeeCodeToNotify
//         );
        
//         console.log(`Sent approved notification to employee ${employeeCodeToNotify}`);
//       } catch (notificationError) {
//         console.error("Failed to send notification, but leave was approved:", notificationError);
//       }
//     } else {
//       console.error("Cannot send notification: Missing employee code in leave data", leaveToApprove);
//     }

//     showSnackbar("Leave request approved successfully");
//   } catch (error) {
//     console.error("Error approving leave request:", error);
//     showSnackbar("Error approving leave request", "error");
//   } finally {
//     setLoading(false);
//   }
// };

// Update the handleApproveRequest function
const handleApproveRequest = async (id) => {
  try {
    setLoading(true);
    
    // Get the leave request before updating it
    const leaveToApprove = leaveData.find(leave => leave._id === id);
    
    if (!leaveToApprove) {
      showSnackbar("Leave request not found", "error");
      setLoading(false);
      return;
    }
    
    console.log("Found leave request to approve:", leaveToApprove);
    
    // Get the userId from the leave request
    // Note: If userId is not in the leave data, try using employeeCode as a fallback
    const userIdToNotify = leaveToApprove.userId || leaveToApprove.employeeCode;
    
    if (!userIdToNotify) {
      console.error("Cannot find userId or employeeCode in leave data:", leaveToApprove);
      showSnackbar("Error: Cannot identify user for notification", "error");
      setLoading(false);
      return;
    }
    
    console.log("Will notify user with ID:", userIdToNotify);
    
    const response = await api.put(
      `${API_URL}/${id}/approve`,
      {}
    );

    console.log("Leave request approved, response:", response.data);

    // Update the local state with the updated leave request
    setLeaveData(
      leaveData.map((leave) => (leave._id === id ? response.data : leave))
    );

    // Send notification to the employee who submitted the leave request
    console.log("Sending approval notification to user:", userIdToNotify);
    
    try {
      const notificationId = await addLeaveRequestNotification(
        leaveToApprove.employeeName || "Employee",
        "approved",
        userIdToNotify
      );
      
      console.log(`Sent approved notification to user ${userIdToNotify}, notification ID: ${notificationId}`);
    } catch (notificationError) {
      console.error("Failed to send notification, but leave was approved:", notificationError);
    }

    showSnackbar("Leave request approved successfully");
  } catch (error) {
    console.error("Error approving leave request:", error);
    showSnackbar("Error approving leave request", "error");
  } finally {
    setLoading(false);
  }
};

  const handleOpenRejectDialog = (id) => {
    setSelectedLeaveId(id);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

// const handleRejectRequest = async () => {
//   if (!rejectionReason.trim()) {
//     showSnackbar("Rejection reason is required", "error");
//     return;
//   }

//   try {
//     setLoading(true);
    
//     // Get the leave request before updating it
//     const leaveToReject = leaveData.find(leave => leave._id === selectedLeaveId);
    
//     if (!leaveToReject) {
//       showSnackbar("Leave request not found", "error");
//       setLoading(false);
//       setIsRejectDialogOpen(false);
//       return;
//     }
    
//     console.log("Found leave request to reject:", leaveToReject);
    
//     // Store the employeeCode before making the API call
//     const employeeCodeToNotify = leaveToReject.employeeCode;
    
//     const response = await api.put(
//       `${API_URL}/${selectedLeaveId}/reject`,
//       { rejectionReason }
//     );

//     console.log("Leave request rejected, response:", response.data);

//     // Update the local state with the updated leave request
//     setLeaveData(
//       leaveData.map((leave) =>
//         leave._id === selectedLeaveId ? response.data : leave
//       )
//     );

//     // Send notification to the employee who submitted the leave request
//     if (employeeCodeToNotify) {
//       console.log("Sending rejection notification to employee:", employeeCodeToNotify);
      
//       try {
//         await addLeaveRequestNotification(
//           leaveToReject.employeeName || "Employee",
//           "rejected",
//           employeeCodeToNotify
//         );
        
//         console.log(`Sent rejected notification to employee ${employeeCodeToNotify}`);
//       } catch (notificationError) {
//         console.error("Failed to send notification, but leave was rejected:", notificationError);
//       }
//     } else {
//       console.error("Cannot send notification: Missing employee code in leave data", leaveToReject);
//     }

//     setIsRejectDialogOpen(false);
//     showSnackbar("Leave request rejected successfully");
//   } catch (error) {
//     console.error("Error rejecting leave request:", error);
//     showSnackbar("Error rejecting leave request", "error");
//   } finally {
//     setLoading(false);
//   }
// };

// Update the handleRejectRequest function
const handleRejectRequest = async () => {
  if (!rejectionReason.trim()) {
    showSnackbar("Rejection reason is required", "error");
    return;
  }

  try {
    setLoading(true);
    
    // Get the leave request before updating it
    const leaveToReject = leaveData.find(leave => leave._id === selectedLeaveId);
    
    if (!leaveToReject) {
      showSnackbar("Leave request not found", "error");
      setLoading(false);
      setIsRejectDialogOpen(false);
      return;
    }
    
    console.log("Found leave request to reject:", leaveToReject);
    
    // Get the userId from the leave request
    // Note: If userId is not in the leave data, try using employeeCode as a fallback
    const userIdToNotify = leaveToReject.userId || leaveToReject.employeeCode;
    
    if (!userIdToNotify) {
      console.error("Cannot find userId or employeeCode in leave data:", leaveToReject);
      showSnackbar("Error: Cannot identify user for notification", "error");
      setLoading(false);
      setIsRejectDialogOpen(false);
      return;
    }
    
    console.log("Will notify user with ID:", userIdToNotify);
    
    const response = await api.put(
      `${API_URL}/${selectedLeaveId}/reject`,
      { rejectionReason }
    );

    console.log("Leave request rejected, response:", response.data);

    // Update the local state with the updated leave request
    setLeaveData(
      leaveData.map((leave) =>
        leave._id === selectedLeaveId ? response.data : leave
      )
    );

    // Send notification to the employee who submitted the leave request
    console.log("Sending rejection notification to user:", userIdToNotify);
    
    try {
      const notificationId = await addLeaveRequestNotification(
        leaveToReject.employeeName || "Employee",
        "rejected",
        userIdToNotify
      );
      
      console.log(`Sent rejected notification to user ${userIdToNotify}, notification ID: ${notificationId}`);
    } catch (notificationError) {
      console.error("Failed to send notification, but leave was rejected:", notificationError);
    }

    setIsRejectDialogOpen(false);
    showSnackbar("Leave request rejected successfully");
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    showSnackbar("Error rejecting leave request", "error");
  } finally {
    setLoading(false);
  }
};

 const handleOpenCommentDialog = (leaveId) => {
    const leave = leaveData.find((l) => l._id === leaveId);
    setSelectedLeaveId(leaveId);
    setNewComment(leave.comment || "");
    setIsCommentDialogOpen(true);
  };

  const handleCloseCommentDialog = () => {
    setIsCommentDialogOpen(false);
    setSelectedLeaveId(null);
    setNewComment("");
  };
 
 const handleSaveComment = async () => {
    try {
      setLoading(true);
      // const token = getAuthToken();
      
      // Add a comment endpoint to your backend if needed
      const response = await api.put(
        `${API_URL}/${selectedLeaveId}`,
        { comment: newComment }
      );

      // Update the local state with the updated leave request
      setLeaveData(
        leaveData.map((leave) =>
          leave._id === selectedLeaveId ? response.data : leave
        )
      );

      handleCloseCommentDialog();
      showSnackbar("Comment updated successfully");
      setLoading(false);
    } catch (error) {
      console.error("Error updating comment:", error);
      showSnackbar("Error updating comment", "error");
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (id) => {
    setLeaveToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
const handleDeleteRequest = async (id) => {
    try {
      setLoading(true);
      // const token = getAuthToken();
      
      // Instead of deleting, update the status to "cancelled" or similar
      await api.put(
        `${API_URL}/${id}`,
        {
          status: "cancelled",
          comment: "Cancelled by HR"
        }
      );

      // Update the local state
      setLeaveData(
        leaveData.map((leave) =>
          leave._id === id ? { ...leave, status: "cancelled" } : leave
        )
      );

      showSnackbar("Leave request cancelled successfully");
      setLoading(false);
    } catch (error) {
      console.error("Error cancelling leave request:", error);
      showSnackbar("Error cancelling leave request", "error");
      setLoading(false);
    }
  };

 
const handleConfirmDelete = async () => {
    if (!leaveToDelete) return;

    await handleDeleteRequest(leaveToDelete);
    setIsDeleteDialogOpen(false);
    setLeaveToDelete(null);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "status-badge status-approved";
      case "rejected":
        return "status-badge status-rejected";
      case "cancelled":
        return "status-badge status-cancelled";
      default:
        return "status-badge status-pending";
    }
  };

  const getLeaveTypeName = (typeValue) => {
    const leaveType = LEAVE_TYPES.find((type) => type.value === typeValue);
    return leaveType ? leaveType.label : typeValue;
  };

  const calculateDays = (startDate, endDate, isHalfDay) => {
    if (isHalfDay) return 0.5;

    // Use the numberOfDays field if available
    return Math.ceil(
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1
    );
  };

  const filteredLeaveData = leaveData.filter((leave) => {
    const matchesType = !filters.type || leave.leaveType === filters.type;
    const matchesStatus = !filters.status || leave.status === filters.status;

    // Date range filtering
    let matchesDateRange = true;
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      const leaveStartDate = new Date(leave.startDate);

      matchesDateRange =
        leaveStartDate >= startDate && leaveStartDate <= endDate;
    }

    const matchesSearch =
      leave.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leave.reason &&
        leave.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (leave.employeeName &&
        leave.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (leave.employeeCode &&
        leave.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesStatus && matchesSearch && matchesDateRange;
  });

  const renderMobileCard = (leave) => (
  <Card
    key={leave._id}
    sx={{
      mb: 2,
      borderRadius: 2,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      overflow: "hidden",
    }}
  >
    <CardContent sx={{ p: 0 }}>
      {/* Card Header with Employee Info and Status */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
          backgroundColor: alpha(theme.palette.primary.light, 0.05),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.primary.main, 0.8),
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            {leave.employeeName?.[0] || "U"}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {leave.employeeName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {leave.employeeCode}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "inline-block",
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontSize: "0.75rem",
            fontWeight: "medium",
            backgroundColor:
              leave.status === "approved"
                ? alpha("#4caf50", 0.1)
                : leave.status === "rejected"
                ? alpha("#f44336", 0.1)
                : alpha("#ff9800", 0.1),
            color:
              leave.status === "approved"
                ? "#2e7d32"
                : leave.status === "rejected"
                ? "#d32f2f"
                : "#e65100",
          }}
        >
          {leave.status}
        </Box>
      </Box>

      {/* Card Body with Leave Details */}
      <Box sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center" }}>
              <Person fontSize="small" sx={{ mr: 0.5 }} />
              Leave Type:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {getLeaveTypeName(leave.leaveType)}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center" }}>
              <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
              Duration:
            </Typography>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" fontWeight={500}>
                {new Date(leave.startDate).toLocaleDateString()} -{" "}
                {new Date(leave.endDate).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {leave.halfDay
                  ? "Half Day"
                  : `${
                      leave.numberOfDays ||
                      calculateDays(leave.startDate, leave.endDate, leave.halfDay)
                    } days`}
                {leave.halfDay && ` (${leave.halfDayType})`}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <Description fontSize="small" sx={{ mr: 0.5 }} />
              Reason:
            </Typography>
            <Typography variant="body2" sx={{ pl: 3 }}>
              {leave.reason}
            </Typography>
          </Box>

          {leave.status === "rejected" && leave.rejectionReason && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Info fontSize="small" sx={{ mr: 0.5 }} />
                Rejection Reason:
              </Typography>
              <Typography variant="body2" color="error.main" sx={{ pl: 3 }}>
                {leave.rejectionReason}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Card Footer with Action Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          p: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
          backgroundColor: alpha(theme.palette.primary.light, 0.02),
        }}
      >
        {leave.status === "pending" && (
          <>
            <Tooltip title="Approve">
              <IconButton
                onClick={() => handleApproveRequest(leave._id)}
                color="success"
                disabled={loading}
                size="small"
                sx={{
                  backgroundColor: alpha("#4caf50", 0.1),
                  "&:hover": {
                    backgroundColor: alpha("#4caf50", 0.2),
                  },
                }}
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reject">
              <IconButton
                onClick={() => handleOpenRejectDialog(leave._id)}
                color="error"
                disabled={loading}
                size="small"
                sx={{
                  backgroundColor: alpha("#f44336", 0.1),
                  "&:hover": {
                    backgroundColor: alpha("#f44336", 0.2),
                  },
                }}
              >
                <Cancel />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title="View/Add Comment">
          <IconButton
            onClick={() => handleOpenCommentDialog(leave._id)}
            disabled={loading}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <ChatBubbleOutline />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancel Request">
          <IconButton
            onClick={() => handleOpenDeleteDialog(leave._id)}
            color="error"
            disabled={loading}
            className="delete-button"
            size="small"
            sx={{
              backgroundColor: alpha("#f44336", 0.1),
              "&:hover": {
                backgroundColor: alpha("#f44336", 0.2),
              },
            }}
          >
            <DeleteOutline />
          </IconButton>
        </Tooltip>
      </Box>
    </CardContent>
  </Card>
);


  return (
    <div className="leave-requests-container">
      <Box
  sx={{
    p: { xs: 2, sm: 3, md: 4 },
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  }}
>
     
        
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
    Leave Requests Management
  </Typography>

       

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
        //className="leave-requests-search"
        placeholder="Search by employee, type, status or reason..."
        variant="outlined"
        size="small"
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          width: { xs: "100%", sm: "300px" },
          marginRight: { xs: 0, sm: "auto" },
          mb: { xs: 2, sm: 0 },
        }}
        InputProps={{
          startAdornment: <Search sx={{ color: "action.active", mr: 1 }} />,
        }}
      />

      {/* <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 1 },
          width: { xs: "100%", sm: "100%" },
        }}
      >
        <Button
          variant="outlined"
          onClick={(event) => setFilterAnchorEl(event.currentTarget)}
          startIcon={<FilterList />}
          sx={{
            height: { xs: "auto", sm: 40 },
            whiteSpace: "nowrap",
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Filters
        </Button>
      </Box> */}
    </Box>
  </StyledPaper>

  {/* Status Filter Buttons */}
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      gap: 1,
      mb: 2,
      mt: 2,
    }}
  >
    <Button
      sx={{
        color: "green",
        justifyContent: { xs: "flex-start", sm: "center" },
        width: { xs: "100%", sm: "auto" },
      }}
      onClick={() => setFilters({...filters, status: "approved"})}
    >
      ● Approved
    </Button>
    <Button
      sx={{
        color: "red",
        justifyContent: { xs: "flex-start", sm: "center" },
        width: { xs: "100%", sm: "auto" },
      }}
      onClick={() => setFilters({...filters, status: "rejected"})}
    >
      ● Rejected
    </Button>
    <Button
      sx={{
        color: "orange",
        justifyContent: { xs: "flex-start", sm: "center" },
        width: { xs: "100%", sm: "auto" },
      }}
      onClick={() => setFilters({...filters, status: "pending"})}
    >
      ● Pending
    </Button>
    <Button
      sx={{
        color: "gray",
        justifyContent: { xs: "flex-start", sm: "center" },
        width: { xs: "100%", sm: "auto" },
      }}
      onClick={() => setFilters({...filters, status: ""})}
    >
      ● All
    </Button>
  </Box>

  <Divider sx={{ mb: 2 }} />
      



<div className="leave-requests-table-container">
  {loading && !leaveData.length ? (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <CircularProgress className="loading-spinner" />
    </Box>
  ) : !filteredLeaveData.length ? (
    <Box sx={{ p: 4, textAlign: "center" }} className="empty-state">
      <Typography
        variant="body1"
        color="textSecondary"
        className="empty-state-text"
      >
        No leave requests found
      </Typography>
    </Box>
  ) : isMobile ? (
    // Mobile view - card layout
   // Replace the mobile-cards-container div with this Box component
<Box sx={{ mt: 2 }}>
  {filteredLeaveData.map((leave) => renderMobileCard(leave))}
</Box>

  ) : (
    // Desktop/Tablet view - table layout
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: { xs: 350, sm: 400, md: 450 },
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
            <TableCell
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                fontWeight: "bold",
                minWidth: 180,
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              Employee
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                fontWeight: "bold",
                minWidth: 150,
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              Leave Type
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                fontWeight: "bold",
                minWidth: 180,
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              Duration
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                fontWeight: "bold",
                minWidth: 200,
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              Reason
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                fontWeight: "bold",
                minWidth: 100,
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              Status
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                fontWeight: "bold",
                minWidth: 150,
                position: "sticky",
                top: 0,
                zIndex: 1,
                textAlign: "center",
              }}
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredLeaveData.map((leave) => (
            <TableRow
              key={leave._id}
              sx={{
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
              }}
            >
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.palette.primary.main, 0.8),
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "0.875rem",
                      flexShrink: 0,
                    }}
                  >
                    {leave.employeeName?.[0] || "U"}
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {leave.employeeName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {leave.employeeCode}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {getLeaveTypeName(leave.leaveType)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(leave.startDate).toLocaleDateString()} -{" "}
                  {new Date(leave.endDate).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {leave.halfDay
                    ? "Half Day"
                    : `${
                        leave.numberOfDays ||
                        calculateDays(
                          leave.startDate,
                          leave.endDate,
                          leave.halfDay
                        )
                      } days`}
                  {leave.halfDay && ` (${leave.halfDayType})`}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {leave.reason}
                </Typography>
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
                      leave.status === "approved"
                        ? alpha("#4caf50", 0.1)
                        : leave.status === "rejected"
                        ? alpha("#f44336", 0.1)
                        : alpha("#ff9800", 0.1),
                    color:
                      leave.status === "approved"
                        ? "#2e7d32"
                        : leave.status === "rejected"
                        ? "#d32f2f"
                        : "#e65100",
                  }}
                >
                  {leave.status}
                </Box>
                {leave.status === "rejected" && leave.rejectionReason && (
                  <Tooltip title={leave.rejectionReason}>
                    <IconButton size="small">
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>
                <Box
                  sx={{ display: "flex", justifyContent: "center", gap: 1 }}
                >
                  {leave.status === "pending" && (
                    <>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleApproveRequest(leave._id)}
                        disabled={loading}
                        sx={{
                          backgroundColor: alpha("#4caf50", 0.1),
                          "&:hover": {
                            backgroundColor: alpha("#4caf50", 0.2),
                          },
                          "&.Mui-disabled": {
                            backgroundColor: alpha("#e0e0e0", 0.3),
                          },
                        }}
                      >
                        <CheckCircle fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenRejectDialog(leave._id)}
                        disabled={loading}
                        sx={{
                          backgroundColor: alpha("#f44336", 0.1),
                          "&:hover": {
                            backgroundColor: alpha("#f44336", 0.2),
                          },
                          "&.Mui-disabled": {
                            backgroundColor: alpha("#e0e0e0", 0.3),
                          },
                        }}
                      >
                        <Cancel fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleOpenCommentDialog(leave._id)}
                    disabled={loading}
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      },
                      "&.Mui-disabled": {
                        backgroundColor: alpha("#e0e0e0", 0.3),
                      },
                    }}
                  >
                    <ChatBubbleOutline fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleOpenDeleteDialog(leave._id)}
                    disabled={loading}
                    className="delete-button"
                    sx={{
                      backgroundColor: alpha("#f44336", 0.1),
                      "&:hover": {
                        backgroundColor: alpha("#f44336", 0.2),
                      },
                      "&.Mui-disabled": {
                        backgroundColor: alpha("#e0e0e0", 0.3),
                      },
                    }}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {filteredLeaveData.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No leave requests found matching your filters.
                </Typography>
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({
                      type: "",
                      status: "",
                      dateRange: { start: "", end: "" },
                    });
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
  )}
</div>


      {/* Reject Dialog */}
      <Dialog
        open={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle 
        sx={{
           //bgcolor: "#fef2f2", color: "#dc2626" 
           background: "linear-gradient(45deg,rgb(220, 38, 38),rgb(209, 175, 175))",
           color: "white",
      fontSize: "1.5rem",
      fontWeight: 600,
      padding: "24px 32px",
           }}>
          Reject Leave Request
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this leave request:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            error={!rejectionReason.trim()}
            helperText={
              !rejectionReason.trim() ? "Rejection reason is required" : ""
            }
          />
        </DialogContent>
        <DialogActions
         sx={{
          padding: "24px 32px",
          backgroundColor: "#f8fafc",
          borderTop: "1px solid #e0e0e0",
          gap: 2,
        }}
        >
          <Button onClick={() => setIsRejectDialogOpen(false)}
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
            onClick={handleRejectRequest}
            color="error"
            disabled={!rejectionReason.trim() || loading}
            sx={{
              background: "linear-gradient(45deg,rgb(227, 158, 158),rgb(202, 177, 177))",
              fontSize: "0.95rem",
              textTransform: "none",
              padding: "8px 32px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg,rgb(231, 22, 22),rgb(132, 11, 11))",
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={isCommentDialogOpen}
        onClose={handleCloseCommentDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={window.innerWidth < 600} // Full screen on mobile
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
        <DialogTitle sx={{
      background: "linear-gradient(45deg, #1976d2, #64b5f6)",
      color: "white",
      fontSize: "1.5rem",
      fontWeight: 600,
      padding: "24px 32px",
    }}>
      Add/Edit Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment"
            fullWidth
            multiline
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
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
        </DialogContent>
        <DialogActions 
        sx={{
          padding: "24px 32px",
          backgroundColor: "#f8fafc",
          borderTop: "1px solid #e0e0e0",
          gap: 2,
        }}
        >
          <Button onClick={handleCloseCommentDialog}
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
          >Cancel</Button>
          <Button
            onClick={handleSaveComment}
            color="primary"
            disabled={loading}
            sx={{
              background: "linear-gradient(45deg, #1976d2, #64b5f6)",
              fontSize: "0.95rem",
              textTransform: "none",
              padding: "8px 32px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg, #1565c0, #42a5f5)",
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "500px" },
            maxWidth: "500px",
            borderRadius: "20px",
            overflow: "hidden",
            margin: { xs: "8px", sm: "32px" },
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
          Cancel Leave Request
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to cancel this leave request?
          </Typography>
          <Typography variant="body2" color="error">
            Warning: Cancelling a leave request will mark it as cancelled in the
            system. This should only be done for administrative purposes.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
            padding: { xs: "16px 24px", sm: "24px 32px" },
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e0e0e0",
            gap: 2,
          }}>
          <Button onClick={() => setIsDeleteDialogOpen(false)}
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
            No, Keep It
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            disabled={loading}
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
            {loading ? <CircularProgress size={24} /> : "Yes, Cancel It"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Popover */}
      {/* <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        className="filter-popover"
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Filter Leave Requests
          </Typography>
          <Stack spacing={2}>
            <TextField
              select
              label="Leave Type"
              fullWidth
              size="small"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <MenuItem value="">All Types</MenuItem>
              {LEAVE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              fullWidth
              size="small"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>

            <TextField
              label="From Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={filters.dateRange.start}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value },
                })
              }
            />

            <TextField
              label="To Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={filters.dateRange.end}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value },
                })
              }
            />

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
            >
              <Button
                variant="outlined"
                onClick={() =>
                  setFilters({
                    type: "",
                    status: "",
                    dateRange: { start: "", end: "" },
                  })
                }
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                onClick={() => setFilterAnchorEl(null)}
              >
                Apply Filters
              </Button>
            </Box>
          </Stack>
        </Box>
      </Popover> */}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
    </div>
  );
};

export default LeaveRequests;
