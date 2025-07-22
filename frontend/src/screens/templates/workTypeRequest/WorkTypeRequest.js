import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { useSelector } from 'react-redux'; // Add Redux hook
import { selectUserRole, selectUser } from '../../../redux/authSlice'; // Import selectors
import api from "../../../api/axiosInstance";

import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Menu,
  Checkbox,
  Typography,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
  InputAdornment,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";

import { Search, Edit, Delete } from "@mui/icons-material";
import { io } from 'socket.io-client';
import { useNotifications } from "../../../context/NotificationContext";

// Updated API URLs to match the backend routes
const API_URL = "/work-type-requests";
const USER_API_URL = (employeeCode) =>
  `/work-type-requests/employee/${employeeCode}`;

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
  "&:last-child td, &:last-child th": {
    borderBottom: 0,
  },
}));

const WorkTypeRequest = () => {
  const theme = useTheme();
  
  // Redux selectors for RBAC
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectUser);
  
  // RBAC helper functions
  const canAccessWorkTypeRequests = () => {
    return ['admin', 'hr', 'manager', 'employee'].includes(userRole);
  };
  
  const canAccessReviewTab = () => {
    return ['admin', 'hr', 'manager'].includes(userRole);
  };
  
  const canApproveReject = () => {
    return ['admin', 'hr', 'manager'].includes(userRole);
  };
  
  const canEditDelete = () => {
    return ['admin', 'hr', 'manager'].includes(userRole);
  };

  // State management
  const [tabValue, setTabValue] = useState(0);
  const [selectedAllocations, setSelectedAllocations] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWorktype, setEditingWorktype] = useState(null);
  const [isPermanentRequest, setIsPermanentRequest] = useState(false);
  const [showSelectionButtons, setShowSelectionButtons] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [worktypeRequests, setWorktypeRequests] = useState([]);
  const [reviewRequests, setReviewRequests] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { fetchNotifications, addWorkTypeRequestNotification } = useNotifications();

  const [formData, setFormData] = useState({
    employee: "",
    employeeCode: "",
    requestWorktype: "",
    requestedDate: "",
    requestedTill: "",
    description: "",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentUserData, setCurrentUserData] = useState(null);
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Check if user has access to this component
  useEffect(() => {
    if (!canAccessWorkTypeRequests()) {
      setSnackbar({
        open: true,
        message: "You don't have permission to access Work Type Requests",
        severity: "error",
      });
      // Optionally redirect to dashboard or show access denied page
      return;
    }
  }, [userRole]);

  // Check if user is admin (keeping existing logic for backward compatibility)
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userRoleFromStorage = localStorage.getItem("userRole");
        setIsAdmin(['admin', 'hr', 'manager'].includes(userRoleFromStorage) || canApproveReject());
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };

    checkUserRole();
  }, [userRole]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await fetchCurrentUser();
      await loadWorktypeRequests();
    };

    initializeData();
  }, [tabValue]);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

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

    socket.on('new-notification', (notification) => {
      console.log('Received notification:', notification);
      
      setSnackbar({
        open: true,
        message: notification.message,
        severity: notification.status === 'approved' ? 'success' : 'error'
      });
      
      loadWorktypeRequests();
    });

    socket.emit('join', userId);

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoadingCurrentUser(true);
      const userId = localStorage.getItem("userId");

      if (!userId) {
        console.error("No user ID found in localStorage");
        setSnackbar({
          open: true,
          message: "User ID not found. Please log in again.",
          severity: "error",
        });
        return;
      }

      const response = await api.get(`/employees/by-user/${userId}`);

      if (response.data.success) {
        const userData = response.data.data;

        setCurrentUserData(userData);

        setFormData((prev) => ({
          ...prev,
          employee: `${userData.personalInfo?.firstName || ""} ${
            userData.personalInfo?.lastName || ""
          }`,
          employeeCode: userData.Emp_ID,
          currentWorktype: userData.joiningDetails?.workType || "Full Time",
        }));

        console.log("Current user loaded successfully:", userData.Emp_ID);
        return userData;
      } else {
        throw new Error("Failed to load user data");
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      setSnackbar({
        open: true,
        message: "Error loading user data: " + error.message,
        severity: "error",
      });
      return null;
    } finally {
      setLoadingCurrentUser(false);
    }
  };

  const loadWorktypeRequests = async () => {
    try {
      const userId = localStorage.getItem("userId");
  
      if (tabValue === 0) {
        // For Work Type Requests tab, only show the current user's requests
        if (!userId) {
          console.error("No user ID found for loading user requests");
          setSnackbar({
            open: true,
            message: "User ID not found. Please log in again.",
            severity: "error",
          });
          return;
        }
        
        console.log(`Loading work type requests for user: ${userId}`);
        const response = await api.get(`${API_URL}/user/${userId}`);
        setWorktypeRequests(response.data);
        setReviewRequests([]); // Clear review requests when on user tab
      } else {
        // For Review tab, show all requests that need review (admin/hr/manager view)
        if (!canAccessReviewTab()) {
          console.error("User doesn't have permission to access review tab");
          setReviewRequests([]);
          return;
        }
        
        console.log("Loading all work type requests for review");
        const response = await api.get(API_URL, {
          params: { forReview: true },
        });
        setReviewRequests(response.data);
        setWorktypeRequests([]); // Clear user requests when on review tab
      }
      
      // Refresh current user data to get updated work type
      if (userId) {
        await fetchCurrentUser();
      }
    } catch (error) {
      console.error("Error loading work type requests:", error);
      setSnackbar({
        open: true,
        message: "Error loading work type requests: " + error.message,
        severity: "error",
      });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowClick = (id) => {
    const newSelected = selectedAllocations.includes(id)
      ? selectedAllocations.filter((item) => item !== id)
      : [...selectedAllocations, id];
    setSelectedAllocations(newSelected);
    setShowSelectionButtons(newSelected.length > 0);
  };

  const handleSelectAll = () => {
    const currentData = tabValue === 0 ? worktypeRequests : reviewRequests;
    const allIds = currentData.map((req) => req._id);
    setSelectedAllocations(allIds);
    setShowSelectionButtons(true);
  };

  const handleUnselectAll = () => {
    setSelectedAllocations([]);
    setShowSelectionButtons(false);
  };

  const handleDeleteClick = (worktype, e) => {
    e.stopPropagation();
    
    // Check permission before allowing delete
    if (!canEditDelete()) {
      setSnackbar({
        open: true,
        message: "You don't have permission to delete work type requests",
        severity: "error",
      });
      return;
    }
    
    setDeleteType("worktype");
    setItemToDelete(worktype);
    setDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    // Check permission before allowing bulk delete
    if (!canEditDelete()) {
      setSnackbar({
        open: true,
        message: "You don't have permission to delete work type requests",
        severity: "error",
      });
      return;
    }
    
    setDeleteType("bulk");
    setItemToDelete({
      count: selectedAllocations.length,
      type: tabValue === 0 ? "requests" : "allocations",
    });
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);

      if (deleteType === "worktype" && itemToDelete) {
        await api.delete(`${API_URL}/${itemToDelete._id}`);
        await loadWorktypeRequests();
        setSnackbar({
          open: true,
          message: "Work type request deleted successfully",
          severity: "success",
        });
      } else if (deleteType === "bulk" && selectedAllocations.length > 0) {
        await Promise.all(
          selectedAllocations.map((id) => api.delete(`${API_URL}/${id}`))
        );
        await loadWorktypeRequests();
        setSelectedAllocations([]);
        setShowSelectionButtons(false);
        setSnackbar({
          open: true,
          message: `${selectedAllocations.length} ${itemToDelete.type} deleted successfully`,
          severity: "success",
        });
      }

      handleCloseDeleteDialog();
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      setSnackbar({
        open: true,
        message: `Error deleting ${deleteType}: ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    try {
      // Check permission before allowing bulk approve
      if (!canApproveReject()) {
        setSnackbar({
          open: true,
          message: "You don't have permission to approve work type requests",
          severity: "error",
        });
        return;
      }
      
      const userId = localStorage.getItem("userId");
      
      const approvedRequests = reviewRequests.filter(
        request => selectedAllocations.includes(request._id)
      );
      
      await api.put(`${API_URL}/bulk-approve`, {
        ids: selectedAllocations
      });
      
      for (const request of approvedRequests) {
        try {
          await api.put(`/employees/work-info/${request.employeeCode}`, {
            workType: request.requestedWorktype,
            shiftType: request.currentShiftType || "Regular"
          });
          
          if (request.userId) {
            console.log(`Sending approval notification to user: ${request.userId}`);
            await addWorkTypeRequestNotification(
              request.name,
              "approved",
              request.requestedWorktype,
              request.requestedDate,
              request.requestedTill,
              request.userId
            );
          }
        } catch (updateError) {
          console.error(`Error updating work type for employee ${request.employeeCode}:`, updateError);
        }
      }
      
      await loadWorktypeRequests();
      
      if (userId) {
        console.log("Fetching notifications after bulk approval for user:", userId);
        await fetchNotifications(userId);
      }
      
      setSelectedAllocations([]);
      setShowSelectionButtons(false);
      setAnchorEl(null);
      setSnackbar({
        open: true,
        message: "Work type requests approved and employee work types updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error bulk approving work types:", error);
      setSnackbar({
        open: true,
        message:
          "Error approving work type requests: " +
          (error.response?.data?.message || error.message),
        severity: "error",
      });
    }
  };

  const handleBulkReject = async () => {
    try {
      // Check permission before allowing bulk reject
      if (!canApproveReject()) {
        setSnackbar({
          open: true,
          message: "You don't have permission to reject work type requests",
          severity: "error",
        });
        return;
      }
      
      const userId = localStorage.getItem("userId");
      
      await api.put(`${API_URL}/bulk-reject`, {
        ids: selectedAllocations
      });
      
      const rejectedRequests = reviewRequests.filter(
        request => selectedAllocations.includes(request._id)
      );
      
      for (const request of rejectedRequests) {
        if (request.userId) {
          console.log(`Sending rejection notification to user: ${request.userId}`);
          await addWorkTypeRequestNotification(
            request.name,
            "rejected",
            request.requestedWorktype,
            request.requestedDate,
            request.requestedTill,
            request.userId
          );
        }
      }
      
      await loadWorktypeRequests();
      
      if (userId) {
        console.log("Fetching notifications after bulk rejection for user:", userId);
        await fetchNotifications(userId);
      }
      
      setSelectedAllocations([]);
      setShowSelectionButtons(false);
      setAnchorEl(null);
      setSnackbar({
        open: true,
        message: "Work type requests rejected successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error bulk rejecting work types:", error);
      setSnackbar({
        open: true,
        message:
          "Error rejecting work type requests: " +
          (error.response?.data?.message || error.message),
        severity: "error",
      });
    }
  };

  const handleApprove = async (id, e) => {
    e.stopPropagation();
    try {
      // Check permission before allowing approve
      if (!canApproveReject()) {
        setSnackbar({
          open: true,
          message: "You don't have permission to approve work type requests",
          severity: "error",
        });
        return;
      }
      
      const userId = localStorage.getItem("userId");
      
      const worktypeRequest = [...worktypeRequests, ...reviewRequests].find(
        request => request._id === id
      );
      
      if (!worktypeRequest) {
        throw new Error("Work type request not found");
      }
      
      await api.put(`${API_URL}/${id}/approve`);
      
      await api.put(`/employees/work-info/${worktypeRequest.employeeCode}`, {
        workType: worktypeRequest.requestedWorktype,
        shiftType: worktypeRequest.currentShiftType || "Regular"
      });
      
      await loadWorktypeRequests();
      
      if (worktypeRequest.userId) {
        console.log(`Sending approval notification to user: ${worktypeRequest.userId}`);
        await addWorkTypeRequestNotification(
          worktypeRequest.name,
          "approved",
          worktypeRequest.requestedWorktype,
          worktypeRequest.requestedDate,
          worktypeRequest.requestedTill,
          worktypeRequest.userId
        );
        
        if (userId) {
          console.log("Fetching notifications after approval for user:", userId);
          await fetchNotifications(userId);
        }
      }
      
      setSnackbar({
        open: true,
        message: "Work type request approved and employee work type updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error approving work type:", error);
      setSnackbar({
        open: true,
        message:
          "Error approving work type request: " +
          (error.response?.data?.message || error.message),
        severity: "error",
      });
    }
  };

  const handleReject = async (id, e) => {
    e.stopPropagation();
    try {
      // Check permission before allowing reject
      if (!canApproveReject()) {
        setSnackbar({
          open: true,
          message: "You don't have permission to reject work type requests",
          severity: "error",
        });
        return;
      }
      
      const userId = localStorage.getItem("userId");
      
      await api.put(`${API_URL}/${id}/reject`);
      
      await loadWorktypeRequests();
      
      const rejectedRequest = [...worktypeRequests, ...reviewRequests].find(
        request => request._id === id
      );
      
      if (rejectedRequest && rejectedRequest.userId) {
        console.log(`Sending rejection notification to user: ${rejectedRequest.userId}`);
        await addWorkTypeRequestNotification(
          rejectedRequest.name,
          "rejected",
          rejectedRequest.requestedWorktype,
          rejectedRequest.requestedDate,
          rejectedRequest.requestedTill,
          rejectedRequest.userId
        );
        
        if (userId) {
          console.log("Fetching notifications after rejection for user:", userId);
          await fetchNotifications(userId);
        }
      }
      
      setSnackbar({
        open: true,
        message: "Work type request rejected successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error rejecting work type:", error);
      setSnackbar({
        open: true,
        message:
          "Error rejecting work type request: " +
          (error.response?.data?.message || error.message),
        severity: "error",
      });
    }
  };

  const handleCreateWorktype = async () => {
    try {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        setSnackbar({
          open: true,
          message: "Unable to create work type request: User ID not available",
          severity: "error",
        });
        return;
      }

      let userToUse = currentUserData;
      if (!userToUse) {
        console.log("Current user not loaded, fetching again...");
        userToUse = await fetchCurrentUser();

        if (!userToUse) {
          setSnackbar({
            open: true,
            message: "Unable to create work type request: Failed to load user data",
            severity: "error",
          });
          return;
        }
      }

      if (!formData.requestWorktype) {
        setSnackbar({
          open: true,
          message: "Please select a work type",
          severity: "warning",
        });
        return;
      }

      if (!formData.requestedDate) {
        setSnackbar({
          open: true,
          message: "Please select a requested date",
          severity: "warning",
        });
        return;
      }

      if (!formData.requestedTill) {
        setSnackbar({
          open: true,
          message: "Please select a requested till date",
          severity: "warning",
        });
        return;
      }

      const worktypeData = {
        name: `${userToUse.personalInfo?.firstName || ""} ${
          userToUse.personalInfo?.lastName || ""
        }`,
        employeeCode: userToUse.Emp_ID,
        requestedWorktype: formData.requestWorktype,
        currentWorktype: userToUse.joiningDetails?.workType || "Full Time",
        requestedDate: formData.requestedDate,
        requestedTill: formData.requestedTill,
        description: formData.description || "",
        isPermanentRequest,
        userId: userId,
      };

      console.log("Creating work type request with data:", worktypeData);

      const response = await api.post(API_URL, worktypeData);
      console.log("Work type request created:", response.data);

      await loadWorktypeRequests();
      setCreateDialogOpen(false);
      resetFormData();

      setSnackbar({
        open: true,
        message: "Work type request created successfully and sent for review",
        severity: "success",
      });
    } catch (error) {
      console.error("Error creating work type:", error);
      setSnackbar({
        open: true,
        message:
          "Error creating work type request: " +
          (error.response?.data?.message || error.message),
        severity: "error",
      });
    }
  };

  const handleEdit = (worktype, e) => {
    e.stopPropagation();
    
    // Check permission before allowing edit
    if (!canEditDelete()) {
      setSnackbar({
        open: true,
        message: "You don't have permission to edit work type requests",
        severity: "error",
      });
      return;
    }
    
    setEditingWorktype(worktype);
    setFormData({
      employee: worktype.name,
      employeeCode: worktype.employeeCode,
      requestWorktype: worktype.requestedWorktype,
      requestedDate: new Date(worktype.requestedDate).toISOString().split("T")[0],
      requestedTill: new Date(worktype.requestedTill).toISOString().split("T")[0],
      description: worktype.description,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedData = {
        name: formData.employee,
        employeeCode: formData.employeeCode,
        requestedWorktype: formData.requestWorktype,
        requestedDate: formData.requestedDate,
        requestedTill: formData.requestedTill,
        description: formData.description,
      };

      await api.put(`${API_URL}/${editingWorktype._id}`, updatedData);
      await loadWorktypeRequests();
      setEditDialogOpen(false);
      setEditingWorktype(null);
      resetFormData();

      setSnackbar({
        open: true,
        message: "Work type request updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating work type:", error);
      setSnackbar({
        open: true,
        message:
          "Error updating work type request: " +
          (error.response?.data?.message || error.message),
        severity: "error",
      });
    }
  };

  const resetFormData = () => {
    if (currentUserData) {
      setFormData({
        employee: `${currentUserData.personalInfo?.firstName || ""} ${
          currentUserData.personalInfo?.lastName || ""
        }`,
        employeeCode: currentUserData.Emp_ID,
        currentWorktype: currentUserData.joiningDetails?.workType || "Full Time",
        requestWorktype: "",
        requestedDate: "",
        requestedTill: "",
        description: "",
      });
    } else {
      setFormData({
        employee: "",
        employeeCode: "",
        currentWorktype: "",
        requestWorktype: "",
        requestedDate: "",
        requestedTill: "",
        description: "",
      });
    }
    setIsPermanentRequest(false);
  };

  // Don't render if user doesn't have access
  if (!canAccessWorkTypeRequests()) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">
          You don't have permission to access Work Type Requests
        </Alert>
      </Box>
    );
  }

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
          {tabValue === 0 ? "Work Type Requests" : "Review Requests"}
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
            <SearchTextField
              placeholder="Search Employee"
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
                onClick={() => setCreateDialogOpen(true)}
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
                Create {tabValue === 0 ? "Request" : "Review Request"}
              </Button>
            </Box>
          </Box>
        </StyledPaper>
      </Box>

      {/* Selection Buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 2,
          mt: { xs: 2, sm: 2 },
        }}
      >
        <Button
          variant="outlined"
          sx={{
            color: "green",
            borderColor: "green",
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={handleSelectAll}
        >
          Select All {tabValue === 0 ? "Requests" : "Allocations"}
        </Button>
        {showSelectionButtons && (
          <>
            <Button
              variant="outlined"
              sx={{
                color: "grey.500",
                borderColor: "grey.500",
                width: { xs: "100%", sm: "auto" },
              }}
              onClick={handleUnselectAll}
            >
              Unselect All
            </Button>
            <Button
              variant="outlined"
              sx={{
                color: "maroon",
                borderColor: "maroon",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {selectedAllocations.length} Selected
            </Button>
          </>
        )}
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            width: { xs: 200, sm: 250 },
            borderRadius: 2,
            boxShadow: 3,
          },
        }}
      >
        {/* Only show approve/reject options in Review tab and if user has permission */}
        {tabValue === 1 && canApproveReject() && (
          <>
            <MenuItem onClick={handleBulkApprove} sx={{ py: 1.5 }}>
              Approve Selected
            </MenuItem>
            <MenuItem onClick={handleBulkReject} sx={{ py: 1.5 }}>
              Reject Selected
            </MenuItem>
          </>
        )}
        {canEditDelete() && (
          <MenuItem onClick={handleBulkDeleteClick} sx={{ py: 1.5 }}>
            Delete Selected
          </MenuItem>
        )}
      </Menu>

      {/* Status Filter Buttons */}
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

      {/* Tabs - Updated with RBAC */}
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => {
          // Check if user can access the Review tab
          if (newValue === 1 && !canAccessReviewTab()) {
            setSnackbar({
              open: true,
              message: "You don't have permission to access the Review tab",
              severity: "error",
            });
            return;
          }
          
          setTabValue(newValue);
          setSelectedAllocations([]);
          setShowSelectionButtons(false);
          setFilterStatus("all");
        }}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          mb: 2,
          "& .MuiTabs-flexContainer": {
            flexDirection: { xs: "column", sm: "row" },
          },
          "& .MuiTab-root": {
            width: { xs: "100%", sm: "auto" },
            fontSize: { xs: "0.875rem", sm: "0.875rem", md: "1rem" },
          },
        }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Work Type Requests" />
        {/* Only show Review tab if user has permission */}
        {canAccessReviewTab() && <Tab label="Review" />}
      </Tabs>

      <Divider sx={{ mb: 2 }} />

      {/* Main Table */}
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
              <StyledTableCell
                padding="checkbox"
                sx={{ position: "sticky", left: 0, zIndex: 3 }}
              >
                <Checkbox
                  sx={{
                    color: "white",
                    "&.Mui-checked": {
                      color: "white",
                    },
                  }}
                  onChange={(e) => {
                    if (e.target.checked) handleSelectAll();
                    else handleUnselectAll();
                  }}
                  checked={
                    selectedAllocations.length ===
                      (tabValue === 0
                        ? worktypeRequests.length
                        : reviewRequests.length) &&
                    (tabValue === 0
                      ? worktypeRequests.length > 0
                      : reviewRequests.length > 0)
                  }
                />
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 200 }}>Employee</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 150 }}>
                Requested Work Type
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 150 }}>
                Current Work Type
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 130 }}>
                Requested Date
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 130 }}>
                Requested Till
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 100 }}>Status</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 150 }}>
                Description
              </StyledTableCell>
              {/* Only show Confirmation column in Review tab and if user has permission */}
              {tabValue === 1 && canApproveReject() && (
                <StyledTableCell sx={{ minWidth: 120, textAlign: "center" }}>
                  Confirmation
                </StyledTableCell>
              )}
              <StyledTableCell sx={{ minWidth: 100, textAlign: "center" }}>
                Actions
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0 ? worktypeRequests : reviewRequests)
              .filter((request) => {
                const employeeName = request?.name || "";
                return (
                  employeeName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) &&
                  (filterStatus === "all" || request.status === filterStatus)
                );
              })
              .map((request) => (
                <StyledTableRow
                  key={request._id}
                  hover
                  onClick={() => handleRowClick(request._id)}
                  selected={selectedAllocations.includes(request._id)}
                  sx={{
                    cursor: "pointer",
                    ...(selectedAllocations.includes(request._id) && {
                      backgroundColor: alpha(theme.palette.primary.light, 0.15),
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.light,
                          0.2
                        ),
                      },
                    }),
                  }}
                >
                  <TableCell
                    padding="checkbox"
                    sx={{
                      position: "sticky",
                      left: 0,
                      backgroundColor: selectedAllocations.includes(request._id)
                        ? alpha(theme.palette.primary.light, 0.15)
                        : request._id % 2 === 0
                        ? alpha(theme.palette.primary.light, 0.05)
                        : "inherit",
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.light,
                          0.2
                        ),
                      },
                    }}
                  >
                    <Checkbox
                      checked={selectedAllocations.includes(request._id)}
                      onChange={() => handleRowClick(request._id)}
                      sx={{
                        "&.Mui-checked": {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor:
                            request._id % 2 === 0
                              ? alpha(theme.palette.primary.main, 0.8)
                              : alpha(theme.palette.secondary.main, 0.8),
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: "0.875rem",
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        {request.name?.[0] || "U"}
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                            lineHeight: 1.3,
                          }}
                        >
                          {request.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {request.employeeCode}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {request.requestedWorktype}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {request.currentWorktype}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(request.requestedDate).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(request.requestedTill).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
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
                      {request.description}
                    </Typography>
                  </TableCell>

                  {/* Only show Confirmation cell in Review tab and if user has permission */}
                  {tabValue === 1 && canApproveReject() && (
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => handleApprove(request._id, e)}
                          disabled={request.status === "Approved"}
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
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            ✓
                          </Typography>
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleReject(request._id, e)}
                          disabled={request.status === "Rejected"}
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
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            ✕
                          </Typography>
                        </IconButton>
                      </Box>
                    </TableCell>
                  )}

                  <TableCell align="center">
                    <Box
                      sx={{ display: "flex", justifyContent: "center", gap: 1 }}
                    >
                      {canEditDelete() && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => handleEdit(request, e)}
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
                            onClick={(e) => handleDeleteClick(request, e)}
                            sx={{
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
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
                        </>
                      )}
                      {!canEditDelete() && (
                        <Typography variant="caption" color="text.secondary">
                          View Only
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
            {/* Empty state message when no records match filters */}
            {(tabValue === 0 ? worktypeRequests : reviewRequests).filter(
              (request) => {
                const employeeName = request?.name || "";
                return (
                  employeeName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) &&
                  (filterStatus === "all" || request.status === filterStatus)
                );
              }
            ).length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No {tabValue === 0 ? "work type requests" : "review requests"}{" "}
                    found matching your filters.
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

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
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
          <Delete />
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
            {deleteType === "bulk"
              ? `Are you sure you want to delete ${selectedAllocations.length} selected ${itemToDelete?.type}?`
              : "Are you sure you want to delete this work type request?"}
          </Alert>
          {itemToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
              {deleteType === "bulk" ? (
                <>
                  <Typography variant="body1" fontWeight={600} color="#2c3e50">
                    Bulk Deletion
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    You are about to delete {selectedAllocations.length}{" "}
                    {itemToDelete.type}. This action cannot be undone.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body1" fontWeight={600} color="#2c3e50">
                    Work Type Request Details:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      p: 1,
                      bgcolor: "#fff",
                      borderRadius: 1,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <strong>Employee:</strong> {itemToDelete.name} (
                    {itemToDelete.employeeCode})<br />
                    <strong>Requested Work Type:</strong>{" "}
                    {itemToDelete.requestedWorktype}
                    <br />
                    <strong>Date Range:</strong>{" "}
                    {new Date(itemToDelete.requestedDate).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(itemToDelete.requestedTill).toLocaleDateString()}
                    <br />
                    <strong>Status:</strong> {itemToDelete.status}
                  </Typography>
                </>
              )}
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

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fullScreen={window.innerWidth < 600}
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
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: 600,
            padding: "24px 32px",
          }}
        >
          {tabValue === 0 ? "Create Work Type Request" : "Review Request"}
        </DialogTitle>
        <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Current User Information */}
            {loadingCurrentUser ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading user data...
                </Typography>
              </Box>
            ) : currentUserData ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.primary.light, 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Your Details
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  <Typography variant="body2">
                    <strong>Name:</strong>{" "}
                    {currentUserData.personalInfo?.firstName || ""}{" "}
                    {currentUserData.personalInfo?.lastName || ""}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Employee Code:</strong> {currentUserData.Emp_ID}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Department:</strong>{" "}
                    {currentUserData.joiningDetails?.department || "Not Assigned"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Current Work Type:</strong>{" "}
                    {currentUserData.joiningDetails?.workType || "Full Time"}
                  </Typography>
                </Box>
              </Paper>
            ) : (
              <Alert severity="warning">
                Unable to load your employee details. Please try again or
                contact support.
              </Alert>
            )}

            {/* Request Work Type */}
            <TextField
              label="Request Work Type"
              name="requestWorktype"
              value={formData.requestWorktype}
              onChange={handleFormChange}
              fullWidth
              select
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
              <MenuItem value="Full Time">Full Time</MenuItem>
              <MenuItem value="Part Time">Part Time</MenuItem>
              <MenuItem value="Contract">Contract</MenuItem>
              <MenuItem value="Freelance">Freelance</MenuItem>
              <MenuItem value="Remote">Remote</MenuItem>
              <MenuItem value="Hybrid">Hybrid</MenuItem>
              <MenuItem value="On-site">On-site</MenuItem>
              
            </TextField>

            <TextField
              label="Requested Date"
              name="requestedDate"
              type="date"
              value={formData.requestedDate}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
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

            <TextField
              label="Requested Till"
              name="requestedTill"
              type="date"
              value={formData.requestedTill}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
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

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={4}
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

            {tabValue === 0 && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isPermanentRequest}
                    onChange={(e) => setIsPermanentRequest(e.target.checked)}
                  />
                }
                label="Permanent Request"
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            padding: "24px 32px",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e0e0e0",
            gap: 2,
          }}
        >
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              resetFormData();
            }}
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
            variant="contained"
            onClick={handleCreateWorktype}
            disabled={
              !formData.requestWorktype ||
              !formData.requestedDate ||
              !formData.requestedTill
            }
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
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullScreen={window.innerWidth < 600}
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
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: 600,
            padding: "24px 32px",
          }}
        >
          {tabValue === 0 ? "Edit Work Type Request" : "Edit Review Request"}
        </DialogTitle>

        <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <TextField
                label="Employee Name"
                name="employee"
                fullWidth
                value={formData.employee}
                onChange={handleFormChange}
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
              <TextField
                label="Employee ID"
                name="employeeCode"
                fullWidth
                value={formData.employeeCode || ""}
                onChange={handleFormChange}
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
            </Box>

            <TextField
              label="Request Work Type"
              name="requestWorktype"
              value={formData.requestWorktype}
              onChange={handleFormChange}
              fullWidth
              select
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
              <MenuItem value="Full Time">Full Time</MenuItem>
              <MenuItem value="Part Time">Part Time</MenuItem>
              <MenuItem value="Contract">Contract</MenuItem>
              <MenuItem value="Freelance">Freelance</MenuItem>
              <MenuItem value="Remote">Remote</MenuItem>
              <MenuItem value="Hybrid">Hybrid</MenuItem>
              <MenuItem value="On-site">On-site</MenuItem>
              <MenuItem value="Flexible">Flexible</MenuItem>
            </TextField>

            <TextField
              label="Requested Date"
              name="requestedDate"
              type="date"
              value={formData.requestedDate}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
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

            <TextField
              label="Requested Till"
              name="requestedTill"
              type="date"
              value={formData.requestedTill}
              onChange={handleFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
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

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={4}
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
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            padding: "24px 32px",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e0e0e0",
            gap: 2,
          }}
        >
          <Button
            onClick={() => setEditDialogOpen(false)}
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
            variant="contained"
            onClick={handleSaveEdit}
            disabled={
              !formData.employee ||
              !formData.requestWorktype ||
              !formData.requestedDate
            }
            sx={{
              background: "linear-gradient(45deg, #1976d2, #64b5f6)",
              fontSize: "0.95rem",
              textTransform: "none",
              padding: "8px 32px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
              "&:hover": {
                background: "linear-gradient(45deg, #1565c0, #42a5f5)",
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkTypeRequest;



// import React, { useState, useEffect } from "react";
// import { styled } from "@mui/material/styles";
// // import axios from "axios";
// import api from "../../../api/axiosInstance";

// import {
//   Box,
//   Button,
//   IconButton,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Tabs,
//   Tab,
//   Menu,
//   Checkbox,
//   Typography,
//   Paper,
//   Divider,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Switch,
//   FormControlLabel,
//   MenuItem,
//   InputAdornment,
//   useTheme,
//   alpha,
//   CircularProgress,
//   Alert,
//   Snackbar,
// } from "@mui/material";

// import { Search, Edit, Delete } from "@mui/icons-material";
// import { io } from 'socket.io-client';
// import { useNotifications } from "../../../context/NotificationContext";

// // Updated API URLs to match the backend routes
// const API_URL = "/work-type-requests";
// const USER_API_URL = (employeeCode) =>
//   `/work-type-requests/employee/${employeeCode}`;

// const StyledPaper = styled(Paper)(({ theme }) => ({
//   padding: theme.spacing(3),
//   marginBottom: theme.spacing(3),
//   borderRadius: theme.spacing(1),
//   boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
//   [theme.breakpoints.down("sm")]: {
//     padding: theme.spacing(2),
//   },
// }));

// const SearchTextField = styled(TextField)(({ theme }) => ({
//   "& .MuiOutlinedInput-root": {
//     borderRadius: theme.spacing(2),
//     "&:hover fieldset": {
//       borderColor: theme.palette.primary.main,
//     },
//   },
// }));

// const StyledTableCell = styled(TableCell)(({ theme }) => ({
//   backgroundColor: theme.palette.primary.main,
//   color: theme.palette.common.white,
//   fontSize: 14,
//   fontWeight: "bold",
//   padding: theme.spacing(2),
//   whiteSpace: "normal", // Changed from nowrap to normal to allow wrapping
//   "&.MuiTableCell-body": {
//     color: theme.palette.text.primary,
//     fontSize: 14,
//     borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
//     padding: { xs: theme.spacing(1.5), sm: theme.spacing(2) }, // Reduce padding on mobile
//   },
// }));

// const StyledTableRow = styled(TableRow)(({ theme }) => ({
//   "&:nth-of-type(odd)": {
//     backgroundColor: alpha(theme.palette.primary.light, 0.05),
//   },
//   "&:hover": {
//     backgroundColor: alpha(theme.palette.primary.light, 0.1),
//     transition: "background-color 0.2s ease",
//   },
//   // Hide last border
//   "&:last-child td, &:last-child th": {
//     borderBottom: 0,
//   },
// }));

// const WorkTypeRequest = () => {
//   const theme = useTheme();
//   const [tabValue, setTabValue] = useState(0);
//   const [selectedAllocations, setSelectedAllocations] = useState([]);
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [createDialogOpen, setCreateDialogOpen] = useState(false);
//   const [editDialogOpen, setEditDialogOpen] = useState(false);
//   const [editingWorktype, setEditingWorktype] = useState(null);
//   const [isPermanentRequest, setIsPermanentRequest] = useState(false);
//   const [showSelectionButtons, setShowSelectionButtons] = useState(false);
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [worktypeRequests, setWorktypeRequests] = useState([]);
//   const [reviewRequests, setReviewRequests] = useState([]);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const { fetchNotifications, addWorkTypeRequestNotification } = useNotifications();

//   const [formData, setFormData] = useState({
//     employee: "",
//     employeeCode: "",
//     requestWorktype: "",
//     requestedDate: "",
//     requestedTill: "",
//     description: "",
//   });

//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [deleteType, setDeleteType] = useState(""); // "worktype" or "bulk"
//   const [itemToDelete, setItemToDelete] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const [currentUser, setCurrentUser] = useState(null);
//   const [loadingCurrentUser, setLoadingCurrentUser] = useState(false);
//   const [snackbar, setSnackbar] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });

//   // Check if user is admin
//   useEffect(() => {
//     const checkUserRole = async () => {
//       try {
//         const userRole = localStorage.getItem("userRole");
//         setIsAdmin(userRole === "admin");
//       } catch (error) {
//         console.error("Error checking user role:", error);
//       }
//     };

//     checkUserRole();
//   }, []);

//   // Initialize data
//   useEffect(() => {
//     const initializeData = async () => {
//       await fetchCurrentUser();
//       await loadWorktypeRequests();
//     };

//     initializeData();
//   }, [tabValue]);

//   // // Set up WebSocket connection for real-time notifications
//   // useEffect(() => {
//   //   const userId = localStorage.getItem("userId");
//   //   if (!userId) return;

//   //   // Connect to the WebSocket server
//   //   const socket = io('${process.env.REACT_APP_API_URL}', {
//   //     query: { userId }
//   //   });

//   //   // Listen for new notifications
//   //   socket.on('new-notification', (notification) => {
//   //     console.log('Received notification:', notification);
      
//   //     // Show a snackbar with the notification
//   //     setSnackbar({
//   //       open: true,
//   //       message: notification.message,
//   //       severity: notification.status === 'approved' ? 'success' : 'error'
//   //     });
      
//   //     // Reload the worktype requests to reflect the changes
//   //     loadWorktypeRequests();
//   //   });

//   //   // Join a room specific to this user
//   //   socket.emit('join', userId);

//   //   // Cleanup on component unmount
//   //   return () => {
//   //     socket.disconnect();
//   //   };
//   // }, []);

// // Update the socket connection in WorkTypeRequest.js
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
//     console.log('Received notification:', notification);
    
//     // Show a snackbar with the notification
//     setSnackbar({
//       open: true,
//       message: notification.message,
//       severity: notification.status === 'approved' ? 'success' : 'error'
//     });
    
//     // Reload the work type requests to reflect the changes
//     loadWorktypeRequests();
//   });

//   // Join a room specific to this user
//   socket.emit('join', userId);

//   // Cleanup on component unmount
//   return () => {
//     socket.disconnect();
//   };
// }, []);



  
// // const fetchCurrentUser = async () => {
// //   try {
// //     setLoadingCurrentUser(true);
// //     const userId = localStorage.getItem("userId");
// //     // const token = getAuthToken();

// //     if (!userId) {
// //       console.error("No user ID found in localStorage");
// //       setSnackbar({
// //         open: true,
// //         message: "User ID not found. Please log in again.",
// //         severity: "error",
// //       });
// //       return;
// //     }

// //     const response = await api.get(
// //       `/employees/by-user/${userId}`,
// //       // {
// //       //   headers: {
// //       //     'Authorization': `Bearer ${token}`
// //       //   }
// //       // }
// //     );

// //     if (response.data.success) {
// //       const userData = response.data.data;

// //       // Set the current user
// //       setCurrentUser(userData);

// //       // Pre-fill the form with the current user's details
// //       setFormData((prev) => ({
// //         ...prev,
// //         employee: `${userData.personalInfo?.firstName || ""} ${
// //           userData.personalInfo?.lastName || ""
// //         }`,
// //         employeeCode: userData.Emp_ID,
// //         currentWorktype: userData.joiningDetails?.workType || "Full Time",
// //       }));

// //       console.log("Current user loaded successfully:", userData.Emp_ID);
// //       return userData; // Return the user data for chaining
// //     } else {
// //       throw new Error("Failed to load user data");
// //     }
// //   } catch (error) {
// //     console.error("Error fetching current user:", error);
// //     setSnackbar({
// //       open: true,
// //       message: "Error loading user data: " + error.message,
// //       severity: "error",
// //     });
// //     return null;
// //   } finally {
// //     setLoadingCurrentUser(false);
// //   }
// // };

// // // Update the loadWorktypeRequests function
// // const loadWorktypeRequests = async () => {
// //   try {
// //     // const token = getAuthToken();
    
// //     if (tabValue === 0) {
// //       // For Work Type Requests tab, only show the current user's requests if we have their employee code
// //       if (currentUser && currentUser.Emp_ID) {
// //         const response = await api.get(USER_API_URL(currentUser.Emp_ID)
// //         // , {
// //         //   headers: {
// //         //     'Authorization': `Bearer ${token}`
// //         //   }
// //         // }
// //       );
// //         setWorktypeRequests(response.data);
// //       } else {
// //         // If no current user, fetch all requests (this will be filtered on the backend)
// //         const response = await api.get(API_URL
// //         //   , {
// //         //   headers: {
// //         //     'Authorization': `Bearer ${token}`
// //         //   }
// //         // }
// //       );
// //         setWorktypeRequests(response.data);
// //       }
// //     } else {
// //       // For Review tab, show all requests
// //       const response = await api.get(API_URL
// //       //   , {
// //       //   headers: {
// //       //     'Authorization': `Bearer ${token}`
// //       //   }
// //       // }
// //     );
// //       setReviewRequests(response.data);
// //     }
// //   } catch (error) {
// //     console.error("Error loading worktype requests:", error);
// //     setSnackbar({
// //       open: true,
// //       message: "Error loading worktype requests: " + error.message,
// //       severity: "error",
// //     });
// //   }
// // };

// const fetchCurrentUser = async () => {
//   try {
//     setLoadingCurrentUser(true);
//     const userId = localStorage.getItem("userId");

//     if (!userId) {
//       console.error("No user ID found in localStorage");
//       setSnackbar({
//         open: true,
//         message: "User ID not found. Please log in again.",
//         severity: "error",
//       });
//       return;
//     }

//     const response = await api.get(`/employees/by-user/${userId}`);

//     if (response.data.success) {
//       const userData = response.data.data;

//       // Set the current user
//       setCurrentUser(userData);

//       // Pre-fill the form with the current user's details
//       setFormData((prev) => ({
//         ...prev,
//         employee: `${userData.personalInfo?.firstName || ""} ${
//           userData.personalInfo?.lastName || ""
//         }`,
//         employeeCode: userData.Emp_ID,
//         currentWorktype: userData.joiningDetails?.workType || "Full Time",
//       }));

//       console.log("Current user loaded successfully:", userData.Emp_ID);
//       return userData; // Return the user data for chaining
//     } else {
//       throw new Error("Failed to load user data");
//     }
//   } catch (error) {
//     console.error("Error fetching current user:", error);
//     setSnackbar({
//       open: true,
//       message: "Error loading user data: " + error.message,
//       severity: "error",
//     });
//     return null;
//   } finally {
//     setLoadingCurrentUser(false);
//   }
// };


// const loadWorktypeRequests = async () => {
//   try {
//     if (tabValue === 0) {
//       // For Work Type Requests tab, only show the current user's requests if we have their employee code
//       if (currentUser && currentUser.Emp_ID) {
//         const response = await api.get(USER_API_URL(currentUser.Emp_ID));
//         setWorktypeRequests(response.data);
//       } else {
//         // If no current user, fetch all requests (this will be filtered on the backend)
//         const response = await api.get(API_URL);
//         setWorktypeRequests(response.data);
//       }
//     } else {
//       // For Review tab, show all requests
//       const response = await api.get(API_URL);
//       setReviewRequests(response.data);
//     }
    
//     // Refresh current user data to get updated work type
//     const userId = localStorage.getItem("userId");
//     if (userId) {
//       await fetchCurrentUser();
//     }
//   } catch (error) {
//     console.error("Error loading worktype requests:", error);
//     setSnackbar({
//       open: true,
//       message: "Error loading worktype requests: " + error.message,
//       severity: "error",
//     });
//   }
// };

  
//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleRowClick = (id) => {
//     const newSelected = selectedAllocations.includes(id)
//       ? selectedAllocations.filter((item) => item !== id)
//       : [...selectedAllocations, id];
//     setSelectedAllocations(newSelected);
//     setShowSelectionButtons(newSelected.length > 0);
//   };

//   const handleSelectAll = () => {
//     const currentData = tabValue === 0 ? worktypeRequests : reviewRequests;
//     const allIds = currentData.map((req) => req._id);
//     setSelectedAllocations(allIds);
//     setShowSelectionButtons(true);
//   };

//   const handleUnselectAll = () => {
//     setSelectedAllocations([]);
//     setShowSelectionButtons(false);
//   };

//   const handleDeleteClick = (worktype, e) => {
//     e.stopPropagation();
//     setDeleteType("worktype");
//     setItemToDelete(worktype);
//     setDeleteDialogOpen(true);
//   };

//   const handleBulkDeleteClick = () => {
//     setDeleteType("bulk");
//     setItemToDelete({
//       count: selectedAllocations.length,
//       type: tabValue === 0 ? "requests" : "allocations",
//     });
//     setDeleteDialogOpen(true);
//     setAnchorEl(null);
//   };

//   const handleCloseDeleteDialog = () => {
//     setDeleteDialogOpen(false);
//     setItemToDelete(null);
//   };

  
// const handleConfirmDelete = async () => {
//   try {
//     setLoading(true);
//     // const token = getAuthToken();

//     if (deleteType === "worktype" && itemToDelete) {
//       await api.delete(`${API_URL}/${itemToDelete._id}`
//       //   , {
//       //   headers: {
//       //     'Authorization': `Bearer ${token}`
//       //   }
//       // }
//     );
//       await loadWorktypeRequests();
//       setSnackbar({
//         open: true,
//         message: "Work type request deleted successfully",
//         severity: "success",
//       });
//     } else if (deleteType === "bulk" && selectedAllocations.length > 0) {
//       await Promise.all(
//         selectedAllocations.map((id) =>
//           api.delete(`${API_URL}/${id}`
//           //   , {
//           //   headers: {
//           //     'Authorization': `Bearer ${token}`
//           //   }
//           // }
//         )
//         )
//       );
//       await loadWorktypeRequests();
//       setSelectedAllocations([]);
//       setShowSelectionButtons(false);
//       setSnackbar({
//         open: true,
//         message: `${selectedAllocations.length} ${itemToDelete.type} deleted successfully`,
//         severity: "success",
//       });
//     }

//     handleCloseDeleteDialog();
//   } catch (error) {
//     console.error(`Error deleting ${deleteType}:`, error);
//     setSnackbar({
//       open: true,
//       message: `Error deleting ${deleteType}: ${
//         error.response?.data?.message || error.message
//       }`,
//       severity: "error",
//     });
//   } finally {
//     setLoading(false);
//   }
// };


// // const handleBulkApprove = async () => {
// //   try {
// //     const userId = localStorage.getItem("userId");
    
// //     await api.put(`${API_URL}/bulk-approve`, {
// //       ids: selectedAllocations
// //     });
    
// //     // Get the work type requests that were approved
// //     const approvedRequests = reviewRequests.filter(
// //       request => selectedAllocations.includes(request._id)
// //     );
    
// //     // Reload work type requests
// //     await loadWorktypeRequests();
    
// //     // Send notifications for each approved work type request
// //     for (const request of approvedRequests) {
// //       if (request.userId) {
// //         console.log(`Sending approval notification to user: ${request.userId}`);
// //         await addWorkTypeRequestNotification(
// //           request.name,
// //           "approved",
// //           request.requestedWorktype,
// //           request.requestedDate,
// //           request.requestedTill,
// //           request.userId
// //         );
// //       }
// //     }
    
// //     // Fetch notifications after bulk approval
// //     if (userId) {
// //       console.log("Fetching notifications after bulk approval for user:", userId);
// //       await fetchNotifications(userId);
// //     }
    
// //     setSelectedAllocations([]);
// //     setShowSelectionButtons(false);
// //     setAnchorEl(null);
// //     setSnackbar({
// //       open: true,
// //       message: "Work type requests approved successfully",
// //       severity: "success",
// //     });
// //   } catch (error) {
// //     console.error("Error bulk approving worktypes:", error);
// //     setSnackbar({
// //       open: true,
// //       message:
// //         "Error approving work type requests: " +
// //         (error.response?.data?.message || error.message),
// //       severity: "error",
// //     });
// //   }
// // };

// const handleBulkApprove = async () => {
//   try {
//     const userId = localStorage.getItem("userId");
    
//     // Get the work type requests that will be approved
//     const approvedRequests = reviewRequests.filter(
//       request => selectedAllocations.includes(request._id)
//     );
    
//     // Approve all selected work type requests
//     await api.put(`${API_URL}/bulk-approve`, {
//       ids: selectedAllocations
//     });
    
//     // Update each employee's work type
//     for (const request of approvedRequests) {
//       try {
//         await api.put(`/employees/work-info/${request.employeeCode}`, {
//           workType: request.requestedWorktype,
//           // Preserve existing shift type if available
//           shiftType: request.currentShiftType || "Regular"
//         });
        
//         // Send notification for each approved request
//         if (request.userId) {
//           console.log(`Sending approval notification to user: ${request.userId}`);
//           await addWorkTypeRequestNotification(
//             request.name,
//             "approved",
//             request.requestedWorktype,
//             request.requestedDate,
//             request.requestedTill,
//             request.userId
//           );
//         }
//       } catch (updateError) {
//         console.error(`Error updating work type for employee ${request.employeeCode}:`, updateError);
//       }
//     }
    
//     // Refresh all data
//     await refreshWorkTypeRequestData();
    
//     // Fetch notifications after bulk approval
//     if (userId) {
//       console.log("Fetching notifications after bulk approval for user:", userId);
//       await fetchNotifications(userId);
//     }
    
//     setSelectedAllocations([]);
//     setShowSelectionButtons(false);
//     setAnchorEl(null);
//     setSnackbar({
//       open: true,
//       message: "Work type requests approved and employee work types updated successfully",
//       severity: "success",
//     });
//   } catch (error) {
//     console.error("Error bulk approving worktypes:", error);
//     setSnackbar({
//       open: true,
//       message:
//         "Error approving work type requests: " +
//         (error.response?.data?.message || error.message),
//       severity: "error",
//     });
//   }
// };



// const handleBulkReject = async () => {
//   try {
//     const userId = localStorage.getItem("userId");
    
//     await api.put(`${API_URL}/bulk-reject`, {
//       ids: selectedAllocations
//     });
    
//     // Get the work type requests that were rejected
//     const rejectedRequests = reviewRequests.filter(
//       request => selectedAllocations.includes(request._id)
//     );
    
//     // Reload work type requests
//     await loadWorktypeRequests();
    
//     // Send notifications for each rejected work type request
//     for (const request of rejectedRequests) {
//       if (request.userId) {
//         console.log(`Sending rejection notification to user: ${request.userId}`);
//         await addWorkTypeRequestNotification(
//           request.name,
//           "rejected",
//           request.requestedWorktype,
//           request.requestedDate,
//           request.requestedTill,
//           request.userId
//         );
//       }
//     }
    
//     // Fetch notifications after bulk rejection
//     if (userId) {
//       console.log("Fetching notifications after bulk rejection for user:", userId);
//       await fetchNotifications(userId);
//     }
    
//     setSelectedAllocations([]);
//     setShowSelectionButtons(false);
//     setAnchorEl(null);
//     setSnackbar({
//       open: true,
//       message: "Work type requests rejected successfully",
//       severity: "success",
//     });
//   } catch (error) {
//     console.error("Error bulk rejecting worktypes:", error);
//     setSnackbar({
//       open: true,
//       message:
//         "Error rejecting work type requests: " +
//         (error.response?.data?.message || error.message),
//       severity: "error",
//     });
//   }
// };


// // const handleApprove = async (id, e) => {
// //   e.stopPropagation();
// //   try {
// //     const userId = localStorage.getItem("userId");
    
// //     await api.put(`${API_URL}/${id}/approve`, {});
    
// //     // Get the work type request that was approved
// //     const approvedRequest = [...worktypeRequests, ...reviewRequests].find(
// //       request => request._id === id
// //     );
    
// //     // Reload work type requests
// //     await loadWorktypeRequests();
    
// //     if (approvedRequest && approvedRequest.userId) {
// //       // Send notification to the user who requested the work type
// //       console.log(`Sending approval notification to user: ${approvedRequest.userId}`);
// //       await addWorkTypeRequestNotification(
// //         approvedRequest.name,
// //         "approved",
// //         approvedRequest.requestedWorktype,
// //         approvedRequest.requestedDate,
// //         approvedRequest.requestedTill,
// //         approvedRequest.userId
// //       );
      
// //       // Fetch notifications for the current user
// //       if (userId) {
// //         console.log("Fetching notifications after approval for user:", userId);
// //         await fetchNotifications(userId);
// //       }
// //     }
    
// //     setSnackbar({
// //       open: true,
// //       message: "Work type request approved successfully",
// //       severity: "success",
// //     });
// //   } catch (error) {
// //     console.error("Error approving worktype:", error);
// //     setSnackbar({
// //       open: true,
// //       message:
// //         "Error approving work type request: " +
// //         (error.response?.data?.message || error.message),
// //       severity: "error",
// //     });
// //   }
// // };

// const handleApprove = async (id, e) => {
//   e.stopPropagation();
//   try {
//     const userId = localStorage.getItem("userId");
    
//     // First, get the work type request details
//     const workTypeRequest = [...worktypeRequests, ...reviewRequests].find(
//       request => request._id === id
//     );
    
//     if (!workTypeRequest) {
//       throw new Error("Work type request not found");
//     }
    
//     // Approve the work type request
//     await api.put(`${API_URL}/${id}/approve`, {});
    
//     // Update the employee's current work type
//     await api.put(`/employees/work-info/${workTypeRequest.employeeCode}`, {
//       workType: workTypeRequest.requestedWorktype,
//       // Preserve existing shift type if available
//       shiftType: workTypeRequest.currentShiftType || "Regular"
//     });
    
//     // Refresh all data
//     await refreshWorkTypeRequestData();
    
//     // Send notification to the user who requested the work type
//     if (workTypeRequest.userId) {
//       console.log(`Sending approval notification to user: ${workTypeRequest.userId}`);
//       await addWorkTypeRequestNotification(
//         workTypeRequest.name,
//         "approved",
//         workTypeRequest.requestedWorktype,
//         workTypeRequest.requestedDate,
//         workTypeRequest.requestedTill,
//         workTypeRequest.userId
//       );
      
//       // Fetch notifications for the current user
//       if (userId) {
//         console.log("Fetching notifications after approval for user:", userId);
//         await fetchNotifications(userId);
//       }
//     }
    
//     setSnackbar({
//       open: true,
//       message: "Work type request approved and employee work type updated successfully",
//       severity: "success",
//     });
//   } catch (error) {
//     console.error("Error approving worktype:", error);
//     setSnackbar({
//       open: true,
//       message:
//         "Error approving work type request: " +
//         (error.response?.data?.message || error.message),
//       severity: "error",
//     });
//   }
// };



// const handleReject = async (id, e) => {
//   e.stopPropagation();
//   try {
//     const userId = localStorage.getItem("userId");
    
//     await api.put(`${API_URL}/${id}/reject`, {});
    
//     // Get the work type request that was rejected
//     const rejectedRequest = [...worktypeRequests, ...reviewRequests].find(
//       request => request._id === id
//     );
    
//     // Reload work type requests
//     await loadWorktypeRequests();
    
//     if (rejectedRequest && rejectedRequest.userId) {
//       // Send notification to the user who requested the work type
//       console.log(`Sending rejection notification to user: ${rejectedRequest.userId}`);
//       await addWorkTypeRequestNotification(
//         rejectedRequest.name,
//         "rejected",
//         rejectedRequest.requestedWorktype,
//         rejectedRequest.requestedDate,
//         rejectedRequest.requestedTill,
//         rejectedRequest.userId
//       );
      
//       // Fetch notifications for the current user
//       if (userId) {
//         console.log("Fetching notifications after rejection for user:", userId);
//         await fetchNotifications(userId);
//       }
//     }
    
//     setSnackbar({
//       open: true,
//       message: "Work type request rejected successfully",
//       severity: "success",
//     });
//   } catch (error) {
//     console.error("Error rejecting worktype:", error);
//     setSnackbar({
//       open: true,
//       message:
//         "Error rejecting work type request: " +
//         (error.response?.data?.message || error.message),
//       severity: "error",
//     });
//   }
// };

// const refreshWorkTypeRequestData = async () => {
//   // Refresh work type requests
//   await loadWorktypeRequests();
  
//   // Refresh current user data to get updated work type
//   await fetchCurrentUser();
  
//   // Update the form data with the current user's updated work type
//   if (currentUser) {
//     setFormData(prev => ({
//       ...prev,
//       currentWorktype: currentUser.joiningDetails?.workType || "Full Time"
//     }));
//   }
// };


// const handleCreateWorktype = async () => {
//   try {
//     const userId = localStorage.getItem("userId");
//     // const token = getAuthToken();
    
//     if (!userId) {
//       setSnackbar({
//         open: true,
//         message: "Unable to create work type request: User ID not available",
//         severity: "error",
//       });
//       return;
//     }

//     // If currentUser is not loaded yet, try to fetch it again
//     let userToUse = currentUser;
//     if (!userToUse) {
//       console.log("Current user not loaded, fetching again...");
//       userToUse = await fetchCurrentUser();

//       if (!userToUse) {
//         setSnackbar({
//           open: true,
//           message: "Unable to create work type request: Failed to load user data",
//           severity: "error",
//         });
//         return;
//       }
//     }

//     // Validate form data
//     if (!formData.requestWorktype) {
//       setSnackbar({
//         open: true,
//         message: "Please select a work type",
//         severity: "warning",
//       });
//       return;
//     }

//     if (!formData.requestedDate) {
//       setSnackbar({
//         open: true,
//         message: "Please select a requested date",
//         severity: "warning",
//       });
//       return;
//     }

//     if (!formData.requestedTill) {
//       setSnackbar({
//         open: true,
//         message: "Please select a requested till date",
//         severity: "warning",
//       });
//       return;
//     }

//     const worktypeData = {
//       name: `${userToUse.personalInfo?.firstName || ""} ${
//         userToUse.personalInfo?.lastName || ""
//       }`,
//       employeeCode: userToUse.Emp_ID,
//       requestedWorktype: formData.requestWorktype,
//       currentWorktype: userToUse.joiningDetails?.workType || "Full Time",
//       requestedDate: formData.requestedDate,
//       requestedTill: formData.requestedTill,
//       description: formData.description || "",
//       isPermanentRequest,
//       userId: userId,
//     };

//     console.log("Creating work type request with data:", worktypeData);

//     const response = await api.post(API_URL, worktypeData
//     //   , {
//     //   headers: {
//     //     'Authorization': `Bearer ${token}`
//     //   }
//     // }
//   );
//     console.log("Work type request created:", response.data);

//     await loadWorktypeRequests();
//     setCreateDialogOpen(false);
//     resetFormData();

//     setSnackbar({
//       open: true,
//       message: "Work type request created successfully and sent for review",
//       severity: "success",
//     });
//   } catch (error) {
//     console.error("Error creating work type:", error);
//     setSnackbar({
//       open: true,
//       message:
//         "Error creating work type request: " +
//         (error.response?.data?.message || error.message),
//       severity: "error",
//     });
//   }
// };


//   const handleEdit = (worktype, e) => {
//     e.stopPropagation();
//     setEditingWorktype(worktype);
//     setFormData({
//       employee: worktype.name,
//       employeeCode: worktype.employeeCode,
//       requestWorktype: worktype.requestedWorktype,
//       requestedDate: new Date(worktype.requestedDate).toISOString().split("T")[0],
//       requestedTill: new Date(worktype.requestedTill).toISOString().split("T")[0],
//       description: worktype.description,
//     });
//     setEditDialogOpen(true);
//   };


// const handleSaveEdit = async () => {
//   try {
//     const userId = localStorage.getItem("userId");
//     // const token = getAuthToken();

//     const updatedData = {
//       name: formData.employee,
//       employeeCode: formData.employeeCode,
//       requestedWorktype: formData.requestWorktype,
//       requestedDate: formData.requestedDate,
//       requestedTill: formData.requestedTill,
//       description: formData.description,
//       userId: userId,
//     };

//     await api.put(`${API_URL}/${editingWorktype._id}`, updatedData
//     //   , {
//     //   headers: {
//     //     'Authorization': `Bearer ${token}`
//     //   }
//     // }
//   );
//     await loadWorktypeRequests();
//     setEditDialogOpen(false);
//     setEditingWorktype(null);
//     resetFormData();

//     setSnackbar({
//       open: true,
//       message: "Work type request updated successfully",
//       severity: "success",
//     });
//   } catch (error) {
//     console.error("Error updating work type:", error);
//     setSnackbar({
//       open: true,
//       message:
//         "Error updating work type request: " +
//         (error.response?.data?.message || error.message),
//       severity: "error",
//     });
//   }
// };



//   const resetFormData = () => {
//     // If we have current user data, preserve the employee info
//     if (currentUser) {
//       setFormData({
//         employee: `${currentUser.personalInfo?.firstName || ""} ${
//           currentUser.personalInfo?.lastName || ""
//         }`,
//         employeeCode: currentUser.Emp_ID,
//         currentWorktype: currentUser.joiningDetails?.workType || "Full Time",
//         requestWorktype: "",
//         requestedDate: "",
//         requestedTill: "",
//         description: "",
//       });
//     } else {
//       setFormData({
//         employee: "",
//         employeeCode: "",
//         currentWorktype: "",
//         requestWorktype: "",
//         requestedDate: "",
//         requestedTill: "",
//         description: "",
//       });
//     }
//     setIsPermanentRequest(false);
//   };

//   return (
//     <Box
//       sx={{
//         p: { xs: 2, sm: 3, md: 4 },
//         backgroundColor: "#f5f5f5",
//         minHeight: "100vh",
//       }}
//     >
//       <Box>
//         <Typography
//           variant="h4"
//           sx={{
//             mb: { xs: 2, sm: 3, md: 4 },
//             color: theme.palette.primary.main,
//             fontWeight: 600,
//             letterSpacing: 0.5,
//             fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
//           }}
//         >
//           {tabValue === 0 ? "Work Type Requests" : "Review Requests"}
//         </Typography>

//         <StyledPaper sx={{ p: { xs: 2, sm: 3 } }}>
//           <Box
//             display="flex"
//             flexDirection={{ xs: "column", sm: "row" }}
//             alignItems={{ xs: "flex-start", sm: "center" }}
//             gap={2}
//             sx={{
//               width: "100%",
//               justifyContent: "space-between",
//             }}
//           >
//             <SearchTextField
//               placeholder="Search Employee"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               size="small"
//               sx={{
//                 width: { xs: "100%", sm: "300px" },
//                 marginRight: { xs: 0, sm: "auto" },
//               }}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Search color="primary" />
//                   </InputAdornment>
//                 ),
//               }}
//             />

//             <Box
//               sx={{
//                 display: "flex",
//                 flexDirection: { xs: "column", sm: "row" },
//                 gap: { xs: 1, sm: 1 },
//                 width: { xs: "100%", sm: "auto" },
//               }}
//             >
//               <Button
//                 variant="contained"
//                 onClick={() => setCreateDialogOpen(true)}
//                 sx={{
//                   height: { xs: "auto", sm: 50 },
//                   padding: { xs: "8px 16px", sm: "6px 16px" },
//                   width: { xs: "100%", sm: "auto" },
//                   background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
//                   color: "white",
//                   "&:hover": {
//                     background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
//                   },
//                 }}
//               >
//                 Create {tabValue === 0 ? "Request" : "Review Request"}
//               </Button>
//             </Box>
//           </Box>
//         </StyledPaper>
//       </Box>

//       {/* Selection Buttons */}
//       <Box
//         sx={{
//           display: "flex",
//           flexDirection: { xs: "column", sm: "row" },
//           gap: 2,
//           mb: 2,
//           mt: { xs: 2, sm: 2 },
//         }}
//       >
//         <Button
//           variant="outlined"
//           sx={{
//             color: "green",
//             borderColor: "green",
//             width: { xs: "100%", sm: "auto" },
//           }}
//           onClick={handleSelectAll}
//         >
//           Select All {tabValue === 0 ? "Requests" : "Allocations"}
//         </Button>
//         {showSelectionButtons && (
//           <>
//             <Button
//               variant="outlined"
//               sx={{
//                 color: "grey.500",
//                 borderColor: "grey.500",
//                 width: { xs: "100%", sm: "auto" },
//               }}
//               onClick={handleUnselectAll}
//             >
//               Unselect All
//             </Button>
//             <Button
//               variant="outlined"
//               sx={{
//                 color: "maroon",
//                 borderColor: "maroon",
//                 width: { xs: "100%", sm: "auto" },
//               }}
//             >
//               {selectedAllocations.length} Selected
//             </Button>
//           </>
//         )}
//       </Box>

//       {/* Actions Menu */}
//       <Menu
//         anchorEl={anchorEl}
//         open={Boolean(anchorEl)}
//         onClose={() => setAnchorEl(null)}
//         PaperProps={{
//           sx: {
//             width: { xs: 200, sm: 250 },
//             borderRadius: 2,
//             boxShadow: 3,
//           },
//         }}
//       >
//         {/* Only show approve/reject options in Review tab */}
//         {tabValue === 1 && (
//           <>
//             <MenuItem onClick={handleBulkApprove} sx={{ py: 1.5 }}>
//               Approve Selected
//             </MenuItem>
//             <MenuItem onClick={handleBulkReject} sx={{ py: 1.5 }}>
//               Reject Selected
//             </MenuItem>
//           </>
//         )}
//         <MenuItem onClick={handleBulkDeleteClick} sx={{ py: 1.5 }}>
//           Delete Selected
//         </MenuItem>
//       </Menu>

//       {/* Status Filter Buttons */}
//       <Box
//         sx={{
//           display: "flex",
//           flexDirection: { xs: "column", sm: "row" },
//           gap: 1,
//           mb: 2,
//         }}
//       >
//         <Button
//           sx={{
//             color: "green",
//             justifyContent: { xs: "flex-start", sm: "center" },
//             width: { xs: "100%", sm: "auto" },
//           }}
//           onClick={() => setFilterStatus("Approved")}
//         >
//           ● Approved
//         </Button>
//         <Button
//           sx={{
//             color: "red",
//             justifyContent: { xs: "flex-start", sm: "center" },
//             width: { xs: "100%", sm: "auto" },
//           }}
//           onClick={() => setFilterStatus("Rejected")}
//         >
//           ● Rejected
//         </Button>
//         <Button
//           sx={{
//             color: "orange",
//             justifyContent: { xs: "flex-start", sm: "center" },
//             width: { xs: "100%", sm: "auto" },
//           }}
//           onClick={() => setFilterStatus("Pending")}
//         >
//           ● Pending
//         </Button>
//         <Button
//           sx={{
//             color: "gray",
//             justifyContent: { xs: "flex-start", sm: "center" },
//             width: { xs: "100%", sm: "auto" },
//           }}
//           onClick={() => setFilterStatus("all")}
//         >
//           ● All
//         </Button>
//       </Box>

//       {/* Tabs */}
//       <Tabs
//         value={tabValue}
//         onChange={(e, newValue) => {
//           setTabValue(newValue);
//           setSelectedAllocations([]);
//           setShowSelectionButtons(false);
//           setFilterStatus("all");
//         }}
//         textColor="primary"
//         indicatorColor="primary"
//         sx={{
//           mb: 2,
//           "& .MuiTabs-flexContainer": {
//             flexDirection: { xs: "column", sm: "row" },
//           },
//           "& .MuiTab-root": {
//             width: { xs: "100%", sm: "auto" },
//             fontSize: { xs: "0.875rem", sm: "0.875rem", md: "1rem" },
//           },
//         }}
//         variant="scrollable"
//         scrollButtons="auto"
//       >
//         <Tab label="Work Type Requests" />
//         <Tab label="Review" />
//       </Tabs>

//       <Divider sx={{ mb: 2 }} />

//       {/* Main Table */}
//       <TableContainer
//         component={Paper}
//         sx={{
//           maxHeight: { xs: 450, sm: 500, md: 550 },
//           overflowY: "auto",
//           overflowX: "auto",
//           mx: 0,
//           borderRadius: 2,
//           boxShadow:
//             "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
//           mb: 4,
//           "& .MuiTableContainer-root": {
//             scrollbarWidth: "thin",
//             "&::-webkit-scrollbar": {
//               width: 8,
//               height: 8,
//             },
//             "&::-webkit-scrollbar-track": {
//               backgroundColor: alpha(theme.palette.primary.light, 0.1),
//               borderRadius: 8,
//             },
//             "&::-webkit-scrollbar-thumb": {
//               backgroundColor: alpha(theme.palette.primary.main, 0.2),
//               borderRadius: 8,
//               "&:hover": {
//                 backgroundColor: alpha(theme.palette.primary.main, 0.3),
//               },
//             },
//           },
//         }}
//       >
//         <Table stickyHeader>
//           <TableHead>
//             <TableRow>
//               <StyledTableCell
//                 padding="checkbox"
//                 sx={{ position: "sticky", left: 0, zIndex: 3 }}
//               >
//                 <Checkbox
//                   sx={{
//                     color: "white",
//                     "&.Mui-checked": {
//                       color: "white",
//                     },
//                   }}
//                   onChange={(e) => {
//                     if (e.target.checked) handleSelectAll();
//                     else handleUnselectAll();
//                   }}
//                   checked={
//                     selectedAllocations.length ===
//                       (tabValue === 0
//                         ? worktypeRequests.length
//                         : reviewRequests.length) &&
//                     (tabValue === 0
//                       ? worktypeRequests.length > 0
//                       : reviewRequests.length > 0)
//                   }
//                 />
//               </StyledTableCell>
//               <StyledTableCell sx={{ minWidth: 200 }}>Employee</StyledTableCell>
//               <StyledTableCell sx={{ minWidth: 150 }}>
//                 Requested Work Type
//               </StyledTableCell>
//               <StyledTableCell sx={{ minWidth: 150 }}>
//                 Current Work Type
//               </StyledTableCell>
//               <StyledTableCell sx={{ minWidth: 130 }}>
//                 Requested Date
//               </StyledTableCell>
//               <StyledTableCell sx={{ minWidth: 130 }}>
//                 Requested Till
//               </StyledTableCell>
//               <StyledTableCell sx={{ minWidth: 100 }}>Status</StyledTableCell>
//               <StyledTableCell sx={{ minWidth: 150 }}>
//                 Description
//               </StyledTableCell>
//               {/* Only show Confirmation column in Review tab */}
//               {tabValue === 1 && (
//                 <StyledTableCell sx={{ minWidth: 120, textAlign: "center" }}>
//                   Confirmation
//                 </StyledTableCell>
//               )}
//               <StyledTableCell sx={{ minWidth: 100, textAlign: "center" }}>
//                 Actions
//               </StyledTableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {(tabValue === 0 ? worktypeRequests : reviewRequests)
//               .filter((request) => {
//                 const employeeName = request?.name || "";
//                 return (
//                   employeeName
//                     .toLowerCase()
//                     .includes(searchTerm.toLowerCase()) &&
//                   (filterStatus === "all" || request.status === filterStatus)
//                 );
//               })
//               .map((request) => (
//                 <StyledTableRow
//                   key={request._id}
//                   hover
//                   onClick={() => handleRowClick(request._id)}
//                   selected={selectedAllocations.includes(request._id)}
//                   sx={{
//                     cursor: "pointer",
//                     ...(selectedAllocations.includes(request._id) && {
//                       backgroundColor: alpha(theme.palette.primary.light, 0.15),
//                       "&:hover": {
//                         backgroundColor: alpha(
//                           theme.palette.primary.light,
//                           0.2
//                         ),
//                       },
//                     }),
//                   }}
//                 >
//                   <TableCell
//                     padding="checkbox"
//                     sx={{
//                       position: "sticky",
//                       left: 0,
//                       backgroundColor: selectedAllocations.includes(request._id)
//                         ? alpha(theme.palette.primary.light, 0.15)
//                         : request._id % 2 === 0
//                         ? alpha(theme.palette.primary.light, 0.05)
//                         : "inherit",
//                       "&:hover": {
//                         backgroundColor: alpha(
//                           theme.palette.primary.light,
//                           0.2
//                         ),
//                       },
//                     }}
//                   >
//                     <Checkbox
//                       checked={selectedAllocations.includes(request._id)}
//                       onChange={() => handleRowClick(request._id)}
//                       sx={{
//                         "&.Mui-checked": {
//                           color: theme.palette.primary.main,
//                         },
//                       }}
//                     />
//                   </TableCell>

//                   <TableCell>
//                     <Box display="flex" alignItems="flex-start" gap={1}>
//                       <Box
//                         sx={{
//                           width: 32,
//                           height: 32,
//                           borderRadius: "50%",
//                           bgcolor:
//                             request._id % 2 === 0
//                               ? alpha(theme.palette.primary.main, 0.8)
//                               : alpha(theme.palette.secondary.main, 0.8),
//                           color: "white",
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           fontWeight: "bold",
//                           fontSize: "0.875rem",
//                           flexShrink: 0,
//                           mt: 0.5, // Add a small top margin to align with the first line of text
//                         }}
//                       >
//                         {request.name?.[0] || "U"}
//                       </Box>
//                       <Box sx={{ display: "flex", flexDirection: "column" }}>
//                         <Typography
//                           variant="body2"
//                           sx={{
//                             fontWeight: 600,
//                             wordBreak: "break-word", // Allow breaking words to prevent overflow
//                             whiteSpace: "normal", // Allow text to wrap
//                             lineHeight: 1.3, // Tighter line height for wrapped text
//                           }}
//                         >
//                           {request.name}
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                           {request.employeeCode}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </TableCell>

//                   <TableCell>
//                     <Typography variant="body2">
//                       {request.requestedWorktype}
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="body2">
//                       {request.currentWorktype}
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="body2">
//                       {new Date(request.requestedDate).toLocaleDateString(
//                         undefined,
//                         {
//                           year: "numeric",
//                           month: "short",
//                           day: "numeric",
//                         }
//                       )}
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     <Typography variant="body2">
//                       {new Date(request.requestedTill).toLocaleDateString(
//                         undefined,
//                         {
//                           year: "numeric",
//                           month: "short",
//                           day: "numeric",
//                         }
//                       )}
//                     </Typography>
//                   </TableCell>
//                   <TableCell>
//                     <Box
//                       sx={{
//                         display: "inline-block",
//                         px: 1.5,
//                         py: 0.5,
//                         borderRadius: 1,
//                         fontSize: "0.75rem",
//                         fontWeight: "medium",
//                         backgroundColor:
//                           request.status === "Approved"
//                             ? alpha("#4caf50", 0.1)
//                             : request.status === "Rejected"
//                             ? alpha("#f44336", 0.1)
//                             : alpha("#ff9800", 0.1),
//                         color:
//                           request.status === "Approved"
//                             ? "#2e7d32"
//                             : request.status === "Rejected"
//                             ? "#d32f2f"
//                             : "#e65100",
//                       }}
//                     >
//                       {request.status}
//                     </Box>
//                   </TableCell>
//                   <TableCell>
//                     <Typography
//                       variant="body2"
//                       sx={{
//                         maxWidth: 200,
//                         overflow: "hidden",
//                         textOverflow: "ellipsis",
//                         whiteSpace: "nowrap",
//                       }}
//                     >
//                       {request.description}
//                     </Typography>
//                   </TableCell>

//                   {/* Only show Confirmation cell in Review tab */}
//                   {tabValue === 1 && (
//                     <TableCell align="center">
//                       <Box
//                         sx={{
//                           display: "flex",
//                           justifyContent: "center",
//                           gap: 1,
//                         }}
//                       >
//                         <IconButton
//                           size="small"
//                           color="success"
//                           onClick={(e) => handleApprove(request._id, e)}
//                           disabled={request.status === "Approved"}
//                           sx={{
//                             backgroundColor: alpha("#4caf50", 0.1),
//                             "&:hover": {
//                               backgroundColor: alpha("#4caf50", 0.2),
//                             },
//                             "&.Mui-disabled": {
//                               backgroundColor: alpha("#e0e0e0", 0.3),
//                             },
//                           }}
//                         >
//                           <Typography
//                             variant="body2"
//                             sx={{ fontWeight: "bold" }}
//                           >
//                             ✓
//                           </Typography>
//                         </IconButton>
//                         <IconButton
//                           size="small"
//                           color="error"
//                           onClick={(e) => handleReject(request._id, e)}
//                           disabled={request.status === "Rejected"}
//                           sx={{
//                             backgroundColor: alpha("#f44336", 0.1),
//                             "&:hover": {
//                               backgroundColor: alpha("#f44336", 0.2),
//                             },
//                             "&.Mui-disabled": {
//                               backgroundColor: alpha("#e0e0e0", 0.3),
//                             },
//                           }}
//                         >
//                           <Typography
//                             variant="body2"
//                             sx={{ fontWeight: "bold" }}
//                           >
//                             ✕
//                           </Typography>
//                         </IconButton>
//                       </Box>
//                     </TableCell>
//                   )}

//                   <TableCell align="center">
//                     <Box
//                       sx={{ display: "flex", justifyContent: "center", gap: 1 }}
//                     >
//                       <IconButton
//                         size="small"
//                         color="primary"
//                         onClick={(e) => handleEdit(request, e)}
//                         sx={{
//                           backgroundColor: alpha(
//                             theme.palette.primary.main,
//                             0.1
//                           ),
//                           "&:hover": {
//                             backgroundColor: alpha(
//                               theme.palette.primary.main,
//                               0.2
//                             ),
//                           },
//                         }}
//                       >
//                         <Edit fontSize="small" />
//                       </IconButton>
//                       <IconButton
//                         size="small"
//                         color="error"
//                         onClick={(e) => handleDeleteClick(request, e)}
//                         sx={{
//                           backgroundColor: alpha(theme.palette.error.main, 0.1),
//                           "&:hover": {
//                             backgroundColor: alpha(
//                               theme.palette.error.main,
//                               0.2
//                             ),
//                           },
//                         }}
//                       >
//                         <Delete fontSize="small" />
//                       </IconButton>
//                     </Box>
//                   </TableCell>
//                 </StyledTableRow>
//               ))}
//             {/* Empty state message when no records match filters */}
//             {(tabValue === 0 ? worktypeRequests : reviewRequests).filter(
//               (request) => {
//                 const employeeName = request?.name || "";
//                 return (
//                   employeeName
//                     .toLowerCase()
//                     .includes(searchTerm.toLowerCase()) &&
//                   (filterStatus === "all" || request.status === filterStatus)
//                 );
//               }
//             ).length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
//                   <Typography variant="body1" color="text.secondary">
//                     No {tabValue === 0 ? "work type requests" : "review requests"}{" "}
//                     found matching your filters.
//                   </Typography>
//                   <Button
//                     variant="text"
//                     color="primary"
//                     onClick={() => {
//                       setSearchTerm("");
//                       setFilterStatus("all");
//                     }}
//                     sx={{ mt: 1 }}
//                   >
//                     Clear filters
//                   </Button>
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       {/* Delete confirmation dialog */}
//       <Dialog
//         open={deleteDialogOpen}
//         onClose={handleCloseDeleteDialog}
//         PaperProps={{
//           sx: {
//             width: { xs: "95%", sm: "500px" },
//             maxWidth: "500px",
//             borderRadius: "20px",
//             overflow: "hidden",
//             margin: { xs: "8px", sm: "32px" },
//           },
//         }}
//       >
//         <DialogTitle
//           sx={{
//             background: "linear-gradient(45deg, #f44336, #ff7961)",
//             fontSize: { xs: "1.25rem", sm: "1.5rem" },
//             fontWeight: 600,
//             padding: { xs: "16px 24px", sm: "24px 32px" },
//             color: "white",
//             display: "flex",
//             alignItems: "center",
//             gap: 1,
//           }}
//         >
//           <Delete />
//           Confirm Deletion
//         </DialogTitle>
//         <DialogContent
//           sx={{
//             padding: { xs: "24px", sm: "32px" },
//             backgroundColor: "#f8fafc",
//             paddingTop: { xs: "24px", sm: "32px" },
//           }}
//         >
//           <Alert severity="warning" sx={{ mb: 2 }}>
//             {deleteType === "bulk"
//               ? `Are you sure you want to delete ${selectedAllocations.length} selected ${itemToDelete?.type}?`
//               : "Are you sure you want to delete this work type request?"}
//           </Alert>
//           {itemToDelete && (
//             <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
//               {deleteType === "bulk" ? (
//                 <>
//                   <Typography variant="body1" fontWeight={600} color="#2c3e50">
//                     Bulk Deletion
//                   </Typography>
//                   <Typography
//                     variant="body2"
//                     color="text.secondary"
//                     sx={{ mt: 1 }}
//                   >
//                     You are about to delete {selectedAllocations.length}{" "}
//                     {itemToDelete.type}. This action cannot be undone.
//                   </Typography>
//                 </>
//               ) : (
//                 <>
//                   <Typography variant="body1" fontWeight={600} color="#2c3e50">
//                     Work Type Request Details:
//                   </Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{
//                       mt: 1,
//                       p: 1,
//                       bgcolor: "#fff",
//                       borderRadius: 1,
//                       border: "1px solid #e2e8f0",
//                     }}
//                   >
//                     <strong>Employee:</strong> {itemToDelete.name} (
//                     {itemToDelete.employeeCode})<br />
//                     <strong>Requested Work Type:</strong>{" "}
//                     {itemToDelete.requestedWorktype}
//                     <br />
//                     <strong>Date Range:</strong>{" "}
//                     {new Date(itemToDelete.requestedDate).toLocaleDateString()}{" "}
//                     -{" "}
//                     {new Date(itemToDelete.requestedTill).toLocaleDateString()}
//                     <br />
//                     <strong>Status:</strong> {itemToDelete.status}
//                   </Typography>
//                 </>
//               )}
//             </Box>
//           )}
//         </DialogContent>
//         <DialogActions
//           sx={{
//             padding: { xs: "16px 24px", sm: "24px 32px" },
//             backgroundColor: "#f8fafc",
//             borderTop: "1px solid #e0e0e0",
//             gap: 2,
//           }}
//         >
//           <Button
//             onClick={handleCloseDeleteDialog}
//             sx={{
//               border: "2px solid #1976d2",
//               color: "#1976d2",
//               "&:hover": {
//                 border: "2px solid #64b5f6",
//                 backgroundColor: "#e3f2fd",
//                 color: "#1976d2",
//               },
//               textTransform: "none",
//               borderRadius: "8px",
//               px: 3,
//               fontWeight: 600,
//             }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleConfirmDelete}
//             variant="contained"
//             color="error"
//             disabled={loading}
//             startIcon={
//               loading ? <CircularProgress size={20} color="inherit" /> : null
//             }
//             sx={{
//               background: "linear-gradient(45deg, #f44336, #ff7961)",
//               fontSize: "0.95rem",
//               textTransform: "none",
//               padding: "8px 32px",
//               borderRadius: "10px",
//               boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
//               color: "white",
//               "&:hover": {
//                 background: "linear-gradient(45deg, #d32f2f, #f44336)",
//               },
//             }}
//           >
//             {loading ? "Deleting..." : "Delete"}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={6000}
//         onClose={() => setSnackbar({ ...snackbar, open: false })}
//         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//       >
//         <Alert
//           onClose={() => setSnackbar({ ...snackbar, open: false })}
//           severity={snackbar.severity}
//           variant="filled"
//           sx={{ width: "100%" }}
//         >
//           {snackbar.message}
//         </Alert>
//       </Snackbar>

//       {/* Create Dialog */}
//       <Dialog
//         open={createDialogOpen}
//         onClose={() => setCreateDialogOpen(false)}
//         fullScreen={window.innerWidth < 600} // Full screen on mobile
//         PaperProps={{
//           sx: {
//             width: { xs: "100%", sm: "600px" },
//             maxWidth: "100%",
//             borderRadius: { xs: 0, sm: "20px" },
//             margin: { xs: 0, sm: 2 },
//             overflow: "hidden",
//           },
//         }}
//       >
//         <DialogTitle
//           sx={{
//             background: "linear-gradient(45deg, #1976d2, #64b5f6)",
//             color: "white",
//             fontSize: "1.5rem",
//             fontWeight: 600,
//             padding: "24px 32px",
//           }}
//         >
//           {tabValue === 0 ? "Create Work Type Request" : "Review Request"}
//         </DialogTitle>
//         <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
//           <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
//             {/* Current User Information */}
//             {loadingCurrentUser ? (
//               <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
//                 <CircularProgress size={24} />
//                 <Typography variant="body2" sx={{ ml: 2 }}>
//                   Loading user data...
//                 </Typography>
//               </Box>
//             ) : currentUser ? (
//               <Paper
//                 elevation={0}
//                 sx={{
//                   p: 2,
//                   backgroundColor: alpha(theme.palette.primary.light, 0.1),
//                   borderRadius: 2,
//                   border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
//                 }}
//               >
//                 <Typography variant="subtitle2" color="primary" gutterBottom>
//                   Your Details
//                 </Typography>
//                 <Box
//                   sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
//                 >
//                   <Typography variant="body2">
//                     <strong>Name:</strong>{" "}
//                     {currentUser.personalInfo?.firstName || ""}{" "}
//                     {currentUser.personalInfo?.lastName || ""}
//                   </Typography>
//                   <Typography variant="body2">
//                     <strong>Employee Code:</strong> {currentUser.Emp_ID}
//                   </Typography>
//                   <Typography variant="body2">
//                     <strong>Department:</strong>{" "}
//                     {currentUser.joiningDetails?.department || "Not Assigned"}
//                   </Typography>
//                   <Typography variant="body2">
//                     <strong>Current Work Type:</strong>{" "}
//                     {currentUser.joiningDetails?.workType || "Full Time"}
//                   </Typography>
//                 </Box>
//               </Paper>
//             ) : (
//               <Alert severity="warning">
//                 Unable to load your employee details. Please try again or
//                 contact support.
//               </Alert>
//             )}

//             {/* Request Work Type */}
//             <TextField
//               label="Request Work Type"
//               name="requestWorktype"
//               value={formData.requestWorktype}
//               onChange={handleFormChange}
//               fullWidth
//               select
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   backgroundColor: "white",
//                   borderRadius: "12px",
//                   "&:hover fieldset": {
//                     borderColor: "#1976d2",
//                   },
//                 },
//               }}
//             >
//               <MenuItem value="Full Time">Full Time</MenuItem>
//               <MenuItem value="Part Time">Part Time</MenuItem>
//               <MenuItem value="Contract">Contract</MenuItem>
//               <MenuItem value="Freelance">Freelance</MenuItem>
//               <MenuItem value="Remote">Remote</MenuItem>
//             </TextField>

//             {/* Rest of your form fields remain the same */}
//             <TextField
//               label="Requested Date"
//               name="requestedDate"
//               type="date"
//               value={formData.requestedDate}
//               onChange={handleFormChange}
//               fullWidth
//               InputLabelProps={{ shrink: true }}
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   backgroundColor: "white",
//                   borderRadius: "12px",
//                   "&:hover fieldset": {
//                     borderColor: "#1976d2",
//                   },
//                 },
//               }}
//             />

//             <TextField
//               label="Requested Till"
//               name="requestedTill"
//               type="date"
//               value={formData.requestedTill}
//               onChange={handleFormChange}
//               fullWidth
//               InputLabelProps={{ shrink: true }}
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   backgroundColor: "white",
//                   borderRadius: "12px",
//                   "&:hover fieldset": {
//                     borderColor: "#1976d2",
//                   },
//                 },
//               }}
//             />

//             <TextField
//               label="Description"
//               name="description"
//               value={formData.description}
//               onChange={handleFormChange}
//               fullWidth
//               multiline
//               rows={4}
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   backgroundColor: "white",
//                   borderRadius: "12px",
//                   "&:hover fieldset": {
//                     borderColor: "#1976d2",
//                   },
//                 },
//               }}
//             />

//             {tabValue === 0 && (
//               <FormControlLabel
//                 control={
//                   <Switch
//                     checked={isPermanentRequest}
//                     onChange={(e) => setIsPermanentRequest(e.target.checked)}
//                   />
//                 }
//                 label="Permanent Request"
//               />
//             )}
//           </Box>
//         </DialogContent>

//         <DialogActions
//           sx={{
//             padding: "24px 32px",
//             backgroundColor: "#f8fafc",
//             borderTop: "1px solid #e0e0e0",
//             gap: 2,
//           }}
//         >
//           <Button
//             onClick={() => {
//               setCreateDialogOpen(false);
//               resetFormData();
//             }}
//             sx={{
//               border: "2px solid #1976d2",
//               color: "#1976d2",
//               "&:hover": {
//                 border: "2px solid #64b5f6",
//                 backgroundColor: "#e3f2fd",
//                 color: "#1976d2",
//               },
//               textTransform: "none",
//               borderRadius: "8px",
//               px: 3,
//               fontWeight: 600,
//             }}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="contained"
//             onClick={handleCreateWorktype}
//             disabled={
//               !formData.requestWorktype ||
//               !formData.requestedDate ||
//               !formData.requestedTill
//             }
//             sx={{
//               background: "linear-gradient(45deg, #1976d2, #64b5f6)",
//               fontSize: "0.95rem",
//               textTransform: "none",
//               padding: "8px 32px",
//               borderRadius: "10px",
//               boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
//               color: "white",
//               "&:hover": {
//                 background: "linear-gradient(45deg, #1565c0, #42a5f5)",
//               },
//             }}
//           >
//             Save
//           </Button>
//         </DialogActions>
//       </Dialog>
      
//       {/* Edit Dialog */}
//       <Dialog
//         open={editDialogOpen}
//         onClose={() => setEditDialogOpen(false)}
//         fullScreen={window.innerWidth < 600} // Full screen on mobile
//         PaperProps={{
//           sx: {
//             width: { xs: "100%", sm: "600px" },
//             maxWidth: "100%",
//             borderRadius: { xs: 0, sm: "20px" },
//             margin: { xs: 0, sm: 2 },
//             overflow: "hidden",
//           },
//         }}
//       >
//         <DialogTitle
//           sx={{
//             background: "linear-gradient(45deg, #1976d2, #64b5f6)",
//             color: "white",
//             fontSize: "1.5rem",
//             fontWeight: 600,
//             padding: "24px 32px",
//           }}
//         >
//           {tabValue === 0 ? "Edit Work Type Request" : "Edit Review Request"}
//         </DialogTitle>

//         <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
//           <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
//             <Box
//               sx={{
//                 display: "flex",
//                 flexDirection: { xs: "column", sm: "row" },
//                 gap: 2,
//               }}
//             >
//               <TextField
//                 label="Employee Name"
//                 name="employee"
//                 fullWidth
//                 value={formData.employee}
//                 onChange={handleFormChange}
//                 sx={{
//                   "& .MuiOutlinedInput-root": {
//                     backgroundColor: "white",
//                     borderRadius: "12px",
//                     "&:hover fieldset": {
//                       borderColor: "#1976d2",
//                     },
//                   },
//                   "& .MuiInputLabel-root.Mui-focused": {
//                     color: "#1976d2",
//                   },
//                 }}
//               />
//               <TextField
//                 label="Employee ID"
//                 name="employeeCode"
//                 fullWidth
//                 value={formData.employeeCode || ""}
//                 onChange={handleFormChange}
//                 sx={{
//                   "& .MuiOutlinedInput-root": {
//                     backgroundColor: "white",
//                     borderRadius: "12px",
//                     "&:hover fieldset": {
//                       borderColor: "#1976d2",
//                     },
//                   },
//                   "& .MuiInputLabel-root.Mui-focused": {
//                     color: "#1976d2",
//                   },
//                 }}
//               />
//             </Box>

//             <TextField
//               label="Request Work Type"
//               name="requestWorktype"
//               value={formData.requestWorktype}
//               onChange={handleFormChange}
//               fullWidth
//               select
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   backgroundColor: "white",
//                   borderRadius: "12px",
//                   "&:hover fieldset": {
//                     borderColor: "#1976d2",
//                   },
//                 },
//               }}
//             >
//               <MenuItem value="Full Time">Full Time</MenuItem>
//               <MenuItem value="Part Time">Part Time</MenuItem>
//               <MenuItem value="Contract">Contract</MenuItem>
//               <MenuItem value="Freelance">Freelance</MenuItem>
//               <MenuItem value="Remote">Remote</MenuItem>
//             </TextField>

//             <TextField
//               label="Requested Date"
//               name="requestedDate"
//               type="date"
//               value={formData.requestedDate}
//               onChange={handleFormChange}
//               fullWidth
//               InputLabelProps={{ shrink: true }}
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   backgroundColor: "white",
//                   borderRadius: "12px",
//                   "&:hover fieldset": {
//                     borderColor: "#1976d2",
//                   },
//                 },
//               }}
//             />

//             <TextField
//               label="Requested Till"
//               name="requestedTill"
//               type="date"
//               value={formData.requestedTill}
//               onChange={handleFormChange}
//               fullWidth
//               InputLabelProps={{ shrink: true }}
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   backgroundColor: "white",
//                   borderRadius: "12px",
//                   "&:hover fieldset": {
//                     borderColor: "#1976d2",
//                   },
//                 },
//               }}
//             />

//             <TextField
//               label="Description"
//               name="description"
//               value={formData.description}
//               onChange={handleFormChange}
//               fullWidth
//               multiline
//               rows={4}
//               sx={{
//                 "& .MuiOutlinedInput-root": {
//                   backgroundColor: "white",
//                   borderRadius: "12px",
//                   "&:hover fieldset": {
//                     borderColor: "#1976d2",
//                   },
//                 },
//               }}
//             />
//           </Box>
//         </DialogContent>

//         <DialogActions
//           sx={{
//             padding: "24px 32px",
//             backgroundColor: "#f8fafc",
//             borderTop: "1px solid #e0e0e0",
//             gap: 2,
//           }}
//         >
//           <Button
//             onClick={() => setEditDialogOpen(false)}
//             sx={{
//               border: "2px solid #1976d2",
//               color: "#1976d2",
//               "&:hover": {
//                 border: "2px solid #64b5f6",
//                 backgroundColor: "#e3f2fd",
//                 color: "#1976d2",
//               },
//               textTransform: "none",
//               borderRadius: "8px",
//               px: 3,
//               fontWeight: 600,
//             }}
//           >
//             Cancel
//           </Button>

//           <Button
//             variant="contained"
//             onClick={handleSaveEdit}
//             disabled={
//               !formData.employee ||
//               !formData.requestWorktype ||
//               !formData.requestedDate ||
//               !formData.requestedTill
//             }
//             sx={{
//               background: "linear-gradient(45deg, #1976d2, #64b5f6)",
//               fontSize: "0.95rem",
//               textTransform: "none",
//               padding: "8px 32px",
//               borderRadius: "10px",
//               boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
//               "&:hover": {
//                 background: "linear-gradient(45deg, #1565c0, #42a5f5)",
//               },
//             }}
//             >
//             Save Changes
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// };

// export default WorkTypeRequest;




