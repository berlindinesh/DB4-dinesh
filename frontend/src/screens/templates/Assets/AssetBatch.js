import React, { useState, useEffect } from 'react';
import api from "../../../api/axiosInstance";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import { Dialog, DialogTitle, DialogContent, TableCell, Chip, TableHead, TableRow, TableBody, Table, IconButton, InputAdornment, TextField, Box, Typography, Container, Paper, Stack, Button, Divider, useTheme, TableContainer, alpha, styled } from '@mui/material';
import { motion } from 'framer-motion';
import { Search, Add, Edit, Delete, Close } from '@mui/icons-material';



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

function AssetBatch() {
  const theme = useTheme();
  const [assetBatches, setAssetBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    batchNumber: '',
    description: '',
    numberOfAssets: ''
  });
  const [editBatchId, setEditBatchId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssetBatches();
  }, []);



  // const fetchAssetBatches = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await axios.get(`${API_URL}/api/asset-batches`);
  //     setAssetBatches(response.data);
  //     setLoading(false);
  //   } catch (err) {
  //     console.error('Error fetching asset batches:', err.message);
  //     setError('Failed to fetch asset batches. Please check the server.');
  //     setLoading(false);
  //   }
  // };

const fetchAssetBatches = async () => {
  setLoading(true);
  try {
    const response = await api.get('/asset-batches');
    setAssetBatches(response.data);
    setLoading(false);
  } catch (err) {
    console.error('Error fetching asset batches:', err.message);
    setError('Failed to fetch asset batches. Please check the server.');
    setLoading(false);
  }
};


  const handleSearch = async (e) => {
    const searchValue = e.target.value;
    setSearchQuery(searchValue);
    
    if (searchValue.trim() === '') {
      // If search is empty, fetch all batches
      fetchAssetBatches();
      return;
    }
    
    // Filter the existing batches client-side without making an API call
    const filteredBatches = assetBatches.filter(batch => 
      batch.batchNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      batch.description.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    // Sort the results to prioritize matches at the beginning of the text
    filteredBatches.sort((a, b) => {
      const aStartsWithQuery = a.batchNumber.toLowerCase().startsWith(searchValue.toLowerCase());
      const bStartsWithQuery = b.batchNumber.toLowerCase().startsWith(searchValue.toLowerCase());
      
      if (aStartsWithQuery && !bStartsWithQuery) return -1;
      if (!aStartsWithQuery && bStartsWithQuery) return 1;
      return 0;
    });
    
    setAssetBatches(filteredBatches);
    setError(null); // Clear any previous errors
  };

  const toSentenceCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const transformedValue = name === 'numberOfAssets' ? value : toSentenceCase(value);
    setFormData({ ...formData, [name]: transformedValue });
  };

  // useEffect(() => {
  //   const handleBatchesUpdated = () => {
  //     console.log('Batches updated event received, refreshing batches list');
  //     fetchAssetBatches();
  //   };
    
  //   window.addEventListener('batchesUpdated', handleBatchesUpdated);
    
  //   const lastUpdate = localStorage.getItem('batchesUpdated');
  //   if (lastUpdate) {
  //     const currentTimestamp = Date.now();
  //     const lastUpdateTimestamp = parseInt(lastUpdate, 10);
  //     if (currentTimestamp - lastUpdateTimestamp < 5002) {
  //       fetchAssetBatches();
  //     }
  //   }
    
  //   return () => {
  //     window.removeEventListener('batchesUpdated', handleBatchesUpdated);
  //   };
  // }, []);

  // const handleCreateBatch = async (e) => {
  //   e.preventDefault();
  //   try {
  //     if (isEditing) {
  //       await axios.put(`${API_URL}/api/asset-batches/${editBatchId}`, formData);
  //       setAssetBatches(assetBatches.map(batch => batch._id === editBatchId ? { ...batch, ...formData } : batch));
  //       setIsEditing(false);
  //       setEditBatchId(null);
  //     } else {
  //       const response = await axios.post(`${API_URL}/api/asset-batches`, formData);
  //       setAssetBatches([...assetBatches, response.data]);
  //     }
  //     setFormData({ batchNumber: '', description: '', numberOfAssets: '' });
  //     setShowForm(false);
      
  //     const timestamp = Date.now().toString();
  //     localStorage.setItem('batchesUpdated', timestamp);
      
  //     const event = new CustomEvent('batchesUpdated', { detail: { timestamp } });
  //     window.dispatchEvent(event);
  //   } catch (err) {
  //     console.error('Error creating/updating asset batch:', err.message);
  //     setError('Failed to save asset batch. Please try again.');
  //   }
  // };

