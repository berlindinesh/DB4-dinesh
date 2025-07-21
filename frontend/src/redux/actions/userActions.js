import api from '../../services/api';
import userApi from '../../api/userApi';
import {
  FETCH_USERS_REQUEST,
  FETCH_USERS_SUCCESS,
  FETCH_USERS_FAILURE,
  UPDATE_USER_ROLE_REQUEST,
  UPDATE_USER_ROLE_SUCCESS,
  UPDATE_USER_ROLE_FAILURE,
  UPDATE_USER_STATUS_REQUEST,
  UPDATE_USER_STATUS_SUCCESS,
  UPDATE_USER_STATUS_FAILURE,
  UPDATE_USER_PROFILE_REQUEST,
  UPDATE_USER_PROFILE_SUCCESS,
  UPDATE_USER_PROFILE_FAILURE,
  DELETE_USER_REQUEST,
  DELETE_USER_SUCCESS,
  DELETE_USER_FAILURE,
  RESET_USER_PASSWORD_REQUEST,
  RESET_USER_PASSWORD_SUCCESS,
  RESET_USER_PASSWORD_FAILURE,
  CHANGE_PASSWORD_REQUEST,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_FAILURE
} from './types';

// Fetch all users
export const fetchUsers = () => async (dispatch) => {
  dispatch({ type: FETCH_USERS_REQUEST });
  
  try {
    const response = await api.get('/users');
    
    dispatch({
      type: FETCH_USERS_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_USERS_FAILURE,
      payload: error.response?.data?.message || 'Error fetching users'
    });
  }
};

// Update user role
export const updateUserRole = (userId, roleData) => async (dispatch) => {
  dispatch({ type: UPDATE_USER_ROLE_REQUEST });
  
  try {
    const response = await api.put(`/users/${userId}/role`, roleData);
    
    dispatch({
      type: UPDATE_USER_ROLE_SUCCESS,
      payload: response.data
    });
    
    // Refresh user list after update
    dispatch(fetchUsers());
    
    return response.data;
  } catch (error) {
    dispatch({
      type: UPDATE_USER_ROLE_FAILURE,
      payload: error.response?.data?.message || 'Error updating user role'
    });
    
    throw error;
  }
};

// Update user status
export const updateUserStatus = (userId, statusData) => async (dispatch) => {
  dispatch({ type: UPDATE_USER_STATUS_REQUEST });
  
  try {
    const response = await api.put(`/users/${userId}/status`, statusData);
    
    dispatch({
      type: UPDATE_USER_STATUS_SUCCESS,
      payload: response.data
    });
    
    // Refresh user list after update
    dispatch(fetchUsers());
    
    return response.data;
  } catch (error) {
    dispatch({
      type: UPDATE_USER_STATUS_FAILURE,
      payload: error.response?.data?.message || 'Error updating user status'
    });
    
    throw error;
  }
};

// Update user profile
export const updateUserProfile = (userId, profileData) => async (dispatch) => {
  dispatch({ type: UPDATE_USER_PROFILE_REQUEST });
  
  try {
    const response = await api.put(`/users/${userId}/profile`, profileData);
    
    dispatch({
      type: UPDATE_USER_PROFILE_SUCCESS,
      payload: response.data
    });
    
    // Refresh user list after update
    dispatch(fetchUsers());
    
    return response.data;
  } catch (error) {
    dispatch({
      type: UPDATE_USER_PROFILE_FAILURE,
      payload: error.response?.data?.message || 'Error updating user profile'
    });
    
    throw error;
  }
};

// Delete user
export const deleteUser = (userId) => async (dispatch) => {
  dispatch({ type: DELETE_USER_REQUEST });
  
  try {
    const response = await api.delete(`/users/${userId}`);
    
    dispatch({
      type: DELETE_USER_SUCCESS,
      payload: { userId, ...response.data }
    });
    
    // Refresh user list after deletion
    dispatch(fetchUsers());
    
    return response.data;
  } catch (error) {
    dispatch({
      type: DELETE_USER_FAILURE,
      payload: error.response?.data?.message || 'Error deleting user'
    });
    
    throw error;
  }
};

// Reset user password
export const resetUserPassword = (userId) => async (dispatch) => {
  dispatch({ type: RESET_USER_PASSWORD_REQUEST });
  
  try {
    const response = await api.post(`/users/${userId}/reset-password`);
    
    dispatch({
      type: RESET_USER_PASSWORD_SUCCESS,
      payload: response.data
    });
    
    return response.data;
  } catch (error) {
    dispatch({
      type: RESET_USER_PASSWORD_FAILURE,
      payload: error.response?.data?.message || 'Error resetting password'
    });
    
    throw error;
  }
};

// Change password action
export const changePassword = (passwordData) => async (dispatch) => {
  dispatch({ type: CHANGE_PASSWORD_REQUEST });
  
  try {
    const response = await userApi.changePassword(passwordData);
    
    dispatch({
      type: CHANGE_PASSWORD_SUCCESS,
      payload: response.message
    });
    
    return Promise.resolve(response);
  } catch (error) {
    dispatch({
      type: CHANGE_PASSWORD_FAILURE,
      payload: error.message || 'Error changing password'
    });
    
    return Promise.reject(error);
  }
};

