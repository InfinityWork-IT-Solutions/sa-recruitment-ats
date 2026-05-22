import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

const TRIGGER_LABELS: Record<string, string> = {
  application_received: 'When application received',
  shortlisted: 'When candidate shortlisted',
  after_interview: 'After interview completed',
  offer_made: 'When offer made',
  rejected: 'When candidate rejected',
};

const TRIGGER_COLORS: Record<string, string> = {
  application_received: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-green-100 text-green-700',
  after_interview: 'bg-purple-100 text-purple-700',
  offer_made: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function EmailSequencesPage() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newSeq, setNewSeq] = useState({ name: '', trigger_event: 'application_received', steps: [{ delay_hours: 0, subject: '', body_template: '' }] });

  useEffect(() => { fetchSequences(); }, []);

  const fetchSequences = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/email-sequences');
      setSequences(Array.isArray(res.data) ? res.data : []);
    } catch { setSequences([]); } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newSeq.name.trim()) return toast.error('Name required');
    try {
      await apiClient.post('/email-sequences', newSeq);
      toast.success('Sequence created!');
      setShowCreateForm(false);
      setNewSeq({ name: '', trigger_event: 'application_received', steps: [{ delay_hours: 0, subject: '', body_template: '' }] });
      fetchSequences();
    } catch { toast.error('Failed to create sequence'); }
  };

  const handleToggle = async (seq: any) => {
    try {
      await apiClient.put(`/email-sequences/${seq.id}`, { is_active: !seq.is_active });
      setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, is_active: !s.is_active } : s));
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sequence?')) return;
    try {
      await apiClient.delete(`/email-sequences/${id}`);
      setSequences(prev => prev.filter(s => s.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const addStep = () => setNewSeq(s => ({ ...s, steps: [...s.steps, { delay_hours: 24, subject: '', body_template: '' }] }));
  const removeStep = (i: number) => setNewSeq(s => ({ ...s, steps: s.steps.filter((_, idx) => idx !== i) }));
  const updateStep = (i: number, field: string, value: any) =>
    setNewSeq(s => ({ ...s, steps: s.steps.map((step, idx) => idx === i ? { ...step, [field]: value } : step) }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Sequences</h1>
            <p className="text-gray-500 text-sm mt-1">Automated multi-step email drip campaigns</p>
          </div>
          <button onClick={() => setShowCreateForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />New Sequence
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-6 space-y-4">
        {/* Create form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl border-2 border-blue-300 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">New Email Sequence</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Sequence Name</label>
                <input value={newSeq.name} onChange={e => setNewSeq(s => ({ ...s, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Application Confirmation" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Trigger</label>
                <select value={newSeq.trigger_event} onChange={e => setNewSeq(s => ({ ...s, trigger_event: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Steps</h4>
                <button onClick={addStep} className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"><Plus className="w-3 h-3" />Add Step</button>
              </div>
              {newSeq.steps.map((step, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Step {i + 1}</span>
                    {i > 0 && <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1"><Clock className="w-3 h-3 inline mr-1" />Delay (hours)</label>
                      <input type="number" value={step.delay_hours} onChange={e => updateStep(i, 'delay_hours', parseInt(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Subject</label>
                      <input value={step.subject} onChange={e => updateStep(i, 'subject', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email subject" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Body (use &#123;&#123;first_name&#125;&#125;, &#123;&#123;candidate_name&#125;&#125;)</label>
                    <textarea value={step.body_template} onChange={e => updateStep(i, 'body_template', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}
                      placeholder="Hi {{first_name}}, ..." />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Create Sequence</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : sequences.length === 0 && !showCreateForm ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No sequences yet</h3>
            <p className="text-gray-500 text-sm mt-1 mb-6">Automate candidate communication with multi-step email sequences.</p>
            <button onClick={() => setShowCreateForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Create First Sequence</button>
          </div>
        ) : (
          sequences.map(seq => (
            <div key={seq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{seq.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TRIGGER_COLORS[seq.trigger_event] || 'bg-gray-100 text-gray-600'}`}>
                        {TRIGGER_LABELS[seq.trigger_event]}
                      </span>
                      <span className="text-xs text-gray-500">{seq.steps_count} steps · {seq.active_enrollments} active</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(seq)} className={seq.is_active ? 'text-green-500' : 'text-gray-400'}>
                    {seq.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button onClick={() => setExpanded(expanded === seq.id ? null : seq.id)} className="text-gray-400 hover:text-gray-600">
                    {expanded === seq.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleDelete(seq.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expanded === seq.id && seq.steps?.length > 0 && (
                <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-2">
                  {seq.steps.map((step: any, i: number) => (
                    <div key={step.id} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <div>
                        <span className="font-medium text-gray-800">{step.subject}</span>
                        {step.delay_hours > 0 && <span className="text-gray-400 ml-2 text-xs">(after {step.delay_hours}h)</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
