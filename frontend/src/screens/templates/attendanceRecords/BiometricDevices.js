// import React, { useState, useEffect, useMemo, useRef } from "react";
// import {
//   Box,
//   Typography,
//   TextField,
//   InputAdornment,
//   Button,
//   Grid,
//   Divider,
//   Menu,
//   MenuItem,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Switch,
//   Stack,
// } from "@mui/material";
// import SearchIcon from "@mui/icons-material/Search";
// import FilterListIcon from "@mui/icons-material/FilterList";
// import AddIcon from "@mui/icons-material/Add";
// import MoreVertIcon from "@mui/icons-material/MoreVert";
// import gsap from "gsap";

// // Sample data (replace with API data)
// const initialDevices = [
//   {
//     id: 1,
//     name: "teste",
//     type: "ZKTeco / eSSL Biometric",
//     direction: "System Direction(In/Out) Device",
//     ip: "127.0.0.1",
//     port: "1234",
//     status: "Not-Connected",
//     isLiveCapture: false,
//   },
//   {
//     id: 2,
//     name: "main gate",
//     type: "ZKTeco / eSSL Biometric",
//     direction: "System Direction(In/Out) Device",
//     ip: "127.0.0.1",
//     port: "1234",
//     status: "Not-Connected",
//     isLiveCapture: false,
//   },
//   {
//     id: 3,
//     name: "Bxx",
//     type: "ZKTeco / eSSL Biometric",
//     direction: "System Direction(In/Out) Device",
//     ip: "192.1.68.52",
//     port: "3012",
//     status: "Not-Connected",
//     isLiveCapture: false,
//   },
//   {
//     id: 4,
//     name: "ZKTECO UFACE400",
//     type: "ZKTeco / eSSL Biometric",
//     direction: "System Direction(In/Out) Device",
//     ip: "127.0.0.1",
//     port: "4370",
//     status: "Not-Connected",
//     isLiveCapture: false,
//   },
// ];

// function BiometricDevices() {
//   const [devices, setDevices] = useState(initialDevices);
//   const [search, setSearch] = useState("");
//   const [filterOpen, setFilterOpen] = useState(false);
//   const [addOpen, setAddOpen] = useState(false);
//   const [filters, setFilters] = useState({
//     deviceType: "",
//     isActive: "",
//     isScheduled: "",
//     isLive: "",
//   });
//   const [anchorEl, setAnchorEl] = useState(null);

//   const cardsRef = useRef([]);

//   // GSAP animation on card mount
//   useEffect(() => {
//     gsap.from(cardsRef.current, {
//       y: 50,
//       opacity: 0,
//       duration: 0.6,
//       stagger: 0.1,
//       ease: "power3.out",
//     });
//   }, [devices]);

//   const filteredDevices = useMemo(() => {
//     return devices.filter((d) =>
//       d.name.toLowerCase().includes(search.toLowerCase())
//     );
//   }, [devices, search]);

//   const toggleLiveCapture = (id, value) => {
//     setDevices((prev) =>
//       prev.map((d) => (d.id === id ? { ...d, isLiveCapture: value } : d))
//     );
//   };

//   const handleAddDevice = (e) => {
//     e.preventDefault();
//     const form = new FormData(e.target);
//     const newDevice = {
//       id: Date.now(),
//       name: form.get("name"),
//       type: form.get("deviceType"),
//       direction: form.get("deviceDirection"),
//       ip: form.get("ip") || "127.0.0.1",
//       port: form.get("port") || "0000",
//       status: "Not-Connected",
//       isLiveCapture: false,
//     };
//     setDevices((prev) => [...prev, newDevice]);
//     setAddOpen(false);
//   };

//   return (
//     <Box p={3}>
//       {/* Header */}
//       <Stack
//         direction={{ xs: "column", sm: "row" }}
//         justifyContent="space-between"
//         alignItems={{ xs: "flex-start", sm: "center" }}
//         gap={2}
//         mb={3}
//       >
//         <Typography variant="h5" fontWeight={700}>
//           Biometric Devices
//         </Typography>

//         <Stack direction="row" gap={2}>
//           <TextField
//             size="small"
//             placeholder="Search"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon fontSize="small" />
//                 </InputAdornment>
//               ),
//             }}
//           />
//           <Button
//             variant="outlined"
//             startIcon={<FilterListIcon />}
//             onClick={() => setFilterOpen(true)}
//           >
//             Filter
//           </Button>
//           <Button
//             variant="outlined"
//             endIcon={<MoreVertIcon />}
//             onClick={(e) => setAnchorEl(e.currentTarget)}
//           >
//             Actions
//           </Button>
//           <Menu
//             anchorEl={anchorEl}
//             open={Boolean(anchorEl)}
//             onClose={() => setAnchorEl(null)}
//           >
//             <MenuItem>Bulk Action 1</MenuItem>
//             <MenuItem>Bulk Action 2</MenuItem>
//           </Menu>
//           <Button
//             variant="contained"
//             startIcon={<AddIcon />}
//             onClick={() => setAddOpen(true)}
//           >
//             Add
//           </Button>
//         </Stack>
//       </Stack>

