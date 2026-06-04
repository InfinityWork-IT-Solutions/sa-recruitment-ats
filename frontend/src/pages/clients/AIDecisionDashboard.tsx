/**
 * RecruitPro SA - AI Decision Queue Dashboard
 * Semi-Auto Mode: AI recommends, you decide — individually or in bulk.
 */

import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, AlertCircle, Clock, TrendingUp,
  Video, Calendar, Send, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, Loader2, User, Briefcase,
  CheckSquare, Square, Info
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

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

type CardState = 'pending' | 'approving' | 'approved' | 'overriding' | 'overridden';

const OVERRIDE_REASONS = [
  { value: 'needs_review', label: 'Keep for manual review' },
  { value: 'disagree_ai', label: "I disagree with the AI's assessment" },
  { value: 'already_handled', label: 'Already handled this candidate' },
  { value: 'not_enough_info', label: 'Not enough information yet' },
  { value: 'other', label: 'Other reason' },
];

export default function AIDecisionDashboard() {
  const [decisions, setDecisions] = useState<PendingDecisions | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['reject', 'video', 'fasttrack'])
  );
  const [approvingAll, setApprovingAll] = useState(false);

  useEffect(() => { fetchPendingDecisions(); }, []);

  const fetchPendingDecisions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/decisions/pending');
      const data = response.data;
      if (data?.totals) {
        setDecisions(data);
        const allIds = new Set<string>(data.all_decisions.map((d: AIDecision) => d.decision_id));
        setSelectedIds(allIds);
        setCardStates({});
      } else {
        setDecisions(null);
      }
    } catch {
      setDecisions(null);
    } finally {
      setLoading(false);
    }
  };

  const setCardState = (id: string, state: CardState) =>
    setCardStates(prev => ({ ...prev, [id]: state }));

  const handleApproveOne = async (decision: AIDecision) => {
    setCardState(decision.decision_id, 'approving');
    try {
      await apiClient.post('/decisions/approve-single', { decision_id: decision.decision_id });
      setCardState(decision.decision_id, 'approved');
      setSelectedIds(prev => { const n = new Set(prev); n.delete(decision.decision_id); return n; });
      toast.success(`Approved: ${decision.candidate_name}`);
    } catch {
      setCardState(decision.decision_id, 'pending');
      toast.error('Failed to approve. Please try again.');
    }
  };

  const handleOverrideOne = async (decision: AIDecision, reason: string) => {
    setCardState(decision.decision_id, 'overriding');
    try {
      await apiClient.post('/decisions/reject', { decision_id: decision.decision_id, reason });
      setCardState(decision.decision_id, 'overridden');
      setSelectedIds(prev => { const n = new Set(prev); n.delete(decision.decision_id); return n; });
      toast(`Overridden: ${decision.candidate_name} — kept for manual review`, { icon: '↩️' });
    } catch {
      setCardState(decision.decision_id, 'pending');
      toast.error('Failed to override. Please try again.');
    }
  };

  const handleApproveSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Approve ${selectedIds.size} selected decision${selectedIds.size > 1 ? 's' : ''}? These actions will execute immediately.`)) return;
    setApprovingAll(true);
    try {
      const response = await apiClient.post('/decisions/approve-all', {
        decision_ids: Array.from(selectedIds),
      });
      if (response.data?.success) {
        const count = response.data.executed_count;
        toast.success(`${count} decision${count > 1 ? 's' : ''} executed — ~${Math.round(count * 5 / 60 * 10) / 10}h saved!`);
        await fetchPendingDecisions();
      }
    } catch {
      toast.error('Failed to approve decisions. Please try again.');
    } finally {
      setApprovingAll(false);
    }
  };

  const toggleSection = (s: string) =>
    setExpandedSections(prev => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const activeDecisions = decisions?.all_decisions.filter(
    d => !['approved', 'overridden'].includes(cardStates[d.decision_id] ?? 'pending')
  ) ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading AI decisions…</p>
        </div>
      </div>
    );
  }

  if (!decisions || decisions.totals.total_pending === 0 || activeDecisions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="card py-16">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
          <p className="text-gray-500 mb-6">No pending AI recommendations. The AI is constantly analysing new applications.</p>
          <button onClick={fetchPendingDecisions} className="text-blue-600 font-semibold hover:underline">
            Check for new decisions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">AI Decision Queue</h1>
            <p className="text-blue-100 text-sm">AI recommends — you have full control over each decision</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{activeDecisions.length}</div>
            <div className="text-blue-200 text-sm">Pending</div>
          </div>
        </div>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Auto-Reject', count: decisions.summary.auto_reject.length, icon: <XCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'Video Screening', count: decisions.summary.send_video_screening.length, icon: <Video className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Fast-Track', count: decisions.summary.fast_track_interview.length, icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-600 bg-green-50 border-green-200' },
        ].map(c => (
          <div key={c.label} className={`card border ${c.color} flex items-center gap-3 py-4`}>
            <span className={c.color.split(' ')[0]}>{c.icon}</span>
            <div>
              <div className="text-xl font-bold">{c.count}</div>
              <div className="text-xs font-medium opacity-80">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk action bar */}
      <div className="card flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const all = new Set<string>(activeDecisions.map(d => d.decision_id));
              setSelectedIds(prev => prev.size === all.size ? new Set() : all);
            }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 font-medium"
          >
            {selectedIds.size === activeDecisions.length
              ? <CheckSquare className="w-4 h-4 text-blue-600" />
              : <Square className="w-4 h-4" />
            }
            {selectedIds.size === activeDecisions.length ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-sm text-gray-400">{selectedIds.size} of {activeDecisions.length} selected</span>
        </div>

        <button
          onClick={handleApproveSelected}
          disabled={approvingAll || selectedIds.size === 0}
          className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
        >
          {approvingAll
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            : <><CheckCircle className="w-4 h-4" /> Approve Selected ({selectedIds.size})</>
          }
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <div>
          <strong>How it works:</strong> Tick the candidates you agree with, then click "Approve Selected".
          For any candidate the AI got wrong, click <strong>Override</strong> to dismiss and handle them yourself.
          You can also approve one at a time using the individual <strong>Approve</strong> button.
        </div>
      </div>

      {/* Decision sections */}
      {[
        { key: 'reject', title: 'Auto-Reject', decisions: decisions.summary.auto_reject, icon: <XCircle className="w-5 h-5 text-red-500" />, sectionColor: 'border-red-200 bg-red-50' },
        { key: 'video', title: 'Send Video Screening', decisions: decisions.summary.send_video_screening, icon: <Video className="w-5 h-5 text-blue-500" />, sectionColor: 'border-blue-200 bg-blue-50' },
        { key: 'fasttrack', title: 'Fast-Track to Interview', decisions: decisions.summary.fast_track_interview, icon: <TrendingUp className="w-5 h-5 text-green-500" />, sectionColor: 'border-green-200 bg-green-50' },
      ].filter(s => s.decisions.length > 0).map(section => (
        <div key={section.key} className={`rounded-xl border-2 overflow-hidden ${section.sectionColor}`}>
          {/* Section header */}
          <button
            onClick={() => toggleSection(section.key)}
            className="w-full flex items-center justify-between p-5 hover:bg-black/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              {section.icon}
              <div className="text-left">
                <h3 className="font-bold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-500">{section.decisions.length} candidate{section.decisions.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {expandedSections.has(section.key) ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {/* Cards */}
          {expandedSections.has(section.key) && (
            <div className="px-5 pb-5 space-y-3">
              {section.decisions.map(decision => (
                <DecisionCard
                  key={decision.decision_id}
                  decision={decision}
                  state={cardStates[decision.decision_id] ?? 'pending'}
                  selected={selectedIds.has(decision.decision_id)}
                  onToggleSelect={() => toggleSelect(decision.decision_id)}
                  onApprove={() => handleApproveOne(decision)}
                  onOverride={(reason) => handleOverrideOne(decision, reason)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Individual Decision Card ──────────────────────────────────────────────────

function DecisionCard({
  decision, state, selected, onToggleSelect, onApprove, onOverride,
}: {
  decision: AIDecision;
  state: CardState;
  selected: boolean;
  onToggleSelect: () => void;
  onApprove: () => void;
  onOverride: (reason: string) => void;
}) {
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const initials = decision.candidate_name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const isApproved = state === 'approved';
  const isOverridden = state === 'overridden';
  const isDone = isApproved || isOverridden;

  return (
    <div className={`bg-white rounded-xl border transition-all transform hover:-translate-y-0.5 hover:shadow-lg group mb-1 ${
      isApproved ? 'border-green-300 opacity-60' :
      isOverridden ? 'border-gray-300 opacity-50' :
      selected ? 'border-blue-300 shadow-sm' : 'border-gray-200'
    }`}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={onToggleSelect}
            disabled={isDone}
            className="mt-2 shrink-0 disabled:opacity-40"
          >
            {selected && !isDone
              ? <CheckSquare className="w-5 h-5 text-blue-600" />
              : <Square className="w-5 h-5 text-gray-400" />
            }
          </button>

          {/* Avatar */}
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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
              {isApproved && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Approved ✓</span>}
              {isOverridden && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">Overridden ↩</span>}
            </div>
            <p className="text-gray-600 font-medium text-sm mt-0.5">Applied for: {decision.job_title}</p>
            <div className="flex items-center mt-2 gap-4 flex-wrap">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                {new Date(decision.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-green-600 font-bold bg-green-50 px-2 rounded">
                <TrendingUp className="w-4 h-4 mr-1" />
                {decision.ai_confidence}% Match
              </div>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <User className="w-3 h-3" />{decision.candidate_email}
              </span>
            </div>
          </div>

          {/* Right: AI Score + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900 leading-none">{decision.ai_confidence}%</div>
              <div className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">AI Score</div>
            </div>

            {!isDone && (
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={onApprove}
                  disabled={state === 'approving'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-60 transition-all"
                >
                  {state === 'approving'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <ThumbsUp className="w-3.5 h-3.5" />
                  }
                  Approve
                </button>

                <button
                  onClick={() => setShowOverrideMenu(v => !v)}
                  disabled={state === 'overriding'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 disabled:opacity-60 transition-all"
                >
                  {state === 'overriding'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <ThumbsDown className="w-3.5 h-3.5" />
                  }
                  Override
                </button>

                {showOverrideMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowOverrideMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1.5">
                      <p className="text-xs font-semibold text-gray-500 px-3 py-1.5 uppercase tracking-wide">Override reason</p>
                      {OVERRIDE_REASONS.map(r => (
                        <button
                          key={r.value}
                          onClick={() => { setShowOverrideMenu(false); onOverride(r.value); }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => setExpanded(v => !v)}
              className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center"
            >
              {expanded
                ? <><span>Hide Analysis</span><ChevronUp className="w-4 h-4 ml-1" /></>
                : <><span>See Why</span><ChevronDown className="w-4 h-4 ml-1" /></>
              }
            </button>
          </div>
        </div>

        {/* Expandable AI Analysis */}
        {expanded && (
          <div className="mt-5 pt-5 border-t border-dashed border-gray-200">
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
              {decision.proposed_action?.details && (
                <div className="space-y-4">
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
