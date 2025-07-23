import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { styled } from "@mui/material/styles";
import gsap from "gsap";

import {
  useTheme,
  InputAdornment,
  Card,
  Button,
  TextField,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Pagination,
  Grid,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  alpha,
} from "@mui/material";
import {
  Search,
  FilterList,
  ViewModule,
  ViewList,
  MoreVert,
  Add,
} from "@mui/icons-material";

import api, { getAssetUrl } from "../../../api/axiosInstance";

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

const StyledCard = styled(motion.div)(({ theme }) => ({
  background: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  backdropFilter: "blur(5px)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  padding: theme.spacing(3),
  cursor: "pointer",
  transition: "all 0.3s ease-in-out",
  height: "100%", // Make all cards the same height
  display: "flex",
  flexDirection: "column",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
}));

// Update the StyledTableContainer for better list view styling
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: "16px",
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
  background: "#ffffff",
  backdropFilter: "blur(4px)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  overflow: "hidden", // Ensure the border radius is respected
  "& .MuiTable-root": {
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  "& .MuiTableHead-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    "& .MuiTableCell-head": {
      fontWeight: 600,
      color: theme.palette.primary.main,
      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      padding: theme.spacing(2),
    },
  },
}));

// Update the StyledTableRow for better hover effects
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: "all 0.3s ease",
  "& .MuiTableCell-root": {
    padding: theme.spacing(1.5, 2),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  },
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
    "& .MuiTableCell-root": {
      borderBottomColor: alpha(theme.palette.primary.main, 0.1),
    },
  },
  "&:last-child .MuiTableCell-root": {
    borderBottom: "none",
  },
}));

const StyledContainer = styled(Box)(({ theme }) => ({
  background: "linear-gradient(145deg, #f6f7f9 0%, #ffffff 100%)",
  minHeight: "100vh",
  padding: theme.spacing(3),
}));

const SearchContainer = styled(motion.div)(({ theme }) => ({
  background: "#ffffff",
  borderRadius: "16px",
  padding: theme.spacing(3),
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
  backdropFilter: "blur(4px)",
  marginBottom: theme.spacing(3),
}));


const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: "12px",
  textTransform: "none",
  padding: "8px 16px",
  boxShadow: "none",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: "8px",
  fontWeight: 500,
  background: theme.palette.primary.light,
  color: theme.palette.primary.main,
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-root": {
    borderRadius: "12px",
    margin: "0 4px",
    "&:hover": {
      background: theme.palette.primary.light,
    },
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    "& fieldset": {
      borderColor: "rgba(0, 0, 0, 0.1)",
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.5,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const HeaderContainer = styled(Box)({
  marginBottom: "2rem",
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
});

const SearchBarContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  marginTop: "1rem",
});

const ControlsContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  marginTop: "1rem",
});

const EmployeeListing = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState("grid");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const [profiles, setProfiles] = useState([]);
  const [filteredEmployeesList, setFilteredEmployeesList] = useState([]);
  const [departments, setDepartments] = useState(["All"]);
  //const itemsPerPage = 10;

  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;
  const theme = useTheme();
  const [departmentFilter, setDepartmentFilter] = useState("All");

  // Get employee initials for fallback
  const getEmployeeInitials = (employee) => {
    if (employee?.name) {
      const nameParts = employee.name.trim().split(" ");
      if (nameParts.length >= 2) {
        return nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
      } else if (nameParts.length === 1) {
        return nameParts[0].charAt(0).toUpperCase();
      }
    }
    return employee?._id ? employee._id.charAt(0).toUpperCase() : "U";
  };

  // GSAP animations
  useEffect(() => {
    gsap.from(".search-container", {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });

    gsap.from(".employee-card", {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power2.out",
    });
  }, []);

//   // Add this helper function to get the auth token
// const getAuthToken = () => {
//   return localStorage.getItem('token');
// };

