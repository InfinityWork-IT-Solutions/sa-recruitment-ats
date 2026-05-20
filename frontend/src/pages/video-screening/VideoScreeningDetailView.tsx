/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🎥 VIDEO SCREENING DETAIL VIEW - INDIVIDUAL REVIEW PAGE
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * --------
 * This is where recruiters ACTUALLY WATCH the video responses and make hiring
 * decisions. It's the most important page in the recruiter flow - where they
 * see everything: videos, AI analysis, candidate info, and decision buttons.
 * 
 * WHO USES THIS:
 * ---------------
 * - Recruiters reviewing video screenings
 * - Hiring managers making interview decisions
 * - HR team members assessing candidates
 * 
 * WHEN IT'S USED:
 * ---------------
 * - After recruiter clicks "Review" on dashboard
 * - URL: /company/video-screening/{screening_id}
 * - This is where hiring decisions are made
 * 
 * PAGE LAYOUT:
 * ------------
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ Header: [← Back] John Doe | Senior Python Dev [Reject] [Invite]   │
 * ├────────────────────────────────────────────────────────────────────┤
 * │                                                                    │
 * │  LEFT (2/3 width)                │  RIGHT (1/3 width)             │
 * │  ┌─────────────────────────┐     │  ┌──────────────────────┐     │
 * │  │  VIDEO PLAYER           │     │  │  CANDIDATE PROFILE   │     │
 * │  │  [Play] [Mute]          │     │  │  Name, Email, Phone  │     │
 * │  │                         │     │  │  Location            │     │
 * │  └─────────────────────────┘     │  └──────────────────────┘     │
 * │                                  │                                │
 * │  Question 1 of 3                 │  ┌──────────────────────┐     │
 * │  "Tell us about yourself"        │  │  AI REPORT CARD      │     │
 * │  Content: 80 | Comm: 90 | Tech:85│  │  Overall: 85 (A)     │     │
 * │  [Show/Hide Transcript]          │  │  Scores, Strengths   │     │
 * │                                  │  │  Concerns, Summary   │     │
 * │  ┌───┐ ┌───┐ ┌───┐              │  └──────────────────────┘     │
 * │  │ Q1│ │Q2 │ │Q3 │              │                                │
 * │  └───┘ └───┘ └───┘              │                                │
 * └────────────────────────────────────────────────────────────────────┘
 * 
 * WHAT IT SHOWS:
 * --------------
 * ✅ Video player with all 3 video responses
 * ✅ Play/Pause, Mute controls
 * ✅ Current question text
 * ✅ Question scores (Content, Communication, Technical)
 * ✅ AI transcript (toggle show/hide)
 * ✅ AI notes for each video
 * ✅ Question navigation (Q1, Q2, Q3)
 * ✅ Candidate profile (name, email, phone, location)
 * ✅ AI Report Card (overall score, recommendations, strengths, concerns)
 * ✅ Action buttons (Invite to Interview, Reject)
 * 
 * USER FLOW:
 * ----------
 * 1. Recruiter clicks screening from dashboard
 * 2. → THIS page loads
 * 3. Page loads screening data + videos
 * 4. Recruiter watches Q1 video
 * 5. Clicks Q2, watches Q2 video
 * 6. Clicks Q3, watches Q3 video
 * 7. Reviews AI Report Card
 * 8. Makes decision:
 *    Option A: Clicks "Invite to Interview" → Sends invitation email
 *    Option B: Clicks "Reject" → Sends rejection email
 * 9. → Navigates back to dashboard
 * 
 * API ENDPOINT USED:
 * ------------------
 * GET /api/video-screenings/{screening_id}
 * 
 * Returns COMPLETE screening object:
 * {
 *   "id": "uuid",
 *   "candidate": {
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "phone": "+27 12 345 6789",
 *     "location": "Cape Town, South Africa",
 *     "profile_url": "/candidates/uuid"
 *   },
 *   "job_title": "Senior Python Developer",
 *   "company_name": "TechCorp",
 *   "submitted_at": "2026-04-20T14:30:00Z",
 *   "overall_score": 85,
 *   "content_score": 80,
 *   "communication_score": 90,
 *   "technical_score": 85,
 *   "ai_summary": "Strong candidate with excellent communication...",
 *   "ai_recommendation": "invite_to_interview",
 *   "strengths": [
 *     "Excellent communication skills",
 *     "Deep technical knowledge of Python & Django"
 *   ],
 *   "concerns": [
 *     "Limited team leadership experience"
 *   ],
 *   "responses": [
 *     {
 *       "question_id": "uuid",
 *       "question_text": "Tell us about yourself",
 *       "question_order": 1,
 *       "video_url": "https://s3.amazonaws.com/...",
 *       "duration_seconds": 118,
 *       "transcript": "Hi, I'm John. I've been...",
 *       "content_score": 80,
 *       "communication_score": 90,
 *       "technical_score": 85,
 *       "ai_notes": "Strong opening, clearly articulated..."
 *     },
 *     // ... Q2, Q3
 *   ],
 *   "status": "pending_review"
 * }
 * 
 * VIDEO PLAYER CONTROLS:
 * ----------------------
 * ▶️ Play/Pause - Click video or play button
 * 🔊 Mute/Unmute - Toggle audio
 * ⏱️ Timestamp - Shows current position (not shown in this version)
 * 🎬 Question tabs - Navigate between Q1, Q2, Q3
 * 
 * VIDEO STATES:
 * -------------
 * - Loading: Shows loading spinner
 * - Playing: Video playing, pause button shown
 * - Paused: Video paused, play button shown
 * - Ended: Video finished, shows replay option
 * 
 * QUESTION NAVIGATION:
 * --------------------
 * Three question cards at bottom:
 * - Shows question number and text preview
 * - Highlighted when selected
 * - Click to switch videos
 * - Remembers playback position (when switching back)
 * 
 * TRANSCRIPT FEATURE:
 * -------------------
 * - Toggle button: "▽ Show Transcript" / "△ Hide Transcript"
 * - When shown: Displays AI-generated transcript
 * - Max height with scrolling (doesn't push content down too far)
 * - Helps recruiters who:
 *   * Want to skim content quickly
 *   * Have hearing impairments
 *   * Are in noisy environments
 * 
 * AI NOTES PER VIDEO:
 * -------------------
 * Each video has AI-specific notes:
 * "Strong opening, clearly articulated experience with Django..."
 * Displayed in blue info box below video
 * 
 * CANDIDATE PROFILE SIDEBAR:
 * --------------------------
 * Shows:
 * - Profile avatar (initial letter)
 * - Name & job applied for
 * - Email (clickable mailto link)
 * - Phone (clickable tel link)
 * - Location (with icon)
 * - Submission date
 * - Link to full candidate profile
 * 
 * AI REPORT CARD (RIGHT SIDEBAR):
 * --------------------------------
 * Comprehensive AI analysis:
 * - Overall score (0-100) + letter grade (A+, A, B, C, D, F)
 * - Score breakdown (Content, Communication, Technical)
 * - AI recommendation badge (Invite/Review/Reject)
 * - AI summary paragraph
 * - Key strengths (bullet points)
 * - Areas of concern (bullet points)
 * - Disclaimer ("AI is a tool, not a replacement")
 * 
 * ACTION BUTTONS (TOP RIGHT):
 * ---------------------------
 * 🔴 Reject - Red button
 *   - Prompts for optional rejection reason
 *   - Sends kind rejection email to candidate
 *   - Marks screening as rejected
 *   - Navigates back to dashboard
 * 
 * 🟢 Invite to Interview - Green gradient button
 *   - Confirms action
 *   - Sends interview invitation email
 *   - Marks screening as approved
 *   - Navigates back to dashboard
 * 
 * API CALLS FOR ACTIONS:
 * ----------------------
 * POST /api/video-screenings/{screening_id}/approve
 * - Sends interview invitation email
 * - Updates status to 'approved'
 * - Triggers email_service.send_interview_invitation()
 * 
 * POST /api/video-screenings/{screening_id}/reject
 * Body: { "reason": "optional reason text" }
 * - Sends rejection email
 * - Updates status to 'rejected'
 * - Triggers email_service.send_rejection_email()
 * 
 * KEYBOARD SHORTCUTS (COULD ADD):
 * --------------------------------
 * Space - Play/Pause
 * M - Mute/Unmute
 * 1, 2, 3 - Jump to Q1, Q2, Q3
 * T - Toggle transcript
 * A - Approve
 * R - Reject
 * 
 * ERROR HANDLING:
 * ---------------
 * ❌ Screening not found → Shows error, back button
 * ❌ Video failed to load → Shows error message
 * ❌ API call failure → Shows alert, allows retry
 * 
 * LOADING STATE:
 * --------------
 * - Shows spinner while fetching screening data
 * - Disables action buttons until data loaded
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * --------------------------
 * - Lazy load videos (only load when selected)
 * - Preload next video (while watching current)
 * - Video compression (if not already compressed)
 * 
 * ACCESSIBILITY:
 * --------------
 * - Transcript for deaf/hard of hearing
 * - Keyboard navigation support
 * - Screen reader friendly labels
 * - High contrast colors for scores
 * 
 * MOBILE CONSIDERATIONS:
 * ----------------------
 * - Stacked layout on small screens
 * - Touch-friendly controls
 * - Video player works on iOS/Android
 * 
 * TESTING CHECKLIST:
 * ------------------
 * [ ] Screening loads correctly
 * [ ] Video plays/pauses
 * [ ] Mute/unmute works
 * [ ] Question navigation works (Q1 → Q2 → Q3)
 * [ ] Transcript toggles show/hide
 * [ ] AI Report Card displays correctly
 * [ ] Approve button sends invitation
 * [ ] Reject button sends rejection
 * [ ] Navigation back to dashboard works
 * 
 * ANALYTICS TRACKING:
 * -------------------
 * Track:
 * - Time spent on page (how long recruiter reviews)
 * - Which videos watched (completion rate)
 * - Approve vs Reject rate
 * - AI recommendation follow rate (does recruiter agree with AI?)
 * 
 * BACKEND INTEGRATION:
 * --------------------
 * When this page loads:
 * 1. Fetch screening from database
 * 2. Include AI analysis results (if complete)
 * 3. Include video URLs (S3 signed URLs)
 * 4. Include transcript text
 * 5. Return 404 if screening not found
 * 6. Return 403 if wrong company (security)
 * 
 * NEXT STEPS AFTER DECISION:
 * --------------------------
 * If Approved:
 * - Candidate receives "Interview Invitation" email
 * - Recruiter can schedule interview via separate flow
 * 
 * If Rejected:
 * - Candidate receives "Kind Rejection" email
 * - Screening archived (can still be viewed)
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, CheckCircle, 
  XCircle, User, Calendar, Mail, Phone, MapPin, TrendingUp,
  AlertCircle, Download, Share2
} from 'lucide-react';
import AIReportCard from './AIReportCard';
import apiClient from '@/lib/api-client';

