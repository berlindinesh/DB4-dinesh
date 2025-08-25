import React, { useState, useEffect, useRef, useCallback } from "react";
import api, { getAssetUrl } from "../api/axiosInstance";
import {
  Container,
  Navbar,
  Nav,
  NavDropdown,
  Button,
  Badge,
  Toast,
  Spinner,
} from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../redux/authSlice";
import {
  FaBars,
  FaBell,
  FaCog,
  FaUserCircle,
  FaSignOutAlt,
  FaSignInAlt,
  FaHome,
} from "react-icons/fa";
import { timesheetService } from "../services/timesheetService";
import "./Header.css";
import { useSidebar } from "../Context";
import NotificationSidebar from "./NotificationSidebar";
import { useNotifications } from "../context/NotificationContext";

// Utility Components
const ProfileImage = ({ imageUrl, initials }) => (
  <>
    <img
      src={imageUrl}
      alt="Profile"
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "1px solid white",
      }}
      onError={(e) => {
        e.target.style.display = "none";
        e.target.nextSibling.style.display = "flex";
      }}
    />
    <div
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        backgroundColor: "#6366f1",
        color: "white",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold",
        border: "1px solid white",
      }}
    >
      {initials}
    </div>
  </>
);

const TimerButtonContent = ({ isLoading, isTimerRunning, timer, formatTime }) => {
  if (isLoading) {
    return <Spinner animation="border" size="sm" />;
  }
  return isTimerRunning ? (
    <>
      <div className="timer-icon-container">
        <FaSignOutAlt className="timer-icon rotate" />
      </div>
      <div className="timer-content">
        <span className="timer-label">Check-out</span>
        <span className="timer-value">{formatTime(timer)}</span>
      </div>
    </>
  ) : (
    <>
      <div className="timer-icon-container">
        <FaSignInAlt className="timer-icon beat" />
      </div>
      <div className="timer-content">
        <span className="timer-label">Check-in</span>
      </div>
    </>
  );
};
// Custom hooks
const useProfileMenu = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const handleProfileToggle = useCallback((e) => {
    e.stopPropagation();
    setShowProfileMenu(prev => !prev);
  }, []);

  const closeProfileMenu = useCallback(() => {
    setShowProfileMenu(false);
  }, []);

  return {
    showProfileMenu,
    profileMenuRef,
    handleProfileToggle,
    closeProfileMenu
  };
};

const useTimesheet = (employeeId, token) => {
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const timerIntervalRef = useRef(null);
  const timerStartTimeRef = useRef(null);

  const startTimerWithTime = useCallback((checkInTime) => {
    setStartTime(checkInTime);
    setIsTimerRunning(true);
    timerStartTimeRef.current = checkInTime;
    localStorage.setItem("checkInTime", checkInTime.toISOString());
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      const currentTime = new Date();
      const elapsedSeconds = Math.floor((currentTime - checkInTime) / 1000);
      setTimer(elapsedSeconds);
    }, 1000);
  }, []);

  const cleanupTimesheet = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  }, []);

  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    timer,
    isTimerRunning,
    startTime,
    isLoading,
    setIsLoading,
    startTimerWithTime,
    cleanupTimesheet,
    formatTime,
    setIsTimerRunning,
    setTimer,
    setStartTime
  };
};

// Utility functions
const getUserDisplayName = (profileData, employeeId) => {
  if (profileData?.personalInfo) {
    const { firstName, lastName } = profileData.personalInfo;
    return `${firstName || ""} ${lastName || ""}`.trim() || employeeId;
  }
  return employeeId;
};

