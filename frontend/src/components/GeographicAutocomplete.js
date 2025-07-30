import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  styled,
  Box,
  Typography
} from '@mui/material';
import {
  indianStates,
  getCitiesForState,
  getDistrictsForCity,
  getPincodesForCity,
  searchCities,
  searchPincodes,
  getLocationForPincode,
  validateCompleteAddress
} from '../utils/indianGeography';

// Styled components for consistent theming
const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  '& .MuiAutocomplete-paper': {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
  },
  '& .MuiAutocomplete-option': {
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&[aria-selected="true"]': {
      backgroundColor: 'rgba(74, 144, 226, 0.3)',
    },
  },
  '& .MuiAutocomplete-noOptions': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiChip-root': {
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    color: 'white',
    '& .MuiChip-deleteIcon': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&:hover': {
        color: 'white',
      }
    }
  }
}));

// State selector component
export const StateAutocomplete = ({ 
  value, 
  onChange, 
  error, 
  helperText, 
  disabled = false,
  required = true,
  size = "medium",
  ...props 
}) => {
  return (
    <StyledAutocomplete
      options={indianStates}
      value={value || null}
      onChange={(event, newValue) => {
        onChange(newValue);
      }}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label="State"
          required={required}
          error={!!error}
          helperText={helperText}
          size={size}
          {...props}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Typography variant="body2">{option}</Typography>
        </Box>
      )}
      isOptionEqualToValue={(option, value) => option === value}
    />
  );
};

// City selector component with state filtering
export const CityAutocomplete = ({ 
  value, 
  onChange, 
  state,
  error, 
  helperText, 
  disabled = false,
  required = true,
  size = "medium",
  onCitySelect = null,
  ...props 
}) => {
  const [cities, setCities] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (state) {
      const stateCities = getCitiesForState(state);
      setCities(stateCities);
    } else {
      setCities([]);
    }
  }, [state]);

  const handleCityChange = (newValue) => {
    onChange(newValue);
    if (onCitySelect && newValue && state) {
      const districts = getDistrictsForCity(state, newValue);
      const pincodes = getPincodesForCity(state, newValue);
      onCitySelect({
        city: newValue,
        state: state,
        districts: districts,
        pincodes: pincodes
      });
    }
  };

  return (
    <StyledAutocomplete
      options={cities}
      value={value || null}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, newValue) => {
        handleCityChange(newValue);
      }}
      disabled={disabled || !state}
      noOptionsText={state ? "No cities found" : "Please select a state first"}
      renderInput={(params) => (
        <TextField
          {...params}
          label="City"
          required={required}
          error={!!error}
          helperText={helperText || (!state ? "Select a state first" : "")}
          size={size}
          {...props}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Typography variant="body2">{option}</Typography>
        </Box>
      )}
      isOptionEqualToValue={(option, value) => option === value}
    />
  );
};

// District selector component with city filtering
export const DistrictAutocomplete = ({ 
  value, 
  onChange, 
  state,
  city,
  error, 
  helperText, 
  disabled = false,
  required = true,
  size = "medium",
  ...props 
}) => {
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    if (state && city) {
      const cityDistricts = getDistrictsForCity(state, city);
      setDistricts(cityDistricts);
    } else {
      setDistricts([]);
    }
  }, [state, city]);

  return (
    <StyledAutocomplete
      options={districts}
      value={value || null}
      onChange={(event, newValue) => {
        onChange(newValue);
      }}
      disabled={disabled || !state || !city}
      noOptionsText={!state ? "Please select a state first" : !city ? "Please select a city first" : "No districts found"}
      renderInput={(params) => (
        <TextField
          {...params}
          label="District"
          required={required}
          error={!!error}
          helperText={helperText || (!state ? "Select a state first" : !city ? "Select a city first" : "")}
          size={size}
          {...props}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Typography variant="body2">{option}</Typography>
        </Box>
      )}
      isOptionEqualToValue={(option, value) => option === value}
    />
  );
};

