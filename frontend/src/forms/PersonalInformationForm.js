import {useState, useEffect} from 'react';
import { TextField, Paper, FormControl, Button, Typography, Grid, Select, MenuItem, InputLabel, FormHelperText, CircularProgress, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from "../api/axiosInstance";
import { toast } from 'react-toastify';

// Add this function to your frontend utility functions
const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // Decode the JWT token (this is a simple decode, not verification)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    return payload.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};





const PersonalInformationForm = ({ nextStep, setEmployeeId, onSave, userEmail, userId }) => {
  const [userID, setUserId] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [userData, setUserData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: userEmail || '',
    workemail: '' ,
  });

  const userIdentifier = userId || userID || getUserIdFromToken() || localStorage.getItem('userId');



  // // Fetch user data when component mounts if userEmail is provided
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     if (userEmail) {
  //       try {
  //         // First get the userId
  //         const userIdResponse = await axios.post('${process.env.REACT_APP_API_URL}/api/auth/get-user-id', {
  //           email: userEmail
  //         });
          
  //         if (userIdResponse.data.success) {
  //           setUserId(userIdResponse.data.userId);
            
  //           // Then fetch the user details
  //           const userDetailsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user/${userIdResponse.data.userId}`);
            
  //           if (userDetailsResponse.data.success) {
  //             const user = userDetailsResponse.data.user;
  //             setUserData({
  //               firstName: user.firstName || '',
  //               middleName: user.middleName || '',
  //               lastName: user.lastName || '',
  //               email: user.email || userEmail
  //             });
  //           }
  //         }
  //       } catch (error) {
  //         console.error('Error fetching user data:', error);
  //         toast.error('Could not retrieve user information. Please try again.');
  //       }
  //     }
  //   };
    
  //   fetchUserData();
  // }, [userEmail]);

  // Update the useEffect for fetching user data
useEffect(() => {
  const fetchUserData = async () => {
    if (userEmail) {
      try {
        // Get the authentication token
        // const token = getAuthToken();
        // const companyCode = localStorage.getItem('companyCode');
        
        // First get the userId
        const userIdResponse = await api.post('auth/get-user-id', 
          {
            email: userEmail
          }
        );
        
        if (userIdResponse.data.success) {
          setUserId(userIdResponse.data.userId);
          
          // Then fetch the user details
          const userDetailsResponse = await api.get(
            `auth/user/${userIdResponse.data.userId}`
          );
          
          if (userDetailsResponse.data.success) {
            const user = userDetailsResponse.data.user;
            setUserData({
              firstName: user.firstName || '',
              middleName: user.middleName || '',
              lastName: user.lastName || '',
              email: user.email || userEmail,
              workemail: user.workemail || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Could not retrieve user information. Please try again.');
      }
    }
  };
  
  fetchUserData();
}, [userEmail]);

  
  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    dob: Yup.date()
      .required('Date of birth is required')
      .max(new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000), 'Employee must be at least 18 years old'),
    gender: Yup.string().required('Gender is required'),
    maritalStatus: Yup.string().required('Marital status is required'),
    bloodGroup: Yup.string().required('Blood group is required'),
    nationality: Yup.string().required('Nationality is required'),
    aadharNumber: Yup.string()
      .matches(/^[0-9]{12}$/, 'Aadhar number must be 12 digits')
      .required('Aadhar number is required'),
    panNumber: Yup.string()
      .matches(/^[A-Z0-9]{10}$/, 'PAN number must be 10 characters')
      .required('PAN number is required'),
    mobileNumber: Yup.string()
      .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
      .required('Mobile number is required'),
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required')
      .trim(),
    workemail: Yup.string()
      .email('Invalid email format')
      .required('Email is required')
      .trim(),
    prefix: Yup.string().required('Prefix is required'),
    employeeImage: Yup.mixed().required('Profile photo is required'),
    dobDay: Yup.number().required('Day is required'),
    dobMonth: Yup.string().required('Month is required'),
    dobYear: Yup.number().required('Year is required')
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const prefixOptions = [
    {value: 'Mr.', gender: 'Male'},
    {value: 'Ms.', gender: 'Female'},
    {value: 'Dr.', gender: 'Null'}
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const [personalInfo, setPersonalInfo] = useState({
    prefix: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    maritalStatus: '',
    bloodGroup: '',
    nationality: '',
    aadharNumber: '',
    panNumber: '',
    mobileNumber: '',
    email: '',
    workemail: ''
  });
  
  const [imageFile, setImageFile] = useState(null);

  const genderOptions = {
    'Mr.': ['Male'],
    'Ms.': ['Female'],
    'Dr.': ['Male', 'Female', 'Other']
  };

  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];

  // Update initialValues to use userData
  const initialValues = {
    prefix: '',
    firstName: userData.firstName || '',
    middleName: userData.middleName || '',
    lastName: userData.lastName || '',
    dob: new Date(),
    dobDay: new Date().getDate(),
    dobMonth: months[new Date().getMonth()],
    dobYear: new Date().getFullYear(),
    gender: '',
    maritalStatus: '',
    bloodGroup: '',
    nationality: '',
    aadharNumber: '',
    panNumber: '',
    mobileNumber: '',
    email: userData.email || userEmail || '',
    workemail: userData.workemail ||  '',
    employeeImage: null
  };

  const handleSave = async (values, { setSubmitting, setErrors }) => {
    try {
      setIsSubmitting(true);
      setFormError('');
      
      // First try to get userId from props, then from state, then from localStorage
      const userIdentifier = userId || userID || localStorage.getItem('userId');
      
      if (!userIdentifier) {
        // If we have userEmail but no userId, try to fetch it
        if (userEmail) {
          try {
            const response = await api.post('auth/get-user-id', {
              email: userEmail
            });
            
            if (response.data.success) {
              // Use the fetched userId
              const fetchedUserId = response.data.userId;
              
              // Store it for future use
              localStorage.setItem('userId', fetchedUserId);
              
              // Continue with form submission using the fetched userId
              await submitFormWithUserId(fetchedUserId, values, setErrors);
              return;
            }
          } catch (error) {
            console.error('Error fetching user ID:', error);
          }
        }
        
        setFormError('User ID not found. Please log in again.');
        toast.error('User ID not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      
      // If we have a userId, proceed with form submission
      await submitFormWithUserId(userIdentifier, values, setErrors);
    } catch (error) {
      console.error('Error saving personal info:', error.response?.data || error.message);
      
      // Show appropriate error messages
      if (error.response?.data?.error?.includes('duplicate key error')) {
        if (error.response.data.error.includes('aadharNumber')) {
          setErrors({ aadharNumber: 'This Aadhar number is already registered' });
          toast.error('This Aadhar number is already registered');
        } else if (error.response.data.error.includes('panNumber')) {
          setErrors({ panNumber: 'This PAN number is already registered' });
          toast.error('This PAN number is already registered');
        } else if (error.response.data.error.includes('email')) {
          setErrors({ email: 'This email is already registered' });
          toast.error('This email is already registered');
        } else {
          setFormError('A duplicate entry was detected. Please check your information.');
          toast.error('A duplicate entry was detected. Please check your information.');
        }
      } else if (error.response?.data?.error?.includes('userId')) {
        setFormError('User ID is required. Please log in again.');
        toast.error('User ID is required. Please log in again.');
      } else {
        setFormError('Error saving personal information. Please try again.');
        toast.error('Error saving personal information. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };
  
  // // Helper function to submit the form with a userId
  // const submitFormWithUserId = async (userIdentifier, values, setErrors) => {
  //   // Collect form data from the Formik values
  //   const personalInfoData = {
  //     prefix: values.prefix,
  //     firstName: values.firstName,
  //     lastName: values.lastName,
  //     dob: values.dob,
  //     gender: values.gender,
  //     maritalStatus: values.maritalStatus,
  //     bloodGroup: values.bloodGroup,
  //     nationality: values.nationality,
  //     aadharNumber: values.aadharNumber || undefined,
  //     panNumber: values.panNumber || undefined,
  //     mobileNumber: values.mobileNumber,
  //     email: values.email || undefined
  //   };
    
  //   // Create FormData object for file upload
  //   const formData = new FormData();
    
  //   // Include userId in the form data
  //   formData.append('formData', JSON.stringify({ 
  //     userId: userIdentifier,
  //     personalInfo: personalInfoData 
  //   }));
    
  //   // Add image file if it exists
  //   if (values.employeeImage) {
  //     formData.append('employeeImage', values.employeeImage);
  //   }
  
  //   const response = await axios.post(
  //     '${process.env.REACT_APP_API_URL}/api/employees/personal-info',
  //     formData,
  //     {
  //       headers: {
  //         'Content-Type': 'multipart/form-data'
  //       }
  //     }
  //   );
  
  //   if (response.data.success) {
  //     // Call onSave with the employee ID
  //     onSave(response.data.employeeId);
  //     // Navigate to next step
  //     nextStep();
  //     toast.success('Personal information saved successfully');
  //   }
  // };

  // Update the submitFormWithUserId function
  const submitFormWithUserId = async (userIdentifier, values, setErrors) => {
    // Collect form data from the Formik values
    const personalInfoData = {
      prefix: values.prefix,
      firstName: values.firstName,
      lastName: values.lastName,
      dob: values.dob,
      gender: values.gender,
      maritalStatus: values.maritalStatus,
      bloodGroup: values.bloodGroup,
      nationality: values.nationality,
      aadharNumber: values.aadharNumber || undefined,
      panNumber: values.panNumber || undefined,
      mobileNumber: values.mobileNumber,
      email: values.email || undefined,
      workemail: values.workemail || undefined
    };
    
    // Create FormData object for file upload
    const formData = new FormData();
    
    // Include userId in the form data
    formData.append('formData', JSON.stringify({ 
      userId: userIdentifier,
      personalInfo: personalInfoData 
    }));
    
    // Add image file if it exists
    if (values.employeeImage) {
      formData.append('employeeImage', values.employeeImage);
    }
  
    // // Get the authentication token
    // const token = getAuthToken();
    
    // // Get the company code from localStorage
    // const companyCode = localStorage.getItem('companyCode');
    
    // if (!companyCode) {
    //   throw new Error('Company code not found. Please log in again.');
    // }
  
    const response = await api.post(
      'employees/personal-info',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',

        }
      }
    );
  
    if (response.data.success) {
      // Call onSave with the employee ID
      onSave(response.data.employeeId);
      // Navigate to next step
      nextStep();
      toast.success('Personal information saved successfully');
    }
  };


  
  
  const handleError = (error) => {
    // Handle validation errors from backend
    if (error?.details) {
      error.details.forEach(detail => {
        // Extract field name from the path
        const fieldMatch = detail.match(/Path `(.+)` is required/);
        if (fieldMatch) {
          const field = fieldMatch[1];
          // Map backend field paths to user-friendly messages
          const fieldMessages = {
            'personalInfo.prefix': 'Title/Prefix',
            'personalInfo.firstName': 'First Name',
            'personalInfo.lastName': 'Last Name',
            'personalInfo.dob': 'Date of Birth',
            'personalInfo.gender': 'Gender',
            'personalInfo.maritalStatus': 'Marital Status',
            'personalInfo.bloodGroup': 'Blood Group',
            'personalInfo.nationality': 'Nationality',
            'personalInfo.aadharNumber': 'Aadhar Number',
            'personalInfo.panNumber': 'PAN Number',
            'personalInfo.mobileNumber': 'Mobile Number',
            'personalInfo.email': 'Email Address',
            'personalInfo.workemail': 'Work Email Address',
            'personalInfo.employeeImage': 'Profile Photo'
          };
          
          const fieldName = fieldMessages[field] || field;
          toast.error(`${fieldName} is required`);
        } else {
          // Handle other validation errors
          toast.error(detail);
        }
      });
    } else if (error?.message) {
      // Handle specific error messages
      switch (error.field) {
        case 'email':
          toast.error('This email address is already registered');
          break;
          case 'workemail':
            toast.error('This email address is already registered');
            break;
        case 'aadharNumber':
          toast.error('This Aadhar number is already in use');
          break;
        case 'panNumber':
          toast.error('This PAN number is already registered');
          break;
        case 'mobileNumber':
          toast.error('This mobile number is already in use');
          break;
        default:
          toast.error(error.message);
      }
    } else {
      // Generic error message
      toast.error('Please fill in all required fields correctly');
    }
  };
  
  
    
  const AnimatedTextField = ({ field, form, label, ...props }) => {
    const handleChange = (e) => {
      if (field.name === 'email' || field.name === 'workemail') {
        form.setFieldValue(field.name, e.target.value);
        return;
      }
      
      if (field.name === 'panNumber') {
        form.setFieldValue(field.name, e.target.value.toUpperCase());
        return;
      }
      
      const sentenceCaseValue = e.target.value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      form.setFieldValue(field.name, sentenceCaseValue);
    };
    return (
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <TextField
          {...field}
          {...props}
          label={label}
          onChange={handleChange}
          error={form.touched[field.name] && Boolean(form.errors[field.name])}
          helperText={form.touched[field.name] && form.errors[field.name]}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: 'primary.main',
                borderWidth: '2px',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                borderWidth: '2px',
              }
            },
            '& .MuiInputBase-input': {
              color: '#000000',
            }
          }}
        />
      </motion.div>
    );
  };
  return (
    <Formik
      initialValues={{
        ...initialValues,
      email: userEmail || initialValues.email,
      workemail: userData.workemail || initialValues.workemail
      }}
      enableReinitialize={true}
      validationSchema={validationSchema}
      onSubmit={handleSave}
    >
      {({ errors, touched, setFieldValue, values, isSubmitting, handleSubmit }) => (
        <Form>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Personal Information
            </Typography>

            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Name fields */}
              <Grid item container spacing={2}>
                <Grid item xs={2}>
                  <FormControl fullWidth error={touched.prefix && Boolean(errors.prefix)}>
                    <InputLabel>Title</InputLabel>
                    <Field name="prefix">
                      {({ field, form }) => (
                        <Select
                          {...field}
                          label="Title"
                          displayEmpty
                          error={touched.prefix && Boolean(errors.prefix)}
                          onChange={(e) => {
                            const selectedPrefix = prefixOptions.find(p => p.value === e.target.value);
                            form.setFieldValue('prefix', e.target.value);
                            if (selectedPrefix.gender !== 'Null') {
                              form.setFieldValue('gender', selectedPrefix.gender);
                            }
                          }}
                        >
                          <MenuItem value="" disabled>Title</MenuItem>
                          {prefixOptions.map(prefix => (
                            <MenuItem key={prefix.value} value={prefix.value}>{prefix.value}</MenuItem>
                          ))}
                        </Select>
                      )}
                    </Field>
                    {touched.prefix && errors.prefix && (
                      <FormHelperText error>{errors.prefix}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <Field
                    name="firstName"
                    component={AnimatedTextField}
                    label="First Name"
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={3}>
                  <Field
                    name="middleName"
                    component={AnimatedTextField}
                    label="Middle Name"
                    fullWidth
                  />
                </Grid>

                <Grid item xs={4}>
                  <Field
                    name="lastName"
                    component={AnimatedTextField}
                    label="Last Name"
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>

              {/* Date of Birth */}
              <Grid item xs={12} >
                <Typography variant="body1" gutterBottom>Date of Birth</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <FormControl fullWidth error={touched.dobDay && Boolean(errors.dobDay)}>
                      <InputLabel>Date</InputLabel>
                      <Field name="dobDay">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Date"
                            error={touched.dobDay && Boolean(errors.dobDay)}
                            onChange={(e) => {
                              form.setFieldValue('dobDay', e.target.value);
                              const newDate = new Date(
                                form.values.dobYear,
                                months.indexOf(form.values.dobMonth),
                                e.target.value
                              );
                              form.setFieldValue('dob', newDate);
                            }}
                          >
                            {days.map(day => (
                              <MenuItem key={day} value={day}>{day}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {touched.dobDay && errors.dobDay && (
                        <FormHelperText error>{errors.dobDay}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={4}>
                    <FormControl fullWidth error={touched.dobMonth && Boolean(errors.dobMonth)}>
                      <InputLabel>Month</InputLabel>
                      <Field name="dobMonth">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Month"
                            error={touched.dobMonth && Boolean(errors.dobMonth)}
                            onChange={(e) => {
                              form.setFieldValue('dobMonth', e.target.value);
                              const newDate = new Date(
                                form.values.dobYear,
                                months.indexOf(e.target.value),
                                form.values.dobDay
                              );
                              form.setFieldValue('dob', newDate);
                            }}
                          >
                            {months.map(month => (
                              <MenuItem key={month} value={month}>{month}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {touched.dobMonth && errors.dobMonth && (
                        <FormHelperText error>{errors.dobMonth}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={4}>
                    <FormControl fullWidth error={touched.dobYear && Boolean(errors.dobYear)}>
                      <InputLabel>Year</InputLabel>
                      <Field name="dobYear">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Year"
                            error={touched.dobYear && Boolean(errors.dobYear)}
                            onChange={(e) => {
                              form.setFieldValue('dobYear', e.target.value);
                              const newDate = new Date(
                                e.target.value,
                                months.indexOf(form.values.dobMonth),
                                form.values.dobDay
                              );
                              form.setFieldValue('dob', newDate);
                            }}
                          >
                            {years.map(year => (
                              <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {touched.dobYear && errors.dobYear && (
                        <FormHelperText error>{errors.dobYear}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
                {touched.dob && errors.dob && (
                  <FormHelperText error>{errors.dob}</FormHelperText>
                )}
              </Grid>

              {/* Gender */}
              <Grid item xs={12} sm={6} >
                <FormControl fullWidth error={touched.gender && Boolean(errors.gender)}>
                  <InputLabel>Gender</InputLabel>
                  <Field name="gender">
                    {({ field }) => (
                      <Select
                        {...field}
                        label="Gender"
                        error={touched.gender && Boolean(errors.gender)}
                      >
                        <MenuItem value="">Select Gender</MenuItem>
                        {genderOptions[values.prefix]?.map(gender => (
                          <MenuItem key={gender} value={gender}>{gender}</MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {touched.gender && errors.gender && (
                    <FormHelperText error>{errors.gender}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Marital Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={touched.maritalStatus && Boolean(errors.maritalStatus)}>
                  <InputLabel>Marital Status</InputLabel>
                  <Field name="maritalStatus">
                    {({ field }) => (
                      <Select
                        {...field}
                        label="Marital Status"
                        error={touched.maritalStatus && Boolean(errors.maritalStatus)}
                      >
                        <MenuItem value="">Select Marital Status</MenuItem>
                        {maritalStatusOptions.map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {touched.maritalStatus && errors.maritalStatus && (
                    <FormHelperText error>{errors.maritalStatus}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Blood Group */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={touched.bloodGroup && Boolean(errors.bloodGroup)}>
                  <InputLabel>Blood Group</InputLabel>
                  <Field name="bloodGroup">
                    {({ field }) => (
                      <Select
                        {...field}
                        label="Blood Group"
                        error={touched.bloodGroup && Boolean(errors.bloodGroup)}
                      >
                        <MenuItem value="">Select Blood Group</MenuItem>
                        {bloodGroups.map(group => (
                          <MenuItem key={group} value={group}>{group}</MenuItem>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {touched.bloodGroup && errors.bloodGroup && (
                    <FormHelperText error>{errors.bloodGroup}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Nationality */}
              <Grid item xs={12} sm={6}>
                <Field
                  name="nationality"
                  component={AnimatedTextField}
                  label="Nationality"
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Field
                  name="aadharNumber"
                  component={AnimatedTextField}
                  label="Aadhar Number"
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Field
                  name="panNumber"
                  component={AnimatedTextField}
                  label="PAN Number"
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Field
                  name="mobileNumber"
                  component={AnimatedTextField}
                  label="Mobile Number"
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Field
                  name="email"
                  component={AnimatedTextField}
                  label="Email"
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Field
                  name="workemail"
                  component={AnimatedTextField}
                  label="Work Email"
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <InputLabel required>Employee Image</InputLabel>
                <Field name="employeeImage">
                  {({ field, form }) => (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.currentTarget.files[0];
                          if (file) {
                            if (file.size > 5002000) {
                              toast.error('Image size should be less than 5MB');
                              return;
                            }
                            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                              toast.error('Only JPG, JPEG & PNG files are allowed');
                              return;
                            }
                            form.setFieldValue("employeeImage", file);
                          }
                        }}
                      />
                      {form.touched.employeeImage && form.errors.employeeImage && (
                        <Typography color="error" variant="caption">
                          {form.errors.employeeImage}
                        </Typography>
                      )}
                    </div>
                  )}
                </Field>
              </Grid>
            </Grid>

            {/* Submit button */}
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: '20px' }}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 2, py: 1.5 }}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Saving...
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            </motion.div>

            {/* Display any form-level errors */}
            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Please correct the errors above before proceeding.
              </Alert>
            )}
          </Paper>
        </Form>
      )}
    </Formik>
  );
};

export default PersonalInformationForm;


// import {useState,useEffect} from 'react';
// import { TextField, Paper, FormControl, Button, Typography, Grid, Select, MenuItem, InputLabel, FormHelperText } from '@mui/material';
// import { motion } from 'framer-motion';
// import { Formik, Form, Field } from 'formik';
// import * as Yup from 'yup';
// import axios from 'axios';
// import { toast } from 'react-toastify';


// const PersonalInformationForm = ({ nextStep ,setEmployeeId, onSave,userEmail,userId}) => {
//   const[userID, setUserId] = useState(userEmail);

//   // Fetch userId when component mounts if userEmail is provided
//   useEffect(() => {
//     const fetchUserId = async () => {
//       if (userEmail) {
//         try {
//           const response = await axios.post('${process.env.REACT_APP_API_URL}/api/auth/get-user-id', {
//             email: userEmail
//           });
          
//           if (response.data.success) {
//             setUserId(response.data.userId);
//           }
//         } catch (error) {
//           console.error('Error fetching user ID:', error);
//           toast.error('Could not retrieve user information. Please try again.');
//         }
//       }
//     };
    
//     fetchUserId();
//   }, [userEmail]);
  
// const validationSchema = Yup.object().shape({
//   firstName: Yup.string().required('First name is required'),
//   lastName: Yup.string().required('Last name is required'),
//   dob: Yup.date()
//     .required('Date of birth is required')
//     .max(new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000), 'Employee must be at least 18 years old'),
//   gender: Yup.string().required('Gender is required'),
//   maritalStatus: Yup.string().required('Marital status is required'),
//   bloodGroup: Yup.string().required('Blood group is required'),
//   nationality: Yup.string().required('Nationality is required'),
//   aadharNumber: Yup.string()
//     .matches(/^[0-9]{12}$/, 'Aadhar number must be 12 digits')
//     .required('Aadhar number is required'),
//   panNumber: Yup.string()
//     .matches(/^[A-Z0-9]{10}$/, 'PAN number must be 10 characters')
//     .required('PAN number is required'),
//   mobileNumber: Yup.string()
//     .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
//     .required('Mobile number is required'),
//   email: Yup.string()
//     .email('Invalid email format')
//     .required('Email is required')
//     .trim(),
//   prefix: Yup.string().required('Prefix is required'),
//   employeeImage: Yup.mixed().required('Profile photo is required')
// });

// const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
// const prefixOptions = [
//   {value: 'Mr.', gender: 'Male'},
//   {value: 'Ms.', gender: 'Female'},
//   {value: 'Dr.', gender: 'Null'}
// ];
// const days = Array.from({ length: 31 }, (_, i) => i + 1);
// const months = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December'
// ];
// const currentYear = new Date().getFullYear();
// const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

// const[personalInfo,setPersonalInfo] = useState({
//     prefix: '',
//     firstName: '',
//     lastName: '',
//     dob: '',
//     gender: '',
//     maritalStatus: '',
//     bloodGroup: '',
//     nationality: '',
//     aadharNumber: '',
//     panNumber: '',
//     mobileNumber: '',
//     email: ''
// });
// const [imageFile, setImageFile] = useState(null);

// const genderOptions = {
//   'Mr.': ['Male'],
//   'Ms.': ['Female'],
//   'Dr.': ['Male', 'Female', 'Other']
// };

// const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];

//   const initialValues = {
//     prefix: '',
//     firstName: '',
//     middleName: '',
//     lastName: '',
//     dob: new Date(),
//     dobDay: new Date().getDate(),
//     dobMonth: months[new Date().getMonth()],
//     dobYear: new Date().getFullYear(),
//     gender: '',
//     maritalStatus: '',
//     bloodGroup: '',
//     nationality: '',
//     aadharNumber: '',
//     panNumber: '',
//     mobileNumber: '',
//     email: '',
//     employeeImage: null
//   };

//   const handleSave = async (values) => {
//     try {
//       // Get the userId from localStorage (assuming it's stored there after login)
//       const userId = localStorage.getItem('userId');
      
//       if (!userId) {
//         toast.error('User ID not found. Please log in again.');
//         return;
//       }
      
//       // Collect form data from the Formik values
//       const personalInfoData = {
//         prefix: values.prefix,
//         firstName: values.firstName,
//         lastName: values.lastName,
//         dob: values.dob,
//         gender: values.gender,
//         maritalStatus: values.maritalStatus,
//         bloodGroup: values.bloodGroup,
//         nationality: values.nationality,
//         aadharNumber: values.aadharNumber || undefined, // Use undefined instead of empty string
//         panNumber: values.panNumber || undefined,
//         mobileNumber: values.mobileNumber,
//         email: values.email || undefined
//       };
      
//       // Create FormData object for file upload
//       const formData = new FormData();
      
//       // Include userId in the form data
//       formData.append('formData', JSON.stringify({ 
//         userId: userId,
//         personalInfo: personalInfoData 
//       }));
      
//       // Add image file if it exists
//       if (values.employeeImage) {
//         formData.append('employeeImage', values.employeeImage);
//       }
    
//       const response = await axios.post(
//         '${process.env.REACT_APP_API_URL}/api/employees/personal-info',
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data'
//           }
//         }
//       );
    
//       if (response.data.success) {
//         // Call onSave with the employee ID
//         onSave(response.data.employeeId);
//         // Navigate to next step
//         nextStep();
//         toast.success('Personal information saved successfully');
//       }
//     } catch (error) {
//       console.error('Error saving personal info:', error.response?.data || error.message);
      
//       // Show appropriate error messages
//       if (error.response?.data?.error?.includes('duplicate key error')) {
//         if (error.response.data.error.includes('aadharNumber')) {
//           toast.error('This Aadhar number is already registered');
//         } else if (error.response.data.error.includes('panNumber')) {
//           toast.error('This PAN number is already registered');
//         } else if (error.response.data.error.includes('email')) {
//           toast.error('This email is already registered');
//         } else {
//           toast.error('A duplicate entry was detected. Please check your information.');
//         }
//       } else if (error.response?.data?.error?.includes('userId')) {
//         toast.error('User ID is required. Please log in again.');
//       } else {
//         toast.error('Error saving personal information. Please try again.');
//       }
//     }
//   };
  
//   // const handleSave = async (values) => {
//   //   try {
//   //     // Collect form data from the Formik values
//   //     const personalInfoData = {
//   //       prefix: values.prefix,
//   //       firstName: values.firstName,
//   //       lastName: values.lastName,
//   //       dob: values.dob,
//   //       gender: values.gender,
//   //       maritalStatus: values.maritalStatus,
//   //       bloodGroup: values.bloodGroup,
//   //       nationality: values.nationality,
//   //       aadharNumber: values.aadharNumber || undefined, // Use undefined instead of empty string
//   //       panNumber: values.panNumber || undefined,
//   //       mobileNumber: values.mobileNumber,
//   //       email: values.email || undefined
//   //     };
      
//   //     // Create FormData object for file upload
//   //     const formData = new FormData();

//   //     // Add userId to the form data if available
//   //     const formDataObj = { 
//   //       personalInfo: personalInfoData 
//   //     };
      
//   //     if (userId) {
//   //       formDataObj.userId = userId;
//   //     }

//   //     formData.append('formData', JSON.stringify({ personalInfo: personalInfoData }));
      
//   //     // Add image file if it exists
//   //     if (values.employeeImage) {
//   //       formData.append('employeeImage', values.employeeImage);
//   //     }
    
//   //     const response = await axios.post(
//   //       '${process.env.REACT_APP_API_URL}/api/employees/personal-info',
//   //       formData,
//   //       {
//   //         headers: {
//   //           'Content-Type': 'multipart/form-data'
//   //         }
//   //       }
//   //     );
    
//   //     if (response.data.success) {
//   //       // Store userId in localStorage for future use
//   //       if (userId) {
//   //         localStorage.setItem('userId', userId);
//   //       }
//   //       // Call onSave with the employee ID
//   //       onSave(response.data.employeeId);
//   //       // Navigate to next step
//   //       nextStep();
//   //       toast.success('Personal information saved successfully');
//   //     }
//   //   } catch (error) {
//   //     console.error('Error saving personal info:', error.response?.data || error.message);
      
//   //     // Show appropriate error messages
//   //     if (error.response?.data?.error?.includes('duplicate key error')) {
//   //       if (error.response.data.error.includes('aadharNumber')) {
//   //         toast.error('This Aadhar number is already registered');
//   //       } else if (error.response.data.error.includes('panNumber')) {
//   //         toast.error('This PAN number is already registered');
//   //       } else if (error.response.data.error.includes('email')) {
//   //         toast.error('This email is already registered');
//   //       } else {
//   //         toast.error('A duplicate entry was detected. Please check your information.');
//   //       }
//   //     } else {
//   //       toast.error('Error saving personal information. Please try again.');
//   //     }
//   //   }
//   // };  
  
//   const handleError = (error) => {
//     // Handle validation errors from backend
//     if (error?.details) {
//       error.details.forEach(detail => {
//         // Extract field name from the path
//         const fieldMatch = detail.match(/Path `(.+)` is required/);
//         if (fieldMatch) {
//           const field = fieldMatch[1];
//           // Map backend field paths to user-friendly messages
//           const fieldMessages = {
//             'personalInfo.prefix': 'Title/Prefix',
//             'personalInfo.firstName': 'First Name',
//             'personalInfo.lastName': 'Last Name',
//             'personalInfo.dob': 'Date of Birth',
//             'personalInfo.gender': 'Gender',
//             'personalInfo.maritalStatus': 'Marital Status',
//             'personalInfo.bloodGroup': 'Blood Group',
//             'personalInfo.nationality': 'Nationality',
//             'personalInfo.aadharNumber': 'Aadhar Number',
//             'personalInfo.panNumber': 'PAN Number',
//             'personalInfo.mobileNumber': 'Mobile Number',
//             'personalInfo.email': 'Email Address',
//             'personalInfo.employeeImage': 'Profile Photo'
//           };
          
//           const fieldName = fieldMessages[field] || field;
//           toast.error(`${fieldName} is required`);
//         } else {
//           // Handle other validation errors
//           toast.error(detail);
//         }
//       });
//     } else if (error?.message) {
//       // Handle specific error messages
//       switch (error.field) {
//         case 'email':
//           toast.error('This email address is already registered');
//           break;
//         case 'aadharNumber':
//           toast.error('This Aadhar number is already in use');
//           break;
//         case 'panNumber':
//           toast.error('This PAN number is already registered');
//           break;
//         case 'mobileNumber':
//           toast.error('This mobile number is already in use');
//           break;
//         default:
//           toast.error(error.message);
//       }
//     } else {
//       // Generic error message
//       toast.error('Please fill in all required fields correctly');
//     }
//   };
  
  
    
//   const AnimatedTextField = ({ field, form, label, ...props }) => {
//     const handleChange = (e) => {
//       if (field.name === 'email') {
//         form.setFieldValue(field.name, e.target.value);
//         return;
//       }
      
//       if (field.name === 'panNumber') {
//         form.setFieldValue(field.name, e.target.value.toUpperCase());
//         return;
//       }
      
//       const sentenceCaseValue = e.target.value
//         .split(' ')
//         .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//         .join(' ');
//       form.setFieldValue(field.name, sentenceCaseValue);
//     };
//     return (
//       <motion.div
//         initial={{ scale: 0.98, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         transition={{ duration: 0.3 }}
//       >
//         <TextField
//           {...field}
//           {...props}
//           label={label}
//           onChange={handleChange}
//           sx={{
//             '& .MuiOutlinedInput-root': {
//               '&:hover fieldset': {
//                 borderColor: 'primary.main',
//                 borderWidth: '2px',
//               },
//               '&.Mui-focused fieldset': {
//                 borderColor: 'primary.main',
//                 borderWidth: '2px',
//               }
//             },
//             '& .MuiInputBase-input': {
//               color: '#000000',
//             }
//           }}
//         />
//       </motion.div>
//     );
//   };
//   return (
//     <Formik
//       initialValues={{
//         ...initialValues,
//       email: userEmail || initialValues.email}}
//       validationSchema={validationSchema}
//       onSubmit={handleSave}
//     >
//       {({ errors, touched, setFieldValue, values }) => (
//         <Form>
//           <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
//             <Typography variant="h5" gutterBottom color="primary">
//               Personal Information
//             </Typography>

//             <Grid container spacing={3}>
//               {/* Name fields */}
//               <Grid item container spacing={2}>
//                 <Grid item xs={2}>
//                   <FormControl fullWidth>
//                     <Field name="prefix">
//                       {({ field, form }) => (
//                         <Select
//                           {...field}
//                           label="Title"
//                           displayEmpty
//                           error={touched.prefix && errors.prefix}
//                           onChange={(e) => {
//                             const selectedPrefix = prefixOptions.find(p => p.value === e.target.value);
//                             form.setFieldValue('prefix', e.target.value);
//                             if (selectedPrefix.gender !== 'Null') {
//                               form.setFieldValue('gender', selectedPrefix.gender);
//                             }
//                           }}
//                         >
//                           <MenuItem value="" disabled>Title</MenuItem>
//                           {prefixOptions.map(prefix => (
//                             <MenuItem key={prefix.value} value={prefix.value}>{prefix.value}</MenuItem>
//                           ))}
//                         </Select>
//                       )}
//                     </Field>
//                   </FormControl>
//                 </Grid>
//                 <Grid item xs={3}>
//                   <Field
//                     name="firstName"
//                     component={AnimatedTextField}
//                     label="First Name"
//                     fullWidth
//                   />
//                 </Grid>

//                 <Grid item xs={3}>
//                   <Field
//                     name="middleName"
//                     component={AnimatedTextField}
//                     label="Middle Name"
//                     fullWidth
//                   />
//                 </Grid>

//                 <Grid item xs={4}>
//                   <Field
//                     name="lastName"
//                     component={AnimatedTextField}
//                     label="Last Name"
//                     fullWidth
//                   />
//                 </Grid>
//               </Grid>

//               {/* Date of Birth */}
//               <Grid item xs={12} >
//                 <Typography variant="body1" gutterBottom>Date of Birth</Typography>
//                 <Grid container spacing={2}>
//                   <Grid item xs={4}>
//                     <FormControl fullWidth>
//                       <InputLabel>Date</InputLabel>
//                       <Field name="dobDay">
//                         {({ field, form }) => (
//                           <Select
//                             {...field}
//                             label="Date"
//                             onChange={(e) => {
//                               form.setFieldValue('dobDay', e.target.value);
//                               const newDate = new Date(
//                                 form.values.dobYear,
//                                 months.indexOf(form.values.dobMonth),
//                                 e.target.value
//                               );
//                               form.setFieldValue('dob', newDate);
//                             }}
//                           >
//                             {days.map(day => (
//                               <MenuItem key={day} value={day}>{day}</MenuItem>
//                             ))}
//                           </Select>
//                         )}
//                       </Field>
//                     </FormControl>
//                   </Grid>

//                   <Grid item xs={4}>
//                     <FormControl fullWidth>
//                       <InputLabel>Month</InputLabel>
//                       <Field name="dobMonth">
//                         {({ field, form }) => (
//                           <Select
//                             {...field}
//                             label="Month"
//                             onChange={(e) => {
//                               form.setFieldValue('dobMonth', e.target.value);
//                               const newDate = new Date(
//                                 form.values.dobYear,
//                                 months.indexOf(e.target.value),
//                                 form.values.dobDay
//                               );
//                               form.setFieldValue('dob', newDate);
//                             }}
//                           >
//                             {months.map(month => (
//                               <MenuItem key={month} value={month}>{month}</MenuItem>
//                             ))}
//                           </Select>
//                         )}
//                       </Field>
//                     </FormControl>
//                   </Grid>

//                   <Grid item xs={4}>
//                     <FormControl fullWidth>
//                       <InputLabel>Year</InputLabel>
//                       <Field name="dobYear">
//                         {({ field, form }) => (
//                           <Select
//                             {...field}
//                             label="Year"
//                             onChange={(e) => {
//                               form.setFieldValue('dobYear', e.target.value);
//                               const newDate = new Date(
//                                 e.target.value,
//                                 months.indexOf(form.values.dobMonth),
//                                 form.values.dobDay
//                               );
//                               form.setFieldValue('dob', newDate);
//                             }}
//                           >
//                             {years.map(year => (
//                               <MenuItem key={year} value={year}>{year}</MenuItem>
//                             ))}
//                           </Select>
//                         )}
//                       </Field>
//                     </FormControl>
//                   </Grid>
//                 </Grid>
//               </Grid>

//               {/* Gender */}

// <Grid item xs={12} sm={6} >
//   <FormControl fullWidth error={touched.gender && errors.gender}>
//     <InputLabel>Gender</InputLabel>
//     <Field name="gender">
//       {({ field }) => (
//         <Select
//           {...field}
//           label="Gender"
//         >
//           <MenuItem value="">Select Gender</MenuItem>
//           {genderOptions[values.prefix]?.map(gender => (
//             <MenuItem key={gender} value={gender}>{gender}</MenuItem>
//           ))}
//         </Select>
//       )}
//     </Field>
//     {touched.gender && errors.gender && (
//       <FormHelperText>{errors.gender}</FormHelperText>
//     )}
//   </FormControl>
// </Grid>

//     {/* Marital Status */}

// <Grid item xs={12} sm={6}>
//   <FormControl fullWidth error={touched.maritalStatus && errors.maritalStatus}>
//     <InputLabel>Marital Status</InputLabel>
//     <Field name="maritalStatus">
//       {({ field }) => (
//         <Select
//           {...field}
//           label="Marital Status"
//         >
//           <MenuItem value="">Select Marital Status</MenuItem>
//           {maritalStatusOptions.map(status => (
//             <MenuItem key={status} value={status}>{status}</MenuItem>
//           ))}
//         </Select>
//       )}
//     </Field>
//     {touched.maritalStatus && errors.maritalStatus && (
//       <FormHelperText>{errors.maritalStatus}</FormHelperText>
//     )}
//   </FormControl>
// </Grid>

//     {/* Blood Group */}

// <Grid item xs={12} sm={6}>
//   <FormControl fullWidth error={touched.bloodGroup && errors.bloodGroup}>
//     <InputLabel>Blood Group</InputLabel>
//     <Field name="bloodGroup">
//       {({ field }) => (
//         <Select
//           {...field}
//           label="Blood Group"
//         >
//           <MenuItem value="">Select Blood Group</MenuItem>
//           {bloodGroups.map(group => (
//             <MenuItem key={group} value={group}>{group}</MenuItem>
//           ))}
//         </Select>
//       )}
//     </Field>
//     {touched.bloodGroup && errors.bloodGroup && (
//       <FormHelperText>{errors.bloodGroup}</FormHelperText>
//     )}
//   </FormControl>
// </Grid>


//               {/* Nationality */}
//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="nationality"
//                   component={AnimatedTextField}
//                   label="Nationality"
//                   fullWidth
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="aadharNumber"
//                   component={AnimatedTextField}
//                   label="Aadhar Number"
//                   fullWidth
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="panNumber"
//                   component={AnimatedTextField}
//                   label="PAN Number"
//                   fullWidth
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="mobileNumber"
//                   component={AnimatedTextField}
//                   label="Mobile Number"
//                   fullWidth
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="email"
//                   component={AnimatedTextField}
//                   label="Email"
//                   fullWidth
//                 />
//               </Grid>

//               <Grid item xs={12}>
//   <InputLabel required>Employee Image</InputLabel>
//   <Field name="employeeImage">
//     {({ field, form }) => (
//       <div>
//         <input
//   type="file"
//   accept="image/*"
//   onChange={(event) => {
//     const file = event.currentTarget.files[0];
//     if (file) {
//       if (file.size > 5002000) {
//         toast.error('Image size should be less than 5MB');
//         return;
//       }
//       if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
//         toast.error('Only JPG, JPEG & PNG files are allowed');
//         return;
//       }
//       form.setFieldValue("employeeImage", file);
//     }
//   }}
// />
//         {form.touched.employeeImage && form.errors.employeeImage && (
//           <Typography color="error" variant="caption">
//             {form.errors.employeeImage}
//           </Typography>
//         )}
//       </div>
//     )}
//   </Field>
// </Grid>
// </Grid>

//             {/* Submit button */}

//             <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
//             <Button
//   type="submit" // Change to submit type to trigger Formik validation
//   variant="contained"
//   color="primary"
//   fullWidth
// >
//   Next
// </Button>
//             </motion.div>
//           </Paper>
//         </Form>
//       )}
//     </Formik>
//   );
// };

// export default PersonalInformationForm;

