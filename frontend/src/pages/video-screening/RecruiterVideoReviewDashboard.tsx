/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 📊 RECRUITER VIDEO REVIEW DASHBOARD - LIST VIEW
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * --------
 * This is the RECRUITER'S main dashboard for viewing all completed video screenings.
 * It shows AI-analyzed results at a glance and allows filtering, searching, and
 * clicking through to individual reviews.
 * 
 * WHO USES THIS:
 * ---------------
 * - Recruiters (company employees with recruiter role)
 * - Hiring managers (company employees with hiring authority)
 * - HR team members
 * - NOT accessible to candidates (protected route)
 * 
 * WHEN IT'S USED:
 * ---------------
 * - URL: /recruiter/video-screenings
 * - Accessed from main recruiter navigation menu
 * - First stop after candidate submits video screening
 * 
 * WHAT IT SHOWS:
 * --------------
 * ✅ Stats cards (Total, Pending Review, Reviewed, Approved)
 * ✅ List of all video screenings
 * ✅ AI scores for each screening (Overall, Content, Communication, Technical)
 * ✅ AI recommendations (Invite/Further Review/Reject)
 * ✅ Candidate info (name, email, job applied for)
 * ✅ Submission timestamp
 * ✅ Filter tabs (All/Pending/Reviewed)
 * ✅ Search box (search by name, email, or job title)
 * 
 * USER FLOW:
 * ----------
 * 1. Recruiter logs in
 * 2. Navigates to "Video Screenings" in menu
 * 3. → THIS dashboard loads
 * 4. Sees overview (stats cards)
 * 5. Filters by status or searches for candidate
 * 6. Clicks "Review" on a screening
 * 7. → Navigates to VideoScreeningDetailView.tsx
 * 
 * STATS CARDS (TOP):
 * ------------------
 * 📹 Total Screenings - All completed video screenings
 * ⏰ Pending Review - Not yet reviewed by recruiter
 * 👁️ Reviewed - Recruiter has watched videos
 * ✅ Approved - Invited to interview
 * 
 * SCREENING CARD LAYOUT:
 * ----------------------
 * ┌─────────────────────────────────────────────────────────┐
 * │ [Avatar] John Doe                            Score: 85  │
 * │          john@example.com                    ━━━━━━━━━  │
 * │                                              Content: 80│
 * │ 👤 Senior Python Developer                   Comm: 90   │
 * │ 📅 Apr 20, 14:30                             Tech: 85   │
 * │                                                         │
 * │ [✅ Invite to Interview]                   [👁️ Review] │
 * └─────────────────────────────────────────────────────────┘
 * 
 * API ENDPOINT USED:
 * ------------------
 * GET /api/video-screenings?status={all|pending|reviewed}
 * 
 * Returns:
 * {
 *   "screenings": [
 *     {
 *       "id": "uuid",
 *       "candidate_name": "John Doe",
 *       "candidate_email": "john@example.com",
 *       "job_title": "Senior Python Developer",
 *       "submitted_at": "2026-04-20T14:30:00Z",
 *       "overall_score": 85,
 *       "content_score": 80,
 *       "communication_score": 90,
 *       "technical_score": 85,
 *       "status": "pending_review",
 *       "ai_recommendation": "invite_to_interview"
 *     },
 *     // ... more screenings
 *   ]
 * }
 * 
 * FILTERING:
 * ----------
 * All - Shows all screenings (default)
 * Pending - Shows only pending_review status
 * Reviewed - Shows reviewed, approved, rejected
 * 
 * Filter state managed in URL query param:
 * - /recruiter/video-screenings?status=all
 * - /recruiter/video-screenings?status=pending
 * - /recruiter/video-screenings?status=reviewed
 * 
 * SEARCHING:
 * ----------
 * Search box filters by:
 * - Candidate name (case-insensitive)
 * - Candidate email
 * - Job title
 * 
 * Client-side filtering (no API call on search):
 * const filtered = screenings.filter(s =>
 *   s.candidate_name.toLowerCase().includes(search) ||
 *   s.candidate_email.toLowerCase().includes(search) ||
 *   s.job_title.toLowerCase().includes(search)
 * );
 * 
 * AI SCORE COLOR CODING:
 * ----------------------
 * 🟢 Green (80-100) - Strong candidate
 * 🟡 Yellow (60-79) - Mixed performance
 * 🔴 Red (0-59) - Weak candidate
 * 
 * AI RECOMMENDATION BADGES:
 * -------------------------
 * ✅ "Invite to Interview" (Green) - Strong match
 * ⏰ "Further Review" (Yellow) - Uncertain, needs human review
 * ❌ "Reject" (Red) - Does not meet requirements
 * 
 * STATUS FLOW:
 * ------------
 * pending_review → reviewed → approved/rejected
 * 
 * 1. pending_review: AI analysis complete, recruiter hasn't watched
 * 2. reviewed: Recruiter watched videos
 * 3. approved: Recruiter invited to interview
 * 4. rejected: Recruiter declined candidate
 * 
 * SORTING:
 * --------
 * Default: Most recent first (submitted_at DESC)
 * Could add: Sort by score, sort by name, etc.
 * 
 * EMPTY STATES:
 * -------------
 * - No screenings yet → Shows "Video screenings will appear here..."
 * - Search with no results → Shows "Try adjusting your search query"
 * 
 * LOADING STATE:
 * --------------
 * Shows spinner while fetching screenings from API
 * 
 * CLICK ACTIONS:
 * --------------
 * Clicking entire card → Navigates to detail view
 * Clicking "Review" button → Navigates to detail view
 * (Both do the same thing, providing multiple clickable areas)
 * 
 * PERFORMANCE CONSIDERATIONS:
 * ---------------------------
 * - Pagination (if >50 screenings, implement page splitting)
 * - Virtual scrolling (if >100 screenings)
 * - Debounce search input (wait 300ms after typing stops)
 * 
 * REAL-TIME UPDATES:
 * ------------------
 * Consider adding:
 * - WebSocket connection for new screening notifications
 * - Auto-refresh every 30 seconds (polling)
 * - "New screening available" toast notification
 * 
 * BULK ACTIONS (FUTURE):
 * ----------------------
 * Could add:
 * - Select multiple screenings
 * - Bulk approve
 * - Bulk reject
 * - Export to CSV
 * 
 * ANALYTICS TRACKING:
 * -------------------
 * Track:
 * - Which filters used most often
 * - Search queries
 * - Time to first review (submitted → recruiter clicks)
 * - Conversion rate (pending → approved)
 * 
 * TESTING CHECKLIST:
 * ------------------
 * [ ] Stats cards show correct counts
 * [ ] Filter tabs work (All/Pending/Reviewed)
 * [ ] Search finds candidates by name
 * [ ] Search finds candidates by email
 * [ ] Search finds candidates by job title
 * [ ] Clicking screening opens detail view
 * [ ] AI scores display correctly
 * [ ] AI recommendation badges show
 * [ ] Empty state shows when no screenings
 * [ ] Loading state shows while fetching
 * 
 * PERMISSIONS:
 * ------------
 * This page requires authentication:
 * - Must be logged in as recruiter or admin
 * - Must have company_id (to see only their screenings)
 * - Candidates cannot access this page
 * 
 * BACKEND REQUIREMENTS:
 * ---------------------
 * 1. Authenticate user
 * 2. Verify user has recruiter role
 * 3. Filter screenings by user's company_id
 * 4. Return screenings with AI scores (if analysis complete)
 * 5. Support status filtering via query param
 * 
 * NEXT COMPONENT IN FLOW:
 * -----------------------
 * VideoScreeningDetailView.tsx - Individual screening review
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, User, Calendar, CheckCircle, XCircle, Clock, 
  TrendingUp, Filter, Search, Eye
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface VideoScreening {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  submitted_at: string;
  overall_score: number | null;
  content_score: number | null;
  communication_score: number | null;
  technical_score: number | null;
  status: 'pending_review' | 'reviewed' | 'approved' | 'rejected';
  ai_recommendation: 'invite_to_interview' | 'further_review' | 'reject' | null;
}

