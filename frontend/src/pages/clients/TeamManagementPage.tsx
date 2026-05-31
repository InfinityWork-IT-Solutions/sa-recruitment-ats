import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Mail, Shield, Trash2, Edit, Phone, Building2,
  CheckCircle, Clock, XCircle, CreditCard, AlertCircle, RefreshCw,
  ShieldCheck, ShieldAlert, X, Briefcase, Eye, Save, User
} from 'lucide-react';
import InviteTeamMemberModal from '@/components/modals/InviteTeamMemberModal';
import ChangeRoleModal from '@/components/modals/ChangeRoleModal';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department?: string;
  role: 'admin' | 'recruiter' | 'hiring_manager' | 'viewer';
  status: 'active' | 'invited' | 'inactive';
  is_verified?: boolean;
  last_active?: string;
  invited_at?: string;
  joined_at?: string;
}

interface TeamSeats {
  used: number;
  total: number;
  available: number;
  plan: string;
}

export default function TeamManagementPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [seats, setSeats] = useState<TeamSeats>({ used: 0, total: 0, available: 0, plan: '' });
  const [loading, setLoading] = useState(true);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // Detail / edit slide-over
  const [detailMember, setDetailMember] = useState<TeamMember | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', job_title: '', department: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await apiClient.get('/team/members');
      const data = response.data;
      // API may return { members: [...], seats: {...} } or a flat array
      const rawMembers: any[] = Array.isArray(data) ? data : (data.members ?? []);
      // Normalise fields so first_name / last_name are always strings
      const normalised: TeamMember[] = rawMembers.map((m: any) => ({
        id: m.id ?? m.user_id ?? '',
        first_name: m.first_name ?? m.name?.split(' ')[0] ?? '',
        last_name: m.last_name ?? m.name?.split(' ').slice(1).join(' ') ?? '',
        email: m.email ?? '',
        phone: m.phone ?? '',
        job_title: m.job_title ?? '',
        department: m.department ?? '',
        role: m.role ?? 'viewer',
        status: m.status ?? 'active',
        is_verified: m.is_verified ?? m.is_email_verified ?? true,
        last_active: m.last_active,
        invited_at: m.invited_at,
        joined_at: m.joined_at,
      }));
      setMembers(normalised.length > 0 ? normalised : mockMembers);
      setSeats(data.seats ?? mockSeats);
    } catch {
      // Backend endpoint not yet live — use mock so UI remains testable
      setMembers(mockMembers);
      setSeats(mockSeats);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (data: any) => {
    try {
      await apiClient.post('/team/invite', data);
      toast.success('Invitation sent successfully!');
      fetchTeamData();
    } catch {
      toast.error('Failed to send invitation. Please try again.');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await apiClient.patch(`/team/members/${memberId}/role`, { role: newRole });
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole as any } : m));
      toast.success('Role updated successfully!');
    } catch {
      toast.error('Failed to change role. Please try again.');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await apiClient.delete(`/team/members/${memberToRemove}`);
      setMembers(members.filter(m => m.id !== memberToRemove));
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
      toast.success('Team member removed.');
      fetchTeamData();
    } catch {
      toast.error('Failed to remove member. Please try again.');
    }
  };

  const handleResendInvitation = async (memberId: string) => {
    try {
      await apiClient.post(`/team/members/${memberId}/resend-invitation`);
      toast.success('Invitation resent!');
    } catch {
      toast.error('Failed to resend invitation.');
    }
  };

  const handleResendVerification = async (memberId: string) => {
    try {
      await apiClient.post(`/team/members/${memberId}/resend-verification`);
      toast.success('Verification email sent!');
    } catch {
      toast.error('Failed to send verification email.');
    }
  };

  const openDetail = (member: TeamMember) => {
    setDetailMember(member);
    setEditForm({ phone: member.phone || '', job_title: member.job_title || '', department: member.department || '' });
    setEditMode(false);
  };

  const handleSaveProfile = async () => {
    if (!detailMember) return;
    setSaving(true);
    try {
      await apiClient.patch(`/team/members/${detailMember.id}/profile`, editForm);
      const updated = { ...detailMember, ...editForm };
      setMembers(members.map(m => m.id === detailMember.id ? updated : m));
      setDetailMember(updated);
      setEditMode(false);
      toast.success('Profile updated.');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      recruiter: 'bg-blue-100 text-blue-700',
      hiring_manager: 'bg-purple-100 text-purple-700',
      viewer: 'bg-gray-100 text-gray-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'invited') return <Clock className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'text-green-600',
      invited: 'text-yellow-600',
      inactive: 'text-gray-500',
    };
    return colors[status] || 'text-gray-500';
  };

  const seatPercentage = seats.total > 0 ? (seats.used / seats.total) * 100 : 0;
  const progressColor = seatPercentage < 80 ? 'bg-green-500' : seatPercentage < 100 ? 'bg-yellow-500' : 'bg-red-500';

  const unverifiedCount = members.filter(m => m.is_verified === false).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage your team members, roles, and contact details</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          disabled={seats.available === 0}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-5 h-5" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Unverified warning */}
      {unverifiedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {unverifiedCount} team member{unverifiedCount > 1 ? 's' : ''} not yet verified
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              All users must verify their email for security. Click "View Details" on each member to resend verification.
            </p>
          </div>
        </div>
      )}

      {/* Seat stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Seats</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{seats.total}</div>
          <p className="text-xs text-gray-500 mt-1">{seats.plan} Plan</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Seats Used</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{seats.used}</div>
          <p className="text-xs text-gray-500 mt-1">{seatPercentage.toFixed(0)}% utilized</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className={`text-3xl font-bold ${seats.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {seats.available}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {seats.available > 0 ? 'Ready to invite' : 'No seats left'}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Verified</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {members.filter(m => m.is_verified !== false).length}
          </div>
          <p className="text-xs text-gray-500 mt-1">of {members.length} members</p>
        </div>
      </div>

      {/* Seat progress */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Seat Usage</h3>
          <span className="text-sm text-gray-600">{seats.used} / {seats.total} seats</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div className={`h-3 rounded-full transition-all ${progressColor}`} style={{ width: `${seatPercentage}%` }} />
        </div>
        {seats.available === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900">All seats full</p>
              <p className="text-xs text-yellow-700">Upgrade your plan to add more members.</p>
            </div>
            <button
              onClick={() => navigate('/company/settings/billing')}
              className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg font-medium hover:bg-yellow-700 flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Members list */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} total members</p>
        </div>

        <div className="divide-y divide-gray-100">
          {members.map((member) => (
            <div key={member.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                {/* Avatar + info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {member.first_name?.[0] ?? '?'}{member.last_name?.[0] ?? ''}
                    </div>
                    {/* Verification badge */}
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {member.is_verified === false ? (
                        <ShieldAlert className="w-4 h-4 text-amber-500 bg-white rounded-full" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-green-500 bg-white rounded-full" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">{member.first_name} {member.last_name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
                        {member.role.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(member.status)}
                        <span className={`text-xs font-medium capitalize ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </div>
                      {member.is_verified === false && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Unverified
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 truncate">{member.email}</p>

                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                      {member.job_title && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />{member.job_title}
                        </span>
                      )}
                      {member.department && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{member.department}
                        </span>
                      )}
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />{member.phone}
                        </span>
                      )}
                      {!member.job_title && !member.phone && (
                        <span className="text-amber-500">Profile incomplete — contact details missing</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
                      {member.status === 'active' && member.last_active && `Last active ${member.last_active}`}
                      {member.status === 'invited' && member.invited_at && `Invited ${member.invited_at}`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openDetail(member)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </button>

                  {member.status === 'invited' && (
                    <button
                      onClick={() => handleResendInvitation(member.id)}
                      className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resend
                    </button>
                  )}

                  <button
                    onClick={() => { setSelectedMember(member); setShowChangeRoleModal(true); }}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    Role
                  </button>

                  <button
                    onClick={() => { setMemberToRemove(member.id); setShowRemoveConfirm(true); }}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Member Detail Slide-Over ── */}
      {detailMember && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDetailMember(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Member Details</h2>
              <button onClick={() => setDetailMember(null)} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {detailMember.first_name?.[0] ?? '?'}{detailMember.last_name?.[0] ?? ''}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{detailMember.first_name} {detailMember.last_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleColor(detailMember.role)}`}>
                      {detailMember.role.replace(/_/g, ' ')}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-medium capitalize ${getStatusColor(detailMember.status)}`}>
                      {getStatusIcon(detailMember.status)}
                      {detailMember.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification status */}
              {detailMember.is_verified === false ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-900">Email not verified</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        This member must verify their email address before they can access all features. Send them a verification email.
                      </p>
                      <button
                        onClick={() => handleResendVerification(detailMember.id)}
                        className="mt-2 px-3 py-1.5 bg-amber-600 text-white text-xs rounded-lg font-medium hover:bg-amber-700 flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Send Verification Email
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                  <p className="text-sm font-semibold text-green-800">Email verified — account secure</p>
                </div>
              )}

              {/* Contact details */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Contact & Profile Info</h4>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                </div>

                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="+27 82 000 0000"
                          className="input pl-9 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Job Title</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={editForm.job_title}
                          onChange={e => setEditForm(f => ({ ...f, job_title: e.target.value }))}
                          placeholder="e.g. Senior Recruiter"
                          className="input pl-9 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={editForm.department}
                          onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                          placeholder="e.g. Human Resources"
                          className="input pl-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setEditMode(false)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <a href={`mailto:${detailMember.email}`} className="text-blue-600 hover:underline">{detailMember.email}</a>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      {detailMember.phone
                        ? <a href={`tel:${detailMember.phone}`} className="text-blue-600 hover:underline">{detailMember.phone}</a>
                        : <span className="text-amber-500 text-xs">No phone — click Edit to add</span>
                      }
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                      {detailMember.job_title || <span className="text-amber-500 text-xs">No job title — click Edit to add</span>}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                      {detailMember.department || <span className="text-amber-500 text-xs">No department — click Edit to add</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Activity */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-500">
                {detailMember.joined_at && (
                  <p>Joined: <span className="font-medium text-gray-700">{detailMember.joined_at}</span></p>
                )}
                {detailMember.last_active && (
                  <p>Last active: <span className="font-medium text-gray-700">{detailMember.last_active}</span></p>
                )}
                {detailMember.invited_at && (
                  <p>Invited: <span className="font-medium text-gray-700">{detailMember.invited_at}</span></p>
                )}
              </div>

              {/* Note about self-edit */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <User className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Team members can update their own contact details, profile photo, and password from their <strong>Settings</strong> page after logging in.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <InviteTeamMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSubmit={handleInviteMember}
        availableSeats={seats.available}
      />

      {selectedMember && (
        <ChangeRoleModal
          isOpen={showChangeRoleModal}
          onClose={() => { setShowChangeRoleModal(false); setSelectedMember(null); }}
          onSubmit={(newRole) => {
            handleChangeRole(selectedMember.id, newRole);
            setShowChangeRoleModal(false);
            setSelectedMember(null);
          }}
          currentRole={selectedMember.role}
          memberName={`${selectedMember.first_name} ${selectedMember.last_name}`}
        />
      )}

      {/* Remove confirmation */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Remove Team Member?</h2>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will immediately revoke their access. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRemoveConfirm(false); setMemberToRemove(null); }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mock data (used as fallback while backend /team/members endpoint is pending) ──
const mockSeats: TeamSeats = { used: 4, total: 5, available: 1, plan: 'Professional' };

const mockMembers: TeamMember[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@company.com',
    phone: '+27 82 123 4567',
    job_title: 'Head of Recruitment',
    department: 'Human Resources',
    role: 'admin',
    status: 'active',
    is_verified: true,
    last_active: '2 hours ago',
    joined_at: '2026-01-15',
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Smith',
    email: 'sarah.smith@company.com',
    phone: '+27 71 234 5678',
    job_title: 'Senior Recruiter',
    department: 'Human Resources',
    role: 'recruiter',
    status: 'active',
    is_verified: true,
    last_active: '1 day ago',
    joined_at: '2026-02-01',
  },
  {
    id: '3',
    first_name: 'Mike',
    last_name: 'Johnson',
    email: 'mike.johnson@company.com',
    job_title: '',
    department: '',
    role: 'recruiter',
    status: 'active',
    is_verified: false,
    last_active: '3 hours ago',
    joined_at: '2026-02-10',
  },
  {
    id: '4',
    first_name: 'Lisa',
    last_name: 'Brown',
    email: 'lisa.brown@company.com',
    phone: '',
    job_title: 'Engineering Manager',
    department: 'Engineering',
    role: 'hiring_manager',
    status: 'invited',
    is_verified: false,
    invited_at: '2026-03-01',
  },
];
