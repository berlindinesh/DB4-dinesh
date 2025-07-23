import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux'; // Add Redux hook
import { selectUserRole, selectUser } from '../../../redux/authSlice'; // Import selectors
import api from "../../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Grid,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogActions,
  CircularProgress,
  Snackbar,
  InputAdornment,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Add,
  Search,
  Close,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  QuestionAnswer,
  ArrowForward,
  Lock as LockIcon,
} from "@mui/icons-material";



const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

export default function FaqCategory() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [showActions, setShowActions] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
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

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Check if user has access to FAQ categories
    const role = getUserRole();
    if (!['admin', 'hr', 'manager', 'employee'].includes(role)) {
      setSnackbar({
        open: true,
        message: "You don't have permission to access FAQ categories",
        severity: "error",
      });
    }
  }, [userRole]);

  // Update the fetchCategories function
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/faqCategories');
      setCategories(data);
    } catch (err) {
      console.error(
        "Error fetching FAQ categories:",
        err.response?.data || err.message
      );
      showSnackbar("Error fetching FAQ categories", "error");
    } finally {
      setLoading(false);
    }
  };

  const toSentenceCase = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = toSentenceCase(value);
    setFormData({ ...formData, [name]: formattedValue });
  };

  // Update the handleSubmit function with RBAC check
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to create/edit FAQ categories", "error");
      return;
    }

    if (!formData.title.trim()) {
      setErrorMessage("Category title is required.");
      return;
    }

    try {
      setLoading(true);
      
      if (editingCategoryId) {
        await api.put(
          `/faqCategories/${editingCategoryId}`,
          formData
        );
        showSnackbar("Category updated successfully");
        setEditingCategoryId(null);
      } else {
        await api.post('/faqCategories', formData);
        showSnackbar("Category created successfully");
      }
      fetchCategories();
      setIsAddModalOpen(false);
      setFormData({ title: "", description: "" });
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Failed to save category.");
      showSnackbar("Failed to save category", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (category) => {
    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to delete FAQ categories", "error");
      return;
    }
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
    setShowActions(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  // Update the handleConfirmDelete function with RBAC check
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to delete FAQ categories", "error");
      return;
    }

    try {
      setLoading(true);
      await api.delete(
        `/faqCategories/${categoryToDelete._id}`
      );
      fetchCategories();
      showSnackbar("Category deleted successfully");
    } catch (err) {
      console.error("Error deleting category:", err);
      showSnackbar("Error deleting category", "error");
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };

  const openEditModal = (category) => {
    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to edit FAQ categories", "error");
      return;
    }
    setFormData({ title: category.title, description: category.description });
    setEditingCategoryId(category._id);
    setIsAddModalOpen(true);
    setShowActions(null);
  };

  const handleCreateClick = () => {
    if (!canCreateEditDelete()) {
      showSnackbar("You don't have permission to create FAQ categories", "error");
      return;
    }
    setEditingCategoryId(null);
    setIsAddModalOpen(true);
    setFormData({ title: "", description: "" });
    setErrorMessage(null);
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
              FAQ Categories
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
                  View Only Mode - Contact HR/Admin for category management
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
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                    gap: { xs: 1, sm: 1 },
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
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
                      Create Category
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
            </StyledPaper>
          </Box>
        </Box>

        <Grid container spacing={isMobile ? 2 : 3}>
          {categories
            .filter((category) =>
              category?.title?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category._id}>
                <motion.div
                  whileHover={{ scale: canCreateEditDelete() ? 1.02 : 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    sx={{
                      position: "relative",
                      height: "100%",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      overflow: "hidden",
                      border: "1px solid rgba(25, 118, 210, 0.08)",
                      "&:hover": {
                        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                        borderColor: "rgba(25, 118, 210, 0.2)",
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
                            width: 40,
                            height: 40,
                          }}
                        >
                          <QuestionAnswer />
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
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(
                              showActions === category._id ? null : category._id
                            );
                          }}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        mb: 1,
                        fontSize: "1.1rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {category.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        mb: 3,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {category.description || "No description available"}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: "auto",
                      }}
                    >
                      <Button
                        onClick={() => navigate(`/Dashboards/faq/${category._id}`)}
                        endIcon={<ArrowForward />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          color: canCreateEditDelete() ? "primary.main" : "success.main",
                          "&:hover": {
                            bgcolor: canCreateEditDelete() 
                              ? "primary.50" 
                              : "success.50",
                          },
                        }}
                      >
                        {canCreateEditDelete() ? "Manage FAQs" : "View FAQs"}
                      </Button>

                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 500,
                        }}
                      >
                        {category.faqCount || 0} FAQs
                      </Typography>
                    </Box>

                    {/* Action Menu for Admin/HR */}
                    <AnimatePresence>
                      {showActions === category._id && canCreateEditDelete() && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            position: "absolute",
                            top: "60px",
                            right: "16px",
                            zIndex: 10,
                          }}
                        >
                          <Paper
                            elevation={8}
                            sx={{
                              borderRadius: "8px",
                              overflow: "hidden",
                              minWidth: "120px",
                              border: "1px solid rgba(0,0,0,0.1)",
                            }}
                          >
                            <Stack>
                              <Button
                                onClick={() => openEditModal(category)}
                                startIcon={<EditIcon />}
                                sx={{
                                  justifyContent: "flex-start",
                                  px: 2,
                                  py: 1,
                                  color: "primary.main",
                                  "&:hover": { bgcolor: "primary.50" },
                                  textTransform: "none",
                                }}
                              >
                                Edit
                              </Button>
                              <Divider />
                              <Button
                                onClick={() => handleDeleteClick(category)}
                                startIcon={<DeleteIcon />}
                                sx={{
                                  justifyContent: "flex-start",
                                  px: 2,
                                  py: 1,
                                  color: "error.main",
                                  "&:hover": { bgcolor: "error.50" },
                                  textTransform: "none",
                                }}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </Paper>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
      </Grid>

      {/* Empty State */}
      {!loading && categories.length === 0 && (
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
            {searchTerm ? "No categories found matching your search" : "No FAQ categories available"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm 
              ? "Try adjusting your search terms" 
              : canCreateEditDelete() 
                ? "Create your first FAQ category to get started"
                : "Contact HR or Admin to add FAQ categories"
            }
          </Typography>
          
          {!searchTerm && canCreateEditDelete() && (
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
              Create First Category
            </Button>
          )}
        </Box>
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
    </Paper>

    {/* Create/Edit Modal */}
    <Dialog
      open={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          width: isMobile ? "100%" : "500px",
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
          {editingCategoryId ? "Edit Category" : "Create New Category"}
          
          {canViewOnly() && (
            <LockIcon sx={{ ml: 1, fontSize: "1.2rem" }} />
          )}
        </Box>
        
        <IconButton
          onClick={() => setIsAddModalOpen(false)}
          sx={{ color: "white" }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
        {/* Role-based access message */}
        {canViewOnly() && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have read-only access to FAQ categories. Contact HR or Admin for modifications.
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Category Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={!canCreateEditDelete()}
            required
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: !canCreateEditDelete() ? "#f5f5f5" : "white",
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
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={!canCreateEditDelete()}
            multiline
            rows={4}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: !canCreateEditDelete() ? "#f5f5f5" : "white",
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
          onClick={() => setIsAddModalOpen(false)}
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

        {canCreateEditDelete() && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.title.trim()}
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
              "&:disabled": {
                background: "#cccccc",
                color: "#666666",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingCategoryId ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>

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
          Are you sure you want to delete this FAQ category? This action will also delete all FAQs within this category and cannot be undone.
        </Alert>

        {categoryToDelete && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "#fff3e0", borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600} color="#e65100">
              Category to be deleted:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                p: 1,
                bgcolor: "#fff",
                borderRadius: 1,
                border: "1px solid #ffcc02",
              }}
            >
              <strong>Title:</strong> {categoryToDelete.title}
              <br />
              <strong>Description:</strong>{" "}
                {categoryToDelete.description || "No description"}
                <br />
                <strong>FAQ Count:</strong> {categoryToDelete.faqCount || 0} FAQs
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
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Delete Category"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Click outside handler for action menu */}
      {showActions && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
          }}
          onClick={() => setShowActions(null)}
        />
      )}
    </Container>
  );
}



