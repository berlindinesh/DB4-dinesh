import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Stack,
  FormHelperText,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogActions,
  Alert,
  CircularProgress,
  Snackbar,
  alpha,
} from "@mui/material";
import { Add, Edit, Delete, Search, Close } from "@mui/icons-material";

const validationSchema = Yup.object().shape({
  week: Yup.string().required("Week selection is required"),
  day: Yup.string().required("Day selection is required"),
});

export default function CompanyHolidays() {
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [initialValues, setInitialValues] = useState({ week: "", day: "" });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // Add delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchCompanyHolidays();
  }, []);

  const toSentenceCase = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const fetchCompanyHolidays = async () => {
    try {
      const { data } = await api.get("/companyHolidays");
      setCompanyHolidays(data);
    } catch (err) {
      console.error("Error fetching company holidays:", err);
      showSnackbar("Error fetching company holidays", "error");
    }
  };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      setLoading(true);
      const formattedValues = {
        week: toSentenceCase(values.week),
        day: toSentenceCase(values.day),
      };

      if (isEditing) {
        await api.put(`/companyHolidays/${editId}`, formattedValues);
        showSnackbar("Holiday updated successfully");
      } else {
        await api.post("/companyHolidays", formattedValues);
        showSnackbar("Holiday added successfully");
      }
      fetchCompanyHolidays();
      setIsAddModalOpen(false);
      resetForm();
      setIsEditing(false);
      setEditId(null);
    } catch (err) {
      console.error("Error creating/updating company holiday:", err);
      showSnackbar("Error saving holiday", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (holiday) => {
    setEditId(holiday._id);
    setIsEditing(true);
    setInitialValues({ week: holiday.week, day: holiday.day });
    setIsAddModalOpen(true);
  };

  // Replace direct delete with confirmation dialog
  const handleDeleteClick = (holiday) => {
    setHolidayToDelete(holiday);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setHolidayToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!holidayToDelete) return;

    try {
      setLoading(true);
      await api.delete(`/companyHolidays/${holidayToDelete._id}`);
      fetchCompanyHolidays();
      showSnackbar("Holiday deleted successfully");
    } catch (err) {
      console.error("Error deleting company holiday:", err);
      showSnackbar("Error deleting holiday", "error");
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
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
            // minHeight: "100vh",
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
              Company Holidays
            </Typography>

            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                backgroundColor: "#ffffff",
                mb: 3,
              }}
            >
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
                  placeholder="Search holidays..."
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
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ color: "action.active", mr: 1 }} />
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
                    onClick={() => {
                      setIsEditing(false);
                      setInitialValues({ week: "", day: "" });
                      setIsAddModalOpen(true);
                    }}
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
                    variant="contained"
                  >
                    Add Holiday
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Enhanced Table */}
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            overflow: "auto",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            mb: 4,
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#c1c1c1",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "#a8a8a8",
              },
            },
          }}
        >
          <Table
            sx={{ minWidth: isMobile ? 450 : 650 }}
            aria-label="company holidays table"
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "white",
                    py: 2.5,
                    backgroundColor: theme.palette.primary.main,
                    fontSize: "0.95rem",
                    "&:first-of-type": {
                      borderTopLeftRadius: 8,
                    },
                  }}
                >
                  Week
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "white",
                    py: 2.5,
                    backgroundColor: theme.palette.primary.main,
                    fontSize: "0.95rem",
                  }}
                >
                  Day
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: "white",
                    py: 2.5,
                    backgroundColor: theme.palette.primary.main,
                    fontSize: "0.95rem",
                    "&:last-child": {
                      borderTopRightRadius: 8,
                    },
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companyHolidays
                .filter(
                  (holiday) =>
                    holiday.week
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    holiday.day.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((holiday, index) => (
                  <TableRow
                    key={holiday._id}
                    sx={{
                      "&:hover": {
                        backgroundColor: `${theme.palette.primary.light}15`,
                      },
                      backgroundColor:
                        index % 2 === 0
                          ? "white"
                          : `${theme.palette.primary.light}08`,
                      transition: "background-color 0.2s ease",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <TableCell
                      sx={{
                        py: 2,
                        px: 3,
                        color: theme.palette.primary.dark,
                        fontWeight: 500,
                        fontSize: "0.9rem",
                        borderBottom: "none",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "#d013d1",
                          }}
                        />
                        {holiday.week}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2,
                        px: 3,
                        color: "#2563eb",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                        borderBottom: "none",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "#2563eb",
                          }}
                        />
                        {holiday.day}
                      </Box>
                    </TableCell>

                    <TableCell align="right">
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
                          onClick={() => handleEdit(holiday)}
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
                          onClick={() => handleDeleteClick(holiday)}
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
                    </TableCell>
                  </TableRow>
                ))}

              {/* Empty state message when no records match filters */}
              {companyHolidays.filter(
                (holiday) =>
                  holiday.week
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  holiday.day.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    sx={{ py: 6, textAlign: "center", borderBottom: "none" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          backgroundColor: `${theme.palette.primary.light}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Search
                          sx={{
                            color: theme.palette.primary.light,
                            fontSize: 30,
                          }}
                        />
                      </Box>
                      <Typography variant="h6" color="text.secondary">
                        No company holidays found
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ maxWidth: 400 }}
                      >
                        {searchTerm
                          ? `No holidays match "${searchTerm}". Try a different search term or clear your search.`
                          : "There are no company holidays in the system yet. Click the 'Add Holiday' button to create one."}
                      </Typography>
                      {searchTerm && (
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => setSearchTerm("")}
                          sx={{ mt: 1 }}
                        >
                          Clear search
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* create holiday */}
        <Dialog
          open={isAddModalOpen}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              width: isMobile ? "100%" : isTablet ? "600px" : "700px",
              maxWidth: "90vw",
              borderRadius: isMobile ? "0" : "20px",
              overflow: "hidden",
              margin: isMobile ? 0 : undefined,
              height: isMobile ? "100%" : undefined,
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(45deg, #1976d2, #64b5f6)",
              color: "white",
              fontSize: isMobile ? "1.25rem" : "1.5rem",
              fontWeight: 600,
              padding: isMobile ? "16px 20px" : "24px 32px",
              position: "relative",
            }}
          >
            {isEditing ? "Edit Holiday" : "Add Holiday"}
            <IconButton
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditing(false);
                setEditId(null);
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

          <DialogContent sx={{ padding: isMobile ? "20px" : "32px" }}>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ isSubmitting, errors, touched }) => (
                <Form>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <FormControl fullWidth error={touched.week && errors.week}>
                      <InputLabel>Week</InputLabel>
                      <Field
                        as={Select}
                        name="week"
                        label="Week"
                        sx={{ borderRadius: "8px" }}
                      >
                        {[
                          "First",
                          "Second",
                          "Third",
                          "Fourth",
                          "Fifth",
                          "All Weeks",
                        ].map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.week && errors.week && (
                        <FormHelperText>{errors.week}</FormHelperText>
                      )}
                    </FormControl>

                    <FormControl fullWidth error={touched.day && errors.day}>
                      <InputLabel>Day</InputLabel>
                      <Field
                        as={Select}
                        name="day"
                        label="Day"
                        sx={{ borderRadius: "8px" }}
                      >
                        {[
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                          "Sunday",
                        ].map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.day && errors.day && (
                        <FormHelperText>{errors.day}</FormHelperText>
                      )}
                    </FormControl>

                    <Stack
                      direction={isMobile ? "column" : "row"}
                      spacing={2}
                      justifyContent={isMobile ? "stretch" : "flex-end"}
                      sx={{ mt: 4 }}
                    >
                      <Button
                        onClick={() => setIsAddModalOpen(false)}
                        fullWidth={isMobile}
                        sx={{
                          border: "2px solid #1976d2",
                          color: "#1976d2",
                          "&:hover": {
                            border: "2px solid #64b5f6",
                            backgroundColor: "#e3f2fd",
                          },
                          borderRadius: "8px",
                          px: 4,
                          py: 1,
                          fontWeight: 600,
                          order: isMobile ? 1 : 0,
                          mt: isMobile ? 1 : 0,
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || loading}
                        fullWidth={isMobile}
                        sx={{
                          background:
                            "linear-gradient(45deg, #1976d2, #64b5f6)",
                          color: "white",
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #1565c0, #42a5f5)",
                          },
                          borderRadius: "8px",
                          px: 4,
                          py: 1,
                          fontWeight: 600,
                          order: isMobile ? 0 : 1,
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : isEditing ? (
                          "Update"
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </Stack>
                  </Stack>
                </Form>
              )}
            </Formik>
          </DialogContent>
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
              Are you sure you want to delete this company holiday?
            </Alert>
            {holidayToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="body1" fontWeight={600} color="#2c3e50">
                  Holiday Details:
                </Typography>
                <Typography
                  variant="body2"
                  color="#d013d1"
                  sx={{ mt: 1, fontWeight: 500 }}
                >
                  Week: {holidayToDelete.week}
                </Typography>
                <Typography
                  variant="body2"
                  color="#2563eb"
                  sx={{ fontWeight: 500 }}
                >
                  Day: {holidayToDelete.day}
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
      </Paper>
    </Container>
  );
}