const getUserInitials = (profileData, employeeId) => {
  if (profileData?.personalInfo) {
    const { firstName, lastName } = profileData.personalInfo;
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial;
  }
  return employeeId ? employeeId.charAt(0).toUpperCase() : "U";
};
const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { getUserUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // State management
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showNotificationSidebar, setShowNotificationSidebar] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [navExpanded, setNavExpanded] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(
    "https://res.cloudinary.com/dfl9rotoy/image/upload/v1741065300/logo2-removebg-preview_p6juhh.png"
  );
  const [logoLoading, setLogoLoading] = useState(false);

  const navbarCollapseRef = useRef(null);
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const employeeId = profileData?.Emp_ID || localStorage.getItem("employeeId") || "EMP123";

  // Custom hooks
  const {
    showProfileMenu,
    profileMenuRef,
    handleProfileToggle,
    closeProfileMenu
  } = useProfileMenu();

  const {
    timer,
    isTimerRunning,
    isLoading,
    startTimerWithTime,
    cleanupTimesheet,
    formatTime,
    setIsLoading,
    setIsTimerRunning,
    setTimer,
    setStartTime
  } = useTimesheet(employeeId, token);

  const userUnreadCount = getUserUnreadCount(userId);

  // Toast message handler
  const showToastMessage = useCallback((message) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  // Profile image handler
  const getProfileImageUrl = useCallback(() => {
    if (profileData?.personalInfo?.employeeImage) {
      return getAssetUrl(profileData.personalInfo.employeeImage);
    }
    return null;
  }, [profileData]);

  // Navigation handlers
  const handleNavToggle = useCallback(() => {
    setNavExpanded(prev => !prev);
    if (navExpanded) {
      closeProfileMenu();
    }
  }, [navExpanded, closeProfileMenu]);

  const closeNavbar = useCallback(() => {
    setNavExpanded(false);
    const navbarCollapse = document.querySelector(".navbar-collapse");
    if (navbarCollapse?.classList.contains("show")) {
      const navbarToggler = document.querySelector(".navbar-toggler");
      navbarToggler?.click();
    }
  }, []);
  // Timer and timesheet handlers
  const handleTimerClick = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const employeeName = getUserDisplayName(profileData, employeeId);
      
      if (isTimerRunning) {
        const checkOutTime = new Date();
        const durationInSeconds = Math.floor((checkOutTime - new Date(startTime)) / 1000);
        await timesheetService.checkOut(employeeId, durationInSeconds, token);
        cleanupTimesheet();
        setIsTimerRunning(false);
        setTimer(0);
        setStartTime(null);
        localStorage.removeItem("checkInTime");
        showToastMessage("Successfully logged out");
      } else {
        try {
          const response = await timesheetService.checkIn(employeeId, employeeName, token);
          startTimerWithTime(new Date(response.data.checkInTime));
          showToastMessage(response.data.warning || "Successfully logged in");
        } catch (error) {
          if (error.response?.status === 400 && error.response?.data?.message === "Already checked in") {
            const shouldForceCheckIn = window.confirm(
              "You have an active session. This might be due to an unexpected shutdown. Would you like to start a new session?"
            );
            if (shouldForceCheckIn) {
              const forceResponse = await timesheetService.forceCheckIn(employeeId, employeeName, token);
              startTimerWithTime(new Date(forceResponse.data.checkInTime));
              showToastMessage(forceResponse.data.message || "New session started");
            }
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Timesheet operation failed:", error);
      showToastMessage("Operation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isTimerRunning, startTime, employeeId, token, profileData, cleanupTimesheet, startTimerWithTime, showToastMessage]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      cleanupTimesheet();
      setProfileData(null);
      await dispatch(logoutUser());
      
      // Clear localStorage
      const itemsToClear = ['token', 'employeeId', 'userId', 'checkInTime', 'companyCode', 'tokenExpiry', 'userInfo', 'refreshToken'];
      itemsToClear.forEach(item => localStorage.removeItem(item));
      
      showToastMessage("Successfully logged out");
      navigate("/login", {
        state: { authError: "You have been logged out successfully." },
        replace: true
      });
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      navigate("/login", {
        state: { authError: "Logout completed." },
        replace: true
      });
    }
  }, [cleanupTimesheet, dispatch, navigate, showToastMessage]);

  // Path indicator handler
  const getPathIndicator = useCallback(() => {
    const path = location.pathname.split("/").filter(Boolean);
    
    if (path.includes("reset-password")) {
      return (
        <nav aria-label="breadcrumb">
          <button 
            className="path-link"
            onClick={() => navigate("/")}
            onKeyDown={(e) => e.key === 'Enter' && navigate("/")}
            style={{ cursor: "pointer", color: "#fff", background: "none", border: "none" }}
          >
            Home
          </button>
          {" > Reset Password"}
        </nav>
      );
    }

    return path.map((segment, index) => {
      const displaySegment = segment.split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .substring(0, 20);

      return (
        <span key={`${segment}-${index}`}>
          <button
            className="path-link"
            onClick={() => navigate(`/${path.slice(0, index + 1).join("/")}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/${path.slice(0, index + 1).join("/")}`)}
            style={{ cursor: "pointer", color: "#fff", background: "none", border: "none" }}
          >
            {displaySegment}
          </button>
          {index < path.length - 1 && " > "}
        </span>
      );
    });
  }, [location.pathname, navigate]);

  // Effects
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const initializeTimesheet = async () => {
        try {
          const response = await timesheetService.getTodayTimesheet(employeeId, token);
          const timesheet = response.data.timesheet;
          if (timesheet?.status === "active") {
            startTimerWithTime(new Date(timesheet.checkInTime));
          }
        } catch (error) {
          console.error("Error initializing timesheet:", error);
          showToastMessage("Failed to load timesheet status");
        }
      };
      
      initializeTimesheet();
      return cleanupTimesheet;
    }
  }, [isLoggedIn, employeeId, token, startTimerWithTime, cleanupTimesheet, showToastMessage]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token || !userId) return;
      
      try {
        setProfileLoading(true);
        const response = await api.get(`/employees/by-user/${userId}`);
        if (response.data.success) {
          setProfileData(response.data.data);
          if (response.data.data.Emp_ID) {
            localStorage.setItem("employeeId", response.data.data.Emp_ID);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [token, userId]);

  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (!isLoggedIn) return;
      
      try {
        setLogoLoading(true);
        const response = await api.get("/companies/logo");
        if (response.data?.logoUrl) {
          setCompanyLogo(getAssetUrl(response.data.logoUrl));
        }
      } catch (error) {
        console.error("Error fetching company logo:", error);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchCompanyLogo();
  }, [isLoggedIn]);


  return (
    <>
      {isLoggedIn && (
        <NotificationSidebar
          show={showNotificationSidebar}
          onClose={() => setShowNotificationSidebar(false)}
        />
      )}
      <header className="mb-5">
        <Navbar
          className="custom-navbar"
          expand="lg"
          variant="dark"
          fixed="top"
          expanded={navExpanded}
          onToggle={handleNavToggle}
          ref={navbarCollapseRef}
        >
          <Container fluid>
            {isLoggedIn && (
              <Button 
                variant="link" 
                className="me-3" 
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                <FaBars size={28} color="white" />
              </Button>
            )}
            
            <LinkContainer to="/">
              <Navbar.Brand className="brand">
                {logoLoading ? (
                  <Spinner animation="border" variant="light" size="sm" />
                ) : (
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    className="responsive-logo"
                    style={{
                      width: "auto",
                      maxHeight: "80px",
                      marginLeft: "0",
                      verticalAlign: "middle",
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://res.cloudinary.com/dfl9rotoy/image/upload/v1741065300/logo2-removebg-preview_p6juhh.png";
                    }}
                  />
                )}
              </Navbar.Brand>
            </LinkContainer>

            <div className="path-indicator" role="navigation" aria-label="Breadcrumb">
              {getPathIndicator()}
            </div>

            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav" className="navbar-collapse-container">
              <Nav className="ms-auto align-items-center">
                <div className="d-flex align-items-center">
                  {isLoggedIn && (
                    <div className="check-in-out-box">
                      <Button
                        className={`timer-button ${isTimerRunning ? "active" : ""}`}
                        onClick={handleTimerClick}
                        title={isTimerRunning ? "Click to Check-out" : "Click to Check-in"}
                        aria-label={isTimerRunning ? "Check out" : "Check in"}
                        disabled={isLoading}
                      >
                        <TimerButtonContent 
                          isLoading={isLoading}
                          isTimerRunning={isTimerRunning}
                          timer={timer}
                          formatTime={formatTime}
                        />
                      </Button>
                    </div>
                  )}

                  <Nav.Link
                    className="icon-link ms-3"
                    onClick={() => {
                      navigate("/");
                      closeNavbar();
                    }}
                    aria-label="Home"
                  >
                    <FaHome size={32} />
                  </Nav.Link>

                  {isLoggedIn && (
                    <Nav.Link
                      className="icon-link ms-3 position-relative"
                      onClick={toggleNotificationSidebar}
                      aria-label="Notifications"
                    >
                      <FaBell size={24} />
                      {userUnreadCount > 0 && (
                        <Badge
                          pill
                          bg="danger"
                          className="position-absolute"
                          style={{
                            top: "-5px",
                            right: "-5px",
                            fontSize: "0.6rem",
                            padding: "0.25em 0.4em",
                          }}
                        >
                          {userUnreadCount > 99 ? "99+" : userUnreadCount}
                        </Badge>
                      )}
                    </Nav.Link>
                  )}

                  <div className="profile-dropdown-container">
                    {windowWidth <= 1024 ? (
                      <>
                        <button
                          className="profile-dropdown-toggle"
                          onClick={handleProfileToggle}
                          onKeyDown={(e) => e.key === 'Enter' && handleProfileToggle(e)}
                          aria-label="Toggle profile menu"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            padding: "8px",
                          }}
                        >
                          <ProfileImage 
                            imageUrl={getProfileImageUrl()} 
                            initials={getUserInitials(profileData, employeeId)}
                          />
                        </button>

                        {showProfileMenu && (
                          <div className="custom-dropdown-menu" role="menu">
                            {/* Profile menu items */}
                            {isLoggedIn ? (
                              <>
                                <div className="dropdown-header d-flex align-items-center px-3 py-2">
                                  <strong>{getUserDisplayName(profileData, employeeId)}</strong>
                                  {profileData?.Emp_ID && (
                                    <small className="ms-2 text-muted">({profileData.Emp_ID})</small>
                                  )}
                                </div>
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setShowProfileMenu(false);
                                    closeNavbar();
                                    navigate("/Dashboards/profile");
                                  }}
                                  role="menuitem"
                                >
                                  <FaUserCircle className="me-2" /> My Profile
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    setShowProfileMenu(false);
                                    closeNavbar();
                                    navigate("/auth/change-password");
                                  }}
                                  role="menuitem"
                                >
                                  <FaCog className="me-2" /> Change Password
                                </button>
                                <button
                                  className="dropdown-item logout-item"
                                  onClick={() => {
                                    setShowProfileMenu(false);
                                    closeNavbar();
                                    handleLogout();
                                  }}
                                  role="menuitem"
                                >
                                  <FaSignOutAlt className="me-2" /> Logout
                                </button>
                              </>
                            ) : (
                              <button
                                className="dropdown-item login-item"
                                onClick={() => {
                                  setShowProfileMenu(false);
                                  closeNavbar();
                                  navigate("/login");
                                }}
                                role="menuitem"
                              >
                                <FaSignInAlt className="me-2" /> Login
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <NavDropdown
                        title={
                          <ProfileImage 
                            imageUrl={getProfileImageUrl()} 
                            initials={getUserInitials(profileData, employeeId)}
                          />
                        }
                        id="profile-dropdown"
                        show={showProfileMenu}
                        onClick={handleProfileToggle}
                        ref={profileMenuRef}
                        align="end"
                        className="profile-dropdown ms-3"
                        menuVariant="dark"
                      >
                        {/* Desktop dropdown items */}
                        {/* Similar items as mobile, but using NavDropdown.Item */}
                      </NavDropdown>
                    )}
                  </div>
                </div>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
          }}
        >
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </header>
    </>
  );
};

export default Header;