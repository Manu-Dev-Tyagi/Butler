import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';
import { UserPlus, Trash2, X } from 'lucide-react';

export function ProjectMembers({ project, onUpdate }) {
    const [allUsers, setAllUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await api.users.list();
                setAllUsers(users);
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    const projectMembers = allUsers.filter(u => (project.members || []).includes(u.id));
    const availableUsers = allUsers.filter(u =>
        !(project.members || []).includes(u.id) && u.employment_status !== 'EXIT_INITIATED'
    );

    const handleAddMember = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            await api.projects.addMember(project.id, selectedUser);
            // Refresh project data logic would usually happen here or via callback
            // For mock, we trigger reload or optimistic update. 
            // Ideally onUpdate() should reload the project in parent.
            if (onUpdate) onUpdate();
            setIsModalOpen(false);
            setSelectedUser('');
        } catch (err) {
            console.error("Failed to add member", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.projects.removeMember(project.id, userId);
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Failed to remove member", err);
        }
    };

    return (
        <div className="animate-slideUp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Team Members ({projectMembers.length})</h3>
                <Button onClick={() => setIsModalOpen(true)}>
                    <UserPlus size={16} /> Add Member
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {projectMembers.map(member => (
                    <Card key={member.id} style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>{member.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{member.role}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleRemoveMember(member.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                            className="hover-danger"
                            title="Remove Member"
                        >
                            <Trash2 size={16} />
                        </button>
                    </Card>
                ))}
            </div>

            {/* Add Member Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ width: '400px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Team Member</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Select User</label>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-main)' }}
                            >
                                <option value="">Select a user...</option>
                                {availableUsers.map(user => (
                                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                ))}
                            </select>
                            {availableUsers.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>No active users available to add.</p>}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddMember} disabled={!selectedUser || loading}>
                                {loading ? 'Adding...' : 'Add Member'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
