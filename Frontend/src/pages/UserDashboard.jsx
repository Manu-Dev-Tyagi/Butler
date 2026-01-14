import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { ProjectTable } from '../components/dashboard/ProjectTable';
import { Folder, Clock, CheckCircle } from 'lucide-react';

export default function UserDashboard() {
    const [loading, setLoading] = useState(true);
    const [myProjects, setMyProjects] = useState([]);
    const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0 });

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // In a real app, filtering by user ID would happen on backend
                // For now, fetching all projects and simulating 'my projects'
                const allProjects = await api.projects.list();
                // Simulating assigned projects (picking first 2 for demo)
                const assigned = allProjects.slice(0, 2);

                setMyProjects(assigned);
                setStats({
                    active: assigned.filter(p => p.status === 'Active' || p.status === 'IN_PROGRESS').length,
                    pending: assigned.filter(p => p.status === 'DELAYED').length,
                    completed: assigned.filter(p => p.status === 'COMPLETED').length
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '50%', background: `var(--color-bg-${color || 'primary'})`, color: `var(--color-${color || 'primary'})` }}>
                <Icon size={24} />
            </div>
            <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{value}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{title}</p>
            </div>
        </Card>
    );

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>User Dashboard</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>Overview of your projects and contributions.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard title="Active Projects" value={stats.active} icon={Folder} color="primary" />
                <StatCard title="Delayed / Pending" value={stats.pending} icon={Clock} color="warning" />
                <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="success" />
            </div>

            <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>My Projects</h3>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
                ) : myProjects.length > 0 ? (
                    <ProjectTable projects={myProjects} />
                ) : (
                    <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <Folder size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No projects assigned yet.</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
