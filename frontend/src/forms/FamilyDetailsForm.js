import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Select, FormControl, InputLabel, Checkbox, FormControlLabel,Radio,RadioGroup } from '@mui/material';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from "../api/axiosInstance";

const FamilyDetailsForm = ({ nextStep, prevStep, handleFormDataChange, savedFamilyDetails }) => {
  const tableRef = useRef(null);
  
  useEffect(() => {
    gsap.fromTo(tableRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1 });
  }, []);

  const [familyMembers, setFamilyMembers] = useState(savedFamilyDetails || [
    { name: '', relation: '', dob: '', dependent: 'No', employed: 'unemployed', sameCompany: false, empCode: '', department: '' },
  ]);

//   // Add this function at the top of your component or before the component definition
// const getAuthToken = () => {
//   return localStorage.getItem('token');
// };


  // const formik = useFormik({
  //   initialValues: { familyDetails: familyMembers },
  //   validationSchema: Yup.object({
  //     familyDetails: Yup.array().of(
  //       Yup.object().shape({
  //         name: Yup.string().required('Name is required'),
  //         relation: Yup.string().required('Relation is required'),
  //         dob: Yup.string().required('Date of birth is required'),
  //       })        
  //     ),
  //   }),
  //   enableReinitialize: true,
  //   onSubmit: async (values) => {
  //     try {
  //       const employeeId = localStorage.getItem('Emp_ID');
  //       const response = await axios.post('${process.env.REACT_APP_API_URL}/api/employees/family-details', {
  //         employeeId,
  //         familyDetails: values.familyDetails
  //       });
  
  //       if (response.data.success) {
  //         nextStep();
  //       }
  //     } catch (error) {
  //       console.error('Error saving family details:', error);
  //     }
  //   },
  // });
  

  // Update the formik configuration
