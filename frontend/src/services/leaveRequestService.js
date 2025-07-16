import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/leave-requests`;

export const leaveRequestService = {
  fetchLeaveRequests: async (filters, searchTerm = '') => {
    const params = new URLSearchParams();

    if (searchTerm) params.append('searchTerm', searchTerm);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.dateRange?.start) params.append('startDate', filters.dateRange.start);
    if (filters.dateRange?.end) params.append('endDate', filters.dateRange.end);

    const response = await axios.get(`${API_URL}?${params.toString()}`);
    return response.data;
  },

  createLeaveRequest: async (data) => {
    try {
      console.log('Sending leave request data:', data);
      const response = await axios.post(API_URL, data);
      console.log('Server response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating leave request:', error.response?.data || error.message);
      throw error;
    }
  },

  updateLeaveRequest: async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  deleteLeaveRequest: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  }
};

// import axios from 'axios';
// const API_URL = `${${process.env.REACT_APP_API_URL}}/api/leave-requests`;


// export const leaveRequestService = {
//   fetchLeaveRequests: async (filters, searchTerm = '') => {
//     const params = new URLSearchParams();
    
//     if (searchTerm) params.append('searchTerm', searchTerm);
//     if (filters.type) params.append('type', filters.type);
//     if (filters.status) params.append('status', filters.status);
//     if (filters.dateRange?.start) params.append('startDate', filters.dateRange.start);
//     if (filters.dateRange?.end) params.append('endDate', filters.dateRange.end);

//     const response = await axios.get(`${API_URL}?${params.toString()}`);
//     return response.data;
//   },

//   createLeaveRequest: async (data) => {
//     try {
//       console.log('Sending leave request data:', data);
//       const response = await axios.post(`${API_URL}`, data);
//       console.log('Server response:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('Error creating leave request:', error.response?.data || error.message);
//       throw error;
//     }
//   },

//   updateLeaveRequest: async (id, data) => {
//     const response = await axios.put(`${API_URL}/${id}`, data);
//     return response.data;
//   },

//   deleteLeaveRequest: async (id) => {
//     const response = await axios.delete(`${API_URL}/${id}`);
//     return response.data;
//   }
// };
