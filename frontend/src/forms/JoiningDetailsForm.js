import React from 'react';
import { TextField, Button, Box, Typography, Divider, Grid, Paper, MenuItem, FormControl, InputLabel, Select , FormHelperText} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { styled } from '@mui/material/styles';
import api from "../api/axiosInstance";
import { toast } from 'react-toastify';


const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5, 4),
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  }
}));

const days = Array.from({length: 31}, (_, i) => i + 1);
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const years = Array.from({length: 50}, (_, i) => new Date().getFullYear() - i);

// Department options
const departmentOptions = [
  'Software Development',
  'Software Testing',
  'DevOps',
  'Human Resource'
];

// Designation options based on department
const designationsByDepartment = {
  'Software Development': [
    'Associate Software Developer',
    'Senior Software Developer',
    'Team Lead - Software Development',
    'Manager - Software Development'
  ],
  'Software Testing': [
    'Associate Test Engineer',
    'Senior Test Engineer',
    'Team Lead - Testing',
    'Manager - Testing'
  ],
  'DevOps': [
    'Associate DevOps Engineer',
    'Senior DevOps Engineer',
    'Team Lead - DevOps',
    'Manager - DevOps'
  ],
  'Human Resource': [
    'Associate HR Executive',
    'Senior HR Executive',
    'Team Lead - HR',
    'Manager - HR'
  ]
};

// Mode of recruitment options
const modeOfRecruitmentOptions = [
  'Online',
  'Offline'
];

// Employee type options
const employeeTypeOptions = [
  'Permanent',
  'Contract',
  'Part Time'
];

const validationSchema = Yup.object().shape({
  appointmentDay: Yup.number().required('Day is required'),
  appointmentMonth: Yup.string().required('Month is required'),
  appointmentYear: Yup.number().required('Year is required'),
  department: Yup.string().required('Department is required'),
  joiningDay: Yup.number().required('Day is required'),
  joiningMonth: Yup.string().required('Month is required'),
  joiningYear: Yup.number().required('Year is required'),
  initialDesignation: Yup.string().required('Initial designation is required'),
  modeOfRecruitment: Yup.string().required('Mode of recruitment is required'),
  employeeType: Yup.string().required('Employee type is required')
});



const AnimatedTextField = ({ field, form, label, ...props }) => {
  const handleChange = (e) => {
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
        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
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
          },
          '& .MuiInputBase-input:-webkit-autofill': {
            '-webkit-text-fill-color': '#000000',
            'transition': 'background-color 5002s ease-in-out 0s',
          }
        }}
      />
    </motion.div>
  );
};

