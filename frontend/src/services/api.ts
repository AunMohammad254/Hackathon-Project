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
        if (typeof window !== 'undefined') {
            try {
                const storedUser = localStorage.getItem('userInfo');
                if (storedUser) {
                    const { token } = JSON.parse(storedUser);
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
            } catch {
                // UX-04: Safe JSON.parse — corrupted storage won't crash the app
                localStorage.removeItem('userInfo');
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

            // BUG-08: Handle token expiration — auto-logout on 401
            if (error.response.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('userInfo');
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