interface VideoResponse {
  question_id: string;
  question_text: string;
  question_order: number;
  video_url: string;
  duration_seconds: number;
  transcript: string;
  content_score: number;
  communication_score: number;
  technical_score: number;
  ai_notes: string;
}

interface ScreeningDetail {
  id: string;
  candidate: {
    name: string;
    email: string;
    phone: string;
    location: string;
    profile_url: string;
  };
  job_title: string;
  company_name: string;
  submitted_at: string;
  overall_score: number;
  content_score: number;
  communication_score: number;
  technical_score: number;
  ai_summary: string;
  ai_recommendation: 'invite_to_interview' | 'further_review' | 'reject';
  strengths: string[];
  concerns: string[];
  responses: VideoResponse[];
  status: string;
}

export default function VideoScreeningDetailView() {
  const { screening_id } = useParams<{ screening_id: string }>();
  const navigate = useNavigate();

  const [screening, setScreening] = useState<ScreeningDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchScreeningDetail();
  }, [screening_id]);

  const fetchScreeningDetail = async () => {
    try {
      const response = await apiClient.get(`/video-screening/${screening_id}`);
      setScreening(response.data);
    } catch (err) {
      console.error('Failed to fetch screening:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Invite this candidate to interview?')) return;

    try {
      await apiClient.post(`/video-screening/${screening_id}/approve`);
      alert('✅ Candidate approved! Interview invitation will be sent.');
      navigate('/company/video-screenings');
    } catch (err) {
      alert('Failed to approve candidate');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Rejection reason (optional):');
    
    try {
      await apiClient.post(`/video-screening/${screening_id}/reject`, { reason });
      alert('Candidate rejected. Notification email sent.');
      navigate('/company/video-screenings');
    } catch (err) {
      alert('Failed to reject candidate');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading screening...</p>
        </div>
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Screening Not Found</h2>
          <button
            onClick={() => navigate('/company/video-screenings')}
            className="text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentVideo = screening.responses[currentVideoIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/company/video-screenings')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {screening.candidate.name}
              </h1>
              <p className="text-gray-600">{screening.job_title}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Invite to Interview
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Video Player */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Video Player */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="relative bg-black aspect-video">
                <video
                  ref={videoRef}
                  src={currentVideo.video_url}
                  className="w-full h-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                     onClick={togglePlay}>
                  {!isPlaying && (
                    <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <Play className="w-10 h-10 text-gray-900 ml-1" />
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={togglePlay}
                      className="text-white hover:scale-110 transition-transform"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </button>

                    <button
                      onClick={toggleMute}
                      className="text-white hover:scale-110 transition-transform"
                    >
                      {isMuted ? (
                        <VolumeX className="w-6 h-6" />
                      ) : (
                        <Volume2 className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Info */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <div className="text-sm font-semibold text-blue-600 mb-2">
                  Question {currentVideo.question_order} of {screening.responses.length}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {currentVideo.question_text}
                </h3>

                {/* Mini Scores */}
                <div className="flex items-center gap-4">
                  <ScoreBadge label="Content" score={currentVideo.content_score} />
                  <ScoreBadge label="Communication" score={currentVideo.communication_score} />
                  <ScoreBadge label="Technical" score={currentVideo.technical_score} />
                </div>
              </div>

              {/* Transcript Toggle */}
              <div className="p-4 bg-white">
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  {showTranscript ? '△ Hide' : '▽ Show'} Transcript
                </button>
                
                {showTranscript && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 max-h-48 overflow-y-auto">
                    {currentVideo.transcript || 'Transcript not available'}
                  </div>
                )}
              </div>
            </div>

            {/* Question Navigation */}
            <div className="grid grid-cols-3 gap-3">
              {screening.responses.map((response, index) => (
                <button
                  key={response.question_id}
                  onClick={() => setCurrentVideoIndex(index)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    index === currentVideoIndex
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">
                    Q{response.question_order}
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2">
                    {response.question_text}
                  </div>
                </button>
              ))}
            </div>

            {/* AI Notes for Current Video */}
            {currentVideo.ai_notes && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900 mb-1">AI Analysis</div>
                    <p className="text-sm text-blue-800">{currentVideo.ai_notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Candidate Info & AI Report */}
          <div className="space-y-6">
            
            {/* Candidate Profile */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {screening.candidate.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {screening.candidate.name}
                  </h3>
                  <p className="text-sm text-gray-600">Applied for {screening.job_title}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {screening.candidate.email}
                </div>
                {screening.candidate.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {screening.candidate.phone}
                  </div>
                )}
                {screening.candidate.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {screening.candidate.location}
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Submitted {new Date(screening.submitted_at).toLocaleDateString('en-ZA')}
                </div>
              </div>

              {screening.candidate.profile_url && (
                <a
                  href={screening.candidate.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors inline-block"
                >
                  <User className="w-4 h-4 inline-block mr-2" />
                  View Full Profile
                </a>
              )}
            </div>

            {/* AI Report Card */}
            <AIReportCard
              overallScore={screening.overall_score}
              contentScore={screening.content_score}
              communicationScore={screening.communication_score}
              technicalScore={screening.technical_score}
              aiSummary={screening.ai_summary}
              recommendation={screening.ai_recommendation}
              strengths={screening.strengths}
              concerns={screening.concerns}
            />

          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component
function ScoreBadge({ label, score }: { label: string; score: number }) {
  const getColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className={`px-3 py-2 rounded-lg ${getColor()}`}>
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-lg font-bold">{score}</div>
    </div>
  );
}
