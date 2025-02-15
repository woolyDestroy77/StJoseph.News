import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ShieldOff, Ban } from 'lucide-react';
import { getStoredUsers, updateUserRole } from '../../lib/auth';
import { postStorage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import type { BannedUser } from '../../types';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const { user: currentUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedUsers, bannedUsersList] = await Promise.all([
          getStoredUsers(),
          postStorage.getBannedUsers()
        ]);
        setUsers(storedUsers);
        setBannedUsers(bannedUsersList);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRoleToggle = async (userId: string, currentRole: 'ADMIN' | 'USER') => {
    try {
      const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
      const updatedUsers = updateUserRole(userId, newRole);
      setUsers(updatedUsers);
      setSuccess(`User role updated successfully to ${newRole}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim() || !currentUser) return;

    try {
      await postStorage.banUser(selectedUser.id, banReason, {
        id: currentUser.id,
        name: currentUser.name
      });
      const updatedBannedUsers = await postStorage.getBannedUsers();
      setBannedUsers(updatedBannedUsers);
      setSuccess(`User ${selectedUser.name} has been banned`);
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await postStorage.unbanUser(userId);
      const updatedBannedUsers = await postStorage.getBannedUsers();
      setBannedUsers(updatedBannedUsers);
      setSuccess('User has been unbanned');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban user');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">User Management</h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-gray-900 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => {
              const isBanned = bannedUsers.some(banned => banned.id === user.id);
              return (
                <tr key={user.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {user.role === 'ADMIN' ? (
                        <Shield className="w-3 h-3 mr-1" />
                      ) : (
                        <Users className="w-3 h-3 mr-1" />
                      )}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {isBanned ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                        <Ban className="w-3 h-3 mr-1" />
                        Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    {user.id !== currentUser?.id && (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleRoleToggle(user.id, user.role)}
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                            user.role === 'ADMIN'
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                          }`}
                        >
                          {user.role === 'ADMIN' ? (
                            <>
                              <ShieldOff className="w-3 h-3 mr-1" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Make Admin
                            </>
                          )}
                        </button>
                        {isBanned ? (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors whitespace-nowrap"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser({ id: user.id, name: user.name });
                              setShowBanModal(true);
                            }}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Ban
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ban User Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Ban User</h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to ban {selectedUser?.name}? This will prevent them from commenting on posts.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Reason for ban
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setSelectedUser(null);
                  setBanReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};