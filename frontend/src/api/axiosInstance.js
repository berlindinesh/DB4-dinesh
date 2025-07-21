// import axios from 'axios';
// import { store } from '../redux/store';

// const api = axios.create({
//   baseURL: `${process.env.REACT_APP_API_URL}/api`,
//   timeout: 30000, // Increase timeout for payslip operations
// });

// api.interceptors.request.use((config) => {
//   // Try to get from Redux first
//   const state = store.getState();
//   let token = state.auth?.token;
//   let companyCode = state.auth?.companyCode;
  
//   // Fallback to localStorage if not in Redux
//   if (!token) token = localStorage.getItem('token');
//   if (!companyCode) companyCode = localStorage.getItem('companyCode');
  
//   // Add headers if values exist
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//     console.log("Adding token to request:", token.substring(0, 20) + "...");
//   } else {
//     console.warn("No authentication token found");
//   }
  
//   if (companyCode) {
//     // IMPORTANT: Use consistent header case (your backend expects 'x-company-code')
//     config.headers['x-company-code'] = companyCode;
//     console.log("Adding company code to request:", companyCode);
//   } else {
//     console.warn("No company code found");
//   }

//   // Log the full request for debugging payslip issues
//   console.log("API Request:", {
//     method: config.method,
//     url: config.url,
//     headers: {
//       Authorization: config.headers.Authorization ? 'Bearer ***' : 'Not set',
//       'x-company-code': config.headers['x-company-code'] || 'Not set'
//     }
//   });

//   return config;
// }, (error) => {
//   console.error("Request interceptor error:", error);
//   return Promise.reject(error);
// });

// // Enhanced response interceptor for better error handling
// api.interceptors.response.use(
//   (response) => {
//     // Log successful responses for payslip debugging
//     if (response.config.url.includes('payslip') || response.config.url.includes('payroll')) {
//       console.log("Payroll API Response:", {
//         url: response.config.url,
//         status: response.status,
//         dataKeys: Object.keys(response.data || {})
//       });
//     }
//     return response;
//   },
//   async (error) => {
//     const originalRequest = error.config;
    
//     console.error("API Error:", {
//       url: originalRequest?.url,
//       status: error.response?.status,
//       message: error.response?.data?.message,
//       headers: originalRequest?.headers
//     });
    
//     // If the error is 401 and it's not a retry
//     if (error.response && error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
      
//       // Check if it's a payroll-related request
//       const isPayrollRequest = originalRequest.url?.includes('payroll') || originalRequest.url?.includes('payslip');
      
//       if (isPayrollRequest) {
//         console.log("Payroll request failed with 401, checking authentication...");
        
//         // Verify we have both token and company code
//         const token = localStorage.getItem('token');
//         const companyCode = localStorage.getItem('companyCode');
        
//         if (!token || !companyCode) {
//           console.log("Missing authentication credentials for payroll request");
//           // Clear all auth data and redirect
//           localStorage.removeItem('token');
//           localStorage.removeItem('refreshToken');
//           localStorage.removeItem('companyCode');
          
//           if (store.dispatch) {
//             store.dispatch({ type: 'auth/logout' });
//           }
          
//           window.location.href = '/login';
//           return Promise.reject(error);
//         }
//       }
      
//       // Try to refresh the token
//       const refreshed = await refreshToken();
      
//       if (refreshed) {
//         // Update the authorization header
//         const newToken = localStorage.getItem('token');
//         originalRequest.headers.Authorization = `Bearer ${newToken}`;
//         console.log("Retrying request with new token");
//         return api(originalRequest);
//       } else {
//         // If refresh failed, redirect to login
//         console.log("Token refresh failed, redirecting to login");
//         localStorage.removeItem('token');
//         localStorage.removeItem('refreshToken');
//         localStorage.removeItem('companyCode');
        
//         // Clear Redux state if available
//         if (store.dispatch) {
//           store.dispatch({ type: 'auth/logout' });
//         }
        
//         window.location.href = '/login';
//       }
//     }
    
//     // Handle specific payslip errors
//     if (originalRequest?.url?.includes('payslip') || originalRequest?.url?.includes('payroll')) {
//       console.error("Payroll API Error Details:", {
//         status: error.response?.status,
//         data: error.response?.data,
//         headers: error.response?.headers,
//         url: originalRequest.url
//       });
      
//       // Don't redirect to login for payroll-specific errors like 403, 404
//       if (error.response?.status === 403) {
//         console.log("Access denied for payroll request - user may not be linked to employee");
//       } else if (error.response?.status === 404) {
//         console.log("Payroll resource not found");
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

// // Add this function to refresh the token
// const refreshToken = async () => {
//   try {
//     const refreshToken = localStorage.getItem('refreshToken');
//     if (!refreshToken) {
//       console.log("No refresh token available");
//       return false;
//     }
    
//     console.log("Attempting to refresh token...");
//     const response = await axios.post('${process.env.REACT_APP_API_URL}/api/auth/refresh-token', {
//       refreshToken
//     });
    
//     if (response.data && response.data.token) {
//       localStorage.setItem('token', response.data.token);
//       console.log("Token refreshed successfully");
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('Error refreshing token:', error);
//     return false;
//   }
// };

