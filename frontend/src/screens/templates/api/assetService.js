import api from '../../../api/axiosInstance';


// const API_URL = `${process.env.REACT_APP_API_URL}`;

export const assetService = {
  // fetchAssets: () => axios.get(`${API_URL}/api/assets`),
  // addAsset: (asset) => axios.post(`${API_URL}/api/assets`, asset),
  // updateAsset: (id, asset) => axios.put(`${API_URL}/api/assets/${id}`, asset),
  // deleteAsset: (id) => axios.delete(`${API_URL}/api/assets/${id}`),
  // searchAssets: (query) => axios.get(`${API_URL}/api/assets/search?q=${query}`),
  // getAssetHistory: () => axios.get(`${API_URL}/api/assets/history`),
  // getAssetBatches: () => axios.get(`${API_URL}/api/assets/batches`),
  fetchAssets: () => api.get('assets'),
  addAsset: (asset) => api.post('assets', asset),
  updateAsset: (id, asset) => api.put(`assets/${id}`, asset),
  deleteAsset: (id) => api.delete(`assets/${id}`),
  searchAssets: (query) => api.get(`assets/search?q=${query}`),
  getAssetHistory: () => api.get('assets/history'),
  getAssetBatches: () => api.get('assets/batches'),
};
