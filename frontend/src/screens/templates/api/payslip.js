// import axios from 'axios';

// const API_URL = '${process.env.REACT_APP_API_URL}/api/payslips';

// // export const payslipAPI = {
//     // // Get all payslips with pagination and filters
//     // getAllPayslips: (page = 1, limit = 10, filters = {}) => {
//     //     const token = localStorage.getItem('token');
//     //     const queryParams = new URLSearchParams({
//     //         page,
//     //         limit,
//     //         ...filters
//     //     }).toString();
        
//     //     return axios.get(`${API_URL}?${queryParams}`, {
//     //         headers: { Authorization: `Bearer ${token}` }
//     //     });
//     // },

//     // // Create new payslip
//     // createPayslip: (payslipData) => {
//     //     const token = localStorage.getItem('token');
//     //     return axios.post(API_URL, payslipData, {
//     //         headers: { Authorization: `Bearer ${token}` }
//     //     });
//     // },

//     // const getAuthConfig = () => {
//     //     const token = localStorage.getItem('token');
//     //     return {
//     //         headers: {
//     //             'Authorization': `Bearer ${token?.replace('Bearer ', '')}`,
//     //             'Content-Type': 'application/json'
//     //         }
//     //     };
//     // };
    
//     // export const payslipAPI = {
//     //     createPayslip: (payslipData) => {
//     //         return axios.post(API_URL, payslipData, getAuthConfig());
//     //     },
        
//     //     getAllPayslips: (page = 1, limit = 10, filters = {}) => {
//     //         const queryParams = new URLSearchParams({ page, limit, ...filters }).toString();
//     //         return axios.get(`${API_URL}?${queryParams}`, getAuthConfig());
//     //     },



//     // // Update existing payslip
//     // updatePayslip: (id, payslipData) => {
//     //     const token = localStorage.getItem('token');
//     //     return axios.put(`${API_URL}/${id}`, payslipData, {
//     //         headers: { Authorization: `Bearer ${token}` }
//     //     });
//     // },

//     // // Delete payslip
//     // deletePayslip: (id) => {
//     //     const token = localStorage.getItem('token');
//     //     return axios.delete(`${API_URL}/${id}`, {
//     //         headers: { Authorization: `Bearer ${token}` }
//     //     });
//     // },

//     // // Bulk delete payslips
//     // bulkDeletePayslips: (ids) => {
//     //     const token = localStorage.getItem('token');
//     //     return axios.post(`${API_URL}/bulk-delete`, { ids }, {
//     //         headers: { Authorization: `Bearer ${token}` }
//     //     });
//     // },

//     // // Update mail status
//     // updateMailStatus: (id) => {
//     //     const token = localStorage.getItem('token');
//     //     return axios.put(`${API_URL}/${id}/mail-status`, {}, {
//     //         headers: { Authorization: `Bearer ${token}` }
//     //     });
//     // },

    

//     // Get payslip by ID
//     getPayslipById: (id) => {
//         const token = localStorage.getItem('token');
//         return axios.get(`${API_URL}/${id}`, {
//             headers: { Authorization: `Bearer ${token}` }
//         });
//     },

//     // Export payslips
//     exportPayslips: (filters = {}) => {
//         const token = localStorage.getItem('token');
//         const queryParams = new URLSearchParams(filters).toString();
//         return axios.get(`${API_URL}/export?${queryParams}`, {
//             headers: { 
//                 Authorization: `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             responseType: 'blob'
//         });
//     }
// };

import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/payslips`;

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const payslipAPI = {
    getAllPayslips: async (page = 1, limit = 10, filters = {}) => {
        const queryParams = new URLSearchParams({ page, limit, ...filters });
        const response = await axiosInstance.get(`?${queryParams}`);
        return response.data;
    },

    createPayslip: async (payslipData) => {
        const response = await axiosInstance.post('', payslipData);
        return response.data;
    },

    updatePayslip: async (id, payslipData) => {
        const response = await axiosInstance.put(`/${id}`, payslipData);
        return response.data;
    },

    deletePayslip: async (id) => {
        const response = await axiosInstance.delete(`/${id}`);
        return response.data;
    },

    bulkDeletePayslips: async (ids) => {
        const response = await axiosInstance.post('/bulk-delete', { ids });
        return response.data;
    },

    updateMailStatus: async (id) => {
        const response = await axiosInstance.put(`/${id}/mail-status`, {});
        return response.data;
    },

    getPayslipById: async (id) => {
        const response = await axiosInstance.get(`/${id}`);
        return response.data;
    },

    exportPayslips: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters);
        const response = await axiosInstance.get(`/export?${queryParams}`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

export default payslipAPI;
