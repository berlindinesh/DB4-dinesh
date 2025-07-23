// AssetDashboard.js
import React, { useState, useEffect } from "react";
import api from "../../../api/axiosInstance";
import "./AssetDashboard.css";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  //Divider,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip as MuiTooltip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Computer,
  DevicesOther,
  Storage,
  Refresh,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Person,
  Category,
  CalendarToday,
  Inventory,
  Dashboard,
  Layers,
  History,
  MoreVert,
  FilterList,
  Search,
  Download,
  Print,
} from "@mui/icons-material";

// Register the components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AssetDashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetBatches, setAssetBatches] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardSummary, setDashboardSummary] = useState({
    totalAssets: 0,
    assetsInUse: 0,
    availableAssets: 0,
    totalCategories: 0,
    categoryDistribution: [],
    statusDistribution: [],
    recentTransactions: [],
  });
  const [assetTrends, setAssetTrends] = useState({
    labels: [],
    acquisitions: [],
    allocations: [],
  });
  const [topEmployees, setTopEmployees] = useState([]);



  useEffect(() => {
    fetchAssetData();
  }, []);

  // const fetchAssetData = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     // Fetch assets data
  //     const assetsResponse = await axios.get(`${API_URL}/api/assets`);

  //     // Fetch asset batches data
  //     const batchesResponse = await axios.get(`${API_URL}/api/asset-batches`);

  //     // Set the raw data
  //     setAssets(assetsResponse.data);
  //     setAssetBatches(batchesResponse.data);

  //     // Process data for dashboard summary
  //     processDataForDashboard(assetsResponse.data, batchesResponse.data);
  //   } catch (error) {
  //     console.error("Error fetching asset data:", error);
  //     setError("Failed to load asset data. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  // Update the fetchAssetData function
  const fetchAssetData = async () => {
    setLoading(true);
    setError(null);
    try {
      // // Get the authentication token
      // const token = getAuthToken();
      // const authHeader = { headers: { 'Authorization': `Bearer ${token}` } };
      
      // Fetch assets data with auth token
      const assetsResponse = await api.get('/assets');

      // Fetch asset batches data with auth token
      const batchesResponse = await api.get('/asset-batches');

      // Set the raw data
      setAssets(assetsResponse.data);
      setAssetBatches(batchesResponse.data);

      // Process data for dashboard summary
      processDataForDashboard(assetsResponse.data, batchesResponse.data);
    } catch (error) {
      console.error("Error fetching asset data:", error);
      setError("Failed to load asset data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
  const processDataForDashboard = (assetsData, batchesData) => {
    // Calculate total assets
    const totalAssets = assetsData.length;

    // Calculate assets in use
    const assetsInUse = assetsData.filter(
      (asset) => asset.status === "In Use"
    ).length;

    // Calculate available assets
    const availableAssets = assetsData.filter(
      (asset) => asset.status === "Available"
    ).length;

    // Calculate unique categories
    const uniqueCategories = [
      ...new Set(assetsData.map((asset) => asset.category)),
    ];
    const totalCategories = uniqueCategories.length;

    // Calculate category distribution
    const categoryDistribution = uniqueCategories
      .map((category) => {
        const count = assetsData.filter(
          (asset) => asset.category === category
        ).length;
        return { category, count };
      })
      .sort((a, b) => b.count - a.count);

    // Calculate status distribution
    const statusTypes = [...new Set(assetsData.map((asset) => asset.status))];
    const statusDistribution = statusTypes.map((status) => {
      const count = assetsData.filter(
        (asset) => asset.status === status
      ).length;
      return { status, count };
    });

    // Generate recent transactions (based on asset allocation/return dates if available)
    // For this example, we'll just use the most recently added assets
    const recentTransactions = [...assetsData]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    // Generate asset trends data (acquisitions by month from batches)
    generateAssetTrends(batchesData);

    // Generate top employees with most assets
    generateTopEmployees(assetsData);

    // Set the dashboard summary
    setDashboardSummary({
      totalAssets,
      assetsInUse,
      availableAssets,
      totalCategories,
      categoryDistribution,
      statusDistribution,
      recentTransactions,
    });
  };

  // Generate asset trends data from batches
  const generateAssetTrends = (batchesData) => {
    // Get last 6 months
    const months = [];
    const acquisitions = [];
    const allocations = [];

    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString("default", { month: "short" });
      months.push(monthName);

      // Count acquisitions for this month from batches
      const acquisitionsCount = batchesData
        .filter((batch) => {
          const batchDate = new Date(batch.purchaseDate);
          return (
            batchDate.getMonth() === month.getMonth() &&
            batchDate.getFullYear() === month.getFullYear()
          );
        })
        .reduce((sum, batch) => sum + (batch.numberOfAssets || 0), 0);

      acquisitions.push(acquisitionsCount);

      // For allocations, we would need allocation dates from assets
      // For now, we'll use a placeholder or derived value
      allocations.push(Math.floor(acquisitionsCount * 0.7)); // Assuming 70% of acquisitions are allocated
    }

    setAssetTrends({
      labels: months,
      acquisitions,
      allocations,
    });
  };

  // Generate top employees with most assets
  const generateTopEmployees = (assetsData) => {
    const employeeAssetCount = {};

    assetsData.forEach((asset) => {
      if (asset.currentEmployee) {
        if (employeeAssetCount[asset.currentEmployee]) {
          employeeAssetCount[asset.currentEmployee]++;
        } else {
          employeeAssetCount[asset.currentEmployee] = 1;
        }
      }
    });

    // Convert to array and sort
    const sortedEmployees = Object.entries(employeeAssetCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setTopEmployees(sortedEmployees);
  };

  // Chart data preparation
  const statusChartData = {
    labels: dashboardSummary.statusDistribution.map((item) => item.status),
    datasets: [
      {
        data: dashboardSummary.statusDistribution.map((item) => item.count),
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.primary.main,
          theme.palette.warning.main,
          theme.palette.error.main,
        ],
        borderWidth: 1,
        borderColor: "#fff",
      },
    ],
  };

  const categoryChartData = {
    labels: dashboardSummary.categoryDistribution.map((item) => item.category),
    datasets: [
      {
        label: "Assets by Category",
        data: dashboardSummary.categoryDistribution.map((item) => item.count),
        backgroundColor: theme.palette.primary.main,
        borderRadius: 6,
      },
    ],
  };

  const assetTrendsChartData = {
    labels: assetTrends.labels,
    datasets: [
      {
        label: "Acquisitions",
        data: assetTrends.acquisitions,
        borderColor: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        tension: 0.4,
        fill: true,
      },
      {
        label: "Allocations",
        data: assetTrends.allocations,
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const batchDistributionData = {
    labels: assetBatches.slice(0, 5).map((batch) => batch.batchNumber),
    datasets: [
      {
        data: assetBatches.slice(0, 5).map((batch) => batch.numberOfAssets),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
        hoverBackgroundColor: [
          "#FF4394",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
      },
    ],
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: alpha(theme.palette.text.primary, 0.05),
        },
        ticks: {
          precision: 0,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.text.primary, 0.05),
        },
        ticks: {
          precision: 0,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    fetchAssetData();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 500,
          }}
        >
          Loading asset dashboard data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: 2,
            boxShadow: theme.shadows[2],
          }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          sx={{
            borderRadius: 2,
            boxShadow: theme.shadows[2],
          }}
        >
          Refresh Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: "24px",
        backgroundColor: alpha(theme.palette.background.default, 0.7),
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            Asset Dashboard
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            Manage and monitor your organization's assets and inventory
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          {/* <MuiTooltip title="Export Data">
            <IconButton 
              color="primary"
              sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <Download />
            </IconButton>
          </MuiTooltip>
          
          <MuiTooltip title="Print Dashboard">
            <IconButton 
              color="primary"
              sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <Print />
            </IconButton> 
          </MuiTooltip>*/}

          <MuiTooltip title="Refresh Data">
            <IconButton
              onClick={handleRefresh}
              color="primary"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <Refresh />
            </IconButton>
          </MuiTooltip>
        </Stack>
      </Box>

      {/* Navigation Tabs */}
      <Paper
        sx={{
          mb: 4,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: theme.shadows[2],
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            backgroundColor: theme.palette.background.paper,
            "& .MuiTabs-indicator": {
              backgroundColor: theme.palette.primary.main,
              height: 3,
            },
          }}
        >
          <Tab
            icon={<Dashboard />}
            label="Overview"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              py: 2,
            }}
          />
          <Tab
            icon={<Inventory />}
            label="Assets"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              py: 2,
            }}
          />
          <Tab
            icon={<Layers />}
            label="Batches"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              py: 2,
            }}
          />
        </Tabs>
      </Paper>

      {/* Overview Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: "16px",
                  boxShadow: theme.shadows[2],
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <Box
                  sx={{
                    height: "4px",
                    backgroundColor: theme.palette.success.main,
                    width: "100%",
                  }}
                />
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.2),
                        color: theme.palette.success.main,
                        mr: 2,
                      }}
                    >
                      <Inventory />
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Total Assets
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {dashboardSummary.totalAssets}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <TrendingUp
                      sx={{ color: theme.palette.success.main, mr: 0.5 }}
                      fontSize="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(
                        (dashboardSummary.totalAssets /
                          (dashboardSummary.totalAssets || 1)) *
                          100
                      )}
                      % of inventory tracked
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: "16px",
                  boxShadow: theme.shadows[2],
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <Box
                  sx={{
                    height: "4px",
                    backgroundColor: theme.palette.primary.main,
                    width: "100%",
                  }}
                />
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        color: theme.palette.primary.main,
                        mr: 2,
                      }}
                    >
                      <Person />
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Assets in Use
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {dashboardSummary.assetsInUse}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Info
                      sx={{ color: theme.palette.primary.main, mr: 0.5 }}
                      fontSize="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(
                        (dashboardSummary.assetsInUse /
                          dashboardSummary.totalAssets) *
                          100
                      ) || 0}
                      % utilization rate
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: "16px",
                  boxShadow: theme.shadows[2],
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <Box
                  sx={{
                    height: "4px",
                    backgroundColor: theme.palette.warning.main,
                    width: "100%",
                  }}
                />
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.warning.main, 0.2),
                        color: theme.palette.warning.main,
                        mr: 2,
                      }}
                    >
                      <Category />
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Categories
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {dashboardSummary.totalCategories}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CheckCircle
                      sx={{ color: theme.palette.warning.main, mr: 0.5 }}
                      fontSize="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {dashboardSummary.totalCategories} different asset types
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: "16px",
                  boxShadow: theme.shadows[2],
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <Box
                  sx={{
                    height: "4px",
                    backgroundColor: theme.palette.info.main,
                    width: "100%",
                  }}
                />
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.info.main, 0.2),
                        color: theme.palette.info.main,
                        mr: 2,
                      }}
                    >
                      <DevicesOther />
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Available Assets
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {dashboardSummary.availableAssets}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <TrendingUp
                      sx={{ color: theme.palette.info.main, mr: 0.5 }}
                      fontSize="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(
                        (dashboardSummary.availableAssets /
                          dashboardSummary.totalAssets) *
                          100
                      ) || 0}
                      % ready for allocation
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: theme.shadows[2],
                  height: "100%",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.primary,
                    mb: 3,
                    fontWeight: 600,
                  }}
                >
                  Asset Status Distribution
                </Typography>
                {dashboardSummary.statusDistribution.length ? (
                  <Box sx={{ height: 300 }}>
                    <Doughnut data={statusChartData} options={pieOptions} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: 300,
                      flexDirection: "column",
                      gap: 2,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    <Info fontSize="large" />
                    <Typography>No status data available</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: theme.shadows[2],
                  height: "100%",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.primary,
                    mb: 3,
                    fontWeight: 600,
                  }}
                >
                  Assets by Category
                </Typography>
                {dashboardSummary.categoryDistribution.length ? (
                  <Box sx={{ height: 300 }}>
                    <Bar data={categoryChartData} options={barOptions} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: 300,
                      flexDirection: "column",
                      gap: 2,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    <Info fontSize="large" />
                    <Typography>No category data available</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: theme.shadows[2],
                  height: "100%",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.primary,
                    mb: 3,
                    fontWeight: 600,
                  }}
                >
                  Asset Acquisition & Allocation Trends (6 Months)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={assetTrendsChartData} options={lineOptions} />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: theme.shadows[2],
                  height: "100%",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.primary,
                    mb: 3,
                    fontWeight: 600,
                  }}
                >
                  Top Employees with Assets
                </Typography>
                {topEmployees.length > 0 ? (
                  <List>
                    {topEmployees.map((employee, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          px: 0,
                          borderBottom:
                            index < topEmployees.length - 1
                              ? `1px solid ${alpha(theme.palette.divider, 0.5)}`
                              : "none",
                          py: 1.5,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                index === 0
                                  ? theme.palette.success.light
                                  : index === 1
                                  ? theme.palette.primary.light
                                  : index === 2
                                  ? theme.palette.warning.light
                                  : theme.palette.grey[300],
                            }}
                          >
                            {employee.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              {employee.name}
                            </Typography>
                          }
                          secondary={`${employee.count} asset${
                            employee.count !== 1 ? "s" : ""
                          }`}
                        />
                        <Chip
                          label={`#${index + 1}`}
                          size="small"
                          sx={{
                            bgcolor:
                              index === 0
                                ? alpha(theme.palette.success.main, 0.1)
                                : index === 1
                                ? alpha(theme.palette.primary.main, 0.1)
                                : index === 2
                                ? alpha(theme.palette.warning.main, 0.1)
                                : alpha(theme.palette.grey[500], 0.1),
                            color:
                              index === 0
                                ? theme.palette.success.dark
                                : index === 1
                                ? theme.palette.primary.dark
                                : index === 2
                                ? theme.palette.warning.dark
                                : theme.palette.grey[700],
                            fontWeight: "bold",
                            border: "1px solid",
                            borderColor:
                              index === 0
                                ? alpha(theme.palette.success.main, 0.2)
                                : index === 1
                                ? alpha(theme.palette.primary.main, 0.2)
                                : index === 2
                                ? alpha(theme.palette.warning.main, 0.2)
                                : alpha(theme.palette.grey[500], 0.2),
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: 300,
                      flexDirection: "column",
                      gap: 2,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    <Info fontSize="large" />
                    <Typography>No employee data available</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* Assets Tab Content */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "16px",
                padding: "24px",
                boxShadow: theme.shadows[2],
                transition: "box-shadow 0.3s",
                "&:hover": {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                >
                  Asset Inventory
                </Typography>
              </Box>
              <TableContainer
                sx={{
                  maxHeight: 440,
                  "&::-webkit-scrollbar": {
                    width: "8px",
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: "4px",
                  },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Name
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Category
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Current Employee
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Previous Employees
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assets.slice(0, 10).map((asset) => (
                      <TableRow
                        key={asset._id}
                        sx={{
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.03
                            ),
                          },
                          cursor: "pointer",
                        }}
                      >
                        <TableCell
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                          }}
                        >
                          {asset.name}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={asset.category}
                            size="small"
                            sx={{
                              bgcolor:
                                asset.category === "Hardware"
                                  ? alpha(theme.palette.primary.main, 0.1)
                                  : asset.category === "Software"
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : alpha(theme.palette.warning.main, 0.1),
                              color:
                                asset.category === "Hardware"
                                  ? theme.palette.primary.dark
                                  : asset.category === "Software"
                                  ? theme.palette.success.dark
                                  : theme.palette.warning.dark,
                              fontWeight: 500,
                              border: "1px solid",
                              borderColor:
                                asset.category === "Hardware"
                                  ? alpha(theme.palette.primary.main, 0.2)
                                  : asset.category === "Software"
                                  ? alpha(theme.palette.success.main, 0.2)
                                  : alpha(theme.palette.warning.main, 0.2),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={asset.status}
                            size="small"
                            sx={{
                              bgcolor:
                                asset.status === "Available"
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : asset.status === "In Use"
                                  ? alpha(theme.palette.primary.main, 0.1)
                                  : alpha(theme.palette.error.main, 0.1),
                              color:
                                asset.status === "Available"
                                  ? theme.palette.success.dark
                                  : asset.status === "In Use"
                                  ? theme.palette.primary.dark
                                  : theme.palette.error.dark,
                              fontWeight: 500,
                              border: "1px solid",
                              borderColor:
                                asset.status === "Available"
                                  ? alpha(theme.palette.success.main, 0.2)
                                  : asset.status === "In Use"
                                  ? alpha(theme.palette.primary.main, 0.2)
                                  : alpha(theme.palette.error.main, 0.2),
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            color: asset.currentEmployee
                              ? theme.palette.primary.main
                              : theme.palette.text.secondary,
                            fontWeight: asset.currentEmployee ? 500 : 400,
                          }}
                        >
                          {asset.currentEmployee || "None"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.secondary }}>
                          {asset.previousEmployees &&
                          asset.previousEmployees.length > 0
                            ? asset.previousEmployees.join(", ")
                            : "None"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {assets.length > 10 && (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 500,
                      boxShadow: theme.shadows[2],
                      "&:hover": {
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    View All Assets
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "16px",
                padding: "24px",
                boxShadow: theme.shadows[2],
                height: "100%",
                transition: "box-shadow 0.3s",
                "&:hover": {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                Asset Status Overview
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie data={statusChartData} options={pieOptions} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "16px",
                padding: "24px",
                boxShadow: theme.shadows[2],
                height: "100%",
                transition: "box-shadow 0.3s",
                "&:hover": {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                Asset Category Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut
                  data={{
                    labels: dashboardSummary.categoryDistribution.map(
                      (cat) => cat.category
                    ),
                    datasets: [
                      {
                        data: dashboardSummary.categoryDistribution.map(
                          (cat) => cat.count
                        ),
                        backgroundColor: [
                          theme.palette.success.main,
                          theme.palette.primary.main,
                          theme.palette.warning.main,
                          theme.palette.error.main,
                          theme.palette.secondary.main,
                          theme.palette.info.main,
                        ],
                        borderWidth: 1,
                        borderColor: theme.palette.background.paper,
                      },
                    ],
                  }}
                  options={pieOptions}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Batches Tab Content */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "16px",
                padding: "24px",
                boxShadow: theme.shadows[2],
                transition: "box-shadow 0.3s",
                "&:hover": {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                >
                  Asset Batches
                </Typography>
              </Box>
              <TableContainer
                sx={{
                  maxHeight: 440,
                  "&::-webkit-scrollbar": {
                    width: "8px",
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: "4px",
                  },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Batch Number
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Purchase Date
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Number of Assets
                      </TableCell>
                      {/* <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Vendor
                      </TableCell> */}
                      {/* <TableCell
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                        }}
                      >
                        Total Cost
                      </TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assetBatches.map((batch) => (
                      <TableRow
                        key={batch._id}
                        sx={{
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.03
                            ),
                          },
                          cursor: "pointer",
                        }}
                      >
                        <TableCell
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                          }}
                        >
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.secondary }}>
                          {new Date(batch.purchaseDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                          }}
                        >
                          {batch.numberOfAssets}
                        </TableCell>
                        {/* <TableCell sx={{ color: theme.palette.text.secondary }}>
                          {batch.vendor}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.success.main,
                            fontWeight: 500,
                          }}
                        >
                          $
                          {batch.totalCost
                            ? batch.totalCost.toFixed(2)
                            : "0.00"}
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "16px",
                padding: "24px",
                boxShadow: theme.shadows[2],
                height: "100%",
                transition: "box-shadow 0.3s",
                "&:hover": {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                Batch Size Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut data={batchDistributionData} options={pieOptions} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "16px",
                padding: "24px",
                boxShadow: theme.shadows[2],
                height: "100%",
                transition: "box-shadow 0.3s",
                "&:hover": {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                Batch Purchase Timeline
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={{
                    labels: assetBatches.map((batch) =>
                      new Date(batch.purchaseDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    ),
                    datasets: [
                      {
                        label: "Assets Purchased",
                        data: assetBatches.map((batch) => batch.numberOfAssets),
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        tension: 0.4,
                        fill: true,
                      },
                    ],
                  }}
                  options={lineOptions}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: "16px",
                padding: "24px",
                boxShadow: theme.shadows[2],
                transition: "box-shadow 0.3s",
                "&:hover": {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                Batch Acquisition Summary
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card
                    sx={{
                      borderRadius: "12px",
                      boxShadow: "none",
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      height: "100%",
                      p: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ color: theme.palette.text.secondary, mb: 1 }}
                    >
                      Total Batches
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      }}
                    >
                      {assetBatches.length}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card
                    sx={{
                      borderRadius: "12px",
                      boxShadow: "none",
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      height: "100%",
                      p: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ color: theme.palette.text.secondary, mb: 1 }}
                    >
                      Total Assets Acquired
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      }}
                    >
                      {assetBatches.reduce(
                        (sum, batch) => sum + (batch.numberOfAssets || 0),
                        0
                      )}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  {/* <Card
                    sx={{
                      borderRadius: "12px",
                      boxShadow: "none",
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      height: "100%",
                      p: 2,
                    }}
                  >
                    {/* <Typography
                      variant="subtitle2"
                      sx={{ color: theme.palette.text.secondary, mb: 1 }}
                    >
                      Total Investment
                    </Typography> 
                    <Typography
                      variant="h4"
                      sx={{
                        color: theme.palette.success.main,
                        fontWeight: 600,
                      }}
                    >
                      $
                      {assetBatches
                        .reduce((sum, batch) => sum + (batch.totalCost || 0), 0)
                        .toFixed(2)}
                    </Typography>
                  </Card> */}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Footer */}
      <Box
        sx={{
          mt: 4,
          pt: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          textAlign: "center",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          © {new Date().getFullYear()} DB4Cloud Technologies Pvt Ltd. All rights
          reserved.
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.disabled, mt: 0.5, display: "block" }}
        >
          Asset Management Dashboard v1.0
        </Typography>
      </Box>
    </Box>
  );
};

export default AssetDashboard;
