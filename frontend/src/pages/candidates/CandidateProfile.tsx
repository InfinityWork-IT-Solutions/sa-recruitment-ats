// frontend/src/pages/candidates/CandidateProfile.tsx
import { useState, useRef, useEffect } from 'react';
import {
    User, FileText, Award, Settings, Download, Edit, Camera,
    MapPin, Mail, Briefcase, Calendar, Plus, X, TrendingUp,
    Eye, CheckCircle, Save
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { ImageCropperModal } from '@/components/common/ImageCropperModal';

export default function CandidateProfileEnhanced() {
    const { user, refreshUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditingSkill, setIsEditingSkill] = useState(false);
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Cropper State
    const [cropperModalOpen, setCropperModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

    // Profile state initialized from user or defaults
    const [profile, setProfile] = useState({
        name: user ? `${user.first_name} ${user.last_name}` : 'Loading...',
        title: 'Software Developer',
        email: user?.email || '',
        location: 'Cape Town, Western Cape',
        photo: user?.avatar_url || null,
        yearsExperience: '3-5 years',
        currentCompany: 'TechCorp South Africa',
        qualification: 'BSc Computer Science',
        noticePeriod: '30 days',
        summary: 'Experienced Software Developer with 5+ years building scalable web applications. Specialized in React, Node.js, and cloud infrastructure.',
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL'],
        experience: [
            {
                title: 'Software Developer',
                company: 'TechCorp South Africa',
                period: 'Jan 2022 - Present',
                description: [
                    'Developed fully responsive React applications leading to a 40% increase in user retention.',
                    'Integrated complex backend microservices in Node.js.'
                ]
            }
        ],
        education: [
            {
                degree: 'BSc Computer Science',
                institution: 'University of Cape Town',
                year: '2019 - 2022'
            }
        ],
        stats: {
            appliedJobs: 12,
            interviews: 2,
            savedJobs: 8,
            profileViews: 23,
            profileViewsChange: 15,
            profileCompletion: 85
        }
    });

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                photo: user.avatar_url || null
            }));
        }
    }, [user]);

    const [tempSummary, setTempSummary] = useState(profile.summary);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'resume', label: 'Resume', icon: FileText },
        { id: 'skills', label: 'Skills & Experience', icon: Award },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    const getProfileCompletion = () => {
        const checks = {
            hasPhoto: !!profile.photo,
            hasSummary: profile.summary.length > 50,
            hasMinSkills: profile.skills.length >= 5,
            hasExperience: profile.experience.length > 0,
            hasEducation: profile.education.length > 0,
        };

        const completed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;

        return {
            percentage: Math.round((completed / total) * 100),
            missing: {
                photo: !checks.hasPhoto,
                summary: !checks.hasSummary,
                skills: !checks.hasMinSkills,
                experience: !checks.hasExperience,
                education: !checks.hasEducation
            }
        };
    };

    const completion = getProfileCompletion();

    const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
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

        const file = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post('/auth/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Profile picture updated!");
            await refreshUser();
            setProfile(prev => ({ ...prev, photo: response.data.avatar_url }));
        } catch (err) {
            toast.error("Failed to upload image");
        }
    };

    const handleAddSkill = () => {
        if (newSkill.trim()) {
            setProfile({ ...profile, skills: [...profile.skills, newSkill] });
            setNewSkill('');
            setIsEditingSkill(false);
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setProfile({
            ...profile,
            skills: profile.skills.filter(skill => skill !== skillToRemove)
        });
    };

    const handleSaveSummary = () => {
        setProfile({ ...profile, summary: tempSummary });
        setIsEditingSummary(false);
    };

    const getInitials = () => {
        const names = profile.name.split(' ');
        return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const ProfilePicture = ({ size = 'large', className = '' }: { size?: 'small' | 'medium' | 'large', className?: string }) => {
        const sizes = {
            small: 'w-10 h-10 text-sm',
            medium: 'w-16 h-16 text-xl',
            large: 'w-32 h-32 text-4xl'
        };

        if (profile.photo) {
            return (
                <img
                    src={profile.photo}
                    alt={profile.name}
                    className={`${sizes[size]} ${className} rounded-2xl object-cover shadow-lg`}
                />
            );
        }

        return (
            <div className={`${sizes[size]} ${className} bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg`}>
                {getInitials()}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Profile Completion Banner */}
            {completion.percentage < 100 && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <span className="text-xl font-bold">{completion.percentage}%</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Profile Strength: {completion.percentage}%</p>
                                        <p className="text-sm text-blue-100">Complete your profile to get 3x more job matches!</p>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center space-x-2 text-sm">
                                <span>Missing:</span>
                                {completion.missing.photo && <span className="px-2 py-1 bg-white/20 rounded">Photo</span>}
                                {completion.missing.summary && <span className="px-2 py-1 bg-white/20 rounded">Summary</span>}
                                {completion.missing.skills && <span className="px-2 py-1 bg-white/20 rounded">2+ Skills</span>}
                            </div>
                        </div>
                        <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                            <div
                                className="bg-white h-2 rounded-full transition-all duration-500"
                                style={{ width: `${completion.percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Header Card */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-6">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <ProfilePicture size="large" />
                                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePictureUpload}
                                    className="hidden"
                                />
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                                <p className="text-xl text-gray-600 mt-1">{profile.title}</p>

                                <div className="flex items-center space-x-6 mt-4 text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-sm">{profile.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm">{profile.location}</span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 mt-3">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                        ACTIVE
                                    </span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                        AVAILABLE
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2">
                                <Download className="w-4 h-4" />
                                <span>Download CV</span>
                            </button>
                            <button className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center space-x-2">
                                <Edit className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Dashboard */}
            <div className="bg-gray-50 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Applied Jobs</p>
                                <p className="text-3xl font-bold text-blue-600 mt-1">{profile.stats.appliedJobs}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Interviews</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{profile.stats.interviews}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Saved Jobs</p>
                                <p className="text-3xl font-bold text-purple-600 mt-1">{profile.stats.savedJobs}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-4 border-b-2 font-medium transition-all ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Professional Summary */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Professional Summary</h2>
                                {!isEditingSummary ? (
                                    <button
                                        onClick={() => {
                                            setIsEditingSummary(true);
                                            setTempSummary(profile.summary);
                                        }}
                                        className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={handleSaveSummary}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>Save</span>
                                        </button>
                                        <button
                                            onClick={() => setIsEditingSummary(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isEditingSummary ? (
                                <textarea
                                    value={tempSummary}
                                    onChange={(e) => setTempSummary(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows={6}
                                />
                            ) : (
                                <p className="text-gray-700 leading-relaxed">{profile.summary}</p>
                            )}
                        </div>

                        {/* Personal Info */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Years of Experience</label>
                                    <p className="text-lg text-gray-900 mt-1">{profile.yearsExperience}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Highest Qualification</label>
                                    <p className="text-lg text-gray-900 mt-1">{profile.qualification}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cropper Modal */}
            {selectedImageSrc && (
                <ImageCropperModal
                    isOpen={cropperModalOpen}
                    onClose={() => {
                        setCropperModalOpen(false);
                        setSelectedImageSrc(null);
                    }}
                    imageSrc={selectedImageSrc}
                    onCropComplete={handleCropComplete}
                    aspectRatio={1}
                />
            )}
        </div>
    );
}
