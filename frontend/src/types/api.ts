// API Response Types
export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    agency_id: string | null;
    company_id?: string | null;
    candidate_id?: string | null;
    avatar_url?: string | null;
    profile_photo?: string | null;
    agency_name?: string | null;
    managed_clients_count?: number;
    is_active: boolean;
    is_verified: boolean;
    mfa_enabled?: boolean;
    created_at: string;
    updated_at: string;
}

export type UserRole = 'super_admin' | 'agency_admin' | 'recruiter' | 'candidate' | 'client' | 'viewer';

export interface Agency {
    id: string;
    name: string;
    subscription_tier: SubscriptionTier;
    is_active: boolean;
    created_at: string;
}

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface Job {
    id: string;
    agency_id: string;
    client_company_id: string | null;
    title: string;
    reference: string;
    description: string;
    requirements: string[] | string | null;
    responsibilities: string[] | string | null;
    qualifications: string[] | string | null;
    benefits: string[] | string | null;
    location: string;
    city: string | null;
    province: string | null;
    country: string | null;
    is_remote: boolean;
    remote_type: string | null;
    employment_type: EmploymentType;
    experience_level: ExperienceLevel;
    years_of_experience_min: number | null;
    years_of_experience_max: number | null;
    education_level: string | null;
    skills: string[];
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    salary_period: string | null;
    status: JobStatus;
    applications_count: number;
    views_count: number;
    created_at: string;
    updated_at: string;
    expires_at: string | null;
    closing_date: string | null;
    published_at: string | null;
}

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship' | 'freelance';
export type ExperienceLevel = 'entry_level' | 'mid_level' | 'senior_level' | 'executive';
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'filled' | 'expired';

export interface Candidate {
    id: string;
    agency_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    city: string | null;
    province: string | null;
    current_job_title: string | null;
    current_company: string | null;
    years_of_experience: number;
    skills: string[];
    education_level: string | null;
    expected_salary_min: number | null;
    expected_salary_max: number | null;
    status: CandidateStatus;
    resume_filename: string | null;
    resume_url: string | null;
    linkedin_url: string | null;
    summary: string | null;
    work_history: Array<{ id: string; title: string; company: string; timeline: string; description: string }> | null;
    education_details: Array<{ id: string; degree: string; institution: string; year: string }> | null;
    certificate_files: Array<{ id: string; name: string; issuer?: string; date?: string; file_url?: string; file_name?: string; category?: string }> | null;
    profile_photo: string | null;
    applications_count: number;
    interviews_count: number;
    placements_count: number;
    created_at: string;
    updated_at: string;
}

export type CandidateStatus = 'active' | 'passive' | 'placed' | 'not_interested' | 'blacklisted';

export interface Application {
    id: string;
    agency_id: string;
    job_id: string;
    candidate_id: string;
    status: ApplicationStatus;
    source: ApplicationSource;
    cover_letter: string | null;
    screening_score: number | null;
    screening_notes: string | null;
    interview_scheduled_at: string | null;
    interview_rating: number | null;
    offer_amount: number | null;
    match_score: number | null;
    candidate_name?: string;
    candidate_photo?: string | null;
    job_title?: string;
    created_at: string;
    updated_at: string;
}

export type ApplicationStatus =
    | 'applied'
    | 'screening'
    | 'shortlisted'
    | 'interview_scheduled'
    | 'interviewed'
    | 'offer_pending'
    | 'offer_made'
    | 'offer_accepted'
    | 'hired'
    | 'rejected'
    | 'withdrawn';

export type ApplicationSource = 'direct_apply' | 'recruiter_added' | 'referral' | 'headhunted' | 'imported';

export interface ClientCompany {
    id: string;
    agency_id: string;
    user_id?: string | null;
    name: string;
    logo_url?: string | null;
    industry: string | null;
    website: string | null;
    contact_person: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
    jobs_count: number;
    created_at: string;
}

// Dashboard Analytics
export interface DashboardMetrics {
    period_days: number;
    total_jobs: number;
    active_jobs: number;
    total_candidates: number;
    active_candidates: number;
    applications_this_period: number;
    placements: number;
    total_clients: number;
    avg_time_to_hire_days: number;
    success_rate_percentage: number;
}

export interface ApplicationPipeline {
    job_id: string;
    job_title: string;
    total_applications: number;
    stages: ApplicationPipelineStage[];
}

export interface ApplicationPipelineStage {
    status: ApplicationStatus;
    count: number;
    applications: ApplicationBrief[];
}

export interface ApplicationBrief {
    id: string;
    job_id: string;
    candidate_id: string;
    candidate_name: string;
    job_title?: string;
    status: ApplicationStatus;
    match_score: number | null;
    created_at: string;
}

// Auth Types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    tokens?: {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    } | null;
    user?: User | null;
    mfa_required?: boolean;
    mfa_token?: string | null;
}

export interface RegisterRequest {
    agency: {
        name: string;
        email: string;
    };
    user: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
    };
}

export interface RegisterResponse {
    message: string;
    agency_id?: string;
    user_id: string;
    tokens: {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    };
}

export interface CandidateRegisterRequest {
    user: any; // UserCreate
    candidate: any; // CandidateCreate
}

export interface CompanyRegisterRequest {
    user: any; // UserCreate
    company: any; // ClientCompanyCreate
}

// Pagination
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    skip: number;
    limit: number;
    has_more: boolean;
}

// API Error
export interface APIError {
    detail: string;
}
