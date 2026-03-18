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
            const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
            const { access_token, refresh_token, user } = response.data;

            // Store tokens
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

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
            const response = await apiClient.post<LoginResponse>('/auth/register', data);
            const { access_token, refresh_token, user } = response.data;

            // Store tokens
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

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