useEffect(() => {
  const handleBatchesUpdated = () => {
    console.log('Batches updated event received, refreshing batches list');
    fetchAssetBatches();
  };
  
  window.addEventListener('batchesUpdated', handleBatchesUpdated);
  
  const lastUpdate = localStorage.getItem('batchesUpdated');
  if (lastUpdate) {
    const currentTimestamp = Date.now();
    const lastUpdateTimestamp = parseInt(lastUpdate, 10);
    if (currentTimestamp - lastUpdateTimestamp < 5002) {
      fetchAssetBatches();
    }
  }
  
  return () => {
    window.removeEventListener('batchesUpdated', handleBatchesUpdated);
  };
}, []);



const handleCreateBatch = async (e) => {
  e.preventDefault();
  try {
    if (isEditing) {
      await api.put(`/asset-batches/${editBatchId}`, formData);
      setAssetBatches(assetBatches.map(batch => batch._id === editBatchId ? { ...batch, ...formData } : batch));
      setIsEditing(false);
      setEditBatchId(null);
    } else {
      const response = await api.post('/asset-batches', formData);
      setAssetBatches([...assetBatches, response.data]);
    }
    setFormData({ batchNumber: '', description: '', numberOfAssets: '' });
    setShowForm(false);
    
    const timestamp = Date.now().toString();
    localStorage.setItem('batchesUpdated', timestamp);
    
    const event = new CustomEvent('batchesUpdated', { detail: { timestamp } });
    window.dispatchEvent(event);
  } catch (err) {
    console.error('Error creating/updating asset batch:', err.message);
    setError('Failed to save asset batch. Please try again.');
  }
};


  // const handleDelete = async (id) => {
  //   try {
  //     await axios.delete(`${API_URL}/api/asset-batches/${id}`);
  //     setAssetBatches(assetBatches.filter(batch => batch._id !== id));
      
  //     const timestamp = Date.now().toString();
  //     localStorage.setItem('batchesUpdated', timestamp);
      
  //     const event = new CustomEvent('batchesUpdated', { detail: { timestamp } });
  //     window.dispatchEvent(event);
  //   } catch (err) {
  //     console.error('Error deleting asset batch:', err.message);
  //     setError('Failed to delete asset batch. Please try again.');
  //   }
  // };

const handleDelete = async (id) => {
  try {
    await api.delete(`/asset-batches/${id}`);
    setAssetBatches(assetBatches.filter(batch => batch._id !== id));
    
    const timestamp = Date.now().toString();
    localStorage.setItem('batchesUpdated', timestamp);
    
    const event = new CustomEvent('batchesUpdated', { detail: { timestamp } });
    window.dispatchEvent(event);
  } catch (err) {
    console.error('Error deleting asset batch:', err.message);
    setError('Failed to delete asset batch. Please try again.');
  }
};


  const handleEdit = (batch) => {
    setFormData({
      batchNumber: batch.batchNumber,
      description: batch.description,
      numberOfAssets: batch.numberOfAssets
    });
    setEditBatchId(batch._id);
    setIsEditing(true);
    setShowForm(true);
  };

  // const handleCreateAssetsFromBatch = async (batch) => {
  //   try {
  //     if (window.confirm(`Are you sure you want to create ${batch.numberOfAssets} assets from batch ${batch.batchNumber}?`)) {
  //       setLoading(true);
        
  //       // Generate asset names based on batch number
  //       const assetNames = [];
  //       for (let i = 1; i <= batch.numberOfAssets; i++) {
  //         assetNames.push(`${batch.batchNumber}-Asset-${i}`);
  //       }
        
  //       await axios.post(`${API_URL}/api/assets/from-batch`, {
  //         batchId: batch._id,
  //         assetNames,
  //         category: 'Hardware',
  //         batch: batch.batchNumber // Make sure to include the batch number
  //       });
        
  //       // Notify other components about the update
  //       const timestamp = Date.now().toString();
  //       localStorage.setItem('assetsUpdated', timestamp);
        
  //       const event = new CustomEvent('assetsUpdated', { detail: { timestamp } });
  //       window.dispatchEvent(event);
        
  //       setLoading(false);
  //       alert(`${batch.numberOfAssets} assets created successfully from batch ${batch.batchNumber}`);
  //     }
  //   } catch (error) {
  //     console.error('Error creating assets from batch:', error);
  //     setError('Failed to create assets from batch. Please try again.');
  //     setLoading(false);
  //   }
  // };

