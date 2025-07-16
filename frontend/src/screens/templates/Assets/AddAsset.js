import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { 
  Paper, 
  TextField, 
  Button, 
  Typography,
  IconButton,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const STATUS_OPTIONS = [
  'In Use',
  'Available', 
  'Under Maintenance',
  'Returned'
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Asset name is required'),
  category: Yup.string().required('Category is required'),
  status: Yup.string().required('Status is required'),
  currentEmployee: Yup.string().required('Current user is required'),
  previousEmployees: Yup.string()
});

const toSentenceCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const AddAsset = ({ onClose, refreshAssets, editAsset }) => {
  const handleSubmit = async (values, { setSubmitting }) => {
    const normalizedValues = Object.keys(values).reduce((acc, key) => {
      if (typeof values[key] === 'string' && key !== 'status') {
        acc[key] = toSentenceCase(values[key]);
      } else {
        acc[key] = values[key];
      }
      return acc;
    }, {});
  
    const assetData = {
      ...normalizedValues,
      previousEmployees: normalizedValues.previousEmployees
        .split(',')
        .map(emp => toSentenceCase(emp.trim()))
        .filter(emp => emp)
    };
  
    const API_URL = `${process.env.REACT_APP_API_URL}`;
  
    try {
      if (editAsset) {
        await axios.put(`${API_URL}/api/assets/${editAsset._id}`, assetData);
      } else {
        await axios.post(`${API_URL}/api/assets`, assetData);
      }
      refreshAssets();
      onClose();
    } catch (error) {
      console.error("Error:", error);
    }
    setSubmitting(false);
  };

  return (
    <div style={styles.overlay}>
      <Paper elevation={24} sx={styles.modalContainer}>
        <IconButton
          sx={styles.closeButton}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h4" sx={styles.title}>
          {editAsset ? 'Edit Asset' : 'Add Asset'}
        </Typography>

        <Formik
          initialValues={{
            name: editAsset?.name || '',
            category: editAsset?.category || '',
            status: editAsset?.status || '',
            currentEmployee: editAsset?.currentEmployee || '',
            previousEmployees: editAsset?.previousEmployees?.join(', ') || ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form style={styles.form}>
              {/* Add this to handle real-time input transformation */}
              {(() => {
                const handleFieldChange = (field, value) => {
                  if (field === 'status') {
                    return value
                  }
                  return toSentenceCase(value)
                }

                return ['name', 'category', 'currentEmployee', 'previousEmployees'].map((fieldName) => (
                  <Box key={fieldName} sx={styles.formGroup}>
                    <Field name={fieldName}>
                      {({ field, form }) => (
                        <TextField
                          {...field}
                          onChange={(e) => {
                            const transformedValue = handleFieldChange(fieldName, e.target.value)
                            form.setFieldValue(fieldName, transformedValue)
                          }}
                          label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}
                          variant="outlined"
                          fullWidth
                          error={touched[fieldName] && errors[fieldName]}
                          helperText={touched[fieldName] && errors[fieldName]}
                          sx={styles.input}
                        />
                      )}
                    </Field>
                  </Box>
                ))
              })()}
              <Box sx={styles.formGroup}>
                <Field name="status">
                  {({ field }) => (
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="status-label">Status</InputLabel>
                      <Select
                        {...field}
                        labelId="status-label"
                        label="Status"
                        error={touched.status && errors.status}
                        sx={styles.input}
                      >
                        <MenuItem value="">Select Status</MenuItem>
                        {STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Field>
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={styles.submitButton}
                fullWidth
              >
                {isSubmitting ? 'Saving...' : 'Save Asset'}
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContainer: {
    width: '80%',
    maxWidth: '1200px',
    p: 4,
    position: 'relative',
    borderRadius: '8px',
    background: '#ffffff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    color: 'grey.600',
  },
  title: {
    textAlign: 'center',
    color: 'primary.main',
    mb: 4,
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  formGroup: {
    mb: 2,
    '& .MuiInputLabel-root': {
      fontSize: '1rem',
      fontWeight: 500,
      color: 'primary.main',
    },
    '& .MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.85)',
    }
  },
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      backgroundColor: '#f8f9fa',
      '&:hover': {
        backgroundColor: '#fff',
      },
      '&.Mui-focused': {
        backgroundColor: '#fff',
        boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.1)'
      }
    },
    '& .MuiSelect-select': {
      padding: '14px'
    }
  },
  submitButton: {
    py: 1.5,
    mt: 2,
    borderRadius: 1,
    fontSize: '1.1rem',
    fontWeight: 500,
  }
};

export default AddAsset;
