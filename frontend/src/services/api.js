// import axios from 'axios';  


// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5002/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add a request interceptor to include auth token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
    
//     // Add company code to headers if available
//     const companyCode = localStorage.getItem('companyCode');
//     if (companyCode) {
//       config.headers['X-Company-Code'] = companyCode;
//     }
    
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Add a response interceptor to handle common errors
// api.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     // Handle authentication errors
//     if (error.response && error.response.status === 401) {
//       // Clear local storage and redirect to login
//       localStorage.removeItem('token');
//       localStorage.removeItem('companyCode');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

// Re-export the main axios instance to maintain compatibility
// This ensures any existing imports continue to work
import api from '../api/axiosInstance';

export default api;
