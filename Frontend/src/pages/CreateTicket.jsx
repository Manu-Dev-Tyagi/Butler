import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../services/api';

export default function CreateTicket() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get('project_id');

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        department_id: '',
        sub_department_id: '',
        sprint_id: '',
        delivery_datetime: '',
        delivery_slot: 'Morning',
        creative_count: 1,
        project_id: projectId || ''
    });

    const [departments, setDepartments] = useState([]);
    const [subDepartments, setSubDepartments] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [depts, sprintList, projectsList] = await Promise.all([
                    api.meta.departments(),
                    api.meta.sprints.list(),
                    api.projects.list()
                ]);
                setDepartments(depts);
                setSprints(sprintList);
                setProjects(projectsList);
            } catch (err) {
                console.error('Failed to fetch metadata', err);
            }
        };
        fetchMeta();
    }, []);

    useEffect(() => {
        if (formData.department_id) {
            api.meta.subDepartments(formData.department_id).then(setSubDepartments);
        } else {
            setSubDepartments([]);
        }
    }, [formData.department_id]);

    const isWeekend = (dateString) => {
        const d = new Date(dateString);
        const day = d.getDay();
        return day === 0 || day === 6;
    };

    const calculateDeliveryDate = () => {
        // Logic to ensure "next 7 working days only" is mocked by date picker min/max/validation
        // For now we trust user input but validate weekend
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.project_id) {
            alert('Please select a project');
            setLoading(false);
            return;
        }

        if (!formData.title.trim()) {
            alert('Please enter a ticket title');
            setLoading(false);
            return;
        }

        if (formData.description.length < 15) {
            alert('Description must be at least 15 characters');
            setLoading(false);
            return;
        }

        if (!formData.department_id) {
            alert('Please select a department');
            setLoading(false);
            return;
        }

        if (formData.delivery_datetime && isWeekend(formData.delivery_datetime)) {
            alert('Delivery date cannot be a weekend');
            setLoading(false);
            return;
        }

        try {
            const ticket = await api.tickets.create(formData);
            if (formData.project_id) {
                navigate(`/projects/${formData.project_id}`);
            } else {
                navigate('/dashboard/pm');
            }
        } catch (err) {
            console.error('Failed to create ticket', err);
            alert('Failed to create ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer'
                }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Create New Ticket</h1>

            <form onSubmit={handleSubmit}>
                <Card style={{ padding: '2rem' }}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label">Project *</label>
                            <select
                                className="input-field"
                                value={formData.project_id}
                                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                required
                            >
                                <option value="">Select a Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Ticket Title *"
                            placeholder="Brief summary of task"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />

                        <div className="input-group">
                            <label className="input-label">Description (min 15 chars)</label>
                            <textarea
                                className="input-field"
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="input-label">Department</label>
                                <select
                                    className="input-field"
                                    value={formData.department_id}
                                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Sub-Department</label>
                                <select
                                    className="input-field"
                                    value={formData.sub_department_id}
                                    onChange={(e) => setFormData({ ...formData, sub_department_id: e.target.value })}
                                    disabled={!formData.department_id}
                                >
                                    <option value="">Select Sub-Department</option>
                                    {subDepartments.map(sd => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="input-label">Sprint</label>
                                <select
                                    className="input-field"
                                    value={formData.sprint_id}
                                    onChange={(e) => setFormData({ ...formData, sprint_id: e.target.value })}
                                >
                                    <option value="">Select Sprint</option>
                                    {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Priority</label>
                                <select
                                    className="input-field"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <Input
                                label="Delivery Date"
                                type="date"
                                value={formData.delivery_datetime}
                                onChange={(e) => setFormData({ ...formData, delivery_datetime: e.target.value })}
                            />
                            <div className="input-group">
                                <label className="input-label">Delivery Slot</label>
                                <select
                                    className="input-field"
                                    value={formData.delivery_slot}
                                    onChange={(e) => setFormData({ ...formData, delivery_slot: e.target.value })}
                                >
                                    <option value="Morning">Morning</option>
                                    <option value="Afternoon">Afternoon</option>
                                    <option value="EOD">End of Day</option>
                                </select>
                            </div>
                        </div>

                        <Input
                            label="Creative Count"
                            type="number"
                            min="1"
                            value={formData.creative_count}
                            onChange={(e) => setFormData({ ...formData, creative_count: e.target.value })}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Button type="submit" isLoading={loading}>
                                <Save size={18} /> Create Ticket
                            </Button>
                        </div>
                    </div>
                </Card>
            </form>
        </div>
    );
}