//       {/* Legend */}
//       <Stack direction="row" spacing={3} mb={2}>
//         <Stack direction="row" spacing={1} alignItems="center">
//           <Box
//             sx={{ width: 8, height: 8, bgcolor: "orange", borderRadius: "50%" }}
//           />
//           <Typography variant="body2">Live Capture</Typography>
//         </Stack>
//         <Stack direction="row" spacing={1} alignItems="center">
//           <Box
//             sx={{ width: 8, height: 8, bgcolor: "blue", borderRadius: "50%" }}
//           />
//           <Typography variant="body2">Scheduled</Typography>
//         </Stack>
//         <Stack direction="row" spacing={1} alignItems="center">
//           <Box
//             sx={{ width: 8, height: 8, bgcolor: "red", borderRadius: "50%" }}
//           />
//           <Typography variant="body2">Not-Connected</Typography>
//         </Stack>
//       </Stack>
//       <Divider sx={{ mb: 2 }} />

//       {/* Device Cards */}
//       <Grid container spacing={2}>
//         {filteredDevices.map((device, index) => (
//           <Grid
//             item
//             xs={12}
//             sm={6}
//             md={4}
//             lg={3}
//             key={device.id}
//             ref={(el) => (cardsRef.current[index] = el)}
//           >
//             <Box
//               sx={{
//                 border: "1px solid #ddd",
//                 borderLeft: "4px solid red",
//                 borderRadius: "8px",
//                 p: 2,
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: 1,
//                 transition: "transform 0.3s ease",
//                 "&:hover": {
//                   transform: "scale(1.03)",
//                   boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
//                 },
//               }}
//             >
//               <Typography variant="subtitle1" fontWeight={600}>
//                 {device.name}
//               </Typography>
//               <Typography variant="body2">{device.type}</Typography>
//               <Typography variant="body2">{device.direction}</Typography>
//               <Typography variant="body2">{device.ip}</Typography>
//               <Typography variant="body2">{device.port}</Typography>
//               <Box display="flex" alignItems="center" gap={1} mt={1}>
//                 <Typography variant="body2">
//                   Activate live capture mode
//                 </Typography>
//                 <Switch
//                   size="small"
//                   checked={device.isLiveCapture}
//                   onChange={(e) =>
//                     toggleLiveCapture(device.id, e.target.checked)
//                   }
//                 />
//               </Box>
//               <Stack direction="row" spacing={1} mt={2}>
//                 <Button size="small" variant="outlined">
//                   Test
//                 </Button>
//                 <Button size="small" variant="contained">
//                   Schedule
//                 </Button>
//                 <Button size="small" variant="outlined">
//                   Employee
//                 </Button>
//               </Stack>
//             </Box>
//           </Grid>
//         ))}
//       </Grid>

