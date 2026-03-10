import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://ai-clinic-backend.onrender.com/api/v1',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            // SEC-05 FIX: Read token directly (no JSON parsing needed)
            const token = localStorage.getItem('clinicToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.response) {
            errorMessage = error.response.data.message || error.response.data.error || 'Server Error';

            // Handle token expiration — auto-logout on 401
            if (error.response.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('clinicToken');
                    window.location.href = '/login';
                }
            }
        } else if (error.request) {
            errorMessage = 'Unable to connect to the server. Please check your connection.';
        }

        if (typeof window !== 'undefined') {
            toast.error(errorMessage);
        }

        return Promise.reject(error);
    }
);

export default api;
