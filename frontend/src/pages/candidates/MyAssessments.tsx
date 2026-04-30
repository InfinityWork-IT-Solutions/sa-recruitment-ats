/**
 * ============================================================================
 * MY ASSESSMENTS - CANDIDATE PORTAL
 * ============================================================================
 * 
 * PURPOSE:
 * Shows all assessments (video screenings, skills tests, etc.) for a candidate.
 * Organizes by status: Pending, In Progress, Completed, Expired.
 * 
 * ROUTE: /candidate/portal/assessments
 * 
 * HOW IT WORKS:
 * 1. Fetch all assessments for logged-in candidate
 * 2. Display organized by tabs (Pending / Completed / All)
 * 3. Show assessment cards with action buttons
 * 4. Handle "Start Assessment" clicks
 * 
 * API ENDPOINT:
 * GET /api/candidates/{candidate_id}/assessments
 * 
 * FEATURES:
 * - Quick stats at top (X pending, Y completed)
 * - Filter tabs
 * - Expiration countdown for pending assessments
 * - Score display for completed (if shared by recruiter)
 * - Direct "Start" buttons
 * - Empty states
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Award,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import apiClient from '../../lib/api-client';

// ============================================================================
// TYPES
// ============================================================================

interface AssessmentItem {
  id: string;
  assessment_type: string;
  job_title: string;
  company_name: string;
  company_logo?: string;
  status: string;
  expires_at?: string;
  expires_in_days?: number;
  access_link?: string;
  completed_at?: string;
  score?: number;
  result_available: boolean;
  passed?: boolean;
  invited_at: string;
  estimated_duration_minutes?: number;
}

interface MyAssessmentsData {
  pending: AssessmentItem[];
  in_progress: AssessmentItem[];
  completed: AssessmentItem[];
  expired: AssessmentItem[];
  summary: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    expired: number;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyAssessments() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MyAssessmentsData | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('pending');
  const [error, setError] = useState<string | null>(null);

  const { user, isLoading: authLoading } = useAuthStore();
  const candidateId = user?.candidate_id;

  /**
   * FETCH ASSESSMENTS
   * Load all assessments for this candidate
   */
  useEffect(() => {
    if (candidateId) {
      fetchAssessments();
    } else if (!authLoading) {
      // If auth finished and we still have no candidate ID, stop loading
      setLoading(false);
    }
  }, [candidateId, authLoading]);

  const fetchAssessments = async () => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get(`/candidates/${candidateId}/assessments`);
      setData(response.data);
    } catch (err) {
      setError('Unable to load assessments. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * GET ASSESSMENTS TO DISPLAY
   * Filter based on active tab
   */
  const getDisplayedAssessments = (): AssessmentItem[] => {
    if (!data) return [];

    switch (activeTab) {
      case 'pending':
        return [...data.pending, ...data.in_progress];
      case 'completed':
        return [...data.completed, ...data.expired];
      case 'all':
      default:
        return [
          ...data.pending,
          ...data.in_progress,
          ...data.completed,
          ...data.expired
        ];
    }
  };

  /**
   * HANDLE START ASSESSMENT
   * Navigate to assessment page
   */
  const handleStartAssessment = (assessment: AssessmentItem) => {
    if (assessment.access_link) {
      navigate(assessment.access_link);
    }
  };

  // ========================================
  // LOADING STATE
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchAssessments}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const assessments = getDisplayedAssessments();

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Assessments
          </h1>
          <p className="text-gray-600">
            Track your application assessments and view results
          </p>
        </div>

        {/* QUICK STATS */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{data.summary.total}</p>
                </div>
                <Video className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{data.summary.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-orange-500" />
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600">{data.summary.in_progress}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{data.summary.completed}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* FILTER TABS */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending ({data?.summary.pending || 0})
              </button>
              
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed ({data?.summary.completed || 0})
              </button>
              
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All ({data?.summary.total || 0})
              </button>
            </nav>
          </div>

          {/* ASSESSMENT LIST */}
          <div className="p-6">
            {assessments.length === 0 ? (
              // Empty state
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No assessments {activeTab !== 'all' ? activeTab : ''}
                </h3>
                <p className="text-gray-600">
                  Assessments from your job applications will appear here
                </p>
              </div>
            ) : (
              // Assessment cards
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <AssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    onStart={() => handleStartAssessment(assessment)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


// ============================================================================
// ASSESSMENT CARD COMPONENT
// ============================================================================

interface AssessmentCardProps {
  assessment: AssessmentItem;
  onStart: () => void;
}

function AssessmentCard({ assessment, onStart }: AssessmentCardProps) {
  
  /**
   * FORMAT DATE
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  /**
   * GET STATUS BADGE
   */
  const getStatusBadge = () => {
    switch (assessment.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            <Clock className="w-4 h-4 mr-1" />
            Action Required
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <TrendingUp className="w-4 h-4 mr-1" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-4 h-4 mr-1" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  /**
   * GET TYPE ICON
   */
  const getTypeIcon = () => {
    switch (assessment.assessment_type) {
      case 'video_screening':
        return <Video className="w-6 h-6 text-blue-600" />;
      default:
        return <Video className="w-6 h-6 text-blue-600" />;
    }
  };

  // ========================================
  // CARD UI
  // ========================================

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        
        {/* LEFT: Assessment Info */}
        <div className="flex-1">
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                {getTypeIcon()}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {assessment.job_title}
                </h3>
                {getStatusBadge()}
              </div>

              <p className="text-gray-600 mb-3">
                {assessment.company_name}
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Invited {formatDate(assessment.invited_at)}
                </div>

                {assessment.estimated_duration_minutes && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    ~{assessment.estimated_duration_minutes} minutes
                  </div>
                )}

                {/* Expiration warning for pending */}
                {assessment.status === 'pending' && assessment.expires_in_days !== undefined && (
                  <div className={`flex items-center font-medium ${
                    assessment.expires_in_days <= 2 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Expires in {assessment.expires_in_days} {assessment.expires_in_days === 1 ? 'day' : 'days'}
                  </div>
                )}

                {/* Completion date */}
                {assessment.completed_at && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed {formatDate(assessment.completed_at)}
                  </div>
                )}

                {/* Score if available */}
                {assessment.score !== undefined && (
                  <div className="flex items-center font-semibold text-blue-600">
                    <Award className="w-4 h-4 mr-1" />
                    Score: {assessment.score.toFixed(0)}%
                    {assessment.passed !== undefined && (
                      <span className={`ml-2 ${assessment.passed ? 'text-green-600' : 'text-red-600'}`}>
                        ({assessment.passed ? 'Passed' : 'Did not pass'})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Action Button */}
        <div className="flex-shrink-0 ml-6">
          {assessment.status === 'pending' && assessment.access_link && (
            <button
              onClick={onStart}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center"
            >
              Start Assessment
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
          )}

          {assessment.status === 'in_progress' && assessment.access_link && (
            <button
              onClick={onStart}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
            >
              Continue
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
          )}

          {assessment.status === 'completed' && assessment.result_available && (
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              View Results
            </button>
          )}

          {assessment.status === 'expired' && (
            <div className="text-sm text-gray-500 text-right">
              <p className="font-medium">Expired</p>
              <p>Contact company for new invite</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
