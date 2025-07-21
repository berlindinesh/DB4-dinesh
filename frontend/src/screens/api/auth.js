// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// // Configure axios with base URL
// axios.defaults.baseURL = API_URL;

// // Create API instance with base configuration
// const api = axios.create({
//   baseURL: API_URL + '/api',
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// // Add request interceptor to include token in requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Add response interceptor to handle common errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Handle session expiration
//     if (error.response && error.response.status === 401) {
//       // Clear local storage and redirect to login if token is invalid
//       if (error.response.data.message === 'Invalid token') {
//         localStorage.clear();
//         window.location.href = '/login';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// const authService = {
//   // Register a new company
//   // Update the registerCompany method in the authService object
// // Update the registerCompany method in the authService object
// registerCompany: async (formData) => {
//   try {
//     console.log('=== AUTH SERVICE DEBUG ===');
    
//     // Check if formData is an instance of FormData
//     const isFormData = formData instanceof FormData;
//     console.log('Is FormData:', isFormData);
    
//     // Log form data contents for debugging
//     if (isFormData) {
//       console.log('FormData contents:');
//       for (let pair of formData.entries()) {
//         if (pair[0] === 'logo') {
//           console.log(pair[0], 'File:', pair[1].name, 'Size:', pair[1].size, 'Type:', pair[1].type);
//         } else {
//           console.log(pair[0], pair[1]);
//           // Try to parse JSON fields
//           if (pair[0] === 'company' || pair[0] === 'admin') {
//             try {
//               const parsed = JSON.parse(pair[1]);
//               console.log(`${pair[0]} parsed:`, parsed);
//             } catch (e) {
//               console.error(`Error parsing ${pair[0]}:`, e);
//             }
//           }
//         }
//       }
      
//       const response = await api.post('/companies/register', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         }
//       });
      
//       console.log('Registration response:', response.data);
//       return response;
//     } else {
//       // Handle regular JSON data
//       const response = await api.post('/companies/register', formData);
//       return response;
//     }
//   } catch (error) {
//     console.error('Registration error details:', error.response?.data || error.message);
//     console.error('Full error object:', error);
//     throw error;
//   }
// },

//   // Login user
// login: async (credentials) => {
//   try {
//     console.log('Auth service: Making login request with:', {
//       companyCode: credentials.companyCode.toUpperCase(),
//       email: credentials.email.toLowerCase(),
//       passwordProvided: !!credentials.password
//     });
    
//     // Trim the password to remove any accidental whitespace
//     const trimmedPassword = credentials.password.trim();
    
//     const response = await api.post('/companies/login', {
//       companyCode: credentials.companyCode.toUpperCase(),
//       email: credentials.email.toLowerCase(),
//       password: trimmedPassword
//     });
    
//     // If login is successful, store token and user info
//     if (response.data.success) {
//       localStorage.setItem('token', response.data.token);
//       localStorage.setItem('user', JSON.stringify(response.data.user));
//       localStorage.setItem('companyCode', response.data.user.companyCode);
//       localStorage.setItem('userId', response.data.user.id);
      
//       // Set the default Authorization header for future requests
//       api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
//       console.log('Login successful, token stored');
//       return response.data;
//     } else {
//       console.log('Login failed with response:', response.data);
//       throw new Error(response.data.message || 'Login failed');
//     }
//   } catch (error) {
//     console.log('Login error in auth service:', error);
    
//     // Provide more detailed error information
//     if (error.response) {
//       // The request was made and the server responded with a status code
//       // that falls out of the range of 2xx
//       console.error('Error response data:', error.response.data);
//       console.error('Error response status:', error.response.status);
      
//       // Return the error message from the server if available
//       throw new Error(error.response.data.message || 'Authentication failed');
//     } else if (error.request) {
//       // The request was made but no response was received
//       console.error('No response received:', error.request);
//       throw new Error('No response from server. Please check your connection.');
//     } else {
//       // Something happened in setting up the request that triggered an Error
//       console.error('Request setup error:', error.message);
//       throw error;
//     }
//   }
// },

  
//   // Logout user
//   logout: () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     localStorage.removeItem('userId');
//     localStorage.removeItem('companyCode');
//   },
  
//   // Get current user from localStorage
//   getCurrentUser: () => {
//     const user = localStorage.getItem('user');
//     return user ? JSON.parse(user) : null;
//   },
  
//   // Check if user is authenticated
//   isAuthenticated: () => {
//     return !!localStorage.getItem('token');
//   },
  
//   // Verify OTP
//   verifyOtp: async (email, otp) => {
//     try {
//       const response = await api.post('/companies/verify-otp', { email, otp });
//       return response.data;
//     } catch (error) {
//       console.error('OTP verification error:', error);
//       throw error;
//     }
//   },
  
//   // Resend OTP
//   resendOtp: async (email) => {
//     try {
//       const response = await api.post('/companies/resend-otp', { email });
//       return response.data;
//     } catch (error) {
//       console.error('Resend OTP error:', error);
//       throw error;
//     }
//   },
  