// import React, { useState, useEffect } from "react";
// import api from "../../../api/axiosInstance";
// import { useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import { styled } from "@mui/material/styles";
// import {
//   Container,
//   Paper,
//   Typography,
//   TextField,
//   IconButton,
//   Box,
//   Button,
//   Card,
//   CardContent,
//   Grid,
//   Stack,
//   Alert,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   useMediaQuery,
//   useTheme,
//   DialogActions,
//   CircularProgress,
//   Snackbar,
//   InputAdornment,
//   Divider,
//   Avatar,
//   Chip,
// } from "@mui/material";
// import {
//   MoreVert as MoreVertIcon,
//   Add,
//   Search,
//   Close,
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   Visibility as VisibilityIcon,
//   QuestionAnswer,
//   ArrowForward,
// } from "@mui/icons-material";

// const apiBaseURL =
//   process.env.REACT_APP_API_BASE_URL || "http://localhost:5002";

// const StyledPaper = styled(Paper)(({ theme }) => ({
//   padding: theme.spacing(3),
//   marginBottom: theme.spacing(3),
//   borderRadius: theme.spacing(1),
//   boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
//   [theme.breakpoints.down("sm")]: {
//     padding: theme.spacing(2),
//   },
// }));

// export default function FaqCategory() {
//   const [categories, setCategories] = useState([]);
//   const navigate = useNavigate();
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [errorMessage, setErrorMessage] = useState(null);
//   const [showActions, setShowActions] = useState(null);
//   const [editingCategoryId, setEditingCategoryId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [categoryToDelete, setCategoryToDelete] = useState(null);
//   const [snackbar, setSnackbar] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });

