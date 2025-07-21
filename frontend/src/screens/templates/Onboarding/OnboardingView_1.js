import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";
import "./OnboardingView.css";

import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  DialogContentText,
} from "@mui/material";
import { Search, Add, Email, Delete } from "@mui/icons-material";

// Add these styled components after the imports
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

function OnboardingView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    email: "",
    jobPosition: "",
    mobile: "",
    joiningDate: "",
    stage: "Test",
    portalStatus: "Active",
    taskStatus: "Pending",
  });

  // Add these validation functions at the top of your component
  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name);
  };

  const validatePosition = (position) => {
    const positionRegex = /^[a-zA-Z\s]+$/;
    return positionRegex.test(position);
  };

  // Add state for validation errors
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    phone: "",
    email: "",
    position: "",
  });

  const uniqueStages = ["All", "Test", "Interview", "Offer"];

  // Add these state variables to your component
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mailConfirmOpen, setMailConfirmOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [selectedCandidateForMail, setSelectedCandidateForMail] =
    useState(null);

  // Add these handler functions to your component
  const openDeleteConfirm = (candidateId) => {
    setSelectedCandidateId(candidateId);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setSelectedCandidateId(null);
  };

  // const confirmDelete = async () => {
  //   try {
  //     await handleDeleteCandidate(selectedCandidateId);
  //     closeDeleteConfirm();
  //   } catch (error) {
  //     console.error("Error deleting candidate:", error);
  //   }
  // };

  const openMailConfirm = (candidate) => {
    setSelectedCandidateForMail(candidate);
    setMailConfirmOpen(true);
  };

  const closeMailConfirm = () => {
    setMailConfirmOpen(false);
    setSelectedCandidateForMail(null);
  };

  // const confirmSendMail = async () => {
  //   try {
  //     await sendMailToCandidate(selectedCandidateForMail);
  //     closeMailConfirm();
  //   } catch (error) {
  //     console.error("Error sending mail:", error);
  //   }
  // };

  // Update the handleDeleteCandidate function to not require confirmation
  // since we'll handle that separately
  // const handleDeleteCandidate = async (id) => {
  //   try {
  //     await axios.delete(`${process.env.REACT_APP_API_URL}/api/onboarding/${id}`);
  //     setCandidates(candidates.filter((candidate) => candidate._id !== id));
  //   } catch (error) {
  //     console.error("Error deleting candidate:", error);
  //   }
  // };

  useEffect(() => {
    fetchCandidates();
  }, [stageFilter]);

  // const handleInputChange = (e, field) => {
  //   const value = e.target.value;

  //   switch (field) {
  //     case "mobile":
  //       if (value === "" || /^\d+$/.test(value)) {
  //         setNewCandidate({ ...newCandidate, mobile: value });
  //         setValidationErrors({
  //           ...validationErrors,
  //           phone: validatePhone(value)
  //             ? ""
  //             : "Please enter a valid 10-digit phone number",
  //         });
  //       }
  //       break;

  //     case "email":
  //       setNewCandidate({ ...newCandidate, email: value });
  //       setValidationErrors({
  //         ...validationErrors,
  //         email: validateEmail(value)
  //           ? ""
  //           : "Please enter a valid email address",
  //       });
  //       break;

  //     case "jobPosition":
  //       if (value === "" || /^[a-zA-Z\s]+$/.test(value)) {
  //         setNewCandidate({ ...newCandidate, jobPosition: value });
  //         setValidationErrors({
  //           ...validationErrors,
  //           position: validatePosition(value)
  //             ? ""
  //             : "Position should contain only letters",
  //         });
  //       }
  //       break;

  //     default:
  //       setNewCandidate({ ...newCandidate, [field]: value });
  //   }
  // };

  const handleInputChange = (e, field) => {
    const value = e.target.value;

    switch (field) {
      case "name":
        if (value === "" || /^[a-zA-Z\s]+$/.test(value)) {
          setNewCandidate({ ...newCandidate, name: value });
          setValidationErrors({
            ...validationErrors,
            name: validateName(value) ? "" : "Name should contain only letters",
          });
        }
        break;

      case "mobile":
        if (value === "" || /^\d+$/.test(value)) {
          setNewCandidate({ ...newCandidate, mobile: value });
          setValidationErrors({
            ...validationErrors,
            phone: validatePhone(value)
              ? ""
              : "Please enter a valid 10-digit phone number",
          });
        }
        break;

      case "email":
        setNewCandidate({ ...newCandidate, email: value });
        setValidationErrors({
          ...validationErrors,
          email: validateEmail(value)
            ? ""
            : "Please enter a valid email address",
        });
        break;

      case "jobPosition":
        if (value === "" || /^[a-zA-Z\s]+$/.test(value)) {
          setNewCandidate({ ...newCandidate, jobPosition: value });
          setValidationErrors({
            ...validationErrors,
            position: validatePosition(value)
              ? ""
              : "Position should contain only letters",
          });
        }
        break;

      default:
        setNewCandidate({ ...newCandidate, [field]: value });
    }
  };

  const filteredCandidates = candidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //   // Add this function to get the auth token
  // const getAuthToken = () => {
  //   return localStorage.getItem('token');
  // };

  // Update the fetchCandidates function
  const fetchCandidates = async () => {
    try {
      // const token = getAuthToken();
      const url =
        stageFilter === "All"
          ? "/onboarding"
          : `/onboarding/filter?stage=${stageFilter}`;

      const response = await api.get(
        url
        //    {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      setCandidates(response.data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  // // Update the handleCreateCandidate function
  // const handleCreateCandidate = async (e) => {
  //   e.preventDefault();

  //   const errors = {
  //     phone: validatePhone(newCandidate.mobile) ? "" : "Invalid phone number",
  //     email: validateEmail(newCandidate.email) ? "" : "Invalid email",
  //     position: validatePosition(newCandidate.jobPosition)
  //       ? ""
  //       : "Invalid position",
  //   };

  //   setValidationErrors(errors);

  //   if (Object.values(errors).some((error) => error !== "")) {
  //     return;
  //   }

  //   try {
  //     // const token = getAuthToken();
  //     const response = await api.post(
  //       "/onboarding",
  //       newCandidate,
  //       // {
  //       //   headers: {
  //       //     'Authorization': `Bearer ${token}`
  //       //   }
  //       // }
  //     );
  //     setCandidates([...candidates, response.data]);
  //     setNewCandidate({
  //       name: "",
  //       email: "",
  //       jobPosition: "",
  //       mobile: "",
  //       joiningDate: "",
  //       stage: "Test",
  //       portalStatus: "Active",
  //       taskStatus: "Pending",
  //     });
  //     setValidationErrors({
  //       phone: "",
  //       email: "",
  //       position: "",
  //     });
  //     setShowCreateForm(false);
  //   } catch (error) {
  //     console.error("Error creating candidate:", error);
  //   }
  // };

  // Update the handleCreateCandidate function to include name validation
  const handleCreateCandidate = async (e) => {
    e.preventDefault();

    const errors = {
      name: validateName(newCandidate.name)
        ? ""
        : "Name should contain only letters",
      phone: validatePhone(newCandidate.mobile) ? "" : "Invalid phone number",
      email: validateEmail(newCandidate.email) ? "" : "Invalid email",
      position: validatePosition(newCandidate.jobPosition)
        ? ""
        : "Position should contain only letters",
    };

    setValidationErrors(errors);

    if (Object.values(errors).some((error) => error !== "")) {
      return;
    }

    try {
      const response = await api.post("onboarding", newCandidate);
      setCandidates([...candidates, response.data]);
      setNewCandidate({
        name: "",
        email: "",
        jobPosition: "",
        mobile: "",
        joiningDate: "",
        stage: "Test",
        portalStatus: "Active",
        taskStatus: "Pending",
      });
      setValidationErrors({
        name: "",
        phone: "",
        email: "",
        position: "",
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating candidate:", error);
    }
  };

  // Update the handleUpdateCandidate function if it exists
  const handleUpdateCandidate = async (id, updatedData) => {
    try {
      // const token = getAuthToken();
      const response = await api.put(
        `onboarding/${id}`,
        updatedData
        // {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      setCandidates(
        candidates.map((candidate) =>
          candidate._id === id ? response.data : candidate
        )
      );
    } catch (error) {
      console.error("Error updating candidate:", error);
    }
  };

  // Update the handleDeleteCandidate function
  const handleDeleteCandidate = async (id) => {
    try {
      // const token = getAuthToken();
      await api.delete(
        `onboarding/${id}`
        //   {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      setCandidates(candidates.filter((candidate) => candidate._id !== id));
    } catch (error) {
      console.error("Error deleting candidate:", error);
    }
  };

  // // Update the sendMailToCandidate function
  // const sendMailToCandidate = async (candidate) => {
  //   try {
  //     // const token = getAuthToken();
  //     await api.post(
  //       "/onboarding/send-email",
  //       {
  //         email: candidate.email,
  //         name: candidate.name,
  //         jobPosition: candidate.jobPosition,
  //         joiningDate: candidate.joiningDate,
  //       },
  //       // {
  //       //   headers: {
  //       //     'Authorization': `Bearer ${token}`
  //       //   }
  //       // }
  //     );
  //     alert("Onboarding email sent successfully!");
  //   } catch (error) {
  //     console.error("Error sending email:", error);
  //     alert("Failed to send email. Please try again.");
  //   }
  // };

  const sendMailToCandidate = async (candidate) => {
    try {
      await api.post("onboarding/send-email", {
        email: candidate.email,
        name: candidate.name,
        jobPosition: candidate.jobPosition,
        joiningDate: candidate.joiningDate,
      });
      alert("Onboarding email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
    }
  };

  // Update any other API calls in the component
  // For example, if there's a function to handle stage changes:
  const handleStageChange = async (id, newStage) => {
    try {
      // const token = getAuthToken();
      const candidate = candidates.find((c) => c._id === id);
      if (candidate) {
        const updatedCandidate = { ...candidate, stage: newStage };
        await api.put(
          `onboarding/${id}`,
          updatedCandidate
          // {
          //   headers: {
          //     'Authorization': `Bearer ${token}`
          //   }
          // }
        );
        fetchCandidates(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating candidate stage:", error);
    }
  };

  // Update the confirmDelete function if it exists
  const confirmDelete = async () => {
    try {
      // const token = getAuthToken();
      await api.delete(
        `onboarding/${selectedCandidateId}`
        // {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      closeDeleteConfirm();
      fetchCandidates();
    } catch (error) {
      console.error("Error deleting candidate:", error);
    }
  };

  // Update the confirmSendMail function if it exists
  const confirmSendMail = async () => {
    try {
      // const token = getAuthToken();
      await api.post(
        "onboarding/send-email",
        {
          email: selectedCandidateForMail.email,
          name: selectedCandidateForMail.name,
          jobPosition: selectedCandidateForMail.jobPosition,
          joiningDate: selectedCandidateForMail.joiningDate,
        }
        // {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // }
      );
      closeMailConfirm();
    } catch (error) {
      console.error("Error sending mail:", error);
    }
  };

  return (
    <div className="onboarding-container">
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
            mb: { xs: 2, sm: 4 },
            color: theme.palette.primary.main,
            fontWeight: 600,
            letterSpacing: 0.5,
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          Onboarding Dashboard
        </Typography>

        <StyledPaper>
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
              placeholder="Search candidates..."
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
                gap: 1,
                width: { xs: "100%", sm: "auto" },
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                select
                size="small"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                SelectProps={{
                  native: true,
                }}
                sx={{
                  width: { xs: "100%", sm: 120 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              >
                {uniqueStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </TextField>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCreateForm(true)}
                sx={{
                  height: { xs: "auto", sm: 40 },
                  padding: { xs: "10px 16px", sm: "8px 16px" },
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { sm: "180px" },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                  color: "white",
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                  },
                  borderRadius: "8px",
                  boxShadow: "0 3px 5px 2px rgba(0, 0, 0, .1)",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Add New Candidate
              </Button>
            </Box>
          </Box>
        </StyledPaper>

        {/* Material UI Dialog for Add New Candidate */}

        <Dialog
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          fullScreen={isMobile}
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 3,
              width: isMobile ? "100%" : "650px",
              maxWidth: "650px", // Set a fixed maximum width for desktop
              margin: isMobile ? 0 : 2,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #1976d2, #2196f3)",
              color: "white",
              fontSize: { xs: "1.25rem", sm: "1.75rem" },
              fontWeight: 600,
              padding: { xs: "16px 20px", sm: "24px 32px" },
              m: 0,
            }}
          >
            Add New Candidate
          </DialogTitle>

          <DialogContent
            sx={{
              backgroundColor: "#f8fafc",
              padding: { xs: "16px", sm: "24px 32px" },
              paddingTop: { xs: "20px", sm: "28px" },
            }}
          >
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <TextField
                  label="Full Name"
                  value={newCandidate.name}
                  onChange={(e) => handleInputChange(e, "name")}
                  required
                  fullWidth
                  placeholder="Enter candidate's full name"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  value={newCandidate.email}
                  onChange={(e) => handleInputChange(e, "email")}
                  required
                  fullWidth
                  placeholder="email@example.com"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mobile Number"
                  value={newCandidate.mobile}
                  onChange={(e) => handleInputChange(e, "mobile")}
                  required
                  fullWidth
                  placeholder="Enter 10-digit number"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  error={!!validationErrors.phone}
                  helperText={validationErrors.phone}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Job Position"
                  value={newCandidate.jobPosition}
                  onChange={(e) => handleInputChange(e, "jobPosition")}
                  required
                  fullWidth
                  placeholder="Enter job position"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  error={!!validationErrors.position}
                  helperText={validationErrors.position}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Joining Date"
                  type="date"
                  value={newCandidate.joiningDate}
                  onChange={(e) => handleInputChange(e, "joiningDate")}
                  required
                  fullWidth
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                    },
                  }}
                >
                  <InputLabel id="stage-label" shrink>
                    Stage
                  </InputLabel>
                  <Select
                    labelId="stage-label"
                    id="stage"
                    value={newCandidate.stage}
                    onChange={(e) => handleInputChange(e, "stage")}
                    label="Stage"
                    notched
                  >
                    <MenuItem value="Test">Test</MenuItem>
                    <MenuItem value="Interview">Interview</MenuItem>
                    <MenuItem value="Offer">Offer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions
            sx={{
              backgroundColor: "#f8fafc",
              padding: { xs: "16px", sm: "24px 32px" },
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1, sm: 2 },
              justifyContent: "flex-end",
            }}
          >
            <Button
              onClick={() => setShowCreateForm(false)}
              fullWidth={isMobile}
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderWidth: 2,
                borderColor: "#1976d2",
                color: "#1976d2",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  borderWidth: 2,
                  borderColor: "#1565c0",
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                },
                width: isMobile ? "100%" : "auto",
                minWidth: "120px",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleCreateCandidate(e);
              }}
              fullWidth={isMobile}
              variant="contained"
              sx={{
                borderRadius: 2,
                background: "linear-gradient(135deg, #1976d2, #2196f3)",
                color: "white",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #1565c0, #1976d2)",
                },
                width: isMobile ? "100%" : "auto",
                minWidth: "180px",
              }}
            >
              Create Candidate
            </Button>
          </DialogActions>
        </Dialog>

        {/* Table  */}

        <div
          className="candidates-table-container"
          style={{
            overflowX: "auto",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            marginTop: "24px",
          }}
        >
          <table
            className="candidates-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: isMobile ? "800px" : "auto", // Force horizontal scroll on mobile
              fontSize: "14px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: "#1976d2",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: "#1976d2",
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: "#1976d2",
                  }}
                >
                  Job Position
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: "#1976d2",
                  }}
                >
                  Mobile
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: "#1976d2",
                  }}
                >
                  Joining Date
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: "#1976d2",
                  }}
                >
                  Stage
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: "#1976d2",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      color: "#64748b",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    No candidates found. Add your first candidate!
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate, index) => (
                  <tr
                    key={candidate._id}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                      transition: "background-color 0.2s",
                      "&:hover": {
                        backgroundColor: "#f1f5f9",
                      },
                    }}
                  >
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      {candidate.name}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      {candidate.email}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      {candidate.jobPosition}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      {candidate.mobile}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155" }}>
                      {new Date(candidate.joiningDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor:
                            candidate.stage === "Test"
                              ? "#e3f2fd"
                              : candidate.stage === "Interview"
                              ? "#e8f5e9"
                              : "#fff8e1",
                          color:
                            candidate.stage === "Test"
                              ? "#1976d2"
                              : candidate.stage === "Interview"
                              ? "#2e7d32"
                              : "#f57c00",
                        }}
                      >
                        {candidate.stage}
                      </span>
                    </td>
                    {/* <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor:
                            candidate.portalStatus === "Active"
                              ? "#e8f5e9"
                              : "#ffebee",
                          color:
                            candidate.portalStatus === "Active"
                              ? "#2e7d32"
                              : "#c62828",
                        }}
                      >
                        {candidate.portalStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor:
                            candidate.taskStatus === "Completed"
                              ? "#e8f5e9"
                              : candidate.taskStatus === "Pending"
                              ? "#fff8e1"
                              : "#f5f5f5",
                          color:
                            candidate.taskStatus === "Completed"
                              ? "#2e7d32"
                              : candidate.taskStatus === "Pending"
                              ? "#f57c00"
                              : "#616161",
                        }}
                      >
                        {candidate.taskStatus}
                      </span>
                    </td> */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => openMailConfirm(candidate)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "36px",
                            height: "36px",
                            backgroundColor: "#e3f2fd",
                            color: "#1976d2",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
                            padding: 0,
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#bbdefb";
                            e.currentTarget.style.transform = "scale(1.1)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 8px rgba(0,0,0,0.12)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#e3f2fd";
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 5px rgba(0,0,0,0.08)";
                          }}
                        >
                          <Email fontSize="small" />
                        </button>

                        <button
                          onClick={() => openDeleteConfirm(candidate._id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "36px",
                            height: "36px",
                            backgroundColor: "#ffebee",
                            color: "#c62828",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
                            padding: 0,
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#ffcdd2";
                            e.currentTarget.style.transform = "scale(1.1)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 8px rgba(0,0,0,0.12)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#ffebee";
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 5px rgba(0,0,0,0.08)";
                          }}
                        >
                          <Delete fontSize="small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteConfirmOpen}
            onClose={closeDeleteConfirm}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                width: { xs: "95%", sm: "500px" },
                maxWidth: "500px",
                borderRadius: "20px",
                overflow: "hidden",
                margin: { xs: "8px", sm: "32px" },
              },
            }}
          >
            <DialogTitle
              id="alert-dialog-title"
              sx={{
                background: "linear-gradient(45deg, #f44336, #ff7961)",
                color: "white",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                fontWeight: 600,
                padding: { xs: "16px 24px", sm: "24px 32px" },
              }}
            >
              Confirm Deletion
            </DialogTitle>

            <DialogContent
              sx={{
                padding: { xs: "24px", sm: "32px" },
                backgroundColor: "#f8fafc",
                paddingTop: { xs: "24px", sm: "32px" },
              }}
            >
              <DialogContentText
                id="alert-dialog-description"
                sx={{ color: "#333" }}
              >
                Are you sure you want to delete this candidate? This action
                cannot be undone.
              </DialogContentText>
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
                onClick={closeDeleteConfirm}
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
                onClick={confirmDelete}
                variant="contained"
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
                autoFocus
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Send Mail Confirmation Dialog */}
          <Dialog
            open={mailConfirmOpen}
            onClose={closeMailConfirm}
            aria-labelledby="mail-dialog-title"
            aria-describedby="mail-dialog-description"
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
              id="mail-dialog-title"
              sx={{
                background: "linear-gradient(45deg, #0047AB, #1CA9C9)",
                color: "white",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                fontWeight: 600,
                padding: { xs: "16px 24px", sm: "24px 32px" },
              }}
            >
              Confirm Email
            </DialogTitle>
            <DialogContent
              sx={{
                padding: { xs: "24px", sm: "32px" },
                backgroundColor: "#f8fafc",
                paddingTop: { xs: "24px", sm: "32px" },
              }}
            >
              <DialogContentText
                id="mail-dialog-description"
                sx={{ color: "#333" }}
              >
                Are you sure you want to send an onboarding email to{" "}
                {selectedCandidateForMail?.name}?
              </DialogContentText>
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
                onClick={closeMailConfirm}
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
                onClick={confirmSendMail}
                variant="contained"
                sx={{
                  background: "linear-gradient(45deg, #0047AB, #1CA9C9)",
                  fontSize: "0.95rem",
                  textTransform: "none",
                  padding: "8px 32px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
                  color: "white",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg,rgb(12, 105, 236),rgb(9, 195, 237))",
                  },
                }}
                autoFocus
              >
                Send Email
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </Box>
    </div>
  );
}

export default OnboardingView;
