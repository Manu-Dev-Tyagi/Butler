import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
    TrendingUp, 
    TrendingDown, 
    Filter,
    RefreshCcw,
    BarChart3
} from 'lucide-react';

/**
 * FTR Analytics Dashboard
 * Filters: Project, Department, User, Sprint
 * Charts: FTR trend, Iteration distribution, Approval delay reasons
 */
export default function FTRAnalytics() {
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        project_id: '',
        department_id: '',
        user_id: '',
        sprint_id: ''
    });
    const [analytics, setAnalytics] = useState({
        ftr_percentage: 0,
        ftr_trend: [],
        iteration_distribution: [],
        approval_delays: []
    });
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [sprints, setSprints] = useState([]);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [projectsData, usersData, sprintsData] = await Promise.all([
                    api.projects.list(),
                    api.users.list(),
                    api.meta.sprints.list()
                ]);
                setProjects(projectsData);
                setUsers(usersData);
                setSprints(sprintsData);
            } catch (err) {
                console.error('Failed to load filters:', err);
            }
        };
        loadFilters();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [filters]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Get overview analytics
            const overview = await api.analytics.overview();
            
            // Get user analytics if user filter is set
            let userAnalytics = null;
            if (filters.user_id) {
                userAnalytics = await api.analytics.user(filters.user_id);
            }

            // Get sprint analytics if sprint filter is set
            let sprintAnalytics = null;
            if (filters.sprint_id) {
                sprintAnalytics = await api.analytics.sprint(filters.sprint_id);
            }

            // Combine data
            const ftrData = userAnalytics || overview.raw?.ftr || { percentage: overview.ftr || 0 };
            const iterationData = userAnalytics || overview.raw?.iterations || { avg_per_ticket: 0 };

            // Mock trend data (would come from backend)
            const ftrTrend = [
                { period: 'Week 1', value: 75 },
                { period: 'Week 2', value: 78 },
                { period: 'Week 3', value: 82 },
                { period: 'Week 4', value: 85 },
                { period: 'Current', value: ftrData.percentage || 0 }
            ];

            // Mock iteration distribution
            const iterationDistribution = [
                { iterations: 1, count: iterationData.single_iteration_count || 0 },
                { iterations: 2, count: 0 },
                { iterations: 3, count: 0 },
                { iterations: '4+', count: iterationData.multiple_iterations_count || 0 }
            ];

            setAnalytics({
                ftr_percentage: ftrData.percentage || 0,
                ftr_trend: ftrTrend,
                iteration_distribution: iterationDistribution,
                approval_delays: [] // Would come from backend
            });
        } catch (err) {
            console.error('Failed to fetch FTR analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>FTR Analytics</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>First Time Right metrics and trends</p>
                </div>
                <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* Filters */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Filter size={18} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Filters</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Project
                        </label>
                        <select
                            value={filters.project_id}
                            onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            User
                        </label>
                        <select
                            value={filters.user_id}
                            onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Sprint
                        </label>
                        <select
                            value={filters.sprint_id}
                            onChange={(e) => setFilters({ ...filters, sprint_id: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Sprints</option>
                            {sprints.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* FTR Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        Overall FTR %
                    </div>
                    <div style={{ 
                        fontSize: '3rem', 
                        fontWeight: 700, 
                        marginBottom: '0.5rem',
                        color: analytics.ftr_percentage >= 80 ? '#10b981' : analytics.ftr_percentage >= 60 ? '#eab308' : '#ef4444'
                    }}>
                        {analytics.ftr_percentage.toFixed(1)}%
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        {analytics.ftr_percentage >= 80 ? (
                            <>
                                <TrendingUp size={16} color="#10b981" />
                                Excellent
                            </>
                        ) : analytics.ftr_percentage >= 60 ? (
                            <>
                                <TrendingUp size={16} color="#eab308" />
                                Good
                            </>
                        ) : (
                            <>
                                <TrendingDown size={16} color="#ef4444" />
                                Needs Improvement
                            </>
                        )}
                    </div>
                </Card>

                <Card style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>FTR Trend</h3>
                    <div style={{ display: 'flex', alignItems: 'end', gap: '1rem', height: '200px' }}>
                        {analytics.ftr_trend.map((point, i) => {
                            const maxValue = Math.max(...analytics.ftr_trend.map(p => p.value));
                            const height = (point.value / maxValue) * 100;
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: '100%',
                                        height: `${height}%`,
                                        background: point.period === 'Current' ? 'var(--color-primary)' : 'rgba(59, 130, 246, 0.5)',
                                        borderRadius: 'var(--radius-sm)  var(--radius-sm) 0 0',
                                        marginBottom: '0.5rem',
                                        minHeight: '20px'
                                    }} />
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                        {point.period}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>
                                        {point.value}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Iteration Distribution */}
            <Card style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Iteration Distribution</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    {analytics.iteration_distribution.map((item, i) => {
                        const total = analytics.iteration_distribution.reduce((sum, it) => sum + it.count, 0);
                        const percentage = total > 0 ? (item.count / total) * 100 : 0;
                        return (
                            <div key={i} style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    {item.count}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    {item.iterations} Iteration{item.iterations !== 1 ? 's' : ''}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {percentage.toFixed(1)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Approval Delay Reasons (Placeholder) */}
            <Card style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Approval Delay Analysis</h3>
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <BarChart3 size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Approval delay analysis coming soon...</p>
                </div>
            </Card>
        </div>
    );
}
