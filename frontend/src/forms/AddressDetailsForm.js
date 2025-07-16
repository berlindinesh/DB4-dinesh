import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import api from "../api/axiosInstance";
import { toast } from 'react-toastify';

const AddressDetailsForm = ({ nextStep, prevStep, employeeId }) => {
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [formValues, setFormValues] = useState({
    presentAddress: '',
    presentCity: '',
    presentDistrict: '',
    presentState: '',
    presentPinCode: '',
    presentCountry: '',
    permanentAddress: '',
    permanentCity: '',
    permanentDistrict: '',
    permanentState: '',
    permanentPinCode: '',
    permanentCountry: ''
  });

  const validationSchema = Yup.object({
    presentAddress: Yup.string().required('Present address is required'),
    presentCity: Yup.string().required('City is required'),
    presentDistrict: Yup.string().required('District is required'),
    presentState: Yup.string().required('State is required'),
    presentPinCode: Yup.string().required('PIN code is required'),
    presentCountry: Yup.string().required('Country is required'),
    // Only validate permanent address fields if sameAsPresent is false
    permanentAddress: Yup.string().when('sameAsPresent', {
      is: false,
      then: Yup.string().required('Permanent address is required')
    }),
    permanentCity: Yup.string().when('sameAsPresent', {
      is: false,
      then: Yup.string().required('City is required')
    }),
    permanentDistrict: Yup.string().when('sameAsPresent', {
      is: false,
      then: Yup.string().required('District is required')
    }),
    permanentState: Yup.string().when('sameAsPresent', {
      is: false,
      then: Yup.string().required('State is required')
    }),
    permanentPinCode: Yup.string().when('sameAsPresent', {
      is: false,
      then: Yup.string().required('PIN code is required')
    }),
    permanentCountry: Yup.string().when('sameAsPresent', {
      is: false,
      then: Yup.string().required('Country is required')
    })
  });

  const handleSubmit = async (values) => {
    try {
      console.log('Form values being submitted:', values);
      
      // Create the address data object with the exact field names expected by the backend
      const addressData = {
        employeeId: employeeId,
        currentAddress: {
          street: values.presentAddress,
          city: values.presentCity,
          district: values.presentDistrict,
          state: values.presentState,
          pincode: values.presentPinCode,
          country: values.presentCountry
        },
        permanentAddress: sameAsPresent 
          ? {
              street: values.presentAddress,
              city: values.presentCity,
              district: values.presentDistrict,
              state: values.presentState,
              pincode: values.presentPinCode,
              country: values.presentCountry
            }
          : {
              street: values.permanentAddress,
              city: values.permanentCity,
              district: values.permanentDistrict,
              state: values.permanentState,
              pincode: values.permanentPinCode,
              country: values.permanentCountry
            }
      };
      
      console.log('Data being sent to API:', addressData);
      
      // // Get the authentication token and company code
      // const token = localStorage.getItem('token');
      // const companyCode = localStorage.getItem('companyCode');
      
      // if (!token) {
      //   throw new Error('Authentication token not found. Please log in again.');
      // }
      
      // if (!companyCode) {
      //   throw new Error('Company code not found. Please log in again.');
      // }
    
      const response = await api.post(
        `${process.env.REACT_APP_API_URL}/api/employees/address-info`,
        addressData
        ,
        {
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`,
            // 'X-Company-Code': companyCode
          }
        }
      );
  
      console.log('API Response:', response.data);
    
      if (response.data.success) {
        toast.success('Address information saved successfully');
        nextStep();
      } else {
        toast.error('Failed to save address information');
      }
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      toast.error('Failed to save address information');
    }
  };
  

  const handleSameAddressChange = (e, setFieldValue) => {
    const checked = e.target.checked;
    setSameAsPresent(checked);
    
    if (checked) {
      // Copy present address values to permanent address fields
      setFieldValue('permanentAddress', formValues.presentAddress);
      setFieldValue('permanentCity', formValues.presentCity);
      setFieldValue('permanentDistrict', formValues.presentDistrict);
      setFieldValue('permanentState', formValues.presentState);
      setFieldValue('permanentPinCode', formValues.presentPinCode);
      setFieldValue('permanentCountry', formValues.presentCountry);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom color="primary">
        Address Details
      </Typography>
      
      <Formik
        initialValues={formValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Present Address</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  name="presentAddress"
                  label="Street Address"
                  fullWidth
                  error={touched.presentAddress && Boolean(errors.presentAddress)}
                  helperText={touched.presentAddress && errors.presentAddress}
                  onChange={(e) => {
                    handleChange(e);
                    setFormValues(prev => ({ ...prev, presentAddress: e.target.value }));
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="presentCity"
                  label="City"
                  fullWidth
                  error={touched.presentCity && Boolean(errors.presentCity)}
                  helperText={touched.presentCity && errors.presentCity}
                  onChange={(e) => {
                    handleChange(e);
                    setFormValues(prev => ({ ...prev, presentCity: e.target.value }));
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="presentDistrict"
                  label="District"
                  fullWidth
                  error={touched.presentDistrict && Boolean(errors.presentDistrict)}
                  helperText={touched.presentDistrict && errors.presentDistrict}
                  onChange={(e) => {
                    handleChange(e);
                    setFormValues(prev => ({ ...prev, presentDistrict: e.target.value }));
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Field
                  as={TextField}
                  name="presentState"
                  label="State"
                  fullWidth
                  error={touched.presentState && Boolean(errors.presentState)}
                  helperText={touched.presentState && errors.presentState}
                  onChange={(e) => {
                    handleChange(e);
                    setFormValues(prev => ({ ...prev, presentState: e.target.value }));
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Field
                  as={TextField}
                  name="presentPinCode"
                  label="PIN Code"
                  fullWidth
                  error={touched.presentPinCode && Boolean(errors.presentPinCode)}
                  helperText={touched.presentPinCode && errors.presentPinCode}
                  onChange={(e) => {
                    handleChange(e);
                    setFormValues(prev => ({ ...prev, presentPinCode: e.target.value }));
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Field
                  as={TextField}
                  name="presentCountry"
                  label="Country"
                  fullWidth
                  error={touched.presentCountry && Boolean(errors.presentCountry)}
                  helperText={touched.presentCountry && errors.presentCountry}
                  onChange={(e) => {
                    handleChange(e);
                    setFormValues(prev => ({ ...prev, presentCountry: e.target.value }));
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sameAsPresent}
                      onChange={(e) => handleSameAddressChange(e, setFieldValue)}
                      name="sameAsPresent"
                    />
                  }
                  label="Permanent Address same as Present Address"
                />
              </Grid>
              
              {!sameAsPresent && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6">Permanent Address</Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="permanentAddress"
                      label="Street Address"
                      fullWidth
                      error={touched.permanentAddress && Boolean(errors.permanentAddress)}
                      helperText={touched.permanentAddress && errors.permanentAddress}
                      onChange={(e) => {
                        handleChange(e);
                        setFormValues(prev => ({ ...prev, permanentAddress: e.target.value }));
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      name="permanentCity"
                      label="City"
                      fullWidth
                      error={touched.permanentCity && Boolean(errors.permanentCity)}
                      helperText={touched.permanentCity && errors.permanentCity}
                      onChange={(e) => {
                        handleChange(e);
                        setFormValues(prev => ({ ...prev, permanentCity: e.target.value }));
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      name="permanentDistrict"
                      label="District"
                      fullWidth
                      error={touched.permanentDistrict && Boolean(errors.permanentDistrict)}
                      helperText={touched.permanentDistrict && errors.permanentDistrict}
                      onChange={(e) => {
                        handleChange(e);
                        setFormValues(prev => ({ ...prev, permanentDistrict: e.target.value }));
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Field
                      as={TextField}
                      name="permanentState"
                      label="State"
                      fullWidth
                      error={touched.permanentState && Boolean(errors.permanentState)}
                      helperText={touched.permanentState && errors.permanentState}
                      onChange={(e) => {
                        handleChange(e);
                        setFormValues(prev => ({ ...prev, permanentState: e.target.value }));
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Field
                      as={TextField}
                      name="permanentPinCode"
                      label="PIN Code"
                      fullWidth
                      error={touched.permanentPinCode && Boolean(errors.permanentPinCode)}
                      helperText={touched.permanentPinCode && errors.permanentPinCode}
                      onChange={(e) => {
                        handleChange(e);
                        setFormValues(prev => ({ ...prev, permanentPinCode: e.target.value }));
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Field
                      as={TextField}
                      name="permanentCountry"
                      label="Country"
                      fullWidth
                      error={touched.permanentCountry && Boolean(errors.permanentCountry)}
                      helperText={touched.permanentCountry && errors.permanentCountry}
                      onChange={(e) => {
                        handleChange(e);
                        setFormValues(prev => ({ ...prev, permanentCountry: e.target.value }));
                      }}
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={prevStep}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Next
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default AddressDetailsForm;

// import React from 'react';
// import { TextField, Paper, FormControl, Button, Typography, Grid, Checkbox, FormControlLabel } from '@mui/material';
// import { motion } from 'framer-motion';
// import { Formik, Form, Field } from 'formik';
// import * as Yup from 'yup';
// import axios from 'axios';
// import { toast } from 'react-toastify';

// const validationSchema = Yup.object().shape({
//   presentAddress: Yup.string().required('Present address is required'),
//   presentCity: Yup.string().required('City is required'),
//   presentState: Yup.string().required('State is required'),
//   presentPinCode: Yup.string().matches(/^[0-9]{6}$/, 'Pin code must be 6 digits').required('Pin code is required'),
//   presentCountry: Yup.string().required('Country is required'),
//   permanentAddress: Yup.string().required('Permanent address is required'),
//   permanentCity: Yup.string().required('City is required'),
//   permanentState: Yup.string().required('State is required'),
//   permanentPinCode: Yup.string().matches(/^[0-9]{6}$/, 'Pin code must be 6 digits').required('Pin code is required'),
//   permanentCountry: Yup.string().required('Country is required'),
//   presentDistrict: Yup.string().required('District is required'),
//   permanentDistrict: Yup.string().required('District is required'),
// });

// const AddressDetailsForm = ({ nextStep, prevStep, employeeId, handleFormDataChange }) => {
//   const initialValues = {
//     presentAddress: '',
//     presentCity: '',
//     presentState: '',
//     presentPinCode: '',
//     presentCountry: '',
//     permanentAddress: '',
//     permanentCity: '',
//     permanentState: '',
//     permanentPinCode: '',
//     permanentCountry: '',
//     presentDistrict: '',
//     permanentDistrict: ''
//   };

//   const handleSubmit = async (values) => {
//     try {
//       // Log the form values to verify what's being submitted
//       console.log('Form values being submitted:', values);
      
//       // Create the address data object with the exact field names expected by the backend
//       const addressData = {
//         employeeId: employeeId,
//         currentAddress: {
//           street: values.presentAddress || '',
//           city: values.presentCity || '',
//           district: values.presentDistrict || '',
//           state: values.presentState || '',
//           pincode: values.presentPinCode || '',
//           country: values.presentCountry || ''
//         },
//         permanentAddress: {
//           street: values.permanentAddress || '',
//           city: values.permanentCity || '',
//           district: values.permanentDistrict || '',
//           state: values.permanentState || '',
//           pincode: values.permanentPinCode || '',
//           country: values.permanentCountry || ''
//         }
//       };
      
//       // Log the data being sent to the API
//       console.log('Data being sent to API:', addressData);
    
//       const response = await axios.post(
//         '${process.env.REACT_APP_API_URL}/api/employees/address-info',
//         addressData,
//         {
//           headers: {
//             'Content-Type': 'application/json'
//           }
//         }
//       );
  
//       console.log('API Response:', response.data);
    
//       if (response.data.success) {
//         toast.success('Address information saved successfully');
//         nextStep();
//       } else {
//         toast.error('Failed to save address information');
//       }
//     } catch (error) {
//       console.error('API Error:', error.response?.data || error.message);
//       toast.error('Failed to save address information');
//     }
//   };
  
  
  
//   // const handleSubmit = async (values) => {
//   //   try {
//   //     console.log('Submitting address details:', values);
//   //     const addressData = {
//   //       currentAddress: {
//   //         street: values.currentStreet,
//   //         city: values.currentCity,
//   //         state: values.currentState,
//   //         pincode: values.currentPincode
//   //       },
//   //       permanentAddress: {
//   //         street: values.permanentStreet,
//   //         city: values.permanentCity,
//   //         state: values.permanentState,
//   //         pincode: values.permanentPincode
//   //       }
//   //     };
  
//   //     const response = await axios.post(
//   //       '${process.env.REACT_APP_API_URL}/api/employees/address-info',
//   //       addressData,
//   //       {
//   //         headers: {
//   //           'Content-Type': 'application/json'
//   //         }
//   //       }
//   //     );

//   //     console.log('API Response:', response.data);
  
//   //     // Only navigate to next step if submission is successful
//   //     if (response.data.success) {
//   //       toast.success('Address information saved successfully');
//   //       nextStep(); // Navigation happens here after success
//   //     } else {
//   //       toast.error('Failed to save address information');
//   //     }
//   //   } catch (error) {
//   //     console.log('API Error:', error.response?.data);
//   //     toast.error('Failed to save address information');
//   //     // No navigation on error
//   //   }
//   // };
  
  

//   const AnimatedTextField = ({ field, form, label, ...props }) => {
//     const handleChange = (e) => {
//       const sentenceCaseValue = e.target.value
//         .split(' ')
//         .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//         .join(' ');
//       form.setFieldValue(field.name, sentenceCaseValue);
//     };

//     return (
//       <TextField
//         {...field}
//         {...props}
//         label={label}
//         onChange={handleChange}
//         error={form.touched[field.name] && form.errors[field.name]}
//         helperText={form.touched[field.name] && form.errors[field.name]}
//         sx={{
//           '& .MuiInputBase-input': {
//             color: '#000000',
//           }
//         }}
//       />
//     );
//   };

//   return (
//     <Formik
//       initialValues={initialValues}
//       validationSchema={validationSchema}
//       enableReinitialize={true}
//       onSubmit={(values) => {
//         handleSubmit("addressInfo", values);       
//       }}
//     >
//       {({ errors, touched, values, setFieldValue }) => (
//         <Form>
//           <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
//             <Typography variant="h5" gutterBottom color="primary">
//               Present Address
//             </Typography>
            
//             <Grid container spacing={3}>
//               <Grid item xs={12}>
//                 <Field
//                   name="presentAddress"
//                   component={AnimatedTextField}
//                   label="Address"
//                   multiline
//                   rows={4}
//                   fullWidth
//                   error={touched.presentAddress && errors.presentAddress}
//                   helperText={touched.presentAddress && errors.presentAddress}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="presentCity"
//                   component={AnimatedTextField}
//                   label="City"
//                   fullWidth
//                   error={touched.presentCity && errors.presentCity}
//                   helperText={touched.presentCity && errors.presentCity}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="presentDistrict"
//                   component={AnimatedTextField}
//                   label="District"
//                   fullWidth
//                   error={touched.presentDistrict && errors.presentDistrict}
//                   helperText={touched.presentDistrict && errors.presentDistrict}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="presentState"
//                   component={AnimatedTextField}
//                   label="State"
//                   fullWidth
//                   error={touched.presentState && errors.presentState}
//                   helperText={touched.presentState && errors.presentState}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="presentPinCode"
//                   component={AnimatedTextField}
//                   label="Pin Code"
//                   fullWidth
//                   error={touched.presentPinCode && errors.presentPinCode}
//                   helperText={touched.presentPinCode && errors.presentPinCode}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="presentCountry"
//                   component={AnimatedTextField}
//                   label="Country"
//                   fullWidth
//                   error={touched.presentCountry && errors.presentCountry}
//                   helperText={touched.presentCountry && errors.presentCountry}
//                 />
//               </Grid>

//               <Grid item xs={12}>
//                 <FormControlLabel
//                   control={
//                     <Checkbox
//                       onChange={(e) => {
//                         if (e.target.checked) {
//                           setFieldValue('permanentAddress', values.presentAddress);
//                           setFieldValue('permanentCity', values.presentCity);
//                           setFieldValue('permanentState', values.presentState);
//                           setFieldValue('permanentDistrict', values.presentDistrict);
//                           setFieldValue('permanentPinCode', values.presentPinCode);
//                           setFieldValue('permanentCountry', values.presentCountry);
//                         }
//                       }}
//                     />
//                   }
//                   label="Same as Present Address"
//                 />
//               </Grid>

//               <Grid item xs={12}>
//                 <Typography variant="h5" gutterBottom color="primary">
//                   Permanent Address
//                 </Typography>
//               </Grid>

//               <Grid item xs={12}>
//                 <Field
//                   name="permanentAddress"
//                   component={AnimatedTextField}
//                   label="Address"
//                   multiline
//                   rows={4}
//                   fullWidth
//                   error={touched.permanentAddress && errors.permanentAddress}
//                   helperText={touched.permanentAddress && errors.permanentAddress}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="permanentCity"
//                   component={AnimatedTextField}
//                   label="City"
//                   fullWidth
//                   error={touched.permanentCity && errors.permanentCity}
//                   helperText={touched.permanentCity && errors.permanentCity}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="permanentDistrict"
//                   component={AnimatedTextField}
//                   label="District"
//                   fullWidth
//                   error={touched.permanentDistrict && errors.permanentDistrict}
//                   helperText={touched.permanentDistrict && errors.permanentDistrict}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="permanentState"
//                   component={AnimatedTextField}
//                   label="State"
//                   fullWidth
//                   error={touched.permanentState && errors.permanentState}
//                   helperText={touched.permanentState && errors.permanentState}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="permanentPinCode"
//                   component={AnimatedTextField}
//                   label="Pin Code"
//                   fullWidth
//                   error={touched.permanentPinCode && errors.permanentPinCode}
//                   helperText={touched.permanentPinCode && errors.permanentPinCode}
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <Field
//                   name="permanentCountry"
//                   component={AnimatedTextField}
//                   label="Country"
//                   fullWidth
//                   error={touched.permanentCountry && errors.permanentCountry}
//                   helperText={touched.permanentCountry && errors.permanentCountry}
//                 />
//               </Grid>
//             </Grid>

//             <Grid container spacing={2} sx={{ mt: 3 }}>
//               <Grid item xs={6}>
//                 <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
//                   <Button
//                     onClick={prevStep}
//                     variant="outlined"
//                     fullWidth
//                   >
//                     Previous
//                   </Button>
//                 </motion.div>
//               </Grid>
//               <Grid item xs={6}>
//                 <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
//                   <Button
//                     type="submit"
//                     variant="contained"
//                     fullWidth
//                   >
//                     Next
//                   </Button>
//                 </motion.div>
//               </Grid>
//             </Grid>
//           </Paper>
//         </Form>
//       )}
//     </Formik>
//   );
// };

// export default AddressDetailsForm;
