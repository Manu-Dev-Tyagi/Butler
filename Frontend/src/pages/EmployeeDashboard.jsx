import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TicketTable } from '../components/ticket/TicketTable';
import { ProjectTable } from '../components/dashboard/ProjectTable';
import { KPICards } from '../components/dashboard/KPICards';
import { SprintAnalytics } from '../components/dashboard/SprintAnalytics';
import { Card } from '../components/ui/Card';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
    const [loading, setLoading] = useState(true);
    const [myTickets, setMyTickets] = useState([]);
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({});
    const [alerts, setAlerts] = useState([]);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketsData, alertsData, projectsData, statsData] = await Promise.all([
                api.tickets.list({ assigned_to: 'me' }),
                api.alerts.list(),
                api.projects.list(),
                api.analytics.overview()
            ]);

            // Process tickets - check for alerts
            const processedTickets = await Promise.all(
                ticketsData.map(async (ticket) => {
                    try {
                        const ticketAlerts = await api.tickets.alerts(ticket.id);
                        return { ...ticket, slaRisk: ticketAlerts.length > 0 };
                    } catch {
                        return ticket;
                    }
                })
            );

            setMyTickets(processedTickets);
            setAlerts(alertsData);
            setProjects(projectsData);
            setStats(statsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAccept = async (id) => {
        try {
            await api.tickets.accept(id);
            fetchData(); // Refresh list
        } catch (err) {
            console.error("Failed to accept ticket", err);
        }
    };


    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>My Dashboard</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Welcome back! You have {myTickets.length} active tickets.</p>
                </div>
            </div>

            <KPICards stats={stats} loading={loading} />

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                <div>
                    <TicketTable
                        tickets={myTickets}
                        title="My Assigned Tickets"
                        emptyMessage="You have no tickets assigned."
                        onAccept={handleAccept}
                        loading={loading}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-danger)' }}>
                            <AlertTriangle size={20} />
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Alerts</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {alerts.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>No active alerts.</p>
                            ) : (
                                alerts.map(alert => (
                                    <div key={alert.id} style={{ padding: '0.75rem', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', borderLeft: `3px solid var(--color-${alert.type})` }}>
                                        <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>{alert.title}</span>
                                        {alert.message}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Projects & Analytics Section - Same as Admin */}
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>All Projects & Analytics</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <ProjectTable projects={projects} loading={loading} />
                    </div>
                    <div>
                        <SprintAnalytics />
                    </div>
                </div>
            </div>

        </div>
    );
}