useEffect(() => {
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // const token = getAuthToken();
      
      // if (!token) {
      //   console.error('Authentication token not found');
      //   setLoading(false);
      //   return;
      // }
      
      const response = await api.get("employees/registered", 
      //   {
      //   // headers: {
      //   //   'Authorization': `Bearer ${token}`
      //   // }
      // }
    );
      
      console.log("Employee data from API:", response.data);

      const employeeData = response.data.map((employee) => ({
        _id: employee.Emp_ID || "",
        name: employee.personalInfo
          ? `${employee.personalInfo.firstName || ""} ${
              employee.personalInfo.lastName || ""
            }`.trim()
          : "",
        email: employee.personalInfo?.email || "",
        phone: employee.personalInfo?.mobileNumber || "",
        department: employee.joiningDetails?.department || "Not Assigned",
        role: employee.joiningDetails?.initialDesignation || "Not Assigned",
        location:
          employee.addressDetails?.presentAddress?.city || "Not Specified",
        // profileImage: employee.personalInfo?.employeeImage
        //   ? `${process.env.REACT_APP_API_URL}${employee.personalInfo.employeeImage}`
        //   : null,
        profileImage: employee.personalInfo?.employeeImage
  ? getAssetUrl(employee.personalInfo.employeeImage)
  : null,

      }));

      console.log("Processed employee data:", employeeData);
      
      // Extract unique departments for the filter dropdown
      const uniqueDepartments = [...new Set(employeeData.map(emp => emp.department))].filter(Boolean);
      setDepartments(["All", ...uniqueDepartments]);
      
      setProfiles(employeeData);
      setFilteredEmployeesList(employeeData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      
      if (error.response && error.response.status === 401) {
        console.error("Authentication failed. Please log in again.");
        // Optionally redirect to login page
        // window.location.href = '/login';
      }
      
      setLoading(false);
    }
  };
  fetchEmployees();

  gsap.from(".search-container", {
    y: -50,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  });
}, []);