const handleCreateAssetsFromBatch = async (batch) => {
  try {
    if (window.confirm(`Are you sure you want to create ${batch.numberOfAssets} assets from batch ${batch.batchNumber}?`)) {
      setLoading(true);
      
      // Generate asset names based on batch number
      const assetNames = [];
      for (let i = 1; i <= batch.numberOfAssets; i++) {
        assetNames.push(`${batch.batchNumber}-Asset-${i}`);
      }
      
      await api.post('/assets/from-batch', {
        batchId: batch._id,
        assetNames,
        category: 'Hardware',
        batch: batch.batchNumber // Make sure to include the batch number
      });
      
      // Notify other components about the update
      const timestamp = Date.now().toString();
      localStorage.setItem('assetsUpdated', timestamp);
      
      const event = new CustomEvent('assetsUpdated', { detail: { timestamp } });
      window.dispatchEvent(event);
      
      setLoading(false);
      alert(`${batch.numberOfAssets} assets created successfully from batch ${batch.batchNumber}`);
    }
  } catch (error) {
    console.error('Error creating assets from batch:', error);
    setError('Failed to create assets from batch. Please try again.');
    setLoading(false);
  }
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
          Asset Batch Management
        </Typography>

        <Paper 
          elevation={3}
          sx={{ 
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            mb: 3
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
              placeholder="Search asset batch..." 
              value={searchQuery}
              onChange={handleSearch}
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
                    <Search color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              onClick={() => {
                setFormData({ batchNumber: '', description: '', numberOfAssets: '' });
                setShowForm(true);
                setIsEditing(false);
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
                textTransform: "none",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.25)"
              }}
            >
              Create Batch
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Filter options could be added here if needed */}
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
            color: "gray",
            justifyContent: { xs: "flex-start", sm: "center" },
            width: { xs: "100%", sm: "auto" },
          }}
          onClick={() => setSearchQuery("")}
        >
          ● All Batches
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading && (
        <Typography sx={{ textAlign: "center", my: 2 }}>
          Loading asset batches...
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
              <StyledTableCell sx={{ minWidth: 180 }}>Batch Number</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 250 }}>Description</StyledTableCell>
              <StyledTableCell sx={{ minWidth: 150 }}>Number of Assets</StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: 120 }}>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assetBatches.map((batch) => (
              <StyledTableRow key={batch._id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
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
                      {batch.batchNumber?.[0] || "B"}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#111" }}>
                      {batch.batchNumber}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2"
                    sx={{
                      maxWidth: 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {batch.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: "inline-block",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: "0.875rem",
                      fontWeight: "medium",
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.dark,
                    }}
                  >
                    {batch.numberOfAssets}
                  </Box>
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton 
                      onClick={() => handleEdit(batch)}
                      size="small"
                      sx={{ 
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        color: "#1976d2",
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(batch._id)}
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
                   
                  </Stack>
                </TableCell>
                
              </StyledTableRow>
            ))}
            {assetBatches.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No asset batches found matching your search criteria.
                  </Typography>
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => setSearchQuery("")}
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

      <Dialog 
        open={showForm} 
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: "700px",
            maxWidth: "90vw",
            borderRadius: "20px",
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #1976d2, #64b5f6)",
            color: "white",
            fontSize: "1.5rem",
            fontWeight: 600,
            padding: "24px 32px",
            position: "relative"
          }}
        >
          {isEditing ? 'Edit Asset Batch' : 'Create Asset Batch'}
          <IconButton
            onClick={() => setShowForm(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white'
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: "32px", backgroundColor: "#f8fafc" }}>
          <form onSubmit={handleCreateBatch}>
            <Stack spacing={3} sx={{mt:2}}>
              <TextField
                label="Batch Number"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: "white",
                    borderRadius: '8px'
                  }
                }}
              />
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                fullWidth
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: "white",
                    borderRadius: '8px'
                  }
                }}
              />
              <TextField
                label="Number of Assets"
                name="numberOfAssets"
                type="number"
                value={formData.numberOfAssets}
                onChange={handleInputChange}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: "white",
                    borderRadius: '8px'
                  }
                }}
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
                <Button
                  onClick={() => setShowForm(false)}
                  sx={{
                    border: '2px solid #1976d2',
                    color: '#1976d2',
                    '&:hover': {
                      border: '2px solid #64b5f6',
                      backgroundColor: '#e3f2fd',
                    },
                    borderRadius: '8px',
                    px: 4,
                    py: 1,
                    fontWeight: 600
                  }}
                >
                  Cancel
                </Button>
             
                <Button
                  type="submit"
                  sx={{
                    background: 'linear-gradient(45deg, #1976d2, #64b5f6)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0, #42a5f5)',
                    },
                    borderRadius: '8px',
                    px: 4,
                    py: 1,
                    fontWeight: 600
                  }}
                >
                  {isEditing ? 'Update' : 'Save'}
                </Button>
              </Stack>            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default AssetBatch;

