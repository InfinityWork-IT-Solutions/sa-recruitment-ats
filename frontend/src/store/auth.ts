import { create } from 'zustand';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '@/types/api';
import apiClient from '@/lib/api-client';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,

    login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
            // Force Vite rebuild: using standard JSON format for FastAPI LoginRequest schema
            const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
            const { tokens, user } = response.data;

            // Store tokens
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);

            set({
                user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
            await apiClient.post('/auth/register', data);
            
            // Registration doesn't return tokens, so we automatically log in
            const credentials: LoginRequest = {
                email: data.user.email,
                password: data.user.password,
            };
            
            // Making JSON login request
            const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
            const { tokens, user } = response.data;

            // Store tokens
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);

            set({
                user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: () => {
        // Clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        set({
            user: null,
            isAuthenticated: false,
        });
    },

    refreshUser: async () => {
        try {
            const response = await apiClient.get<User>('/auth/me');
            set({ user: response.data });
        } catch (error) {
            // If getting user fails, logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({
                user: null,
                isAuthenticated: false,
            });
        }
    },
}));
