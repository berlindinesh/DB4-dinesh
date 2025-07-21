import React, { useState } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Typography, FormControl, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { motion } from 'framer-motion';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import api from "../api/axiosInstance";

const validationSchema = Yup.object().shape({
  serviceHistory: Yup.array().of(
    Yup.object().shape({
      organization: Yup.string().required('Required'),
      dateOfJoining: Yup.date().required('Required'),
      lastWorkingDay: Yup.date().required('Required'),
      totalExperience: Yup.string(),
      department: Yup.string().required('Required')
    })
  )
});

const ServiceHistoryForm = ({ nextStep, prevStep, savedServiceHistory }) => {
  const [hasPreviousExperience, setHasPreviousExperience] = useState(false);

  const initialValues = {
    serviceHistory: Array.isArray(savedServiceHistory) ? savedServiceHistory : [{
      organization: '',
      dateOfJoining: '',
      lastWorkingDay: '',
      totalExperience: '',
      department: ''
    }]
  };

  // Add this function near the top of your file, after imports
const getAuthToken = () => {
  return localStorage.getItem('token');
};


  // const handleSubmit = async (values) => {
  //   try {
  //     const employeeId = localStorage.getItem('Emp_ID');
  //     const response = await axios.post('${process.env.REACT_APP_API_URL}/api/employees/service-history', {
  //       employeeId,
  //       hasServiceHistory: hasPreviousExperience,
  //       serviceHistory: hasPreviousExperience ? values.serviceHistory : []
  //     });

  //     if (response.data.success) {
  //       nextStep();
  //     }
  //   } catch (error) {
  //     console.error('Error saving service history:', error);
  //   }
  // };

// Update the handleSubmit function
const handleSubmit = async (values) => {
  try {
    const employeeId = localStorage.getItem('Emp_ID');
    
    // Get the authentication token
    const token = getAuthToken();
    const companyCode = localStorage.getItem('companyCode');
    
    const response = await api.post(
      'employees/service-history', 
      {
        employeeId,
        hasServiceHistory: hasPreviousExperience,
        serviceHistory: hasPreviousExperience ? values.serviceHistory : []
      }

    );

    if (response.data.success) {
      nextStep();
    }
  } catch (error) {
    console.error('Error saving service history:', error);
    // Add better error handling
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    // You can add toast notifications here if you're using them
  }
};



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '20px' }}
    >
      <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#1976D2' }}>
        FORM-6: EMPLOYEE SERVICE HISTORY
      </h2>

      <FormControl sx={{ marginBottom: '20px' }}>
        <Typography variant="subtitle1">Do you have previous work experience?</Typography>
        <RadioGroup
          row
          value={hasPreviousExperience ? "Yes" : "No"}
          onChange={(e) => setHasPreviousExperience(e.target.value === "Yes")}
        >
          <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
          <FormControlLabel value="No" control={<Radio />} label="No" />
        </RadioGroup>
      </FormControl>

      {hasPreviousExperience ? (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form>
              <FieldArray name="serviceHistory">
                {({ push, remove }) => (
                  <TableContainer component={Paper} elevation={3}>
                    <Table>
                      <TableHead style={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Previous Organization</TableCell>
                          <TableCell>Date of Joining</TableCell>
                          <TableCell>Last Working Day</TableCell>
                          <TableCell>Total Experience</TableCell>
                          <TableCell>Department</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {values.serviceHistory.map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <TextField
                                variant="outlined"
                                size="small"
                                name={`serviceHistory.${index}.organization`}
                                value={values.serviceHistory[index].organization}
                                onChange={(e) => {
                                  const formattedOrg = e.target.value
                                    .split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(' ');
                                  setFieldValue(`serviceHistory.${index}.organization`, formattedOrg);
                                }}
                                error={touched?.serviceHistory?.[index]?.organization && errors?.serviceHistory?.[index]?.organization}
                                helperText={touched?.serviceHistory?.[index]?.organization && errors?.serviceHistory?.[index]?.organization}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                variant="outlined"
                                size="small"
                                type="date"
                                name={`serviceHistory.${index}.dateOfJoining`}
                                value={values.serviceHistory[index].dateOfJoining}
                                onChange={(e) => {
                                  setFieldValue(`serviceHistory.${index}.dateOfJoining`, e.target.value);
                                  if (values.serviceHistory[index].lastWorkingDay) {
                                    const start = new Date(e.target.value);
                                    const end = new Date(values.serviceHistory[index].lastWorkingDay);
                                    const diffTime = Math.abs(end - start);
                                    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
                                    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
                                    setFieldValue(
                                      `serviceHistory.${index}.totalExperience`,
                                      `${diffYears} years ${diffMonths} months`
                                    );
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                variant="outlined"
                                size="small"
                                type="date"
                                name={`serviceHistory.${index}.lastWorkingDay`}
                                value={values.serviceHistory[index].lastWorkingDay}
                                onChange={(e) => {
                                  setFieldValue(`serviceHistory.${index}.lastWorkingDay`, e.target.value);
                                  if (values.serviceHistory[index].dateOfJoining) {
                                    const start = new Date(values.serviceHistory[index].dateOfJoining);
                                    const end = new Date(e.target.value);
                                    const diffTime = Math.abs(end - start);
                                    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
                                    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
                                    setFieldValue(
                                      `serviceHistory.${index}.totalExperience`,
                                      `${diffYears} years ${diffMonths} months`
                                    );
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                variant="outlined"
                                size="small"
                                name={`serviceHistory.${index}.totalExperience`}
                                value={values.serviceHistory[index].totalExperience}
                                disabled
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                variant="outlined"
                                size="small"
                                name={`serviceHistory.${index}.department`}
                                value={values.serviceHistory[index].department}
                                onChange={(e) => setFieldValue(`serviceHistory.${index}.department`, e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="contained" 
                                color="error" 
                                size="small" 
                                onClick={() => remove(index)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => push({
                        organization: '',
                        dateOfJoining: '',
                        lastWorkingDay: '',
                        totalExperience: '',
                        department: ''
                      })}
                      style={{ margin: '20px' }}
                    >
                      Add Service Entry
                    </Button>
                  </TableContainer>
                )}
              </FieldArray>
              
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={prevStep}>Previous</Button>
                <Button variant="contained" color="primary" type="submit">Next</Button>
              </div>
            </Form>
          )}
        </Formik>
      ) : (
        <div>
          <Typography variant="body1" sx={{ textAlign: 'center', padding: '20px' }}>
            No previous work experience recorded.
          </Typography>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={prevStep}>Previous</Button>
            {/* <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleSubmit({ serviceHistory: [] })}
            >
              Next
            </Button> */}
            <Button 
  variant="contained" 
  color="primary" 
  onClick={() => {
    // Get the authentication token
    const token = getAuthToken();
    const companyCode = localStorage.getItem('companyCode');
    
    
    api.post(
      'employees/service-history',
      {
        employeeId: localStorage.getItem('Emp_ID'),
        hasServiceHistory: false,
        serviceHistory: []
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Company-Code': companyCode
        }
      }
    )
    .then(response => {
      if (response.data.success) {
        nextStep();
      }
    })
    .catch(error => {
      console.error('Error saving service history:', error);
    });
  }}
>
  Next
</Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ServiceHistoryForm;