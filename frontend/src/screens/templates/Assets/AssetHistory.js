
import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";
import {
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Modal,
  Button,
  Select,
  MenuItem,
  InputAdornment,
  Stack,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  TableContainer,
  alpha,
  styled,
  Divider,
  useTheme,
} from "@mui/material";
import { Edit, Delete, Search, Add, Close } from "@mui/icons-material";

// Add toSentenceCase helper function at the top  HISTORY
const toSentenceCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper functions for status colors
const getStatusColor = (status) => {
  if (status === "In Use") return "#22c55e";
  if (status === "Available") return "#3b82f6";
  if (status === "Under Maintenance" || status === "Under Service")
    return "#f59e0b";
  return "#e2e8f0";
};

const getStatusTextColor = (status) => {
  if (status === "In Use") return "#16a34a";
  if (status === "Available") return "#2563eb";
  if (status === "Under Maintenance" || status === "Under Service")
    return "#d97706";
  return "#64748b";
};

const getStatusBgColor = (status) => {
  if (status === "In Use") return "#f0fdf4";
  if (status === "Available") return "#eff6ff";
  if (status === "Under Maintenance" || status === "Under Service")
    return "#fefce8";
  return "#f8fafc";
};

// Styled components for the table
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontSize: 14,
  fontWeight: "bold",
  padding: theme.spacing(2),
  whiteSpace: "nowrap",
  "&.MuiTableCell-body": {
    color: theme.palette.text.primary,
    fontSize: 14,
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
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

// Add validation functions
const isAlphabeticOnly = (str) => {
  return /^[A-Za-z\s]+$/.test(str);
};

const validateEmployeeName = (name) => {
  if (!name) return true; // Empty is valid (optional field)
  return isAlphabeticOnly(name);
};

const AssetHistory = () => {
  const theme = useTheme();
  const [assets, setAssets] = useState([]);
  const [batches, setBatches] = useState([]);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    category: "",
    status: "",
    returnDate: "",
    allottedDate: "",
    currentEmployee: "",
    previousEmployees: [],
    batch: "",
  });
  const [newAssetData, setNewAssetData] = useState({
    name: "",
    category: "",
    status: "",
    returnDate: "",
    allottedDate: "",
    currentEmployee: "",
    previousEmployees: [],
    batch: "",
  });

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isBatchDetailsOpen, setIsBatchDetailsOpen] = useState(false);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



  const handleAssetNameClick = async (asset) => {
    setSelectedAsset(asset);

    // If the asset has a batch, fetch the batch details
    if (asset.batch) {
      try {
        // First try to find the batch in the already loaded batches
        const batchDetails = batches.find((b) => b.batchNumber === asset.batch);

        if (batchDetails) {
          setSelectedBatchDetails(batchDetails);
          setIsBatchDetailsOpen(true);
        } else {
          // If not found locally, fetch from API
          const response = await api.get(
            `/asset-batches/by-number/${asset.batch}`
          );
          if (response.data) {
            setSelectedBatchDetails(response.data);
            setIsBatchDetailsOpen(true);
          } else {
            // Show a more user-friendly message
            alert(
              `No batch found with number ${asset.batch}. Please check the batch number.`
            );
          }
        }
      } catch (error) {
        console.error("Error fetching batch details:", error);
        alert("Failed to load batch details. Please try again later.");
      }
    } else {
      // Show a more user-friendly message
      alert(
        "This asset is not associated with any batch. You can edit the asset to add a batch."
      );
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets');
      console.log("Fetched assets:", response.data);

      // Update the assets state with the fresh data
      setAssets(response.data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching asset history:", error);
      setError("Failed to load assets");
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await api.get('/asset-batches');
      console.log("Fetched batches:", response.data);
      setBatches(response.data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchAssets();
    fetchBatches();

    // Listen for asset updates from AssetView or other components
    const handleAssetsUpdated = () => {
      console.log("Assets updated event received, refreshing assets list");
      fetchAssets();
    };

    // Listen for batch updates from AssetBatch
    const handleBatchesUpdated = () => {
      console.log("Batches updated event received, refreshing batches list");
      fetchBatches();
    };

    window.addEventListener("assetsUpdated", handleAssetsUpdated);
    window.addEventListener("batchesUpdated", handleBatchesUpdated);
    window.addEventListener("storage", (e) => {
      if (e.key === "assetsUpdated") {
        fetchAssets();
      }
      if (e.key === "batchesUpdated") {
        fetchBatches();
      }
    });

    return () => {
      window.removeEventListener("assetsUpdated", handleAssetsUpdated);
      window.removeEventListener("batchesUpdated", handleBatchesUpdated);
    };
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      try {
        setLoading(true);
        await api.delete(`/assets/${id}`);
        fetchAssets();

        // Notify other components about the update
        const timestamp = Date.now().toString();
        localStorage.setItem("assetsUpdated", timestamp);

        const event = new CustomEvent("assetsUpdated", {
          detail: { timestamp },
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error("Error deleting asset:", error);
        setError("Failed to delete asset");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditClick = (asset) => {
    if (!asset || !asset._id) {
      console.error("Invalid asset object:", asset);
      alert("Cannot edit this asset: Invalid asset data");
      return;
    }

    setEditingAssetId(asset._id);
    
    // Initialize with default empty values to prevent undefined errors
    const editDataInitial = {
      name: asset.name || "",
      category: asset.category || "",
      status: asset.status || "",
      returnDate: asset.returnDate
        ? new Date(asset.returnDate).toISOString().split("T")[0]
        : "",
      allottedDate: asset.allottedDate
        ? new Date(asset.allottedDate).toISOString().split("T")[0]
        : "",
      currentEmployee: asset.currentEmployee || "",
      previousEmployees: Array.isArray(asset.previousEmployees)
        ? [...asset.previousEmployees] // Create a copy to avoid reference issues
        : [],
      batch: asset.batch || "",
    };
    
    setEditData(editDataInitial);
    console.log("Editing asset:", asset);
    console.log("Edit data initialized:", editDataInitial);
  };

  // Handler for previous employees in EDIT modal
  const handlePreviousEmployeesChangeEdit = (e) => {
    const employees = e.target.value
      .split(",")
      .map((emp) => emp.trim())
      .filter((emp) => emp !== "");
    console.log("Setting previous employees to:", employees);
    setEditData((prev) => ({
      ...prev,
      previousEmployees: employees,
    }));
  };

  // Handler for previous employees in ADD modal
  const handlePreviousEmployeesChange = (e) => {
    const employees = e.target.value
      .split(",")
      .map((emp) => emp.trim())
      .filter((emp) => emp !== "");
    setNewAssetData((prev) => ({
      ...prev,
      previousEmployees: employees,
    }));
  };

  // Update the handleAddAsset function to properly handle employee data
  const handleAddAsset = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newAssetData.name || !newAssetData.category || !newAssetData.status) {
      alert("Please fill in all required fields: Asset Name, Category, and Status");
      return;
    }
    
    try {
      setLoading(true);
      
      // Format the data properly
      const formattedData = {
        name: newAssetData.name.trim(),
        category: newAssetData.category.trim(),
        status: newAssetData.status.trim(),
        // Make sure to include employee data even if empty
        currentEmployee: newAssetData.currentEmployee ? newAssetData.currentEmployee.trim() : "",
        batch: newAssetData.batch || "",
        // Ensure previousEmployees is always an array
        previousEmployees: Array.isArray(newAssetData.previousEmployees) 
          ? newAssetData.previousEmployees.filter(emp => emp && emp.trim() !== "") 
          : [],
        // Format dates properly or exclude them
        ...(newAssetData.allottedDate 
          ? { allottedDate: new Date(newAssetData.allottedDate).toISOString() } 
          : {}),
        ...(newAssetData.returnDate 
          ? { returnDate: new Date(newAssetData.returnDate).toISOString() } 
          : {})
      };

      console.log("Sending asset data:", formattedData);

      const response = await api.post('/assets', formattedData);
      console.log("Response from server:", response.data);

      // Success handling
      await fetchAssets();
      setNewAssetData({
        name: "",
        category: "",
        status: "",
        returnDate: "",
        allottedDate: "",
        currentEmployee: "",
        previousEmployees: [],
        batch: "",
      });
      setIsAddModalOpen(false);

      // Notify other components about the update
      const timestamp = Date.now().toString();
      localStorage.setItem("assetsUpdated", timestamp);
      const event = new CustomEvent("assetsUpdated", { detail: { timestamp } });
      window.dispatchEvent(event);
      
      // Show success message
      alert("Asset added successfully!");
    } catch (error) {
      console.error("Error adding new asset:", error);
      
      // Extract the error message from the response
      let errorMessage = "Failed to add asset";
      if (error.response && error.response.data) {
        errorMessage += ": " + (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data));
      } else {
        errorMessage += ": " + error.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate required fields
      if (!editData.name || !editData.category || !editData.status) {
        alert("Please fill in all required fields: Asset Name, Category, and Status");
        setLoading(false);
        return;
      }

      // Format the data properly
      const updatedData = {
        name: editData.name.trim(),
        category: editData.category.trim(),
        status: editData.status.trim(),
        // Always include employee data
        currentEmployee: editData.currentEmployee ? editData.currentEmployee.trim() : "",
        batch: editData.batch || "",
        // Ensure previousEmployees is always an array
        previousEmployees: Array.isArray(editData.previousEmployees)
          ? editData.previousEmployees.filter(emp => emp && emp.trim() !== "")
          : typeof editData.previousEmployees === 'string'
            ? editData.previousEmployees.split(',').map(emp => emp.trim()).filter(emp => emp !== '')
            : [],
        // Format dates properly or exclude them
        ...(editData.allottedDate
          ? { allottedDate: new Date(editData.allottedDate).toISOString() }
          : {}),
        ...(editData.returnDate
                ? { returnDate: new Date(editData.returnDate).toISOString() }
          : {})
      };

      console.log("Updating asset with data:", updatedData);
      console.log("Asset ID being updated:", editingAssetId);

      if (!editingAssetId) {
        throw new Error("No asset ID provided for update");
      }

      const response = await api.put(
        `/assets/${editingAssetId}`,
        updatedData
      );
      
      console.log("Update response:", response.data);

      // Close the edit modal
      setEditingAssetId(null);

      // Refresh the asset list
      await fetchAssets();

      // Show success message
      alert("Asset updated successfully!");

      // Notify other components about the update
      const timestamp = Date.now().toString();
      localStorage.setItem("assetsUpdated", timestamp);

      const event = new CustomEvent("assetsUpdated", { detail: { timestamp } });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error updating asset:", error);
      
      // Extract the error message from the response
      let errorMessage = "Failed to update asset";
      if (error.response && error.response.data) {
        errorMessage += ": " + (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data));
      } else {
        errorMessage += ": " + error.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update this whenever assets or searchTerm changes
  const filteredAssets = React.useMemo(() => {
    return assets.filter(
      (asset) =>
        (asset.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (asset.status?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (asset.category?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (asset.currentEmployee?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (asset.batch?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

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
          Asset History
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
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
              placeholder="Search by name, status, category or employee"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{
                width: { xs: "100%", sm: "350px" },
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
                    <Search color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              onClick={() => setIsAddModalOpen(true)}
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
                textTransform: "none",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.25)",
              }}
            >
              Add New Asset
            </Button>
          </Box>
        </Paper>
      </Box>
      {/* Filter buttons for asset status */}
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
          onClick={() => setSearchTerm("In Use")}
        >
          ● In Use
        </Button>
        <Button
          sx={{
            color: "blue",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setSearchTerm("Available")}
        >
          ● Available
        </Button>
        <Button
          sx={{
            color: "orange",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setSearchTerm("Under Maintenance")}
        >
          ● Under Maintenance
        </Button>
        <Button
          sx={{
            color: "gray",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setSearchTerm("")}
        >
          ● All Assets
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {loading && (
        <Typography sx={{ textAlign: "center", my: 2 }}>
          Loading assets...
        </Typography>
      )}
      {error && (
        <Typography
          sx={{
            bgcolor: "#fee2e2",
            color: "#dc2626",
            p: 2,
            borderRadius: 1,
            mb: 2,
          }}
        >
          {error}
        </Typography>
      )}
      <Dialog
        open={isBatchDetailsOpen}
        onClose={() => setIsBatchDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: "700px",
            maxWidth: "90vw",
            borderRadius: "20px",
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
            position: "relative",
          }}
        >
          Batch Details
          <IconButton
            onClick={() => setIsBatchDetailsOpen(false)}
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
        <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
          {selectedBatchDetails ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" color="text.secondary">
                  Batch Number
                </Typography>
                <Typography variant="h6">
                  {selectedBatchDetails.batchNumber}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedBatchDetails.description}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" color="text.secondary">
                  Number of Assets
                </Typography>
                <Typography variant="body1">
                  {selectedBatchDetails.numberOfAssets}
                </Typography>
              </Box>

              {selectedAsset && (
                <Box>
                  <Typography variant="subtitle1" color="text.secondary">
                    Current Asset
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: "#1976d2",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "0.875rem",
                      }}
                    >
                      {selectedAsset.name?.[0] || "A"}
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {toSentenceCase(selectedAsset.name)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {toSentenceCase(selectedAsset.category)} •{" "}
                        {selectedAsset.status}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle1">
                Other Assets in this Batch
              </Typography>

              <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                {assets
                  .filter(
                    (a) =>
                      a.batch === selectedBatchDetails.batchNumber &&
                      a._id !== (selectedAsset?._id || "")
                  )
                  .map((asset) => (
                    <Box
                      key={asset._id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: "#64b5f6",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                        }}
                      >
                        {asset.name?.[0] || "A"}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {toSentenceCase(asset.name)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {asset.status}
                        </Typography>
                      </Box>
                    </Box>
                  ))}

                {assets.filter(
                  (a) =>
                    a.batch === selectedBatchDetails.batchNumber &&
                    a._id !== (selectedAsset?._id || "")
                ).length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    No other assets in this batch
                  </Typography>
                )}
              </Box>

              <Stack
                direction="row"
                spacing={2}
                justifyContent="flex-end"
                sx={{ mt: 2 }}
              >
                <Button
                  onClick={() => setIsBatchDetailsOpen(false)}
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
                  }}
                >
                  Close
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography>Loading batch details...</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
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
              <StyledTableCell sx={{ minWidth: 180 }}>
                Asset Name
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 150 }}>Category</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 150 }}>Batch</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 180 }}>
                            Previous Employees
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 180 }}>
                Current Employee
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 130 }}>
                Allotted Date
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 130 }}>
                Return Date
              </StyledTableCell>
              <StyledTableCell sx={{ minWidth: 120 }}>Status</StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: 100 }}>
                Actions
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssets.map((asset) => (
              <StyledTableRow key={asset._id}>
                <TableCell>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    onClick={() => handleAssetNameClick(asset)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        textDecoration: "underline",
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: "#1976d2",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "0.875rem",
                        flexShrink: 0,
                      }}
                    >
                      {asset.name?.[0] || "A"}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#111" }}
                    >
                      {toSentenceCase(asset.name)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {toSentenceCase(asset.category)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {asset.batch ? (
                    <Chip
                      label={asset.batch}
                      size="small"
                      onClick={() => handleAssetNameClick(asset)}
                      sx={{
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.dark,
                        borderColor: theme.palette.info.main,
                        borderWidth: 1,
                        borderStyle: "solid",
                        fontWeight: 500,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.info.main, 0.2),
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No Batch
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {asset.previousEmployees &&
                  asset.previousEmployees.length > 0 ? (
                    <Box sx={{ maxHeight: "60px", overflowY: "auto" }}>
                      {asset.previousEmployees.map((employee, index) => (
                        <Chip
                          key={index}
                          label={toSentenceCase(employee)}
                          size="small"
                          sx={{
                            m: 0.3,
                            backgroundColor: alpha(
                              theme.palette.secondary.light,
                              0.1
                            ),
                            color: theme.palette.secondary.dark,
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ color: "#2563eb" }}>
                    {toSentenceCase(asset.currentEmployee) || "None"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {asset.allottedDate
                      ? new Date(asset.allottedDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {asset.returnDate
                      ? new Date(asset.returnDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
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
                      backgroundColor: getStatusBgColor(asset.status),
                      color: getStatusTextColor(asset.status),
                    }}
                  >
                    {asset.status}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{ display: "flex", justifyContent: "center", gap: 1 }}
                  >
                    <IconButton
                      onClick={() => handleEditClick(asset)}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.2
                          ),
                        },
                        color: "#1976d2",
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(asset._id)}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.error.main, 0.2),
                        },
                        color: "#ef4444",
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </StyledTableRow>
            ))}
            {filteredAssets.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No assets found matching your search criteria.
                  </Typography>
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => setSearchTerm("")}
                    sx={{ mt: 1 }}
                  >
                    Clear search
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Asset Modal */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: "700px",
            maxWidth: "90vw",
            borderRadius: "20px",
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
            position: "relative",
          }}
        >
          Add New Asset
          <IconButton
            onClick={() => setIsAddModalOpen(false)}
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

        <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
          <form onSubmit={handleAddAsset}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Asset Name"
                name="name"
                value={newAssetData.name}
                onChange={(e) =>
                  setNewAssetData({ ...newAssetData, name: e.target.value })
                }
                required
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              />

              <FormControl
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              >
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={newAssetData.category}
                  onChange={(e) =>
                    setNewAssetData({
                      ...newAssetData,
                      category: e.target.value,
                    })
                  }
                  required
                  label="Category"
                >
                  <MenuItem value="Hardware">Hardware</MenuItem>
                  <MenuItem value="Software">Software</MenuItem>
                  <MenuItem value="Furniture">Furniture</MenuItem>
                  <MenuItem value="Office Equipment">Office Equipment</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              >
                <InputLabel>Batch</InputLabel>
                <Select
                  value={newAssetData.batch || ""}
                  onChange={(e) =>
                    setNewAssetData({ ...newAssetData, batch: e.target.value })
                  }
                  label="Batch"
                >
                  <MenuItem value="">None</MenuItem>
                  {batches.map((batch) => (
                    <MenuItem key={batch._id} value={batch.batchNumber}>
                      {batch.batchNumber} - {batch.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={newAssetData.status}
                  onChange={(e) =>
                    setNewAssetData({ ...newAssetData, status: e.target.value })
                  }
                  required
                  sx={{
                    borderRadius: "8px",
                    backgroundColor: "white",
                  }}
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="In Use">In Use</MenuItem>
                  <MenuItem value="Under Maintenance">
                    Under Maintenance
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Current Employee"
                name="currentEmployee"
                value={newAssetData.currentEmployee || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || isAlphabeticOnly(value)) {
                    setNewAssetData({
                      ...newAssetData,
                      currentEmployee: value,
                    });
                  }
                }}
                fullWidth
                error={newAssetData.currentEmployee && !validateEmployeeName(newAssetData.currentEmployee)}
                helperText={newAssetData.currentEmployee && !validateEmployeeName(newAssetData.currentEmployee) 
                  ? "Only alphabetic characters are allowed" 
                  : ""}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              />

              <TextField
                label="Previous Employees"
                name="previousEmployees"
                value={Array.isArray(newAssetData.previousEmployees) 
                  ? newAssetData.previousEmployees.join(", ") 
                  : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[A-Za-z\s,]+$/.test(value)) {
                    handlePreviousEmployeesChange(e);
                  }
                }}
                helperText="Enter names separated by commas (alphabetic characters only)"
                fullWidth
                multiline
                rows={2}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              />

              <TextField
                type="date"
                label="Allotted Date"
                name="allottedDate"
                value={newAssetData.allottedDate}
                onChange={(e) =>
                  setNewAssetData({
                    ...newAssetData,
                    allottedDate: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              />

              <TextField
                type="date"
                label="Return Date"
                name="returnDate"
                value={newAssetData.returnDate}
                onChange={(e) =>
                  setNewAssetData({
                    ...newAssetData,
                    returnDate: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
                helperText="Select the expected return date (if applicable)"
              />

              <Stack
                direction="row"
                spacing={2}
                justifyContent="flex-end"
                sx={{ mt: 4 }}
              >
                <Button
                  onClick={() => setIsAddModalOpen(false)}
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
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  sx={{
                    background: "linear-gradient(45deg, #1976d2, #64b5f6)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(45deg, #1565c0, #42a5f5)",
                    },
                    borderRadius: "8px",
                    px: 4,
                    py: 1,
                    fontWeight: 600,
                  }}
                >
                  Save
                </Button>
              </Stack>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Modal */}
      <Dialog
        open={!!editingAssetId}
        onClose={() => setEditingAssetId(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: "700px",
            maxWidth: "90vw",
            borderRadius: "20px",
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
            position: "relative",
          }}
        >
          Edit Asset
          <IconButton
            onClick={() => setEditingAssetId(null)}
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

        <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
          <form onSubmit={handleUpdate}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Asset Name"
                name="name"
                value={editData.name || ""}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
                required
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              />

              <FormControl
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              >
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={editData.category || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      category: e.target.value,
                    })
                  }
                  required
                  label="Category"
                >
                  <MenuItem value="Hardware">Hardware</MenuItem>
                  <MenuItem value="Software">Software</MenuItem>
                  <MenuItem value="Furniture">Furniture</MenuItem>
                  <MenuItem value="Office Equipment">Office Equipment</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={editData.status || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                  required
                  label="Status"
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="In Use">In Use</MenuItem>
                  <MenuItem value="Under Maintenance">
                    Under Maintenance
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              >
                <InputLabel>Batch</InputLabel>
                <Select
                  value={editData.batch || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, batch: e.target.value })
                  }
                  label="Batch"
                >
                  <MenuItem value="">None</MenuItem>
                  {batches.map((batch) => (
                    <MenuItem key={batch._id} value={batch.batchNumber}>
                      {batch.batchNumber} - {batch.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Current Employee"
                value={editData.currentEmployee || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || isAlphabeticOnly(value)) {
                    setEditData({ ...editData, currentEmployee: value });
                  }
                }}
                fullWidth
                error={editData.currentEmployee && !validateEmployeeName(editData.currentEmployee)}
                helperText={editData.currentEmployee && !validateEmployeeName(editData.currentEmployee) 
                  ? "Only alphabetic characters are allowed" 
                  : ""}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              />

              <TextField
                label="Previous Employees"
                name="previousEmployees"
                value={
                  Array.isArray(editData.previousEmployees)
                    ? editData.previousEmployees.join(", ")
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[A-Za-z\s,]+$/.test(value)) {
                    handlePreviousEmployeesChangeEdit(e);
                  }
                }}
                helperText="Enter names separated by commas (alphabetic characters only)"
                fullWidth
                multiline
                rows={2}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              />

              <TextField
                type="date"
                label="Allotted Date"
                value={editData.allottedDate || ""}
                onChange={(e) =>
                  setEditData({ ...editData, allottedDate: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              />

              <TextField
                type="date"
                label="Return Date"
                value={editData.returnDate || ""}
                onChange={(e) =>
                  setEditData({ ...editData, returnDate: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                  },
                }}
              />

              <Stack
                direction="row"
                spacing={2}
                justifyContent="flex-end"
                sx={{ mt: 4 }}
              >
                <Button
                  onClick={() => setEditingAssetId(null)}
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
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  sx={{
                    background: "linear-gradient(45deg, #1976d2, #64b5f6)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(45deg, #1565c0, #42a5f5)",
                    },
                    borderRadius: "8px",
                    px: 4,
                    py: 1,
                    fontWeight: 600,
                  }}
                >
                  Update
                </Button>
              </Stack>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AssetHistory;


