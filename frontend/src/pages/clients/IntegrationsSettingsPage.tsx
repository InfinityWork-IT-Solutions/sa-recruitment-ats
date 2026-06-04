import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Settings, ExternalLink, RefreshCw, AlertCircle, AlertTriangle, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';
import { LinkedInLogo, IndeedLogo, PNetLogo } from '@/components/logos/PlatformLogos';

interface Integration {
  platform: 'pnet' | 'indeed' | 'linkedin';
  connected: boolean;
  status: 'active' | 'inactive' | 'error';
  api_key?: string;
  last_sync?: string;
  active_jobs?: number;
  total_applications?: number;
}

const CREDENTIAL_FIELDS: Record<string, { key: string; label: string; placeholder: string; secret?: boolean; required: boolean }[]> = {
  pnet: [
    { key: 'api_key', label: 'API Key', placeholder: 'pnet_key_xxxxxxxxxxxxxxxx', secret: true, required: true },
    { key: 'api_secret', label: 'API Secret', placeholder: 'pnet_secret_xxxxxxxxxxxxxxxx', secret: true, required: false },
  ],
  indeed: [
    { key: 'publisher_id', label: 'Publisher ID', placeholder: '1234567890123456', secret: false, required: true },
    { key: 'api_token', label: 'API Token', placeholder: 'your_indeed_api_token', secret: true, required: true },
  ],
  linkedin: [
    { key: 'company_id', label: 'Company ID', placeholder: '12345678', secret: false, required: true },
    { key: 'access_token', label: 'Access Token', placeholder: 'AQV...your_linkedin_access_token', secret: true, required: true },
  ],
};

