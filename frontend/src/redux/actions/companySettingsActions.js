import api from '../../services/api';
import {
  FETCH_COMPANY_SETTINGS_REQUEST,
  FETCH_COMPANY_SETTINGS_SUCCESS,
  FETCH_COMPANY_SETTINGS_FAILURE,
  UPDATE_COMPANY_SETTINGS_REQUEST,
  UPDATE_COMPANY_SETTINGS_SUCCESS,
  UPDATE_COMPANY_SETTINGS_FAILURE
} from './types';

// Fetch company settings
export const fetchCompanySettings = () => async (dispatch) => {
  dispatch({ type: FETCH_COMPANY_SETTINGS_REQUEST });
  
  try {
    const response = await api.get('/companies/settings');
    
    dispatch({
      type: FETCH_COMPANY_SETTINGS_SUCCESS,
      payload: response.data.settings
    });
    
    return response.data.settings;
  } catch (error) {
    dispatch({
      type: FETCH_COMPANY_SETTINGS_FAILURE,
      payload: error.response?.data?.message || 'Error fetching company settings'
    });
    
    throw error;
  }
};

// Update company settings
export const updateCompanySettings = (settingsData) => async (dispatch) => {
  dispatch({ type: UPDATE_COMPANY_SETTINGS_REQUEST });
  
  try {
    console.log('Updating company settings with:', settingsData);
    
    const response = await api.put('/companies/settings', settingsData);
    
    dispatch({
      type: UPDATE_COMPANY_SETTINGS_SUCCESS,
      payload: response.data.settings
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating company settings:', error.response?.data || error.message);
    
    dispatch({
      type: UPDATE_COMPANY_SETTINGS_FAILURE,
      payload: error.response?.data?.message || 'Error updating company settings'
    });
    
    throw error;
  }
};
