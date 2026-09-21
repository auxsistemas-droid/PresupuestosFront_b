import axios from 'axios';

// Si existe VITE_API_URL en el .env la usa; si no, recurre a localhost
const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:3000/api';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Incluir cookies en las solicitudes
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;