import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { KPICards } from '../components/dashboard/KPICards';
import { SprintAnalytics } from '../components/dashboard/SprintAnalytics';
import { ProjectTable } from '../components/dashboard/ProjectTable';
import { DistributionCharts } from '../components/dashboard/DistributionCharts';
import { UserLeaderboard } from '../components/dashboard/UserLeaderboard';
import { Button } from '../components/ui/Button';
import { Plus, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [projects, setProjects] = useState([]);
    const [usersAnalytics, setUsersAnalytics] = useState(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, projectsData, usersData] = await Promise.all([
                api.analytics.overview(),
                api.projects.list(),
                api.analytics.users()
            ]);
            setStats(statsData);
            setProjects(projectsData);
            setUsersAnalytics(usersData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Refresh projects when navigating back to dashboard
    useEffect(() => {
        const handleFocus = () => {
            fetchData();
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    return (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Network Analytics Hub</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Real-time performance metrics across all projects and teams.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" onClick={fetchData} disabled={loading}>
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    {(user?.role === 'ADMIN' || user?.role === 'PM') && (
                        <Button onClick={() => navigate('/projects/create')}>
                            <Plus size={18} />
                            New Project
                        </Button>
                    )}
                </div>
            </div>

            <KPICards stats={stats} loading={loading} />

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <DistributionCharts data={stats.raw} />
                    <ProjectTable projects={projects} loading={loading} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <SprintAnalytics />
                    <UserLeaderboard data={usersAnalytics} />
                </div>
            </div>
        </div>
    );
}