//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
//   const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

//   useEffect(() => {
//     fetchCategories();
//   }, []);


//   // const fetchCategories = async () => {
//   //   try {
//   //     setLoading(true);
//   //     const { data } = await axios.get(`${apiBaseURL}/api/faqCategories`);
//   //     setCategories(data);
//   //   } catch (err) {
//   //     console.error(
//   //       "Error fetching FAQ categories:",
//   //       err.response?.data || err.message
//   //     );
//   //     showSnackbar("Error fetching FAQ categories", "error");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // Update the fetchCategories function
// const fetchCategories = async () => {
//   try {
//     setLoading(true);
//     const { data } = await api.get(`${apiBaseURL}/api/faqCategories`
//   );
//     setCategories(data);
//   } catch (err) {
//     console.error(
//       "Error fetching FAQ categories:",
//       err.response?.data || err.message
//     );
//     showSnackbar("Error fetching FAQ categories", "error");
//   } finally {
//     setLoading(false);
//   }
// };


//   const toSentenceCase = (str) => {
//     return str
//       .toLowerCase()
//       .split(" ")
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(" ");
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     const formattedValue = toSentenceCase(value);
//     setFormData({ ...formData, [name]: formattedValue });
//   };

//   // const handleSubmit = async (e) => {
//   //   e.preventDefault();
//   //   if (!formData.title.trim()) {
//   //     setErrorMessage("Category title is required.");
//   //     return;
//   //   }

//   //   try {
//   //     setLoading(true);
//   //     if (editingCategoryId) {
//   //       await axios.put(
//   //         `${apiBaseURL}/api/faqCategories/${editingCategoryId}`,
//   //         formData
//   //       );
//   //       showSnackbar("Category updated successfully");
//   //       setEditingCategoryId(null);
//   //     } else {
//   //       await axios.post(`${apiBaseURL}/api/faqCategories`, formData);
//   //       showSnackbar("Category created successfully");
//   //     }
//   //     fetchCategories();
//   //     setIsAddModalOpen(false);
//   //     setFormData({ title: "", description: "" });
//   //     setErrorMessage(null);
//   //   } catch (err) {
//   //     setErrorMessage(err.response?.data?.error || "Failed to save category.");
//   //     showSnackbar("Failed to save category", "error");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // Update the handleSubmit function
// const handleSubmit = async (e) => {
//   e.preventDefault();
//   if (!formData.title.trim()) {
//     setErrorMessage("Category title is required.");
//     return;
//   }