//       {/* Filter Modal */}
//       <Dialog
//         open={filterOpen}
//         onClose={() => setFilterOpen(false)}
//         maxWidth="sm"
//         fullWidth
//         TransitionProps={{
//           onEnter: (node) => gsap.fromTo(node, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }),
//         }}
//       >
//         <DialogTitle>Biometric Devices</DialogTitle>
//         <DialogContent>
//           <Grid container spacing={2} mt={1}>
//             <Grid item xs={6}>
//               <TextField
//                 select
//                 label="Device Type"
//                 fullWidth
//                 value={filters.deviceType}
//                 onChange={(e) =>
//                   setFilters({ ...filters, deviceType: e.target.value })
//                 }
//               >
//                 <MenuItem value="">---------</MenuItem>
//                 <MenuItem value="ZKTeco">ZKTeco</MenuItem>
//                 <MenuItem value="eSSL">eSSL</MenuItem>
//               </TextField>
//             </Grid>
//             <Grid item xs={6}>
//               <TextField
//                 select
//                 label="Is Active"
//                 fullWidth
//                 value={filters.isActive}
//                 onChange={(e) =>
//                   setFilters({ ...filters, isActive: e.target.value })
//                 }
//               >
//                 <MenuItem value="">Unknown</MenuItem>
//                 <MenuItem value="true">Yes</MenuItem>
//                 <MenuItem value="false">No</MenuItem>
//               </TextField>
//             </Grid>
//             <Grid item xs={6}>
//               <TextField
//                 select
//                 label="Is Scheduled"
//                 fullWidth
//                 value={filters.isScheduled}
//                 onChange={(e) =>
//                   setFilters({ ...filters, isScheduled: e.target.value })
//                 }
//               >
//                 <MenuItem value="">Unknown</MenuItem>
//                 <MenuItem value="true">Yes</MenuItem>
//                 <MenuItem value="false">No</MenuItem>
//               </TextField>
//             </Grid>
//             <Grid item xs={6}>
//               <TextField
//                 select
//                 label="Is Live"
//                 fullWidth
//                 value={filters.isLive}
//                 onChange={(e) =>
//                   setFilters({ ...filters, isLive: e.target.value })
//                 }
//               >
//                 <MenuItem value="">Unknown</MenuItem>
//                 <MenuItem value="true">Yes</MenuItem>
//                 <MenuItem value="false">No</MenuItem>
//               </TextField>
//             </Grid>
//           </Grid>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setFilterOpen(false)}>Cancel</Button>
//           <Button variant="contained" onClick={() => setFilterOpen(false)}>
//             Filter
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Add Device Modal */}
//       <Dialog
//         open={addOpen}
//         onClose={() => setAddOpen(false)}
//         maxWidth="sm"
//         fullWidth
//         TransitionProps={{
//           onEnter: (node) => gsap.fromTo(node, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }),
//         }}
//       >
//         <form onSubmit={handleAddDevice}>
//           <DialogTitle>Add Biometric Device</DialogTitle>
//           <DialogContent>
//             <Grid container spacing={2} mt={1}>
//               <Grid item xs={12}>
//                 <TextField name="name" label="Name" fullWidth required />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   name="deviceType"
//                   label="Device Type"
//                   fullWidth
//                   select
//                   required
//                 >
//                   <MenuItem value="">---------</MenuItem>
//                   <MenuItem value="ZKTeco">ZKTeco</MenuItem>
//                   <MenuItem value="eSSL">eSSL</MenuItem>
//                 </TextField>
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   name="deviceDirection"
//                   label="Device Direction"
//                   fullWidth
//                   defaultValue="System Direction(In/Out) Device"
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField
//                   name="company"
//                   label="Company"
//                   fullWidth
//                   defaultValue="AttenDeep"
//                 />
//               </Grid>
//               <Grid item xs={6}>
//                 <TextField name="ip" label="IP Address" fullWidth />
//               </Grid>
//               <Grid item xs={6}>
//                 <TextField name="port" label="Port" fullWidth />
//               </Grid>
//             </Grid>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setAddOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained">
//               Save
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>
//     </Box>
//   );
// }

// export default BiometricDevices;

//Updated Frontend  
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import gsap from "gsap";

// Sample data (can be replaced with API)
const initialDevices = [
  {
    id: 1,
    name: "teste",
    type: "ZKTeco / eSSL Biometric",
    direction: "System Direction(In/Out) Device",
    ip: "127.0.0.1",
    port: "1234",
    status: "Not-Connected",
    isLiveCapture: false,
  },
  {
    id: 2,
    name: "main gate",
    type: "ZKTeco / eSSL Biometric",
    direction: "System Direction(In/Out) Device",
    ip: "127.0.0.1",
    port: "1234",
    status: "Not-Connected",
    isLiveCapture: false,
  },
  {
    id: 3,
    name: "Bxx",
    type: "ZKTeco / eSSL Biometric",
    direction: "System Direction(In/Out) Device",
    ip: "192.1.68.52",
    port: "3012",
    status: "Not-Connected",
    isLiveCapture: false,
  },
  {
    id: 4,
    name: "ZKTECO UFACE400",
    type: "ZKTeco / eSSL Biometric",
    direction: "System Direction(In/Out) Device",
    ip: "127.0.0.1",
    port: "4370",
    status: "Not-Connected",
    isLiveCapture: false,
  },
];

