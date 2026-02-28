import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        // Only works in the browser
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('userInfo');
            if (storedUser) {
                const { token } = JSON.parse(storedUser);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
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
            // Backend validation or known error
            errorMessage = error.response.data.message || error.response.data.error || 'Server Error';

            // Specifically inform about unauthorized attempts
            if (error.response.status === 401) {
                // Handle token expiration/unauthorized - maybe call logout logic or clear storage
                if (typeof window !== 'undefined') {
                    // localStorage.removeItem('userInfo');
                    // window.location.href = '/login'; 
                }
            }
        } else if (error.request) {
            // Network error (backend down)
            errorMessage = 'Unable to connect to the server. Please check your connection.';
        }

        // Show toast for error
        if (typeof window !== 'undefined') {
            toast.error(errorMessage);
        }

        return Promise.reject(error);
    }
);

export default api;
