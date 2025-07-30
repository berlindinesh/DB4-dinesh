import React, { useState, useEffect } from "react";
// import axios from "axios";
import api from "../../../api/axiosInstance";
import { styled } from "@mui/material/styles";
import { Paper } from "@mui/material";

import CreateFeedback from "./CreateFeedback";
import {
  alpha,
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert,
  Grid,
  Autocomplete,
  Avatar,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Drawer,
  Divider,
  InputAdornment,
  Tooltip,
} from "@mui/material";

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineDot,
  TimelineContent,
} from "@mui/lab";

import {
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  Close,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  GetApp as GetAppIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  BarChart as BarChartIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";

// Import libraries for Excel and PDF export
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import "./Feedback.css";

// Styled components
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

// Add these styled components at the top of your file, after the existing styled components

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

const Feedback = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [activeTab, setActiveTab] = useState("feedbackToReview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterPopupVisible, setFilterPopupVisible] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    selfFeedback: [],
    requestedFeedback: [],
    feedbackToReview: [],
    anonymousFeedback: [],
  });
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterCriteria, setFilterCriteria] = useState({
    title: "",
    employee: "",
    status: "",
    manager: "",
    startDate: "",
    endDate: "",
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [comment, setComment] = useState("");
  const [exportOptions, setExportOptions] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkActionAnchor, setBulkActionAnchor] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [currentFeedbackId, setCurrentFeedbackId] = useState(null);
  // Add these state variables for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Status options based on feedback type
  const [statusOptions] = useState({
    selfFeedback: ["Not Started", "In Progress", "Completed", "Pending"],
    requestedFeedback: ["Not Started", "In Progress", "Completed", "Pending"],
    feedbackToReview: ["Not Started", "In Progress", "Completed", "Pending"],
    anonymousFeedback: ["Not Started", "In Progress", "Completed", "Pending"],
  });

  
  const [currentUser, setCurrentUser] = useState(null);

  const fetchCurrentUser = async () => {
  try {
    // Get user ID from your auth system (localStorage, context, etc.)
    const userId = localStorage.getItem("userId"); // Adjust based on your auth implementation
    // const token = getAuthToken();

    if (!userId) {
      console.error("No user ID found in storage");
      return;
    }

    const response = await api.get(
      `/employees/by-user/${userId}`
      // ,
      // {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // }
    );
    if (response.data.success) {
      setCurrentUser(response.data.data);
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
  }
};


  // Modify your existing useEffect to include fetchCurrentUser
  useEffect(() => {
    fetchFeedbacks();
    fetchEmployees();
    fetchCurrentUser(); // Add this line to your existing useEffect
  }, []);

  // Filter handlers
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
    setFilterPopupVisible(true);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
    setFilterPopupVisible(false);
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchEmployees();
  }, []);

  // Add this helper function to get the auth token
// const getAuthToken = () => {
//   return localStorage.getItem('token');
// };


  

  const fetchEmployees = async () => {
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

    
    const formattedEmployees = response.data.map((emp) => ({
      id: emp.Emp_ID,
      name: `${emp.personalInfo?.firstName || ""} ${
        emp.personalInfo?.lastName || ""
      }`.trim(),
      email: emp.personalInfo?.email || "",
      designation: emp.joiningDetails?.initialDesignation || "No Designation",
      department: emp.joiningDetails?.department || "No Department",
    }));

    setEmployees(formattedEmployees);
    setLoadingEmployees(false);
  } catch (error) {
    console.error("Error fetching employees:", error);
    setLoadingEmployees(false);
  }
};


  // Check for overdue feedbacks and generate notifications
  useEffect(() => {
    const checkOverdueFeedbacks = () => {
      const today = new Date();
      const overdueFeedbacks = [];

      Object.values(feedbackData).forEach((feedbackList) => {
        feedbackList.forEach((feedback) => {
          const dueDate = new Date(feedback.dueDate);
          if (dueDate < today && feedback.status !== "Completed") {
            overdueFeedbacks.push({
              id: feedback._id || feedback.id,
              message: `Feedback "${feedback.title}" for ${feedback.employee} is overdue`,
              type: "warning",
            });
          }

          // Upcoming deadlines (3 days)
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(today.getDate() + 3);

          if (
            dueDate <= threeDaysFromNow &&
            dueDate > today &&
            feedback.status !== "Completed"
          ) {
            overdueFeedbacks.push({
              id: feedback._id || feedback.id,
              message: `Feedback "${feedback.title}" for ${feedback.employee} is due soon`,
              type: "info",
            });
          }
        });
      });

      setNotifications(overdueFeedbacks);
    };

    if (feedbackData) {
      checkOverdueFeedbacks();
    }
  }, [feedbackData]);

  

const fetchFeedbacks = async () => {
  try {
    setLoading(true);
    // const token = getAuthToken();
    const response = await api.get("/feedback"
    //   , {
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // }
  );

    // Get the current user's employee ID
    const userId = localStorage.getItem("userId");
    const currentUserResponse = await api.get(
      `/employees/by-user/${userId}`
      // ,
      // {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // }
    );
    const currentEmployeeId = currentUserResponse.data.data.Emp_ID;

    // Filter self-feedback to only show the current user's feedback
    const feedbackData = response.data;

    // Only filter selfFeedback, keep other tabs as they are
    const filteredData = {
      ...feedbackData,
      selfFeedback: feedbackData.selfFeedback.filter(
        (feedback) => feedback.employeeId === currentEmployeeId
      ),
    };

    setFeedbackData(filteredData);
    setError(null);
  } catch (err) {
    setError("Failed to fetch feedbacks");
    console.error("Error:", err);
  } finally {
    setLoading(false);
  }
};


  

