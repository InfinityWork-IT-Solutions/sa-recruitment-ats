import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, CheckCircle, Edit, Download, Mail, MapPin, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { ImageCropperModal } from '@/components/common/ImageCropperModal';

// ── Sub-components ────────────────────────────────────────────────────────────

function ApplicationsTabContent() {
    const [apps, setApps] = useState<any[]>([]);
    useEffect(() => {
        apiClient.get('/candidate-portal/my-applications').then(r => setApps(r.data)).catch(() => {});
    }, []);
    const statusLabel: Record<string, string> = {
        applied: 'Applied', screening: 'Under Review', shortlisted: 'Shortlisted',
        interview_scheduled: 'Interview', offer_made: 'Offer Received', hired: 'Hired',
        rejected: 'Not Selected', withdrawn: 'Withdrawn',
    };
    const statusColor: Record<string, string> = {
        applied: 'badge-blue', screening: 'badge-yellow', shortlisted: 'badge-blue',
        interview_scheduled: 'badge-blue', offer_made: 'badge-green', hired: 'badge-green',
        rejected: 'badge-gray', withdrawn: 'badge-gray',
    };
    if (!apps.length) return (
        <div className="text-center py-10 text-gray-400 text-sm">
            No applications yet. <a href="/candidate/jobs" className="text-blue-600 hover:underline">Browse jobs</a>
        </div>
    );
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Recent Applications</h3>
            {apps.slice(0, 8).map((app: any) => (
                <a key={app.id} href={`/candidate/applications/${app.id}`}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all">
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">{app.job_title || 'Job'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{app.job_location || ''}</p>
                    </div>
                    <span className={`badge ${statusColor[app.status] || 'badge-gray'} text-xs`}>
                        {statusLabel[app.status] || app.status}
                    </span>
                </a>
            ))}
            {apps.length > 8 && (
                <a href="/candidate/applications" className="block text-center text-sm text-blue-600 hover:underline pt-1">
                    View all {apps.length} applications →
                </a>
            )}
        </div>
    );
}