// Pincode selector component with smart autocomplete
export const PincodeAutocomplete = ({ 
  value, 
  onChange, 
  state,
  city,
  error, 
  helperText, 
  disabled = false,
  required = true,
  size = "medium",
  onPincodeSelect = null,
  allowFreeEntry = true,
  ...props 
}) => {
  const [pincodes, setPincodes] = useState([]);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    if (state && city) {
      const cityPincodes = getPincodesForCity(state, city);
      setPincodes(cityPincodes);
    } else {
      setPincodes([]);
    }
  }, [state, city]);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handlePincodeChange = (newValue) => {
    onChange(newValue);
    if (onPincodeSelect && newValue) {
      // Auto-populate location if pincode is entered without state/city selection
      if (!state || !city) {
        const locationData = getLocationForPincode(newValue);
        if (locationData) {
          onPincodeSelect(locationData);
        }
      }
    }
  };

  const handleInputChange = (event, newInputValue) => {
    // Only allow numeric input and limit to 6 digits
    const numericValue = newInputValue.replace(/\D/g, '').slice(0, 6);
    setInputValue(numericValue);
    
    if (allowFreeEntry) {
      onChange(numericValue);
    }
  };

  return (
    <StyledAutocomplete
      options={pincodes}
      value={value || null}
      inputValue={inputValue}
      freeSolo={allowFreeEntry}
      onInputChange={handleInputChange}
      onChange={(event, newValue) => {
        handlePincodeChange(newValue);
      }}
      disabled={disabled}
      noOptionsText={!state || !city ? "Select state and city for suggestions" : "No pincodes found"}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Pincode"
          required={required}
          error={!!error}
          helperText={helperText || "6-digit pincode"}
          size={size}
          inputProps={{
            ...params.inputProps,
            maxLength: 6,
            pattern: '[0-9]*'
          }}
          {...props}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {option}
          </Typography>
        </Box>
      )}
      isOptionEqualToValue={(option, value) => option === value}
    />
  );
};

// Complete address form component
export const GeographicAddressForm = ({
  values = {},
  onChange,
  errors = {},
  disabled = false,
  required = true,
  size = "medium",
  showValidation = true
}) => {
  const [addressData, setAddressData] = useState({
    state: values.state || '',
    city: values.city || '',
    district: values.district || '',
    pincode: values.pincode || ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setAddressData({
      state: values.state || '',
      city: values.city || '',
      district: values.district || '',
      pincode: values.pincode || ''
    });
  }, [values]);

  useEffect(() => {
    if (showValidation) {
      const validation = validateCompleteAddress(
        addressData.state,
        addressData.city,
        addressData.district,
        addressData.pincode
      );
      setValidationErrors(validation.errors);
    }
  }, [addressData, showValidation]);

  const handleStateChange = (newState) => {
    const newData = {
      state: newState,
      city: '',
      district: '',
      pincode: ''
    };
    setAddressData(newData);
    onChange(newData);
  };

  const handleCityChange = (newCity) => {
    const newData = {
      ...addressData,
      city: newCity,
      district: '',
      pincode: ''
    };
    setAddressData(newData);
    onChange(newData);
  };

  const handleDistrictChange = (newDistrict) => {
    const newData = {
      ...addressData,
      district: newDistrict
    };
    setAddressData(newData);
    onChange(newData);
  };

  const handlePincodeChange = (newPincode) => {
    const newData = {
      ...addressData,
      pincode: newPincode
    };
    setAddressData(newData);
    onChange(newData);
  };

  const handlePincodeSelect = (locationData) => {
    // Auto-fill based on pincode selection
    const newData = {
      state: locationData.state,
      city: locationData.city,
      district: locationData.districts[0] || '', // Use first district if multiple
      pincode: addressData.pincode
    };
    setAddressData(newData);
    onChange(newData);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <StateAutocomplete
        value={addressData.state}
        onChange={handleStateChange}
        error={errors.state || validationErrors.state}
        helperText={errors.state || validationErrors.state}
        disabled={disabled}
        required={required}
        size={size}
      />

      <CityAutocomplete
        value={addressData.city}
        onChange={handleCityChange}
        state={addressData.state}
        error={errors.city || validationErrors.city}
        helperText={errors.city || validationErrors.city}
        disabled={disabled}
        required={required}
        size={size}
      />

      <DistrictAutocomplete
        value={addressData.district}
        onChange={handleDistrictChange}
        state={addressData.state}
        city={addressData.city}
        error={errors.district || validationErrors.district}
        helperText={errors.district || validationErrors.district}
        disabled={disabled}
        required={required}
        size={size}
      />

      <PincodeAutocomplete
        value={addressData.pincode}
        onChange={handlePincodeChange}
        state={addressData.state}
        city={addressData.city}
        error={errors.pincode || validationErrors.pincode}
        helperText={errors.pincode || validationErrors.pincode}
        onPincodeSelect={handlePincodeSelect}
        disabled={disabled}
        required={required}
        size={size}
      />
    </Box>
  );
};

export default {
  StateAutocomplete,
  CityAutocomplete,
  DistrictAutocomplete,
  PincodeAutocomplete,
  GeographicAddressForm
};