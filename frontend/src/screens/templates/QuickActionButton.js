import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Add Redux hook
import { selectUserRole, selectUser } from "../../redux/authSlice"; // Import selectors
import { motion, AnimatePresence } from "framer-motion";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import { styled } from "@mui/material/styles";

// Icons
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WorkIcon from "@mui/icons-material/Work";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import BarChartIcon from "@mui/icons-material/BarChart";
import CloseIcon from "@mui/icons-material/Close";

// Simple wrapper that filters out all Material-UI specific props
const MotionWrapper = React.forwardRef(({ children, ...props }, ref) => {
  // Filter out any props that shouldn't go to DOM elements
  const {
    ownerState,
    theme,
    sx,
    component,
    variant,
    color,
    size,
    ...cleanProps
  } = props;
  
  return <div ref={ref} {...cleanProps}>{children}</div>;
});
MotionWrapper.displayName = 'MotionWrapper';

const StyledSpeedDial = styled(SpeedDial, {
  shouldForwardProp: (prop) => prop !== "ownerState",
})(({ theme }) => ({
  position: "fixed",
  bottom: 24,
  right: 24,
  "& .MuiFab-primary": {
    width: 65,
    height: 65,
    background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
    "&:hover": {
      background: "linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)",
    },
    boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
  },
}));

const StyledSpeedDialAction = styled(SpeedDialAction, {
  shouldForwardProp: (prop) => prop !== "ownerState",
})(({ theme }) => ({
  "& .MuiFab-primary": {
    background: "#fff",
    "&:hover": {
      background: "#f5f5f5",
    },
  },
  "& .MuiSpeedDialAction-staticTooltip": {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "#fff",
    fontSize: "14px",
    padding: "6px 12px",
    borderRadius: "4px",
    position: "absolute",
    right: "100%",
    marginRight: "10px",
    whiteSpace: "nowrap",
  },
  "& .MuiSpeedDialAction-fab": {
    margin: "8px",
    transition: "all 0.3s ease",
  },
}));

// Define all available actions
const allActions = [
  {
    icon: <PersonAddIcon />,
    name: "Employee",
    path: "/Dashboards/employees",
    color: "#4CAF50",
    roles: ["admin", "hr", "manager"],
  },
  {
    icon: <EventIcon />,
    name: "Leave",
    path: "/Dashboards/my-leave-requests",
    color: "#2196F3",
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    icon: <AccessTimeIcon />,
    name: "Attendance",
    path: "/Dashboards/attendance-records",
    color: "#9C27B0",
    roles: ["admin", "hr"],
  },
  {
    icon: <WorkIcon />,
    name: "Recruitment",
    path: "/Dashboards/recruitment-dashboard",
    color: "#FF9800",
    roles: ["admin", "hr"],
  },
  {
    icon: <AttachMoneyIcon />,
    name: "Payroll",
    path: "/Dashboards/payroll-dashboard",
    color: "#F44336",
    roles: ["admin", "hr"],
  },
  {
    icon: <LaptopMacIcon />,
    name: "Assets",
    path: "/Dashboards/assets-dashboard",
    color: "#3F51B5",
    roles: ["admin", "hr"],
  },
  {
    icon: <LocalOfferIcon />,
    name: "Help Desk",
    path: "/Dashboards/faq-category",
    color: "#009688",
    roles: ["admin", "hr", "manager", "employee"],
  },
  {
    icon: <BarChartIcon />,
    name: "Performance",
    path: "/Dashboards/performance-dashboard",
    color: "#795548",
    roles: ["admin", "hr", "manager", "employee"],
  },
];

const QuickActionButton = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Get user role from Redux store
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectUser);

  // Fallback to localStorage if Redux doesn't have the role
  const getUserRole = () => {
    if (userRole) return userRole;
    return localStorage.getItem("userRole") || "employee";
  };

  // Filter actions based on user role
  const getActionsForRole = (role) => {
    console.log("Current user role:", role); // Debug log

    switch (role) {
      case "employee":
        return allActions.filter((action) =>
          ["Leave", "Help Desk", "Performance"].includes(action.name)
        );

      case "manager":
        return allActions.filter((action) =>
          ["Leave", "Employee", "Help Desk", "Performance"].includes(
            action.name
          )
        );

      case "hr":
      case "admin":
        return allActions; // Show all actions for admin and hr

      default:
        // Default to employee permissions if role is not recognized
        return allActions.filter((action) =>
          ["Leave", "Help Desk", "Performance"].includes(action.name)
        );
    }
  };

  const currentUserRole = getUserRole();
  const actions = getActionsForRole(currentUserRole);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  // Don't render if no actions are available for the user
  if (!actions || actions.length === 0) {
    console.warn("No actions available for user role:", currentUserRole);
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ duration: 0.3 }}
      >
        <StyledSpeedDial
          ariaLabel="Quick Actions"
          icon={<SpeedDialIcon openIcon={<CloseIcon />} />}
          onClose={handleClose}
          onOpen={handleOpen}
          open={open}
          direction="up"
        >
          {actions.map((action) => (
            <StyledSpeedDialAction
              key={action.name}
              icon={
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ color: action.color }}
                >
                  {action.icon}
                </motion.div>
              }
              tooltipTitle={action.name}
              onClick={() => handleNavigation(action.path)}
              FabProps={{
                sx: {
                  bgcolor: "white",
                  "&:hover": {
                    bgcolor: "#f5f5f5",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.3s ease",
                },
              }}
            />
          ))}
        </StyledSpeedDial>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickActionButton;

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import SpeedDial from '@mui/material/SpeedDial';
// import SpeedDialAction from '@mui/material/SpeedDialAction';
// import SpeedDialIcon from '@mui/material/SpeedDialIcon';
// import { styled } from '@mui/material/styles';

