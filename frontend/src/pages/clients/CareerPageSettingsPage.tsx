import React, { useState, useEffect } from 'react';
import { Globe, Eye, EyeOff, Copy, Check, Plus, Trash2, Palette, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

const DEFAULT_PERKS = [
  { icon: '🏥', title: 'Medical Aid', description: 'Comprehensive medical aid for you and your family' },
  { icon: '📈', title: 'Growth Opportunities', description: 'Clear career progression and learning budget' },
  { icon: '🏡', title: 'Flexible Work', description: 'Hybrid work arrangement available' },
];

export default function CareerPageSettingsPage() {
  const [page, setPage] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    headline: '',
    tagline: '',
    primary_color: '#2563eb',
    culture_description: '',
    show_perks: true,
    perks: DEFAULT_PERKS,
    is_published: false,
    seo_title: '',
    seo_description: '',
  });

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      const res = await apiClient.get('/company/career-page');
      setPage(res.data);
      setForm({
        headline: res.data.headline || '',
        tagline: res.data.tagline || '',
        primary_color: res.data.primary_color || '#2563eb',
        culture_description: res.data.culture_description || '',
        show_perks: res.data.show_perks ?? true,
        perks: res.data.perks?.length ? res.data.perks : DEFAULT_PERKS,
        is_published: res.data.is_published || false,
        seo_title: res.data.seo_title || '',
        seo_description: res.data.seo_description || '',
      });
    } catch {
      toast.error('Failed to load career page settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put('/company/career-page', form);
      setPage(res.data);
      toast.success('Career page saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const copyPublicUrl = () => {
    const url = `${window.location.origin}/p/${page?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addPerk = () => setForm(f => ({ ...f, perks: [...f.perks, { icon: '⭐', title: 'New Perk', description: '' }] }));
  const removePerk = (i: number) => setForm(f => ({ ...f, perks: f.perks.filter((_, idx) => idx !== i) }));
  const updatePerk = (i: number, field: string, value: string) =>
    setForm(f => ({ ...f, perks: f.perks.map((p, idx) => idx === i ? { ...p, [field]: value } : p) }));

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Career Page Builder</h1>
            <p className="text-gray-500 text-sm mt-1">Your public-facing branded jobs page</p>
          </div>
          <div className="flex items-center gap-3">
            {page?.slug && (
              <button onClick={copyPublicUrl} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
            )}
            {page?.slug && (
              <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                <Globe className="w-4 h-4" />
                Preview
              </a>
            )}
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Publish toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Page Status</h3>
                <p className="text-sm text-gray-500 mt-0.5">{form.is_published ? 'Publicly visible' : 'Hidden from public'}</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${form.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {form.is_published ? <><Eye className="w-4 h-4" />Published</> : <><EyeOff className="w-4 h-4" />Draft</>}
              </button>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Branding</h3>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Headline</label>
              <input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Join Our Team" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tagline</label>
              <textarea value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2}
                placeholder="We're building something amazing..." />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2"><Palette className="w-4 h-4" />Brand Colour</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                <span className="text-sm text-gray-600">{form.primary_color}</span>
              </div>
            </div>
          </div>

          {/* Culture */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Culture</h3>
            <textarea value={form.culture_description} onChange={e => setForm(f => ({ ...f, culture_description: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4}
              placeholder="Describe your company culture, values, and what makes you a great employer..." />
          </div>

          {/* Perks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Perks & Benefits</h3>
              <button onClick={addPerk} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Plus className="w-4 h-4" />Add
              </button>
            </div>
            {form.perks.map((perk, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input value={perk.icon} onChange={e => updatePerk(i, 'icon', e.target.value)}
                    className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-center text-lg" maxLength={2} />
                  <input value={perk.title} onChange={e => updatePerk(i, 'title', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Perk title" />
                  <button onClick={() => removePerk(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <input value={perk.description} onChange={e => updatePerk(i, 'description', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Short description" />
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-gray-100 border-b flex items-center gap-2">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" /></div>
              <span className="text-xs text-gray-500 ml-2">Preview — /p/{page?.slug}</span>
            </div>
            <div className="p-6">
              <div className="py-8 px-4 rounded-xl mb-6 text-center" style={{ background: `linear-gradient(135deg, ${form.primary_color}22, ${form.primary_color}44)`, borderLeft: `4px solid ${form.primary_color}` }}>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{form.headline || 'Join Our Team'}</h2>
                <p className="text-gray-600 text-sm">{form.tagline || "We're building something amazing..."}</p>
              </div>
              {form.culture_description && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Our Culture</h4>
                  <p className="text-xs text-gray-600 line-clamp-3">{form.culture_description}</p>
                </div>
              )}
              {form.show_perks && form.perks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm mb-3">Benefits</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {form.perks.slice(0, 4).map((p, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-xl mb-1">{p.icon}</div>
                        <div className="text-xs font-medium text-gray-700">{p.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
