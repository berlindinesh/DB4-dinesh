import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from 'react-redux'; // Add Redux hook
import { selectUserRole, selectUser } from '../../../redux/authSlice'; // Import selectors
import api from "../../../api/axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { styled } from "@mui/material/styles";
import {
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Alert,
  CircularProgress,
  Snackbar,
  InputAdornment,
  Divider,
  Tooltip,
  Chip,
  Avatar,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit,
  Delete,
  Add,
  Search,
  Close,
  QuestionAnswer,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import { ToggleButtonGroup, ToggleButton } from "@mui/lab";


const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

export default function FaqPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ question: "", answer: "" });
  const [editingFaq, setEditingFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [viewType, setViewType] = useState("grid");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Redux selectors for RBAC
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectUser);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // RBAC helper functions
  const canCreateEditDelete = () => {
    const role = userRole || localStorage.getItem('userRole');
    return ['admin', 'hr'].includes(role);
  };

  const canViewOnly = () => {
    const role = userRole || localStorage.getItem('userRole');
    return ['manager', 'employee'].includes(role);
  };

  const getUserRole = () => {
    return userRole || localStorage.getItem('userRole') || 'employee';
  };

  // Update the fetchFaqs function
  const fetchFaqs = useCallback(async () => {
    if (!categoryId) return;

    setLoading(true);
    try {
      const { data } = await api.get(
        `/faqs/category/${categoryId}`
      );
      setFaqs(data);
      setFilteredFaqs(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching FAQs:", err.response?.data || err.message);
      setError("Failed to fetch FAQs.");
      showSnackbar("Failed to fetch FAQs", "error");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  // Update the fetchCategoryTitle function
  const fetchCategoryTitle = async () => {
    if (!categoryId) return;

    try {
      const response = await api.get(
        `/faqCategories/${categoryId}`
      );
      if (response.data) {
        setCategoryTitle(response.data.title);
      }
    } catch (err) {
      setCategoryTitle("Category Not Found");
      showSnackbar("Category not found", "error");
    }
  };

  useEffect(() => {
    fetchCategoryTitle();
    fetchFaqs();
  }, [fetchFaqs]);

  useEffect(() => {
    // Check if user has access to FAQs
    const role = getUserRole();
    if (!['admin', 'hr', 'manager', 'employee'].includes(role)) {
      setSnackbar({
        open: true,
        message: "You don't have permission to access FAQs",
        severity: "error",
      });
    }
  }, [userRole]);

  const toSentenceCase = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = faqs.filter((faq) =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    );
    setFilteredFaqs(filtered);
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: toSentenceCase(value) });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingFaq({ ...editingFaq, [name]: toSentenceCase(value) });
  };

  const handleCreateClick = () => {
    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to create FAQs", "error");
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleEditClick = (faq) => {
    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to edit FAQs", "error");
      return;
    }
    setEditingFaq(faq);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (faq) => {
    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to delete FAQs", "error");
      return;
    }
    setFaqToDelete(faq);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setFaqToDelete(null);
  };

  // Update the handleAddSubmit function
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to create FAQs", "error");
      return;
    }

    if (!categoryId) {
      setError("Category ID is missing.");
      showSnackbar("Category ID is missing", "error");
      return;
    }
    if (!formData.question || !formData.answer) {
      setError("Both question and answer are required.");
      showSnackbar("Both question and answer are required", "error");
      return;
    }

    try {
      setLoading(true);
      console.log("Adding FAQ:", { ...formData, categoryId });
      const { data: newFaq } = await api.post(
        `/faqs/category/${categoryId}`,
        formData
      );
      setFaqs([...faqs, newFaq]);
      setFilteredFaqs([...faqs, newFaq]);
      setIsAddModalOpen(false);
      setFormData({ question: "", answer: "" });
      setError(null);
      showSnackbar("FAQ added successfully");

      // Update the category title with new count
      fetchCategoryTitle();
    } catch (err) {
      console.error("Error adding FAQ:", err.response?.data || err.message);
      setError("Failed to add FAQ.");
      showSnackbar("Failed to add FAQ", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update the handleEditSubmit function
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to edit FAQs", "error");
      return;
    }

    if (!editingFaq) return;

    try {
      setLoading(true);
      console.log("Editing FAQ:", editingFaq);
      const { data: updatedFaq } = await api.put(
        `/faqs/${editingFaq._id}`,
        editingFaq
      );
      const updatedFaqs = faqs.map((faq) =>
        faq._id === editingFaq._id ? updatedFaq : faq
      );
      setFaqs(updatedFaqs);
      setFilteredFaqs(updatedFaqs);
      setIsEditModalOpen(false);
      setEditingFaq(null);
      setError(null);
      showSnackbar("FAQ updated successfully");
    } catch (err) {
      console.error("Error editing FAQ:", err.response?.data || err.message);
      setError("Failed to edit FAQ.");
      showSnackbar("Failed to edit FAQ", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update the handleConfirmDelete function
  const handleConfirmDelete = async () => {
    if (!faqToDelete) return;

    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to delete FAQs", "error");
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/faqs/${faqToDelete._id}`);
      const updatedFaqs = faqs.filter((faq) => faq._id !== faqToDelete._id);
      setFaqs(updatedFaqs);
      setFilteredFaqs(updatedFaqs);
      setError(null);
      showSnackbar("FAQ deleted successfully");

      // Update the category title with new count
      fetchCategoryTitle();
    } catch (err) {
      console.error("Error deleting FAQ:", err.response?.data || err.message);
      setError("Failed to delete FAQ.");
      showSnackbar("Failed to delete FAQ", "error");
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewType(newView);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const handleFaqClick = (faq) => {
    if (canViewOnly()) {
      setExpandedFaq(expandedFaq === faq._id ? null : faq._id);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: isMobile ? 1 : 3 }}>
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

      <Paper
        elevation={3}
        sx={{
          p: isMobile ? 2 : 3,
          borderRadius: 2,
          backgroundColor: "#ffffff",
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            backgroundColor: "#f5f5f5",
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
              {categoryTitle || "Loading..."} - FAQs
              {canViewOnly() && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: theme.palette.text.secondary,
                    fontWeight: 400,
                    mt: 0.5,
                  }}
                >
                  View Only Mode - Contact HR/Admin for FAQ management
                </Typography>
              )}
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
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  size="small"
                  sx={{
                    width: { xs: "100%", sm: "300px" },
                    marginRight: { xs: 0, sm: "auto" },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      "&:hover fieldset": {
                        borderColor: "#1976d2",
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "action.active", mr: 1 }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 1, sm: 2 },
                    width: { xs: "100%", sm: "auto" },
                    alignItems: "center",
                  }}
                >
                  {/* View Toggle */}
                  <ToggleButtonGroup
                    value={viewType}
                    exclusive
                    onChange={handleViewChange}
                    size="small"
                    sx={{
                      "& .MuiToggleButton-root": {
                        border: "1px solid #e0e0e0",
                        "&.Mui-selected": {
                          backgroundColor: canCreateEditDelete() 
                            ? theme.palette.primary.main 
                            : theme.palette.success.main,
                          color: "white",
                          "&:hover": {
                            backgroundColor: canCreateEditDelete() 
                              ? theme.palette.primary.dark 
                              : theme.palette.success.dark,
                          },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="grid">
                      <ViewModuleIcon />
                    </ToggleButton>
                    <ToggleButton value="list">
                      <ViewListIcon />
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {canCreateEditDelete() ? (
                    <Button
                      onClick={handleCreateClick}
                      startIcon={<Add />}
                      sx={{
                        height: { xs: "auto", sm: 40 },
                        padding: { xs: "8px 16px", sm: "6px 16px" },
                        width: { xs: "100%", sm: "auto" },
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                        color: "white",
                        "&:hover": {
                          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                        },
                        textTransform: "none",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(25, 118, 210, 0.25)",
                        fontWeight: 500,
                      }}
                      variant="contained"
                    >
                      Add FAQ
                    </Button>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: theme.palette.text.secondary,
                        fontSize: "0.875rem",
                        px: 2,
                        py: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: "8px",
                        backgroundColor: "#f8fafc",
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                      <Typography variant="body2">
                        View Only Access
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                  onClick={() => navigate("/Dashboards/faq-category")}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    textTransform: "none",
                    color: canCreateEditDelete() ? "primary.main" : "success.main",
                    "&:hover": {
                      backgroundColor: canCreateEditDelete() 
                        ? "primary.50" 
                        : "success.50",
                    },
                  }}
                >
                  Back to Categories
                </Button>

                <Divider orientation="vertical" flexItem />

                <Typography variant="body2" color="text.secondary">
                  {filteredFaqs.length} FAQ{filteredFaqs.length !== 1 ? "s" : ""} found
                </Typography>
              </Box>
            </StyledPaper>
          </Box>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}

        {/* FAQ Display */}
        {!loading && (
          <>
            {viewType === "grid" ? (
              // Grid View
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(auto-fill, minmax(350px, 1fr))",
                  },
                  gap: 3,
                  mt: 2,
                }}
              >
                {filteredFaqs.map((faq) => (
                  <motion.div
                    key={faq._id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                        overflow: "hidden",
                        border: "1px solid rgba(25, 118, 210, 0.08)",
                        cursor: canViewOnly() ? "pointer" : "default",
                        "&:hover": {
                          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                          borderColor: canCreateEditDelete() 
                            ? "rgba(25, 118, 210, 0.2)"
                            : "rgba(76, 175, 80, 0.2)",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background: canCreateEditDelete() 
                            ? "linear-gradient(90deg, #1976d2, #42a5f5)"
                            : "linear-gradient(90deg, #4caf50, #81c784)",
                        },
                      }}
                      onClick={() => handleFaqClick(faq)}
                    >
                      <CardContent sx={{ p: 3, height: "100%" }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar
                              sx={{
                                bgcolor: canCreateEditDelete() 
                                  ? "primary.main" 
                                  : "success.main",
                                width: 32,
                                height: 32,
                              }}
                            >
                              <QuestionAnswer fontSize="small" />
                            </Avatar>
                            
                            {canViewOnly() && (
                              <Chip
                                icon={<LockIcon />}
                                label="View Only"
                                size="small"
                                sx={{
                                  bgcolor: "grey.100",
                                  color: "grey.600",
                                  fontSize: "0.75rem",
                                }}
                              />
                            )}
                          </Box>

                          {canCreateEditDelete() && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Tooltip title="Edit FAQ">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(faq);
                                  }}
                                  sx={{
                                    color: "primary.main",
                                    "&:hover": { bgcolor: "primary.50" },
                                  }}
                                  size="small"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete FAQ">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(faq);
                                  }}
                                  sx={{
                                    color: "error.main",
                                    "&:hover": { bgcolor: "error.50" },
                                  }}
                                  size="small"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                            mb: 2,
                            fontSize: "1.1rem",
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {faq.question}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            lineHeight: 1.5,
                            display: "-webkit-box",
                            WebkitLineClamp: canViewOnly() && expandedFaq === faq._id ? "none" : 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {faq.answer}
                        </Typography>

                        {canViewOnly() && (
                          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFaqClick(faq);
                              }}
                              sx={{
                                color: "success.main",
                                "&:hover": { bgcolor: "success.50" },
                              }}
                            >
                              {expandedFaq === faq._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            ) : (
              // List View
              <Stack spacing={2} sx={{ mt: 2 }}>
                {filteredFaqs.map((faq) => (
                  <Card
                    key={faq._id}
                    sx={{
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      cursor: canViewOnly() ? "pointer" : "default",
                      "&:hover": {
                        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                        borderColor: canCreateEditDelete() 
                          ? "rgba(25, 118, 210, 0.2)"
                          : "rgba(76, 175, 80, 0.2)",
                      },
                    }}
                    onClick={() => handleFaqClick(faq)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                          <Avatar
                            sx={{
                              bgcolor: canCreateEditDelete() 
                                ? "primary.main" 
                                : "success.main",
                              width: 32,
                              height: 32,
                            }}
                          >
                            <QuestionAnswer fontSize="small" />
                          </Avatar>
                          
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              fontSize: "1.1rem",
                              flex: 1,
                            }}
                          >
                            {faq.question}
                          </Typography>

                          {canViewOnly() && (
                            <Chip
                              icon={<LockIcon />}
                              label="View Only"
                              size="small"
                              sx={{
                                bgcolor: "grey.100",
                                color: "grey.600",
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
                        </Box>

                        {canCreateEditDelete() && (
                          <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                            <Tooltip title="Edit FAQ">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(faq);
                                }}
                                sx={{
                                  color: "primary.main",
                                  "&:hover": { bgcolor: "primary.50" },
                                }}
                                size="small"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete FAQ">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(faq);
                                }}
                                sx={{
                                  color: "error.main",
                                  "&:hover": { bgcolor: "error.50" },
                                }}
                                size="small"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          lineHeight: 1.6,
                          pl: 6,
                          display: canViewOnly() && expandedFaq !== faq._id ? "-webkit-box" : "block",
                          WebkitLineClamp: canViewOnly() && expandedFaq !== faq._id ? 2 : "none",
                          WebkitBoxOrient: "vertical",
                          overflow: canViewOnly() && expandedFaq !== faq._id ? "hidden" : "visible",
                        }}
                      >
                        {faq.answer}
                      </Typography>

                      {canViewOnly() && (
                        <Box sx={{ mt: 2, pl: 6 }}>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFaqClick(faq);
                            }}
                            size="small"
                            sx={{
                              color: "success.main",
                              textTransform: "none",
                              "&:hover": { bgcolor: "success.50" },
                            }}
                            endIcon={expandedFaq === faq._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          >
                            {expandedFaq === faq._id ? "Show Less" : "Show More"}
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            {/* Empty State */}
            {filteredFaqs.length === 0 && !loading && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 8,
                  textAlign: "center",
                }}
              >
                <QuestionAnswer
                  sx={{
                    fontSize: 64,
                    color: "text.secondary",
                    mb: 2,
                  }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {searchQuery 
                    ? "No FAQs found matching your search" 
                    : "No FAQs available in this category"
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : canCreateEditDelete() 
                      ? "Create your first FAQ to get started"
                      : "Contact HR or Admin to add FAQs to this category"
                  }
                </Typography>
                
                {!searchQuery && canCreateEditDelete() && (
                  <Button
                    variant="contained"
                    onClick={handleCreateClick}
                    startIcon={<Add />}
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                      color: "white",
                      "&:hover": {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                      },
                    }}
                  >
                    Create First FAQ
                  </Button>
                )}
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Add FAQ Modal */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : "600px",
            borderRadius: isMobile ? "0" : "20px",
            margin: isMobile ? "0" : "32px",
            maxWidth: "100%",
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            Add New FAQ
            
            {canViewOnly() && (
              <LockIcon sx={{ ml: 1, fontSize: "1.2rem" }} />
            )}
          </Box>
          <IconButton
            onClick={() => setIsAddModalOpen(false)}
            sx={{
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleAddSubmit}>
          <DialogContent sx={{ p: 4, backgroundColor: "#fafafa" }}>
            <Stack spacing={3}>
              <TextField
                autoFocus
                label="Question"
                name="question"
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                value={formData.question}
                onChange={handleAddChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#e0e0e0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#1976d2",
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#666",
                    fontWeight: 500,
                  },
                }}
              />

              <TextField
                label="Answer"
                name="answer"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={formData.answer}
                onChange={handleAddChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#e0e0e0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#1976d2",
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#666",
                    fontWeight: 500,
                  },
                }}
              />
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              p: 3,
              gap: 2,
              backgroundColor: "#fafafa",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Button
              onClick={() => setIsAddModalOpen(false)}
              variant="outlined"
              sx={{
                px: 3,
                py: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
                borderColor: "#ddd",
                color: "#666",
                "&:hover": {
                  borderColor: "#bbb",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                px: 4,
                py: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(45deg, #1976d2, #42a5f5)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1565c0, #1976d2)",
                },
                "&:disabled": {
                  background: "#ddd",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Add FAQ"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit FAQ Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : "600px",
            borderRadius: isMobile ? "0" : "20px",
            margin: isMobile ? "0" : "32px",
            maxWidth: "100%",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #f57c00, #ffb74d)",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: 600,
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Edit FAQ
          <IconButton
            onClick={() => setIsEditModalOpen(false)}
            sx={{
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleEditSubmit}>
          <DialogContent sx={{ p: 4, backgroundColor: "#fafafa" }}>
            <Stack spacing={3}>
              <TextField
                autoFocus
                label="Question"
                name="question"
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                value={editingFaq?.question || ""}
                onChange={handleEditChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#e0e0e0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#f57c00",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#f57c00",
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#666",
                    fontWeight: 500,
                  },
                }}
              />

              <TextField
                label="Answer"
                name="answer"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={editingFaq?.answer || ""}
                onChange={handleEditChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#e0e0e0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#f57c00",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#f57c00",
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#666",
                    fontWeight: 500,
                  },
                }}
              />
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              p: 3,
              gap: 2,
              backgroundColor: "#fafafa",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Button
              onClick={() => setIsEditModalOpen(false)}
              variant="outlined"
              sx={{
                px: 3,
                py: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
                borderColor: "#ddd",
                color: "#666",
                "&:hover": {
                  borderColor: "#bbb",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                px: 4,
                py: 1,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(45deg, #f57c00, #ffb74d)",
                "&:hover": {
                  background: "linear-gradient(45deg, #e65100, #f57c00)",
                },
                "&:disabled": {
                  background: "#ddd",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Update FAQ"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            padding: "8px",
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#d32f2f",
            pb: 1,
          }}
        >
          Delete FAQ
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this FAQ?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            sx={{
              px: 3,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 500,
              borderColor: "#ddd",
              color: "#666",
              "&:hover": {
                borderColor: "#bbb",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={loading}
            sx={{
              px: 3,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              background: "linear-gradient(45deg, #d32f2f, #f44336)",
              "&:hover": {
                background: "linear-gradient(45deg, #d32f2f, #f44336)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Delete FAQ"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
