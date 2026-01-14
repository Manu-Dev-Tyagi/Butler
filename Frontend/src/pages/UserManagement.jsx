import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
    User, 
    UserX, 
    Shield, 
    Ticket, 
    TrendingUp,
    Search,
    Filter,
    RefreshCcw,
    Ban,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * User Management – Authority View
 * (Not a CRUD table)
 * User Card Shows:
 * - Role
 * - Department / Sub-dept
 * - Active tickets count
 * - FTR %
 * - Exit status
 * Actions:
 * - Initiate offboarding
 * - Block assignment
 * - Reassign tickets
 * - View performance history
 */
export default function UserManagement() {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        role: '',
        employment_status: '',
        is_assignable: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [users, searchQuery, filters]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersData = await api.users.list();
            
            // Enrich users with analytics data
            const enrichedUsers = await Promise.all(
                usersData.map(async (user) => {
                    try {
                        // Get user analytics
                        const analytics = await api.analytics.user(user.id);
                        
                        // Get active tickets count
                        const tickets = await api.tickets.list({ assigned_to: user.id });
                        const activeTickets = tickets.filter(t => 
                            ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'].includes(t.status)
                        ).length;

                        return {
                            ...user,
                            active_tickets_count: activeTickets,
                            ftr_percentage: analytics?.ftr_percentage || 0,
                            avg_iterations: analytics?.avg_iterations || 0,
                            total_tickets: analytics?.total_tickets || 0,
                            completed_tickets: analytics?.completed_tickets || 0
                        };
                    } catch (err) {
                        console.error(`Failed to fetch analytics for user ${user.id}:`, err);
                        return {
                            ...user,
                            active_tickets_count: 0,
                            ftr_percentage: 0,
                            avg_iterations: 0,
                            total_tickets: 0,
                            completed_tickets: 0
                        };
                    }
                })
            );

            setUsers(enrichedUsers);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...users];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                u.name?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.role?.toLowerCase().includes(query)
            );
        }

        // Role filter
        if (filters.role) {
            filtered = filtered.filter(u => u.role === filters.role);
        }

        // Employment status filter
        if (filters.employment_status) {
            filtered = filtered.filter(u => u.employment_status === filters.employment_status);
        }

        // Assignable filter
        if (filters.is_assignable !== '') {
            filtered = filtered.filter(u => 
                filters.is_assignable === 'true' ? u.is_assignable : !u.is_assignable
            );
        }

        setFilteredUsers(filtered);
    };

    const handleInitiateOffboarding = async (userId) => {
        if (!confirm('Are you sure you want to initiate offboarding for this user?')) return;
        
        try {
            // Navigate to offboarding page with user pre-selected
            navigate(`/offboarding?user_id=${userId}`);
        } catch (err) {
            console.error('Failed to initiate offboarding:', err);
            alert('Failed to initiate offboarding');
        }
    };

    const handleBlockAssignment = async (userId, currentStatus) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} assignment for this user?`)) return;
        
        try {
            // This would require a backend endpoint to update is_assignable
            // For now, just show an alert
            alert(`Assignment ${currentStatus ? 'unblocked' : 'blocked'} (Backend endpoint needed)`);
            fetchUsers(); // Refresh
        } catch (err) {
            console.error('Failed to block/unblock assignment:', err);
            alert('Failed to update assignment status');
        }
    };

    const handleReassignTickets = (userId) => {
        navigate(`/offboarding?user_id=${userId}&action=reassign`);
    };

    const handleViewPerformance = (userId) => {
        navigate(`/users/${userId}/performance`);
    };

    const UserCard = ({ user }) => {
        const getRoleColor = (role) => {
            switch (role) {
                case 'ADMIN': return '#ef4444';
                case 'PM': return '#3b82f6';
                case 'EMPLOYEE': return '#10b981';
                default: return '#6b7280';
            }
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'ACTIVE': return '#10b981';
                case 'EXIT_INITIATED': return '#f97316';
                case 'OFFBOARDED': return '#6b7280';
                default: return '#6b7280';
            }
        };

        return (
            <Card style={{
                padding: '1.5rem',
                border: user.employment_status === 'EXIT_INITIATED' ? '2px solid #f97316' : '1px solid var(--color-border)',
                background: user.employment_status === 'EXIT_INITIATED' ? 'rgba(249, 115, 22, 0.05)' : 'var(--color-bg-card)'
            }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getRoleColor(user.role)}, ${getRoleColor(user.role)}80)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        flexShrink: 0
                    }}>
                        {user.name?.charAt(0) || 'U'}
                    </div>

                    {/* User Info */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {user.name}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    {user.email}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: `${getRoleColor(user.role)}20`,
                                    color: getRoleColor(user.role),
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                }}>
                                    {user.role}
                                </span>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: `${getStatusColor(user.employment_status)}20`,
                                    color: getStatusColor(user.employment_status),
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                }}>
                                    {user.employment_status?.replace('_', ' ') || 'ACTIVE'}
                                </span>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '1rem',
                            marginBottom: '1rem',
                            padding: '1rem',
                            background: 'var(--color-bg-card)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    Active Tickets
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Ticket size={18} color="#3b82f6" />
                                    {user.active_tickets_count || 0}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    FTR %
                                </div>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: user.ftr_percentage >= 80 ? '#10b981' : user.ftr_percentage >= 60 ? '#eab308' : '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <TrendingUp size={18} />
                                    {user.ftr_percentage.toFixed(1)}%
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    Avg Iterations
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                    {user.avg_iterations.toFixed(1)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    Completed
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                    {user.completed_tickets || 0} / {user.total_tickets || 0}
                                </div>
                            </div>
                        </div>

                        {/* Department Info */}
                        {user.department_name && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                Department: <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>
                                    {user.department_name}
                                    {user.sub_department_name && ` / ${user.sub_department_name}`}
                                </span>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {user.employment_status === 'ACTIVE' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleInitiateOffboarding(user.id)}
                                >
                                    <UserX size={16} />
                                    Initiate Offboarding
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBlockAssignment(user.id, user.is_assignable)}
                            >
                                <Ban size={16} />
                                {user.is_assignable ? 'Block Assignment' : 'Unblock Assignment'}
                            </Button>
                            {user.active_tickets_count > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReassignTickets(user.id)}
                                >
                                    <ArrowRight size={16} />
                                    Reassign Tickets
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPerformance(user.id)}
                            >
                                <Shield size={16} />
                                Performance
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>User Management</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Authority view - manage users and their assignments</p>
                </div>
                <Button variant="outline" onClick={fetchUsers} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* Search and Filters */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Search size={18} />
                    <Input
                        placeholder="Search users by name, email, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1 }}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Role
                        </label>
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="PM">PM</option>
                            <option value="EMPLOYEE">Employee</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Employment Status
                        </label>
                        <select
                            value={filters.employment_status}
                            onChange={(e) => setFilters({ ...filters, employment_status: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="EXIT_INITIATED">Exit Initiated</option>
                            <option value="OFFBOARDED">Offboarded</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Assignable
                        </label>
                        <select
                            value={filters.is_assignable}
                            onChange={(e) => setFilters({ ...filters, is_assignable: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All</option>
                            <option value="true">Assignable</option>
                            <option value="false">Blocked</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Users Grid */}
            {loading ? (
                <div>Loading users...</div>
            ) : filteredUsers.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                    <User size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No users found</p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '1.5rem' }}>
                    {filteredUsers.map(user => (
                        <UserCard key={user.id} user={user} />
                    ))}
                </div>
            )}
        </div>
    );
}
