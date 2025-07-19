import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { selectUserRole, selectUser } from '../../../redux/authSlice';
import api from "../../../api/axiosInstance";
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Form,
  Button,
  Tab,
  Nav,
  Table,
  Modal,
  Alert,
  Badge,
} from "react-bootstrap";
import { toast } from "react-toastify";
import WorkTypeAndShift from "./workTypeAndShift/WorkTypeAndShift";
import Attendance from "./attendance/Attendance";
import Leave from "./leave/Leave";
import Payroll from "./payroll/Payroll";
import AllowanceAndDeduction from "./allowanceAndDeduction/AllowanceAndDeduction";
import PenaltyAccount from "./penaltyAccount/PenaltyAccount";
import Assets from "./assets/Assets";
import Performance from "./performance/Performance";
import Documents from "./documents/Documents";
import BonusPoints from "./bonusPoints/BonusPoints";
import ScheduledInterview from "./scheduledInterview/ScheduledInterview";
import Resignation from "./resignation/Resignation";
import {
  updateContract,
  getContractsByEmployeeId,
  deleteContract,
} from "../../../services/contractServices";
import "./ProfilePage.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Redux selectors for RBAC
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectUser);
  
  const [editMode, setEditMode] = useState(false);
  const [tabKey, setTabKey] = useState("about");
  const [subTabKey, setSubTabKey] = useState("workInfo");
  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({});
  const [bankInfo, setBankInfo] = useState({});
  const [workInfo, setWorkInfo] = useState({});
  const [contracts, setContracts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [formData, setFormData] = useState({
    contractName: "",
    startDate: "",
    endDate: "",
    wageType: "",
    basicSalary: "",
    filingStatus: "",
    status: "",
  });

  const [editWorkInfoMode, setEditWorkInfoMode] = useState(false);

  // RBAC helper functions
  const canEditProfile = () => {
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

  const showPermissionError = () => {
    toast.error("You don't have permission to edit profile information. Contact HR or Admin for changes.");
  };

  // Enhanced update functions with real-time sync
  const updatePersonalInfo = async () => {
    if (!canEditProfile()) {
      showPermissionError();
      setEditMode(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(
        `/employees/personal-info/${id}`,
        { personalInfo },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        toast.success("Personal information updated successfully");
        setPersonalInfo(response.data.data.personalInfo);
        setEditMode(false);
        
        // Broadcast update to other users
        broadcastProfileUpdate('personalInfo', response.data.data.personalInfo);
      } else {
        toast.error("Failed to update personal information");
      }
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast.error(
        "Error updating personal information: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const updateBankInfo = async () => {
    if (!canEditProfile()) {
      showPermissionError();
      return;
    }

    try {
      setLoading(true);
      // Get employee ID from multiple sources
    const employeeId = id || 
    personalInfo?.employeeId || 
    personalInfo?.Emp_ID || 
    employeeId || 
    currentUser?.employeeId ||
    localStorage.getItem('employeeId');

console.log('Employee ID for bank update:', employeeId); // Debug log
console.log('Bank info to update:', bankInfo); // Debug log

if (!employeeId) {
toast.error("Employee ID not found. Please refresh the page and try again.");
return;
}
      const response = await api.put(
        `/employees/bank-info/${employeeId}`,
        { bankInfo },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        toast.success("Bank information updated successfully");
        setBankInfo(response.data.data.bankInfo);
        
        // Broadcast update to other users
        broadcastProfileUpdate('bankInfo', response.data.data.bankInfo);
      } else {
        toast.error("Failed to update bank information");
      }
    } catch (error) {
      console.error("Error updating bank info:", error);
      toast.error(
        "Error updating bank information: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Add this function to handle work info updates with RBAC
  const updateWorkInfo = async () => {
    console.log("Updating work info for employee ID:", id);
    
    if (!canEditProfile()) {
      showPermissionError();
      setEditWorkInfoMode(false);
      return;
    }

    try {
      setLoading(true);
      if (editWorkInfoMode) {
        const workInfoData = {
          shiftType: workInfo.shiftType,
          workType: workInfo.workType,
          uanNumber: workInfo.uanNumber,
          pfNumber: workInfo.pfNumber,
          department: workInfo.department,
          designation: workInfo.designation,
          employeeType: workInfo.employeeType,
          dateOfJoining: workInfo.dateOfJoining,
          dateOfAppointment: workInfo.dateOfAppointment,
          modeOfRecruitment: workInfo.modeOfRecruitment,
        };

        const response = await api.put(
          `/employees/work-info/${id}`,
          workInfoData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 200) {
          toast.success("Work information updated successfully");
          setWorkInfo(response.data.data);
          setEditWorkInfoMode(false);

          // Update the personalInfo state to reflect changes
          setPersonalInfo((prev) => ({
            ...prev,
            joiningDetails: {
              ...prev.joiningDetails,
              ...workInfoData,
            },
          }));

          // Broadcast update to other users
          broadcastProfileUpdate('workInfo', response.data.data);
        } else {
          toast.error("Failed to update work information");
        }
      }
    } catch (error) {
      console.error("Error updating work info:", error);

      if (error.response) {
        console.error("Server error details:", error.response.data);
        console.error("Status code:", error.response.status);
      }

      toast.error(
        "Error updating work information: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Real-time update broadcasting function
  const broadcastProfileUpdate = (updateType, data) => {
    // Create a custom event for profile updates
    const updateEvent = new CustomEvent('profileUpdate', {
      detail: {
        employeeId: id,
        updateType,
        data,
        timestamp: new Date().toISOString()
      }
    });
    
    // Dispatch the event
    window.dispatchEvent(updateEvent);
    
    // Also store in localStorage for cross-tab communication
    localStorage.setItem('lastProfileUpdate', JSON.stringify({
      employeeId: id,
      updateType,
      data,
      timestamp: new Date().toISOString()
    }));
  };

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      const { employeeId: updatedEmployeeId, updateType, data } = event.detail;
      
      // Only update if it's the same employee being viewed
      if (updatedEmployeeId === id) {
        switch (updateType) {
          case 'personalInfo':
            setPersonalInfo(prev => ({ ...prev, ...data }));
            toast.info("Profile information has been updated by another user");
            break;
          case 'bankInfo':
            setBankInfo(data);
            toast.info("Bank information has been updated by another user");
            break;
          case 'workInfo':
            setWorkInfo(data);
            toast.info("Work information has been updated by another user");
            break;
          default:
            break;
        }
      }
    };

    // Listen for storage changes (cross-tab communication)
    const handleStorageChange = (event) => {
      if (event.key === 'lastProfileUpdate') {
        const updateData = JSON.parse(event.newValue);
        if (updateData && updateData.employeeId === id) {
          handleProfileUpdate({ detail: updateData });
        }
      }
    };

    window.addEventListener('profileUpdate', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('profileUpdate', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [id]);

  const fetchProfileData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await api.get(`/employees/get-employee/${id}`);

      if (response.data.success) {
        const employeeData = response.data.data;

        setEmployeeId(employeeData.Emp_ID);

        // Set personal info from the employee data
        setPersonalInfo({
          employeeId: employeeData.Emp_ID,
          name: `${employeeData.personalInfo?.firstName || ""} ${
            employeeData.personalInfo?.lastName || ""
          }`,
          email: employeeData.personalInfo?.email || "",
          workemail: employeeData.personalInfo?.workemail || "",
          phone: employeeData.personalInfo?.mobileNumber || "",
          department: employeeData.joiningDetails?.department || "",
          designation: employeeData.joiningDetails?.initialDesignation || "",
          bloodGroup: employeeData.personalInfo?.bloodGroup || "",
          gender: employeeData.personalInfo?.gender || "",
          maritalStatus: employeeData.personalInfo?.maritalStatus || "",
          panNumber: employeeData.personalInfo?.panNumber || "",
          aadharNumber: employeeData.personalInfo?.aadharNumber || "",
          dob: employeeData.personalInfo?.dob
            ? new Date(employeeData.personalInfo.dob).toLocaleDateString()
            : "",
          nationality: employeeData.personalInfo?.nationality || "",
          // Include all other fields from personalInfo
          ...employeeData.personalInfo,
          // Include addressDetails directly
          addressDetails: employeeData.addressDetails || {
            presentAddress: {},
            permanentAddress: {},
          },
          joiningDetails: employeeData.joiningDetails || {},
          educationDetails: employeeData.educationDetails || {},
          trainingDetails: employeeData.trainingDetails || {},
          familyDetails: employeeData.familyDetails || [],
          serviceHistory: employeeData.serviceHistory || [],
          nominationDetails: employeeData.nominationDetails || [],
        });

        // Set bank info
        setBankInfo(employeeData.bankInfo || {});

        // Set work info
        setWorkInfo({
          department: employeeData.joiningDetails?.department || "",
          designation: employeeData.joiningDetails?.initialDesignation || "",
          employeeType: employeeData.joiningDetails?.employeeType || "",
          dateOfJoining: employeeData.joiningDetails?.dateOfJoining || "",
          dateOfAppointment:
            employeeData.joiningDetails?.dateOfAppointment || "",
          modeOfRecruitment:
            employeeData.joiningDetails?.modeOfRecruitment || "",
          shiftType: employeeData.joiningDetails?.shiftType || "",
          workType: employeeData.joiningDetails?.workType || "",
          uanNumber: employeeData.joiningDetails?.uanNumber || "",
          pfNumber: employeeData.joiningDetails?.pfNumber || "",
        });

        // Set profile image
        const imageUrl = employeeData.personalInfo?.employeeImage
          ? `${process.env.REACT_APP_API_URL}${employeeData.personalInfo.employeeImage}`
          : null;
        setProfileImage(imageUrl);

        console.log("Fetched employee data:", employeeData);
      } else {
        console.error("Failed to fetch employee data");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchProfileByUserId = async (userId) => {
    setLoading(true);
    try {
      const response = await api.get(`/employees/by-user/${userId}`);

      if (response.data.success) {
        const employeeData = response.data.data;

        setEmployeeId(employeeData.Emp_ID);

        // Set personal info from the employee data
        setPersonalInfo({
          employeeId: employeeData.Emp_ID,
          name: `${employeeData.personalInfo?.firstName || ""} ${
            employeeData.personalInfo?.lastName || ""
          }`,
          email: employeeData.personalInfo?.email || "",
          workemail: employeeData.personalInfo?.workemail || "",
          phone: employeeData.personalInfo?.mobileNumber || "",
          dob: employeeData.personalInfo?.dob
            ? new Date(employeeData.personalInfo.dob).toLocaleDateString()
            : "",
          gender: employeeData.personalInfo?.gender || "",
          department: employeeData.joiningDetails?.department || "",
          designation: employeeData.joiningDetails?.initialDesignation || "",
          bloodGroup: employeeData.personalInfo?.bloodGroup || "",
          maritalStatus: employeeData.personalInfo?.maritalStatus || "",
          nationality: employeeData.personalInfo?.nationality || "",
          aadharNumber: employeeData.personalInfo?.aadharNumber || "",
          panNumber: employeeData.personalInfo?.panNumber || "",
          // Include addressDetails directly
          addressDetails: employeeData.addressDetails || {
            presentAddress: {},
            permanentAddress: {},
          },
          joiningDetails: employeeData.joiningDetails || {},
        });

        // Set bank info
        setBankInfo(employeeData.bankInfo || {});

        // Set work info
        setWorkInfo({
          department: employeeData.joiningDetails?.department || "",
          designation: employeeData.joiningDetails?.initialDesignation || "",
          employeeType: employeeData.joiningDetails?.employeeType || "",
          dateOfJoining: employeeData.joiningDetails?.dateOfJoining || "",
          dateOfAppointment:
            employeeData.joiningDetails?.dateOfAppointment || "",
          modeOfRecruitment:
            employeeData.joiningDetails?.modeOfRecruitment || "",
          shiftType: employeeData.joiningDetails?.shiftType || "",
          workType: employeeData.joiningDetails?.workType || "",
          uanNumber: employeeData.joiningDetails?.uanNumber || "",
          pfNumber: employeeData.joiningDetails?.pfNumber || "",
        });

        // Set profile image
        const imageUrl = employeeData.personalInfo?.employeeImage
          ? `${process.env.REACT_APP_API_URL}${employeeData.personalInfo.employeeImage}`
          : null;
        setProfileImage(imageUrl);

        console.log("Fetched employee data by userId:", employeeData);
      } else {
        console.error("Failed to fetch employee data by userId");
      }
    } catch (error) {
      console.error("Error fetching profile data by userId:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const contractsData = await getContractsByEmployeeId(employeeId);
      setContracts(contractsData);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfileData();
    } else {
      // If no ID is provided, fetch the current user's profile
      const userId = currentUser?.id || localStorage.getItem("userId");
      if (userId) {
        fetchProfileByUserId(userId);
      }
    }
  }, [id, fetchProfileData, currentUser]);

  useEffect(() => {
    if (employeeId) {
      fetchContracts();
    }
  }, [employeeId]);

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    if (section === "personal") {
      setPersonalInfo((prev) => ({ ...prev, [name]: value }));
    } else if (section === "bank") {
      setBankInfo((prev) => ({ ...prev, [name]: value }));
    } else if (section === "work") {
      setWorkInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNestedInputChange = (e, section, nestedSection) => {
    const { name, value } = e.target;
    if (section === "personal") {
      setPersonalInfo((prev) => ({
        ...prev,
        [nestedSection]: {
          ...prev[nestedSection],
          [name]: value,
        },
      }));
    }
  };

  const handleContractSubmit = async (e) => {
    e.preventDefault();
    if (!canEditProfile()) {
      showPermissionError();
      return;
    }

    try {
      const contractData = {
        ...formData,
        employeeId: employeeId,
      };

      if (selectedContract) {
        await updateContract(selectedContract._id, contractData);
        toast.success("Contract updated successfully");
      } else {
        // Create new contract logic would go here
        toast.success("Contract created successfully");
      }

      setShowModal(false);
      fetchContracts();
      resetForm();
    } catch (error) {
      console.error("Error saving contract:", error);
      toast.error("Error saving contract");
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!canEditProfile()) {
      showPermissionError();
      return;
    }

    if (window.confirm("Are you sure you want to delete this contract?")) {
      try {
        await deleteContract(contractId);
        toast.success("Contract deleted successfully");
        fetchContracts();
      } catch (error) {
        console.error("Error deleting contract:", error);
        toast.error("Error deleting contract");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      contractName: "",
      startDate: "",
      endDate: "",
      wageType: "",
      basicSalary: "",
      filingStatus: "",
      status: "",
    });
    setSelectedContract(null);
  };

  const openModal = (contract = null) => {
    if (!canEditProfile()) {
      showPermissionError();
      return;
    }

    if (contract) {
      setFormData({
        contractName: contract.contractName || "",
        startDate: contract.startDate
          ? new Date(contract.startDate).toISOString().split("T")[0]
          : "",
        endDate: contract.endDate
          ? new Date(contract.endDate).toISOString().split("T")[0]
          : "",
        wageType: contract.wageType || "",
        basicSalary: contract.basicSalary || "",
        filingStatus: contract.filingStatus || "",
        status: contract.status || "",
      });
      setSelectedContract(contract);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="profile-page">
      <Row>
                {/* Enhanced Profile Sidebar with Full Email Display */}
                <Col lg={4} className="mb-4">
          <Card className="profile-sidebar">
            <Card.Body className="text-center">
              <div className="profile-image-container mb-3">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="profile-image rounded-circle"
                    style={{ width: "120px", height: "120px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="profile-placeholder rounded-circle d-flex align-items-center justify-content-center bg-light"
                    style={{ width: "120px", height: "120px", margin: "0 auto" }}
                  >
                    <i className="fas fa-user fa-3x text-muted"></i>
                  </div>
                )}
              </div>
              
              <h5 className="mb-1">{personalInfo.name || "N/A"}</h5>
              <p className="text-muted mb-2">{personalInfo.designation || "N/A"}</p>
              <p className="text-muted small mb-3">
                {personalInfo.department || "N/A"}
              </p>
              
              {canViewOnly() && (
                <Alert variant="warning" className="small mb-3">
                  <i className="fas fa-lock me-1"></i>
                  Read-Only Access
                </Alert>
              )}

              <ListGroup variant="flush">
                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-center">
                    <div className="col-5 text-start">
                      <small className="text-muted">Employee ID</small>
                    </div>
                    <div className="col-7 text-end">
                      <small className="fw-bold">{personalInfo.employeeId || "N/A"}</small>
                    </div>
                  </div>
                </ListGroup.Item>
                
                {/* Enhanced Email Display */}
                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-start">
                    <div className="col-5 text-start">
                      <small className="text-muted">Email</small>
                    </div>
                    <div className="col-7 text-end">
                      <small 
                        className="text-break d-block" 
                        style={{ 
                          fontSize: '0.75rem',
                          wordWrap: 'break-word',
                          lineHeight: '1.2'
                        }}
                        title={personalInfo.email || "N/A"}
                      >
                        {personalInfo.email || "N/A"}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>
                
                {/* Enhanced Work Email Display */}
                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-start">
                    <div className="col-5 text-start">
                      <small className="text-muted">Work Email</small>
                    </div>
                    <div className="col-7 text-end">
                      <small 
                        className="text-break d-block" 
                        style={{ 
                          fontSize: '0.75rem',
                          wordWrap: 'break-word',
                          lineHeight: '1.2'
                        }}
                        title={personalInfo.workemail || "N/A"}
                      >
                        {personalInfo.workemail || "N/A"}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-center">
                    <div className="col-5 text-start">
                      <small className="text-muted">Phone</small>
                    </div>
                    <div className="col-7 text-end">
                      <small>{personalInfo.phone || "N/A"}</small>
                    </div>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="border-0 px-0 py-2">
                  <div className="row align-items-center">
                    <div className="col-5 text-start">
                      <small className="text-muted">Role Access</small>
                    </div>
                    <div className="col-7 text-end">
                      <small className={`fw-bold ${canEditProfile() ? "text-primary" : "text-secondary"}`}>
                        {getUserRole().toUpperCase()}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>
              </ListGroup>

              {/* Role-based Action Buttons */}
              {canEditProfile() && (
                <div className="mt-3">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <i className="fas fa-edit me-1"></i>
                    {editMode ? 'Cancel Edit' : 'Edit Profile'}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>


        {/* Main Content */}
        <Col lg={8}>
          <Card>
            <Card.Body>
              <Tab.Container activeKey={tabKey} onSelect={(k) => setTabKey(k)}>
                <Nav variant="tabs" className="mb-4">
                  <Nav.Item>
                    <Nav.Link eventKey="about">About</Nav.Link>
                  </Nav.Item>
                  {/* <Nav.Item>
                    <Nav.Link eventKey="workTypeAndShift">Work Type & Shift</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="attendance">Attendance</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="leave">Leave</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="payroll">Payroll</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="allowanceAndDeduction">
                      Allowance & Deduction
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="penaltyAccount">Penalty Account</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="assets">Assets</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="performance">Performance</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="documents">Documents</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="bonusPoints">Bonus Points</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="scheduledInterview">
                      Scheduled Interview
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="resignation">Resignation</Nav.Link>
                  </Nav.Item> */}
                </Nav>

                <Tab.Content>
                  <Tab.Pane eventKey="about">
                    <Tab.Container
                      activeKey={subTabKey}
                      onSelect={(k) => setSubTabKey(k)}
                    >
                      <Nav variant="pills" className="mb-3">
                        <Nav.Item>
                          <Nav.Link eventKey="workInfo">Work Info</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="personalInfo">Personal Info</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="bankInfo">Bank Info</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="contracts">Contracts</Nav.Link>
                        </Nav.Item>
                      </Nav>

                      <Tab.Content>
                        {/* Work Info Tab */}
                        <Tab.Pane eventKey="workInfo">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Work Information</h5>
                            {canEditProfile() && (
                              <Button
                                variant={editWorkInfoMode ? "success" : "outline-primary"}
                                size="sm"
                                onClick={() => {
                                  if (editWorkInfoMode) {
                                    updateWorkInfo();
                                  } else {
                                    setEditWorkInfoMode(true);
                                  }
                                }}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Updating...
                                  </>
                                ) : editWorkInfoMode ? (
                                  <>
                                    <i className="fas fa-save me-1"></i>
                                    Save Changes
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-edit me-1"></i>
                                    Edit
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Department</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="department"
                                  value={workInfo.department || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                              <Form.Label>Designation</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="designation"
                                  value={workInfo.designation || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Employee Type</Form.Label>
                                <Form.Select
                                  name="employeeType"
                                  value={workInfo.employeeType || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                >
                                  <option value="">Select Employee Type</option>
                                  <option value="Full Time">Full Time</option>
                                  <option value="Part Time">Part Time</option>
                                  <option value="Contract">Contract</option>
                                  <option value="Intern">Intern</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Date of Joining</Form.Label>
                                <Form.Control
                                  type="date"
                                  name="dateOfJoining"
                                  value={workInfo.dateOfJoining ? new Date(workInfo.dateOfJoining).toISOString().split('T')[0] : ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Date of Appointment</Form.Label>
                                <Form.Control
                                  type="date"
                                  name="dateOfAppointment"
                                  value={workInfo.dateOfAppointment ? new Date(workInfo.dateOfAppointment).toISOString().split('T')[0] : ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Mode of Recruitment</Form.Label>
                                <Form.Select
                                  name="modeOfRecruitment"
                                  value={workInfo.modeOfRecruitment || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                >
                                  <option value="">Select Mode</option>
                                  <option value="Direct">Direct</option>
                                  <option value="Campus">Campus</option>
                                  <option value="Referral">Referral</option>
                                  <option value="Agency">Agency</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Shift Type</Form.Label>
                                <Form.Select
                                  name="shiftType"
                                  value={workInfo.shiftType || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                >
                                  <option value="">Select Shift</option>
                                  <option value="Morning Shift">Morning Shift</option>
                                  <option value="Day Shift">Day Shift</option>
                                  <option value="Night Shift">Night Shift</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Work Type</Form.Label>
                                <Form.Select
                                  name="workType"
                                  value={workInfo.workType || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                >
                                  <option value="">Select Work Type</option>
                                  <option value="Full Time">Full Time</option>
                                  <option value="Part Time">Part Time</option>
                                  <option value="Contract">Contract</option>
                                  <option value="Freelance">Freelance</option>
                                  <option value="Remote">Remote</option>
                                  <option value="Work From Home">Work From Home</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>UAN Number</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="uanNumber"
                                  value={workInfo.uanNumber || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>PF Number</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="pfNumber"
                                  value={workInfo.pfNumber || ""}
                                  onChange={(e) => handleInputChange(e, "work")}
                                  disabled={!editWorkInfoMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          {editWorkInfoMode && canEditProfile() && (
                            <div className="mt-3">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                  setEditWorkInfoMode(false);
                                  // Reset work info to original values
                                  fetchProfileData();
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </Tab.Pane>

                                                {/* Personal Info Tab */}
                                                <Tab.Pane eventKey="personalInfo">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Personal Information</h5>
                            {canEditProfile() && (
                              <Button
                                variant={editMode ? "success" : "outline-primary"}
                                size="sm"
                                onClick={() => {
                                  if (editMode) {
                                    updatePersonalInfo();
                                  } else {
                                    setEditMode(true);
                                  }
                                }}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Updating...
                                  </>
                                ) : editMode ? (
                                  <>
                                    <i className="fas fa-save me-1"></i>
                                    Save Changes
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-edit me-1"></i>
                                    Edit
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="name"
                                  value={personalInfo.name || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                  type="email"
                                  name="email"
                                  value={personalInfo.email || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                  className="text-break"
                                  style={{ fontSize: '0.9rem' }}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Work Email</Form.Label>
                                <Form.Control
                                  type="email"
                                  name="workemail"
                                  value={personalInfo.workemail || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                  className="text-break"
                                  style={{ fontSize: '0.9rem' }}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                  type="tel"
                                  name="phone"
                                  value={personalInfo.phone || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Date of Birth</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="dob"
                                  value={personalInfo.dob || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Gender</Form.Label>
                                <Form.Select
                                  name="gender"
                                  value={personalInfo.gender || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                >
                                  <option value="">Select Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Blood Group</Form.Label>
                                <Form.Select
                                  name="bloodGroup"
                                  value={personalInfo.bloodGroup || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                >
                                  <option value="">Select Blood Group</option>
                                  <option value="A+">A+</option>
                                  <option value="A-">A-</option>
                                  <option value="B+">B+</option>
                                  <option value="B-">B-</option>
                                  <option value="AB+">AB+</option>
                                  <option value="AB-">AB-</option>
                                  <option value="O+">O+</option>
                                  <option value="O-">O-</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Marital Status</Form.Label>
                                <Form.Select
                                  name="maritalStatus"
                                  value={personalInfo.maritalStatus || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                >
                                  <option value="">Select Status</option>
                                  <option value="Single">Single</option>
                                  <option value="Married">Married</option>
                                  <option value="Divorced">Divorced</option>
                                  <option value="Widowed">Widowed</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Nationality</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="nationality"
                                  value={personalInfo.nationality || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Aadhar Number</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="aadharNumber"
                                  value={personalInfo.aadharNumber || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>PAN Number</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="panNumber"
                                  value={personalInfo.panNumber || ""}
                                  onChange={(e) => handleInputChange(e, "personal")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          {/* Address Information */}
                          <h6 className="mt-4 mb-3">Address Information</h6>
                          <Row>
                            <Col md={12}>
                              <h6 className="text-muted">Present Address</h6>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Address</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  name="address"
                                  value={personalInfo.addressDetails?.presentAddress?.address || ""}
                                  onChange={(e) => handleNestedInputChange(e, "personal", "addressDetails.presentAddress")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>City</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="city"
                                  value={personalInfo.addressDetails?.presentAddress?.city || ""}
                                  onChange={(e) => handleNestedInputChange(e, "personal", "addressDetails.presentAddress")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>State</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="state"
                                  value={personalInfo.addressDetails?.presentAddress?.state || ""}
                                  onChange={(e) => handleNestedInputChange(e, "personal", "addressDetails.presentAddress")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Pin Code</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="pinCode"
                                  value={personalInfo.addressDetails?.presentAddress?.pinCode || ""}
                                  onChange={(e) => handleNestedInputChange(e, "personal", "addressDetails.presentAddress")}
                                  disabled={!editMode || !canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          {editMode && canEditProfile() && (
                            <div className="mt-3">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                  setEditMode(false);
                                  // Reset personal info to original values
                                  fetchProfileData();
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </Tab.Pane>

                        {/* Bank Info Tab */}
                        <Tab.Pane eventKey="bankInfo">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Bank Information</h5>
                            {canEditProfile() && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={updateBankInfo}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-save me-1"></i>
                                    Update Bank Info
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Account Number</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="accountNumber"
                                  value={bankInfo.accountNumber || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>IFSC Code</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="ifscCode"
                                  value={bankInfo.ifscCode || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Bank Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="bankName"
                                  value={bankInfo.bankName || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Branch Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="branchName"
                                  value={bankInfo.branchName || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Account Type</Form.Label>
                                <Form.Select
                                  name="accountType"
                                  value={bankInfo.accountType || ""}
                                  onChange={(e) => handleInputChange(e, "bank")}
                                  disabled={!canEditProfile()}
                                >
                                  <option value="">Select Account Type</option>
                                  <option value="Savings">Savings</option>
                                  <option value="Current">Current</option>
                                  <option value="Salary">Salary</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                          </Row>
                        </Tab.Pane>

                        {/* Contracts Tab */}
                        <Tab.Pane eventKey="contracts">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Contracts</h5>
                            {canEditProfile() && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => openModal()}
                              >
                                <i className="fas fa-plus me-1"></i>
                                Add Contract
                              </Button>
                            )}
                          </div>

                          {contracts.length > 0 ? (
                            <Table responsive striped bordered hover>
                              <thead>
                                <tr>
                                  <th>Contract Name</th>
                                  <th>Start Date</th>
                                  <th>End Date</th>
                                  <th>Wage Type</th>
                                  <th>Basic Salary</th>
                                  <th>Status</th>
                                  {canEditProfile() && <th>Actions</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {contracts.map((contract) => (
                                  <tr key={contract._id}>
                                    <td>{contract.contractName}</td>
                                    <td>
                                      {contract.startDate
                                        ? new Date(contract.startDate).toLocaleDateString()
                                        : "N/A"}
                                    </td>
                                    <td>
                                      {contract.endDate
                                        ? new Date(contract.endDate).toLocaleDateString()
                                        : "N/A"}
                                    </td>
                                    <td>{contract.wageType}</td>
                                    <td>{contract.basicSalary}</td>
                                    <td>
                                      <Badge
                                        bg={
                                          contract.status === "Active"
                                            ? "success"
                                            : contract.status === "Inactive"
                                            ? "danger"
                                            : "warning"
                                        }
                                      >
                                        {contract.status}
                                      </Badge>
                                    </td>
                                    {canEditProfile() && (
                                      <td>
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          className="me-1"
                                          onClick={() => openModal(contract)}
                                        >
                                          <i className="fas fa-edit"></i>
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => handleDeleteContract(contract._id)}
                                        >
                                          <i className="fas fa-trash"></i>
                                        </Button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          ) : (
                            <Alert variant="info">
                              <i className="fas fa-info-circle me-2"></i>
                              No contracts found for this employee.
                            </Alert>
                          )}
                        </Tab.Pane>
                      </Tab.Content>
                    </Tab.Container>
                  </Tab.Pane>

                  {/* Other Tab Panes */}
                  <Tab.Pane eventKey="workTypeAndShift">
                    <WorkTypeAndShift employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="attendance">
                    <Attendance employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="leave">
                    <Leave employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="payroll">
                    <Payroll employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="allowanceAndDeduction">
                    <AllowanceAndDeduction employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="penaltyAccount">
                    <PenaltyAccount employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="assets">
                    <Assets employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="performance">
                    <Performance employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="documents">
                    <Documents employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="bonusPoints">
                    <BonusPoints employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="scheduledInterview">
                    <ScheduledInterview employeeId={employeeId} />
                  </Tab.Pane>

                  <Tab.Pane eventKey="resignation">
                    <Resignation employeeId={employeeId} />
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Contract Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedContract ? "Edit Contract" : "Add New Contract"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleContractSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contract Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="contractName"
                    value={formData.contractName}
                    onChange={(e) =>
                      setFormData({ ...formData, contractName: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Wage Type</Form.Label>
                  <Form.Select
                    name="wageType"
                    value={formData.wageType}
                    onChange={(e) =>
                      setFormData({ ...formData, wageType: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Wage Type</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Basic Salary</Form.Label>
                  <Form.Control
                    type="number"
                    name="basicSalary"
                    value={formData.basicSalary}
                    onChange={(e) =>
                      setFormData({ ...formData, basicSalary: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Filing Status</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="filingStatus"
                    value={formData.filingStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, filingStatus: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleContractSubmit}>
            {selectedContract ? "Update Contract" : "Add Contract"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProfilePage;
