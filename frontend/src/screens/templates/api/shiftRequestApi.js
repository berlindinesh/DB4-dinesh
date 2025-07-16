// import axios from 'axios';

// const API_URL = '${process.env.REACT_APP_API_URL}/api/shift-requests';

// export const fetchShiftRequests = () => axios.get(API_URL);
// export const createShiftRequest = (data) => {
//     console.log('Sending data:', data);
//     return axios.post(API_URL, data);
//   };
// export const updateShiftRequest = (id, data) => axios.put(`${API_URL}/${id}`, data);
// export const deleteShiftRequest = (id) => axios.delete(`${API_URL}/${id}`);
// export const approveShiftRequest = (id) => axios.put(`${API_URL}/${id}/approve`);
// export const rejectShiftRequest = (id) => axios.put(`${API_URL}/${id}/reject`);


import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/shift-requests`;

export const fetchShiftRequests = () => axios.get(API_URL);

export const createShiftRequest = (data) => {
    const formattedData = {
        ...data,
        requestedDate: new Date(data.requestedDate).toISOString(),
        requestedTill: new Date(data.requestedTill).toISOString()
    };
    return axios.post(API_URL, formattedData);
};

export const updateShiftRequest = (id, data) => {
    const formattedData = {
        ...data,
        requestedDate: new Date(data.requestedDate).toISOString(),
        requestedTill: new Date(data.requestedTill).toISOString()
    };
    return axios.put(`${API_URL}/${id}`, formattedData);
};

export const deleteShiftRequest = (id) => axios.delete(`${API_URL}/${id}`);
export const approveShiftRequest = (id) => axios.put(`${API_URL}/${id}/approve`);
export const rejectShiftRequest = (id) => axios.put(`${API_URL}/${id}/reject`);