//   try {
//     setLoading(true);
    
//     if (editingCategoryId) {
//       await api.put(
//         `${apiBaseURL}/api/faqCategories/${editingCategoryId}`,
//         formData
//       );
//       showSnackbar("Category updated successfully");
//       setEditingCategoryId(null);
//     } else {
//       await api.post(`${apiBaseURL}/api/faqCategories`, formData
//     );
//       showSnackbar("Category created successfully");
//     }
//     fetchCategories();
//     setIsAddModalOpen(false);
//     setFormData({ title: "", description: "" });
//     setErrorMessage(null);
//   } catch (err) {
//     setErrorMessage(err.response?.data?.error || "Failed to save category.");
//     showSnackbar("Failed to save category", "error");
//   } finally {
//     setLoading(false);
//   }
// };

//   const handleDeleteClick = (category) => {
//     setCategoryToDelete(category);
//     setDeleteDialogOpen(true);
//     setShowActions(null);
//   };

//   const handleCloseDeleteDialog = () => {
//     setDeleteDialogOpen(false);
//     setCategoryToDelete(null);
//   };

//   // const handleConfirmDelete = async () => {
//   //   if (!categoryToDelete) return;

//   //   try {
//   //     setLoading(true);
//   //     await axios.delete(
//   //       `${apiBaseURL}/api/faqCategories/${categoryToDelete._id}`
//   //     );
//   //     fetchCategories();
//   //     showSnackbar("Category deleted successfully");
//   //   } catch (err) {
//   //     console.error("Error deleting category:", err);
//   //     showSnackbar("Error deleting category", "error");
//   //   } finally {
//   //     setLoading(false);
//   //     handleCloseDeleteDialog();
//   //   }
//   // };

//   // Update the handleConfirmDelete function
// const handleConfirmDelete = async () => {
//   if (!categoryToDelete) return;

//   try {
//     setLoading(true);
//     await api.delete(
//       `${apiBaseURL}/api/faqCategories/${categoryToDelete._id}`
//     );
//     fetchCategories();
//     showSnackbar("Category deleted successfully");
//   } catch (err) {
//     console.error("Error deleting category:", err);
//     showSnackbar("Error deleting category", "error");
//   } finally {
//     setLoading(false);
//     handleCloseDeleteDialog();
//   }
// };

//   const openEditModal = (category) => {
//     setFormData({ title: category.title, description: category.description });
//     setEditingCategoryId(category._id);
//     setIsAddModalOpen(true);
//     setShowActions(null);
//   };

//   const showSnackbar = (message, severity = "success") => {
//     setSnackbar({
//       open: true,
//       message,
//       severity,
//     });
//   };

//   const handleCloseSnackbar = () => {
//     setSnackbar({
//       ...snackbar,
//       open: false,
//     });
//   };

//   return (
//     <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: isMobile ? 1 : 3 }}>
//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={6000}
//         onClose={handleCloseSnackbar}
//         anchorOrigin={{ vertical: "top", horizontal: "right" }}
//       >
//         <Alert
//           onClose={handleCloseSnackbar}
//           severity={snackbar.severity}
//           sx={{ width: "100%" }}
//         >
//           {snackbar.message}
//         </Alert>
//       </Snackbar>

//       <Paper
//         elevation={3}
//         sx={{
//           p: isMobile ? 2 : 3,
//           borderRadius: 2,
//           backgroundColor: "#ffffff",
//         }}
//       >
//         <Box
//           sx={{
//             p: { xs: 2, sm: 3, md: 4 },
//             backgroundColor: "#f5f5f5",
//             // minHeight: "100vh",
//           }}
//         >
//           <Box>
//             <Typography
//               variant="h4"
//               sx={{
//                 mb: { xs: 2, sm: 3, md: 4 },
//                 color: theme.palette.primary.main,
//                 fontWeight: 600,
//                 letterSpacing: 0.5,
//                 fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
//               }}
//             >
//               FAQ Categories
//             </Typography>

