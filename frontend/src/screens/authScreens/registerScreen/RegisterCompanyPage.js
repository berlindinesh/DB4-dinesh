import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  styled,
  ThemeProvider,
  createTheme,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaUpload, FaImage } from 'react-icons/fa';
import { Velustro } from "uvcanvas";
import authService from '../../../screens/api/auth';

// Create theme with custom breakpoints
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

// Enhanced styled components with perfect centering and extended background
const RegisterWrapper = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  width: '100vw',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'auto',
  padding: '20px',
  [theme.breakpoints.down('sm')]: {
    padding: '10px',
    alignItems: 'flex-start',
    paddingTop: '20px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    padding: '15px',
  },
}));

const VelustroContainer = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  zIndex: -1,
  overflow: 'hidden',
  '& > *': {
    width: '100% !important',
    height: '100% !important',
    minWidth: '100vw',
    minHeight: '100vh',
  }
});

const RegisterContent = styled(motion.div)(({ theme }) => ({
  width: '100%',
  maxWidth: '900px',
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto',
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
    width: '100%',
    minHeight: 'auto',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    maxWidth: '750px',
  },
  [theme.breakpoints.up('lg')]: {
    maxWidth: '950px',
  },
}));

// Updated RegisterPaper with transparent gray background like LoginPage
const RegisterPaper = styled(Paper)(({ theme }) => ({
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: '900px',
  maxHeight: 'calc(100vh - 40px)',
  overflowY: 'auto',
  borderRadius: '20px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  backgroundColor: 'rgba(0, 0, 0, 0.75)', // Transparent gray like LoginPage
  backdropFilter: 'blur(15px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  transition: 'all 0.3s ease-in-out',
  transform: 'translateZ(0)', // Force hardware acceleration
  
  // Custom scrollbar styling
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.5)',
    },
  },
  
  [theme.breakpoints.down('sm')]: {
    padding: '20px',
    borderRadius: '15px',
    maxHeight: 'calc(100vh - 20px)',
    margin: '10px 0',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    padding: '28px',
    borderRadius: '18px',
    maxHeight: 'calc(100vh - 30px)',
  },
  [theme.breakpoints.up('lg')]: {
    padding: '40px',
    borderRadius: '25px',
    maxWidth: '950px',
  },
}));

// Enhanced logo upload components
const LogoUploadContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '20px',
  [theme.breakpoints.down('sm')]: {
    marginBottom: '16px',
  },
  [theme.breakpoints.up('lg')]: {
    marginBottom: '24px',
  },
}));

const LogoPreviewContainer = styled(Box)(({ theme }) => ({
  width: '120px',
  height: '120px',
  border: '2px dashed rgba(255, 255, 255, 0.3)',
  borderRadius: '15px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '10px',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100px',
    height: '100px',
    borderRadius: '12px',
  },
  [theme.breakpoints.up('lg')]: {
    width: '140px',
    height: '140px',
    borderRadius: '18px',
  },
}));

const LogoPreviewImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  borderRadius: '10px',
});

// Updated StyledTextField with white text and transparent background
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark transparent background
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
      transition: 'border-color 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#4a90e2',
      borderWidth: '2px',
    },
    '& input': {
      color: 'white',
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.7)',
        opacity: 1,
      },
      '&:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.8) inset',
        WebkitTextFillColor: 'white',
        caretColor: 'white',
        transition: 'background-color 5000s ease-in-out 0s',
      },
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#4a90e2',
    }
  },
  '& .MuiFormHelperText-root': {
    fontSize: '0.75rem',
    marginLeft: '14px',
    marginTop: '4px',
    color: 'rgba(255, 255, 255, 0.6)',
    '&.Mui-error': {
      color: '#f44336',
    }
  },
  marginBottom: '16px',
  [theme.breakpoints.down('sm')]: {
    marginBottom: '12px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
    },
  },
  [theme.breakpoints.up('lg')]: {
    marginBottom: '18px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#4a90e2',
  color: 'white',
  fontWeight: 600,
  borderRadius: '10px',
  textTransform: 'none',
  boxShadow: '0 4px 10px rgba(74, 144, 226, 0.3)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: '#357abd',
    boxShadow: '0 6px 15px rgba(74, 144, 226, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    backgroundColor: '#4a90e2',
    opacity: 0.7,
    transform: 'none',
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: '8px',
    fontSize: '0.9rem',
  },
  [theme.breakpoints.up('lg')]: {
    borderRadius: '12px',
    fontSize: '1.05rem',
  },
}));

const CenteredContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    alignItems: 'flex-start',
    paddingTop: '20px',
    minHeight: 'calc(100vh - 40px)',
  },
}));

