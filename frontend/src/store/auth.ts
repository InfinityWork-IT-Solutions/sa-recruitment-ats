import { create } from 'zustand';
import { User, LoginResponse } from '../types/api';
import apiClient from '@/lib/api-client';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, expectedType?: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    registerCandidate: (data: any) => Promise<void>;
    registerCompany: (data: any) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,

    login: async (email: string, password: string, expectedType?: string) => {
        set({ isLoading: true });
        try {
            const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
            const { tokens, user, mfa_required, mfa_token } = response.data;

            // MFA challenge — caller must show the TOTP input step
            if (mfa_required) {
                set({ isLoading: false });
                const err: any = new Error('mfa_required');
                err.mfa_required = true;
                err.mfa_token = mfa_token;
                throw err;
            }

            if (!tokens || !user) throw new Error('Unexpected login response');

            if (expectedType) {
                const userRole = user.role;
                let isValid = false;
                if (userRole === 'super_admin') {
                    isValid = true;
                } else if (expectedType === 'candidate' && userRole === 'candidate') {
                    isValid = true;
                } else if (expectedType === 'company' && userRole === 'client') {
                    isValid = true;
                }

                if (!isValid) {
                    throw new Error(`Invalid login type. Your account is not registered as a ${expectedType}.`);
                }
            }

            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
            set({ user, isAuthenticated: true, isLoading: false });

            // Role-based redirection
            if (user.role === 'super_admin') window.location.href = '/admin/dashboard';
            else if (user.role === 'candidate') window.location.href = '/candidate-dashboard';
            else window.location.href = '/company/dashboard';
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (data: any) => {
        const { role, ...rest } = data;
        if (role === 'candidate') {
            await useAuthStore.getState().registerCandidate(rest);
        } else if (role === 'company') {
            await useAuthStore.getState().registerCompany(rest);
        }
    },

    registerCandidate: async (data: any) => {
        set({ isLoading: true });
        try {
            const payload = {
                user: {
                    email: data.email,
                    password: data.password,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    phone: data.phone,
                    role: 'candidate'
                },
                candidate: {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    phone: data.phone,
                    city: data.city,
                    province: data.province,
                    country: data.country,
                    current_job_title: data.current_job_title,
                    years_of_experience: typeof data.years_of_experience === 'string' 
                        ? parseInt(data.years_of_experience.split(/[-+]/)[0], 10) || 0 
                        : (data.years_of_experience || 0),
                    consent_to_contact: !!data.consent_to_contact
                }
            };
            const response = await apiClient.post<LoginResponse>('/auth/register/candidate', payload);
            const { tokens, user } = response.data;
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
            set({ user, isAuthenticated: true, isLoading: false });
            window.location.href = '/candidate-dashboard';
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    registerCompany: async (data: any) => {
        set({ isLoading: true });
        try {
            const payload = {
                user: {
                    email: data.email,
                    password: data.password,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    phone: data.phone,
                    role: 'client'
                },
                company: {
                    name: data.company_name,
                    industry: data.company_industry,
                    website: data.company_website,
                    city: data.city,
                    province: data.province,
                    country: data.country,
                    subscription_plan: data.subscription_plan
                }
            };
            const response = await apiClient.post<LoginResponse>('/auth/register/company', payload);
            const { tokens, user } = response.data;
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
            set({ user, isAuthenticated: true, isLoading: false });
            window.location.href = '/client-dashboard';
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
        window.location.href = '/';
    },

    refreshUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ isLoading: false });
            return;
        }
        
        set({ isLoading: true });
        try {
            const response = await apiClient.get<User>('/auth/me');
            set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