export default function RecruiterVideoReviewDashboard() {
  const navigate = useNavigate();
  
  const [screenings, setScreenings] = useState<VideoScreening[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchScreenings();
  }, [filter]);

  const fetchScreenings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/video-screening/list?status=${filter}`);
      setScreenings(response.data.screenings || []);
    } catch (err) {
      console.error('Failed to fetch screenings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredScreenings = screenings.filter(s => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      s.candidate_name.toLowerCase().includes(search) ||
      s.candidate_email.toLowerCase().includes(search) ||
      s.job_title.toLowerCase().includes(search)
    );
  });

  const getScoreColor = (score: number | null): string => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number | null): string => {
    if (!score) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRecommendationBadge = (recommendation: string | null) => {
    if (!recommendation) return null;

    const badges = {
      'invite_to_interview': {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Invite to Interview'
      },
      'further_review': {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="w-4 h-4" />,
        text: 'Further Review'
      },
      'reject': {
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-4 h-4" />,
        text: 'Reject'
      }
    };

    const badge = badges[recommendation];
    if (!badge) return null;

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.icon}
        <span className="ml-1">{badge.text}</span>
      </div>
    );
  };

  const stats = {
    total: screenings.length,
    pending: screenings.filter(s => s.status === 'pending_review').length,
    reviewed: screenings.filter(s => s.status === 'reviewed').length,
    approved: screenings.filter(s => s.status === 'approved').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Video Screening Reviews
          </h1>
          <p className="text-gray-600">
            Review AI-analyzed video screenings and make hiring decisions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Video className="w-6 h-6" />}
            label="Total Screenings"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label="Pending Review"
            value={stats.pending}
            color="yellow"
          />
          <StatCard
            icon={<Eye className="w-6 h-6" />}
            label="Reviewed"
            value={stats.reviewed}
            color="purple"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Approved"
            value={stats.approved}
            color="green"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search candidates, jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                    filter === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                    filter === 'pending'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  onClick={() => setFilter('reviewed')}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                    filter === 'reviewed'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reviewed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Screenings List */}
        {loading ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading screenings...</p>
          </div>
        ) : filteredScreenings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No screenings found</h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Video screenings will appear here once candidates complete them'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredScreenings.map((screening) => (
              <div
                key={screening.id}
                onClick={() => navigate(`/recruiter/video-screening/${screening.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  
                  {/* Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {screening.candidate_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {screening.candidate_name}
                        </h3>
                        <p className="text-sm text-gray-600">{screening.candidate_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {screening.job_title}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(screening.submitted_at).toLocaleDateString('en-ZA', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    {screening.ai_recommendation && (
                      <div className="mb-3">
                        {getRecommendationBadge(screening.ai_recommendation)}
                      </div>
                    )}
                  </div>

                  {/* Scores */}
                  {screening.overall_score !== null && (
                    <div className="flex items-center gap-4">
                      
                      {/* Overall Score */}
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(screening.overall_score)}`}>
                          {screening.overall_score}
                        </div>
                        <div className="text-xs text-gray-500">Overall</div>
                      </div>

                      {/* Individual Scores */}
                      <div className="grid grid-cols-3 gap-3">
                        <ScorePill
                          label="Content"
                          score={screening.content_score}
                        />
                        <ScorePill
                          label="Communication"
                          score={screening.communication_score}
                        />
                        <ScorePill
                          label="Technical"
                          score={screening.technical_score}
                        />
                      </div>

                      {/* View Button */}
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
                        <Eye className="w-5 h-5 mr-2" />
                        Review
                      </button>
                    </div>
                  )}

                  {/* Not analyzed yet */}
                  {screening.overall_score === null && (
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg text-sm font-semibold">
                        <Clock className="w-4 h-4 inline-block mr-1" />
                        AI Analysis Pending
                      </div>
                      <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center">
                        <Eye className="w-5 h-5 mr-2" />
                        View Videos
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      </div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );
}

function ScorePill({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;

  const getColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className={`px-3 py-2 rounded-lg text-center ${getColor()}`}>
      <div className="text-lg font-bold">{score}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