// // Icons
// import PersonAddIcon from '@mui/icons-material/PersonAdd';
// import EventIcon from '@mui/icons-material/Event';
// import AccessTimeIcon from '@mui/icons-material/AccessTime';
// import WorkIcon from '@mui/icons-material/Work';
// import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
// import LaptopMacIcon from '@mui/icons-material/LaptopMac';
// import LocalOfferIcon from '@mui/icons-material/LocalOffer';
// import BarChartIcon from '@mui/icons-material/BarChart';
// import CloseIcon from '@mui/icons-material/Close';

// const StyledSpeedDial = styled(SpeedDial)(({ theme }) => ({
//   position: 'fixed',
//   bottom: 24,
//   right: 24,
//   '& .MuiFab-primary': {
//     width: 65,
//     height: 65,
//     background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
//     '&:hover': {
//       background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
//     },
//     boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
//   },
// }));

// const StyledSpeedDialAction = styled(SpeedDialAction)(({ theme }) => ({
//   '& .MuiFab-primary': {
//     background: '#fff',
//     '&:hover': {
//       background: '#f5f5f5',
//     },
//   },
//   '& .MuiSpeedDialAction-staticTooltip': {
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     color: '#fff',
//     fontSize: '14px',
//     padding: '6px 12px',
//     borderRadius: '4px',
//     position: 'absolute',
//     right: '100%',
//     marginRight: '10px',
//     whiteSpace: 'nowrap',
//   },
//   '& .MuiSpeedDialAction-fab': {
//     margin: '8px',
//     transition: 'all 0.3s ease',
//   }
// }));

// const actions = [
//   { icon: <PersonAddIcon />, name: 'Employee', path: '/Dashboards/employees', color: '#4CAF50' },
//   { icon: <EventIcon />, name: 'Leave', path: '/Dashboards/my-leave-requests', color: '#2196F3' },
//   { icon: <AccessTimeIcon />, name: 'Attendance', path: '/Dashboards/attendance-records', color: '#9C27B0' },
//   { icon: <WorkIcon />, name: 'Recruitment', path: '/Dashboards/recruitment-dashboard', color: '#FF9800' },
//   { icon: <AttachMoneyIcon />, name: 'Payroll', path: '/Dashboards/payroll-dashboard', color: '#F44336' },
//   { icon: <LaptopMacIcon />, name: 'Assets', path: '/Dashboards/assets-dashboard', color: '#3F51B5' },
//   { icon: <LocalOfferIcon />, name: 'Help Desk', path: '/Dashboards/faq-category', color: '#009688' },
//   { icon: <BarChartIcon />, name: 'Performance', path: '/Dashboards/performance-dashboard', color: '#795548' },
// ];

// const QuickActionButton = () => {
//   const [open, setOpen] = useState(false);
//   const navigate = useNavigate();

//   const handleOpen = () => setOpen(true);
//   const handleClose = () => setOpen(false);

//   const handleNavigation = (path) => {
//     navigate(path);
//     handleClose();
//   };

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ scale: 0 }}
//         animate={{ scale: 1 }}
//         exit={{ scale: 0 }}
//         transition={{ duration: 0.3 }}
//       >
//         <StyledSpeedDial
//           ariaLabel="Quick Actions"
//           icon={<SpeedDialIcon openIcon={<CloseIcon />} />}
//           onClose={handleClose}
//           onOpen={handleOpen}
//           open={open}
//           direction="up"
//           TransitionComponent={motion.div}
//         >
//           {actions.map((action) => (
//             <StyledSpeedDialAction
//               key={action.name}
//               icon={
//                 <motion.div
//                   whileHover={{ scale: 1.2 }}
//                   whileTap={{ scale: 0.9 }}
//                   style={{ color: action.color }}
//                 >
//                   {action.icon}
//                 </motion.div>
//               }
//               tooltipTitle={action.name}
//               onClick={() => handleNavigation(action.path)}
//               FabProps={{
//                 sx: {
//                   bgcolor: 'white',
//                   '&:hover': {
//                     bgcolor: '#f5f5f5',
//                     transform: 'scale(1.1)',
//                   },
//                   transition: 'all 0.3s ease',
//                 }
//               }}
//             />
//           ))}
//         </StyledSpeedDial>
//       </motion.div>
//     </AnimatePresence>
//   );
// };

// export default QuickActionButton;