// Steps for registration
const steps = ['Company Information', 'Admin Account'];

const RegisterCompanyPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  
  // Media queries for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Company form data
  const [companyData, setCompanyData] = useState({
    name: '',
    companyCode: '',
    industry: '',
    contactEmail: '',
    contactPhone: '',
    logo: null,
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  });
  
  // Form validation errors
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    companyCode: '',
    industry: '',
    contactEmail: '',
    contactPhone: '',
    logo: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  });
  
  // Admin form data
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Admin validation errors
  const [adminValidationErrors, setAdminValidationErrors] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const navigate = useNavigate();
  
  // Helper function to capitalize first letter of each word (sentence case)
  const toSentenceCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setValidationErrors({
        ...validationErrors,
        logo: 'Please upload a valid image file (JPEG, PNG, GIF, SVG)'
      });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setValidationErrors({
        ...validationErrors,
        logo: 'Image size should not exceed 2MB'
      });
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
        // Store the file in state
        setCompanyData({
          ...companyData,
          logo: file
        });
        
        // Clear any previous error
        setValidationErrors({
          ...validationErrors,
          logo: ''
        });
      };
      
      // Handle company form change
      const handleCompanyChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        let newErrors = { ...validationErrors };
        
        // Check if it's a nested address field
        if (name.includes('.')) {
          const [parent, child] = name.split('.');
          
          // Apply formatting for address fields
          if (['city', 'state', 'country'].includes(child)) {
            newValue = toSentenceCase(value);
          } else if (child === 'zipCode') {
            // Only allow numbers and limit to 6 digits
            newValue = value.replace(/\D/g, '').slice(0, 6);
          }
          
          // Validation for address fields
          if (child === 'zipCode') {
            if (newValue && newValue.length !== 6) {
              newErrors.address.zipCode = 'Zip code must be exactly 6 digits';
            } else {
              newErrors.address.zipCode = '';
            }
          }
          
          setCompanyData({
            ...companyData,
            address: {
              ...companyData.address,
              [child]: newValue
            }
          });
        } else {
          // Handle direct company fields
          if (name === 'industry') {
            newValue = toSentenceCase(value);
          } else if (name === 'companyCode') {
            newValue = value.toUpperCase();
          } else if (name === 'contactEmail') {
            newValue = value.toLowerCase();
          } else if (name === 'contactPhone') {
            // Only allow numbers and limit to 10 digits
            newValue = value.replace(/\D/g, '').slice(0, 10);
          }
          
          // Validation for company fields
          if (name === 'contactEmail') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (newValue && !emailRegex.test(newValue)) {
              newErrors.contactEmail = 'Please enter a valid email address';
            } else {
              newErrors.contactEmail = '';
            }
          }
          
          if (name === 'contactPhone') {
            if (newValue && newValue.length !== 10) {
              newErrors.contactPhone = 'Phone number must be exactly 10 digits';
            } else {
              newErrors.contactPhone = '';
            }
          }
          
          if (name === 'companyCode') {
            if (newValue && newValue.length < 2) {
              newErrors.companyCode = 'Company code must be at least 2 characters';
            } else if (newValue && !/^[A-Z0-9]+$/.test(newValue)) {
              newErrors.companyCode = 'Company code should contain only letters and numbers';
            } else {
              newErrors.companyCode = '';
            }
          }
          
          setCompanyData({
            ...companyData,
            [name]: newValue
          });
        }
        
        setValidationErrors(newErrors);
        if (error) setError('');
      };
      
      useEffect(() => {
        if (companyData.companyCode.length > 2) {
          const timer = setTimeout(async () => {
            try {
              const res = await authService.checkCompanyCode(companyData.companyCode);
              if (!res.data.available) {
                setValidationErrors(prev => ({ ...prev, companyCode: 'Code already in use' }));
              }
            } catch (e) {
              // Handle server check error
            }
          }, 500);
          return () => clearTimeout(timer);
        }
      }, [companyData.companyCode]);
      
      // Handle admin form change
      const handleAdminChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        let newErrors = { ...adminValidationErrors };
        
        // Apply sentence case for name fields
        if (['firstName', 'lastName', 'middleName'].includes(name)) {
          newValue = toSentenceCase(value);
        } else if (name === 'email') {
          newValue = value.toLowerCase();
        }
        
        // Validation for admin fields
        if (name === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (newValue && !emailRegex.test(newValue)) {
            newErrors.email = 'Please enter a valid email address';
          } else {
            newErrors.email = '';
          }
        }
        
        if (name === 'password') {
          if (newValue && newValue.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
          } else if (newValue && !/(?=.*[a-z])/.test(newValue)) {
            newErrors.password = 'Password must include at least one lowercase letter';
          } else if (newValue && !/(?=.*[A-Z])/.test(newValue)) {
            newErrors.password = 'Password must include at least one uppercase letter';
          } else if (newValue && !/(?=.*\d)/.test(newValue)) {
            newErrors.password = 'Password must include at least one number';
          } else if (newValue && !/(?=.*[@$!%*?&])/.test(newValue)) {
            newErrors.password = 'Password must include at least one special character';
          } else {
            newErrors.password = '';
          }
          
          // Check confirm password if it exists
          if (adminData.confirmPassword && newValue !== adminData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else if (adminData.confirmPassword) {
            newErrors.confirmPassword = '';
          }
        }
        
        if (name === 'confirmPassword') {
          if (newValue !== adminData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else {
            newErrors.confirmPassword = '';
          }
        }
        
        setAdminData({
          ...adminData,
          [name]: newValue
        });
        
        setAdminValidationErrors(newErrors);
        if (error) setError('');
      };
      
      // Validate company step
      const validateCompanyStep = () => {
        const errors = {
          name: '',
          companyCode: '',
          industry: '',
          contactEmail: '',
          contactPhone: '',
          logo: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
          }
        };
      
        let isValid = true;
      
        // ✅ Logo required
        if (!companyData.logo) {
          errors.logo = 'Company logo is required';
          isValid = false;
        }
      
        // ✅ Company name (min 2 characters)
        if (!companyData.name.trim()) {
          errors.name = 'Company name is required';
          isValid = false;
        } else if (companyData.name.trim().length < 2) {
          errors.name = 'Company name must be at least 2 characters';
          isValid = false;
        }
      
        // ✅ Company code (exactly 2 uppercase letters)
        if (!companyData.companyCode.trim()) {
          errors.companyCode = 'Company code is required';
          isValid = false;
        } else if (companyData.companyCode.trim().length < 2) {
          errors.companyCode = 'Company code must be at least 2 characters';
          isValid = false;
        } else if (!/^[A-Z0-9]+$/.test(companyData.companyCode.trim())) {
          errors.companyCode = 'Company code should contain only uppercase letters and numbers';
          isValid = false;
        }
        
      
        if (!companyData.industry.trim()) {
          errors.industry = 'Industry is required';
          isValid = false;
        }
      
        if (!companyData.contactEmail.trim()) {
          errors.contactEmail = 'Contact email is required';
          isValid = false;
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(companyData.contactEmail)) {
            errors.contactEmail = 'Please enter a valid email address';
            isValid = false;
          }
        }
      
        if (!companyData.contactPhone.trim()) {
          errors.contactPhone = 'Contact phone is required';
          isValid = false;
        } else if (companyData.contactPhone.length !== 10) {
          errors.contactPhone = 'Phone number must be exactly 10 digits';
          isValid = false;
        }
      
        if (!companyData.address.street.trim()) {
          errors.address.street = 'Street address is required';
          isValid = false;
        }
      
        if (!companyData.address.city.trim()) {
          errors.address.city = 'City is required';
          isValid = false;
        }
      
        if (!companyData.address.state.trim()) {
          errors.address.state = 'State is required';
          isValid = false;
        }
      
        if (!companyData.address.country.trim()) {
          errors.address.country = 'Country is required';
          isValid = false;
        }
      
        if (!companyData.address.zipCode.trim()) {
          errors.address.zipCode = 'Zip code is required';
          isValid = false;
        } else if (companyData.address.zipCode.length !== 6) {
          errors.address.zipCode = 'Zip code must be exactly 6 digits';
          isValid = false;
        }
      
        setValidationErrors(errors);
        return isValid;
      };
      
      
      // Validate admin step
      const validateAdminStep = () => {
        const errors = {
          firstName: '',
          lastName: '',
          middleName: '',
          email: '',
          password: '',
          confirmPassword: ''
        };
        
        let isValid = true;
        
        if (!adminData.firstName.trim()) {
          errors.firstName = 'First name is required';
          isValid = false;
        }
        
        if (!adminData.lastName.trim()) {
          errors.lastName = 'Last name is required';
          isValid = false;
        }
        
        if (!adminData.email.trim()) {
          errors.email = 'Email is required';
          isValid = false;
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(adminData.email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
          }
        }
        
        if (!adminData.password) {
          errors.password = 'Password is required';
          isValid = false;
        } else if (adminData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
          isValid = false;
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(adminData.password)) {
          errors.password = 'Password must include uppercase, lowercase, number and special character';
          isValid = false;
        }
        
        if (!adminData.confirmPassword) {
          errors.confirmPassword = 'Please confirm your password';
          isValid = false;
        } else if (adminData.password !== adminData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
          isValid = false;
        }
        
        setAdminValidationErrors(errors);
        return isValid;
      };
      
      // Handle next step
      const handleNext = () => {
        if (activeStep === 0) {
          if (validateCompanyStep()) {
            setActiveStep(1);
          }
        }
      };
      
      // Handle back step
      const handleBack = () => {
        setActiveStep(0);
      };
      
      // Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateAdminStep()) {
    return;
  }
  
  setLoading(true);
  setError('');

  try {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Create company object
    const companyObject = {
      name: companyData.name,
      companyCode: companyData.companyCode,
      industry: companyData.industry,
      contactEmail: companyData.contactEmail,
      contactPhone: companyData.contactPhone,
      address: {
        street: companyData.address.street,
        city: companyData.address.city,
        state: companyData.address.state,
        country: companyData.address.country,
        zipCode: companyData.address.zipCode
      }
    };
    
    // Create admin object
    const adminObject = {
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      middleName: adminData.middleName || '',
      email: adminData.email,
      password: adminData.password
    };
    
    // Debug the objects before sending
    console.log('=== FRONTEND DEBUG ===');
    console.log('Company Object:', companyObject);
    console.log('Admin Object:', adminObject);
    console.log('Admin Email:', adminData.email);
    console.log('Logo file:', companyData.logo);
    
    // Add JSON strings to FormData
    formData.append('company', JSON.stringify(companyObject));
    formData.append('admin', JSON.stringify(adminObject));
    
    // Add logo if uploaded
    if (companyData.logo) {
      formData.append('logo', companyData.logo);
    }
    
    // Debug FormData contents
    console.log('=== FORMDATA DEBUG ===');
    for (let [key, value] of formData.entries()) {
      if (key === 'logo') {
        console.log(key, 'File:', value.name, 'Size:', value.size, 'Type:', value.type);
      } else {
        console.log(key, ':', value);
        try {
          const parsed = JSON.parse(value);
          console.log(`${key} parsed:`, parsed);
        } catch (e) {
          console.error(`Error parsing ${key}:`, e);
        }
      }
    }
    
    const response = await authService.registerCompany(formData);
    
    if (response.data.success) {
      // Navigate to OTP verification page with email and success message
      navigate('/verifyotp', {
        state: {
          email: adminData.email,
          companyCode: companyData.companyCode,
          message: 'Company registered successfully! Please check your email for the OTP to verify your account.',
          type: 'success',
          fromRegistration: true
        }
      });

    }
  } catch (err) {
    console.error('Registration error:', err);
    setError(
      err.response?.data?.message || 
      'Registration failed. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};

      
      // Toggle password visibility
      const togglePasswordVisibility = (field) => {
        if (field === 'password') {
          setShowPassword(!showPassword);
        } else if (field === 'confirmPassword') {
          setShowConfirmPassword(!showConfirmPassword);
        }
      };
      
      // Get responsive icon size
      const getIconSize = () => {
        if (isMobile) return 16;
        if (isTablet) return 18;
        if (isLargeDesktop) return 22;
        return 20;
      };
      
      return (
        <ThemeProvider theme={theme}>
          <RegisterWrapper>
            {/* Extended Background Animation */}
            <VelustroContainer>
              <Velustro />
            </VelustroContainer>
            
            {/* Centered Content Container */}
            <CenteredContainer>
              <Container 
                maxWidth={false} 
                sx={{ 
                  padding: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: isMobile ? '100%' : isTablet ? '750px' : isLargeDesktop ? '900px' : '850px'
                }}
              >
                <RegisterContent
                  initial={{ 
                    opacity: 0, 
                    y: isMobile ? 10 : 20,
                    scale: 0.95
                  }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: 1
                  }}
                  transition={{ 
                    duration: isMobile ? 0.4 : 0.6,
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                >
                  <RegisterPaper elevation={3}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      style={{ width: '100%', textAlign: 'center', marginBottom: isMobile ? '20px' : '30px' }}
                    >
                      <Typography
                        variant={isMobile ? "h5" : isTablet ? "h4" : "h3"}
                        component="h1"
                        sx={{
                          mb: 1,
                          color: 'white',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: isMobile ? '1px' : '2px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          fontSize: {
                            xs: '1.5rem',
                            sm: '1.75rem',
                            md: '2rem',
                            lg: '2.25rem'
                          }
                        }}
                      >
                        Register Company
                      </Typography>
                      
                      <Typography 
                        variant="body1" 
                        sx={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: {
                            xs: '0.85rem',
                            sm: '0.9rem',
                            md: '1rem',
                            lg: '1.1rem'
                          },
                          fontWeight: 400,
                          lineHeight: 1.4,
                          maxWidth: isMobile ? '100%' : '80%',
                          mx: 'auto'
                        }}
                      >
                        Create your company account and start managing your workforce
                      </Typography>
                    </motion.div>
                    
                    {/* Enhanced Stepper */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      style={{ width: '100%', marginBottom: isMobile ? '25px' : '35px' }}
                    >
                      <Stepper 
                        activeStep={activeStep} 
                        alternativeLabel={!isMobile}
                        orientation={isMobile ? "vertical" : "horizontal"}
                        sx={{
                          '& .MuiStepLabel-root .Mui-completed': {
                            color: '#4caf50',
                          },
                          '& .MuiStepLabel-root .Mui-active': {
                            color: '#4a90e2',
                          },
                          '& .MuiStepLabel-label': {
                            fontSize: {
                              xs: '0.75rem',
                              sm: '0.875rem',
                              md: '1rem'
                            },
                            fontWeight: 500,
                            color: 'rgba(255, 255, 255, 0.8)',
                            '&.Mui-active': {
                              color: '#4a90e2',
                              fontWeight: 600,
                            },
                            '&.Mui-completed': {
                              color: '#4caf50',
                              fontWeight: 600,
                            }
                          },
                          '& .MuiStepIcon-root': {
                            fontSize: {
                              xs: '1.5rem',
                              sm: '1.75rem',
                              md: '2rem'
                            },
                            color: 'rgba(255, 255, 255, 0.3)',
                            '&.Mui-active': {
                              color: '#4a90e2',
                            },
                            '&.Mui-completed': {
                              color: '#4caf50',
                            }
                          },
                          '& .MuiStepConnector-line': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          }
                        }}
                      >
                        {steps.map((label, index) => (
                          <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </motion.div>
                    
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%', marginBottom: '20px' }}
                      >
                        <Alert 
                          severity="error" 
                          sx={{ 
                            borderRadius: isMobile ? '8px' : '10px',
                            fontSize: {
                              xs: '0.8rem',
                              sm: '0.85rem',
                              md: '0.9rem'
                            },
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            border: '1px solid rgba(244, 67, 54, 0.3)',
                            '& .MuiAlert-message': {
                              color: '#f44336',
                              fontWeight: 500,
                            }
                          }}
                        >
                          {error}
                        </Alert>
                      </motion.div>
                    )}
                    
                    <Box 
                      component="form" 
                      onSubmit={activeStep === steps.length - 1 ? handleSubmit : (e) => e.preventDefault()}
                      sx={{ width: '100%' }}
                    >
                      {activeStep === 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        >
                          {/* Company Information Step */}
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              mb: isMobile ? 2 : 3, 
                              color: 'white',
                              fontWeight: 600,
                              fontSize: {
                                xs: '1.1rem',
                                sm: '1.25rem',
                                md: '1.5rem'
                              },
                              textAlign: 'center'
                            }}
                          >
                            Company Information
                          </Typography>
                          
                          {/* Logo Upload Section */}
                          <LogoUploadContainer>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                mb: 2, 
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: {
                                  xs: '0.9rem',
                                  sm: '1rem',
                                  md: '1.1rem'
                                },
                                fontWeight: 500
                              }}
                            >
                              Company Logo *
                            </Typography>
                            
                            <LogoPreviewContainer>
                              {logoPreview ? (
                                <LogoPreviewImage src={logoPreview} alt="Logo Preview" />
                              ) : (
                                <Box sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                                  <FaImage size={isMobile ? 30 : isTablet ? 35 : 40} />
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mt: 1,
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.8rem',
                                        md: '0.85rem'
                                      },
                                      color: 'rgba(255, 255, 255, 0.7)'
                                    }}
                                  >
                                    Upload Logo
                                  </Typography>
                                </Box>
                              )}
                            </LogoPreviewContainer>
                            
                            <input
                              accept="image/*"
                              style={{ display: 'none' }}
                              id="logo-upload"
                              type="file"
                              onChange={handleLogoUpload}
                            />
                            <label htmlFor="logo-upload">
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<FaUpload size={getIconSize()} />}
                                sx={{
                                  borderRadius: isMobile ? '6px' : '8px',
                                  textTransform: 'none',
                                  fontSize: {
                                    xs: '0.8rem',
                                    sm: '0.85rem',
                                    md: '0.9rem'
                                  },
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  '&:hover': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  }
                                }}
                              >
                                Choose File
                              </Button>
                            </label>
                            
                            {validationErrors.logo && (
                              <Typography 
                                color="error" 
                                variant="caption" 
                                sx={{ 
                                  mt: 1,
                                  fontSize: {
                                    xs: '0.7rem',
                                    sm: '0.75rem'
                                  },
                                  display: 'block',
                                  textAlign: 'center'
                                }}
                              >
                                {validationErrors.logo}
                              </Typography>
                            )}
                          </LogoUploadContainer>
                          
                          <Grid container spacing={isMobile ? 2 : 3}>
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="name"
                                label="Company Name"
                                name="name"
                                value={companyData.name}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.name}
                                helperText={validationErrors.name}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="companyCode"
                                label="Company Code"
                                name="companyCode"
                                value={companyData.companyCode}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.companyCode}
                                helperText={validationErrors.companyCode || "Unique identifier for your company"}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                inputProps={{
                                  style: { textTransform: 'uppercase' }
                                }}
                              />
                            </Grid>
                            
                            <Grid item xs={12}>
                              <StyledTextField
                                required
                                fullWidth
                                id="industry"
                                label="Industry"
                                name="industry"
                                value={companyData.industry}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.industry}
                                helperText={validationErrors.industry}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                placeholder="e.g., Information Technology, Healthcare, Finance"
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="contactEmail"
                                label="Contact Email"
                                name="contactEmail"
                                type="email"
                                value={companyData.contactEmail}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.contactEmail}
                                helperText={validationErrors.contactEmail}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                inputProps={{
                                  style: { textTransform: 'lowercase' }
                                }}
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="contactPhone"
                                label="Contact Phone"
                                name="contactPhone"
                                value={companyData.contactPhone}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.contactPhone}
                                helperText={validationErrors.contactPhone || "10-digit phone number"}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                inputProps={{
                                  maxLength: 10,
                                  pattern: '[0-9]*'
                                }}
                              />
                            </Grid>
                            
                            {/* Address Section */}
                            <Grid item xs={12}>
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  mt: isMobile ? 1 : 2, 
                                  mb: isMobile ? 1 : 2, 
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: {
                                    xs: '1rem',
                                    sm: '1.1rem',
                                    md: '1.2rem'
                                  },
                                  textAlign: 'center'
                                }}
                              >
                                Company Address
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                              <StyledTextField
                                required
                                fullWidth
                                id="street"
                                label="Street Address"
                                name="address.street"
                                value={companyData.address.street}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.address.street}
                                helperText={validationErrors.address.street}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="city"
                                label="City"
                                name="address.city"
                                value={companyData.address.city}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.address.city}
                                helperText={validationErrors.address.city}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="state"
                                label="State"
                                name="address.state"
                                value={companyData.address.state}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.address.state}
                                helperText={validationErrors.address.state}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="country"
                                label="Country"
                                name="address.country"
                                value={companyData.address.country}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.address.country}
                                helperText={validationErrors.address.country}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="zipCode"
                                label="Zip Code"
                                name="address.zipCode"
                                value={companyData.address.zipCode}
                                onChange={handleCompanyChange}
                                error={!!validationErrors.address.zipCode}
                                helperText={validationErrors.address.zipCode || "6-digit zip code"}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                inputProps={{
                                  maxLength: 6,
                                  pattern: '[0-9]*'
                                }}
                              />
                            </Grid>
                          </Grid>
                        </motion.div>
                      )}
                      
                      {activeStep === 1 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        >
                          {/* Admin Account Step */}
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              mb: isMobile ? 2 : 3, 
                              color: 'white',
                              fontWeight: 600,
                              fontSize: {
                                xs: '1.1rem',
                                sm: '1.25rem',
                                md: '1.5rem'
                              },
                              textAlign: 'center'
                            }}
                          >
                            Admin Account Details
                          </Typography>
                          
                          <Grid container spacing={isMobile ? 2 : 3}>
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="firstName"
                                label="First Name"
                                name="firstName"
                                value={adminData.firstName}
                                onChange={handleAdminChange}
                                error={!!adminValidationErrors.firstName}
                                helperText={adminValidationErrors.firstName}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                fullWidth
                                id="middleName"
                                label="Middle Name (Optional)"
                                name="middleName"
                                value={adminData.middleName}
                                onChange={handleAdminChange}
                                error={!!adminValidationErrors.middleName}
                                helperText={adminValidationErrors.middleName}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="lastName"
                                label="Last Name"
                                name="lastName"
                                value={adminData.lastName}
                                onChange={handleAdminChange}
                                error={!!adminValidationErrors.lastName}
                                helperText={adminValidationErrors.lastName}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                              />
                            </Grid>
                            
                            
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                type="email"
                                value={adminData.email}
                                onChange={handleAdminChange}
                                error={!!adminValidationErrors.email}
                                helperText={adminValidationErrors.email}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                inputProps={{
                                  style: { textTransform: 'lowercase' }
                                }}
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="password"
                                label="Password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={adminData.password}
                                onChange={handleAdminChange}
                                error={!!adminValidationErrors.password}
                                helperText={adminValidationErrors.password || "Min 8 chars with uppercase, lowercase, number & special char"}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        onClick={() => togglePasswordVisibility('password')}
                                        edge="end"
                                        aria-label="toggle password visibility"
                                        sx={{ 
                                          color: 'rgba(255, 255, 255, 0.7)',
                                          '&:hover': {
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                                          }
                                        }}
                                        size={isMobile ? "small" : "medium"}
                                        disabled={loading}
                                        type="button"
                                      >
                                        {showPassword ? 
                                          <FaEyeSlash size={getIconSize()} /> : 
                                          <FaEye size={getIconSize()} />
                                        }
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <StyledTextField
                                required
                                fullWidth
                                id="confirmPassword"
                                label="Confirm Password"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={adminData.confirmPassword}
                                onChange={handleAdminChange}
                                error={!!adminValidationErrors.confirmPassword}
                                helperText={adminValidationErrors.confirmPassword}
                                disabled={loading}
                                size={isMobile ? "small" : "medium"}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        onClick={() => togglePasswordVisibility('confirmPassword')}
                                        edge="end"
                                        aria-label="toggle confirm password visibility"
                                        sx={{ 
                                          color: 'rgba(255, 255, 255, 0.7)',
                                          '&:hover': {
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                                          }
                                        }}
                                        size={isMobile ? "small" : "medium"}
                                        disabled={loading}
                                        type="button"
                                      >
                                        {showConfirmPassword ? 
                                          <FaEyeSlash size={getIconSize()} /> : 
                                          <FaEye size={getIconSize()} />
                                        }
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                          </Grid>
                          
                          {/* Password Requirements Info */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                          >
                            <Box sx={{ 
                              mt: isMobile ? 2 : 3, 
                              p: isMobile ? 1.5 : 2, 
                              backgroundColor: 'rgba(74, 144, 226, 0.1)',
                              borderRadius: isMobile ? '8px' : '10px',
                              border: '1px solid rgba(74, 144, 226, 0.2)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(74, 144, 226, 0.15)',
                                borderColor: 'rgba(74, 144, 226, 0.3)',
                              }
                            }}>
                              <Typography 
                                variant="caption" 
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  fontSize: {
                                    xs: '0.7rem',
                                    sm: '0.75rem',
                                    md: '0.8rem'
                                  },
                                  display: 'block',
                                  textAlign: 'center',
                                  lineHeight: 1.4,
                                  fontWeight: 500
                                }}
                              >
                                🔒 <strong>Password Requirements:</strong> Your password must contain at least 8 characters including uppercase letters, lowercase letters, numbers, and special characters (@$!%*?&).
                              </Typography>
                            </Box>
                          </motion.div>
                        </motion.div>
                      )}
                      
                      {/* Navigation Buttons */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: isMobile ? 'column' : 'row',
                          justifyContent: 'space-between',
                          alignItems: isMobile ? 'stretch' : 'center',
                          mt: isMobile ? 3 : 4,
                          gap: isMobile ? 2 : 0
                        }}>
                          {activeStep !== 0 && (
                            <motion.div
                              whileHover={{ scale: loading ? 1 : (isMobile ? 1.02 : 1.05) }}
                              whileTap={{ scale: loading ? 1 : (isMobile ? 0.98 : 0.95) }}
                              style={{ 
                                width: isMobile ? '100%' : 'auto',
                                order: isMobile ? 2 : 1
                              }}
                            >
                              <Button
                                onClick={handleBack}
                                disabled={loading}
                                variant="outlined"
                                sx={{
                                  borderRadius: isMobile ? '8px' : '10px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: {
                                    xs: '0.85rem',
                                    sm: '0.9rem',
                                    md: '1rem'
                                  },
                                  padding: {
                                    xs: '10px 20px',
                                    sm: '12px 24px',
                                    md: '14px 28px'
                                  },
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                  },
                                  width: isMobile ? '100%' : 'auto',
                                  minWidth: isMobile ? 'auto' : '120px'
                                }}
                              >
                                Back
                              </Button>
                            </motion.div>
                          )}
                          
                          <motion.div
                            whileHover={{ scale: loading ? 1 : (isMobile ? 1.02 : 1.05) }}
                            whileTap={{ scale: loading ? 1 : (isMobile ? 0.98 : 0.95) }}
                            style={{ 
                              width: isMobile ? '100%' : 'auto',
                              order: isMobile ? 1 : 2
                            }}
                          >
                            {activeStep === steps.length - 1 ? (
                              <StyledButton
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                  fontSize: {
                                    xs: '0.85rem',
                                    sm: '0.9rem',
                                    md: '1rem'
                                  },
                                  padding: {
                                    xs: '12px 24px',
                                    sm: '14px 28px',
                                    md: '16px 32px'
                                  },
                                  width: isMobile ? '100%' : 'auto',
                                  minWidth: isMobile ? 'auto' : '150px',
                                  position: 'relative'
                                }}
                              >
                                {loading ? (
                                  <>
                                    <CircularProgress 
                                      size={isMobile ? 20 : isTablet ? 22 : 24} 
                                      sx={{ 
                                        color: 'white',
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        marginLeft: isMobile ? '-10px' : isTablet ? '-11px' : '-12px',
                                        marginTop: isMobile ? '-10px' : isTablet ? '-11px' : '-12px'
                                      }} 
                                    />
                                    <span style={{ visibility: 'hidden' }}>Register Company</span>
                                  </>
                                ) : 'Register Company'}
                              </StyledButton>
                            ) : (
                              <StyledButton
                                onClick={handleNext}
                                variant="contained"
                                disabled={loading}
                                sx={{
                                  fontSize: {
                                    xs: '0.85rem',
                                    sm: '0.9rem',
                                    md: '1rem'
                                  },
                                  padding: {
                                    xs: '12px 24px',
                                    sm: '14px 28px',
                                    md: '16px 32px'
                                  },
                                  width: isMobile ? '100%' : 'auto',
                                  minWidth: isMobile ? 'auto' : '120px'
                                }}
                              >
                                Next
                              </StyledButton>
                            )}
                          </motion.div>
                        </Box>
                      </motion.div>
                      
                      {/* Additional Information */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                      >
                        <Box sx={{ 
                          mt: isMobile ? 3 : 4, 
                          textAlign: 'center',
                          px: isMobile ? 1 : 0
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: {
                                xs: '0.75rem',
                                sm: '0.8rem',
                                md: '0.85rem'
                              },
                              lineHeight: {
                                xs: 1.3,
                                sm: 1.4,
                                md: 1.5
                              },
                              maxWidth: isMobile ? '100%' : isTablet ? '90%' : '85%',
                              mx: 'auto'
                            }}
                          >
                            By registering your company, you agree to our Terms of Service and Privacy Policy.
                            {!isMobile && <br />}
                            {isMobile ? ' ' : ''}A verification email will be sent to the admin email address.
                          </Typography>
                          
                          <Typography 
                            variant="body2" 
                            sx={{
                              mt: isMobile ? 1.5 : 2,
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontSize: {
                                xs: '0.7rem',
                                sm: '0.75rem',
                                md: '0.8rem'
                              },
                              '& a': {
                                color: '#4a90e2',
                                textDecoration: 'none',
                                fontWeight: 500,
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }
                            }}
                          >
                            Already have an account?{' '}
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              style={{ display: 'inline-block' }}
                            >
                              <Button
                                variant="text"
                                onClick={() => navigate('/login')}
                                sx={{
                                  color: '#4a90e2',
                                  textTransform: 'none',
                                  fontSize: 'inherit',
                                  fontWeight: 500,
                                  padding: '2px 4px',
                                  minWidth: 'auto',
                                  '&:hover': {
                                    backgroundColor: 'rgba(74, 144, 226, 0.08)',
                                  }
                                }}
                              >
                                Sign in here
                              </Button>
                            </motion.span>
                          </Typography>
                        </Box>
                      </motion.div>
                      
                      {/* Security and Trust Indicators for larger screens */}
                      {(isTablet || isDesktop) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9, duration: 0.5 }}
                        >
                          <Box sx={{ 
                            mt: 4, 
                            p: 2.5, 
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(76, 175, 80, 0.15)',
                              borderColor: 'rgba(76, 175, 80, 0.3)',
                            }
                          }}>
                            <Typography 
                              variant="caption" 
                              sx={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: {
                                  sm: '0.75rem',
                                  md: '0.8rem',
                                  lg: '0.85rem'
                                },
                                display: 'block',
                                textAlign: 'center',
                                lineHeight: 1.4,
                                fontWeight: 500
                              }}
                            >
                              🛡️ <strong>Secure Registration:</strong> Your data is encrypted and protected. 
                              We follow industry-standard security practices to keep your company information safe.
                            </Typography>
                          </Box>
                        </motion.div>
                      )}
                    </Box>
                  </RegisterPaper>
                </RegisterContent>
              </Container>
            </CenteredContainer>
          </RegisterWrapper>
        </ThemeProvider>
      );
    };
    
    export default RegisterCompanyPage;
    
