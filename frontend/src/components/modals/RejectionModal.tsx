import { useState } from 'react';
import { X, XCircle, Mail } from 'lucide-react';

export const REJECTION_REASONS = [
  { value: 'skills_mismatch', label: 'Skills mismatch' },
  { value: 'overqualified', label: 'Overqualified' },
  { value: 'underqualified', label: 'Underqualified' },
  { value: 'salary_mismatch', label: 'Salary expectations not aligned' },
  { value: 'culture_fit', label: 'Culture fit concerns' },
  { value: 'position_filled', label: 'Position already filled' },
  { value: 'no_response', label: 'No response from candidate' },
  { value: 'other', label: 'Other' },
];

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, feedback: string, sendEmail: boolean) => Promise<void> | void;
  candidateName?: string;
  loading?: boolean;
}

export default function RejectionModal({ isOpen, onClose, onConfirm, candidateName, loading }: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await onConfirm(reason, feedback, sendEmail);
      setReason('');
      setFeedback('');
      setSendEmail(false);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Reject Application</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {candidateName && (
          <p className="text-sm text-gray-600 mb-5">
            Rejecting application from <strong>{candidateName}</strong>
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">Select a reason...</option>
              {REJECTION_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Message <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
              placeholder="Provide constructive feedback for the candidate..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setSendEmail(v => !v)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${sendEmail ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${sendEmail ? 'translate-x-4' : ''}`} />
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">Send feedback email to candidate</span>
            </div>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            disabled={!reason || submitting || loading}
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            {submitting || loading ? 'Rejecting...' : 'Reject Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
