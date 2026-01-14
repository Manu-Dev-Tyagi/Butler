import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { ProjectOverview } from '../components/project/ProjectOverview';
import ProjectCommandCenter from '../components/project/ProjectCommandCenter';
import { ProjectMembers } from '../components/project/ProjectMembers';
import { ProjectTickets } from '../components/project/ProjectTickets';
import { ProjectResponseSheets } from '../components/project/ProjectResponseSheets';
import { ArrowLeft, Plus, Ticket, Users, FileText, BarChart3 } from 'lucide-react';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await api.projects.get(id);
                setProject(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    if (loading) return <div className="page-container" style={{ paddingTop: '4rem' }}><Skeleton style={{ height: '300px' }} /></div>;
    if (!project) return <div className="page-container">Project not found</div>;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'tickets', label: 'Tickets', icon: Ticket },
        { id: 'response-sheets', label: 'Response Sheets', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ];

    return (
        <div className="animate-fadeIn">
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer'
                }}
            >
                <ArrowLeft size={18} /> Back to Projects
            </button>

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{project.name}</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                        Client: <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>{project.client_name}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={() => navigate(`/tickets/create?project_id=${project.id}`)}>
                        <Plus size={18} />
                        Create Ticket
                    </Button>
                </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', display: 'flex', gap: '2rem' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'none', border: 'none', padding: '1rem 0',
                                fontSize: '1rem', fontWeight: 500, cursor: 'pointer',
                                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {Icon && <Icon size={18} />}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Quick Actions Bar - Always Visible */}
            <div style={{
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Quick Actions</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Create tickets, manage members, and generate response sheets
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                            setActiveTab('tickets');
                            setTimeout(() => {
                                navigate(`/tickets/create?project_id=${project.id}`);
                            }, 100);
                        }}
                    >
                        <Ticket size={16} />
                        Create Ticket
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab('members')}
                    >
                        <Users size={16} />
                        Manage Members
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab('response-sheets')}
                    >
                        <FileText size={16} />
                        Response Sheets
                    </Button>
                </div>
            </div>

            <div>
                {activeTab === 'overview' && <ProjectCommandCenter project={project} />}
                {activeTab === 'members' && (
                    <ProjectMembers
                        project={project}
                        onUpdate={async () => {
                            const updated = await api.projects.get(id);
                            setProject(updated);
                        }}
                    />
                )}
                {activeTab === 'tickets' && <ProjectTickets projectId={project.id} />}
                {activeTab === 'response-sheets' && <ProjectResponseSheets projectId={project.id} />}
                {activeTab === 'analytics' && (
                    <Card style={{ padding: '2rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>Analytics view coming soon...</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