const formik = useFormik({
  initialValues: { familyDetails: familyMembers },
  validationSchema: Yup.object({
    familyDetails: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Name is required'),
        relation: Yup.string().required('Relation is required'),
        dob: Yup.string().required('Date of birth is required'),
      })        
    ),
  }),
  enableReinitialize: true,
  onSubmit: async (values) => {
    try {
      const employeeId = localStorage.getItem('Emp_ID');
      
      const response = await api.post('employees/family-details', 
        {
          employeeId,
          familyDetails: values.familyDetails
        }
      );

      if (response.data.success) {
        nextStep();
      }
    } catch (error) {
      console.error('Error saving family details:', error);
      // Add better error handling
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    }
  },
});


  
  

  const handleInputChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const updatedMembers = [...formik.values.familyDetails];
    updatedMembers[index][name] = type === 'checkbox' ? checked : value;
    formik.setFieldValue('familyDetails', updatedMembers);
  };

  const addFamilyMember = () => {
    formik.setFieldValue('familyDetails', [...formik.values.familyDetails, { name: '', relation: '', dob: '', dependent: 'No', employed: 'unemployed', sameCompany: false, empCode: '', department: '' }]);
  };

  const removeFamilyMember = (index) => {
    const updatedMembers = formik.values.familyDetails.filter((_, i) => i !== index);
    formik.setFieldValue('familyDetails', updatedMembers);
  };

  const formFieldStyles = {
    minWidth: '200px', // Set a fixed width for all form fields
    width: '200px'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ maxWidth: '100%', overflowX: 'auto' }} >
      <Typography variant="h5" gutterBottom>
        FORM-5: EMPLOYEE FAMILY INFORMATION
      </Typography>
      <form onSubmit={formik.handleSubmit}>
        <TableContainer component={Paper} style={{ marginTop: '20px' }} ref={tableRef}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Family Member Name</TableCell>
                <TableCell>Relation</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Dependent</TableCell>
                <TableCell>Employment Status</TableCell>
                <TableCell>Working in Same Company</TableCell>
                <TableCell>Employee Code</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formik.values.familyDetails.map((member, index) => (
                <TableRow key={index}>
  <TableCell style={{ padding: '8px 4px' }}>
  <TextField
    variant="outlined"
    size="small"
    name="name"
    value={member.name}
    onChange={(e) => {
      const formattedName = e.target.value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      handleInputChange(index, {
        target: {
          name: 'name',
          value: formattedName
        }
      });
    }}
    error={Boolean(formik.errors.familyDetails?.[index]?.name)}
    helperText={formik.errors.familyDetails?.[index]?.name}
    sx={formFieldStyles}
  />
</TableCell>

                  <TableCell style={{ padding: '8px 4px' }}>
  <Select
    variant="outlined"
    size="small"
    name="relation"
    value={member.relation}
    onChange={(e) => handleInputChange(index, e)}
    error={Boolean(formik.errors.familyDetails?.[index]?.relation)}
    sx={formFieldStyles}
  >
    <MenuItem value="father">Father</MenuItem>
    <MenuItem value="mother">Mother</MenuItem>
    <MenuItem value="younger_brother">Younger Brother</MenuItem>
    <MenuItem value="younger_sister">Younger Sister</MenuItem>
    <MenuItem value="elder_brother">Elder Brother</MenuItem>
    <MenuItem value="elder_sister">Elder Sister</MenuItem>
    <MenuItem value="wife">Wife</MenuItem>
    <MenuItem value="son">Son</MenuItem>
    <MenuItem value="daughter">Daughter</MenuItem>
  </Select>
</TableCell>

                  <TableCell style={{ padding: '8px 4px' }}>
                    <TextField
                      variant="outlined"
                      size="small"
                      type="date"
                      name="dob"
                      value={member.dob}
                      onChange={(e) => handleInputChange(index, e)}
                      error={Boolean(formik.errors.familyDetails?.[index]?.dob)}
                      helperText={formik.errors.familyDetails?.[index]?.dob}
                      sx={formFieldStyles}
                    />
                  </TableCell>
                  <TableCell style={{ padding: '8px 4px' }}>
  <FormControl sx={formFieldStyles}>
    <RadioGroup
      row
      name="dependent"
      value={member.dependent}
      onChange={(e) => handleInputChange(index, e)}
    >
      <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
      <FormControlLabel value="No" control={<Radio />} label="No" />
    </RadioGroup>
  </FormControl>
</TableCell>

<TableCell style={{ padding: '8px 4px' }}>
  <Select 
    name="employed" 
    value={member.employed} 
    onChange={(e) => handleInputChange(index, e)}
    size="small"
    sx={formFieldStyles}
  >
    <MenuItem value="employed">Employed</MenuItem>
    <MenuItem value="unemployed">Unemployed</MenuItem>
  </Select>
</TableCell>

<TableCell style={{ padding: '8px 4px' }}>
  <FormControl sx={formFieldStyles}>
    <RadioGroup
      row
      name="sameCompany"
      value={member.sameCompany ? "Yes" : "No"}
      onChange={(e) => handleInputChange(index, {
        target: {
          name: "sameCompany",
          value: e.target.value === "Yes"
        }
      })}
    >
      <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
      <FormControlLabel value="No" control={<Radio />} label="No" />
    </RadioGroup>
  </FormControl>
</TableCell>

{member.sameCompany ? (
  <>
    <TableCell style={{ padding: '8px 4px' }}>
      <TextField 
        variant="outlined" 
        size="small" 
        name="empCode" 
        value={member.empCode} 
        onChange={(e) => handleInputChange(index, e)}
        sx={formFieldStyles}
      />
    </TableCell>
    <TableCell style={{ padding: '8px 4px' }}>
      <TextField 
        variant="outlined" 
        size="small" 
        name="department" 
        value={member.department} 
        onChange={(e) => handleInputChange(index, e)}
        sx={formFieldStyles}
      />
    </TableCell>
  </>
) : (
  <>
    <TableCell style={{ padding: '8px 4px' }}>-</TableCell>
    <TableCell style={{ padding: '8px 4px' }}>-</TableCell>
  </>
)}


                  <TableCell style={{ padding: '8px 4px' }}>
                    <Button variant="contained" color="error" onClick={() => removeFamilyMember(index)}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Button variant="contained" color="primary" onClick={addFamilyMember} style={{ marginTop: '10px' }}>Add Family Member</Button>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={prevStep}>Previous</Button>
          <Button type="submit" variant="contained" color="primary">Next</Button>
        </div>
      </form>
    </motion.div>
  );
};

export default FamilyDetailsForm;
