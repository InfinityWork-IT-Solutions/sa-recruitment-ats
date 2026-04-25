/**
 * RecruitPro SA - AI Decision Queue Dashboard
 * "Semi-Auto" Mode: Beautiful UI for approving AI decisions
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Clock, TrendingUp,
  Users, Video, Calendar, Send, ChevronDown, ChevronUp
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface AIDecision {
  decision_id: string;
  decision_type: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  ai_reasoning: string;
  ai_confidence: number;
  proposed_action: any;
  created_at: string;
}

interface PendingDecisions {
  totals: {
    total_pending: number;
    auto_reject_count: number;
    video_screening_count: number;
    fast_track_count: number;
  };
  summary: {
    auto_reject: AIDecision[];
    send_video_screening: AIDecision[];
    fast_track_interview: AIDecision[];
  };
  all_decisions: AIDecision[];
}

export default function AIDecisionDashboard() {
  const [decisions, setDecisions] = useState<PendingDecisions | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDecisions, setSelectedDecisions] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchPendingDecisions();
  }, []);

  const fetchPendingDecisions = async () => {
    try {
      const response = await apiClient.get('/decisions/pending');
      const data = response.data;
      
      if (data && data.totals) {
        setDecisions(data);
        
        // Auto-select all decisions
        if (data.all_decisions && Array.isArray(data.all_decisions)) {
          const allIds = new Set(data.all_decisions.map((d: AIDecision) => d.decision_id));
          setSelectedDecisions(allIds);
        }
      } else {
        console.error('Invalid decisions data received:', data);
        setDecisions(null);
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
      setDecisions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAll = async () => {
    if (!confirm(`Approve ${selectedDecisions.size} AI decisions? These actions will be executed immediately.`)) {
      return;
    }

    setApproving(true);
    
    try {
      const response = await apiClient.post('/decisions/approve-all', {
        decision_ids: Array.from(selectedDecisions)
      });

      const result = response.data;
      
      if (result.success) {
        // Show success message
        alert(`✅ Success! ${result.executed_count} decisions executed.\n\nTime saved: ~${Math.round(result.executed_count * 5 / 60 * 10) / 10} hours!`);
        
        // Refresh decisions
        await fetchPendingDecisions();
        setSelectedDecisions(new Set());
      }
    } catch (error) {
      console.error('Error approving decisions:', error);
      alert('Error approving decisions. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case 'auto_reject': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'send_video_screening': return <Video className="w-5 h-5 text-blue-500" />;
      case 'fast_track_interview': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'schedule_interview': return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'send_outreach': return <Send className="w-5 h-5 text-orange-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDecisionColor = (type: string) => {
    switch (type) {
      case 'auto_reject': return 'bg-red-50 border-red-200';
      case 'send_video_screening': return 'bg-blue-50 border-blue-200';
      case 'fast_track_interview': return 'bg-green-50 border-green-200';
      case 'schedule_interview': return 'bg-purple-50 border-purple-200';
      case 'send_outreach': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getDecisionLabel = (type: string) => {
    switch (type) {
      case 'auto_reject': return 'Auto-Reject';
      case 'send_video_screening': return 'Send Video Screening';
      case 'fast_track_interview': return 'Fast-Track to Interview';
      case 'schedule_interview': return 'Schedule Interview';
      case 'send_outreach': return 'Send Outreach';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading AI decisions...</p>
        </div>
      </div>
    );
  }

  if (!decisions || !decisions.totals || decisions.totals.total_pending === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-xl border border-gray-100 p-16 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">All Caught Up! ✨</h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            You've reviewed all AI recommendations. The AI is constantly analyzing new applications to save you time.
          </p>
          <button 
            onClick={() => fetchPendingDecisions()}
            className="mt-8 text-blue-600 font-semibold hover:text-blue-700 underline underline-offset-4"
          >
            Check for new decisions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI Decision Queue</h1>
            <p className="text-blue-100 text-lg">
              Review and approve AI recommendations with one click
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{decisions.totals.total_pending}</div>
            <div className="text-blue-100">Pending Decisions</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<XCircle className="w-6 h-6" />}
          label="Auto-Reject"
          count={decisions.totals.auto_reject_count}
          color="red"
          description="Low match scores"
        />
        <SummaryCard
          icon={<Video className="w-6 h-6" />}
          label="Video Screening"
          count={decisions.totals.video_screening_count}
          color="blue"
          description="Good candidates"
        />
        <SummaryCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Fast-Track"
          count={decisions.totals.fast_track_count}
          color="green"
          description="Top candidates"
        />
        <SummaryCard
          icon={<Clock className="w-6 h-6" />}
          label="Time Saved"
          count={`${Math.round(decisions.totals.total_pending * 5 / 60)}h`}
          color="purple"
          description="With one click"
        />
      </div>

      {/* Main Action Area */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              AI Recommendations Ready
            </h2>
            <p className="text-gray-600">
              The AI has analyzed {decisions.totals.total_pending} applications and made recommendations.
            </p>
          </div>
          <button
            onClick={handleApproveAll}
            disabled={approving || selectedDecisions.size === 0}
            className={`
              px-8 py-4 rounded-lg font-bold text-lg shadow-lg transform transition-all
              ${approving || selectedDecisions.size === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 hover:shadow-xl'
              }
            `}
          >
            {approving ? (
              <span className="flex items-center">
                <Clock className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Approve All ({selectedDecisions.size})
              </span>
            )}
          </button>
        </div>

        {/* What Will Happen Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            What happens when you click "Approve All"?
          </h3>
          <ul className="space-y-2 text-blue-900">
            {decisions.totals.auto_reject_count > 0 && (
              <li className="flex items-start">
                <span className="mr-2">✉️</span>
                <span><strong>{decisions.totals.auto_reject_count}</strong> kind rejection emails will be sent to unqualified candidates</span>
              </li>
            )}
            {decisions.totals.video_screening_count > 0 && (
              <li className="flex items-start">
                <span className="mr-2">🎥</span>
                <span><strong>{decisions.totals.video_screening_count}</strong> video screening invitations will be sent to qualified candidates</span>
              </li>
            )}
            {decisions.totals.fast_track_count > 0 && (
              <li className="flex items-start">
                <span className="mr-2">⚡</span>
                <span><strong>{decisions.totals.fast_track_count}</strong> top candidates will be invited directly to interview</span>
              </li>
            )}
            <li className="flex items-start">
              <span className="mr-2">⏱️</span>
              <span>You'll save approximately <strong>{Math.round(decisions.totals.total_pending * 5 / 60)} hours</strong> of manual work</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Individual Decisions - Expandable Sections */}
      <div className="space-y-4">
        {/* Auto-Reject Section */}
        {decisions.summary.auto_reject.length > 0 && (
          <DecisionSection
            title="Auto-Reject"
            count={decisions.summary.auto_reject.length}
            decisions={decisions.summary.auto_reject}
            expanded={expandedSections.has('reject')}
            onToggle={() => toggleSection('reject')}
            color="red"
            icon={<XCircle className="w-5 h-5" />}
          />
        )}

        {/* Video Screening Section */}
        {decisions.summary.send_video_screening.length > 0 && (
          <DecisionSection
            title="Send Video Screening Invitations"
            count={decisions.summary.send_video_screening.length}
            decisions={decisions.summary.send_video_screening}
            expanded={expandedSections.has('video')}
            onToggle={() => toggleSection('video')}
            color="blue"
            icon={<Video className="w-5 h-5" />}
          />
        )}

        {/* Fast-Track Section */}
        {decisions.summary.fast_track_interview.length > 0 && (
          <DecisionSection
            title="Fast-Track to Interview"
            count={decisions.summary.fast_track_interview.length}
            decisions={decisions.summary.fast_track_interview}
            expanded={expandedSections.has('fasttrack')}
            onToggle={() => toggleSection('fasttrack')}
            color="green"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        )}
      </div>

      {/* Time Savings Footer */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white text-center">
        <div className="text-3xl font-bold mb-2">
          ⚡ One Click = {Math.round(decisions.totals.total_pending * 5 / 60)} Hours Saved
        </div>
        <p className="text-purple-100">
          That's the power of Semi-Auto mode: AI does the analysis, you stay in control.
        </p>
      </div>
    </div>
  );
}

