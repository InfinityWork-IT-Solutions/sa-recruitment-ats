import { useState } from 'react';
import { X, Sparkles, Mail, Calendar, Target, Zap, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface AIAgentConfig {
  auto_invite_enabled: boolean;
  match_threshold: number;
  max_invites_per_day: number;
  email_template: string;
  follow_up_enabled: boolean;
  follow_up_days: number;
}

interface ConfigureAIAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AIAgentConfig) => Promise<void>;
}

export default function ConfigureAIAgentModal({ isOpen, onClose, onSave }: ConfigureAIAgentProps) {
  const [step, setStep] = useState(1);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<AIAgentConfig>({
    defaultValues: {
      auto_invite_enabled: true,
      match_threshold: 85,
      max_invites_per_day: 10,
      email_template: `Hi {candidate_name},

I came across your profile and was impressed by your experience in {candidate_skills}.

We're currently hiring for a {job_title} position at {company_name}, and I think you'd be a great fit!

Here's what makes this opportunity special:
- Competitive salary: {salary_range}
- {work_mode} working arrangement
- {benefits}

Would you be interested in learning more?

Best regards,
{recruiter_name}`,
      follow_up_enabled: true,
      follow_up_days: 3,
    },
  });

  if (!isOpen) return null;

  const matchThreshold = watch('match_threshold');
  const maxInvites = watch('max_invites_per_day');
  const autoInviteEnabled = watch('auto_invite_enabled');
  const followUpEnabled = watch('follow_up_enabled');

  const handleSave = async (data: AIAgentConfig) => {
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving AI agent config:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Configure AI Agent</h2>
              <p className="text-purple-100 text-sm mt-1">
                Automate candidate outreach based on AI matching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="bg-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex space-x-8">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center space-x-2 ${
                step === 1 ? 'text-purple-600 font-semibold' : 'text-gray-500'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span>Matching Rules</span>
            </button>
            
            <button
              onClick={() => setStep(2)}
              className={`flex items-center space-x-2 ${
                step === 2 ? 'text-purple-600 font-semibold' : 'text-gray-500'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 2 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span>Email Template</span>
            </button>
            
            <button
              onClick={() => setStep(3)}
              className={`flex items-center space-x-2 ${
                step === 3 ? 'text-purple-600 font-semibold' : 'text-gray-500'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 3 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span>Review</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleSave)}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
            {/* Step 1: Matching Rules */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI Matching Rules</h3>

                {/* Enable Auto-Invite */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <input
                      {...register('auto_invite_enabled')}
                      type="checkbox"
                      className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <span>Enable Automated Outreach</span>
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        AI will automatically send interview invitations to top-matched candidates
                      </p>
                    </div>
                  </div>
                </div>

                {/* Match Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Match Score: <span className="text-purple-600 font-bold">{matchThreshold}%</span>
                  </label>
                  <input
                    {...register('match_threshold', { valueAsNumber: true })}
                    type="range"
                    min="70"
                    max="95"
                    step="5"
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>70% (More candidates)</span>
                    <span>95% (Perfect matches only)</span>
                  </div>
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Recommendation:</strong> 85% balance quality and quantity. Lower threshold = more outreach, higher = stricter matching.
                    </p>
                  </div>
                </div>

                {/* Max Invites Per Day */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Daily Invites: <span className="text-purple-600 font-bold">{maxInvites}</span>
                  </label>
                  <input
                    {...register('max_invites_per_day', { valueAsNumber: true })}
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5 per day (Conservative)</span>
                    <span>50 per day (Aggressive)</span>
                  </div>
                </div>

                {/* Follow-up Settings */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start space-x-4 mb-4">
                    <input
                      {...register('follow_up_enabled')}
                      type="checkbox"
                      className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">Automatic Follow-up</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Send a gentle reminder if candidate doesn't respond
                      </p>
                    </div>
                  </div>

                  {followUpEnabled && (
                    <div className="ml-9">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Follow-up after:
                      </label>
                      <select
                        {...register('follow_up_days', { valueAsNumber: true })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={2}>2 days</option>
                        <option value={3}>3 days</option>
                        <option value={5}>5 days</option>
                        <option value={7}>7 days</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Email Template */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Customize Email Template</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">✨ Available Variables:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                    <div><code className="bg-blue-100 px-2 py-1 rounded">{'{candidate_name}'}</code></div>
                    <div><code className="bg-blue-100 px-2 py-1 rounded">{'{candidate_skills}'}</code></div>
                    <div><code className="bg-blue-100 px-2 py-1 rounded">{'{job_title}'}</code></div>
                    <div><code className="bg-blue-100 px-2 py-1 rounded">{'{company_name}'}</code></div>
                    <div><code className="bg-blue-100 px-2 py-1 rounded">{'{salary_range}'}</code></div>
                    <div><code className="bg-blue-100 px-2 py-1 rounded">{'{work_mode}'}</code></div>
                    <div><code className="bg-blue-100 px-2 py-1 rounded">{'{benefits}'}</code></div>
                    <div><code className="bg-blue-100 px-2 py-1 rounded">{'{recruiter_name}'}</code></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template
                  </label>
                  <textarea
                    {...register('email_template')}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    placeholder="Write your personalized email template..."
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Use variables like {'{candidate_name}'} to personalize emails automatically
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span>Preview (with sample data)</span>
                  </h4>
                  <div className="bg-white border border-gray-300 rounded-lg p-4 text-sm whitespace-pre-wrap">
                    {watch('email_template')
                      .replace('{candidate_name}', 'John Doe')
                      .replace('{candidate_skills}', 'React, TypeScript, Node.js')
                      .replace('{job_title}', 'Senior Software Engineer')
                      .replace('{company_name}', 'Your Company')
                      .replace('{salary_range}', 'R400k - R600k')
                      .replace('{work_mode}', 'Hybrid')
                      .replace('{benefits}', 'Medical aid, pension, remote work')
                      .replace('{recruiter_name}', 'Your Name')}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Activate */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Review Configuration</h3>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
                  <h4 className="font-bold text-purple-900 text-lg mb-4 flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6" />
                    <span>Your AI Agent Settings</span>
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Auto-invite enabled:</span>
                      <span className={`font-bold ${autoInviteEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {autoInviteEnabled ? 'Yes ✓' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Minimum match score:</span>
                      <span className="font-bold text-purple-600">{matchThreshold}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Max daily invites:</span>
                      <span className="font-bold text-purple-600">{maxInvites}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Follow-up enabled:</span>
                      <span className={`font-bold ${followUpEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {followUpEnabled ? `Yes (after ${watch('follow_up_days')} days)` : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expected Impact */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Expected Impact</span>
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>✓ Up to <strong>{maxInvites} candidates</strong> contacted per day</li>
                    <li>✓ Only candidates with <strong>{matchThreshold}%+ match</strong> score</li>
                    <li>✓ Estimated <strong>30-40% response rate</strong> from matched candidates</li>
                    <li>✓ Average <strong>2-3 interviews</strong> scheduled per day</li>
                    <li>✓ Saves <strong>5-10 hours</strong> of manual outreach per week</li>
                  </ul>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Important:</strong> AI agent will start sending emails immediately after activation. 
                    Make sure your email template is finalized and professional.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{isSubmitting ? 'Activating...' : 'Activate AI Agent'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