function BiometricDevices() {
  const [devices, setDevices] = useState(initialDevices);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState({
    deviceType: "",
    isActive: "",
    isScheduled: "",
    isLive: "",
  });
  const [anchorEl, setAnchorEl] = useState(null);

  const cardsRef = useRef([]);

  useEffect(() => {
    gsap.from(cardsRef.current, {
      y: 40,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out",
    });
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [devices, search]);

  const toggleLiveCapture = (id, value) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isLiveCapture: value } : d))
    );
  };

  const handleAddDevice = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const newDevice = {
      id: Date.now(),
      name: form.get("name"),
      type: form.get("deviceType"),
      direction: form.get("deviceDirection"),
      ip: form.get("ip") || "127.0.0.1",
      port: form.get("port") || "0000",
      company: form.get("company"),
      status: "Not-Connected",
      isLiveCapture: false,
    };
    setDevices((prev) => [...prev, newDevice]);
    setAddOpen(false);
  };

  return (
    <Box p={3} sx={{ background: "#f9f9f9", minHeight: "100vh" }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={3}
      >
        <Typography variant="h4" fontWeight={700} color="primary">
          Biometric Devices
        </Typography>

        <Stack direction="row" gap={2}>
          <TextField
            size="small"
            placeholder="Search device"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterOpen(true)}
          >
            Filter
          </Button>
          <Button
            variant="outlined"
            endIcon={<MoreVertIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            Actions
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => alert("Fetching logs...")}>
              Fetch Logs
            </MenuItem>
          </Menu>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddOpen(true)}
          >
            Add
          </Button>
        </Stack>
      </Stack>

      {/* Legend */}
      <Stack direction="row" spacing={3} mb={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, bgcolor: "orange", borderRadius: "50%" }} />
          <Typography variant="body2">Live Capture</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, bgcolor: "blue", borderRadius: "50%" }} />
          <Typography variant="body2">Scheduled</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, bgcolor: "red", borderRadius: "50%" }} />
          <Typography variant="body2">Not-Connected</Typography>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {/* Device Cards */}
      <Grid container spacing={2}>
        {filteredDevices.map((device, index) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            key={device.id}
            ref={(el) => (cardsRef.current[index] = el)}
          >
            <Box
              sx={{
                background: "#fff",
                borderRadius: "10px",
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                },
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {device.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {device.type}
              </Typography>
              <Typography variant="body2">{device.direction}</Typography>
              <Typography variant="body2">IP: {device.ip}</Typography>
              <Typography variant="body2">Port: {device.port}</Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Typography variant="body2">Live Capture Mode</Typography>
                <Switch
                  size="small"
                  checked={device.isLiveCapture}
                  onChange={(e) =>
                    toggleLiveCapture(device.id, e.target.checked)
                  }
                />
              </Box>
              <Stack direction="row" spacing={1} mt={2}>
                <Button size="small" variant="outlined">
                  Test
                </Button>
                <Button size="small" variant="contained">
                  Schedule
                </Button>
                <Button size="small" variant="outlined">
                  Employee
                </Button>
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Filter Modal */}
      <Dialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Devices</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}>
              <TextField
                select
                label="Device Type"
                fullWidth
                value={filters.deviceType}
                onChange={(e) =>
                  setFilters({ ...filters, deviceType: e.target.value })
                }
              >
                <MenuItem value="">---------</MenuItem>
                <MenuItem value="ZKTeco">ZKTeco</MenuItem>
                <MenuItem value="eSSL">eSSL</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Is Active"
                fullWidth
                value={filters.isActive}
                onChange={(e) =>
                  setFilters({ ...filters, isActive: e.target.value })
                }
              >
                <MenuItem value="">Unknown</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Is Scheduled"
                fullWidth
                value={filters.isScheduled}
                onChange={(e) =>
                  setFilters({ ...filters, isScheduled: e.target.value })
                }
              >
                <MenuItem value="">Unknown</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Is Live"
                fullWidth
                value={filters.isLive}
                onChange={(e) =>
                  setFilters({ ...filters, isLive: e.target.value })
                }
              >
                <MenuItem value="">Unknown</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setFilterOpen(false)}>
            Apply Filter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Device Modal */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAddDevice}>
          <DialogTitle>Add Biometric Device</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} mt={1}>
              <Grid item xs={12}>
                <TextField name="name" label="Name" fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField name="deviceType" label="Device Type" fullWidth select required>
                  <MenuItem value="">---------</MenuItem>
                  <MenuItem value="ZKTeco">ZKTeco</MenuItem>
                  <MenuItem value="eSSL">eSSL</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField name="deviceDirection" label="Device Direction" fullWidth select>
                  <MenuItem value="System Direction(In/Out) Device">
                    System Direction(In/Out) Device
                  </MenuItem>
                  <MenuItem value="In Only">In Only</MenuItem>
                  <MenuItem value="Out Only">Out Only</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField name="company" label="Company" fullWidth select defaultValue="AttenDeep">
                  <MenuItem value="AttenDeep">AttenDeep</MenuItem>
                  <MenuItem value="FaceScan Ltd">FaceScan Ltd</MenuItem>
                  <MenuItem value="Biometrics Co">Biometrics Co</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField name="ip" label="IP Address" fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField name="port" label="Port" fullWidth />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default BiometricDevices;
