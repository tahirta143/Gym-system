import React, { useEffect, useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { Shield, Users, Plus, ShieldCheck, UserPlus, Trash2, FolderPlus, CheckCircle } from 'lucide-react';
import api from '../utils/api';

// --- Draggable Permission Item ---
const DraggableItem = ({ id, name }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 mb-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] cursor-grab active:cursor-grabbing hover:border-pink-500/40 transition-colors font-semibold flex items-center justify-between ${isDragging ? 'opacity-40 ring-2 ring-pink-500/50 scale-95' : ''
        }`}
    >
      <span>{name}</span>
      <span className="text-slate-600 text-xxs font-mono">::</span>
    </div>
  );
};

// --- Droppable Permissions Container ---
const DroppableContainer = ({ id, title, children, count }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`glass-panel p-5 rounded-3xl min-h-[450px] border flex flex-col transition-all duration-200 ${isOver ? 'bg-pink-500/5 border-pink-500/50 shadow-pink-500/5' : 'border-[var(--border-primary)] bg-[var(--bg-sidebar)]'
        }`}
    >
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--border-primary)]">
        <h4 className="font-bold text-sm text-[var(--text-primary)]">{title}</h4>
        <span className="text-xxs px-2.5 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] text-pink-400 font-bold font-mono">
          {count} items
        </span>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[400px] pr-1 space-y-1">
        {children}
        {count === 0 && (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs py-10 font-semibold">
            Drag items here
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN ACCESS CONTROL COMPONENT ---
const AccessControl = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drag & Drop Board State
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [availablePerms, setAvailablePerms] = useState([]);
  const [assignedPerms, setAssignedPerms] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User Accounts Forms
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState('manager');
  const [userError, setUserError] = useState('');

  // Groups Forms
  const [newGroupName, setNewGroupName] = useState('');
  const [groupError, setGroupError] = useState('');
  const [groupSuccess, setGroupSuccess] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update drag and drop board list when active group changes
  useEffect(() => {
    if (selectedGroupId && permissions.length > 0) {
      const activeGroup = groups.find(g => g.id === parseInt(selectedGroupId));
      if (activeGroup) {
        const assignedIds = activeGroup.permissions || [];
        const assigned = permissions.filter(p => assignedIds.includes(p.id));
        const available = permissions.filter(p => !assignedIds.includes(p.id));
        setAssignedPerms(assigned);
        setAvailablePerms(available);
      }
    }
  }, [selectedGroupId, groups, permissions]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [usersRes, groupsRes, permsRes] = await Promise.all([
        api.get('users-manage/'),
        api.get('groups/'),
        api.get('permissions/')
      ]);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
      setPermissions(permsRes.data);
      if (groupsRes.data.length > 0) {
        setSelectedGroupId(groupsRes.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Drag End Handler ---
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const permissionId = active.id;
    let destContainer = over.id;

    // Gotcha fix: If dropped over another draggable item, find its container
    if (typeof destContainer === 'number') {
      if (assignedPerms.some(p => p.id === destContainer)) {
        destContainer = 'assigned';
      } else {
        destContainer = 'available';
      }
    } else {
      // Check if it's a string representation of a number
      const destNum = parseInt(destContainer);
      if (!isNaN(destNum)) {
        if (assignedPerms.some(p => p.id === destNum)) {
          destContainer = 'assigned';
        } else {
          destContainer = 'available';
        }
      }
    }

    if (destContainer === 'assigned') {
      const alreadyAssigned = assignedPerms.find(p => p.id === permissionId);
      if (!alreadyAssigned) {
        const item = availablePerms.find(p => p.id === permissionId);
        if (item) {
          setAssignedPerms([...assignedPerms, item]);
          setAvailablePerms(availablePerms.filter(p => p.id !== permissionId));
        }
      }
    } else if (destContainer === 'available') {
      const alreadyAvailable = availablePerms.find(p => p.id === permissionId);
      if (!alreadyAvailable) {
        const item = assignedPerms.find(p => p.id === permissionId);
        if (item) {
          setAvailablePerms([...availablePerms, item]);
          setAssignedPerms(assignedPerms.filter(p => p.id !== permissionId));
        }
      }
    }
  };

  // --- Save Permissions ---
  const handleSavePermissions = async () => {
    setSaveSuccess(false);
    try {
      const activeGroup = groups.find(g => g.id === parseInt(selectedGroupId));
      if (!activeGroup) return;

      const payload = {
        name: activeGroup.name,
        permissions: assignedPerms.map(p => p.id)
      };

      await api.put(`groups/${selectedGroupId}/`, payload);
      setSaveSuccess(true);

      // Refresh groups
      const groupsRes = await api.get('groups/');
      setGroups(groupsRes.data);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save group permissions.');
    }
  };

  // --- Create User account ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    try {
      // Map role to Django Group ID
      const roleToGroupNames = {
        super_admin: 'SuperAdmin',
        manager: 'Manager',
        trainer: 'Trainer',
        accountant: 'Accountant'
      };
      const groupName = roleToGroupNames[newUserRole];
      const matchingGroup = groups.find(g => g.name === groupName);

      const payload = {
        username: newUsername,
        password: newPassword,
        email: newEmail,
        first_name: newFirstName,
        last_name: newLastName,
        role: newUserRole,
        groups: matchingGroup ? [matchingGroup.id] : []
      };

      await api.post('users-manage/', payload);
      setShowUserModal(false);

      // Reset form
      setNewUsername('');
      setNewPassword('');
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      setNewUserRole('manager');

      // Refresh users list
      const usersRes = await api.get('users-manage/');
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
      setUserError('Failed to create account. Username or email might be taken.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff user login account?')) {
      try {
        await api.delete(`users-manage/${id}/`);
        // Refresh users
        const usersRes = await api.get('users-manage/');
        setUsers(usersRes.data);
      } catch (err) {
        console.error(err);
        alert('Failed to delete user.');
      }
    }
  };

  // --- Create Group ---
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setGroupError('');
    setGroupSuccess(false);
    try {
      await api.post('groups/', { name: newGroupName, permissions: [] });
      setNewGroupName('');
      setGroupSuccess(true);

      // Refresh groups list
      const groupsRes = await api.get('groups/');
      setGroups(groupsRes.data);

      setTimeout(() => setGroupSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setGroupError('Failed to create role group. Ensure it has a unique name.');
    }
  };

  const roleColors = {
    super_admin: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    manager: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    trainer: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    accountant: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  const roleLabels = {
    super_admin: 'Owner / Admin',
    manager: 'Front Desk / Manager',
    trainer: 'Trainer',
    accountant: 'Accountant',
  };

  return (
    <div className="space-y-8 select-none">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Access Control Manager
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage system security, add user profiles, customize role boundaries, and drag-and-drop model permissions.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 border-b border-[var(--border-primary)] pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'users'
              ? 'bg-[#ce5a8c] text-white'
              : 'text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-sidebar-link)]'
            }`}
        >
          <Users size={16} />
          <span>User Logins</span>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'permissions'
              ? 'bg-[#ce5a8c] text-white'
              : 'text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-sidebar-link)]'
            }`}
        >
          <Shield size={16} />
          <span>Group Permissions (Drag & Drop)</span>
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'groups'
              ? 'bg-[#ce5a8c] text-white'
              : 'text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-sidebar-link)]'
            }`}
        >
          <FolderPlus size={16} />
          <span>Roles Creator</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* --- TAB 1: USERS --- */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-200">Staff Accounts Directory</h3>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#ce5a8c] hover:bg-[#be4879] text-[#0c0c0c] font-extrabold rounded-xl shadow-lg transition-all text-xs cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>Create User Account</span>
                </button>
              </div>

              <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-white/2">
                      <th className="py-4 px-6">Username</th>
                      <th className="py-4 px-6">Full Name</th>
                      <th className="py-4 px-6">Email Address</th>
                      <th className="py-4 px-6">Active Role / Group</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-200">{user.username}</td>
                        <td className="py-4 px-6 text-slate-300">
                          {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Not provided'}
                        </td>
                        <td className="py-4 px-6 text-slate-400">{user.email || '—'}</td>
                        <td className="py-4 px-6">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${roleColors[user.role] || 'bg-slate-500/10 text-slate-400 border-slate-200'}`}>
                            {roleLabels[user.role] || user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 2: PERMISSIONS DND BOARD --- */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Role Group:</span>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm font-bold focus:outline-none"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSavePermissions}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#ce5a8c] hover:bg-[#be4879] text-[#0c0c0c] font-extrabold rounded-xl shadow-lg transition-all text-xs cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>Save Group Permissions</span>
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>Group permissions updated successfully!</span>
                </div>
              )}

              <p className="text-xs text-slate-500 italic">
                Drag permissions between the columns below to assign or revoke model permissions from the chosen group.
              </p>

              <DndContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Droppable Available Container */}
                  <DroppableContainer id="available" title="Available System Permissions" count={availablePerms.length}>
                    {availablePerms.map(p => (
                      <DraggableItem key={p.id} id={p.id} name={`${p.codename} (${p.name})`} />
                    ))}
                  </DroppableContainer>

                  {/* Droppable Assigned Container */}
                  <DroppableContainer id="assigned" title="Assigned Group Permissions" count={assignedPerms.length}>
                    {assignedPerms.map(p => (
                      <DraggableItem key={p.id} id={p.id} name={`${p.codename} (${p.name})`} />
                    ))}
                  </DroppableContainer>
                </div>
              </DndContext>
            </div>
          )}

          {/* --- TAB 3: CREATE GROUPS --- */}
          {activeTab === 'groups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Create Form */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <FolderPlus className="text-pink-400" size={20} />
                    <span>Create Custom Role Group</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Create new security scopes in the system database.</p>
                </div>

                {groupError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    {groupError}
                  </div>
                )}

                {groupSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    Role group created successfully!
                  </div>
                )}

                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Group / Role Name</label>
                    <input
                      type="text"
                      required
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., GuestStaff"
                      className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#ce5a8c] hover:bg-[#be4879] text-[#0c0c0c] font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Create Group Role
                  </button>
                </form>
              </div>

              {/* Right Column: Groups Directory */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h3 className="text-lg font-bold text-slate-200">Existing Role Groups</h3>
                <div className="space-y-3">
                  {groups.map(g => (
                    <div key={g.id} className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-200">{g.name}</span>
                      <span className="text-xxs px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 font-bold border border-pink-500/20">
                        {g.permissions?.length || 0} permissions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE USER ACCOUNT MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-200">Register Staff User</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {userError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {userError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Muhammad"
                    className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Ahmed"
                    className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. staff1"
                  className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@gym.com"
                  className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Role Group</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
                >
                  <option value="super_admin">Owner / Admin</option>
                  <option value="manager">Front Desk / Manager</option>
                  <option value="trainer">Trainer</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[var(--border-primary)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-5 py-2.5 bg-[var(--bg-card)] hover:opacity-80 border border-[var(--border-primary)] text-[var(--text-primary)] font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#ce5a8c] hover:bg-[#be4879] text-[#0c0c0c] font-extrabold rounded-xl text-sm shadow-md"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AccessControl;
