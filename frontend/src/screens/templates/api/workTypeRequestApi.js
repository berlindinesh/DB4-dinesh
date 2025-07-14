import api from '../../../api/axiosInstance';

const API_URL = `/work-type-requests`;

export const fetchWorkTypeRequests = () => api.get(API_URL);
export const createWorkTypeRequest = (data) => api.post(API_URL, data);
export const updateWorkTypeRequest = (id, data) => api.put(`${API_URL}/${id}`, data);
export const deleteWorkTypeRequest = (id) => api.delete(`${API_URL}/${id}`);
export const approveWorkTypeRequest = (id, data) => api.put(`${API_URL}/${id}/approve`, data);
export const rejectWorkTypeRequest = (id, data) => api.put(`${API_URL}/${id}/reject`, data);
export const bulkApproveRequests = (data) => api.put(`${API_URL}/bulk-approve`, data);
export const bulkRejectRequests = (data) => api.put(`${API_URL}/bulk-reject`, data);
export const fetchWorkTypeRequestsByEmployeeCode = (employeeCode) => 
    api.get(`${API_URL}/employee/${employeeCode}`);

// import axios from 'axios';

// const API_URL = `${process.env.REACT_APP_API_URL}/api/work-type-requests`;

// export const fetchWorkTypeRequests = () => axios.get(API_URL);
// export const createWorkTypeRequest = (data) => axios.post(API_URL, data);
// export const updateWorkTypeRequest = (id, data) => axios.put(`${API_URL}/${id}`, data);
// export const deleteWorkTypeRequest = (id) => axios.delete(`${API_URL}/${id}`);
// export const approveWorkTypeRequest = (id) => axios.put(`${API_URL}/${id}/approve`);
// export const rejectWorkTypeRequest = (id) => axios.put(`${API_URL}/${id}/reject`);
// export const bulkApproveRequests = (ids) => axios.put(`${API_URL}/bulk-approve`, { ids });
// export const bulkRejectRequests = (ids) => axios.put(`${API_URL}/bulk-reject`, { ids });
// export const fetchWorkTypeRequestsByEmployeeCode = (employeeCode) => 
//     axios.get(`${API_URL}/employee/${employeeCode}`);
  