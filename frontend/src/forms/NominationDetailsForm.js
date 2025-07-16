import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Grid, Typography, Container, Box,
  Paper, IconButton, Tooltip, Alert, MenuItem, FormControlLabel,
  Checkbox, Select
} from '@mui/material';
import { motion } from 'framer-motion';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import api from "../api/axiosInstance";
import { styled } from '@mui/material/styles';
import { PersonAdd, Add, Remove } from '@mui/icons-material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
}));

const NominationDetailsForm = ({ onComplete
  
  , prevStep }) => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [employeeAddress, setEmployeeAddress] = useState(null);

  const emptyNominee = {
    name: '',
    relation: '',
    nominationPercentage: 0,
    presentAddress: '',
    city: '',
    district: '',
    state: '',
    pinCode: '',
    phoneNumber: '',
    sameAsEmployeeAddress: false
  };

  // useEffect(() => {
  //   const fetchEmployeeData = async () => {
  //     const employeeId = localStorage.getItem('Emp_ID');
  //     try {
  //       const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/employees/get-employee/${employeeId}`);
  //       if (response.data.success && response.data.data) {
  //         const { familyDetails, addressDetails } = response.data.data;
          
  //         if (familyDetails) {
  //           setFamilyMembers(familyDetails);
  //         }
          
  //         if (addressDetails && addressDetails.presentAddress) {
  //           setEmployeeAddress(addressDetails.presentAddress);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error fetching employee data:', error);
  //     }
  //   };
  //   fetchEmployeeData();
  // }, []);

//   // Add this function at the top of your component or before the component definition
// const getAuthToken = () => {
//   return localStorage.getItem('token');
// };

