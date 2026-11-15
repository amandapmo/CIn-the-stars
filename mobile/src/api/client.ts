import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://172.22.36.53:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;