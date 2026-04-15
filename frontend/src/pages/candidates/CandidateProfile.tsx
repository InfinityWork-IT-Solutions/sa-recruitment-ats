// frontend/src/pages/candidate/CandidateProfileEnhanced.tsx
import { useState, useRef } from 'react';
import {
    User, FileText, Award, Settings, Download, Edit, Camera,
    MapPin, Mail, Briefcase, Calendar, Plus, X, TrendingUp,
    Eye, CheckCircle, AlertCircle, Save
} from 'lucide-react';

export default function CandidateProfileEnhanced() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditingSkill, setIsEditingSkill] = useState(false);
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const [profilePicture, setProfilePicture] = useState<string | null>(null); // URL or null
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock data - replace with API calls
    const [profile, setProfile] = useState({
        name: 'Mpumelelo Magagula',
        title: 'Software Developer',
        email: 'mpumelelo130@gmail.com',
        location: 'Cape Town, Western Cape',
        photo: null, // Will be updated on upload
        yearsExperience: '3-5 years',
        currentCompany: 'TechCorp South Africa',
        qualification: 'BSc Computer Science',
        noticePeriod: '3 days',
        summary: 'Experienced Software Developer with 5+ years building scalable web applications. Specialized in React, Node.js, and cloud infrastructure. Passionate about creating user-centric solutions and mentoring junior developers. Looking for challenging opportunities in Cape Town tech companies.',
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'Patient Care', 'Bookkeeping', 'SEO/SEM'],
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
            profileViewsChange: 15, // percentage
            profileCompletion: 85
        }
    });

    const [tempSummary, setTempSummary] = useState(profile.summary);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'resume', label: 'Resume', icon: FileText },
        { id: 'skills', label: 'Skills & Experience', icon: Award },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    // Profile completion calculation
    const getProfileCompletion = () => {
        const checks = {
            hasPhoto: !!profilePicture,
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
                setProfilePicture(reader.result as string);
                // TODO: Upload to backend API
                // const formData = new FormData();
                // formData.append('photo', file);
                // await fetch('/api/candidate/upload-photo', { method: 'POST', body: formData });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddSkill = () => {
        if (newSkill.trim()) {
            setProfile({ ...profile, skills: [...profile.skills, newSkill] });
            setNewSkill('');
            setIsEditingSkill(false);
            // TODO: API call to add skill
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setProfile({
            ...profile,
            skills: profile.skills.filter(skill => skill !== skillToRemove)
        });
        // TODO: API call to remove skill
    };

    const handleSaveSummary = () => {
        setProfile({ ...profile, summary: tempSummary });
        setIsEditingSummary(false);
        // TODO: API call to save summary
    };

    // Get initials for avatar fallback
    const getInitials = () => {
        const names = profile.name.split(' ');
        return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Profile Picture Component (reusable)
    const ProfilePicture = ({ size = 'large', className = '' }: { size?: 'small' | 'medium' | 'large', className?: string }) => {
        const sizes = {
            small: 'w-10 h-10 text-sm',
            medium: 'w-16 h-16 text-xl',
            large: 'w-32 h-32 text-4xl'
        };

        if (profilePicture) {
            return (
                <img
                    src={profilePicture}
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
                        {/* Progress Bar */}
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
                        {/* Left: Photo + Info */}
                        <div className="flex items-start space-x-6">
                            {/* Profile Photo with Upload */}
                            <div className="relative group">
                                <ProfilePicture size="large" />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera className="w-8 h-8 text-white" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePictureUpload}
                                    className="hidden"
                                />
                            </div>

                            {/* Info */}
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

                        {/* Right: Action Buttons */}
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
                {/* OVERVIEW TAB */}
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
                                            onClick={() => {
                                                setIsEditingSummary(false);
                                                setTempSummary(profile.summary);
                                            }}
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
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={6}
                                    placeholder="Write a compelling professional summary that highlights your experience, skills, and career goals..."
                                />
                            ) : (
                                <p className="text-gray-700 leading-relaxed">{profile.summary}</p>
                            )}

                            {!isEditingSummary && profile.summary.length < 50 && (
                                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Tip:</strong> A strong professional summary (100+ words) increases profile views by 40%!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Personal Information Card */}
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
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Current Company</label>
                                    <p className="text-lg text-gray-900 mt-1">{profile.currentCompany}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Notice Period</label>
                                    <p className="text-lg text-gray-900 mt-1">{profile.noticePeriod}</p>
                                </div>
                            </div>
                        </div>

                        {/* Skills Summary */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Skills Overview</h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.slice(0, 8).map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {profile.skills.length > 8 && (
                                    <button
                                        onClick={() => setActiveTab('skills')}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                                    >
                                        +{profile.skills.length - 8} more
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Experience Summary */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Current Experience</h2>
                            {profile.experience.map((exp, index) => (
                                <div key={index} className="border-l-4 border-blue-600 pl-4">
                                    <h3 className="text-lg font-bold text-gray-900">{exp.title}</h3>
                                    <p className="text-gray-600">{exp.company}</p>
                                    <p className="text-sm text-gray-500 mt-1">{exp.period}</p>
                                    <ul className="mt-3 space-y-1">
                                        {exp.description.map((item, i) => (
                                            <li key={i} className="text-gray-700 text-sm">• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RESUME TAB */}
                {activeTab === 'resume' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Resume Upload & Parsing</h2>

                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition-all cursor-pointer">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Drag & Drop Resume Here
                                </h3>
                                <p className="text-gray-600 mb-4">or click to browse</p>
                                <p className="text-sm text-gray-500">Supported: PDF, DOC, DOCX (Max 10MB)</p>
                                <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                                    Upload & Parse
                                </button>
                            </div>

                            <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>System Note:</strong> Upload your resume to let our AI parsing engine automatically
                                    extract your skills, open roles. We support South African format parsing efficiently.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* SKILLS TAB */}
                {activeTab === 'skills' && (
                    <div className="space-y-6">
                        {/* Skills Management */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Skills & Expertise</h2>
                                <button
                                    onClick={() => setIsEditingSkill(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Skill</span>
                                </button>
                            </div>

                            {isEditingSkill && (
                                <div className="mb-4 flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        placeholder="Enter skill name..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                    />
                                    <button
                                        onClick={handleAddSkill}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingSkill(false);
                                            setNewSkill('');
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3">
                                {profile.skills.map((skill, index) => (
                                    <div
                                        key={index}
                                        className="group relative px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium flex items-center space-x-2"
                                    >
                                        <span>{skill}</span>
                                        <button
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4 text-red-600 hover:text-red-700" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Experience Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Work Experience</h2>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2">
                                    <Plus className="w-4 h-4" />
                                    <span>Add Experience</span>
                                </button>
                            </div>

                            {profile.experience.map((exp, index) => (
                                <div key={index} className="border-l-4 border-blue-600 pl-4 mb-6 last:mb-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{exp.title}</h3>
                                            <p className="text-gray-600">{exp.company}</p>
                                            <p className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{exp.period}</span>
                                            </p>
                                        </div>
                                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                            Edit
                                        </button>
                                    </div>
                                    <ul className="mt-3 space-y-1">
                                        {exp.description.map((item, i) => (
                                            <li key={i} className="text-gray-700 text-sm">• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Education Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Education</h2>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2">
                                    <Plus className="w-4 h-4" />
                                    <span>Add Education</span>
                                </button>
                            </div>

                            {profile.education.map((edu, index) => (
                                <div key={index} className="border-l-4 border-purple-600 pl-4">
                                    <h3 className="text-lg font-bold text-gray-900">{edu.degree}</h3>
                                    <p className="text-gray-600">{edu.institution}</p>
                                    <p className="text-sm text-gray-500 mt-1">{edu.year}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        {/* Profile Views Analytics */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Analytics</h2>

                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Profile Views This Week</p>
                                        <div className="flex items-baseline space-x-3 mt-2">
                                            <p className="text-4xl font-bold text-blue-600">{profile.stats.profileViews}</p>
                                            <div className="flex items-center space-x-1 text-green-600">
                                                <TrendingUp className="w-4 h-4" />
                                                <span className="text-sm font-semibold">+{profile.stats.profileViewsChange}%</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">vs last week</p>
                                    </div>
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Eye className="w-8 h-8 text-blue-600" />
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-blue-200">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Top Viewers:</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">TechCorp Recruiters</span>
                                            <span className="font-semibold text-gray-900">5 views</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">GlobalDev HR Team</span>
                                            <span className="font-semibold text-gray-900">3 views</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">StartupHub Cape Town</span>
                                            <span className="font-semibold text-gray-900">2 views</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                                        <p className="text-sm text-gray-600">Receive email updates about new jobs</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Job Match Alerts</h3>
                                        <p className="text-sm text-gray-600">Daily digest of jobs matching your profile</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Profile Visibility</h3>
                                        <p className="text-sm text-gray-600">Control who can see your profile</p>
                                    </div>
                                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                        <option>Public</option>
                                        <option>Private</option>
                                        <option>Recruiters Only</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Change Password</h3>
                                        <p className="text-sm text-gray-600">Update your account password</p>
                                    </div>
                                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                                        Change
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-200">
                            <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
                            <div className="space-y-3">
                                <button className="w-full px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 text-left">
                                    Deactivate Account
                                </button>
                                <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 text-left">
                                    Delete Account Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