// Helper Components
function SummaryCard({ icon, label, count, color, description }: any) {
  const colorClasses = {
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg shadow-sm border p-6`}>
      <div className="flex items-center justify-between mb-3">
        {icon}
        <span className="text-3xl font-bold">{count}</span>
      </div>
      <div className="font-semibold mb-1">{label}</div>
      <div className="text-sm opacity-75">{description}</div>
    </div>
  );
}

function DecisionSection({ title, count, decisions, expanded, onToggle, color, icon }: any) {
  const colorClasses = {
    red: 'bg-red-50 border-red-300',
    blue: 'bg-blue-50 border-blue-300',
    green: 'bg-green-50 border-green-300'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg shadow-sm border-2`}>
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-opacity-80 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{count} candidates</p>
          </div>
        </div>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-3">
          {decisions.map((decision: AIDecision) => (
            <DecisionCard key={decision.decision_id} decision={decision} />
          ))}
        </div>
      )}
    </div>
  );
}

function DecisionCard({ decision }: { decision: AIDecision }) {
  const [expanded, setExpanded] = useState(false);
  const avatar = decision.candidate_name.split(' ').map((n: string) => n[0]).join('');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all transform hover:-translate-y-1 mb-4 group">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
            {avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {decision.candidate_name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                decision.decision_type === 'fast_track_interview' ? 'bg-green-100 text-green-700' :
                decision.decision_type === 'auto_reject' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {decision.decision_type?.replace(/_/g, ' ') || 'Process'}
              </span>
            </div>
            <p className="text-gray-600 font-medium">Applied for: {decision.job_title}</p>
            <div className="flex items-center mt-2 space-x-4">
               <div className="flex items-center text-sm text-gray-500">
                 <Clock className="w-4 h-4 mr-1 text-gray-400" />
                 {new Date(decision.created_at).toLocaleDateString()}
               </div>
               <div className="flex items-center text-sm text-green-600 font-bold bg-green-50 px-2 rounded">
                 <TrendingUp className="w-4 h-4 mr-1" />
                 {decision.ai_confidence}% Match
               </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="text-right">
             <div className="text-3xl font-black text-gray-900 leading-none">{decision.ai_confidence}%</div>
             <div className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">AI Score</div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center"
          >
            {expanded ? (
              <><span>Hide Analysis</span> <ChevronUp className="w-4 h-4 ml-1" /></>
            ) : (
              <><span>See Why</span> <ChevronDown className="w-4 h-4 ml-1" /></>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-dashed border-gray-200 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Evidence-Based Reasoning
              </h4>
              <p className="text-gray-700 leading-relaxed italic bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400">
                "{decision.ai_reasoning}"
              </p>
            </div>
            <div className="space-y-4">
               {decision.proposed_action?.details && (
                 <>
                   <div>
                     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Top Skills Found</h4>
                     <p className="text-gray-800 font-medium">{decision.proposed_action.details.skills || 'N/A'}</p>
                   </div>
                   {decision.proposed_action.details.missing_skills && (
                     <div>
                       <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Gaps Detected</h4>
                       <p className="text-red-700 font-medium">{decision.proposed_action.details.missing_skills.join(', ')}</p>
                     </div>
                   )}
                 </>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