useEffect(() => {
  let filtered = [...profiles];
  
  // Filter by search text
  if (searchText) {
    filtered = filtered.filter(employee => 
      employee.name.toLowerCase().includes(searchText.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchText.toLowerCase())
    );
  }
  
  // Filter by status (if you have status data)
  if (statusFilter && statusFilter !== "All") {
    filtered = filtered.filter(employee => employee.status === statusFilter);
  }
  
  // Filter by department
  if (departmentFilter && departmentFilter !== "All") {
    filtered = filtered.filter(employee => employee.department === departmentFilter);
  }
  
  setFilteredEmployeesList(filtered);
  setCurrentPage(1); // Reset to first page when filters change
}, [searchText, statusFilter, departmentFilter, profiles]);

  const handleEmployeeClick = (employeeId) => {
    onNavigate(`/Dashboards/profile/${employeeId}`);
  };

  const handleFilter = (status) => {
    setStatusFilter(status);
    if (status === "Online") {
      setFilteredEmployeesList(
        profiles.filter((employee) => employee.status === "Online")
      );
    } else if (status === "Offline") {
      setFilteredEmployeesList(
        profiles.filter((employee) => employee.status === "Offline")
      );
    } else {
      setFilteredEmployeesList(profiles);
    }
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const toggleView = (mode) => {
    setViewMode(mode);
  };

  const filteredEmployees = filteredEmployeesList.filter((employee) =>
    employee.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // const GridView = ({ employees }) => (
  //   <motion.div variants={containerVariants} initial="hidden" animate="visible">
  //     <Grid container spacing={3}>
  //       {employees.map((employee) => (
  //         <Grid item xs={12} sm={6} md={4} key={employee._id}>
  //           <StyledCard
  //             variants={itemVariants}
  //             whileHover={{ scale: 1.02 }}
  //             whileTap={{ scale: 0.98 }}
  //             onClick={() => handleEmployeeClick(employee._id)}
  //           >
  //             <Box p={3}>
  //               <Typography variant="h6" gutterBottom>{employee.name}</Typography>
  //               <Typography color="textSecondary" gutterBottom>{employee.role}</Typography>
  //               <Chip label={employee.department} size="small" sx={{ marginBottom: 1 }} />
  //               <Typography variant="body2">{employee.email}</Typography>
  //               <Typography variant="body2">{employee.phone}</Typography>
  //               <Typography variant="body2">{employee.location}</Typography>
  //             </Box>
  //           </StyledCard>
  //         </Grid>
  //       ))}
  //     </Grid>
  //   </motion.div>
  // );

  const GridView = ({ employees }) => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Grid container spacing={3}>
        {employees.length > 0 ? (
          employees.map((employee) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={employee._id}>
              <StyledCard
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEmployeeClick(employee._id)}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                      pb: 2,
                      borderBottom: `1px solid ${alpha(
                        theme.palette.divider,
                        0.1
                      )}`,
                    }}
                  >
                    {/* Profile Image with Fallback */}
                    {employee.profileImage ? (
                      // <Box
                      //   component="img"
                      //   src={employee.profileImage}
                      //   alt={employee.name || "Employee"}
                      //   sx={{
                      //     width: 50,
                      //     height: 50,
                      //     borderRadius: "50%",
                      //     objectFit: "cover",
                      //     mr: 2,
                      //     border: `2px solid ${alpha(
                      //       theme.palette.primary.main,
                      //       0.3
                      //     )}`,
                      //   }}
                      //   onError={(e) => {
                      //     // Fallback to initials if image fails to load
                      //     e.target.style.display = "none";
                      //     e.target.nextSibling.style.display = "flex";
                      //   }}
                      // />
                      <Box
                        component="img"
                        src={employee.profileImage}
                        alt={employee.name || "Employee"}
                        sx={{
                          width: 50, // or 40 for list view
                          height: 50, // or 40 for list view
                          borderRadius: "50%",
                          objectFit: "cover",
                          mr: 2,
                          border: `2px solid ${alpha(
                            theme.palette.primary.main,
                            0.3
                          )}`,
                        }}
                        onError={(e) => {
                          console.error(
                            "Failed to load image:",
                            employee.profileImage,
                            "for employee:",
                            employee.name
                          );
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}

                    {/* Fallback to initials if no image */}
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        bgcolor:
                          employee._id % 2 === 0
                            ? alpha(theme.palette.primary.main, 0.8)
                            : alpha(theme.palette.secondary.main, 0.8),
                        color: "white",
                        display: employee.profileImage ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        mr: 2,
                      }}
                    >
                      {getEmployeeInitials(employee)}
                    </Box>

                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, lineHeight: 1.2 }}
                      >
                        {employee.name || "Unknown"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.role || "No Role Assigned"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Rest of the card content remains the same */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={employee.department}
                      size="small"
                      sx={{
                        borderRadius: "8px",
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                        mb: 1,
                      }}
                    />
                  </Box>

                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mr: 1, color: "text.secondary" }}
                      >
                        Email:
                      </Typography>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ maxWidth: "100%" }}
                      >
                        {employee.email || "No email provided"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mr: 1, color: "text.secondary" }}
                      >
                        Phone:
                      </Typography>
                      <Typography variant="body2">
                        {employee.phone || "No phone provided"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mr: 1, color: "text.secondary" }}
                      >
                        Location:
                      </Typography>
                      <Typography variant="body2">
                        {employee.location || "No location provided"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: `1px solid ${alpha(
                        theme.palette.divider,
                        0.1
                      )}`,
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontSize: "0.75rem",
                      }}
                    >
                      View Profile
                    </Button>
                  </Box>
                </Box>
              </StyledCard>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 1,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No employees found matching your criteria
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </motion.div>
  );

  return (
    <StyledContainer>
      {/* <HeaderContainer>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Employees Directory
        </Typography>
        
        <SearchBarContainer>
          <TextField
            variant="outlined"
            placeholder="Search employees..."
            value={searchText}
            onChange={handleSearch}
            fullWidth
            InputProps={{
              startAdornment: <Search color="action" />,
            }}
          />
        </SearchBarContainer>

        <ControlsContainer>
          <Button 
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            onClick={() => toggleView('list')}
            startIcon={<ViewList />}
            sx={{ zIndex: 1, visibility: 'visible' }}
          >
            List View
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => toggleView('grid')}
            startIcon={<ViewModule />}
            sx={{ zIndex: 1, visibility: 'visible' }}
          >
            Grid View
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<FilterList />}
            sx={{ zIndex: 1, visibility: 'visible' }}
          >
            Filter
          </Button>
          <FormControl variant="outlined" style={{ minWidth: 200, zIndex: 1, visibility: 'visible' }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => handleFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="All">All Employees</MenuItem>
              <MenuItem value="Online">Online</MenuItem>
              <MenuItem value="Offline">Offline</MenuItem>
            </Select>
          </FormControl>
        </ControlsContainer>
      </HeaderContainer> */}
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
          Employees Directory
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
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
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
              {/* <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => onNavigate("/Dashboards/onboarding")}
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
                Add New Employee
              </Button> */}
            </Box>
          </Box>
        </StyledPaper>
      </Box>

      {/* Status Filter Buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          mb: 2,
          mt: { xs: 2, sm: 2 },
        }}
      >
        <Button
          sx={{
            color: "green",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setStatusFilter("Active")}
        >
          ● Active
        </Button>
        <Button
          sx={{
            color: "red",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setStatusFilter("Inactive")}
        >
          ● Inactive
        </Button>
        <Button
          sx={{
            color: "gray",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setStatusFilter("All")}
        >
          ● All
        </Button>
      </Box>

      {/* View Controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 2,
        }}
      >
        <Button
          variant={viewMode === "list" ? "contained" : "outlined"}
          onClick={() => toggleView("list")}
          startIcon={<ViewList />}
          sx={{ zIndex: 1, visibility: "visible" }}
        >
          List View
        </Button>
        <Button
          variant={viewMode === "grid" ? "contained" : "outlined"}
          onClick={() => toggleView("grid")}
          startIcon={<ViewModule />}
          sx={{ zIndex: 1, visibility: "visible" }}
        >
          Grid View
        </Button>
        {/* <Button 
          variant="outlined" 
          startIcon={<FilterList />}
          sx={{ zIndex: 1, visibility: 'visible' }}
        >
          Filter
        </Button> */}
        {/* <FormControl
          variant="outlined"
          style={{ minWidth: 200, zIndex: 1, visibility: "visible" }}
        >
          <InputLabel>Department</InputLabel>
          <Select
            value={departmentFilter || "All"}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            label="Department"
          >
            <MenuItem value="All">All Departments</MenuItem>
            <MenuItem value="Engineering">Engineering</MenuItem>
            <MenuItem value="HR">HR</MenuItem>
            <MenuItem value="Marketing">Marketing</MenuItem>
            <MenuItem value="Finance">Finance</MenuItem>
          </Select>
        </FormControl> */}
        <FormControl
  variant="outlined"
  style={{ minWidth: 200, zIndex: 1, visibility: "visible" }}
>
  <InputLabel>Department</InputLabel>
  <Select
    value={departmentFilter || "All"}
    onChange={(e) => setDepartmentFilter(e.target.value)}
    label="Department"
  >
    {departments.map((dept) => (
      <MenuItem key={dept} value={dept}>
        {dept}
      </MenuItem>
    ))}
  </Select>
</FormControl>

      </Box>

      {viewMode === "grid" ? (
        <GridView employees={paginatedEmployees} />
      ) : (
        // <StyledTableContainer>
        //   <Table>
        //     <TableHead>
        //       <TableRow>
        //         <TableCell>Name</TableCell>
        //         <TableCell>Email</TableCell>
        //         <TableCell>Phone</TableCell>
        //         <TableCell>Department</TableCell>
        //         <TableCell>Role</TableCell>
        //         <TableCell>Location</TableCell>
        //         <TableCell>Actions</TableCell>
        //       </TableRow>
        //     </TableHead>
        //     <TableBody>
        //       {paginatedEmployees.map((employee) => (
        //         <TableRow
        //           key={employee._id}
        //           onClick={() => handleEmployeeClick(employee._id)}
        //           sx={{
        //             cursor: 'pointer',
        //             '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
        //           }}
        //         >
        //           <TableCell>{employee.name}</TableCell>
        //           <TableCell>{employee.email}</TableCell>
        //           <TableCell>{employee.phone}</TableCell>
        //           <TableCell>{employee.department}</TableCell>
        //           <TableCell>{employee.role}</TableCell>
        //           <TableCell>{employee.location}</TableCell>
        //           <TableCell>
        //             <IconButton><MoreVert /></IconButton>
        //           </TableCell>
        //         </TableRow>
        //       ))}
        //     </TableBody>
        //   </Table>
        // </StyledTableContainer>

        <StyledTableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="25%">Employee</TableCell>
                <TableCell width="20%">Contact</TableCell>
                <TableCell width="15%">Department</TableCell>
                <TableCell width="15%">Role</TableCell>
                <TableCell width="15%">Location</TableCell>
                <TableCell width="10%" align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => (
                  <StyledTableRow
                    key={employee._id}
                    onClick={() => handleEmployeeClick(employee._id)}
                    sx={{
                      cursor: "pointer",
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {/* Profile Image with Fallback */}
                        {employee.profileImage ? (
                          <Box
                            component="img"
                            src={employee.profileImage}
                            alt={employee.name || "Employee"}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              objectFit: "cover",
                              mr: 2,
                              border: `2px solid ${alpha(
                                theme.palette.primary.main,
                                0.3
                              )}`,
                            }}
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}

                        {/* Fallback to initials if no image */}
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            bgcolor:
                              employee._id % 2 === 0
                                ? alpha(theme.palette.primary.main, 0.8)
                                : alpha(theme.palette.secondary.main, 0.8),
                            color: "white",
                            display: employee.profileImage ? "none" : "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "1rem",
                            mr: 2,
                          }}
                        >
                          {getEmployeeInitials(employee)}
                        </Box>

                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {employee.name || "Unknown"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {employee._id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Rest of the table row remains the same */}
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ mb: 0.5 }}>
                        {employee.email || "No email provided"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.phone || "No phone provided"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.department}
                        size="small"
                        sx={{
                          borderRadius: "8px",
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.1
                          ),
                          color: theme.palette.primary.main,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee.role || "Not Assigned"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee.location || "Not Specified"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <IconButton
                          size="small"
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
                            mr: 1,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmployeeClick(employee._id);
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No employees found matching your criteria
                    </Typography>
                    <Button
                      variant="text"
                      color="primary"
                      onClick={() => {
                        setSearchText("");
                        setStatusFilter("All");
                        setDepartmentFilter("All");
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
        </StyledTableContainer>
      )}

      <Box display="flex" justifyContent="center" marginTop={3}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          size="large"
          sx={{ visibility: "visible", zIndex: 1 }}
        />
      </Box>
    </StyledContainer>
  );
};

export default EmployeeListing;
