import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TicketTable } from '../components/ticket/TicketTable';
import { ProjectTable } from '../components/dashboard/ProjectTable';
import { KPICards } from '../components/dashboard/KPICards';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PMDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [projects, setProjects] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedSprint, setSelectedSprint] = useState('');

    const [pendingAssignment, setPendingAssignment] = useState([]);
    const [pendingApproval, setPendingApproval] = useState([]);
    const navigate = useNavigate();

    // Initial Load: Projects & Sprints & Stats
    useEffect(() => {
        const loadMeta = async () => {
            try {
                const [projectsData, sprintsData, statsData] = await Promise.all([
                    api.projects.list(),
                    api.meta.sprints.list(),
                    api.analytics.overview()
                ]);
                setProjects(projectsData);
                setSprints(sprintsData);
                setStats(statsData);
            } catch (err) {
                console.error(err);
            }
        };
        loadMeta();
    }, []);

    // Refresh projects when navigating back to dashboard
    useEffect(() => {
        const handleFocus = () => {
            const loadMeta = async () => {
                try {
                    const projectsData = await api.projects.list();
                    setProjects(projectsData);
                } catch (err) {
                    console.error(err);
                }
            };
            loadMeta();
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // Fetch Tickets on Filter Change
    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            try {
                const filters = {};
                if (selectedProject) filters.project_id = selectedProject;
                if (selectedSprint) filters.sprint_id = selectedSprint;

                const [pendingAssignData, pendingApproveData] = await Promise.all([
                    api.tickets.list({ status: 'CREATED', ...filters }),
                    api.tickets.list({ status: 'SUBMITTED', ...filters })
                ]);
                setPendingAssignment(pendingAssignData);
                setPendingApproval(pendingApproveData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [selectedProject, selectedSprint]);

    return (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Operations Command</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Manage assignments and approvals across your projects.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">All Projects</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedSprint}
                        onChange={(e) => setSelectedSprint(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">All Sprints</option>
                        {sprints.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <Button onClick={() => navigate('/tickets/create')}>
                        <Plus size={18} /> New Ticket
                    </Button>
                </div>
            </div>

            <KPICards stats={stats} loading={loading} />

            <div style={{ display: 'grid', gap: '2rem' }}>
                <TicketTable
                    tickets={pendingAssignment}
                    title="Pending Assignment"
                    emptyMessage="No tickets waiting for assignment."
                    loading={loading}
                />
                <TicketTable
                    tickets={pendingApproval}
                    title="Pending Approval"
                    emptyMessage="No tickets waiting for approval."
                    loading={loading}
                />

                {/* Project List is global, maybe filter it visually or keep it as reference */}
                <ProjectTable projects={projects} />
            </div>
        </div>
    );
}