const JoiningDetailsForm = ({ nextStep, prevStep, handleFormDataChange, savedJoiningDetails, employeeId }) => {
  const initialValues = savedJoiningDetails || {
    appointmentDay: new Date().getDate(),
    appointmentMonth: months[new Date().getMonth()],
    appointmentYear: new Date().getFullYear(),
    department: '',
    joiningDay: new Date().getDate(),
    joiningMonth: months[new Date().getMonth()],
    joiningYear: new Date().getFullYear(),
    initialDesignation: '',
    modeOfRecruitment: '',
    employeeType: ''
  };


  // const handleSubmit = async (values) => {
  //   try {
  //     // Create actual Date objects
  //     const appointmentDate = new Date(
  //       values.appointmentYear,
  //       months.indexOf(values.appointmentMonth),
  //       values.appointmentDay
  //     );
      
  //     const joiningDate = new Date(
  //       values.joiningYear,
  //       months.indexOf(values.joiningMonth),
  //       values.joiningDay
  //     );
      
  //     const formData = {
  //       dateOfAppointment: appointmentDate,
  //       dateOfJoining: joiningDate,
  //       department: values.department,
  //       initialDesignation: values.initialDesignation,
  //       modeOfRecruitment: values.modeOfRecruitment,
  //       employeeType: values.employeeType
  //     };
    
  //     console.log('Request payload:', {
  //       employeeId,
  //       formData
  //     });
    
  //     const response = await axios.post(
  //       '${process.env.REACT_APP_API_URL}/api/employees/joining-details',
  //       {
  //         employeeId,
  //         formData
  //       },
  //       {
  //         headers: { 'Content-Type': 'application/json' }
  //       }
  //     );
    
  //     console.log('Server response:', response.data);
    
  //     if (response.data.success) {
  //       console.log('Joining details saved successfully:', response.data);
  //       toast.success('Joining details saved successfully');
  //       nextStep();
  //     }
  //   } catch (error) {
  //     console.log('Error details:', error.response?.data);
  //     toast.error('Failed to save joining details');
  //   }
  // };
  
const handleSubmit = async (values) => {
  try {
    // Create actual Date objects
    const appointmentDate = new Date(
      values.appointmentYear,
      months.indexOf(values.appointmentMonth),
      values.appointmentDay
    );
    
    const joiningDate = new Date(
      values.joiningYear,
      months.indexOf(values.joiningMonth),
      values.joiningDay
    );
    
    const formData = {
      dateOfAppointment: appointmentDate,
      dateOfJoining: joiningDate,
      department: values.department,
      initialDesignation: values.initialDesignation,
      modeOfRecruitment: values.modeOfRecruitment,
      employeeType: values.employeeType
    };
  
    console.log('Request payload:', {
      employeeId,
      formData
    });
  
    
    // const response = await api.post(
    //   `${process.env.REACT_APP_API_URL}/api/employees/joining-details`,
    //   {
    //     employeeId,
    //     formData
    //   },
    const response = await api.post(
  'employees/joining-details',
  {
    employeeId,
    formData
  },
      {
        headers: { 
          'Content-Type': 'application/json',
          
        }
      }
    );
  
    console.log('Server response:', response.data);
  
    if (response.data.success) {
      console.log('Joining details saved successfully:', response.data);
      toast.success('Joining details saved successfully');
      nextStep();
    }
  } catch (error) {
    console.log('Error details:', error.response?.data);
    toast.error(error.response?.data?.error || 'Failed to save joining details');
  }
};


    

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
      
<Formik
  initialValues={initialValues}
  validationSchema={validationSchema}
  enableReinitialize={true}
  onSubmit={handleSubmit}
>

          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <StyledPaper>
                <Typography variant="h5" gutterBottom color="primary">
                  Joining Details
                </Typography>
                <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
  <Typography variant="body1" gutterBottom>Date of Appointment</Typography>
  <Grid container spacing={2}>
    <Grid item xs={4}>
      <FormControl fullWidth>
        <InputLabel>Date</InputLabel>
        <Field name="appointmentDay">
          {({ field, form }) => (
            <Select
              {...field}
              label="Date"
              onChange={(e) => {
                form.setFieldValue('appointmentDay', e.target.value);
                const newDate = new Date(
                  form.values.appointmentYear,
                  months.indexOf(form.values.appointmentMonth),
                  e.target.value
                );
                form.setFieldValue('dateOfAppointment', newDate);
              }}
            >
              {days.map(day => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          )}
        </Field>
      </FormControl>
    </Grid>
    <Grid item xs={4}>
      <FormControl fullWidth>
        <InputLabel>Month</InputLabel>
        <Field name="appointmentMonth">
          {({ field, form }) => (
            <Select
              {...field}
              label="Month"
              onChange={(e) => {
                form.setFieldValue('appointmentMonth', e.target.value);
                const newDate = new Date(
                  form.values.appointmentYear,
                  months.indexOf(e.target.value),
                  form.values.appointmentDay
                );
                form.setFieldValue('dateOfAppointment', newDate);
              }}
            >
              {months.map(month => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
          )}
        </Field>
      </FormControl>
    </Grid>
    <Grid item xs={4}>
      <FormControl fullWidth>
        <InputLabel>Year</InputLabel>
        <Field name="appointmentYear">
          {({ field, form }) => (
            <Select
              {...field}
              label="Year"
              onChange={(e) => {
                form.setFieldValue('appointmentYear', e.target.value);
                const newDate = new Date(
                  e.target.value,
                  months.indexOf(form.values.appointmentMonth),
                  form.values.appointmentDay
                );
                form.setFieldValue('dateOfAppointment', newDate);
              }}
            >
              {years.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          )}
        </Field>
      </FormControl>
    </Grid>
  </Grid>
</Grid>


<Grid item xs={12} sm={6}>
  <Typography variant="body1" gutterBottom>Date of Joining</Typography>
  <Grid container spacing={2}>
    <Grid item xs={4}>
      <FormControl fullWidth>
        <InputLabel>Date</InputLabel>
        <Field name="joiningDay">
          {({ field, form }) => (
            <Select
              {...field}
              label="Date"
              onChange={(e) => {
                form.setFieldValue('joiningDay', e.target.value);
                const newDate = new Date(
                  form.values.joiningYear,
                  months.indexOf(form.values.joiningMonth),
                  e.target.value
                );
                form.setFieldValue('dateOfJoining', newDate);
              }}
            >
              {days.map(day => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          )}
        </Field>
      </FormControl>
    </Grid>
    <Grid item xs={4}>
      <FormControl fullWidth>
        <InputLabel>Month</InputLabel>
        <Field name="joiningMonth">
          {({ field, form }) => (
            <Select
              {...field}
              label="Month"
              onChange={(e) => {
                form.setFieldValue('joiningMonth', e.target.value);
                const newDate = new Date(
                  form.values.joiningYear,
                  months.indexOf(e.target.value),
                  form.values.joiningDay
                );
                form.setFieldValue('dateOfJoining', newDate);
              }}
            >
              {months.map(month => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
          )}
        </Field>
      </FormControl>
    </Grid>
    <Grid item xs={4}>
      <FormControl fullWidth>
        <InputLabel>Year</InputLabel>
        <Field name="joiningYear">
          {({ field, form }) => (
            <Select
              {...field}
              label="Year"
              onChange={(e) => {
                form.setFieldValue('joiningYear', e.target.value);
                const newDate = new Date(
                  e.target.value,
                  months.indexOf(form.values.joiningMonth),
                  form.values.joiningDay
                );
                form.setFieldValue('dateOfJoining', newDate);
              }}
            >
              {years.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          )}
        </Field>
      </FormControl>
    </Grid>
  </Grid>
</Grid>


                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={touched.department && Boolean(errors.department)}>
                      <InputLabel>Department</InputLabel>
                      <Field name="department">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Department"
                            onChange={(e) => {
                              const selectedDepartment = e.target.value;
                              form.setFieldValue('department', selectedDepartment);
                              // Reset designation when department changes
                              form.setFieldValue('initialDesignation', '');
                            }}
                          >
                            {departmentOptions.map(dept => (
                              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {touched.department && errors.department && (
                        <FormHelperText error>{errors.department}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={touched.initialDesignation && Boolean(errors.initialDesignation)}>
                      <InputLabel>Initial Designation</InputLabel>
                      <Field name="initialDesignation">
                        {({ field, form }) => (
                          <Select
                            {...field}
                            label="Initial Designation"
                            disabled={!values.department} // Disable if no department selected
                          >
                                                        {values.department && designationsByDepartment[values.department]?.map(designation => (
                              <MenuItem key={designation} value={designation}>
                                {designation}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {touched.initialDesignation && errors.initialDesignation && (
                        <FormHelperText error>{errors.initialDesignation}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={touched.modeOfRecruitment && Boolean(errors.modeOfRecruitment)}>
                      <InputLabel>Mode of Recruitment</InputLabel>
                      <Field name="modeOfRecruitment">
                        {({ field }) => (
                          <Select
                            {...field}
                            label="Mode of Recruitment"
                          >
                            {modeOfRecruitmentOptions.map(mode => (
                              <MenuItem key={mode} value={mode}>
                                {mode}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {touched.modeOfRecruitment && errors.modeOfRecruitment && (
                        <FormHelperText error>{errors.modeOfRecruitment}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={touched.employeeType && Boolean(errors.employeeType)}>
                      <InputLabel>Employee Type</InputLabel>
                      <Field name="employeeType">
                        {({ field }) => (
                          <Select
                            {...field}
                            label="Employee Type"
                          >
                            {employeeTypeOptions.map(type => (
                              <MenuItem key={type} value={type}>
                                {type}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {touched.employeeType && errors.employeeType && (
                        <FormHelperText error>{errors.employeeType}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <StyledButton
                      onClick={prevStep}
                      variant="outlined"
                      fullWidth
                    >
                      Previous
                    </StyledButton>
                  </Grid>
                  <Grid item xs={6}>
                    <StyledButton
                      type="submit"
                      variant="contained"
                      fullWidth
                    >
                      Next
                    </StyledButton>
                  </Grid>
                </Grid>
              </StyledPaper>
            </Form>
          )}
        </Formik>
      </motion.div>
    </AnimatePresence>
  );
};

export default JoiningDetailsForm;

// import React from 'react';
// import { TextField, Button, Box, Typography, Divider, Grid, Paper, MenuItem, FormControl, InputLabel,Select } from '@mui/material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Formik, Form, Field } from 'formik';
// import * as Yup from 'yup';
// import { styled } from '@mui/material/styles';
// import axios from 'axios';
// import { toast } from 'react-toastify';


// const StyledPaper = styled(Paper)(({ theme }) => ({
//   padding: theme.spacing(4),
//   borderRadius: theme.spacing(2),
//   background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
//   boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
//   transition: 'all 0.3s ease-in-out',
//   '&:hover': {
//     boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
//   }
// }));

// const StyledButton = styled(Button)(({ theme }) => ({
//   borderRadius: theme.spacing(1),
//   padding: theme.spacing(1.5, 4),
//   textTransform: 'none',
//   fontWeight: 600,
//   boxShadow: 'none',
//   '&:hover': {
//     boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
//   }
// }));

// const days = Array.from({length: 31}, (_, i) => i + 1);
// const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// const years = Array.from({length: 50}, (_, i) => new Date().getFullYear() - i);


// const validationSchema = Yup.object().shape({
//   appointmentDay: Yup.number().required('Day is required'),
//   appointmentMonth: Yup.string().required('Month is required'),
//   appointmentYear: Yup.number().required('Year is required'),
//   department: Yup.string().required('Department is required'),
//   joiningDay: Yup.number().required('Day is required'),
//   joiningMonth: Yup.string().required('Month is required'),
//   joiningYear: Yup.number().required('Year is required'),
//   initialDesignation: Yup.string().required('Initial designation is required'),
//   modeOfRecruitment: Yup.string().required('Mode of recruitment is required'),
//   employeeType: Yup.string().required('Employee type is required')
// });



// const AnimatedTextField = ({ field, form, label, ...props }) => {
//   const handleChange = (e) => {
//     const sentenceCaseValue = e.target.value
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//     form.setFieldValue(field.name, sentenceCaseValue);
//   };

//   return (
//     <motion.div
//       initial={{ scale: 0.98, opacity: 0 }}
//       animate={{ scale: 1, opacity: 1 }}
//       transition={{ duration: 0.3 }}
//     >
//       <TextField
//         {...field}
//         {...props}
//         label={label}
//         onChange={handleChange}
//         onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
//         sx={{
//           '& .MuiOutlinedInput-root': {
//             '&:hover fieldset': {
//               borderColor: 'primary.main',
//               borderWidth: '2px',
//             },
//             '&.Mui-focused fieldset': {
//               borderColor: 'primary.main',
//               borderWidth: '2px',
//             }
//           },
//           '& .MuiInputBase-input': {
//             color: '#000000',
//           },
//           '& .MuiInputBase-input:-webkit-autofill': {
//             '-webkit-text-fill-color': '#000000',
//             'transition': 'background-color 5002s ease-in-out 0s',
//           }
//         }}
//       />
//     </motion.div>
//   );
// };

// const JoiningDetailsForm = ({ nextStep, prevStep, handleFormDataChange, savedJoiningDetails, employeeId }) => {
//   const initialValues = savedJoiningDetails || {
//     appointmentDay: new Date().getDate(),
//     appointmentMonth: months[new Date().getMonth()],
//     appointmentYear: new Date().getFullYear(),
//     department: '',
//     joiningDay: new Date().getDate(),
//     joiningMonth: months[new Date().getMonth()],
//     joiningYear: new Date().getFullYear(),
//     initialDesignation: '',
//     modeOfRecruitment: '',
//     employeeType: ''
//   };

//   // const handleSubmit = async (values) => {
//   //   try {
//   //     const formattedData = {
//   //       dateOfAppointment: {
//   //         day: parseInt(values.appointmentDay),
//   //         month: values.appointmentMonth,
//   //         year: parseInt(values.appointmentYear)
//   //       },
//   //       department: values.department,
//   //       dateOfJoining: {
//   //         day: parseInt(values.joiningDay),
//   //         month: values.joiningMonth,
//   //         year: parseInt(values.joiningYear)
//   //       },
//   //       initialDesignation: values.initialDesignation,
//   //       modeOfRecruitment: values.modeOfRecruitment,
//   //       employeeType: values.employeeType
//   //     };
  
//   //     console.log('Request payload:', {
//   //       employeeId,
//   //       joiningDetails: formattedData
//   //     });
  
//   //     const response = await axios.post(
//   //       '${process.env.REACT_APP_API_URL}/api/employees/joining-details',
//   //       {
//   //         employeeId,
//   //         joiningDetails: formattedData
//   //       },
//   //       {
//   //         headers: { 'Content-Type': 'application/json' }
//   //       }
//   //     );
  
//   //     console.log('Server response:', response.data);
  
//   //     if (response.data.success) {
//   //       console.log('Joining details saved successfully:', response.data);
//   //       toast.success('Joining details saved successfully');
//   //       nextStep();
//   //     }
//   //   } catch (error) {
//   //     console.log('Error details:', error.response?.data);
//   //     toast.error('Failed to save joining details');
//   //   }
//   // };

//   const handleSubmit = async (values) => {
//     try {
//       // Create actual Date objects
//       const appointmentDate = new Date(
//         values.appointmentYear,
//         months.indexOf(values.appointmentMonth),
//         values.appointmentDay
//       );
      
//       const joiningDate = new Date(
//         values.joiningYear,
//         months.indexOf(values.joiningMonth),
//         values.joiningDay
//       );
      
//       const formData = {
//         dateOfAppointment: appointmentDate,
//         dateOfJoining: joiningDate,
//         department: values.department,
//         initialDesignation: values.initialDesignation,
//         modeOfRecruitment: values.modeOfRecruitment,
//         employeeType: values.employeeType
//       };
    
//       console.log('Request payload:', {
//         employeeId,
//         formData
//       });
    
//       const response = await axios.post(
//         '${process.env.REACT_APP_API_URL}/api/employees/joining-details',
//         {
//           employeeId,
//           formData
//         },
//         {
//           headers: { 'Content-Type': 'application/json' }
//         }
//       );
    
//       console.log('Server response:', response.data);
    
//       if (response.data.success) {
//         console.log('Joining details saved successfully:', response.data);
//         toast.success('Joining details saved successfully');
//         nextStep();
//       }
//     } catch (error) {
//       console.log('Error details:', error.response?.data);
//       toast.error('Failed to save joining details');
//     }
//   };
  
    

//   return (
//     <AnimatePresence mode='wait'>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: -20 }}
//         transition={{ duration: 0.5 }}
//       >
      
// <Formik
//   initialValues={initialValues}
//   validationSchema={validationSchema}
//   enableReinitialize={true}
//   onSubmit={handleSubmit}
// >

//           {({ errors, touched }) => (
//             <Form>
//               <StyledPaper>
//                 <Typography variant="h5" gutterBottom color="primary">
//                   Joining Details
//                 </Typography>
//                 <Grid container spacing={3}>
//                 <Grid item xs={12} sm={6}>
//   <Typography variant="body1" gutterBottom>Date of Appointment</Typography>
//   <Grid container spacing={2}>
//     <Grid item xs={4}>
//       <FormControl fullWidth>
//         <InputLabel>Date</InputLabel>
//         <Field name="appointmentDay">
//           {({ field, form }) => (
//             <Select
//               {...field}
//               label="Date"
//               onChange={(e) => {
//                 form.setFieldValue('appointmentDay', e.target.value);
//                 const newDate = new Date(
//                   form.values.appointmentYear,
//                   months.indexOf(form.values.appointmentMonth),
//                   e.target.value
//                 );
//                 form.setFieldValue('dateOfAppointment', newDate);
//               }}
//             >
//               {days.map(day => (
//                 <MenuItem key={day} value={day}>{day}</MenuItem>
//               ))}
//             </Select>
//           )}
//         </Field>
//       </FormControl>
//     </Grid>
//     <Grid item xs={4}>
//       <FormControl fullWidth>
//         <InputLabel>Month</InputLabel>
//         <Field name="appointmentMonth">
//           {({ field, form }) => (
//             <Select
//               {...field}
//               label="Month"
//               onChange={(e) => {
//                 form.setFieldValue('appointmentMonth', e.target.value);
//                 const newDate = new Date(
//                   form.values.appointmentYear,
//                   months.indexOf(e.target.value),
//                   form.values.appointmentDay
//                 );
//                 form.setFieldValue('dateOfAppointment', newDate);
//               }}
//             >
//               {months.map(month => (
//                 <MenuItem key={month} value={month}>{month}</MenuItem>
//               ))}
//             </Select>
//           )}
//         </Field>
//       </FormControl>
//     </Grid>
//     <Grid item xs={4}>
//       <FormControl fullWidth>
//         <InputLabel>Year</InputLabel>
//         <Field name="appointmentYear">
//           {({ field, form }) => (
//             <Select
//               {...field}
//               label="Year"
//               onChange={(e) => {
//                 form.setFieldValue('appointmentYear', e.target.value);
//                 const newDate = new Date(
//                   e.target.value,
//                   months.indexOf(form.values.appointmentMonth),
//                   form.values.appointmentDay
//                 );
//                 form.setFieldValue('dateOfAppointment', newDate);
//               }}
//             >
//               {years.map(year => (
//                 <MenuItem key={year} value={year}>{year}</MenuItem>
//               ))}
//             </Select>
//           )}
//         </Field>
//       </FormControl>
//     </Grid>
//   </Grid>
// </Grid>


// <Grid item xs={12} sm={6}>
//   <Typography variant="body1" gutterBottom>Date of Joining</Typography>
//   <Grid container spacing={2}>
//     <Grid item xs={4}>
//       <FormControl fullWidth>
//         <InputLabel>Date</InputLabel>
//         <Field name="joiningDay">
//           {({ field, form }) => (
//             <Select
//               {...field}
//               label="Date"
//               onChange={(e) => {
//                 form.setFieldValue('joiningDay', e.target.value);
//                 const newDate = new Date(
//                   form.values.joiningYear,
//                   months.indexOf(form.values.joiningMonth),
//                   e.target.value
//                 );
//                 form.setFieldValue('dateOfJoining', newDate);
//               }}
//             >
//               {days.map(day => (
//                 <MenuItem key={day} value={day}>{day}</MenuItem>
//               ))}
//             </Select>
//           )}
//         </Field>
//       </FormControl>
//     </Grid>
//     <Grid item xs={4}>
//       <FormControl fullWidth>
//         <InputLabel>Month</InputLabel>
//         <Field name="joiningMonth">
//           {({ field, form }) => (
//             <Select
//               {...field}
//               label="Month"
//               onChange={(e) => {
//                 form.setFieldValue('joiningMonth', e.target.value);
//                 const newDate = new Date(
//                   form.values.joiningYear,
//                   months.indexOf(e.target.value),
//                   form.values.joiningDay
//                 );
//                 form.setFieldValue('dateOfJoining', newDate);
//               }}
//             >
//               {months.map(month => (
//                 <MenuItem key={month} value={month}>{month}</MenuItem>
//               ))}
//             </Select>
//           )}
//         </Field>
//       </FormControl>
//     </Grid>
//     <Grid item xs={4}>
//       <FormControl fullWidth>
//         <InputLabel>Year</InputLabel>
//         <Field name="joiningYear">
//           {({ field, form }) => (
//             <Select
//               {...field}
//               label="Year"
//               onChange={(e) => {
//                 form.setFieldValue('joiningYear', e.target.value);
//                 const newDate = new Date(
//                   e.target.value,
//                   months.indexOf(form.values.joiningMonth),
//                   form.values.joiningDay
//                 );
//                 form.setFieldValue('dateOfJoining', newDate);
//               }}
//             >
//               {years.map(year => (
//                 <MenuItem key={year} value={year}>{year}</MenuItem>
//               ))}
//             </Select>
//           )}
//         </Field>
//       </FormControl>
//     </Grid>
//   </Grid>
// </Grid>


//                   <Grid item xs={12} sm={6}>
//                     <Field
//                       name="department"
//                       component={AnimatedTextField}
//                       label="Department"
//                       fullWidth
//                       error={touched.officeName && errors.officeName}
//                       helperText={touched.officeName && errors.officeName}
//                     />
//                   </Grid>
//                   <Grid item xs={12} sm={6}>
//                     <Field
//                       name="initialDesignation"
//                       component={AnimatedTextField}
//                       label="Initial Designation"
//                       fullWidth
//                       error={touched.initialDesignation && errors.initialDesignation}
//                       helperText={touched.initialDesignation && errors.initialDesignation}
//                     />
//                   </Grid>
//                   <Grid item xs={12} sm={6}>
//                     <Field
//                       name="modeOfRecruitment"
//                       component={AnimatedTextField}
//                       label="Mode of Recruitment"
//                       fullWidth
//                       error={touched.modeOfRecruitment && errors.modeOfRecruitment}
//                       helperText={touched.modeOfRecruitment && errors.modeOfRecruitment}
//                     />
//                   </Grid>
//                   <Grid item xs={12} sm={6}>
//                     <Field
//                       name="employeeType"
//                       component={AnimatedTextField}
//                       label="Employee Type"
//                       fullWidth
//                       error={touched.employeeType && errors.employeeType}
//                       helperText={touched.employeeType && errors.employeeType}
//                     />
//                   </Grid>
//                 </Grid>

//                 <Divider sx={{ my: 4 }} />
                
//                 <Grid container spacing={2}>
//                   <Grid item xs={6}>
//                     <StyledButton
//                       onClick={prevStep}
//                       variant="outlined"
//                       fullWidth
//                     >
//                       Previous
//                     </StyledButton>
//                   </Grid>
//                   <Grid item xs={6}>
//                     <StyledButton
//                       type="submit"
//                       variant="contained"
//                       fullWidth
//                     >
//                       Next
//                     </StyledButton>
//                   </Grid>
//                 </Grid>
//               </StyledPaper>
//             </Form>
//           )}
//         </Formik>
//       </motion.div>
//     </AnimatePresence>
//   );
// };

// export default JoiningDetailsForm;
