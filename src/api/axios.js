import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // ruta del backend
    withCredentials: true, // Incluir cookies en las solicitudes
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;