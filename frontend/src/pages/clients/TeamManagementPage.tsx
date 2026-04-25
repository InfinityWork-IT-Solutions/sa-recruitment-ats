import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Mail, Shield, Trash2, Edit, MoreVertical,
  CheckCircle, Clock, XCircle, CreditCard, AlertCircle, RefreshCw
} from 'lucide-react';
import InviteTeamMemberModal from '@/components/modals/InviteTeamMemberModal';
import ChangeRoleModal from '@/components/modals/ChangeRoleModal';
import apiClient from '@/lib/api-client';

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'hiring_manager' | 'viewer';
  status: 'active' | 'invited' | 'inactive';
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

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await apiClient.get('/team/members');
      const data = response.data;
      setMembers(data.members || mockMembers);
      setSeats(data.seats || mockSeats);
    } catch (error) {
      console.error('Error fetching team data:', error);
      setMembers(mockMembers);
      setSeats(mockSeats);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (data: any) => {
    try {
      await apiClient.post('/team/invite', data);
      alert('Invitation sent successfully!');
      fetchTeamData();
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await apiClient.patch(`/team/members/${memberId}/role`, { role: newRole });
      setMembers(members.map(m => 
        m.id === memberId ? { ...m, role: newRole as any } : m
      ));
      alert('Role updated successfully!');
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Failed to change role. Please try again.');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await apiClient.delete(`/team/members/${memberToRemove}`);
      setMembers(members.filter(m => m.id !== memberToRemove));
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
      alert('Team member removed successfully!');
      fetchTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  const handleResendInvitation = async (memberId: string) => {
    try {
      await apiClient.post(`/team/members/${memberId}/resend-invitation`);
      alert('Invitation resent successfully!');
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation. Please try again.');
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      recruiter: 'bg-blue-100 text-blue-700',
      hiring_manager: 'bg-purple-100 text-purple-700',
      viewer: 'bg-gray-100 text-gray-700',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'invited') return <Clock className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-600',
      invited: 'text-yellow-600',
      inactive: 'text-gray-500',
    };
    return colors[status as keyof typeof colors] || 'text-gray-500';
  };

  const seatPercentage = (seats.used / seats.total) * 100;
  const progressColor = seatPercentage < 80 ? 'bg-green-500' : seatPercentage < 100 ? 'bg-yellow-500' : 'bg-red-500';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-1">Manage your team members and permissions</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              disabled={seats.available === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" />
              <span>Invite Team Member</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seat Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Seats</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{seats.total}</div>
            <p className="text-xs text-gray-500 mt-1">{seats.plan} Plan</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Seats Used</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{seats.used}</div>
            <p className="text-xs text-gray-500 mt-1">{seatPercentage.toFixed(0)}% utilized</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
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

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Active Members</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {members.filter(m => m.status === 'active').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </div>
        </div>

        {/* Seat Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Seat Usage</h3>
            <span className="text-sm text-gray-600">
              {seats.used} / {seats.total} seats
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className={`h-4 rounded-full transition-all ${progressColor}`}
              style={{ width: `${seatPercentage}%` }}
            />
          </div>
          
          {seats.available === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-1">All Seats Full</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    You've reached your team seat limit. Upgrade your plan to add more members.
                  </p>
                  <button
                    onClick={() => navigate('/company/settings/billing')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-all flex items-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Upgrade Plan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team Members List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-600 mt-1">{members.length} total members</p>
          </div>

          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {member.first_name} {member.last_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(member.status)}
                          <span className={`text-xs font-medium capitalize ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600">{member.email}</p>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {member.status === 'active' && member.last_active && `Last active ${member.last_active}`}
                        {member.status === 'invited' && member.invited_at && `Invited ${member.invited_at}`}
                        {member.status === 'inactive' && 'Inactive'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {member.status === 'invited' && (
                      <button
                        onClick={() => handleResendInvitation(member.id)}
                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition-all flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Resend Invitation</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setShowChangeRoleModal(true);
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Change Role</span>
                    </button>

                    <button
                      onClick={() => {
                        setMemberToRemove(member.id);
                        setShowRemoveConfirm(true);
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
          onClose={() => {
            setShowChangeRoleModal(false);
            setSelectedMember(null);
          }}
          onSubmit={(newRole) => {
            handleChangeRole(selectedMember.id, newRole);
            setShowChangeRoleModal(false);
            setSelectedMember(null);
          }}
          currentRole={selectedMember.role}
          memberName={`${selectedMember.first_name} ${selectedMember.last_name}`}
        />
      )}

      {/* Remove Confirmation */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Remove Team Member?</h2>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to remove this team member?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will immediately revoke their access to the platform. This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setMemberToRemove(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
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

// Mock data
const mockSeats: TeamSeats = {
  used: 4,
  total: 5,
  available: 1,
  plan: 'Professional',
};

const mockMembers: TeamMember[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@company.com',
    role: 'admin',
    status: 'active',
    last_active: '2 hours ago',
    joined_at: '2026-01-15',
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Smith',
    email: 'sarah.smith@company.com',
    role: 'recruiter',
    status: 'active',
    last_active: '1 day ago',
    joined_at: '2026-02-01',
  },
  {
    id: '3',
    first_name: 'Mike',
    last_name: 'Johnson',
    email: 'mike.johnson@company.com',
    role: 'recruiter',
    status: 'active',
    last_active: '3 hours ago',
    joined_at: '2026-02-10',
  },
  {
    id: '4',
    first_name: 'Lisa',
    last_name: 'Brown',
    email: 'lisa.brown@company.com',
    role: 'hiring_manager',
    status: 'active',
    last_active: '5 days ago',
    joined_at: '2026-03-01',
  },
];