//   // Request password reset
//   forgotPassword: async (data) => {
//     try {
//       const response = await api.post('/companies/forgot-password', data);
//       return response.data;
//     } catch (error) {
//       console.error('Forgot password error:', error);
//       throw error;
//     }
//   },
  
//   // Verify reset token
//   verifyResetToken: async (data) => {
//     try {
//       const response = await api.post('/companies/verify-reset-token', data);
//       return response.data;
//     } catch (error) {
//       console.error('Verify reset token error:', error);
//       throw error;
//     }
//   },
  
//   // Reset password
//   resetPassword: async (data) => {
//     try {
//       console.log('Auth service: Sending reset password request with:', {
//         token: data.token,
//         email: data.email,
//         companyCode: data.companyCode,
//         passwordProvided: !!data.password
//       });
      
//       const response = await api.post('/companies/reset-password', {
//         token: data.token,
//         email: data.email,
//         companyCode: data.companyCode,
//         password: data.password
//       });
      
//       console.log('Auth service: Reset password response received:', {
//         success: response.data.success
//       });
      
//       return response.data;
//     } catch (error) {
//       console.error('Reset password error in auth service:', error);
//       throw error;
//     }
//   },
  
//   // Change password (for authenticated users)
//   changePassword: async (data) => {
//     try {
//       const response = await api.post('/companies/change-password', data);
//       return response.data;
//     } catch (error) {
//       console.error('Change password error:', error);
//       throw error;
//     }
//   }
// };

// export default authService;

import api from '../../api/axiosInstance';

const authService = {
  // Register a new company
  registerCompany: async (formData) => {
    try {
      console.log('=== AUTH SERVICE DEBUG ===');
      
      // Check if formData is an instance of FormData
      const isFormData = formData instanceof FormData;
      console.log('Is FormData:', isFormData);
      
      // Log form data contents for debugging
      if (isFormData) {
        console.log('FormData contents:');
        for (let pair of formData.entries()) {
          if (pair[0] === 'logo') {
            console.log(pair[0], 'File:', pair[1].name, 'Size:', pair[1].size, 'Type:', pair[1].type);
          } else {
            console.log(pair[0], pair[1]);
            // Try to parse JSON fields
            if (pair[0] === 'company' || pair[0] === 'admin') {
              try {
                const parsed = JSON.parse(pair[1]);
                console.log(`${pair[0]} parsed:`, parsed);
              } catch (e) {
                console.error(`Error parsing ${pair[0]}:`, e);
              }
            }
          }
        }
        
        const response = await api.post('companies/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Registration response:', response.data);
        return response;
      } else {
        // Handle regular JSON data
        const response = await api.post('companies/register', formData);
        return response;
      }
    } catch (error) {
      console.error('Registration error details:', error.response?.data || error.message);
      console.error('Full error object:', error);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('Auth service: Making login request with:', {
        companyCode: credentials.companyCode.toUpperCase(),
        email: credentials.email.toLowerCase(),
        passwordProvided: !!credentials.password
      });
      
      // Trim the password to remove any accidental whitespace
      const trimmedPassword = credentials.password.trim();
      
      const response = await api.post('companies/login', {
        companyCode: credentials.companyCode.toUpperCase(),
        email: credentials.email.toLowerCase(),
        password: trimmedPassword
      });
      
      // If login is successful, store token and user info
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('companyCode', response.data.user.companyCode);
        localStorage.setItem('userId', response.data.user.id);
        
        console.log('Login successful, token stored');
        return response.data;
      } else {
        console.log('Login failed with response:', response.data);
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.log('Login error in auth service:', error);
      
      // Provide more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        // Return the error message from the server if available
        throw new Error(error.response.data.message || 'Authentication failed');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        throw error;
      }
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('companyCode');
  },
  
  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // Verify OTP
  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post('companies/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },
  
  // Resend OTP
  resendOtp: async (email) => {
    try {
      const response = await api.post('companies/resend-otp', { email });
      return response.data;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  },
  
  // Request password reset
  forgotPassword: async (data) => {
    try {
      const response = await api.post('companies/forgot-password', data);
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },
  
  // Verify reset token
  verifyResetToken: async (data) => {
    try {
      const response = await api.post('companies/verify-reset-token', data);
      return response.data;
    } catch (error) {
      console.error('Verify reset token error:', error);
      throw error;
    }
  },
  
  // Reset password
  resetPassword: async (data) => {
    try {
      console.log('Auth service: Sending reset password request with:', {
        token: data.token,
        email: data.email,
        companyCode: data.companyCode,
        passwordProvided: !!data.password
      });
      
      const response = await api.post('companies/reset-password', {
        token: data.token,
        email: data.email,
        companyCode: data.companyCode,
        password: data.password
      });
      
      console.log('Auth service: Reset password response received:', {
        success: response.data.success
      });
      
      return response.data;
    } catch (error) {
      console.error('Reset password error in auth service:', error);
      throw error;
    }
  },
  
  // Change password (for authenticated users)
  changePassword: async (data) => {
    try {
      const response = await api.post('companies/change-password', data);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
};

export default authService;