export default function IntegrationsSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturnTo = searchParams.get('returnTo');
  // Only allow relative paths to prevent open-redirect attacks
  const returnTo = rawReturnTo?.startsWith('/') ? rawReturnTo : null;
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await apiClient.get('/integrations');
      setIntegrations(response.data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    setSelectedPlatform(platform);
    setCredentialValues({});
    setShowSecrets({});
    setShowConnectModal(true);
  };

  const handleSaveCredentials = async () => {
    if (!selectedPlatform) return;
    const fields = CREDENTIAL_FIELDS[selectedPlatform] || [];
    const missing = fields.filter(f => f.required && !credentialValues[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/integrations/${selectedPlatform}/connect`, credentialValues);
      toast.success(`${platformInfo[selectedPlatform as keyof typeof platformInfo]?.name} connected successfully!`);
      setShowConnectModal(false);
      fetchIntegrations();
      // Return the user to where they were creating a job post
      if (returnTo) {
        navigate(`${returnTo}?openDraft=1`);
      }
    } catch {
      toast.error('Failed to save credentials. Please check and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await apiClient.post(`/integrations/${platform}/disconnect`);
      toast.success(`${platformInfo[platform as keyof typeof platformInfo]?.name || platform} disconnected successfully`);
      setConfirmDisconnect(null);
      fetchIntegrations();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect integration');
    }
  };

  const handleSync = async (platform: string) => {
    setSyncing(platform);
    try {
      await apiClient.post(`/integrations/${platform}/sync`);
      toast.success(`${platformInfo[platform as keyof typeof platformInfo]?.name || platform} synced successfully`);
      fetchIntegrations();
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Failed to sync integration');
    } finally {
      setSyncing(null);
    }
  };

  const platformInfo = {
    pnet: {
      name: 'PNet',
      description: "South Africa's #1 job board",
      Logo: PNetLogo,
      color: 'blue',
      setupInstructions: [
        '1. Sign up for PNet Business Account at pnet.co.za',
        '2. Contact PNet support to request API access',
        '3. Copy your API credentials and paste them below',
        '4. Test connection and start posting jobs!',
      ],
    },
    indeed: {
      name: 'Indeed',
      description: "World's #1 job site",
      Logo: IndeedLogo,
      color: 'green',
      setupInstructions: [
        '1. Sign up for Indeed Publisher at employers.indeed.com',
        '2. Submit your job feed URL for approval',
        '3. Once approved, jobs will automatically sync',
        '4. Candidates will be redirected to RecruitPro to apply',
      ],
    },
    linkedin: {
      name: 'LinkedIn Jobs',
      description: 'Professional network',
      Logo: LinkedInLogo,
      color: 'purple',
      setupInstructions: [
        '1. Subscribe to LinkedIn Talent Solutions',
        '2. Request API access from LinkedIn',
        '3. Complete OAuth authentication',
        '4. Start posting to LinkedIn',
      ],
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Return-to-job-post banner */}
      {returnTo && (
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3">
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium flex-1">
            You came from your job post. Connect the integration below, then you'll be taken straight back to where you left off.
          </p>
          <button
            onClick={() => navigate(`${returnTo}?openDraft=1`)}
            className="text-xs font-bold underline underline-offset-2 whitespace-nowrap hover:text-blue-100"
          >
            Go back without connecting
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Job Board Integrations</h1>
          <p className="text-gray-600 mt-1">
            Connect to job boards to expand your reach. Candidates will apply through RecruitPro SA.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Integration Cards */}
        <div className="space-y-6">
          {Object.entries(platformInfo).map(([key, info]) => {
            const integration = integrations.find(i => i.platform === key);
            const isConnected = integration?.connected || false;

            return (
              <div
                key={key}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Logo */}
                    <info.Logo size={48} className="rounded-lg flex-shrink-0" />

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{info.name}</h2>
                        {isConnected ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Connected</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold flex items-center space-x-1">
                            <XCircle className="w-4 h-4" />
                            <span>Not Connected</span>
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-4">{info.description}</p>

                      {isConnected && integration && (
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm text-blue-600 font-medium">Last Sync</p>
                            <p className="text-lg font-bold text-blue-900">
                              {integration.last_sync || 'Never'}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-sm text-green-600 font-medium">Active Jobs</p>
                            <p className="text-lg font-bold text-green-900">
                              {integration.active_jobs || 0}
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-sm text-purple-600 font-medium">Applications</p>
                            <p className="text-lg font-bold text-purple-900">
                              {integration.total_applications || 0}
                            </p>
                          </div>
                        </div>
                      )}

                      {!isConnected && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Setup Instructions:</h4>
                          <ol className="space-y-1 text-sm text-gray-600">
                            {info.setupInstructions.map((instruction, index) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleSync(key)}
                          disabled={syncing === key}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all flex items-center space-x-2 disabled:opacity-60"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncing === key ? 'animate-spin' : ''}`} />
                          <span>{syncing === key ? 'Syncing...' : 'Sync Now'}</span>
                        </button>
                        <button
                          onClick={() => handleConnect(key)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Configure</span>
                        </button>
                        <button
                          onClick={() => setConfirmDisconnect(key)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(key)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>Connect {info.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">How Integrations Work</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Post jobs to multiple platforms with one click</li>
                <li>✓ All candidates are redirected back to RecruitPro SA to apply</li>
                <li>✓ Manage all applications in one centralized dashboard</li>
                <li>✓ Track which platforms bring the best candidates</li>
                <li>✓ Close job on RecruitPro = automatically closed on all platforms</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Application URL Info */}
        <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <h3 className="font-bold text-green-900 mb-2">📍 Your Application URLs</h3>
          <p className="text-sm text-green-800 mb-3">
            Candidates from job boards will be redirected to these URLs to apply:
          </p>
          <div className="space-y-2 text-sm font-mono bg-white border border-green-300 rounded-lg p-4">
            <div>
              <span className="text-gray-600">Direct Apply:</span>
              <span className="text-green-700 ml-2">https://recruitpro.co.za/jobs/[JOB_ID]/apply</span>
            </div>
            <div>
              <span className="text-gray-600">With Source Tracking:</span>
              <span className="text-green-700 ml-2">https://recruitpro.co.za/jobs/[JOB_ID]/apply?source=pnet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Disconnect Modal */}
      {confirmDisconnect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Disconnect {platformInfo[confirmDisconnect as keyof typeof platformInfo]?.name}?</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Active jobs posted to {platformInfo[confirmDisconnect as keyof typeof platformInfo]?.name} will be removed from that platform. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDisconnect(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDisconnect(confirmDisconnect)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect / Configure Modal — credentials form */}
      {showConnectModal && selectedPlatform && (() => {
        const info = platformInfo[selectedPlatform as keyof typeof platformInfo];
        const fields = CREDENTIAL_FIELDS[selectedPlatform] || [];
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {info?.Logo && <info.Logo size={36} className="rounded-lg flex-shrink-0" />}
                  <div>
                    <h2 className="text-lg font-bold text-white">Connect {info?.name}</h2>
                    <p className="text-blue-100 text-sm mt-0.5">{info?.description}</p>
                  </div>
                </div>
                <button onClick={() => setShowConnectModal(false)} className="text-white hover:bg-white/20 rounded-full p-1.5 transition-all">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Setup steps (condensed) */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Setup steps</p>
                  <ol className="space-y-1.5">
                    {info?.setupInstructions.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                        {step.replace(/^\d+\.\s/, '')}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Credentials form */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="w-4 h-4 text-gray-600" />
                    <p className="text-sm font-bold text-gray-800">Enter your API credentials</p>
                  </div>
                  <div className="space-y-3">
                    {fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={field.secret && !showSecrets[field.key] ? 'password' : 'text'}
                            value={credentialValues[field.key] || ''}
                            onChange={e => setCredentialValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 font-mono"
                          />
                          {field.secret && (
                            <button
                              type="button"
                              onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">Credentials are stored securely and are only used to post jobs and sync applications on your behalf.</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowConnectModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCredentials}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : 'Save & Connect'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

