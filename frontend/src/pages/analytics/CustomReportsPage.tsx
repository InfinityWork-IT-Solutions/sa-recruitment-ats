import React, { useState } from 'react';
import { BarChart2, Download, Play, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';

const METRICS = [
  { id: 'applications', label: 'Applications' },
  { id: 'hires', label: 'Hires' },
  { id: 'rejections', label: 'Rejections' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'offers', label: 'Offers' },
  { id: 'source_breakdown', label: 'Source Breakdown' },
];

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

export default function CustomReportsPage() {
  const navigate = useNavigate();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['applications', 'hires']);
  const [groupBy, setGroupBy] = useState('month');
  const [periodDays, setPeriodDays] = useState(90);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const runReport = async () => {
    if (!selectedMetrics.length) return toast.error('Select at least one metric');
    setLoading(true);
    try {
      const res = await apiClient.post('/analytics/custom-report', {
        metrics: selectedMetrics,
        group_by: groupBy,
        period_days: periodDays,
      });
      setReportData(res.data);
    } catch {
      toast.error('Failed to run report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    const rows = [['Metric', 'Value']];
    const d = reportData.data;
    Object.entries(d).forEach(([k, v]) => {
      if (k !== 'by_month' && k !== 'source_breakdown') rows.push([k, String(v)]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'report.csv'; a.click();
  };

  const chartData = reportData?.data?.by_month?.map((m: any) => ({ month: m.month, count: m.count })) || [];
  const sourceData = reportData?.data?.source_breakdown
    ? Object.entries(reportData.data.source_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/company/analytics')} className="text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Custom Reports</h1>
              <p className="text-gray-500 text-sm mt-1">Build and run custom analytics reports</p>
            </div>
          </div>
          {reportData && (
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4" />Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Config Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Metrics</h3>
            <div className="space-y-2">
              {METRICS.map(m => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedMetrics.includes(m.id)} onChange={() => toggleMetric(m.id)}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Options</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Group By</label>
              <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="none">No grouping</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Period</label>
              <select value={periodDays} onChange={e => setPeriodDays(parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 6 months</option>
                <option value={365}>Last year</option>
              </select>
            </div>
          </div>

          <button onClick={runReport} disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Running...' : 'Run Report'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          {!reportData ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
              <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">Configure & run your report</h3>
              <p className="text-gray-500 text-sm mt-1">Select metrics on the left and click Run Report</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(reportData.data)
                  .filter(([k]) => !['by_month', 'source_breakdown'].includes(k))
                  .map(([key, value]) => (
                    <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">{String(value)}</div>
                      <div className="text-sm text-gray-500 mt-1 capitalize">{key.replace('_', ' ')}</div>
                    </div>
                  ))}
              </div>

              {/* Trend chart */}
              {chartData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Trend by Month</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Source breakdown */}
              {sourceData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Source Breakdown</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