// Update the useEffect for fetching employee data
useEffect(() => {
  const fetchEmployeeData = async () => {
    const employeeId = localStorage.getItem('Emp_ID');
    try {
      // // Get the authentication token
      // const token = getAuthToken();
      // const companyCode = localStorage.getItem('companyCode');

      
      const response = await api.get(
        `employees/get-employee/${employeeId}`
        // ,
        // {
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //     'X-Company-Code': companyCode
        //   }
        // }
      );
      
      if (response.data.success && response.data.data) {
        const { familyDetails, addressDetails } = response.data.data;
        
        if (familyDetails) {
          setFamilyMembers(familyDetails);
        }
        
        if (addressDetails && addressDetails.presentAddress) {
          setEmployeeAddress(addressDetails.presentAddress);
        }
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      console.error('Error response:', error.response?.data);
    }
  };
  fetchEmployeeData();
}, []);

  
  // const handleSubmit = async (values) => {
  //   try {
  //     if (totalPercentage !== 100) {
  //       alert('Total nomination percentage must be 100%');
  //       return;
  //     }
  
  //     const employeeId = localStorage.getItem('Emp_ID');
  //     const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/employees/nomination-details`, {
  //       employeeId,
  //       nominationDetails: values.nominees
  //     });
  
  //     if (response.data.success) {
  //       // Call onComplete instead of nextStep
  //       onComplete();
  //     }
  //   } catch (error) {
  //     console.error('Error saving nomination details:', error);
  //   }
  // };
  
  // const handleSubmit = async (values) => {
  //   try {
  //     const employeeId = localStorage.getItem('Emp_ID');
  //     const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/employees/nomination-details`, {
  //       employeeId,
  //       nominationDetails: values.nominees.map(nominee => ({
  //         name: nominee.name,
  //         relation: nominee.relation,
  //         nominationPercentage: nominee.nominationPercentage,
  //         presentAddress: nominee.presentAddress,
  //         city: nominee.city,
  //         district: nominee.district,
  //         state: nominee.state,
  //         pinCode: nominee.pinCode,
  //         phoneNumber: nominee.phoneNumber
  //       }))
  //     });
  
  //     if (response.data.success) {
  //       onComplete();
  //     }
  //   } catch (error) {
  //     console.error('Error saving nomination details:', error);
  //   }
  // };
  
// Update the handleSubmit function
const handleSubmit = async (values) => {
  try {
    if (totalPercentage !== 100) {
      alert('Total nomination percentage must be 100%');
      return;
    }

    const employeeId = localStorage.getItem('Emp_ID');
    
    // // Get the authentication token
    // const token = getAuthToken();
    // const companyCode = localStorage.getItem('companyCode');

    const response = await api.post(
      'employees/nomination-details',
      {
        employeeId,
        nominationDetails: values.nominees
      }
      
      // {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'X-Company-Code': companyCode
      //   }
      // }
    );

    if (response.data.success) {
      // Call onComplete instead of nextStep
      onComplete();
    }
  } catch (error) {
    console.error('Error saving nomination details:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
  }
};


  const handleAddressCheckbox = (setFieldValue, index) => {
    if (employeeAddress) {
      setFieldValue(`nominees.${index}.presentAddress`, employeeAddress.address);
      setFieldValue(`nominees.${index}.city`, employeeAddress.city);
      setFieldValue(`nominees.${index}.district`, employeeAddress.district);
      setFieldValue(`nominees.${index}.state`, employeeAddress.state);
      setFieldValue(`nominees.${index}.pinCode`, employeeAddress.pinCode);
    }
  };

  return (
    <Container maxWidth="md">
      <StyledPaper>
        <Typography variant="h5" gutterBottom align="center" color="primary">
          <PersonAdd sx={{ mr: 2 }} />
          Nomination Details
        </Typography>

        <Formik
          initialValues={{ 
            nominees: [{
              name: '',
              relation: '',
              nominationPercentage: 0,
              presentAddress: '',
              city: '',
              district: '',
              state: '',
              pinCode: '',
              phoneNumber: '',
              sameAsEmployeeAddress: false
            }]
          }}
          validationSchema={Yup.object().shape({
            nominees: Yup.array().of(
              Yup.object().shape({
                name: Yup.string().required('Required'),
                nominationPercentage: Yup.number()
                  .required('Required')
                  .min(1, 'Must be greater than 0')
                  .max(100, 'Cannot exceed 100'),
                presentAddress: Yup.string().required('Required'),
                city: Yup.string().required('Required'),
                district: Yup.string().required('Required'),
                state: Yup.string().required('Required'),
                pinCode: Yup.string().required('Required'),
                phoneNumber: Yup.string().required('Required')
              })
            )
          })}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form>
              <FieldArray name="nominees">
                {({ push, remove }) => (
                  <div>
                    {values.nominees.map((nominee, index) => (
                      <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <Select
                              fullWidth
                              name={`nominees.${index}.name`}
                              value={nominee.name}
                              onChange={(e) => {
                                const selectedMember = familyMembers.find(m => m.name === e.target.value);
                                if (selectedMember) {
                                  setFieldValue(`nominees.${index}.name`, selectedMember.name);
                                  setFieldValue(`nominees.${index}.relation`, selectedMember.relation);
                                }
                              }}
                            >
                              {familyMembers.map((member) => (
                                <MenuItem key={member.name} value={member.name}>
                                  {member.name} ({member.relation})
                                </MenuItem>
                              ))}
                            </Select>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Nomination Percentage"
                              name={`nominees.${index}.nominationPercentage`}
                              value={nominee.nominationPercentage}
                              onChange={(e) => {
                                setFieldValue(`nominees.${index}.nominationPercentage`, e.target.value);
                                const newTotal = values.nominees.reduce((sum, n, i) => 
                                  sum + (i === index ? Number(e.target.value) : Number(n.nominationPercentage)), 0);
                                setTotalPercentage(newTotal);
                              }}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={nominee.sameAsEmployeeAddress}
                                  onChange={(e) => {
                                    setFieldValue(`nominees.${index}.sameAsEmployeeAddress`, e.target.checked);
                                    if (e.target.checked) {
                                      handleAddressCheckbox(setFieldValue, index);
                                    }
                                  }}
                                />
                              }
                              label="Same as Employee Address"
                            />
                          </Grid>
                          {/* Address Fields */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Address"
                              name={`nominees.${index}.presentAddress`}
                              value={nominee.presentAddress}
                              onChange={e => setFieldValue(`nominees.${index}.presentAddress`, e.target.value)}
                              disabled={nominee.sameAsEmployeeAddress}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="City"
                              name={`nominees.${index}.city`}
                              value={nominee.city}
                              onChange={e => setFieldValue(`nominees.${index}.city`, e.target.value)}
                              disabled={nominee.sameAsEmployeeAddress}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="District"
                              name={`nominees.${index}.district`}
                              value={nominee.district}
                              onChange={e => setFieldValue(`nominees.${index}.district`, e.target.value)}
                              disabled={nominee.sameAsEmployeeAddress}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="State"
                              name={`nominees.${index}.state`}
                              value={nominee.state}
                              onChange={e => setFieldValue(`nominees.${index}.state`, e.target.value)}
                              disabled={nominee.sameAsEmployeeAddress}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Pin Code"
                              name={`nominees.${index}.pinCode`}
                              value={nominee.pinCode}
                              onChange={e => setFieldValue(`nominees.${index}.pinCode`, e.target.value)}
                              disabled={nominee.sameAsEmployeeAddress}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Phone Number"
                              name={`nominees.${index}.phoneNumber`}
                              value={nominee.phoneNumber}
                              onChange={e => setFieldValue(`nominees.${index}.phoneNumber`, e.target.value)}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
                      <Typography color={totalPercentage === 100 ? "success.main" : "error.main"}>
                        Total Nomination: {totalPercentage}%
                      </Typography>
                      
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => push(emptyNominee)}
                        disabled={totalPercentage >= 100}
                      >
                        Add Nominee
                      </Button>
                    </Box>

                    {totalPercentage > 100 && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        Total nomination percentage cannot exceed 100%
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button variant="outlined" onClick={prevStep}>
                        Previous
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={totalPercentage !== 100}
                      >
                        Submit
                      </Button>
                      </Box>
                      </div>
                )}
              </FieldArray>
            </Form>
          )}
        </Formik>
      </StyledPaper>
    </Container>
  );
};

export default NominationDetailsForm;  