// // Add this utility function for retrying requests
// export const retryRequest = async (apiCall, maxRetries = 3) => {
//   let retries = 0;
  
//   while (retries < maxRetries) {
//     try {
//       return await apiCall();
//     } catch (error) {
//       retries++;
//       console.log(`Request failed, retry ${retries}/${maxRetries}`, error.message);
      
//       if (error.response && error.response.status === 401 && retries === maxRetries) {
//         // If we've reached max retries and still getting 401, redirect to login
//         localStorage.removeItem('token');
//         localStorage.removeItem('companyCode');
//         window.location.href = '/login';
//       }
      
//       if (retries === maxRetries) throw error;
      
//       // Wait before retrying (exponential backoff)
//       await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
//     }
//   }
// };

// export default api;


import axios from 'axios';
import { store } from '../redux/store';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
  timeout: 30000, // Increase timeout for payslip operations
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  // Try to get from Redux first
  const state = store.getState();
  let token = state.auth?.token;
  let companyCode = state.auth?.companyCode;
  
  // Fallback to localStorage if not in Redux
  if (!token) token = localStorage.getItem('token');
  if (!companyCode) companyCode = localStorage.getItem('companyCode');
  
  // Add headers if values exist
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Adding token to request:", token.substring(0, 20) + "...");
  } else {
    console.warn("No authentication token found");
  }
  
  if (companyCode) {
    // IMPORTANT: Use consistent header case (your backend expects 'x-company-code')
    config.headers['x-company-code'] = companyCode;
    config.headers['X-Company-Code'] = companyCode; // Add both for compatibility
    console.log("Adding company code to request:", companyCode);
  } else {
    console.warn("No company code found");
  }

  // Log the full request for debugging payslip issues
  console.log("API Request:", {
    method: config.method,
    url: config.url,
    headers: {
      Authorization: config.headers.Authorization ? 'Bearer ***' : 'Not set',
      'x-company-code': config.headers['x-company-code'] || 'Not set'
    }
  });

  return config;
}, (error) => {
  console.error("Request interceptor error:", error);
  return Promise.reject(error);
});

// Enhanced response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses for payslip debugging
    if (response.config.url.includes('payslip') || response.config.url.includes('payroll')) {
      console.log("Payroll API Response:", {
        url: response.config.url,
        status: response.status,
        dataKeys: Object.keys(response.data || {})
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error("API Error:", {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
      headers: originalRequest?.headers
    });
    
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login if token is invalid
      if (error.response.data?.message === 'Invalid token' || !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Check if it's a payroll-related request
        const isPayrollRequest = originalRequest.url?.includes('payroll') || originalRequest.url?.includes('payslip');
        
        if (isPayrollRequest) {
          console.log("Payroll request failed with 401, checking authentication...");
          
          // Verify we have both token and company code
          const token = localStorage.getItem('token');
          const companyCode = localStorage.getItem('companyCode');
          
          if (!token || !companyCode) {
            console.log("Missing authentication credentials for payroll request");
            // Clear all auth data and redirect
            localStorage.clear();
            
            if (store.dispatch) {
              store.dispatch({ type: 'auth/logout' });
            }
            
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        
        // Try to refresh the token
        const refreshed = await refreshToken();
        
        if (refreshed) {
          // Update the authorization header
          const newToken = localStorage.getItem('token');
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          console.log("Retrying request with new token");
          return api(originalRequest);
        } else {
          // If refresh failed, redirect to login
          console.log("Token refresh failed, redirecting to login");
          localStorage.clear();
          
          // Clear Redux state if available
          if (store.dispatch) {
            store.dispatch({ type: 'auth/logout' });
          }
          
          window.location.href = '/login';
        }
      }
    }
    
    // Handle specific payslip errors
    if (originalRequest?.url?.includes('payslip') || originalRequest?.url?.includes('payroll')) {
      console.error("Payroll API Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        url: originalRequest.url
      });
      
      // Don't redirect to login for payroll-specific errors like 403, 404
      if (error.response?.status === 403) {
        console.log("Access denied for payroll request - user may not be linked to employee");
      } else if (error.response?.status === 404) {
        console.log("Payroll resource not found");
      }
    }
    
    return Promise.reject(error);
  }
);

// Add this function to refresh the token
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log("No refresh token available");
      return false;
    }
    
    console.log("Attempting to refresh token...");
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/refresh-token`, {
      refreshToken
    });
    
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      console.log("Token refreshed successfully");
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Add this utility function for retrying requests
export const retryRequest = async (apiCall, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      retries++;
      console.log(`Request failed, retry ${retries}/${maxRetries}`, error.message);
      
      if (error.response && error.response.status === 401 && retries === maxRetries) {
        // If we've reached max retries and still getting 401, redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
      
      if (retries === maxRetries) throw error;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
};

// Add this helper function at the end of your axiosInstance.js file, before the export
// export const getAssetUrl = (path) => {
//   if (!path) return null;
//   if (path.startsWith('http')) return path;
//   return `${process.env.REACT_APP_API_URL}${path}`;
// };
export const getAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Remove any leading slash to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Construct the full URL
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002';
  return `${baseUrl}/${cleanPath}`;
};



export default api;