//             <StyledPaper sx={{ p: { xs: 2, sm: 3 } }}>
//               <Box
//                 display="flex"
//                 flexDirection={{ xs: "column", sm: "row" }}
//                 alignItems={{ xs: "flex-start", sm: "center" }}
//                 gap={2}
//                 sx={{
//                   width: "100%",
//                   justifyContent: "space-between",
//                 }}
//               >
//                 <TextField
//                   placeholder="Search categories..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   size="small"
//                   sx={{
//                     width: { xs: "100%", sm: "300px" },
//                     marginRight: { xs: 0, sm: "auto" },
//                     "& .MuiOutlinedInput-root": {
//                       backgroundColor: "#f8fafc",
//                       borderRadius: "8px",
//                       "&:hover fieldset": {
//                         borderColor: "#1976d2",
//                       },
//                     },
//                   }}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Search sx={{ color: "action.active", mr: 1 }} />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />

//                 <Box
//                   sx={{
//                     display: "flex",
//                     flexDirection: { xs: "column", sm: "row" },
//                     gap: { xs: 1, sm: 1 },
//                     width: { xs: "100%", sm: "auto" },
//                   }}
//                 >
//                   <Button
//                     onClick={() => {
//                       setEditingCategoryId(null);
//                       setIsAddModalOpen(true);
//                       setFormData({ title: "", description: "" });
//                       setErrorMessage(null);
//                     }}
//                     startIcon={<Add />}
//                     sx={{
//                       height: { xs: "auto", sm: 40 },
//                       padding: { xs: "8px 16px", sm: "6px 16px" },
//                       width: { xs: "100%", sm: "auto" },
//                       background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
//                       color: "white",
//                       "&:hover": {
//                         background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
//                       },
//                       textTransform: "none",
//                       borderRadius: "8px",
//                       boxShadow: "0 2px 8px rgba(25, 118, 210, 0.25)",
//                       fontWeight: 500,
//                     }}
//                     variant="contained"
//                   >
//                     Create Category
//                   </Button>
//                 </Box>
//               </Box>
//             </StyledPaper>
//           </Box>
//         </Box>

