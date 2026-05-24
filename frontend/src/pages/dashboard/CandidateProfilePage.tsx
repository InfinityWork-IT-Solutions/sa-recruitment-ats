import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, CheckCircle, Edit, Download, Mail, MapPin, Camera, Eye, RefreshCw, Trash2, Upload, Award, Phone, X, User, Briefcase, GraduationCap, Search } from 'lucide-react';
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

function CVUploadPanel({ onUploaded, externalInputRef }: { onUploaded: () => void; externalInputRef?: React.RefObject<HTMLInputElement> }) {
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ name: string; filledFields: string[] } | null>(null);
    const localInputRef = useRef<HTMLInputElement>(null);
    const inputRef = externalInputRef || localInputRef;

    const handleFile = async (file: File) => {
        if (uploading) return;
        setUploading(true);
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await apiClient.post('/candidate-portal/upload-cv', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const filled: string[] = res.data?.filled_fields || [];
            setUploadResult({ name: file.name, filledFields: filled });
            if (filled.length > 0) {
                toast.success(`CV uploaded! ${filled.length} profile fields auto-filled.`);
            } else {
                toast.success('CV uploaded successfully!');
            }
            onUploaded();
        } catch {
            toast.error('CV upload failed — try again');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Plain div — no label wrapper so the hidden input fires exactly once */}
            <div
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer select-none transition-colors
                    ${uploading ? 'border-blue-300 bg-blue-50 pointer-events-none' : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-300'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFile(file);
                }}
                onClick={() => inputRef.current?.click()}
            >
                <FileText className={`w-10 h-10 mb-3 ${uploading ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-800">
                    {uploading ? 'Uploading & scanning…' : 'Drag & Drop or Click to Upload'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · Max 10 MB</p>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    disabled={uploading}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) handleFile(f);
                    }}
                />
            </div>

            {uploadResult && (
                <div className="flex items-start gap-3 p-3.5 border border-green-200 bg-green-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-800">{uploadResult.name} — uploaded</p>
                        {uploadResult.filledFields.length > 0 ? (
                            <>
                                <p className="text-xs text-green-700 mt-1 font-medium">Profile auto-filled from your CV:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {uploadResult.filledFields.map(f => (
                                        <span key={f} className="text-[11px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full font-medium">{f}</span>
                                    ))}
                                </div>
                                <p className="text-xs text-green-600 mt-1.5">Review and adjust via <strong>Edit Profile</strong> if needed.</p>
                            </>
                        ) : (
                            <p className="text-xs text-green-600 mt-0.5">
                                Stored and visible to recruiters. Add skills via <strong>Edit Profile</strong>.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Location autocomplete (OpenStreetMap Nominatim, SA only, no key needed) ───

function LocationAutocomplete({ city, province, onChange }: {
    city: string;
    province: string;
    onChange: (city: string, province: string, fullAddress: string) => void;
}) {
    const [query, setQuery] = useState(city ? `${city}${province ? ', ' + province : ''}` : '');
    const [results, setResults] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const search = async (q: string) => {
        if (q.length < 3) { setResults([]); setOpen(false); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=za&addressdetails=1&limit=6`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            setResults(data);
            setOpen(data.length > 0);
        } catch { /* silent */ } finally { setLoading(false); }
    };

    const handleInput = (v: string) => {
        setQuery(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => search(v), 500);
    };

    const select = (item: any) => {
        const addr = item.address || {};
        const cityVal = addr.city || addr.town || addr.suburb || addr.village || addr.municipality || '';
        const provVal = addr.state || '';
        const full = item.display_name || '';
        setQuery(`${cityVal}${provVal ? ', ' + provVal : ''}`);
        setResults([]);
        setOpen(false);
        onChange(cityVal, provVal, full);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                    className="input w-full pl-9"
                    placeholder="Type suburb, city, or province…"
                    value={query}
                    onChange={e => handleInput(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 200)}
                />
                {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            </div>
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {results.map((item: any, i: number) => {
                        const addr = item.address || {};
                        const label = [addr.suburb || addr.city || addr.town, addr.state].filter(Boolean).join(', ');
                        return (
                            <button key={i} type="button"
                                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                                onClick={() => select(item)}
                            >
                                <p className="text-sm font-medium text-gray-900 truncate">{label || item.display_name}</p>
                                <p className="text-xs text-gray-400 truncate">{item.display_name}</p>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Attachments tab (CV + certificates in one place) ──────────────────────────

const CAT_COLOR: Record<string, string> = {
    matric: 'bg-green-100 text-green-700 border-green-200',
    tertiary: 'bg-blue-100 text-blue-700 border-blue-200',
    professional: 'bg-purple-100 text-purple-700 border-purple-200',
    other: 'bg-gray-100 text-gray-600 border-gray-200',
};
const CAT_LABEL: Record<string, string> = {
    matric: 'Matric', tertiary: 'Tertiary', professional: 'Professional', other: 'Other',
};

function AttachmentsTabContent({ candidateData, cvInputRef, onCertDeleted }: {
    candidateData: any;
    cvInputRef: React.RefObject<HTMLInputElement>;
    onCertDeleted: (id: string) => void;
}) {
    const certs: any[] = candidateData?.certificate_files || [];
    return (
        <div className="space-y-6">
            {/* CV / Resume */}
            <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> CV / Resume
                </h3>
                {candidateData?.resume_url ? (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="w-10 h-12 bg-white border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {candidateData.resume_filename
                                    || candidateData.resume_url.split('/').pop()?.replace(/^[a-f0-9-]+_/, '')
                                    || 'resume.pdf'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">CV / Resume · Visible to recruiters</p>
                        </div>
                        <a
                            href={`http://localhost:8000${candidateData.resume_url}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50 transition-colors"
                        >
                            <Eye className="w-3 h-3" /> View
                        </a>
                        <a
                            href={`http://localhost:8000${candidateData.resume_url}`}
                            download={candidateData.resume_filename || 'cv.pdf'}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-3 h-3" /> Download
                        </a>
                        <button
                            className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
                            onClick={() => cvInputRef.current?.click()}
                        >
                            <RefreshCw className="w-3 h-3" /> Replace
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl">
                        <FileText className="w-9 h-9 text-gray-300 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500">No CV uploaded yet</p>
                            <p className="text-xs text-gray-400 mt-0.5">Upload your CV in the panel on the right</p>
                        </div>
                        <button
                            className="btn-primary text-xs px-3 py-1.5"
                            onClick={() => cvInputRef.current?.click()}
                        >
                            Upload CV
                        </button>
                    </div>
                )}
            </div>

            {/* Certificates */}
            <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" /> Certificates & Qualifications
                    <span className="text-xs font-normal text-gray-400">({certs.length})</span>
                </h3>
                {certs.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No certificates uploaded</p>
                        <p className="text-xs text-gray-300 mt-0.5">Use <strong>Edit Profile → Certifications</strong> to upload</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {certs.map((cert: any) => (
                            <div key={cert.id} className="border border-gray-200 p-3.5 rounded-xl flex items-center gap-3 bg-white hover:shadow-sm transition-shadow">
                                <div className="w-9 h-10 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{cert.name}</p>
                                    {cert.issuer && <p className="text-xs text-gray-500 truncate">{cert.issuer}</p>}
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${CAT_COLOR[cert.category] || CAT_COLOR.other}`}>
                                            {CAT_LABEL[cert.category] || 'Other'}
                                        </span>
                                        {cert.date && <span className="text-[10px] text-gray-400">{cert.date}</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <a href={`http://localhost:8000${cert.file_url}`} target="_blank" rel="noopener noreferrer"
                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="View">
                                        <Eye className="w-3.5 h-3.5" />
                                    </a>
                                    <button onClick={() => onCertDeleted(cert.id)}
                                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Profile preview modal (how recruiters see the candidate) ──────────────────

function ProfilePreviewModal({ open, onClose, user, candidateData, profileData, avatarUrl }: {
    open: boolean;
    onClose: () => void;
    user: any;
    candidateData: any;
    profileData: any;
    avatarUrl: string | null;
}) {
    if (!open) return null;
    const skills: string[] = candidateData?.skills?.length ? candidateData.skills : profileData?.skills || [];
    const workHistory = candidateData?.work_history?.length ? candidateData.work_history : profileData?.workHistory || [];
    const eduHistory = profileData?.educationHistory || [];
    const certs: any[] = candidateData?.certificate_files || [];
    const summary = candidateData?.summary || profileData?.summary || '';
    const title = candidateData?.current_job_title || profileData?.title || '';
    const phone = candidateData?.phone || profileData?.phone || '';
    const city = candidateData?.city || '';
    const province = candidateData?.province || '';
    const location = [city, province].filter(Boolean).join(', ');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 uppercase tracking-wider">Recruiter View</span>
                        <span className="text-xs text-gray-400">This is how your profile appears to recruiters</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-start gap-5">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden shadow-md">
                            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : `${user?.first_name?.[0]}${user?.last_name?.[0]}`}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
                            {title && <p className="text-blue-600 font-semibold mt-0.5">{title}</p>}
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{user?.email}</span>
                                {phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{phone}</span>}
                                {location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{location}</span>}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <span className="text-xs font-bold bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">ACTIVE</span>
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">AVAILABLE</span>
                                {profileData?.noticePeriod && <span className="text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full">Notice: {profileData.noticePeriod}</span>}
                            </div>
                        </div>
                        {candidateData?.resume_url && (
                            <a href={`http://localhost:8000${candidateData.resume_url}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 btn-primary text-sm flex-shrink-0">
                                <Download className="w-4 h-4" /> Download CV
                            </a>
                        )}
                    </div>

                    {/* Summary */}
                    {summary && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Professional Summary</h3>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
                        </div>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-3">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((s: string) => (
                                    <span key={s} className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Work Experience */}
                    {workHistory.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Work Experience</h3>
                            <div className="space-y-3">
                                {workHistory.map((w: any) => (
                                    <div key={w.id} className="border-l-2 border-blue-400 pl-4 py-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{w.title}</p>
                                                {w.company && <p className="text-blue-600 text-sm font-medium">{w.company}</p>}
                                            </div>
                                            {w.timeline && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0 ml-2">{w.timeline}</span>}
                                        </div>
                                        {w.description && <p className="text-xs text-gray-600 mt-1.5 whitespace-pre-wrap leading-relaxed">{w.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {eduHistory.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Education</h3>
                            <div className="space-y-2">
                                {eduHistory.map((e: any) => (
                                    <div key={e.id} className="border-l-2 border-green-400 pl-4 py-1">
                                        <p className="font-semibold text-gray-900 text-sm">{e.degree}</p>
                                        {e.institution && <p className="text-green-600 text-sm">{e.institution}</p>}
                                        {e.year && <p className="text-xs text-gray-400 mt-0.5">{e.year}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Certificates */}
                    {certs.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Certificates</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {certs.map((cert: any) => (
                                    <div key={cert.id} className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 truncate">{cert.name}</p>
                                            <p className="text-[10px] text-gray-400">{CAT_LABEL[cert.category] || 'Other'}{cert.date ? ` · ${cert.date}` : ''}</p>
                                        </div>
                                        <a href={`http://localhost:8000${cert.file_url}`} target="_blank" rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                                            <Eye className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Certifications upload tab ─────────────────────────────────────────────────

const CERT_CATEGORIES = [
    { value: 'matric',       label: 'Matric Certificate' },
    { value: 'tertiary',     label: 'Tertiary / Degree / Transcript' },
    { value: 'professional', label: 'Professional Certification' },
    { value: 'other',        label: 'Other' },
];

function CertificationsUploadTab({
    certFiles,
    onUploaded,
    onDeleted,
}: {
    certFiles: any[];
    onUploaded: () => void;
    onDeleted: (id: string) => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({ name: '', issuer: '', date: '', category: 'other' });
    const inputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const handleUpload = async () => {
        if (!pendingFile || !form.name.trim()) {
            toast.error('Please select a file and enter a certificate name');
            return;
        }
        setUploading(true);
        const fd = new FormData();
        fd.append('file', pendingFile);
        fd.append('name', form.name);
        fd.append('issuer', form.issuer);
        fd.append('date', form.date);
        fd.append('category', form.category);
        try {
            await apiClient.post('/candidate-portal/upload-certificate', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Certificate uploaded!');
            setForm({ name: '', issuer: '', date: '', category: 'other' });
            setPendingFile(null);
            if (inputRef.current) inputRef.current.value = '';
            onUploaded();
        } catch {
            toast.error('Upload failed — try again');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-800 font-medium">Upload your Matric certificate, degree certificates, academic transcripts, or professional certifications.</p>
            </div>

            {/* Upload form */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white shadow-sm">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Upload className="w-4 h-4 text-purple-500" /> Upload New Certificate</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Certificate Name <span className="text-red-500">*</span></label>
                        <input className="input w-full text-sm" placeholder="e.g. National Senior Certificate (Matric)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Category</label>
                        <select className="input w-full text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            {CERT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Year / Date</label>
                        <input className="input w-full text-sm" placeholder="e.g. 2018 or Nov 2018" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Issuing Institution (optional)</label>
                        <input className="input w-full text-sm" placeholder="e.g. University of Johannesburg" value={form.issuer} onChange={e => setForm({...form, issuer: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">File <span className="text-red-500">*</span></label>
                        <div
                            className={`border-2 border-dashed rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-colors ${pendingFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'}`}
                            onClick={() => inputRef.current?.click()}
                        >
                            <FileText className={`w-5 h-5 flex-shrink-0 ${pendingFile ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className="text-sm truncate">{pendingFile ? pendingFile.name : 'Click to select file (PDF, DOC, JPG, PNG)'}</span>
                            {pendingFile && <button className="ml-auto text-xs text-red-500 hover:text-red-700" onClick={e => { e.stopPropagation(); setPendingFile(null); if (inputRef.current) inputRef.current.value = ''; }}>Remove</button>}
                        </div>
                        <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onClick={e => e.stopPropagation()} onChange={e => { const f = e.target.files?.[0]; if (f) setPendingFile(f); e.target.value = ''; }} />
                    </div>
                </div>
                <button
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors ${uploading || !pendingFile || !form.name.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                    disabled={uploading || !pendingFile || !form.name.trim()}
                    onClick={handleUpload}
                >
                    {uploading ? 'Uploading…' : 'Upload Certificate'}
                </button>
            </div>

            {/* Existing certificates */}
            {certFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-700">Uploaded Certificates ({certFiles.length})</h4>
                    {certFiles.map((cert: any) => {
                        const catLabel: Record<string, string> = { matric: 'Matric', tertiary: 'Tertiary', professional: 'Professional', other: 'Other' };
                        return (
                            <div key={cert.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white">
                                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{cert.name}</p>
                                    <p className="text-xs text-gray-400">{catLabel[cert.category] || 'Other'}{cert.date ? ` · ${cert.date}` : ''}</p>
                                </div>
                                <a href={`http://localhost:8000${cert.file_url}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></a>
                                <button onClick={() => onDeleted(cert.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        );
                    })}
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
    const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);

    // Merge backend auto-filled data into profileData state + localStorage
    const mergeBackendProfile = useCallback((fresh: any) => {
        if (!fresh) return;
        setProfileData((prev: any) => {
            const merged = {
                ...prev,
                skills: fresh.skills?.length >= 1 ? fresh.skills : prev.skills,
                summary: fresh.summary || prev.summary,
                workHistory: fresh.work_history?.length ? fresh.work_history : prev.workHistory,
                title: fresh.current_job_title || prev.title,
                company: fresh.current_company || prev.company,
                qualification: fresh.education_level || prev.qualification,
                phone: fresh.phone || prev.phone,
            };
            localStorage.setItem('candidate_profile', JSON.stringify(merged));
            return merged;
        });
    }, []);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cvInputRef = useRef<HTMLInputElement>(null);
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
                mergeBackendProfile(profileRes.data);
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
    }, [fetchCompleteness, mergeBackendProfile]);

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
                phone: editForm.phone || null,
                city: editForm.city || null,
                province: editForm.province || null,
            });
            // Refresh candidateData and completeness
            const profileRes = await apiClient.get('/candidate-portal/profile').catch(() => null);
            if (profileRes) setCandidateData(profileRes.data);
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
                                <button
                                    className="btn-primary flex items-center gap-2"
                                    onClick={() => setProfilePreviewOpen(true)}
                                >
                                    <Eye className="w-4 h-4" /> View Profile
                                </button>
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
                                {['Overview', 'Experience', 'Education', 'Applications', 'Matches', 'Attachments'].map((tab) => (
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
                                    
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            className="w-full flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
                                            onClick={() => setActiveTab('Attachments')}
                                        >
                                            <span className="flex items-center gap-2 text-sm font-semibold text-yellow-800">
                                                <Award className="w-5 h-5 text-yellow-500" />
                                                Certificates & Qualifications ({(candidateData?.certificate_files || []).length} uploaded)
                                            </span>
                                            <span className="text-xs text-yellow-600 font-medium">View in Attachments tab →</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Applications' && (
                                <ApplicationsTabContent />
                            )}

                            {activeTab === 'Matches' && (
                                <MatchesTabContent />
                            )}

                            {activeTab === 'Attachments' && (
                                <AttachmentsTabContent
                                    candidateData={candidateData}
                                    cvInputRef={cvInputRef}
                                    onCertDeleted={async (certId) => {
                                        try {
                                            await apiClient.delete(`/candidate-portal/certificates/${certId}`);
                                            const profileRes = await apiClient.get('/candidate-portal/profile').catch(() => null);
                                            if (profileRes) setCandidateData(profileRes.data);
                                            toast.success('Certificate removed');
                                        } catch { toast.error('Failed to remove certificate'); }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Upload zone only (viewer is in Attachments tab) */}
                <div className="space-y-6">
                    <div className="card bg-slate-50 border-blue-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-blue-600" />
                            {candidateData?.resume_url ? 'Replace CV' : 'Upload Your CV'}
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">View your uploaded CV in the <button className="text-blue-600 hover:underline font-medium" onClick={() => setActiveTab('Attachments')}>Attachments</button> tab.</p>
                        <CVUploadPanel
                            externalInputRef={cvInputRef}
                            onUploaded={async () => {
                                const profileRes = await apiClient.get('/candidate-portal/profile').catch(() => null);
                                if (profileRes) {
                                    setCandidateData(profileRes.data);
                                    mergeBackendProfile(profileRes.data);
                                }
                                await fetchCompleteness();
                            }}
                        />
                    </div>

                    {/* Quick link to Attachments tab */}
                    {candidateData?.resume_url && (
                        <button
                            className="w-full flex items-center gap-3 p-3.5 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left"
                            onClick={() => setActiveTab('Attachments')}
                        >
                            <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-blue-900 truncate">
                                    {candidateData.resume_filename || candidateData.resume_url.split('/').pop()?.replace(/^[a-f0-9-]+_/, '') || 'resume.pdf'}
                                </p>
                                <p className="text-xs text-blue-600">Click to view in Attachments tab →</p>
                            </div>
                        </button>
                    )}

                    {/* Tip box */}
                    <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
                        <h4 className="font-bold text-blue-800 text-sm mb-1">Auto-fill tip</h4>
                        <p className="text-xs text-blue-700">Upload your CV and we'll automatically fill in your skills, location, education level, and work history where fields are empty.</p>
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />Phone Number</label>
                                            <input className="input w-full" placeholder="+27 XX XXX XXXX" value={editForm.phone || ''} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
                                        </div>
                                        <div className="col-span-2">
                                            <LocationAutocomplete
                                                city={editForm.city || candidateData?.city || ''}
                                                province={editForm.province || candidateData?.province || ''}
                                                onChange={(city, province) => setEditForm({...editForm, city, province})}
                                            />
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
                                <CertificationsUploadTab
                                    certFiles={candidateData?.certificate_files || []}
                                    onUploaded={async () => {
                                        const profileRes = await apiClient.get('/candidate-portal/profile').catch(() => null);
                                        if (profileRes) setCandidateData(profileRes.data);
                                        await fetchCompleteness();
                                    }}
                                    onDeleted={async (certId: string) => {
                                        try {
                                            await apiClient.delete(`/candidate-portal/certificates/${certId}`);
                                            const profileRes = await apiClient.get('/candidate-portal/profile').catch(() => null);
                                            if (profileRes) setCandidateData(profileRes.data);
                                            toast.success('Certificate removed');
                                        } catch {
                                            toast.error('Failed to remove certificate');
                                        }
                                    }}
                                />
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveProfile}>Save All Changes</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Profile Preview Modal */}
            <ProfilePreviewModal
                open={profilePreviewOpen}
                onClose={() => setProfilePreviewOpen(false)}
                user={user}
                candidateData={candidateData}
                profileData={profileData}
                avatarUrl={avatarUrl}
            />

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
