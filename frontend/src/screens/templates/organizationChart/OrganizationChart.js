import React, { useState, useEffect, useCallback } from "react";
// RBAC imports
import { useSelector } from "react-redux";
import { selectUserRole, selectUserPermissions, selectUser } from "../../../redux/authSlice";

import api from "../../../api/axiosInstance";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Snackbar,
  Alert,
  InputLabel,
  Autocomplete,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  Grid,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import BusinessIcon from "@mui/icons-material/Business";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import BadgeIcon from "@mui/icons-material/Badge";
import WorkIcon from "@mui/icons-material/Work";
import EmailIcon from "@mui/icons-material/Email";
import InfoIcon from "@mui/icons-material/Info";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const OrganizationChart = () => {
  const [treeData, setTreeData] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [newPosition, setNewPosition] = useState({
    name: "",
    designation: "",
    parentId: "",
    department: "",
    employeeId: "",
    email: "",
    status: "active",
  });
  const [editingPosition, setEditingPosition] = useState(null);
  const [registeredEmployees, setRegisteredEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Add delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);

   // Add these lines after existing useState declarations
  const userRole = useSelector(selectUserRole);
  const userPermissions = useSelector(selectUserPermissions);
  const currentUser = useSelector(selectUser);

  // Add responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // const API_URL = `${process.env.REACT_APP_API_URL}/api/organization`; 

  useEffect(() => {
    fetchOrganizationChart();
    fetchRegisteredEmployees();
  }, []);

  
  // Permission helper functions
const canCreatePositions = () => {
  return ['hr', 'admin'].includes(userRole?.toLowerCase());
};

const canEditPositions = () => {
  return ['hr', 'admin'].includes(userRole?.toLowerCase());
};

const canDeletePositions = () => {
  return ['hr', 'admin'].includes(userRole?.toLowerCase());
};

const canViewChart = () => {
  return ['hr', 'admin', 'employee'].includes(userRole?.toLowerCase());
};


  const handleEmployeeSelect = (event, employee) => {
    setSelectedEmployee(employee);
    if (employee) {
      // Populate the position form with employee data
      const fullName = `${employee.personalInfo?.firstName || ""} ${
        employee.personalInfo?.lastName || ""
      }`.trim();
      const department = employee.joiningDetails?.department || "";

      setNewPosition({
        ...newPosition,
        name: fullName,
        employeeId: employee.Emp_ID || "",
        email: employee.personalInfo?.email || "",
        department: department, // Make sure department is set correctly
        designation: employee.joiningDetails?.initialDesignation || "",
      });

      // Log to verify the department is being set
      console.log("Setting department:", department);
    } else {
      // Reset employee-related fields if selection is cleared
      setNewPosition({
        ...newPosition,
        employeeId: "",
        email: "",
        department: "",
        designation: "",
      });
    }
  };

  const handleDeleteClick = (node) => {
    setPositionToDelete(node);
    setDeleteDialogOpen(true);
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPositionToDelete(null);
  };


  
  
  const resetForm = () => {
    setNewPosition({
      name: "",
      designation: "",
      email: "",
      employeeId: "",
      department: "",
      parentId: "",
      status: "active",
    });
    setSelectedEmployee(null);
    setEditingPosition(null);
    setEditingNodeId(null);
  };

  const showNodeDetails = (node) => {
    setNodeDetails(node);
    setIsDetailsOpen(true);
  };

  const getAllNodes = useCallback((node, nodes = []) => {
    if (!node) return nodes;
    nodes.push({
      _id: node._id,
      name: node.name,
      title: node.title,
      department: node.department,
      employeeId: node.employeeId,
    });
    if (node.children) {
      node.children.forEach((child) => getAllNodes(child, nodes));
    }
    return nodes;
  }, []);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const renderTreeNode = (node, level = 0) => {
    if (!node) return null;

    // Determine background color based on department or level
    const getBgColor = () => {
      if (level === 0) return "rgba(33, 150, 243, 0.95)";

      // If node has a department, use a color based on department
      if (node.department) {
        const deptColors = {
          HR: "rgba(156, 39, 176, 0.9)",
          IT: "rgba(0, 150, 136, 0.9)",
          Finance: "rgba(255, 152, 0, 0.9)",
          Marketing: "rgba(233, 30, 99, 0.9)",
          Operations: "rgba(63, 81, 181, 0.9)",
          Sales: "rgba(76, 175, 80, 0.9)",
        };
        return deptColors[node.department] || "rgba(25, 118, 210, 0.95)";
      }

      return "rgba(25, 118, 210, 0.95)";
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: level * 0.2,
          ease: [0.43, 0.13, 0.23, 0.96],
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${getBgColor()} 0%, ${
              level === 0
                ? "rgba(30, 136, 229, 0.90)"
                : "rgba(30, 136, 229, 0.90)"
            } 100%)`,
            padding: isMobile ? "16px" : isTablet ? "20px" : "24px",
            borderRadius: "16px",
            color: "white",
            minWidth: isMobile ? "200px" : isTablet ? "240px" : "280px",
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            position: "relative",
            zIndex: 2,
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-5px)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
            },
          }}
          onClick={() => showNodeDetails(node)}
        >
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: isMobile ? "0.9rem" : isTablet ? "1rem" : "1.25rem",
              wordBreak: "break-word",
            }}
          >
            {node.name}
            {node.employeeId && (
              <Chip
                size="small"
                label={node.employeeId}
                sx={{
                  ml: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  color: "white",
                  fontWeight: 500,
                  fontSize: "0.7rem",
                }}
              />
            )}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              opacity: 0.9,
              fontSize: isMobile ? "0.75rem" : "0.875rem",
              wordBreak: "break-word",
            }}
          >
            {node.title} {/* This is the designation */}
          </Typography>
          {node.department && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                opacity: 0.8,
                fontSize: isMobile ? "0.65rem" : "0.75rem",
              }}
            >
              {node.department}
            </Typography>
          )}
          <Box
            sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 1 }}
          >
            {canEditPositions() && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                openEditDialog(node);
              }}
              sx={{
                color: "white",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
                padding: isMobile ? "4px" : "8px",
              }}
            >
              <EditIcon fontSize={isMobile ? "inherit" : "small"} />
            </IconButton>
            )}
            { canDeletePositions() && level !== 0 && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(node);
                }}
                sx={{
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  },
                  padding: isMobile ? "4px" : "8px",
                }}
              >
                <DeleteIcon fontSize={isMobile ? "inherit" : "small"} />
              </IconButton>
            )}
          </Box>
        </Box>

        {node.children && node.children.length > 0 && (
          <>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: isMobile ? "30px" : "50px" }}
              style={{
                width: "2px",
                backgroundColor: "#90caf9",
                margin: "8px 0",
              }}
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "center",
                gap: isMobile ? 4 : 6,
                position: "relative",
              }}
            >
              {/* Horizontal line connecting children */}
              {!isMobile && node.children.length > 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "-8px",
                    left: `${(100 / node.children.length) * 0.5}%`,
                    right: `${(100 / node.children.length) * 0.5}%`,
                    height: "2px",
                    backgroundColor: "#90caf9",
                  }}
                />
              )}

              {node.children.map((child, index) => (
                <Box
                  key={child._id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* Vertical line to horizontal connector for desktop */}
                  {!isMobile && node.children.length > 1 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "-8px",
                        left: "50%",
                        width: "2px",
                        height: "8px",
                        backgroundColor: "#90caf9",
                        transform: "translateX(-50%)",
                      }}
                    />
                  )}
                  {renderTreeNode(child, level + 1)}
                </Box>
              ))}
            </Box>
          </>
        )}
      </motion.div>
    );
  };

  const openEditDialog = (node) => {
    setEditingNodeId(node._id); // Set the ID
    setEditingPosition(node); // Set the full node object
    setNewPosition({
      name: node.name,
      designation: node.title,
      email: node.email || "",
      employeeId: node.employeeId || "",
      department: node.department || "",
      parentId: node.parentId || "",
      status: node.status || "active",
    });

    // If the node has employee data, find and set the corresponding employee
    if (node.employeeId) {
      const employee = registeredEmployees.find(
        (emp) => emp.Emp_ID === node.employeeId
      );
      setSelectedEmployee(employee || null);
    } else {
      setSelectedEmployee(null);
    }

    setIsEditDialogOpen(true);
  };



//   // Add this function to get the auth token
// const getAuthToken = () => {
//   return localStorage.getItem('token');
// };


// const fetchOrganizationChart = async () => {
//   try {
//     setIsLoading(true);
//     // const token = getAuthToken();
//     const response = await api.get(`${API_URL}/organization-chart`
//     //   , {
//     //   headers: {
//     //     'Authorization': `Bearer ${token}`
//     //   }
//     // }
//   );
//     setTreeData(response.data);
//     setIsLoading(false);
//   } catch (error) {
//     console.error("Error fetching organization chart:", error);
//     setIsLoading(false);
//     setAlert({
//       open: true,
//       message: "Error loading organization chart",
//       severity: "error",
//     });
//   }
// };

const fetchOrganizationChart = async () => {
  try {
    setIsLoading(true);
    // const response = await api.get(`${API_URL}/chart`);
    const response = await api.get('organization/chart');
    setTreeData(response.data);
    setIsLoading(false);
  } catch (error) {
    console.error("Error fetching organization chart:", error);
    setIsLoading(false);
    setAlert({
      open: true,
      message: `Error loading organization chart: ${error.response?.data?.message || error.message}`,
      severity: "error",
    });
  }
};


// const fetchRegisteredEmployees = async () => {
//   try {
//     setLoadingEmployees(true);
//     // const token = getAuthToken();
//     const response = await api.get(`${API_URL}/employees/registered`
//     //   , {
//     //   headers: {
//     //     'Authorization': `Bearer ${token}`
//     //   }
//     // }
//   );
//     setRegisteredEmployees(response.data);
//     setLoadingEmployees(false);
//   } catch (error) {
//     console.error("Error fetching registered employees:", error);
//     setAlert({
//       open: true,
//       message: "Error loading employees",
//       severity: "error",
//     });
//     setLoadingEmployees(false);
//   }
// };

const fetchRegisteredEmployees = async () => {
  try {
    setLoadingEmployees(true);
    // const response = await api.get(`${process.env.REACT_APP_API_URL}/api/employees/registered`);
    const response = await api.get('employees/registered');

    setRegisteredEmployees(response.data);
    setLoadingEmployees(false);
  } catch (error) {
    console.error("Error fetching registered employees:", error);
    setAlert({
      open: true,
      message: "Error loading employees",
      severity: "error",
    });
    setLoadingEmployees(false);
  }
};

const handleAddPosition = async () => {
  try {
    // Rename designation to title for API compatibility
    const positionData = {
      ...newPosition,
      title: newPosition.designation,
    };
    delete positionData.designation;

    // const response = await api.post(`${API_URL}/positions`, positionData);
    const response = await api.post('organization/positions', positionData);


    await fetchOrganizationChart();
    setIsDialogOpen(false);
    resetForm();
    setAlert({
      open: true,
      message: "Position added successfully",
      severity: "success",
    });
  } catch (error) {
    console.error("Error adding position:", error);
    setAlert({
      open: true,
      message: error.response?.data?.error || "Error adding position",
      severity: "error",
    });
  }
};

const handleUpdatePosition = async () => {
  try {
    if (!editingNodeId) {
      console.error("No position ID found for update");
      setAlert({
        open: true,
        message: "Error: No position ID found",
        severity: "error",
      });
      return;
    }

    // Rename designation to title for API compatibility
    const positionData = {
      ...newPosition,
      title: newPosition.designation,
    };
    delete positionData.designation;

    console.log("Updating position with ID:", editingNodeId);
    console.log("Update data:", positionData);

    // const token = getAuthToken();
    // Use the editingNodeId directly
    // await api.put(`${API_URL}/positions/${editingNodeId}`, positionData
    await api.put(`organization/positions/${editingNodeId}`, positionData

    //   , {
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // }
  );

    await fetchOrganizationChart();
    setIsEditDialogOpen(false);
    resetForm();
    setAlert({
      open: true,
      message: "Position updated successfully",
      severity: "success",
    });
  } catch (error) {
    console.error("Error updating position:", error);
    setAlert({
      open: true,
      message:
        "Error updating position: " +
        (error.response?.data?.message || error.message),
      severity: "error",
    });
  }
};


const handleConfirmDelete = async () => {
  if (!positionToDelete) return;

  try {
    setIsLoading(true);
    // const token = getAuthToken();
    // await api.delete(`${API_URL}/positions/${positionToDelete._id}`
    await api.delete(`organization/positions/${positionToDelete._id}`
  );
    await fetchOrganizationChart();
    setAlert({
      open: true,
      message: "Position deleted successfully",
      severity: "success",
    });
  } catch (error) {
    console.error("Error deleting position:", error);
    setAlert({
      open: true,
      message: error.response?.data?.message || "Error deleting position",
      severity: "error",
    });
  } finally {
    setIsLoading(false);
    handleCloseDeleteDialog();
  }
};


  return (
    <Box sx={{ p: isMobile ? 2 : 3, position: "relative" }}>
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          mb: 4,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 2 : 0,
        }}
      >
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h1"
          fontWeight="bold"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontSize: isMobile ? "1.5rem" : "2rem",
          }}
        >
          <AccountTreeIcon
            sx={{
              color: "#1976d2",
              fontSize: isMobile ? "1.5rem" : "2rem",
            }}
          />
          Organization Chart
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: isMobile ? "column" : "row",
            width: isMobile ? "100%" : "auto",
          }}
        >
          {canCreatePositions() && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={() => setIsDialogOpen(true)}
            fullWidth={isMobile}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Add Position
          </Button>
          )}

          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: isMobile ? "center" : "flex-start",
              mt: isMobile ? 1 : 0,
            }}
          >
            <Tooltip title="Zoom In">
              <IconButton
                onClick={handleZoomIn}
                sx={{
                  backgroundColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton
                onClick={handleZoomOut}
                sx={{
                  backgroundColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
              >
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Zoom">
              <IconButton
                onClick={handleResetZoom}
                sx={{
                  backgroundColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: isMobile ? 2 : 4,
          borderRadius: "16px",
          backgroundColor: "#f8fafc",
          overflowX: "auto",
          minHeight: "70vh",
          backgroundImage:
            "linear-gradient(#e3f2fd 1px, transparent 1px), linear-gradient(90deg, #e3f2fd 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: "center center",
          position: "relative",
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
          >
            <CircularProgress />
          </Box>
        ) : treeData ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              padding: isMobile ? "16px 8px" : "32px 16px",
              transform: `scale(${zoom})`,
              transition: "transform 0.3s ease",
              transformOrigin: "top center",
            }}
          >
            {renderTreeNode(treeData)}
          </Box>
       ) : (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "50vh",
      gap: 2,
    }}
  >
    <BusinessIcon sx={{ fontSize: 60, color: "#ccc" }} />
    <Typography variant="h6" color="text.secondary">
      No organization chart data available
    </Typography>
    {canCreatePositions() ? (
      <Button
        variant="contained"
        startIcon={<PersonAddIcon />}
        onClick={() => setIsDialogOpen(true)}
      >
        Add First Position
      </Button>
    ) : (
      <Typography variant="body2" color="text.secondary">
        Contact your administrator to set up the organization chart
      </Typography>
    )}
  </Box>
)}

      </Paper>

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
          <DeleteIcon />
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
            Are you sure you want to delete this position? This action cannot be
            undone.
          </Alert>
          {positionToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
              <Typography variant="body1" fontWeight={600} color="#2c3e50">
                Position: {positionToDelete.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Title: {positionToDelete.title}
              </Typography>
              {positionToDelete.department && (
                <Typography variant="body2" color="text.secondary">
                  Department: {positionToDelete.department}
                </Typography>
              )}
              {positionToDelete.employeeId && (
                <Typography variant="body2" color="text.secondary">
                  Employee ID: {positionToDelete.employeeId}
                </Typography>
              )}
              {positionToDelete.children &&
                positionToDelete.children.length > 0 && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{ mt: 1, fontWeight: 500 }}
                  >
                    Warning: This position has{" "}
                    {positionToDelete.children.length} subordinate position(s)
                    that will be affected.
                  </Typography>
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
            disabled={isLoading}
            startIcon={
              isLoading ? <CircularProgress size={20} color="inherit" /> : null
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
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Position Dialog */}
      
{canCreatePositions() && (
      <Dialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          resetForm();
        }}
        fullWidth
        maxWidth="md"
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
          Add New Position
        </DialogTitle>
        <DialogContent
          sx={{
            padding: "32px",
            backgroundColor: "#f8fafc",
            marginTop: "20px",
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Autocomplete
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
                    label="Select Employee (Optional)"
                    variant="outlined"
                    fullWidth
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
                      sx: {
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
                label="Name"
                value={newPosition.name}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, name: e.target.value })
                }
                fullWidth
                required
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
                label="Designation/Title"
                value={newPosition.designation}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    designation: e.target.value,
                  })
                }
                fullWidth
                required
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
                label="Email"
                value={newPosition.email}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, email: e.target.value })
                }
                fullWidth
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
                label="Employee ID"
                value={newPosition.employeeId}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    employeeId: e.target.value,
                  })
                }
                fullWidth
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
              <FormControl
                fullWidth
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
                <InputLabel>Department</InputLabel>
                <Select
                  value={newPosition.department}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      department: e.target.value,
                    })
                  }
                  label="Department"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="IT">IT</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
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
                <InputLabel>Reports To</InputLabel>
                <Select
                  value={newPosition.parentId}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      parentId: e.target.value,
                    })
                  }
                  label="Reports To"
                >
                  <MenuItem value="">None (Top Level)</MenuItem>
                  {treeData &&
                    getAllNodes(treeData).map((node) => (
                      <MenuItem key={node._id} value={node._id}>
                        {node.name} - {node.title}
                        {node.department && ` (${node.department})`}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={newPosition.status}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      status: e.target.value,
                    })
                  }
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="vacant">Vacant</MenuItem>
                </Select>
              </FormControl>
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
            onClick={() => {
              setIsDialogOpen(false);
              resetForm();
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
              px: { xs: 2, sm: 3 },
              fontWeight: 600,
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "120px" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddPosition}
            variant="contained"
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
            Add Position
          </Button>
        </DialogActions>
      </Dialog>
      )}

      {/* Edit Position Dialog */}
      {/* <Dialog 
        open={isEditDialogOpen} 
        onClose={() => {
          setIsEditDialogOpen(false);
          resetForm();
        }}
        fullWidth
        maxWidth="md"
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
            backgroundColor: "#1976d2",
            color: "white",
            fontSize: isMobile ? "1.25rem" : "1.5rem",
            fontWeight: 600,
          }}
        >
          Edit Position
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Autocomplete
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
                    label="Select Employee (Optional)"
                    variant="outlined"
                    fullWidth
                    margin="normal"
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
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                value={newPosition.name}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, name: e.target.value })
                }
                fullWidth
                margin="normal"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Designation/Title"
                value={newPosition.designation}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    designation: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                value={newPosition.email}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, email: e.target.value })
                }
                fullWidth
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Employee ID"
                value={newPosition.employeeId}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    employeeId: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Department</InputLabel>
                <Select
                  value={newPosition.department}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      department: e.target.value,
                    })
                  }
                  label="Department"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="IT">IT</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Reports To</InputLabel>
                <Select
                  value={newPosition.parentId}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      parentId: e.target.value,
                    })
                  }
                  label="Reports To"
                >
                  <MenuItem value="">None (Top Level)</MenuItem>
                  {treeData &&
                    getAllNodes(treeData)
                      .filter((node) => node._id !== editingPosition?._id)
                      .map((node) => (
                        <MenuItem key={node._id} value={node._id}>
                          {node.name} - {node.title}
                          {node.department && ` (${node.department})`}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={newPosition.status}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      status: e.target.value,
                    })
                  }
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="vacant">Vacant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}
            color="inherit"
            sx={{ 
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePosition}
            variant="contained"
            color="primary"
            sx={{ 
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Update Position
          </Button>
        </DialogActions>
      </Dialog> */}
{canEditPositions() && (
      <Dialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          resetForm();
        }}
        fullWidth
        maxWidth="md"
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
          Edit Position
        </DialogTitle>
        <DialogContent
          sx={{
            padding: "32px",
            backgroundColor: "#f8fafc",
            marginTop: "20px",
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Autocomplete
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
                    label="Select Employee (Optional)"
                    variant="outlined"
                    fullWidth
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
                      sx: {
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
                label="Name"
                value={newPosition.name}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, name: e.target.value })
                }
                fullWidth
                required
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
                label="Designation/Title"
                value={newPosition.designation}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    designation: e.target.value,
                  })
                }
                fullWidth
                required
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
                label="Email"
                value={newPosition.email}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, email: e.target.value })
                }
                fullWidth
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
                label="Employee ID"
                value={newPosition.employeeId}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    employeeId: e.target.value,
                  })
                }
                fullWidth
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
              <FormControl
                fullWidth
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
                <InputLabel>Department</InputLabel>
                <Select
                  value={newPosition.department}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      department: e.target.value,
                    })
                  }
                  label="Department"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="IT">IT</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
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
                <InputLabel>Reports To</InputLabel>
                <Select
                  value={newPosition.parentId}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      parentId: e.target.value,
                    })
                  }
                  label="Reports To"
                >
                  <MenuItem value="">None (Top Level)</MenuItem>
                  {treeData &&
                    getAllNodes(treeData)
                      .filter((node) => node._id !== editingNodeId)
                      .map((node) => (
                        <MenuItem key={node._id} value={node._id}>
                          {node.name} - {node.title}
                          {node.department && ` (${node.department})`}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={newPosition.status}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      status: e.target.value,
                    })
                  }
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="vacant">Vacant</MenuItem>
                </Select>
              </FormControl>
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
            onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
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
              px: { xs: 2, sm: 3 },
              fontWeight: 600,
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "120px" },
            }}
          >
            Cancel
          </Button>
          {/* <Button
        onClick={handleUpdatePosition}
        variant="contained"
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
        Update Position
      </Button> * */}
          <Button
            onClick={handleUpdatePosition}
            variant="contained"
            disabled={!newPosition.name || !newPosition.designation} // Add validation
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
            Update Position
          </Button>
        </DialogActions>
      </Dialog>
      )}

      {/* Node Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : "16px",
            margin: isMobile ? 0 : undefined,
          },
        }}
      >
        {nodeDetails && (
          <>
            <DialogTitle
              sx={{
                backgroundColor:
                  nodeDetails.department === "HR"
                    ? "rgba(156, 39, 176, 0.9)"
                    : nodeDetails.department === "IT"
                    ? "rgba(0, 150, 136, 0.9)"
                    : nodeDetails.department === "Finance"
                    ? "rgba(255, 152, 0, 0.9)"
                    : nodeDetails.department === "Marketing"
                    ? "rgba(233, 30, 99, 0.9)"
                    : nodeDetails.department === "Operations"
                    ? "rgba(63, 81, 181, 0.9)"
                    : nodeDetails.department === "Sales"
                    ? "rgba(76, 175, 80, 0.9)"
                    : "rgba(25, 118, 210, 0.95)",
                color: "white",
                fontSize: isMobile ? "1.25rem" : "1.5rem",
                fontWeight: 600,
              }}
            >
              Position Details
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: "#f5f5f5",
                      borderRadius: "8px",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {nodeDetails.name}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {nodeDetails.title}
                    </Typography>
                    {nodeDetails.department && (
                      <Chip
                        label={nodeDetails.department}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <BadgeIcon
                      sx={{ color: "primary.main", mr: 1, fontSize: "1.2rem" }}
                    />
                    <Typography variant="body2" fontWeight="medium">
                      Employee ID:
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 4 }}
                  >
                    {nodeDetails.employeeId || "Not assigned"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <WorkIcon
                      sx={{ color: "primary.main", mr: 1, fontSize: "1.2rem" }}
                    />
                    <Typography variant="body2" fontWeight="medium">
                      Status:
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 4 }}
                  >
                    {nodeDetails.status || "Active"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <EmailIcon
                      sx={{ color: "primary.main", mr: 1, fontSize: "1.2rem" }}
                    />
                    <Typography variant="body2" fontWeight="medium">
                      Email:
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 4 }}
                  >
                    {nodeDetails.email || "Not available"}
                  </Typography>
                </Grid>

                {nodeDetails.parentId && (
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <InfoIcon
                        sx={{
                          color: "primary.main",
                          mr: 1,
                          fontSize: "1.2rem",
                        }}
                      />
                      <Typography variant="body2" fontWeight="medium">
                        Reports To:
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 4 }}
                    >
                      {(treeData &&
                        getAllNodes(treeData).find(
                          (node) => node._id === nodeDetails.parentId
                        )?.name) ||
                        "Unknown"}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 2,
                    }}
                  >
                    <Button
                      onClick={() => {
                        setIsDetailsOpen(false);
                        openEditDialog(nodeDetails);
                      }}
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Edit Position
                    </Button>
                    {nodeDetails._id !== treeData?._id && (
                      <Button
                        onClick={() => {
                          setIsDetailsOpen(false);
                          handleDeleteClick(nodeDetails);
                        }}
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        sx={{
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Delete Position
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => setIsDetailsOpen(false)}
                color="primary"
                variant="contained"
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default OrganizationChart;
