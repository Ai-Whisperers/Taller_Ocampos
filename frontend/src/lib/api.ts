import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success: boolean; message?: string; errors?: Array<{ field?: string; message: string }> }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
    } else if (error.response?.status === 400) {
      // Handle validation errors from backend
      const data = error.response.data;
      if (data?.errors && data.errors.length > 0) {
        // Show first validation error
        const firstError = data.errors[0];
        const fieldName = firstError.field ? `${firstError.field}: ` : '';
        toast.error(`${fieldName}${firstError.message}`);
      } else if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error('Error de validación. Verifique los datos ingresados.');
      }
    } else if (error.response?.status === 403) {
      toast.error('No tiene permisos para realizar esta acción.');
    } else if (error.response?.status === 404) {
      toast.error('Recurso no encontrado.');
    } else if (error.response?.status === 409) {
      // Handle conflict errors (duplicate entries)
      const data = error.response.data;
      toast.error(data?.message || 'El registro ya existe.');
    } else if (error.response?.status === 500) {
      toast.error('Error del servidor. Por favor intente nuevamente.');
    } else if (!error.response) {
      // Network error
      toast.error('Error de conexión. Verifique su conexión a internet.');
    }
    return Promise.reject(error);
  }
);

export default api;