const handleAddFeedback = async (newFeedback, isEditing) => {
  try {
    // Get current user's employee ID
    const userId = localStorage.getItem("userId");
    // const token = getAuthToken();
    const currentUserResponse = await api.get(
      `/employees/by-user/${userId}`
      // ,
      // {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // }
    );
    const currentEmployeeId = currentUserResponse.data.data.Emp_ID;

    const feedbackData = {
      ...newFeedback,
      feedbackType: activeTab,
      employeeId: currentEmployeeId, // Add the employee ID
      createdBy: currentEmployeeId,
    };

    if (isEditing) {
      await api.put(
        `/feedback/${newFeedback._id}`,
        feedbackData
        // ,
        // {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
    } else {
      // For new self-feedback, set a flag to indicate it should be reviewed
      if (activeTab === "selfFeedback") {
        feedbackData.needsReview = true;
        feedbackData.reviewStatus = "Pending";
      }

      await api.post("/feedback", feedbackData
      //   , {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // }
    );
    }

    await fetchFeedbacks();
    setIsCreateModalOpen(false);
    setEditingFeedback(null);
  } catch (error) {
    console.error("Error saving feedback:", error);
    setError("Failed to save feedback");
  }
};


  const handleEdit = (feedback) => {
    setEditingFeedback(feedback);
    setIsCreateModalOpen(true);
  };

  // Add these functions to your component
  const handleDeleteClick = (feedback) => {
    console.log("Feedback object:", feedback); // Debug log
    setItemToDelete(feedback);
    setDeleteDialogOpen(true);
  };

  

  const handleConfirmDelete = async () => {
  try {
    setLoading(true);
    // const token = getAuthToken();
    await api.delete(
      `/feedback/${
        itemToDelete._id || itemToDelete.id
      }`
      // ,
      // {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // }
    );
    await fetchFeedbacks();
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  } catch (error) {
    console.error("Error deleting feedback:", error);
    setError("Failed to delete feedback");
  } finally {
    setLoading(false);
  }
};


  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Helper function to check if a date is valid
  const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  

  const handleStatusChange = async (feedbackId, newStatus) => {
  try {
    // const token = getAuthToken();
    await api.put(`/feedback/${feedbackId}`, {
      status: newStatus
    }
    // , {
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // }
  );
    await fetchFeedbacks();
  } catch (error) {
    console.error("Error updating status:", error);
    setError("Failed to update feedback status");
  }
};


  const handleViewHistory = async (feedbackId) => {
  try {
    
    // const token = getAuthToken();
    const response = await api.get(
      `/feedback/${feedbackId}/history`
      // ,
      // {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // }
    );
    setSelectedFeedback({
      ...Object.values(feedbackData)
        .flat()
        .find((f) => f._id === feedbackId || f.id === feedbackId),
      history: response.data.history || mockHistory(feedbackId),
    });
    setShowHistory(true);
  } catch (error) {
    console.error("Error fetching feedback history:", error);
    // For demo purposes, show mock history if API fails
    const feedback = Object.values(feedbackData)
      .flat()
      .find((f) => f._id === feedbackId || f.id === feedbackId);
    setSelectedFeedback({
      ...feedback,
      history: mockHistory(feedbackId),
    });
    setShowHistory(true);
  }
};


  // Mock history function for demo purposes
  const mockHistory = (feedbackId) => {
    return [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        action: "Created",
        user: "John Doe",
        details: "Feedback created",
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        action: "Updated",
        user: "Jane Smith",
        details: "Status changed from Not Started to In Progress",
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        action: "Comment",
        user: "Mike Johnson",
        details: "Please provide more specific examples in your feedback",
      },
    ];
  };



  const handleAddComment = async () => {
  if (!comment.trim() || !selectedFeedback) return;

  try {
    // In a real app, you would send this to the backend
    // const token = getAuthToken();
    await api.post(
      `/feedback/${selectedFeedback._id}/comments`,
      {
        comment,
       }
      // {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // }
    );

    
    setSelectedFeedback({
      ...selectedFeedback,
      history: [
        ...selectedFeedback.history,
        {
          date: new Date().toISOString(),
          action: "Comment",
          user: "Current User", // In a real app, use the logged-in user
          details: comment,
        },
      ],
    });

    setComment("");
  } catch (error) {
    console.error("Error adding comment:", error);
    // For demo purposes, update the UI anyway
    setSelectedFeedback({
      ...selectedFeedback,
      history: [
        ...selectedFeedback.history,
        {
          date: new Date().toISOString(),
          action: "Comment",
          user: "Current User", // In a real app, use the logged-in user
          details: comment,
        },
      ],
    });
    setComment("");
  }
};


  // Export handler with working Excel and PDF exports
  const handleExport = (format) => {
    if (filteredFeedbackData.length === 0) {
      setError("No data available to export");
      setExportOptions(null);
      return;
    }

    const dataToExport = filteredFeedbackData.map((item) => ({
      Employee: item.employee,
      Title: item.title,
      Status: item.status,
      StartDate: new Date(item.startDate).toLocaleDateString(),
      DueDate: new Date(item.dueDate).toLocaleDateString(),
      Manager: item.manager,
    }));

    if (format === "csv") {
      // Create CSV content
      const headers = Object.keys(dataToExport[0]).join(",");
      const rows = dataToExport
        .map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(",")
        )
        .join("\n");
      const csvContent = `${headers}\n${rows}`;

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (format === "excel") {
      try {
        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Convert data to worksheet
        const ws = XLSX.utils.json_to_sheet(dataToExport);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Feedback");

        // Generate Excel file and trigger download
        XLSX.writeFile(
          wb,
          `feedback_export_${new Date().toISOString().split("T")[0]}.xlsx`
        );
      } catch (error) {
        console.error("Error exporting to Excel:", error);
        alert(
          "Failed to export to Excel. Please make sure the xlsx library is properly installed."
        );
      }
    } else if (format === "pdf") {
      try {
        // Create a new PDF document
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(16);
        doc.text("Feedback Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        // Prepare data for table
        const tableColumn = Object.keys(dataToExport[0]);
        const tableRows = dataToExport.map((item) => Object.values(item));

        // Generate the table
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 30,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [25, 118, 210] },
        });

        // Save the PDF
        doc.save(
          `feedback_export_${new Date().toISOString().split("T")[0]}.pdf`
        );
      } catch (error) {
        console.error("Error exporting to PDF:", error);
        alert(
          "Failed to export to PDF. Please make sure the jspdf and jspdf-autotable libraries are properly installed."
        );
      }
    }

    setExportOptions(false);
  };

  // Bulk selection handlers
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredFeedbackData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredFeedbackData.map((item) => item._id || item.id));
    }
  };

  // Bulk action handler
  const handleBulkAction = async (action) => {
    try {
      if (action === "delete") {
        await Promise.all(
          selectedItems.map((id) =>
            api.delete(`/feedback/${id}`)
          )
        );
      } else if (action === "status") {
        await Promise.all(
          selectedItems.map((id) =>
            api.put(`/feedback/${id}`, {
              status: "Completed",
            })
          )
        );
      }

      await fetchFeedbacks();
      setSelectedItems([]);
      setBulkActionAnchor(null);
    } catch (error) {
      console.error("Error performing bulk action:", error);
      setError("Failed to perform bulk action");
    }
  };

  // Analytics handler
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Try to fetch analytics from the backend
      try {
        const response = await api.get(
          "/feedback/analytics/summary"
        );
        setAnalyticsData(response.data);
        setShowAnalytics(true);
        setLoading(false);
        return;
      } catch (apiError) {
        console.error("Error fetching analytics from API:", apiError);
        // If API fails, continue to calculate locally
      }

      // If API fails, calculate analytics from local data
      const allFeedback = Object.values(feedbackData).flat();

      const analytics = {
        total: allFeedback.length,
        byStatus: {
          completed: allFeedback.filter((f) => f.status === "Completed").length,
          inProgress: allFeedback.filter((f) => f.status === "In Progress")
            .length,
          notStarted: allFeedback.filter((f) => f.status === "Not Started")
            .length,
          pending: allFeedback.filter((f) => f.status === "Pending").length,
        },
        byType: {
          selfFeedback: feedbackData.selfFeedback?.length || 0,
          requestedFeedback: feedbackData.requestedFeedback?.length || 0,
          feedbackToReview: feedbackData.feedbackToReview?.length || 0,
          anonymousFeedback: feedbackData.anonymousFeedback?.length || 0,
        },
        overdue: allFeedback.filter(
          (f) => new Date(f.dueDate) < new Date() && f.status !== "Completed"
        ).length,
        completionRate:
          allFeedback.length > 0
            ? (
                (allFeedback.filter((f) => f.status === "Completed").length /
                  allFeedback.length) *
                100
              ).toFixed(1)
            : 0,
      };

      setAnalyticsData(analytics);
      setShowAnalytics(true);
      setLoading(false);
    } catch (error) {
      console.error("Error calculating analytics:", error);
      setError("Failed to generate analytics");
      setLoading(false);
    }
  };

 

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setCurrentFeedbackId(null);
  };

  const filteredFeedbackData =
    feedbackData[activeTab]?.filter((item) => {
      const matchesSearch =
        item.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        (!filterCriteria.title ||
          item.title
            .toLowerCase()
            .includes(filterCriteria.title.toLowerCase())) &&
        (!filterCriteria.employee ||
          item.employee
            .toLowerCase()
            .includes(filterCriteria.employee.toLowerCase())) &&
        (!filterCriteria.status || item.status === filterCriteria.status) &&
        (!filterCriteria.manager ||
          item.manager
            .toLowerCase()
            .includes(filterCriteria.manager.toLowerCase())) &&
        (!filterCriteria.startDate ||
          new Date(item.startDate) >= new Date(filterCriteria.startDate)) &&
        (!filterCriteria.endDate ||
          new Date(item.dueDate) <= new Date(filterCriteria.endDate));

      return matchesSearch && matchesFilter;
    }) || [];

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const renderMobileCard = (item) => (
    <Card
      key={item._id || item.id}
      sx={{
        mb: 2,
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        border: selectedItems.includes(item._id || item.id)
          ? `2px solid ${theme.palette.primary.main}`
          : "none",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Status indicator */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 16,
          transform: "translateY(-50%)",
          zIndex: 1,
        }}
      >
        <Chip
          label={item.status}
          size="small"
          sx={{
            backgroundColor:
              item.status === "Completed"
                ? "#e6f4ea"
                : item.status === "In Progress"
                ? "#fff8e1"
                : item.status === "Not Started"
                ? "#fce4ec"
                : "#e3f2fd",
            color:
              item.status === "Completed"
                ? "#1b5e20"
                : item.status === "In Progress"
                ? "#f57c00"
                : item.status === "Not Started"
                ? "#c62828"
                : "#0277bd",
            fontWeight: 500,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />
      </Box>

      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ width: "calc(100% - 48px)" }}>
            <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.employee}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Checkbox
              checked={selectedItems.includes(item._id || item.id)}
              onChange={() => handleSelectItem(item._id || item.id)}
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Start Date:
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {new Date(item.startDate).toLocaleDateString()}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Due Date:
          </Typography>
          <Typography
            variant="body2"
            fontWeight={500}
            color={
              new Date(item.dueDate) < new Date() && item.status !== "Completed"
                ? "error"
                : "inherit"
            }
          >
            {new Date(item.dueDate).toLocaleDateString()}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1 }}>
          <Button
            size="small"
            startIcon={<Edit fontSize="small" />}
            onClick={() => handleEdit(item)}
          >
            Edit
          </Button>
          <Button
            size="small"
            startIcon={<HistoryIcon fontSize="small" />}
            onClick={() => handleViewHistory(item._id || item.id)}
          >
            History
          </Button>
          <Button
            size="small"
            startIcon={<Delete fontSize="small" />}
            color="error"
            onClick={() => handleDeleteClick(item)}
          >
            Delete
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  // Add this function to your component
  const clearAllFilters = () => {
    setFilterCriteria({
      title: "",
      employee: "",
      status: "",
      manager: "",
      startDate: "",
      endDate: "",
    });
    setSearchQuery("");
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
          {activeTab === "selfFeedback"
            ? "Self Feedback"
            : activeTab === "requestedFeedback"
            ? "Requested Feedback"
            : activeTab === "feedbackToReview"
            ? "Feedback to Review"
            : "Anonymous Feedback"}
        </Typography>

        {/* Add the mobile menu button here */}
        <Box
          sx={{
            display: { xs: isMobile ? "block" : "none", sm: "none" },
            mb: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<MenuIcon />}
            onClick={() => setMobileMenuOpen(true)}
            fullWidth
            sx={{
              justifyContent: "flex-start",
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              py: 1,
            }}
          >
            Select Feedback Type
          </Button>
        </Box>

        <StyledPaper sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={{ xs: 2, sm: 2 }}
            sx={{
              width: "100%",
              justifyContent: "space-between",
              flexWrap: { sm: "wrap", md: "nowrap" }, // Allow wrapping on iPad if needed
            }}
          >
            <SearchTextField
              placeholder="Search Employee or Feedback"
              value={searchQuery}
              onChange={handleSearchChange}
              size="small"
              sx={{
                width: { xs: "100%", sm: "350px", md: "400px" }, // Increased width for iPad (sm) and desktop (md)
                marginRight: { xs: 0, sm: 2 }, // Add specific margin instead of auto
                flexGrow: { sm: 1, md: 0 }, // Allow it to grow on iPad but fixed on desktop
                maxWidth: { sm: "60%", md: "400px" }, // Ensure it doesn't get too wide on iPad
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            {filterCriteria.title ||
            filterCriteria.employee ||
            filterCriteria.status ||
            filterCriteria.manager ||
            filterCriteria.startDate ||
            filterCriteria.endDate ||
            searchQuery ? (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={clearAllFilters}
                startIcon={<Close />}
                sx={{
                  ml: { xs: 0, sm: 1 },
                  mt: { xs: 1, sm: 0 },
                  height: { sm: 40 },
                }}
              >
                Clear Filters
              </Button>
            ) : null}

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1, sm: 1 },
                width: { xs: "100%", sm: "auto" },
                flexWrap: { sm: "wrap", md: "nowrap" }, // Allow button wrapping on iPad
                justifyContent: { sm: "flex-end" }, // Align buttons to the right
              }}
            >
              <Button
                variant="outlined"
                onClick={handleFilterClick}
                startIcon={<FilterList />}
                sx={{
                  height: { xs: "auto", sm: 40 },
                  padding: { xs: "8px 16px", sm: "6px 16px" },
                  width: { xs: "100%", sm: "auto" },
                  display: { xs: "none", sm: "flex" }, // Hide on xs (mobile), show on sm and up (iPad/desktop)
                }}
              >
                Filter
              </Button>

              <Button
                onClick={fetchAnalytics}
                startIcon={<BarChartIcon />}
                sx={{
                  height: { xs: "auto", sm: 40 },
                  padding: { xs: "8px 16px", sm: "6px 16px" },
                  width: { xs: "100%", sm: "auto" },
                  display: { xs: "none", sm: "flex" }, 
                }}
                variant="outlined"
              >
                Analytics
              </Button>


              <div className="export-tooltip">
                <button
                  className={`feedback-export-button ${loading ? "loading" : ""}`}
                  onClick={(e) =>
                    filteredFeedbackData.length > 0
                      ? setExportOptions(e.currentTarget)
                      : null
                  }
                  disabled={filteredFeedbackData.length === 0}
                >
                  {!loading && <GetAppIcon fontSize="small" />}
                  Export
                </button>
                {filteredFeedbackData.length === 0 && (
                  <span className="tooltip-text">
                    No data available to export
                  </span>
                )}
              </div>

              <Button
                variant="contained"
                onClick={() => setIsCreateModalOpen(true)}
                // startIcon={<Add />}
                sx={{
                  height: { xs: "auto", sm: 40 },
                  borderRadius: "8px",
                  padding: { xs: "8px 16px", sm: "6px 16px" },
                  width: { xs: "100%", sm: "auto" },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                  color: "white",
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                  },
                }}
              >
                Create Feedback
              </Button>
            </Box>
          </Box>
        </StyledPaper>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: { width: "80%", maxWidth: "300px" },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Feedback Menu
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography
            variant="subtitle2"
            sx={{ mb: 2, color: "text.secondary" }}
          >
            FEEDBACK TYPES
          </Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Button
              fullWidth
              variant={activeTab === "selfFeedback" ? "contained" : "outlined"}
              onClick={() => {
                setActiveTab("selfFeedback");
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
            >
              Self Feedback
            </Button>
            <Button
              fullWidth
              variant={
                activeTab === "requestedFeedback" ? "contained" : "outlined"
              }
              onClick={() => {
                setActiveTab("requestedFeedback");
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
            >
              Requested Feedback
            </Button>
            <Button
              fullWidth
              variant={
                activeTab === "feedbackToReview" ? "contained" : "outlined"
              }
              onClick={() => {
                setActiveTab("feedbackToReview");
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
            >
              Feedback to Review
            </Button>
            <Button
              fullWidth
              variant={
                activeTab === "anonymousFeedback" ? "contained" : "outlined"
              }
              onClick={() => {
                setActiveTab("anonymousFeedback");
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
            >
              Anonymous Feedback
            </Button>
          </Stack>

          <Typography
            variant="subtitle2"
            sx={{ mb: 2, color: "text.secondary" }}
          >
            ACTIONS
          </Typography>
          <Stack spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Add />}
              onClick={() => {
                setIsCreateModalOpen(true);
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
            >
              Create Feedback
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={(e) => {
                handleFilterClick(e);
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
            >
              Filter
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<BarChartIcon />}
              onClick={() => {
                fetchAnalytics();
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: "flex-start", textTransform: "none" }}
            >
              Analytics
            </Button>
            <Tooltip
              title={
                filteredFeedbackData.length === 0
                  ? "No data available to export"
                  : "Export data"
              }
              arrow
            >
              <span>
                <button
                  className={`export-button ${loading ? "loading" : ""}`}
                  onClick={(e) => {
                    if (filteredFeedbackData.length > 0) {
                      setExportOptions(e.currentTarget);
                      setMobileMenuOpen(false);
                    } else {
                      setError("No data available to export");
                      setTimeout(() => setError(null), 3000);
                    }
                  }}
                  disabled={filteredFeedbackData.length === 0}
                  style={{ width: "100%", justifyContent: "flex-start" }}
                >
                  {!loading && <GetAppIcon fontSize="small" />}
                  Export
                </button>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Drawer>

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
          Select All Feedback
        </Button>
        {selectedItems.length > 0 && (
          <>
            <Button
              variant="outlined"
              sx={{
                color: "grey.500",
                borderColor: "grey.500",
                width: { xs: "100%", sm: "auto" },
              }}
              onClick={() => setSelectedItems([])}
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
              {selectedItems.length} Selected
            </Button>
            <Button
              variant="outlined"
              sx={{
                color: "primary.main",
                borderColor: "primary.main",
                width: { xs: "100%", sm: "auto" },
              }}
              onClick={(e) => setBulkActionAnchor(e.currentTarget)}
            >
              Bulk Actions
            </Button>
          </>
        )}
      </Box>

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
          onClick={() =>
            setFilterCriteria((prev) => ({ ...prev, status: "Completed" }))
          }
        >
          ● Completed
        </Button>
        <Button
          sx={{
            color: "orange",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() =>
            setFilterCriteria((prev) => ({ ...prev, status: "In Progress" }))
          }
        >
          ● In Progress
        </Button>
        <Button
          sx={{
            color: "red",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() =>
            setFilterCriteria((prev) => ({ ...prev, status: "Not Started" }))
          }
        >
          ● Not Started
        </Button>
        <Button
          sx={{
            color: "blue",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() =>
            setFilterCriteria((prev) => ({ ...prev, status: "Pending" }))
          }
        >
          ● Pending
        </Button>
        <Button
          sx={{
            color: "gray",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setFilterCriteria((prev) => ({ ...prev, status: "" }))}
        >
          ● All
        </Button>
      </Box>

      {(filterCriteria.title ||
        filterCriteria.employee ||
        filterCriteria.manager ||
        filterCriteria.startDate ||
        filterCriteria.endDate ||
        searchQuery) && (
        <Box sx={{ mt: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Active Filters:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {searchQuery && (
              <Chip
                label={`Search: ${searchQuery}`}
                size="small"
                onDelete={() => setSearchQuery("")}
              />
            )}
            {filterCriteria.title && (
              <Chip
                label={`Title: ${filterCriteria.title}`}
                size="small"
                onDelete={() =>
                  setFilterCriteria((prev) => ({ ...prev, title: "" }))
                }
              />
            )}
            {filterCriteria.employee && (
              <Chip
                label={`Employee: ${filterCriteria.employee}`}
                size="small"
                onDelete={() =>
                  setFilterCriteria((prev) => ({ ...prev, employee: "" }))
                }
              />
            )}
            {filterCriteria.manager && (
              <Chip
                label={`Manager: ${filterCriteria.manager}`}
                size="small"
                onDelete={() =>
                  setFilterCriteria((prev) => ({ ...prev, manager: "" }))
                }
              />
            )}
            {filterCriteria.startDate && (
              <Chip
                label={`Start Date: ${new Date(
                  filterCriteria.startDate
                ).toLocaleDateString()}`}
                size="small"
                onDelete={() =>
                  setFilterCriteria((prev) => ({ ...prev, startDate: "" }))
                }
              />
            )}
            {filterCriteria.endDate && (
              <Chip
                label={`End Date: ${new Date(
                  filterCriteria.endDate
                ).toLocaleDateString()}`}
                size="small"
                onDelete={() =>
                  setFilterCriteria((prev) => ({ ...prev, endDate: "" }))
                }
              />
            )}
          </Box>
        </Box>
      )}

      {/* Action Menu for Mobile */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionMenuClose}
      >
        <MenuItem
          onClick={() => {
            const feedback = Object.values(feedbackData)
              .flat()
              .find(
                (f) => f._id === currentFeedbackId || f.id === currentFeedbackId
              );
            handleEdit(feedback);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleViewHistory(currentFeedbackId);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View History</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDeleteClick(
              Object.values(feedbackData)
                .flat()
                .find(
                  (f) =>
                    f._id === currentFeedbackId || f.id === currentFeedbackId
                )
            );
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Box sx={{ mt: 2, mb: 3 }}>
          {notifications.map((notification) => (
            <Alert
              key={notification.id}
              severity={notification.type}
              sx={{ mb: 1 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    const feedback = Object.values(feedbackData)
                      .flat()
                      .find(
                        (f) =>
                          f._id === notification.id || f.id === notification.id
                      );
                    if (feedback) handleEdit(feedback);
                  }}
                >
                  Take Action
                </Button>
              }
            >
              {notification.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Tabs - Visible on all devices but styled differently */}
      <Box
        className="tabs"
        sx={{
          overflowX: "auto",
          display: { xs: isMobile ? "none" : "flex", sm: "flex" },
          flexWrap: { xs: "nowrap", md: "wrap" },
          gap: { xs: "10px", md: "20px" },
          pb: 1,
        }}
      >
        <button
          className={activeTab === "selfFeedback" ? "active" : ""}
          onClick={() => setActiveTab("selfFeedback")}
        >
          Self Feedback
        </button>
        <button
          className={activeTab === "requestedFeedback" ? "active" : ""}
          onClick={() => setActiveTab("requestedFeedback")}
        >
          Requested Feedback
        </button>
        <button
          className={activeTab === "feedbackToReview" ? "active" : ""}
          onClick={() => setActiveTab("feedbackToReview")}
        >
          Feedback to Review
        </button>
        <button
          className={activeTab === "anonymousFeedback" ? "active" : ""}
          onClick={() => setActiveTab("anonymousFeedback")}
        >
          Anonymous Feedback
        </button>
      </Box>

      {/* Filter Popover */}

      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "400px" },
            borderRadius: "16px",
            mt: 1,
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            position: "relative",
            zIndex: 1300,
          },
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
            Filter Feedback
          </Typography>
          <IconButton onClick={handleFilterClose} sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={filterCriteria.title}
              onChange={handleFilterChange}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Autocomplete
              options={employees}
              getOptionLabel={(option) => {
                if (typeof option === "string") {
                  return option;
                }
                return option.name || "";
              }}
              freeSolo
              value={filterCriteria.employee}
              onChange={(event, newValue) => {
                setFilterCriteria((prev) => ({
                  ...prev,
                  employee:
                    typeof newValue === "object"
                      ? newValue?.name || ""
                      : newValue || "",
                }));
              }}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}
                >
                  <Avatar
                    sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
                  >
                    {option.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.id} • {option.designation} • {option.department}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Employee"
                  fullWidth
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {loadingEmployees ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filterCriteria.status}
                onChange={handleFilterChange}
                label="Status"
                startAdornment={
                  <InputAdornment position="start">
                    <CheckCircleIcon fontSize="small" color="action" />
                  </InputAdornment>
                }
              >
                <MenuItem value="">All</MenuItem>
                {statusOptions[activeTab]?.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              options={employees}
              getOptionLabel={(option) => {
                if (typeof option === "string") {
                  return option;
                }
                return option.name || "";
              }}
              freeSolo
              value={filterCriteria.manager}
              onChange={(event, newValue) => {
                setFilterCriteria((prev) => ({
                  ...prev,
                  manager:
                    typeof newValue === "object"
                      ? newValue?.name || ""
                      : newValue || "",
                }));
              }}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}
                >
                  <Avatar
                    sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
                  >
                    {option.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.id} • {option.designation} • {option.department}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Manager"
                  fullWidth
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {loadingEmployees ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Start Date"
                name="startDate"
                type="date"
                value={filterCriteria.startDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />

              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={filterCriteria.endDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Box>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 4 }}
          >
            <Button
              fullWidth
              onClick={() => {
                setFilterCriteria({
                  title: "",
                  employee: "",
                  status: "",
                  manager: "",
                  startDate: "",
                  endDate: "",
                });
              }}
              sx={{
                border: "2px solid #64748b",
                color: "#64748b",
                "&:hover": {
                  border: "2px solid #94a3b8",
                  backgroundColor: "#f1f5f9",
                },
                borderRadius: "8px",
                py: 1,
                fontWeight: 600,
              }}
            >
              Clear Filters
            </Button>

            <Button
              fullWidth
              onClick={handleFilterClose}
              sx={{
                background: "linear-gradient(45deg, #1976d2, #64b5f6)",
                color: "white",
                "&:hover": {
                  background: "linear-gradient(45deg, #1565c0, #42a5f5)",
                },
                borderRadius: "8px",
                py: 1,
                fontWeight: 600,
              }}
            >
              Apply Filters
            </Button>
          </Stack>
        </Box>
      </Popover>

      {/* Export Menu */}
      <Menu
        anchorEl={exportOptions}
        open={Boolean(exportOptions)}
        onClose={() => setExportOptions(null)}
      >
        <MenuItem onClick={() => handleExport("csv")}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport("excel")}>
          <ListItemIcon>
            <TableChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport("pdf")}>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as PDF</ListItemText>
        </MenuItem>
      </Menu>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionAnchor}
        open={Boolean(bulkActionAnchor)}
        onClose={() => setBulkActionAnchor(null)}
      >
        <MenuItem onClick={() => handleBulkAction("status")}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as Completed</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction("delete")}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Selected</ListItemText>
        </MenuItem>
      </Menu>

      {/** Create/Edit Feedback Modal **/}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "700px" },
            maxWidth: "90vw",
            borderRadius: "20px",
            overflow: "hidden",
            margin: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            fontWeight: 600,
            padding: { xs: "16px 24px", sm: "24px 32px" },
            position: "relative",
          }}
        >
          {editingFeedback ? "Edit Feedback" : "Create New Feedback"}
          <IconButton
            onClick={() => {
              setIsCreateModalOpen(false);
              setEditingFeedback(null);
            }}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            padding: { xs: "20px", sm: "32px" },
            "& .MuiFormControl-root": {
              width: "100%",
            },
            "& form": {
              width: "100%",
            },
          }}
        >
          <CreateFeedback
            addFeedback={handleAddFeedback}
            editData={editingFeedback}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingFeedback(null);
            }}
            statusOptions={statusOptions[activeTab]}
            feedbackType={activeTab}
            currentUser={currentUser} // Add this line
          />
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: "12px", sm: "20px" },
            width: { xs: "95%", sm: "auto" },
            margin: { xs: "16px", sm: "auto" },
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            fontWeight: 600,
            padding: { xs: "16px 24px", sm: "24px 32px" },
          }}
        >
          Feedback Analytics
          <IconButton
            onClick={() => setShowAnalytics(false)}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
          {analyticsData && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: "100%", borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Feedback Overview
                  </Typography>
                  <Stack spacing={2}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography>Total Feedback</Typography>
                      <Typography fontWeight="bold">
                        {analyticsData.total}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography>Completion Rate</Typography>
                      <Typography fontWeight="bold">
                        {analyticsData.completionRate}%
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography>Overdue</Typography>
                      <Typography fontWeight="bold" color="error">
                        {analyticsData.overdue}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: "100%", borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    By Status
                  </Typography>
                  <Stack spacing={2}>
                    {Object.entries(analyticsData.byStatus).map(
                      ([status, count]) => (
                        <Box
                          key={status}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography sx={{ textTransform: "capitalize" }}>
                            {status.replace(/([A-Z])/g, " $1").trim()}
                          </Typography>
                          <Typography fontWeight="bold">{count}</Typography>
                        </Box>
                      )
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    By Feedback Type
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-around",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    {Object.entries(analyticsData.byType).map(
                      ([type, count]) => (
                        <Box
                          key={type}
                          sx={{
                            textAlign: "center",
                            p: 2,
                            minWidth: { xs: "100px", sm: "120px" },
                            borderRadius: 2,
                            bgcolor: "#f8fafc",
                            flexGrow: { xs: 1, sm: 0 },
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              mb: 1,
                              color: "#1976d2",
                              fontSize: { xs: "1.5rem", sm: "2rem" },
                            }}
                          >
                            {count}
                          </Typography>
                          <Typography
                            sx={{
                              textTransform: "capitalize",
                              color: "#64748b",
                              fontWeight: 500,
                              fontSize: { xs: "0.8rem", sm: "0.875rem" },
                            }}
                          >
                            {type.replace(/([A-Z])/g, " $1").trim()}
                          </Typography>
                        </Box>
                      )
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: "12px", sm: "16px" },
            overflow: "hidden",
            width: { xs: "95%", sm: "auto" },
            margin: { xs: "16px", sm: "auto" },
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            fontWeight: 600,
            padding: { xs: "16px 24px", sm: "24px 32px" },
          }}
        >
          Feedback History
          <IconButton
            onClick={() => setShowHistory(false)}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedFeedback && (
            <>
              <Box
                sx={{ p: { xs: 2, sm: 3 }, borderBottom: "1px solid #e2e8f0" }}
              >
                <Typography
                  variant="h6"
                  sx={{ mb: 1, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                >
                  {selectedFeedback.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  For: {selectedFeedback.employee} • Status:{" "}
                  {selectedFeedback.status}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: { xs: 2, sm: 3 },
                  maxHeight: { xs: "250px", sm: "300px" },
                  overflowY: "auto",
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Activity Timeline
                </Typography>

                <Timeline position="right" sx={{ p: 0, m: 0 }}>
                  {selectedFeedback.history.map((item, index) => (
                    <TimelineItem key={index}>
                      <TimelineSeparator>
                        <TimelineDot
                          color={
                            item.action === "Created"
                              ? "success"
                              : item.action === "Updated"
                              ? "primary"
                              : item.action === "Comment"
                              ? "info"
                              : "grey"
                          }
                        />
                        {index < selectedFeedback.history.length - 1 && (
                          <TimelineConnector />
                        )}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: "12px", px: 2 }}>
                        <Typography
                          variant="subtitle2"
                          component="span"
                          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                        >
                          {item.action} by {item.user}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          {new Date(item.date).toLocaleString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                          }}
                        >
                          {item.details}
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Box>

              <Box sx={{ p: { xs: 2, sm: 3 }, borderTop: "1px solid #e2e8f0" }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Add Comment
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Type your comment here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddComment}
                  sx={{
                    background: "linear-gradient(45deg, #1976d2, #64b5f6)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(45deg, #1565c0, #42a5f5)",
                    },
                    textTransform: "none",
                    borderRadius: "8px",
                  }}
                >
                  Add Comment
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Table or Cards based on screen size */}
      <Box
        sx={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          overflow: "hidden",
          margin: "24px 0",
        }}
      >
        {isMobile ? (
         

          <Box sx={{ p: 2 }}>
            {filteredFeedbackData.length > 0 ? (
              filteredFeedbackData.map((item) => renderMobileCard(item))
            ) : (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  No feedback found. Try adjusting your filters or create a new
                  feedback.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setIsCreateModalOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Create Feedback
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          // Table View for Tablet and Desktop
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedItems.length > 0 &&
                        selectedItems.length < filteredFeedbackData.length
                      }
                      checked={
                        filteredFeedbackData.length > 0 &&
                        selectedItems.length === filteredFeedbackData.length
                      }
                      onChange={handleSelectAll}
                      sx={{
                        color: "white",
                        "&.Mui-checked": { color: "white" },
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>Employee</StyledTableCell>
                  <StyledTableCell>Title</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Start Date</StyledTableCell>
                  <StyledTableCell>Due Date</StyledTableCell>
                  <StyledTableCell>Actions</StyledTableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredFeedbackData.length > 0 ? (
                  filteredFeedbackData.map((item) => (
                    <StyledTableRow
                      key={item._id || item.id}
                      sx={{
                        backgroundColor: selectedItems.includes(
                          item._id || item.id
                        )
                          ? alpha(theme.palette.primary.light, 0.15)
                          : "inherit",
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedItems.includes(item._id || item.id)}
                          onChange={() => handleSelectItem(item._id || item.id)}
                        />
                      </TableCell>
                      <TableCell>{item.employee}</TableCell>
                      <TableCell>{item.title}</TableCell>

                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={item.status}
                            onChange={(e) =>
                              handleStatusChange(
                                item._id || item.id,
                                e.target.value
                              )
                            }
                            size="small"
                            sx={{
                              backgroundColor:
                                item.status === "Completed"
                                  ? "#e6f4ea"
                                  : item.status === "In Progress"
                                  ? "#fff8e1"
                                  : item.status === "Not Started"
                                  ? "#fce4ec"
                                  : "#e3f2fd",
                              color:
                                item.status === "Completed"
                                  ? "#1b5e20"
                                  : item.status === "In Progress"
                                  ? "#f57c00"
                                  : item.status === "Not Started"
                                  ? "#c62828"
                                  : "#0277bd",
                              fontWeight: 500,
                              minWidth: 100,
                              textAlign: "center",
                            }}
                          >
                            {statusOptions[activeTab]?.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>

                      <TableCell>
                        {new Date(item.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(item.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            onClick={() => handleEdit(item)}
                            size="small"
                            sx={{
                              color: "#1976d2",
                              "&:hover": { backgroundColor: "#e3f2fd" },
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              handleViewHistory(item._id || item.id)
                            }
                            size="small"
                            sx={{
                              color: "#64748b",
                              "&:hover": { backgroundColor: "#f1f5f9" },
                            }}
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteClick(item)}
                            size="small"
                            sx={{
                              color: "#ef4444",
                              "&:hover": { backgroundColor: "#fee2e2" },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </StyledTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No feedback found. Try adjusting your filters or create
                        a new feedback.
                      </Typography>
                      <Button
                        variant="outlined"
                        // startIcon={<Add />}
                        onClick={() => setIsCreateModalOpen(true)}
                        sx={{ mt: 2 }}
                      >
                        Create Feedback
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            p: { xs: 1.5, sm: 2 },
            bgcolor: "white",
            borderRadius: "8px",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            zIndex: 10,
            mx: { xs: -1, sm: 0 },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 2 }}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Typography
              variant="body2"
              sx={{ textAlign: { xs: "center", sm: "left" } }}
            >
              {selectedItems.length}{" "}
              {selectedItems.length === 1 ? "item" : "items"} selected
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setSelectedItems([])}
                size="small"
                sx={{ borderRadius: "8px" }}
              >
                Clear Selection
              </Button>

              <Button
                variant="contained"
                onClick={(e) => setBulkActionAnchor(e.currentTarget)}
                size="small"
                sx={{
                  background: "linear-gradient(45deg, #1976d2, #64b5f6)",
                  borderRadius: "8px",
                }}
              >
                Bulk Actions
              </Button>
            </Box>
          </Stack>
        </Box>
      )}

      <div className="pagination">Page 1 of 1</div>

      {/* Delete Confirmation Dialog */}
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
        TransitionComponent={Fade}
        TransitionProps={{
          timeout: 300,
        }}
        sx={{
          "& .MuiDialog-container": {
            justifyContent: "center",
            alignItems: "center",
            "& .MuiPaper-root": {
              margin: { xs: "16px", sm: "32px" },
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            },
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
            Are you sure you want to delete this feedback? This action cannot be
            undone.
          </Alert>
          {itemToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
              {/* Adjust these fields based on your actual data structure */}
              <Typography variant="body1" fontWeight={600} color="#2c3e50">
                {itemToDelete.feedbackTitle ||
                  itemToDelete.title ||
                  "Untitled Feedback"}
              </Typography>

              {/* Employee information */}
              {(itemToDelete.employeeName || itemToDelete.employee) && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  <strong>For:</strong>{" "}
                  {itemToDelete.employeeName ||
                    (typeof itemToDelete.employee === "object"
                      ? itemToDelete.employee.name
                      : itemToDelete.employee)}
                </Typography>
              )}

              {/* Feedback type */}
              {itemToDelete.feedbackType && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Type:</strong> {itemToDelete.feedbackType}
                </Typography>
              )}

              {/* Status */}
              {(itemToDelete.feedbackStatus || itemToDelete.status) && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong>{" "}
                  {itemToDelete.feedbackStatus || itemToDelete.status}
                </Typography>
              )}

              {/* Dates */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  mt: 1,
                }}
              >
                {itemToDelete.startDate && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Start Date:</strong>{" "}
                    {isValidDate(new Date(itemToDelete.startDate))
                      ? new Date(itemToDelete.startDate).toLocaleDateString()
                      : "Invalid Date"}
                  </Typography>
                )}

                {itemToDelete.dueDate && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Due Date:</strong>{" "}
                    {isValidDate(new Date(itemToDelete.dueDate))
                      ? new Date(itemToDelete.dueDate).toLocaleDateString()
                      : "Invalid Date"}
                  </Typography>
                )}
              </Box>
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

export default Feedback;
