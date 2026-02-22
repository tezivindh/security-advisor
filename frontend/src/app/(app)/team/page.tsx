'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Shield,
  Crown,
  Code2,
  Eye,
  Loader2,
  Activity,
  UserPlus,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { teamApi } from '@/lib/api';
import { Team, TeamMember, ActivityLog } from '@/types';
import { formatRelative, cn } from '@/lib/utils';

const ROLE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  owner: { label: 'Owner', icon: <Crown className="h-3 w-3" />, color: 'text-yellow-400' },
  developer: { label: 'Developer', icon: <Code2 className="h-3 w-3" />, color: 'text-blue-400' },
  viewer: { label: 'Viewer', icon: <Eye className="h-3 w-3" />, color: 'text-white/40' },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META.viewer;
  return (
    <span className={cn('flex items-center gap-1 text-xs', meta.color)}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function CreateTeamModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (team: Team) => void;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await teamApi.createTeam(name.trim());
      onCreate(data.team);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create team');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        <h2 className="text-lg font-bold mb-4">Create a Team</h2>
        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team name…"
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleCreate()}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="px-4 py-2 rounded-xl text-sm bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InviteMemberModal({
  teamId,
  onClose,
}: {
  teamId: string;
  onClose: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'developer' | 'viewer'>('developer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInvite = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await teamApi.inviteMember(teamId, userId.trim(), role);
      setSuccess('Member invited successfully!');
      setUserId('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to invite member');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        <h2 className="text-lg font-bold mb-4">Invite Member</h2>
        <div className="space-y-3">
          <input
            autoFocus
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="GitHub username or user ID…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25"
          />
          <div className="flex gap-2">
            {(['developer', 'viewer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-sm border transition-colors',
                  role === r
                    ? 'border-white/25 bg-white/10 text-white'
                    : 'border-white/5 text-white/30 hover:text-white hover:bg-white/5'
                )}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-green-400">{success}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleInvite}
              disabled={!userId.trim() || loading}
              className="px-4 py-2 rounded-xl text-sm bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const { data } = await teamApi.getMyTeams();
      setTeams(data.teams ?? []);
    } catch {}
    setLoading(false);
  };

  const loadTeamDetails = async (team: Team) => {
    setSelectedTeam(team);
    setMembersLoading(true);
    try {
      const [membersRes, activityRes] = await Promise.all([
        teamApi.getMembers(team._id),
        teamApi.getActivity(team._id),
      ]);
      setMembers(membersRes.data.members ?? []);
      setActivity(activityRes.data.logs ?? []);
    } catch {}
    setMembersLoading(false);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      loadTeamDetails(teams[0]);
    }
  }, [teams]);

  return (
    <>
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(t) => {
            setTeams((prev) => [...prev, t]);
            loadTeamDetails(t);
          }}
        />
      )}
      {showInviteModal && selectedTeam && (
        <InviteMemberModal teamId={selectedTeam._id} onClose={() => setShowInviteModal(false)} />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Workspace</h1>
            <p className="text-white/40 text-sm mt-1">Manage team members and access roles</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Team
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-white/30" />
          </div>
        ) : teams.length === 0 ? (
          <div className="border border-white/10 rounded-xl p-12 text-center">
            <Users className="h-10 w-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No teams yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-sm underline text-white/40 hover:text-white transition-colors"
            >
              Create your first team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Team List */}
            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team._id}
                  onClick={() => loadTeamDetails(team)}
                  className={cn(
                    'w-full text-left border rounded-xl px-4 py-3 transition-colors',
                    selectedTeam?._id === team._id
                      ? 'border-white/20 bg-white/10'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  )}
                >
                  <div className="font-medium text-sm">{team.name}</div>
                  <div className="text-xs text-white/30 mt-0.5 font-mono">@{team.slug}</div>
                  <div className="text-xs text-white/20 mt-1">{team.plan} plan</div>
                </button>
              ))}
            </div>

            {/* Team Detail */}
            <div className="lg:col-span-2 space-y-4">
              {selectedTeam && (
                <>
                  {/* Members */}
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-white/30" />
                        <span className="text-sm font-medium">Members ({members.length})</span>
                      </div>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Invite
                      </button>
                    </div>
                    {membersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {members.map((m) => {
                          const u = m.userId as any;
                          const login = u?.login ?? u?.name ?? String(m.userId);
                          const avatar = u?.avatarUrl as string | undefined;
                          return (
                            <div key={m._id} className="flex items-center gap-3 px-4 py-3">
                              {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatar} alt={login} className="w-7 h-7 rounded-full" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium">
                                  {login.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white/80 truncate">{login}</div>
                                <div className="text-xs text-white/30">
                                  Joined {formatRelative(m.joinedAt ?? m._id)}
                                </div>
                              </div>
                              <RoleBadge role={m.role} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Activity */}
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 bg-white/2 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-white/30" />
                      <span className="text-sm font-medium">Recent Activity</span>
                    </div>
                    {activity.length === 0 ? (
                      <div className="text-center py-8 text-white/20 text-sm">
                        No activity yet
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 max-h-56 overflow-y-auto">
                        {activity.map((log) => (
                          <div key={log._id} className="flex items-start gap-3 px-4 py-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-white/60">{log.description}</div>
                              <div className="text-xs text-white/20 mt-0.5">
                                {formatRelative(log.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