//         <Grid container spacing={isMobile ? 2 : 3}>
//           {categories
//             .filter((category) =>
//               category?.title?.toLowerCase().includes(searchTerm.toLowerCase())
//             )
//             .map((category) => (
//               <Grid item xs={12} sm={6} md={4} key={category._id}>
//                 <motion.div
//                   whileHover={{ scale: 1.02 }}
//                   transition={{ duration: 0.2 }}
//                 >
//                   <Card
//                     sx={{
//                       position: "relative",
//                       height: "100%",
//                       borderRadius: "12px",
//                       boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
//                       transition: "transform 0.3s ease, box-shadow 0.3s ease",
//                       overflow: "hidden",
//                       border: "1px solid rgba(25, 118, 210, 0.08)",
//                       "&:hover": {
//                         boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
//                         borderColor: "rgba(25, 118, 210, 0.2)",
//                       },
//                       "&::before": {
//                         content: '""',
//                         position: "absolute",
//                         top: 0,
//                         left: 0,
//                         right: 0,
//                         height: "4px",
//                         background: "linear-gradient(90deg, #1976d2, #64b5f6)",
//                       },
//                     }}
//                   >
//                     <CardContent sx={{ p: 0 }}>
//                       <Box
//                         sx={{
//                           position: "absolute",
//                           top: 8,
//                           right: 8,
//                           zIndex: 2,
//                         }}
//                       >
//                         <IconButton
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setShowActions(
//                               showActions === category._id ? null : category._id
//                             );
//                           }}
//                           sx={{
//                             backgroundColor: "white",
//                             boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//                             "&:hover": {
//                               backgroundColor: "#f8fafc",
//                             },
//                           }}
//                         >
//                           <MoreVertIcon />
//                         </IconButton>

//                         <AnimatePresence>
//                           {showActions === category._id && (
//                             <motion.div
//                               initial={{ opacity: 0, y: -10 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               exit={{ opacity: 0, y: -10 }}
//                               style={{
//                                 position: "absolute",
//                                 right: 0,
//                                 top: "100%",
//                                 backgroundColor: "white",
//                                 borderRadius: "8px",
//                                 boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
//                                 zIndex: 10,
//                                 padding: "4px",
//                                 marginTop: "4px",
//                               }}
//                             >
//                               <Box sx={{ display: "flex", gap: 1 }}>
//                                 <IconButton
//                                   onClick={() => openEditModal(category)}
//                                   sx={{
//                                     backgroundColor: "#3b82f6",
//                                     color: "white",
//                                     "&:hover": {
//                                       backgroundColor: "#2563eb",
//                                       transform: "scale(1.05)",
//                                     },
//                                     transition: "all 0.2s ease",
//                                     boxShadow:
//                                       "0 2px 8px rgba(59, 130, 246, 0.3)",
//                                   }}
//                                 >
//                                   <EditIcon fontSize="small" />
//                                 </IconButton>
//                                 <IconButton
//                                   onClick={() => handleDeleteClick(category)}
//                                   sx={{
//                                     backgroundColor: "#ef4444",
//                                     color: "white",
//                                     "&:hover": {
//                                       backgroundColor: "#dc2626",
//                                       transform: "scale(1.05)",
//                                     },
//                                     transition: "all 0.2s ease",
//                                     boxShadow:
//                                       "0 2px 8px rgba(239, 68, 68, 0.3)",
//                                   }}
//                                 >
//                                   <DeleteIcon fontSize="small" />
//                                 </IconButton>
//                               </Box>
//                             </motion.div>
//                           )}
//                         </AnimatePresence>
//                       </Box>

//                       <Box sx={{ p: 3, pb: 2 }}>
//                         <Box
//                           sx={{
//                             display: "flex",
//                             alignItems: "center",
//                             mb: 2,
//                             gap: 1.5,
//                           }}
//                         >
//                           <Avatar
//                             sx={{
//                               bgcolor: "primary.main",
//                               width: 48,
//                               height: 48,
//                               boxShadow: "0 2px 10px rgba(25, 118, 210, 0.2)",
//                             }}
//                           >
//                             <QuestionAnswer />
//                           </Avatar>
//                           <Typography
//                             variant={isMobile ? "subtitle1" : "h6"}
//                             sx={{
//                               pr: 5, // Add padding to prevent text from going under the more icon
//                               wordBreak: "break-word",
//                               fontWeight: 600,
//                               color: "#334155",
//                               lineHeight: 1.4,
//                             }}
//                           >
//                             {category.title}
//                           </Typography>
//                         </Box>

//                         <Typography
//                           variant="body2"
//                           sx={{
//                             mb: 3,
//                             color: "#64748b",
//                             wordBreak: "break-word",
//                             lineHeight: 1.6,
//                             display: "-webkit-box",
//                             WebkitLineClamp: 3,
//                             WebkitBoxOrient: "vertical",
//                             overflow: "hidden",
//                             backgroundColor: "rgba(25, 118, 210, 0.04)",
//                             p: 2,
//                             borderRadius: "8px",
//                             borderLeft: "3px solid #1976d2",
//                           }}
//                         >
//                           {category.description || "No description available."}
//                         </Typography>
//                       </Box>

//                       <Divider sx={{ opacity: 0.6 }} />

//                       <Box
//                         sx={{
//                           p: 2,
//                           display: "flex",
//                           justifyContent: "space-between",
//                           alignItems: "center",
//                         }}
//                       >
//                         <Chip
//                           icon={<QuestionAnswer fontSize="small" />}
//                           label={`${category.faqCount || 0} FAQs`}
//                           size="small"
//                           sx={{
//                             backgroundColor: "rgba(25, 118, 210, 0.1)",
//                             color: "primary.main",
//                             fontWeight: 500,
//                             borderRadius: "6px",
//                           }}
//                         />

//                         <Button
//                           variant="contained"
//                           onClick={() =>
//                             navigate(`/Dashboards/faq/${category._id}`)
//                           }
//                           sx={{
//                             background:
//                               "linear-gradient(45deg, #1976d2, #64b5f6)",
//                             color: "white",
//                             "&:hover": {
//                               background:
//                                 "linear-gradient(45deg, #1565c0, #42a5f5)",
//                               transform: "translateY(-2px)",
//                             },
//                             width: isMobile ? "auto" : "auto",
//                             textTransform: "none",
//                             borderRadius: "8px",
//                             boxShadow: "0 2px 8px rgba(25, 118, 210, 0.25)",
//                             transition: "all 0.2s ease",
//                             fontWeight: 500,
//                           }}
//                           endIcon={<ArrowForward />}
//                         >
//                           View FAQs
//                         </Button>
//                       </Box>
//                     </CardContent>
//                   </Card>
//                 </motion.div>
//               </Grid>
//             ))}
//         </Grid>

//         {/* Add New Category Modal */}
//         <Dialog
//           open={isAddModalOpen}
//           maxWidth="md"
//           fullWidth
//           fullScreen={isMobile}
//           PaperProps={{
//             sx: {
//               width: isMobile ? "100%" : isTablet ? "600px" : "700px",
//               maxWidth: "90vw",
//               borderRadius: isMobile ? "0" : "20px",
//               overflow: "hidden",
//               margin: isMobile ? 0 : undefined,
//               height: isMobile ? "100%" : undefined,
//             },
//           }}
//         >
//           <DialogTitle
//             sx={{
//               background: "linear-gradient(45deg, #1976d2, #64b5f6)",
//               color: "white",
//               fontSize: isMobile ? "1.25rem" : "1.5rem",
//               fontWeight: 600,
//               padding: isMobile ? "16px 20px" : "24px 32px",
//               position: "relative",
//             }}
//           >
//             {editingCategoryId ? "Edit Category" : "Add New Category"}
//             <IconButton
//               onClick={() => setIsAddModalOpen(false)}
//               sx={{
//                 position: "absolute",
//                 right: 16,
//                 top: "50%",
//                 transform: "translateY(-50%)",
//                 color: "white",
//               }}
//             >
//               <Close />
//             </IconButton>
//           </DialogTitle>

//           <DialogContent sx={{ padding: isMobile ? "20px" : "32px" }}>
//             <form onSubmit={handleSubmit}>
//               <Stack spacing={3} sx={{ mt: 2 }}>
//                 {errorMessage && (
//                   <Alert severity="error" sx={{ borderRadius: "8px" }}>
//                     {errorMessage}
//                   </Alert>
//                 )}

//                 <TextField
//                   fullWidth
//                   label="Category Title"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleChange}
//                   required
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       borderRadius: "8px",
//                     },
//                   }}
//                 />

//                 <TextField
//                   fullWidth
//                   multiline
//                   rows={4}
//                   label="Description"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleChange}
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       borderRadius: "8px",
//                     },
//                   }}
//                 />

//                 <Stack
//                   direction={isMobile ? "column" : "row"}
//                   spacing={2}
//                   justifyContent={isMobile ? "stretch" : "flex-end"}
//                   sx={{ mt: 4 }}
//                 >
//                   <Button
//                     onClick={() => setIsAddModalOpen(false)}
//                     fullWidth={isMobile}
//                     sx={{
//                       border: "2px solid #1976d2",
//                       color: "#1976d2",
//                       "&:hover": {
//                         border: "2px solid #64b5f6",
//                         backgroundColor: "#e3f2fd",
//                       },
//                       borderRadius: "8px",
//                       px: 4,
//                       py: 1,
//                       fontWeight: 600,
//                       order: isMobile ? 1 : 0,
//                       mt: isMobile ? 1 : 0,
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="submit"
//                     disabled={loading}
//                     fullWidth={isMobile}
//                     sx={{
//                       background: "linear-gradient(45deg, #1976d2, #64b5f6)",
//                       color: "white",
//                       "&:hover": {
//                         background: "linear-gradient(45deg, #1565c0, #42a5f5)",
//                       },
//                       borderRadius: "8px",
//                       px: 4,
//                       py: 1,
//                       fontWeight: 600,
//                       order: isMobile ? 0 : 1,
//                     }}
//                   >
//                     {loading ? (
//                       <CircularProgress size={24} color="inherit" />
//                     ) : editingCategoryId ? (
//                       "Update"
//                     ) : (
//                       "Create"
//                     )}
//                   </Button>
//                 </Stack>
//               </Stack>
//             </form>
//           </DialogContent>
//         </Dialog>

//         {/* Delete Confirmation Dialog */}
//         <Dialog
//           open={deleteDialogOpen}
//           onClose={handleCloseDeleteDialog}
//           PaperProps={{
//             sx: {
//               width: { xs: "95%", sm: "500px" },
//               maxWidth: "500px",
//               borderRadius: "20px",
//               overflow: "hidden",
//               margin: { xs: "8px", sm: "32px" },
//             },
//           }}
//         >
//           <DialogTitle
//             sx={{
//               background: "linear-gradient(45deg, #f44336, #ff7961)",
//               fontSize: { xs: "1.25rem", sm: "1.5rem" },
//               fontWeight: 600,
//               padding: { xs: "16px 24px", sm: "24px 32px" },
//               color: "white",
//               display: "flex",
//               alignItems: "center",
//               gap: 1,
//             }}
//           >
//             <DeleteIcon color="white" />
//             Confirm Deletion
//           </DialogTitle>
//           <DialogContent
//             sx={{
//               padding: { xs: "24px", sm: "32px" },
//               backgroundColor: "#f8fafc",
//               paddingTop: { xs: "24px", sm: "32px" },
//             }}
//           >
//             <Alert severity="warning" sx={{ mb: 2 }}>
//               Are you sure you want to delete this FAQ category?
//             </Alert>
//             {categoryToDelete && (
//               <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
//                 <Typography variant="body1" fontWeight={600} color="#2c3e50">
//                   Category: {categoryToDelete.title}
//                 </Typography>
//                 <Typography
//                   variant="body2"
//                   color="text.secondary"
//                   sx={{ mt: 1 }}
//                 >
//                   Description: {categoryToDelete.description}
//                 </Typography>
//                 <Typography
//                   variant="body2"
//                   color="error"
//                   sx={{ mt: 2, fontWeight: 500 }}
//                 >
//                   Note: All FAQs in this category will also be deleted.
//                 </Typography>
//               </Box>
//             )}
//           </DialogContent>
//           <DialogActions
//             sx={{
//               padding: { xs: "16px 24px", sm: "24px 32px" },
//               backgroundColor: "#f8fafc",
//               borderTop: "1px solid #e0e0e0",
//               gap: 2,
//             }}
//           >
//             <Button
//               onClick={handleCloseDeleteDialog}
//               sx={{
//                 border: "2px solid #1976d2",
//                 color: "#1976d2",
//                 "&:hover": {
//                   border: "2px solid #64b5f6",
//                   backgroundColor: "#e3f2fd",
//                   color: "#1976d2",
//                 },
//                 textTransform: "none",
//                 borderRadius: "8px",
//                 px: 3,
//                 fontWeight: 600,
//               }}
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={handleConfirmDelete}
//               variant="contained"
//               color="error"
//               disabled={loading}
//               startIcon={
//                 loading ? <CircularProgress size={20} color="inherit" /> : null
//               }
//               sx={{
//                 background: "linear-gradient(45deg, #f44336, #ff7961)",
//                 fontSize: "0.95rem",
//                 textTransform: "none",
//                 padding: "8px 32px",
//                 borderRadius: "10px",
//                 boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
//                 color: "white",
//                 "&:hover": {
//                   background: "linear-gradient(45deg, #d32f2f, #f44336)",
//                 },
//               }}
//             >
//               {loading ? "Deleting..." : "Delete"}
//             </Button>
//           </DialogActions>
//         </Dialog>
//       </Paper>
//     </Container>
//   );
// }
