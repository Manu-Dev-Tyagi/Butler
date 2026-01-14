import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { TicketTable } from '../ticket/TicketTable';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProjectTickets({ projectId }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const data = await api.tickets.list({ project_id: projectId });
                setTickets(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (projectId) fetchTickets();
    }, [projectId]);

    if (loading) return <div>Loading tickets...</div>;

    return (
        <div className="animate-slideUp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Project Tickets</h3>
                <Button onClick={() => navigate(`/tickets/create?project_id=${projectId}`)}>
                    <Plus size={16} /> Create Ticket
                </Button>
            </div>
            <TicketTable tickets={tickets} title="" emptyMessage="No tickets found for this project." />
        </div>
    );
}
