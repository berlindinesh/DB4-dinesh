// // import axios from 'axios';
// import api from '../api/axiosInstance';
// // const BASE_URL = 'http://localhost:5002/api/contracts';

// export const getContractsByEmployeeId = async (userId) => {
//   const response = await api.get(`contracts/employee/${userId}`);
//   return response.data.data
// };

// export const createContract = async (contractData) => {
//   const response = await api.post('contracts/', contractData);
//   return response.data.data;
// };

// export const updateContract = async (contractId, contractData) => {
//   const response = await api.put(`contracts/${contractId}`, contractData);
//   return response.data.data;
// };

// export const deleteContract = async (contractId) => {
//   await api.delete(`contracts/${contractId}`);
// };

import api from '../api/axiosInstance';

export const getContractsByEmployeeId = async (employeeId) => {
  const response = await api.get(`contracts/employee/${employeeId}`);
  return response.data.data || response.data;
};

export const createContract = async (contractData) => {
  const response = await api.post('contracts', contractData);
  return response.data.data || response.data;
};

export const updateContract = async (contractId, contractData) => {
  const response = await api.put(`contracts/${contractId}`, contractData);
  return response.data.data || response.data;
};

export const deleteContract = async (contractId) => {
  await api.delete(`contracts/${contractId}`);
};
