import api from '../../services/api';
import {
  FETCH_INVITATIONS_REQUEST,
  FETCH_INVITATIONS_SUCCESS,
  FETCH_INVITATIONS_FAILURE,
  INVITE_USER_REQUEST,
  INVITE_USER_SUCCESS,
  INVITE_USER_FAILURE,
  RESEND_INVITATION_REQUEST,
  RESEND_INVITATION_SUCCESS,
  RESEND_INVITATION_FAILURE,
  CANCEL_INVITATION_REQUEST,
  CANCEL_INVITATION_SUCCESS,
  CANCEL_INVITATION_FAILURE
} from './types';

// Import fetchUsers from userActions
import { fetchUsers } from './userActions';

// Fetch all invitations
export const fetchInvitations = () => async (dispatch) => {
  dispatch({ type: FETCH_INVITATIONS_REQUEST });
  
  try {
    const response = await api.get('/invitations');
    
    dispatch({
      type: FETCH_INVITATIONS_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_INVITATIONS_FAILURE,
      payload: error.response?.data?.message || 'Error fetching invitations'
    });
  }
};

// Invite a new user
export const inviteUser = (userData) => async (dispatch) => {
  dispatch({ type: INVITE_USER_REQUEST });
  
  try {
    console.log('Sending invitation request with data:', userData);
    console.log('API headers:', {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'X-Company-Code': localStorage.getItem('companyCode')
    });
    
    const response = await api.post('/invitations', userData);
    console.log('Invitation response:', response.data);
    
    dispatch({
      type: INVITE_USER_SUCCESS,
      payload: response.data
    });
    
    // Refresh invitation list after creating a new invitation
    dispatch(fetchInvitations());
    
    return response.data;
  } catch (error) {
    console.error('Detailed invitation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      }
    });
    
    dispatch({
      type: INVITE_USER_FAILURE,
      payload: error.response?.data?.message || 'Error inviting user'
    });
    
    throw error;
  }
};

// Resend invitation
export const resendInvitation = (invitationId) => async (dispatch) => {
  dispatch({ type: RESEND_INVITATION_REQUEST });
  
  try {
    const response = await api.post(`/invitations/${invitationId}/resend`, {});
    
    dispatch({
      type: RESEND_INVITATION_SUCCESS,
      payload: response.data
    });
    
    // Refresh invitation list after resending
    dispatch(fetchInvitations());
    
    return response.data;
  } catch (error) {
    dispatch({
      type: RESEND_INVITATION_FAILURE,
      payload: error.response?.data?.message || 'Error resending invitation'
    });
    
    throw error;
  }
};

// Cancel invitation
export const cancelInvitation = (invitationId) => async (dispatch) => {
  dispatch({ type: CANCEL_INVITATION_REQUEST });
  
  try {
    const response = await api.delete(`/invitations/${invitationId}`);
    
    dispatch({
      type: CANCEL_INVITATION_SUCCESS,
      payload: { invitationId, ...response.data }
    });
    
    // Refresh invitation list after cancelling
    dispatch(fetchInvitations());
    
    return response.data;
  } catch (error) {
    dispatch({
      type: CANCEL_INVITATION_FAILURE,
      payload: error.response?.data?.message || 'Error cancelling invitation'
    });
    
    throw error;
  }
};

// Check for invitation updates
export const checkInvitationUpdates = () => async (dispatch, getState) => {
  const { invitations } = getState();
  const lastCheck = invitations.lastCheck;
  
  try {
    const response = await api.get(`/invitations?lastCheck=${lastCheck}`);
    
    if (response.data.hasUpdates) {
      dispatch({
        type: FETCH_INVITATIONS_SUCCESS,
        payload: response.data.invitations
      });
      
      // Also refresh users list if there are updates
      dispatch(fetchUsers());
    }
  } catch (error) {
    console.error('Error checking invitation updates:', error);
  }
};