function MatchesTabContent() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        apiClient.get('/jobs/?status=active&limit=6').then(async r => {
            const jobList = r.data?.jobs || [];
            setJobs(jobList);
            const results: Record<string, number> = {};
            await Promise.allSettled(jobList.map(async (job: any) => {
                try {
                    const res = await apiClient.get(`/candidate-portal/match-score/${job.id}`);
                    if (res.data?.score != null) results[job.id] = res.data.score;
                } catch {}
            }));
            setScores(results);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);
    if (loading) return <div className="flex justify-center py-8"><div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
    const sorted = [...jobs].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900">AI Job Matches</h3>
                <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded font-bold tracking-wider">AI POWERED</span>
            </div>
            {sorted.map(job => {
                const score = scores[job.id] ?? null;
                return (
                    <a key={job.id} href={`/jobs/${job.id}`}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all">
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{job.location}</p>
                        </div>
                        {score != null ? (
                            <div className="text-right">
                                <p className={`text-xl font-bold ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{score}%</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Match</p>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-300">—</span>
                        )}
                    </a>
                );
            })}
        </div>
    );
}

function CVUploadPanel({ onUploaded }: { onUploaded: () => void }) {
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState<{ filename: string; skills?: string[] } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setUploading(true);
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await apiClient.post('/candidate-portal/upload-cv', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploaded({ filename: file.name, skills: [] });
            toast.success('CV uploaded successfully!');
            onUploaded();
        } catch {
            toast.error('CV upload failed — try again');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <label className="block w-full cursor-pointer">
                <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFile(file);
                    }}
                    onClick={() => inputRef.current?.click()}
                >
                    <FileText className={`w-10 h-10 mb-3 ${uploading ? 'text-blue-400 animate-pulse' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-900">{uploading ? 'Uploading & parsing…' : 'Drag & Drop Resume Here'}</p>
                    <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                    <p className="text-xs text-gray-400 mt-2">PDF, DOC, DOCX · Max 10 MB</p>
                </div>
                <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
            {uploaded && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-green-800 text-sm">Parsing Complete!</span>
                    </div>
                    <p className="text-xs text-green-700">{uploaded.filename} uploaded successfully.</p>
                    <p className="text-xs text-green-600 mt-1">
                        Your CV is stored and ready for recruiters to download. Add your skills and experience via <strong>Edit Profile</strong> to improve your match scores.
                    </p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CandidateProfilePage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('Overview');
    const [uploadSla, setUploadSla] = useState(false);
    
    // Persistent Profile State
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || (user ? localStorage.getItem(`user_avatar_${user.id}`) : null));
    const [profileData, setProfileData] = useState(() => {
        const saved = localStorage.getItem('candidate_profile');
        return saved ? JSON.parse(saved) : {
            experience: '3-5 years',
            qualification: 'BSc Computer Science',
            company: 'TechCorp South Africa',
            noticePeriod: '30 days',
            skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Python', 'AWS', 'Docker'],
            summary: '',
            title: 'Software Developer',
            workHistory: [
               { id: '1', title: 'Software Developer', company: 'TechCorp South Africa', timeline: 'Jan 2022 - Present', description: '• Developed fully responsive React applications.\n• Engineered high-performance backend APIs.' },
               { id: '2', title: 'Junior Frontend Engineer', company: 'StartApp Solutions', timeline: 'Mar 2020 - Dec 2021', description: '• Assisted in refactoring legacy codebase to modern React.' }
            ],
            educationHistory: [
               { id: '1', degree: 'BSc Computer Science', institution: 'University of Cape Town', year: '2016 - 2019' }
            ],
            certifications: []
        };
    });
    
    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editTab, setEditTab] = useState('Basic Info');
    const [editForm, setEditForm] = useState(profileData);

    // Completeness from backend (single source of truth shared with dashboard)
    const [completionScore, setCompletionScore] = useState(0);
    const [missingItems, setMissingItems] = useState<string[]>([]);

    // Real candidate data from backend
    const [candidateData, setCandidateData] = useState<any>(null);
    const [realStats, setRealStats] = useState({ applied: 0, interviews: 0, saved: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    // Cropper State
    const [cropperModalOpen, setCropperModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

    const fetchCompleteness = useCallback(async () => {
        try {
            const res = await apiClient.get('/candidate-portal/profile-completeness');
            setCompletionScore(res.data.score ?? 0);
            setMissingItems(res.data.missing ?? []);
        } catch {
            // fallback: stay at 0
        }
    }, []);

    // On mount: load real candidate data + stats, sync localStorage, fetch completeness
    useEffect(() => {
        const syncAndFetch = async () => {
            // Load real candidate profile from backend
            try {
                const profileRes = await apiClient.get('/candidate-portal/profile');
                setCandidateData(profileRes.data);
            } catch { /* non-blocking */ }

            // Load real stats
            try {
                const [appsRes, savedRes] = await Promise.allSettled([
                    apiClient.get('/candidate-portal/my-applications'),
                    apiClient.get('/candidate-portal/saved-jobs/ids'),
                ]);
                const apps = appsRes.status === 'fulfilled' ? appsRes.value.data : [];
                const savedIds = savedRes.status === 'fulfilled' ? savedRes.value.data : [];
                const interviews = apps.filter((a: any) =>
                    ['interview_scheduled', 'interviewed'].includes(a.status)
                ).length;
                setRealStats({ applied: apps.length, interviews, saved: savedIds.length });
            } catch { /* non-blocking */ }

            // Sync localStorage profile to backend once
            const saved = localStorage.getItem('candidate_profile');
            if (saved) {
                try {
                    const pd = JSON.parse(saved);
                    await apiClient.patch('/candidate-portal/profile', {
                        summary: pd.summary || null,
                        skills: pd.skills || [],
                        work_history: pd.workHistory || [],
                        education_level: pd.qualification || null,
                        current_job_title: pd.title || null,
                        current_company: pd.company || null,
                    });
                } catch { /* non-blocking */ }
            }
            await fetchCompleteness();
        };
        syncAndFetch();
    }, [fetchCompleteness]);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImageSrc(reader.result as string);
                setCropperModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setCropperModalOpen(false);
        setSelectedImageSrc(null);

        // Optimistic preview
        const croppedUrl = URL.createObjectURL(croppedBlob);
        setAvatarUrl(croppedUrl);
        
        // Convert Blob to File
        const file = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });

        const reader = new FileReader();
        reader.onloadend = () => {
            if(user) localStorage.setItem(`user_avatar_${user.id}`, reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to backend
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await apiClient.post('/auth/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success('Profile photo uploaded!');
            await useAuthStore.getState().refreshUser();
            setAvatarUrl(response.data.avatar_url);
            await fetchCompleteness();
        } catch (error) {
            toast.error('Failed to upload photo');
            console.error('Upload error:', error);
        }
    };

    const handleSaveProfile = async () => {
        setProfileData(editForm);
        localStorage.setItem('candidate_profile', JSON.stringify(editForm));
        setIsEditing(false);
        try {
            await apiClient.patch('/candidate-portal/profile', {
                summary: editForm.summary || null,
                skills: editForm.skills || [],
                work_history: editForm.workHistory || [],
                education_level: editForm.qualification || null,
                current_job_title: editForm.title || null,
                current_company: editForm.company || null,
            });
            // Refresh score so profile page and dashboard both update
            await fetchCompleteness();
        } catch {
            // local state already updated
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {completionScore < 100 && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white shadow-lg overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="font-bold text-lg">Profile Completion: {completionScore}%</h3>
                                <p className="text-blue-100 text-sm mt-1">Complete your profile to get up to 3x more recruiter views!</p>
                            </div>
                            <div className="text-sm bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30">
                                <span className="font-medium mr-2">Missing:</span>
                                {missingItems.join(", ")}
                            </div>
                            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm tracking-wide shadow-sm hover:scale-105 transition-transform" onClick={() => setIsEditing(true)}>
                                COMPLETE NOW
                            </button>
                        </div>
                        <div className="w-full bg-black/20 h-2 mt-4 rounded-full overflow-hidden border border-white/10">
                            <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionScore}%` }}></div>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card & Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Card */}
                    <div className="card">
                        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                            <div className="relative group w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-gray-500">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
                                <p className="text-gray-500 font-medium">{profileData.title}</p>
                                
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user?.email}</span>
                                    {(candidateData?.city || candidateData?.province) && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {[candidateData.city, candidateData.province].filter(Boolean).join(', ')}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 mt-4">
                                    <span className="badge badge-green">ACTIVE</span>
                                    <span className="badge badge-blue">AVAILABLE</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                {candidateData?.resume_url ? (
                                    <a
                                        href={`http://localhost:8000${candidateData.resume_url}`}
                                        download={candidateData.resume_filename || 'cv.pdf'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> Download CV
                                    </a>
                                ) : (
                                    <button
                                        className="btn-secondary flex items-center gap-2 opacity-50 cursor-not-allowed"
                                        title="Upload a CV first"
                                        disabled
                                    >
                                        <Download className="w-4 h-4" /> No CV uploaded
                                    </button>
                                )}
                                <button className="btn-secondary flex items-center gap-2" onClick={() => { setEditForm(profileData); setIsEditing(true); }}>
                                    <Edit className="w-4 h-4" /> Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Applied Jobs</p>
                                <p className="text-2xl font-bold text-gray-900">{realStats.applied}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-green-300 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Interviews</p>
                                <p className="text-2xl font-bold text-gray-900">{realStats.interviews}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-purple-300 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Edit className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Saved Jobs</p>
                                <p className="text-2xl font-bold text-gray-900">{realStats.saved}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Area */}
                    <div className="card">
                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-6">
                                {['Overview', 'Experience', 'Education', 'Applications', 'Matches'].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                                            tab === activeTab 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        
                        {/* Tab Content */}
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {activeTab === 'Overview' && (
                                <>
                                    {/* Professional Summary Section (Inline Editable) */}
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-lg font-bold text-gray-900">Professional Summary</h3>
                                        </div>
                                        {profileData.summary ? (
                                            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{profileData.summary}</p>
                                        ) : (
                                            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                                <p className="text-gray-500 mb-2">No professional summary added yet.</p>
                                                <button className="text-blue-600 font-medium hover:underline text-sm" onClick={() => { setEditTab('Basic Info'); setEditForm(profileData); setIsEditing(true); }}>Add a summary to stand out</button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Years of Experience</p>
                                                <p className="font-medium text-gray-900">{profileData.experience}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Highest Qualification</p>
                                                <p className="font-medium text-gray-900">{profileData.qualification}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Current Company</p>
                                                <p className="font-medium text-gray-900">{profileData.company}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Notice Period</p>
                                                <p className="font-medium text-gray-900">{profileData.noticePeriod}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profileData.skills.map((skill: string) => (
                                                <span key={skill} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Current Experience</h3>
                                        <div className="border-l-2 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{profileData.title}</h4>
                                                    <p className="text-blue-600 font-medium text-sm">{profileData.company}</p>
                                                </div>
                                                <span className="text-sm text-gray-500 font-medium badge badge-blue">Jan 2022 - Present</span>
                                            </div>
                                            <div className="mt-3 text-sm text-gray-700 space-y-1">
                                                <p>• Developed fully responsive React applications leading to a 40% increase in user retention.</p>
                                                <p>• Integrated complex backend microservices in Node.js.</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {activeTab === 'Experience' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900">Professional Experience</h3>
                                    {profileData.workHistory?.length === 0 && <p className="text-gray-500">No experience added yet.</p>}
                                    {profileData.workHistory?.map((work: any) => (
                                        <div key={work.id} className="border-l-2 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{work.title}</h4>
                                                    <p className="text-blue-600 font-medium text-sm">{work.company}</p>
                                                </div>
                                                <span className="text-sm text-gray-500 font-medium badge badge-blue">{work.timeline}</span>
                                            </div>
                                            <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                                                {work.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'Education' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900">Education History</h3>
                                    {profileData.educationHistory?.length === 0 && <p className="text-gray-500">No education added yet.</p>}
                                    <div className="space-y-4">
                                        {profileData.educationHistory?.map((edu: any) => (
                                            <div key={edu.id} className="border-l-2 border-green-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                                                        <p className="text-green-600 font-medium text-sm">{edu.institution}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-500 font-medium badge badge-green">{edu.year}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900 mt-8 pt-6 border-t border-gray-200">Certifications</h3>
                                    {(!profileData.certifications || profileData.certifications.length === 0) && <p className="text-gray-500">No certifications added yet.</p>}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {profileData.certifications?.map((cert: any) => (
                                            <div key={cert.id} className="border border-gray-200 p-4 rounded-lg flex items-center justify-between shadow-sm">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{cert.name}</h4>
                                                    <p className="text-sm text-gray-500">Issued: {cert.date}</p>
                                                </div>
                                                {cert.fileUrl && (
                                                    <a href="#" className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors" title="View Certificate">
                                                        <FileText className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Applications' && (
                                <ApplicationsTabContent />
                            )}

                            {activeTab === 'Matches' && (
                                <MatchesTabContent />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Resume Upload & Parsing */}
                <div className="space-y-6">
                    <div className="card bg-slate-50 border-blue-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Resume Upload & Parsing</h3>
                        
                        <CVUploadPanel onUploaded={async () => {
                            const profileRes = await apiClient.get('/candidate-portal/profile').catch(() => null);
                            if (profileRes) setCandidateData(profileRes.data);
                            await fetchCompleteness();
                        }} />
                    </div>
                    
                    {/* Notes Box */}
                    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg shadow-sm">
                        <h4 className="font-bold text-yellow-800 text-sm mb-1">System Note</h4>
                        <p className="text-xs text-yellow-700">Update your resume to let our AI parsing engine automatically match you to open roles. We support South African format parsings efficiently.</p>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        
                        <div className="flex border-b border-gray-200 px-6 pt-2 overflow-x-auto">
                            {['Basic Info', 'Experience', 'Education', 'Certifications'].map(tab => (
                                <button 
                                    key={tab} 
                                    onClick={() => setEditTab(tab)}
                                    className={`whitespace-nowrap pb-3 px-4 border-b-2 font-medium text-sm transition-colors ${editTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {editTab === 'Basic Info' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                            <input className="input w-full" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                            <input className="input w-full" value={editForm.company} onChange={(e) => setEditForm({...editForm, company: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                                            <select className="input w-full" value={editForm.experience} onChange={(e) => setEditForm({...editForm, experience: e.target.value})}>
                                                <option value="0-1 years">0-1 years</option>
                                                <option value="1-3 years">1-3 years</option>
                                                <option value="3-5 years">3-5 years</option>
                                                <option value="5-10 years">5-10 years</option>
                                                <option value="10-15 years">10-15 years</option>
                                                <option value="15+ years">15+ years</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification</label>
                                            <input className="input w-full" value={editForm.qualification} onChange={(e) => setEditForm({...editForm, qualification: e.target.value})} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
                                            <select className="input w-full" value={editForm.noticePeriod} onChange={(e) => setEditForm({...editForm, noticePeriod: e.target.value})}>
                                                <option value="Immediately">Immediately</option>
                                                <option value="1 Week">1 Week</option>
                                                <option value="2 Weeks">2 Weeks</option>
                                                <option value="30 days">30 days</option>
                                                <option value="Calendar Month">Calendar Month</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Professional Summary
                                            </label>
                                            <textarea 
                                                className="input w-full py-2 min-h-[120px]" 
                                                value={editForm.summary || ''} 
                                                onChange={(e) => setEditForm({...editForm, summary: e.target.value})}
                                                placeholder="Write a brief professional summary to highlight your expertise..."
                                            />
                                            <div className={`text-xs mt-1 font-medium ${(editForm.summary?.length || 0) < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                                                {(editForm.summary?.length || 0)} characters {(editForm.summary?.length || 0) < 50 ? '(At least 50 chars recommended)' : '✓ Great summary length'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-gray-700">Add Skills</label>
                                            <span className="text-xs font-semibold text-gray-500">{editForm.skills.length}/10 Skills</span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <select className="input w-full" disabled={editForm.skills.length >= 10} onChange={(e) => { const val = e.target.value; if (val && !editForm.skills.includes(val) && editForm.skills.length < 10) { setEditForm({...editForm, skills: [...editForm.skills, val]}); } e.target.value = ''; }} defaultValue=""><option value="" disabled>Select a preset skill...</option><optgroup label="Technology"><option value="React">React</option><option value="Python">Python</option><option value="AWS">AWS</option><option value="TypeScript">TypeScript</option></optgroup><optgroup label="Healthcare"><option value="Patient Care">Patient Care</option><option value="Clinical Research">Clinical Research</option><option value="EMR/EHR Systems">EMR/EHR Systems</option><option value="Triage">Triage</option></optgroup><optgroup label="Finance & Accounting"><option value="Financial Analysis">Financial Analysis</option><option value="Bookkeeping">Bookkeeping</option><option value="Tax Preparation">Tax Preparation</option><option value="Payroll Management">Payroll Management</option></optgroup><optgroup label="Marketing & Sales"><option value="SEO/SEM">SEO/SEM</option><option value="B2B Sales">B2B Sales</option><option value="Content Marketing">Content Marketing</option><option value="CRM Software">CRM Software</option></optgroup><optgroup label="Engineering & Construction"><option value="Project Management">Project Management</option><option value="AutoCAD">AutoCAD</option><option value="Structural Analysis">Structural Analysis</option><option value="Quality Assurance">Quality Assurance</option></optgroup></select>
                                            <div className="flex gap-2">
                                                <input id="custom-skill-input" className="input flex-1" placeholder="Or type a custom skill..." disabled={editForm.skills.length >= 10} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('add-custom-skill-btn')?.click(); } }} />
                                                <button id="add-custom-skill-btn" type="button" className="btn-secondary" disabled={editForm.skills.length >= 10} onClick={() => { const input = document.getElementById('custom-skill-input') as HTMLInputElement; const val = input.value.trim(); if (val && !editForm.skills.includes(val) && editForm.skills.length < 10) { setEditForm({...editForm, skills: [...editForm.skills, val]}); input.value = ''; } }}>Add</button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3 p-3 min-h-[50px] bg-gray-50 border border-gray-200 rounded-lg">
                                            {editForm.skills.length === 0 && <span className="text-sm text-gray-500 italic">No skills added...</span>}
                                            {editForm.skills.map((skill: string) => (<span key={skill} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-red-100 hover:text-red-800" onClick={() => setEditForm({...editForm, skills: editForm.skills.filter((s: string) => s !== skill)})}>{skill} <span>×</span></span>))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editTab === 'Experience' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                                        <p className="text-sm text-blue-800 font-medium">Add up to 10 previous roles to stand out to employers.</p>
                                        <span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded-full shadow-sm">{editForm.workHistory?.length || 0}/10 Items</span>
                                    </div>
                                    {editForm.workHistory?.map((work: any, index: number) => (
                                        <div key={work.id} className="p-4 border border-gray-200 rounded-lg relative bg-white shadow-sm stack-item">
                                            <button onClick={() => setEditForm({...editForm, workHistory: editForm.workHistory.filter((w: any) => w.id !== work.id)})} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="Delete Experience">✕</button>
                                            <div className="grid grid-cols-2 gap-4 mb-3 pr-8">
                                                <div><label className="block text-xs text-gray-500 mb-1">Job Title</label><input className="input w-full text-sm" value={work.title} onChange={(e) => { const newArr = [...editForm.workHistory]; newArr[index].title = e.target.value; setEditForm({...editForm, workHistory: newArr}) }} /></div>
                                                <div><label className="block text-xs text-gray-500 mb-1">Company</label><input className="input w-full text-sm" value={work.company} onChange={(e) => { const newArr = [...editForm.workHistory]; newArr[index].company = e.target.value; setEditForm({...editForm, workHistory: newArr}) }} /></div>
                                                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Timeline (e.g. Jan 2020 - Present)</label><input className="input w-full text-sm" value={work.timeline} onChange={(e) => { const newArr = [...editForm.workHistory]; newArr[index].timeline = e.target.value; setEditForm({...editForm, workHistory: newArr}) }} /></div>
                                                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Description & Achievements</label><textarea className="input w-full text-sm py-2 min-h-[80px]" value={work.description} onChange={(e) => { const newArr = [...editForm.workHistory]; newArr[index].description = e.target.value; setEditForm({...editForm, workHistory: newArr}) }} /></div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!editForm.workHistory || editForm.workHistory.length < 10) && (
                                        <button onClick={() => setEditForm({...editForm, workHistory: [...(editForm.workHistory||[]), {id: Date.now().toString(), title:'', company:'', timeline:'', description:''}]})} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-colors">+ Add Work Experience</button>
                                    )}
                                </div>
                            )}

                            {editTab === 'Education' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100 mb-4">
                                        <p className="text-sm text-green-800 font-medium">Add up to 5 education items.</p>
                                        <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded-full shadow-sm">{editForm.educationHistory?.length || 0}/5 Items</span>
                                    </div>
                                    {editForm.educationHistory?.map((edu: any, index: number) => (
                                        <div key={edu.id} className="p-4 border border-gray-200 rounded-lg relative bg-white shadow-sm stack-item">
                                            <button onClick={() => setEditForm({...editForm, educationHistory: editForm.educationHistory.filter((e: any) => e.id !== edu.id)})} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="Delete Education">✕</button>
                                            <div className="grid grid-cols-2 gap-4 pr-8">
                                                <div><label className="block text-xs text-gray-500 mb-1">Degree/Qualification</label><input className="input w-full text-sm" value={edu.degree} onChange={(e) => { const newArr = [...editForm.educationHistory]; newArr[index].degree = e.target.value; setEditForm({...editForm, educationHistory: newArr}) }} /></div>
                                                <div><label className="block text-xs text-gray-500 mb-1">Institution</label><input className="input w-full text-sm" value={edu.institution} onChange={(e) => { const newArr = [...editForm.educationHistory]; newArr[index].institution = e.target.value; setEditForm({...editForm, educationHistory: newArr}) }} /></div>
                                                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Year / Period</label><input className="input w-full text-sm" value={edu.year} onChange={(e) => { const newArr = [...editForm.educationHistory]; newArr[index].year = e.target.value; setEditForm({...editForm, educationHistory: newArr}) }} /></div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!editForm.educationHistory || editForm.educationHistory.length < 5) && (
                                        <button onClick={() => setEditForm({...editForm, educationHistory: [...(editForm.educationHistory||[]), {id: Date.now().toString(), degree:'', institution:'', year:''}]})} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 font-medium rounded-lg hover:bg-gray-50 hover:text-green-600 hover:border-green-300 transition-colors">+ Add Education History</button>
                                    )}
                                </div>
                            )}

                            {editTab === 'Certifications' && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 mb-4">
                                        <p className="text-sm text-purple-800 font-medium">Have you completed any notable certifications? Upload and mention them here.</p>
                                    </div>
                                    {editForm.certifications?.map((cert: any, index: number) => (
                                        <div key={cert.id} className="p-4 border border-gray-200 rounded-lg relative bg-white shadow-sm stack-item">
                                            <button onClick={() => setEditForm({...editForm, certifications: editForm.certifications.filter((c: any) => c.id !== cert.id)})} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="Delete Certification">✕</button>
                                            <div className="grid grid-cols-2 gap-4 pr-8">
                                                <div><label className="block text-xs text-gray-500 mb-1">Certification Name</label><input className="input w-full text-sm" value={cert.name} onChange={(e) => { const newArr = [...editForm.certifications]; newArr[index].name = e.target.value; setEditForm({...editForm, certifications: newArr}) }} /></div>
                                                <div><label className="block text-xs text-gray-500 mb-1">Issue Date</label><input className="input w-full text-sm" value={cert.date} onChange={(e) => { const newArr = [...editForm.certifications]; newArr[index].date = e.target.value; setEditForm({...editForm, certifications: newArr}) }} /></div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">Upload Certificate (Optional)</label>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            className={`text-sm px-4 py-2 border rounded font-medium ${cert.fileUrl ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                                                            onClick={() => { const newArr = [...editForm.certifications]; newArr[index].fileUrl = 'uploaded-doc.pdf'; setEditForm({...editForm, certifications: newArr}); }}
                                                        >
                                                            {cert.fileUrl ? '✓ Attached' : 'Attach File'}
                                                        </button>
                                                        {cert.fileUrl && <span className="text-xs text-gray-500 truncate">Document securely attached</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => setEditForm({...editForm, certifications: [...(editForm.certifications||[]), {id: Date.now().toString(), name:'', date:'', fileUrl:''}]})} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 font-medium rounded-lg hover:bg-gray-50 hover:text-purple-600 hover:border-purple-300 transition-colors">+ Add Certification</button>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveProfile}>Save All Changes</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Image Cropper Modal */}
            {selectedImageSrc && (
                <ImageCropperModal
                    isOpen={cropperModalOpen}
                    onClose={() => {
                        setCropperModalOpen(false);
                        setSelectedImageSrc(null);
                    }}
                    imageSrc={selectedImageSrc}
                    onCropComplete={handleCropComplete}
                    aspectRatio={1} // Keep it square
                />
            )}
        </div>
    );
}
